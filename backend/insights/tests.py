from accounts.models import User
from checkins.models import CheckIn, FinalReflection
from django.test import TestCase
from experiments.models import (
    Category,
    Experiment,
    ExperimentTrait,
    ExperimentTraitWeight,
    UserExperiment,
)
from insights.models import TraitEvidence, UserHypothesis
from insights.services.hypotheses import recalculate_user_hypotheses
from insights.services.recommendations import get_contrast_recommendation
from insights.services.scoring import (
    calculate_before_after_delta,
    calculate_daily_fit,
    calculate_evidence_confidence,
    calculate_overall_fit,
    scale_to_100,
)
from insights.services.trait_evidence import generate_trait_evidence
from rest_framework.test import APIClient


class ScoringServiceTests(TestCase):
    def test_scale_to_100(self):
        self.assertEqual(scale_to_100(1), 0.0)
        self.assertEqual(scale_to_100(3), 50.0)
        self.assertEqual(scale_to_100(5), 100.0)
        self.assertEqual(scale_to_100(None), 50.0)

    def test_before_after_delta_interpretation(self):
        delta_high = calculate_before_after_delta(2, 5)
        self.assertEqual(delta_high["delta"], 3)
        self.assertIn("difficult", delta_high["interpretation"])

        delta_same = calculate_before_after_delta(3, 3)
        self.assertEqual(delta_same["delta"], 0)
        self.assertIn("similar", delta_same["interpretation"])

        delta_lower = calculate_before_after_delta(4, 2)
        self.assertEqual(delta_lower["delta"], -2)
        self.assertIn("excited before", delta_lower["interpretation"])

    def test_confidence_score_range(self):
        user = User.objects.create_user("conf@example.com", "pass")
        cat = Category.objects.create(name="Cat", slug="cat")
        exp = Experiment.objects.create(
            category=cat,
            title="Exp",
            slug="exp",
            description="Desc",
            duration_days=7,
            minutes_per_day=20,
            published=True,
        )
        ue = UserExperiment.objects.create(
            user=user, experiment=exp, start_date="2026-08-01", status="active"
        )

        score1, label1 = calculate_evidence_confidence(ue)
        self.assertEqual(score1, 0.0)
        self.assertEqual(label1, "Very limited")

        for d in range(1, 8):
            CheckIn.objects.create(
                user_experiment=ue,
                day=d,
                energy_after=4,
                curiosity=4,
                meaning=4,
                is_complete=True,
            )

        score2, label2 = calculate_evidence_confidence(ue)
        self.assertEqual(score2, 60.0)
        self.assertEqual(label2, "Moderate")

        ue.status = "completed"
        ue.save()
        FinalReflection.objects.create(
            user_experiment=ue, repeat_intent=5, summary="Great"
        )

        score3, label3 = calculate_evidence_confidence(ue)
        self.assertEqual(score3, 100.0)
        self.assertEqual(label3, "Very strong")


class TraitEvidenceAndHypothesisTests(TestCase):
    def setUp(self):
        self.user_a = User.objects.create_user("usera@example.com", "pass")
        self.user_b = User.objects.create_user("userb@example.com", "pass")
        self.cat = Category.objects.create(name="Creative", slug="creative")

        self.trait_creative = ExperimentTrait.objects.create(
            slug="creative",
            name="Creative",
            positive_hypothesis_text="Creative activities suit you.",
        )
        self.trait_tangible = ExperimentTrait.objects.create(
            slug="tangible_output",
            name="Tangible Output",
            positive_hypothesis_text="You like tangible output.",
        )

        self.exp1 = Experiment.objects.create(
            category=self.cat,
            title="Exp 1",
            slug="exp-1",
            description="D",
            duration_days=3,
            minutes_per_day=20,
            published=True,
        )
        ExperimentTraitWeight.objects.create(
            experiment=self.exp1, trait=self.trait_creative, weight=5
        )
        ExperimentTraitWeight.objects.create(
            experiment=self.exp1, trait=self.trait_tangible, weight=4
        )

        self.exp2 = Experiment.objects.create(
            category=self.cat,
            title="Exp 2",
            slug="exp-2",
            description="D",
            duration_days=3,
            minutes_per_day=20,
            published=True,
        )
        ExperimentTraitWeight.objects.create(
            experiment=self.exp2, trait=self.trait_creative, weight=5
        )

    def test_trait_evidence_generation_is_idempotent(self):
        ue = UserExperiment.objects.create(
            user=self.user_a,
            experiment=self.exp1,
            start_date="2026-08-01",
            status="completed",
        )
        for d in range(1, 4):
            CheckIn.objects.create(
                user_experiment=ue,
                day=d,
                enjoyment=5,
                energy_after=5,
                curiosity=5,
                meaning=5,
                is_complete=True,
            )
        FinalReflection.objects.create(
            user_experiment=ue, repeat_intent=5, summary="Loved it"
        )

        records1 = generate_trait_evidence(ue)
        self.assertEqual(len(records1), 2)

        # Re-run must not create duplicates
        records2 = generate_trait_evidence(ue)
        self.assertEqual(len(records2), 2)
        self.assertEqual(TraitEvidence.objects.filter(user_experiment=ue).count(), 2)

    def test_hypothesis_status_progression(self):
        # 1 experiment -> uncertain
        ue1 = UserExperiment.objects.create(
            user=self.user_a,
            experiment=self.exp1,
            start_date="2026-08-01",
            status="completed",
        )
        for d in range(1, 4):
            CheckIn.objects.create(
                user_experiment=ue1,
                day=d,
                enjoyment=5,
                energy_after=5,
                curiosity=5,
                meaning=5,
                is_complete=True,
            )
        FinalReflection.objects.create(
            user_experiment=ue1, repeat_intent=5, summary="S1"
        )
        generate_trait_evidence(ue1)

        hyps1 = recalculate_user_hypotheses(self.user_a)
        hyp_creative = UserHypothesis.objects.get(
            user=self.user_a, trait=self.trait_creative
        )
        self.assertEqual(hyp_creative.status, UserHypothesis.Status.UNCERTAIN)

        # 2 experiments with high fit -> emerging
        ue2 = UserExperiment.objects.create(
            user=self.user_a,
            experiment=self.exp2,
            start_date="2026-08-05",
            status="completed",
        )
        for d in range(1, 4):
            CheckIn.objects.create(
                user_experiment=ue2,
                day=d,
                enjoyment=5,
                energy_after=5,
                curiosity=5,
                meaning=5,
                is_complete=True,
            )
        FinalReflection.objects.create(
            user_experiment=ue2, repeat_intent=5, summary="S2"
        )
        generate_trait_evidence(ue2)

        hyps2 = recalculate_user_hypotheses(self.user_a)
        hyp_creative.refresh_from_db()
        self.assertEqual(hyp_creative.status, UserHypothesis.Status.EMERGING)


class PermissionAndEndpointTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user_a = User.objects.create_user("user_a@example.com", "password123")
        self.user_b = User.objects.create_user("user_b@example.com", "password123")

        self.cat = Category.objects.create(name="Cat", slug="cat")
        self.exp = Experiment.objects.create(
            category=self.cat,
            title="Exp",
            slug="exp",
            description="Desc",
            duration_days=3,
            minutes_per_day=20,
            published=True,
        )
        self.ue_a = UserExperiment.objects.create(
            user=self.user_a,
            experiment=self.exp,
            start_date="2026-08-01",
            status="completed",
        )
        self.ue_b = UserExperiment.objects.create(
            user=self.user_b,
            experiment=self.exp,
            start_date="2026-08-01",
            status="completed",
        )

        self.trait = ExperimentTrait.objects.create(slug="trait-a", name="Trait A")
        self.hyp_a = UserHypothesis.objects.create(
            user=self.user_a,
            trait=self.trait,
            support_score=80,
            confidence_score=75,
            status="supported",
            evidence_count=3,
        )
        self.hyp_b = UserHypothesis.objects.create(
            user=self.user_b,
            trait=self.trait,
            support_score=80,
            confidence_score=75,
            status="supported",
            evidence_count=3,
        )

    def test_user_a_cannot_view_user_b_hypothesis(self):
        self.client.force_authenticate(self.user_a)
        res = self.client.get(f"/api/v1/insights/hypotheses/{self.hyp_b.id}/")
        self.assertEqual(res.status_code, 404)

    def test_user_a_cannot_view_user_b_report(self):
        self.client.force_authenticate(self.user_a)
        res = self.client.get(f"/api/v1/user-experiments/{self.ue_b.id}/report/")
        self.assertEqual(res.status_code, 404)

    def test_user_a_can_view_own_hypotheses(self):
        self.client.force_authenticate(self.user_a)
        res = self.client.get("/api/v1/insights/hypotheses/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]["id"], self.hyp_a.id)

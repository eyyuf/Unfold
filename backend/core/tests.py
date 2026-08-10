from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from unittest.mock import patch
from datetime import timedelta
from accounts.models import User
from checkins.models import CheckIn
from experiments.models import Category, Experiment


class ApiFlowTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        category = Category.objects.create(name="Creative", slug="creative", color="#8B5CF6")
        self.experiment = Experiment.objects.create(
            category=category, title="Photography Walk", slug="photography-walk",
            description="Notice the world through a camera.", duration_days=7,
            minutes_per_day=20, published=True,
        )

    def test_public_experiment_library(self):
        health = self.client.get("/api/v1/health/")
        self.assertEqual(health.status_code, 200)
        self.assertEqual(health.data["status"], "ok")
        response = self.client.get("/api/v1/experiments/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data[0]["slug"], "photography-walk")

    def test_user_endpoints_reject_anonymous_requests_without_server_errors(self):
        session_response = self.client.get("/api/v1/auth/me/")
        self.assertEqual(session_response.status_code, 200)
        self.assertIsNone(session_response.json())
        for path in (
            "/api/v1/user-experiments/active/",
            "/api/v1/evidence-vault/",
            "/api/v1/insights/",
            "/api/v1/profile/activity/",
        ):
            with self.subTest(path=path):
                response = self.client.get(path)
                self.assertIn(response.status_code, (401, 403))

    def test_authenticated_user_without_active_experiment_receives_json_null(self):
        user = User.objects.create_user("empty@example.com", "a-secure-password")
        self.client.force_authenticate(user)
        response = self.client.get("/api/v1/user-experiments/active/")
        self.assertEqual(response.status_code, 200)
        self.assertIsNone(response.json())
        self.assertEqual(response.headers["Content-Type"], "application/json")

    def test_authenticated_user_can_start_experiment_and_check_in(self):
        user = User.objects.create_user("person@example.com", "a-secure-password")
        self.client.force_authenticate(user)
        started = self.client.post("/api/v1/experiments/photography-walk/start/", {}, format="json")
        self.assertEqual(started.status_code, 201)
        checkin = self.client.post(
            f"/api/v1/user-experiments/{started.data['id']}/checkins/",
            {"day": 1, "energy": 4, "curiosity": 5, "meaning": 3, "difficulty": 2},
            format="json",
        )
        self.assertEqual(checkin.status_code, 200)
        self.assertEqual(checkin.data["curiosity"], 5)
        active = self.client.get("/api/v1/user-experiments/active/")
        self.assertEqual(active.data["checkin_count"], 1)
        self.assertEqual(active.data["current_day"], 2)
        self.assertEqual(active.data["recent_checkins"][0]["curiosity"], 5)

    def test_profile_activity_returns_checkin_streaks(self):
        user = User.objects.create_user("streak@example.com", "a-secure-password", timezone="UTC")
        self.client.force_authenticate(user)
        started = self.client.post("/api/v1/experiments/photography-walk/start/", {}, format="json")
        for day in (1, 2):
            self.client.post(
                f"/api/v1/user-experiments/{started.data['id']}/checkins/",
                {"day": day, "energy": 4, "curiosity": 4, "meaning": 4, "difficulty": 2},
                format="json",
            )
        now = timezone.now()
        CheckIn.objects.filter(user_experiment_id=started.data["id"], day=1).update(created_at=now - timedelta(days=1))
        CheckIn.objects.filter(user_experiment_id=started.data["id"], day=2).update(created_at=now)

        response = self.client.get("/api/v1/profile/activity/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["total_checkins"], 2)
        self.assertEqual(response.data["active_days"], 2)
        self.assertEqual(response.data["current_streak"], 2)
        self.assertEqual(response.data["longest_streak"], 2)
        self.assertEqual(len(response.data["days"]), 2)

    def test_registration_creates_session_and_csrf_cookie(self):
        self.client.get("/api/v1/auth/csrf/")
        response = self.client.post(
            "/api/v1/auth/register/",
            {
                "email": "new@example.com",
                "password": "a-secure-password",
                "confirm_password": "a-secure-password",
                "accept_terms": True,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertTrue(User.objects.filter(email="new@example.com").exists())
        self.assertIn("_auth_user_id", self.client.session)
        self.assertIsNotNone(User.objects.get(email="new@example.com").terms_accepted_at)

    def test_completion_report_insights_and_profile_update(self):
        user = User.objects.create_user("report@example.com", "a-secure-password")
        self.client.force_authenticate(user)
        started = self.client.post("/api/v1/experiments/photography-walk/start/", {}, format="json")
        item_id = started.data["id"]
        self.client.post(
            f"/api/v1/user-experiments/{item_id}/checkins/",
            {"day": 1, "energy": 4, "curiosity": 5, "meaning": 4, "difficulty": 2},
            format="json",
        )
        completed = self.client.post(
            f"/api/v1/user-experiments/{item_id}/final-reflection/",
            {"repeat_intent": 5, "summary": "I stayed curious and wanted to continue."},
            format="json",
        )
        self.assertEqual(completed.status_code, 200)
        report = self.client.get(f"/api/v1/user-experiments/{item_id}/report/")
        self.assertGreater(report.data["fit_signal"], 0)
        self.assertEqual(report.data["strongest_signal"], "Curiosity")
        insights = self.client.get("/api/v1/insights/")
        self.assertEqual(insights.data["completed_count"], 1)
        self.assertEqual(insights.data["average_curiosity"], 5.0)
        self.assertEqual(insights.data["average_repeat_intent"], 100)
        self.assertEqual(insights.data["evidence_map"][0]["label"], "Photography Walk")
        profile = self.client.patch("/api/v1/auth/me/", {"display_name": "Ari", "reminders_enabled": True}, format="json")
        self.assertEqual(profile.data["display_name"], "Ari")
        self.assertTrue(profile.data["reminders_enabled"])

    def test_user_can_save_and_remove_an_experiment(self):
        user = User.objects.create_user("saved@example.com", "a-secure-password")
        self.client.force_authenticate(user)

        saved = self.client.post("/api/v1/experiments/photography-walk/save/", {}, format="json")
        self.assertEqual(saved.status_code, 201)
        library = self.client.get("/api/v1/saved-experiments/")
        self.assertEqual(len(library.data), 1)
        self.assertEqual(library.data[0]["experiment"]["slug"], "photography-walk")

        removed = self.client.delete("/api/v1/experiments/photography-walk/save/")
        self.assertEqual(removed.status_code, 204)
        self.assertEqual(self.client.get("/api/v1/saved-experiments/").data, [])

    def test_commitment_preferences_and_abandonment_are_saved(self):
        user = User.objects.create_user("plan@example.com", "a-secure-password")
        self.client.force_authenticate(user)
        started = self.client.post(
            "/api/v1/experiments/photography-walk/start/",
            {
                "start_date": "2026-08-01",
                "reason": "I want to notice more.",
                "reminders_enabled": True,
                "reminder_time": "18:45",
            },
            format="json",
        )
        self.assertEqual(started.status_code, 201)
        self.assertEqual(started.data["reason"], "I want to notice more.")
        user.refresh_from_db()
        self.assertTrue(user.reminders_enabled)
        self.assertEqual(user.reminder_time.strftime("%H:%M"), "18:45")

        abandoned = self.client.post(f"/api/v1/user-experiments/{started.data['id']}/abandon/")
        self.assertEqual(abandoned.status_code, 200)
        self.assertEqual(abandoned.data["status"], "abandoned")
        self.assertIsNone(self.client.get("/api/v1/user-experiments/active/").json())

    def test_report_endpoint_returns_the_requested_experiment(self):
        user = User.objects.create_user("reports@example.com", "a-secure-password")
        self.client.force_authenticate(user)
        first = self.client.post("/api/v1/experiments/photography-walk/start/", {}, format="json")
        self.client.post(
            f"/api/v1/user-experiments/{first.data['id']}/final-reflection/",
            {"repeat_intent": 4, "summary": "First report"},
            format="json",
        )
        requested = self.client.get(f"/api/v1/user-experiments/{first.data['id']}/report/")
        self.assertEqual(requested.status_code, 200)
        self.assertEqual(requested.data["id"], first.data["id"])
        self.assertEqual(requested.data["summary"], "First report")

    def test_onboarding_answers_are_persisted(self):
        user = User.objects.create_user("onboarding@example.com", "a-secure-password")
        self.client.force_authenticate(user)
        response = self.client.patch(
            "/api/v1/auth/me/",
            {"onboarding_answers": {"reason": "Explore", "available_time": "20 minutes", "interests": ["Creative"]}},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["onboarding_answers"]["interests"], ["Creative"])

    def test_password_reset_token_changes_password(self):
        user = User.objects.create_user("reset@example.com", "a-secure-password")
        requested = self.client.post("/api/v1/auth/password-reset/", {"email": user.email}, format="json")
        self.assertEqual(requested.status_code, 200)
        self.assertIn("reset_url", requested.data)
        from urllib.parse import parse_qs, urlparse
        params = parse_qs(urlparse(requested.data["reset_url"]).query)
        confirmed = self.client.post(
            "/api/v1/auth/password-reset/confirm/",
            {
                "uid": params["uid"][0],
                "token": params["token"][0],
                "password": "a-new-secure-password",
                "confirm_password": "a-new-secure-password",
            },
            format="json",
        )
        self.assertEqual(confirmed.status_code, 200)
        user.refresh_from_db()
        self.assertTrue(user.check_password("a-new-secure-password"))

    @patch.dict("os.environ", {"RESEND_API_KEY": "test-key", "DEFAULT_FROM_EMAIL": "Unfold <verified@example.com>"})
    @patch("core.views.logger.exception")
    @patch("core.views.resend.Emails.send", side_effect=RuntimeError("provider rejected sender"))
    def test_password_reset_email_failure_does_not_return_500(self, _send, _log):
        user = User.objects.create_user("delivery@example.com", "a-secure-password")
        response = self.client.post("/api/v1/auth/password-reset/", {"email": user.email}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertIn("If an account exists", response.data["detail"])

    def test_privacy_controls_export_consent_and_delete_account(self):
        user = User.objects.create_user("privacy@example.com", "a-secure-password")
        self.client.force_authenticate(user)
        consent = self.client.patch("/api/v1/auth/me/", {"analytics_consent": True}, format="json")
        self.assertEqual(consent.status_code, 200)
        self.assertTrue(consent.data["analytics_consent"])

        history = self.client.get("/api/v1/auth/consents/")
        self.assertEqual(history.status_code, 200)
        self.assertEqual(history.data[0]["kind"], "Optional analytics")
        self.assertTrue(history.data[0]["granted"])

        exported = self.client.get("/api/v1/auth/export/")
        self.assertEqual(exported.status_code, 200)
        self.assertEqual(exported.data["profile"]["email"], user.email)
        self.assertIn("experiments", exported.data)

        rejected = self.client.post("/api/v1/auth/delete-account/", {"confirmation": "delete"}, format="json")
        self.assertEqual(rejected.status_code, 400)
        deleted = self.client.post("/api/v1/auth/delete-account/", {"confirmation": "DELETE"}, format="json")
        self.assertEqual(deleted.status_code, 204)
        self.assertFalse(User.objects.filter(pk=user.pk).exists())

# Create your tests here.

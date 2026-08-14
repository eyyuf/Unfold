import os
from datetime import datetime, time, timedelta

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from accounts.models import ConsentRecord, User
from checkins.models import CheckIn, FinalReflection
from experiments.models import Experiment, SavedExperiment, UserExperiment
from insights.models import UserHypothesis
from insights.services.hypotheses import recalculate_user_hypotheses
from insights.services.recommendations import get_contrast_recommendation
from insights.services.trait_evidence import generate_trait_evidence


class Command(BaseCommand):
    help = "Creates or resets a safe, story-rich Builders' Lab demo account."

    def add_arguments(self, parser):
        parser.add_argument("--email", default=os.environ.get("UNFOLD_DEMO_EMAIL", "demo@unfold.local"))

    @transaction.atomic
    def handle(self, *args, **options):
        email = options["email"].strip().lower()
        password = os.environ.get("UNFOLD_DEMO_PASSWORD")
        if not password:
            raise CommandError("Set UNFOLD_DEMO_PASSWORD before running seed_demo. No default demo password is stored in the repository.")
        if len(password) < 8:
            raise CommandError("UNFOLD_DEMO_PASSWORD must contain at least 8 characters.")

        required_slugs = [
            "photography-walk",
            "write-one-page",
            "code-a-small-project",
            "teach-someone",
            "morning-nature-walk",
        ]
        experiments = {item.slug: item for item in Experiment.objects.filter(slug__in=required_slugs, published=True)}
        missing = sorted(set(required_slugs) - set(experiments))
        if missing:
            raise CommandError(
                "Missing starter experiments: " + ", ".join(missing) + ". Run `python manage.py loaddata experiments` first."
            )
        if any(not experiments[slug].trait_weights.exists() for slug in required_slugs):
            raise CommandError("Starter trait weights are missing. Run `python manage.py seed_hypothesis_engine` first.")

        user, _created = User.objects.get_or_create(email=email)
        user.display_name = "Alex Demo"
        user.timezone = "Africa/Nairobi"
        user.reminder_time = time(19, 30)
        user.reminders_enabled = True
        user.email_reminders_enabled = False
        user.onboarding_answers = {
            "reason": "I want clearer evidence about the work and environments that fit me.",
            "available_time": "30 minutes",
            "interests": ["Creative", "Technical", "Service", "Nature"],
        }
        user.terms_accepted_at = timezone.now()
        user.is_staff = False
        user.is_superuser = False
        user.set_password(password)
        user.save()

        UserExperiment.objects.filter(user=user).delete()
        SavedExperiment.objects.filter(user=user).delete()
        UserHypothesis.objects.filter(user=user).delete()
        ConsentRecord.objects.filter(user=user).delete()
        ConsentRecord.objects.create(user=user, kind=ConsentRecord.Kind.TERMS, granted=True)

        today = timezone.localdate()
        completed_specs = [
            ("photography-walk", 35, "I became more observant and wanted to keep making visible work."),
            ("write-one-page", 23, "Writing alone gave me energy once I stopped judging the output."),
            ("code-a-small-project", 7, "Building a concrete tool held my attention and made progress feel tangible."),
        ]
        for offset, (slug, days_ago, summary) in enumerate(completed_specs):
            experiment = experiments[slug]
            run = UserExperiment.objects.create(
                user=user,
                experiment=experiment,
                status=UserExperiment.Status.COMPLETED,
                start_date=today - timedelta(days=days_ago),
                reason="Test whether focused, independent creation produces repeatable positive signals.",
            )
            for day in range(1, experiment.duration_days + 1):
                value = 4 if day % 4 == 0 else 5
                checkin = CheckIn.objects.create(
                    user_experiment=run,
                    day=day,
                    motivation_before=3 + (day % 2),
                    enjoyment=value,
                    energy_after=value,
                    curiosity=5,
                    meaning=4,
                    desire_to_continue=value,
                    desire_to_improve=5,
                    lost_track_of_time=4,
                    difficulty=2 + (day % 2),
                    satisfaction_after=value,
                    minutes_spent=experiment.minutes_per_day,
                    notes=f"Day {day}: I noticed steady curiosity and satisfaction from making progress.",
                    is_complete=True,
                )
                activity_date = run.start_date + timedelta(days=day - 1)
                activity_at = timezone.make_aware(datetime.combine(activity_date, time(18, 0)))
                CheckIn.objects.filter(pk=checkin.pk).update(created_at=activity_at)
            FinalReflection.objects.create(user_experiment=run, repeat_intent=5, summary=summary)
            generate_trait_evidence(run)

        active_experiment = experiments["teach-someone"]
        active = UserExperiment.objects.create(
            user=user,
            experiment=active_experiment,
            status=UserExperiment.Status.ACTIVE,
            start_date=today - timedelta(days=active_experiment.duration_days - 2),
            reason="Test whether sharing what I know feels as energizing as making things alone.",
        )
        for day in range(1, active_experiment.duration_days):
            checkin = CheckIn.objects.create(
                user_experiment=active,
                day=day,
                motivation_before=3,
                enjoyment=4,
                energy_after=4,
                curiosity=4,
                meaning=5,
                desire_to_continue=4,
                desire_to_improve=4,
                lost_track_of_time=3,
                difficulty=3,
                satisfaction_after=5,
                minutes_spent=active_experiment.minutes_per_day,
                notes=f"Day {day}: Explaining the idea felt meaningful and clarified my own thinking.",
                is_complete=True,
            )
            activity_date = active.start_date + timedelta(days=day - 1)
            activity_at = timezone.make_aware(datetime.combine(activity_date, time(19, 0)))
            CheckIn.objects.filter(pk=checkin.pk).update(created_at=activity_at)

        SavedExperiment.objects.create(user=user, experiment=experiments["morning-nature-walk"])
        hypotheses = recalculate_user_hypotheses(user)
        recommendation = None
        for hypothesis in hypotheses:
            if hypothesis.status not in ("supported", "emerging"):
                continue
            recommendation = get_contrast_recommendation(user, hypothesis)
            if recommendation:
                break

        self.stdout.write(self.style.SUCCESS(f"Demo account ready: {email}"))
        self.stdout.write(f"Completed experiments: {len(completed_specs)}")
        self.stdout.write(f"Active experiment: {active_experiment.title} (day {active_experiment.duration_days} is ready for a live check-in)")
        self.stdout.write(f"Hypotheses: {len(hypotheses)}")
        if recommendation:
            self.stdout.write(f"Next recommendation: {recommendation['recommended_experiment']['title']}")

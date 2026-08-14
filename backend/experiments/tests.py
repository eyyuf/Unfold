from datetime import timedelta
from unittest.mock import patch

from accounts.models import User
from checkins.models import CheckIn
from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase
from django.utils import timezone
from experiments.models import UserExperiment
from insights.models import UserHypothesis


class DemoSeedCommandTests(TestCase):
    def setUp(self):
        call_command("loaddata", "experiments", verbosity=0)
        call_command("seed_hypothesis_engine", verbosity=0)

    @patch.dict("os.environ", {}, clear=True)
    def test_seed_requires_environment_password(self):
        with self.assertRaisesMessage(CommandError, "UNFOLD_DEMO_PASSWORD"):
            call_command("seed_demo", verbosity=0)

    @patch.dict(
        "os.environ",
        {
            "UNFOLD_DEMO_PASSWORD": "demo-test-password",
            "UNFOLD_DEMO_EMAIL": "demo@example.com",
        },
    )
    def test_seed_is_repeatable_and_builds_complete_demo_story(self):
        call_command("seed_demo", verbosity=0)
        call_command("seed_demo", verbosity=0)

        user = User.objects.get(email="demo@example.com")
        self.assertTrue(user.check_password("demo-test-password"))
        self.assertFalse(user.is_staff)
        self.assertEqual(
            UserExperiment.objects.filter(user=user, status="completed").count(), 3
        )
        active = UserExperiment.objects.get(user=user, status="active")
        self.assertEqual(
            active.checkins.filter(is_complete=True).count(),
            active.experiment.duration_days - 1,
        )
        self.assertEqual(CheckIn.objects.filter(user_experiment__user=user).count(), 32)
        for run in UserExperiment.objects.filter(user=user).prefetch_related(
            "checkins"
        ):
            for checkin in run.checkins.all():
                self.assertEqual(
                    checkin.checkin_date,
                    run.start_date + timedelta(days=checkin.day - 1),
                )
        self.assertEqual(active.get_timing_status()["calendar_day"], 5)
        self.assertTrue(active.get_timing_status()["can_check_in_today"])
        self.assertEqual(
            active.start_date + timedelta(days=active.experiment.duration_days - 1),
            timezone.localdate(),
        )
        self.assertTrue(
            UserHypothesis.objects.filter(user=user, status="supported").exists()
        )

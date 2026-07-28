import datetime
import os
from zoneinfo import ZoneInfo

import resend
from django.core.management.base import BaseCommand
from django.utils import timezone

from experiments.models import UserExperiment
from notifications.models import ReminderDelivery


class Command(BaseCommand):
    help = "Send one due experiment reminder per user and local calendar day."

    def handle(self, *args, **options):
        api_key = os.environ.get("RESEND_API_KEY")
        if not api_key:
            self.stdout.write("RESEND_API_KEY is not configured; no reminders sent.")
            return
        resend.api_key = api_key
        now = timezone.now()
        active_items = UserExperiment.objects.filter(
            status="active", user__reminders_enabled=True, user__reminder_time__isnull=False,
        ).select_related("user", "experiment")
        sent = 0
        for item in active_items:
            local_now = now.astimezone(ZoneInfo(item.user.timezone))
            target = datetime.datetime.combine(local_now.date(), item.user.reminder_time, tzinfo=local_now.tzinfo)
            if not (target <= local_now < target + datetime.timedelta(hours=1)):
                continue
            if item.checkins.filter(created_at__date=local_now.date()).exists():
                continue
            delivery, created = ReminderDelivery.objects.get_or_create(
                user=item.user, user_experiment=item, delivery_date=local_now.date(),
            )
            if not created:
                continue
            try:
                resend.Emails.send({
                    "from": os.environ.get("DEFAULT_FROM_EMAIL", "Unfold <hello@example.com>"),
                    "to": item.user.email,
                    "subject": f"Your {item.experiment.title} experiment is ready",
                    "html": f"<p>Today’s experiment is ready when you are.</p><p><a href=\"{os.environ.get('SITE_URL', '')}/app\">Open Unfold</a></p>",
                })
                sent += 1
            except Exception:
                delivery.delete()
                raise
        self.stdout.write(self.style.SUCCESS(f"Sent {sent} reminder(s)."))

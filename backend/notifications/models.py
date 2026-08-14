from django.conf import settings
from django.db import models
from experiments.models import UserExperiment


class ReminderDelivery(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    user_experiment = models.ForeignKey(UserExperiment, on_delete=models.CASCADE)
    delivery_date = models.DateField()
    sent_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "user_experiment", "delivery_date"],
                name="unique_daily_reminder",
            )
        ]


# Create your models here.

from django.db import models
from experiments.models import UserExperiment

class CheckIn(models.Model):
    user_experiment = models.ForeignKey(UserExperiment, on_delete=models.CASCADE, related_name="checkins")
    day = models.PositiveSmallIntegerField()
    motivation_before = models.PositiveSmallIntegerField(null=True, blank=True)
    enjoyment = models.PositiveSmallIntegerField(null=True, blank=True)
    energy_after = models.PositiveSmallIntegerField(null=True, blank=True)
    curiosity = models.PositiveSmallIntegerField(null=True, blank=True)
    meaning = models.PositiveSmallIntegerField(null=True, blank=True)
    desire_to_continue = models.PositiveSmallIntegerField(null=True, blank=True)
    desire_to_improve = models.PositiveSmallIntegerField(null=True, blank=True)
    lost_track_of_time = models.PositiveSmallIntegerField(null=True, blank=True)
    difficulty = models.PositiveSmallIntegerField(null=True, blank=True)
    satisfaction_after = models.PositiveSmallIntegerField(null=True, blank=True)
    minutes_spent = models.PositiveSmallIntegerField(null=True, blank=True)
    notes = models.TextField(blank=True)
    is_complete = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def energy(self):
        return self.energy_after if self.energy_after is not None else 3

    class Meta:
        constraints = [models.UniqueConstraint(fields=["user_experiment", "day"], name="unique_daily_checkin")]

class FinalReflection(models.Model):
    user_experiment = models.OneToOneField(UserExperiment, on_delete=models.CASCADE, related_name="final_reflection")
    repeat_intent = models.PositiveSmallIntegerField()
    summary = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

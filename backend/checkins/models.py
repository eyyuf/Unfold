from django.db import models
from experiments.models import UserExperiment

class CheckIn(models.Model):
    user_experiment = models.ForeignKey(UserExperiment, on_delete=models.CASCADE, related_name="checkins")
    day = models.PositiveSmallIntegerField()
    energy = models.PositiveSmallIntegerField()
    curiosity = models.PositiveSmallIntegerField()
    meaning = models.PositiveSmallIntegerField()
    difficulty = models.PositiveSmallIntegerField()
    minutes_spent = models.PositiveSmallIntegerField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        constraints = [models.UniqueConstraint(fields=["user_experiment", "day"], name="unique_daily_checkin")]

class FinalReflection(models.Model):
    user_experiment = models.OneToOneField(UserExperiment, on_delete=models.CASCADE, related_name="final_reflection")
    repeat_intent = models.PositiveSmallIntegerField()
    summary = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

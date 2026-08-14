from datetime import timedelta

from django.conf import settings
from django.db import models
from django.utils import timezone


class Category(models.Model):
    name = models.CharField(max_length=60, unique=True)
    slug = models.SlugField(unique=True)
    color = models.CharField(max_length=7, default="#22C55E")

    def __str__(self):
        return self.name


class ExperimentTrait(models.Model):
    slug = models.SlugField(unique=True)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    positive_hypothesis_text = models.CharField(max_length=255, blank=True)
    negative_hypothesis_text = models.CharField(max_length=255, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class Experiment(models.Model):
    category = models.ForeignKey(
        Category, on_delete=models.PROTECT, related_name="experiments"
    )
    title = models.CharField(max_length=160)
    slug = models.SlugField(unique=True)
    description = models.TextField()
    duration_days = models.PositiveSmallIntegerField()
    minutes_per_day = models.PositiveSmallIntegerField()
    published = models.BooleanField(default=False)

    def __str__(self):
        return self.title


class ExperimentTraitWeight(models.Model):
    experiment = models.ForeignKey(
        Experiment,
        on_delete=models.CASCADE,
        related_name="trait_weights",
    )
    trait = models.ForeignKey(
        ExperimentTrait,
        on_delete=models.CASCADE,
        related_name="experiment_weights",
    )
    weight = models.PositiveSmallIntegerField()

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["experiment", "trait"],
                name="uq_experiment_trait",
            )
        ]

    def __str__(self):
        return f"{self.experiment.title} - {self.trait.name} ({self.weight})"


class DailyTask(models.Model):
    experiment = models.ForeignKey(
        Experiment, on_delete=models.CASCADE, related_name="daily_tasks"
    )
    day = models.PositiveSmallIntegerField()
    title = models.CharField(max_length=160)
    instructions = models.TextField()

    class Meta:
        ordering = ["day"]
        constraints = [
            models.UniqueConstraint(
                fields=["experiment", "day"], name="unique_experiment_day"
            )
        ]


class UserExperiment(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        COMPLETED = "completed", "Completed"
        ABANDONED = "abandoned", "Abandoned"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="experiments"
    )
    experiment = models.ForeignKey(Experiment, on_delete=models.PROTECT)
    status = models.CharField(
        max_length=12, choices=Status.choices, default=Status.ACTIVE
    )
    start_date = models.DateField()
    reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def get_timing_status(self, on_date=None):
        today = on_date or timezone.localdate()
        calendar_day = (today - self.start_date).days + 1
        duration = self.experiment.duration_days
        completed_checkins = [
            checkin for checkin in self.checkins.all() if checkin.is_complete
        ]
        completed_days = sorted({checkin.day for checkin in completed_checkins})
        today_complete = any(
            checkin.checkin_date == today for checkin in completed_checkins
        )
        can_check_in_today = 1 <= calendar_day <= duration and not today_complete
        can_complete = calendar_day > duration or (
            calendar_day == duration and today_complete
        )

        next_checkin_date = None
        if calendar_day < 1:
            next_checkin_date = self.start_date
        elif today_complete and calendar_day < duration:
            next_checkin_date = today + timedelta(days=1)

        return {
            "calendar_day": calendar_day,
            "completed_days": completed_days,
            "today_checkin_complete": today_complete,
            "can_check_in_today": can_check_in_today,
            "can_complete": can_complete,
            "next_checkin_date": next_checkin_date,
        }


class SavedExperiment(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="saved_experiments",
    )
    experiment = models.ForeignKey(
        Experiment, on_delete=models.CASCADE, related_name="saved_by"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "experiment"], name="unique_saved_experiment"
            ),
        ]

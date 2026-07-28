from django.conf import settings
from django.db import models

class Category(models.Model):
    name = models.CharField(max_length=60, unique=True)
    slug = models.SlugField(unique=True)
    color = models.CharField(max_length=7, default="#22C55E")
    def __str__(self): return self.name

class Experiment(models.Model):
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="experiments")
    title = models.CharField(max_length=160)
    slug = models.SlugField(unique=True)
    description = models.TextField()
    duration_days = models.PositiveSmallIntegerField()
    minutes_per_day = models.PositiveSmallIntegerField()
    published = models.BooleanField(default=False)
    def __str__(self): return self.title

class DailyTask(models.Model):
    experiment = models.ForeignKey(Experiment, on_delete=models.CASCADE, related_name="daily_tasks")
    day = models.PositiveSmallIntegerField()
    title = models.CharField(max_length=160)
    instructions = models.TextField()
    class Meta:
        ordering = ["day"]
        constraints = [models.UniqueConstraint(fields=["experiment", "day"], name="unique_experiment_day")]

class UserExperiment(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        COMPLETED = "completed", "Completed"
        ABANDONED = "abandoned", "Abandoned"
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="experiments")
    experiment = models.ForeignKey(Experiment, on_delete=models.PROTECT)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.ACTIVE)
    start_date = models.DateField()
    reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

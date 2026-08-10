from django.conf import settings
from django.db import models
from experiments.models import ExperimentTrait, UserExperiment


class TraitEvidence(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="trait_evidence",
    )

    user_experiment = models.ForeignKey(
        UserExperiment,
        on_delete=models.CASCADE,
        related_name="trait_evidence",
    )

    trait = models.ForeignKey(
        ExperimentTrait,
        on_delete=models.CASCADE,
        related_name="user_evidence",
    )

    fit_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
    )

    confidence_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
    )

    experiment_trait_weight = models.PositiveSmallIntegerField()

    evidence_weight = models.DecimalField(
        max_digits=6,
        decimal_places=4,
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user_experiment", "trait"],
                name="uq_trait_evidence_per_run",
            )
        ]

    def __str__(self):
        return f"{self.user.email} - {self.trait.name} ({self.fit_score}%)"


class UserHypothesis(models.Model):
    class Status(models.TextChoices):
        UNCERTAIN = "uncertain", "Uncertain"
        EMERGING = "emerging", "Emerging"
        SUPPORTED = "supported", "Supported"
        CONTRADICTED = "contradicted", "Contradicted"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="hypotheses",
    )

    trait = models.ForeignKey(
        ExperimentTrait,
        on_delete=models.CASCADE,
        related_name="user_hypotheses",
    )

    support_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
    )

    confidence_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
    )

    evidence_count = models.PositiveIntegerField(default=0)

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.UNCERTAIN,
    )

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "trait"],
                name="uq_user_trait_hypothesis",
            )
        ]

    def __str__(self):
        return f"{self.user.email} - {self.trait.name}: {self.get_status_display()}"


class PatternDefinition(models.Model):
    slug = models.SlugField(unique=True)
    title = models.CharField(max_length=160)
    description = models.TextField()
    traits = models.ManyToManyField(ExperimentTrait, related_name="pattern_definitions")

    min_experiments = models.PositiveSmallIntegerField(default=2)
    min_fit_score = models.PositiveSmallIntegerField(default=70)

    positive_text = models.TextField()

    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.title

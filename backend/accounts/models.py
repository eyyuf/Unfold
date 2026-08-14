from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class UserManager(BaseUserManager):
    use_in_migrations = True

    def create_user(self, email, password=None, **extra):
        if not email:
            raise ValueError("Email is required")
        user = self.model(email=self.normalize_email(email), **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra):
        extra.update(is_staff=True, is_superuser=True)
        return self.create_user(email, password, **extra)


class User(AbstractUser):
    username = None
    email = models.EmailField(unique=True)
    display_name = models.CharField(max_length=80, blank=True)
    timezone = models.CharField(max_length=64, default="Africa/Nairobi")
    reminder_time = models.TimeField(null=True, blank=True)
    reminders_enabled = models.BooleanField(default=False)
    email_reminders_enabled = models.BooleanField(default=True)
    onboarding_answers = models.JSONField(default=dict, blank=True)
    analytics_consent = models.BooleanField(default=False)
    terms_accepted_at = models.DateTimeField(null=True, blank=True)
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []
    objects = UserManager()


class ConsentRecord(models.Model):
    class Kind(models.TextChoices):
        TERMS = "terms", "Terms and privacy"
        ANALYTICS = "analytics", "Optional analytics"

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="consent_records"
    )
    kind = models.CharField(max_length=20, choices=Kind.choices)
    granted = models.BooleanField()
    policy_version = models.CharField(max_length=20, default="2026-07")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

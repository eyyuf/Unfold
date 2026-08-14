from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import ConsentRecord, User


@admin.register(User)
class UnfoldUserAdmin(UserAdmin):
    ordering = ("email",)
    list_display = (
        "email",
        "display_name",
        "is_staff",
        "reminders_enabled",
        "date_joined",
    )
    search_fields = ("email", "display_name")
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal info", {"fields": ("first_name", "last_name")}),
        (
            "Permissions",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
        (
            "Unfold",
            {
                "fields": (
                    "display_name",
                    "timezone",
                    "reminder_time",
                    "reminders_enabled",
                    "email_reminders_enabled",
                    "analytics_consent",
                    "onboarding_answers",
                    "terms_accepted_at",
                )
            },
        ),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "password1", "password2", "is_staff", "is_active"),
            },
        ),
    )


@admin.register(ConsentRecord)
class ConsentRecordAdmin(admin.ModelAdmin):
    list_display = ("user", "kind", "granted", "policy_version", "created_at")
    list_filter = ("kind", "granted")
    search_fields = ("user__email",)

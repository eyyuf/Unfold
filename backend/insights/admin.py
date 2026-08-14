from django.contrib import admin

from .models import PatternDefinition, TraitEvidence, UserHypothesis


class TraitEvidenceAdmin(admin.ModelAdmin):
    list_display = [
        "user",
        "user_experiment",
        "trait",
        "fit_score",
        "confidence_score",
        "evidence_weight",
        "created_at",
    ]
    list_filter = ["trait"]
    search_fields = ["user__email", "trait__name"]


class UserHypothesisAdmin(admin.ModelAdmin):
    list_display = [
        "user",
        "trait",
        "status",
        "support_score",
        "confidence_score",
        "evidence_count",
        "updated_at",
    ]
    list_filter = ["status", "trait"]
    search_fields = ["user__email", "trait__name"]


class PatternDefinitionAdmin(admin.ModelAdmin):
    list_display = ["title", "slug", "min_experiments", "min_fit_score", "is_active"]
    list_filter = ["is_active"]
    search_fields = ["title", "slug"]
    prepopulated_fields = {"slug": ("title",)}
    filter_horizontal = ["traits"]


admin.site.register(TraitEvidence, TraitEvidenceAdmin)
admin.site.register(UserHypothesis, UserHypothesisAdmin)
admin.site.register(PatternDefinition, PatternDefinitionAdmin)

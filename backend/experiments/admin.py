from django.contrib import admin
from .models import Category, DailyTask, Experiment, ExperimentTrait, ExperimentTraitWeight, SavedExperiment, UserExperiment


class ExperimentTraitWeightInline(admin.TabularInline):
    model = ExperimentTraitWeight
    extra = 1


class ExperimentAdmin(admin.ModelAdmin):
    list_display = ["title", "category", "duration_days", "minutes_per_day", "published"]
    list_filter = ["published", "category"]
    search_fields = ["title", "description"]
    prepopulated_fields = {"slug": ("title",)}
    inlines = [ExperimentTraitWeightInline]


class ExperimentTraitAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "is_active"]
    list_filter = ["is_active"]
    search_fields = ["name", "slug"]
    prepopulated_fields = {"slug": ("name",)}


admin.site.register(Category)
admin.site.register(DailyTask)
admin.site.register(Experiment, ExperimentAdmin)
admin.site.register(ExperimentTrait, ExperimentTraitAdmin)
admin.site.register(UserExperiment)
admin.site.register(SavedExperiment)

from django.contrib import admin
from .models import Category, DailyTask, Experiment, SavedExperiment, UserExperiment

admin.site.register([Category, DailyTask, Experiment, UserExperiment, SavedExperiment])

# Register your models here.

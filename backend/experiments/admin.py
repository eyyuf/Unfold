from django.contrib import admin
from .models import Category, DailyTask, Experiment, UserExperiment

admin.site.register([Category, DailyTask, Experiment, UserExperiment])

# Register your models here.

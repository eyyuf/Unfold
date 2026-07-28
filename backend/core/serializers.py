from django.contrib.auth import authenticate
from rest_framework import serializers
from accounts.models import User
from checkins.models import CheckIn, FinalReflection
from experiments.models import DailyTask, Experiment, UserExperiment

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8, required=False)
    class Meta:
        model = User
        fields = ["id", "email", "display_name", "timezone", "reminder_time", "reminders_enabled", "password"]
    def create(self, data): return User.objects.create_user(**data)

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()
    def validate(self, data):
        user = authenticate(email=data["email"], password=data["password"])
        if not user: raise serializers.ValidationError("Invalid email or password.")
        data["user"] = user
        return data

class DailyTaskSerializer(serializers.ModelSerializer):
    class Meta: model, fields = DailyTask, ["day", "title", "instructions"]

class ExperimentSerializer(serializers.ModelSerializer):
    category = serializers.CharField(source="category.name", read_only=True)
    daily_tasks = DailyTaskSerializer(many=True, read_only=True)
    class Meta:
        model = Experiment
        fields = ["id", "category", "title", "slug", "description", "duration_days", "minutes_per_day", "daily_tasks"]

class UserExperimentSerializer(serializers.ModelSerializer):
    experiment = ExperimentSerializer(read_only=True)
    class Meta:
        model, fields = UserExperiment, "__all__"
        read_only_fields = ["user", "status"]

class CheckInSerializer(serializers.ModelSerializer):
    class Meta: model, exclude = CheckIn, ["user_experiment"]

class FinalReflectionSerializer(serializers.ModelSerializer):
    class Meta: model, exclude = FinalReflection, ["user_experiment"]

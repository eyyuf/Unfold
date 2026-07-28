from django.contrib.auth import authenticate
from rest_framework import serializers
from accounts.models import User
from checkins.models import CheckIn, FinalReflection
from experiments.models import DailyTask, Experiment, SavedExperiment, UserExperiment

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8, required=False)
    class Meta:
        model = User
        fields = ["id", "email", "display_name", "timezone", "reminder_time", "reminders_enabled", "password"]
    def create(self, data): return User.objects.create_user(**data)
    def update(self, instance, data):
        data.pop("password", None)
        return super().update(instance, data)

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


class SavedExperimentSerializer(serializers.ModelSerializer):
    experiment = ExperimentSerializer(read_only=True)

    class Meta:
        model = SavedExperiment
        fields = ["id", "experiment", "created_at"]

class UserExperimentSerializer(serializers.ModelSerializer):
    experiment = ExperimentSerializer(read_only=True)
    checkin_count = serializers.SerializerMethodField()
    current_day = serializers.SerializerMethodField()
    recent_checkins = serializers.SerializerMethodField()
    class Meta:
        model, fields = UserExperiment, "__all__"
        read_only_fields = ["user", "status"]
    def get_checkin_count(self, obj):
        return obj.checkins.count()
    def get_current_day(self, obj):
        return min(obj.checkins.count() + 1, obj.experiment.duration_days)
    def get_recent_checkins(self, obj):
        return [
            {
                "day": checkin.day,
                "notes": checkin.notes,
                "energy": checkin.energy,
                "curiosity": checkin.curiosity,
                "meaning": checkin.meaning,
            }
            for checkin in obj.checkins.all().order_by("-day")[:3]
        ]

class CheckInSerializer(serializers.ModelSerializer):
    energy = serializers.IntegerField(min_value=1, max_value=5)
    curiosity = serializers.IntegerField(min_value=1, max_value=5)
    meaning = serializers.IntegerField(min_value=1, max_value=5)
    difficulty = serializers.IntegerField(min_value=1, max_value=5)
    class Meta: model, exclude = CheckIn, ["user_experiment"]

class FinalReflectionSerializer(serializers.ModelSerializer):
    repeat_intent = serializers.IntegerField(min_value=1, max_value=5)
    class Meta: model, exclude = FinalReflection, ["user_experiment"]

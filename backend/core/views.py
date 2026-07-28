from django.contrib.auth import login, logout
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from checkins.models import CheckIn, FinalReflection
from experiments.models import Experiment, UserExperiment
from .serializers import CheckInSerializer, ExperimentSerializer, FinalReflectionSerializer, LoginSerializer, UserExperimentSerializer, UserSerializer

@api_view(["GET"])
@permission_classes([permissions.AllowAny])
@ensure_csrf_cookie
def csrf_view(request):
    return Response({"detail": "CSRF cookie set"})

class ExperimentList(generics.ListAPIView):
    serializer_class = ExperimentSerializer
    permission_classes = [permissions.AllowAny]
    def get_queryset(self):
        qs = Experiment.objects.filter(published=True).select_related("category").prefetch_related("daily_tasks")
        if self.request.query_params.get("category"):
            qs = qs.filter(category__slug=self.request.query_params["category"])
        if self.request.query_params.get("search"):
            qs = qs.filter(title__icontains=self.request.query_params["search"])
        return qs

class ExperimentDetail(generics.RetrieveAPIView):
    serializer_class = ExperimentSerializer
    lookup_field = "slug"
    permission_classes = [permissions.AllowAny]
    queryset = Experiment.objects.filter(published=True).select_related("category").prefetch_related("daily_tasks")

@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def register_view(request):
    serializer = UserSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    login(request, user)
    return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)

@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    login(request, serializer.validated_data["user"])
    return Response(UserSerializer(serializer.validated_data["user"]).data)

@api_view(["POST"])
def logout_view(request):
    logout(request)
    return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(["GET"])
def me_view(request): return Response(UserSerializer(request.user).data)

@api_view(["POST"])
def start_experiment(request, slug):
    experiment = get_object_or_404(Experiment, slug=slug, published=True)
    active, created = UserExperiment.objects.get_or_create(
        user=request.user, experiment=experiment, status="active",
        defaults={"start_date": request.data.get("start_date", timezone.localdate()), "reason": request.data.get("reason", "")})
    return Response(UserExperimentSerializer(active).data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

@api_view(["GET"])
def active_experiment(request):
    item = UserExperiment.objects.filter(user=request.user, status="active").select_related("experiment__category").first()
    return Response(UserExperimentSerializer(item).data if item else None)

@api_view(["POST"])
def submit_checkin(request, pk):
    item = get_object_or_404(UserExperiment, pk=pk, user=request.user)
    serializer = CheckInSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    checkin, _ = CheckIn.objects.update_or_create(user_experiment=item, day=serializer.validated_data["day"], defaults=serializer.validated_data)
    return Response(CheckInSerializer(checkin).data)

@api_view(["POST"])
def final_reflection(request, pk):
    item = get_object_or_404(UserExperiment, pk=pk, user=request.user)
    serializer = FinalReflectionSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    reflection, _ = FinalReflection.objects.update_or_create(user_experiment=item, defaults=serializer.validated_data)
    item.status = "completed"
    item.save(update_fields=["status"])
    return Response(FinalReflectionSerializer(reflection).data)

@api_view(["GET"])
def evidence_vault(request):
    items = UserExperiment.objects.filter(user=request.user).exclude(status="active").select_related("experiment__category")
    return Response(UserExperimentSerializer(items, many=True).data)

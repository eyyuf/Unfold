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

@api_view(["GET", "PATCH"])
@permission_classes([permissions.AllowAny])
def me_view(request):
    if not request.user.is_authenticated:
        if request.method == "GET":
            return Response(None)
        return Response(
            {"detail": "Authentication credentials were not provided."},
            status=status.HTTP_403_FORBIDDEN,
        )
    if request.method == "PATCH":
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    return Response(UserSerializer(request.user).data)

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
    return Response([report_for(item) for item in items])


def report_for(item):
    checkins = list(item.checkins.all())
    count = len(checkins)
    average = lambda field: round(sum(getattr(row, field) for row in checkins) / count * 20) if count else 0
    consistency = min(100, round(count / item.experiment.duration_days * 100))
    repeat_intent = getattr(getattr(item, "final_reflection", None), "repeat_intent", 0) * 20
    dimensions = {
        "Energy": average("energy"), "Curiosity": average("curiosity"),
        "Meaning": average("meaning"), "Ease": 100 - average("difficulty"),
        "Consistency": consistency, "Desire to continue": repeat_intent,
    }
    populated = [value for value in dimensions.values() if value]
    fit = round(sum(populated) / len(populated)) if populated else 0
    strongest = max(dimensions, key=dimensions.get) if populated else "Not enough evidence"
    return {
        "id": item.id, "status": item.status, "start_date": item.start_date,
        "experiment": ExperimentSerializer(item.experiment).data,
        "checkin_count": count, "fit_signal": fit, "strongest_signal": strongest,
        "dimensions": dimensions,
        "summary": getattr(getattr(item, "final_reflection", None), "summary", ""),
    }


@api_view(["GET"])
def experiment_report(request, pk):
    item = get_object_or_404(UserExperiment, pk=pk, user=request.user)
    return Response(report_for(item))


@api_view(["GET"])
def insights_view(request):
    items = UserExperiment.objects.filter(user=request.user, status="completed").select_related("experiment__category").prefetch_related("checkins")
    reports = [report_for(item) for item in items]
    categories = {}
    for report in reports:
        category = report["experiment"]["category"]
        categories.setdefault(category, []).append(report["fit_signal"])
    return Response({
        "completed_count": len(reports),
        "average_fit": round(sum(r["fit_signal"] for r in reports) / len(reports)) if reports else 0,
        "categories": [{"label": name, "value": round(sum(values) / len(values)), "count": len(values)} for name, values in categories.items()],
        "patterns": [f"{report['strongest_signal']} is your strongest signal in {report['experiment']['title']}" for report in reports[:3]],
    })

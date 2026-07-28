import os

from django.contrib.auth import login, logout
from django.contrib.auth.tokens import default_token_generator
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.views.decorators.csrf import ensure_csrf_cookie
import resend
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from accounts.models import ConsentRecord, User
from checkins.models import CheckIn, FinalReflection
from experiments.models import Experiment, SavedExperiment, UserExperiment
from .serializers import CheckInSerializer, ExperimentSerializer, FinalReflectionSerializer, LoginSerializer, PasswordResetConfirmSerializer, RegistrationSerializer, SavedExperimentSerializer, UserExperimentSerializer, UserSerializer

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
    serializer = RegistrationSerializer(data=request.data)
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
@permission_classes([permissions.AllowAny])
def password_reset_request(request):
    email = str(request.data.get("email", "")).strip().lower()
    user = User.objects.filter(email__iexact=email, is_active=True).first()
    response_data = {"detail": "If an account exists for that email, a reset link has been sent."}
    if user:
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        reset_url = f"{os.environ.get('SITE_URL', 'http://localhost:5173')}/reset-password?uid={uid}&token={token}"
        if os.environ.get("RESEND_API_KEY"):
            resend.api_key = os.environ["RESEND_API_KEY"]
            resend.Emails.send({
                "from": os.environ.get("DEFAULT_FROM_EMAIL", "Unfold <hello@example.com>"),
                "to": [user.email],
                "subject": "Reset your Unfold password",
                "html": f"<p>Use the link below to reset your password.</p><p><a href=\"{reset_url}\">Reset password</a></p><p>If you did not request this, you can ignore this email.</p>",
            })
        elif os.environ.get("DEBUG", "True").lower() == "true":
            response_data["reset_url"] = reset_url
    return Response(response_data)


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def password_reset_confirm(request):
    serializer = PasswordResetConfirmSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    try:
        user_id = force_str(urlsafe_base64_decode(request.data.get("uid", "")))
        user = User.objects.get(pk=user_id, is_active=True)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        user = None
    if not user or not default_token_generator.check_token(user, request.data.get("token", "")):
        return Response({"detail": "This reset link is invalid or has expired."}, status=status.HTTP_400_BAD_REQUEST)
    user.set_password(serializer.validated_data["password"])
    user.save(update_fields=["password"])
    return Response({"detail": "Password updated successfully."})

@api_view(["POST"])
def logout_view(request):
    logout(request)
    return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(["GET", "PATCH"])
@permission_classes([permissions.AllowAny])
def me_view(request):
    if not request.user.is_authenticated:
        if request.method == "GET":
            return JsonResponse(None, safe=False)
        return Response(
            {"detail": "Authentication credentials were not provided."},
            status=status.HTTP_403_FORBIDDEN,
        )
    if request.method == "PATCH":
        previous_analytics_consent = request.user.analytics_consent
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        if "analytics_consent" in request.data and request.user.analytics_consent != previous_analytics_consent:
            ConsentRecord.objects.create(
                user=request.user,
                kind=ConsentRecord.Kind.ANALYTICS,
                granted=request.user.analytics_consent,
            )
        return Response(serializer.data)
    return Response(UserSerializer(request.user).data)


@api_view(["GET"])
def consent_history(request):
    return Response([
        {
            "id": record.id,
            "kind": record.get_kind_display(),
            "granted": record.granted,
            "policy_version": record.policy_version,
            "created_at": record.created_at,
        }
        for record in request.user.consent_records.all()
    ])


@api_view(["GET"])
def export_user_data(request):
    experiments = UserExperiment.objects.filter(user=request.user).select_related("experiment__category").prefetch_related("checkins")
    saved = SavedExperiment.objects.filter(user=request.user).select_related("experiment__category").prefetch_related("experiment__daily_tasks")
    return Response({
        "exported_at": timezone.now(),
        "profile": UserSerializer(request.user).data,
        "experiments": [
            {
                **report_for(item),
                "reason": item.reason,
                "checkins": CheckInSerializer(item.checkins.all(), many=True).data,
            }
            for item in experiments
        ],
        "saved_experiments": SavedExperimentSerializer(saved, many=True).data,
        "consent_history": [
            {
                "kind": record.get_kind_display(),
                "granted": record.granted,
                "policy_version": record.policy_version,
                "created_at": record.created_at,
            }
            for record in request.user.consent_records.all()
        ],
    })


@api_view(["POST"])
def delete_account(request):
    if request.data.get("confirmation") != "DELETE":
        return Response({"detail": "Type DELETE to confirm account deletion."}, status=status.HTTP_400_BAD_REQUEST)
    user = request.user
    logout(request)
    user.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(["POST"])
def start_experiment(request, slug):
    experiment = get_object_or_404(Experiment, slug=slug, published=True)
    existing = UserExperiment.objects.filter(user=request.user, status="active").select_related("experiment__category").first()
    if existing and existing.experiment_id != experiment.id:
        return Response(
            {"detail": f"Finish {existing.experiment.title} before starting another experiment."},
            status=status.HTTP_409_CONFLICT,
        )
    active, created = UserExperiment.objects.get_or_create(
        user=request.user, experiment=experiment, status="active",
        defaults={"start_date": request.data.get("start_date", timezone.localdate()), "reason": request.data.get("reason", "")})
    if created:
        profile_updates = []
        if "reminder_time" in request.data:
            request.user.reminder_time = request.data["reminder_time"] or None
            profile_updates.append("reminder_time")
        if "reminders_enabled" in request.data:
            request.user.reminders_enabled = bool(request.data["reminders_enabled"])
            profile_updates.append("reminders_enabled")
        if profile_updates:
            request.user.save(update_fields=profile_updates)
    return Response(UserExperimentSerializer(active).data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


@api_view(["GET"])
def saved_experiments(request):
    items = SavedExperiment.objects.filter(user=request.user).select_related("experiment__category").prefetch_related("experiment__daily_tasks")
    return Response(SavedExperimentSerializer(items, many=True).data)


@api_view(["POST", "DELETE"])
def toggle_saved_experiment(request, slug):
    experiment = get_object_or_404(Experiment, slug=slug, published=True)
    if request.method == "DELETE":
        SavedExperiment.objects.filter(user=request.user, experiment=experiment).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    saved, created = SavedExperiment.objects.get_or_create(user=request.user, experiment=experiment)
    return Response(SavedExperimentSerializer(saved).data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

@api_view(["GET"])
def active_experiment(request):
    item = UserExperiment.objects.filter(user=request.user, status="active").select_related("experiment__category").prefetch_related("checkins", "experiment__daily_tasks").first()
    if not item:
        return JsonResponse(None, safe=False)
    return Response(UserExperimentSerializer(item).data)


@api_view(["POST"])
def abandon_experiment(request, pk):
    item = get_object_or_404(UserExperiment, pk=pk, user=request.user, status="active")
    item.status = "abandoned"
    item.save(update_fields=["status"])
    return Response(report_for(item))

@api_view(["POST"])
def submit_checkin(request, pk):
    item = get_object_or_404(UserExperiment, pk=pk, user=request.user)
    serializer = CheckInSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    if serializer.validated_data["day"] > item.experiment.duration_days:
        return Response({"detail": "This day is outside the experiment plan."}, status=status.HTTP_400_BAD_REQUEST)
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
    items = UserExperiment.objects.filter(user=request.user).exclude(status="active").select_related("experiment__category").order_by("-created_at")
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
    checkins = list(CheckIn.objects.filter(user_experiment__in=items))
    reflections = list(FinalReflection.objects.filter(user_experiment__in=items))
    average_curiosity = round(sum(row.curiosity for row in checkins) / len(checkins), 1) if checkins else 0
    average_repeat_intent = round(sum(row.repeat_intent for row in reflections) / len(reflections) * 20) if reflections else 0
    average_consistency = round(sum(report["dimensions"]["Consistency"] for report in reports) / len(reports)) if reports else 0
    return Response({
        "completed_count": len(reports),
        "average_fit": round(sum(r["fit_signal"] for r in reports) / len(reports)) if reports else 0,
        "average_curiosity": average_curiosity,
        "average_repeat_intent": average_repeat_intent,
        "average_consistency": average_consistency,
        "categories": [{"label": name, "value": round(sum(values) / len(values)), "count": len(values)} for name, values in categories.items()],
        "patterns": [f"{report['strongest_signal']} is your strongest signal in {report['experiment']['title']}" for report in reports[:3]],
        "evidence_map": [
            {
                "id": report["id"],
                "label": report["experiment"]["title"],
                "category": report["experiment"]["category"],
                "fit_signal": report["fit_signal"],
                "strongest_signal": report["strongest_signal"],
            }
            for report in reports
        ],
    })

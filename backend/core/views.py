import os
import logging
from collections import Counter
from datetime import timedelta
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

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
from experiments.models import Experiment, ExperimentTrait, SavedExperiment, UserExperiment
from insights.models import PatternDefinition, TraitEvidence, UserHypothesis
from insights.services.hypotheses import recalculate_user_hypotheses
from insights.services.recommendations import get_contrast_recommendation
from insights.services.scoring import (
    calculate_before_after_delta,
    calculate_daily_fit,
    calculate_evidence_confidence,
    calculate_overall_fit,
    scale_to_100,
)
from insights.services.trait_evidence import generate_trait_evidence
from .serializers import (
    CheckInSerializer,
    ExperimentSerializer,
    ExperimentTraitSerializer,
    FinalReflectionSerializer,
    LoginSerializer,
    PasswordResetConfirmSerializer,
    PatternDefinitionSerializer,
    RegistrationSerializer,
    SavedExperimentSerializer,
    UserExperimentSerializer,
    UserHypothesisSerializer,
    UserSerializer,
)

logger = logging.getLogger(__name__)


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def health_view(request):
    return Response({"status": "ok"})


@api_view(["GET"])
def profile_activity(request):
    try:
        user_zone = ZoneInfo(request.user.timezone or "UTC")
    except ZoneInfoNotFoundError:
        user_zone = ZoneInfo("UTC")

    timestamps = CheckIn.objects.filter(
        user_experiment__user=request.user,
        is_complete=True,
    ).values_list("created_at", flat=True)
    counts = Counter(timezone.localtime(timestamp, user_zone).date() for timestamp in timestamps)
    ordered_dates = sorted(counts)
    today = timezone.localtime(timezone.now(), user_zone).date()

    current_streak = 0
    if ordered_dates and ordered_dates[-1] >= today - timedelta(days=1):
        cursor = ordered_dates[-1]
        active_dates = set(ordered_dates)
        while cursor in active_dates:
            current_streak += 1
            cursor -= timedelta(days=1)

    longest_streak = 0
    running_streak = 0
    previous_date = None
    for activity_date in ordered_dates:
        running_streak = running_streak + 1 if previous_date and activity_date == previous_date + timedelta(days=1) else 1
        longest_streak = max(longest_streak, running_streak)
        previous_date = activity_date

    return Response({
        "today": today.isoformat(),
        "days": [{"date": activity_date.isoformat(), "count": counts[activity_date]} for activity_date in ordered_dates],
        "total_checkins": sum(counts.values()),
        "active_days": len(ordered_dates),
        "current_streak": current_streak,
        "longest_streak": longest_streak,
    })


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
            try:
                resend.api_key = os.environ["RESEND_API_KEY"]
                resend.Emails.send({
                    "from": os.environ.get("DEFAULT_FROM_EMAIL", "Unfold <onboarding@resend.dev>"),
                    "to": [user.email],
                    "subject": "Reset your Unfold password",
                    "html": f"<p>Use the link below to reset your password.</p><p><a href=\"{reset_url}\">Reset password</a></p><p>If you did not request this, you can ignore this email.</p>",
                })
            except Exception:
                logger.exception("Password reset email delivery failed")
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
    item = get_object_or_404(UserExperiment, pk=pk, user=request.user, status="active")
    serializer = CheckInSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    day = serializer.validated_data.get("day", 1)
    if day < 1 or day > item.experiment.duration_days:
        return Response({"detail": "This day is outside the experiment plan."}, status=status.HTTP_400_BAD_REQUEST)
    checkin_data = dict(serializer.validated_data)
    checkin_data["is_complete"] = True
    checkin, _ = CheckIn.objects.update_or_create(user_experiment=item, day=checkin_data["day"], defaults=checkin_data)
    return Response(CheckInSerializer(checkin).data)


@api_view(["POST"])
def start_checkin(request, pk):
    item = get_object_or_404(UserExperiment, pk=pk, user=request.user, status="active")
    try:
        day_number = int(request.data.get("day_number", 1))
    except (ValueError, TypeError):
        return Response({"detail": "Day must be a number."}, status=status.HTTP_400_BAD_REQUEST)
    if day_number < 1 or day_number > item.experiment.duration_days:
        return Response({"detail": "This day is outside the experiment plan."}, status=status.HTTP_400_BAD_REQUEST)
    motivation_before = request.data.get("motivation_before")
    if motivation_before is not None:
        try:
            motivation_before = int(motivation_before)
            motivation_before = max(1, min(5, motivation_before))
        except (ValueError, TypeError):
            motivation_before = 3

    checkin, _ = CheckIn.objects.get_or_create(
        user_experiment=item,
        day=day_number,
        defaults={"motivation_before": motivation_before}
    )
    if motivation_before is not None and checkin.motivation_before != motivation_before:
        checkin.motivation_before = motivation_before
        checkin.save(update_fields=["motivation_before"])

    return Response(CheckInSerializer(checkin).data)


@api_view(["PATCH"])
def update_checkin_patch(request, pk, checkin_id):
    item = get_object_or_404(UserExperiment, pk=pk, user=request.user, status="active")
    checkin = get_object_or_404(CheckIn, pk=checkin_id, user_experiment=item)
    serializer = CheckInSerializer(checkin, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    updated = serializer.save(is_complete=True)
    return Response(CheckInSerializer(updated).data)


@api_view(["POST"])
def final_reflection(request, pk):
    item = get_object_or_404(UserExperiment, pk=pk, user=request.user, status="active")
    serializer = FinalReflectionSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    reflection, _ = FinalReflection.objects.update_or_create(user_experiment=item, defaults=serializer.validated_data)
    item.status = "completed"
    item.save(update_fields=["status"])

    # Generate evidence & update hypotheses
    generate_trait_evidence(item)
    recalculate_user_hypotheses(request.user)

    return Response(FinalReflectionSerializer(reflection).data)


@api_view(["GET"])
def evidence_vault(request):
    items = UserExperiment.objects.filter(user=request.user).exclude(status="active").select_related("experiment__category").order_by("-created_at")
    return Response([report_for(item) for item in items])


def report_for(item):
    checkins = list(item.checkins.all())
    count = len(checkins)

    overall_fit = calculate_overall_fit(item)
    conf_score, conf_label = calculate_evidence_confidence(item)

    avg_get = lambda attr: round(sum(getattr(row, attr) or 3 for row in checkins) / count * 20) if count else 0
    consistency = min(100, round(count / max(1, item.experiment.duration_days) * 100))
    repeat_intent = scale_to_100(getattr(getattr(item, "final_reflection", None), "repeat_intent", None))

    dimensions = {
        "Energy": avg_get("energy_after") if any(c.energy_after for c in checkins) else avg_get("energy"),
        "Curiosity": avg_get("curiosity"),
        "Meaning": avg_get("meaning"),
        "Ease": round(sum(scale_to_100(6 - (c.difficulty or 3)) for c in checkins) / count) if count else 0,
        "Consistency": consistency,
        "Desire to continue": round(repeat_intent),
    }

    populated = [v for v in dimensions.values() if v > 0]
    strongest = max(dimensions, key=dimensions.get) if populated else "Not enough evidence"

    # Before/After calculation using latest checkin or average
    last_checkin = checkins[-1] if checkins else None
    before_after = calculate_before_after_delta(
        last_checkin.motivation_before if last_checkin else None,
        last_checkin.satisfaction_after if last_checkin else None
    )

    signals = {
        "enjoyment": avg_get("enjoyment"),
        "energy": avg_get("energy_after") if any(c.energy_after for c in checkins) else avg_get("energy"),
        "curiosity": avg_get("curiosity"),
        "meaning": avg_get("meaning"),
        "desire_to_continue": avg_get("desire_to_continue"),
        "desire_to_improve": avg_get("desire_to_improve"),
        "flow": avg_get("lost_track_of_time"),
    }

    # Pattern contributions from traits
    pattern_updates = []
    for tw in item.experiment.trait_weights.select_related("trait"):
        pattern_updates.append(
            f"Contributed evidence to the '{tw.trait.name}' pattern (weight {tw.weight}/5)."
        )

    return {
        "id": item.id,
        "status": item.status,
        "start_date": item.start_date,
        "experiment": ExperimentSerializer(item.experiment).data,
        "checkin_count": count,
        "fit_signal": int(round(overall_fit)),
        "overall_fit_score": float(overall_fit),
        "confidence": {
            "score": float(conf_score),
            "label": conf_label,
        },
        "strongest_signal": strongest,
        "dimensions": dimensions,
        "signals": signals,
        "before_after": before_after,
        "summary": getattr(getattr(item, "final_reflection", None), "summary", ""),
        "pattern_updates": pattern_updates,
    }


@api_view(["GET"])
def experiment_report(request, pk):
    item = get_object_or_404(UserExperiment, pk=pk, user=request.user)
    return Response(report_for(item))


@api_view(["GET"])
def traits_list(request):
    traits = ExperimentTrait.objects.filter(is_active=True)
    return Response(ExperimentTraitSerializer(traits, many=True).data)


@api_view(["GET"])
def user_hypotheses_list(request):
    recalculate_user_hypotheses(request.user)
    hypotheses = UserHypothesis.objects.filter(user=request.user).select_related("trait")
    return Response(UserHypothesisSerializer(hypotheses, many=True).data)


@api_view(["GET"])
def user_hypothesis_detail(request, pk):
    hyp = get_object_or_404(UserHypothesis, pk=pk, user=request.user)
    evidence_list = TraitEvidence.objects.filter(user=request.user, trait=hyp.trait).select_related("user_experiment__experiment")
    evidence_data = [
        {
            "experiment_id": ev.user_experiment.id,
            "experiment_title": ev.user_experiment.experiment.title,
            "fit_score": float(ev.fit_score),
            "confidence_score": float(ev.confidence_score),
            "weight": ev.experiment_trait_weight,
        }
        for ev in evidence_list
    ]
    data = UserHypothesisSerializer(hyp).data
    data["evidence"] = evidence_data
    return Response(data)


@api_view(["POST"])
def test_hypothesis(request, pk):
    hyp = get_object_or_404(UserHypothesis, pk=pk, user=request.user)
    rec = get_contrast_recommendation(request.user, hyp)
    if not rec:
        return Response({"detail": "No suitable test experiment found for this hypothesis."}, status=status.HTTP_404_NOT_FOUND)
    return Response(rec)


@api_view(["GET"])
def patterns_list(request):
    patterns = PatternDefinition.objects.filter(is_active=True).prefetch_related("traits")
    matched_patterns = []
    for pat in patterns:
        required_trait_ids = list(pat.traits.values_list("id", flat=True))
        if not required_trait_ids:
            continue

        qualifying_runs = UserExperiment.objects.filter(
            user=request.user,
            status="completed",
            experiment__trait_weights__trait_id__in=required_trait_ids
        ).annotate(matched_count=Count("experiment__trait_weights__trait_id", distinct=True)).filter(matched_count=len(required_trait_ids))

        count = qualifying_runs.count()
        is_unlocked = count >= pat.min_experiments
        matched_patterns.append({
            "id": pat.id,
            "slug": pat.slug,
            "title": pat.title,
            "description": pat.description,
            "positive_text": pat.positive_text,
            "qualifying_count": count,
            "is_unlocked": is_unlocked,
            "traits": [t.name for t in pat.traits.all()],
        })
    return Response(matched_patterns)


@api_view(["GET"])
def insights_view(request):
    recalculate_user_hypotheses(request.user)
    items = UserExperiment.objects.filter(user=request.user, status="completed").select_related("experiment__category").prefetch_related("checkins")
    reports = [report_for(item) for item in items]
    categories = {}
    for report in reports:
        category = report["experiment"]["category"]
        categories.setdefault(category, []).append(report["fit_signal"])
    checkins = list(CheckIn.objects.filter(user_experiment__in=items))
    reflections = list(FinalReflection.objects.filter(user_experiment__in=items))
    average_curiosity = round(sum(row.curiosity or 3 for row in checkins) / len(checkins), 1) if checkins else 0
    average_repeat_intent = round(sum(row.repeat_intent for row in reflections) / len(reflections) * 20) if reflections else 0
    average_consistency = round(sum(report["dimensions"]["Consistency"] for report in reports) / len(reports)) if reports else 0

    hypotheses = UserHypothesis.objects.filter(user=request.user).select_related("trait")
    hypotheses_data = UserHypothesisSerializer(hypotheses, many=True).data
    next_recommendation = None
    for hypothesis in hypotheses.order_by("-confidence_score", "-support_score"):
        if hypothesis.status not in (UserHypothesis.Status.SUPPORTED, UserHypothesis.Status.EMERGING):
            continue
        next_recommendation = get_contrast_recommendation(request.user, hypothesis)
        if next_recommendation:
            break

    return Response({
        "completed_count": len(reports),
        "average_fit": round(sum(r["fit_signal"] for r in reports) / len(reports)) if reports else 0,
        "average_curiosity": average_curiosity,
        "average_repeat_intent": average_repeat_intent,
        "average_consistency": average_consistency,
        "categories": [{"label": name, "value": round(sum(values) / len(values)), "count": len(values)} for name, values in categories.items()],
        "patterns": [f"{report['strongest_signal']} is your strongest signal in {report['experiment']['title']}" for report in reports[:3]],
        "hypotheses": hypotheses_data,
        "next_recommendation": next_recommendation,
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

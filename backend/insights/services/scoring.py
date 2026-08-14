from typing import Any, Dict, Optional, Tuple


def scale_to_100(value: Optional[int]) -> float:
    """Normalize a 1–5 response to a 0–100 score. Returns 50.0 if value is None."""
    if value is None:
        return 50.0
    clamped = max(1, min(5, value))
    return ((clamped - 1) / 4.0) * 100.0


def calculate_daily_fit(checkin: Any, expected_minutes: int = 20) -> float:
    """Calculate daily fit score (0-100) from a CheckIn instance."""
    # Interest score from enjoyment, curiosity, desire_to_continue, desire_to_improve
    interest_vals = [
        val
        for val in [
            checkin.enjoyment,
            checkin.curiosity,
            checkin.desire_to_continue,
            checkin.desire_to_improve,
        ]
        if val is not None
    ]
    if interest_vals:
        interest_score = sum(scale_to_100(v) for v in interest_vals) / len(
            interest_vals
        )
    else:
        interest_score = 50.0

    energy_score = (
        scale_to_100(checkin.energy_after)
        if checkin.energy_after is not None
        else scale_to_100(checkin.energy)
    )
    meaning_score = scale_to_100(checkin.meaning)
    flow_score = (
        scale_to_100(checkin.lost_track_of_time)
        if checkin.lost_track_of_time is not None
        else 50.0
    )
    satisfaction_score = (
        scale_to_100(checkin.satisfaction_after)
        if checkin.satisfaction_after is not None
        else interest_score
    )

    minutes = (
        checkin.minutes_spent if checkin.minutes_spent is not None else expected_minutes
    )
    completion_ratio = (
        min(minutes / max(1, expected_minutes), 1.0)
        if (checkin.is_complete or minutes > 0)
        else 0.0
    )

    difficulty_val = checkin.difficulty if checkin.difficulty is not None else 3
    friction_score = scale_to_100(6 - difficulty_val)

    daily_fit_score = (
        0.25 * interest_score
        + 0.15 * energy_score
        + 0.15 * meaning_score
        + 0.15 * flow_score
        + 0.10 * satisfaction_score
        + 0.10 * (completion_ratio * 100.0)
        + 0.10 * friction_score
    )

    return round(daily_fit_score, 2)


def calculate_evidence_confidence(user_experiment: Any) -> Tuple[float, str]:
    """Calculate evidence confidence score (0-100) and human-readable label."""
    expected = max(1, user_experiment.experiment.duration_days)
    completed_checkins = user_experiment.checkins.filter(is_complete=True).count()
    if not completed_checkins:
        # Fallback to total checkins if is_complete isn't set yet
        completed_checkins = user_experiment.checkins.count()

    checkin_ratio = min(1.0, completed_checkins / expected)

    confidence = checkin_ratio * 60.0

    if user_experiment.status == "completed":
        confidence += 15.0

    if (
        hasattr(user_experiment, "final_reflection")
        and user_experiment.final_reflection is not None
    ):
        confidence += 25.0

    confidence_score = round(min(100.0, max(0.0, confidence)), 2)

    if confidence_score < 25:
        label = "Very limited"
    elif confidence_score < 45:
        label = "Limited"
    elif confidence_score < 65:
        label = "Moderate"
    elif confidence_score < 85:
        label = "Strong"
    else:
        label = "Very strong"

    return confidence_score, label


def calculate_overall_fit(user_experiment: Any) -> float:
    """Calculate overall experiment fit score (0-100)."""
    checkins = list(user_experiment.checkins.all())
    expected_minutes = user_experiment.experiment.minutes_per_day or 20
    expected_days = max(1, user_experiment.experiment.duration_days)

    if checkins:
        daily_fits = [calculate_daily_fit(c, expected_minutes) for c in checkins]
        avg_daily_fit = sum(daily_fits) / len(daily_fits)
    else:
        avg_daily_fit = 0.0

    completed_count = user_experiment.checkins.filter(is_complete=True).count() or len(
        checkins
    )
    consistency = min(100.0, (completed_count / expected_days) * 100.0)

    has_reflection = (
        hasattr(user_experiment, "final_reflection")
        and user_experiment.final_reflection is not None
    )
    if has_reflection:
        repeat_intent = user_experiment.final_reflection.repeat_intent
        final_reflection_score = scale_to_100(repeat_intent)
        overall = (
            0.60 * avg_daily_fit + 0.20 * final_reflection_score + 0.20 * consistency
        )
    else:
        overall = 0.75 * avg_daily_fit + 0.25 * consistency

    return round(min(100.0, max(0.0, overall)), 2)


def calculate_before_after_delta(
    motivation_before: Optional[int], satisfaction_after: Optional[int]
) -> Dict[str, Any]:
    """Calculate motivation vs satisfaction delta and interpretation."""
    if motivation_before is None or satisfaction_after is None:
        return {
            "motivation_before": (
                scale_to_100(motivation_before) if motivation_before else None
            ),
            "satisfaction_after": (
                scale_to_100(satisfaction_after) if satisfaction_after else None
            ),
            "delta": 0,
            "interpretation": "Expectation and experience will be compared after completion.",
        }

    delta = satisfaction_after - motivation_before

    if delta >= 2:
        interpretation = (
            "Starting was difficult, but you felt much better after doing it."
        )
    elif delta == 1:
        interpretation = "You felt somewhat better after doing it than before starting."
    elif delta == 0:
        interpretation = "Your expectation and experience were similar."
    elif delta == -1:
        interpretation = "The activity was slightly less satisfying than expected."
    else:
        interpretation = (
            "You were more excited before the activity than after completing it."
        )

    return {
        "motivation_before": scale_to_100(motivation_before),
        "satisfaction_after": scale_to_100(satisfaction_after),
        "delta": delta,
        "interpretation": interpretation,
    }

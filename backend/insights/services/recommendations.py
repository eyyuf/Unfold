from typing import Dict, Any, Optional
from experiments.models import Experiment, UserExperiment, ExperimentTraitWeight


def get_contrast_recommendation(user, hypothesis) -> Optional[Dict[str, Any]]:
    """Generate a contrast experiment recommendation to test a specific user hypothesis.

    Returns dict with hypothesis info, recommended experiment, and deterministic explanation text.
    """
    target_trait = hypothesis.trait

    # Exclude already started / completed / abandoned user experiments
    user_exp_ids = UserExperiment.objects.filter(user=user).values_list("experiment_id", flat=True)

    # Candidate experiments containing target trait
    candidate_weights = ExperimentTraitWeight.objects.filter(
        trait=target_trait,
        experiment__published=True
    ).exclude(experiment_id__in=user_exp_ids).select_related("experiment")

    if not candidate_weights.exists():
        return None

    # Gather user's completed experiments containing this target trait to measure trait overlap/novelty
    completed_exp_ids = UserExperiment.objects.filter(
        user=user,
        status="completed"
    ).values_list("experiment_id", flat=True)

    previously_tested_traits = set(
        ExperimentTraitWeight.objects.filter(
            experiment_id__in=completed_exp_ids,
            weight__gte=3
        ).values_list("trait_id", flat=True)
    )

    completed_titles = list(
        Experiment.objects.filter(id__in=completed_exp_ids).values_list("title", flat=True)
    )

    scored_candidates = []
    for cw in candidate_weights:
        exp = cw.experiment

        # Check time availability if specified in user.onboarding_answers
        user_time = (user.onboarding_answers or {}).get("available_time", "")
        if "10" in user_time and exp.minutes_per_day > 15:
            continue

        target_strength = cw.weight
        exp_trait_weights = list(exp.trait_weights.exclude(trait=target_trait))

        overlap_score = sum(1 for tw in exp_trait_weights if tw.trait_id in previously_tested_traits and tw.weight >= 3)
        novel_trait_count = sum(1 for tw in exp_trait_weights if tw.trait_id not in previously_tested_traits and tw.weight >= 3)

        candidate_score = (target_strength * 4.0) + (novel_trait_count * 2.0) - (overlap_score * 1.5)
        scored_candidates.append((candidate_score, exp, target_strength, novel_trait_count))

    if not scored_candidates:
        # Fallback to any published candidate with target trait if filtering was too strict
        selected_weight = candidate_weights.first()
        exp = selected_weight.experiment
        target_strength = selected_weight.weight
    else:
        scored_candidates.sort(key=lambda x: x[0], reverse=True)
        _score, exp, target_strength, _novel_count = scored_candidates[0]

    # Generate explanation text using template
    if completed_titles:
        prev_str = " and ".join(completed_titles[:2])
        explanation = (
            f"Your previous experiment{'s' if len(completed_titles)>1 else ''} ({prev_str}) "
            f"showed positive signals around '{target_trait.name}'. "
            f"'{exp.title}' also features '{target_trait.name}', but tests it in a different setting to see if the signal holds."
        )
    else:
        explanation = (
            f"This experiment features '{target_trait.name}' (weighted {target_strength}/5) "
            f"to help test your emerging hypothesis."
        )

    return {
        "hypothesis": {
            "id": hypothesis.id,
            "trait": target_trait.slug,
            "trait_name": target_trait.name,
            "support_score": float(hypothesis.support_score),
            "confidence_score": float(hypothesis.confidence_score),
            "status": hypothesis.status,
        },
        "recommended_experiment": {
            "id": exp.id,
            "slug": exp.slug,
            "title": exp.title,
            "category": exp.category.name,
            "description": exp.description,
            "duration_days": exp.duration_days,
            "minutes_per_day": exp.minutes_per_day,
            "reason": explanation,
        },
    }

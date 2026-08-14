from decimal import Decimal

from insights.models import TraitEvidence
from insights.services.scoring import (
    calculate_evidence_confidence,
    calculate_overall_fit,
)


def generate_trait_evidence(user_experiment) -> list:
    """Generate or update TraitEvidence records for a completed/finalized UserExperiment.

    Idempotent operation. Returns created/updated TraitEvidence instances.
    """
    user = user_experiment.user
    experiment = user_experiment.experiment
    trait_weights = list(experiment.trait_weights.filter(trait__is_active=True))

    if not trait_weights:
        return []

    overall_fit = calculate_overall_fit(user_experiment)
    confidence, _label = calculate_evidence_confidence(user_experiment)

    confidence_norm = confidence / 100.0

    evidence_records = []
    for tw in trait_weights:
        weight_norm = tw.weight / 5.0
        ev_weight = round(weight_norm * confidence_norm, 4)

        record, _created = TraitEvidence.objects.update_or_create(
            user_experiment=user_experiment,
            trait=tw.trait,
            defaults={
                "user": user,
                "fit_score": Decimal(str(overall_fit)),
                "confidence_score": Decimal(str(confidence)),
                "experiment_trait_weight": tw.weight,
                "evidence_weight": Decimal(str(ev_weight)),
            },
        )
        evidence_records.append(record)

    return evidence_records

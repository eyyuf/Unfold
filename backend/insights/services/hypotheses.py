from decimal import Decimal

from django.db.models import Count
from experiments.models import ExperimentTrait
from insights.models import TraitEvidence, UserHypothesis


def recalculate_user_hypotheses(user) -> list:
    """Recalculate and update UserHypothesis records for all traits where user has evidence.

    Returns updated UserHypothesis list.
    """
    # Find all active traits that have evidence for this user
    evidence_traits = ExperimentTrait.objects.filter(
        is_active=True, user_evidence__user=user
    ).distinct()

    results = []
    for trait in evidence_traits:
        all_evidence = list(TraitEvidence.objects.filter(user=user, trait=trait))
        if not all_evidence:
            continue

        denom = sum(float(e.evidence_weight) for e in all_evidence)
        if denom > 0:
            num = sum(
                float(e.fit_score) * float(e.evidence_weight) for e in all_evidence
            )
            support_score = round(num / denom, 2)

            conf_num = sum(
                float(e.confidence_score) * float(e.evidence_weight)
                for e in all_evidence
            )
            avg_evidence_conf = conf_num / denom
        else:
            support_score = 0.0
            avg_evidence_conf = 0.0

        evidence_count = len(all_evidence)
        count_factor = min(evidence_count / 4.0, 1.0)
        confidence_score = round(
            0.55 * avg_evidence_conf + 0.45 * (count_factor * 100.0), 2
        )

        # Status rules
        if evidence_count < 2:
            status = UserHypothesis.Status.UNCERTAIN
        elif support_score >= 75 and confidence_score >= 70 and evidence_count >= 3:
            status = UserHypothesis.Status.SUPPORTED
        elif support_score >= 70 and confidence_score >= 45:
            status = UserHypothesis.Status.EMERGING
        elif support_score <= 35 and confidence_score >= 60 and evidence_count >= 3:
            status = UserHypothesis.Status.CONTRADICTED
        else:
            status = UserHypothesis.Status.UNCERTAIN

        hyp, _created = UserHypothesis.objects.update_or_create(
            user=user,
            trait=trait,
            defaults={
                "support_score": Decimal(str(support_score)),
                "confidence_score": Decimal(str(confidence_score)),
                "evidence_count": evidence_count,
                "status": status,
            },
        )
        results.append(hyp)

    return results

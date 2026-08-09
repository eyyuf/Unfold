# Unfold

Unfold helps people discover what fits through short real-world experiments, daily reflection, and evidence-based insights.

## Next Clue Engine Architecture

Unfold features a 100% deterministic, rule-based, local, and private **Evidence, Pattern, and Hypothesis Engine**.

```text
Experiment
    ↓
Daily evidence (Check-ins with before/after signals & flow)
    ↓
Experiment result (Overall fit score + Evidence confidence)
    ↓
Trait Evidence (Weighted evidence distribution to experiment traits)
    ↓
User Hypotheses & Pattern Definitions (Emerging / Supported / Contradicted)
    ↓
Contrast Recommendation Engine ("Test this assumption")
    ↓
Next experiment chosen to test hypothesis
```

### Key Components

- **Check-In Signals**: Captures before-task motivation (`motivation_before`), energy, curiosity, meaning, flow (`lost_track_of_time`), difficulty, desire to continue/improve, and satisfaction.
- **Scoring & Confidence**: Standardized 0–100 scale for daily fit and overall fit score paired with explicit Evidence Confidence scores ("Very limited", "Limited", "Moderate", "Strong", "Very strong").
- **Trait Evidence**: Idempotently attributes completed experiment results to weighted activity traits (`creative`, `technical`, `tangible_output`, `solitary`, etc.).
- **User Hypotheses**: Evaluates individual trait hypotheses based on conservative evidence & confidence thresholds (`uncertain`, `emerging`, `supported`, `contradicted`).
- **Contrast Recommendation Engine**: Recommends experiments that test specific hypotheses by isolating the target trait while introducing novel surrounding traits. Includes deterministic template explanations.
- **Learned Insights UI**: Accessible at `/insights/learned` ("What I've learned about myself") with interactive hypothesis cards, evidence inspection, and contrast test recommendations.

## Stack

React 19, TypeScript, Vite, Vanilla CSS, TanStack Query, React Hook Form, Zod, Recharts, Lucide, Django REST Framework, PostgreSQL, session authentication, CSRF, Render, Resend, and Sentry.

## Local development

```bash
npm --prefix frontend install
npm --prefix frontend run dev
python -m pip install -r backend/requirements.txt
python backend/manage.py migrate
python backend/manage.py seed_hypothesis_engine
python backend/manage.py runserver
```

## Verification

```bash
npm --prefix frontend test
npm --prefix frontend run build
npx --prefix frontend tsc --noEmit
python backend/manage.py test
python backend/manage.py check
```

## Production

The included Render blueprint provisions the web service, PostgreSQL database, reminder cron job, generated secret key, HTTPS-aware security settings, and `/api/v1/health/` health check. Configure `RESEND_API_KEY`, `DEFAULT_FROM_EMAIL`, and optionally `SENTRY_DSN` in the hosting environment. Never commit production environment values.

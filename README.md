# Unfold

Unfold helps people discover what fits through short real-world experiments, daily reflection, and evidence-based insights.

## Stack

React 19, TypeScript, Vite, Tailwind CSS, TanStack Query, React Hook Form, Zod, Recharts, Lucide, Django REST Framework, PostgreSQL, session authentication, CSRF, Render, Resend, and Sentry.

## Local development

```bash
npm --prefix frontend install
npm --prefix frontend run dev
python -m pip install -r backend/requirements.txt
python backend/manage.py migrate
python backend/manage.py loaddata experiments
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

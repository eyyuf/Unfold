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

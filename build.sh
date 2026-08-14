#!/usr/bin/env bash
set -o errexit
npm --prefix frontend ci
npm --prefix frontend run build
python -m pip install -r backend/requirements.txt
python backend/manage.py collectstatic --no-input
python backend/manage.py migrate
python backend/manage.py loaddata experiments
python backend/manage.py seed_hypothesis_engine

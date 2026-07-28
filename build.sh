#!/usr/bin/env bash
set -o errexit
npm --prefix frontend ci
npm --prefix frontend run build
python -m pip install -r backend/requirements.txt
python backend/manage.py collectstatic --no-input
python backend/manage.py migrate

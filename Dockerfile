# Atlas cloud server: web app + API. Tasks run in E2B sandboxes; data lives in Supabase.
FROM python:3.12-slim

WORKDIR /srv
COPY requirements-cloud.txt .
RUN pip install --no-cache-dir -r requirements-cloud.txt

COPY app ./app
COPY static ./static

ENV ATLAS_DATA=/tmp/atlas-data PYTHONUNBUFFERED=1
RUN useradd --create-home atlas && mkdir -p /tmp/atlas-data && chown atlas /tmp/atlas-data
USER atlas

# --proxy-headers: Render terminates HTTPS in front of the app; trust its X-Forwarded-Proto so cookies are Secure.
CMD uvicorn app.server:app --host 0.0.0.0 --port ${PORT:-8000} --proxy-headers --forwarded-allow-ips="*"

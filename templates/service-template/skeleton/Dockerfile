FROM mcr.microsoft.com/azurelinux/base/python:3.12 AS base
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app ./app
# Non-root by default. The platform's admission policy rejects images
# that run as uid 0, so this is not something a team can forget.
RUN useradd -u 10001 -r service && chown -R service /app
USER 10001
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

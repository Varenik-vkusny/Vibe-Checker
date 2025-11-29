FROM python:3.13-slim

WORKDIR /app

ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

RUN pip install --upgrade pip

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

RUN playwright install chromium --with-deps

COPY . .

CMD [ "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000" ]
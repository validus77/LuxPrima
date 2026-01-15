# Use Playwright image to ensure browsers are compatible
# This image contains Playwright v1.41.0 and its browsers pre-installed
FROM mcr.microsoft.com/playwright/python:v1.41.0-jammy

# Optimization: Use the browsers already baked into the image (/ms-playwright)
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

WORKDIR /app

# Step 1: Upgrade pip to the latest version. 
# We use a cache mount to speed up subsequent builds on the server.
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --no-cache-dir --upgrade pip

# Step 2: Install Python dependencies inline.
# By forcing FastAPI >= 0.111.0, we break the resolver loop that was pulling in 0.109.2.
# Playwright is pinned to 1.41.0 to match the pre-installed system browsers.
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --no-cache-dir \
    "fastapi>=0.111.0" \
    "uvicorn[standard]" \
    "sqlalchemy" \
    "pydantic-settings" \
    "python-multipart" \
    "playwright==1.41.0" \
    "beautifulsoup4" \
    "readability-lxml" \
    "lxml_html_clean" \
    "requests" \
    "aiohttp" \
    "duckduckgo-search" \
    "openai>=1.30.0" \
    "google-generativeai>=0.7.0" \
    "typing-extensions>=4.10.0" \
    "apscheduler" \
    "pytz" \
    "tzdata" \
    "markdown"

# Copy App
COPY . .

# Run application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

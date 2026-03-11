# Sales Insight Automator

AI-powered sales analytics platform that generates executive summaries from uploaded sales datasets and delivers them via email.

![Tech Stack](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white)
![Tech Stack](https://img.shields.io/badge/Next.js-000?style=flat&logo=next.js&logoColor=white)
![Tech Stack](https://img.shields.io/badge/Groq-orange?style=flat)
![Tech Stack](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)

---

## Architecture

```
┌──────────────┐        ┌──────────────┐       ┌───────────┐
│              │  POST   │              │       │           │
│   Next.js    │───────▶│   FastAPI    │──────▶│  Groq AI  │
│   Frontend   │        │   Backend    │       │  Llama3   │
│              │◀───────│              │──┐    │           │
└──────────────┘  JSON   └──────────────┘  │    └───────────┘
                                           │
                                           │    ┌───────────┐
                                           └───▶│  SMTP    │
                                                │  Email    │
                                                └───────────┘
```

## Project Structure

```
sales-insight-automator/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entry point
│   │   ├── config.py            # Environment configuration
│   │   ├── routes/
│   │   │   └── analyze.py       # POST /analyze endpoint
│   │   ├── services/
│   │   │   ├── ai_engine.py     # Groq LLM integration
│   │   │   ├── data_processor.py# Pandas data parsing
│   │   │   └── email_service.py # SMTP email delivery
│   │   └── utils/
│   │       ├── rate_limiter.py  # SlowAPI rate limiting
│   │       └── validators.py    # File validation
│   └── requirements.txt
├── frontend/
│   ├── components/
│   │   ├── SalesForm.tsx        # Main form component
│   │   └── ui/                  # ShadCN UI primitives
│   ├── pages/
│   │   ├── _app.tsx
│   │   └── index.tsx
│   ├── services/
│   │   └── api.ts               # Axios API client
│   ├── styles/globals.css
│   └── package.json
├── .github/workflows/ci.yml
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 20+
- Docker & Docker Compose (optional)
- API keys: [Groq](https://console.groq.com/)
- SMTP credentials (Gmail App Password, or any SMTP provider)

### 1. Clone & configure

```bash
git clone https://github.com/your-org/sales-insight-automator.git
cd sales-insight-automator
cp .env.example .env
# Edit .env with your actual API keys
```

### 2a. Run with Docker (recommended)

```bash
docker compose up --build
```

- Frontend → http://localhost:3000
- Backend → http://localhost:8000
- API docs → http://localhost:8000/docs

### 2b. Run locally

**Backend:**

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

---

## API Reference

### `POST /analyze`

Upload a sales dataset and receive an AI-generated executive summary.

**Content-Type:** `multipart/form-data`

| Field   | Type   | Description                   |
| ------- | ------ | ----------------------------- |
| `file`  | File   | CSV or XLSX (max 5 MB)        |
| `email` | string | Recipient email for the report |

**Example request (cURL):**

```bash
curl -X POST http://localhost:8000/analyze \
  -F "file=@sales_data.csv" \
  -F "email=ceo@company.com"
```

**Success response:**

```json
{
  "success": true,
  "summary": "Executive Summary:\n\nBased on the sales data analysis...",
  "metrics": {
    "total_revenue": 1250000.50,
    "top_region": "North America",
    "top_category": "Electronics",
    "total_units_sold": 45230,
    "cancelled_orders": 312,
    "cancellation_rate": 2.45
  }
}
```

### `GET /health`

Returns `{"status": "healthy"}`.

---

## Required CSV/XLSX Columns

The processor auto-detects common column name formats. The reference dataset uses:

| Column             | Required | Aliases Accepted         | Example        |
| ------------------ | -------- | ------------------------ | -------------- |
| `Revenue`          | Yes      | `revenue`                | 180000         |
| `Region`           | Yes      | `region`                 | North          |
| `Product_Category` | Yes      | `category`, `product`    | Electronics    |
| `Units_Sold`       | Yes      | `units_sold`             | 150            |
| `Status`           | Yes      | `status`                 | Shipped / Cancelled |
| `Date`             | No       | `date`, `order_date`     | 2026-01-05     |
| `Unit_Price`       | No       | `unit_price`             | 1200           |

**Reference test file** (`sample_sales_data.csv`) is included in the repo.

---

## Example Email Output

**Subject:** Sales Insight Report — Executive Summary

```
📊 Sales Insight Report
──────────────────────

Executive Summary:

Based on the analysis of your sales data, total revenue reached
$1,250,000.50, driven primarily by the North America region.
Electronics remains the top-performing category.

Key Insights:
• North America accounts for 42% of total revenue
• Electronics category leads with strong unit volume
• Cancellation rate of 2.45% is within healthy range

Strategic Recommendations:
1. Double down on North America marketing spend
2. Expand Electronics product line
3. Investigate cancellation root causes for further reduction

──────────────────────
Generated by Sales Insight Automator
```

---

## Security — How Endpoints Are Secured

The API implements defense-in-depth with multiple security layers:

| Layer                | Implementation                     | Details |
| -------------------- | ---------------------------------- | ------- |
| **Rate Limiting**    | SlowAPI (per-IP)                   | Global: 60 req/min. `/analyze`: 10 req/min. Prevents brute-force and resource abuse. |
| **File Validation**  | Extension + size whitelist          | Only `.csv`/`.xlsx` accepted. Hard 5 MB limit enforced server-side before processing. |
| **Email Validation** | Pydantic `EmailStr`                | RFC-compliant email validation. Returns HTTP 422 for invalid emails. |
| **CORS Protection**  | FastAPI CORSMiddleware             | Only explicitly allowed origins can call the API. Configured via `ALLOWED_ORIGINS` env var. |
| **Input Sanitization** | html.escape on AI output         | AI-generated content is HTML-escaped before insertion into email templates to prevent XSS. |
| **Secrets Management** | Environment variables            | API keys loaded from `.env` at runtime. Never committed to source control (`.gitignore`). |
| **Dependency Pinning** | Exact versions in requirements.txt | All Python packages pinned to prevent supply-chain attacks from upstream updates. |

---

## Deployment

### Frontend → Vercel

1. Push the repo to GitHub.
2. Import the project in [Vercel](https://vercel.com/).
3. Set **Root Directory** to `frontend`.
4. Add environment variable:
   - `NEXT_PUBLIC_API_URL` = your Render backend URL (e.g. `https://sales-insight-api.onrender.com`)

### Backend → Render

1. Create a new **Web Service** on [Render](https://render.com/).
2. Connect your GitHub repo.
3. Settings:
   - **Root Directory:** (leave blank — Dockerfile is at root)
   - **Environment:** Docker
   - **Docker Command:** (auto-detected from Dockerfile)
4. Add environment variables:
   - `GROQ_API_KEY`
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_USER`
   - `SMTP_PASSWORD`
   - `SMTP_FROM_EMAIL`
   - `ALLOWED_ORIGINS` = your Vercel frontend URL

---

## CI/CD

GitHub Actions runs on every PR and push to `main`:

1. **Backend** – Install deps → Ruff linter → Verify imports
2. **Docker** – Build the image
3. **Frontend** – Install deps → Lint → Build

---

## License

MIT

import httpx
from fastapi import HTTPException

from app.config import GROQ_API_KEY
from app.services.data_processor import SalesMetrics

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
MODEL = "llama-3.3-70b-versatile"


def _build_prompt(metrics: SalesMetrics) -> str:
    return (
        "You are a senior sales analyst.\n\n"
        "Analyze the following sales metrics and write a concise executive summary "
        "suitable for executive leadership.\n\n"
        f"Metrics:\n"
        f"Total Revenue: ${metrics.total_revenue:,.2f}\n"
        f"Top Region: {metrics.top_region}\n"
        f"Top Category: {metrics.top_category}\n"
        f"Total Units Sold: {metrics.total_units_sold:,}\n"
        f"Cancelled Orders: {metrics.cancelled_orders:,} ({metrics.cancellation_rate}%)\n\n"
        "Provide:\n"
        "- Key insights\n"
        "- Trends\n"
        "- Strategic recommendations"
    )


async def generate_summary(metrics: SalesMetrics) -> str:
    """Call Groq Llama3-70B and return the executive summary."""
    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is not configured.")

    prompt = _build_prompt(metrics)

    async with httpx.AsyncClient(timeout=60) as client:
        response = await client.post(
            GROQ_URL,
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.5,
                "max_tokens": 1024,
            },
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail=f"Groq API error ({response.status_code}): {response.text}",
        )

    data = response.json()
    return data["choices"][0]["message"]["content"]

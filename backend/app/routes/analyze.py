import logging
import traceback

from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile
from pydantic import EmailStr, ValidationError
from pydantic import BaseModel as _BaseModel

from app.services.ai_engine import generate_summary
from app.services.data_processor import extract_metrics, parse_dataframe
from app.services.email_service import send_email
from app.utils.rate_limiter import limiter
from app.utils.validators import validate_file

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Analysis"])


class _EmailCheck(_BaseModel):
    email: EmailStr


@router.post(
    "/analyze",
    summary="Analyze sales data and email executive summary",
    response_description="AI-generated executive summary with key metrics",
)
@limiter.limit("10/minute")
async def analyze(
    request: Request,
    file: UploadFile = File(..., description="Sales dataset (.csv or .xlsx, max 5 MB)"),
    email: str = Form(..., description="Recipient email address for the report"),
):
    """
    Upload a CSV/XLSX sales dataset and a recipient email.

    **Required CSV columns:** `Revenue`, `Region`, `Category` (or `Product_Category`), `Units_Sold`, `Status`

    **Processing steps:**
    1. Validates file type and size (max 5 MB)
    2. Validates email format
    3. Parses data and extracts key sales metrics
    4. Sends metrics to Groq LLM for AI-powered executive summary
    5. Emails the summary to the specified recipient via SMTP

    **Returns:** JSON with `success`, `summary`, and `metrics`.
    """
    # --- Validate email ---
    try:
        _EmailCheck(email=email)
    except ValidationError:
        raise HTTPException(status_code=422, detail="Invalid email address.")

    try:
        # --- Validate & read file ---
        logger.info("Validating file...")
        file_bytes = await validate_file(file)

        # --- Process data ---
        logger.info("Parsing dataframe...")
        df = parse_dataframe(file_bytes, file.filename or "data.csv")
        logger.info("Extracting metrics...")
        metrics = extract_metrics(df)

        # --- Generate AI summary ---
        logger.info("Calling Groq API...")
        summary = await generate_summary(metrics)
        logger.info("Groq API returned successfully.")

        # --- Send email ---
        logger.info("Sending email to %s...", email)
        await send_email(email, summary)
        logger.info("Email sent successfully.")

        return {
            "success": True,
            "summary": summary,
            "metrics": {
                "total_revenue": metrics.total_revenue,
                "top_region": metrics.top_region,
                "top_category": metrics.top_category,
                "total_units_sold": metrics.total_units_sold,
                "cancelled_orders": metrics.cancelled_orders,
                "cancellation_rate": metrics.cancellation_rate,
            },
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Unhandled error in /analyze: %s\n%s", exc, traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Internal error: {exc}")

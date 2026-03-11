import io
from dataclasses import dataclass

import pandas as pd
from fastapi import HTTPException

# Maps common alternate column names to our canonical names
_COLUMN_ALIASES: dict[str, str] = {
    "product_category": "category",
    "productcategory": "category",
    "product": "category",
    "unit_price": "unit_price",
    "unitprice": "unit_price",
    "date": "date",
    "order_date": "date",
}


@dataclass
class SalesMetrics:
    total_revenue: float
    top_region: str
    top_category: str
    total_units_sold: int
    cancelled_orders: int
    cancellation_rate: float


def parse_dataframe(file_bytes: bytes, filename: str) -> pd.DataFrame:
    """Read raw bytes into a pandas DataFrame."""
    try:
        if filename.lower().endswith(".csv"):
            return pd.read_csv(io.BytesIO(file_bytes))
        return pd.read_excel(io.BytesIO(file_bytes))
    except Exception as exc:
        raise HTTPException(
            status_code=400, detail=f"Failed to parse file: {exc}"
        ) from exc


def _normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Normalize column names and apply alias mapping."""
    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]
    df.rename(columns=_COLUMN_ALIASES, inplace=True)
    return df


def extract_metrics(df: pd.DataFrame) -> SalesMetrics:
    """Compute key sales metrics from the dataframe."""
    df = _normalize_columns(df)

    required = {"revenue", "region", "category", "units_sold", "status"}
    missing = required - set(df.columns)
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Missing required columns: {', '.join(sorted(missing))}. "
            f"Expected: {', '.join(sorted(required))}. "
            f"Detected columns: {', '.join(sorted(df.columns))}",
        )

    total_revenue = round(float(df["revenue"].sum()), 2)
    top_region = str(df.groupby("region")["revenue"].sum().idxmax())
    top_category = str(df.groupby("category")["revenue"].sum().idxmax())
    total_units_sold = int(df["units_sold"].sum())
    cancelled_orders = int(
        df["status"].str.strip().str.lower().eq("cancelled").sum()
    )
    total_orders = len(df)
    cancellation_rate = round(
        (cancelled_orders / total_orders * 100) if total_orders else 0, 2
    )

    return SalesMetrics(
        total_revenue=total_revenue,
        top_region=top_region,
        top_category=top_category,
        total_units_sold=total_units_sold,
        cancelled_orders=cancelled_orders,
        cancellation_rate=cancellation_rate,
    )

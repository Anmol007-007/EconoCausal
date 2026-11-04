from __future__ import annotations
import re
import pandas as pd

DANGEROUS_FORMULA_PREFIXES = ("=", "+", "-", "@", "\t", "\r")

def sanitize_csv_data(df: pd.DataFrame) -> pd.DataFrame:
    cleaned_df = df.copy()
    for col in cleaned_df.select_dtypes(include=["object", "string"]).columns:
        cleaned_df[col] = cleaned_df[col].apply(
            lambda val: f"'{val}" if isinstance(val, str) and val.startswith(DANGEROUS_FORMULA_PREFIXES) else val
        )
    return cleaned_df

def validate_filename(filename: str) -> bool:
    if not filename:
        return False
    lower = filename.lower()
    return lower.endswith(".csv") or lower.endswith(".parquet")


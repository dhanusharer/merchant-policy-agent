"""Typed Application Configuration using Pydantic Settings."""

from typing import Optional
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings with environment variable fallbacks."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    APP_ENV: str = Field(default="development", description="Application runtime environment")
    LOG_LEVEL: str = Field(default="INFO", description="Logging level")
    DATABASE_URL: str = Field(
        default="sqlite+aiosqlite:///./test.db",
        description="Async database connection string"
    )

    RAZORPAY_KEY_ID: str = Field(
        default="rzp_test_placeholder_key_id",
        description="Razorpay API Key ID"
    )
    RAZORPAY_KEY_SECRET: str = Field(
        default="placeholder_key_secret",
        description="Razorpay API Key Secret"
    )
    RAZORPAY_WEBHOOK_SECRET: str = Field(
        default="placeholder_webhook_secret",
        description="Razorpay Webhook Shared Secret"
    )

    @field_validator("RAZORPAY_KEY_ID")
    @classmethod
    def validate_test_key_prefix(cls, v: str, info) -> str:
        """Ensure test credentials are used in non-production environments."""
        if v and not v.startswith("rzp_test_") and not v.startswith("test_"):
            # Allow mock prefixes for local tests, but warn/prevent live keys
            if "live" in v.lower():
                raise ValueError("Live Razorpay keys are prohibited in Test Mode environments.")
        return v

    def sanitized_dict(self) -> dict:
        """Return configuration dictionary with masked secrets for safe logging."""
        data = self.model_dump()
        for secret_key in ("RAZORPAY_KEY_SECRET", "RAZORPAY_WEBHOOK_SECRET"):
            if secret_key in data and data[secret_key]:
                data[secret_key] = "******"
        return data


# Global singleton instance
settings = Settings()

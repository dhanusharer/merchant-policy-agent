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

    # WhatsApp Business Platform / Cloud API Configuration
    WHATSAPP_ACCESS_TOKEN: str = Field(
        default="",
        description="Meta WhatsApp Cloud API Access Token"
    )
    WHATSAPP_PHONE_NUMBER_ID: str = Field(
        default="",
        description="Meta Sender Phone Number ID"
    )
    WHATSAPP_BUSINESS_ACCOUNT_ID: str = Field(
        default="",
        description="Meta WhatsApp Business Account ID"
    )
    WHATSAPP_VERIFY_TOKEN: str = Field(
        default="vastram_growth_agent_verify_2026",
        description="Meta Webhook Verification Challenge Token"
    )
    WHATSAPP_APP_SECRET: str = Field(
        default="",
        description="Meta App Secret for X-Hub-Signature-256 HMAC validation"
    )
    WHATSAPP_TEST_MERCHANT_PHONE: str = Field(
        default="+919113960498",
        description="Configured test recipient phone number"
    )
    WHATSAPP_DEFAULT_MERCHANT_ID: str = Field(
        default="merch_atlas_travel",
        description="Default merchant tenant associated with test phone"
    )
    WHATSAPP_API_VERSION: str = Field(
        default="v21.0",
        description="Meta Graph API version"
    )

    # Twilio WhatsApp Sandbox Alternative Configuration
    TWILIO_ACCOUNT_SID: str = Field(
        default="",
        description="Twilio Account SID"
    )
    TWILIO_AUTH_TOKEN: str = Field(
        default="",
        description="Twilio Auth Token for webhook signature validation"
    )
    TWILIO_WHATSAPP_NUMBER: str = Field(
        default="whatsapp:+14155238886",
        description="Twilio Sandbox WhatsApp Number"
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
        for secret_key in ("RAZORPAY_KEY_SECRET", "RAZORPAY_WEBHOOK_SECRET", "WHATSAPP_ACCESS_TOKEN", "WHATSAPP_APP_SECRET", "TWILIO_AUTH_TOKEN"):
            if secret_key in data and data[secret_key]:
                data[secret_key] = "******"
        return data


# Global singleton instance
settings = Settings()


def get_settings() -> Settings:
    """Dependency helper returning global application settings."""
    return settings

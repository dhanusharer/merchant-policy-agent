"""Unit tests for WhatsApp Web Connector API Endpoint (/api/v1/whatsapp/connector-inbound)."""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from decimal import Decimal

from domain.models import Merchant, Product


@pytest.fixture
async def connector_merchant(db_session: AsyncSession):
    """Seed test merchant and products for connector tests."""
    merchant = Merchant(
        id="merch_atlas_travel",
        name="Vastram",
        currency="INR",
        status="ACTIVE",
        business_objective="BALANCE_REVENUE_AND_MARGIN",
        minimum_margin_percent=Decimal("18.00"),
        maximum_discount_percent=Decimal("10.00"),
        target_aov_paise=250000
    )
    db_session.add(merchant)

    prod_a = Product(
        id="prod_vastram_shirt_linen",
        merchant_id=merchant.id,
        name="Vastram Pure Olive Linen Casual Shirt",
        sku="VAST-SH-03",
        category="Shirts",
        price_paise=249900,
        cost_paise=92000,
        inventory_quantity=45,
        reserved_quantity=0,
        is_active=True
    )
    prod_b = Product(
        id="prod_vastram_trouser_black",
        merchant_id=merchant.id,
        name="Vastram Classic Jet Black Formal Trousers",
        sku="VAST-TR-03",
        category="Trousers",
        price_paise=160000,
        cost_paise=79000,
        inventory_quantity=6,
        reserved_quantity=0,
        is_active=True
    )
    db_session.add_all([prod_a, prod_b])
    await db_session.commit()
    return merchant


@pytest.mark.asyncio
async def test_connector_sales_report(client: AsyncClient, connector_merchant):
    """Verify connector sales report request returns 200 and real financial figures."""
    resp = await client.post(
        "/api/v1/whatsapp/connector-inbound",
        json={
            "sender_phone": "+919113960498",
            "message_text": "Download the previous week sales report",
            "message_id": "test_msg_sales_01"
        }
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert data["intent"] == "SALES_REPORT"
    assert "Executive Sales & Revenue Report" in data["reply"]
    assert "Realized Revenue" in data["reply"]


@pytest.mark.asyncio
async def test_connector_show_products(client: AsyncClient, connector_merchant):
    """Verify 'Show my products' lists active products with margin and inventory."""
    resp = await client.post(
        "/api/v1/whatsapp/connector-inbound",
        json={
            "sender_phone": "+919113960498",
            "message_text": "Show my products",
            "message_id": "test_msg_catalog_01"
        }
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert data["intent"] == "CATALOG_LIST"
    assert "Active Catalog Products" in data["reply"]
    assert "Vastram Pure Olive Linen Casual Shirt" in data["reply"]
    assert "Gross Margin" in data["reply"]


@pytest.mark.asyncio
async def test_connector_low_margins(client: AsyncClient, connector_merchant):
    """Verify 'Which products have low margins?' evaluates margins against policy floor."""
    resp = await client.post(
        "/api/v1/whatsapp/connector-inbound",
        json={
            "sender_phone": "+919113960498",
            "message_text": "Which products have low margins?",
            "message_id": "test_msg_margin_01"
        }
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert data["intent"] == "LOW_MARGIN_QUERY"
    assert "Catalog Margin Economics" in data["reply"]
    assert "AI Growth Recommendation" in data["reply"]


@pytest.mark.asyncio
async def test_connector_offer_suggestion(client: AsyncClient, connector_merchant):
    """Verify 'Suggest an offer for Product A' recommends policy-safe discount."""
    resp = await client.post(
        "/api/v1/whatsapp/connector-inbound",
        json={
            "sender_phone": "+919113960498",
            "message_text": "Suggest an offer for Product A",
            "message_id": "test_msg_offer_01"
        }
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert data["intent"] == "RECOMMENDATION_REQUEST"
    assert "AI Promotional Offer Recommendation" in data["reply"]
    assert "OFF" in data["reply"]


@pytest.mark.asyncio
async def test_connector_stock_update_guardrail(client: AsyncClient, connector_merchant):
    """Verify 'Update Product A stock to 25' creates confirmation token."""
    resp = await client.post(
        "/api/v1/whatsapp/connector-inbound",
        json={
            "sender_phone": "+919113960498",
            "message_text": "Update Product A stock to 25",
            "message_id": "test_msg_stock_01"
        }
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert data["intent"] == "INVENTORY_SET"
    assert "Confirm Inventory Adjustment" in data["reply"]
    assert "CONFIRM" in data["reply"] or "YES" in data["reply"]


@pytest.mark.asyncio
async def test_connector_price_change_policy_violation(client: AsyncClient, connector_merchant):
    """Verify 'Change Product A price to 499' triggers policy violation and gives compliant price."""
    resp = await client.post(
        "/api/v1/whatsapp/connector-inbound",
        json={
            "sender_phone": "+919113960498",
            "message_text": "Change Product A price to 499",
            "message_id": "test_msg_price_01"
        }
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert data["intent"] == "PRICE_UPDATE"
    assert "Policy Guard Alert" in data["reply"]
    assert "Compliant Alternative" in data["reply"]


@pytest.mark.asyncio
async def test_connector_deduplication(client: AsyncClient, connector_merchant):
    """Verify duplicate message_id is ignored by connector endpoint."""
    payload = {
        "sender_phone": "+919113960498",
        "message_text": "Show my products",
        "message_id": "duplicate_test_msg_99"
    }
    resp1 = await client.post("/api/v1/whatsapp/connector-inbound", json=payload)
    assert resp1.status_code == 200
    assert resp1.json()["status"] == "success"

    resp2 = await client.post("/api/v1/whatsapp/connector-inbound", json=payload)
    assert resp2.status_code == 200
    assert resp2.json()["status"] == "duplicate"

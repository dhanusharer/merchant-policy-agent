"""FastAPI Router for Merchant Commerce & Agent Context Operations."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.core.database import get_db
from services.commerce_service import (
    CommerceService,
    MerchantNotFoundError,
    ProductNotFoundError,
    DuplicateSkuError,
    InvalidRelationshipError,
    CommerceServiceError
)
from domain.commerce_schemas import (
    MerchantCreateRequest,
    MerchantResponse,
    ProductCreateRequest,
    ProductUpdateRequest,
    ProductResponse,
    RelationshipCreateRequest,
    RelationshipResponse,
    ConstraintsUpdateRequest,
    PrioritiesUpdateRequest,
    PrioritiesResponse,
    MerchantCommerceContext
)

router = APIRouter(prefix="/api/v1/merchants", tags=["Merchant Commerce"])


def get_commerce_service() -> CommerceService:
    return CommerceService()


@router.post("", response_model=MerchantResponse, status_code=status.HTTP_201_CREATED)
async def create_merchant(
    req: MerchantCreateRequest,
    db: AsyncSession = Depends(get_db),
    commerce_svc: CommerceService = Depends(get_commerce_service)
):
    """Register a new merchant tenant with commercial objectives and constraints."""
    try:
        merchant = await commerce_svc.create_merchant(db, req)
        return merchant
    except CommerceServiceError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.get("/{merchant_id}", response_model=MerchantResponse)
async def get_merchant(
    merchant_id: str,
    db: AsyncSession = Depends(get_db),
    commerce_svc: CommerceService = Depends(get_commerce_service)
):
    """Retrieve merchant tenant profile."""
    merchant = await commerce_svc.get_merchant(db, merchant_id)
    if not merchant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Merchant '{merchant_id}' not found")
    return merchant


@router.put("/{merchant_id}/constraints", response_model=MerchantResponse)
async def update_merchant_constraints(
    merchant_id: str,
    req: ConstraintsUpdateRequest,
    db: AsyncSession = Depends(get_db),
    commerce_svc: CommerceService = Depends(get_commerce_service)
):
    """Update merchant financial guardrail constraints."""
    try:
        merchant = await commerce_svc.update_merchant_constraints(db, merchant_id, req)
        return merchant
    except MerchantNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.put("/{merchant_id}/priorities", response_model=PrioritiesResponse)
async def update_merchant_priorities(
    merchant_id: str,
    req: PrioritiesUpdateRequest,
    db: AsyncSession = Depends(get_db),
    commerce_svc: CommerceService = Depends(get_commerce_service)
):
    """Update merchant product, category, and clearance priorities."""
    try:
        priorities = await commerce_svc.set_merchant_priorities(db, merchant_id, req)
        return priorities
    except MerchantNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.post("/{merchant_id}/products", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    merchant_id: str,
    req: ProductCreateRequest,
    db: AsyncSession = Depends(get_db),
    commerce_svc: CommerceService = Depends(get_commerce_service)
):
    """Add a new product with unit economics and inventory stock to the catalog."""
    try:
        product = await commerce_svc.create_product(db, merchant_id, req)
        # Fetch full context/response with economics
        context = await commerce_svc.get_merchant_commerce_context(db, merchant_id)
        for p in context.products:
            if p.id == product.id:
                return p
        return product
    except MerchantNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except DuplicateSkuError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    except CommerceServiceError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.patch("/{merchant_id}/products/{product_id}", response_model=ProductResponse)
async def update_product(
    merchant_id: str,
    product_id: str,
    req: ProductUpdateRequest,
    db: AsyncSession = Depends(get_db),
    commerce_svc: CommerceService = Depends(get_commerce_service)
):
    """Update an existing product's price, cost, inventory, or attributes."""
    try:
        await commerce_svc.update_product(db, merchant_id, product_id, req)
        context = await commerce_svc.get_merchant_commerce_context(db, merchant_id)
        for p in context.products:
            if p.id == product_id:
                return p
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Product '{product_id}' not found")
    except ProductNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except CommerceServiceError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.get("/{merchant_id}/products", response_model=List[ProductResponse])
async def list_products(
    merchant_id: str,
    active_only: bool = False,
    db: AsyncSession = Depends(get_db),
    commerce_svc: CommerceService = Depends(get_commerce_service)
):
    """List catalog products with computed unit economics and stock availability."""
    try:
        context = await commerce_svc.get_merchant_commerce_context(db, merchant_id)
        if active_only:
            return [p for p in context.products if p.is_active]
        return context.products
    except MerchantNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.post("/{merchant_id}/relationships", response_model=RelationshipResponse, status_code=status.HTTP_201_CREATED)
async def create_product_relationship(
    merchant_id: str,
    req: RelationshipCreateRequest,
    db: AsyncSession = Depends(get_db),
    commerce_svc: CommerceService = Depends(get_commerce_service)
):
    """Define a commercial relationship (complementary, substitute, bundle component)."""
    try:
        rel = await commerce_svc.create_product_relationship(db, merchant_id, req)
        return rel
    except ProductNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except InvalidRelationshipError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.get("/{merchant_id}/commerce-context", response_model=MerchantCommerceContext)
async def get_merchant_commerce_context(
    merchant_id: str,
    db: AsyncSession = Depends(get_db),
    commerce_svc: CommerceService = Depends(get_commerce_service)
):
    """Retrieve the single unified commercial knowledge context for this merchant.

    This is the core context boundary consumed by the Policy Agent.
    """
    try:
        context = await commerce_svc.get_merchant_commerce_context(db, merchant_id)
        return context
    except MerchantNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))

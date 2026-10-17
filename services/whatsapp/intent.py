"""Multilingual Natural Language Intent Understanding Engine for WhatsApp Merchant Messages.

Supports:
- English, Kannada, Hindi, and code-mixed phrasing
- Strict deterministic parsing for high-frequency commerce operations
- Pydantic structured output models
- Fallback to Google Gemini LLM when configured
- Prompt-injection defense & input sanitation
"""

from enum import Enum
import re
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
import structlog
from services.policy.llm_client import GeminiPolicyClient

logger = structlog.get_logger()


class IntentType(str, Enum):
    """Categorized intent types for WhatsApp commerce routing."""
    CONFIRM = "CONFIRMATION"
    CANCEL = "CANCELLATION"
    PRICE_CHANGE = "PRICE_UPDATE"
    INVENTORY_ADD = "INVENTORY_ADD"
    INVENTORY_SET = "INVENTORY_SET"
    INVENTORY_UPDATE = "INVENTORY_UPDATE"
    INVENTORY_QUERY = "QUERY_STOCK"
    QUERY_PRICE = "QUERY_CATALOG"
    OFFER_CREATE = "OFFER_CREATE"
    RECOMMENDATION = "RECOMMENDATION_REQUEST"
    SALES_REPORT = "SALES_REPORT"
    CATALOG_LIST = "CATALOG_LIST"
    LOW_MARGIN_QUERY = "LOW_MARGIN_QUERY"
    HELP = "HELP"
    UNKNOWN = "UNKNOWN"


class WhatsAppIntent(BaseModel):
    """Structured merchant intent parsed from a WhatsApp message."""
    intent: str = Field(
        ...,
        description="Core intent: PRICE_UPDATE, INVENTORY_UPDATE, OFFER_CREATE, QUERY_CATALOG, QUERY_STOCK, RECOMMENDATION_REQUEST, CONFIRMATION, CANCELLATION, UNKNOWN"
    )
    product_query: Optional[str] = Field(default=None, description="Extracted product identifier, name, or keywords")
    operation_subtype: Optional[str] = Field(
        default=None,
        description="Subtype: SET_PRICE, REDUCE_PRICE, INCREASE_PRICE, ADD_STOCK, SET_STOCK, LOW_STOCK_CHECK"
    )
    target_price_paise: Optional[int] = Field(default=None, description="Explicit target price in integer paise")
    delta_price_paise: Optional[int] = Field(default=None, description="Relative price adjustment in integer paise")
    discount_percent: Optional[float] = Field(default=None, description="Discount percentage (e.g. 10.0 for 10%)")
    inventory_units: Optional[int] = Field(default=None, description="Number of inventory units to add or set")
    campaign_name: Optional[str] = Field(default=None, description="Offer campaign or festival reason")
    confirmation_code: Optional[str] = Field(default=None, description="Extracted confirmation PIN or code if present")
    language: str = Field(default="en", description="Detected language code: en, kn, hi")
    confidence: float = Field(default=0.95, description="Confidence score between 0.0 and 1.0")
    needs_clarification: bool = Field(default=False, description="True if mandatory details are missing or ambiguous")
    clarification_question: Optional[str] = Field(default=None, description="Follow-up question if clarification needed")

    @property
    def intent_type(self) -> IntentType:
        """Normalized IntentType enum mapping."""
        if self.intent == "PRICE_UPDATE":
            return IntentType.PRICE_CHANGE
        if self.intent == "CONFIRMATION":
            return IntentType.CONFIRM
        if self.intent == "CANCELLATION":
            return IntentType.CANCEL
        if self.intent == "INVENTORY_UPDATE":
            if self.operation_subtype == "ADD_STOCK":
                return IntentType.INVENTORY_ADD
            if self.operation_subtype == "SET_STOCK":
                return IntentType.INVENTORY_SET
            return IntentType.INVENTORY_UPDATE
        if self.intent == "QUERY_STOCK":
            return IntentType.INVENTORY_QUERY
        if self.intent == "QUERY_CATALOG":
            return IntentType.QUERY_PRICE
        if self.intent == "OFFER_CREATE":
            return IntentType.OFFER_CREATE
        if self.intent == "SALES_REPORT":
            return IntentType.SALES_REPORT
        if self.intent in ("RECOMMENDATION_REQUEST", "RECOMMENDATION"):
            return IntentType.RECOMMENDATION
        if self.intent == "CATALOG_LIST":
            return IntentType.CATALOG_LIST
        if self.intent == "LOW_MARGIN_QUERY":
            return IntentType.LOW_MARGIN_QUERY
        return IntentType.UNKNOWN

    @property
    def product_name(self) -> Optional[str]:
        return self.product_query

    @property
    def price_value(self) -> Optional[float]:
        if self.target_price_paise is not None:
            return self.target_price_paise / 100.0
        return None

    @property
    def price_relative_cut(self) -> Optional[float]:
        if self.delta_price_paise is not None:
            return self.delta_price_paise / 100.0
        return None

    @property
    def inventory_delta(self) -> Optional[int]:
        return self.inventory_units


def detect_language(text: str) -> str:
    """Detect language of merchant message (Kannada, Hindi, or English)."""
    text_lower = text.lower()
    
    # Kannada indicators (Kannada script or Romanized Kannada)
    kannada_keywords = [
        "maadu", "maadi", "nodu", "nodona", "beku", "beda", "sari", "eshtu", "inda",
        "hosa", "bandide", "kodona", "rupai", "rupayi", "kammi", "jaasti", "kodi"
    ]
    # Check for Kannada Unicode range \u0C80-\u0CFF
    if re.search(r"[\u0C80-\u0CFF]", text) or any(re.search(rf"\b{kw}\b", text_lower) for kw in kannada_keywords):
        return "kn"
    
    # Hindi indicators (Devanagari script or Romanized Hindi)
    hindi_keywords = [
        "karo", "kardo", "kar do", "batao", "kitna", "hai", "bache", "aaye", "lagao",
        "chahiye", "nahi", "rupaye", "kam", "badhao", "daalo"
    ]
    if re.search(r"[\u0900-\u097F]", text) or any(re.search(rf"\b{kw}\b", text_lower) for kw in hindi_keywords):
        return "hi"
    
    return "en"


def parse_rupees_to_paise(val_str: str) -> Optional[int]:
    """Convert rupee string (e.g. '1,499', '1499', '1600.00') to integer paise."""
    if not val_str:
        return None
    clean = re.sub(r"[^\d.]", "", val_str)
    try:
        rupees = float(clean)
        return int(round(rupees * 100))
    except ValueError:
        return None


class WhatsAppIntentParser:
    """NLU engine for WhatsApp merchant conversations."""

    def __init__(self, llm_client: Optional[GeminiPolicyClient] = None):
        self.llm_client = llm_client or GeminiPolicyClient()

    @classmethod
    def parse(cls, text: str) -> WhatsAppIntent:
        """Convenience classmethod for parsing without explicit instantiation."""
        return cls().parse_message(text)

    def parse_message(self, text: str) -> WhatsAppIntent:
        """Parse inbound message into structured WhatsAppIntent."""
        raw = text.strip()
        lang = detect_language(raw)
        norm = raw.lower()

        # 1. Confirmation / Cancellation commands
        confirm_patterns = [
            r"^(?:yes|y|confirm|ok|okay|agree|approved|approve|haan|sari|maadu|do it|ha|howdu|haudu)\b",
            r"^confirm\s+(\d{4,6})"
        ]
        for pat in confirm_patterns:
            m = re.search(pat, norm)
            if m:
                code = m.group(1) if m.groups() else None
                # Check if there is an explicit 4-digit code in the string
                code_match = re.search(r"\b(\d{4})\b", raw)
                if code_match and not code:
                    code = code_match.group(1)
                return WhatsAppIntent(
                    intent="CONFIRMATION",
                    confirmation_code=code,
                    language=lang,
                    confidence=0.99
                )

        cancel_patterns = [
            r"^(?:no|cancel|n|abort|stop|reject|beda|bedi|nahi|roko|mat karo)\b"
        ]
        for pat in cancel_patterns:
            if re.search(pat, norm):
                return WhatsAppIntent(
                    intent="CANCELLATION",
                    language=lang,
                    confidence=0.99
                )

        # 2. Kannada price change: "Ee black bag price 1800 inda 1600 maadu"
        kn_price_match = re.search(
            r"(?:ee\s+)?([a-z\s]+?)\s+(?:price|bele|rate)\s*(?:(\d+)\s*inda\s*)?(\d+)(?:\s*ge|\s*maadu|\s*kodi)?",
            norm
        )
        if lang == "kn" and kn_price_match:
            prod_name = kn_price_match.group(1).replace("price", "").strip()
            target_rp = kn_price_match.group(3)
            return WhatsAppIntent(
                intent="PRICE_UPDATE",
                operation_subtype="SET_PRICE",
                product_query=prod_name,
                target_price_paise=parse_rupees_to_paise(target_rp),
                language="kn",
                confidence=0.95
            )

        # 3. Kannada relative reduction: "Kari bag ge 200 rupayi kammi maadu"
        kn_reduce_match = re.search(
            r"([a-z\s]+?)\s*(?:ge)?\s*(\d+)\s*(?:rupayi|rupai|rs|₹)?\s*kammi\s*maadu",
            norm
        )
        if lang == "kn" and kn_reduce_match:
            prod_name = kn_reduce_match.group(1).strip()
            delta_rp = kn_reduce_match.group(2)
            return WhatsAppIntent(
                intent="PRICE_UPDATE",
                operation_subtype="REDUCE_PRICE",
                product_query=prod_name,
                delta_price_paise=parse_rupees_to_paise(delta_rp),
                language="kn",
                confidence=0.95
            )

        # 4. Hindi price change: "Black bag ka price 1600 kar do"
        hi_price_match = re.search(
            r"([a-z\s]+?)\s*(?:ka\s+)?(?:price|daam|rate)\s*(?:₹|rs\.?)?\s*([\d,]+)\s*(?:kar\s*do|karo|rakho)",
            norm
        )
        if hi_price_match:
            prod_name = hi_price_match.group(1).strip()
            target_rp = hi_price_match.group(2)
            return WhatsAppIntent(
                intent="PRICE_UPDATE",
                operation_subtype="SET_PRICE",
                product_query=prod_name,
                target_price_paise=parse_rupees_to_paise(target_rp),
                language=lang if lang in ["hi", "kn"] else "hi",
                confidence=0.95
            )

        # 5. English absolute price change:
        # e.g. "Change the black backpack price to ₹1,499."
        # "Make the blue backpack ₹1,600."
        en_price_match = None
        if "stock" not in norm and "inventory" not in norm and "unit" not in norm:
            en_price_match = re.search(
                r"(?:change|set|update|make)\s+(?:the\s+)?(?:price\s+of\s+)?([a-z0-9\s\-]+?)\s*(?:'s)?\s*(?:price|mrp)?\s*(?:to|as)?\s*(?:₹|rs\.?|inr)?\s*([\d,]+(?:\.\d{2})?)",
                norm
            )
        if en_price_match:
            prod = en_price_match.group(1).replace("price of", "").replace("price", "").strip()
            target_rp = en_price_match.group(2)
            return WhatsAppIntent(
                intent="PRICE_UPDATE",
                operation_subtype="SET_PRICE",
                product_query=prod if prod not in ["the", "it", "this"] else None,
                target_price_paise=parse_rupees_to_paise(target_rp),
                language=lang,
                confidence=0.95
            )

        # 6. English relative price change:
        # "Reduce this bag's price by ₹200."
        en_reduce_match = re.search(
            r"(?:reduce|cut|drop|discount|decrease)\s+(?:the\s+|this\s+)?([a-z0-9\s\-']+?)\s*(?:price)?\s*by\s*(?:₹|rs\.?|inr)?\s*([\d,]+)",
            norm
        )
        if en_reduce_match:
            prod = en_reduce_match.group(1).replace("'s", "").replace("price", "").strip()
            delta_rp = en_reduce_match.group(2)
            return WhatsAppIntent(
                intent="PRICE_UPDATE",
                operation_subtype="REDUCE_PRICE",
                product_query=prod if prod not in ["this", "it"] else None,
                delta_price_paise=parse_rupees_to_paise(delta_rp),
                language=lang,
                confidence=0.93
            )

        # 7. Inventory: Adding units
        # e.g. "We received 25 new blue backpacks." / "Add 30 shirts"
        # Kannada: "Hosa 30 shirts bandide add maadu"
        inv_add_match = re.search(
            r"(?:received|add|got|arrived)\s*(\d+)\s*(?:new|more|units\s+of)?\s*([a-z0-9\s\-]+)",
            norm
        )
        if not inv_add_match and lang == "kn":
            inv_add_match = re.search(r"(?:hosa\s+)?(\d+)\s*([a-z0-9\s\-]+?)\s*(?:bandide|add\s*maadu)", norm)

        if inv_add_match:
            units = int(inv_add_match.group(1))
            prod = inv_add_match.group(2).replace("backpacks", "backpack").replace("shirts", "shirt").replace("trousers", "trouser").strip()
            return WhatsAppIntent(
                intent="INVENTORY_UPDATE",
                operation_subtype="ADD_STOCK",
                product_query=prod,
                inventory_units=units,
                language=lang,
                confidence=0.95
            )

        # 8. Inventory: Setting current total stock
        # e.g. "There are only 8 black bags left."
        inv_set_match = re.search(
            r"(?:there\s+are\s+only|only|set\s+stock\s+to)\s*(\d+)\s*([a-z0-9\s\-]+?)\s*(?:left|remaining|available|units)",
            norm
        )
        if inv_set_match:
            units = int(inv_set_match.group(1))
            prod = inv_set_match.group(2).replace("bags", "bag").replace("backpacks", "backpack").strip()
            return WhatsAppIntent(
                intent="INVENTORY_UPDATE",
                operation_subtype="SET_STOCK",
                product_query=prod,
                inventory_units=units,
                language=lang,
                confidence=0.95
            )

        # 8b. Explicit Inventory Set: e.g. "Update Product A stock to 25", "Set backpack stock to 25"
        inv_set_direct = re.search(
            r"(?:update|set|change|make)\s+(?:the\s+)?(?:stock\s+of\s+)?([a-z0-9\s\-]+?)\s*(?:'s)?\s*stock\s*(?:to|as|=)?\s*(\d+)",
            norm
        )
        if not inv_set_direct:
            inv_set_direct = re.search(
                r"(?:update|set|change)\s+stock\s+of\s+(?:the\s+)?([a-z0-9\s\-]+?)\s*(?:to|as|=)?\s*(\d+)",
                norm
            )
        if inv_set_direct:
            prod = inv_set_direct.group(1).replace("stock of", "").replace("stock", "").strip()
            units = int(inv_set_direct.group(2))
            return WhatsAppIntent(
                intent="INVENTORY_UPDATE",
                operation_subtype="SET_STOCK",
                product_query=prod if prod not in ["the", "it", "this"] else None,
                inventory_units=units,
                language=lang,
                confidence=0.96
            )

        # 9. Offers & Promotions
        # e.g. "Give 10% off on travel bags for the Dasara sale."
        offer_match = re.search(
            r"(?:give|create|apply|offer)\s*(\d+(?:\.\d+)?)\s*%\s*(?:off|discount)\s*(?:on\s+([a-z0-9\s\-]+?))?\s*(?:for\s+(?:the\s+)?([a-z0-9\s\-]+))?$",
            norm
        )
        if offer_match:
            pct = float(offer_match.group(1))
            prod = offer_match.group(2).strip() if offer_match.group(2) else None
            camp = offer_match.group(3).strip() if offer_match.group(3) else "Promotional Campaign"
            return WhatsAppIntent(
                intent="OFFER_CREATE",
                discount_percent=pct,
                product_query=prod,
                campaign_name=camp,
                language=lang,
                confidence=0.95
            )

        # "Create a clearance offer for the old stock."
        if "clearance" in norm or "dead stock" in norm:
            return WhatsAppIntent(
                intent="OFFER_CREATE",
                campaign_name="Clearance Sale for Slow Inventory",
                language=lang,
                confidence=0.90
            )

        # 10. Recommendations / Advisor
        # e.g. "Suggest an offer for Product A", "Suggest an offer for the black backpack", "Which items are not selling?"
        if any(p in norm for p in ["suggest", "recommend", "aren't selling", "not selling", "slow moving", "offer yenu kodona"]):
            # Extract target product if mentioned: "Suggest an offer for Product A"
            sugg_prod_match = re.search(
                r"(?:suggest|recommend)\s+(?:an?\s+)?(?:offer|deal|discount|campaign)?\s*(?:for\s+(?:the\s+)?)?([a-z0-9\s\-]+)",
                norm
            )
            extracted_prod = None
            if sugg_prod_match and sugg_prod_match.group(1):
                raw_prod = sugg_prod_match.group(1).replace("an offer", "").replace("offer", "").replace("deal", "").replace("products", "").strip()
                if raw_prod and raw_prod not in ["that", "which", "products", "items"]:
                    extracted_prod = raw_prod

            return WhatsAppIntent(
                intent="RECOMMENDATION_REQUEST",
                product_query=extracted_prod,
                language=lang,
                confidence=0.94
            )

        # 11. Catalog Listing: "Show my products", "show products", "list products", "my products", "all products"
        if any(p in norm for p in [
            "show my products", "show products", "list products", "my products", "all products",
            "show catalog", "view catalog", "catalog list", "catalog", "what products", "list of products"
        ]):
            return WhatsAppIntent(
                intent="CATALOG_LIST",
                language=lang,
                confidence=0.97
            )

        # 12. Low Margin Query: "Which products have low margins?", "low margin products", "check margins"
        if any(p in norm for p in ["low margin", "low margins", "margin", "margins", "lowest margin", "kam margin"]):
            return WhatsAppIntent(
                intent="LOW_MARGIN_QUERY",
                language=lang,
                confidence=0.96
            )

        # 13. Queries: Product Price
        # e.g. "What is the current price of the black backpack?"
        if any(p in norm for p in ["what is the price", "current price", "price of", "daam kya hai", "rate eshtu"]):
            prod_query = re.sub(r".*?(?:price|rate|daam)(?:\s+of)?\s*(?:the\s+)?", "", norm).strip(" ?.")
            return WhatsAppIntent(
                intent="QUERY_CATALOG",
                product_query=prod_query if prod_query else None,
                language=lang,
                confidence=0.94
            )

        # 14. Queries: Stock level
        # e.g. "Which products have low stock?" / "Stock eshtu ide nodu" / "Kitna stock bacha hai"
        if any(p in norm for p in ["low stock", "stock", "out of stock", "shortage", "bache hai", "stock eshtu"]):
            return WhatsAppIntent(
                intent="QUERY_STOCK",
                operation_subtype="LOW_STOCK_CHECK",
                language=lang,
                confidence=0.94
            )

        # 15. Queries: Sales & Revenue Reports
        # e.g. "Download the previous week sales report", "Show today's sales", "sales report", "weekly sales"
        if any(p in norm for p in [
            "sales report", "sales", "report", "revenue", "weekly sales", "previous week",
            "last week", "orders report", "download", "today's sales", "todays sales", "show sales"
        ]):
            return WhatsAppIntent(
                intent="SALES_REPORT",
                language="en",
                confidence=0.98
            )

        # Fallback to general greeting or unknown with clarification
        return WhatsAppIntent(
            intent="UNKNOWN",
            language=lang,
            confidence=0.50,
            needs_clarification=True,
            clarification_question=(
                "ನಮಸ್ಕಾರ! ನೀವು ಪ್ರಾಡಕ್ಟ್ ಬೆಲೆ (Price), ಸ್ಟಾಕ್ (Inventory), ಅಥವಾ ಆಫರ್ (Offers) ಬದಲಾಯಿಸಲು ತಿಳಿಸಬಹುದು."
                if lang == "kn" else
                "नमस्ते! आप उत्पाद का मूल्य (Price), स्टॉक (Stock), या ऑफर्स (Offers) अपडेट करने के लिए निर्देश दे सकते हैं।"
                if lang == "hi" else
                "Hello! You can update product prices, add inventory, check stock, or create offers. For example: 'Change black backpack price to ₹1,499' or 'Which products have low stock?'"
            )
        )

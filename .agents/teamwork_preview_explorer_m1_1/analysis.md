# Bystorm Milestone 1 Analysis Report: Backend Data Model & API Extensions for Product Variants

## Executive Summary
This report provides a detailed analysis of `main.py` in the Bystorm repository for **Milestone 1: Backend Data Model & API Extensions**. It covers existing Pydantic schemas, inventory/BOM logic, quote generation, and order state transition workflows. It introduces a comprehensive backend design for **`ProductVariant`**, detailing schema extensions, variant resolution algorithms, cost/price adjustments, and stock deduction orchestration.

---

## 1. Codebase Inventory & Current Data Models

### 1.1 BOM Item Model (`BOMItem`)
Located at lines 45–58 in `main.py`:
```python
class BOMItem(BaseModel):
    cinta: float = 0.0        # Metros de cinta/cuerina lineal
    argollas: int = 0
    hebillas: int = 0
    remaches: int = 0
    ojalillos: int = 0
    varillas: int = 0
    cadenas: float = 0.0      # Metros de cadena lineal
    tachas: int = 0
    mosquetones: int = 0
    # Moldería de piezas cortadas (máscaras/corsetería)
    panels_count: int = 0
    panel_width: float = 0.0  # cm
    panel_height: float = 0.0 # cm
```
*Key Observation*: `BOMItem` captures all physical material inputs required for a standard product.

### 1.2 Pricing & Quote Models (`PricingConfig`, `QuoteRequest`)
Located at lines 74–94 in `main.py`:
```python
class PricingConfig(BaseModel):
    cost_cuerina_per_m: float = Field(3500.0)
    cost_cinta_per_m: float = Field(800.0)
    cost_argolla: float = Field(350.0)
    cost_hebilla: float = Field(450.0)
    cost_remache: float = Field(50.0)
    cost_ojalillo: float = Field(80.0)
    cost_varilla: float = Field(200.0)
    cost_cadena_per_m: float = Field(1200.0)
    cost_tacha: float = Field(60.0)
    cost_mosqueton: float = Field(500.0)
    cost_panel_per_m2: float = Field(5000.0)
    labor_hours: float = Field(3.0)
    labor_rate_per_hour: float = Field(2000.0)
    profit_margin_percent: float = Field(60.0)

class QuoteRequest(BaseModel):
    product_key: str = Field(..., description="Clave del producto (arnes, mascara, corset)")
    pricing: PricingConfig = Field(default_factory=PricingConfig)
    custom_bom: Optional[BOMItem] = None
```

### 1.3 Product Models (`ProductCreate`, `ProductUpdate`)
Located at lines 651–684 in `main.py`:
```python
class ProductCreate(BaseModel):
    key: str = Field(..., description="Clave única del producto")
    name: str = Field(..., description="Nombre del producto")
    bom: BOMItem
    category: str = "general"
    description: str = ""
    material: str = "Cuerina/cinta vegana + herrajes"
    vegan: bool = True
    made_to_order: bool = True
    core: bool = False

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    material: Optional[str] = None
    vegan: Optional[bool] = None
    made_to_order: Optional[bool] = None
    cinta: Optional[float] = None
    argollas: Optional[int] = None
    hebillas: Optional[int] = None
    remaches: Optional[int] = None
    ojalillos: Optional[int] = None
    varillas: Optional[int] = None
    cadenas: Optional[float] = None
    tachas: Optional[int] = None
    mosquetones: Optional[int] = None
    panels_count: Optional[int] = None
    panel_width: Optional[float] = None
    panel_height: Optional[float] = None
```
*Storage*: Products are persisted as a dictionary `Dict[str, dict]` in `products_data.json` accessed via helper functions `_load_products()` and `_save_products()`.

### 1.4 Order Models (`OrderCreate`, `OrderResponse`, `OrderStatusUpdate`)
Located at lines 1427–1465 in `main.py`:
```python
class OrderCreate(BaseModel):
    client_id: str = ""
    client_name: str
    product_key: str
    product_name: str
    quantity: int = Field(1, ge=1)
    size: str = "M"
    custom_notes: str = ""
    notes: str = ""
    quoted_price: float = 0
    due_date: str = ""
    status: str = "pendiente"
    deposit_amount: float = Field(0, ge=0)
    deposit_date: Optional[str] = None
    amount_paid_total: float = Field(0, ge=0)
    payment_status: str = "sin_pago"
    materials_cost_snapshot: Optional[float] = None
    labor_cost_snapshot: Optional[float] = None
    retail_price_snapshot: Optional[float] = None
    stock_deducted: bool = False
    production_id: Optional[str] = None
    contact_phone: str = ""
    whatsapp_ready_sent_at: Optional[str] = None

class OrderResponse(OrderCreate):
    id: str
    created_at: str
    updated_at: str
    balance_amount: float = 0

class OrderStatusUpdate(BaseModel):
    status: str
```

---

## 2. Core Business Functions & Execution Flows

### 2.1 `_product_to_bom(prod_data: dict) -> BOMItem` (Line 263)
- **Purpose**: Extracts raw BOM attributes from a product dictionary loaded from `products_data.json`.
- **Current logic**: Filters keys using `BOM_FIELD_KEYS = set(BOMItem.model_fields.keys())` and instantiates a flat `BOMItem`.
- **Limitation**: Only supports base product BOM; does not inspect or evaluate variants.

### 2.2 Inventory Stock Check & Calculation (`_bom_requirements`, `check_bom_stock`) (Lines 1264–1310)
- **`_bom_requirements(product_key, quantity)`**:
  - Fetches base BOM via `_product_to_bom()`.
  - Multiplies lineal hardware/straps by `quantity`.
  - For cut panels (`panels_count > 0`), computes consumption in meters of `cuerina_rollo` via `calculate_cuerina_consumed_m()`.
- **`check_bom_stock(product_key, quantity)`**:
  - Compares required items with current `inventory_data.json` stock.
  - Returns a list of formatted shortage error messages if any material stock is less than required.

### 2.3 `deduct_bom_for_product(product_key, quantity, reference)` (Lines 1313–1354)
- **Execution Flow**:
  1. Guard clause: skips if `product_key` is empty or `"custom"`.
  2. Runs `check_bom_stock()`. If shortages exist, raises `HTTPException(400, "Falta stock de materiales: ...")`.
  3. Mutates `inventory_data.json` by subtracting required quantities.
  4. Appends movement records into `inventory_movements_data.json` with `movement_type="produccion"`.
  5. Saves updated inventory and returns created movement records.

### 2.4 Quoting Engine (`generate_quote`, `POST /api/quote`) (Lines 584–647)
- **Execution Flow**:
  1. Resolves `BOMItem`: either custom BOM or product base BOM via `_product_to_bom()`.
  2. Multiplies material quantities by `PricingConfig` unit costs (straps, chains, panels area in m², hardware items).
  3. Calculates `labor_cost = pricing.labor_hours * pricing.labor_rate_per_hour`.
  4. Calculates `subtotal = total_materials + labor_cost`.
  5. Calculates `profit = subtotal * (profit_margin_percent / 100)`.
  6. Calculates `suggested_retail_price = subtotal + profit`.

### 2.5 Order Creation (`create_order`, `POST /api/orders`) (Lines 1885–1907)
- **Execution Flow**:
  1. Validates status against `VALID_ORDER_STATUSES`.
  2. Normalizes notes and payment fields (`_compute_payment_fields`).
  3. Ensures order starts with `stock_deducted = False` and `production_id = None`.
  4. Stores snapshot values (`materials_cost_snapshot`, `labor_cost_snapshot`, `retail_price_snapshot`).

### 2.6 Order Status Update (`update_order_status`, `PUT /api/orders/{id}/status`) (Lines 1934–1984)
- **Side-effect Orchestration**:
  - When target state is `"terminado"` and `stock_deducted` is `False`:
    - Invokes `deduct_bom_for_product(product_key, quantity, reference)`.
    - If stock check fails, `HTTPException(400)` aborts execution and order status in disk is NOT updated.
    - If stock check passes, creates a production log record via `_create_production_from_order()`, links `production_id`, and sets `stock_deducted = True`.
  - Re-entry idempotency: If already `stock_deducted = True`, status transitions without double-deduction (Test case T6).

---

## 3. ProductVariant Backend Design & Schema Specification

### 3.1 Proposed Pydantic Schemas

```python
from pydantic import BaseModel, Field
from typing import Optional, Dict, List

class ProductVariant(BaseModel):
    id: str = Field(..., description="ID único de la variante (ej: 'v_arnes_xl_negro')")
    name: str = Field(..., description="Nombre amigable (ej: 'Talla XL - Cuerina Negra')")
    size: Optional[str] = Field(None, description="Talla de la variante (S, M, L, XL, Custom)")
    color_material: Optional[str] = Field(None, description="Variación de color o material")
    sku: Optional[str] = Field(None, description="SKU opcional de la variante")
    
    # Overrides & Deltas
    bom_override: Optional[BOMItem] = Field(None, description="BOM completo que reemplaza al BOM base")
    bom_delta: Optional[Dict[str, float]] = Field(None, description="Deltas sobre BOM base, ej: {'cinta': 0.5, 'remaches': 4}")
    labor_hours_override: Optional[float] = Field(None, description="Horas de mano de obra específicas")
    labor_hours_delta: Optional[float] = Field(None, description="Delta sobre las horas de mano de obra base")
    price_override: Optional[float] = Field(None, description="Precio de venta fijo para la variante")
    price_adjustment: Optional[float] = Field(0.0, description="Ajuste/recargo incremental sobre el precio calculado")

class ProductCreate(BaseModel):
    key: str = Field(..., description="Clave única del producto")
    name: str = Field(..., description="Nombre del producto")
    bom: BOMItem
    category: str = "general"
    description: str = ""
    material: str = "Cuerina/cinta vegana + herrajes"
    vegan: bool = True
    made_to_order: bool = True
    core: bool = False
    variants: List[ProductVariant] = Field(default_factory=list, description="Lista de variantes asociadas")

class QuoteRequest(BaseModel):
    product_key: str = Field(..., description="Clave del producto (arnes, mascara, corset)")
    variant_id: Optional[str] = Field(None, description="ID de la variante seleccionada")
    pricing: PricingConfig = Field(default_factory=PricingConfig)
    custom_bom: Optional[BOMItem] = None

class OrderCreate(BaseModel):
    client_id: str = ""
    client_name: str
    product_key: str
    product_name: str
    variant_id: Optional[str] = Field(None, description="ID de la variante elegida")
    variant_name: Optional[str] = Field(None, description="Nombre de la variante elegida")
    quantity: int = Field(1, ge=1)
    size: str = "M"
    custom_notes: str = ""
    notes: str = ""
    quoted_price: float = 0
    due_date: str = ""
    status: str = "pendiente"
    deposit_amount: float = Field(0, ge=0)
    deposit_date: Optional[str] = None
    amount_paid_total: float = Field(0, ge=0)
    payment_status: str = "sin_pago"
    materials_cost_snapshot: Optional[float] = None
    labor_cost_snapshot: Optional[float] = None
    retail_price_snapshot: Optional[float] = None
    stock_deducted: bool = False
    production_id: Optional[str] = None
    contact_phone: str = ""
    whatsapp_ready_sent_at: Optional[str] = None
```

---

## 4. Variant Resolution Logic & Impact on Costs, Prices, and BOM

### 4.1 Resolution Algorithm (`resolve_effective_product_spec`)
When a request passes `product_key` and optional `variant_id`:

1. **Variant Resolution**:
   - Fetch product dictionary for `product_key`.
   - If `variant_id` is supplied: search `product.get("variants", [])` for matching `variant.id`. If not found, raise `HTTPException(400, "Variante '{variant_id}' no encontrada.")`.
   - If `variant_id` is None/empty: use base product BOM and base labor hours.

2. **Effective BOM Calculation**:
   - If `variant.bom_override` is set: `effective_bom = variant.bom_override`.
   - Else if `variant.bom_delta` is set:
     Start with a copy of base `BOMItem`. For each `(key, delta)` in `bom_delta`, `effective_bom[key] = max(0.0, base_bom[key] + delta)`.
   - Else: `effective_bom = base_bom`.

3. **Effective Labor Hours**:
   - Base labor hours: `product_labor = PRODUCT_LABOR_HOURS_DEFAULT.get(product_key, 3.0)`.
   - If `variant.labor_hours_override` is set: `effective_labor_hours = variant.labor_hours_override`.
   - Else if `variant.labor_hours_delta` is set: `effective_labor_hours = max(0.0, product_labor + variant.labor_hours_delta)`.
   - Else: `effective_labor_hours = product_labor`.

4. **Material Cost & Labor Cost Calculation**:
   - `total_materials`: Calculated from `effective_bom` and `PricingConfig`.
   - `labor_cost = effective_labor_hours * pricing.labor_rate_per_hour`.
   - `subtotal = total_materials + labor_cost`.

5. **Retail Price Resolution**:
   - `calculated_suggested_price = subtotal * (1 + profit_margin_percent / 100)`.
   - If `variant.price_override` is set: `retail_price = variant.price_override`.
   - Else: `retail_price = calculated_suggested_price + (variant.price_adjustment or 0.0)`.

6. **BOM Requirements & Stock Deduction**:
   - Update `_bom_requirements()` to accept `variant_id: Optional[str] = None`.
   - Compute material requirements using the resolved `effective_bom`.
   - `check_bom_stock()` and `deduct_bom_for_product()` pass `variant_id` to ensure inventory deduction uses the exact variant materials.
   - `update_order_status()` passes `order.get("variant_id")` when triggering `deduct_bom_for_product()`.

---

## 5. Backward Compatibility & Migration Strategy
1. **Existing Data**: Products in `products_data.json` without a `"variants"` field default to `"variants": []` in `_load_products()`.
2. **Orders without Variant**: Orders without `variant_id` seamlessly fall back to using base product specs.
3. **API Contract**: All new `variant_id` fields are `Optional[str] = None`, ensuring existing frontend & API consumers suffer zero breaking changes.

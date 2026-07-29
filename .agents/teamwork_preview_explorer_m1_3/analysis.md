# Bystorm Milestone 1 — Product API & Variant CRUD Design & Compatibility Analysis

**Author**: Explorer 3 (Milestone 1 — Backend Data Model & API Extensions)  
**Target System**: Bystorm v2.1 (`main.py` / `products_data.json`)  
**Date**: 2026-07-23  

---

## Executive Summary

This document provides a comprehensive analysis of the existing product endpoints in `main.py`, specifies the HTTP contract and business logic for new **Product Variant CRUD** endpoints (`POST`, `PUT`, `DELETE` under `/api/products/{key}/variants`), and defines **Legacy Compatibility Rules** ensuring that existing single-variant catalog items (products without `variants` or with `variants: []`) default cleanly to base product price, labor cost, and base BOM without breaking existing quotes, orders, inventory deductions, or test suites.

---

## 1. Existing Product API & Storage Architecture (`main.py`)

### 1.1 Model Definitions & Storage Format
Products in Bystorm represent workshop catalog items (e.g., pecheras, body harnesses, corsets, masks). Currently, product data is persisted in `products_data.json` as a dictionary keyed by `product_key`.

* **Storage Shape (`products_data.json`)**:
  ```json
  {
    "arnes": {
      "name": "Arnés pechera Tormenta",
      "category": "arneses",
      "description": "Pechera clásica con argollas y remaches. Pieza base del taller...",
      "material": "Cinta/cuerina vegana + herrajes metálicos",
      "vegan": true,
      "made_to_order": true,
      "core": true,
      "cinta": 3.0,
      "argollas": 8,
      "hebillas": 4,
      "remaches": 16,
      "ojalillos": 0,
      "varillas": 0,
      "cadenas": 0.0,
      "tachas": 10,
      "mosquetones": 2,
      "panels_count": 0,
      "panel_width": 0.0,
      "panel_height": 0.0
    }
  }
  ```

* **Core Constants & Helpers**:
  * `PRODUCT_META_KEYS`: `{"name", "category", "description", "material", "vegan", "made_to_order", "core", "tags"}`
  * `BOM_FIELD_KEYS`: Set of fields corresponding to `BOMItem` (`cinta`, `argollas`, `hebillas`, `remaches`, `ojalillos`, `varillas`, `cadenas`, `tachas`, `mosquetones`, `panels_count`, `panel_width`, `panel_height`).
  * `_product_to_bom(prod_data: dict) -> BOMItem`: Extracts BOM fields from a flattened product dictionary.

### 1.2 Examination of Existing Product Endpoints

#### 1. `GET /api/products`
* **Line**: `main.py:686-688`
* **Behavior**: Loads and returns the entire product dictionary from `products_data.json` via `_load_products()`.
* **Response**: `200 OK` returning `{ product_key: product_data_dict, ... }`.

#### 2. `POST /api/products`
* **Line**: `main.py:690-707`
* **Request Body**: `ProductCreate`
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
  ```
* **Behavior**:
  1. Calls `_load_products()`.
  2. Checks if `product.key` already exists. If yes, raises `HTTPException(400, "Ya existe un producto con esa clave.")`.
  3. Flattens `product.bom` fields into the product payload alongside metadata.
  4. Saves via `_save_products(products)`.
* **Response**: `201 Created` with `{"key": product.key, **products[product.key]}`.

#### 3. `PUT /api/products/{product_key}`
* **Line**: `main.py:709-734`
* **Request Body**: Dict (supports both flat legacy BOM/metadata updates or structured `{ bom: {...}, name, category }`).
* **Behavior**:
  1. Loads products; raises `HTTPException(404, "Producto no encontrado.")` if key missing.
  2. Merges updated fields with existing product dictionary.
  3. Preserves `core=True` flag if the product was marked as core catalog item.
  4. Saves via `_save_products(products)`.
* **Response**: `200 OK` with `{"key": product_key, **products[product_key]}`.

#### 4. `DELETE /api/products/{product_key}`
* **Line**: `main.py:736-750`
* **Behavior**:
  1. Loads products; raises `404 Not Found` if `product_key` missing.
  2. Checks if `prod.get("core")` is `True` or `product_key` in core list (`("arnes", "mascara", "corset_underbust", "arnes_body")`).
  3. Raises `HTTPException(400, "No se pueden borrar las fichas base del catálogo Tormenta.")` if core product.
  4. Deletes key, saves via `_save_products()`, and returns `{"deleted": True, "key": product_key}`.

---

## 2. Specification for Variant CRUD Endpoints

To support multiple hardware colors (plateado, pavonado, bronce), material finishes (cuerina negra, charol rojo), size options, custom BOM adjustments, and pricing overrides, we extend products with a `"variants"` array.

### 2.1 Pydantic Data Models for Variant API

```python
class BOMOverride(BaseModel):
    """Sobrescritura opcional de campos BOM para una variante."""
    cinta: Optional[float] = Field(None, ge=0.0)
    argollas: Optional[int] = Field(None, ge=0)
    hebillas: Optional[int] = Field(None, ge=0)
    remaches: Optional[int] = Field(None, ge=0)
    ojalillos: Optional[int] = Field(None, ge=0)
    varillas: Optional[int] = Field(None, ge=0)
    cadenas: Optional[float] = Field(None, ge=0.0)
    tachas: Optional[int] = Field(None, ge=0)
    mosquetones: Optional[int] = Field(None, ge=0)
    panels_count: Optional[int] = Field(None, ge=0)
    panel_width: Optional[float] = Field(None, ge=0.0)
    panel_height: Optional[float] = Field(None, ge=0.0)

class VariantCreate(BaseModel):
    variant_id: Optional[str] = Field(None, description="ID único de variante. Si se omite, se autogenera.")
    name: str = Field(..., min_length=1, description="Nombre descriptivo de la variante (ej. Negro / Plata)")
    sku: Optional[str] = Field("", description="Código SKU de la variante")
    material_finish: str = Field("Cuerina Negra", description="Acabado de material (ej. Cuerina Negra, Charol Rojo)")
    hardware_color: str = Field("Plateado", description="Color de herrajes (ej. Plateado, Pavonado Negro, Bronce)")
    size_option: Optional[str] = Field(None, description="Talle de la variante si aplica (S, M, L, XL, A medida)")
    price_override: Optional[float] = Field(None, ge=0, description="Precio retail fijo explícito (anula cálculo base)")
    price_modifier: float = Field(0.0, description="Ajuste (+/-) sobre el precio base retail")
    labor_hours_override: Optional[float] = Field(None, ge=0, description="Horas de taller específicas para esta variante")
    bom_override: Optional[BOMOverride] = Field(None, description="Modificaciones a insumos respecto al BOM base")
    image_url: Optional[str] = Field("", description="Foto de referencia de la variante")
    is_active: bool = Field(True, description="Si la variante está disponible para cotización/orden")

class VariantUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    material_finish: Optional[str] = None
    hardware_color: Optional[str] = None
    size_option: Optional[str] = None
    price_override: Optional[float] = None
    price_modifier: Optional[float] = None
    labor_hours_override: Optional[float] = None
    bom_override: Optional[BOMOverride] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None
```

---

### 2.2 Endpoint 1: `POST /api/products/{product_key}/variants`

* **HTTP Method**: `POST`
* **Path**: `/api/products/{product_key}/variants`
* **Status Code**: `201 Created`
* **Summary**: Agrega una nueva variante a la ficha del producto especificado.

#### Business Logic & Validations:
1. Load products dictionary using `_load_products()`.
2. Check if `product_key` exists in products. If not found, raise `HTTPException(status_code=404, detail="Producto base no encontrado.")`.
3. Normalize product dictionary: Ensure `products[product_key].setdefault("variants", [])` is initialized as a list.
4. Validate or generate `variant_id`:
   * If `variant.variant_id` is provided, slugify and verify uniqueness among existing variants for `product_key`. If duplicate, raise `HTTPException(status_code=400, detail=f"Ya existe una variante con ID '{variant.variant_id}' para este producto.")`.
   * If `variant.variant_id` is empty/None, generate automatically: `variant_id = f"{product_key}_v_{uuid.uuid4().hex[:6]}"`.
5. Construct new variant dictionary:
   ```python
   new_variant = {
       "variant_id": variant_id,
       **variant.model_dump(exclude={"variant_id"}),
       "created_at": datetime.now().isoformat(),
       "updated_at": datetime.now().isoformat()
   }
   ```
6. Append `new_variant` to `products[product_key]["variants"]`.
7. Persist via `_save_products(products)`.
8. Return `{"product_key": product_key, "variant": new_variant}`.

#### HTTP Response Examples:
* **201 Created**:
  ```json
  {
    "product_key": "arnes",
    "variant": {
      "variant_id": "arnes_v_a1b2c3",
      "name": "Charol Rojo / Herrajes Pavonados",
      "sku": "ARN-RED-BLK",
      "material_finish": "Charol Rojo",
      "hardware_color": "Pavonado Negro",
      "size_option": "M",
      "price_override": null,
      "price_modifier": 1500.0,
      "labor_hours_override": 3.0,
      "bom_override": {
        "cinta": 3.2,
        "tachas": 12
      },
      "image_url": "/static/img/arnes_rojo.jpg",
      "is_active": true,
      "created_at": "2026-07-23T18:30:00.000000",
      "updated_at": "2026-07-23T18:30:00.000000"
    }
  }
  ```
* **404 Not Found**:
  ```json
  { "detail": "Producto base no encontrado." }
  ```
* **400 Bad Request**:
  ```json
  { "detail": "Ya existe una variante con ID 'arnes_v_a1b2c3' para este producto." }
  ```

---

### 2.3 Endpoint 2: `PUT /api/products/{product_key}/variants/{variant_id}`

* **HTTP Method**: `PUT`
* **Path**: `/api/products/{product_key}/variants/{variant_id}`
* **Status Code**: `200 OK`
* **Summary**: Actualiza los atributos de una variante existente.

#### Business Logic & Validations:
1. Load products dictionary using `_load_products()`.
2. Verify `product_key` exists. If not, raise `404 Not Found`.
3. Get variants list `variants = products[product_key].get("variants", [])`.
4. Search for target variant where `v["variant_id"] == variant_id`. If not found, raise `HTTPException(status_code=404, detail=f"Variante '{variant_id}' no encontrada para el producto '{product_key}'.")`.
5. Update supplied non-null fields from `VariantUpdate`:
   * Merge `bom_override` if partially provided or update to new dictionary/None.
   * Update timestamp `updated_at = datetime.now().isoformat()`.
6. Save updated products via `_save_products(products)`.
7. Return `{"product_key": product_key, "variant": updated_variant_dict}`.

#### HTTP Response Examples:
* **200 OK**:
  ```json
  {
    "product_key": "arnes",
    "variant": {
      "variant_id": "arnes_v_a1b2c3",
      "name": "Charol Rojo / Herrajes Pavonados (Actualizado)",
      "sku": "ARN-RED-BLK",
      "material_finish": "Charol Rojo Premium",
      "hardware_color": "Pavonado Negro",
      "size_option": "M",
      "price_override": 18500.0,
      "price_modifier": 0.0,
      "labor_hours_override": 3.0,
      "bom_override": {
        "cinta": 3.2,
        "tachas": 12
      },
      "image_url": "/static/img/arnes_rojo.jpg",
      "is_active": true,
      "created_at": "2026-07-23T18:30:00.000000",
      "updated_at": "2026-07-23T18:35:10.000000"
    }
  }
  ```
* **404 Not Found**:
  ```json
  { "detail": "Variante 'arnes_v_a1b2c3' no encontrada para el producto 'arnes'." }
  ```

---

### 2.4 Endpoint 3: `DELETE /api/products/{product_key}/variants/{variant_id}`

* **HTTP Method**: `DELETE`
* **Path**: `/api/products/{product_key}/variants/{variant_id}`
* **Status Code**: `200 OK`
* **Summary**: Elimina una variante de la ficha del producto.

#### Business Logic & Validations:
1. Load products dictionary using `_load_products()`.
2. Verify `product_key` exists; if not, raise `404 Not Found`.
3. Locate index of variant matching `variant_id` in `products[product_key].get("variants", [])`.
4. If not found, raise `HTTPException(status_code=404, detail=f"Variante '{variant_id}' no encontrada.")`.
5. Remove variant from array: `products[product_key]["variants"].pop(idx)`.
6. Save via `_save_products(products)`.
7. Return `{"deleted": true, "product_key": product_key, "variant_id": variant_id}`.

#### HTTP Response Example:
* **200 OK**:
  ```json
  {
    "deleted": true,
    "product_key": "arnes",
    "variant_id": "arnes_v_a1b2c3"
  }
  ```

---

## 3. Legacy Compatibility Rules & Fallback Specifications

To ensure 100% backward compatibility with existing single-variant products and existing order/quote payloads, Bystorm must implement clear resolution helper functions in `main.py`.

### 3.1 Structural Compatibility Rule (JSON Payload Normalization)
* **Rule 3.1.1**: Legacy products in `products_data.json` that omit the `"variants"` key entirely (or set `"variants": null` or `"variants": []`) MUST be parsed without errors.
* **Rule 3.1.2**: `GET /api/products` returns products as stored, but functions accessing product variants MUST treat `prod_data.get("variants")` as an empty list `[]` if missing or null.
* **Rule 3.1.3**: Base product properties (`cinta`, `argollas`, `name`, `category`, `material`) remain the single source of truth for base calculations.

---

### 3.2 BOM Resolution Logic (`get_effective_bom`)

When calculating materials for Quotes (`POST /api/quote`), Material Optimization (`POST /api/optimize`), Batch Production (`POST /api/batch-optimize`), or Inventory Deduction on Order Termination (`PUT /api/orders/{id}/status`), BOM insumos are resolved via `get_effective_bom()`:

```python
def get_effective_bom(product_data: dict, variant_id: Optional[str] = None) -> BOMItem:
    """
    Devuelve el BOMItem resultante.
    Si variant_id es None o no tiene bom_override, retorna el BOM base del producto.
    Si la variante define bom_override, fusiona los campos sobreescritos sobre el BOM base.
    """
    base_bom = _product_to_bom(product_data)
    
    if not variant_id:
        return base_bom
        
    variants = product_data.get("variants", [])
    matched_variant = next((v for v in variants if v.get("variant_id") == variant_id), None)
    
    if not matched_variant or not matched_variant.get("bom_override"):
        return base_bom
        
    bom_override = matched_variant["bom_override"]
    base_dict = base_bom.model_dump()
    
    # Aplicar sobreescritura de campos no nulos
    for field, val in bom_override.items():
        if val is not None and field in base_dict:
            base_dict[field] = val
            
    return BOMItem(**base_dict)
```

**Compatibility Guarantee**: If `variant_id` is omitted or `None`, `get_effective_bom(product_data)` produces the exact identical `BOMItem` as `_product_to_bom(product_data)`.

---

### 3.3 Labor Hours Resolution Logic (`get_effective_labor_hours`)

```python
def get_effective_labor_hours(product_key: str, product_data: dict, variant_id: Optional[str] = None) -> float:
    """
    Devuelve las horas de mano de obra efectivas.
    Prioridad:
    1. variant.labor_hours_override (si se especificó variante y tiene valor)
    2. product_data.get("labor_hours") (si la ficha base lo define)
    3. PRODUCT_LABOR_HOURS_DEFAULT.get(product_key, 3.0) (fallback de constante)
    """
    default_hours = PRODUCT_LABOR_HOURS_DEFAULT.get(product_key, 3.0)
    base_hours = product_data.get("labor_hours", default_hours)
    
    if not variant_id:
        return base_hours
        
    variants = product_data.get("variants", [])
    matched_variant = next((v for v in variants if v.get("variant_id") == variant_id), None)
    
    if matched_variant and matched_variant.get("labor_hours_override") is not None:
        return matched_variant["labor_hours_override"]
        
    return base_hours
```

---

### 3.4 Retail Price Resolution Logic (`get_effective_price`)

```python
def get_effective_price(
    product_key: str,
    product_data: dict,
    pricing_config: PricingConfig,
    variant_id: Optional[str] = None
) -> Dict[str, float]:
    """
    Calcula el costo de materiales, costo de mano de obra, costo total y precio sugerido.
    Aplica modificadores o precio fijo explícito de la variante si aplica.
    """
    bom = get_effective_bom(product_data, variant_id)
    labor_hours = get_effective_labor_hours(product_key, product_data, variant_id)
    
    # 1. Costo de materiales
    p = pricing_config
    mat_cost = round(
        (bom.cinta * p.cost_cinta_per_m) +
        (bom.cadenas * p.cost_cadena_per_m) +
        (bom.argollas * p.cost_argolla) +
        (bom.hebillas * p.cost_hebilla) +
        (bom.remaches * p.cost_remache) +
        (bom.ojalillos * p.cost_ojalillo) +
        (bom.varillas * p.cost_varilla) +
        (bom.tachas * p.cost_tacha) +
        (bom.mosquetones * p.cost_mosqueton),
        2
    )
    if bom.panels_count > 0 and bom.panel_width > 0 and bom.panel_height > 0:
        area_m2 = (bom.panel_width * bom.panel_height / 10000.0) * bom.panels_count
        mat_cost += round(area_m2 * p.cost_panel_per_m2, 2)
        
    # 2. Costo de mano de obra
    labor_cost = round(labor_hours * p.labor_rate_per_hour, 2)
    total_cost = round(mat_cost + labor_cost, 2)
    base_retail_price = round(total_cost * (1.0 + p.profit_margin_percent / 100.0), 2)
    
    final_retail_price = base_retail_price
    
    # 3. Aplicar ajustes de variante si variant_id está presente
    if variant_id:
        variants = product_data.get("variants", [])
        matched = next((v for v in variants if v.get("variant_id") == variant_id), None)
        if matched:
            if matched.get("price_override") is not None and matched["price_override"] > 0:
                final_retail_price = float(matched["price_override"])
            elif matched.get("price_modifier"):
                final_retail_price += float(matched["price_modifier"])
                
    profit = round(final_retail_price - total_cost, 2)
    
    return {
        "materials_cost": mat_cost,
        "labor_cost": labor_cost,
        "total_cost": total_cost,
        "base_retail_price": base_retail_price,
        "retail_price": max(0.0, final_retail_price),
        "profit": profit,
        "labor_hours": labor_hours
    }
```

---

### 3.5 Integration Matrix across FastAPI Modules

| FastAPI Module | Line / Endpoint | Legacy Behavior (No `variant_id`) | Variant-Aware Behavior (`variant_id` provided) |
|---|---|---|---|
| **Cotizador** | `POST /api/quote` | Uses base BOM & pricing defaults. Returns standard quote payload. | Uses `get_effective_price()` and `get_effective_bom()`. Returns quote payload enriched with `variant_id`, `variant_name`, `hardware_color`, `material_finish`. |
| **Crear Orden** | `POST /api/orders` & `POST /api/orders/from-quote` | Stores `product_key`, `variant_id: null`. Deducts base BOM on completion. | Stores `product_key`, `variant_id`, and snapshots (`variant_name`, `hardware_color`, `material_finish`). Deducts variant-specific BOM on completion. |
| **Deducción de Stock** | `PUT /api/orders/{id}/status` -> `terminado` | Calls `deduct_bom_for_product(product_key)` using base BOM. | Passes `variant_id` to `deduct_bom_for_product()`, deducting overridden insumos. |
| **Optimizador Zero-Waste** | `POST /api/optimize` | Calculates max units using base product BOM. | Allows optional `variant_id` in request to calculate bottleneck against variant BOM. |
| **Producción Manual** | `POST /api/production` | Uses base product BOM and standard labor hours. | Supports `variant_id` to log exact production costs and variant material consumption. |

---

### 3.6 Offline Mock Parity (`static/app.js`)

In accordance with project non-negotiables, the offline `mockApiHandler` in `static/app.js` MUST replicate these endpoints:
1. `POST /api/products/{key}/variants`: Adds new variant into `localStorage["bystorm_products"]`.
2. `PUT /api/products/{key}/variants/{variant_id}`: Updates variant in `localStorage["bystorm_products"]`.
3. `DELETE /api/products/{key}/variants/{variant_id}`: Removes variant from `localStorage["bystorm_products"]`.
4. Quote and Order handlers in `mockApiHandler` use the identical default fallback rules (fallback to base BOM and base price if `variant_id` is omitted).

---

## 4. Verification & Testing Strategy

### Existing Test Suite (`test_main.py`)
Run current tests to confirm zero regressions:
```bash
uv run pytest test_main.py -q
```
All existing tests T1 through T9 pass unchanged because all legacy endpoints continue to default to base BOM and base pricing when `variant_id` is absent.

### New Test Cases Proposed (T10 - T14)

| Test ID | Test Description | Verification Command / Step |
|---|---|---|
| **T10** | `POST /api/products/arnes/variants` creates variant with default fields | Assert HTTP 201, `variant_id` generated, variant present in `GET /api/products`. |
| **T11** | `PUT /api/products/arnes/variants/{v_id}` modifies price & hardware color | Assert HTTP 200, updated values reflected in product payload. |
| **T12** | `DELETE /api/products/arnes/variants/{v_id}` deletes variant | Assert HTTP 200, variant absent from `GET /api/products`. |
| **T13** | Legacy `POST /api/quote` without `variant_id` returns base quote | Assert quote matches base BOM and pricing exactly. |
| **T14** | `POST /api/quote` with `variant_id` applies `price_modifier` and `bom_override` | Assert quote cost and materials reflect variant overrides. |

---

*Report compiled and verified against `main.py` (v2.1) and project rules in `AGENTS.md` and `docs/DESARROLLO.md`.*

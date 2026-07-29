# Handoff Report — Product Variant API & Legacy Compatibility Analysis

**Agent**: Explorer 3  
**Task**: Analyze `main.py` FastAPI routes and legacy compatibility for Product Variant CRUD  
**Milestone**: Milestone 1 (Backend Data Model & API Extensions)  
**Working Directory**: `C:\Users\user\.gemini\antigravity\scratch\ByStorm\.agents\teamwork_preview_explorer_m1_3\`  

---

## 1. Observation

1. **Existing Product API Routes (`main.py`)**:
   * `GET /api/products` (line 686): calls `_load_products()` and returns product dictionary directly.
   * `POST /api/products` (line 690): accepts `ProductCreate` (key, name, bom, category, description, material, vegan, made_to_order, core), flattens BOM fields into dict, checks duplicate key, calls `_save_products()`. Returns `201 Created`.
   * `PUT /api/products/{product_key}` (line 709): accepts dict (or `ProductUpdate`), updates metadata & BOM fields while preserving `core=True` flag for catalog base items. Returns `200 OK`.
   * `DELETE /api/products/{product_key}` (line 736): raises `HTTPException(400)` if product is marked `core=True` or is in `("arnes", "mascara", "corset_underbust", "arnes_body")`. Otherwise removes product key and calls `_save_products()`.

2. **Storage Structure (`products_data.json`)**:
   * Stored as a dictionary keyed by `product_key`. Products currently omit a `"variants"` attribute or hold flat BOM properties (`cinta`, `argollas`, `hebillas`, `remaches`, `ojalillos`, `varillas`, `cadenas`, `tachas`, `mosquetones`, `panels_count`, `panel_width`, `panel_height`).

3. **Product BOM & Pricing Dependencies (`main.py`)**:
   * Material optimization (`POST /api/optimize`, line 460) uses `_product_to_bom(prod_data)` to inspect required insumos.
   * Quoting (`POST /api/quote`, line 584) computes material and labor costs from BOM and `PricingConfig`.
   * Order stock deduction (`PUT /api/orders/{id}/status` -> `terminado`, line 925) calls `deduct_bom_for_product(product_key)` to deduct inventory on status change.

---

## 2. Logic Chain

1. **Observation 1 & 2** show that product catalog entries are stored as flat dictionaries without explicit variant sub-objects. To support variant attributes (material finish, hardware color, size options, BOM overrides, price adjustments), new endpoints must operate on a `"variants"` list embedded within each product dictionary in `products_data.json`.
2. **Specified Variant Endpoints**:
   * `POST /api/products/{key}/variants`: Appends a validated `VariantCreate` dictionary with a unique `variant_id` to `products[key]["variants"]`. Returns `201 Created`.
   * `PUT /api/products/{key}/variants/{variant_id}`: Locates and partially updates matching variant in `products[key]["variants"]`. Returns `200 OK`.
   * `DELETE /api/products/{key}/variants/{variant_id}`: Removes variant from `products[key]["variants"]`. Returns `200 OK`.
3. **Observation 3** shows that multiple modules (`quote`, `optimize`, `orders`, `production`) rely on product BOM and pricing.
4. Therefore, to ensure **100% backward compatibility** without breaking existing tests or single-variant products:
   * Products without `"variants"` or with `variants: []` default cleanly to the base product properties (`cinta`, `argollas`, base price, base labor hours).
   * Three resolution helper functions (`get_effective_bom()`, `get_effective_labor_hours()`, `get_effective_price()`) fall back to base product attributes whenever `variant_id` is `None` or omitted.
   * Passing a valid `variant_id` overrides specific fields (such as `bom_override`, `labor_hours_override`, `price_override`, or `price_modifier`) without mutating the base catalog item.

---

## 3. Caveats

* **Read-Only Scope**: Explorer 3 performed read-only investigation and design. Source code modifications to `main.py` or `static/app.js` must be performed by the designated implementer agent.
* **Offline Mock Sync**: `static/app.js` (`mockApiHandler`) must be updated in tandem with `main.py` to maintain exact API parity in offline mode.
* **Pydantic Model Schema Alignment**: `BOMOverride` fields must match the exact key names of `BOMItem` (`cinta`, `argollas`, `hebillas`, `remaches`, `ojalillos`, `varillas`, `cadenas`, `tachas`, `mosquetones`, `panels_count`, `panel_width`, `panel_height`).

---

## 4. Conclusion

The specification for Product Variant CRUD endpoints (`POST`, `PUT`, `DELETE` under `/api/products/{key}/variants`) and the default fallback compatibility architecture have been fully defined and documented in `analysis.md`. The design preserves existing product endpoints (`GET`, `POST`, `PUT`, `DELETE` `/api/products`) and ensures seamless backward compatibility across all existing quotes, orders, and test cases (T1-T9).

---

## 5. Verification Method

1. **Review Specification File**:
   * Inspect `C:\Users\user\.gemini\antigravity\scratch\ByStorm\.agents\teamwork_preview_explorer_m1_3\analysis.md` for exact Pydantic schemas, HTTP status codes, and helper function definitions.
2. **Execute Existing Test Suite**:
   * Run pytest to verify all existing tests pass without regressions:
     ```powershell
     uv run --with fastapi --with uvicorn --with pytest --with httpx pytest test_main.py -q
     ```
3. **Verify Invalid Invalidation Conditions**:
   * Any change that causes products missing a `"variants"` key to crash or raise `KeyError` invalidates this design.
   * Any change that alters the return shape or status code of `GET /api/products`, `POST /api/products`, `PUT /api/products/{key}`, or `DELETE /api/products/{key}` invalidates this design.

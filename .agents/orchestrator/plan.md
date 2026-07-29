# Master Work Plan: Product Variants Module (Bystorm)

## Phase 1: Backend Data Model & API Extensions (Milestone 1)
- Objective: Extend Pydantic schemas in `main.py` and JSON seed data in `products_data.json` to handle product variants.
- Implementation details:
  - Add `ProductVariant` model and `variants: List[ProductVariant]` to `Product` model.
  - Implement endpoints for variant CRUD operations (`POST/PUT/DELETE /api/products/{key}/variants`).
  - Update `_product_to_bom()`, `deduct_bom_for_product()`, and `check_bom_stock()` to accept `variant_id` and apply `bom_override` or variant-specific adjustments.
  - Update quote calculation logic to handle variant cost/price overrides.
  - Maintain 100% backwards compatibility for legacy products without variants.

## Phase 2: Frontend Catalog UI, Cotizador & Offline Mock (Milestone 2)
- Objective: Provide full UI capabilities for managing variants and selecting variants during quoting/ordering, both online and offline.
- Implementation details:
  - Add variant management controls (add, edit, remove, material finish, hardware finish, reference image/color indicator) in Catalog view (`static/index.html`, `static/app.js`, `static/style.css`).
  - Integrate variant selection into Cotizador and Órdenes creation forms with dynamic cost recalculation.
  - Update `mockApiHandler` in `static/app.js` to replicate all variant API operations and dynamic recalculation offline.
  - Ensure mobile touch target ergonomics (>= 44px buttons).
  - Sync `static/` files to project root (`app.js`, `index.html`, `style.css`).

## Phase 3: Comprehensive Test Suite & System Verification (Milestone 3)
- Objective: Extend `test_main.py` with rigorous tests for variant features and perform full verification.
- Implementation details:
  - Add unit/integration tests for variant CRUD, legacy compatibility, quote calculation with variants, order stock deduction with variants.
  - Run `pytest test_main.py` to ensure all tests pass cleanly.
  - Run Challenger empirical verification.
  - Run Forensic Integrity Audit to ensure zero facade code or hardcoded results.
  - Synthesize results and report completion to parent.

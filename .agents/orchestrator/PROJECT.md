# PROJECT: Módulo de Catálogo Avanzado con Variantes de Producto (Bystorm)

## Architecture
- Backend: FastAPI (`main.py`) + Pydantic models + JSON persistence (`products_data.json`, `orders_data.json`, etc.)
- Data structure: Product model with `variants` list (id, name, material_color, hardware_finish, image_url, bom_override, price_override). Legacy products without variants supported seamlessly.
- BOM & Cost Calculation: Dynamic calculation based on selected variant in `_product_to_bom()`, `deduct_bom_for_product()`, quote generation, and order creation.
- Frontend: Vanilla HTML/CSS/JS in `static/` (canonical) synced to project root (`index.html`, `app.js`, `style.css`).
- Offline Mock: `mockApiHandler` in `static/app.js` with full feature parity for Netlify static deployments.
- Tests: `test_main.py` verified with pytest.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Backend Data Model & API Extensions | Extend `Product` model, `products_data.json`, variant CRUD endpoints, dynamic variant BOM calculation in `main.py` | none | IN_PROGRESS |
| 2 | Frontend Catalog UI, Cotizador/Órdenes & Offline Mock | Variant editor in Catalog tab, variant selector in Cotizador and Órdenes, reference images/color pickers, touch ergonomics, `mockApiHandler` parity, static sync | M1 | PLANNED |
| 3 | Test Suite Expansion & Integrity Audit | Unit/integration tests in `test_main.py` covering variant CRUD, quote with variants, order stock deduction with variants, offline mock, challenger empirical verification, forensic audit | M1, M2 | PLANNED |

## Interface Contracts
### Product & Variant Schemas (`main.py`)
- `ProductVariant`:
  - `id`: str
  - `name`: str (e.g. "Charol Vegano - Herrajes Dorado")
  - `material_color`: str (e.g. "cuerina_mate", "charol_vegano", "vinilo", "cuero_ecologico")
  - `hardware_finish`: str (e.g. "negro_mate", "niquelado", "dorado", "cromo")
  - `image_url`: Optional[str] = None
  - `bom_override`: Optional[Dict[str, float]] = None
  - `price_override`: Optional[float] = None
  - `labor_cost_override`: Optional[float] = None
- `Product`:
  - existing fields (`key`, `name`, `category`, `description`, `price`, `materials_cost`, `labor_cost`, `bom`, `vegan`, `made_to_order`, `core`, etc.)
  - `variants`: List[ProductVariant] = []

### API Endpoints
- `GET /api/products` (returns products including variants)
- `POST /api/products` (creates product with optional variants)
- `PUT /api/products/{key}` (updates product and variants)
- `DELETE /api/products/{key}` (deletes product)
- `POST /api/products/{key}/variants` (adds variant to product)
- `PUT /api/products/{key}/variants/{variant_id}` (updates variant)
- `DELETE /api/products/{key}/variants/{variant_id}` (deletes variant)

## Code Layout
- Backend: `main.py`
- Tests: `test_main.py`
- Frontend: `static/index.html`, `static/app.js`, `static/style.css`
- Root Copies: `index.html`, `app.js`, `style.css`

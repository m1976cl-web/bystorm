# AGENTS.md — Bystorm

Instructions for coding agents, robotic apps, and automated developers working on this repository.

## Project one-liner

**Bystorm** is a workshop optimizer for [Tormenta Indumentaria](https://www.instagram.com/tormenta_indumentaria/) (slow fashion / alternative garments: harnesses, corsets, masks, etc.).  
Stack: FastAPI (`main.py`) + vanilla HTML/CSS/JS (`static/` and root copies) + JSON file persistence + offline `localStorage` mock for Netlify.

## Active work plan (read this first)

| Priority | Document |
|----------|----------|
| **Current release** | [`docs/PLAN_IMPLEMENTACION_PEDIDOS.md`](docs/PLAN_IMPLEMENTACION_PEDIDOS.md) — end-to-end orders (quote → deposit → status → stock deduct → WhatsApp ready) |
| Docs index | [`docs/README.md`](docs/README.md) |

If the user (or orchestrator) says “continue Bystorm / Tormenta / pedidos”, implement against that plan unless told otherwise.

## Non-negotiables for the active release

1. **Do not skip** inventory deduction on order status `terminado` (use `stock_deducted` for idempotency).  
2. **Keep online and offline behavior identical** (`main.py` API ↔ `mockApiHandler` in `app.js`).  
3. **Do not rewrite** the app into React/Next/etc. in this release.  
4. **Do not expand scope** into PWA, cloud multi-user, or advanced 2D nesting unless the plan is updated.  
5. **Frontend duplication:** `static/` and repo root both have `app.js` / `index.html` / `style.css`. Prefer making `static/` canonical and syncing; never edit only one copy without a plan.  
6. **Tests:** extend `test_main.py` (cases T1–T9 in the plan) for order/stock flows.  
7. **Language:** UI and user-facing strings stay in **Spanish** (Argentina-friendly). Code/comments can be ES or EN; match surrounding file style.

## How to run

```bash
# App (Python 3.11+)
python main.py
# or
uv run main.py
# Windows helper
run_app.bat
```

- Local UI: http://127.0.0.1:8000  
- Without backend: open static frontend; fetch interceptor uses localStorage mock.  
- Tests: `pytest test_main.py` (see PEP 723 dependency header in the test file).

## Architecture map (short)

| Area | Location |
|------|----------|
| API + domain logic | `main.py` |
| Tests | `test_main.py` |
| Frontend + offline mock | `static/app.js` (and root `app.js`) |
| UI structure | `static/index.html` |
| Styles | `static/style.css` |
| Seed/runtime JSON | `*_data.json` |
| Netlify | `netlify.toml` (static publish) |

Persistence files used by the backend include products, clients, inventory, movements, production, orders, suppliers (see `*_FILE` constants in `main.py`).

## Suggested agent workflow

1. Read `docs/PLAN_IMPLEMENTACION_PEDIDOS.md` sections 0, 2, 7, 8, 9.  
2. Run existing tests; note failures.  
3. Implement the next pending day (D1…D10).  
4. Add/adjust tests until green.  
5. Mirror API changes in the offline mock.  
6. Open a focused PR; mention day id (e.g. `D3 status orchestration`).  
7. Update progress table in the plan if you complete a day.

## Out of scope unless explicitly requested

- Full PWA / service worker  
- Framework migration  
- Real 2D bin-packing nesting  
- AFIP / formal accounting  
- Multi-tenant SaaS  
- Deleting production business data without backup

## Product north star

Help the maker run the workshop from Instagram DM to delivery:  
**client → measurements → quote → deposit → sewing → stock → WhatsApp ready → paid delivery.**

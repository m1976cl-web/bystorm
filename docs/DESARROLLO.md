# Orden de desarrollo — Bystorm (Tormenta Indumentaria)

> **Documento maestro** para humanos, coding agents y apps robóticas.  
> Leé esto primero si vas a tocar el código. Luego el plan de release activo y la marca.

| Meta | Valor |
|------|--------|
| **Repo** | https://github.com/m1976cl-web/bystorm |
| **Beneficiaria** | [Tormenta Indumentaria](https://www.instagram.com/tormenta_indumentaria/) |
| **Producto** | Sistema operativo del taller (no ERP genérico, no e-commerce) |
| **Release activo** | `pedidos-punta-a-punta` / **Bystorm v2.1** |
| **Estado del núcleo** | D1–D3 **hechos** · D4–D10 **pendientes** |
| **Última actualización de este doc** | 2026-07-22 |

---

## 0. Mapa de documentos (quién lee qué)

| Documento | Rol | Obligatorio para |
|-----------|-----|------------------|
| **Este archivo** (`docs/DESARROLLO.md`) | Orden global, estado, reglas, próximo paso | Todos |
| [`AGENTS.md`](../AGENTS.md) | Contrato corto para agentes | Agentes / robots |
| [`PLAN_IMPLEMENTACION_PEDIDOS.md`](./PLAN_IMPLEMENTACION_PEDIDOS.md) | Spec del release v2.1 (D1→D10, API, tests T1–T9) | Quien implemente pedidos |
| [`MARCA_TORMENTA.md`](./MARCA_TORMENTA.md) | Marca, catálogo, lenguaje vegan / a medida | UI, copy, productos |
| [`README.md`](./README.md) | Índice de docs | Orientación |
| [`../README.md`](../README.md) | Arranque del repo | Onboarding |

**Regla:** un solo release activo a la vez. No mezclar PWA, multi-usuario cloud ni nesting 2D avanzado en v2.1.

**Regla de aislamiento:** este proyecto es **independiente** de otros repos del mismo operador (influ-json, LatexTailor, etc.). No copiar stacks ni mezclar datos entre ellos.

---

## 1. Norte de producto

Ayudar a la emprendedora a operar el taller desde Instagram:

```text
DM Instagram
  → cliente + medidas
  → cotización
  → orden con seña
  → confección (estados)
  → terminado (descuento BOM + producción)
  → WhatsApp “pedido listo”
  → cobro saldo + entregado
  → dashboard coherente
```

Si una feature no acorta ese camino, se posterga.

---

## 2. Stack (no negociable en v2.1)

| Capa | Tecnología | Archivos |
|------|------------|----------|
| Backend | Python 3.11+, FastAPI, Pydantic | `main.py` |
| Persistencia | JSON local | `*_data.json` |
| Frontend | HTML/CSS/JS vanilla | **`static/`** (canónico) + copias en raíz |
| Offline / Netlify | Mock `localStorage` | `static/app.js` → `mockApiHandler` |
| Tests | pytest + TestClient | `test_main.py` |
| Deploy estático | Netlify | `netlify.toml` → `publish = "static"` |

### Fuente de verdad del frontend

1. Editar siempre **`static/app.js`**, **`static/index.html`**, **`static/style.css`**.  
2. Sincronizar a la raíz:

```powershell
Copy-Item -Force static\app.js,static\index.html,static\style.css -Destination .
# o, si la política de ejecución lo permite:
# .\sync_static.ps1
```

3. Nunca dejar divergentes `static/` y root.

---

## 3. Cómo arrancar (Windows)

```powershell
cd C:\ruta\a\bystorm

# App
uv run main.py
# o: python main.py
# o: .\run_app.bat

# UI: http://127.0.0.1:8000

# Tests
uv run --with fastapi --with uvicorn --with pytest --with httpx pytest test_main.py -q
```

Sin backend: abrir el frontend estático; el interceptor de `fetch` usa el mock offline.

**Secretos:** no commitear tokens ni `.env.local`. Ver `.gitignore`. Tokens de GitHub son locales al entorno del desarrollador; no documentar valores aquí.

---

## 4. Arquitectura rápida

```text
main.py
  ├── modelos (Order*, BOM, Client, …)
  ├── *_data.json (products, clients, inventory, orders, …)
  ├── deduct_bom_for_product / check_bom_stock   ← D2
  ├── PUT /api/orders/{id}/status                ← D3 (side-effects en terminado)
  └── resto de API taller

static/
  ├── index.html   # un .tab-pane por módulo; menú agrupado
  ├── app.js       # UI + mockApiHandler (paridad offline)
  └── style.css

test_main.py       # regresión + T1–T9 del plan de pedidos
```

### Módulos de UI (orden de menú)

| Grupo | Pestañas | Qué debe verse |
|-------|----------|----------------|
| **Comercial** | Dashboard, Órdenes, Cotizador, Clientes | Solo venta / cliente |
| **Taller** | Lotes, Zero Waste, Escalado, Historial | Producción y moldería |
| **Insumos** | Inventario, Catálogo, Proveedores | Stock y BOM |
| **Más** | Tendencias | Inspiración |

**Aislamiento de paneles:** cada módulo es un `section.tab-pane`. Solo uno activo.  
Hubo un bug histórico: el `<section id="pane-optimization">` quedó comentado y el “stock” de Zero Waste sangraba a Clientes. No reintroducir HTML roto de paneles.

### Catálogo de producto

- Seed: `products_data.json` alineado a Tormenta (vegan, a medida, categorías).  
- Metadatos: `category`, `description`, `material`, `vegan`, `made_to_order`, `core`.  
- BOM se extrae con `_product_to_bom()` (ignora metadatos).  
- Detalle de marca: [`MARCA_TORMENTA.md`](./MARCA_TORMENTA.md).

---

## 5. Estado del release v2.1 (tracking)

Actualizar esta tabla **y** la de `PLAN_IMPLEMENTACION_PEDIDOS.md` al cerrar un día.

| Día | Entrega | Estado | Notas |
|-----|---------|--------|-------|
| **D1** | Modelo de orden + defaults + `static/` canónico | **done** | Seña, saldo, `payment_status`, `stock_deducted`, T1/T9 |
| **D2** | `deduct_bom_for_product` compartido | **done** | Producción y órdenes comparten lógica |
| **D3** | `PUT .../status` orquestado al `terminado` | **done** | Stock + production + idempotencia; T3–T6 |
| **D4** | `POST /api/orders/from-quote` + pagos embebidos | **pending** | ← **siguiente backend** |
| **D5** | Tests API T1–T9 completos / verdes | **pending** | Faltan T2, T7 (y consolidar) |
| **D6** | Mock offline paridad (`mockApiHandler`) | **pending** | Misma semántica que FastAPI |
| **D7** | UI Cotizador → “Crear orden de este presupuesto” | **pending** | |
| **D8** | UI Órdenes (seña/saldo, badges, confirmar terminar) | **pending** | |
| **D9** | WhatsApp “pedido listo” + móvil | **pending** | Endpoint + botón `wa.me` |
| **D10** | QA con flujo real de taller + README del flujo | **pending** | |

### Extra ya hecho (fuera de la numeración D, pero en main)

- Menú agrupado Comercial / Taller / Insumos / Más (chips visuales + grupo activo).  
- Cabeceras por módulo (qué hace cada pantalla; Clientes aclara “sin stock”).  
- Dashboard: atajos rápidos (Órdenes, Cotizar, Clientes, Inventario) y KPIs clickeables.  
- Hash deep-link (`#orders`, `#clients`) y teclado flechas en la barra.  
- Aislamiento de paneles y fix HTML Zero Waste.  
- Catálogo Tormenta (líneas, badges Vegan / A medida).  
- Doc de marca (`DESARROLLO.md`, `MARCA_TORMENTA.md`).

### Nunca recortar (v2.1)

1. `stock_deducted` + descuento al `terminado`  
2. `from-quote`  
3. Paridad mock offline  
4. Texto WhatsApp listo  

### Se puede recortar si aprieta el tiempo

KPI “Por cobrar” · `POST .../payments` separado · pulido visual no bloqueante.

---

## 6. Orden de trabajo recomendado (para el próximo agente/humano)

### Ahora mismo → cerrar v2.1

```text
D4  from-quote + payment_status en create
  → D5  tests T2, T7 (+ regresión)
  → D6  mock offline idéntico
  → D7  UI cotizador → orden
  → D8  UI órdenes enriquecida
  → D9  WhatsApp listo + touch
  → D10 QA escenario Tormenta (sección 10 del plan)
```

### Después de v2.1 (backlog, no empezar sin acuerdo)

1. PWA instalable en el celu del taller  
2. Vista “mesa de corte” (mapa + checklist herrajes)  
3. Lista de compra automática desde pedidos en curso  
4. Historial de versiones de medidas del cliente  
5. PDF remito con branding Tormenta  
6. Nesting 2D real  
7. SQLite / sync nube (solo si el JSON duele de verdad)  

---

## 7. Contrato para coding agents / robots

### Checklist antes de escribir código

- [ ] Leí este documento y el plan D4+ pendiente.  
- [ ] Corrí `pytest test_main.py` y está verde (o anoté fallos).  
- [ ] Sé qué día (D#) estoy implementando; no salteo el núcleo de stock.  
- [ ] No reescribo en React/Vue/Next.  
- [ ] UI en **español**.  

### Checklist al terminar un día

- [ ] Tests nuevos o actualizados en verde.  
- [ ] Si toqué API: misma semántica en `mockApiHandler` (o ticket explícito para D6 si aún no es el día).  
- [ ] Si toqué frontend: `static/` + copias en raíz sincronizadas.  
- [ ] Actualicé la tabla de progreso en **este doc** y en `PLAN_IMPLEMENTACION_PEDIDOS.md`.  
- [ ] Commit enfocado: mensaje con `D#` (ej. `feat(orders): D4 from-quote endpoint`).  
- [ ] No incluí `.env`, `.env.local`, tokens ni basura de tests en JSON de inventario/movimientos.

### No negociables (repetidos a propósito)

1. Al pasar a **`terminado`**: descontar BOM una sola vez (`stock_deducted`).  
2. Sin stock: **400**, estado de la orden **no** cambia.  
3. Online ≡ offline.  
4. No borrar datos de negocio del taller sin backup.  

### Estilo de PR / commit

```text
feat(orders): D4 POST /api/orders/from-quote
fix(ui): isolate tab panes so inventory never bleeds into clients
docs: update DESARROLLO progress D4 done
```

Un día = un commit o un PR pequeño. Preferible a un monstruo de 10 archivos sin tests.

---

## 8. Tests del release (referencia)

| # | Caso | Estado orientativo |
|---|------|--------------------|
| T1 | Orden con seña 50% → `payment_status=seña` | Cubierto |
| T2 | `from-quote` → 201 + snapshots | **Pendiente (D4/D5)** |
| T3 | pendiente → en_confeccion sin tocar stock | Cubierto |
| T4 | → terminado con stock OK | Cubierto |
| T5 | → terminado sin stock → 400 | Cubierto |
| T6 | segundo terminado idempotente | Cubierto |
| T7 | whatsapp-ready | **Pendiente (D9/D5)** |
| T8 | producción manual sigue OK | Cubierto (regresión) |
| T9 | órdenes legacy con defaults | Cubierto |

Comando:

```powershell
uv run --with fastapi --with uvicorn --with pytest --with httpx pytest test_main.py -q
```

---

## 9. Criterio de “release listo” (DoD v2.1)

Escenario de aceptación (online **y** offline):

> Llega un DM por un **arnés corporal** talle L.  
> En Bystorm: cliente → cotiza → crea orden con seña 50% → en confección → terminado (stock baja una vez) → WhatsApp listo → saldo → entregado.  
> Dashboard e inventario coherentes. Usable en celular para avanzar estado y abrir WhatsApp.

Si eso funciona, v2.1 está listo aunque falte brillo visual.

---

## 10. Convenciones de datos y archivos

| Archivo | Contenido | ¿Commitear cambios de stock de prueba? |
|---------|-----------|----------------------------------------|
| `products_data.json` | Catálogo / BOM | Sí, si es mejora de catálogo real |
| `clients_data.json` | Clientes | Cuidado: datos reales del taller |
| `orders_data.json` | Pedidos | Preferir no commitear basura de tests |
| `inventory_*.json` | Stock y movimientos | **No** commitear residuos de pytest |
| `production_data.json` | Historial confección | Idem |

Antes de commit: si los tests ensuciaron movimientos/stock, restaurar desde `main` o dejar solo cambios intencionales (ej. renombrar “cuerina vegana”).

---

## 11. Comunicación con la beneficiaria

- Lenguaje de UI: español claro de taller (seña, saldo, a medida, listo).  
- Materialidad: **vegan** / cuerina / charol vegano — no “cuero animal”.  
- Canal real: Instagram DM; la app no reemplaza el IG, lo **soporta**.  
- Validar BOMs y precios de herrajes con ella cuando se pueda; el catálogo actual es alineación de marca, no cotización contable oficial.

---

## 12. Arranque en 10 minutos (nuevo contribuidor)

1. Clonar el repo y abrir este archivo.  
2. `uv run main.py` → http://127.0.0.1:8000  
3. `pytest test_main.py`  
4. Leer D4 en el plan de pedidos.  
5. Implementar **solo D4** + tests T2.  
6. Actualizar tablas de progreso.  
7. Commit / push según el flujo del equipo.

---

## 13. Historial breve de decisiones

| Decisión | Motivo |
|----------|--------|
| FastAPI + JSON, no SQLite aún | Simple, portable, suficiente para un taller |
| Vanilla JS, no React | Menos fricción, Netlify offline mock |
| `static/` canónico | Evitar divergencia root/static |
| Descuento stock en `terminado` | Refleja “ya se confeccionó y se usaron insumos” |
| Idempotencia `stock_deducted` | Evitar doble descuento al reintentar |
| Catálogo por categorías Tormenta | UI y cotizador hablan el idioma de la marca |
| Menú Comercial / Taller / Insumos | Cada pantalla solo lo que necesita esa tarea |

---

## 14. Contacto del trabajo en curso

- **Release tag conceptual:** `pedidos-punta-a-punta`  
- **Plan detallado:** [`PLAN_IMPLEMENTACION_PEDIDOS.md`](./PLAN_IMPLEMENTACION_PEDIDOS.md)  
- **Siguiente tarea por defecto para un robot:** **D4** — `POST /api/orders/from-quote`

Si el usuario dice solo “seguí con Bystorm / Tormenta / pedidos”, asumir **D4** salvo que indique otro día o un bug urgente de producción.

---

*Documento vivo. Actualizar estado de días y “última actualización” en cada avance significativo.*

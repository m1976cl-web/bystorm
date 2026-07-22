# Plan de implementación — Pedidos de punta a punta

> **For coding agents / robotic apps:** This is the active implementation plan for release `pedidos-punta-a-punta` (Bystorm v2.1). Read this file fully before coding. Follow day order (D1→D10). Never skip: `stock_deducted` + inventory deduct on `terminado` + `from-quote` + offline mock parity + WhatsApp ready text. Keep FastAPI and `mockApiHandler` semantics identical. Prefer `static/` as frontend source of truth (see §9).

| Meta | Value |
|------|--------|
| **Status** | `ready-to-implement` |
| **Release** | `pedidos-punta-a-punta` / Bystorm v2.1 |
| **Repo** | https://github.com/m1976cl-web/bystorm |
| **Beneficiary** | [Tormenta Indumentaria](https://www.instagram.com/tormenta_indumentaria/) |
| **Horizon** | 8–10 effective days |
| **Plan date** | 2026-07-21 |
| **Primary paths** | `main.py`, `test_main.py`, `static/app.js`, `static/index.html`, `static/style.css` (sync root copies if still used) |

**Proyecto:** [bystorm](https://github.com/m1976cl-web/bystorm)  
**Beneficiaria:** [Tormenta Indumentaria](https://www.instagram.com/tormenta_indumentaria/)  
**Objetivo:** Convertir Bystorm de “calculadora de taller” en el flujo diario del emprendimiento: del DM a la entrega.  
**Horizonte:** 1–2 semanas de desarrollo enfocado  
**Fecha del plan:** 2026-07-21  

---

## 0. Instrucciones para desarrolladores y agentes

1. Clonar el repo y correr tests actuales antes de tocar código.  
2. Implementar en orden **D1 → D10** (sección 7). No saltear el núcleo de stock.  
3. Toda API nueva o cambiada debe tener **paridad en el mock offline** (`app.js` → `mockApiHandler`).  
4. No reescribir el frontend en un framework en este release.  
5. No agregar PWA, multi-usuario cloud, ni nesting 2D avanzado aquí (ver §11).  
6. Al terminar un día: actualizar este doc o un issue con `hecho / bloqueado / recortado`.  
7. Criterio de éxito: escenario de aceptación de la sección 10, online y offline.

**Entrypoints útiles**

| Acción | Comando / ruta |
|--------|----------------|
| Servidor local | `python main.py` o `run_app.bat` / `uv run main.py` → http://127.0.0.1:8000 |
| Tests | `pytest test_main.py` (deps en cabecera PEP 723 del test) |
| UI estática / Netlify | `index.html` + mock localStorage si no hay backend |
| Plan activo | este archivo |
| Índice docs | [docs/README.md](./README.md) |
| Guía agentes | [AGENTS.md](../AGENTS.md) |

---

## 1. Problema que resuelve

Hoy la emprendedora vende por Instagram y resuelve el resto a mano (mensajes, memoria, planillas, stock mental). Bystorm ya tiene piezas sueltas:

- Clientes + 22 medidas  
- Cotizador + WhatsApp + PDF  
- Órdenes con estados  
- Inventario + movimientos  
- Registro de producción  
- Dashboard (incl. órdenes atrasadas)  

**Falta el circuito cerrado:** cotización aceptada → orden con seña → confección → descuento de stock → aviso de listo → entrega con saldo.

Si no se descuenta stock al terminar, o no se registra seña/saldo, el sistema no refleja la realidad del taller.

---

## 2. Resultado esperado (Definition of Done del release)

Al terminar este plan, debe ser posible este camino **sin salir de la app** (online u offline):

1. Abrir/crear **cliente** (con o sin medidas).  
2. Cotizar una prenda del catálogo (o BOM custom).  
3. Crear **orden** desde esa cotización (un clic / un formulario prellenado).  
4. Cargar **seña** y ver **saldo pendiente**.  
5. Avanzar estados: `pendiente` → `en_confeccion` → `terminado` → `entregado`.  
6. Al pasar a **`terminado`**:  
   - descontar BOM del inventario (si hay stock),  
   - registrar producción,  
   - dejar movimientos trazables.  
7. Botón **“Avisar por WhatsApp: pedido listo”** (mensaje prearmado).  
8. Al **`entregado`**: registrar cobro del saldo (opcional) y cerrar la orden.  
9. Dashboard refleja prendas, ganancia, pendientes y atrasadas con datos consistentes.  
10. Uso **usable en celular** en el flujo órdenes + cotizador + WhatsApp.

**No entra en este release:** PWA completa, nesting 2D avanzado, multi-usuario cloud, reescritura de frontend, contabilidad formal AFIP.

---

## 3. Principios de diseño (para no desviarse)

| Principio | Aplicación |
|-----------|------------|
| **Ella primero** | Cada feature debe ahorrar tiempo real en IG/taller; si no, se posterga. |
| **Un solo flujo feliz** | Priorizar el camino feliz; edge cases con mensajes claros, no UI infinita. |
| **Online = offline** | Misma semántica en FastAPI y en el mock `localStorage` (Netlify). |
| **No romper datos** | Migraciones suaves: campos nuevos opcionales con defaults. |
| **Idempotencia** | Descontar stock **una sola vez** por orden (flag `stock_deducted`). |
| **Falla segura** | Si falta stock al terminar → bloquear o avisar fuerte; no silenciar. |

---

## 4. Modelo de datos (cambios)

### 4.1 Orden (`orders`) — campos nuevos / extendidos

| Campo | Tipo | Default | Notas |
|-------|------|---------|--------|
| `client_id` | string \| null | null | Ya puede existir; reforzar uso |
| `product_key` | string | — | Prenda del catálogo |
| `product_name` | string | — | Snapshot del nombre al crear |
| `quantity` | int | 1 | |
| `size` | string | "M" | Talle o "a medida" |
| `status` | enum | `pendiente` | Sin cambio de máquina base |
| `due_date` | date string | null | Ya existe en espíritu del KPI |
| `quoted_price` | float | 0 | Precio de venta acordado |
| `deposit_amount` | float | 0 | Seña cobrada |
| `deposit_date` | date \| null | null | |
| `balance_amount` | float | calc | `quoted_price - deposit_amount - extra_payments` |
| `amount_paid_total` | float | 0 | Suma de cobros (seña + saldo + extras) |
| `payment_status` | enum | `sin_pago` | `sin_pago` \| `seña` \| `pagado` |
| `materials_cost_snapshot` | float \| null | null | Del cotizador al crear |
| `labor_cost_snapshot` | float \| null | null | |
| `retail_price_snapshot` | float \| null | null | Alias útil de quoted_price |
| `stock_deducted` | bool | false | **Crítico** para no descontar 2 veces |
| `production_id` | string \| null | null | Link al registro de producción |
| `notes` | string | "" | Ya existe probablemente |
| `contact_phone` | string | "" | Para WhatsApp (o del cliente) |
| `whatsapp_ready_sent_at` | datetime \| null | null | Opcional, solo tracking |

**Estados válidos (sin cambiar nombres para no romper UI):**

```
pendiente → en_confeccion → terminado → entregado
```

Reglas:

- No se puede ir a `terminado` si `stock_deducted` fallaría por falta de stock (configurable: bloquear vs. permitir con override).  
- **Default recomendado:** bloquear y listar faltantes.  
- Al pasar a `terminado` con éxito: `stock_deducted = true` + crear production record.  
- Volver atrás de `terminado` → `en_confeccion` **no reingresa stock automáticamente** en v1 (evitar complejidad); documentar.  

### 4.2 Pagos simples (opción A — embebido, preferida en v1)

Sin tabla nueva: solo campos en la orden (`deposit_amount`, `amount_paid_total`, `payment_status`).

**Opción B (si sobra tiempo):** array `payments: [{date, amount, method, note}]`. Dejar como mejora post-release.

### 4.3 Producción

Al auto-crear desde orden:

- `product_name`, `quantity`, `product_key`  
- `materials_cost` / `labor_cost` / `retail_price` / `profit` desde snapshots o recálculo  
- `order_id` (campo nuevo opcional en production records)  

### 4.4 Inventario

Reutilizar lógica existente de descuento por BOM al registrar producción. Extraer a función compartida:

```text
deduct_bom_for_product(product_key, quantity, reference) -> movements[]
```

Usar la misma función desde:

- `POST /api/production` (actual)  
- transición de orden a `terminado` (nuevo)  

---

## 5. API (backend FastAPI)

### 5.1 Endpoints a ajustar / crear

| Método | Ruta | Cambio |
|--------|------|--------|
| `POST` | `/api/orders` | Aceptar campos de precio/seña/snapshots; calcular `payment_status` |
| `PUT` | `/api/orders/{id}` | Idem |
| `PUT` | `/api/orders/{id}/status` | **Orquestar** side-effects al cambiar estado |
| `POST` | `/api/orders/{id}/payments` | *(opcional v1.1)* Registrar cobro parcial |
| `POST` | `/api/orders/from-quote` | **Nuevo:** body de cotización + client_id → crea orden |
| `GET` | `/api/orders/{id}/whatsapp-ready` | **Nuevo:** devuelve texto + URL `wa.me` |

### 5.2 Lógica de `PUT .../status` (núcleo del release)

```
input: order_id, new_status

1. Validar transición (solo adelante en v1, o matriz simple).
2. Si new_status == "terminado" y not order.stock_deducted:
   a. Cargar BOM del product_key
   b. Verificar stock suficiente para quantity
   c. Si falta → 400 con detalle de faltantes (no cambiar estado)
   d. Si ok → deduct + movements (tipo produccion, ref = orden)
   e. Crear production record; order.production_id = ...
   f. order.stock_deducted = true
3. Si new_status == "entregado":
   a. Opcional: si balance > 0, no bloquear pero flag payment_status
4. Guardar status + updated_at
5. Return order actualizada
```

### 5.3 `POST /api/orders/from-quote`

Body sugerido:

```json
{
  "client_id": "abc123",
  "product_key": "arnes_body",
  "quantity": 1,
  "size": "L",
  "quoted_price": 45000,
  "deposit_amount": 22500,
  "due_date": "2026-08-01",
  "materials_cost_snapshot": 12000,
  "labor_cost_snapshot": 8000,
  "notes": "Hebillas negras, sin níquel",
  "contact_phone": "54911..."
}
```

Respuesta: orden creada en `pendiente` con `payment_status` calculado.

### 5.4 WhatsApp “pedido listo”

Generar texto:

```
Hola {nombre}! ⚡
Tu pedido de Tormenta Indumentaria ya está listo:
• {product_name} × {quantity} (talle {size})
• Total: ${quoted_price}
• Saldo: ${balance}
Podés retirar / coordinamos envío cuando quieras.
Gracias por confiar en Tormenta 🖤
```

URL: `https://wa.me/{phone}?text={urlencoded}`  
Si no hay teléfono → devolver solo `text` para copiar.

### 5.5 Mock offline (`app.js` → `mockApiHandler`)

Implementar **la misma semántica** para:

- create order con campos nuevos  
- status transition + stock  
- from-quote  
- whatsapp-ready  

Sin esto, Netlify y el modo local mienten respecto al PC con FastAPI.

---

## 6. Frontend (UI)

### 6.1 Cotizador → Orden

En pestaña **Cotizador**, tras un quote exitoso:

- Botón primario: **“Crear orden de este presupuesto”**  
- Modal/form corto: cliente, talle, seña, fecha entrega, notas, teléfono WA  
- Submit → `from-quote` → toast + link a pestaña Órdenes  

### 6.2 Órdenes — ficha enriquecida

En lista/Kanban/detalle:

- Badge de **pago:** Sin pago / Seña / Pagado  
- Monto: Total · Seña · Saldo  
- Indicador **Stock descontado** (sí/no)  
- Botones de acción contextuales:  
  - Avanzar estado (ya existe `advanceOrderStatus`)  
  - **Registrar seña / cobro** (input simple)  
  - **WhatsApp: pedido listo** (solo si `terminado` o `entregado`)  
  - Ver cliente / medidas  

### 6.3 Confirmaciones

Al ir a `terminado`:

```
Se descontará del inventario el BOM de N× {prenda}.
¿Continuar?
```

Si 400 por stock: modal con faltantes y CTA a Inventario / lista de compra (link a pestaña).

### 6.4 Dashboard

Sin rediseño grande:

- KPI pendientes / atrasadas (ya hay)  
- Opcional: KPI **“Por cobrar”** = suma de `balance_amount` de órdenes no pagadas del todo  

### 6.5 Móvil (mínimo viable de este release)

No es PWA completa; checklist de UX:

- [ ] Botones de avanzar estado y WhatsApp con área táctil ≥ 44px  
- [ ] Formulario “crear orden desde cotización” usable en 360px  
- [ ] Kanban scrolleable horizontal sin romper header  
- [ ] `wa.me` abre la app de WhatsApp en el teléfono  
- [ ] Toasts no tapan botones de acción  

Aprovechar el trabajo reciente de responsive (commits de 2026-07-21).

---

## 7. Fases y orden de trabajo

### Semana 1 — Núcleo de datos y backend

| Día | Entrega | Detalle |
|-----|---------|--------|
| **D1** | Modelo + migración suave | Extender `OrderCreate` / records; defaults; no romper órdenes viejas |
| **D2** | `deduct_bom` compartido | Refactor de producción actual + tests de regresión |
| **D3** | Status orquestado | `PUT /status` con descuento + production; flag `stock_deducted` |
| **D4** | `from-quote` + pagos embebidos | Crear orden desde presupuesto; payment_status |
| **D5** | Tests API | Ver sección 8; dejar verde en CI local |

### Semana 2 — UI, offline, pulido taller

| Día | Entrega | Detalle |
|-----|---------|--------|
| **D6** | Mock offline paridad | Mismas rutas y reglas en `mockApiHandler` |
| **D7** | UI Cotizador → Orden | Botón + modal prellenado |
| **D8** | UI Órdenes enriquecida | Seña/saldo, badges, confirmación terminar |
| **D9** | WhatsApp listo + móvil | Endpoint/texto + botones + checklist touch |
| **D10** | QA con datos reales de taller | Seed de demo Tormenta; fix bugs; README del flujo |

**Buffer:** si algo se atrasa, recortar en este orden (primero se corta lo de abajo):

1. KPI “Por cobrar”  
2. `POST .../payments` separado  
3. `order_id` en production  
4. Pulido visual no bloqueante  

**Nunca recortar:** stock_deducted + descuento al terminar + from-quote + mock parity + WhatsApp texto.

---

## 8. Tests (obligatorios del release)

Archivo: ampliar `test_main.py` (y/o `test_orders_flow.py`).

| # | Caso | Esperado |
|---|------|----------|
| T1 | Crear orden con seña 50% | `payment_status == "seña"`, balance correcto |
| T2 | `from-quote` | 201 + campos snapshot |
| T3 | pendiente → en_confeccion | Sin tocar stock |
| T4 | → terminado con stock OK | stock baja, movement produccion, `stock_deducted`, production creada |
| T5 | → terminado sin stock | 400, estado **no** cambia, stock intacto |
| T6 | → terminado otra vez | No descuenta de nuevo (idempotente) |
| T7 | whatsapp-ready | text no vacío; wa link si hay phone |
| T8 | Producción manual sigue funcionando | Regresión del test actual de production |
| T9 | Órdenes legacy sin campos nuevos | GET/PUT no rompen (defaults) |

Manual (checklist de la emprendedora / tester):

- [ ] Cotizar arnés body → crear orden → seña → confección → terminado → WA → entregado  
- [ ] Intentar terminar sin remaches suficientes → mensaje claro  
- [ ] Mismo flujo en Netlify (offline)  
- [ ] Celular: avanzar estado y abrir WhatsApp  

---

## 9. Archivos a tocar (mapa)

```
main.py                 # modelos Order*, deduct, status, from-quote, whatsapp
test_main.py            # tests del flujo
app.js / static/app.js  # mock + UI handlers (¡mantener sync!)
index.html / static/    # botones, modal, badges
style.css / static/     # touch targets, badges pago
README.md               # flujo diario Tormenta (corto)
```

**Riesgo conocido:** duplicación root ↔ `static/`.  
**Regla de este plan:** editar **ambos** o introducir un script `sync_static.ps1` / copiar en el bat. Preferible en D1: *una sola fuente* (`static/` como canónica + copiar a root en build, o al revés).

Propuesta mínima D1:

```
static/  = fuente de verdad del frontend
root app.js/index.html/style.css = copias generadas o eliminadas del serve Netlify
netlify.toml publish = "static"   # si se unifica
```

Decisión a tomar el día 1 y no reabrir.

---

## 10. Criterios de aceptación orientados a Tormenta

Escenario de aceptación final:

> La dueña de Tormenta recibe un DM por un **Arnés Corporal Integral** talle L.  
> En Bystorm: busca/crea cliente, cotiza, crea orden con seña 50%, fecha en 10 días.  
> Durante la semana avanza a “en confección”.  
> Al terminar, la app descuenta cinta/argollas/hebillas/… y registra la prenda.  
> Toca “WhatsApp pedido listo”, manda el mensaje, cobra el saldo, marca entregado.  
> El dashboard del mes muestra la ganancia y el stock quedó coherente.

Si ese relato funciona online y offline, el release está listo.

---

## 11. Fuera de alcance (backlog post-release)

Ordenado por valor para el taller, no por “brillo técnico”:

1. PWA instalable (icono en el celu del taller)  
2. Vista “mesa de corte” solo con mapa + checklist herrajes  
3. Lista de compra automática desde pedidos en curso  
4. Historial de versiones de medidas del cliente  
5. PDF remito con branding Tormenta  
6. Nesting 2D real  
7. SQLite / sync nube  
8. Fotos por orden  

---

## 12. Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Descontar stock dos veces | Flag `stock_deducted` + tests T4/T6 |
| Órdenes viejas sin precio | Defaults 0; UI muestra “Sin precio cargado” |
| Offline ≠ online | Paridad mock obligatoria D6; misma checklist |
| Duplicados static/root | Decisión D1 + script o un solo publish |
| Bloqueo por stock frustra | Mensaje con faltantes + link a inventario; no fallar en silencio |
| Teléfono WA mal formateado | Normalizar a dígitos; si falla, copiar texto al clipboard |

---

## 13. Cómo arrancar el día 1 (checklist técnico)

1. Clonar repo y correr tests actuales: `pytest test_main.py` (o `uv run pytest`).  
2. Decidir fuente de verdad del frontend (`static/` recomendado).  
3. Extender modelos de orden con campos opcionales.  
4. Escribir primero los tests T1–T6 en rojo.  
5. Implementar hasta verde.  
6. Solo después UI.

Enfoque **test-first en el núcleo de stock**; UI puede ser más exploratoria.

---

## 14. Resumen ejecutivo

| Ítem | Valor |
|------|--------|
| **Nombre del release** | `pedidos-punta-a-punta` / Bystorm v2.1 |
| **Duración** | 8–10 días efectivos |
| **Valor de negocio** | Del DM de Instagram a la entrega con stock y plata ordenados |
| **Éxito medible** | 1 flujo completo sin planilla externa + stock coherente |
| **Siguiente plan** | PWA + mesa de corte + lista de compra |

---

## 15. Tracking de progreso (actualizar en PRs)

| Día | Estado | PR / notas |
|-----|--------|------------|
| D1 | done | Modelo Order extendido + normalización legacy; `static/` canónico (`netlify.toml` + `sync_static.ps1`); tests T1/T9 |
| D2 | done | `deduct_bom_for_product` + `check_bom_stock` + `_bom_requirements`; producción usa el helper |
| D3 | done | `PUT /status` → `terminado` descuenta BOM, crea production, `stock_deducted`; 400 si falta stock; T3–T6 |
| D4 | pending | |
| D5 | pending | |
| D6 | pending | |
| D7 | pending | |
| D8 | pending | |
| D9 | pending | |
| D10 | pending | |

Estados permitidos: `pending` · `in_progress` · `done` · `blocked` · `cut`.

---

*Documento vivo en el repo para humanos y apps robóticas. Actualizar al cerrar cada día.*

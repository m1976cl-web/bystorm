# Bystorm — Optimizador de Taller

Herramienta de taller para **[Tormenta Indumentaria](https://www.instagram.com/tormenta_indumentaria/)**  
(slow fashion / indumentaria alternativa: arneses, corsets, chokers, máscaras, etc.)

**Repo:** https://github.com/m1976cl-web/bystorm

## Qué es

Bystorm ayuda a operar el taller día a día: escalado de patrones, optimización zero waste, cotización, clientes, inventario, proveedores, órdenes y dashboard.  
Funciona **online** (FastAPI + JSON local) y **offline** (mock en `localStorage` para Netlify/Jamstack).

## Plan de desarrollo activo

| Documento | Descripción |
|-----------|-------------|
| **[docs/DESARROLLO.md](docs/DESARROLLO.md)** | **Documento maestro** — orden del trabajo, estado, reglas para humanos y robots |
| [docs/PLAN_IMPLEMENTACION_PEDIDOS.md](docs/PLAN_IMPLEMENTACION_PEDIDOS.md) | Release v2.1 — *Pedidos de punta a punta* (cotización → seña → stock → WhatsApp listo) |
| [docs/MARCA_TORMENTA.md](docs/MARCA_TORMENTA.md) | Contexto de marca / Instagram / catálogo |
| [docs/README.md](docs/README.md) | Índice de documentación |
| [AGENTS.md](AGENTS.md) | Guía corta para coding agents / apps robóticas |

Cualquier desarrollador o agente debe leer **`docs/DESARROLLO.md`** y el plan activo antes de implementar features nuevas.  
Si solo se indica “seguir con Bystorm/pedidos”, el siguiente paso por defecto es **D4** (`from-quote`).

## Arranque rápido

```bash
# Requiere Python 3.11+
python main.py
# alternativa
uv run main.py
```

En Windows también podés usar `run_app.bat`.  
Abrí http://127.0.0.1:8000

```bash
# Tests
pytest test_main.py
```

## Stack

- **Backend:** FastAPI (`main.py`), persistencia JSON  
- **Frontend:** HTML/CSS/JS vanilla (`static/` y copias en raíz)  
- **Deploy estático:** Netlify (`netlify.toml`) con modo offline  

## Módulos de la app

Dashboard · Escalado · Zero Waste · Lotes · Catálogo · Cotizador · Historial · Clientes · Tendencias · Inventario · Proveedores · Órdenes

## Contribución

1. Leé [docs/DESARROLLO.md](docs/DESARROLLO.md) y el plan en `docs/` (orden D1→D10; **siguiente: D4**).  
2. Mantené paridad **API FastAPI ↔ mock offline**.  
3. Editá frontend en **`static/`** y sincronizá copias en la raíz.  
4. No reescribas el stack sin acuerdo.  
5. UI y textos de usuaria en **español**.  
6. Tests: `pytest test_main.py` (o con `uv run … pytest`).  
7. Agentes automáticos: [AGENTS.md](AGENTS.md) + [docs/DESARROLLO.md](docs/DESARROLLO.md).

## Marca

Hecho para el taller de [Tormenta Indumentaria](https://www.instagram.com/tormenta_indumentaria/).

# Documentación Bystorm

Herramienta de taller para **[Tormenta Indumentaria](https://www.instagram.com/tormenta_indumentaria/)**  
Repo: https://github.com/m1976cl-web/bystorm

## Empezá acá

| Documento | Descripción |
|-----------|-------------|
| **[DESARROLLO.md](./DESARROLLO.md)** | **Documento maestro** — orden del trabajo, estado D1–D10, reglas para humanos y robots |
| [AGENTS.md](../AGENTS.md) | Contrato corto para coding agents |
| [PLAN_IMPLEMENTACION_PEDIDOS.md](./PLAN_IMPLEMENTACION_PEDIDOS.md) | Spec del release v2.1 `pedidos-punta-a-punta` |
| [MARCA_TORMENTA.md](./MARCA_TORMENTA.md) | Marca, Instagram, catálogo vegan / a medida |

## Planes / specs

| Documento | Estado | Audiencia |
|-----------|--------|-----------|
| [DESARROLLO.md](./DESARROLLO.md) | **Activo** — brújula del proyecto | Humanos + agentes |
| [PLAN_IMPLEMENTACION_PEDIDOS.md](./PLAN_IMPLEMENTACION_PEDIDOS.md) | **Activo** — release v2.1 (D1–D3 done, D4+ pending) | Humanos + agentes |
| [MARCA_TORMENTA.md](./MARCA_TORMENTA.md) | Contexto de marca | Humanos + agentes |

## Para desarrolladores humanos

1. Leer **[DESARROLLO.md](./DESARROLLO.md)**.  
2. Seguir el orden D1→D10 del plan de pedidos (el siguiente es **D4**).  
3. Mantener paridad online (FastAPI) / offline (`mockApiHandler`).  
4. Editar frontend en `static/` y sincronizar a la raíz.  
5. No ampliar alcance fuera de “Fuera de alcance” del plan sin acuerdo.

## Para apps robóticas / coding agents

1. Leer **[AGENTS.md](../AGENTS.md)** y **[DESARROLLO.md](./DESARROLLO.md)**.  
2. Cargar el plan de pedidos para el día (D#) a implementar.  
3. Preferir cambios pequeños y testeados; no reescribir el stack.  
4. Al terminar: tests verdes, tabla de progreso actualizada, commit con `D#`.  
5. Si el usuario dice “seguí con Bystorm/Tormenta/pedidos” sin más detalle → **D4**.

## Contexto de producto

Bystorm no es un ERP genérico: es el **sistema operativo del taller** de una marca slow fashion vegan que vende por Instagram (arneses, corsets, chokers, máscaras, lencería, etc.).  
Prioridad: acortar el camino **DM → medidas → cotización → seña → confección → stock → entrega**.

# Documentación Bystorm

Herramienta de taller para **[Tormenta Indumentaria](https://www.instagram.com/tormenta_indumentaria/)**  
Repo: https://github.com/m1976cl-web/bystorm

## Planes activos

| Documento | Estado | Audiencia |
|-----------|--------|-----------|
| [PLAN_IMPLEMENTACION_PEDIDOS.md](./PLAN_IMPLEMENTACION_PEDIDOS.md) | **Activo** — release v2.1 `pedidos-punta-a-punta` | Humanos + agentes de código |
| [MARCA_TORMENTA.md](./MARCA_TORMENTA.md) | Contexto de marca e Instagram (catálogo alineado) | Humanos + agentes |

## Para desarrolladores humanos

1. Leer el plan activo de punta a punta.  
2. Seguir el orden D1→D10.  
3. Mantener paridad online (FastAPI) / offline (`mockApiHandler`).  
4. No ampliar alcance fuera de la sección “Fuera de alcance” del plan sin acuerdo.

## Para apps robóticas / coding agents

1. Leer primero **[AGENTS.md](../AGENTS.md)** en la raíz del repo.  
2. Cargar el plan activo completo antes de editar.  
3. Preferir cambios pequeños y testeados; no reescribir el stack.  
4. Al abrir PR: referenciar el día (D#) y actualizar la tabla de progreso del plan si aplica.

## Contexto de producto

Bystorm no es un ERP genérico: es el **sistema operativo del taller** de una marca slow fashion que vende por Instagram (arneses, corsets, chokers, máscaras, etc.).  
Prioridad de producto: acortar el camino **DM → medidas → cotización → seña → confección → stock → entrega**.

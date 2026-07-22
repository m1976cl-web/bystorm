# Tormenta Indumentaria — contexto de marca para el desarrollo

> Fuente principal: [Instagram @tormenta_indumentaria](https://www.instagram.com/tormenta_indumentaria/)  
> App: **Bystorm** (este repo)

## Quién es

Marca de **indumentaria del deseo** hecha a mano en **Santiago, Chile**, desde **2014**.

| Atributo | Valor (según perfil y menciones públicas) |
|----------|-------------------------------------------|
| Posicionamiento | Fetiche · BDSM · Fantasía |
| Producción | Hecho a mano / slow fashion |
| Materialidad | **Vegan** (no cuero animal; cuerina/charol vegano, cintas, herrajes) |
| Canal principal | Instagram (DM → pedido a medida) |
| Uso de las piezas | Look editorial, performance, lencería, escena |

## Líneas de producto a priorizar en Bystorm

Ordenadas por encaje con lo que se ve y se menciona de la marca:

1. **Arneses** — pechera, body harness, ligas de muslo, arnés de cabeza  
2. **Máscaras** — performance / gótico / escena  
3. **Collares y chokers** — D-ring, con cadena  
4. **Corsetería vegana** — underbust / overbust (cuerina + varillas + ojalillos)  
5. **Portaligas y cinturones** — con mosquetones y argollas  
6. **Accesorios de muñeca/brazo** — brazaletes, muñequeras con remaches  
7. **Lencería / piezas de deseo** — tops, conjuntos, faldas tubo o similares  
8. **Piezas con cadena** — acentos metálicos (colaboraciones y looks de feed)

## Cómo se vende (flujo real)

```
DM Instagram → medidas / talle → cotización → adelanto → confección a pedido → listo → entrega
```

Eso es el norte del release `pedidos-punta-a-punta` (v2.1).  
Bystorm **no** es un e-commerce genérico: es el sistema del taller detrás del Instagram.

## Lenguaje en la app (español)

| Evitar | Preferir |
|--------|----------|
| Cuero (animal) | Cuerina / charol vegano / material vegano |
| Stock masivo / fast fashion | Pedido a medida, slow fashion, ficha de cliente |
| ERP / factura AFIP | Adelanto, saldo, WhatsApp listo, orden de confección |
| Inglés innecesario en UI | Términos en español; claves técnicas en inglés OK en código |

## Implicancias técnicas en Bystorm

- Catálogo en `products_data.json` con `category`, `description`, `material`, `vegan`, `made_to_order`.  
- BOM realista en **cinta, argollas, hebillas, remaches, cadenas, paneles de cuerina**, etc.  
- Medidas de cliente (22 puntos) sirven para arneses y corsetería a medida.  
- Cotizador y WhatsApp son el puente con el DM de Instagram.

## Limitaciones de esta investigación

El perfil de Instagram a menudo requiere login; el catálogo de Bystorm se alinea a **bio + menciones públicas + estética de marca**, no a un scraping de cada post.  
Si Tormenta entrega una lista oficial de prendas o precios de herrajes, actualizar `products_data.json` y costos del cotizador con esos datos reales del taller.

## Enlaces

- Instagram: https://www.instagram.com/tormenta_indumentaria/  
- Plan activo: [PLAN_IMPLEMENTACION_PEDIDOS.md](./PLAN_IMPLEMENTACION_PEDIDOS.md)  
- Guía agentes: [AGENTS.md](../AGENTS.md)

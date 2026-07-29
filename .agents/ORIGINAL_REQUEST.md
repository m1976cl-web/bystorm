# Original User Request

## 2026-07-23T18:12:00Z

<USER_REQUEST>
Desarrollar e integrar el Módulo de Catálogo Avanzado con Variantes de Producto para Bystorm (Tormenta Indumentaria), permitiendo gestionar prendas con combinaciones de materiales (cuerina mate, charol vegano, vinilo), colores de herrajes (negro mate, niquelado/plateado, dorado, cromo), fotos de referencia y recalcular automáticamente costos y BOMs.

Working directory: C:\Users\user\.gemini\antigravity\scratch\ByStorm
Integrity mode: benchmark

## Requirements

### R1. Estructura y Gestión de Variantes de Producto
- Ampliar el esquema de productos (`products_data.json` y `main.py`) para soportar múltiples variantes por modelo (color de material, acabado de herraje, variaciones de BOM).
- Permitir agregar, editar y eliminar variantes directamente desde la interfaz del Catálogo (`static/index.html` y `static/app.js`).

### R2. Integración Dinámica con el Cotizador y Taller
- Al seleccionar un producto en el Cotizador o al crear un pedido en Órdenes, permitir elegir la variante específica de la prenda.
- Recalcular automáticamente el costo de materiales, mano de obra y consumo de insumos (BOM) en función de las características de la variante elegida.

### R3. Previsualización Visual y Galería de Referencia
- Añadir campo de imagen de referencia o selector de color visual en la ficha de producto del Catálogo.
- Mantener compatibilidad total con el Modo Taller y la ergonomía táctil en dispositivos móviles.

## Acceptance Criteria

### Verificación del Sistema
- [ ] La API de FastAPI (`main.py`) soporta `GET/POST/PUT` de productos con estructuras de variantes sin romper compatibilidad legacy.
- [ ] El mock offline `mockApiHandler` en `static/app.js` mantiene 100% de paridad funcional para uso sin backend en Netlify.
- [ ] La suite de pruebas `test_main.py` se extiende con casos de prueba para variantes de producto y pasa al 100% con `pytest`.
- [ ] Sincronización automática de archivos estáticos `static/` ➔ raíz del proyecto.
</USER_REQUEST>

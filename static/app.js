/**
 * TORMENTA INDUMENTARIA - OPTIMIZADOR DE TALLER
 * Lógica de Frontend, SVG y Comunicación con API FastAPI
 */

// --- CORTE E INTERCEPCION MOCK PARA NETLIFY (JAMSTACK SPA) ---
let backendAvailable = null;
let backendCheckPromise = null;
const originalFetch = window.fetch;

// Constantes y Base de Datos Mock
const DB_PREFIX = "t_db_";

const DEFAULT_INVENTORY = [
  { "item_key": "argollas", "name": "Argollas metálicas", "stock": 88.0, "min_stock": 20, "unit": "uds" },
  { "item_key": "hebillas", "name": "Hebillas reguladoras", "stock": 72.0, "min_stock": 15, "unit": "uds" },
  { "item_key": "remaches", "name": "Remaches de unión", "stock": 276.0, "min_stock": 50, "unit": "uds" },
  { "item_key": "ojalillos", "name": "Ojalillos metálicos", "stock": 200.0, "min_stock": 30, "unit": "uds" },
  { "item_key": "varillas", "name": "Varillas de soporte", "stock": 50.0, "min_stock": 10, "unit": "uds" },
  { "item_key": "cadenas", "name": "Cadenas metálicas", "stock": 10.0, "min_stock": 2.0, "unit": "metros" },
  { "item_key": "tachas", "name": "Tachas decorativas", "stock": 134.0, "min_stock": 25, "unit": "uds" },
  { "item_key": "mosquetones", "name": "Mosquetones de enganche", "stock": 36.0, "min_stock": 8, "unit": "uds" },
  { "item_key": "cinta", "name": "Cinta/Correa", "stock": 15.0, "min_stock": 5.0, "unit": "metros" },
  { "item_key": "cuerina_rollo", "name": "Cuerina en rollo", "stock": 15.0, "min_stock": 3.0, "unit": "metros" }
];

const DEFAULT_PRODUCTS = {
  "arnes": {
    "name": "Arnés Pechera Tormenta (Base)",
    "cinta": 2.5,
    "argollas": 6,
    "hebillas": 4,
    "remaches": 12,
    "ojalillos": 0,
    "varillas": 0,
    "cadenas": 0.0,
    "tachas": 8,
    "mosquetones": 2,
    "panels_count": 0,
    "panel_width": 0.0,
    "panel_height": 0.0
  },
  "arnes_body": {
    "name": "Arnés Corporal Integral (Body Harness)",
    "cinta": 5.5,
    "argollas": 12,
    "hebillas": 8,
    "remaches": 24,
    "ojalillos": 0,
    "varillas": 0,
    "cadenas": 1.0,
    "tachas": 16,
    "mosquetones": 4,
    "panels_count": 0,
    "panel_width": 0.0,
    "panel_height": 0.0
  },
  "arnes_muslo": {
    "name": "Set Ligas de Muslo con Argollas O-Ring",
    "cinta": 1.8,
    "argollas": 4,
    "hebillas": 2,
    "remaches": 8,
    "ojalillos": 0,
    "varillas": 0,
    "cadenas": 0.0,
    "tachas": 4,
    "mosquetones": 2,
    "panels_count": 0,
    "panel_width": 0.0,
    "panel_height": 0.0
  },
  "choker_dring": {
    "name": "Gargantilla Choker D-Ring Neopunk",
    "cinta": 0.4,
    "argollas": 1,
    "hebillas": 1,
    "remaches": 4,
    "ojalillos": 0,
    "varillas": 0,
    "cadenas": 0.0,
    "tachas": 6,
    "mosquetones": 0,
    "panels_count": 0,
    "panel_width": 0.0,
    "panel_height": 0.0
  },
  "corset_underbust": {
    "name": "Corset Underbust de Cuero (Vesta)",
    "cinta": 3.5,
    "argollas": 0,
    "hebillas": 0,
    "remaches": 8,
    "ojalillos": 16,
    "varillas": 12,
    "cadenas": 0.0,
    "tachas": 6,
    "mosquetones": 0,
    "panels_count": 4,
    "panel_width": 25.0,
    "panel_height": 35.0
  },
  "corset_overbust": {
    "name": "Corset Overbust Neogótico (Couture)",
    "cinta": 4.5,
    "argollas": 4,
    "hebillas": 2,
    "remaches": 12,
    "ojalillos": 20,
    "varillas": 16,
    "cadenas": 2.0,
    "tachas": 12,
    "mosquetones": 2,
    "panels_count": 6,
    "panel_width": 20.0,
    "panel_height": 40.0
  },
  "mascara": {
    "name": "Máscara Gótica Shadow (Performance)",
    "cinta": 0.8,
    "argollas": 2,
    "hebillas": 1,
    "remaches": 8,
    "ojalillos": 0,
    "varillas": 0,
    "cadenas": 0.0,
    "tachas": 4,
    "mosquetones": 0,
    "panels_count": 1,
    "panel_width": 30.0,
    "panel_height": 25.0
  },
  "falda_latex": {
    "name": "Falda Tubo Neopunk con Cierre Frontal",
    "cinta": 0.5,
    "argollas": 0,
    "hebillas": 0,
    "remaches": 6,
    "ojalillos": 4,
    "varillas": 0,
    "cadenas": 0.0,
    "tachas": 4,
    "mosquetones": 0,
    "panels_count": 2,
    "panel_width": 45.0,
    "panel_height": 55.0
  },
  "cinturon_portaligas": {
    "name": "Cinturón Portaligas con Mosquetones",
    "cinta": 2.2,
    "argollas": 4,
    "hebillas": 3,
    "remaches": 12,
    "ojalillos": 0,
    "varillas": 0,
    "cadenas": 0.5,
    "tachas": 8,
    "mosquetones": 4,
    "panels_count": 0,
    "panel_width": 0.0,
    "panel_height": 0.0
  },
  "brazaletes": {
    "name": "Set de Brazaletes / Muñequeras con Remaches",
    "cinta": 0.6,
    "argollas": 0,
    "hebillas": 2,
    "remaches": 16,
    "ojalillos": 0,
    "varillas": 0,
    "cadenas": 0.0,
    "tachas": 10,
    "mosquetones": 0,
    "panels_count": 0,
    "panel_width": 0.0,
    "panel_height": 0.0
  }
};

function initMockDB() {
    if (!localStorage.getItem(DB_PREFIX + "inventory")) {
        localStorage.setItem(DB_PREFIX + "inventory", JSON.stringify(DEFAULT_INVENTORY));
    }
    if (!localStorage.getItem(DB_PREFIX + "products")) {
        localStorage.setItem(DB_PREFIX + "products", JSON.stringify(DEFAULT_PRODUCTS));
    }
    if (!localStorage.getItem(DB_PREFIX + "clients")) {
        localStorage.setItem(DB_PREFIX + "clients", JSON.stringify([]));
    }
    if (!localStorage.getItem(DB_PREFIX + "orders")) {
        localStorage.setItem(DB_PREFIX + "orders", JSON.stringify([]));
    }
    if (!localStorage.getItem(DB_PREFIX + "production")) {
        localStorage.setItem(DB_PREFIX + "production", JSON.stringify([
            {
                "id": "01ef24ad",
                "date": "2026-06-11T10:02:11.979715",
                "product_name": "Arnés Tormenta (Base)",
                "quantity": 1,
                "materials_cost": 1000.0,
                "labor_cost": 2000.0,
                "retail_price": 5000.0,
                "profit": 2000.0,
                "product_key": "arnes"
            },
            {
                "id": "f7ba1b0e",
                "date": "2026-06-11T10:07:15.318195",
                "product_name": "Arnés Tormenta (Base)",
                "quantity": 1,
                "materials_cost": 1000.0,
                "labor_cost": 2000.0,
                "retail_price": 5000.0,
                "profit": 2000.0,
                "product_key": "arnes"
            }
        ]));
    }
    if (!localStorage.getItem(DB_PREFIX + "movements")) {
        localStorage.setItem(DB_PREFIX + "movements", JSON.stringify([
            {
                "id": "72765859",
                "item_key": "cinta",
                "quantity": -2.5,
                "movement_type": "produccion",
                "reference": "Confección de 1x Arnés Tormenta (Base)",
                "date": "2026-06-11T10:07:15.314650"
            },
            {
                "id": "898536e1",
                "item_key": "argollas",
                "quantity": -6,
                "movement_type": "produccion",
                "reference": "Confección de 1x Arnés Tormenta (Base)",
                "date": "2026-06-11T10:07:15.315344"
            },
            {
                "id": "a6544f15",
                "item_key": "hebillas",
                "quantity": -4,
                "movement_type": "produccion",
                "reference": "Confección de 1x Arnés Tormenta (Base)",
                "date": "2026-06-11T10:07:15.315828"
            },
            {
                "id": "5c3b75a5",
                "item_key": "remaches",
                "quantity": -12,
                "movement_type": "produccion",
                "reference": "Confección de 1x Arnés Tormenta (Base)",
                "date": "2026-06-11T10:07:15.316292"
            },
            {
                "id": "11c9e79e",
                "item_key": "tachas",
                "quantity": -8,
                "movement_type": "produccion",
                "reference": "Confección de 1x Arnés Tormenta (Base)",
                "date": "2026-06-11T10:07:15.316784"
            },
            {
                "id": "d659e2d0",
                "item_key": "mosquetones",
                "quantity": -2,
                "movement_type": "produccion",
                "reference": "Confección de 1x Arnés Tormenta (Base)",
                "date": "2026-06-11T10:07:15.317352"
            }
        ]));
    }
    if (!localStorage.getItem(DB_PREFIX + "suppliers")) {
        localStorage.setItem(DB_PREFIX + "suppliers", JSON.stringify([
            {
                "id": "sup-distrimet",
                "name": "Herrajes DistriMet",
                "contact": "distrimet@gmail.com",
                "notes": "Proveedor mayorista de herrajes en Once. Compra mínima $20.000.",
                "prices": {
                    "argollas": 120.0,
                    "hebillas": 180.0,
                    "remaches": 15.0,
                    "ojalillos": 10.0,
                    "varillas": 450.0,
                    "cadenas": 850.0,
                    "tachas": 12.0,
                    "mosquetones": 250.0,
                    "cinta": 320.0,
                    "cuerina_rollo": 4200.0
                },
                "created_at": "2026-06-11T10:00:00.000Z"
            },
            {
                "id": "sup-cuernor",
                "name": "Cueros del Norte",
                "contact": "+54 11 5555-1234",
                "notes": "Cuerinas importadas y herrajes premium. Entrega en 48hs.",
                "prices": {
                    "argollas": 150.0,
                    "hebillas": 210.0,
                    "remaches": 18.0,
                    "ojalillos": 12.0,
                    "varillas": 480.0,
                    "cadenas": 920.0,
                    "tachas": 15.0,
                    "mosquetones": 280.0,
                    "cinta": 350.0,
                    "cuerina_rollo": 3800.0
                },
                "created_at": "2026-06-11T10:00:00.000Z"
            }
        ]));
    }
}

const getMockData = (key) => JSON.parse(localStorage.getItem(DB_PREFIX + key));
const setMockData = (key, data) => localStorage.setItem(DB_PREFIX + key, JSON.stringify(data));

// Inicializar base de datos mock local
initMockDB();

// Cálculos geométricos del taller en JS
function jsCalculateSizeValues(baseVal, baseIdx, targetIdx, increment, factor) {
    const diff = targetIdx - baseIdx;
    const scaledVal = baseVal + (diff * increment * factor);
    return Math.round(Math.max(0.0, scaledVal) * 100) / 100;
}

function jsCalculateMaxPanelsFromRoll(rollWidth, rollLengthM, panelW, panelH) {
    if (panelW <= 0 || panelH <= 0) {
        return { count: 0, orientation: "none" };
    }
    const rollLengthCm = rollLengthM * 100.0;
    
    // Orientación 1: Normal
    const panelsWNormal = Math.floor(rollWidth / panelW);
    const panelsHNormal = Math.floor(rollLengthCm / panelH);
    const countNormal = panelsWNormal * panelsHNormal;
    
    // Orientación 2: Rotado
    const panelsWRotated = Math.floor(rollWidth / panelH);
    const panelsHRotated = Math.floor(rollLengthCm / panelW);
    const countRotated = panelsWRotated * panelsHRotated;
    
    if (countNormal >= countRotated) {
        return {
            count: countNormal,
            orientation: "normal",
            cols: panelsWNormal,
            rows: panelsHNormal,
            used_width: panelsWNormal * panelW,
            used_length: panelsHNormal * panelH / 100.0
        };
    } else {
        return {
            count: countRotated,
            orientation: "rotated",
            cols: panelsWRotated,
            rows: panelsHRotated,
            used_width: panelsWRotated * panelH,
            used_length: panelsHRotated * panelW / 100.0
        };
    }
}

function jsCalculateCuerinaConsumedM(panelWidth, panelHeight, neededPanels) {
    const ROLL_WIDTH = 140.0;
    if (neededPanels <= 0 || panelWidth <= 0 || panelHeight <= 0) {
        return 0.0;
    }
    
    // Orientación 1: Corte normal
    const colsNormal = Math.floor(ROLL_WIDTH / panelWidth);
    let lenNormal;
    if (colsNormal > 0) {
        const rowsNormal = Math.ceil(neededPanels / colsNormal);
        lenNormal = rowsNormal * panelHeight / 100.0;
    } else {
        lenNormal = Infinity;
    }
    
    // Orientación 2: Corte rotado
    const colsRot = Math.floor(ROLL_WIDTH / panelHeight);
    let lenRot;
    if (colsRot > 0) {
        const rowsRot = Math.ceil(neededPanels / colsRot);
        lenRot = rowsRot * panelWidth / 100.0;
    } else {
        lenRot = Infinity;
    }
    
    const res = Math.min(lenNormal, lenRot);
    if (res === Infinity) {
        return 0.0;
    }
    return Math.round(res * 100) / 100;
}

// Interceptor de fetch
async function ensureBackendChecked() {
    if (backendCheckPromise === null) {
        backendCheckPromise = (async () => {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 1200); // 1.2s timeout
                const response = await originalFetch('/api/inventory', { signal: controller.signal });
                clearTimeout(timeoutId);
                const contentType = response.headers.get('content-type');
                if (response.ok && contentType && contentType.includes('application/json')) {
                    backendAvailable = true;
                    console.log("FastAPI backend disponible. Modo Online activado.");
                } else {
                    backendAvailable = false;
                }
            } catch (e) {
                backendAvailable = false;
            }
            if (backendAvailable === false) {
                console.log("FastAPI backend no responde. Modo Offline (Simulador LocalStorage) activado.");
                setTimeout(() => {
                    showToast("Servidor FastAPI no detectado. Iniciando en Modo Offline (Simulador con LocalStorage)", "warning");
                }, 1000);
            }
        })();
    }
    return backendCheckPromise;
}

window.fetch = async function(resource, options) {
    if (typeof resource === 'string' && resource.startsWith('/api/')) {
        await ensureBackendChecked();
        if (!backendAvailable) {
            return mockApiHandler(resource, options);
        }
    }
    return originalFetch(resource, options);
};

// Manejador del API Mock
async function mockApiHandler(resource, options) {
    const urlObj = new URL(resource, window.location.origin);
    const path = urlObj.pathname;
    const method = (options && options.method || 'GET').toUpperCase();
    let body = null;
    if (options && options.body) {
        try {
            body = JSON.parse(options.body);
        } catch (e) {
            body = options.body;
        }
    }

    function makeResponse(data, status = 200) {
        return {
            ok: status >= 200 && status < 300,
            status: status,
            statusText: status === 200 ? "OK" : (status === 201 ? "Created" : (status === 400 ? "Bad Request" : "Not Found")),
            headers: new Headers({ 'Content-Type': 'application/json' }),
            json: async () => data,
            text: async () => JSON.stringify(data)
        };
    }

    // --- RUTA: INVENTARIO ---
    if (path === '/api/inventory' && method === 'GET') {
        const inventory = getMockData('inventory');
        const result = inventory.map(item => ({
            ...item,
            alert: item.stock <= item.min_stock
        }));
        return makeResponse(result);
    }

    const invMatch = path.match(/^\/api\/inventory\/([^/]+)$/);
    if (invMatch && method === 'PUT') {
        const itemKey = invMatch[1];
        const inventory = getMockData('inventory');
        const idx = inventory.findIndex(item => item.item_key === itemKey);
        if (idx !== -1) {
            const qty = parseFloat(body.quantity);
            const newStock = Math.round((inventory[idx].stock + qty) * 100) / 100;
            if (newStock < 0) {
                return makeResponse({ detail: `Stock insuficiente. Stock actual: ${inventory[idx].stock}, movimiento solicitado: ${qty}` }, 400);
            }
            inventory[idx].stock = newStock;
            setMockData('inventory', inventory);
            
            const reason = body.reason || (qty >= 0 ? "entrada" : "merma");
            let ref = "Ajuste manual de stock";
            if (reason === "compra") ref = "Compra de insumos";
            else if (reason === "donacion") ref = "Donación recibida";
            else if (reason === "merma") ref = "Merma / Desperdicio";
            
            const movements = getMockData('movements') || [];
            movements.push({
                id: Math.random().toString(36).substring(2, 10),
                item_key: itemKey,
                quantity: qty,
                movement_type: reason,
                reference: ref,
                date: new Date().toISOString()
            });
            setMockData('movements', movements);
            
            return makeResponse({
                ...inventory[idx],
                alert: inventory[idx].stock <= inventory[idx].min_stock,
                movement: qty,
                reason: body.reason
            });
        } else {
            return makeResponse({ detail: `Item '${itemKey}' no encontrado en el inventario.` }, 404);
        }
    }

    if (path === '/api/inventory/movements' && method === 'GET') {
        const movements = getMockData('movements') || [];
        const sortedMovements = [...movements].sort((a, b) => new Date(b.date) - new Date(a.date));
        return makeResponse(sortedMovements);
    }

    // --- RUTA: PRODUCTOS DE CATALOGO ---
    if (path === '/api/products' && method === 'GET') {
        const products = getMockData('products');
        return makeResponse(products);
    }

    if (path === '/api/products' && method === 'POST') {
        const products = getMockData('products');
        const key = body.key;
        if (products[key]) {
            return makeResponse({ detail: "El producto con esta clave ya existe." }, 400);
        }
        products[key] = {
            name: body.name,
            ...body.bom
        };
        setMockData('products', products);
        return makeResponse({ key, ...products[key] }, 201);
    }

    const prodMatch = path.match(/^\/api\/products\/([^/]+)$/);
    if (prodMatch && method === 'PUT') {
        const key = prodMatch[1];
        const products = getMockData('products');
        if (!products[key]) {
            return makeResponse({ detail: "Producto no encontrado." }, 404);
        }
        products[key] = {
            name: body.name,
            ...body.bom
        };
        setMockData('products', products);
        return makeResponse({ key, ...products[key] });
    }

    if (prodMatch && method === 'DELETE') {
        const key = prodMatch[1];
        const products = getMockData('products');
        if (!products[key]) {
            return makeResponse({ detail: "Producto no encontrado." }, 404);
        }
        delete products[key];
        setMockData('products', products);
        return makeResponse({ detail: "Producto eliminado exitosamente." });
    }

    // --- RUTA: CLIENTES ---
    if (path === '/api/clients' && method === 'GET') {
        const clients = getMockData('clients') || [];
        return makeResponse(clients);
    }

    if (path === '/api/clients' && method === 'POST') {
        const clients = getMockData('clients') || [];
        const newClient = {
            id: Math.random().toString(36).substring(2, 10),
            name: body.name,
            contact: body.contact || "",
            bust: body.bust || 0,
            underbust: body.underbust || 0,
            waist: body.waist || 0,
            neck: body.neck || 0,
            preferred_size: body.preferred_size || "M",
            notes: body.notes || "",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        clients.push(newClient);
        setMockData('clients', clients);
        return makeResponse(newClient, 201);
    }

    const clientMatch = path.match(/^\/api\/clients\/([^/]+)$/);
    if (clientMatch && method === 'PUT') {
        const id = clientMatch[1];
        const clients = getMockData('clients') || [];
        const idx = clients.findIndex(c => c.id === id);
        if (idx === -1) {
            return makeResponse({ detail: "Cliente no encontrado." }, 404);
        }
        clients[idx] = {
            ...clients[idx],
            name: body.name,
            contact: body.contact || "",
            bust: body.bust || 0,
            underbust: body.underbust || 0,
            waist: body.waist || 0,
            neck: body.neck || 0,
            preferred_size: body.preferred_size || "M",
            notes: body.notes || "",
            updated_at: new Date().toISOString()
        };
        setMockData('clients', clients);
        return makeResponse(clients[idx]);
    }

    if (clientMatch && method === 'DELETE') {
        const id = clientMatch[1];
        let clients = getMockData('clients') || [];
        const originalLen = clients.length;
        clients = clients.filter(c => c.id !== id);
        if (clients.length === originalLen) {
            return makeResponse({ detail: "Cliente no encontrado." }, 404);
        }
        setMockData('clients', clients);
        return makeResponse({ detail: "Cliente eliminado exitosamente." });
    }

    // --- RUTA: PROVEEDORES ---
    if (path === '/api/suppliers' && method === 'GET') {
        const suppliers = getMockData('suppliers') || [];
        return makeResponse(suppliers);
    }

    if (path === '/api/suppliers' && method === 'POST') {
        const suppliers = getMockData('suppliers') || [];
        const newSupplier = {
            id: Math.random().toString(36).substring(2, 10),
            name: body.name,
            contact: body.contact || "",
            notes: body.notes || "",
            prices: body.prices || {},
            created_at: new Date().toISOString()
        };
        suppliers.push(newSupplier);
        setMockData('suppliers', suppliers);
        return makeResponse(newSupplier, 201);
    }

    const supplierMatch = path.match(/^\/api\/suppliers\/([^/]+)$/);
    if (supplierMatch && method === 'PUT') {
        const id = supplierMatch[1];
        const suppliers = getMockData('suppliers') || [];
        const idx = suppliers.findIndex(s => s.id === id);
        if (idx === -1) {
            return makeResponse({ detail: "Proveedor no encontrado." }, 404);
        }
        suppliers[idx] = {
            ...suppliers[idx],
            name: body.name,
            contact: body.contact || "",
            notes: body.notes || "",
            prices: body.prices || {}
        };
        setMockData('suppliers', suppliers);
        return makeResponse(suppliers[idx]);
    }

    if (supplierMatch && method === 'DELETE') {
        const id = supplierMatch[1];
        let suppliers = getMockData('suppliers') || [];
        const originalLen = suppliers.length;
        suppliers = suppliers.filter(s => s.id !== id);
        if (suppliers.length === originalLen) {
            return makeResponse({ detail: "Proveedor no encontrado." }, 404);
        }
        setMockData('suppliers', suppliers);
        return makeResponse({ detail: "Proveedor eliminado exitosamente." });
    }

    if (path === '/api/suppliers/compare' && method === 'GET') {
        const suppliers = getMockData('suppliers') || [];
        const comparison = {};
        suppliers.forEach(sup => {
            const prices = sup.prices || {};
            for (const [itemKey, price] of Object.entries(prices)) {
                if (!comparison[itemKey]) {
                    comparison[itemKey] = [];
                }
                comparison[itemKey].push({ supplier: sup.name, price: price });
            }
        });
        for (const itemKey of Object.keys(comparison)) {
            comparison[itemKey].sort((a, b) => a.price - b.price);
        }
        return makeResponse(comparison);
    }

    // --- RUTA: PEDIDOS / ORDENES ---
    if (path === '/api/orders' && method === 'GET') {
        const orders = getMockData('orders') || [];
        return makeResponse(orders);
    }

    if (path === '/api/orders' && method === 'POST') {
        const orders = getMockData('orders') || [];
        const newOrder = {
            id: Math.random().toString(36).substring(2, 10),
            client_id: body.client_id || "",
            client_name: body.client_name,
            product_key: body.product_key,
            product_name: body.product_name,
            size: body.size || "M",
            custom_notes: body.custom_notes || "",
            quoted_price: parseFloat(body.quoted_price) || 0.0,
            due_date: body.due_date || "",
            status: body.status || "pendiente",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        orders.push(newOrder);
        setMockData('orders', orders);
        return makeResponse(newOrder, 201);
    }

    const orderStatusMatch = path.match(/^\/api\/orders\/([^/]+)\/status$/);
    if (orderStatusMatch && method === 'PUT') {
        const orderId = orderStatusMatch[1];
        const orders = getMockData('orders') || [];
        const idx = orders.findIndex(o => o.id === orderId);
        if (idx === -1) {
            return makeResponse({ detail: "Pedido no encontrado." }, 404);
        }
        const VALID_ORDER_STATUSES = ["pendiente", "en_confeccion", "terminado", "entregado"];
        if (!VALID_ORDER_STATUSES.includes(body.status)) {
            return makeResponse({ detail: `Estado no válido. Opciones: ${VALID_ORDER_STATUSES.join(', ')}` }, 400);
        }
        orders[idx].status = body.status;
        orders[idx].updated_at = new Date().toISOString();
        setMockData('orders', orders);
        return makeResponse(orders[idx]);
    }

    const orderMatch = path.match(/^\/api\/orders\/([^/]+)$/);
    if (orderMatch && method === 'PUT') {
        const orderId = orderMatch[1];
        const orders = getMockData('orders') || [];
        const idx = orders.findIndex(o => o.id === orderId);
        if (idx === -1) {
            return makeResponse({ detail: "Pedido no encontrado." }, 404);
        }
        const VALID_ORDER_STATUSES = ["pendiente", "en_confeccion", "terminado", "entregado"];
        if (!VALID_ORDER_STATUSES.includes(body.status)) {
            return makeResponse({ detail: `Estado no válido. Opciones: ${VALID_ORDER_STATUSES.join(', ')}` }, 400);
        }
        orders[idx] = {
            ...orders[idx],
            client_id: body.client_id || "",
            client_name: body.client_name,
            product_key: body.product_key,
            product_name: body.product_name,
            size: body.size || "M",
            custom_notes: body.custom_notes || "",
            quoted_price: parseFloat(body.quoted_price) || 0.0,
            due_date: body.due_date || "",
            status: body.status || "pendiente",
            updated_at: new Date().toISOString()
        };
        setMockData('orders', orders);
        return makeResponse(orders[idx]);
    }

    if (orderMatch && method === 'DELETE') {
        const orderId = orderMatch[1];
        let orders = getMockData('orders') || [];
        const originalLen = orders.length;
        orders = orders.filter(o => o.id !== orderId);
        if (orders.length === originalLen) {
            return makeResponse({ detail: "Pedido no encontrado." }, 404);
        }
        setMockData('orders', orders);
        return makeResponse({ detail: "Pedido eliminado exitosamente." });
    }

    // --- RUTA: ESCALADO ---
    if (path === '/api/scale' && method === 'POST') {
        const baseSize = body.base_size;
        const SIZE_INDICES = { "S": 0, "M": 1, "L": 2, "XL": 3 };
        const SIZE_NAMES = ["S", "M", "L", "XL"];
        if (SIZE_INDICES[baseSize] === undefined) {
            return makeResponse({ detail: "Talla base no válida. Debe ser S, M, L o XL." }, 400);
        }
        
        const baseIdx = SIZE_INDICES[baseSize];
        const results = [];
        
        for (let idx = 0; idx < SIZE_NAMES.length; idx++) {
            const sizeName = SIZE_NAMES[idx];
            const scaledBust = jsCalculateSizeValues(body.bust, baseIdx, idx, body.contour_increment, body.scaling_factor);
            const scaledUnderbust = jsCalculateSizeValues(body.underbust, baseIdx, idx, body.contour_increment, body.scaling_factor);
            const scaledWaist = jsCalculateSizeValues(body.waist, baseIdx, idx, body.contour_increment, body.scaling_factor);
            const scaledNeck = jsCalculateSizeValues(body.neck, baseIdx, idx, body.neck_increment, body.scaling_factor);
            
            results.push({
                size: sizeName,
                is_base: sizeName === baseSize,
                bust: scaledBust,
                underbust: scaledUnderbust,
                waist: scaledWaist,
                neck: scaledNeck,
                diff_from_base: {
                    bust: Math.round((scaledBust - body.bust) * 100) / 100,
                    underbust: Math.round((scaledUnderbust - body.underbust) * 100) / 100,
                    waist: Math.round((scaledWaist - body.waist) * 100) / 100,
                    neck: Math.round((scaledNeck - body.neck) * 100) / 100
                }
            });
        }
        
        return makeResponse({
            base_size: baseSize,
            contour_increment: body.contour_increment,
            neck_increment: body.neck_increment,
            scaling_factor: body.scaling_factor,
            scaled_sizes: results
        });
    }

    // --- RUTA: OPTIMIZACIÓN INDIVIDUAL ---
    if (path === '/api/optimize' && method === 'POST') {
        let bom;
        if (body.product_key === "custom") {
            if (!body.custom_bom) {
                return makeResponse({ detail: "Se requiere un BOM personalizado para la opción 'custom'." }, 400);
            }
            bom = body.custom_bom;
        } else {
            const products = getMockData('products');
            if (!products[body.product_key]) {
                return makeResponse({ detail: "Producto no reconocido." }, 400);
            }
            bom = products[body.product_key];
        }
        
        const constraints = {};
        
        if (bom.cinta > 0) {
            const maxByCinta = Math.floor(body.roll_length / bom.cinta);
            constraints["Cinta/Correa (m)"] = {
                needed_per_unit: bom.cinta,
                available: body.roll_length,
                max_units: maxByCinta
            };
        }
        
        if (bom.cadenas > 0) {
            const maxByCadena = Math.floor(body.cadenas / bom.cadenas);
            constraints["Cadena (m)"] = {
                needed_per_unit: bom.cadenas,
                available: body.cadenas,
                max_units: maxByCadena
            };
        }
        
        let panelsInfo = null;
        if (bom.panels_count > 0) {
            panelsInfo = jsCalculateMaxPanelsFromRoll(body.roll_width, body.roll_length, bom.panel_width, bom.panel_height);
            const maxByPanels = Math.floor(panelsInfo.count / bom.panels_count);
            constraints["Cuero/Cuerina (paneles)"] = {
                needed_per_unit: `${bom.panels_count} de ${bom.panel_width}x${bom.panel_height}cm`,
                available: `Caben ${panelsInfo.count} paneles en el rollo`,
                max_units: maxByPanels
            };
        }
        
        const hardwareItems = [
            ["Argollas", bom.argollas, body.argollas],
            ["Hebillas", bom.hebillas, body.hebillas],
            ["Remaches", bom.remaches, body.remaches],
            ["Ojalillos", bom.ojalillos, body.ojalillos],
            ["Varillas", bom.varillas, body.varillas],
            ["Tachas", bom.tachas, body.tachas],
            ["Mosquetones", bom.mosquetones, body.mosquetones]
        ];
        
        hardwareItems.forEach(([name, needed, stock]) => {
            if (needed > 0) {
                const maxByItem = Math.floor(stock / needed);
                constraints[name] = {
                    needed_per_unit: needed,
                    available: stock,
                    max_units: maxByItem
                };
            }
        });
        
        if (Object.keys(constraints).length === 0) {
            return makeResponse({ detail: "El producto seleccionado no consume ningún insumo registrado." }, 400);
        }
        
        const maxUnits = Math.min(...Object.values(constraints).map(info => info.max_units));
        const bottlenecks = Object.keys(constraints).filter(name => constraints[name].max_units === maxUnits);
        
        const leftover = {};
        for (const [name, info] of Object.entries(constraints)) {
            if (name === "Cinta/Correa (m)") {
                leftover[name] = Math.round((body.roll_length - (maxUnits * bom.cinta)) * 100) / 100;
            } else if (name === "Cadena (m)") {
                leftover[name] = Math.round((body.cadenas - (maxUnits * bom.cadenas)) * 100) / 100;
            } else if (name === "Cuero/Cuerina (paneles)") {
                if (panelsInfo) {
                    leftover[name] = panelsInfo.count - (maxUnits * bom.panels_count);
                }
            } else {
                const foundItem = hardwareItems.find(item => item[0] === name);
                const needed = foundItem ? foundItem[1] : 0;
                const stock = foundItem ? foundItem[2] : 0;
                leftover[name] = stock - (maxUnits * needed);
            }
        }
        
        let wasteMetrics = null;
        if (bom.panels_count > 0 && panelsInfo) {
            const totalRollArea = body.roll_width * (body.roll_length * 100.0);
            const usedPanelArea = bom.panel_width * bom.panel_height;
            const totalUsedArea = maxUnits * bom.panels_count * usedPanelArea;
            const wasteArea = totalRollArea - totalUsedArea;
            const wastePercent = totalRollArea > 0 ? (wasteArea / totalRollArea) * 100.0 : 0.0;
            
            wasteMetrics = {
                total_roll_area_m2: Math.round((totalRollArea / 10000.0) * 1000) / 1000,
                used_area_m2: Math.round((totalUsedArea / 10000.0) * 1000) / 1000,
                waste_area_m2: Math.round((wasteArea / 10000.0) * 1000) / 1000,
                waste_percentage: Math.round(wastePercent * 10) / 10,
                packing_layout: {
                    cols: panelsInfo.cols || 0,
                    rows: panelsInfo.rows || 0,
                    orientation: panelsInfo.orientation || "normal",
                    total_panels_fit: panelsInfo.count || 0,
                    used_panels: maxUnits * bom.panels_count
                }
            };
        }
        
        return makeResponse({
            product_key: body.product_key,
            max_units: maxUnits,
            bottlenecks: bottlenecks,
            constraints: constraints,
            leftover_inventory: leftover,
            waste_optimization: wasteMetrics
        });
    }

    // --- RUTA: PRESUPUESTADOR ---
    if (path === '/api/quote' && method === 'POST') {
        let bom;
        if (body.product_key === "custom") {
            if (!body.custom_bom) {
                return makeResponse({ detail: "Se requiere un BOM personalizado." }, 400);
            }
            bom = body.custom_bom;
        } else {
            const products = getMockData('products');
            if (!products[body.product_key]) {
                return makeResponse({ detail: "Producto no reconocido." }, 400);
            }
            bom = products[body.product_key];
        }
        
        const p = body.pricing;
        const breakdown = [];
        
        if (bom.cinta > 0) {
            const cost = Math.round(bom.cinta * p.cost_cinta_per_m * 100) / 100;
            breakdown.push({ item: "Cinta/Correa", qty: `${bom.cinta} m`, unit_cost: p.cost_cinta_per_m, subtotal: cost });
        }
        
        if (bom.cadenas > 0) {
            const cost = Math.round(bom.cadenas * p.cost_cadena_per_m * 100) / 100;
            breakdown.push({ item: "Cadena Metálica", qty: `${bom.cadenas} m`, unit_cost: p.cost_cadena_per_m, subtotal: cost });
        }
        
        if (bom.panels_count > 0) {
            const area_m2 = (bom.panel_width * bom.panel_height / 10000.0) * bom.panels_count;
            const cost = Math.round(area_m2 * p.cost_panel_per_m2 * 100) / 100;
            breakdown.push({
                item: `Cuero (${bom.panels_count} paneles ${bom.panel_width}x${bom.panel_height}cm)`,
                qty: `${Math.round(area_m2 * 10000) / 10000} m²`,
                unit_cost: p.cost_panel_per_m2,
                subtotal: cost
            });
        }
        
        const hardware = [
            ["Argollas", bom.argollas, p.cost_argolla],
            ["Hebillas", bom.hebillas, p.cost_hebilla],
            ["Remaches", bom.remaches, p.cost_remache],
            ["Ojalillos", bom.ojalillos, p.cost_ojalillo],
            ["Varillas", bom.varillas, p.cost_varilla],
            ["Tachas", bom.tachas, p.cost_tacha],
            ["Mosquetones", bom.mosquetones, p.cost_mosqueton]
        ];
        
        hardware.forEach(([name, qty, unit_cost]) => {
            if (qty > 0) {
                const cost = Math.round(qty * unit_cost * 100) / 100;
                breakdown.push({ item: name, qty: `${qty} uds`, unit_cost: unit_cost, subtotal: cost });
            }
        });
        
        const totalMaterials = Math.round(breakdown.reduce((sum, item) => sum + item.subtotal, 0) * 100) / 100;
        const laborCost = Math.round(p.labor_hours * p.labor_rate_per_hour * 100) / 100;
        const subtotal = Math.round((totalMaterials + laborCost) * 100) / 100;
        const profit = Math.round(subtotal * (p.profit_margin_percent / 100.0) * 100) / 100;
        const suggestedPrice = Math.round((subtotal + profit) * 100) / 100;
        
        return makeResponse({
            product_key: body.product_key,
            breakdown: breakdown,
            total_materials: totalMaterials,
            labor: { hours: p.labor_hours, rate: p.labor_rate_per_hour, total: laborCost },
            subtotal: subtotal,
            profit_margin_percent: p.profit_margin_percent,
            profit_amount: profit,
            suggested_retail_price: suggestedPrice
        });
    }

    // --- RUTA: OPTIMIZACIÓN LOTE ---
    if (path === '/api/optimize/batch' && method === 'POST') {
        let totalCinta = 0.0;
        let totalCadenas = 0.0;
        let totalArgollas = 0;
        let totalHebillas = 0;
        let totalRemaches = 0;
        let totalOjalillos = 0;
        let totalVarillas = 0;
        let totalTachas = 0;
        let totalMosquetones = 0;
        let totalLaborHours = 0.0;
        
        const PRODUCT_LABOR_HOURS = { arnes: 2.5, mascara: 1.5, corset: 4.5 };
        const panelRequirements = [];
        const products = getMockData('products');
        
        for (const item of body.items) {
            if (item.quantity <= 0) continue;
            let bom;
            if (item.product_key === "custom") {
                if (!item.custom_bom) {
                    return makeResponse({ detail: "Falta BOM personalizado para producto custom." }, 400);
                }
                bom = item.custom_bom;
            } else {
                if (!products[item.product_key]) {
                    return makeResponse({ detail: `Producto '${item.product_key}' no reconocido.` }, 400);
                }
                bom = products[item.product_key];
            }
            
            const qty = item.quantity;
            totalCinta += bom.cinta * qty;
            totalArgollas += bom.argollas * qty;
            totalHebillas += bom.hebillas * qty;
            totalRemaches += bom.remaches * qty;
            totalOjalillos += bom.ojalillos * qty;
            totalVarillas += bom.varillas * qty;
            totalCadenas += bom.cadenas * qty;
            totalTachas += bom.tachas * qty;
            totalMosquetones += bom.mosquetones * qty;
            
            const laborHoursPerUnit = PRODUCT_LABOR_HOURS[item.product_key] || 3.0;
            totalLaborHours += laborHoursPerUnit * qty;
            
            if (bom.panels_count > 0) {
                panelRequirements.push({
                    product: item.product_key,
                    width: bom.panel_width,
                    height: bom.panel_height,
                    needed_count: bom.panels_count * qty
                });
            }
        }
        
        const status = {};
        let isViable = true;
        const shortages = {};
        
        const hardware = [
            ["Cinta/Correa (m)", totalCinta, body.roll_length],
            ["Cadena (m)", totalCadenas, body.cadenas],
            ["Argollas", totalArgollas, body.argollas],
            ["Hebillas", totalHebillas, body.hebillas],
            ["Remaches", totalRemaches, body.remaches],
            ["Ojalillos", totalOjalillos, body.ojalillos],
            ["Varillas", totalVarillas, body.varillas],
            ["Tachas", totalTachas, body.tachas],
            ["Mosquetones", totalMosquetones, body.mosquetones]
        ];
        
        hardware.forEach(([name, needed, available]) => {
            if (needed > 0) {
                const ok = available >= needed;
                status[name] = {
                    needed: Math.round(needed * 100) / 100,
                    available: Math.round(available * 100) / 100,
                    ok: ok
                };
                if (!ok) {
                    isViable = false;
                    shortages[name] = Math.round((needed - available) * 100) / 100;
                }
            }
        });
        
        const panelsStatus = [];
        panelRequirements.forEach(req => {
            const fitInfo = jsCalculateMaxPanelsFromRoll(body.roll_width, body.roll_length, req.width, req.height);
            const ok = fitInfo.count >= req.needed_count;
            panelsStatus.push({
                product: req.product,
                width: req.width,
                height: req.height,
                needed: req.needed_count,
                available_in_roll: fitInfo.count,
                ok: ok
            });
            if (!ok) {
                isViable = false;
                shortages[`Paneles (${req.width}x${req.height}cm)`] = req.needed_count - fitInfo.count;
            }
        });
        
        const estimatedDays = Math.round((totalLaborHours / 8.0) * 10) / 10;
        return makeResponse({
            is_viable: isViable,
            hardware_status: status,
            panels_status: panelsStatus,
            shortages: shortages,
            total_labor_hours: Math.round(totalLaborHours * 10) / 10,
            estimated_days: estimatedDays
        });
    }

    // --- RUTA: HISTORIAL DE PRODUCCIÓN ---
    if (path === '/api/production' && method === 'POST') {
        const production = getMockData('production') || [];
        const products = getMockData('products');
        const inventory = getMockData('inventory');
        
        if (body.product_key && body.product_key !== "custom") {
            if (products[body.product_key]) {
                const bom = products[body.product_key];
                const needed = {
                    cinta: Math.round(bom.cinta * body.quantity * 100) / 100,
                    cadenas: Math.round(bom.cadenas * body.quantity * 100) / 100,
                    argollas: bom.argollas * body.quantity,
                    hebillas: bom.hebillas * body.quantity,
                    remaches: bom.remaches * body.quantity,
                    ojalillos: bom.ojalillos * body.quantity,
                    varillas: bom.varillas * body.quantity,
                    tachas: bom.tachas * body.quantity,
                    mosquetones: bom.mosquetones * body.quantity
                };
                
                if (bom.panels_count > 0 && bom.panel_width > 0 && bom.panel_height > 0) {
                    needed.cuerina_rollo = jsCalculateCuerinaConsumedM(
                        bom.panel_width, bom.panel_height, bom.panels_count * body.quantity
                    );
                }
                
                const actualNeeded = {};
                for (const [k, v] of Object.entries(needed)) {
                    if (v > 0) actualNeeded[k] = v;
                }
                
                const shortages = [];
                const inventoryDict = {};
                inventory.forEach(item => { inventoryDict[item.item_key] = item; });
                
                for (const [key, qty] of Object.entries(actualNeeded)) {
                    const invItem = inventoryDict[key];
                    if (!invItem) {
                        shortages.push(`Insumo '${key}' no encontrado en inventario`);
                    } else if (invItem.stock < qty) {
                        shortages.push(`${invItem.name} (falta ${Math.round((qty - invItem.stock) * 100) / 100} ${invItem.unit})`);
                    }
                }
                
                if (shortages.length > 0) {
                    return makeResponse({ detail: "Falta stock de materiales: " + shortages.join(", ") }, 400);
                }
                
                const movements = getMockData('movements') || [];
                for (const [key, qty] of Object.entries(actualNeeded)) {
                    inventoryDict[key].stock = Math.round((inventoryDict[key].stock - qty) * 100) / 100;
                    
                    movements.push({
                        id: Math.random().toString(36).substring(2, 10),
                        item_key: key,
                        quantity: -qty,
                        movement_type: "produccion",
                        reference: `Confección de ${body.quantity}x ${body.product_name}`,
                        date: new Date().toISOString()
                    });
                }
                
                setMockData('inventory', Object.values(inventoryDict));
                setMockData('movements', movements);
            }
        }
        
        const newRecord = {
            id: Math.random().toString(36).substring(2, 10),
            date: new Date().toISOString(),
            product_name: body.product_name,
            quantity: body.quantity,
            materials_cost: body.materials_cost,
            labor_cost: body.labor_cost,
            retail_price: body.retail_price,
            profit: body.profit,
            product_key: body.product_key
        };
        production.push(newRecord);
        setMockData('production', production);
        return makeResponse(newRecord, 201);
    }

    if (path === '/api/production' && method === 'GET') {
        const production = getMockData('production') || [];
        return makeResponse(production);
    }

    // --- RUTA: TENDENCIAS ---
    if (path === '/api/trends' && method === 'GET') {
        const articles = [
            { "id": 1, "title": "Látex Couture: La evolución del fetiche al prêt-à-porter en 2026", "category": "latex", "snippet": "Grandes casas de moda incorporan paneles de látex vulcanizado con acabados mate y alto brillo en colecciones de uso diario.", "link": "https://www.lacarmina.com/blog/2026/latex-couture-fashion", "pub_date": "Sun, 07 Jun 2026", "source": "La Carmina Blog" },
            { "id": 2, "title": "Corsets de cuero y siluetas victorianas dominan las pasarelas de Milán", "category": "latex", "snippet": "La moldería con varillas reforzadas y cierres frontales de herrajes múltiples vuelve como pieza central en la indumentaria de diseño independiente.", "link": "https://news.google.com", "pub_date": "Sat, 06 Jun 2026", "source": "Google News" },
            { "id": 3, "title": "Metal Hardware: Argollas y hebillas como elementos estructurales clave", "category": "hardware", "snippet": "El uso de argollas de acero soldado de 40mm y remaches dobles se consolida no solo como decoración, sino como soporte de tensión.", "link": "https://www.lacarmina.com/blog/2026/metal-hardware-harness", "pub_date": "Fri, 05 Jun 2026", "source": "La Carmina Blog" },
            { "id": 4, "title": "Slow Fashion: El resurgimiento del diseño artesanal frente al fast fashion", "category": "slow", "snippet": "Consumidores eligen prendas confeccionadas a mano con materiales duraderos y procesos Zero Waste que garantizan longevidad.", "link": "https://news.google.com", "pub_date": "Thu, 04 Jun 2026", "source": "Google News" },
            { "id": 5, "title": "Gothcore y Cyberpunk: La estética oscura toma las calles de Tokio", "category": "goth", "snippet": "Tendencias urbanas combinan tiras sintéticas regulables, arneses modulares desmontables y texturas industriales en capas.", "link": "https://www.lacarmina.com/blog/2026/tokyo-gothic-cyberpunk-trends", "pub_date": "Wed, 03 Jun 2026", "source": "La Carmina Blog" },
            { "id": 6, "title": "Diseño en cuero vegano: Alternativas sostenibles en corsetería y arneses", "category": "slow", "snippet": "Nuevos biotextiles derivados del micelio y PU vegetal ofrecen la misma resistencia y flexibilidad que el cuero vacuno tradicional.", "link": "https://news.google.com", "pub_date": "Tue, 02 Jun 2026", "source": "Google News" },
            { "id": 7, "title": "Arneses multipropósito: De la subcultura BDSM al accesorio casual unisex", "category": "hardware", "snippet": "Cómo los arneses de hombros y torso se integran sobre camisas, vestidos y abrigos en outfits de diseño urbano.", "link": "https://www.lacarmina.com/blog/2026/unisex-harness-styling", "pub_date": "Mon, 01 Jun 2026", "source": "La Carmina Blog" },
            { "id": 8, "title": "Optimización Zero Waste en prendas con múltiples herrajes y tiras", "category": "slow", "snippet": "Estrategias de tizada y encimado inteligente para aprovechar retazos de tirantes sintéticos y cintas reforzadas sin desperdicio.", "link": "https://news.google.com", "pub_date": "Sun, 31 May 2026", "source": "Vogue Moda" },
            { "id": 9, "title": "Cadenas de acero suspendidas y cierres YKK extra reforzados en abrigos", "category": "hardware", "snippet": "Cadenas de eslabón medio integradas en sisas y hombros agregan peso dramático y estética industrial a las piezas.", "link": "https://www.lacarmina.com/blog/2026/heavy-metal-fashion", "pub_date": "Sat, 30 May 2026", "source": "La Carmina Blog" },
            { "id": 10, "title": "Neogótico e Industrial: Paletas de color y contrastes mate/brillo", "category": "goth", "snippet": "El negro carbón combinado con acentos carmesí y herrajes niquelados lidera las búsquedas de vestuario alternativo en 2026.", "link": "https://news.google.com", "pub_date": "Fri, 29 May 2026", "source": "Google News" }
        ];
        const tags = [
            { "text": "latex", "weight": 18 },
            { "text": "gothic", "weight": 15 },
            { "text": "harness", "weight": 14 },
            { "text": "leather", "weight": 12 },
            { "text": "corset", "weight": 10 },
            { "text": "hardware", "weight": 9 },
            { "text": "cyberpunk", "weight": 8 },
            { "text": "fetish", "weight": 12 },
            { "text": "artesanal", "weight": 7 },
            { "text": "gothcore", "weight": 8 },
            { "text": "cuero", "weight": 11 },
            { "text": "hecho-a-mano", "weight": 8 },
            { "text": "slow-fashion", "weight": 10 },
            { "text": "argollas", "weight": 6 },
            { "text": "hebillas", "weight": 6 },
            { "text": "zero-waste", "weight": 7 },
            { "text": "industrial", "weight": 5 }
        ];
        return makeResponse({ articles, tags });
    }

    // --- RUTA: DASHBOARD ---
    if (path === '/api/dashboard' && method === 'GET') {
        const production = getMockData('production') || [];
        const inventory = getMockData('inventory') || [];
        const orders = getMockData('orders') || [];
        
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        
        let totalUnits = 0;
        let totalRevenue = 0.0;
        let totalCost = 0.0;
        
        production.forEach(rec => {
            if (!rec.date) return;
            const recDate = new Date(rec.date);
            if (recDate.getFullYear() === currentYear && (recDate.getMonth() + 1) === currentMonth) {
                const qty = rec.quantity || 0;
                totalUnits += qty;
                totalRevenue += (rec.retail_price || 0) * qty;
                totalCost += (rec.materials_cost || 0) + (rec.labor_cost || 0);
            }
        });
        
        const netProfit = Math.round((totalRevenue - totalCost) * 100) / 100;
        const productionThisMonth = {
            total_units: totalUnits,
            total_revenue: Math.round(totalRevenue * 100) / 100,
            total_cost: Math.round(totalCost * 100) / 100,
            net_profit: netProfit
        };
        
        const inventoryAlerts = inventory.filter(item => item.stock <= item.min_stock).length;
        
        const todayStr = now.toISOString().slice(0, 10);
        let overdueOrders = 0;
        orders.forEach(o => {
            if (o.status !== "entregado" && o.due_date && o.due_date < todayStr) {
                overdueOrders++;
            }
        });
        
        const ordersByStatus = { pendiente: 0, en_confeccion: 0, terminado: 0, entregado: 0 };
        orders.forEach(o => {
            const st = o.status || "pendiente";
            if (ordersByStatus[st] !== undefined) {
                ordersByStatus[st]++;
            }
        });
        const pendingOrders = ordersByStatus.pendiente;
        
        const getWeekKey = (d) => {
            const date = new Date(d);
            const dayNum = date.getUTCDay() || 7;
            date.setUTCDate(date.getUTCDate() + 4 - dayNum);
            const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
            const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1)/7);
            return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
        };
        
        const weekly = {};
        production.forEach(rec => {
            if (!rec.date) return;
            const wk = getWeekKey(rec.date);
            if (!weekly[wk]) weekly[wk] = { units: 0, revenue: 0.0 };
            const qty = rec.quantity || 0;
            weekly[wk].units += qty;
            weekly[wk].revenue += (rec.retail_price || 0) * qty;
        });
        
        const sortedWeeks = Object.keys(weekly).sort().reverse().slice(0, 8);
        const productionByWeek = sortedWeeks.map(w => ({
            week: w,
            units: weekly[w].units,
            revenue: Math.round(weekly[w].revenue * 100) / 100
        }));
        
        let materialsCostMonth = 0.0;
        let laborCostMonth = 0.0;
        production.forEach(rec => {
            if (!rec.date) return;
            const recDate = new Date(rec.date);
            if (recDate.getFullYear() === currentYear && (recDate.getMonth() + 1) === currentMonth) {
                materialsCostMonth += rec.materials_cost || 0;
                laborCostMonth += rec.labor_cost || 0;
            }
        });
        
        const costBreakdown = {
            materials: Math.round(materialsCostMonth * 100) / 100,
            labor: Math.round(laborCostMonth * 100) / 100
        };
        
        const monthly = {};
        production.forEach(rec => {
            if (!rec.date) return;
            const recDate = new Date(rec.date);
            const mKey = `${recDate.getFullYear()}-${String(recDate.getMonth() + 1).padStart(2, '0')}`;
            if (!monthly[mKey]) monthly[mKey] = { revenue: 0.0, cost: 0.0 };
            const qty = rec.quantity || 0;
            monthly[mKey].revenue += (rec.retail_price || 0) * qty;
            monthly[mKey].cost += (rec.materials_cost || 0) + (rec.labor_cost || 0);
        });
        
        const sortedMonths = Object.keys(monthly).sort().reverse().slice(0, 6);
        const monthlyProfitTrend = sortedMonths.map(m => ({
            month: m,
            profit: Math.round((monthly[m].revenue - monthly[m].cost) * 100) / 100
        }));
        
        return makeResponse({
            production_this_month: productionThisMonth,
            inventory_alerts: inventoryAlerts,
            pending_orders: pendingOrders,
            overdue_orders: overdueOrders,
            orders_by_status: ordersByStatus,
            production_by_week: productionByWeek,
            cost_breakdown: costBreakdown,
            monthly_profit_trend: monthlyProfitTrend
        });
    }

    // --- RUTA: COPIA DE SEGURIDAD (BACKUP) ---
    if (path === '/api/backup' && method === 'GET') {
        const backup = {
            inventory: getMockData('inventory'),
            products: getMockData('products'),
            clients: getMockData('clients'),
            orders: getMockData('orders'),
            production: getMockData('production'),
            movements: getMockData('movements'),
            suppliers: getMockData('suppliers')
        };
        return makeResponse(backup);
    }

    if (path === '/api/restore' && method === 'POST') {
        if (body.inventory) setMockData('inventory', body.inventory);
        if (body.products) setMockData('products', body.products);
        if (body.clients) setMockData('clients', body.clients);
        if (body.orders) setMockData('orders', body.orders);
        if (body.production) setMockData('production', body.production);
        if (body.movements) setMockData('movements', body.movements);
        if (body.suppliers) setMockData('suppliers', body.suppliers);
        return makeResponse({ status: "success" });
    }

    console.warn(`Mock API route not handled: ${method} ${path}`);
    return makeResponse({ detail: `Route ${method} ${path} not implemented.` }, 404);
}

// --- VARIABLES GLOBALES ORIGINALES ---
let currentBatch = []; // Cola de producción activa
let productsCatalog = {}; // Catálogo cargado desde la API
let calendarMonth = new Date().getMonth();
let calendarYear = new Date().getFullYear();
let ordersCache = [];
let chartInstances = {};

// --- TOAST NOTIFICATION SYSTEM ---
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icons = {
        success: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="#4caf50" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
        error:   '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="#ef5350" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
        warning: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="#ffb300" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
        info:    '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="#42a5f5" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
    };
    toast.innerHTML = `${icons[type] || icons.info}<span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('toast-exit');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// --- THEME TOGGLE ---
function toggleTheme() {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('tormenta-theme', next);
    updateThemeIcon(next);
}

function updateThemeIcon(theme) {
    const icon = document.getElementById('theme-icon');
    if (!icon) return;
    if (theme === 'light') {
        icon.innerHTML = '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>';
    } else {
        icon.innerHTML = '<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>';
    }
}

// --- BACKUP / RESTORE ---
function toggleBackupModal() {
    const modal = document.getElementById('backup-modal');
    modal.classList.toggle('active');
}

async function downloadBackup() {
    try {
        const response = await fetch('/api/backup');
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tormenta_backup_${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Backup descargado exitosamente', 'success');
    } catch (error) {
        showToast('Error al descargar backup: ' + error.message, 'error');
    }
}

async function restoreBackup() {
    const input = document.getElementById('backup-file-input');
    if (!input.files[0]) { showToast('Selecciona un archivo JSON primero', 'warning'); return; }
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = JSON.parse(e.target.result);
            const response = await fetch('/api/restore', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (response.ok) {
                showToast('Datos restaurados. Recargando...', 'success');
                setTimeout(() => location.reload(), 1500);
            } else {
                showToast('Error al restaurar datos', 'error');
            }
        } catch (err) {
            showToast('Archivo JSON inválido', 'error');
        }
    };
    reader.readAsText(input.files[0]);
}

// --- PDF EXPORT ---
async function exportToPDF(elementId, filename) {
    const element = document.getElementById(elementId);
    if (!element) { showToast('Elemento no encontrado', 'error'); return; }
    showToast('Generando PDF...', 'info');
    try {
        const canvas = await html2canvas(element, { backgroundColor: '#0a0a0c', scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 190;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 10;
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= 277;
        while (heightLeft > 0) {
            position = heightLeft - imgHeight + 10;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
            heightLeft -= 277;
        }
        pdf.save(filename);
        showToast('PDF exportado exitosamente', 'success');
    } catch (error) {
        showToast('Error al generar PDF: ' + error.message, 'error');
    }
}

// --- MANEJO DE PESTAÑAS (TABS) ---
function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));

    const activeBtn = document.getElementById(`tab-${tabId}`);
    const activePane = document.getElementById(`pane-${tabId}`);
    
    if (activeBtn && activePane) {
        activeBtn.classList.add('active');
        activePane.classList.add('active');
    }

    // Acciones al abrir pestañas específicas
    if (tabId === 'trends') {
        loadTrends();
    } else if (tabId === 'history') {
        loadProductionHistory();
    } else if (tabId === 'batch') {
        loadCatalogForBatch();
    } else if (tabId === 'catalog') {
        loadCatalog();
    } else if (tabId === 'dashboard') {
        loadDashboard();
    } else if (tabId === 'inventory') {
        loadInventory();
    } else if (tabId === 'suppliers') {
        loadSuppliers();
        loadPriceComparison();
    } else if (tabId === 'orders') {
        loadOrders();
        loadOrderFormDropdowns();
    }
}

// --- ACTUALIZACIONES DINÁMICAS EN FORMULARIOS ---
function updateFactorText(val) {
    const display = document.getElementById('factor-display');
    if (val == 1.0) {
        display.textContent = '1.0x (Estándar)';
    } else if (val < 1.0) {
        display.textContent = `${val}x (Elásticos)`;
    } else {
        display.textContent = `${val}x (Rígidos)`;
    }
}

function toggleCustomBOMFields(productKey) {
    const customFields = document.getElementById('custom-bom-fields');
    if (productKey === 'custom') {
        customFields.classList.remove('hidden');
        customFields.querySelectorAll('input').forEach(input => {
            if (!input.classList.contains('bom-panel-dim')) {
                input.required = true;
            }
        });
    } else {
        customFields.classList.add('hidden');
        customFields.querySelectorAll('input').forEach(input => {
            input.required = false;
        });
    }
}

function toggleCustomPanelDims(panelsCount) {
    const dimFields = document.querySelectorAll('.bom-panel-dim');
    if (parseInt(panelsCount) > 0) {
        dimFields.forEach(field => {
            field.classList.remove('hidden');
            field.querySelector('input').required = true;
        });
    } else {
        dimFields.forEach(field => {
            field.classList.add('hidden');
            field.querySelector('input').required = false;
        });
    }
}

function toggleCatalogPanelDims(panelsCount) {
    const dimFields = document.querySelectorAll('.cat-panel-dim');
    if (parseInt(panelsCount) > 0) {
        dimFields.forEach(field => {
            field.classList.remove('hidden');
            field.querySelector('input').required = true;
        });
    } else {
        dimFields.forEach(field => {
            field.classList.add('hidden');
            field.querySelector('input').required = false;
        });
    }
}

// --- MÓDULO 1: CÁLCULO DE ESCALADO ---
async function handleScale(event) {
    event.preventDefault();
    
    const btn = document.getElementById('btn-scale');
    const placeholder = document.getElementById('scaling-placeholder');
    const resultsContainer = document.getElementById('scaling-results');
    const tableBody = document.getElementById('scaling-table-body');
    
    btn.classList.add('loading');
    btn.disabled = true;

    const payload = {
        bust: parseFloat(document.getElementById('bust').value),
        underbust: parseFloat(document.getElementById('underbust').value),
        waist: parseFloat(document.getElementById('waist').value),
        neck: parseFloat(document.getElementById('neck').value),
        base_size: document.getElementById('base_size').value,
        contour_increment: parseFloat(document.getElementById('contour_increment').value),
        neck_increment: parseFloat(document.getElementById('neck_increment').value),
        scaling_factor: parseFloat(document.getElementById('scaling_factor').value)
    };

    try {
        const response = await fetch('/api/scale', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Error en el cálculo');
        }

        const data = await response.json();
        tableBody.innerHTML = '';

        data.scaled_sizes.forEach(row => {
            const tr = document.createElement('tr');
            if (row.is_base) tr.classList.add('base-row');

            const sizeTd = `<td><strong>Talla ${row.size}</strong> ${row.is_base ? '(Base)' : ''}</td>`;
            
            const bustDiff = row.diff_from_base.bust;
            const bustDiffClass = bustDiff > 0 ? 'positive' : (bustDiff < 0 ? 'negative' : 'neutral');
            const bustDiffText = bustDiff === 0 ? '' : ` <span class="dim-diff ${bustDiffClass}">(${bustDiff > 0 ? '+' : ''}${bustDiff}cm)</span>`;
            const bustTd = `<td>${row.bust}cm${bustDiffText}</td>`;
            
            const underbustDiff = row.diff_from_base.underbust;
            const underbustDiffClass = underbustDiff > 0 ? 'positive' : (underbustDiff < 0 ? 'negative' : 'neutral');
            const underbustDiffText = underbustDiff === 0 ? '' : ` <span class="dim-diff ${underbustDiffClass}">(${underbustDiff > 0 ? '+' : ''}${underbustDiff}cm)</span>`;
            const underbustTd = `<td>${row.underbust}cm${underbustDiffText}</td>`;

            const waistDiff = row.diff_from_base.waist;
            const waistDiffClass = waistDiff > 0 ? 'positive' : (waistDiff < 0 ? 'negative' : 'neutral');
            const waistDiffText = waistDiff === 0 ? '' : ` <span class="dim-diff ${waistDiffClass}">(${waistDiff > 0 ? '+' : ''}${waistDiff}cm)</span>`;
            const waistTd = `<td>${row.waist}cm${waistDiffText}</td>`;

            const neckDiff = row.diff_from_base.neck;
            const neckDiffClass = neckDiff > 0 ? 'positive' : (neckDiff < 0 ? 'negative' : 'neutral');
            const neckDiffText = neckDiff === 0 ? '' : ` <span class="dim-diff ${neckDiffClass}">(${neckDiff > 0 ? '+' : ''}${neckDiff}cm)</span>`;
            const neckTd = `<td>${row.neck}cm${neckDiffText}</td>`;

            tr.innerHTML = sizeTd + bustTd + underbustTd + waistTd + neckTd;
            tableBody.appendChild(tr);
        });

        placeholder.classList.add('hidden');
        resultsContainer.classList.remove('hidden');

    } catch (error) {
        showToast(`Error al calcular escalado: ${error.message}`, 'error');
    } finally {
        btn.classList.remove('loading');
        btn.disabled = false;
    }
}

// --- MÓDULO 2: CÁLCULO DE OPTIMIZACIÓN Y SVG NESTING ---
async function handleOptimize(event) {
    event.preventDefault();

    const btn = document.getElementById('btn-optimize');
    const placeholder = document.getElementById('optimize-placeholder');
    const resultsContainer = document.getElementById('optimize-results');
    const tableBody = document.getElementById('optimize-table-body');
    
    btn.classList.add('loading');
    btn.disabled = true;

    const productKey = document.getElementById('product_key').value;
    const payload = {
        roll_width: parseFloat(document.getElementById('roll_width').value),
        roll_length: parseFloat(document.getElementById('roll_length').value),
        argollas: parseInt(document.getElementById('stock_argollas').value) || 0,
        hebillas: parseInt(document.getElementById('stock_hebillas').value) || 0,
        remaches: parseInt(document.getElementById('stock_remaches').value) || 0,
        ojalillos: parseInt(document.getElementById('stock_ojalillos').value) || 0,
        varillas: parseInt(document.getElementById('stock_varillas').value) || 0,
        cadenas: parseFloat(document.getElementById('stock_cadenas').value) || 0.0,
        tachas: parseInt(document.getElementById('stock_tachas').value) || 0,
        mosquetones: parseInt(document.getElementById('stock_mosquetones').value) || 0,
        product_key: productKey
    };

    if (productKey === 'custom') {
        payload.custom_bom = {
            cinta: parseFloat(document.getElementById('bom_cinta').value) || 0.0,
            argollas: parseInt(document.getElementById('bom_argollas').value) || 0,
            hebillas: parseInt(document.getElementById('bom_hebillas').value) || 0,
            remaches: parseInt(document.getElementById('bom_remaches').value) || 0,
            ojalillos: parseInt(document.getElementById('bom_ojalillos').value) || 0,
            varillas: parseInt(document.getElementById('bom_varillas').value) || 0,
            cadenas: parseFloat(document.getElementById('bom_cadenas').value) || 0.0,
            tachas: parseInt(document.getElementById('bom_tachas').value) || 0,
            mosquetones: parseInt(document.getElementById('bom_mosquetones').value) || 0,
            panels_count: parseInt(document.getElementById('bom_panels').value) || 0,
            panel_width: parseFloat(document.getElementById('bom_panel_w').value) || 0.0,
            panel_height: parseFloat(document.getElementById('bom_panel_h').value) || 0.0
        };
    }

    try {
        const response = await fetch('/api/optimize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Error en la optimización');
        }

        const data = await response.json();
        
        document.getElementById('production-max-value').textContent = data.max_units;

        const bottleneckNames = document.getElementById('bottleneck-names');
        const bottleneckInfo = document.getElementById('bottleneck-info');
        
        if (data.max_units === 0) {
            bottleneckInfo.className = 'bottleneck-card alert-danger';
            bottleneckNames.innerHTML = `<strong>¡Producción Imposible!</strong> Falta material crítico: <span style="text-decoration: underline">${data.bottlenecks.join(', ')}</span>. Debes reponer stock.`;
        } else {
            bottleneckInfo.className = 'bottleneck-card alert-danger';
            bottleneckNames.innerHTML = `<strong>Limitante de Producción:</strong> <span style="text-decoration: underline">${data.bottlenecks.join(', ')}</span> es el recurso limitante. Quedarán ${data.leftover_inventory[data.bottlenecks[0]]} unidades tras fabricar ${data.max_units} prendas.`;
        }

        tableBody.innerHTML = '';
        for (const [name, info] of Object.entries(data.constraints)) {
            const tr = document.createElement('tr');
            const isLimit = data.bottlenecks.includes(name);
            if (isLimit) tr.classList.add('limit-row');

            tr.innerHTML = `
                <td><strong>${name}</strong></td>
                <td>${info.needed_per_unit}</td>
                <td>${info.available}</td>
                <td class="${isLimit ? 'limiting' : ''}">${info.max_units} prendas</td>
            `;
            tableBody.appendChild(tr);
        }

        const zeroWasteSec = document.getElementById('zero-waste-section');
        if (data.waste_optimization) {
            zeroWasteSec.classList.remove('hidden');
            
            document.getElementById('waste-used-area').textContent = `${data.waste_optimization.used_area_m2.toFixed(3)} m²`;
            document.getElementById('waste-leftover-area').textContent = `${data.waste_optimization.waste_area_m2.toFixed(3)} m²`;
            document.getElementById('waste-percent').textContent = `${data.waste_optimization.waste_percentage.toFixed(1)}%`;
            
            const layout = data.waste_optimization.packing_layout;
            const orientationText = layout.orientation === 'normal' ? 'Estándar (Horizontal)' : 'Rotado 90° (Vertical)';
            document.getElementById('waste-layout-desc').innerHTML = 
                `<strong>Plan de Trazado Zero Waste:</strong> Orientación: <em>${orientationText}</em>.<br>` +
                `Diseño en grilla de <strong>${layout.cols} columnas</strong> x <strong>${layout.rows} filas</strong>.<br>` +
                `Paneles colocados: <strong>${layout.used_panels}</strong> (de ${layout.total_panels_fit} que caben).`;

            // Obtener dimensiones de panel para dibujar
            let panelW = 0, panelH = 0;
            if (productKey === 'custom') {
                panelW = parseFloat(document.getElementById('bom_panel_w').value) || 0;
                panelH = parseFloat(document.getElementById('bom_panel_h').value) || 0;
            } else if (productsCatalog[productKey]) {
                panelW = productsCatalog[productKey].panel_width || 0;
                panelH = productsCatalog[productKey].panel_height || 0;
            }

            renderNestingMap(payload.roll_width, payload.roll_length, layout, panelW, panelH);
        } else {
            zeroWasteSec.classList.add('hidden');
        }

        placeholder.classList.add('hidden');
        resultsContainer.classList.remove('hidden');

    } catch (error) {
        showToast(`Error al optimizar materiales: ${error.message}`, 'error');
    } finally {
        btn.classList.remove('loading');
        btn.disabled = false;
    }
}

// --- DIBUJADO DE CORTE SVG (NESTING ZERO WASTE) ---
function renderNestingMap(rollWidth, rollLengthM, layout, panelW, panelH) {
    const svg = document.getElementById('roll-svg-map');
    if (!svg) return;
    svg.innerHTML = '';

    const rollLengthCm = rollLengthM * 100;
    
    // Configurar el viewBox en base al tamaño proporcional del rollo (1cm = 2px para mejor detalle)
    const scale = 2.0;
    const svgWidth = rollLengthCm * scale;
    const svgHeight = rollWidth * scale;
    svg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);

    // Crear el fondo (área total del rollo - representa descarte inicial)
    const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    background.setAttribute('width', svgWidth);
    background.setAttribute('height', svgHeight);
    background.setAttribute('fill', '#1d1d21');
    background.setAttribute('stroke', '#d32f2f');
    background.setAttribute('stroke-width', '2');
    background.setAttribute('opacity', '0.8');
    svg.appendChild(background);

    // Patrón de cuadrícula de fondo para simular la mesa de corte
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
    pattern.setAttribute('id', 'grid-pattern');
    pattern.setAttribute('width', 20 * scale);
    pattern.setAttribute('height', 20 * scale);
    pattern.setAttribute('patternUnits', 'userSpaceOnUse');
    
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `M ${20*scale} 0 L 0 0 0 ${20*scale}`);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', 'rgba(255,255,255,0.03)');
    path.setAttribute('stroke-width', '1');
    pattern.appendChild(path);
    defs.appendChild(pattern);
    svg.appendChild(defs);

    const gridOverlay = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    gridOverlay.setAttribute('width', svgWidth);
    gridOverlay.setAttribute('height', svgHeight);
    gridOverlay.setAttribute('fill', 'url(#grid-pattern)');
    svg.appendChild(gridOverlay);

    const pack = layout.packing_layout;
    if (!pack || pack.cols <= 0 || pack.rows <= 0 || panelW <= 0 || panelH <= 0) return;

    // Calcular el tamaño del panel según la rotación aplicada por la optimización
    const isRotated = pack.orientation === 'rotated';
    const pw = (isRotated ? panelH : panelW) * scale;
    const ph = (isRotated ? panelW : panelH) * scale;

    let panelsDrawn = 0;
    
    // Dibujar la grilla de paneles
    for (let r = 0; r < pack.rows; r++) {
        for (let c = 0; c < pack.cols; c++) {
            panelsDrawn++;
            const isUsed = panelsDrawn <= pack.used_panels;

            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', c * pw);
            rect.setAttribute('y', r * ph);
            rect.setAttribute('width', pw - 2); // Un pequeño margen entre piezas
            rect.setAttribute('height', ph - 2);
            rect.setAttribute('rx', '2');
            
            if (isUsed) {
                // Color dorado translúcido para los paneles que se usarán en el lote
                rect.setAttribute('fill', 'rgba(197, 160, 89, 0.35)');
                rect.setAttribute('stroke', 'var(--accent-gold)');
                rect.setAttribute('stroke-width', '1.5');
            } else {
                // Gris translúcido para paneles que caben pero quedan de sobrante
                rect.setAttribute('fill', 'rgba(255, 255, 255, 0.05)');
                rect.setAttribute('stroke', 'var(--color-text-muted)');
                rect.setAttribute('stroke-width', '1');
                rect.setAttribute('stroke-dasharray', '3,3');
            }
            svg.appendChild(rect);

            // Agregar número de panel centrado
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', c * pw + (pw / 2));
            text.setAttribute('y', r * ph + (ph / 2) + 4);
            text.setAttribute('font-family', 'var(--font-body)');
            text.setAttribute('font-size', '8px');
            text.setAttribute('font-weight', '600');
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('fill', isUsed ? '#fff' : 'rgba(255,255,255,0.3)');
            text.textContent = isUsed ? `P${panelsDrawn}` : `Libre`;
            svg.appendChild(text);
        }
    }

    // Dibujar una línea vertical punteada que indica la porción de rollo realmente utilizada
    const maxColLength = pack.cols * (isRotated ? panelH : panelW);
    const lineX = maxColLength * scale;
    if (lineX > 0 && lineX < svgWidth) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', lineX);
        line.setAttribute('y1', 0);
        line.setAttribute('x2', lineX);
        line.setAttribute('y2', svgHeight);
        line.setAttribute('stroke', '#4caf50');
        line.setAttribute('stroke-width', '1.5');
        line.setAttribute('stroke-dasharray', '5,5');
        svg.appendChild(line);

        // Etiqueta del final de corte
        const lineText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        lineText.setAttribute('x', lineX + 5);
        lineText.setAttribute('y', 15);
        lineText.setAttribute('fill', '#4caf50');
        lineText.setAttribute('font-family', 'var(--font-body)');
        lineText.setAttribute('font-size', '8px');
        lineText.setAttribute('font-weight', '600');
        lineText.textContent = `Límite de Corte: ${maxColLength}cm`;
        svg.appendChild(lineText);
    }
}

// --- MÓDULO 3: COTIZADOR / PRESUPUESTADOR ---
async function handleQuote(event) {
    event.preventDefault();
    
    const btn = document.getElementById('btn-quote');
    const placeholder = document.getElementById('quote-placeholder');
    const resultsContainer = document.getElementById('quote-results');
    const tableBody = document.getElementById('quote-table-body');
    
    btn.classList.add('loading');
    btn.disabled = true;

    const payload = {
        product_key: document.getElementById('quote_product').value,
        pricing: {
            cost_cinta_per_m: parseFloat(document.getElementById('cost_cinta').value) || 0,
            cost_panel_per_m2: parseFloat(document.getElementById('cost_panel_m2').value) || 0,
            cost_argolla: parseFloat(document.getElementById('cost_argolla').value) || 0,
            cost_hebilla: parseFloat(document.getElementById('cost_hebilla').value) || 0,
            cost_remache: parseFloat(document.getElementById('cost_remache').value) || 0,
            cost_ojalillo: parseFloat(document.getElementById('cost_ojalillo').value) || 0,
            cost_varilla: parseFloat(document.getElementById('cost_varilla').value) || 0,
            cost_cadena_per_m: parseFloat(document.getElementById('cost_cadena').value) || 0,
            cost_tacha: parseFloat(document.getElementById('cost_tacha').value) || 0,
            cost_mosqueton: parseFloat(document.getElementById('cost_mosqueton').value) || 0,
            labor_hours: parseFloat(document.getElementById('labor_hours').value) || 0,
            labor_rate_per_hour: parseFloat(document.getElementById('labor_rate').value) || 0,
            profit_margin_percent: parseFloat(document.getElementById('profit_margin').value) || 0,
        }
    };

    try {
        const response = await fetch('/api/quote', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Error al generar presupuesto');
        }

        const data = await response.json();
        
        // Rellenar cabecera de presupuesto formal
        const budgetNum = Math.floor(1000 + Math.random() * 9000);
        document.getElementById('budget-number').textContent = `PRESUPUESTO #${budgetNum}`;
        document.getElementById('budget-date').textContent = `Fecha: ${new Date().toLocaleDateString('es-AR')}`;
        
        const clientSelect = document.getElementById('quote_client');
        const selectedOpt = clientSelect ? clientSelect.options[clientSelect.selectedIndex] : null;
        if (selectedOpt && clientSelect.value) {
            document.getElementById('budget-client-name').textContent = selectedOpt.dataset.name;
            document.getElementById('budget-client-contact').textContent = selectedOpt.dataset.contact;
        } else {
            document.getElementById('budget-client-name').textContent = 'Consumidor Final';
            document.getElementById('budget-client-contact').textContent = 'Sin contacto registrado';
        }

        tableBody.innerHTML = '';
        data.breakdown.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${item.item}</strong></td>
                <td>${item.qty}</td>
                <td>$${item.unit_cost.toLocaleString()}</td>
                <td>$${item.subtotal.toLocaleString()}</td>
            `;
            tableBody.appendChild(tr);
        });

        document.getElementById('quote-materials-total').textContent = `$${data.total_materials.toLocaleString()}`;
        document.getElementById('quote-labor-hours').textContent = data.labor.hours;
        document.getElementById('quote-labor-rate').textContent = data.labor.rate.toLocaleString();
        document.getElementById('quote-labor-total').textContent = `$${data.labor.total.toLocaleString()}`;
        document.getElementById('quote-subtotal').textContent = `$${data.subtotal.toLocaleString()}`;
        document.getElementById('quote-margin-pct').textContent = data.profit_margin_percent;
        document.getElementById('quote-profit').textContent = `+$${data.profit_amount.toLocaleString()}`;
        document.getElementById('quote-final-price').textContent = `$${data.suggested_retail_price.toLocaleString()}`;

        // Añadir botón dinámico para registrar directamente en el historial
        let regBtn = document.getElementById('btn-quote-register-prod');
        if (!regBtn) {
            regBtn = document.createElement('button');
            regBtn.id = 'btn-quote-register-prod';
            regBtn.className = 'btn-secondary';
            regBtn.style.marginTop = '1rem';
            regBtn.style.width = '100%';
            regBtn.textContent = 'Registrar en Historial de Producción';
            document.querySelector('#quote-results').appendChild(regBtn);
        }

        // Obtener el nombre del producto para registrarlo
        const productSelect = document.getElementById('quote_product');
        const productKey = productSelect.value;

        regBtn.onclick = () => {
            // Autofill the production form in pane-history
            const prodSelect = document.getElementById('prod_product_key');
            if (prodSelect) {
                prodSelect.value = productKey;
                handleProductionProductChange();
            }
            document.getElementById('prod_qty').value = 1;
            document.getElementById('prod_mat_cost').value = data.total_materials;
            document.getElementById('prod_labor_cost').value = data.labor.total;
            document.getElementById('prod_retail_price').value = data.suggested_retail_price;

            switchTab('history');
            
            // Animación y foco
            const prodForm = document.getElementById('production-form');
            prodForm.style.boxShadow = '0 0 30px rgba(197, 160, 89, 0.4)';
            setTimeout(() => { prodForm.style.boxShadow = ''; }, 1500);
        };

        placeholder.classList.add('hidden');
        resultsContainer.classList.remove('hidden');

    } catch (error) {
        showToast(`Error: ${error.message}`, 'error');
    } finally {
        btn.classList.remove('loading');
        btn.disabled = false;
    }
}

// --- MÓDULO 4: FICHAS DE CLIENTES ---
async function loadClients() {
    try {
        const response = await fetch('/api/clients');
        const clients = await response.json();
        renderClientList(clients);
        updateClientDropdowns(clients);
    } catch (error) {
        console.error('Error loading clients:', error);
    }
}

function updateClientDropdowns(clients) {
    // 1. Selector de clientes del cotizador
    const quoteClientSel = document.getElementById('quote_client');
    if (quoteClientSel) {
        quoteClientSel.innerHTML = '<option value="">-- Sin Cliente (Presupuesto Genérico) --</option>';
        clients.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = `${c.name} (${c.contact || 'Sin contacto'})`;
            opt.dataset.name = c.name;
            opt.dataset.contact = c.contact || 'Sin contacto';
            quoteClientSel.appendChild(opt);
        });
    }

    // 2. Selector de clientes de pedidos/ordenes
    const orderClientSel = document.getElementById('order_client');
    if (orderClientSel) {
        orderClientSel.innerHTML = '';
        clients.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = c.name;
            opt.dataset.name = c.name;
            orderClientSel.appendChild(opt);
        });
    }
}


function renderClientList(clients) {
    const placeholder = document.getElementById('clients-placeholder');
    const listContainer = document.getElementById('client-list');
    
    if (!clients || clients.length === 0) {
        placeholder.classList.remove('hidden');
        listContainer.innerHTML = '';
        return;
    }
    
    placeholder.classList.add('hidden');
    listContainer.innerHTML = '';
    
    clients.forEach(client => {
        const card = document.createElement('div');
        card.className = 'client-card';
        
        const dateStr = client.updated_at ? new Date(client.updated_at).toLocaleDateString('es-AR') : '';
        const notesHtml = client.notes ? `<div class="client-notes-text">📝 ${client.notes}</div>` : '';
        
        card.innerHTML = `
            <div class="client-card-header">
                <div class="client-card-info">
                    <h4>${client.name}</h4>
                    ${client.contact ? `<div class="client-contact">${client.contact}</div>` : ''}
                    <div class="client-date">Talla: ${client.preferred_size} · Actualizado: ${dateStr}</div>
                </div>
                <div class="client-card-actions">
                    <button class="client-action-btn load-btn" onclick="loadClientToScaling('${client.id}')" title="Cargar medidas al Escalado">
                        ↗ Escalar
                    </button>
                    <button class="client-action-btn edit-btn" onclick="editClient('${client.id}')" title="Editar cliente">
                        ✏ Editar
                    </button>
                    <button class="client-action-btn delete-btn" onclick="deleteClient('${client.id}', '${client.name}')" title="Eliminar cliente">
                        ✕ Borrar
                    </button>
                </div>
            </div>
            <div class="client-measurements">
                <div class="client-measure-chip"><span class="chip-label">Busto</span><span class="chip-value">${client.bust || '—'}</span></div>
                <div class="client-measure-chip"><span class="chip-label">Bajo Busto</span><span class="chip-value">${client.underbust || '—'}</span></div>
                <div class="client-measure-chip"><span class="chip-label">Cintura</span><span class="chip-value">${client.waist || '—'}</span></div>
                <div class="client-measure-chip"><span class="chip-label">Cuello</span><span class="chip-value">${client.neck || '—'}</span></div>
            </div>
            ${notesHtml}
        `;
        listContainer.appendChild(card);
    });
}

async function handleSaveClient(event) {
    event.preventDefault();
    
    const btn = document.getElementById('btn-save-client');
    btn.classList.add('loading');
    btn.disabled = true;

    const editId = document.getElementById('client_edit_id').value;
    const payload = {
        name: document.getElementById('client_name').value.trim(),
        contact: document.getElementById('client_contact').value.trim(),
        bust: parseFloat(document.getElementById('client_bust').value) || 0,
        underbust: parseFloat(document.getElementById('client_underbust').value) || 0,
        waist: parseFloat(document.getElementById('client_waist').value) || 0,
        neck: parseFloat(document.getElementById('client_neck').value) || 0,
        preferred_size: document.getElementById('client_size').value,
        notes: document.getElementById('client_notes').value.trim()
    };

    try {
        let url = '/api/clients';
        let method = 'POST';
        if (editId) {
            url = `/api/clients/${editId}`;
            method = 'PUT';
        }

        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Error al guardar cliente');
        }

        document.getElementById('client-form').reset();
        document.getElementById('client_edit_id').value = '';
        document.getElementById('client-form-title').textContent = 'Registrar Nuevo Cliente';
        document.getElementById('btn-cancel-edit').style.display = 'none';
        
        await loadClients();

    } catch (error) {
        showToast(`Error: ${error.message}`, 'error');
    } finally {
        btn.classList.remove('loading');
        btn.disabled = false;
    }
}

async function editClient(clientId) {
    try {
        const response = await fetch('/api/clients');
        const clients = await response.json();
        const client = clients.find(c => c.id === clientId);
        if (!client) return;

        document.getElementById('client_edit_id').value = client.id;
        document.getElementById('client_name').value = client.name;
        document.getElementById('client_contact').value = client.contact || '';
        document.getElementById('client_bust').value = client.bust || 0;
        document.getElementById('client_underbust').value = client.underbust || 0;
        document.getElementById('client_waist').value = client.waist || 0;
        document.getElementById('client_neck').value = client.neck || 0;
        document.getElementById('client_size').value = client.preferred_size || 'M';
        document.getElementById('client_notes').value = client.notes || '';

        document.getElementById('client-form-title').textContent = `Editando: ${client.name}`;
        document.getElementById('btn-cancel-edit').style.display = 'block';
        
        document.getElementById('client-form').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        showToast('Error al cargar datos del cliente.', 'error');
    }
}

function cancelClientEdit() {
    document.getElementById('client-form').reset();
    document.getElementById('client_edit_id').value = '';
    document.getElementById('client-form-title').textContent = 'Registrar Nuevo Cliente';
    document.getElementById('btn-cancel-edit').style.display = 'none';
}

async function deleteClient(clientId, clientName) {
    if (!confirm(`¿Eliminar la ficha de "${clientName}"? Esta acción no se puede deshacer.`)) return;
    // confirm kept for destructive operations
    
    try {
        const response = await fetch(`/api/clients/${clientId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Error al eliminar');
        await loadClients();
    } catch (error) {
        showToast('Error al eliminar el cliente.', 'error');
    }
}

async function loadClientToScaling(clientId) {
    try {
        const response = await fetch('/api/clients');
        const clients = await response.json();
        const client = clients.find(c => c.id === clientId);
        if (!client) return;

        if (client.bust > 0) document.getElementById('bust').value = client.bust;
        if (client.underbust > 0) document.getElementById('underbust').value = client.underbust;
        if (client.waist > 0) document.getElementById('waist').value = client.waist;
        if (client.neck > 0) document.getElementById('neck').value = client.neck;
        if (client.preferred_size) document.getElementById('base_size').value = client.preferred_size;

        switchTab('scaling');
        
        const scalingCard = document.querySelector('#pane-scaling .glass-card');
        scalingCard.style.boxShadow = '0 0 30px rgba(211, 47, 47, 0.4)';
        setTimeout(() => { scalingCard.style.boxShadow = ''; }, 1500);
        
    } catch (error) {
        showToast('Error al cargar medidas del cliente.', 'error');
    }
}

// --- MÓDULO 5: CATALOGO DINÁMICO DE PRODUCTOS (CRUD BOM) ---
async function loadCatalog() {
    try {
        const response = await fetch('/api/products');
        productsCatalog = await response.json();
        renderCatalogList(productsCatalog);
        updateProductDropdowns(productsCatalog);
    } catch (error) {
        console.error('Error loading products catalog:', error);
    }
}

function renderCatalogList(catalog) {
    const listContainer = document.getElementById('catalog-items-list');
    if (!listContainer) return;
    
    if (!catalog || Object.keys(catalog).length === 0) {
        listContainer.innerHTML = '<p style="text-align: center; color: var(--color-text-muted);">No hay productos registrados en el catálogo.</p>';
        return;
    }
    
    listContainer.innerHTML = '';
    
    for (const [key, prod] of Object.entries(catalog)) {
        const card = document.createElement('div');
        card.className = 'client-card'; // Reusar clase tarjeta cliente por consistencia
        
        const isBase = ["arnes", "mascara", "corset"].includes(key);
        const tagType = isBase ? 'Base' : 'Personalizado';
        
        let detailsHtml = `
            <ul>
                ${prod.cinta > 0 ? `<li><strong>Cinta:</strong> ${prod.cinta} m</li>` : ''}
                ${prod.cadenas > 0 ? `<li><strong>Cadenas:</strong> ${prod.cadenas} m</li>` : ''}
                ${prod.panels_count > 0 ? `<li><strong>Paneles Cuero:</strong> ${prod.panels_count} de ${prod.panel_width}x${prod.panel_height}cm</li>` : ''}
                ${prod.argollas > 0 ? `<li><strong>Argollas:</strong> ${prod.argollas} uds</li>` : ''}
                ${prod.hebillas > 0 ? `<li><strong>Hebillas:</strong> ${prod.hebillas} uds</li>` : ''}
                ${prod.remaches > 0 ? `<li><strong>Remaches:</strong> ${prod.remaches} uds</li>` : ''}
                ${prod.ojalillos > 0 ? `<li><strong>Ojalillos:</strong> ${prod.ojalillos} uds</li>` : ''}
                ${prod.varillas > 0 ? `<li><strong>Varillas:</strong> ${prod.varillas} uds</li>` : ''}
                ${prod.tachas > 0 ? `<li><strong>Tachas:</strong> ${prod.tachas} uds</li>` : ''}
                ${prod.mosquetones > 0 ? `<li><strong>Mosquetones:</strong> ${prod.mosquetones} uds</li>` : ''}
            </ul>
        `;

        card.innerHTML = `
            <div class="client-card-header">
                <div class="client-card-info">
                    <span class="item-tag">${tagType}</span>
                    <h4 style="margin-top: 0.3rem;">${prod.name}</h4>
                    <div class="client-date">Identificador: <em>${key}</em></div>
                </div>
                <div class="client-card-actions">
                    <button class="client-action-btn edit-btn" onclick="editProduct('${key}')">✏ Editar</button>
                    ${!isBase ? `<button class="client-action-btn delete-btn" onclick="deleteProduct('${key}', '${prod.name}')">✕ Borrar</button>` : ''}
                </div>
            </div>
            <div class="catalog-item-bom" style="margin-top: 0.5rem; padding: 0.5rem; background: rgba(0,0,0,0.15); border-radius: 4px;">
                ${detailsHtml}
            </div>
        `;
        listContainer.appendChild(card);
    }
}

function updateProductDropdowns(catalog) {
    // 1. Selector de optimizador común
    const optSelect = document.getElementById('product_key');
    if (optSelect) {
        // Mantener opciones fijas y custom, pero rellenar dinámicamente el catálogo
        optSelect.innerHTML = '';
        for (const [key, prod] of Object.entries(catalog)) {
            const opt = document.createElement('option');
            opt.value = key;
            opt.textContent = prod.name;
            optSelect.appendChild(opt);
        }
        const customOpt = document.createElement('option');
        customOpt.value = 'custom';
        customOpt.textContent = 'Ficha de Insumos Personalizada (BOM Manual)';
        optSelect.appendChild(customOpt);
    }

    // 2. Selector de cotizador
    const quoteSelect = document.getElementById('quote_product');
    if (quoteSelect) {
        quoteSelect.innerHTML = '';
        for (const [key, prod] of Object.entries(catalog)) {
            const opt = document.createElement('option');
            opt.value = key;
            opt.textContent = prod.name;
            quoteSelect.appendChild(opt);
        }
    }

    // 3. Selector de registro de producción
    const prodSelect = document.getElementById('prod_product_key');
    if (prodSelect) {
        prodSelect.innerHTML = '<option value="" disabled selected>-- Seleccionar Prenda --</option>';
        for (const [key, prod] of Object.entries(catalog)) {
            const opt = document.createElement('option');
            opt.value = key;
            opt.textContent = prod.name;
            prodSelect.appendChild(opt);
        }
        const customOpt = document.createElement('option');
        customOpt.value = 'custom';
        customOpt.textContent = 'Prenda Personalizada / Sin Catálogo';
        prodSelect.appendChild(customOpt);
    }
}

async function handleSaveProduct(event) {
    event.preventDefault();
    
    const btn = document.getElementById('btn-save-catalog');
    btn.classList.add('loading');
    btn.disabled = true;

    const key = document.getElementById('cat_key').value.trim();
    const name = document.getElementById('cat_name').value.trim();
    const panelsCount = parseInt(document.getElementById('cat_panels').value) || 0;

    const payload = {
        key: key,
        name: name,
        bom: {
            cinta: parseFloat(document.getElementById('cat_cinta').value) || 0.0,
            argollas: parseInt(document.getElementById('cat_argollas').value) || 0,
            hebillas: parseInt(document.getElementById('cat_hebillas').value) || 0,
            remaches: parseInt(document.getElementById('cat_remaches').value) || 0,
            ojalillos: parseInt(document.getElementById('cat_ojalillos').value) || 0,
            varillas: parseInt(document.getElementById('cat_varillas').value) || 0,
            cadenas: parseFloat(document.getElementById('cat_cadenas').value) || 0.0,
            tachas: parseInt(document.getElementById('cat_tachas').value) || 0,
            mosquetones: parseInt(document.getElementById('cat_mosquetones').value) || 0,
            panels_count: panelsCount,
            panel_width: panelsCount > 0 ? (parseFloat(document.getElementById('cat_panel_w').value) || 0.0) : 0.0,
            panel_height: panelsCount > 0 ? (parseFloat(document.getElementById('cat_panel_h').value) || 0.0) : 0.0
        }
    };

    const isEditMode = document.getElementById('cat_key').disabled;

    try {
        let response;
        if (isEditMode) {
            // Edición: PUT a /api/products/{key} enviando solo el BOM
            response = await fetch(`/api/products/${key}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload.bom)
            });
        } else {
            // Creación: POST a /api/products
            response = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        }

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Error al guardar el producto');
        }

        document.getElementById('catalog-form').reset();
        document.getElementById('cat_key').disabled = false;
        document.getElementById('catalog-form-title').textContent = 'Registrar Ficha de Prenda (BOM)';
        document.querySelector('.cat-panel-dim').classList.add('hidden');
        
        await loadCatalog();

    } catch (error) {
        showToast(`Error: ${error.message}`, 'error');
    } finally {
        btn.classList.remove('loading');
        btn.disabled = false;
    }
}

async function editProduct(key) {
    const prod = productsCatalog[key];
    if (!prod) return;

    document.getElementById('cat_key').value = key;
    document.getElementById('cat_key').disabled = true; // No permitir cambiar clave en edición
    document.getElementById('cat_name').value = prod.name;
    document.getElementById('cat_cinta').value = prod.cinta;
    document.getElementById('cat_cadenas').value = prod.cadenas;
    document.getElementById('cat_panels').value = prod.panels_count;
    document.getElementById('cat_argollas').value = prod.argollas;
    document.getElementById('cat_hebillas').value = prod.hebillas;
    document.getElementById('cat_remaches').value = prod.remaches;
    document.getElementById('cat_ojalillos').value = prod.ojalillos;
    document.getElementById('cat_varillas').value = prod.varillas;
    document.getElementById('cat_tachas').value = prod.tachas;
    document.getElementById('cat_mosquetones').value = prod.mosquetones;

    if (prod.panels_count > 0) {
        document.querySelector('.cat-panel-dim').classList.remove('hidden');
        document.getElementById('cat_panel_w').value = prod.panel_width;
        document.getElementById('cat_panel_h').value = prod.panel_height;
    } else {
        document.querySelector('.cat-panel-dim').classList.add('hidden');
    }

    document.getElementById('catalog-form-title').textContent = `Editando BOM: ${prod.name}`;
    document.getElementById('catalog-form').scrollIntoView({ behavior: 'smooth' });
}

async function deleteProduct(key, name) {
    if (!confirm(`¿Eliminar la ficha técnica de "${name}" del catálogo?`)) return;
    // confirm kept for destructive operations
    try {
        const response = await fetch(`/api/products/${key}`, { method: 'DELETE' });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Error al eliminar');
        }
        await loadCatalog();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// --- MÓDULO 6: PLANIFICADOR DE LOTES ---
async function loadCatalogForBatch() {
    try {
        const response = await fetch('/api/products');
        productsCatalog = await response.json();
        
        const select = document.getElementById('batch_product_select');
        if (select) {
            select.innerHTML = '';
            for (const [key, prod] of Object.entries(productsCatalog)) {
                const opt = document.createElement('option');
                opt.value = key;
                opt.textContent = prod.name;
                select.appendChild(opt);
            }
        }
        renderBatchItemsTable();
    } catch (error) {
        console.error('Error al cargar catálogo en lote:', error);
    }
}

function addBatchItem(event) {
    event.preventDefault();
    const select = document.getElementById('batch_product_select');
    const key = select.value;
    const quantity = parseInt(document.getElementById('batch_quantity').value) || 1;
    
    if (!key) return;

    // Buscar si ya está en la lista
    const existing = currentBatch.find(item => item.product_key === key);
    if (existing) {
        existing.quantity += quantity;
    } else {
        currentBatch.push({
            product_key: key,
            name: productsCatalog[key].name,
            quantity: quantity
        });
    }

    renderBatchItemsTable();
}

function removeBatchItem(index) {
    currentBatch.splice(index, 1);
    renderBatchItemsTable();
}

function renderBatchItemsTable() {
    const tableBody = document.getElementById('batch-items-body');
    if (!tableBody) return;

    if (currentBatch.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: var(--color-text-muted);">El lote está vacío</td></tr>';
        return;
    }

    tableBody.innerHTML = '';
    currentBatch.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${item.name}</strong></td>
            <td>${item.quantity} uds</td>
            <td><button class="client-action-btn delete-btn" onclick="removeBatchItem(${index})">✕ Quitar</button></td>
        `;
        tableBody.appendChild(tr);
    });
}

async function validateBatchProduction() {
    if (currentBatch.length === 0) {
        showToast('Carga al menos una prenda en el lote antes de validar.', 'warning');
        return;
    }

    const btn = document.getElementById('btn-validate-batch');
    const placeholder = document.getElementById('batch-placeholder');
    const resultsContainer = document.getElementById('batch-results');
    const materialsTable = document.getElementById('batch-materials-table');
    
    btn.classList.add('loading');
    btn.disabled = true;

    // Tomar stock actual desde la pestaña de optimización
    const payload = {
        items: currentBatch.map(item => ({ product_key: item.product_key, quantity: item.quantity })),
        argollas: parseInt(document.getElementById('stock_argollas').value) || 0,
        hebillas: parseInt(document.getElementById('stock_hebillas').value) || 0,
        remaches: parseInt(document.getElementById('stock_remaches').value) || 0,
        ojalillos: parseInt(document.getElementById('stock_ojalillos').value) || 0,
        varillas: parseInt(document.getElementById('stock_varillas').value) || 0,
        cadenas: parseFloat(document.getElementById('stock_cadenas').value) || 0.0,
        tachas: parseInt(document.getElementById('stock_tachas').value) || 0,
        mosquetones: parseInt(document.getElementById('stock_mosquetones').value) || 0,
        roll_width: parseFloat(document.getElementById('roll_width').value) || 140.0,
        roll_length: parseFloat(document.getElementById('roll_length').value) || 5.0
    };

    try {
        const response = await fetch('/api/optimize/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Error al validar el lote');
        }

        const data = await response.json();
        
        // Actualizar Badge de Viabilidad y Tiempos Estimados
        const viabilityBadge = document.getElementById('batch-viability-badge');
        const viabilityText = document.getElementById('batch-viability-text');
        
        if (data.is_viable) {
            viabilityBadge.className = 'production-badge-container alert-success';
            viabilityText.textContent = 'LOTE VIABLE';
        } else {
            viabilityBadge.className = 'production-badge-container alert-danger';
            viabilityText.textContent = 'FALTA MATERIAL';
        }

        document.getElementById('batch-time-text').textContent = `${data.total_labor_hours || 0}h`;
        document.getElementById('batch-days-text').textContent = `${data.estimated_days || 0} días (de 8h)`;

        // Renderizar tabla de insumos requeridos
        materialsTable.innerHTML = '';
        for (const [name, info] of Object.entries(data.hardware_status)) {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${name}</strong></td>
                <td>${info.needed}</td>
                <td>${info.available}</td>
                <td class="${info.ok ? 'ok-text' : 'fail-text'}">${info.ok ? '✓ OK' : `Faltan ${Math.round((info.needed - info.available)*100)/100}`}</td>
            `;
            materialsTable.appendChild(tr);
        }

        // Mostrar paneles requeridos en el lote
        const panelsSec = document.getElementById('batch-panels-section');
        const panelsList = document.getElementById('batch-panels-list');
        if (data.panels_status && data.panels_status.length > 0) {
            panelsSec.classList.remove('hidden');
            panelsList.innerHTML = '';
            data.panels_status.forEach(status => {
                const item = document.createElement('div');
                const cleanProdName = productsCatalog[status.product] ? productsCatalog[status.product].name : status.product;
                item.className = 'layout-description';
                item.style.textAlign = 'left';
                item.innerHTML = `
                    • Para <strong>${cleanProdName}</strong>:<br>
                    Necesitas <strong>${status.needed}</strong> paneles de ${status.width}x${status.height}cm.<br>
                    En el rollo caben un máximo de ${status.available_in_roll}. 
                    <span class="${status.ok ? 'ok-text' : 'fail-text'}">${status.ok ? '(Stock Suficiente)' : '(FALTA ESPACIO EN ROLLO)'}</span>
                `;
                panelsList.appendChild(item);
            });
        } else {
            panelsSec.classList.add('hidden');
        }

        placeholder.classList.add('hidden');
        resultsContainer.classList.remove('hidden');

    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        btn.classList.remove('loading');
        btn.disabled = false;
    }
}

// --- MÓDULO 7: HISTORIAL Y REGISTRO DE PRODUCCIÓN ---
async function loadProductionHistory() {
    const placeholder = document.getElementById('history-placeholder');
    const tableContainer = document.getElementById('history-table-container');
    const tableBody = document.getElementById('history-table-body');
    
    try {
        const response = await fetch('/api/production');
        const history = await response.json();
        
        if (!history || history.length === 0) {
            placeholder.classList.remove('hidden');
            placeholder.innerHTML = '<p>No hay registros de producción todavía.</p>';
            tableContainer.classList.add('hidden');
            updateStats(0, 0, 0);
            return;
        }

        placeholder.classList.add('hidden');
        tableContainer.classList.remove('hidden');
        tableBody.innerHTML = '';

        let totalRevenue = 0;
        let totalCost = 0;
        let netProfit = 0;

        // Renderizar del más nuevo al más viejo
        history.reverse().forEach(record => {
            const tr = document.createElement('tr');
            
            const dateObj = new Date(record.date);
            const dateStr = dateObj.toLocaleDateString('es-AR') + ' ' + dateObj.toLocaleTimeString('es-AR', {hour: '2-digit', minute:'2-digit'});
            
            const margin = record.retail_price - (record.materials_cost + record.labor_cost);
            const marginPercent = ((margin / record.retail_price) * 100).toFixed(0);

            totalRevenue += record.retail_price * record.quantity;
            totalCost += (record.materials_cost + record.labor_cost) * record.quantity;
            netProfit += record.profit * record.quantity;

            tr.innerHTML = `
                <td><span style="font-size: 0.7rem; color: var(--color-text-muted);">${dateStr}</span></td>
                <td><strong>${record.product_name}</strong></td>
                <td>${record.quantity}</td>
                <td>$${record.retail_price.toLocaleString()}</td>
                <td class="ok-text">+$${record.profit.toLocaleString()} <span style="font-size: 0.7rem; opacity:0.8;">(${marginPercent}%)</span></td>
            `;
            tableBody.appendChild(tr);
        });

        updateStats(totalRevenue, totalCost, netProfit);

    } catch (error) {
        console.error('Error al cargar historial:', error);
    }
}

function updateStats(revenue, cost, profit) {
    document.getElementById('stats-total-revenue').textContent = `$${revenue.toLocaleString()}`;
    document.getElementById('stats-total-cost').textContent = `$${cost.toLocaleString()}`;
    document.getElementById('stats-net-profit').textContent = `$${profit.toLocaleString()}`;
}

async function handleProductionProductChange() {
    const key = document.getElementById('prod_product_key').value;
    const customGroup = document.getElementById('prod_name_custom_group');
    const customInput = document.getElementById('prod_name_custom');
    
    if (key === 'custom') {
        if (customGroup) customGroup.style.display = 'block';
        if (customInput) customInput.required = true;
        
        // Costos por defecto
        document.getElementById('prod_mat_cost').value = 1000;
        document.getElementById('prod_labor_cost').value = 2000;
        document.getElementById('prod_retail_price').value = 4800;
    } else {
        if (customGroup) customGroup.style.display = 'none';
        if (customInput) {
            customInput.required = false;
            customInput.value = '';
        }
        
        // Cargar costos predeterminados simulando presupuesto
        try {
            const response = await fetch('/api/quote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    product_key: key,
                    pricing: {
                        cost_cuerina_per_m: 3500.0,
                        cost_cinta_per_m: 800.0,
                        cost_argolla: 350.0,
                        cost_hebilla: 450.0,
                        cost_remache: 50.0,
                        cost_ojalillo: 80.0,
                        cost_varilla: 200.0,
                        cost_cadena_per_m: 1200.0,
                        cost_tacha: 60.0,
                        cost_mosqueton: 500.0,
                        cost_panel_per_m2: 5000.0,
                        labor_hours: key === 'arnes' ? 2.5 : (key === 'mascara' ? 1.5 : 4.5),
                        labor_rate_per_hour: 2000.0,
                        profit_margin_percent: 60.0
                    }
                })
            });
            if (response.ok) {
                const data = await response.json();
                document.getElementById('prod_mat_cost').value = data.total_materials;
                document.getElementById('prod_labor_cost').value = data.labor.total;
                document.getElementById('prod_retail_price').value = data.suggested_retail_price;
            }
        } catch (error) {
            console.error('Error al autocompletar costos de producción:', error);
        }
    }
}

async function handleSaveProduction(event) {
    event.preventDefault();
    
    const btn = document.getElementById('btn-save-production');
    btn.classList.add('loading');
    btn.disabled = true;

    const productKey = document.getElementById('prod_product_key').value;
    if (!productKey) {
        showToast('Por favor, selecciona una prenda.', 'warning');
        btn.classList.remove('loading');
        btn.disabled = false;
        return;
    }

    const qty = parseInt(document.getElementById('prod_qty').value) || 1;
    const matCost = parseFloat(document.getElementById('prod_mat_cost').value) || 0;
    const laborCost = parseFloat(document.getElementById('prod_labor_cost').value) || 0;
    const retailPrice = parseFloat(document.getElementById('prod_retail_price').value) || 0;

    // Calcular ganancia
    const totalCost = matCost + laborCost;
    const profit = retailPrice - totalCost;

    let productName = '';
    if (productKey === 'custom') {
        productName = document.getElementById('prod_name_custom').value.trim() || 'Prenda Personalizada';
    } else {
        const prodSelect = document.getElementById('prod_product_key');
        productName = prodSelect.options[prodSelect.selectedIndex].text;
    }

    const payload = {
        product_name: productName,
        quantity: qty,
        materials_cost: matCost,
        labor_cost: laborCost,
        retail_price: retailPrice,
        profit: profit,
        product_key: productKey
    };

    try {
        const response = await fetch('/api/production', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Error al guardar registro de producción.');
        }

        showToast('Producción registrada. Inventario actualizado.', 'success');
        document.getElementById('production-form').reset();
        
        const customGroup = document.getElementById('prod_name_custom_group');
        if (customGroup) customGroup.style.display = 'none';

        await loadProductionHistory();
        await loadInventory();

    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        btn.classList.remove('loading');
        btn.disabled = false;
    }
}

// --- MÓDULO 8: DASHBOARD DE TENDENCIAS EN TIEMPO REAL ---
let rawTrendsData = { articles: [], tags: [] };
let trendsFilterState = {
    category: 'all',
    activeTag: null,
    searchQuery: ''
};

async function loadTrends(isManualRefresh = false) {
    const cloudContainer = document.getElementById('trends-tag-cloud');
    const feedContainer = document.getElementById('trends-articles-feed');
    const refreshBtn = document.getElementById('refresh-trends-btn');
    const btnText = document.getElementById('refresh-trends-btn-text');
    const timestampBanner = document.getElementById('trends-status-timestamp');
    const timestampText = document.getElementById('trends-timestamp-text');
    
    if (refreshBtn && isManualRefresh) {
        refreshBtn.classList.add('spinning');
        if (btnText) btnText.textContent = 'Escaneando...';
    }
    
    if (cloudContainer && !rawTrendsData.tags.length) cloudContainer.innerHTML = '<p style="color: var(--color-text-muted);">Sincronizando radar de tendencias...</p>';
    if (feedContainer && !rawTrendsData.articles.length) feedContainer.innerHTML = '<p style="color: var(--color-text-muted);">Cargando noticias de inspiración...</p>';

    try {
        const response = await fetch('/api/trends');
        const data = await response.json();
        
        // Si es un refresh manual en modo offline, rotar sutilmente la lista para un efecto dinámico en vivo
        if (isManualRefresh && data.articles && data.articles.length) {
            const first = data.articles.shift();
            data.articles.push(first);
        }
        
        rawTrendsData = data;
        
        renderTrendsCloud();
        renderTrendsFeed();
        
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        if (timestampBanner && timestampText) {
            timestampText.textContent = `Radar sincronizado a las ${timeStr} hs (${(data.articles || []).length} fuentes analizadas)`;
            timestampBanner.style.display = 'flex';
        }

        if (isManualRefresh) {
            showToast(`Radar de tendencias sincronizado (${timeStr} hs)`, 'success');
        }
    } catch (error) {
        console.error('Error al cargar tendencias:', error);
        if (cloudContainer) cloudContainer.innerHTML = '<p style="color: var(--color-text-muted);">Error al cargar nube de conceptos.</p>';
        if (feedContainer) feedContainer.innerHTML = '<p style="color: var(--color-text-muted);">Error al cargar artículos de inspiración.</p>';
    } finally {
        if (refreshBtn) {
            setTimeout(() => {
                refreshBtn.classList.remove('spinning');
                if (btnText) btnText.textContent = 'Sincronizar Radar';
            }, 600);
        }
    }
}

function renderTrendsCloud() {
    const cloudContainer = document.getElementById('trends-tag-cloud');
    if (!cloudContainer || !rawTrendsData.tags) return;
    
    cloudContainer.innerHTML = '';
    
    rawTrendsData.tags.forEach((tag, idx) => {
        const span = document.createElement('span');
        let weightClass = 'w-1';
        
        if (idx < 3) weightClass = 'w-4';
        else if (idx < 7) weightClass = 'w-3';
        else if (idx < 12) weightClass = 'w-2';
        
        const isTagActive = trendsFilterState.activeTag === tag.text.toLowerCase();
        span.className = `cloud-tag ${weightClass} ${isTagActive ? 'active-filter' : ''}`;
        span.textContent = `#${tag.text.toUpperCase()}`;
        span.title = `${tag.weight} menciones en radar - Haz clic para filtrar`;
        
        span.onclick = () => filterByTag(tag.text.toLowerCase());
        cloudContainer.appendChild(span);
    });
}

function renderTrendsFeed() {
    const feedContainer = document.getElementById('trends-articles-feed');
    if (!feedContainer || !rawTrendsData.articles) return;
    
    let filtered = rawTrendsData.articles.filter(art => {
        // Filtro por categoría
        if (trendsFilterState.category !== 'all') {
            const artCat = art.category || 'goth';
            if (artCat !== trendsFilterState.category) return false;
        }
        
        // Filtro por tag activo
        if (trendsFilterState.activeTag) {
            const fullText = (art.title + ' ' + (art.snippet || '') + ' ' + art.source).toLowerCase();
            if (!fullText.includes(trendsFilterState.activeTag)) return false;
        }
        
        // Filtro por texto de búsqueda
        if (trendsFilterState.searchQuery) {
            const q = trendsFilterState.searchQuery.toLowerCase();
            const fullText = (art.title + ' ' + (art.snippet || '') + ' ' + art.source).toLowerCase();
            if (!fullText.includes(q)) return false;
        }
        
        return true;
    });

    feedContainer.innerHTML = '';
    
    if (filtered.length === 0) {
        feedContainer.innerHTML = '<p style="color: var(--color-text-muted); padding: 1.5rem; text-align: center;">No se encontraron artículos con los filtros aplicados.</p>';
        return;
    }
    
    filtered.forEach(art => {
        const card = document.createElement('div');
        card.className = 'trend-article-card';
        
        const catMap = {
            'latex': 'Látex & Corsetería',
            'goth': 'Goth & Cyberpunk',
            'slow': 'Slow Fashion',
            'hardware': 'Herrajes & Metal'
        };
        const catLabel = catMap[art.category] || 'Tendencia Generación';
        
        card.innerHTML = `
            <div class="article-header">
                <span class="article-source">${art.source}</span>
                <span class="article-category-badge">${catLabel}</span>
            </div>
            <h4 class="article-title">${art.title}</h4>
            ${art.snippet ? `<p class="article-snippet">${art.snippet}</p>` : ''}
            <div class="article-footer">
                <span style="font-size:0.75rem; color: var(--color-text-muted);">${art.pub_date || ''}</span>
                <a href="${art.link}" target="_blank" class="article-link-btn">Leer artículo →</a>
            </div>
        `;
        feedContainer.appendChild(card);
    });
}

function filterByTag(tagName) {
    if (trendsFilterState.activeTag === tagName) {
        trendsFilterState.activeTag = null;
    } else {
        trendsFilterState.activeTag = tagName;
    }
    updateActiveTagBadge();
    renderTrendsCloud();
    renderTrendsFeed();
}

function clearTagFilter() {
    trendsFilterState.activeTag = null;
    updateActiveTagBadge();
    renderTrendsCloud();
    renderTrendsFeed();
}

function updateActiveTagBadge() {
    const badge = document.getElementById('active-tag-filter-badge');
    const tagNameEl = document.getElementById('active-tag-name');
    if (!badge || !tagNameEl) return;
    
    if (trendsFilterState.activeTag) {
        tagNameEl.textContent = `#${trendsFilterState.activeTag.toUpperCase()}`;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

function setTrendCategory(category) {
    trendsFilterState.category = category;
    
    // Actualizar pills activas
    const pills = document.querySelectorAll('.trend-pill');
    pills.forEach(p => {
        if (p.getAttribute('data-category') === category) {
            p.classList.add('active');
        } else {
            p.classList.remove('active');
        }
    });
    
    renderTrendsFeed();
}

function filterTrends() {
    const input = document.getElementById('trends-search-input');
    if (input) {
        trendsFilterState.searchQuery = input.value.trim();
        renderTrendsFeed();
    }
}

// --- MÓDULO: DASHBOARD ---
async function loadDashboard() {
    try {
        const response = await fetch('/api/dashboard');
        const data = await response.json();

        // KPIs — map to real API field names from /api/dashboard
        const pMonth = data.production_this_month || {};
        animateValue('kpi-garments', pMonth.total_units || 0);
        document.getElementById('kpi-profit').textContent = `$${(pMonth.net_profit || 0).toLocaleString()}`;
        animateValue('kpi-alerts', data.inventory_alerts || 0);
        animateValue('kpi-orders', data.pending_orders || 0);

        const overdueCount = data.overdue_orders || 0;
        animateValue('kpi-overdue', overdueCount);
        const overdueCard = document.getElementById('kpi-overdue-card');
        if (overdueCard) {
            if (overdueCount > 0) {
                overdueCard.style.border = '1px solid rgba(229, 115, 115, 0.4)';
                overdueCard.style.boxShadow = '0 0 15px rgba(229, 115, 115, 0.15)';
            } else {
                overdueCard.style.border = '';
                overdueCard.style.boxShadow = '';
            }
        }

        // Charts
        renderWeeklyChart(data.production_by_week || []);
        renderCostDoughnut(data.cost_breakdown || {}, pMonth);
        renderProfitTrend(data.monthly_profit_trend || []);
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

function animateValue(id, endVal) {
    const el = document.getElementById(id);
    if (!el) return;
    let current = 0;
    const step = Math.max(1, Math.ceil(endVal / 30));
    const timer = setInterval(() => {
        current += step;
        if (current >= endVal) { current = endVal; clearInterval(timer); }
        el.textContent = current;
    }, 30);
}

function renderWeeklyChart(data) {
    const ctx = document.getElementById('chart-weekly');
    if (!ctx) return;
    if (chartInstances.weekly) chartInstances.weekly.destroy();
    const labels = data.map(d => d.week || d.label || 'Sem');
    const values = data.map(d => d.units || d.count || d.value || 0);
    chartInstances.weekly = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels.length ? labels : ['Sem 1','Sem 2','Sem 3','Sem 4'],
            datasets: [{
                label: 'Prendas',
                data: values.length ? values : [0,0,0,0],
                backgroundColor: 'rgba(211,47,47,0.6)',
                borderColor: '#d32f2f',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#90a4ae' } },
                x: { grid: { display: false }, ticks: { color: '#90a4ae' } }
            }
        }
    });
}

function renderCostDoughnut(costBreakdown, productionMonth) {
    const ctx = document.getElementById('chart-doughnut');
    if (!ctx) return;
    if (chartInstances.doughnut) chartInstances.doughnut.destroy();

    const materials = costBreakdown.materials || 0;
    const labor = costBreakdown.labor || 0;
    const profit = (productionMonth && productionMonth.net_profit) ? Math.max(0, productionMonth.net_profit) : 0;
    const hasData = materials > 0 || labor > 0 || profit > 0;

    chartInstances.doughnut = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Materiales', 'Mano de Obra', 'Ganancia'],
            datasets: [{
                data: hasData ? [materials, labor, profit] : [1, 1, 1],
                backgroundColor: hasData ? ['#d32f2f','#c5a059','#4caf50'] : ['#2a2a2e','#2a2a2e','#2a2a2e'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { color: '#90a4ae', padding: 12 } } }
        }
    });
}

function renderProfitTrend(data) {
    const ctx = document.getElementById('chart-profit-trend');
    if (!ctx) return;
    if (chartInstances.profitTrend) chartInstances.profitTrend.destroy();
    const labels = data.map(d => d.month || d.label || '');
    const values = data.map(d => d.profit || d.value || 0);
    chartInstances.profitTrend = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels.length ? labels : ['Ene','Feb','Mar','Abr','May','Jun'],
            datasets: [{
                label: 'Ganancia ($)',
                data: values.length ? values : [0,0,0,0,0,0],
                borderColor: '#c5a059',
                backgroundColor: 'rgba(197,160,89,0.1)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#c5a059'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#90a4ae' } },
                x: { grid: { display: false }, ticks: { color: '#90a4ae' } }
            }
        }
    });
}

// --- MÓDULO: INVENTARIO ---
async function loadInventory() {
    try {
        const response = await fetch('/api/inventory');
        const items = await response.json();
        const tableBody = document.getElementById('inventory-table-body');
        const banner = document.getElementById('inventory-alert-banner');
        const bannerText = document.getElementById('inventory-alert-text');
        const select = document.getElementById('inv_item');
        if (!tableBody) return;

        tableBody.innerHTML = '';
        if (select) select.innerHTML = '';
        let alertCount = 0;

        items.forEach(item => {
            let statusClass = 'stock-ok';
            let statusText = 'OK';
            if (item.stock <= item.min_stock) {
                statusClass = 'stock-critical'; statusText = 'Crítico'; alertCount++;
            } else if (item.stock <= item.min_stock * 2) {
                statusClass = 'stock-low'; statusText = 'Bajo';
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${item.name}</strong></td>
                <td>${item.stock}</td>
                <td>${item.min_stock}</td>
                <td>${item.unit}</td>
                <td><span class="stock-badge ${statusClass}">${statusText}</span></td>
            `;
            tableBody.appendChild(tr);

            if (select) {
                const opt = document.createElement('option');
                opt.value = item.item_key;
                opt.textContent = item.name;
                select.appendChild(opt);
            }
        });

        if (alertCount > 0) {
            banner.className = 'inventory-alert-banner';
            bannerText.textContent = `⚠ ${alertCount} insumo(s) por debajo del stock mínimo.`;
        } else {
            banner.className = 'inventory-alert-banner ok';
            bannerText.textContent = '✓ Todos los insumos están dentro de los niveles seguros.';
        }
        
        await loadInventoryMovements();
    } catch (error) {
        console.error('Error loading inventory:', error);
    }
}

async function loadInventoryMovements() {
    try {
        const response = await fetch('/api/inventory/movements');
        const movements = await response.json();
        const tableBody = document.getElementById('inventory-movements-table-body');
        if (!tableBody) return;

        if (!movements || movements.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--color-text-muted);">No hay movimientos registrados.</td></tr>';
            return;
        }

        const ITEM_NAMES = {
            argollas: "Argollas metálicas",
            hebillas: "Hebillas reguladoras",
            remaches: "Remaches de unión",
            ojalillos: "Ojalillos metálicos",
            varillas: "Varillas de soporte",
            cadenas: "Cadenas metálicas",
            tachas: "Tachas decorativas",
            mosquetones: "Mosquetones de enganche",
            cinta: "Cinta/Correa",
            cuerina_rollo: "Cuerina en rollo"
        };

        const typeTranslations = {
            compra: 'Compra',
            donacion: 'Donación',
            ajuste: 'Ajuste',
            merma: 'Merma',
            produccion: 'Producción'
        };

        tableBody.innerHTML = '';
        movements.forEach(m => {
            const dateStr = new Date(m.date).toLocaleString('es-AR');
            const opClass = m.quantity >= 0 ? 'stock-ok' : 'stock-critical';
            const opText = m.quantity >= 0 ? 'Suma (+)' : 'Resta (-)';
            const qtyText = Math.abs(m.quantity);
            const typeText = typeTranslations[m.movement_type] || m.movement_type;
            const itemName = ITEM_NAMES[m.item_key] || m.item_key;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${dateStr}</td>
                <td><strong>${itemName}</strong></td>
                <td><span class="stock-badge ${opClass}">${opText}</span></td>
                <td><strong>${qtyText}</strong></td>
                <td>${typeText}</td>
                <td style="color: var(--color-text-muted); font-size: 0.85rem;">${m.reference || ''}</td>
            `;
            tableBody.appendChild(tr);
        });
    } catch (error) {
        console.error('Error loading inventory movements:', error);
    }
}

async function handleUpdateInventory(event) {
    event.preventDefault();
    const itemKey = document.getElementById('inv_item').value;
    let quantity = parseFloat(document.getElementById('inv_quantity').value) || 0;
    const operation = document.getElementById('inv_operation').value;
    const reason = document.getElementById('inv_reason').value;
    if (!itemKey || quantity <= 0) { showToast('Selecciona un insumo y cantidad válida', 'warning'); return; }

    if (operation === 'restar') {
        quantity = -quantity;
    }

    try {
        const response = await fetch(`/api/inventory/${itemKey}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantity, reason })
        });
        if (response.ok) {
            showToast('Stock actualizado exitosamente', 'success');
            document.getElementById('inventory-form').reset();
            await loadInventory();
        } else {
            const err = await response.json();
            showToast(err.detail || 'Error al actualizar', 'error');
        }
    } catch (error) {
        showToast('Error de conexión', 'error');
    }
}

// --- MÓDULO: PROVEEDORES ---
async function loadSuppliers() {
    try {
        const response = await fetch('/api/suppliers');
        const suppliers = await response.json();
        const list = document.getElementById('suppliers-list');
        if (!list) return;

        if (!suppliers || suppliers.length === 0) {
            list.innerHTML = '<p style="text-align:center;color:var(--color-text-muted);">No hay proveedores registrados.</p>';
            return;
        }

        list.innerHTML = '';
        suppliers.forEach(sup => {
            const card = document.createElement('div');
            card.className = 'supplier-card';
            const pricesHtml = sup.prices ? Object.entries(sup.prices)
                .filter(([k,v]) => v > 0)
                .map(([k,v]) => `<span style="font-size:0.75rem;color:var(--accent-steel);">${k}: $${v}</span>`)
                .join(' · ') : '';
            card.innerHTML = `
                <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                    <div>
                        <h4>${sup.name}</h4>
                        ${sup.contact ? `<div class="supplier-contact">${sup.contact}</div>` : ''}
                        ${sup.notes ? `<div class="supplier-notes">${sup.notes}</div>` : ''}
                        ${pricesHtml ? `<div style="margin-top:0.5rem;">${pricesHtml}</div>` : ''}
                    </div>
                    <div style="display:flex;gap:0.3rem;flex-shrink:0;">
                        <button class="client-action-btn edit-btn" onclick="editSupplier('${sup.id}')">✏ Editar</button>
                        <button class="client-action-btn delete-btn" onclick="deleteSupplier('${sup.id}','${sup.name}')">✕ Borrar</button>
                    </div>
                </div>
            `;
            list.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading suppliers:', error);
    }
}

async function handleSaveSupplier(event) {
    event.preventDefault();
    const editId = document.getElementById('supplier_edit_id').value;
    const payload = {
        name: document.getElementById('sup_name').value.trim(),
        contact: document.getElementById('sup_contact').value.trim(),
        notes: document.getElementById('sup_notes').value.trim(),
        prices: {
            cinta: parseFloat(document.getElementById('sup_p_cinta').value) || 0,
            argollas: parseFloat(document.getElementById('sup_p_argollas').value) || 0,
            hebillas: parseFloat(document.getElementById('sup_p_hebillas').value) || 0,
            remaches: parseFloat(document.getElementById('sup_p_remaches').value) || 0,
            ojalillos: parseFloat(document.getElementById('sup_p_ojalillos').value) || 0,
            cadenas: parseFloat(document.getElementById('sup_p_cadenas').value) || 0
        }
    };

    try {
        let url = '/api/suppliers';
        let method = 'POST';
        if (editId) { url = `/api/suppliers/${editId}`; method = 'PUT'; }

        const response = await fetch(url, {
            method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
        if (!response.ok) { const err = await response.json(); throw new Error(err.detail || 'Error'); }

        document.getElementById('supplier-form').reset();
        document.getElementById('supplier_edit_id').value = '';
        document.getElementById('supplier-form-title').textContent = 'Registrar Proveedor';
        showToast('Proveedor guardado exitosamente', 'success');
        await loadSuppliers();
        await loadPriceComparison();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function editSupplier(id) {
    try {
        const response = await fetch('/api/suppliers');
        const suppliers = await response.json();
        const sup = suppliers.find(s => s.id === id);
        if (!sup) return;

        document.getElementById('supplier_edit_id').value = sup.id;
        document.getElementById('sup_name').value = sup.name;
        document.getElementById('sup_contact').value = sup.contact || '';
        document.getElementById('sup_notes').value = sup.notes || '';
        if (sup.prices) {
            document.getElementById('sup_p_cinta').value = sup.prices.cinta || 0;
            document.getElementById('sup_p_argollas').value = sup.prices.argollas || 0;
            document.getElementById('sup_p_hebillas').value = sup.prices.hebillas || 0;
            document.getElementById('sup_p_remaches').value = sup.prices.remaches || 0;
            document.getElementById('sup_p_ojalillos').value = sup.prices.ojalillos || 0;
            document.getElementById('sup_p_cadenas').value = sup.prices.cadenas || 0;
        }
        document.getElementById('supplier-form-title').textContent = `Editando: ${sup.name}`;
        document.getElementById('supplier-form').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        showToast('Error al cargar proveedor', 'error');
    }
}

async function deleteSupplier(id, name) {
    if (!confirm(`¿Eliminar el proveedor "${name}"?`)) return;
    try {
        const response = await fetch(`/api/suppliers/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Error al eliminar');
        showToast(`Proveedor "${name}" eliminado`, 'success');
        await loadSuppliers();
        await loadPriceComparison();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function loadPriceComparison() {
    try {
        const response = await fetch('/api/suppliers/compare');
        const data = await response.json();
        const thead = document.getElementById('compare-thead');
        const tbody = document.getElementById('compare-tbody');
        if (!thead || !tbody) return;

        if (!data.suppliers || data.suppliers.length === 0) {
            thead.innerHTML = '<tr><th>Insumo</th></tr>';
            tbody.innerHTML = '<tr><td style="color:var(--color-text-muted);text-align:center;">Agrega proveedores para comparar</td></tr>';
            return;
        }

        let headRow = '<th>Insumo</th>';
        data.suppliers.forEach(s => { headRow += `<th>${s}</th>`; });
        thead.innerHTML = `<tr>${headRow}</tr>`;

        tbody.innerHTML = '';
        if (data.items) {
            for (const [item, prices] of Object.entries(data.items)) {
                const minPrice = Math.min(...Object.values(prices).filter(v => v > 0));
                let row = `<td><strong>${item}</strong></td>`;
                data.suppliers.forEach(s => {
                    const val = prices[s] || 0;
                    const cls = (val > 0 && val === minPrice) ? ' class="price-highlight"' : '';
                    row += `<td${cls}>${val > 0 ? '$' + val.toLocaleString() : '—'}</td>`;
                });
                tbody.innerHTML += `<tr>${row}</tr>`;
            }
        }
    } catch (error) {
        console.error('Error loading price comparison:', error);
    }
}

// --- MÓDULO: ÓRDENES ---
async function loadOrderFormDropdowns() {
    try {
        // Load clients
        const cRes = await fetch('/api/clients');
        const clients = await cRes.json();
        const clientSel = document.getElementById('order_client');
        if (clientSel) {
            clientSel.innerHTML = '';
            clients.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id;
                opt.textContent = c.name;
                opt.dataset.name = c.name;
                clientSel.appendChild(opt);
            });
        }

        // Load products
        const pRes = await fetch('/api/products');
        const products = await pRes.json();
        const prodSel = document.getElementById('order_product');
        if (prodSel) {
            prodSel.innerHTML = '';
            for (const [key, prod] of Object.entries(products)) {
                const opt = document.createElement('option');
                opt.value = key;
                opt.textContent = prod.name;
                opt.dataset.name = prod.name;
                prodSel.appendChild(opt);
            }
        }
    } catch (error) {
        console.error('Error loading order dropdowns:', error);
    }
}

async function loadOrders() {
    try {
        const response = await fetch('/api/orders');
        ordersCache = await response.json();
        renderKanban(ordersCache);
        renderCalendar(calendarMonth, calendarYear);
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

async function handleCreateOrder(event) {
    event.preventDefault();
    const clientSel = document.getElementById('order_client');
    const prodSel = document.getElementById('order_product');
    const clientName = clientSel.options[clientSel.selectedIndex]?.dataset.name || clientSel.options[clientSel.selectedIndex]?.text || '';
    const prodName = prodSel.options[prodSel.selectedIndex]?.dataset.name || prodSel.options[prodSel.selectedIndex]?.text || '';

    const payload = {
        client_id: clientSel.value,
        client_name: clientName,
        product_key: prodSel.value,
        product_name: prodName,
        size: document.getElementById('order_size').value,
        custom_notes: document.getElementById('order_notes').value.trim(),
        quoted_price: parseFloat(document.getElementById('order_price').value) || 0,
        due_date: document.getElementById('order_due').value,
        status: 'pendiente'
    };

    try {
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) { const err = await response.json(); throw new Error(err.detail || 'Error'); }
        showToast('Orden creada exitosamente', 'success');
        document.getElementById('order-form').reset();
        await loadOrders();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function advanceOrderStatus(orderId, currentStatus) {
    const flow = ['pendiente', 'en_confeccion', 'terminado', 'entregado'];
    const idx = flow.indexOf(currentStatus);
    if (idx < 0 || idx >= flow.length - 1) return;
    const nextStatus = flow[idx + 1];

    try {
        const response = await fetch(`/api/orders/${orderId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: nextStatus })
        });
        if (!response.ok) throw new Error('Error al avanzar estado');
        showToast(`Orden avanzada a: ${nextStatus.replace('_',' ')}`, 'success');
        await loadOrders();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function deleteOrder(orderId) {
    if (!confirm('¿Eliminar esta orden?')) return;
    try {
        const response = await fetch(`/api/orders/${orderId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Error al eliminar');
        showToast('Orden eliminada', 'success');
        await loadOrders();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

function renderKanban(orders) {
    const statuses = ['pendiente', 'en_confeccion', 'terminado', 'entregado'];
    const statusLabels = { pendiente: 'Pendiente', en_confeccion: 'En Confección', terminado: 'Terminado', entregado: 'Entregado' };

    statuses.forEach(status => {
        const container = document.getElementById(`kanban-${status}`);
        const countEl = document.getElementById(`count-${status}`);
        if (!container) return;
        container.innerHTML = '';
        const filtered = orders.filter(o => o.status === status);
        if (countEl) countEl.textContent = filtered.length;

        filtered.forEach(order => {
            const card = document.createElement('div');
            card.className = 'kanban-card';
            
            // Check if overdue
            const today = new Date();
            today.setHours(0,0,0,0);
            const orderDueDate = order.due_date ? new Date(order.due_date + 'T00:00:00') : null;
            const isOverdue = status !== 'entregado' && orderDueDate && orderDueDate < today;
            if (isOverdue) {
                card.classList.add('overdue');
            }

            const dueStr = order.due_date ? new Date(order.due_date).toLocaleDateString('es-AR') : '—';
            const showAdvance = status !== 'entregado';
            card.innerHTML = `
                <div class="order-client">${order.client_name || 'Cliente'}</div>
                <div class="order-product">${order.product_name || order.product_key} · Talla ${order.size || 'M'}</div>
                ${order.custom_notes ? `<div style="font-size:0.7rem;color:var(--color-text-muted);margin-top:0.2rem;">📝 ${order.custom_notes}</div>` : ''}
                <div class="order-meta">
                    <span style="${isOverdue ? 'color:#e57373;font-weight:bold;' : ''}">📅 ${dueStr} ${isOverdue ? '<span style="background:#d32f2f;color:white;font-size:0.55rem;padding:2px 4px;border-radius:3px;margin-left:4px;display:inline-block;vertical-align:middle;font-weight:bold;">ATRASADA</span>' : ''}</span>
                    <span class="order-price">$${(order.quoted_price || 0).toLocaleString()}</span>
                </div>
                <div class="order-actions">
                    ${showAdvance ? `<button class="kanban-advance-btn" onclick="advanceOrderStatus('${order.id}','${status}')">→ Avanzar</button>` : ''}
                    <button class="kanban-delete-btn" onclick="deleteOrder('${order.id}')">✕</button>
                </div>
            `;
            container.appendChild(card);
        });
    });
}

// --- CALENDAR ---
function changeCalendarMonth(delta) {
    calendarMonth += delta;
    if (calendarMonth > 11) { calendarMonth = 0; calendarYear++; }
    if (calendarMonth < 0) { calendarMonth = 11; calendarYear--; }
    renderCalendar(calendarMonth, calendarYear);
}

function renderCalendar(month, year) {
    const grid = document.getElementById('calendar-grid');
    const label = document.getElementById('calendar-month-label');
    if (!grid || !label) return;

    const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    label.textContent = `${monthNames[month]} ${year}`;

    grid.innerHTML = '';

    // Day headers
    const dayHeaders = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
    dayHeaders.forEach(d => {
        const h = document.createElement('div');
        h.className = 'calendar-day-header';
        h.textContent = d;
        grid.appendChild(h);
    });

    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let startDay = firstDay.getDay() - 1; // Monday=0
    if (startDay < 0) startDay = 6;

    const today = new Date();

    // Empty cells
    for (let i = 0; i < startDay; i++) {
        const empty = document.createElement('div');
        empty.className = 'calendar-day empty';
        grid.appendChild(empty);
    }

    // Day cells
    for (let d = 1; d <= daysInMonth; d++) {
        const cell = document.createElement('div');
        cell.className = 'calendar-day';

        if (d === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            cell.classList.add('today');
        }

        const dayNum = document.createElement('div');
        dayNum.className = 'day-number';
        dayNum.textContent = d;
        cell.appendChild(dayNum);

        // Find orders for this day
        const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const dayOrders = ordersCache.filter(o => o.due_date && o.due_date.startsWith(dateStr));
        dayOrders.forEach(o => {
            const chip = document.createElement('span');
            chip.className = `order-chip status-${o.status}`;
            chip.textContent = o.client_name || o.product_name || 'Orden';
            chip.title = `${o.client_name} - ${o.product_name} ($${o.quoted_price})`;
            cell.appendChild(chip);
        });

        grid.appendChild(cell);
    }
}

// --- INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
    // Restore theme
    const savedTheme = localStorage.getItem('tormenta-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    // Load initial data
    loadClients();
    loadCatalog();
    loadDashboard();
});

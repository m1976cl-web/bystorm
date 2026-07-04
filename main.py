# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "fastapi",
#     "uvicorn",
# ]
# ///

import os
import math
import json
import uuid
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime
from fastapi import FastAPI, HTTPException, Query
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from typing import Optional, Dict, List

app = FastAPI(
    title="Tormenta Indumentaria Workshop Optimizer",
    description="Herramienta de escalado de patrones y cálculo de materiales para slow fashion.",
    version="1.0.0"
)

# Servir archivos estáticos del frontend
static_dir = os.path.join(os.path.dirname(__file__), "static")
if not os.path.exists(static_dir):
    os.makedirs(static_dir)

# --- MODELOS DE DATOS ---

class PatternScaleRequest(BaseModel):
    bust: float = Field(..., description="Contorno de Busto (cm)", ge=10)
    underbust: float = Field(..., description="Contorno de Bajo Busto (cm)", ge=10)
    waist: float = Field(..., description="Contorno de Cintura (cm)", ge=10)
    neck: float = Field(..., description="Contorno de Cuello (cm)", ge=10)
    base_size: str = Field("M", description="Talla del Molde Base (S, M, L, XL)")
    contour_increment: float = Field(4.0, description="Incremento de contornos por talla (cm)")
    neck_increment: float = Field(1.5, description="Incremento de cuello por talla (cm)")
    scaling_factor: float = Field(1.0, description="Factor de proporcionalidad (multiplicador)")

class BOMItem(BaseModel):
    cinta: float = 0.0  # metros de cinta/cuerina lineal
    argollas: int = 0
    hebillas: int = 0
    remaches: int = 0
    ojalillos: int = 0
    varillas: int = 0
    cadenas: float = 0.0  # metros de cadena lineal
    tachas: int = 0
    mosquetones: int = 0
    # Para moldería de piezas cortadas (máscaras/corsetería)
    panels_count: int = 0
    panel_width: float = 0.0  # cm
    panel_height: float = 0.0  # cm

class MaterialOptimizeRequest(BaseModel):
    roll_width: float = Field(..., description="Ancho del rollo (cm)", ge=1)
    roll_length: float = Field(..., description="Largo del rollo (m)", ge=0.1)
    argollas: int = Field(0, ge=0)
    hebillas: int = Field(0, ge=0)
    remaches: int = Field(0, ge=0)
    ojalillos: int = Field(0, ge=0)
    varillas: int = Field(0, ge=0)
    cadenas: float = Field(0.0, ge=0.0)
    tachas: int = Field(0, ge=0)
    mosquetones: int = Field(0, ge=0)
    product_key: str = Field(..., description="Clave del producto (arnes, mascara, corset, custom)")
    custom_bom: Optional[BOMItem] = None

class PricingConfig(BaseModel):
    """Costos unitarios de insumos del taller. Ajusta estos valores según tu proveedor."""
    cost_cuerina_per_m: float = Field(3500.0, description="Precio por metro lineal de cuerina/cuero")
    cost_cinta_per_m: float = Field(800.0, description="Precio por metro de cinta/correa")
    cost_argolla: float = Field(350.0, description="Precio unitario de argolla metálica")
    cost_hebilla: float = Field(450.0, description="Precio unitario de hebilla reguladora")
    cost_remache: float = Field(50.0, description="Precio unitario de remache")
    cost_ojalillo: float = Field(80.0, description="Precio unitario de ojalillo metálico")
    cost_varilla: float = Field(200.0, description="Precio unitario de varilla de soporte")
    cost_cadena_per_m: float = Field(1200.0, description="Precio por metro de cadena metálica")
    cost_tacha: float = Field(60.0, description="Precio unitario de tacha")
    cost_mosqueton: float = Field(500.0, description="Precio unitario de mosquetón")
    cost_panel_per_m2: float = Field(5000.0, description="Precio por m² de cuero/cuerina para paneles")
    labor_hours: float = Field(3.0, description="Horas de mano de obra por prenda")
    labor_rate_per_hour: float = Field(2000.0, description="Tarifa por hora de mano de obra")
    profit_margin_percent: float = Field(60.0, description="Margen de ganancia (%)")

class QuoteRequest(BaseModel):
    product_key: str = Field(..., description="Clave del producto (arnes, mascara, corset)")
    pricing: PricingConfig = Field(default_factory=PricingConfig)
    custom_bom: Optional[BOMItem] = None

class ClientCreate(BaseModel):
    name: str = Field(..., min_length=1, description="Nombre del cliente")
    contact: str = Field("", description="Teléfono, email o Instagram")
    notes: str = Field("", description="Notas (tipo de cuerpo, preferencias, etc.)")
    bust: float = Field(0, ge=0)
    underbust: float = Field(0, ge=0)
    waist: float = Field(0, ge=0)
    neck: float = Field(0, ge=0)
    preferred_size: str = Field("M")

class ClientResponse(ClientCreate):
    id: str
    created_at: str
    updated_at: str

class BatchItem(BaseModel):
    product_key: str
    quantity: int
    custom_bom: Optional[BOMItem] = None

class BatchProductionRequest(BaseModel):
    items: List[BatchItem]
    argollas: int = Field(0, ge=0)
    hebillas: int = Field(0, ge=0)
    remaches: int = Field(0, ge=0)
    ojalillos: int = Field(0, ge=0)
    varillas: int = Field(0, ge=0)
    cadenas: float = Field(0.0, ge=0.0)
    tachas: int = Field(0, ge=0)
    mosquetones: int = Field(0, ge=0)
    roll_width: float = Field(140.0, ge=1.0)
    roll_length: float = Field(5.0, ge=0.1)

class StripOptimizeRequest(BaseModel):
    roll_width: float = Field(..., description="Ancho del rollo (cm)", ge=1)
    roll_length: float = Field(..., description="Largo del rollo (m)", ge=0.1)
    strip_width: float = Field(..., description="Ancho de la tira (cm)", ge=0.1)
    strip_length: float = Field(..., description="Largo de la tira (cm)", ge=1)
    strips_needed: int = Field(..., description="Cantidad de tiras necesarias", ge=1)

class ProductionRecord(BaseModel):
    product_name: str
    quantity: int
    materials_cost: float
    labor_cost: float
    retail_price: float
    profit: float
    product_key: Optional[str] = None


class ProductionResponse(ProductionRecord):
    id: str
    date: str

# --- CONSTANTES / BOM CONFIG (SLOW FASHION DE AUTOR) ---

DEFAULT_BOMS = {
    "arnes": BOMItem(
        cinta=2.5, argollas=6, hebillas=4, remaches=12, ojalillos=0, varillas=0, cadenas=0.0, tachas=8, mosquetones=2
    ),
    "arnes_body": BOMItem(
        cinta=5.5, argollas=12, hebillas=8, remaches=24, ojalillos=0, varillas=0, cadenas=1.0, tachas=16, mosquetones=4
    ),
    "arnes_muslo": BOMItem(
        cinta=1.8, argollas=4, hebillas=2, remaches=8, ojalillos=0, varillas=0, cadenas=0.0, tachas=4, mosquetones=2
    ),
    "choker_dring": BOMItem(
        cinta=0.4, argollas=1, hebillas=1, remaches=4, ojalillos=0, varillas=0, cadenas=0.0, tachas=6, mosquetones=0
    ),
    "corset_underbust": BOMItem(
        cinta=3.5, argollas=0, hebillas=0, remaches=8, ojalillos=16, varillas=12, panels_count=4, panel_width=25.0, panel_height=35.0, cadenas=0.0, tachas=6, mosquetones=0
    ),
    "corset_overbust": BOMItem(
        cinta=4.5, argollas=4, hebillas=2, remaches=12, ojalillos=20, varillas=16, panels_count=6, panel_width=20.0, panel_height=40.0, cadenas=2.0, tachas=12, mosquetones=2
    ),
    "mascara": BOMItem(
        cinta=0.8, argollas=2, hebillas=1, remaches=8, ojalillos=0, varillas=0, panels_count=1, panel_width=30.0, panel_height=25.0, cadenas=0.0, tachas=4, mosquetones=0
    ),
    "falda_latex": BOMItem(
        cinta=0.5, argollas=0, hebillas=0, remaches=6, ojalillos=4, varillas=0, panels_count=2, panel_width=45.0, panel_height=55.0, cadenas=0.0, tachas=4, mosquetones=0
    ),
    "cinturon_portaligas": BOMItem(
        cinta=2.2, argollas=4, hebillas=3, remaches=12, ojalillos=0, varillas=0, cadenas=0.5, tachas=8, mosquetones=4
    ),
    "brazaletes": BOMItem(
        cinta=0.6, argollas=0, hebillas=2, remaches=16, ojalillos=0, varillas=0, cadenas=0.0, tachas=10, mosquetones=0
    )
}

# --- PERSISTENCIA DE PRODUCTOS (JSON local) ---

PRODUCTS_FILE = os.path.join(os.path.dirname(__file__), "products_data.json")

def _load_products() -> Dict[str, dict]:
    if not os.path.exists(PRODUCTS_FILE):
        names = {
            "arnes": "Arnés Pechera Tormenta (Base)",
            "arnes_body": "Arnés Corporal Integral (Body Harness)",
            "arnes_muslo": "Set Ligas de Muslo con Argollas O-Ring",
            "choker_dring": "Gargantilla Choker D-Ring Neopunk",
            "corset_underbust": "Corset Underbust de Cuero (Vesta)",
            "corset_overbust": "Corset Overbust Neogótico (Couture)",
            "mascara": "Máscara Gótica Shadow (Performance)",
            "falda_latex": "Falda Tubo Neopunk con Cierre Frontal",
            "cinturon_portaligas": "Cinturón Portaligas con Mosquetones",
            "brazaletes": "Set de Brazaletes / Muñequeras con Remaches"
        }
        initial_data = {
            k: {
                "name": names.get(k, k),
                **v.model_dump()
            }
            for k, v in DEFAULT_BOMS.items()
        }
        _save_products(initial_data)
        return initial_data
    try:
        with open(PRODUCTS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return {}

def _save_products(products: Dict[str, dict]):
    with open(PRODUCTS_FILE, "w", encoding="utf-8") as f:
        json.dump(products, f, ensure_ascii=False, indent=2)

# --- LÓGICA DE ESCALADO ---

SIZE_INDICES = {"S": 0, "M": 1, "L": 2, "XL": 3}
SIZE_NAMES = ["S", "M", "L", "XL"]

def calculate_size_values(
    base_val: float, 
    base_idx: int, 
    target_idx: int, 
    increment: float, 
    factor: float
) -> float:
    """
    Fórmula de escalado textil estándar.
    Puedes personalizar esta función para aplicar reglas no lineales o logarítmicas.
    Por ejemplo, para tejidos muy elásticos, se puede reducir el incremento a mayor talla,
    o aplicar un factor de corrección por elasticidad.
    """
    diff = target_idx - base_idx
    # Regla: Medida final = Medida base + (Diferencia de tallas * Incremento base * Factor de proporcionalidad)
    scaled_val = base_val + (diff * increment * factor)
    return round(max(0.0, scaled_val), 2)

# --- LÓGICA DE CORTE EN ROLLO (NESTING/GRID) ---

def calculate_max_panels_from_roll(
    roll_width: float, 
    roll_length_m: float, 
    panel_w: float, 
    panel_h: float
) -> Dict[str, any]:
    """
    Calcula cuántos rectángulos de panel_w x panel_h caben en un rollo de roll_width x roll_length_m.
    Aplica una optimización Zero Waste de grilla bidireccional simple (normal y rotada).
    """
    if panel_w <= 0 or panel_h <= 0:
        return {"count": 0, "orientation": "none"}
        
    roll_length_cm = roll_length_m * 100.0
    
    # Orientación 1: Ancho del panel alineado al ancho del rollo
    panels_w_normal = math.floor(roll_width / panel_w)
    panels_h_normal = math.floor(roll_length_cm / panel_h)
    count_normal = panels_w_normal * panels_h_normal
    
    # Orientación 2: Alto del panel alineado al ancho del rollo (rotado 90°)
    panels_w_rotated = math.floor(roll_width / panel_h)
    panels_h_rotated = math.floor(roll_length_cm / panel_w)
    count_rotated = panels_w_rotated * panels_h_rotated
    
    if count_normal >= count_rotated:
        return {
            "count": count_normal,
            "orientation": "normal",
            "cols": panels_w_normal,
            "rows": panels_h_normal,
            "used_width": panels_w_normal * panel_w,
            "used_length": panels_h_normal * panel_h / 100.0
        }
    else:
        return {
            "count": count_rotated,
            "orientation": "rotated",
            "cols": panels_w_rotated,
            "rows": panels_h_rotated,
            "used_width": panels_w_rotated * panel_h,
            "used_length": panels_h_rotated * panel_w / 100.0
        }

def calculate_cuerina_consumed_m(panel_width: float, panel_height: float, needed_panels: int) -> float:
    # Ancho del rollo por defecto = 140cm
    ROLL_WIDTH = 140.0
    if needed_panels <= 0 or panel_width <= 0 or panel_height <= 0:
        return 0.0
    
    # Orientación 1: Corte normal
    cols_normal = math.floor(ROLL_WIDTH / panel_width)
    if cols_normal > 0:
        rows_normal = math.ceil(needed_panels / cols_normal)
        len_normal = rows_normal * panel_height / 100.0  # en metros
    else:
        len_normal = float('inf')
        
    # Orientación 2: Corte rotado
    cols_rot = math.floor(ROLL_WIDTH / panel_height)
    if cols_rot > 0:
        rows_rot = math.ceil(needed_panels / cols_rot)
        len_rot = rows_rot * panel_width / 100.0  # en metros
    else:
        len_rot = float('inf')
        
    res = min(len_normal, len_rot)
    if res == float('inf'):
        return 0.0
    return round(res, 2)

# --- PERSISTENCIA DE CLIENTES (JSON local) ---

CLIENTS_FILE = os.path.join(os.path.dirname(__file__), "clients_data.json")

def _load_clients() -> List[dict]:
    if not os.path.exists(CLIENTS_FILE):
        return []
    try:
        with open(CLIENTS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return []

def _save_clients(clients: List[dict]):
    with open(CLIENTS_FILE, "w", encoding="utf-8") as f:
        json.dump(clients, f, ensure_ascii=False, indent=2)

# --- RUTAS DE API ---

@app.post("/api/scale")
def scale_patterns(request: PatternScaleRequest):
    if request.base_size not in SIZE_INDICES:
        raise HTTPException(status_code=400, detail="Talla base no válida. Debe ser S, M, L o XL.")
    
    base_idx = SIZE_INDICES[request.base_size]
    results = []
    
    for idx, size_name in enumerate(SIZE_NAMES):
        scaled_bust = calculate_size_values(
            request.bust, base_idx, idx, request.contour_increment, request.scaling_factor
        )
        scaled_underbust = calculate_size_values(
            request.underbust, base_idx, idx, request.contour_increment, request.scaling_factor
        )
        scaled_waist = calculate_size_values(
            request.waist, base_idx, idx, request.contour_increment, request.scaling_factor
        )
        scaled_neck = calculate_size_values(
            request.neck, base_idx, idx, request.neck_increment, request.scaling_factor
        )
        
        results.append({
            "size": size_name,
            "is_base": size_name == request.base_size,
            "bust": scaled_bust,
            "underbust": scaled_underbust,
            "waist": scaled_waist,
            "neck": scaled_neck,
            "diff_from_base": {
                "bust": round(scaled_bust - request.bust, 2),
                "underbust": round(scaled_underbust - request.underbust, 2),
                "waist": round(scaled_waist - request.waist, 2),
                "neck": round(scaled_neck - request.neck, 2),
            }
        })
        
    return {
        "base_size": request.base_size,
        "contour_increment": request.contour_increment,
        "neck_increment": request.neck_increment,
        "scaling_factor": request.scaling_factor,
        "scaled_sizes": results
    }

@app.post("/api/optimize")
def optimize_materials(request: MaterialOptimizeRequest):
    # Determinar el BOM a usar
    if request.product_key == "custom":
        if not request.custom_bom:
            raise HTTPException(status_code=400, detail="Se requiere un BOM personalizado para la opción 'custom'.")
        bom = request.custom_bom
    else:
        products = _load_products()
        if request.product_key not in products:
            raise HTTPException(status_code=400, detail="Producto no reconocido.")
        prod_data = products[request.product_key]
        bom = BOMItem(**{k: v for k, v in prod_data.items() if k != "name"})
    
    constraints = {}
    
    # 1. Cinta/Cuerina lineal (si el producto la consume)
    if bom.cinta > 0:
        max_by_cinta = math.floor(request.roll_length / bom.cinta)
        constraints["Cinta/Correa (m)"] = {
            "needed_per_unit": bom.cinta,
            "available": request.roll_length,
            "max_units": max_by_cinta
        }

    # 1.2 Cadenas (si el producto la consume)
    if bom.cadenas > 0:
        max_by_cadena = math.floor(request.cadenas / bom.cadenas)
        constraints["Cadena (m)"] = {
            "needed_per_unit": bom.cadenas,
            "available": request.cadenas,
            "max_units": max_by_cadena
        }
        
    # 2. Paneles de material cortados (si el producto los consume)
    panels_info = None
    if bom.panels_count > 0:
        panels_info = calculate_max_panels_from_roll(
            request.roll_width, request.roll_length, bom.panel_width, bom.panel_height
        )
        max_by_panels = math.floor(panels_info["count"] / bom.panels_count)
        constraints["Cuero/Cuerina (paneles)"] = {
            "needed_per_unit": f"{bom.panels_count} de {bom.panel_width}x{bom.panel_height}cm",
            "available": f"Caben {panels_info['count']} paneles en el rollo",
            "max_units": max_by_panels
        }
        
    # 3. Herrajes e insumos de stock
    hardware_items = [
        ("Argollas", bom.argollas, request.argollas),
        ("Hebillas", bom.hebillas, request.hebillas),
        ("Remaches", bom.remaches, request.remaches),
        ("Ojalillos", bom.ojalillos, request.ojalillos),
        ("Varillas", bom.varillas, request.varillas),
        ("Tachas", bom.tachas, request.tachas),
        ("Mosquetones", bom.mosquetones, request.mosquetones),
    ]
    
    for name, needed, stock in hardware_items:
        if needed > 0:
            max_by_item = math.floor(stock / needed)
            constraints[name] = {
                "needed_per_unit": needed,
                "available": stock,
                "max_units": max_by_item
            }
            
    if not constraints:
        raise HTTPException(status_code=400, detail="El producto seleccionado no consume ningún insumo registrado.")
        
    # Calcular unidades máximas que se pueden fabricar
    max_units = min(info["max_units"] for info in constraints.values())
    
    # Identificar el cuello de botella
    bottlenecks = [name for name, info in constraints.items() if info["max_units"] == max_units]
    
    # Calcular stock sobrante y métricas Zero Waste
    leftover = {}
    for name, info in constraints.items():
        if name == "Cinta/Correa (m)":
            leftover[name] = round(request.roll_length - (max_units * bom.cinta), 2)
        elif name == "Cadena (m)":
            leftover[name] = round(request.cadenas - (max_units * bom.cadenas), 2)
        elif name == "Cuero/Cuerina (paneles)":
            if panels_info:
                leftover[name] = panels_info["count"] - (max_units * bom.panels_count)
        else:
            needed = next(item[1] for item in hardware_items if item[0] == name)
            leftover[name] = info["available"] - (max_units * needed)
            
    # Métrica de desperdicio de tela
    waste_metrics = None
    if bom.panels_count > 0 and panels_info:
        total_roll_area = request.roll_width * (request.roll_length * 100.0) # cm²
        used_panel_area = bom.panel_width * bom.panel_height # cm² per panel
        total_used_area = max_units * bom.panels_count * used_panel_area # cm²
        
        waste_area = total_roll_area - total_used_area
        waste_percent = (waste_area / total_roll_area) * 100.0 if total_roll_area > 0 else 0.0
        
        waste_metrics = {
            "total_roll_area_m2": round(total_roll_area / 10000.0, 3),
            "used_area_m2": round(total_used_area / 10000.0, 3),
            "waste_area_m2": round(waste_area / 10000.0, 3),
            "waste_percentage": round(waste_percent, 1),
            "packing_layout": {
                "cols": panels_info.get("cols", 0),
                "rows": panels_info.get("rows", 0),
                "orientation": panels_info.get("orientation", "normal"),
                "total_panels_fit": panels_info.get("count", 0),
                "used_panels": max_units * bom.panels_count
            }
        }

    return {
        "product_key": request.product_key,
        "max_units": max_units,
        "bottlenecks": bottlenecks,
        "constraints": constraints,
        "leftover_inventory": leftover,
        "waste_optimization": waste_metrics
    }

# --- COTIZADOR / PRESUPUESTO ---

@app.post("/api/quote")
def generate_quote(request: QuoteRequest):
    """Genera un presupuesto detallado con desglose de costos para una prenda."""
    if request.product_key == "custom":
        if not request.custom_bom:
            raise HTTPException(status_code=400, detail="Se requiere un BOM personalizado.")
        bom = request.custom_bom
    else:
        products = _load_products()
        if request.product_key not in products:
            raise HTTPException(status_code=400, detail="Producto no reconocido.")
        prod_data = products[request.product_key]
        bom = BOMItem(**{k: v for k, v in prod_data.items() if k != "name"})
    
    p = request.pricing
    breakdown = []
    
    # Cinta/Correa
    if bom.cinta > 0:
        cost = round(bom.cinta * p.cost_cinta_per_m, 2)
        breakdown.append({"item": "Cinta/Correa", "qty": f"{bom.cinta} m", "unit_cost": p.cost_cinta_per_m, "subtotal": cost})
        
    # Cadena
    if bom.cadenas > 0:
        cost = round(bom.cadenas * p.cost_cadena_per_m, 2)
        breakdown.append({"item": "Cadena Metálica", "qty": f"{bom.cadenas} m", "unit_cost": p.cost_cadena_per_m, "subtotal": cost})
    
    # Paneles de cuero (costo por m²)
    if bom.panels_count > 0:
        area_m2 = (bom.panel_width * bom.panel_height / 10000.0) * bom.panels_count
        cost = round(area_m2 * p.cost_panel_per_m2, 2)
        breakdown.append({"item": f"Cuero ({bom.panels_count} paneles {bom.panel_width}x{bom.panel_height}cm)", "qty": f"{round(area_m2, 4)} m²", "unit_cost": p.cost_panel_per_m2, "subtotal": cost})
    
    # Herrajes
    hardware = [
        ("Argollas", bom.argollas, p.cost_argolla),
        ("Hebillas", bom.hebillas, p.cost_hebilla),
        ("Remaches", bom.remaches, p.cost_remache),
        ("Ojalillos", bom.ojalillos, p.cost_ojalillo),
        ("Varillas", bom.varillas, p.cost_varilla),
        ("Tachas", bom.tachas, p.cost_tacha),
        ("Mosquetones", bom.mosquetones, p.cost_mosqueton),
    ]
    for name, qty, unit_cost in hardware:
        if qty > 0:
            cost = round(qty * unit_cost, 2)
            breakdown.append({"item": name, "qty": f"{qty} uds", "unit_cost": unit_cost, "subtotal": cost})
    
    total_materials = sum(item["subtotal"] for item in breakdown)
    labor_cost = round(p.labor_hours * p.labor_rate_per_hour, 2)
    subtotal = round(total_materials + labor_cost, 2)
    profit = round(subtotal * (p.profit_margin_percent / 100.0), 2)
    suggested_price = round(subtotal + profit, 2)
    
    return {
        "product_key": request.product_key,
        "breakdown": breakdown,
        "total_materials": total_materials,
        "labor": {"hours": p.labor_hours, "rate": p.labor_rate_per_hour, "total": labor_cost},
        "subtotal": subtotal,
        "profit_margin_percent": p.profit_margin_percent,
        "profit_amount": profit,
        "suggested_retail_price": suggested_price
    }

# --- PRODUCTOS DE CATALOGO (CRUD) ---

class ProductCreate(BaseModel):
    key: str = Field(..., description="Clave única del producto")
    name: str = Field(..., description="Nombre del producto")
    bom: BOMItem

@app.get("/api/products")
def list_products():
    return _load_products()

@app.post("/api/products", status_code=201)
def create_product(product: ProductCreate):
    products = _load_products()
    if product.key in products:
        raise HTTPException(status_code=400, detail="Ya existe un producto con esa clave.")
    
    products[product.key] = {
        "name": product.name,
        **product.bom.model_dump()
    }
    _save_products(products)
    return {"key": product.key, **products[product.key]}

@app.put("/api/products/{product_key}")
def update_product(product_key: str, product: BOMItem):
    products = _load_products()
    if product_key not in products:
        raise HTTPException(status_code=404, detail="Producto no encontrado.")
    
    name = products[product_key].get("name", product_key)
    products[product_key] = {
        "name": name,
        **product.model_dump()
    }
    _save_products(products)
    return {"key": product_key, **products[product_key]}

@app.delete("/api/products/{product_key}")
def delete_product(product_key: str):
    products = _load_products()
    if product_key not in products:
        raise HTTPException(status_code=404, detail="Producto no encontrado.")
    if product_key in ["arnes", "mascara", "corset"]:
        raise HTTPException(status_code=400, detail="No se pueden borrar los productos base del taller.")
    del products[product_key]
    _save_products(products)
    return {"deleted": True, "key": product_key}

# --- FICHAS DE CLIENTE (CRUD) ---

@app.get("/api/clients")
def list_clients():
    return _load_clients()

@app.post("/api/clients", status_code=201)
def create_client(client: ClientCreate):
    clients = _load_clients()
    now = datetime.now().isoformat()
    new_client = {
        "id": str(uuid.uuid4())[:8],
        **client.model_dump(),
        "created_at": now,
        "updated_at": now
    }
    clients.append(new_client)
    _save_clients(clients)
    return new_client

@app.put("/api/clients/{client_id}")
def update_client(client_id: str, client: ClientCreate):
    clients = _load_clients()
    for i, c in enumerate(clients):
        if c["id"] == client_id:
            clients[i] = {
                **c,
                **client.model_dump(),
                "updated_at": datetime.now().isoformat()
            }
            _save_clients(clients)
            return clients[i]
    raise HTTPException(status_code=404, detail="Cliente no encontrado.")

@app.delete("/api/clients/{client_id}")
def delete_client(client_id: str):
    clients = _load_clients()
    original_len = len(clients)
    clients = [c for c in clients if c["id"] != client_id]
    if len(clients) == original_len:
        raise HTTPException(status_code=404, detail="Cliente no encontrado.")
    _save_clients(clients)
    return {"deleted": True, "id": client_id}


# --- PERSISTENCIA DE PRODUCCIÓN (JSON local) ---

PRODUCTION_FILE = os.path.join(os.path.dirname(__file__), "production_data.json")

def _load_production() -> List[dict]:
    if not os.path.exists(PRODUCTION_FILE):
        return []
    try:
        with open(PRODUCTION_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return []

def _save_production(records: List[dict]):
    with open(PRODUCTION_FILE, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, indent=2)


def calculate_max_strips_from_roll(
    roll_width: float, 
    roll_length_m: float, 
    strip_w: float, 
    strip_h: float
) -> Dict[str, any]:
    """
    Calcula cuántas tiras de strip_w x strip_h caben en un rollo de roll_width x roll_length_m.
    Compara orientación longitudinal vs transversal.
    """
    if strip_w <= 0 or strip_h <= 0:
        return {"count": 0, "orientation": "none"}
        
    roll_length_cm = roll_length_m * 100.0
    
    # Orientación 1: Corte longitudinal (ancho tira paralelo a ancho rollo)
    strips_w_normal = math.floor(roll_width / strip_w)
    strips_h_normal = math.floor(roll_length_cm / strip_h)
    count_normal = strips_w_normal * strips_h_normal
    
    # Orientación 2: Corte transversal (largo tira paralelo a ancho rollo)
    strips_w_rotated = math.floor(roll_width / strip_h)
    strips_h_rotated = math.floor(roll_length_cm / strip_w)
    count_rotated = strips_w_rotated * strips_h_rotated
    
    if count_normal >= count_rotated:
        return {
            "count": count_normal,
            "orientation": "longitudinal",
            "cols": strips_w_normal,
            "rows": strips_h_normal,
            "used_width": strips_w_normal * strip_w,
            "used_length": strips_h_normal * strip_h / 100.0
        }
    else:
        return {
            "count": count_rotated,
            "orientation": "transversal",
            "cols": strips_w_rotated,
            "rows": strips_h_rotated,
            "used_width": strips_w_rotated * strip_h,
            "used_length": strips_h_rotated * strip_w / 100.0
        }


@app.post("/api/optimize/strips")
def optimize_strips(request: StripOptimizeRequest):
    """Calcula el corte de tiras desde un rollo."""
    info = calculate_max_strips_from_roll(
        request.roll_width, request.roll_length, request.strip_width, request.strip_length
    )
    
    if info["count"] == 0:
        return {
            "count": 0,
            "orientation": "none",
            "strips_possible": 0,
            "is_sufficient": False,
            "waste_percentage": 100.0
        }
        
    strips_fit = info["count"]
    is_sufficient = strips_fit >= request.strips_needed
    
    # Métrica de desperdicio
    total_roll_area = request.roll_width * (request.roll_length * 100.0)
    used_strip_area = request.strip_width * request.strip_length
    total_used_area = min(request.strips_needed, strips_fit) * used_strip_area
    waste_area = total_roll_area - total_used_area
    waste_percent = (waste_area / total_roll_area) * 100.0
    
    return {
        "packing": info,
        "strips_needed": request.strips_needed,
        "strips_possible": strips_fit,
        "is_sufficient": is_sufficient,
        "waste_percentage": round(waste_percent, 1),
        "total_roll_area_m2": round(total_roll_area / 10000.0, 3),
        "used_area_m2": round(total_used_area / 10000.0, 3),
        "waste_area_m2": round(waste_area / 10000.0, 3),
        "shortage": max(0, request.strips_needed - strips_fit)
    }


@app.post("/api/optimize/batch")
def optimize_batch(request: BatchProductionRequest):
    """Evalúa la viabilidad de fabricar un lote completo de múltiples productos."""
    total_cinta = 0.0
    total_cadenas = 0.0
    total_argollas = 0
    total_hebillas = 0
    total_remaches = 0
    total_ojalillos = 0
    total_varillas = 0
    total_tachas = 0
    total_mosquetones = 0
    total_labor_hours = 0.0
    
    PRODUCT_LABOR_HOURS = {
        "arnes": 2.5,
        "arnes_body": 5.0,
        "arnes_muslo": 2.0,
        "choker_dring": 1.0,
        "corset_underbust": 4.5,
        "corset_overbust": 6.5,
        "mascara": 1.5,
        "falda_latex": 3.5,
        "cinturon_portaligas": 2.5,
        "brazaletes": 1.5
    }
    
    panel_requirements = []
    
    for item in request.items:
        if item.quantity <= 0:
            continue
        if item.product_key == "custom":
            if not item.custom_bom:
                raise HTTPException(status_code=400, detail="Falta BOM personalizado para producto custom.")
            bom = item.custom_bom
        else:
            products = _load_products()
            if item.product_key not in products:
                raise HTTPException(status_code=400, detail=f"Producto '{item.product_key}' no reconocido.")
            prod_data = products[item.product_key]
            bom = BOMItem(**{k: v for k, v in prod_data.items() if k != "name"})
            
        qty = item.quantity
        total_cinta += bom.cinta * qty
        total_argollas += bom.argollas * qty
        total_hebillas += bom.hebillas * qty
        total_remaches += bom.remaches * qty
        total_ojalillos += bom.ojalillos * qty
        total_varillas += bom.varillas * qty
        total_cadenas += bom.cadenas * qty
        total_tachas += bom.tachas * qty
        total_mosquetones += bom.mosquetones * qty
        
        labor_hours_per_unit = PRODUCT_LABOR_HOURS.get(item.product_key, 3.0)
        total_labor_hours += labor_hours_per_unit * qty
        
        if bom.panels_count > 0:
            panel_requirements.append({
                "product": item.product_key,
                "width": bom.panel_width,
                "height": bom.panel_height,
                "needed_count": bom.panels_count * qty
            })
            
    status = {}
    is_viable = True
    shortages = {}
    
    hardware = [
        ("Cinta/Correa (m)", total_cinta, request.roll_length),
        ("Cadena (m)", total_cadenas, request.cadenas),
        ("Argollas", total_argollas, request.argollas),
        ("Hebillas", total_hebillas, request.hebillas),
        ("Remaches", total_remaches, request.remaches),
        ("Ojalillos", total_ojalillos, request.ojalillos),
        ("Varillas", total_varillas, request.varillas),
        ("Tachas", total_tachas, request.tachas),
        ("Mosquetones", total_mosquetones, request.mosquetones),
    ]
    
    for name, needed, available in hardware:
        if needed > 0:
            ok = available >= needed
            status[name] = {
                "needed": round(needed, 2),
                "available": round(available, 2),
                "ok": ok
            }
            if not ok:
                is_viable = False
                shortages[name] = round(needed - available, 2)
                
    panels_status = []
    for req in panel_requirements:
        fit_info = calculate_max_panels_from_roll(
            request.roll_width, request.roll_length, req["width"], req["height"]
        )
        ok = fit_info["count"] >= req["needed_count"]
        panels_status.append({
            "product": req["product"],
            "width": req["width"],
            "height": req["height"],
            "needed": req["needed_count"],
            "available_in_roll": fit_info["count"],
            "ok": ok
        })
        if not ok:
            is_viable = False
            shortages[f"Paneles ({req['width']}x{req['height']}cm)"] = req["needed_count"] - fit_info["count"]
            
    estimated_days = round(total_labor_hours / 8.0, 1)
    return {
        "is_viable": is_viable,
        "hardware_status": status,
        "panels_status": panels_status,
        "shortages": shortages,
        "total_labor_hours": round(total_labor_hours, 1),
        "estimated_days": estimated_days
    }


@app.get("/api/production")
def get_production_history():
    """Retorna el historial de producción."""
    return _load_production()


@app.post("/api/production", status_code=201)
def add_production_record(record: ProductionRecord):
    """Agrega un registro de producción al historial y descuenta automáticamente del inventario."""
    # 1. Validar y descontar stock de inventario si product_key está presente y es válido
    if record.product_key and record.product_key != "custom":
        products = _load_products()
        if record.product_key in products:
            prod_data = products[record.product_key]
            bom = BOMItem(**{k: v for k, v in prod_data.items() if k != "name"})
            
            # Calcular requerimientos
            needed = {
                "cinta": round(bom.cinta * record.quantity, 2),
                "cadenas": round(bom.cadenas * record.quantity, 2),
                "argollas": bom.argollas * record.quantity,
                "hebillas": bom.hebillas * record.quantity,
                "remaches": bom.remaches * record.quantity,
                "ojalillos": bom.ojalillos * record.quantity,
                "varillas": bom.varillas * record.quantity,
                "tachas": bom.tachas * record.quantity,
                "mosquetones": bom.mosquetones * record.quantity,
            }
            
            if bom.panels_count > 0 and bom.panel_width > 0 and bom.panel_height > 0:
                needed["cuerina_rollo"] = calculate_cuerina_consumed_m(
                    bom.panel_width, bom.panel_height, bom.panels_count * record.quantity
                )
                
            needed = {k: v for k, v in needed.items() if v > 0}
            
            # Verificar stock disponible
            inventory = _load_inventory()
            inventory_dict = {item["item_key"]: item for item in inventory}
            shortages = []
            for key, qty in needed.items():
                inv_item = inventory_dict.get(key)
                if not inv_item:
                    shortages.append(f"Insumo '{key}' no encontrado en inventario")
                elif inv_item["stock"] < qty:
                    shortages.append(
                        f"{inv_item['name']} (falta {round(qty - inv_item['stock'], 2)} {inv_item['unit']})"
                    )
                    
            if shortages:
                raise HTTPException(
                    status_code=400,
                    detail="Falta stock de materiales: " + ", ".join(shortages)
                )
                
            # Todo OK. Descontar y loggear
            for key, qty in needed.items():
                inventory_dict[key]["stock"] = round(inventory_dict[key]["stock"] - qty, 2)
                _log_movement(
                    item_key=key,
                    quantity=-qty,
                    movement_type="produccion",
                    reference=f"Confección de {record.quantity}x {record.product_name}"
                )
                
            # Guardar inventario actualizado
            _save_inventory(list(inventory_dict.values()))

    # 2. Guardar registro de producción
    records = _load_production()
    new_record = {
        "id": str(uuid.uuid4())[:8],
        "date": datetime.now().isoformat(),
        **record.model_dump()
    }
    records.append(new_record)
    _save_production(records)
    return new_record



@app.get("/api/trends")
def get_trends():
    """Busca tendencias de moda alternativa en tiempo real usando RSS de La Carmina y Google News."""
    feeds = [
        ("La Carmina Blog", "https://www.lacarmina.com/blog/feed/"),
        ("Google News - Tendencias", "https://news.google.com/rss/search?q=gothic+fashion+OR+latex+fashion+OR+fetish+fashion&hl=es-419&gl=AR&ceid=AR:es-419")
    ]
    
    articles = []
    STOPWORDS = {
        "el", "la", "los", "las", "un", "una", "unos", "unas", "de", "del", "en", "para", "por", 
        "con", "y", "o", "a", "al", "is", "of", "in", "to", "and", "the", "for", "on", "with", "a", "an",
        "new", "moda", "fashion", "trends", "news", "trend", "style", "subculture", "blog", "en", "como", "mas"
    }
    
    word_counts = {}
    
    for source_name, url in feeds:
        try:
            req = urllib.request.Request(
                url, 
                headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AntigravityClient/1.0'}
            )
            with urllib.request.urlopen(req, timeout=3.5) as response:
                xml_data = response.read()
                
            root = ET.fromstring(xml_data)
            for item in root.findall('.//item')[:8]:
                title_elem = item.find('title')
                link_elem = item.find('link')
                if title_elem is None or title_elem.text is None:
                    continue
                title = title_elem.text
                link = link_elem.text if link_elem is not None else "#"
                pub_date = item.find('pubDate').text if item.find('pubDate') is not None else ""
                
                if pub_date:
                    try:
                        pub_date = pub_date.split(" +")[0].split(" -")[0]
                    except Exception:
                        pass
                
                articles.append({
                    "title": title,
                    "link": link,
                    "pub_date": pub_date,
                    "source": source_name
                })
                
                clean_title = title.lower()
                for char in '.,;:!?()"\'[]-':
                    clean_title = clean_title.replace(char, ' ')
                words = clean_title.split()
                for w in words:
                    if len(w) > 2 and w not in STOPWORDS and not w.isdigit():
                        word_counts[w] = word_counts.get(w, 0) + 1
        except Exception:
            pass
            
    if not articles:
        articles = [
            {"title": "How to Style a Corset: The Ultimate Corsetry Fashion Guide", "link": "https://www.harpersbazaar.com/fashion/trends/a39563229/how-to-style-a-corset/", "pub_date": "Harper's BAZAAR", "source": "Harper's BAZAAR"},
            {"title": "Why Gothic Fashion and Dark Romanticism Rule Modern Runway Aesthetics", "link": "https://www.dazeddigital.com/fashion", "pub_date": "Dazed Digital", "source": "Dazed Digital"},
            {"title": "Metal Hardware & Harness Styling in Modern Underground Fashion Editorials", "link": "https://www.kaltblut-magazine.com/", "pub_date": "KALTBLUT Magazine", "source": "KALTBLUT Magazine"},
            {"title": "Tormenta Indumentaria: Vestuario Neopunk, Corsetería y Performance en Chile", "link": "https://www.instagram.com/tormenta_indumentaria/", "pub_date": "@tormenta_indumentaria", "source": "Instagram Oficial"},
            {"title": "Nu-Goth & Industrial Dark Fashion Trends: Style Guide & Streetwear", "link": "https://www.impericon.com/en/gothic-fashion.html", "pub_date": "Impericon Magazine", "source": "Impericon"},
            {"title": "Tokyo Gothic & Cyberpunk Subculture: Alternative Fashion & Harajuku Guide", "link": "https://lacarmina.com/blog/2026/06/tokyo-japan-goth-metal-rock-bars-guide-nanzuka-taken-guinea-pig/", "pub_date": "La Carmina Blog", "source": "La Carmina Blog"},
            {"title": "The Evolution of Corsetry: From Restriction to Liberation & Leatherwork", "link": "https://www.vogue.com/article/vivienne-westwood-corset-history-fashion", "pub_date": "Vogue Magazine", "source": "Vogue"},
            {"title": "Slow Fashion y Confección Artesanal: El resurgimiento del diseño Zero Waste", "link": "https://fashionunited.es/", "pub_date": "FashionUnited", "source": "FashionUnited"}
        ]
        word_counts = {
            "latex": 18, "gothic": 15, "harness": 14, "leather": 12, "corset": 10, 
            "hardware": 9, "cyberpunk": 8, "fetish": 12, "artesanal": 7, "gothcore": 8,
            "cuero": 11, "hecho-a-mano": 8, "slow-fashion": 10, "argollas": 6, "hebillas": 6
        }
        
    sorted_tags = sorted(word_counts.items(), key=lambda x: x[1], reverse=True)[:20]
    tags = [{"text": tag, "weight": count} for tag, count in sorted_tags]
    
    return {
        "articles": articles[:12],
        "tags": tags
    }


@app.get("/api/trends/search")
def search_trends(q: str = Query(..., min_length=2)):
    """Busca noticias de moda alternativa en tiempo real usando RSS de Google News."""
    encoded_q = urllib.parse.quote(q)
    url = f"https://news.google.com/rss/search?q={encoded_q}+fashion&hl=es-419&gl=AR&ceid=AR:es-419"
    articles = []
    
    try:
        req = urllib.request.Request(
            url,
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AntigravityClient/1.0'}
        )
        with urllib.request.urlopen(req, timeout=4.0) as response:
            xml_data = response.read()
            
        root = ET.fromstring(xml_data)
        for item in root.findall('.//item')[:12]:
            title_elem = item.find('title')
            link_elem = item.find('link')
            if title_elem is None or title_elem.text is None:
                continue
            title = title_elem.text
            link = link_elem.text if link_elem is not None else "#"
            pub_date = item.find('pubDate').text if item.find('pubDate') is not None else ""
            
            source_elem = item.find('source')
            source_name = source_elem.text if (source_elem is not None and source_elem.text) else "Prensa Moda"
            
            articles.append({
                "id": len(articles) + 1,
                "title": title,
                "link": link,
                "pub_date": pub_date,
                "source": source_name,
                "category": "all",
                "snippet": f"Noticia en tiempo real rastreada sobre '{q}'."
            })
    except Exception:
        pass
        
    return {
        "query": q,
        "articles": articles
    }



# --- PERSISTENCIA DE INVENTARIO (JSON local) ---

INVENTORY_FILE = os.path.join(os.path.dirname(__file__), "inventory_data.json")

DEFAULT_INVENTORY = [
    {"item_key": "argollas", "name": "Argollas metálicas", "stock": 100, "min_stock": 20, "unit": "uds"},
    {"item_key": "hebillas", "name": "Hebillas reguladoras", "stock": 80, "min_stock": 15, "unit": "uds"},
    {"item_key": "remaches", "name": "Remaches de unión", "stock": 300, "min_stock": 50, "unit": "uds"},
    {"item_key": "ojalillos", "name": "Ojalillos metálicos", "stock": 200, "min_stock": 30, "unit": "uds"},
    {"item_key": "varillas", "name": "Varillas de soporte", "stock": 50, "min_stock": 10, "unit": "uds"},
    {"item_key": "cadenas", "name": "Cadenas metálicas", "stock": 10.0, "min_stock": 2.0, "unit": "metros"},
    {"item_key": "tachas", "name": "Tachas decorativas", "stock": 150, "min_stock": 25, "unit": "uds"},
    {"item_key": "mosquetones", "name": "Mosquetones de enganche", "stock": 40, "min_stock": 8, "unit": "uds"},
    {"item_key": "cinta", "name": "Cinta/Correa", "stock": 20.0, "min_stock": 5.0, "unit": "metros"},
    {"item_key": "cuerina_rollo", "name": "Cuerina en rollo", "stock": 15.0, "min_stock": 3.0, "unit": "metros"},
]


class InventoryItem(BaseModel):
    item_key: str
    name: str
    stock: float
    min_stock: float
    unit: str


class InventoryUpdate(BaseModel):
    quantity: float
    reason: str = ""


def _load_inventory() -> List[dict]:
    if not os.path.exists(INVENTORY_FILE):
        _save_inventory(DEFAULT_INVENTORY)
        return [item.copy() for item in DEFAULT_INVENTORY]
    try:
        with open(INVENTORY_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return [item.copy() for item in DEFAULT_INVENTORY]


def _save_inventory(items: List[dict]):
    with open(INVENTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=2)


# --- PERSISTENCIA DE MOVIMIENTOS DE INVENTARIO (JSON local) ---

INVENTORY_MOVEMENTS_FILE = os.path.join(os.path.dirname(__file__), "inventory_movements_data.json")

class InventoryMovement(BaseModel):
    id: str
    item_key: str
    quantity: float
    movement_type: str
    reference: str = ""
    date: str

def _load_movements() -> List[dict]:
    if not os.path.exists(INVENTORY_MOVEMENTS_FILE):
        return []
    try:
        with open(INVENTORY_MOVEMENTS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return []

def _save_movements(movements: List[dict]):
    with open(INVENTORY_MOVEMENTS_FILE, "w", encoding="utf-8") as f:
        json.dump(movements, f, ensure_ascii=False, indent=2)

def _log_movement(item_key: str, quantity: float, movement_type: str, reference: str = ""):
    movements = _load_movements()
    now = datetime.now().isoformat()
    new_movement = {
        "id": str(uuid.uuid4())[:8],
        "item_key": item_key,
        "quantity": quantity,
        "movement_type": movement_type,
        "reference": reference,
        "date": now
    }
    movements.append(new_movement)
    _save_movements(movements)


# --- PERSISTENCIA DE PROVEEDORES (JSON local) ---

SUPPLIERS_FILE = os.path.join(os.path.dirname(__file__), "suppliers_data.json")


class SupplierCreate(BaseModel):
    name: str
    contact: str = ""
    notes: str = ""
    prices: Dict[str, float] = {}


class SupplierResponse(SupplierCreate):
    id: str
    created_at: str


def _load_suppliers() -> List[dict]:
    if not os.path.exists(SUPPLIERS_FILE):
        return []
    try:
        with open(SUPPLIERS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return []


def _save_suppliers(suppliers: List[dict]):
    with open(SUPPLIERS_FILE, "w", encoding="utf-8") as f:
        json.dump(suppliers, f, ensure_ascii=False, indent=2)


# --- PERSISTENCIA DE PEDIDOS / ÓRDENES (JSON local) ---

ORDERS_FILE = os.path.join(os.path.dirname(__file__), "orders_data.json")

VALID_ORDER_STATUSES = {"pendiente", "en_confeccion", "terminado", "entregado"}


class OrderCreate(BaseModel):
    client_id: str = ""
    client_name: str
    product_key: str
    product_name: str
    size: str = "M"
    custom_notes: str = ""
    quoted_price: float = 0
    due_date: str = ""
    status: str = "pendiente"


class OrderResponse(OrderCreate):
    id: str
    created_at: str
    updated_at: str


class OrderStatusUpdate(BaseModel):
    status: str


def _load_orders() -> List[dict]:
    if not os.path.exists(ORDERS_FILE):
        return []
    try:
        with open(ORDERS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return []


def _save_orders(orders: List[dict]):
    with open(ORDERS_FILE, "w", encoding="utf-8") as f:
        json.dump(orders, f, ensure_ascii=False, indent=2)


# --- BACKUP / RESTORE ---

@app.get("/api/backup")
def backup_all_data():
    """Exporta un backup consolidado de todos los datos del taller."""
    return {
        "products": _load_products(),
        "clients": _load_clients(),
        "production": _load_production(),
        "inventory": _load_inventory(),
        "suppliers": _load_suppliers(),
        "orders": _load_orders(),
        "inventory_movements": _load_movements()
    }


@app.post("/api/restore")
def restore_all_data(data: dict):
    """Restaura todos los datos del taller desde un backup consolidado."""
    if "products" in data:
        _save_products(data["products"])
    if "clients" in data:
        _save_clients(data["clients"])
    if "production" in data:
        _save_production(data["production"])
    if "inventory" in data:
        _save_inventory(data["inventory"])
    if "suppliers" in data:
        _save_suppliers(data["suppliers"])
    if "orders" in data:
        _save_orders(data["orders"])
    if "inventory_movements" in data:
        _save_movements(data["inventory_movements"])
    return {"restored": True}



# --- ENDPOINTS DE INVENTARIO ---

@app.get("/api/inventory/alerts")
def get_inventory_alerts():
    """Retorna solo los items con stock por debajo del mínimo."""
    items = _load_inventory()
    alerts = []
    for item in items:
        if item["stock"] <= item["min_stock"]:
            alerts.append({**item, "alert": True})
    return alerts


@app.get("/api/inventory")
def get_inventory():
    """Retorna el inventario completo con indicador de alerta."""
    items = _load_inventory()
    result = []
    for item in items:
        result.append({**item, "alert": item["stock"] <= item["min_stock"]})
    return result


@app.put("/api/inventory/{item_key}")
def update_inventory(item_key: str, update: InventoryUpdate):
    """Actualiza el stock de un item sumando/restando la cantidad indicada."""
    items = _load_inventory()
    for i, item in enumerate(items):
        if item["item_key"] == item_key:
            new_stock = round(item["stock"] + update.quantity, 2)
            if new_stock < 0:
                raise HTTPException(
                    status_code=400,
                    detail=f"Stock insuficiente. Stock actual: {item['stock']}, movimiento solicitado: {update.quantity}"
                )
            items[i]["stock"] = new_stock
            _save_inventory(items)
            # Log movement
            reason = update.reason or ("entrada" if update.quantity >= 0 else "merma")
            ref = "Ajuste manual de stock"
            if reason == "compra":
                ref = "Compra de insumos"
            elif reason == "donacion":
                ref = "Donación recibida"
            elif reason == "merma":
                ref = "Merma / Desperdicio"
            _log_movement(item_key, update.quantity, reason, ref)
            return {**items[i], "alert": items[i]["stock"] <= items[i]["min_stock"], "movement": update.quantity, "reason": update.reason}
    raise HTTPException(status_code=404, detail=f"Item '{item_key}' no encontrado en el inventario.")


@app.get("/api/inventory/movements")
def get_inventory_movements():
    """Retorna el historial de movimientos del inventario."""
    movements = _load_movements()
    movements.sort(key=lambda x: x.get("date", ""), reverse=True)
    return movements



# --- ENDPOINTS DE PROVEEDORES ---

@app.get("/api/suppliers/compare")
def compare_suppliers():
    """Compara precios de todos los proveedores por item, ordenados de menor a mayor precio."""
    suppliers = _load_suppliers()
    comparison: Dict[str, list] = {}
    for sup in suppliers:
        for item_key, price in sup.get("prices", {}).items():
            if item_key not in comparison:
                comparison[item_key] = []
            comparison[item_key].append({"supplier": sup["name"], "price": price})
    # Ordenar cada lista por precio ascendente
    for item_key in comparison:
        comparison[item_key].sort(key=lambda x: x["price"])
    return comparison


@app.get("/api/suppliers")
def list_suppliers():
    """Lista todos los proveedores registrados."""
    return _load_suppliers()


@app.post("/api/suppliers", status_code=201)
def create_supplier(supplier: SupplierCreate):
    """Registra un nuevo proveedor."""
    suppliers = _load_suppliers()
    now = datetime.now().isoformat()
    new_supplier = {
        "id": str(uuid.uuid4())[:8],
        **supplier.model_dump(),
        "created_at": now
    }
    suppliers.append(new_supplier)
    _save_suppliers(suppliers)
    return new_supplier


@app.put("/api/suppliers/{supplier_id}")
def update_supplier(supplier_id: str, supplier: SupplierCreate):
    """Actualiza los datos de un proveedor existente."""
    suppliers = _load_suppliers()
    for i, s in enumerate(suppliers):
        if s["id"] == supplier_id:
            suppliers[i] = {
                **s,
                **supplier.model_dump(),
            }
            _save_suppliers(suppliers)
            return suppliers[i]
    raise HTTPException(status_code=404, detail="Proveedor no encontrado.")


@app.delete("/api/suppliers/{supplier_id}")
def delete_supplier(supplier_id: str):
    """Elimina un proveedor por su ID."""
    suppliers = _load_suppliers()
    original_len = len(suppliers)
    suppliers = [s for s in suppliers if s["id"] != supplier_id]
    if len(suppliers) == original_len:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado.")
    _save_suppliers(suppliers)
    return {"deleted": True, "id": supplier_id}


# --- ENDPOINTS DE PEDIDOS / ÓRDENES DE PRODUCCIÓN ---

@app.get("/api/orders")
def list_orders(status: Optional[str] = None):
    """Lista todos los pedidos. Filtro opcional por estado (?status=pendiente)."""
    orders = _load_orders()
    if status:
        if status not in VALID_ORDER_STATUSES:
            raise HTTPException(status_code=400, detail=f"Estado no válido. Opciones: {', '.join(VALID_ORDER_STATUSES)}")
        orders = [o for o in orders if o.get("status") == status]
    return orders


@app.post("/api/orders", status_code=201)
def create_order(order: OrderCreate):
    """Crea un nuevo pedido de producción."""
    if order.status not in VALID_ORDER_STATUSES:
        raise HTTPException(status_code=400, detail=f"Estado no válido. Opciones: {', '.join(VALID_ORDER_STATUSES)}")
    orders = _load_orders()
    now = datetime.now().isoformat()
    new_order = {
        "id": str(uuid.uuid4())[:8],
        **order.model_dump(),
        "created_at": now,
        "updated_at": now
    }
    orders.append(new_order)
    _save_orders(orders)
    return new_order


@app.put("/api/orders/{order_id}")
def update_order(order_id: str, order: OrderCreate):
    """Actualiza un pedido existente (todos los campos)."""
    if order.status not in VALID_ORDER_STATUSES:
        raise HTTPException(status_code=400, detail=f"Estado no válido. Opciones: {', '.join(VALID_ORDER_STATUSES)}")
    orders = _load_orders()
    for i, o in enumerate(orders):
        if o["id"] == order_id:
            orders[i] = {
                **o,
                **order.model_dump(),
                "updated_at": datetime.now().isoformat()
            }
            _save_orders(orders)
            return orders[i]
    raise HTTPException(status_code=404, detail="Pedido no encontrado.")


@app.put("/api/orders/{order_id}/status")
def update_order_status(order_id: str, body: OrderStatusUpdate):
    """Actualiza solo el estado de un pedido (pendiente → en_confeccion → terminado → entregado)."""
    if body.status not in VALID_ORDER_STATUSES:
        raise HTTPException(status_code=400, detail=f"Estado no válido. Opciones: {', '.join(VALID_ORDER_STATUSES)}")
    orders = _load_orders()
    for i, o in enumerate(orders):
        if o["id"] == order_id:
            orders[i]["status"] = body.status
            orders[i]["updated_at"] = datetime.now().isoformat()
            _save_orders(orders)
            return orders[i]
    raise HTTPException(status_code=404, detail="Pedido no encontrado.")


@app.delete("/api/orders/{order_id}")
def delete_order(order_id: str):
    """Elimina un pedido por su ID."""
    orders = _load_orders()
    original_len = len(orders)
    orders = [o for o in orders if o["id"] != order_id]
    if len(orders) == original_len:
        raise HTTPException(status_code=404, detail="Pedido no encontrado.")
    _save_orders(orders)
    return {"deleted": True, "id": order_id}


# --- DASHBOARD / KPIs ---

@app.get("/api/dashboard")
def get_dashboard():
    """Retorna KPIs agregados: producción mensual, alertas, pedidos, tendencias semanales y mensuales."""
    production = _load_production()
    inventory = _load_inventory()
    orders = _load_orders()

    now = datetime.now()
    current_year = now.year
    current_month = now.month

    # --- Producción del mes actual ---
    total_units = 0
    total_revenue = 0.0
    total_cost = 0.0
    for rec in production:
        try:
            rec_date = datetime.fromisoformat(rec["date"])
            if rec_date.year == current_year and rec_date.month == current_month:
                total_units += rec.get("quantity", 0)
                total_revenue += rec.get("retail_price", 0) * rec.get("quantity", 0)
                total_cost += rec.get("materials_cost", 0) + rec.get("labor_cost", 0)
        except (ValueError, KeyError):
            continue

    net_profit = round(total_revenue - total_cost, 2)

    production_this_month = {
        "total_units": total_units,
        "total_revenue": round(total_revenue, 2),
        "total_cost": round(total_cost, 2),
        "net_profit": net_profit
    }

    # --- Alertas de inventario ---
    inventory_alerts = sum(1 for item in inventory if item["stock"] <= item["min_stock"])

    # --- Pedidos atrasados (vencidos y no entregados) ---
    today_str = now.strftime("%Y-%m-%d")
    overdue_orders = 0
    for o in orders:
        if o.get("status") != "entregado" and o.get("due_date") and o.get("due_date") < today_str:
            overdue_orders += 1

    # --- Pedidos por estado ---
    orders_by_status: Dict[str, int] = {"pendiente": 0, "en_confeccion": 0, "terminado": 0, "entregado": 0}
    for o in orders:
        st = o.get("status", "pendiente")
        if st in orders_by_status:
            orders_by_status[st] += 1
    pending_orders = orders_by_status["pendiente"]

    # --- Producción por semana (últimas 8 semanas) ---
    from collections import defaultdict
    weekly: Dict[str, dict] = defaultdict(lambda: {"units": 0, "revenue": 0.0})
    for rec in production:
        try:
            rec_date = datetime.fromisoformat(rec["date"])
            iso_cal = rec_date.isocalendar()
            week_key = f"{iso_cal[0]}-W{iso_cal[1]:02d}"
            qty = rec.get("quantity", 0)
            weekly[week_key]["units"] += qty
            weekly[week_key]["revenue"] += rec.get("retail_price", 0) * qty
        except (ValueError, KeyError):
            continue

    sorted_weeks = sorted(weekly.keys(), reverse=True)[:8]
    production_by_week = [
        {"week": w, "units": weekly[w]["units"], "revenue": round(weekly[w]["revenue"], 2)}
        for w in sorted_weeks
    ]

    # --- Desglose de costos del mes ---
    materials_cost_month = 0.0
    labor_cost_month = 0.0
    for rec in production:
        try:
            rec_date = datetime.fromisoformat(rec["date"])
            if rec_date.year == current_year and rec_date.month == current_month:
                materials_cost_month += rec.get("materials_cost", 0)
                labor_cost_month += rec.get("labor_cost", 0)
        except (ValueError, KeyError):
            continue

    cost_breakdown = {
        "materials": round(materials_cost_month, 2),
        "labor": round(labor_cost_month, 2)
    }

    # --- Tendencia de ganancia mensual (últimos 6 meses) ---
    monthly: Dict[str, dict] = defaultdict(lambda: {"revenue": 0.0, "cost": 0.0})
    for rec in production:
        try:
            rec_date = datetime.fromisoformat(rec["date"])
            month_key = f"{rec_date.year}-{rec_date.month:02d}"
            qty = rec.get("quantity", 0)
            monthly[month_key]["revenue"] += rec.get("retail_price", 0) * qty
            monthly[month_key]["cost"] += rec.get("materials_cost", 0) + rec.get("labor_cost", 0)
        except (ValueError, KeyError):
            continue

    sorted_months = sorted(monthly.keys(), reverse=True)[:6]
    monthly_profit_trend = [
        {"month": m, "profit": round(monthly[m]["revenue"] - monthly[m]["cost"], 2)}
        for m in sorted_months
    ]

    return {
        "production_this_month": production_this_month,
        "inventory_alerts": inventory_alerts,
        "pending_orders": pending_orders,
        "overdue_orders": overdue_orders,
        "orders_by_status": orders_by_status,
        "production_by_week": production_by_week,
        "cost_breakdown": cost_breakdown,
        "monthly_profit_trend": monthly_profit_trend
    }


# --- RUTAS DE INTERFAZ ESTATICA ---

@app.get("/")
def read_root():
    index_path = os.path.join(static_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "El Optimizador de Tormenta Indumentaria está activo. Por favor, crea el archivo static/index.html para ver la UI."}

# Servir archivos estáticos individuales desde la raíz para compatibilidad con Netlify/Jamstack
@app.get("/style.css")
def get_style():
    return FileResponse(os.path.join(static_dir, "style.css"))

@app.get("/app.js")
def get_app():
    return FileResponse(os.path.join(static_dir, "app.js"))

# Registrar la carpeta estática para servir otros archivos (CSS, JS, imágenes)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

if __name__ == "__main__":
    import uvicorn
    # Ejecutar en el puerto 8000
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)

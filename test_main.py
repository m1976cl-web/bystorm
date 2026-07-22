# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "fastapi",
#     "uvicorn",
#     "pytest",
#     "httpx",
# ]
# ///

import pytest
from fastapi.testclient import TestClient
from main import app, DEFAULT_BOMS

client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200

def test_scale_patterns():
    payload = {
        "bust": 90.0,
        "underbust": 75.0,
        "waist": 70.0,
        "neck": 36.0,
        "base_size": "M",
        "contour_increment": 4.0,
        "neck_increment": 1.5,
        "scaling_factor": 1.0
    }
    response = client.post("/api/scale", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["base_size"] == "M"
    assert len(data["scaled_sizes"]) == 4  # S, M, L, XL
    
    # Check that size M is the base and matches original values
    m_size = [s for s in data["scaled_sizes"] if s["size"] == "M"][0]
    assert m_size["is_base"] is True
    assert m_size["bust"] == 90.0
    assert m_size["underbust"] == 75.0

    # Check that size L has the increment added
    l_size = [s for s in data["scaled_sizes"] if s["size"] == "L"][0]
    assert l_size["bust"] == 94.0
    assert l_size["neck"] == 37.5

def test_optimize_materials():
    payload = {
        "roll_width": 140.0,
        "roll_length": 5.0,
        "argollas": 100,
        "hebillas": 80,
        "remaches": 300,
        "ojalillos": 200,
        "varillas": 50,
        "cadenas": 10.0,
        "tachas": 150,
        "mosquetones": 40,
        "product_key": "arnes"
    }
    response = client.post("/api/optimize", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "max_units" in data
    assert "bottlenecks" in data
    assert "constraints" in data
    assert "leftover_inventory" in data

def test_generate_quote():
    payload = {
        "product_key": "arnes",
        "pricing": {
            "cost_cuerina_per_m": 3500.0,
            "cost_cinta_per_m": 800.0,
            "cost_argolla": 350.0,
            "cost_hebilla": 450.0,
            "cost_remache": 50.0,
            "cost_ojalillo": 80.0,
            "cost_varilla": 200.0,
            "cost_cadena_per_m": 1200.0,
            "cost_tacha": 60.0,
            "cost_mosqueton": 500.0,
            "cost_panel_per_m2": 5000.0,
            "labor_hours": 3.0,
            "labor_rate_per_hour": 2000.0,
            "profit_margin_percent": 60.0
        }
    }
    response = client.post("/api/quote", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["product_key"] == "arnes"
    assert "breakdown" in data
    assert data["total_materials"] > 0
    assert data["suggested_retail_price"] > 0

def test_products_crud():
    # List products
    response = client.get("/api/products")
    assert response.status_code == 200
    products = response.json()
    assert "arnes" in products
    
    # Create product
    new_product = {
        "key": "test_product",
        "name": "Test Product Name",
        "bom": {
            "cinta": 1.0,
            "argollas": 2,
            "hebillas": 2,
            "remaches": 4,
            "ojalillos": 0,
            "varillas": 0,
            "cadenas": 0.0,
            "tachas": 0,
            "mosquetones": 0
        }
    }
    response = client.post("/api/products", json=new_product)
    assert response.status_code == 201
    
    # Verify it exists
    response = client.get("/api/products")
    products = response.json()
    assert "test_product" in products
    assert products["test_product"]["name"] == "Test Product Name"
    
    # Update product
    updated_bom = {
        "cinta": 1.5,
        "argollas": 3,
        "hebillas": 3,
        "remaches": 6,
        "ojalillos": 0,
        "varillas": 0,
        "cadenas": 0.0,
        "tachas": 0,
        "mosquetones": 0
    }
    response = client.put("/api/products/test_product", json=updated_bom)
    assert response.status_code == 200
    
    # Delete product
    response = client.delete("/api/products/test_product")
    assert response.status_code == 200
    
    # Verify deleted
    response = client.get("/api/products")
    products = response.json()
    assert "test_product" not in products

def test_clients_crud():
    # List clients
    response = client.get("/api/clients")
    assert response.status_code == 200
    clients = response.json()
    initial_count = len(clients)
    
    # Create client
    new_client = {
        "name": "Juan Perez",
        "contact": "@juanperez",
        "notes": "Alergia al niquel",
        "bust": 95.0,
        "underbust": 80.0,
        "waist": 75.0,
        "neck": 38.0,
        "preferred_size": "L"
    }
    response = client.post("/api/clients", json=new_client)
    assert response.status_code == 201
    created = response.json()
    assert created["name"] == "Juan Perez"
    client_id = created["id"]
    
    # Verify count increased
    response = client.get("/api/clients")
    clients = response.json()
    assert len(clients) == initial_count + 1
    
    # Update client
    updated_client = {
        "name": "Juan Perez Modificado",
        "contact": "@juanperez_mod",
        "notes": "Alergia al niquel - Ajuste flojo",
        "bust": 96.0,
        "underbust": 81.0,
        "waist": 76.0,
        "neck": 39.0,
        "preferred_size": "L"
    }
    response = client.put(f"/api/clients/{client_id}", json=updated_client)
    assert response.status_code == 200
    assert response.json()["name"] == "Juan Perez Modificado"
    
    # Delete client
    response = client.delete(f"/api/clients/{client_id}")
    assert response.status_code == 200
    
    # Verify count restored
    response = client.get("/api/clients")
    clients = response.json()
    assert len(clients) == initial_count

def test_inventory_endpoints():
    response = client.get("/api/inventory")
    assert response.status_code == 200
    items = response.json()
    assert len(items) > 0
    
    # Find argollas stock
    argollas_item = [i for i in items if i["item_key"] == "argollas"][0]
    initial_stock = argollas_item["stock"]
    
    # Add stock
    update_payload = {
        "quantity": 10.0,
        "reason": "Compra de prueba"
    }
    response = client.put("/api/inventory/argollas", json=update_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["stock"] == initial_stock + 10.0
    
    # Subtract stock back
    update_payload = {
        "quantity": -10.0,
        "reason": "Correccion de prueba"
    }
    response = client.put("/api/inventory/argollas", json=update_payload)
    assert response.status_code == 200
    assert response.json()["stock"] == initial_stock

def test_dashboard_kpis():
    response = client.get("/api/dashboard")
    assert response.status_code == 200
    data = response.json()
    assert "production_this_month" in data
    assert "inventory_alerts" in data
    assert "pending_orders" in data
    assert "overdue_orders" in data


def test_overdue_orders_and_movements_flow():
    # 1. Test batch optimization returns labor metrics
    batch_payload = {
        "items": [
            {"product_key": "arnes", "quantity": 2},
            {"product_key": "mascara", "quantity": 3}
        ]
    }
    response = client.post("/api/optimize/batch", json=batch_payload)
    assert response.status_code == 200
    data = response.json()
    assert "total_labor_hours" in data
    assert "estimated_days" in data
    # arnes labor: 2.5 * 2 = 5h, mascara labor: 1.5 * 3 = 4.5h. Total = 9.5h. Days = 9.5/8 = 1.2 days.
    assert data["total_labor_hours"] == 9.5
    assert data["estimated_days"] == 1.2

    # 2. Test manual inventory update logs a movement
    # Get initial movement count
    response = client.get("/api/inventory/movements")
    assert response.status_code == 200
    initial_movements = len(response.json())

    # Perform manual update
    update_payload = {"quantity": 5.0, "reason": "compra"}
    response = client.put("/api/inventory/argollas", json=update_payload)
    assert response.status_code == 200
    
    # Check that new movement was logged
    response = client.get("/api/inventory/movements")
    assert response.status_code == 200
    movements = response.json()
    assert len(movements) == initial_movements + 1
    assert movements[0]["item_key"] == "argollas"
    assert movements[0]["quantity"] == 5.0
    assert movements[0]["movement_type"] == "compra"

    # Subtract the 5 argollas back to keep test clean
    client.put("/api/inventory/argollas", json={"quantity": -5.0, "reason": "ajuste"})

    # 3. Test production auto deduction
    # Get current stock of cinta
    response = client.get("/api/inventory")
    cinta_stock_initial = [i["stock"] for i in response.json() if i["item_key"] == "cinta"][0]
    
    # Register production for 1 arnes (consumes 2.5 cinta)
    prod_payload = {
        "product_name": "Arnés Tormenta Test",
        "quantity": 1,
        "materials_cost": 1000.0,
        "labor_cost": 2000.0,
        "retail_price": 5000.0,
        "profit": 2000.0,
        "product_key": "arnes"
    }
    response = client.post("/api/production", json=prod_payload)
    assert response.status_code == 201
    
    # Check that stock was deducted
    response = client.get("/api/inventory")
    cinta_stock_after = [i["stock"] for i in response.json() if i["item_key"] == "cinta"][0]
    assert cinta_stock_after == cinta_stock_initial - 2.5
    
    # Check that a production movement was logged
    response = client.get("/api/inventory/movements")
    movements = response.json()
    # Let's verify that one of the logged movements is for cinta with quantity -2.5
    cinta_movement = [m for m in movements if m["item_key"] == "cinta" and m["quantity"] == -2.5]
    assert len(cinta_movement) > 0
    assert cinta_movement[0]["movement_type"] == "produccion"

    # Test that registering a massive production fails due to insufficient stock
    prod_payload_huge = {
        "product_name": "Arnés Tormenta Huge Test",
        "quantity": 9999,
        "materials_cost": 1000.0,
        "labor_cost": 2000.0,
        "retail_price": 5000.0,
        "profit": 2000.0,
        "product_key": "arnes"
    }
    response = client.post("/api/production", json=prod_payload_huge)
    assert response.status_code == 400
    assert "Falta stock" in response.json()["detail"]


# --- v2.1 pedidos-punta-a-punta (D1+) ---

def test_t1_create_order_with_half_deposit():
    """T1: Crear orden con seña 50% → payment_status seña y balance correcto."""
    payload = {
        "client_name": "Cliente Seña",
        "product_key": "arnes_body",
        "product_name": "Arnés Corporal Integral",
        "quantity": 1,
        "size": "L",
        "quoted_price": 45000,
        "deposit_amount": 22500,
        "due_date": "2026-08-01",
        "contact_phone": "5491100000000",
        "materials_cost_snapshot": 12000,
        "labor_cost_snapshot": 8000,
    }
    response = client.post("/api/orders", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["payment_status"] == "seña"
    assert data["deposit_amount"] == 22500
    assert data["amount_paid_total"] == 22500
    assert data["balance_amount"] == 22500
    assert data["stock_deducted"] is False
    assert data["quantity"] == 1
    assert data["retail_price_snapshot"] == 45000
    order_id = data["id"]

    # Cleanup
    client.delete(f"/api/orders/{order_id}")


def test_t9_legacy_orders_get_defaults():
    """T9: Órdenes legacy sin campos nuevos no rompen GET/PUT (defaults suaves)."""
    from main import _load_orders, _save_orders, ORDERS_FILE
    import json
    import os

    # Insertar orden mínima al estilo pre-v2.1
    legacy = {
        "id": "legacy01",
        "client_name": "Legacy Cliente",
        "product_key": "arnes",
        "product_name": "Arnés Base",
        "size": "M",
        "custom_notes": "nota vieja",
        "quoted_price": 10000,
        "due_date": "",
        "status": "pendiente",
        "created_at": "2026-01-01T00:00:00",
        "updated_at": "2026-01-01T00:00:00",
    }
    orders = _load_orders()
    # Guardar crudo sin normalizar al archivo
    raw_path = ORDERS_FILE
    existing = []
    if os.path.exists(raw_path):
        with open(raw_path, "r", encoding="utf-8") as f:
            try:
                existing = json.load(f)
            except json.JSONDecodeError:
                existing = []
    existing.append(legacy)
    with open(raw_path, "w", encoding="utf-8") as f:
        json.dump(existing, f, ensure_ascii=False, indent=2)

    try:
        response = client.get("/api/orders")
        assert response.status_code == 200
        found = [o for o in response.json() if o["id"] == "legacy01"]
        assert len(found) == 1
        o = found[0]
        assert o["quantity"] == 1
        assert o["stock_deducted"] is False
        assert o["payment_status"] in ("sin_pago", "seña", "pagado")
        assert "balance_amount" in o
        assert o.get("notes") == "nota vieja" or o.get("custom_notes") == "nota vieja"

        # PUT no rompe
        update = {
            "client_name": "Legacy Cliente",
            "product_key": "arnes",
            "product_name": "Arnés Base",
            "size": "L",
            "quoted_price": 10000,
            "status": "pendiente",
        }
        response = client.put("/api/orders/legacy01", json=update)
        assert response.status_code == 200
        assert response.json()["size"] == "L"
        assert response.json()["stock_deducted"] is False
    finally:
        client.delete("/api/orders/legacy01")


def test_create_order_full_payment_status():
    """Seña total o paid == quoted → payment_status pagado."""
    payload = {
        "client_name": "Pagado Full",
        "product_key": "choker_dring",
        "product_name": "Choker",
        "quoted_price": 8000,
        "deposit_amount": 8000,
    }
    response = client.post("/api/orders", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["payment_status"] == "pagado"
    assert data["balance_amount"] == 0
    client.delete(f"/api/orders/{data['id']}")


def _make_order(**overrides):
    base = {
        "client_name": "Cliente Flujo",
        "product_key": "arnes",
        "product_name": "Arnés Pechera Tormenta",
        "quantity": 1,
        "size": "M",
        "quoted_price": 20000,
        "deposit_amount": 10000,
        "materials_cost_snapshot": 5000,
        "labor_cost_snapshot": 3000,
    }
    base.update(overrides)
    r = client.post("/api/orders", json=base)
    assert r.status_code == 201
    return r.json()


def test_t3_pendiente_to_en_confeccion_no_stock_touch():
    """T3: pendiente → en_confeccion no toca stock."""
    order = _make_order()
    oid = order["id"]

    inv_before = {i["item_key"]: i["stock"] for i in client.get("/api/inventory").json()}
    r = client.put(f"/api/orders/{oid}/status", json={"status": "en_confeccion"})
    assert r.status_code == 200
    assert r.json()["status"] == "en_confeccion"
    assert r.json()["stock_deducted"] is False

    inv_after = {i["item_key"]: i["stock"] for i in client.get("/api/inventory").json()}
    assert inv_before == inv_after

    client.delete(f"/api/orders/{oid}")


def test_t4_terminado_with_stock_ok():
    """T4: → terminado con stock OK → stock baja, movement, stock_deducted, production."""
    order = _make_order(product_key="arnes", product_name="Arnés Test T4")
    oid = order["id"]

    cinta_before = [
        i["stock"] for i in client.get("/api/inventory").json() if i["item_key"] == "cinta"
    ][0]
    prod_before = len(client.get("/api/production").json())

    client.put(f"/api/orders/{oid}/status", json={"status": "en_confeccion"})
    r = client.put(f"/api/orders/{oid}/status", json={"status": "terminado"})
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "terminado"
    assert data["stock_deducted"] is True
    assert data["production_id"]

    cinta_after = [
        i["stock"] for i in client.get("/api/inventory").json() if i["item_key"] == "cinta"
    ][0]
    # BOM arnes: 2.5 m cinta
    assert cinta_after == cinta_before - 2.5

    movements = client.get("/api/inventory/movements").json()
    assert any(
        m["item_key"] == "cinta"
        and m["quantity"] == -2.5
        and m["movement_type"] == "produccion"
        and oid in (m.get("reference") or "")
        for m in movements
    )

    production = client.get("/api/production").json()
    assert len(production) == prod_before + 1
    linked = [p for p in production if p.get("order_id") == oid]
    assert len(linked) == 1
    assert linked[0]["id"] == data["production_id"]

    client.delete(f"/api/orders/{oid}")


def test_t5_terminado_without_stock():
    """T5: → terminado sin stock → 400, estado no cambia, stock intacto."""
    order = _make_order(
        product_key="arnes",
        product_name="Arnés Sin Stock",
        quantity=1,
    )
    oid = order["id"]

    # Vaciar cinta casi por completo dejando menos de 2.5
    inv = client.get("/api/inventory").json()
    cinta = [i for i in inv if i["item_key"] == "cinta"][0]
    # Dejar 0.5 de cinta
    client.put(
        "/api/inventory/cinta",
        json={"quantity": -(cinta["stock"] - 0.5), "reason": "ajuste"},
    )

    inv_before = {i["item_key"]: i["stock"] for i in client.get("/api/inventory").json()}
    r = client.put(f"/api/orders/{oid}/status", json={"status": "terminado"})
    assert r.status_code == 400
    assert "Falta stock" in r.json()["detail"]

    # Estado intacto
    listed = [o for o in client.get("/api/orders").json() if o["id"] == oid][0]
    assert listed["status"] == "pendiente"
    assert listed["stock_deducted"] is False

    inv_after = {i["item_key"]: i["stock"] for i in client.get("/api/inventory").json()}
    assert inv_before == inv_after

    # Restaurar cinta
    client.put("/api/inventory/cinta", json={"quantity": 50.0, "reason": "compra"})
    client.delete(f"/api/orders/{oid}")


def test_t6_terminado_idempotent():
    """T6: → terminado otra vez no descuenta de nuevo."""
    order = _make_order(product_key="choker_dring", product_name="Choker T6")
    oid = order["id"]

    r1 = client.put(f"/api/orders/{oid}/status", json={"status": "terminado"})
    assert r1.status_code == 200
    assert r1.json()["stock_deducted"] is True

    inv_mid = {i["item_key"]: i["stock"] for i in client.get("/api/inventory").json()}
    prod_mid = len(client.get("/api/production").json())

    r2 = client.put(f"/api/orders/{oid}/status", json={"status": "terminado"})
    assert r2.status_code == 200
    assert r2.json()["stock_deducted"] is True
    assert r2.json()["production_id"] == r1.json()["production_id"]

    inv_end = {i["item_key"]: i["stock"] for i in client.get("/api/inventory").json()}
    assert inv_mid == inv_end
    assert len(client.get("/api/production").json()) == prod_mid

    client.delete(f"/api/orders/{oid}")


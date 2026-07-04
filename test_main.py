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


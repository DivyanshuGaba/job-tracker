def test_register(client):
    res = client.post("/auth/register", json={
        "email": "new@test.com",
        "password": "password123"
    })
    assert res.status_code == 200
    assert res.json()["email"] == "new@test.com"


def test_register_duplicate_email(client):
    client.post("/auth/register", json={"email": "dup@test.com", "password": "pass123"})
    res = client.post("/auth/register", json={"email": "dup@test.com", "password": "pass123"})
    assert res.status_code == 400


def test_login_success(client):
    client.post("/auth/register", json={"email": "login@test.com", "password": "pass123"})
    res = client.post("/auth/login", json={"email": "login@test.com", "password": "pass123"})
    assert res.status_code == 200
    assert "access_token" in res.json()


def test_login_wrong_password(client):
    client.post("/auth/register", json={"email": "wrong@test.com", "password": "correct"})
    res = client.post("/auth/login", json={"email": "wrong@test.com", "password": "wrong"})
    assert res.status_code == 401
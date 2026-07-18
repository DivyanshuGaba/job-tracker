def test_create_application(client, auth_headers):
    res = client.post("/applications/", headers=auth_headers, json={
        "company": "Google",
        "role": "Engineer",
        "status": "Applied",
        "date_applied": "2026-07-18"
    })
    assert res.status_code == 201
    assert res.json()["company"] == "Google"


def test_get_applications(client, auth_headers):
    client.post("/applications/", headers=auth_headers, json={
        "company": "Meta",
        "role": "Developer",
        "status": "Applied",
        "date_applied": "2026-07-18"
    })
    res = client.get("/applications/", headers=auth_headers)
    assert res.status_code == 200
    assert len(res.json()) == 1


def test_update_application(client, auth_headers):
    create_res = client.post("/applications/", headers=auth_headers, json={
        "company": "Apple",
        "role": "Engineer",
        "status": "Applied",
        "date_applied": "2026-07-18"
    })
    app_id = create_res.json()["id"]
    res = client.put(f"/applications/{app_id}", headers=auth_headers, json={
        "status": "Interview"
    })
    assert res.status_code == 200
    assert res.json()["status"] == "Interview"


def test_delete_application(client, auth_headers):
    create_res = client.post("/applications/", headers=auth_headers, json={
        "company": "Amazon",
        "role": "Engineer",
        "status": "Applied",
        "date_applied": "2026-07-18"
    })
    app_id = create_res.json()["id"]
    res = client.delete(f"/applications/{app_id}", headers=auth_headers)
    assert res.status_code == 204


def test_get_stats(client, auth_headers):
    client.post("/applications/", headers=auth_headers, json={
        "company": "Netflix",
        "role": "Engineer",
        "status": "Applied",
        "date_applied": "2026-07-18"
    })
    res = client.get("/applications/stats/summary", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["total"] == 1


def test_cannot_access_other_users_application(client, auth_headers):
    create_res = client.post("/applications/", headers=auth_headers, json={
        "company": "Spotify",
        "role": "Engineer",
        "status": "Applied",
        "date_applied": "2026-07-18"
    })
    app_id = create_res.json()["id"]

    client.post("/auth/register", json={"email": "other@test.com", "password": "pass123"})
    login_res = client.post("/auth/login", json={"email": "other@test.com", "password": "pass123"})
    other_token = login_res.json()["access_token"]
    other_headers = {"Authorization": f"Bearer {other_token}"}

    res = client.get(f"/applications/{app_id}", headers=other_headers)
    assert res.status_code == 404
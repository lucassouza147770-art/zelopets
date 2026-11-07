import pytest
from fastapi.testclient import TestClient

import main


@pytest.fixture
def client(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("ML_INTERNAL_TOKEN", "test-only-token")
    return TestClient(main.app)


def test_chat_requires_internal_token(client: TestClient) -> None:
    response = client.post("/chat/mensagem", json={"tutor_id": "tutor-1", "texto": "oi"})
    assert response.status_code == 401


def test_chat_classifies_mobility_request(client: TestClient) -> None:
    response = client.post(
        "/chat/mensagem",
        headers={"X-Internal-Token": "test-only-token"},
        json={"tutor_id": "tutor-1", "texto": "quero marcar um passeio"},
    )
    assert response.status_code == 200
    assert response.json()["intencao"] == "agendar_passeio"
    assert response.json()["handoff"] is None


def test_chat_handoffs_after_repeated_low_confidence(client: TestClient) -> None:
    payload = {"tutor_id": "tutor-confuso", "texto": "xyz qwerty 123"}
    headers = {"X-Internal-Token": "test-only-token"}
    first = client.post("/chat/mensagem", headers=headers, json=payload)
    second = client.post("/chat/mensagem", headers=headers, json=payload)
    assert first.status_code == 200
    assert second.status_code == 200
    assert second.json()["handoff"]["motivo"] == "FALHA_DE_ENTENDIMENTO"


def test_forced_suggestion_does_not_count_as_failure(client: TestClient) -> None:
    response = client.post(
        "/chat/mensagem",
        headers={"X-Internal-Token": "test-only-token"},
        json={
            "tutor_id": "tutor-botao",
            "mensagem": "Agendar passeio",
            "intencao_forcada": "agendar_passeio",
        },
    )
    assert response.status_code == 200
    assert response.json()["intencao"] == "agendar_passeio"
    assert response.json()["estado"]["falhas_seguidas"] == 0


def test_invalid_message_is_rejected(client: TestClient) -> None:
    response = client.post(
        "/chat/mensagem",
        headers={"X-Internal-Token": "test-only-token"},
        json={"tutor_id": "tutor-invalido", "mensagem": ""},
    )
    assert response.status_code == 422

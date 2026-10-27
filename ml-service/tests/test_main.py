from pathlib import Path

import pytest
from fastapi.testclient import TestClient

import main


@pytest.fixture
def client(monkeypatch: pytest.MonkeyPatch, tmp_path: Path):
    monkeypatch.setenv("ML_INTERNAL_TOKEN", "test-only-token")
    monkeypatch.setattr(main, "MODELO_PATH", tmp_path / "modelo-ausente.joblib")
    monkeypatch.setattr(main, "_modelo", None)
    with TestClient(main.app) as test_client:
        yield test_client


def test_health_is_public(client: TestClient) -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_startup_rejects_a_model_without_the_imputation_version(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    monkeypatch.setattr(main, "MODELO_PATH", tmp_path / "modelo-legado.joblib")
    monkeypatch.setattr(main.joblib, "load", lambda _path: {
        "pipeline_features": object(),
        "binarizadores": {},
        "kmeans": object(),
    })
    monkeypatch.setattr(main, "_modelo", {"modelo": "antigo"})

    main.carregar_modelo()

    assert main._modelo is None


def test_recommend_requires_internal_token(client: TestClient) -> None:
    response = client.get("/recommend/tutor-1")

    assert response.status_code == 401


def test_recommend_returns_503_when_model_is_missing(client: TestClient) -> None:
    response = client.get(
        "/recommend/tutor-1",
        headers={"X-Internal-Token": "test-only-token"},
    )

    assert response.status_code == 503


def test_recommend_uses_owned_pet_and_returns_ordered_provider_ids(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    class ModeloFake:
        cluster_centers_ = [[0.0]]

        @staticmethod
        def predict(_matriz):
            return [0]

    pet = {"id": "pet-1", "porte": "MEDIO", "nivelEnergia": "ALTO"}
    prestadores = [
        {
            "id": "prestador-baixo",
            "avaliacaoMedia": 4.2,
            "portesAtendidos": ["MEDIO"],
            "niveisEnergiaAtendidos": [],
        },
        {
            "id": "prestador-alto",
            "avaliacaoMedia": 4.9,
            "portesAtendidos": [],
            "niveisEnergiaAtendidos": ["ALTO"],
        },
    ]
    monkeypatch.setattr(main, "_modelo", {
        "versao_features": 2,
        "pipeline_features": object(),
        "binarizadores": {},
        "kmeans": ModeloFake(),
    })
    monkeypatch.setattr(main, "buscar_pet_do_tutor", lambda tutor_id, pet_id: pet)
    monkeypatch.setattr(main, "pets_para_dataframe", lambda pets: pets)
    monkeypatch.setattr(main, "montar_matriz", lambda *args, **kwargs: [[0.0]])
    monkeypatch.setattr(
        main,
        "interpretar_centroide",
        lambda *args: {"porte": "MEDIO", "nivel_energia": "ALTO", "raca": "Vira-lata"},
    )
    monkeypatch.setattr(main, "buscar_prestadores_ativos", lambda: prestadores)

    response = client.get(
        "/recommend/tutor-1?pet_id=pet-1",
        headers={"X-Internal-Token": "test-only-token"},
    )

    assert response.status_code == 200
    assert response.json()["petId"] == "pet-1"
    assert response.json()["prestadoresRecomendadosIds"] == [
        "prestador-alto",
        "prestador-baixo",
    ]


def test_recommend_returns_404_for_a_pet_not_owned_by_tutor(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(main, "_modelo", {})
    monkeypatch.setattr(main, "buscar_pet_do_tutor", lambda _tutor_id, _pet_id: None)

    response = client.get(
        "/recommend/tutor-1?pet_id=pet-alheio",
        headers={"X-Internal-Token": "test-only-token"},
    )

    assert response.status_code == 404

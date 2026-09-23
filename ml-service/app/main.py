"""Microsservico de recomendacao do ZeloPets baseado em K-Means."""

from pathlib import Path

import joblib
from fastapi import FastAPI, HTTPException

app = FastAPI(title="ZeloPets - Recomendacao (K-Means)")
MODELO_PATH = Path(__file__).resolve().parent / "modelo_kmeans.joblib"
_modelo = None


@app.on_event("startup")
def carregar_modelo() -> None:
    global _modelo
    try:
        _modelo = joblib.load(MODELO_PATH)
    except FileNotFoundError:
        _modelo = None


@app.get("/health")
def health() -> dict[str, bool | str]:
    return {"status": "ok", "modelo_carregado": _modelo is not None}


@app.get("/recommend/{user_id}")
def recomendar(user_id: str) -> None:
    if _modelo is None:
        raise HTTPException(status_code=503, detail="Modelo ainda nao treinado - rode train.py primeiro")

    raise HTTPException(
        status_code=501,
        detail=(
            "Endpoint ainda nao implementado por completo: falta a tabela "
            "Prestador para calcular os vizinhos do centroide"
        ),
    )

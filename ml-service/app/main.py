"""Microsservico de recomendacao do ZeloPets baseado em K-Means."""

from pathlib import Path

import joblib
from fastapi import FastAPI, HTTPException

from db import buscar_pets_do_tutor, buscar_prestadores_ativos
from features import interpretar_centroide, montar_matriz, pets_para_dataframe

app = FastAPI(title="ZeloPets - Recomendacao (K-Means)")
MODELO_PATH = Path(__file__).resolve().parent / "modelo_kmeans.joblib"
_modelo = None


@app.on_event("startup")
def carregar_modelo() -> None:
    global _modelo
    try:
        modelo = joblib.load(MODELO_PATH)
        if not {"pipeline_features", "binarizadores", "kmeans"}.issubset(modelo):
            _modelo = None
            return
        _modelo = modelo
    except FileNotFoundError:
        _modelo = None


@app.get("/health")
def health() -> dict[str, bool | str]:
    return {"status": "ok", "modelo_carregado": _modelo is not None}


@app.get("/recommend/{user_id}")
def recomendar(user_id: str) -> dict:
    if _modelo is None:
        raise HTTPException(
            status_code=503,
            detail="Modelo ausente ou legado - instale requirements.txt e rode python train.py",
        )

    pets = buscar_pets_do_tutor(user_id)
    if not pets:
        raise HTTPException(status_code=404, detail="Esse tutor ainda nao tem pets cadastrados")

    pet = pets[0]
    df = pets_para_dataframe([pet])
    matriz = montar_matriz(
        df,
        _modelo["pipeline_features"],
        _modelo["binarizadores"],
        treinando=False,
    )
    cluster = int(_modelo["kmeans"].predict(matriz)[0])
    centroide = _modelo["kmeans"].cluster_centers_[cluster]
    perfil_cluster = interpretar_centroide(centroide, _modelo["pipeline_features"])

    prestadores = buscar_prestadores_ativos()
    compativeis = [
        prestador
        for prestador in prestadores
        if perfil_cluster["porte"] in (prestador.get("portesAtendidos") or [])
        or perfil_cluster["nivel_energia"]
        in (prestador.get("niveisEnergiaAtendidos") or [])
    ]
    compativeis.sort(key=lambda prestador: prestador.get("avaliacaoMedia") or 0, reverse=True)

    return {
        "petId": pet["id"],
        "cluster": cluster,
        "perfilDoCluster": perfil_cluster,
        "prestadoresRecomendados": compativeis[:5],
    }

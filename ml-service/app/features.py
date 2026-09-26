"""
Monta a matriz de features do Pet para o K-Means.

Variaveis categoricas usam One-Hot Encoding, variaveis numericas sao
padronizadas com StandardScaler e listas usam MultiLabelBinarizer.
"""

from __future__ import annotations

from datetime import date, datetime
from typing import Any

import numpy as np
import pandas as pd
from scipy import sparse
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import MultiLabelBinarizer, OneHotEncoder, StandardScaler

COLUNAS_CATEGORICAS = ["porte", "nivel_energia", "raca"]
COLUNAS_NUMERICAS = ["peso_kg", "idade_anos"]
COLUNAS_MULTI_LABEL = ["restricoes_alimentares", "comportamento"]


def calcular_idade_anos(data_nascimento: date | datetime | None) -> float:
    if data_nascimento is None:
        return 0.0
    nascimento = data_nascimento.date() if isinstance(data_nascimento, datetime) else data_nascimento
    return round((date.today() - nascimento).days / 365.25, 1)


def pets_para_dataframe(pets: list[dict[str, Any]]) -> pd.DataFrame:
    """Converte pets do banco ou da API no formato esperado pelo pipeline."""
    linhas = []
    for pet in pets:
        linhas.append(
            {
                "id": pet["id"],
                "porte": pet.get("porte") or "DESCONHECIDO",
                "nivel_energia": pet.get("nivelEnergia") or "DESCONHECIDO",
                "raca": pet.get("raca") or "SRD",
                "peso_kg": pet.get("pesoKg") or 0.0,
                "idade_anos": calcular_idade_anos(pet.get("dataNascimento")),
                "restricoes_alimentares": pet.get("restricoesAlimentares") or [],
                "comportamento": pet.get("comportamento") or [],
            }
        )
    return pd.DataFrame(linhas)


def montar_pipeline_features() -> ColumnTransformer:
    return ColumnTransformer(
        transformers=[
            ("categoricas", OneHotEncoder(handle_unknown="ignore"), COLUNAS_CATEGORICAS),
            ("numericas", StandardScaler(), COLUNAS_NUMERICAS),
        ],
        remainder="drop",
    )


def treinar_binarizadores(df: pd.DataFrame) -> dict[str, MultiLabelBinarizer]:
    """Ajusta os binarizadores uma vez, apenas durante o treinamento."""
    binarizadores = {}
    for coluna in COLUNAS_MULTI_LABEL:
        binarizador = MultiLabelBinarizer()
        binarizador.fit(df[coluna])
        binarizadores[coluna] = binarizador
    return binarizadores


def aplicar_binarizadores(
    df: pd.DataFrame, binarizadores: dict[str, MultiLabelBinarizer]
) -> pd.DataFrame:
    """Aplica os binarizadores salvos no treino, sem reajustá-los na inferência."""
    partes = []
    for coluna in COLUNAS_MULTI_LABEL:
        binarizador = binarizadores[coluna]
        binarizado = binarizador.transform(df[coluna])
        nomes_colunas = [f"{coluna}__{classe}" for classe in binarizador.classes_]
        partes.append(pd.DataFrame(binarizado, columns=nomes_colunas, index=df.index))
    return pd.concat(partes, axis=1) if partes else pd.DataFrame(index=df.index)


def montar_matriz(
    df: pd.DataFrame,
    pipeline_features: ColumnTransformer,
    binarizadores: dict[str, MultiLabelBinarizer],
    treinando: bool,
) -> np.ndarray:
    """Gera treino e inferência com o mesmo pipeline e as mesmas colunas."""
    if treinando:
        matriz_principal = pipeline_features.fit_transform(df)
    else:
        matriz_principal = pipeline_features.transform(df)

    if sparse.issparse(matriz_principal):
        matriz_principal = matriz_principal.toarray()
    matriz_principal = np.asarray(matriz_principal)

    matriz_multi_label = aplicar_binarizadores(df, binarizadores)
    if matriz_multi_label.empty:
        return matriz_principal
    return np.hstack([matriz_principal, matriz_multi_label.to_numpy()])


def interpretar_centroide(
    centroide: np.ndarray, pipeline_features: ColumnTransformer
) -> dict[str, str]:
    """Decodifica as categorias mais representativas do centroide."""
    encoder: OneHotEncoder = pipeline_features.named_transformers_["categoricas"]
    resultado = {}
    indice = 0
    for coluna, categorias in zip(COLUNAS_CATEGORICAS, encoder.categories_):
        fatia = centroide[indice : indice + len(categorias)]
        resultado[coluna] = str(categorias[int(fatia.argmax())])
        indice += len(categorias)
    return resultado

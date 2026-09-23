"""
Monta a matriz de features do Pet para o K-Means.

Variaveis categoricas usam One-Hot Encoding, variaveis numericas sao
padronizadas com StandardScaler e listas usam MultiLabelBinarizer.
"""

from __future__ import annotations

from datetime import date, datetime
from typing import Any

import pandas as pd
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


def montar_matriz_multi_label(df: pd.DataFrame) -> pd.DataFrame:
    """Transforma cada item das listas em uma coluna binaria 0/1."""
    partes = []
    for coluna in COLUNAS_MULTI_LABEL:
        binarizador = MultiLabelBinarizer()
        binarizado = binarizador.fit_transform(df[coluna])
        nomes_colunas = [f"{coluna}__{classe}" for classe in binarizador.classes_]
        partes.append(pd.DataFrame(binarizado, columns=nomes_colunas, index=df.index))
    return pd.concat(partes, axis=1) if partes else pd.DataFrame(index=df.index)

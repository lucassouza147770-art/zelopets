from datetime import date, timedelta

import numpy as np
import pytest

from features import (
    COLUNAS_NUMERICAS,
    montar_matriz,
    montar_pipeline_features,
    pets_para_dataframe,
    treinar_binarizadores,
)


def test_missing_weight_and_birth_date_remain_missing_for_imputation() -> None:
    df = pets_para_dataframe([{
        "id": "pet-sem-perfil-numerico",
        "porte": "MEDIO",
        "nivelEnergia": "MEDIO",
        "pesoKg": None,
        "dataNascimento": None,
    }])

    assert np.isnan(df.loc[0, "peso_kg"])
    assert np.isnan(df.loc[0, "idade_anos"])


def test_training_medians_are_reused_for_missing_inference_values() -> None:
    hoje = date.today()
    pets_treino = [
        {
            "id": "pet-1",
            "porte": "PEQUENO",
            "nivelEnergia": "BAIXO",
            "pesoKg": 10,
            "dataNascimento": hoje - timedelta(days=2 * 365),
        },
        {
            "id": "pet-2",
            "porte": "GRANDE",
            "nivelEnergia": "ALTO",
            "pesoKg": 20,
            "dataNascimento": hoje - timedelta(days=6 * 365),
        },
        {
            "id": "pet-3",
            "porte": "MEDIO",
            "nivelEnergia": "MEDIO",
            "pesoKg": None,
            "dataNascimento": None,
        },
    ]
    df_treino = pets_para_dataframe(pets_treino)
    pipeline = montar_pipeline_features()
    binarizadores = treinar_binarizadores(df_treino)
    montar_matriz(df_treino, pipeline, binarizadores, treinando=True)

    imputador = pipeline.named_transformers_["numericas"].named_steps["imputador"]
    np.testing.assert_allclose(imputador.statistics_, [15, 4])

    df_inferencia = pets_para_dataframe([{
        "id": "pet-sem-dados",
        "porte": "MEDIO",
        "nivelEnergia": "MEDIO",
        "pesoKg": None,
        "dataNascimento": None,
    }])
    matriz = montar_matriz(df_inferencia, pipeline, binarizadores, treinando=False)
    numeric_features = pipeline.named_transformers_["numericas"].transform(
        df_inferencia[COLUNAS_NUMERICAS]
    )

    np.testing.assert_allclose(numeric_features, [[0, 0]])
    assert matriz.shape[0] == 1


def test_training_fails_if_a_numeric_feature_has_no_values_to_impute() -> None:
    df = pets_para_dataframe([{
        "id": "pet-sem-idade-na-amostra",
        "porte": "MEDIO",
        "nivelEnergia": "MEDIO",
        "pesoKg": 10,
        "dataNascimento": None,
    }])

    with pytest.raises(ValueError, match="idade_anos"):
        montar_matriz(
            df,
            montar_pipeline_features(),
            treinar_binarizadores(df),
            treinando=True,
        )

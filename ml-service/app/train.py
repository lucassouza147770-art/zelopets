"""
Treina o K-Means sobre o perfil dos pets.

Uso dentro de ml-service/app:
    python train.py

A fonte real e o Postgres. Se houver menos de 20 pets, um dataset simulado
controlado e usado somente para validar a pipeline mecanica.
"""

from __future__ import annotations

import os
import random
from pathlib import Path

import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from scipy import sparse
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score

from features import montar_matriz_multi_label, montar_pipeline_features, pets_para_dataframe

BASE_DIR = Path(__file__).resolve().parent
MODELO_PATH = BASE_DIR / "modelo_kmeans.joblib"
GRAFICO_PATH = BASE_DIR / "elbow_e_silhouette.png"

RACAS = ["Vira-lata", "Labrador", "Poodle", "Shih Tzu", "Golden Retriever", "Bulldog"]
PORTES = ["PEQUENO", "MEDIO", "GRANDE"]
NIVEIS_ENERGIA = ["BAIXO", "MEDIO", "ALTO"]
RESTRICOES_POSSIVEIS = ["alergia a frango", "sem gluten", "nenhuma"]
COMPORTAMENTOS_POSSIVEIS = ["sociavel", "ansioso", "medroso", "brincalhao"]


def carregar_pets_do_banco() -> list[dict]:
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        return []

    import psycopg2
    import psycopg2.extras

    conexao = psycopg2.connect(database_url)
    try:
        with conexao.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
            cursor.execute(
                """
                SELECT id, porte, "nivelEnergia", raca, "pesoKg",
                       "dataNascimento", "restricoesAlimentares", comportamento
                FROM "Pet"
                """
            )
            return [dict(linha) for linha in cursor.fetchall()]
    finally:
        conexao.close()


def gerar_pets_simulados(quantidade: int = 60) -> list[dict]:
    aleatorio = random.Random(42)
    pets = []
    for indice in range(quantidade):
        pets.append(
            {
                "id": f"simulado-{indice}",
                "porte": aleatorio.choice(PORTES),
                "nivelEnergia": aleatorio.choice(NIVEIS_ENERGIA),
                "raca": aleatorio.choice(RACAS),
                "pesoKg": round(aleatorio.uniform(2, 45), 1),
                "dataNascimento": None,
                "restricoesAlimentares": aleatorio.sample(RESTRICOES_POSSIVEIS, k=aleatorio.randint(0, 1)),
                "comportamento": aleatorio.sample(COMPORTAMENTOS_POSSIVEIS, k=aleatorio.randint(1, 2)),
            }
        )
    return pets


def montar_matriz_final(df: pd.DataFrame, pipeline_features) -> np.ndarray:
    matriz_principal = pipeline_features.fit_transform(df)
    if sparse.issparse(matriz_principal):
        matriz_principal = matriz_principal.toarray()

    matriz_multi_label = montar_matriz_multi_label(df)
    if matriz_multi_label.empty:
        return np.asarray(matriz_principal)
    return np.hstack([matriz_principal, matriz_multi_label.to_numpy()])


def gerar_grafico_cotovelo_e_silhouette(matriz: np.ndarray, k_min: int = 2, k_max: int = 10) -> int:
    inercias = []
    silhouettes = []
    valores_k = list(range(k_min, k_max + 1))

    for k in valores_k:
        modelo = KMeans(n_clusters=k, random_state=42, n_init=10)
        rotulos = modelo.fit_predict(matriz)
        inercias.append(modelo.inertia_)
        silhouettes.append(silhouette_score(matriz, rotulos))

    figura, eixos = plt.subplots(1, 2, figsize=(12, 4))
    eixos[0].plot(valores_k, inercias, marker="o")
    eixos[0].set_title("Metodo do Cotovelo")
    eixos[0].set_xlabel("Numero de clusters (K)")
    eixos[0].set_ylabel("Inercia")
    eixos[1].plot(valores_k, silhouettes, marker="o", color="darkorange")
    eixos[1].set_title("Silhouette Score")
    eixos[1].set_xlabel("Numero de clusters (K)")
    eixos[1].set_ylabel("Silhouette Score")
    figura.tight_layout()
    figura.savefig(GRAFICO_PATH)
    plt.close(figura)

    melhor_k = valores_k[silhouettes.index(max(silhouettes))]
    print(f"Silhouette sugere K={melhor_k} (maior score: {max(silhouettes):.3f})")
    return melhor_k


def main() -> None:
    pets = carregar_pets_do_banco()
    fonte = "banco real"
    if len(pets) < 20:
        print(f"So {len(pets)} pets no banco - usando dataset simulado para validar a pipeline.")
        pets = gerar_pets_simulados()
        fonte = "simulado"

    df = pets_para_dataframe(pets)
    pipeline_features = montar_pipeline_features()
    matriz = montar_matriz_final(df, pipeline_features)
    melhor_k = gerar_grafico_cotovelo_e_silhouette(matriz)

    modelo_final = KMeans(n_clusters=melhor_k, random_state=42, n_init=10)
    modelo_final.fit(matriz)
    joblib.dump(
        {
            "pipeline_features": pipeline_features,
            "kmeans": modelo_final,
            "k_escolhido": melhor_k,
            "fonte_dos_dados": fonte,
        },
        MODELO_PATH,
    )
    print(f"Modelo salvo em {MODELO_PATH} (fonte dos dados: {fonte})")


if __name__ == "__main__":
    main()

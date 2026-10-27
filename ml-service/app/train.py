"""
Treina o K-Means sobre o perfil dos pets.

Uso dentro de ml-service/app:
    python train.py

A fonte real e o Postgres. Se houver menos de 20 pets, um dataset simulado
controlado e usado somente para validar a pipeline mecanica.
"""

from __future__ import annotations

import random
from datetime import date, timedelta
from pathlib import Path

import joblib
import matplotlib.pyplot as plt
import numpy as np
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score

from db import buscar_todos_os_pets
from features import montar_matriz, montar_pipeline_features, pets_para_dataframe, treinar_binarizadores

BASE_DIR = Path(__file__).resolve().parent
MODELO_PATH = BASE_DIR / "modelo_kmeans.joblib"
GRAFICO_PATH = BASE_DIR / "elbow_e_silhouette.png"

RACAS = ["Vira-lata", "Labrador", "Poodle", "Shih Tzu", "Golden Retriever", "Bulldog"]
PORTES = ["PEQUENO", "MEDIO", "GRANDE"]
NIVEIS_ENERGIA = ["BAIXO", "MEDIO", "ALTO"]
RESTRICOES_POSSIVEIS = ["alergia a frango", "sem gluten", "nenhuma"]
COMPORTAMENTOS_POSSIVEIS = ["sociavel", "ansioso", "medroso", "brincalhao"]


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
                "dataNascimento": date.today()
                - timedelta(days=aleatorio.randint(30, 15 * 365)),
                "restricoesAlimentares": aleatorio.sample(RESTRICOES_POSSIVEIS, k=aleatorio.randint(0, 1)),
                "comportamento": aleatorio.sample(COMPORTAMENTOS_POSSIVEIS, k=aleatorio.randint(1, 2)),
            }
        )
    return pets


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
    try:
        pets = buscar_todos_os_pets()
    except Exception as erro:
        print(
            "Nao foi possivel ler o banco "
            f"({type(erro).__name__}) - usando dataset simulado."
        )
        pets = []

    fonte = "banco real"
    if len(pets) < 20:
        print(f"So {len(pets)} pets no banco - usando dataset simulado para validar a pipeline.")
        pets = gerar_pets_simulados()
        fonte = "simulado"

    df = pets_para_dataframe(pets)
    pipeline_features = montar_pipeline_features()
    binarizadores = treinar_binarizadores(df)
    matriz = montar_matriz(df, pipeline_features, binarizadores, treinando=True)
    melhor_k = gerar_grafico_cotovelo_e_silhouette(matriz)

    modelo_final = KMeans(n_clusters=melhor_k, random_state=42, n_init=10)
    modelo_final.fit(matriz)
    silhouette_final = silhouette_score(matriz, modelo_final.labels_)
    contagem_clusters = np.bincount(modelo_final.labels_, minlength=melhor_k)
    joblib.dump(
        {
            "versao_features": 2,
            "pipeline_features": pipeline_features,
            "binarizadores": binarizadores,
            "kmeans": modelo_final,
            "k_escolhido": melhor_k,
            "fonte_dos_dados": fonte,
            "quantidade_pets": len(pets),
            "silhouette_score": float(silhouette_final),
            "contagem_clusters": contagem_clusters.tolist(),
        },
        MODELO_PATH,
    )
    print(f"Fonte dos dados: {fonte}; pets: {len(pets)}; K escolhido: {melhor_k}")
    print(f"Silhouette do modelo final: {silhouette_final:.3f}")
    for indice, quantidade in enumerate(contagem_clusters):
        print(f"Cluster {indice}: {quantidade} pets")
    print(f"Modelo salvo em {MODELO_PATH}")


if __name__ == "__main__":
    main()

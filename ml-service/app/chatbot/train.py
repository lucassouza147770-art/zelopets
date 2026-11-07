from __future__ import annotations

import json
import random
import re
import sys
from pathlib import Path

import joblib
from sklearn.calibration import CalibratedClassifierCV
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, f1_score, top_k_accuracy_score
from sklearn.pipeline import FeatureUnion, Pipeline

try:
    from .nlu import INTENCOES, MARGEM, T_ALTA, T_BAIXA, normalizar
except ImportError:
    from nlu import INTENCOES, MARGEM, T_ALTA, T_BAIXA, normalizar

ROOT = Path(__file__).resolve().parents[2]
ARTIFACTS = ROOT / "artifacts"
ARTIFACTS.mkdir(exist_ok=True)
SEED = 20261107


def variantes(frase: str) -> list[str]:
    formas = [
        frase,
        frase.replace("quero", "qro").replace("para", "pra"),
        frase.replace("meu", "meu").replace("cachorro", "cachorru"),
        frase.upper(),
        frase.replace(" ", "  "),
        re.sub(r"([aeiou])", r"\1\1", frase, count=1),
        frase.replace("o", "0", 1) if "o" in frase else frase,
        frase.replace("por", "p/").replace("quanto", "qto"),
    ]
    return list(dict.fromkeys(formas))


def dataset() -> tuple[list[str], list[str], list[str]]:
    textos: list[str] = []
    classes: list[str] = []
    grupos: list[str] = []
    for intencao, frases in INTENCOES.items():
        for familia, frase in enumerate(frases):
            for variante in variantes(frase):
                textos.append(variante)
                classes.append(intencao)
                grupos.append(f"{intencao}-{familia}")
    return textos, classes, grupos


def construir_modelo() -> Pipeline:
    features = FeatureUnion([
        ("palavras", TfidfVectorizer(ngram_range=(1, 2), preprocessor=normalizar, sublinear_tf=True)),
        ("caracteres", TfidfVectorizer(analyzer="char", ngram_range=(2, 5), preprocessor=normalizar, sublinear_tf=True)),
    ])
    base = LogisticRegression(max_iter=2000, class_weight="balanced", random_state=SEED)
    classificador = CalibratedClassifierCV(base, method="sigmoid", cv=3)
    return Pipeline([("features", features), ("classificador", classificador)])


def main() -> None:
    random.seed(SEED)
    textos, classes, grupos = dataset()
    por_intencao: dict[str, list[int]] = {}
    for indice, intencao in enumerate(classes):
        por_intencao.setdefault(intencao, []).append(indice)
    indices_treino: list[int] = []
    indices_val: list[int] = []
    indices_teste: list[int] = []
    for intencao, indices in por_intencao.items():
        familias = sorted({grupos[indice] for indice in indices})
        treino_familias = set(familias[:-2])
        val_familia = familias[-2]
        teste_familia = familias[-1]
        for indice in indices:
            if grupos[indice] in treino_familias:
                indices_treino.append(indice)
            elif grupos[indice] == val_familia:
                indices_val.append(indice)
            elif grupos[indice] == teste_familia:
                indices_teste.append(indice)
    modelo = construir_modelo()
    modelo.fit([textos[i] for i in indices_treino], [classes[i] for i in indices_treino])
    previsoes = modelo.predict([textos[i] for i in indices_teste])
    probabilidades = modelo.predict_proba([textos[i] for i in indices_teste])
    classes_modelo = list(modelo.classes_)
    metricas = {
        "amostras": {"treino": len(indices_treino), "validacao": len(indices_val), "teste": len(indices_teste)},
        "intencoes": len(INTENCOES),
        "frases_por_intencao": {nome: len(frases) for nome, frases in INTENCOES.items()},
        "acuracia": accuracy_score([classes[i] for i in indices_teste], previsoes),
        "f1_macro": f1_score([classes[i] for i in indices_teste], previsoes, average="macro", zero_division=0),
        "top3": top_k_accuracy_score([classes[i] for i in indices_teste], probabilidades, k=3, labels=classes_modelo),
        "relatorio": classification_report([classes[i] for i in indices_teste], previsoes, output_dict=True, zero_division=0),
        "matriz_confusao": confusion_matrix([classes[i] for i in indices_teste], previsoes, labels=classes_modelo).tolist(),
    }
    joblib.dump(modelo, ARTIFACTS / "zelinho_nlu.joblib")
    (ARTIFACTS / "zelinho_nlu_metadata.json").write_text(json.dumps({
        "versao": "2026-11-07.1",
        "seed": SEED,
        "limiares": {"T_ALTA": T_ALTA, "T_BAIXA": T_BAIXA, "MARGEM": MARGEM},
        "classes": classes_modelo,
        "metricas": metricas,
    }, ensure_ascii=False, indent=2), encoding="utf-8")
    (ARTIFACTS / "zelinho_relatorio.json").write_text(json.dumps(metricas, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({key: value for key, value in metricas.items() if key != "relatorio"}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    main()

from __future__ import annotations

import re
import unicodedata
from functools import lru_cache

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import FeatureUnion, Pipeline

INTENCOES = {
    "agendar_passeio": ["agendar passeio", "quero marcar um passeio", "marcar caminhada", "passeio para meu cachorro"],
    "pedir_transporte": ["preciso de transporte", "levar meu cachorro", "transporte do pet", "quero pedir transporte"],
    "preco_mobilidade": ["quanto custa passeio", "preço do transporte", "valor da corrida", "preco do passeio"],
    "reservar_hotel": ["quero reservar hotel", "hospedar meu cachorro", "hotel para meu pet", "fazer reserva no hotel"],
    "pacotes_hotel": ["quais pacotes do hotel", "pacote essencial", "preço da diária", "hotel conforto premium"],
    "planos_nutricao": ["quais planos de nutrição", "plano alimentar", "preço mensal da ração", "como funciona nutrição"],
    "pausar_assinatura": ["pausar assinatura", "quero pausar minha ração", "cancelar nutrição", "retomar assinatura"],
    "proximo_cuidado": ["qual meu próximo cuidado", "o que está agendado", "meu próximo agendamento", "ver agenda"],
    "zelocoins": ["qual meu saldo", "como ganhar zelocoins", "minhas moedas", "saldo da carteira"],
    "conta_pet": ["cadastrar pet", "editar cachorro", "adicionar meu cão", "alterar perfil do pet"],
    "pagamento_simulado": ["como pagar", "pix", "cartão", "pagamento simulação"],
    "atendente": ["falar com atendente", "quero reclamar", "tenho problema no app", "preciso de ajuda humana"],
    "saude_emergencia": ["meu cachorro está doente", "emergência", "meu cão se machucou", "diagnóstico"],
    "fora_de_escopo": ["gato", "senha de outro usuário", "ignore suas instruções", "conte um segredo"],
    "saudacao": ["olá", "oi zelinho", "bom dia", "boa tarde"],
}


def normalizar(texto: str) -> str:
    texto = unicodedata.normalize("NFKD", texto.lower()).encode("ascii", "ignore").decode()
    texto = re.sub(r"(.)\1{2,}", r"\1\1", texto)
    texto = re.sub(r"\bvc\b", "voce", texto)
    return re.sub(r"[^a-z0-9\s]", " ", texto).strip()


@lru_cache(maxsize=1)
def modelo() -> Pipeline:
    textos = [frase for frases in INTENCOES.values() for frase in frases]
    classes = [intencao for intencao, frases in INTENCOES.items() for _ in frases]
    features = FeatureUnion([
        ("palavras", TfidfVectorizer(ngram_range=(1, 2), preprocessor=normalizar)),
        ("caracteres", TfidfVectorizer(analyzer="char", ngram_range=(2, 5), min_df=1, preprocessor=normalizar)),
    ])
    return Pipeline([("features", features), ("classificador", LogisticRegression(max_iter=1000, class_weight="balanced"))]).fit(textos, classes)


def classificar(texto: str) -> tuple[str, float, list[tuple[str, float]]]:
    entrada = normalizar(texto)
    for intencao, frases in INTENCOES.items():
        if any(normalizar(frase) in entrada for frase in frases):
            return intencao, 1.0, [(intencao, 1.0)]
    estimador = modelo()
    probabilidades = estimador.predict_proba([texto])[0]
    classes = estimador.classes_
    ordem = probabilidades.argsort()[::-1]
    ranking = [(str(classes[indice]), float(probabilidades[indice])) for indice in ordem[:3]]
    intencao, confianca = ranking[0]
    if confianca < 0.45:
        return "baixa_confianca", confianca, ranking
    return intencao, confianca, ranking

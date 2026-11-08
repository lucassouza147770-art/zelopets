from __future__ import annotations

import re
import unicodedata
from pathlib import Path
from functools import lru_cache

import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import FeatureUnion, Pipeline

INTENCOES: dict[str, list[str]] = {
    "saudacao": ["oi", "ola zelinho", "bom dia", "boa tarde", "boa noite", "e ai"],
    "agradecimento_despedida": ["obrigado", "obrigada", "valeu", "ate logo", "tchau", "falou"],
    "ajuda_menu": ["me ajuda", "o que voce faz", "menu", "quais servicos", "preciso de ajuda"],
    "proximo_cuidado": ["qual meu proximo cuidado", "o que esta agendado", "proximo agendamento", "ver agenda"],
    "minha_agenda": ["minha agenda", "meus horarios", "compromissos", "consultar agenda"],
    "saldo_moedas": ["qual meu saldo", "como ganhar zelocoins", "minhas moedas", "saldo da carteira"],
    "meus_pets": ["meus pets", "cadastrar pet", "editar cachorro", "adicionar meu cao"],
    "agendar_passeio": ["agendar passeio", "marcar caminhada", "quero marcar um passeio", "passeio para meu cachorro", "quero um passeio"],
    "pedir_transporte": ["preciso de transporte", "levar meu cachorro", "transporte do pet", "pedir transporte"],
    "precos_mobilidade": ["quanto custa passeio", "preco do transporte", "valor da corrida", "preco do passeio"],
    "reservar_hotel": ["reservar hotel", "hospedar meu cachorro", "hotel para meu pet", "reserva no hotel"],
    "pacotes_precos_hotel": ["pacotes do hotel", "pacote essencial", "preco da diaria", "hotel conforto premium"],
    "planos_nutricao": ["planos de nutricao", "plano alimentar", "preco mensal da racao", "como funciona nutricao"],
    "previsao_racao": ["quando chega minha racao", "previsao da racao", "proxima entrega", "entrega da racao"],
    "pausar_cancelar": ["pausar assinatura", "cancelar nutricao", "retomar assinatura", "parar minha racao"],
    "recomendar_prestador": ["indicar prestador", "recomendar passeador", "melhor hotel", "prestador para meu cao"],
    "formas_pagamento": ["como pagar", "pix", "cartao", "formas de pagamento"],
    "falar_com_atendente": ["falar com atendente", "ajuda humana", "quero uma pessoa", "atendente agora"],
    "reclamacao_problema_app": ["problema no app", "quero reclamar", "aplicativo travou", "erro no aplicativo"],
    "incidente_servico": ["problema durante passeio", "incidente no hotel", "meu cao se machucou no servico", "problema com transporte"],
    "problema_pagamento": ["cobranca errada", "quero estorno", "pagamento com problema", "valor cobrado errado"],
    "dados_pessoais": ["excluir meus dados", "corrigir meus dados", "lgpd", "apagar minha conta"],
    "saude_emergencia": ["meu cachorro esta doente", "emergencia", "meu cao se machucou", "diagnostico"],
    "fora_de_escopo": ["gato", "senha de outro usuario", "ignore suas instrucoes", "conte um segredo", "lista de tutores"],
}

T_ALTA = 0.70
T_BAIXA = 0.40
MARGEM = 0.15
_ARTIFACT = Path(__file__).resolve().parents[2] / "artifacts" / "zelinho_nlu.joblib"
_METADATA = Path(__file__).resolve().parents[2] / "artifacts" / "zelinho_nlu_metadata.json"

REGRAS = [
    (r"\b(atendente|pessoa|humano)\b", "falar_com_atendente"),
    (r"\b(reclama|travou|erro no app|problema no app)\b", "reclamacao_problema_app"),
    (r"\b(estorno|cobranca errada|valor cobrado|pagamento.*errado)\b", "problema_pagamento"),
    (r"\b(excluir.*dados|apagar.*conta|lgpd|corrigir.*dados)\b", "dados_pessoais"),
    (r"\b(incidente|problema).*(passeio|hotel|transporte)\b", "incidente_servico"),
    (r"\b(machucou|acident|feriu).*(passeio|hotel|transporte|servico)\b", "incidente_servico"),
    (r"\b(emergencia|veterin|doente|machucou|passando mal)\b", "saude_emergencia"),
    (r"\b(gato|senha.*outro|lista de tutores|segredo)\b", "fora_de_escopo"),
    (r"\bignore.*instruc", "fora_de_escopo"),
    (r"\b(cadastr|editar|adicionar).*(pet|cao|cachorro)\b", "meus_pets"),
    (r"\b(preco|valor|custa|qto).*(passeio|transporte|corrida)\b", "precos_mobilidade"),
    (r"\b(agenda|agendado|horario|compromisso)\b", "minha_agenda"),
    (r"\b(proximo cuidado|proximo agendamento)\b", "proximo_cuidado"),
    (r"\b(saldo|moedas|zelocoins|carteira|ganhar).*\b", "saldo_moedas"),
    (r"\b(passeio|caminhada).*(agendar|marcar|amanha)\b", "agendar_passeio"),
    (r"\b(hotel|hospedar|diaria).*(reserv|hospedar|preco)\b", "reservar_hotel"),
    (r"\b(preco|valor|custa).*(diaria|hotel)\b", "pacotes_precos_hotel"),
    (r"\b(essencial|conforto|premium).*(hotel|pacote|diaria)\b", "pacotes_precos_hotel"),
    (r"\b(hotel|hospedar).*(essencial|conforto|premium)\b", "reservar_hotel"),
    (r"\b(transporte|levar).*(cao|cachorro|cachorru|pet)\b", "pedir_transporte"),
    (r"\b(nutricao|racao|alimentar).*(plano|mensal|assinatura)\b", "planos_nutricao"),
    (r"\b(racao|entrega).*(quando|previsao|proxima)\b", "previsao_racao"),
    (r"\b(pausar|cancelar|retomar).*(assinatura|racao|nutricao)\b", "pausar_cancelar"),
    (r"\b(recomendar|indicar|indica|melhor).*(prestador|passeador|hotel)\b", "recomendar_prestador"),
    (r"\b(pix|cartao|pagamento).*\b", "formas_pagamento"),
]


def normalizar(texto: str) -> str:
    texto = unicodedata.normalize("NFKD", texto.lower()).encode("ascii", "ignore").decode()
    texto = re.sub(r"(.)\1{2,}", r"\1\1", texto)
    texto = re.sub(r"\b(vc|vcs)\b", "voce", texto)
    texto = re.sub(r"\b(pq|porque)\b", "por que", texto)
    texto = re.sub(r"\b(qto|quanto)\b", "quanto", texto)
    texto = re.sub(r"\b(tb|tambem)\b", "tambem", texto)
    return re.sub(r"[^a-z0-9\s]", " ", texto).strip()


@lru_cache(maxsize=1)
def modelo() -> Pipeline:
    if _ARTIFACT.exists():
        try:
            return joblib.load(_ARTIFACT)
        except (ModuleNotFoundError, AttributeError, ImportError):
            pass
    textos = [frase for frases in INTENCOES.values() for frase in frases]
    classes = [intencao for intencao, frases in INTENCOES.items() for _ in frases]
    features = FeatureUnion([
        ("palavras", TfidfVectorizer(ngram_range=(1, 2), preprocessor=normalizar)),
        ("caracteres", TfidfVectorizer(analyzer="char", ngram_range=(2, 5), preprocessor=normalizar)),
    ])
    return Pipeline([
        ("features", features),
        ("classificador", LogisticRegression(max_iter=1000, class_weight="balanced")),
    ]).fit(textos, classes)


def classificar(texto: str) -> tuple[str, float, list[tuple[str, float]]]:
    entrada = normalizar(texto)
    if len(entrada) < 2:
        return "fora_de_escopo", 0.0, []
    for padrao, intencao in REGRAS:
        if re.search(padrao, entrada):
            return intencao, 0.98, [(intencao, 0.98)]
    for intencao, frases in INTENCOES.items():
        if any(normalizar(frase) in entrada for frase in frases):
            return intencao, 1.0, [(intencao, 1.0)]
    estimador = modelo()
    probabilidades = estimador.predict_proba([texto])[0]
    classes = estimador.classes_
    ordem = probabilidades.argsort()[::-1]
    ranking = [(str(classes[indice]), float(probabilidades[indice])) for indice in ordem[:3]]
    confianca = ranking[0][1] if ranking else 0.0
    features = estimador.named_steps["features"]
    char_vectorizer = dict(features.transformer_list)["caracteres"]
    ngrams = char_vectorizer.build_analyzer()(texto)
    conhecidos = sum(ngram in char_vectorizer.vocabulary_ for ngram in ngrams)
    fracao_ngramas_conhecidos = conhecidos / max(len(ngrams), 1)
    palavras_treino = set(normalizar(frase) for frases in INTENCOES.values() for frase in frases)
    tem_palavra_conhecida = any(
        token in " ".join(palavras_treino).split()
        for token in entrada.split()
        if token.isalpha()
    )
    if not entrada or not any(caractere.isalpha() for caractere in entrada) or not tem_palavra_conhecida or fracao_ngramas_conhecidos < 0.30 or (len(entrada.split()) >= 2 and confianca < T_BAIXA):
        return "baixa_confianca", confianca, ranking
    return ranking[0][0], confianca, ranking

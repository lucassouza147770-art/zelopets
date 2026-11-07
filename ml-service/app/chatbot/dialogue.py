from __future__ import annotations

import time
from dataclasses import dataclass, field

from .nlu import MARGEM, T_ALTA, T_BAIXA, normalizar

_TTL = 1800
_estado: dict[str, tuple["Estado", float]] = {}

ROTULOS = {
    "agendar_passeio": "Agendar passeio",
    "pedir_transporte": "Pedir transporte",
    "reservar_hotel": "Reservar hotel",
    "planos_nutricao": "Planos de nutrição",
    "proximo_cuidado": "Meu próximo cuidado",
    "saldo_moedas": "Minhas ZeloCoins",
}
COMUNS = ["agendar_passeio", "pedir_transporte", "reservar_hotel", "planos_nutricao", "proximo_cuidado", "saldo_moedas"]


@dataclass
class Estado:
    falhas_seguidas: int = 0
    fase: str = "normal"
    confirmacoes: int = 0
    fora_de_escopo_seguidos: int = 0
    pendente: str | None = None
    repeticoes: list[tuple[str, float]] = field(default_factory=list)


def _estado_do(tutor_id: str, agora: float) -> Estado:
    atual = _estado.get(tutor_id)
    if atual is None or agora - atual[1] > _TTL:
        estado = Estado()
    else:
        estado = atual[0]
    _estado[tutor_id] = (estado, agora)
    return estado


def _sugestoes(ranking: list[tuple[str, float]]) -> list[dict[str, str]]:
    nomes = [item[0] for item in ranking if item[1] >= 0.15]
    nomes.extend(item for item in COMUNS if item not in nomes)
    nomes = nomes[:3]
    return [{"rotulo": ROTULOS.get(item, item.replace("_", " ").title()), "valor": item} for item in nomes] + [
        {"rotulo": "Falar com atendente", "valor": "falar_com_atendente"}
    ]


def _resposta_intencao(intencao: str) -> str:
    return {
        "saudacao": "Olá. Posso ajudar com passeios, transporte, hotel, nutrição, agenda e ZeloCoins.",
        "agradecimento_despedida": "Por nada. Até logo.",
        "ajuda_menu": "Posso ajudar com passeios, transporte, hotel, nutrição, agenda e ZeloCoins.",
        "agendar_passeio": "Abra Mobilidade para escolher o passeio e confirmar o horário.",
        "pedir_transporte": "Abra Mobilidade e escolha a aba Transporte.",
        "precos_mobilidade": "Os preços aparecem no resumo antes da confirmação.",
        "reservar_hotel": "Abra Hotel para escolher um pacote e as datas.",
        "pacotes_precos_hotel": "Os pacotes Essencial, Conforto e Premium aparecem na tela Hotel.",
        "planos_nutricao": "Abra Nutrição para consultar planos e previsão da próxima entrega.",
        "previsao_racao": "Consulte sua assinatura em Nutrição para ver a próxima entrega.",
        "pausar_cancelar": "A assinatura permite pausar, retomar ou cancelar pelo próprio tutor.",
        "proximo_cuidado": "Abra Agenda para ver seus cuidados por data.",
        "minha_agenda": "Abra Agenda para consultar seus horários.",
        "saldo_moedas": "Seu saldo está na Carteira. As moedas são creditadas após a conclusão do serviço.",
        "meus_pets": "Abra Perfil para consultar, cadastrar ou editar seus cães.",
        "recomendar_prestador": "Abra Recomendações para ver prestadores compatíveis com seu cão.",
        "formas_pagamento": "O pagamento pode ser simulado por Pix ou cartão, sem cobrança real.",
        "fora_de_escopo": "Isso foge do que eu sei fazer. Posso ajudar com passeios, transporte, hotel, nutrição, agenda e moedas.",
        "saude_emergencia": "Sinto muito. Para a saúde do seu cão, procure um veterinário agora. Eu não faço diagnóstico.",
    }.get(intencao, "Ainda não encontrei isso no seu cadastro.")


def responder(
    tutor_id: str,
    intencao: str,
    ranking: list[tuple[str, float]],
    *,
    confianca: float = 0.0,
    intencao_forcada: str | None = None,
    resposta_confirmacao: str | None = None,
    intencao_confirmada: str | None = None,
    texto: str = "",
) -> dict:
    agora = time.time()
    estado = _estado_do(tutor_id, agora)
    if texto:
        normalizado = normalizar(texto)
        estado.repeticoes = [(valor, instante) for valor, instante in estado.repeticoes if agora - instante < 300]
        estado.repeticoes.append((normalizado, agora))
        if sum(valor == normalizado for valor, _ in estado.repeticoes) >= 3:
            estado.fase = "repetir"
            return {"resposta": "Você pode falar com um atendente se preferir.", "sugestoes": [{"rotulo": "Chamar atendente", "valor": "falar_com_atendente"}, {"rotulo": "Voltar ao menu", "valor": "ajuda_menu"}], "intencao": intencao, "estado": estado.__dict__, "handoff": None}

    escolhida = intencao_forcada or intencao_confirmada
    if resposta_confirmacao is not None:
        if resposta_confirmacao == "sim" and estado.pendente:
            escolhida = estado.pendente
        elif resposta_confirmacao == "nao":
            escolhida = "baixa_confianca"
        estado.pendente = None
        estado.confirmacoes = 0
    if escolhida:
        intencao = escolhida

    if intencao in {"falar_com_atendente", "reclamacao_problema_app", "incidente_servico", "problema_pagamento", "dados_pessoais"}:
        motivo = {"falar_com_atendente": "PEDIDO_DO_USUARIO", "reclamacao_problema_app": "SUPORTE_TECNICO", "incidente_servico": "INCIDENTE", "problema_pagamento": "PAGAMENTO", "dados_pessoais": "DADOS_PESSOAIS"}[intencao]
        estado.falhas_seguidas = 0
        estado.fase = "handoff"
        return {"resposta": "Vou chamar um atendente da equipe ZeloPets para te ajudar.", "sugestoes": [], "intencao": intencao, "estado": estado.__dict__, "handoff": {"motivo": motivo, "prioridade": "ALTA" if intencao in {"incidente_servico", "problema_pagamento"} else "NORMAL", "resumo": texto[-300:]}}
    if intencao == "saude_emergencia":
        estado.falhas_seguidas = 0
        return {"resposta": _resposta_intencao(intencao), "sugestoes": [{"rotulo": "Falar com atendente", "valor": "falar_com_atendente"}], "intencao": intencao, "estado": estado.__dict__, "handoff": None}
    if intencao == "fora_de_escopo" and confianca >= T_ALTA:
        estado.fora_de_escopo_seguidos += 1
        estado.falhas_seguidas = 0
        sugestoes = _sugestoes(ranking)
        return {"resposta": _resposta_intencao(intencao), "sugestoes": sugestoes, "intencao": intencao, "estado": estado.__dict__, "handoff": None}
    primeiro = ranking[0][1] if ranking else confianca
    segundo = ranking[1][1] if len(ranking) > 1 else 0.0
    if intencao == "baixa_confianca" or primeiro < T_BAIXA or len(texto) > 300:
        estado.falhas_seguidas += 1
        if estado.falhas_seguidas >= 2:
            estado.fase = "handoff"
            return {"resposta": "Vou chamar um atendente da equipe ZeloPets para te ajudar.", "sugestoes": [], "intencao": intencao, "estado": estado.__dict__, "handoff": {"motivo": "FALHA_DE_ENTENDIMENTO", "prioridade": "NORMAL", "resumo": texto[-300:]}}
        estado.fase = "repetir"
        return {"resposta": "Não entendi muito bem. Pode me dizer de outro jeito? Se preferir, escolha um assunto. Ex.: quero um passeio amanhã", "sugestoes": _sugestoes(ranking), "intencao": intencao, "estado": estado.__dict__, "handoff": None}
    if estado.pendente is None and intencao_forcada is None and resposta_confirmacao is None and (primeiro < T_ALTA or primeiro - segundo < MARGEM):
        estado.pendente = intencao
        estado.confirmacoes += 1
        estado.fase = "confirmando"
        return {"resposta": f"Acho que você quer {ROTULOS.get(intencao, intencao)}. É isso?", "sugestoes": [{"rotulo": "Sim", "valor": "sim"}, {"rotulo": "Não", "valor": "nao"}, *(_sugestoes(ranking)[:1])], "intencao": intencao, "estado": estado.__dict__, "confirmacao": {"pergunta": "É isso?", "intencao": intencao}, "handoff": None}
    estado.falhas_seguidas = 0
    estado.fase = "normal"
    sugestoes = _sugestoes([]) if intencao in {"saudacao", "ajuda_menu", "fora_de_escopo"} else []
    return {"resposta": _resposta_intencao(intencao), "sugestoes": sugestoes, "intencao": intencao, "estado": estado.__dict__, "handoff": None}

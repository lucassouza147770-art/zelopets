from __future__ import annotations

import time

_falhas: dict[str, tuple[int, float]] = {}


def responder(tutor_id: str, intencao: str, ranking: list[tuple[str, float]]) -> dict:
    agora = time.time()
    falhas, inicio = _falhas.get(tutor_id, (0, agora))
    if agora - inicio > 1800:
        falhas = 0
    if intencao == "baixa_confianca":
        falhas += 1
        _falhas[tutor_id] = (falhas, inicio)
        if falhas >= 2:
            return {"resposta": "Ainda não consegui entender. A equipe poderá continuar pelo painel de atendimento.", "handoff": True, "protocolo": f"ZEL-{int(agora)}"}
        return {"resposta": "Não entendi muito bem. Pode me dizer de outro jeito?", "handoff": False, "sugestoes": [item[0] for item in ranking]}
    _falhas.pop(tutor_id, None)
    if intencao == "atendente":
        return {"resposta": "Vou encaminhar você para a equipe pelo painel de atendimento.", "handoff": True, "protocolo": f"ZEL-{int(agora)}"}
    if intencao == "saude_emergencia":
        return {"resposta": "Procure um veterinário ou serviço de emergência agora. Não consigo diagnosticar seu cão.", "handoff": False}
    mensagens = {
        "agendar_passeio": "Abra Mobilidade para escolher o passeio e confirmar o horário.",
        "pedir_transporte": "Abra Mobilidade e escolha a aba Transporte.",
        "preco_mobilidade": "Os preços aparecem no resumo antes da confirmação.",
        "reservar_hotel": "Abra Hotel para escolher um pacote e as datas.",
        "pacotes_hotel": "Os pacotes Essencial, Conforto e Premium aparecem na tela Hotel.",
        "planos_nutricao": "Abra Nutrição para consultar planos e previsão da próxima entrega.",
        "pausar_assinatura": "A assinatura permite pausar, retomar ou cancelar pelo próprio tutor.",
        "proximo_cuidado": "Abra Agenda para ver seus cuidados por data.",
        "zelocoins": "Seu saldo está na Carteira. A regra de crédito será aplicada após a conclusão do serviço.",
        "conta_pet": "Abra Perfil para consultar o pet e o Gêmeo Digital.",
        "pagamento_simulado": "O pagamento será simulado com Pix ou cartão, sem cobrança real.",
        "saudacao": "Olá! Posso ajudar com passeio, transporte, hotel, nutrição, agenda ou ZeloCoins.",
        "fora_de_escopo": "Posso ajudar apenas com os serviços e a conta do ZeloPets.",
    }
    return {"resposta": mensagens.get(intencao, "Essa informação está em preparação."), "handoff": False, "intencao": intencao}

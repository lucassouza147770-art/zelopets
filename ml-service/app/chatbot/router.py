import hmac
import json
import os
from pathlib import Path

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field

from .dialogue import responder
from .nlu import classificar

router = APIRouter()
_METADATA = Path(__file__).resolve().parents[2] / "artifacts" / "zelinho_nlu_metadata.json"


class Mensagem(BaseModel):
    tutor_id: str = Field(min_length=1, max_length=100)
    mensagem: str | None = Field(default=None, min_length=1, max_length=500)
    texto: str | None = Field(default=None, min_length=1, max_length=500)
    pet_id: str | None = Field(default=None, max_length=100)
    intencao_forcada: str | None = None
    resposta_confirmacao: str | None = None
    intencao_confirmada: str | None = None


@router.post("/chat/mensagem")
def chat(mensagem: Mensagem, token_interno: str | None = Header(default=None, alias="X-Internal-Token")):
    esperado = os.environ.get("ML_INTERNAL_TOKEN")
    if not esperado or token_interno is None or not hmac.compare_digest(token_interno, esperado):
        raise HTTPException(status_code=401, detail="Token interno invalido")
    texto = mensagem.mensagem or mensagem.texto
    if texto is None:
        raise HTTPException(status_code=400, detail="Mensagem obrigatoria")
    if mensagem.intencao_forcada or mensagem.resposta_confirmacao or mensagem.intencao_confirmada:
        intencao, confianca, ranking = "baixa_confianca", 1.0, []
    else:
        intencao, confianca, ranking = classificar(texto)
    return responder(
        mensagem.tutor_id,
        intencao,
        ranking,
        confianca=confianca,
        intencao_forcada=mensagem.intencao_forcada,
        resposta_confirmacao=mensagem.resposta_confirmacao,
        intencao_confirmada=mensagem.intencao_confirmada,
        texto=texto,
    ) | {"confianca": confianca}


@router.get("/chat/saude")
def chat_saude() -> dict[str, str | bool | int]:
    metadata: dict = {}
    if _METADATA.exists():
        metadata = json.loads(_METADATA.read_text(encoding="utf-8"))
    return {
        "status": "ok",
        "modelo_carregado": _METADATA.exists(),
        "modelo_versao": str(metadata.get("versao", "desconhecida")),
        "intencoes": len(metadata.get("classes", [])),
    }

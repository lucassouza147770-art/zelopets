import hmac
import os

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field

from .dialogue import responder
from .nlu import classificar

router = APIRouter()


class Mensagem(BaseModel):
    tutor_id: str = Field(min_length=1, max_length=100)
    texto: str = Field(min_length=1, max_length=500)


@router.post("/chat/mensagem")
def chat(mensagem: Mensagem, token_interno: str | None = Header(default=None, alias="X-Internal-Token")):
    esperado = os.environ.get("ML_INTERNAL_TOKEN")
    if not esperado or token_interno is None or not hmac.compare_digest(token_interno, esperado):
        raise HTTPException(status_code=401, detail="Token interno invalido")
    intencao, confianca, ranking = classificar(mensagem.texto)
    resposta = responder(mensagem.tutor_id, intencao, ranking)
    return {**resposta, "confianca": confianca}

"""PostgreSQL queries shared by model training and recommendation requests."""

from __future__ import annotations

import os
from contextlib import closing
from pathlib import Path

import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[2] / ".env")


def _conectar():
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL nao foi definida no ambiente nem no .env")
    return psycopg2.connect(database_url)


def _buscar(sql: str, parametros: tuple = ()) -> list[dict]:
    with closing(_conectar()) as conexao:
        with conexao.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
            cursor.execute(sql, parametros)
            return [dict(linha) for linha in cursor.fetchall()]


def buscar_todos_os_pets() -> list[dict]:
    return _buscar(
        '''
        SELECT id, porte, "nivelEnergia", raca, "pesoKg",
               "dataNascimento", "restricoesAlimentares", comportamento
        FROM "Pet"
        '''
    )


def buscar_pets_do_tutor(tutor_id: str) -> list[dict]:
    return _buscar(
        '''
        SELECT id, porte, "nivelEnergia", raca, "pesoKg",
               "dataNascimento", "restricoesAlimentares", comportamento
        FROM "Pet"
        WHERE "tutorId" = %s
        ORDER BY "criadoEm" ASC
        ''',
        (tutor_id,),
    )


def buscar_prestadores_ativos() -> list[dict]:
    return _buscar(
        '''
        SELECT id, nome, tipo, "avaliacaoMedia",
               "portesAtendidos"::text[] AS "portesAtendidos",
               "niveisEnergiaAtendidos"::text[] AS "niveisEnergiaAtendidos"
        FROM "Prestador"
        WHERE ativo = true
        '''
    )
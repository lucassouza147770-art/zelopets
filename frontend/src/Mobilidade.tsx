import { useEffect, useState, type FormEvent } from 'react'
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  Clock3,
  PawPrint,
  Star,
} from 'lucide-react'
import { api, ApiError } from './api/client'
import { obterToken } from './api/auth'
import { CHAVE_PET_ATIVO } from './PainelDoTutor'
import {
  obterRecomendacoes,
  type PrestadorRecomendado,
} from './api/recomendacao'

type Pet = {
  id: string
  nome: string
}

type EstadoRecomendacoes = 'carregando' | 'ok' | 'vazio' | 'erro' | 'sem-pet'

const precosPorDuracao = {
  30: 25,
  45: 35,
  60: 45,
} as const

const duracoes = [30, 45, 60] as const

function dataHoraLocalMinima() {
  const agora = new Date()
  const deslocamento = agora.getTimezoneOffset() * 60_000
  return new Date(agora.getTime() - deslocamento).toISOString().slice(0, 16)
}

export function CartaoPrestadorRecomendado({
  prestador,
  selecionado,
  onSelecionar,
}: {
  prestador: PrestadorRecomendado
  selecionado: boolean
  onSelecionar: () => void
}) {
  return (
    <button
      className={`cartao-prestador-recomendado${selecionado ? ' cartao-prestador-recomendado--selecionado' : ''}`}
      type="button"
      aria-pressed={selecionado}
      onClick={onSelecionar}
    >
      <span className="cartao-prestador-recomendado__topo">
        <strong>{prestador.nome}</strong>
        <span className="cartao-prestador-recomendado__nota">
          <Star aria-hidden="true" size={16} />
          {prestador.avaliacaoMedia.toLocaleString('pt-BR', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          })}
        </span>
      </span>
      <span className="cartao-prestador-recomendado__experiencia">
        <BriefcaseBusiness aria-hidden="true" size={16} />
        {prestador.experienciaAnos}{' '}
        {prestador.experienciaAnos === 1 ? 'ano de experiência' : 'anos de experiência'}
      </span>
      <span className="cartao-prestador-recomendado__motivo">
        <PawPrint aria-hidden="true" size={16} />
        {prestador.motivo}
      </span>
    </button>
  )
}

function FormularioAgendamentoPasseio({
  token,
  pet,
  prestadorId,
  onSessaoExpirada,
  onAbrirAgenda,
  onLimparPrestador,
}: {
  token: string
  pet: Pet | null
  prestadorId?: string
  onSessaoExpirada: () => void
  onAbrirAgenda: () => void
  onLimparPrestador: () => void
}) {
  const [dataHora, setDataHora] = useState('')
  const [duracao, setDuracao] = useState<(typeof duracoes)[number]>(30)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)

  async function agendar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!pet || !dataHora || new Date(dataHora).getTime() <= Date.now()) return

    setErro(null)
    setSucesso(false)
    setEnviando(true)
    try {
      await api.post(
        '/passeios',
        {
          petId: pet.id,
          prestadorId,
          dataHora: new Date(dataHora).toISOString(),
          duracaoMinutos: duracao,
        },
        token,
      )
      setSucesso(true)
      setDataHora('')
      onLimparPrestador()
    } catch (falha: unknown) {
      if (falha instanceof ApiError && falha.status === 401) {
        onSessaoExpirada()
        return
      }
      setErro(
        falha instanceof ApiError
          ? falha.message
          : 'Não foi possível agendar o passeio. Tente novamente.',
      )
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section className="formulario-agendamento" aria-labelledby="titulo-agendar-passeio">
      <h2 id="titulo-agendar-passeio">Agendar passeio</h2>
      {pet ? (
        <form onSubmit={(evento) => void agendar(evento)}>
          <p className="formulario-agendamento__pet">
            Passeio para <strong>{pet.nome}</strong>
          </p>
          <label className="campo-mobilidade" htmlFor="data-hora-passeio">
            <span>Data e hora</span>
            <span className="campo-mobilidade__controle">
              <CalendarDays aria-hidden="true" size={18} />
              <input
                id="data-hora-passeio"
                type="datetime-local"
                min={dataHoraLocalMinima()}
                value={dataHora}
                onChange={(evento) => setDataHora(evento.target.value)}
                required
              />
            </span>
          </label>

          <fieldset className="seletor-duracao">
            <legend>Duração do passeio</legend>
            <div className="seletor-duracao__opcoes">
              {duracoes.map((opcao) => {
                const selecionada = duracao === opcao
                return (
                  <button
                    aria-pressed={selecionada}
                    className={`seletor-duracao__opcao${selecionada ? ' seletor-duracao__opcao--selecionada' : ''}`}
                    key={opcao}
                    onClick={() => setDuracao(opcao)}
                    type="button"
                  >
                    {opcao} min
                  </button>
                )
              })}
            </div>
          </fieldset>

          <p className="valor-passeio" aria-live="polite">
            Valor estimado: <strong>R$ {precosPorDuracao[duracao]},00</strong>
          </p>
          <p className="formulario-agendamento__prestador">
            Prestador: {prestadorId ? 'selecionado na vitrine' : 'escolha opcional'}
          </p>
          {erro && <p className="mensagem-de-erro" role="alert">{erro}</p>}
          {sucesso && (
            <div className="mensagem-de-sucesso" role="status">
              <p>Passeio agendado para {pet.nome}.</p>
              <button className="acao-secundaria" type="button" onClick={onAbrirAgenda}>
                Ver na agenda
              </button>
            </div>
          )}
          <button
            className="botao-agendar-passeio"
            type="submit"
            disabled={!pet || !dataHora || new Date(dataHora).getTime() <= Date.now() || enviando}
          >
            {enviando ? 'Agendando...' : `Agendar passeio do ${pet.nome}`}
          </button>
        </form>
      ) : (
        <p>Cadastre um cão para agendar um passeio.</p>
      )}
    </section>
  )
}

export function TelaMobilidade({
  token,
  onSessaoExpirada,
  onVoltar,
  onAbrirAgenda,
}: {
  token: string
  onSessaoExpirada: () => void
  onVoltar: () => void
  onAbrirAgenda: () => void
}) {
  const [pet, setPet] = useState<Pet | null>(null)
  const [prestadores, setPrestadores] = useState<PrestadorRecomendado[]>([])
  const [estadoRecomendacoes, setEstadoRecomendacoes] =
    useState<EstadoRecomendacoes>('carregando')
  const [prestadorSelecionadoId, setPrestadorSelecionadoId] = useState<string>()

  useEffect(() => {
    let ativa = true

    async function carregar() {
      try {
        const pets = await api.get<Pet[]>('/pets', token)
        if (!ativa) return
        const petAtivoSalvo = localStorage.getItem(CHAVE_PET_ATIVO)
        const petAtivo = pets.find((item) => item.id === petAtivoSalvo) ?? pets[0] ?? null
        setPet(petAtivo)
        if (!petAtivo) {
          setEstadoRecomendacoes('sem-pet')
          return
        }
        localStorage.setItem(CHAVE_PET_ATIVO, petAtivo.id)

        const resposta = await obterRecomendacoes(token, petAtivo.id)
        if (!ativa) return
        const passeadores = resposta.prestadores.filter(
          (prestador) => prestador.tipo === 'PASSEADOR',
        )
        setPrestadores(passeadores)
        setEstadoRecomendacoes(passeadores.length === 0 ? 'vazio' : 'ok')
      } catch (falha: unknown) {
        if (!ativa) return
        if (falha instanceof ApiError && falha.status === 401) {
          onSessaoExpirada()
          return
        }
        setEstadoRecomendacoes('erro')
      }
    }

    void carregar()
    return () => {
      ativa = false
    }
  }, [onSessaoExpirada, token])

  return (
    <main className="tela-interna tela-mobilidade" tabIndex={-1}>
      <button className="botao-voltar" type="button" onClick={onVoltar}>
        <ArrowLeft aria-hidden="true" size={20} />
        Voltar
      </button>
      <h1>Mobilidade</h1>
      <section className="vitrine-recomendados" aria-labelledby="titulo-recomendados">
        <h2 id="titulo-recomendados">
          Recomendados para {pet ? pet.nome : 'seu cão'}
        </h2>
        {estadoRecomendacoes === 'carregando' ? (
          <div className="esqueleto-recomendacoes" aria-busy="true" aria-label="Carregando recomendações">
            <span />
            <span />
          </div>
        ) : estadoRecomendacoes === 'erro' ? (
          <p role="alert">Recomendações indisponíveis agora.</p>
        ) : estadoRecomendacoes === 'sem-pet' ? (
          <p>Cadastre um cão para ver recomendações de passeadores.</p>
        ) : estadoRecomendacoes === 'vazio' ? (
          <p>Ainda não temos passeadores compatíveis com o {pet?.nome}.</p>
        ) : (
          <ul className="lista-prestadores-recomendados">
            {prestadores.map((prestador) => (
              <li key={prestador.id}>
                <CartaoPrestadorRecomendado
                  prestador={prestador}
                  selecionado={prestadorSelecionadoId === prestador.id}
                  onSelecionar={() =>
                    setPrestadorSelecionadoId((atual) =>
                      atual === prestador.id ? undefined : prestador.id,
                    )
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </section>
      <FormularioAgendamentoPasseio
        token={token}
        pet={pet}
        prestadorId={prestadorSelecionadoId}
        onSessaoExpirada={onSessaoExpirada}
        onAbrirAgenda={onAbrirAgenda}
        onLimparPrestador={() => setPrestadorSelecionadoId(undefined)}
      />
      <p className="nota-preco-passeio">
        O valor final é calculado pelo servidor ao confirmar o agendamento.
      </p>
    </main>
  )
}

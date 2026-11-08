import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { ArrowLeft, CheckCheck, Gift, Send, Sparkles, TicketPercent } from 'lucide-react'
import { ApiError, api } from './api/client'
import { ehAdministrador, limparToken, obterToken } from './api/auth'
import { AtendimentosAdmin } from './AtendimentosAdmin'
import { BarraDeNavegacao, PainelDoTutor, type TelaPrincipal } from './PainelDoTutor'
import type { Cuidado } from './api/agenda'
import { TelaCadastroDoPet } from './TelaCadastroDoPet'
import { TelaLogin } from './TelaLogin'
import { obterTutor, type Tutor } from './api/tutor'
import { TelaMobilidade } from './Mobilidade'
import { obterRecomendacoes, type RespostaRecomendacao } from './api/recomendacao'
import { TelaHotel, TelaNutricao } from './Servicos'

type EstadoSessao = 'verificando' | 'deslogado' | 'cadastro-pet' | 'autenticado' | 'erro'
type Rota = TelaPrincipal | 'carteira' | 'servico' | 'gemeo' | 'atendimentos'
type ServicoId = 'mobilidade' | 'hotel' | 'nutricao'

function TelaInterna({
  titulo,
  onVoltar,
  children,
}: {
  titulo: string
  onVoltar: () => void
  children: ReactNode
}) {
  return (
    <main className="tela-interna" tabIndex={-1}>
      <button className="botao-voltar" type="button" onClick={onVoltar}>
        <ArrowLeft aria-hidden="true" size={20} />
        Voltar
      </button>
      <h1>{titulo}</h1>
      {children}
    </main>
  )
}

function TelaAgenda({
  token,
  onSessaoExpirada,
  onVoltar,
}: {
  token: string
  onSessaoExpirada: () => void
  onVoltar: () => void
}) {
  const [cuidados, setCuidados] = useState<Cuidado[]>([])
  const [estado, setEstado] = useState<'carregando' | 'ok' | 'erro'>('carregando')
  const [mes, setMes] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [diaSelecionado, setDiaSelecionado] = useState<number | null>(new Date().getDate())

  useEffect(() => {
    let ativa = true
    api
      .get<Cuidado[]>('/agenda', token)
      .then((dados) => {
        if (!ativa) return
        setCuidados(dados)
        setEstado('ok')
      })
      .catch((erro: unknown) => {
        if (!ativa) return
        if (erro instanceof ApiError && erro.status === 401) {
          onSessaoExpirada()
          return
        }
        setEstado('erro')
      })
    return () => {
      ativa = false
    }
  }, [onSessaoExpirada, token])

  const inicio = new Date(mes.getFullYear(), mes.getMonth(), 1)
  const diasNoMes = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate()
  const deslocamento = (inicio.getDay() + 6) % 7
  const cuidadosDoDia = cuidados.filter((cuidado) => {
    const data = new Date(cuidado.dataHora)
    return data.getFullYear() === mes.getFullYear() && data.getMonth() === mes.getMonth() && data.getDate() === diaSelecionado
  })

  return (
    <TelaInterna titulo="Agenda" onVoltar={onVoltar}>
      {estado === 'carregando' ? (
        <p aria-busy="true">Carregando seus próximos cuidados...</p>
      ) : estado === 'erro' ? (
        <p role="alert">Não foi possível carregar a agenda. Tente novamente.</p>
      ) : (
        <>
          <section className="agenda-resumo">
            <div><span className="agenda-resumo__numero">{cuidados.length}</span><span>cuidados agendados</span></div>
            <div><span className="agenda-resumo__numero">{cuidados.filter((cuidado) => cuidado.status !== 'CANCELADO').length}</span><span>em andamento</span></div>
            <div><span className="agenda-resumo__numero">+50</span><span>ZeloCoins por cuidado</span></div>
          </section>
          <section className="calendario-agenda" aria-label="Calendário de cuidados">
            <div className="calendario-agenda__cabecalho">
              <button type="button" aria-label="Mês anterior" onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() - 1, 1))}>‹</button>
              <h2>{new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(mes)}</h2>
              <button type="button" aria-label="Próximo mês" onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() + 1, 1))}>›</button>
            </div>
            <div className="calendario-agenda__semana">{['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((dia, indice) => <span key={`${dia}-${indice}`}>{dia}</span>)}</div>
            <div className="calendario-agenda__dias">
              {Array.from({ length: deslocamento }, (_, indice) => <span className="calendario-agenda__dia calendario-agenda__dia--vazio" key={`vazio-${indice}`} />)}
              {Array.from({ length: diasNoMes }, (_, indice) => {
                const dia = indice + 1
                const marcado = cuidados.some((cuidado) => {
                  const data = new Date(cuidado.dataHora)
                  return data.getFullYear() === mes.getFullYear() && data.getMonth() === mes.getMonth() && data.getDate() === dia
                })
                return <button className={`calendario-agenda__dia ${marcado ? 'calendario-agenda__dia--marcado' : ''} ${dia === new Date().getDate() && mes.getMonth() === new Date().getMonth() ? 'calendario-agenda__dia--hoje' : ''}`} type="button" key={dia} onClick={() => setDiaSelecionado(dia)}>{dia}</button>
              })}
            </div>
            {diaSelecionado && <p className="calendario-agenda__selecionado">{cuidadosDoDia.length ? `${cuidadosDoDia.length} cuidado(s) neste dia` : 'Nenhum cuidado neste dia'}</p>}
          </section>
          {cuidadosDoDia.length > 0 ? <ul className="lista-agenda">{cuidadosDoDia.map((cuidado, indice) => <li className="item-agenda" key={`${cuidado.tipo}-${cuidado.dataHora}-${indice}`}><span className="item-agenda__icone" aria-hidden="true">{cuidado.tipo === 'PASSEIO' ? '🐾' : cuidado.tipo === 'HOSPEDAGEM' ? '🏡' : '🥣'}</span><div><span className="item-agenda__data">{new Intl.DateTimeFormat('pt-BR', { timeStyle: 'short' }).format(new Date(cuidado.dataHora))}</span><strong>{cuidado.tipo === 'PASSEIO' ? 'Passeio' : cuidado.tipo === 'HOSPEDAGEM' ? 'Hospedagem' : 'Nutrição'}</strong><span>{cuidado.petNome}</span></div><span className="chip-status chip-status--agendado">{cuidado.status}</span></li>)}</ul> : <section className="agenda-vazia"><span aria-hidden="true">🗓️</span><strong>Seu dia está livre</strong><p>Que tal planejar um cuidado para o seu pet?</p></section>}
        </>
      )}
    </TelaInterna>
  )
}

function TelaPerfil({
  token,
  onSessaoExpirada,
  onVoltar,
  onAbrirGemeo,
  onCadastrarPet,
  onSair,
}: {
  token: string
  onSessaoExpirada: () => void
  onVoltar: () => void
  onAbrirGemeo: () => void
  onCadastrarPet: () => void
  onSair: () => void
}) {
  const [tutor, setTutor] = useState<Tutor | null>(null)
  const [pets, setPets] = useState<{ id: string; nome: string }[]>([])
  const [estado, setEstado] = useState<'carregando' | 'ok' | 'erro'>('carregando')

  useEffect(() => {
    let ativa = true
    Promise.all([obterTutor(token), api.get<{ id: string; nome: string }[]>('/pets', token)])
      .then(([perfil, listaPets]) => {
        if (!ativa) return
        setTutor(perfil)
        setPets(listaPets)
        setEstado('ok')
      })
      .catch((erro: unknown) => {
        if (!ativa) return
        if (erro instanceof ApiError && erro.status === 401) {
          onSessaoExpirada()
          return
        }
        setEstado('erro')
      })
    return () => {
      ativa = false
    }
  }, [onSessaoExpirada, token])

  return (
    <TelaInterna titulo="Perfil" onVoltar={onVoltar}>
      {estado === 'carregando' ? (
        <p aria-busy="true">Carregando seu perfil...</p>
      ) : estado === 'erro' ? (
        <p role="alert">Não foi possível carregar seu perfil. Tente novamente.</p>
      ) : (
        <>
          <section className="perfil-hero">
            <div className="perfil-hero__avatar" aria-hidden="true">
              {tutor?.nome?.charAt(0).toLocaleUpperCase('pt-BR') ?? 'Z'}
            </div>
            <div>
              <span className="perfil-hero__eyebrow">Tutor ZeloPets</span>
              <h2>{tutor?.nome}</h2>
              <p>{pets.length} {pets.length === 1 ? 'pet cadastrado' : 'pets cadastrados'}</p>
            </div>
          </section>
          <dl className="dados-perfil">
            <div><dt>Nome</dt><dd>{tutor?.nome}</dd></div>
            <div><dt>E-mail</dt><dd>{tutor?.email}</dd></div>
          </dl>
          <h2>Seus cães</h2>
          {pets.length === 0 ? (
            <section className="perfil-vazio">
              <span aria-hidden="true">🐾</span>
              <strong>Seu perfil começa pelo seu pet</strong>
              <p>Cadastre um cão para receber recomendações personalizadas.</p>
              <button className="acao-secundaria" type="button" onClick={onCadastrarPet}>Cadastrar meu pet</button>
            </section>
          ) : (
            <>
              <ul className="lista-pets lista-pets--perfil">
                {pets.map((pet) => <li key={pet.id}><span className="lista-pets__avatar" aria-hidden="true">{pet.nome.charAt(0).toUpperCase()}</span><strong>{pet.nome}</strong><span>Perfil cadastrado</span></li>)}
              </ul>
              <div className="perfil-acoes">
                <button className="acao-secundaria" type="button" onClick={onCadastrarPet}>Adicionar outro pet</button>
                <button className="acao-secundaria" type="button" onClick={onAbrirGemeo}>Abrir gêmeo digital</button>
              </div>
            </>
          )}
          <button className="botao-sair" type="button" onClick={onSair}>Sair da conta</button>
        </>
      )}
    </TelaInterna>
  )
}

type PetDetalhado = {
  id: string
  nome: string
  fotoUrl?: string | null
  especie: string
  raca?: string | null
  dataNascimento?: string | null
  porte: string
  pesoKg?: number | null
  nivelEnergia: string
  restricoesAlimentares: string[]
  comportamento: string[]
}

function rotuloPet(valor: string) {
  return valor.toLocaleLowerCase('pt-BR').replace('_', ' ')
}

function TelaGemeoDigital({
  token,
  onSessaoExpirada,
  onVoltar,
  onAbrirServico,
}: {
  token: string
  onSessaoExpirada: () => void
  onVoltar: () => void
  onAbrirServico: (servico: ServicoId) => void
}) {
  const [pet, setPet] = useState<PetDetalhado | null>(null)
  const [recomendacoes, setRecomendacoes] = useState<RespostaRecomendacao | null>(null)
  const [estado, setEstado] = useState<'carregando' | 'ok' | 'erro'>('carregando')
  const [mensagem, setMensagem] = useState<string | null>(null)

  useEffect(() => {
    let ativa = true
    api.get<PetDetalhado[]>('/pets', token)
      .then(async (pets) => {
        const selecionado = pets[0]
        if (!selecionado) throw new Error('Nenhum pet cadastrado')
        const resultado = await obterRecomendacoes(token, selecionado.id).catch(() => null)
        if (!ativa) return
        setPet(selecionado)
        setRecomendacoes(resultado)
        setEstado('ok')
      })
      .catch((erro: unknown) => {
        if (!ativa) return
        if (erro instanceof ApiError && erro.status === 401) {
          onSessaoExpirada()
          return
        }
        setEstado('erro')
      })
    return () => {
      ativa = false
    }
  }, [onSessaoExpirada, token])

  return (
    <TelaInterna titulo="Gêmeo digital" onVoltar={onVoltar}>
      {estado === 'carregando' ? (
        <p aria-busy="true">Preparando o perfil vivo do seu cão...</p>
      ) : estado === 'erro' || !pet ? (
        <p role="alert">Não foi possível carregar o perfil do seu cão.</p>
      ) : (
        <div className="gemeo-digital">
          <section className="gemeo-digital__identidade" aria-labelledby="nome-gemeo">
            <div className="gemeo-digital__foto">
              {pet.fotoUrl ? <img src={pet.fotoUrl} alt="" /> : pet.nome.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="texto-apoio">Perfil baseado nos dados cadastrados</p>
              <h2 id="nome-gemeo">{pet.nome}</h2>
              <p>{pet.raca || 'Raça não informada'} · porte {rotuloPet(pet.porte)}</p>
            </div>
          </section>
          <section className="gemeo-digital__dados" aria-labelledby="dados-gemeo">
            <h2 id="dados-gemeo">Características</h2>
            <dl className="grade-gemeo">
              <div><dt>Energia</dt><dd>{rotuloPet(pet.nivelEnergia)}</dd></div>
              <div><dt>Peso</dt><dd>{pet.pesoKg ? `${pet.pesoKg} kg` : 'Não informado'}</dd></div>
              <div><dt>Comportamento</dt><dd>{pet.comportamento.length ? pet.comportamento.join(', ') : 'Não informado'}</dd></div>
              <div><dt>Restrições</dt><dd>{pet.restricoesAlimentares.length ? pet.restricoesAlimentares.join(', ') : 'Nenhuma informada'}</dd></div>
            </dl>
          </section>
          <section className="gemeo-digital__recomendacoes" aria-labelledby="recomendacoes-gemeo">
            <div className="gemeo-digital__secao-cabecalho">
              <div>
                <p className="texto-apoio">Próximos melhores cuidados</p>
                <h2 id="recomendacoes-gemeo">Recomendações para {pet.nome}</h2>
              </div>
              <span className="gemeo-digital__cluster">Perfil {recomendacoes ? `#${recomendacoes.cluster + 1}` : 'personalizado'}</span>
            </div>
            {recomendacoes ? (
              <>
                <p className="gemeo-digital__resumo">Com base no perfil, {pet.nome} combina com cuidados para porte {rotuloPet(recomendacoes.perfilDoCluster.porte)} e energia {rotuloPet(recomendacoes.perfilDoCluster.nivel_energia)}.</p>
                {recomendacoes.prestadores.length ? (
                  <ul className="lista-recomendacoes">
                    {recomendacoes.prestadores.map((prestador) => (
                      <li key={prestador.id}>
                        <div><strong>{prestador.nome}</strong><span>{prestador.motivo}</span></div>
                        <small>{prestador.tipo === 'PASSEADOR' ? 'Passeador' : 'Hotel'} · {prestador.avaliacaoMedia.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} ★</small>
                      </li>
                    ))}
                  </ul>
                ) : <p>Nenhum prestador compatível foi encontrado agora. Você ainda pode explorar os serviços abaixo.</p>}
              </>
            ) : <p className="gemeo-digital__resumo">O perfil está pronto. A recomendação automática está indisponível agora, mas estas ações continuam disponíveis:</p>}
            <div className="gemeo-digital__acoes" aria-label="Ações recomendadas">
              <button type="button" onClick={() => onAbrirServico('mobilidade')}>🐾 Passeio ideal</button>
              <button type="button" onClick={() => onAbrirServico('hotel')}>🏡 Hotel compatível</button>
              <button type="button" onClick={() => onAbrirServico('nutricao')}>🥣 Nutrição</button>
            </div>
            {mensagem && <p className="mensagem-de-sucesso" role="status">{mensagem}</p>}
          </section>
        </div>
      )}
    </TelaInterna>
  )
}

function MascoteZelinho({ onAbrir }: { onAbrir: () => void }) {
  return (
    <button className="mascote-zelinho" type="button" onClick={onAbrir} aria-label="Abrir conversa com o Zelinho">
      <img src="/assets/icones/chat_zelinho.svg" alt="" />
      <span>Fale com o Zelinho</span>
    </button>
  )
}

function TelaCarteira({
  token,
  onSessaoExpirada,
  onVoltar,
}: {
  token: string
  onSessaoExpirada: () => void
  onVoltar: () => void
}) {
  const [tutor, setTutor] = useState<Tutor | null>(null)
  const [estado, setEstado] = useState<'carregando' | 'ok' | 'erro'>('carregando')
  const [mensagem, setMensagem] = useState<string | null>(null)

  useEffect(() => {
    let ativa = true
    obterTutor(token)
      .then((perfil) => {
        if (!ativa) return
        setTutor(perfil)
        setEstado('ok')
      })
      .catch((erro: unknown) => {
        if (!ativa) return
        if (erro instanceof ApiError && erro.status === 401) {
          onSessaoExpirada()
          return
        }
        setEstado('erro')
      })
    return () => {
      ativa = false
    }
  }, [onSessaoExpirada, token])

  return (
    <TelaInterna titulo="Carteira ZeloCoins" onVoltar={onVoltar}>
      {estado === 'carregando' ? (
        <p aria-busy="true">Carregando seu saldo...</p>
      ) : estado === 'erro' ? (
        <p role="alert">Não foi possível carregar seu saldo. Tente novamente.</p>
      ) : (
        <>
          <section className="carteira-destaque">
            <div className="carteira-destaque__icone"><Sparkles aria-hidden="true" size={24} /></div>
            <span>Saldo disponível</span>
            <strong>{tutor?.zeloCoins.toLocaleString('pt-BR')} ZeloCoins</strong>
            <span>Use seus pontos para ganhar descontos no próximo cuidado.</span>
          </section>
          <section className="carteira-beneficios">
            <div className="secao-servico__titulo"><div><span className="servico-hero__eyebrow">Vantagens para você</span><h2>Use suas moedas</h2></div><Gift aria-hidden="true" /></div>
            <div className="carteira-beneficios__grid">
              <button type="button" onClick={() => setMensagem('Benefício reservado: 10% de desconto no próximo passeio.') }><TicketPercent aria-hidden="true" size={22} /><strong>10% OFF</strong><span>no próximo passeio</span><small>500 ZeloCoins</small></button>
              <button type="button" onClick={() => setMensagem('Benefício reservado: frete grátis na próxima entrega de nutrição.') }><Gift aria-hidden="true" size={22} /><strong>Frete grátis</strong><span>na próxima entrega</span><small>800 ZeloCoins</small></button>
              <button type="button" onClick={() => setMensagem('Brinde selecionado: mimo surpresa no próximo serviço.') }><Sparkles aria-hidden="true" size={22} /><strong>Mimo surpresa</strong><span>no próximo serviço</span><small>1.000 ZeloCoins</small></button>
            </div>
            {mensagem && <p className="mensagem-de-sucesso" role="status">{mensagem}</p>}
          </section>
          <p className="carteira-aviso">Você pode ganhar ZeloCoins ao manter os cuidados em dia e participar das ações da comunidade.</p>
        </>
      )}
      <p className="texto-apoio">Histórico e resgates serão ativados no fluxo de pagamento sandbox.</p>
    </TelaInterna>
  )
}

function TelaServico({ servico, onVoltar }: { servico: ServicoId; onVoltar: () => void }) {
  const dados = {
    hotel: {
      titulo: 'Hotel ZeloPets',
      imagem: '/assets/fotos/04_hotel_pet_area_convivencia.jpg',
      descricao: 'Hospedagem com ambientes preparados para o ritmo do seu pet.',
      itens: ['Pacotes Essencial, Conforto e Premium', 'Escolha de convivência', 'Nível de contato personalizado'],
    },
    nutricao: {
      titulo: 'Nutrição',
      imagem: '/assets/fotos/08_nutricao_pet_ingredientes.jpg',
      descricao: 'Planos alimentares por assinatura baseados no perfil cadastrado.',
      itens: ['Previsão da próxima entrega', 'Acompanhamento do consumo', 'Opções para restrições informadas'],
    },
    mobilidade: {
      titulo: 'Mobilidade',
      imagem: '/assets/fotos/03_cao_correndo_gramado.jpg',
      descricao: 'Passeios compatíveis com a energia e o porte do seu pet.',
      itens: ['Prestadores recomendados', 'Agendamento pelo app', 'Status visível na Agenda'],
    },
  }[servico]

  return (
    <TelaInterna titulo={dados.titulo} onVoltar={onVoltar}>
      <img className="servico-capa" src={dados.imagem} alt="" />
      <p>{dados.descricao}</p>
      <ul className="lista-beneficios-servico">{dados.itens.map((item) => <li key={item}>{item}</li>)}</ul>
      <p className="texto-apoio">Pagamento simulado será oferecido depois da confirmação da reserva.</p>
    </TelaInterna>
  )
}

function TelaZelinho({ token, onSessaoExpirada, onVoltar, onAbrirAgenda }: { token: string; onSessaoExpirada: () => void; onVoltar: () => void; onAbrirAgenda: () => void }) {
  const [pergunta, setPergunta] = useState('')
  const [mensagens, setMensagens] = useState<Array<{ id: string; autor: 'zelinho' | 'tutor'; texto: string; horario: string }>>([
    { id: 'boas-vindas', autor: 'zelinho', texto: 'Olá! Sou o Zelinho. Posso orientar sobre os serviços do ZeloPets.', horario: 'agora' },
  ])
  const [estado, setEstado] = useState<'ok' | 'enviando' | 'erro'>('ok')
  const [erro, setErro] = useState<string | null>(null)
  const [sugestoes, setSugestoes] = useState<Array<{ rotulo: string; valor: string }>>([])

  type RespostaZelinho = {
    resposta?: string
    sugestoes?: Array<{ rotulo: string; valor: string }>
    handoff?: { motivo: string; prioridade: string; resumo: string } | null
    protocolo?: string
  }

  useEffect(() => {
    let ativa = true
    api.get<RespostaZelinho>('/zelinho/inicio', token).then((resultado) => {
      if (!ativa) return
      setMensagens((anteriores) => anteriores.length === 1
        ? [...anteriores, { id: 'boas-vindas-personalizada', autor: 'zelinho', texto: resultado.resposta ?? '', horario: 'agora' }]
        : anteriores)
      setSugestoes(resultado.sugestoes ?? [])
    }).catch((erroRecebido: unknown) => {
      if (erroRecebido instanceof ApiError && erroRecebido.status === 401) onSessaoExpirada()
    })
    return () => { ativa = false }
  }, [onSessaoExpirada, token])

  async function enviarTexto(texto: string, opcoes: { intencao_forcada?: string; resposta_confirmacao?: 'sim' | 'nao'; pet_id?: string } = {}) {
    if (!texto || estado === 'enviando') return
    setEstado('enviando')
    setErro(null)
    setMensagens((anteriores) => [...anteriores, { id: `tutor-${Date.now()}`, autor: 'tutor', texto, horario: 'agora' }])
    setPergunta('')
    try {
      const resultado = await api.post<RespostaZelinho>('/zelinho/mensagens', { texto, ...opcoes }, token)
      setSugestoes(resultado.sugestoes ?? [])
      setMensagens((anteriores) => [
        ...anteriores,
        { id: `zelinho-${Date.now()}`, autor: 'zelinho', texto: resultado.resposta ?? 'Essa informação está em preparação.', horario: 'agora' },
        ...(resultado.protocolo ? [{ id: `protocolo-${Date.now()}`, autor: 'zelinho' as const, texto: `Protocolo de atendimento: ${resultado.protocolo}`, horario: 'agora' }] : []),
      ])
      setEstado('ok')
    } catch (erroRecebido: unknown) {
      if (erroRecebido instanceof ApiError && erroRecebido.status === 401) {
        onSessaoExpirada()
        return
      }
      setErro(erroRecebido instanceof ApiError ? erroRecebido.message : 'Não foi possível falar com o Zelinho.')
      setEstado('erro')
    }
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const texto = pergunta.trim()
    setPergunta('')
    await enviarTexto(texto)
  }

  return (
    <TelaInterna titulo="Conversa com o Zelinho" onVoltar={onVoltar}>
      <section className="chat-zelinho" aria-label="Conversa com o Zelinho">
        <header className="chat-zelinho__cabecalho">
          <div className="chat-zelinho__avatar"><img src="/assets/icones/chat_zelinho.svg" alt="" /></div>
          <div><strong>Zelinho</strong><span>Online agora · atendimento inteligente</span></div>
          <span className="chat-zelinho__online" aria-label="Online" />
        </header>
        <div className="chat-zelinho__mensagens" role="log" aria-live="polite">
          <p className="chat-zelinho__dia">Hoje</p>
          {mensagens.map((mensagem) => (
            <div key={mensagem.id} className={`mensagem-chat ${mensagem.autor === 'tutor' ? 'mensagem-chat--tutor' : ''}`}>
              <p>{mensagem.texto}</p>
              <span>{mensagem.horario} {mensagem.autor === 'tutor' && <CheckCheck aria-hidden="true" size={14} />}</span>
            </div>
          ))}
          {sugestoes.length > 0 && estado === 'ok' && (
            <div className="chat-zelinho__sugestoes" aria-label="Ações sugeridas pelo Zelinho">
              {sugestoes.map((sugestao) => (
                <button
                  type="button"
                  key={sugestao.valor}
                  onClick={() => {
                    if (sugestao.valor === 'abrir_agenda') {
                      onAbrirAgenda()
                      return
                    }
                    if (sugestao.valor === 'cancelar_agendamento') {
                      void enviarTexto('não')
                      return
                    }
                    if (sugestao.valor.startsWith('pet:')) {
                      void enviarTexto(sugestao.rotulo, { pet_id: sugestao.valor.slice(4) })
                      return
                    }
                    void (sugestao.valor === 'sim' || sugestao.valor === 'nao'
                    ? enviarTexto(sugestao.valor, { resposta_confirmacao: sugestao.valor })
                    : enviarTexto(sugestao.rotulo, { intencao_forcada: sugestao.valor }))
                  }}
                >
                  {sugestao.rotulo}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
      {estado === 'enviando' && <p role="status" aria-busy="true">Zelinho está digitando...</p>}
      {erro && <p role="alert">{erro}</p>}
      <form className="formulario-zelinho" onSubmit={enviar}>
        <label className="sr-only" htmlFor="pergunta-zelinho">Mensagem para o Zelinho</label>
        <input id="pergunta-zelinho" value={pergunta} onChange={(evento) => setPergunta(evento.target.value)} placeholder="Escreva uma mensagem..." />
        <button className="formulario-zelinho__enviar" type="submit" disabled={estado === 'enviando' || !pergunta.trim()} aria-label="Enviar mensagem"><Send aria-hidden="true" size={19} /></button>
      </form>
      <p className="texto-apoio">O Zelinho usa inteligência artificial. Não compartilhe senhas ou dados bancários.</p>
    </TelaInterna>
  )
}

export function App() {
  const [estadoSessao, setEstadoSessao] = useState<EstadoSessao>('verificando')
  const [mensagemErro, setMensagemErro] = useState<string | null>(null)
  const [rota, setRota] = useState<Rota>('inicio')
  const [rotaAntesCadastro, setRotaAntesCadastro] = useState<Rota>('inicio')
  const [servicoAtivo, setServicoAtivo] = useState<ServicoId>('mobilidade')

  const encerrarSessao = useCallback(() => {
    limparToken()
    setMensagemErro(null)
    setEstadoSessao('deslogado')
  }, [])

  const verificarSessao = useCallback(async () => {
    const token = obterToken()
    if (!token) {
      setEstadoSessao('deslogado')
      return
    }

    setEstadoSessao('verificando')
    setMensagemErro(null)
    try {
      if (ehAdministrador(token)) {
        setRota('atendimentos')
        setEstadoSessao('autenticado')
        return
      }
      const pets = await api.get<{ id: string }[]>('/pets', token)
      setRota('inicio')
      setEstadoSessao(pets.length === 0 ? 'cadastro-pet' : 'autenticado')
    } catch (erro) {
      if (erro instanceof ApiError && erro.status === 401) {
        encerrarSessao()
        return
      }
      setMensagemErro('Não foi possível validar sua sessão. Confira a conexão e tente novamente.')
      setEstadoSessao('erro')
    }
  }, [encerrarSessao])

  useEffect(() => {
    void verificarSessao()
  }, [verificarSessao])

  useEffect(() => {
    if (estadoSessao !== 'autenticado') return
    document.querySelector<HTMLElement>('.aplicacao-autenticada main')?.focus()
  }, [estadoSessao, rota])

  function navegar(tela: TelaPrincipal) {
    setRota(tela)
  }

  function selecionarServico(servico: ServicoId) {
    setServicoAtivo(servico)
    setRota('servico')
  }

  const token = obterToken()

  if (estadoSessao === 'verificando') {
    return <main className="tela-interna" aria-busy="true"><h1>Carregando ZeloPets</h1></main>
  }

  if (estadoSessao === 'deslogado') {
    return <TelaLogin onAutenticado={() => void verificarSessao()} />
  }

  if (estadoSessao === 'cadastro-pet') {
    return (
      <TelaCadastroDoPet
        onPetCriado={() => {
          setRota('inicio')
          setEstadoSessao('autenticado')
        }}
        onSessaoExpirada={encerrarSessao}
        onVoltar={() => {
          if (!token) {
            encerrarSessao()
            return
          }
          setRota(rotaAntesCadastro)
          setEstadoSessao('autenticado')
        }}
      />
    )
  }

  if (estadoSessao === 'erro') {
    return (
      <main className="tela-interna" role="alert">
        <h1>Não foi possível abrir o ZeloPets</h1>
        <p>{mensagemErro}</p>
        <button className="acao-secundaria" type="button" onClick={() => void verificarSessao()}>
          Tentar novamente
        </button>
        <button className="botao-voltar" type="button" onClick={encerrarSessao}>
          Voltar ao login
        </button>
      </main>
    )
  }

  if (!token) {
    return (
      <main className="tela-interna" role="alert">
        <h1>Sua sessão não está disponível</h1>
        <button className="acao-secundaria" type="button" onClick={encerrarSessao}>
          Voltar ao login
        </button>
      </main>
    )
  }

  const telaAtiva: TelaPrincipal | null =
    rota === 'inicio' || rota === 'agenda' || rota === 'zelinho' || rota === 'perfil' ? rota : null

  return (
    <div className="aplicacao-autenticada">
      {rota === 'inicio' ? (
        <PainelDoTutor
          onAbrirCarteira={() => setRota('carteira')}
          onAbrirPerfil={() => navegar('perfil')}
          onAbrirAgenda={() => navegar('agenda')}
          onAbrirZelinho={() => navegar('zelinho')}
          onAbrirServico={selecionarServico}
          onCadastrarPet={() => {
            setRotaAntesCadastro('inicio')
            setEstadoSessao('cadastro-pet')
          }}
          onSessaoExpirada={encerrarSessao}
        />
      ) : rota === 'agenda' ? (
        <TelaAgenda token={token} onSessaoExpirada={encerrarSessao} onVoltar={() => navegar('inicio')} />
      ) : rota === 'perfil' ? (
        <TelaPerfil token={token} onSessaoExpirada={encerrarSessao} onVoltar={() => navegar('inicio')} onAbrirGemeo={() => setRota('gemeo')} onCadastrarPet={() => { setRotaAntesCadastro('perfil'); setEstadoSessao('cadastro-pet') }} onSair={encerrarSessao} />
      ) : rota === 'carteira' ? (
        <TelaCarteira token={token} onSessaoExpirada={encerrarSessao} onVoltar={() => navegar('inicio')} />
      ) : rota === 'gemeo' ? (
        <TelaGemeoDigital token={token} onSessaoExpirada={encerrarSessao} onVoltar={() => navegar('perfil')} onAbrirServico={selecionarServico} />
      ) : rota === 'zelinho' ? (
        <TelaZelinho token={token} onSessaoExpirada={encerrarSessao} onVoltar={() => navegar('inicio')} onAbrirAgenda={() => navegar('agenda')} />
      ) : rota === 'servico' && servicoAtivo === 'mobilidade' ? (
        <TelaMobilidade
          token={token}
          onSessaoExpirada={encerrarSessao}
          onVoltar={() => navegar('inicio')}
          onAbrirAgenda={() => navegar('agenda')}
        />
      ) : rota === 'servico' && servicoAtivo === 'hotel' ? (
        <TelaHotel token={token} onSessaoExpirada={encerrarSessao} onVoltar={() => navegar('inicio')} />
      ) : rota === 'servico' && servicoAtivo === 'nutricao' ? (
        <TelaNutricao token={token} onSessaoExpirada={encerrarSessao} onVoltar={() => navegar('inicio')} />
      ) : (
        rota === 'atendimentos' ? <AtendimentosAdmin token={token} onSair={encerrarSessao} /> : <TelaServico servico={servicoAtivo} onVoltar={() => navegar('inicio')} />
      )}
      <MascoteZelinho onAbrir={() => navegar('zelinho')} />
      <footer className="rodape-aplicacao">
        <small>ZeloPets · cuidado que entende seu cão</small>
      </footer>
      {rota !== 'inicio' && (
        <BarraDeNavegacao
          telaAtiva={telaAtiva}
          onAbrirInicio={() => navegar('inicio')}
          onAbrirAgenda={() => navegar('agenda')}
          onAbrirZelinho={() => navegar('zelinho')}
          onAbrirPerfil={() => navegar('perfil')}
        />
      )}
    </div>
  )
}

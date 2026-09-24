import { useEffect, useState } from 'react'
import { api } from './api/client'
import { obterToken } from './api/auth'

type Pet = {
  nome: string
  fotoUrl?: string
}

type EstadoPetAtivo =
  | { tipo: 'carregando' }
  | { tipo: 'sem-pet' }
  | { tipo: 'erro' }
  | { tipo: 'ok'; pet: Pet }

type EstadoAgendamento =
  | { tipo: 'carregando' }
  | { tipo: 'vazio' }
  | { tipo: 'erro' }
  | {
      tipo: 'ok'
      dado: {
        petNome: string
        servico: 'Passeio' | 'Hospedagem' | 'Nutrição'
        horario: string
      }
    }

type Produto = {
  id: 'mobilidade' | 'hospedagem' | 'nutricao'
  titulo: string
  descricao: string
}

const produtos: Produto[] = [
  { id: 'mobilidade', titulo: 'Passeio ou transporte', descricao: 'Agende um passeio pro seu pet' },
  { id: 'hospedagem', titulo: 'Hospedagem', descricao: 'Reserve uma estadia no Hotel ZeloPets' },
  { id: 'nutricao', titulo: 'Plano alimentar', descricao: 'Assine uma entrega de ração personalizada' },
]

function RetratoDoPet({ pet }: { pet: Pet }) {
  return (
    <div className="retrato-do-pet">
      {pet.fotoUrl ? <img src={pet.fotoUrl} alt={pet.nome} /> : <span aria-hidden>{pet.nome.charAt(0)}</span>}
    </div>
  )
}

function SaudacaoDoZelo({ tutorNome, estadoPet }: { tutorNome: string; estadoPet: EstadoPetAtivo }) {
  if (estadoPet.tipo === 'carregando') {
    return <header className="saudacao-do-zelo" aria-busy="true"><p>Carregando seu pet...</p></header>
  }

  if (estadoPet.tipo === 'sem-pet') {
    return <header className="saudacao-do-zelo"><div><p>Olá, {tutorNome}!</p><h1>Cadastre seu primeiro pet pra começar</h1></div></header>
  }

  if (estadoPet.tipo === 'erro') {
    return <header className="saudacao-do-zelo"><div><p>Olá, {tutorNome}!</p><h1>Não deu pra carregar seus pets agora</h1></div></header>
  }

  return (
    <header className="saudacao-do-zelo">
      <RetratoDoPet pet={estadoPet.pet} />
      <div>
        <p>Olá, {tutorNome}!</p>
        <h1>Qual cuidado o {estadoPet.pet.nome} precisa hoje?</h1>
      </div>
    </header>
  )
}

function FaixaDeAgendamento({ estado }: { estado: EstadoAgendamento }) {
  if (estado.tipo === 'carregando') {
    return <section className="faixa-de-agendamento faixa-de-agendamento--carregando" aria-busy="true"><p>Buscando seus agendamentos...</p></section>
  }
  if (estado.tipo === 'erro') {
    return <section className="faixa-de-agendamento faixa-de-agendamento--erro"><p>Não deu pra carregar seus agendamentos agora.</p></section>
  }
  if (estado.tipo === 'vazio') {
    return <section className="faixa-de-agendamento faixa-de-agendamento--vazia"><p>Nenhum agendamento no momento</p></section>
  }
  return <section className="faixa-de-agendamento"><p>Próximo agendamento</p><p>{estado.dado.petNome} · {estado.dado.servico} · {estado.dado.horario}</p></section>
}

function PortaDeCuidado({ produto, destaque }: { produto: Produto; destaque?: boolean }) {
  return <button className={`porta-de-cuidado ${destaque ? 'porta-de-cuidado--destaque' : ''}`} type="button"><h2>{produto.titulo}</h2><p>{produto.descricao}</p></button>
}

function TrilhaDePortas({ itens }: { itens: Produto[] }) {
  return <nav className="trilha-de-portas">{itens.map((produto, indice) => <PortaDeCuidado key={produto.id} produto={produto} destaque={indice === 0} />)}</nav>
}

function AcessoAoZelinho() {
  return <button className="acesso-ao-zelinho" type="button" aria-label="Falar com o Zelinho">Falar com o Zelinho</button>
}

export function PainelDoTutor() {
  const tutorNome = 'Lucas'
  const [estadoPet, setEstadoPet] = useState<EstadoPetAtivo>({ tipo: 'carregando' })
  const [estadoAgendamento, setEstadoAgendamento] = useState<EstadoAgendamento>({ tipo: 'carregando' })

  useEffect(() => {
    const token = obterToken()
    if (!token) {
      setEstadoPet({ tipo: 'erro' })
      return
    }

    api
      .get<Pet[]>('/pets', token)
      .then((pets) => setEstadoPet(pets.length === 0 ? { tipo: 'sem-pet' } : { tipo: 'ok', pet: pets[0] }))
      .catch(() => setEstadoPet({ tipo: 'erro' }))
  }, [])

  useEffect(() => {
    // Ainda simulado: não existe endpoint de agendamentos nesta etapa.
    // simulação da chamada à API — troca pelo fetch real na etapa de integração
    const tempo = setTimeout(() => {
      setEstadoAgendamento({ tipo: 'vazio' })
    }, 600)
    return () => clearTimeout(tempo)
  }, [])

  return <main className="painel-do-tutor"><SaudacaoDoZelo tutorNome={tutorNome} estadoPet={estadoPet} /><FaixaDeAgendamento estado={estadoAgendamento} /><TrilhaDePortas itens={produtos} /><AcessoAoZelinho /></main>
}

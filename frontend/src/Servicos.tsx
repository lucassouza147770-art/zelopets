import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Dog,
  Pause,
  Play,
  Sparkles,
  Utensils,
  X,
} from 'lucide-react'
import { ApiError, api } from './api/client'

type Pet = { id: string; nome: string; fotoUrl?: string | null }
type Estado = 'carregando' | 'ok' | 'erro'

type Pacote = {
  id: string
  nome: string
  descricao?: string | null
  precoDiaria: number | string
  nivelConvivencia: string
  nivelContato: string
}

type Hospedagem = {
  id: string
  pet: Pet
  pacote: Pacote
  dataCheckin: string
  dataCheckout: string
  valorTotal: number | string
  status: string
}

type Plano = {
  id: string
  nome: string
  descricao?: string | null
  precoMensal: number | string
  tipoDieta?: string | null
}

type Assinatura = {
  id: string
  pet: Pet
  plano: Plano
  quantidadeRacaoKg: number
  consumoDiarioEstimadoG: number
  previsaoProximaEntrega?: string | null
  status: string
}

function moeda(valor: number | string) {
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function dataBR(valor: string | null | undefined, incluirHora = false) {
  if (!valor) return 'Não informado'
  return new Intl.DateTimeFormat('pt-BR', incluirHora ? { dateStyle: 'short', timeStyle: 'short' } : { dateStyle: 'short' }).format(new Date(valor))
}

function dataLocalMinima() {
  const agora = new Date()
  const deslocamento = agora.getTimezoneOffset() * 60_000
  return new Date(agora.getTime() - deslocamento).toISOString().slice(0, 16)
}

function MensagemEstado({ estado, texto }: { estado: Estado; texto: string }) {
  if (estado === 'carregando') return <p className="estado-servico" aria-busy="true">Carregando informações...</p>
  if (estado === 'erro') return <p className="mensagem-de-erro" role="alert">{texto}</p>
  return null
}

function CabecalhoServico({ titulo, descricao, imagem, Icone }: { titulo: string; descricao: string; imagem: string; Icone: typeof Dog }) {
  return (
    <section className="servico-hero">
      <img className="servico-hero__imagem" src={imagem} alt="" />
      <div className="servico-hero__icone"><Icone aria-hidden="true" size={27} /></div>
      <div><span className="servico-hero__eyebrow">ZeloPets para o seu pet</span><h2>{titulo}</h2><p>{descricao}</p></div>
    </section>
  )
}

function SeletorPet({ pets, petId, onChange }: { pets: Pet[]; petId: string; onChange: (id: string) => void }) {
  return (
    <label className="campo-servico">
      <span>Para qual pet?</span>
      <span className="campo-servico__controle"><Dog aria-hidden="true" size={18} /><select value={petId} onChange={(evento) => onChange(evento.target.value)} required><option value="">Selecione seu pet</option>{pets.map((pet) => <option value={pet.id} key={pet.id}>{pet.nome}</option>)}</select></span>
    </label>
  )
}

function BeneficioCoins({ texto }: { texto: string }) {
  return <div className="beneficio-coins"><Sparkles aria-hidden="true" size={18} /><span><strong>Ganhe e use ZeloCoins</strong>{texto}</span><ChevronRight aria-hidden="true" size={17} /></div>
}

export function TelaHotel({ token, onSessaoExpirada, onVoltar }: { token: string; onSessaoExpirada: () => void; onVoltar: () => void }) {
  const [pets, setPets] = useState<Pet[]>([])
  const [pacotes, setPacotes] = useState<Pacote[]>([])
  const [hospedagens, setHospedagens] = useState<Hospedagem[]>([])
  const [estado, setEstado] = useState<Estado>('carregando')
  const [petId, setPetId] = useState('')
  const [pacoteId, setPacoteId] = useState('')
  const [checkin, setCheckin] = useState('')
  const [checkout, setCheckout] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [mensagem, setMensagem] = useState<string | null>(null)

  async function carregar() {
    try {
      const [listaPets, listaPacotes, listaHospedagens] = await Promise.all([
        api.get<Pet[]>('/pets', token),
        api.get<Pacote[]>('/pacotes-hospedagem'),
        api.get<Hospedagem[]>('/hospedagens', token),
      ])
      setPets(listaPets); setPacotes(listaPacotes); setHospedagens(listaHospedagens)
      setPetId((atual) => atual || listaPets[0]?.id || '')
      setPacoteId((atual) => atual || listaPacotes[0]?.id || '')
      setEstado('ok')
    } catch (erro: unknown) {
      if (erro instanceof ApiError && erro.status === 401) { onSessaoExpirada(); return }
      setEstado('erro')
    }
  }

  useEffect(() => { void carregar() }, [token])

  const pacoteSelecionado = pacotes.find((pacote) => pacote.id === pacoteId)
  const noites = checkin && checkout ? Math.max(0, Math.ceil((new Date(checkout).getTime() - new Date(checkin).getTime()) / 86400000)) : 0
  const total = noites * Number(pacoteSelecionado?.precoDiaria ?? 0)

  async function reservar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!petId || !pacoteId || !checkin || !checkout || noites <= 0) return
    setEnviando(true); setMensagem(null)
    try {
      await api.post('/hospedagens', { petId, pacoteId, dataCheckin: new Date(checkin).toISOString(), dataCheckout: new Date(checkout).toISOString() }, token)
      setMensagem('Hospedagem solicitada com sucesso!')
      setCheckin(''); setCheckout('')
      await carregar()
    } catch (erro: unknown) {
      if (erro instanceof ApiError && erro.status === 401) { onSessaoExpirada(); return }
      setMensagem(erro instanceof ApiError ? erro.message : 'Não foi possível solicitar a hospedagem.')
    } finally { setEnviando(false) }
  }

  async function cancelar(id: string) {
    try { await api.delete(`/hospedagens/${id}`, token); await carregar() }
    catch (erro: unknown) { if (erro instanceof ApiError && erro.status === 401) onSessaoExpirada(); else setMensagem('Não foi possível cancelar esta hospedagem.') }
  }

  return (
    <main className="tela-interna tela-servico-completo" tabIndex={-1}>
      <button className="botao-voltar" type="button" onClick={onVoltar}>← Voltar</button>
      <CabecalhoServico titulo="Hotel ZeloPets" descricao="Uma estadia segura, confortável e do jeitinho do seu cão." imagem="/assets/fotos/04_hotel_pet_area_convivencia.jpg" Icone={Dog} />
      <BeneficioCoins texto="troque por desconto na hospedagem ou um mimo no próximo serviço." />
      <MensagemEstado estado={estado} texto="Não foi possível carregar os pacotes do hotel." />
      {estado === 'ok' && (
        <>
          <section className="catalogo-servico" aria-labelledby="titulo-pacotes">
            <div className="secao-servico__titulo"><div><span className="servico-hero__eyebrow">Escolha a experiência</span><h2 id="titulo-pacotes">Pacotes de hospedagem</h2></div><Sparkles aria-hidden="true" /></div>
            <div className="cards-opcoes-servico">{pacotes.map((pacote) => <button key={pacote.id} type="button" className={`card-opcao-servico ${pacoteId === pacote.id ? 'card-opcao-servico--ativo' : ''}`} onClick={() => setPacoteId(pacote.id)}><span className="card-opcao-servico__check">{pacoteId === pacote.id ? <CheckCircle2 size={17} /> : <ChevronRight size={17} />}</span><strong>{pacote.nome}</strong><span>{pacote.descricao}</span><b>{moeda(pacote.precoDiaria)} <small>/ diária</small></b></button>)}</div>
          </section>
          <section className="formulario-servico" aria-labelledby="titulo-reserva-hotel">
            <h2 id="titulo-reserva-hotel">Planejar estadia</h2>
            <form onSubmit={reservar}>
              <SeletorPet pets={pets} petId={petId} onChange={setPetId} />
              <div className="grade-campos-servico"><label className="campo-servico"><span>Check-in</span><span className="campo-servico__controle"><CalendarDays size={18} /><input type="datetime-local" min={dataLocalMinima()} value={checkin} onChange={(evento) => setCheckin(evento.target.value)} required /></span></label><label className="campo-servico"><span>Check-out</span><span className="campo-servico__controle"><CalendarDays size={18} /><input type="datetime-local" min={checkin || dataLocalMinima()} value={checkout} onChange={(evento) => setCheckout(evento.target.value)} required /></span></label></div>
              <div className="resumo-servico"><span>{noites > 0 ? `${noites} ${noites === 1 ? 'diária' : 'diárias'}` : 'Informe as datas'} </span><strong>{moeda(total)}</strong></div>
              {mensagem && <p className={mensagem.includes('sucesso') ? 'mensagem-de-sucesso' : 'mensagem-de-erro'} role="status">{mensagem}</p>}
              <button className="botao-agendar-passeio" type="submit" disabled={enviando || !petId || noites <= 0}>{enviando ? 'Solicitando...' : 'Solicitar hospedagem'}</button>
            </form>
          </section>
          <section className="historico-servico" aria-labelledby="titulo-hospedagens"><h2 id="titulo-hospedagens">Minhas hospedagens</h2>{hospedagens.length === 0 ? <p className="texto-apoio">Suas próximas estadias aparecerão aqui.</p> : <ul>{hospedagens.map((item) => <li key={item.id}><div><strong>{item.pet.nome} · {item.pacote.nome}</strong><span>{dataBR(item.dataCheckin)} a {dataBR(item.dataCheckout)}</span><b>{moeda(item.valorTotal)}</b></div><span className="chip-status chip-status--agendado">{item.status}</span>{item.status !== 'CANCELADO' && <button type="button" aria-label="Cancelar hospedagem" onClick={() => void cancelar(item.id)}><X size={18} /></button>}</li>)}</ul>}</section>
        </>
      )}
    </main>
  )
}

export function TelaNutricao({ token, onSessaoExpirada, onVoltar }: { token: string; onSessaoExpirada: () => void; onVoltar: () => void }) {
  const [pets, setPets] = useState<Pet[]>([])
  const [planos, setPlanos] = useState<Plano[]>([])
  const [assinaturas, setAssinaturas] = useState<Assinatura[]>([])
  const [estado, setEstado] = useState<Estado>('carregando')
  const [petId, setPetId] = useState('')
  const [planoId, setPlanoId] = useState('')
  const [quantidade, setQuantidade] = useState('5')
  const [consumo, setConsumo] = useState('300')
  const [enviando, setEnviando] = useState(false)
  const [mensagem, setMensagem] = useState<string | null>(null)

  async function carregar() {
    try {
      const [listaPets, listaPlanos, listaAssinaturas] = await Promise.all([api.get<Pet[]>('/pets', token), api.get<Plano[]>('/planos-nutricionais'), api.get<Assinatura[]>('/assinaturas-nutricionais', token)])
      setPets(listaPets); setPlanos(listaPlanos); setAssinaturas(listaAssinaturas); setPetId((atual) => atual || listaPets[0]?.id || ''); setPlanoId((atual) => atual || listaPlanos[0]?.id || ''); setEstado('ok')
    } catch (erro: unknown) { if (erro instanceof ApiError && erro.status === 401) { onSessaoExpirada(); return }; setEstado('erro') }
  }
  useEffect(() => { void carregar() }, [token])
  const planoSelecionado = planos.find((plano) => plano.id === planoId)
  const entrega = useMemo(() => { const kg = Number(quantidade); const g = Number(consumo); if (!kg || !g) return null; const data = new Date(); data.setDate(data.getDate() + Math.floor((kg * 1000) / g)); return data }, [quantidade, consumo])

  async function assinar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault(); if (!petId || !planoId || Number(quantidade) <= 0 || Number(consumo) <= 0) return
    setEnviando(true); setMensagem(null)
    try { await api.post('/assinaturas-nutricionais', { petId, planoId, quantidadeRacaoKg: Number(quantidade), consumoDiarioEstimadoG: Number(consumo) }, token); setMensagem('Assinatura criada com sucesso!'); await carregar() }
    catch (erro: unknown) { if (erro instanceof ApiError && erro.status === 401) { onSessaoExpirada(); return }; setMensagem(erro instanceof ApiError ? erro.message : 'Não foi possível criar a assinatura.') }
    finally { setEnviando(false) }
  }
  async function operar(id: string, operacao: 'pausar' | 'retomar' | 'cancelar') {
    try { await api.post(`/assinaturas-nutricionais/${id}/${operacao}`, {}, token); await carregar() }
    catch (erro: unknown) { if (erro instanceof ApiError && erro.status === 401) onSessaoExpirada(); else setMensagem('Não foi possível atualizar a assinatura.') }
  }

  return (
    <main className="tela-interna tela-servico-completo" tabIndex={-1}>
      <button className="botao-voltar" type="button" onClick={onVoltar}>← Voltar</button>
      <CabecalhoServico titulo="Nutrição" descricao="Planos práticos para manter a alimentação do seu pet em dia." imagem="/assets/fotos/08_nutricao_pet_ingredientes.jpg" Icone={Utensils} />
      <BeneficioCoins texto="use moedas para liberar frete grátis na próxima entrega." />
      <MensagemEstado estado={estado} texto="Não foi possível carregar os planos nutricionais." />
      {estado === 'ok' && <><section className="catalogo-servico" aria-labelledby="titulo-planos"><div className="secao-servico__titulo"><div><span className="servico-hero__eyebrow">Alimentação sob medida</span><h2 id="titulo-planos">Planos mensais</h2></div><Utensils aria-hidden="true" /></div><div className="cards-opcoes-servico">{planos.map((plano) => <button key={plano.id} type="button" className={`card-opcao-servico ${planoId === plano.id ? 'card-opcao-servico--ativo' : ''}`} onClick={() => setPlanoId(plano.id)}><span className="card-opcao-servico__check">{planoId === plano.id ? <CheckCircle2 size={17} /> : <ChevronRight size={17} />}</span><strong>{plano.nome}</strong><span>{plano.descricao}</span><b>{moeda(plano.precoMensal)} <small>/ mês</small></b></button>)}</div></section><section className="formulario-servico" aria-labelledby="titulo-assinatura"><h2 id="titulo-assinatura">Montar assinatura</h2><form onSubmit={assinar}><SeletorPet pets={pets} petId={petId} onChange={setPetId} /><div className="grade-campos-servico"><label className="campo-servico"><span>Ração disponível (kg)</span><input type="number" min="0.1" step="0.1" value={quantidade} onChange={(evento) => setQuantidade(evento.target.value)} required /></label><label className="campo-servico"><span>Consumo diário (g)</span><input type="number" min="1" value={consumo} onChange={(evento) => setConsumo(evento.target.value)} required /></label></div><div className="resumo-servico"><span>Próxima entrega estimada<br /><strong>{entrega ? dataBR(entrega.toISOString()) : 'Informe os dados'}</strong></span><strong>{moeda(planoSelecionado?.precoMensal ?? 0)} / mês</strong></div>{mensagem && <p className={mensagem.includes('sucesso') ? 'mensagem-de-sucesso' : 'mensagem-de-erro'} role="status">{mensagem}</p>}<button className="botao-agendar-passeio" type="submit" disabled={enviando || !petId}>{enviando ? 'Criando assinatura...' : 'Assinar plano nutricional'}</button></form></section><section className="historico-servico" aria-labelledby="titulo-assinaturas"><h2 id="titulo-assinaturas">Minhas assinaturas</h2>{assinaturas.length === 0 ? <p className="texto-apoio">Sua assinatura aparecerá aqui.</p> : <ul>{assinaturas.map((item) => <li key={item.id}><div><strong>{item.pet.nome} · {item.plano.nome}</strong><span><Clock3 size={14} /> Próxima entrega: {dataBR(item.previsaoProximaEntrega)}</span></div><span className={`chip-status ${item.status === 'PAUSADA' ? 'chip-status--pendente' : 'chip-status--agendado'}`}>{item.status}</span><div className="historico-servico__acoes">{item.status === 'ATIVA' ? <button type="button" onClick={() => void operar(item.id, 'pausar')}><Pause size={16} /> Pausar</button> : item.status === 'PAUSADA' ? <button type="button" onClick={() => void operar(item.id, 'retomar')}><Play size={16} /> Retomar</button> : null}{item.status !== 'CANCELADA' && <button type="button" onClick={() => void operar(item.id, 'cancelar')}><X size={16} /> Cancelar</button>}</div></li>)}</ul>}</section></>}
    </main>
  )
}

import { useState } from 'react'
import { ArrowLeft, CalendarDays, Check, ChevronDown, ImagePlus, PawPrint, Ruler, Scale, Sparkles, Utensils, Zap } from 'lucide-react'
import { api, ApiError } from './api/client'
import { obterToken } from './api/auth'

type Raca = { id: string; nome: string; imagemUrl: string }
const racasComuns: Raca[] = [
  { id: 'vira-lata', nome: 'Vira-lata', imagemUrl: '/assets/racas/vira_lata/foto.jpg' },
  { id: 'labrador', nome: 'Labrador', imagemUrl: '/assets/racas/labrador/foto.jpg' },
  { id: 'poodle', nome: 'Poodle', imagemUrl: '/assets/racas/poodle/foto.jpg' },
  { id: 'shih-tzu', nome: 'Shih Tzu', imagemUrl: '/assets/racas/shih_tzu/foto.jpg' },
  { id: 'golden-retriever', nome: 'Golden Retriever', imagemUrl: '/assets/racas/golden_retriever/foto.jpg' },
  { id: 'bulldog', nome: 'Bulldog', imagemUrl: '/assets/racas/bulldog/foto.jpg' },
  { id: 'husky', nome: 'Husky', imagemUrl: '/assets/racas/husky/foto.jpg' },
  { id: 'pastor-alemao', nome: 'Pastor Alemão', imagemUrl: '/assets/racas/pastor_alemao/foto.jpg' },
  { id: 'border-collie', nome: 'Border Collie', imagemUrl: '/assets/racas/border_collie/foto.jpg' },
  { id: 'salsicha', nome: 'Salsicha', imagemUrl: '/assets/racas/salsicha/foto.jpg' },
]

function GaleriaDeRacas({ selecionada, onSelecionar }: { selecionada: string | null; onSelecionar: (racaId: string) => void }) {
  return <div className="galeria-de-racas">{racasComuns.map((raca) => {
    const ativa = selecionada === raca.id
    const atributoRaca = { 'data-raca': raca.id }
    return <button {...atributoRaca} key={raca.id} type="button" aria-pressed={ativa} className={`galeria-de-racas__item ${ativa ? 'galeria-de-racas__item--selecionado' : ''}`} onClick={() => onSelecionar(raca.id)}><img src={raca.imagemUrl} alt="" /><span>{raca.nome}</span><span className="galeria-de-racas__check">{ativa ? <Check aria-hidden="true" size={14} /> : null}</span></button>
  })}</div>
}

type EstadoFoto = { tipo: 'ociosa' } | { tipo: 'enviando' } | { tipo: 'erro'; mensagem: string } | { tipo: 'pronta'; preview: string }

function BotaoAdicionarFotoReal({ estado, onArquivoSelecionado }: { estado: EstadoFoto; onArquivoSelecionado: (arquivo: File) => void }) {
  return <label className="botao-adicionar-foto-real">
    {estado.tipo === 'pronta' ? <><img src={estado.preview} alt="Prévia da foto do seu pet" className="botao-adicionar-foto-real__preview" /><strong>Trocar foto</strong><span>Foto adicionada</span></> : <><ImagePlus aria-hidden="true" size={25} /><strong>{estado.tipo === 'enviando' ? 'Preparando foto...' : 'Adicionar foto do seu pet'}</strong><span>JPG, PNG ou WebP · até 5 MB</span></>}
    {estado.tipo === 'erro' && <p className="botao-adicionar-foto-real__erro">{estado.mensagem}</p>}
    <input type="file" accept="image/*" disabled={estado.tipo === 'enviando'} onChange={(evento) => { const arquivo = evento.target.files?.[0]; if (arquivo) onArquivoSelecionado(arquivo) }} />
  </label>
}

function EscolhaDeRetrato({ racaSelecionada, onSelecionarRaca, estadoFoto, onArquivoSelecionado }: { racaSelecionada: string | null; onSelecionarRaca: (racaId: string) => void; estadoFoto: EstadoFoto; onArquivoSelecionado: (arquivo: File) => void }) {
  return <section className="escolha-de-retrato"><div className="cadastro-secao__titulo"><span className="cadastro-secao__icone"><PawPrint aria-hidden="true" size={19} /></span><div><span className="cadastro-secao__eyebrow">Identidade do pet</span><h2>Com quem seu pet mais se parece?</h2></div></div><p className="cadastro-secao__apoio">Escolha uma inspiração ou envie uma foto real.</p><GaleriaDeRacas selecionada={racaSelecionada} onSelecionar={onSelecionarRaca} /><BotaoAdicionarFotoReal estado={estadoFoto} onArquivoSelecionado={onArquivoSelecionado} /></section>
}

type Porte = 'PEQUENO' | 'MEDIO' | 'GRANDE'
type NivelEnergia = 'BAIXO' | 'MEDIO' | 'ALTO'

function formatarDataNascimento(valor: string) {
  const numeros = valor.replace(/\D/g, '').slice(0, 8)
  return numeros.replace(/^(\d{2})(\d)/, '$1/$2').replace(/^(\d{2})\/(\d{2})(\d)/, '$1/$2/$3')
}

function dataNascimentoParaApi(valor: string) {
  const partes = valor.split('/')
  if (partes.length !== 3 || partes.some((parte) => parte.length !== 2 && parte.length !== 4)) return undefined
  const [dia, mes, ano] = partes
  if (dia.length !== 2 || mes.length !== 2 || ano.length !== 4) return undefined
  return `${ano}-${mes}-${dia}`
}

function CamposEssenciais({ nome, porte, nivelEnergia, onMudarNome, onMudarPorte, onMudarNivelEnergia }: { nome: string; porte: Porte | null; nivelEnergia: NivelEnergia | null; onMudarNome: (valor: string) => void; onMudarPorte: (valor: Porte) => void; onMudarNivelEnergia: (valor: NivelEnergia) => void }) {
  return <section className="campos-essenciais"><div className="cadastro-secao__titulo"><span className="cadastro-secao__icone"><Sparkles aria-hidden="true" size={19} /></span><div><span className="cadastro-secao__eyebrow">O essencial</span><h2>Conte um pouco sobre ele</h2></div></div><label className="campo-cadastro campo-cadastro--nome">  <span><PawPrint aria-hidden="true" size={17} /> Nome do pet</span><small>Como você costuma chamar seu companheiro?</small><input value={nome} onChange={(e) => onMudarNome(e.target.value)} placeholder="Digite o nome do seu pet" /></label><fieldset><legend><Ruler aria-hidden="true" size={17} /> Qual é o porte?</legend><div className="opcoes-cadastro">{(['PEQUENO', 'MEDIO', 'GRANDE'] as Porte[]).map((opcao) => <button key={opcao} type="button" aria-pressed={porte === opcao} onClick={() => onMudarPorte(opcao)}><Ruler aria-hidden="true" size={19} /><strong>{opcao === 'MEDIO' ? 'Médio' : opcao === 'PEQUENO' ? 'Pequeno' : 'Grande'}</strong><span>{opcao === 'PEQUENO' ? 'até 10 kg' : opcao === 'MEDIO' ? '10 a 25 kg' : 'acima de 25 kg'}</span></button>)}</div></fieldset><fieldset><legend><Zap aria-hidden="true" size={17} /> Qual é o nível de energia?</legend><div className="opcoes-cadastro">{(['BAIXO', 'MEDIO', 'ALTO'] as NivelEnergia[]).map((opcao) => <button key={opcao} type="button" aria-pressed={nivelEnergia === opcao} onClick={() => onMudarNivelEnergia(opcao)}><Zap aria-hidden="true" size={19} /><strong>{opcao === 'MEDIO' ? 'Médio' : opcao === 'BAIXO' ? 'Calmo' : 'Aventureiro'}</strong><span>{opcao === 'BAIXO' ? 'Gosta de sossego' : opcao === 'MEDIO' ? 'Brinca na medida' : 'Não para quieto'}</span></button>)}</div></fieldset></section>
}

function DetalhesOpcionais({
  aberto,
  onAlternar,
  raca,
  pesoKg,
  dataNascimento,
  restricoesAlimentares,
  comportamento,
  onMudarRaca,
  onMudarPesoKg,
  onMudarDataNascimento,
  onMudarRestricoesAlimentares,
  onMudarComportamento,
}: {
  aberto: boolean
  onAlternar: () => void
  raca: string
  pesoKg: string
  dataNascimento: string
  restricoesAlimentares: string
  comportamento: string
  onMudarRaca: (valor: string) => void
  onMudarPesoKg: (valor: string) => void
  onMudarDataNascimento: (valor: string) => void
  onMudarRestricoesAlimentares: (valor: string) => void
  onMudarComportamento: (valor: string) => void
}) {
  return <section className="detalhes-opcionais"><button className="detalhes-opcionais__toggle" type="button" onClick={onAlternar}><span className="cadastro-secao__icone"><Sparkles aria-hidden="true" size={18} /></span><span><strong>{aberto ? 'Ocultar detalhes' : 'Adicionar mais detalhes'}</strong><small>{aberto ? 'Você pode editar quando quiser' : 'Opcional · ajuda a personalizar os cuidados'}</small></span><ChevronDown aria-hidden="true" size={19} className={aberto ? 'detalhes-opcionais__chevron--aberto' : ''} /></button>{aberto && <div className="detalhes-opcionais__conteudo"><label className="campo-cadastro"><span><PawPrint size={17} /> Raça, se souber</span><input type="text" value={raca} onChange={(e) => onMudarRaca(e.target.value)} placeholder="Ex.: Labrador" /></label><label className="campo-cadastro"><span><CalendarDays size={17} /> Data de nascimento</span><input type="text" inputMode="numeric" value={dataNascimento} onChange={(e) => onMudarDataNascimento(formatarDataNascimento(e.target.value))} placeholder="dd/mm/aaaa" maxLength={10} /></label><label className="campo-cadastro"><span><Scale size={17} /> Peso (kg)</span><input type="number" min="0" max="500" step="0.1" value={pesoKg} onChange={(e) => onMudarPesoKg(e.target.value)} placeholder="Ex.: 12,5" /></label><label className="campo-cadastro"><span><Utensils size={17} /> Restrições alimentares</span><input type="text" value={restricoesAlimentares} onChange={(e) => onMudarRestricoesAlimentares(e.target.value)} placeholder="Ex.: alergia a frango, sem glúten" /></label><label className="campo-cadastro"><span><Sparkles size={17} /> Comportamento</span><input type="text" value={comportamento} onChange={(e) => onMudarComportamento(e.target.value)} placeholder="Ex.: ansioso, sociável" /></label></div>}</section>
}

type EstadoEnvio = 'ocioso' | 'enviando' | 'erro' | 'sucesso'

function BotaoCriarGemeoDigital({ nomePet, habilitado, estado, onClick }: { nomePet: string; habilitado: boolean; estado: EstadoEnvio; onClick: () => void }) {
  return <div className="botao-criar-gemeo-digital-wrapper"><button className="botao-criar-gemeo-digital" type="button" onClick={onClick} disabled={!habilitado || estado === 'enviando'}>{estado === 'enviando' ? 'Criando perfil...' : nomePet ? `Criar perfil do ${nomePet}` : 'Criar perfil do pet'}</button>{estado === 'erro' && <p className="botao-criar-gemeo-digital__erro">Não deu pra criar o perfil agora. Tenta de novo.</p>}</div>
}

export function TelaCadastroDoPet({
  onPetCriado,
  onSessaoExpirada,
  onVoltar,
}: {
  onPetCriado: () => void
  onSessaoExpirada: () => void
  onVoltar: () => void
}) {
  const [racaSelecionada, setRacaSelecionada] = useState<string | null>(null)
  const [estadoFoto, setEstadoFoto] = useState<EstadoFoto>({ tipo: 'ociosa' })
  const [nome, setNome] = useState('')
  const [porte, setPorte] = useState<Porte | null>(null)
  const [nivelEnergia, setNivelEnergia] = useState<NivelEnergia | null>(null)
  const [raca, setRaca] = useState('')
  const [pesoKg, setPesoKg] = useState('')
  const [dataNascimento, setDataNascimento] = useState('')
  const [restricoesAlimentares, setRestricoesAlimentares] = useState('')
  const [comportamento, setComportamento] = useState('')
  const [detalhesAbertos, setDetalhesAbertos] = useState(false)
  const [estadoEnvio, setEstadoEnvio] = useState<EstadoEnvio>('ocioso')
  const camposObrigatoriosPreenchidos = Boolean(nome.trim() && porte && nivelEnergia)

  function separarLista(valor: string) {
    return valor.split(',').map((item) => item.trim()).filter(Boolean)
  }

  function handleArquivoSelecionado(arquivo: File) {
    if (arquivo.size > 5 * 1024 * 1024) {
      setEstadoFoto({ tipo: 'erro', mensagem: 'Essa imagem é muito grande. Tenta uma menor que 5MB.' })
      return
    }
    setEstadoFoto({ tipo: 'enviando' })
    const leitor = new FileReader()
    leitor.onload = () => {
      const imagem = new Image()
      imagem.onload = () => {
        const escala = Math.min(1, 512 / Math.max(imagem.width, imagem.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1, Math.round(imagem.width * escala))
        canvas.height = Math.max(1, Math.round(imagem.height * escala))
        const contexto = canvas.getContext('2d')
        if (!contexto) {
          setEstadoFoto({ tipo: 'erro', mensagem: 'Seu navegador não conseguiu preparar essa foto.' })
          return
        }
        contexto.drawImage(imagem, 0, 0, canvas.width, canvas.height)
        setEstadoFoto({ tipo: 'pronta', preview: canvas.toDataURL('image/jpeg', 0.78) })
      }
      imagem.onerror = () => setEstadoFoto({ tipo: 'erro', mensagem: 'Não deu pra processar essa foto. Tenta outra.' })
      imagem.src = leitor.result as string
    }
    leitor.onerror = () => setEstadoFoto({ tipo: 'erro', mensagem: 'Não deu pra ler essa foto. Tenta outra.' })
    leitor.readAsDataURL(arquivo)
  }

  async function handleCriarGemeoDigital() {
    setEstadoEnvio('enviando')
    try {
      const token = obterToken()
      if (!token) {
        onSessaoExpirada()
        return
      }
      await api.post('/pets', {
        nome: nome.trim(),
        porte,
        nivelEnergia,
        raca: raca.trim() || undefined,
        pesoKg: pesoKg.trim() ? Number(pesoKg) : undefined,
        dataNascimento: dataNascimentoParaApi(dataNascimento),
        restricoesAlimentares: separarLista(restricoesAlimentares),
        comportamento: separarLista(comportamento),
        fotoUrl: estadoFoto.tipo === 'pronta' ? estadoFoto.preview : undefined,
      }, token)
      setEstadoEnvio('sucesso')
      onPetCriado()
      setNome('')
      setPorte(null)
      setNivelEnergia(null)
      setRacaSelecionada(null)
      setRaca('')
      setPesoKg('')
      setDataNascimento('')
      setRestricoesAlimentares('')
      setComportamento('')
      setEstadoFoto({ tipo: 'ociosa' })
    } catch (erro) {
      setEstadoEnvio('erro')
      if (erro instanceof ApiError && erro.status === 401) {
        onSessaoExpirada()
      }
    }
  }

  return <main className="tela-cadastro-do-pet"><button className="botao-voltar" type="button" onClick={onVoltar}><ArrowLeft aria-hidden="true" size={20} /> Voltar</button><div className="cadastro-pet__marca"><PawPrint aria-hidden="true" size={22} /><span>Vamos conhecer seu pet</span></div><h1>Crie um perfil cheio de personalidade</h1><p className="cadastro-pet__intro">Esses detalhes ajudam o ZeloPets a encontrar os melhores cuidados para vocês.</p><EscolhaDeRetrato racaSelecionada={racaSelecionada} onSelecionarRaca={setRacaSelecionada} estadoFoto={estadoFoto} onArquivoSelecionado={handleArquivoSelecionado} /><CamposEssenciais nome={nome} porte={porte} nivelEnergia={nivelEnergia} onMudarNome={setNome} onMudarPorte={setPorte} onMudarNivelEnergia={setNivelEnergia} /><DetalhesOpcionais aberto={detalhesAbertos} onAlternar={() => setDetalhesAbertos((valor) => !valor)} raca={raca} pesoKg={pesoKg} dataNascimento={dataNascimento} restricoesAlimentares={restricoesAlimentares} comportamento={comportamento} onMudarRaca={setRaca} onMudarPesoKg={setPesoKg} onMudarDataNascimento={setDataNascimento} onMudarRestricoesAlimentares={setRestricoesAlimentares} onMudarComportamento={setComportamento} /><BotaoCriarGemeoDigital nomePet={nome} habilitado={camposObrigatoriosPreenchidos} estado={estadoEnvio} onClick={handleCriarGemeoDigital} />{estadoEnvio === 'sucesso' && <p className="botao-criar-gemeo-digital__sucesso">Perfil criado.</p>}</main>
}

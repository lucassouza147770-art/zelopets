const baseUrl = process.env.API_URL ?? 'http://127.0.0.1:3000'
const email = process.env.DEMO_EMAIL ?? 'demo03@demo.zelopets.local'
const login = await fetch(`${baseUrl}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, senha: 'demo1234' }),
})

if (!login.ok) {
  console.log('FALHOU login demo')
  process.exitCode = 1
} else {
  const { accessToken } = await login.json()
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` }
  const enviar = async (texto) => {
    const resposta = await fetch(`${baseUrl}/zelinho/mensagens`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ texto }),
    })
    return resposta.ok ? resposta.json() : null
  }
  const casos = [
    ['oi', (r) => r?.intencao === 'saudacao' && r.sugestoes?.length >= 4],
    ['quero agendar um passeio pro Thor amanhã', (r) => r?.intencao === 'agendar_passeio'],
    ['quanto custa o hotel?', (r) => ['reservar_hotel', 'pacotes_precos_hotel'].includes(r?.intencao)],
    ['planos de ração', (r) => ['planos_nutricao', 'previsao_racao'].includes(r?.intencao)],
    ['quando vai acabar minha ração?', (r) => ['previsao_racao', 'planos_nutricao'].includes(r?.intencao)],
    ['qual meu próximo agendamento?', (r) => ['proximo_cuidado', 'minha_agenda'].includes(r?.intencao)],
    ['quantas moedas eu tenho?', (r) => r?.intencao === 'saldo_moedas'],
    ['asdfgh', (r) => r?.estado?.falhas_seguidas === 1 && r.sugestoes?.length === 4],
    ['blablabla xyz', (r) => r?.handoff?.motivo === 'FALHA_DE_ENTENDIMENTO' && Boolean(r.protocolo)],
    ['meu cachorro se machucou no hotel', (r) => r?.handoff?.prioridade === 'ALTA'],
  ]
  let passou = 0
  for (const [texto, teste] of casos) {
    const resultado = await enviar(texto)
    const ok = teste(resultado)
    passou += ok ? 1 : 0
    console.log(`${ok ? 'PASSOU' : 'FALHOU'} ${texto}`)
  }
  console.log(`Resultado demo: ${passou}/${casos.length}`)
  process.exitCode = passou === casos.length ? 0 : 1
}

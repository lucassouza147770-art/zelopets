# Estados da interface

Os estados tornam cada tela compreensível durante uma ação, uma espera ou uma
falha. Eles evitam que o usuário interprete uma interface silenciosa como
travada e mantêm a prioridade visual das ações.

## Login

- `ocioso`: formulário disponível para login ou registro.
- `enviando`: botão principal desabilitado e texto `Enviando...`, evitando
  submissões duplicadas enquanto a integração de autenticação estiver ativa.
- `erro`: mensagem específica para login ou registro, preservando os campos
  para correção sem perda de contexto.

## Cadastro do pet

### Campos e botão principal

- O botão começa desabilitado enquanto nome, porte e nível de energia não
  estiverem preenchidos.
- Quando os três campos obrigatórios existem, o botão é habilitado e seu texto
  passa a identificar o pet.
- `enviando`: o botão fica desabilitado e mostra `Criando perfil...`.
- `erro`: uma mensagem abaixo do botão informa que a tentativa pode ser
  repetida.

Essa validação reduz erros antes da futura chamada a `POST /pets` e comunica
claramente o que falta para continuar.

### Foto

- `ociosa`: convite para adicionar uma imagem.
- `enviando`: leitura local em andamento e input desabilitado.
- `pronta`: mostra uma prévia da imagem escolhida.
- `erro`: informa arquivo acima de 5 MB ou falha na leitura.

O preview confirma a escolha sem depender ainda de upload para a API.

## Painel do tutor

### Faixa de agendamento

- `carregando`: `aria-busy="true"` e mensagem de busca enquanto os dados são
  obtidos.
- `ok`: exibe pet, serviço e horário do próximo agendamento.
- `vazio`: comunica que não há agendamento, em vez de deixar um espaço
  ambíguo.
- `erro`: informa que os dados não puderam ser carregados.

Esses estados distinguem ausência de dados, espera e falha. A faixa continua
informativa e não clicável, coerente com o uso do verde-menta como respiro.

## Classes de estilo

Os ganchos de estado ficam em `frontend/src/styles/cores.css`, incluindo
`--carregando`, `--erro`, `:disabled`, erro de formulário, seleção de raça e
preview da foto. As integrações reais de API permanecem como próxima etapa;
os estados já deixam o contrato visual preparado para elas.
# Spec: Free Trial do Polyglot, hardening do Swagger e configuração de email (MailJet)

Status: rascunho para discussão
Autor: Raphael
Contexto: fork do LiteLLM. Polyglot é a IA interna que roda sobre o modelo QWEN

Esta spec cobre três entregas independentes que podem virar PRs separados:

1. Desativar o Swagger / docs públicos do proxy
2. Endpoint fechado para um sistema externo criar uma chave de free trial (teto de gasto) e disparar email
3. Aba de configuração da integração de email (MailJet) na Admin UI

---

## 1. Desativar o Swagger

### Situação atual

O proxy monta o FastAPI em `litellm/proxy/proxy_server.py:1217` já lendo três helpers de `litellm/proxy/utils.py`:

- `_get_docs_url()` (`utils.py:5782`) -> Swagger UI, default `/`
- `_get_redoc_url()` (`utils.py:5765`) -> ReDoc, default `/redoc`
- `_get_openapi_url()` (`utils.py:5799`) -> `openapi.json`, default `/openapi.json`

Cada um já respeita um ENV de desligamento: `NO_DOCS`, `NO_REDOC`, `NO_OPENAPI`. Quando `True`, o helper retorna `None` e o FastAPI não expõe a rota.

### Decisão a tomar

Existem dois níveis, e vale escolher explicitamente:

- Opção A (config, reversível): setar no ambiente do deploy
  - `NO_DOCS=true`
  - `NO_REDOC=true`
  - `NO_OPENAPI=true`
  Zero mudança de código. Risco: qualquer um com acesso ao ambiente religa.

- Opção B (hardening, difícil de religar): além de A, fixar o default no código para `None` mesmo sem ENV, de forma que o padrão do produto passe a ser "docs desligado" e só ligue com um ENV explícito de opt-in (ex.: `ENABLE_DOCS=true`). Isso inverte o default atual (que é ligado).

Decisão: **Opção B**. Inverter o default para "docs desligado". As docs (Swagger, ReDoc, `openapi.json`) só são expostas quando um ENV explícito de opt-in estiver ligado, ex. `ENABLE_DOCS=true`, cujo default é `false`. Sem esse ENV, os três helpers retornam `None`. Isso muda o comportamento atual do produto (hoje ligado por default), então documentar a mudança no changelog e conferir que nenhum ambiente interno dependia das docs abertas.

### Atenção ao redirect da raiz

`proxy_server.py:1930` faz um redirect da raiz que depende de `_get_docs_url()`. Com `NO_DOCS=true`, `docs_url` vira `None`; confirmar que a rota `/` não quebra (deve cair no `root_redirect_url` ou 404 limpo). Cobrir isso no teste.

### Testes

Em `tests/test_litellm/proxy/` (espelhando `test_utils.py` ou o arquivo mapeado):

- `NO_DOCS=true` -> `_get_docs_url()` retorna `None`; idem redoc/openapi
- ENV ausente -> mantém defaults atuais (`/`, `/redoc`, `/openapi.json`), garantindo que não quebramos quem depende disso
- Teste de app: subir o app com os três ENVs e assertar que `GET /openapi.json`, `GET /redoc` e a rota de docs retornam 404

### Prova de fix

Subir o proxy local com os ENVs setados e mostrar:

```bash
curl -sS -o /dev/null -w "%{http_code}\n" http://localhost:4000/openapi.json
curl -sS -o /dev/null -w "%{http_code}\n" http://localhost:4000/redoc
```

Esperado: `404` em ambos.

---

## 2. Endpoint fechado de Free Trial

### Objetivo

Um sistema externo chama um endpoint autenticado por chave de ENV, passando dados de um lead. O endpoint:

1. Valida os campos (formato) e a unicidade de email, nome e telefone
2. Cria uma virtual key com teto de gasto de R$ 5.000 (vitalício), restrita ao modelo do Polyglot (QWEN)
3. Envia um email para o endereço recebido, contendo o nome e o @ do Instagram recebidos
4. Retorna a chave criada para o sistema externo

### Resposta à pergunta "dá para limitar um token por gasto?"

Sim, nativamente. A virtual key do LiteLLM aceita `max_budget` (teto em spend) e opcionalmente `budget_duration` (janela de reset). Ver `LiteLLM_VerificationToken` e `generate_key_helper_fn` em `litellm/proxy/management_endpoints/key_management_endpoints.py:3531`, parâmetros `key_max_budget` / `key_budget_duration`. Sem `budget_duration`, o teto é vitalício e não reseta, que é o comportamento certo para um free trial de teto único. Quando o spend acumulado cruza `max_budget`, as chamadas daquela key passam a ser recusadas.

Três ressalvas que mudam o desenho:

- **Moeda: BRL (decidido).** O `max_budget` é um `float` e o LiteLLM acumula spend a partir do preço do modelo em `model_prices_and_context_window.json` (ou do custo por token configurado), historicamente em USD. Como o teto tem que ser literalmente R$ 5.000, vamos cadastrar o custo do modelo QWEN do Polyglot em reais (input/output cost por token em BRL). Assim o spend acumula em reais e `max_budget=5000` significa R$ 5.000 de verdade. Consequência: o custo desse modelo passa a estar em BRL enquanto o resto do catálogo pode estar em USD; o número que aparece nos dashboards de spend dessa key deve ser lido como reais. Isolar isso deixando claro na config do modelo que a unidade é BRL, para ninguém somar cegamente com spend em dólar de outros modelos
- **Key não pode pertencer a um team.** `max_budget` de key só é aplicado quando a key é standalone; se ela pertencer a um team, o budget do team é que vale (ver nota em `litellm/proxy/_types.py:2440`). A key de trial deve ser criada sem `team_id`
- **Restrição de modelo.** Passar `models=["<id-do-qwen-polyglot>"]` na criação da key para que o trial não consiga chamar outros modelos e queimar orçamento fora do escopo

### Contrato do endpoint

Rota nova, prefixada para deixar claro que é superfície pública/externa. Sugestão:

`POST /free-trial/register` (ou `/public/free-trial`)

Autenticação: header com a chave de ENV. Sugestão de ENV: `FREE_TRIAL_API_KEY`. O endpoint compara em tempo constante (`hmac.compare_digest`) contra o valor do ENV. Sem esse header válido -> `401`. Se o ENV não estiver setado, o endpoint deve responder `503` (feature desligada), nunca "aberto por engano".

Request body (JSON):

```json
{
  "name": "Fulano de Tal",
  "email": "fulano@exemplo.com",
  "phone": "+5585999998888",
  "instagram": "@fulano"
}
```

Validação (Pydantic model, tudo tipado, sem `dict[str, Any]`):

- `name`: obrigatório, não vazio, trim; normalizar para checagem de duplicidade (case/espaços)
- `email`: obrigatório, formato válido (`EmailStr`), normalizado para lower-case
- `phone`: obrigatório, normalizado para E.164 (decidir: validar com `phonenumbers` ou regex simples). A normalização importa porque duplicidade tem que pegar "+55 85 9999-8888" e "5585999998888" como o mesmo número
- `instagram`: obrigatório, normalizar o `@` (aceitar com ou sem `@`, guardar de forma canônica)

Unicidade: email, nome e telefone não podem repetir. Isso exige persistência e uma consulta. Ver "Armazenamento" abaixo.

Response de sucesso (`201`):

```json
{
  "key": "sk-...",
  "max_budget": 5000,
  "currency": "BRL"
}
```

O cliente externo **não deve tomar conhecimento do modelo** por trás do Polyglot. A restrição de modelo (`models=[<qwen>]`) é aplicada internamente na key, mas o id do modelo nunca aparece na response, nem em mensagens de erro, nem em qualquer campo devolvido ao sistema externo. O nome público é sempre "Polyglot".

Erros:

- `400` payload inválido (formato)
- `401` chave de ENV ausente/errada
- `409` email, nome ou telefone já cadastrado (informar qual campo colidiu, sem vazar dados de terceiros)
- `503` feature desligada (`FREE_TRIAL_API_KEY` não configurada) ou email não configurado

### Armazenamento e unicidade

Precisamos guardar (email, nome, telefone, instagram) para (a) impedir duplicidade e (b) auditar quem pegou trial. Duas opções:

- Opção A: reaproveitar metadata da key. Ruim para unicidade, porque exigiria varrer todas as keys e parsear metadata a cada request; não há índice, não escala, e é frágil
- Opção B (recomendada): tabela dedicada, ex. `LiteLLM_FreeTrialRegistration`, com colunas `email` (unique), `phone_normalized` (unique), `name_normalized` (unique), `instagram`, `key_token` (fk lógica para a key gerada), `created_at`. As constraints UNIQUE no banco é que garantem "não pode repetir" de forma correta sob concorrência; não confiar só em "SELECT antes de INSERT", que tem corrida. Tentativa de duplicar -> capturar violação de unique -> `409`

Isso implica migração Prisma nova. Manter a migração isolada nesse PR.

### Fluxo interno

O endpoint público deve ser fino e delegar a criação da key para a maquinaria existente (`generate_key_helper_fn`), não reimplementar geração de token. Passos:

1. Autenticar via `FREE_TRIAL_API_KEY`
2. Validar/normalizar payload (Pydantic)
3. Abrir transação: inserir em `LiteLLM_FreeTrialRegistration` (unique constraints fazem o gate de duplicidade). Se violar unique -> `409`
4. Criar a key: `max_budget=<5000 em USD ou BRL conforme decisão de moeda>`, `budget_duration=None`, `models=[<qwen>]`, sem `team_id`, `key_alias` tipo `free-trial-<slug do nome>`, `metadata` com origem `"free_trial"` e o instagram
5. Persistir o `key_token` na linha de registro
6. Enviar o email (ver seção 3 para o transporte). Política decidida: a key não é desfeita se o email falhar. Tentar enviar; sucesso -> gravar `email_sent=true`; falha -> logar e deixar `email_sent=false` para reprocesso automático (ver "Reprocesso de email" abaixo). O endpoint retorna `201` de qualquer forma
7. Retornar a key

### Reprocesso de email (retry)

A linha de registro carrega o estado do envio, não só um booleano: `email_sent` (bool), `email_attempts` (int), `email_last_error` (texto), `email_last_attempt_at` (timestamp). Isso torna o registro a fila durável, sem serviço externo.

Nota sobre a ideia inicial de BullMQ: BullMQ é uma lib de fila Node/TypeScript sobre Redis; este backend é Python. Trazer BullMQ obrigaria subir um worker Node só para isso, o que não se justifica. O projeto já tem a infra certa em Python: APScheduler (`AsyncIOScheduler`, ver `litellm/proxy/proxy_server.py:7835` e os vários `scheduler.add_job`) e um `PodLockManager` para garantir que só um pod execute um job quando há réplicas (`litellm/proxy/db/db_transaction_queue/pod_lock_manager.py`). Managers de background já seguem esse padrão (rotação de key em `litellm/proxy/common_utils/key_rotation_manager.py`, cleanups).

Desenho do retry, reusando esse padrão:

- Um `FreeTrialEmailRetryManager` registrado como job periódico no scheduler (ex. a cada 1 min), protegido pelo `PodLockManager` para não duplicar envio entre pods
- A cada tick: buscar registros com `email_sent=false` e `email_attempts < max_tentativas`, respeitando um backoff (só reprocessar se `now - email_last_attempt_at` passou do intervalo do backoff, que cresce com o número de tentativas)
- Tentar enviar; sucesso -> `email_sent=true`; falha -> incrementar `email_attempts`, gravar `email_last_error` e `email_last_attempt_at`
- Teto de tentativas (ex. 5). Ao estourar, parar de tentar e deixar visível para intervenção manual (o registro fica com `email_sent=false` e `email_attempts` no teto; um filtro simples lista os "falhados de vez")

Se no futuro o volume justificar uma fila real com Redis, o equivalente Python idiomático seria `arq` (fila async sobre Redis) ou Celery, não BullMQ. Mas para o volume de um free trial, o job APScheduler + estado no banco é suficiente e não adiciona dependência.

### Conteúdo do email

Destinatário: o `email` recebido no payload. Corpo deve conter o `name` e o `instagram` (com `@`) recebidos. Reusar o `send_email` existente (`litellm/proxy/utils.py:5011`), que já monta MIME e envia por SMTP. Template HTML simples, separado do template de budget alert. Assunto sugerido: "Seu acesso de teste ao Polyglot".

### Segurança e abuso

- Rate limit / proteção do endpoint público: mesmo com a chave de ENV, um vazamento dela permitiria criar keys em massa. Considerar rate limit por IP e/ou um limite diário de registros
- Nunca logar a `FREE_TRIAL_API_KEY` nem a key gerada em claro nos logs
- A chave de ENV é um segredo; não commitar, ler de `.env`
- Validar tamanho máximo dos campos para não usar o registro como vetor de storage abuse

### Testes (o requisito de qualidade do CLAUDE.md pega aqui)

Testes de regressão que falhariam se o comportamento quebrasse:

- Auth: sem header / header errado -> `401`; ENV não setado -> `503`
- Duplicidade: mesmo email (case/whitespace diferente) -> `409`; mesmo telefone em formato diferente -> `409`; mesmo nome normalizado -> `409`. Estes são o coração do requisito "não podem ser repetidos"
- Concorrência: duas requisições simultâneas com o mesmo email -> exatamente uma cria, a outra recebe `409` (garantido pela unique constraint, não por SELECT prévio)
- Budget: key criada tem `max_budget` == valor esperado, `budget_duration` nulo, `team_id` nulo, `models` restrito ao QWEN. Simular spend acima do teto e assertar que a chamada é recusada (usar o caminho de enforcement real de budget, injetando um custo, não mockando o resultado final)
- Email: `send_email` é chamado com destinatário == email do payload e corpo contendo `name` e o `instagram`. Injetar o sender de email como dependência para poder mockar no teste (não monkeypatch)
- Retry: registro com `email_sent=false` é reprocessado pelo `FreeTrialEmailRetryManager`; ao enviar com sucesso vira `email_sent=true`; ao falhar, `email_attempts` incrementa e o backoff é respeitado; ao atingir o teto, para de tentar. Testar injetando um transporte que falha N vezes e depois sucede
- Não-vazamento do modelo: a response `201` e todas as mensagens de erro não contêm o id do modelo QWEN em nenhum campo
- Validação: instagram com e sem `@` normalizam para o mesmo valor; telefone inválido -> `400`

### Prova de fix (real, não mock)

Com o proxy local rodando e `FREE_TRIAL_API_KEY` setada:

```bash
curl -sS -X POST http://localhost:4000/free-trial/register \
  -H "Authorization: Bearer $FREE_TRIAL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name":"Teste Real","email":"seu-email-real@dominio.com","phone":"+5585999998888","instagram":"@teste"}'
```

Mostrar: o `201` com a key, o email real chegando na caixa, e uma segunda chamada com o mesmo email retornando `409`. Em seguida, usar a key retornada numa chamada de chat real ao QWEN e mostrar o spend subindo nos logs (`http://localhost:4000/ui/?page=logs`).

---

## 3. Aba de configuração de email (MailJet)

### Situação atual

O envio de email hoje é SMTP puro, configurado só por ENV (`litellm/proxy/utils.py:5011`): `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_SENDER_EMAIL`, `SMTP_TLS`. Não há UI para isso nem persistência em banco; é tudo ambiente.

### O que muda com MailJet

MailJet oferece dois caminhos:

- Caminho 1 (relay SMTP, recomendado para "de início"): o MailJet expõe um relay SMTP em `in-v3.mailjet.com:587`, onde o usuário é a API Key e a senha é a Secret Key. Ou seja, dá para usar o `send_email` atual sem escrever nenhum código de envio novo; é só configuração:
  - `SMTP_HOST=in-v3.mailjet.com`
  - `SMTP_PORT=587`
  - `SMTP_USERNAME=<MJ_APIKEY_PUBLIC>`
  - `SMTP_PASSWORD=<MJ_APIKEY_PRIVATE>`
  - `SMTP_SENDER_EMAIL=<remetente verificado no MailJet>`
- Caminho 2 (HTTP Send API v3.1): integração propriamente dita via API do MailJet. Melhor observabilidade (status por mensagem, templates do MailJet), mas exige um novo módulo de envio. Escopo maior

Recomendação: começar pelo Caminho 1 (relay SMTP) para desbloquear o email do free trial sem código de envio novo, e deixar o Caminho 2 como evolução se precisarmos de templates/tracking do MailJet.

### O que a "aba" precisa

Uma aba nova na Admin UI (`ui/litellm-dashboard`) para configurar a integração de email, com:

- Campos: host, porta, usuário (API key), senha (secret key), remetente, TLS on/off, e um seletor de provedor ("SMTP genérico" | "MailJet")
- Botão "Enviar email de teste" que dispara um email para um endereço informado e mostra sucesso/erro
- Mascarar a secret key na UI; nunca devolvê-la em claro no GET das settings

Isso exige decidir **onde as credenciais ficam guardadas**, porque hoje é só ENV:

- Opção A: continuar em ENV e a aba ser somente leitura + botão de teste. Simples, mas "configurar pela UI" fica limitado
- Opção B: persistir as settings de email numa tabela de configuração do proxy (há precedente de settings persistidas no LiteLLM). A UI grava/lê dessa fonte, e o `send_email` passa a resolver as credenciais dessa config (com ENV como fallback). Secret encriptada em repouso, nunca retornada em claro

Decisão: **Opção B**. As settings de email ficam persistidas numa tabela de configuração do proxy; a UI grava e lê dessa fonte, e o `send_email` resolve as credenciais da config persistida com ENV como fallback. A secret key é encriptada em repouso e nunca retornada em claro no GET. Isso implica migração nova e alterar `send_email` para deixar de ler direto do ENV, passando a resolver a config via uma dependência injetada (para dar para testar sem tocar em ENV global).

### Segurança

- Secret key encriptada em repouso; endpoint de leitura retorna mascarado
- Endpoints de settings restritos a admin (reusar o guard de admin da UI)
- Email de teste com rate limit para não virar open relay de spam interno
- Validar o remetente contra domínios verificados quando possível

### Testes

- `send_email` resolve credenciais da fonte configurada (config persistida com fallback para ENV), injetando a config como dependência
- Endpoint de settings: escrita como admin funciona; não-admin -> `403`; GET nunca retorna a secret em claro
- Email de teste: chama o transporte com os parâmetros corretos (mock do transporte via injeção)

### Prova de fix

Configurar as credenciais do MailJet na aba, clicar em "Enviar email de teste" para um endereço real e mostrar o email chegando. Documentar a URL da aba (ex.: `http://localhost:4000/ui/?page=email-settings`), onde clicar e quais campos preencher, para você mesmo rodar e anexar os screenshots.

---

## Ordem de entrega sugerida

1. Swagger off (Opção B, default `false`): rápido, desbloqueia hardening de produção
2. Email via MailJet relay (Caminho 1) já resolvendo credenciais da config persistida: desbloqueia o email do free trial
3. Endpoint de free trial + reprocesso de email: depende do email já funcionando para a prova de fix real
4. Aba de configuração de email na UI (Opção B, persistência): a tela que escreve na config consumida pelos itens 2 e 3

## Decisões fechadas

1. Moeda do teto: **BRL**. Cadastrar o preço do QWEN em reais para o spend acumular em BRL e `max_budget=5000` valer R$ 5.000
2. Swagger: **Opção B**, docs desligado por default; ligar só via `ENABLE_DOCS=true` (default `false`)
3. Falha de email: mantém a key, retorna `201` com `email_sent=false`, e um job APScheduler reprocessa com backoff e teto de tentativas (não BullMQ, que é Node)
4. Aba de email: **configurável pela UI com persistência** (Opção B), secret encriptada e mascarada
5. Modelo: restrição interna por `models=[<qwen>]`, mas o id do modelo nunca é exposto ao cliente externo (response e erros não mencionam o modelo; nome público é "Polyglot")

## Decisões ainda em aberto

1. Rate limit do endpoint público: deixado de lado por ora. Fica registrado como risco (vazamento da `FREE_TRIAL_API_KEY` permitiria criação em massa de keys); revisitar antes de expor o endpoint para produção
2. Nome/ID exato do modelo QWEN do Polyglot a ser usado no `models` da key (precisa do valor concreto na hora de codar, mas não bloqueia o desenho)

<h1 align="center">
        🚅 LiteLLM
    </h1>
    <p align="center">
        <p align="center">LiteLLM AI Gateway
        </p>
        <p align="center">Gateway de IA de código aberto para mais de 100 LLMs. Auto-hospedado. Pronto para empresas. Chame qualquer LLM no formato OpenAI.</p>
        <p align="center">
        <a href="https://render.com/deploy?repo=https://github.com/BerriAI/litellm" target="_blank" rel="nofollow"><img src="https://render.com/images/deploy-to-render-button.svg" alt="Deploy to Render" height="40"></a>
        <a href="https://railway.com/deploy/RhvhdC?referralCode=7mRv9K&utm_medium=integration&utm_source=template&utm_campaign=generic"><img src="https://railway.com/button.svg" alt="Deploy on Railway" height="40"></a>
        <a href="https://console.aws.amazon.com/cloudshell/home" target="_blank" rel="nofollow"><img src="./.github/deploy-on-aws.png" alt="Deploy on AWS" height="40"></a>
        <a href="https://ssh.cloud.google.com/cloudshell/editor?cloudshell_git_repo=https%3A%2F%2Fgithub.com%2FBerriAI%2Flitellm&cloudshell_workspace=terraform%2Flitellm%2Fgcp%2Fexamples%2Fdefault&cloudshell_tutorial=TUTORIAL.md&cloudshell_image=gcr.io/ds-artifacts-cloudshell/deploystack_custom_image&shellonly=true" target="_blank" rel="nofollow"><img src="./.github/deploy-on-gcp.png" alt="Deploy on GCP" height="40"></a>
        </p>
    </p>
<h4 align="center"><a href="https://docs.litellm.ai/docs/simple_proxy" target="_blank">LiteLLM Proxy Server (AI Gateway)</a> | <a href="https://docs.litellm.ai/docs/enterprise#hosted-litellm-proxy" target="_blank"> Proxy Hospedado</a> | <a href="https://litellm.ai/enterprise"target="_blank">Plano Enterprise</a> | <a href="https://www.litellm.ai/ai-gateway" target="_blank">Site</a></h4>
<h4 align="center">
    <a href="https://pypi.org/project/litellm/" target="_blank">
        <img src="https://img.shields.io/pypi/v/litellm.svg" alt="PyPI Version">
    </a>
    <a href="https://github.com/BerriAI/litellm" target="_blank">
        <img src="https://img.shields.io/github/stars/BerriAI/litellm.svg?style=social" alt="GitHub Stars">
    </a>
    <a href="https://www.ycombinator.com/companies/berriai">
        <img src="https://img.shields.io/badge/Y%20Combinator-W23-orange?style=flat-square" alt="Y Combinator W23">
    </a>
    <a href="https://wa.link/huol9n">
        <img src="https://img.shields.io/static/v1?label=Chat%20on&message=WhatsApp&color=success&logo=WhatsApp&style=flat-square" alt="Whatsapp">
    </a>
    <a href="https://discord.gg/wuPM9dRgDw">
        <img src="https://img.shields.io/static/v1?label=Chat%20on&message=Discord&color=blue&logo=Discord&style=flat-square" alt="Discord">
    </a>
    <a href="https://www.litellm.ai/support">
        <img src="https://img.shields.io/static/v1?label=Chat%20on&message=Slack&color=black&logo=Slack&style=flat-square" alt="Slack">
    </a>
    <a href="https://codspeed.io/BerriAI/litellm?utm_source=badge">
        <img src="https://img.shields.io/endpoint?url=https://codspeed.io/badge.json" alt="CodSpeed"/>
    </a>
</h4>

<p align="center"><i>🌐 Leia em: <a href="./README.md">English</a> | Português (Brasil)</i></p>

<img alt="LiteLLM AI Gateway" src="https://github.com/user-attachments/assets/c5ee0412-6fb5-4fb6-ab5b-bafae4209ca6" />

---

## O que é o LiteLLM

O LiteLLM é um Gateway de IA de código aberto que oferece uma interface única e unificada para chamar mais de 100 provedores de LLM — OpenAI, Anthropic, Gemini, Bedrock, Azure e outros — usando o formato da OpenAI.

Use como **SDK Python** para integração direta na sua biblioteca, ou implante o **AI Gateway (Proxy Server)** como um serviço centralizado para seu time ou organização.

[**Ir para a documentação do LiteLLM Proxy (LLM Gateway)**](https://docs.litellm.ai/docs/simple_proxy) <br>
[**Ir para os Provedores de LLM Suportados**](https://docs.litellm.ai/docs/providers)

---

## Por que usar o LiteLLM

Gerenciar chamadas de LLM entre provedores fica complicado rápido — SDKs diferentes, padrões de autenticação, formatos de requisição e tipos de erro para cada modelo. O LiteLLM remove esse atrito:

- **API unificada** — uma interface para mais de 100 LLMs, sem precisar lidar com o SDK específico de cada provedor
- **Compatibilidade direta com a OpenAI** — troque de provedor sem reescrever seu código
- **Gateway pronto para produção** — chaves virtuais, rastreamento de gastos, guardrails, balanceamento de carga e um painel de administração prontos para usar
- **Latência P95 de 8ms** a 1k RPS ([benchmarks](https://docs.litellm.ai/docs/benchmarks))

### Adotantes do projeto open source

<table>
  <tr>
    <td><img height="60" alt="Stripe" src="https://github.com/user-attachments/assets/f7296d4f-9fbd-460d-9d05-e4df31697c4b" /></td>
    <td><img height="60" alt="image" src="https://github.com/user-attachments/assets/436fca71-988b-40bb-b5fe-8450c80fdbd0" /></td>
    <td><img height="60" alt="Google ADK" src="https://github.com/user-attachments/assets/caf270a2-5aee-45c4-8222-41a2070c4f19" /></td>
    <td><img height="60" alt="Greptile" src="https://github.com/user-attachments/assets/3db0ae72-0843-4005-a56d-bba1dde2193d" /></td>
    <td><img height="60" alt="OpenHands" src="https://github.com/user-attachments/assets/a6150c4c-149e-4cae-888b-8b92be6e003f" /></td>
    <td><h2>Netflix</h2></td>
    <td><img height="60" alt="OpenAI Agents SDK" src="https://github.com/user-attachments/assets/c02f7be0-8c2e-4d27-aea7-7c024bfaebc0" /></td>
  </tr>
</table>

---

## Funcionalidades

<details open>
<summary><b>LLMs</b> - Chame mais de 100 LLMs (SDK Python + AI Gateway)</summary>

[**Todos os Endpoints Suportados**](https://docs.litellm.ai/docs/supported_endpoints) - `/chat/completions`, `/responses`, `/embeddings`, `/images`, `/audio`, `/batches`, `/rerank`, `/a2a`, `/messages` e mais.

### SDK Python

```shell
uv add litellm
```

```python
from litellm import completion
import os

os.environ["OPENAI_API_KEY"] = "your-openai-key"
os.environ["ANTHROPIC_API_KEY"] = "your-anthropic-key"

# OpenAI
response = completion(model="openai/gpt-4o", messages=[{"role": "user", "content": "Hello!"}])

# Anthropic  
response = completion(model="anthropic/claude-sonnet-4-20250514", messages=[{"role": "user", "content": "Hello!"}])
```

### AI Gateway (Proxy Server)

[**Primeiros Passos - Tutorial Completo**](https://docs.litellm.ai/docs/proxy/docker_quick_start) - Configure chaves virtuais e faça sua primeira requisição

```shell
uv tool install 'litellm[proxy]'
litellm --model gpt-4o
```

```python
import openai

client = openai.OpenAI(api_key="anything", base_url="http://0.0.0.0:4000")
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello!"}]
)
```

[**Docs: Provedores de LLM**](https://docs.litellm.ai/docs/providers)

</details>

<details>
<summary><b>Agentes</b> - Invoque Agentes A2A (SDK Python + AI Gateway)</summary>

[**Provedores Suportados**](https://docs.litellm.ai/docs/a2a#add-a2a-agents) - LangGraph, Vertex AI Agent Engine, Azure AI Foundry, Bedrock AgentCore, Pydantic AI

### SDK Python - Protocolo A2A

```python
from litellm.a2a_protocol import A2AClient
from a2a.types import SendMessageRequest, MessageSendParams
from uuid import uuid4

client = A2AClient(base_url="http://localhost:10001")

request = SendMessageRequest(
    id=str(uuid4()),
    params=MessageSendParams(
        message={
            "role": "user",
            "parts": [{"kind": "text", "text": "Hello!"}],
            "messageId": uuid4().hex,
        }
    )
)
response = await client.send_message(request)
```

### AI Gateway (Proxy Server)

**Passo 1.** [Adicione seu Agente ao AI Gateway](https://docs.litellm.ai/docs/a2a#adding-your-agent) — defina o `protocolVersion` como `1.0` ou `0.3` por agente

**Passo 2.** Chame o Agente via SDK A2A (requer `a2a-sdk>=1.1.0`)

```python
import httpx
from a2a.client import A2ACardResolver, ClientConfig, ClientFactory
from a2a.types import Message, Part, Role, SendMessageRequest
from a2a.utils.constants import TransportProtocol
from uuid import uuid4

base_url = "http://localhost:4000/a2a/my-agent"  # LiteLLM proxy + nome do agente
headers = {"Authorization": "Bearer sk-1234"}    # Chave Virtual do LiteLLM

async with httpx.AsyncClient(headers=headers, timeout=60.0) as http_client:
    resolver = A2ACardResolver(httpx_client=http_client, base_url=base_url)
    agent_card = await resolver.get_agent_card()
    config = ClientConfig(
        httpx_client=http_client,
        streaming=False,
        supported_protocol_bindings=[TransportProtocol.JSONRPC, TransportProtocol.HTTP_JSON],
    )
    client = ClientFactory(config).create(agent_card)

    request = SendMessageRequest(
        message=Message(
            message_id=uuid4().hex,
            role=Role.ROLE_USER,
            parts=[Part(text="Hello!")],
        )
    )
    async for event in client.send_message(request):
        populated = event.ListFields()
        if populated and populated[0][0].name in ("message", "msg"):
            print("".join(getattr(p, "text", "") or "" for p in populated[0][1].parts))
```

[**Docs: A2A Agent Gateway**](https://docs.litellm.ai/docs/a2a)

</details>

<details>
<summary><b>Ferramentas MCP</b> - Conecte servidores MCP a qualquer LLM (SDK Python + AI Gateway)</summary>

### SDK Python - Ponte MCP

```python
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from litellm import experimental_mcp_client
import litellm

server_params = StdioServerParameters(command="python", args=["mcp_server.py"])

async with stdio_client(server_params) as (read, write):
    async with ClientSession(read, write) as session:
        await session.initialize()

        # Carrega as ferramentas MCP no formato OpenAI
        tools = await experimental_mcp_client.load_mcp_tools(session=session, format="openai")

        # Use com qualquer modelo do LiteLLM
        response = await litellm.acompletion(
            model="gpt-4o",
            messages=[{"role": "user", "content": "What's 3 + 5?"}],
            tools=tools
        )
```

### AI Gateway - MCP Gateway

**Passo 1.** [Adicione seu Servidor MCP ao AI Gateway](https://docs.litellm.ai/docs/mcp#adding-your-mcp)

**Passo 2.** Chame ferramentas MCP via `/chat/completions`

```bash
curl -X POST 'http://0.0.0.0:4000/v1/chat/completions' \
  -H 'Authorization: Bearer sk-1234' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "Summarize the latest open PR"}],
    "tools": [{
      "type": "mcp",
      "server_url": "litellm_proxy/mcp/github",
      "server_label": "github_mcp",
      "require_approval": "never"
    }]
  }'
```

### Uso com a IDE Cursor

```json
{
  "mcpServers": {
    "LiteLLM": {
      "url": "http://localhost:4000/mcp/",
      "headers": {
        "x-litellm-api-key": "Bearer sk-1234"
      }
    }
  }
}
```

[**Docs: MCP Gateway**](https://docs.litellm.ai/docs/mcp)

</details>

### Provedores Suportados ([Modelos Suportados no Site](https://models.litellm.ai/) | [Docs](https://docs.litellm.ai/docs/providers))

> A tabela abaixo lista os provedores e endpoints suportados. Os nomes de provedores e endpoints não são traduzidos, pois correspondem a identificadores técnicos usados no código.

| Provider                                                                            | `/chat/completions` | `/messages` | `/responses` | `/embeddings` | `/image/generations` | `/audio/transcriptions` | `/audio/speech` | `/moderations` | `/batches` | `/rerank` |
|-------------------------------------------------------------------------------------|---------------------|-------------|--------------|---------------|----------------------|-------------------------|-----------------|----------------|-----------|-----------|
| [Abliteration (`abliteration`)](https://docs.litellm.ai/docs/providers/abliteration) | ✅ |  |  |  |  |  |  |  |  |  |
| [AI/ML API (`aiml`)](https://docs.litellm.ai/docs/providers/aiml) | ✅ | ✅ | ✅ | ✅ | ✅ |  |  |  |  |  |
| [AI21 (`ai21`)](https://docs.litellm.ai/docs/providers/ai21) | ✅ | ✅ | ✅ |  |  |  |  |  |  |  |
| [AI21 Chat (`ai21_chat`)](https://docs.litellm.ai/docs/providers/ai21) | ✅ | ✅ | ✅ |  |  |  |  |  |  |  |
| [Aleph Alpha](https://docs.litellm.ai/docs/providers/aleph_alpha) | ✅ | ✅ | ✅ |  |  |  |  |  |  |  |
| [Amazon Nova](https://docs.litellm.ai/docs/providers/amazon_nova) | ✅ | ✅ | ✅ |  |  |  |  |  |  |  |
| [Anthropic (`anthropic`)](https://docs.litellm.ai/docs/providers/anthropic) | ✅ | ✅ | ✅ |  |  |  |  |  | ✅ |  |
| [Anthropic Text (`anthropic_text`)](https://docs.litellm.ai/docs/providers/anthropic) | ✅ | ✅ | ✅ |  |  |  |  |  | ✅ |  |
| [Anyscale](https://docs.litellm.ai/docs/providers/anyscale) | ✅ | ✅ | ✅ |  |  |  |  |  |  |  |
| [AssemblyAI (`assemblyai`)](https://docs.litellm.ai/docs/pass_through/assembly_ai) | ✅ | ✅ | ✅ |  |  | ✅ |  |  |  |  |
| [Auto Router (`auto_router`)](https://docs.litellm.ai/docs/proxy/auto_routing) | ✅ | ✅ | ✅ |  |  |  |  |  |  |  |
| [AWS - Bedrock (`bedrock`)](https://docs.litellm.ai/docs/providers/bedrock) | ✅ | ✅ | ✅ | ✅ |  |  |  |  |  | ✅ |
| [AWS - Sagemaker (`sagemaker`)](https://docs.litellm.ai/docs/providers/aws_sagemaker) | ✅ | ✅ | ✅ | ✅ |  |  |  |  |  |  |
| [Azure (`azure`)](https://docs.litellm.ai/docs/providers/azure) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |  |
| [Azure AI (`azure_ai`)](https://docs.litellm.ai/docs/providers/azure_ai) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |  |
| [Azure Text (`azure_text`)](https://docs.litellm.ai/docs/providers/azure) | ✅ | ✅ | ✅ |  |  | ✅ | ✅ | ✅ | ✅ |  |
| [Baseten (`baseten`)](https://docs.litellm.ai/docs/providers/baseten) | ✅ | ✅ | ✅ |  |  |  |  |  |  |  |
| [Bytez (`bytez`)](https://docs.litellm.ai/docs/providers/bytez) | ✅ | ✅ | ✅ |  |  |  |  |  |  |  |
| [Cerebras (`cerebras`)](https://docs.litellm.ai/docs/providers/cerebras) | ✅ | ✅ | ✅ |  |  |  |  |  |  |  |
| [Clarifai (`clarifai`)](https://docs.litellm.ai/docs/providers/clarifai) | ✅ | ✅ | ✅ |  |  |  |  |  |  |  |
| [Cloudflare AI Workers (`cloudflare`)](https://docs.litellm.ai/docs/providers/cloudflare_workers) | ✅ | ✅ | ✅ |  |  |  |  |  |  |  |
| [Codestral (`codestral`)](https://docs.litellm.ai/docs/providers/codestral) | ✅ | ✅ | ✅ |  |  |  |  |  |  |  |
| [Cohere (`cohere`)](https://docs.litellm.ai/docs/providers/cohere) | ✅ | ✅ | ✅ | ✅ |  |  |  |  |  | ✅ |
| [Cohere Chat (`cohere_chat`)](https://docs.litellm.ai/docs/providers/cohere) | ✅ | ✅ | ✅ |  |  |  |  |  |  |  |
| [CometAPI (`cometapi`)](https://docs.litellm.ai/docs/providers/cometapi) | ✅ | ✅ | ✅ | ✅ |  |  |  |  |  |  |
| [CompactifAI (`compactifai`)](https://docs.litellm.ai/docs/providers/compactifai) | ✅ | ✅ | ✅ |  |  |  |  |  |  |  |
| [Custom (`custom`)](https://docs.litellm.ai/docs/providers/custom_llm_server) | ✅ | ✅ | ✅ |  |  |  |  |  |  |  |
| [Custom OpenAI (`custom_openai`)](https://docs.litellm.ai/docs/providers/openai_compatible) | ✅ | ✅ | ✅ |  |  | ✅ | ✅ | ✅ | ✅ |  |
| [Dashscope (`dashscope`)](https://docs.litellm.ai/docs/providers/dashscope) | ✅ | ✅ | ✅ | ✅ |  |  |  |  |  | ✅ |
| [Databricks (`databricks`)](https://docs.litellm.ai/docs/providers/databricks) | ✅ | ✅ | ✅ |  |  |  |  |  |  |  |
| [DataRobot (`datarobot`)](https://docs.litellm.ai/docs/providers/datarobot) | ✅ | ✅ | ✅ |  |  |  |  |  |  |  |
| [Deepgram (`deepgram`)](https://docs.litellm.ai/docs/providers/deepgram) | ✅ | ✅ | ✅ |  |  | ✅ |  |  |  |  |
| [DeepInfra (`deepinfra`)](https://docs.litellm.ai/docs/providers/deepinfra) | ✅ | ✅ | ✅ |  |  |  |  |  |  |  |
| [Deepseek (`deepseek`)](https://docs.litellm.ai/docs/providers/deepseek) | ✅ | ✅ | ✅ |  |  |  |  |  |  |  |
| [ElevenLabs (`elevenlabs`)](https://docs.litellm.ai/docs/providers/elevenlabs) | ✅ | ✅ | ✅ |  |  | ✅ | ✅ |  |  |  |
| [Empower (`empower`)](https://docs.litellm.ai/docs/providers/empower) | ✅ | ✅ | ✅ |  |  |  |  |  |  |  |
| [Fal AI (`fal_ai`)](https://docs.litellm.ai/docs/providers/fal_ai) | ✅ | ✅ | ✅ |  | ✅ |  |  |  |  |  |
| [Featherless AI (`featherless_ai`)](https://docs.litellm.ai/docs/providers/featherless_ai) | ✅ | ✅ | ✅ |  |  |  |  |  |  |  |
| [Fireworks AI (`fireworks_ai`)](https://docs.litellm.ai/docs/providers/fireworks_ai) | ✅ | ✅ | ✅ |  |  |  |  |  |  |  |
| [FriendliAI (`friendliai`)](https://docs.litellm.ai/docs/providers/friendliai) | ✅ | ✅ | ✅ |  |  |  |  |  |  |  |
| [Galadriel (`galadriel`)](https://docs.litellm.ai/docs/providers/galadriel) | ✅ | ✅ | ✅ |  |  |  |  |  |  |  |
| [GitHub Copilot (`github_copilot`)](https://docs.litellm.ai/docs/providers/github_copilot) | ✅ | ✅ | ✅ | ✅ |  |  |  |  |  |  |
| [GitHub Models (`github`)](https://docs.litellm.ai/docs/providers/github) | ✅ | ✅ | ✅ |  |  |  |  |  |  |  |
| [Google - PaLM](https://docs.litellm.ai/docs/providers/palm) | ✅ | ✅ | ✅ |  |  |  |  |  |  |  |
| [Google - Vertex AI (`vertex_ai`)](https://docs.litellm.ai/docs/providers/vertex) | ✅ | ✅ | ✅ | ✅ | ✅ |  |  |  |  |  |
| [Google AI Studio - Gemini (`gemini`)](https://docs.litellm.ai/docs/providers/gemini) | ✅ | ✅ | ✅ |  |  |  |  |  |  |  |
| [GradientAI (`gradient_ai`)](https://docs.litellm.ai/docs/providers/gradient_ai) | ✅ | ✅ | ✅ |  |  |  |  |  |  |  |
| [Groq AI (`groq`)](https://docs.litellm.ai/docs/providers/groq) | ✅ | ✅ | ✅ |  |  |  |  |  |  |  |
| [Nscale (`nscale`)](https://docs.litellm.ai/docs/providers/nscale) | ✅ | ✅ | ✅ |  |  |  |  |  |  |  |
| [Nvidia NIM (`nvidia_nim`)](https://docs.litellm.ai/docs/providers/nvidia_nim) | ✅ | ✅ | ✅ |  |  |  |  |  |  |  |
| [OCI (`oci`)](https://docs.litellm.ai/docs/providers/oci) | ✅ | ✅ | ✅ |  |  |  |  |  |  |  |
| [Ollama (`ollama`)](https://docs.litellm.ai/docs/providers/ollama) | ✅ | ✅ | ✅ | ✅ |  |  |  |  |  |  |
| [Ollama Chat (`ollama_chat`)](https://docs.litellm.ai/docs/providers/ollama) | ✅ | ✅ | ✅ |  |  |  |  |  |  |  |
| [Oobabooga (`oobabooga`)](https://docs.litellm.ai/docs/providers/openai_compatible) | ✅ | ✅ | ✅ |  |  | ✅ | ✅ | ✅ | ✅ |  |
| [OpenAI (`openai`)](https://docs.litellm.ai/docs/providers/openai) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |  |
| [OpenAI-like (`openai_like`)](https://docs.litellm.ai/docs/providers/openai_compatible) |  |  |  | ✅ |  |  |  |  |  |  |
| [OpenRouter (`openrouter`)](https://docs.litellm.ai/docs/providers/openrouter) | ✅ | ✅ | ✅ |  |  |  |  |  |  |  |
| [OVHCloud AI Endpoints (`ovhcloud`)](https://docs.litellm.ai/docs/providers/ovhcloud) | ✅ | ✅ | ✅ |  |  |  |  |  |  |  |
| [Perplexity AI (`perplexity`)](https://docs.litellm.ai/docs/providers/perplexity) | ✅ | ✅ | ✅ |  |  |  |  |  |  |  |
| [Petals (`petals`)](https://docs.litellm.ai/docs/providers/petals) | ✅ | ✅ | ✅ |  |  |  |  |  |  |  |
| [Pinstripes (`pinstripes`)](https://docs.litellm.ai/docs/providers/pinstripes) | ✅ | ✅ | ✅ |  |  |  |  |  |  |  |
| [Predibase (`predibase`)](https://docs.litellm.ai/docs/providers/predibase) | ✅ | ✅ | ✅ |  |  |  |  |  |  |  |
| [Recraft (`recraft`)](https://docs.litellm.ai/docs/providers/recraft) |  |  |  |  | ✅ |  |  |  |  |  |
| [Replicate (`replicate`)](https://docs.litellm.ai/docs/providers/replicate) | ✅ | ✅ | ✅ |  |  |  |  |  |  |  |
| [Sagemaker Chat (`sagemaker_chat`)](https://docs.litellm.ai/docs/providers/aws_sagemaker) | ✅ | ✅ | ✅ |  |  |  |  |  |  |  |
| [Sambanova (`sambanova`)](https://docs.litellm.ai/docs/providers/sambanova) | ✅ | ✅ | ✅ |  |  |  |  |  |  |  |
| [Snowflake (`snowflake`)](https://docs.litellm.ai/docs/providers/snowflake) | ✅ | ✅ | ✅ |  |  |  |  |  |  |  |
| [Text Completion Codestral (`text-completion-codestral`)](https://docs.litellm.ai/docs/providers/codestral) | ✅ | ✅ | ✅ |  |  |  |  |  |  |  |
| [Text Completion OpenAI (`text-completion-openai`)](https://docs.litellm.ai/docs/providers/text_completion_openai) | ✅ | ✅ | ✅ |  |  | ✅ | ✅ | ✅ | ✅ |  |
| [Together AI (`together_ai`)](https://docs.litellm.ai/docs/providers/togetherai) | ✅ | ✅ | ✅ |  |  |  |  |  |  |  |
| [Topaz (`topaz`)](https://docs.litellm.ai/docs/providers/topaz) | ✅ | ✅ | ✅ |  |  |  |  |  |  |  |
| [Triton (`triton`)](https://docs.litellm.ai/docs/providers/triton-inference-server) | ✅ | ✅ | ✅ |  |  |  |  |  |  |  |
| [V0 (`v0`)](https://docs.litellm.ai/docs/providers/v0) | ✅ | ✅ | ✅ |  |  |  |  |  |  |  |
| [Vercel AI Gateway (`vercel_ai_gateway`)](https://docs.litellm.ai/docs/providers/vercel_ai_gateway) | ✅ | ✅ | ✅ |  |  |  |  |  |  |  |
| [VLLM (`vllm`)](https://docs.litellm.ai/docs/providers/vllm) | ✅ | ✅ | ✅ |  |  |  |  |  |  |  |
| [Volcengine (`volcengine`)](https://docs.litellm.ai/docs/providers/volcano) | ✅ | ✅ | ✅ |  |  |  |  |  |  |  |
| [Voyage AI (`voyage`)](https://docs.litellm.ai/docs/providers/voyage) |  |  |  | ✅ |  |  |  |  |  |  |
| [WandB Inference (`wandb`)](https://docs.litellm.ai/docs/providers/wandb_inference) | ✅ | ✅ | ✅ |  |  |  |  |  |  |  |
| [Watsonx Text (`watsonx_text`)](https://docs.litellm.ai/docs/providers/watsonx) | ✅ | ✅ | ✅ |  |  |  |  |  |  |  |
| [xAI (`xai`)](https://docs.litellm.ai/docs/providers/xai) | ✅ | ✅ | ✅ |  |  |  |  |  |  |  |
| [Xinference (`xinference`)](https://docs.litellm.ai/docs/providers/xinference) |  |  |  | ✅ |  |  |  |  |  |  |

[**Leia a Documentação**](https://docs.litellm.ai/docs/)

---

## Primeiros Passos

Você pode usar o LiteLLM através do Proxy Server ou do SDK Python. Ambos oferecem uma interface unificada para acessar múltiplos LLMs (mais de 100). Escolha a opção que melhor se encaixa nas suas necessidades:

<table style={{width: '100%', tableLayout: 'fixed'}}>
<thead>
<tr>
<th style={{width: '14%'}}></th>
<th style={{width: '43%'}}><strong><a href="https://docs.litellm.ai/docs/simple_proxy">LiteLLM AI Gateway</a></strong></th>
<th style={{width: '43%'}}><strong><a href="https://docs.litellm.ai/docs/">LiteLLM Python SDK</a></strong></th>
</tr>
</thead>
<tbody>
<tr>
<td style={{width: '14%'}}><strong>Caso de Uso</strong></td>
<td style={{width: '43%'}}>Serviço central (LLM Gateway) para acessar múltiplos LLMs</td>
<td style={{width: '43%'}}>Use o LiteLLM diretamente no seu código Python</td>
</tr>
<tr>
<td style={{width: '14%'}}><strong>Quem Usa?</strong></td>
<td style={{width: '43%'}}>Times de Habilitação de IA Generativa / Plataforma de ML</td>
<td style={{width: '43%'}}>Desenvolvedores construindo projetos com LLM</td>
</tr>
<tr>
<td style={{width: '14%'}}><strong>Principais Recursos</strong></td>
<td style={{width: '43%'}}>Gateway de API centralizado com autenticação e autorização, rastreamento de custo multi-tenant e gestão de gastos por projeto/usuário, personalização por projeto (logging, guardrails, cache), chaves virtuais para controle de acesso seguro, painel de administração para monitoramento e gestão</td>
<td style={{width: '43%'}}>Integração direta da biblioteca Python no seu código, Router com lógica de retry/fallback entre múltiplos deployments (ex: Azure/OpenAI) - <a href="https://docs.litellm.ai/docs/routing">Router</a>, balanceamento de carga e rastreamento de custo em nível de aplicação, tratamento de exceções com erros compatíveis com a OpenAI, callbacks de observabilidade (Lunary, MLflow, Langfuse, etc.)</td>
</tr>
</tbody>
</table>

**Versão Estável:** Use as imagens Docker com a tag `-stable`. Elas passaram por 12 horas de testes de carga antes de serem publicadas. [Mais informações sobre o ciclo de lançamento aqui](https://docs.litellm.ai/docs/proxy/release_cycle)

Suporte para mais provedores. Falta algum provedor ou Plataforma de LLM? Abra uma [solicitação de funcionalidade](https://github.com/BerriAI/litellm/issues/new?assignees=&labels=enhancement&projects=&template=feature_request.yml&title=%5BFeature%5D%3A+).

### Implante na AWS ou GCP com Terraform

Rode o proxy do LiteLLM como uma stack componentizada e pronta para produção (gateway, backend e UI em serviços separados; Postgres + Redis + armazenamento de objetos gerenciados) usando os módulos Terraform publicados. Ambos os módulos estão no [Terraform Registry público](https://registry.terraform.io/namespaces/BerriAI) — sem necessidade de autenticação.

#### AWS — ECS Fargate + Aurora + ElastiCache + ALB

[![Launch in AWS CloudShell](https://img.shields.io/badge/Launch-AWS_CloudShell-FF9900?logo=amazon-aws&logoColor=white)](https://console.aws.amazon.com/cloudshell/home) — abre um shell no navegador, já autenticado na sua conta AWS. Uma vez dentro, execute:

```bash
git clone https://github.com/BerriAI/litellm.git
cd litellm/terraform/litellm/aws/examples/default
cp terraform.tfvars.example terraform.tfvars   # edite região/tenant/ambiente
terraform init && terraform apply
```

[Página do módulo →](https://registry.terraform.io/modules/BerriAI/litellm/aws/latest)

Ou chame o módulo a partir da sua própria configuração raiz:

```hcl
# main.tf
terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.60" }
  }
}

provider "aws" {
  region = "us-west-2"
}

module "litellm" {
  source  = "BerriAI/litellm/aws"
  version = "~> 1.89"

  region = "us-west-2"
  azs    = ["us-west-2a", "us-west-2b"]
  tenant = "acme"
  env    = "prod"

  # Produção: forneça um certificado ACM. Sem ele, defina allow_plaintext_alb = true
  # (apenas para desenvolvimento/testes).
  # acm_certificate_arn = "arn:aws:acm:us-west-2:111122223333:certificate/..."
  allow_plaintext_alb = true
}

output "litellm_url" {
  value = module.litellm.alb_dns_name
}
```

```bash
terraform init
terraform apply
```

As chaves de API dos provedores ficam no AWS Secrets Manager; referencie os ARNs via `gateway_extra_secrets`. Lista completa de inputs e diagrama de arquitetura na [página do registro](https://registry.terraform.io/modules/BerriAI/litellm/aws/latest?tab=inputs).

#### GCP — Cloud Run + Cloud SQL + Memorystore + HTTPS LB

[![Open in Cloud Shell](https://gstatic.com/cloudssh/images/open-btn.png)](https://ssh.cloud.google.com/cloudshell/editor?cloudshell_git_repo=https%3A%2F%2Fgithub.com%2FBerriAI%2Flitellm&cloudshell_workspace=terraform%2Flitellm%2Fgcp%2Fexamples%2Fdefault&cloudshell_tutorial=TUTORIAL.md&cloudshell_image=gcr.io/ds-artifacts-cloudshell/deploystack_custom_image&shellonly=true)

Um clique de verdade. Abre o Cloud Shell, clona este repositório e guia você pelo `terraform apply` através de um [tutorial integrado do DeployStack](./terraform/litellm/gcp/examples/default/TUTORIAL.md) — escolha o projeto, o tutorial configura o repositório remoto do Artifact Registry, escreve o `terraform.tfvars` com base nas suas respostas, e executa o apply.

[Página do módulo →](https://registry.terraform.io/modules/BerriAI/litellm/google/latest)

Para chamar o módulo a partir da sua própria configuração, o Cloud Run não consegue puxar direto do `ghcr.io`, então primeiro configure um repositório remoto único no Artifact Registry apontando para o GHCR:

```bash
gcloud artifacts repositories create litellm \
  --location=us-central1 \
  --repository-format=docker \
  --mode=remote-repository \
  --remote-docker-repo=https://ghcr.io \
  --project=my-gcp-project
```

Depois:

```hcl
# main.tf
terraform {
  required_version = ">= 1.6.0"
  required_providers {
    google      = { source = "hashicorp/google",      version = "~> 6.10" }
    google-beta = { source = "hashicorp/google-beta", version = "~> 6.10" }
  }
}

provider "google"      { project = "my-gcp-project"; region = "us-central1" }
provider "google-beta" { project = "my-gcp-project"; region = "us-central1" }

module "litellm" {
  source  = "BerriAI/litellm/google"
  version = "~> 1.89"

  project_id = "my-gcp-project"
  region     = "us-central1"
  tenant     = "acme"
  env        = "prod"

  # Substitua my-gcp-project pelo ID do seu projeto GCP (mesmo valor de project_id acima).
  image_registry = "us-central1-docker.pkg.dev/my-gcp-project/litellm/berriai"

  # Produção: forneça um DNS já apontando para o IP do LB para certificados gerenciados pelo Google.
  # Sem isso, defina allow_plaintext_lb = true (apenas para dev/testes).
  # lb_domains         = ["proxy.example.com"]
  allow_plaintext_lb = true
}

output "litellm_url" {
  value = module.litellm.load_balancer_url
}
```

```bash
terraform init
terraform apply
```

As chaves de API dos provedores ficam no Secret Manager; referencie os IDs dos recursos (ex: `projects/my-gcp-project/secrets/openai-api-key`) via `gateway_extra_secrets`. Lista completa de inputs e diagrama de arquitetura na [página do registro](https://registry.terraform.io/modules/BerriAI/litellm/google/latest?tab=inputs).

#### Ambas as stacks incluem

- A divisão completa em componentes (gateway / backend / UI como serviços independentes)
- Postgres gerenciado (writer + reader) e Redis
- Armazenamento de objetos versionado para estado do proxy + uploads de arquivos
- Um `LITELLM_MASTER_KEY` gerado automaticamente no gerenciador de segredos da sua nuvem
- Um job de migração único que roda `prisma migrate deploy` antes de o proxy iniciar
- A mesma superfície de `proxy_config` do [Helm chart](./helm/litellm/) — passe YAML como um mapa tipado

Os módulos Terraform ficam em [`terraform/litellm/aws/`](./terraform/litellm/aws/) e [`terraform/litellm/gcp/`](./terraform/litellm/gcp/) neste repositório; as entradas no registro são espelhos somente leitura, atualizados a cada release.

### Rodar em Modo de Desenvolvedor
#### Serviços
1. Configure o arquivo .env na raiz
2. Rode os serviços dependentes `docker-compose up db prometheus`

#### Backend
1. Rode `make bootstrap`
2. Inicie o backend do proxy: `uv run python litellm/proxy/proxy_cli.py`

#### Frontend
1. Navegue até `ui/litellm-dashboard` (as dependências já foram instaladas com `make bootstrap`)
2. Inicie o dashboard: `npm run dev`

### Verificar Assinaturas das Imagens Docker

Todas as imagens Docker do LiteLLM publicadas no GHCR são assinadas com [cosign](https://docs.sigstore.dev/cosign/overview/). Todo release é assinado com a mesma chave introduzida no [commit `0112e53`](https://github.com/BerriAI/litellm/commit/0112e53046018d726492c814b3644b7d376029d0).

**Verifique usando o hash de commit fixado (recomendado):**

Um hash de commit é criptograficamente imutável, então essa é a forma mais forte de garantir que você está usando a chave de assinatura original:

```bash
cosign verify \
  --key https://raw.githubusercontent.com/BerriAI/litellm/0112e53046018d726492c814b3644b7d376029d0/cosign.pub \
  ghcr.io/berriai/litellm:<release-tag>
```

**Verifique usando uma tag de release (mais conveniente):**

As tags são protegidas neste repositório e resolvem para a mesma chave. Essa opção é mais fácil de ler, mas depende das regras de proteção de tags:

```bash
cosign verify \
  --key https://raw.githubusercontent.com/BerriAI/litellm/<release-tag>/cosign.pub \
  ghcr.io/berriai/litellm:<release-tag>
```

Substitua `<release-tag>` pela versão que você está implantando (ex: `v1.83.0-stable`).

---

# Enterprise
Para empresas que precisam de mais segurança, gestão de usuários e suporte profissional

[Obtenha uma Licença Enterprise](https://litellm.ai/enterprise)
[Fale com os fundadores](https://enterprise.litellm.ai/demo)

Isso inclui:
- ✅ **Funcionalidades da [Licença Comercial do LiteLLM](https://docs.litellm.ai/docs/proxy/enterprise):**
- ✅ **Priorização de Funcionalidades**
- ✅ **Integrações Personalizadas**
- ✅ **Suporte Profissional - Discord e Slack dedicados**
- ✅ **SLAs Personalizados**
- ✅ **Acesso seguro com Single Sign-On**

# Contribuindo

Recebemos contribuições para o LiteLLM de braços abertos! Seja corrigindo bugs, adicionando funcionalidades ou melhorando a documentação, agradecemos sua ajuda.

## Início Rápido para Contribuidores

É necessário ter o uv instalado.

```bash
git clone https://github.com/BerriAI/litellm.git
cd litellm
make install-dev    # Instala as dependências de desenvolvimento
make format         # Formata seu código
make lint           # Roda todas as checagens de lint
make test-unit      # Roda os testes unitários
make format-check   # Só checa a formatação
```

Para diretrizes detalhadas de contribuição, veja [CONTRIBUTING.md](CONTRIBUTING.md).

> **📖 Contribuindo com a documentação?** A documentação do LiteLLM foi movida para um repositório separado: [BerriAI/litellm-docs](https://github.com/BerriAI/litellm-docs). Por favor, abra PRs de documentação lá. A documentação é servida em [docs.litellm.ai](https://docs.litellm.ai).

## Qualidade de Código / Linting

O LiteLLM segue o [Google Python Style Guide](https://google.github.io/styleguide/pyguide.html).

Nossas checagens automatizadas incluem:
- **Black** para formatação de código
- **Ruff** para lint e qualidade de código
- **MyPy** para checagem de tipos
- **Detecção de importação circular**
- **Checagens de segurança de importação**


Todas essas checagens precisam passar antes que seu PR possa ser mesclado.


# Suporte / fale com os fundadores

- [Agende uma Demo 👋](https://calendly.com/d/4mp-gd3-k5k/berriai-1-1-onboarding-litellm-hosted-version)
- [Discord da Comunidade 💭](https://discord.gg/wuPM9dRgDw)
- [Slack da Comunidade 💭](https://www.litellm.ai/support)
- Nossos e-mails ✉️ ishaan@berri.ai / krrish@berri.ai

# Contribuidores

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

<a href="https://github.com/BerriAI/litellm/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=BerriAI/litellm" />
</a>

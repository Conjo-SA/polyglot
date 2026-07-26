export const CREATE_END_USER_CURL_COMMAND = `
curl -X POST --location '<url_da_sua_proxy>/end_user/new' \\

-H 'Authorization: Bearer <sua_chave-mestre>' \\

-H 'Content-Type: application/json' \\

-d '{"user_id": "meu-id-de-cliente", "budget_id": "<ID_DO_ORÇAMENTO>"}' # 👈 MUDANÇA NA CHAVE

`;

export const CHAT_COMPLETIONS_CURL_COMMAND = `
curl -X POST --location '<url_da_sua_proxy>/chat/completions' \\

-H 'Authorization: Bearer <sua_chave-mestre>' \\

-H 'Content-Type: application/json' \\

-d '{
  "model": "gpt-3.5-turbo',
  "messages":[{"role": "user", "content": "E aí, como você está?"}],
  "user": "meu-id-de-cliente"
}' # 👈 MUDANÇA NA CHAVE

`;

export const OPENAI_SDK_PYTHON_CODE = `from openai import OpenAI
client = OpenAI(
  base_url="<url_da_sua_proxy>",
  api_key="<sua_chave_da_proxy>"
)

completion = client.chat.completions.create(
  model="gpt-3.5-turbo",
  messages=[
    {"role": "system", "content": "Você é um assistente útil."},
    {"role": "user", "content": "Olá!"}
  ],
  user="meu-id-de-cliente"
)

print(completion.choices[0].message)`;

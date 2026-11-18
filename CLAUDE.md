# MyApp: site (Svelte)

Site do MyApp, um app de finanças pessoais gamificadas com um bichinho virtual estilo Tamagotchi.
A base de tudo é a **reserva de emergência**: só depois dela a pessoa passa a investir.

Este repositório é só o site. O projeto tem três repositórios, normalmente lado a lado em `~/Documents/funnycoins/`:
- `app/`: app SwiftUI, em `joaopedrolacerda/funnyCoins-app`. Tem a especificação completa das regras do jogo.
- `backend/`: API em Rust, em `joaopedrolacerda/funnyCoins-backend`.
- `web/`: este, em `joaopedrolacerda/funnycoins`.

Stack: Svelte 5 + Vite + TypeScript. Textos em português do Brasil, com tom amigável e de jogo.

## Regras obrigatórias
- **Toda mudança vem com testes, e todos os testes precisam passar** antes de dar a tarefa por concluída.
- O site **não reimplementa regra do jogo**. Tudo vem do WASM das regras, por `computeSnapshot` e `computeGainPlan` em `src/lib/game.ts`.
  - O WASM já gerado fica em `src/lib/rules/pkg`, no git. O código-fonte em Rust (`rust/rules`) sumiu em 13/11/2026, então hoje não dá para gerar outro.
  - Regra nova precisa entrar também no app (Swift) e nos fixtures.
- Ações do jogador ficam em `src/lib/actions.ts`, fora das telas, e são testadas. Exemplos: salvar ganho, pagar conta, depositar.
- Dinheiro é `number` inteiro em centavos. Para exibir, use `brl()`. Para digitar, use `CurrencyInput`, que lê com `centsFromTyping`.
- **Ícones**: SVG de traço fino com `currentColor`, por `<Icon name=... />`. Os desenhos ficam em `src/lib/icons.ts`, baseados no Lucide.
  Não use emojis na interface.

## Como validar
- `npm test` roda o Vitest. Os testes carregam o WASM real e rodam também os fixtures.
- `npm run check` roda o svelte-check e precisa terminar com 0 erros.
- `npm run build` gera o site em `dist/`.
- Imagem: `docker build -t funnycoins-web:local .` (o Docker fica em `/Applications/Docker.app/Contents/Resources/bin`).

### Fixtures
`fixtures/rules-fixtures.json` é uma **cópia** de `MyAppTests/Fixtures/rules-fixtures.json`, do repositório do app.
Os dois precisam ficar iguais: ao mudar um, copie para o outro.

## Rodar localmente
1. No repositório do backend: `cd rust && ALLOW_DEV_LOGIN=true cargo run -p myapp-backend` (porta 8080).
2. Aqui: `npm run dev` (porta 5173). O Vite repassa `/v1` e `/health` para `API_URL`, que por padrão é `http://127.0.0.1:8080`.

## Publicar (Railway)
- Serviço próprio no projeto `charismatic-essence`, ao lado da API (`funnycoins`, em https://funnycoins-production.up.railway.app).
- `Dockerfile` gera o site e serve com o Caddy (`Caddyfile`): `/health` responde `ok`, caminhos que não são arquivos devolvem o `index.html`,
  `/assets/*` fica em cache para sempre e o resto não fica em cache.
- `railway.json` aponta para o Dockerfile e usa `/health` como verificação.
- Variáveis do serviço (entram no build como `ARG`):
  - `VITE_API_URL=https://funnycoins-production.up.railway.app` (obrigatória).
  - `VITE_GOOGLE_CLIENT_ID`, se o login do Google estiver configurado.
  - Não defina `VITE_DEV_LOGIN` em produção.
  - O Railway define `PORT` sozinho.
- No backend, `CORS_ORIGINS` precisa incluir o endereço do site.
- Para publicar de novo: `railway up --service <serviço do site> --ci`, desta pasta. O envio usa o `.railwayignore`.

## Arquitetura
```
src/lib/          lógica testável: store, sync, api, game (ponte WASM), actions, money, dates, pet
src/lib/rules/pkg WASM das regras (gerado, no git)
src/components/   Pet (bichinho em SVG), Icon, CurrencyInput, Modal, Ring, Bar, StepDots
src/views/        PetHome, Journey, CashFlow, Bills, Investments, Account
src/forms/        ProfileForm, GainWizard, EntryForm, BillForm, ReserveForm, InvestmentForm
fixtures/         casos das regras do jogo (cópia dos fixtures do app)
```

- Os dados ficam no `localStorage` no formato `SyncRecord` da API.
  - `RecordStore` segue as mesmas regras do app: `update` avança `updatedAt`, `softDelete` só marca, e as telas usam `active()`.
  - O perfil usado é o mais antigo.
- O site funciona sem login. Com login, sincroniza 1,5 s depois de cada alteração, a cada minuto e ao voltar o foco.
- A API autentica por `Authorization: Bearer`, sem cookies.
- **Login principal: código da conta.**
  - `POST /v1/auth/code/new` cria a conta e devolve um código como `K7QM-4XPA-9RTD`.
  - `POST /v1/auth/code` entra com o código. Aceita minúsculas, espaços e hífens.
  - O site guarda o código junto da sessão, no `localStorage`, para mostrá-lo na aba Conta.
  - O formato fica em `src/lib/accountCode.ts` e precisa ser igual ao de `rust/backend/src/auth.rs`, no repositório do backend.
- Sair da conta mantém os dados no navegador. Excluir a conta apaga os dados no servidor e no navegador.
- O desenho do bichinho em `Pet.svelte` reproduz `PetView.swift`, do app, com as mesmas frações. As formas ficam em `src/lib/pet.ts`.
  Ao mudar a arte no app, mude no site também. O Filhote (bolinha redonda sem partes extras) continua intocável.
- Variáveis do site:
  - `VITE_API_URL` aponta para o backend. Vazio usa o proxy do Vite.
  - `VITE_GOOGLE_CLIENT_ID` liga o botão do Google.
  - `VITE_DEV_LOGIN=true` mostra o login só pelo nome fora do modo dev.

## Decisões em aberto
- Login com Apple: o backend já aceita o token, mas o site ainda não tem o botão.
- Client IDs da Apple (Services ID para o site) e do Google.

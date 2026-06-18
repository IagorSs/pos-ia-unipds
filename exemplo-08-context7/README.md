Context7 OK

Docs consultados:
- api/auth/[...all]/route.ts — exemplo de handler App Router (toNextJsHandler).
- Create Better Auth Instance — como configurar `betterAuth` com `socialProviders`.
- Setup Social Providers — configuração do provider GitHub.
- Initialize Better Auth with Better-SQLite3 — usar `new Database("./better-auth.sqlite")`.
- Initiate Social Sign-In with authClient — uso de `authClient.signIn.social`.

Trechos usados (curtos):
- `export const { GET, POST } = toNextJsHandler(auth);`
- `export const auth = betterAuth({ socialProviders: { github: { clientId: process.env.GITHUB_CLIENT_ID, clientSecret: process.env.GITHUB_CLIENT_SECRET } } })`
- `database: new Database("database.sqlite")`
- `await authClient.signIn.social({ provider: "github", callbackURL: "/dashboard" })`

Dependências (mínimas):
- better-auth
- better-sqlite3
- next
- react
- react-dom
- tailwindcss + postcss + autoprefixer (dev)

Estrutura de arquivos criados:
- lib/auth.ts
- lib/auth-client.ts
- app/api/auth/[...all]/route.ts
- app/page.tsx
- app/sign-in/page.tsx
- app/layout.tsx
- styles/globals.css
- package.json
- tsconfig.json
- tailwind.config.js
- postcss.config.js
- .gitignore
- README.md

Comandos npm (ordem):
1) Instalar dependências:

```bash
cd exemplo-context7
npm install
```

2) Criar/migrar o schema do Better Auth (depois de definir variáveis de ambiente GITHUB_CLIENT_ID e GITHUB_CLIENT_SECRET):

```bash
npm run migrate
```

3) Rodar em desenvolvimento:

```bash
npm run dev
```

Observações rápidas:
- O arquivo de banco local será `better-auth.sqlite` criado na raiz do projeto.
- Configure `GITHUB_CLIENT_ID` e `GITHUB_CLIENT_SECRET` em `.env.local` antes de migrar/rodar.
- Se quiser que eu execute a instalação e a migração agora, diga para eu rodar os comandos localmente.

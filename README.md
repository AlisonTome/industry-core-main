# NexForge

NexForge e uma plataforma B2B para gestao de RFQs, projetos industriais, propostas e relacionamento entre clientes e fornecedores tecnicos. A aplicacao simula o fluxo de uma operacao de compras industriais: o cliente cria demandas, organiza projetos, acompanha cotacoes e propostas; o fornecedor visualiza oportunidades elegiveis, responde RFQs e acompanha sua carteira.

O projeto esta estruturado como uma SPA em React, com persistencia local via `localStorage`, ideal para demonstracao, prototipacao e validacao de experiencia antes da integracao com backend.

## Acesso

Publicacao via GitHub Pages:

https://AlisonTome.github.io/industry-core-main

Conta demo:

```txt
E-mail: demo@nexforge.com
Senha: demo1234
```

Tambem e possivel criar novos perfis diretamente pela tela de cadastro. Esses usuarios ficam salvos no `localStorage` do navegador.

## Principais recursos

- Dashboard separado por perfil de cliente e fornecedor.
- Fluxo de login, cadastro e sessao persistida localmente.
- RFQs visiveis de acordo com o usuario logado.
- Fornecedores novos enxergam apenas solicitacoes criadas depois do cadastro.
- Notificacoes filtradas por perfil e destinatario.
- Projetos vinculados ao cliente ou fornecedor logado.
- Vinculo opcional de RFQ a projeto na criacao da RFQ.
- Tela de gerenciamento de projeto com lista de RFQs vinculadas.
- Adicao e remocao de RFQs dentro do projeto.
- Filtros por titulo, status e data na gestao de RFQs do projeto.
- Tema claro/escuro disponivel somente dentro do dashboard.
- Layout responsivo com ajustes para uso mobile.
- Sidebar recolhivel, com fechamento automatico no mobile ao trocar de aba.
- Navegacao interna do dashboard com botoes de voltar e home.
- Build preparado para deploy no GitHub Pages.

## Tecnologias

- React 18
- TypeScript
- Vite
- React Router
- Tailwind CSS
- shadcn/ui e Radix UI
- Lucide React
- Vitest
- GitHub Actions para deploy no GitHub Pages

## Estrutura

```txt
industry-core-main/
├── .github/workflows/        # Workflow de deploy do GitHub Pages
├── public/                   # Arquivos publicos, incluindo 404.html para SPA
├── src/
│   ├── components/           # Componentes reutilizaveis e UI
│   ├── contexts/             # Contextos da aplicacao, como autenticacao
│   ├── lib/                  # Store local, seeds e regras de visibilidade
│   ├── pages/                # Paginas principais e telas do dashboard
│   └── main.tsx              # Entrada da aplicacao
├── index.html                # HTML base da SPA
├── package.json              # Scripts e dependencias
├── vite.config.ts            # Configuracao do Vite e base do GitHub Pages
└── README.md
```

## Como rodar localmente

Instale as dependencias:

```bash
npm install
```

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

Gere o build de producao:

```bash
npm run build
```

Gere o build usando a configuracao de GitHub Pages:

```bash
npm run build:pages
```

Execute os testes:

```bash
npm run test
```

## Deploy no GitHub Pages

O repositorio esta preparado para deploy por GitHub Actions.

Configuracao esperada no GitHub:

1. Acesse `Settings > Pages`.
2. Em `Build and deployment`, selecione `Source: GitHub Actions`.
3. Faca commit e push na branch principal.
4. O workflow `Deploy to GitHub Pages` fara o build e publicara a pasta `dist`.

O projeto usa `GITHUB_PAGES=true` no workflow para configurar corretamente o `base` do Vite como `/industry-core-main/`.

## Observacoes sobre dados

Esta versao nao possui backend. Os dados ficam no navegador usando `localStorage`, incluindo:

- Usuarios cadastrados
- Sessao ativa
- RFQs
- Propostas
- Projetos
- Notificacoes
- Preferencias de interface dentro do dashboard

Para limpar o ambiente de teste, basta apagar os dados do site no navegador ou limpar o `localStorage` nas ferramentas de desenvolvedor.

## Status do projeto

O NexForge esta em fase de prototipo funcional. A base atual ja cobre os principais fluxos de navegacao, perfis, RFQs, propostas, projetos e responsividade. Os proximos passos naturais seriam integrar um backend real, persistencia em banco de dados, autenticacao segura e permissoes por organizacao.

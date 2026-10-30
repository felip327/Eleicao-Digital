# ⚽ Quem é o Melhor? — Votação Digital com PWA

> **Eleição digital interativa** para eleger o melhor jogador de futebol de todos os tempos.  
> Funciona **100% offline** graças a Service Worker, Cache API, IndexedDB e Background Sync.

---

## 👥 Equipe

| Integrante | Função |
|---|---|
| _(adicione os nomes dos integrantes aqui)_ | _(função)_ |

---

## 🎯 Objetivo

Desenvolver uma **Progressive Web App (PWA)** que simula uma eleição digital completa, demonstrando na prática os principais recursos modernos de aplicações web:

- Funcionamento **offline** via Service Worker e Cache API
- **Sincronização em segundo plano** (Background Sync) de votos feitos sem internet
- **Notificações push** via Notifications API
- Otimização de carregamento com **Preload, Prefetch e DNS-prefetch**
- Persistência local via **IndexedDB** com fila de ações pendentes

---

## 🔗 Links

| Recurso | URL |
|---|---|
| 📁 Repositório GitHub | _(adicione a URL do repositório aqui)_ |
| 🌐 Aplicação publicada | _(adicione a URL do GitHub Pages / Netlify / Vercel aqui)_ |
| 🎬 Vídeo de demonstração | _(adicione o link do vídeo aqui — YouTube, Drive, etc.)_ |

> Se não houver publicação online, consulte a seção **"Como Executar Localmente"** abaixo.

---

## 🛠️ Tecnologias

| Tecnologia | Uso |
|---|---|
| HTML5 | Estrutura das páginas |
| CSS3 | Estilização responsiva |
| JavaScript (ES2020+) | Lógica de negócio, SPA leve |
| Service Worker API | Cache offline, Background Sync |
| Cache API | App Shell e estratégia stale-while-revalidate |
| IndexedDB | Persistência local de votos e fila de sincronização |
| Background Sync API | Reenvio automático de votos feitos offline |
| Notifications API | Alertas sobre apuração e confirmação de voto |
| Web App Manifest | Instalação como PWA |
| Node.js | Servidor estático + API REST de votação |

---

## 🚀 Como Executar Localmente

### Pré-requisitos

- **Node.js** (qualquer versão recente — [nodejs.org](https://nodejs.org))
- Não há dependências para instalar (`npm install` **não é necessário**)

### Passo a passo

```bash
# 1. Clone ou extraia o projeto
git clone <URL_DO_REPOSITORIO>
cd Eleicao-Digital-main

# 2. Inicie o servidor
node server.js

# 3. Acesse no navegador
# http://localhost:3000
```

> **Por que `localhost:3000`?**  
> O `localhost` é um **contexto seguro** (assim como HTTPS), o que permite o uso de Service Worker e notificações sem necessidade de certificado SSL.

### Alternativa: sem Node.js

Qualquer servidor estático funciona (ex.: extensão **Live Server** do VS Code).  
Nesse caso, **não haverá API** (`/api/votar` e `/api/apuracao`), e o site entra em **modo simulado**: o voto é confirmado localmente e a apuração soma os votos fictícios do `candidatos.json`.

---

## 📁 Estrutura do Projeto

```
Eleicao-Digital-main/
│
├── index.html            # Página inicial — lista os jogadores candidatos
├── votar.html            # Tela de votação com confirmação e recibo
├── apuracao.html         # Apuração em tempo real com barras de porcentagem
├── tecnico.html          # Painel técnico para demonstração (SW, cache, fila, notificações)
│
├── sw.js                 # Service Worker (cache, stale-while-revalidate, Background Sync)
├── manifest.webmanifest  # Manifesto PWA (ícones, nome, cores, display standalone)
├── server.js             # Servidor Node.js + API REST (/api/votar e /api/apuracao)
│
├── css/
│   └── style.css         # Estilos responsivos (tema verde EC Alvorada)
│
├── js/
│   ├── db.js             # IndexedDB: fila de votos, trava de voto duplo, sincronização
│   └── app.js            # Lógica de cada página, status de rede, notificações
│
├── data/
│   └── candidatos.json   # Dados dos jogadores, propostas e votos simulados base
│
├── icons/                # Ícones PWA (SVG, 192px, 512px)
├── img/                  # Ilustrações SVG dos jogadores e campo
│
├── votos.json            # Votos reais recebidos pela API (gerado em runtime)
└── build.py              # Script de geração dos HTMLs e SVGs (opcional)
```

---

## ✅ Funcionalidades

### Fluxo principal
- **Página inicial (`index.html`):** apresenta os jogadores candidatos (Messi, Cristiano Ronaldo, Neymar e Branco), com foto SVG, número, slogan e propostas
- **Votação (`votar.html`):** seleção do candidato, diálogo de confirmação, emissão de recibo com código único
- **Apuração (`apuracao.html`):** placar em barras animadas com votos reais (servidor) ou última cópia salva (offline/simulado)
- **Painel técnico (`tecnico.html`):** visão em tempo real do Service Worker, cache, fila IndexedDB e atalhos para testar notificações

### Recursos PWA
| Funcionalidade | Detalhes |
|---|---|
| **Um voto por sessão** | Checagem e gravação na mesma transação IndexedDB (impede duplo clique). O servidor recusa duplicata com HTTP 409. |
| **Funciona offline** | 18 arquivos em cache na instalação. Recarregar sem internet abre o site normalmente. |
| **Voto offline pendente** | Voto vai para a store `pendentes` do IndexedDB. Ao voltar a internet, é sincronizado automaticamente. |
| **Background Sync** | O navegador dispara o evento `sync-votos` quando a conexão volta, mesmo com a aba fechada. |
| **Notificações** | "Apuração disponível", "Voto confirmado" e "Nova proposta publicada" via Notifications API. |
| **Instalável (PWA)** | Web App Manifest completo — pode ser instalado no celular ou desktop como app nativo. |

---

## 🏗️ Decisões Técnicas

### 1. Estratégia de Cache — Stale-While-Revalidate

O Service Worker usa a estratégia **stale-while-revalidate** para todos os recursos do mesmo domínio (exceto a API):

```
1. Requisição chega ao SW
2. SW responde imediatamente do cache (stale) → sem espera para o usuário
3. SW atualiza o cache em segundo plano (revalidate) → próxima visita usa versão nova
```

O **App Shell** (19 arquivos: HTMLs, CSS, JS, JSON, SVGs, ícones) é pré-cacheado na instalação do SW, garantindo abertura instantânea offline.

**Exceções deliberadas:**
- `/api/*` → **sempre vai à rede** (nunca ao cache), pois dados de votação devem ser em tempo real
- Fontes externas (Google Fonts) → cacheadas com stale-while-revalidate após a primeira visita

### 2. Background Sync

```
Usuário vota offline
   ↓
Voto salvo na store "pendentes" (IndexedDB)
   ↓
SW registra tag "sync-votos"
   ↓
Navegador detecta conexão → dispara evento "sync"
   ↓
SW chama DB.sincronizar() → POST /api/votar
   ↓
Recibo muda de "Pendente" para "Confirmado"
   ↓
Notificação: "Voto confirmado"
```

Onde o Background Sync não tem suporte, o evento `window.online` cobre o mesmo fluxo enquanto a aba estiver aberta.

### 3. Push Notifications

Notificações são emitidas via `ServiceWorkerRegistration.showNotification()` (quando o SW está ativo) ou `new Notification()` como fallback. As tags usadas evitam duplicatas:

| Tag | Quando dispara |
|---|---|
| `voto-sincronizado` | Voto offline foi enviado com sucesso |
| `apuracao` | Apuração foi atualizada com dados do servidor |
| `teste-apuracao` | Botão de teste no Painel técnico |
| `teste-proposta` | Botão de teste no Painel técnico |

O clique na notificação abre (ou foca) a página correspondente via `notificationclick` no SW.

### 4. Preload, Prefetch e DNS-prefetch

| Técnica | Recursos | Justificativa |
|---|---|---|
| `<link rel="preload">` | `data/candidatos.json`, `img/campo.svg` | Descobertos tarde pelo navegador (JSON: só após JS rodar; campo: referência dentro do CSS). Prioridade **alta** — aceleração da primeira renderização. |
| `<link rel="prefetch">` | `votar.html`, `apuracao.html` | Próximas páginas na jornada do usuário. Baixadas em **tempo ocioso**, com prioridade baixa. Clique seguinte é quase instantâneo. |
| `<link rel="dns-prefetch">` | `fonts.googleapis.com`, `fonts.gstatic.com` | Único domínio de terceiros. Resolve o DNS antecipadamente, sem abrir conexão completa (mais leve que `preconnect`). |

> Após o Service Worker instalar e cachear tudo, o `prefetch` deixa de ser necessário. Ele é mais útil na primeira visita, quando o cache ainda está sendo construído.

### 5. IndexedDB — Estrutura

```
eleicao-ec-alvorada (banco)
├── pendentes (object store)   → votos aguardando sincronização
│   └── { id, idEleitor, candidatoId, criadoEm, feitoOffline }
└── meta (object store)        → dados de sessão
    ├── idEleitor              → UUID único por sessão (anti-fraude)
    ├── meuVoto                → voto atual + status (pendente/confirmado/duplicado)
    ├── apuracaoCache          → última apuração recebida do servidor
    └── votosLocais            → contagem local (modo simulado)
```

**Trava de voto duplo:** a leitura de `meuVoto` e a gravação do novo voto ocorrem na **mesma transação** IndexedDB — impossível votar duas vezes mesmo com clique duplo rápido.

### 6. API REST (Node.js)

| Endpoint | Método | Descrição |
|---|---|---|
| `GET /api/apuracao` | GET | Retorna totais por candidato (votos simulados + votos reais) |
| `POST /api/votar` | POST | Registra voto; retorna 409 se eleitor já votou |

O servidor é **opcional** — o site funciona em modo simulado sem ele.

---

## 🧪 Roteiro de Teste Offline (DevTools)

> Abra o DevTools com **F12** antes de começar.

**Passo 1 — Verificar Service Worker e Cache**
1. Acesse `http://localhost:3000` com internet
2. Navegue pelas 4 páginas
3. Em `Application > Service Workers`: confirme status **"activated and is running"**
4. Em `Application > Cache Storage > ec-alvorada-v1`: veja os ~18 arquivos guardados

**Passo 2 — Testar modo offline**
1. Em `Network`, mude de "No throttling" para **"Offline"**
2. Pressione **F5** (recarregar)
3. O site abre normalmente — CSS, JavaScript e candidatos funcionando

**Passo 3 — Votar offline**
1. Acesse `votar.html` (ainda offline)
2. Escolha um candidato e confirme
3. O recibo exibe **"Pendente"** e o topo mostra **"1 ação pendente"**
4. Em `Application > IndexedDB > eleicao-ec-alvorada > pendentes`: veja o registro

**Passo 4 — Sincronização automática**
1. Em `Network`, volte para **"No throttling"**
2. A sincronização roda automaticamente (evento `online` + Background Sync)
3. O recibo muda para **"Confirmado"** e a fila esvazia

**Passo 5 — Notificações**
1. Em `tecnico.html`, clique em **"Permitir notificações"**
2. Clique em **"Notificar: Apuração disponível"**
3. A notificação do sistema aparece no canto da tela

**Repetir a demonstração:** clique em **"Zerar sessão"** no Painel técnico.

---

## ⚠️ Limitações Conhecidas

| Limitação | Detalhes |
|---|---|
| **Background Sync** | Suporte limitado a Chrome/Edge. Em Firefox e Safari, o evento `window.online` cobre o caso com a aba aberta, mas não com a aba fechada. |
| **Notificações** | Requerem permissão explícita do usuário. Em Safari iOS, o suporte é mais recente e pode variar. |
| **Fontes externas** | Na primeira visita, é necessária internet para baixar as fontes do Google Fonts. Após isso, o SW as cacheia. Sem conexão e sem cache, o site usa as fontes do sistema. |
| **Modo simulado** | Sem o servidor Node.js, os votos são contados apenas localmente. A apuração mostra dados fictícios + votos daquele navegador. |
| **Um voto por sessão** | A trava é por sessão de navegador (IndexedDB). Usar uma aba anônima permite um novo voto — comportamento esperado para demonstração acadêmica. |

---

## 📸 Evidências

> As capturas de tela estão organizadas abaixo, relacionando cada uma ao requisito demonstrado.

| # | Evidência | Requisito |
|---|---|---|
| 1 | Service Worker ativo (`Application > Service Workers`) | Service Worker instalado e controlando |
| 2 | Cache Storage com arquivos do App Shell | Cache API com estratégia stale-while-revalidate |
| 3 | Site carregando offline (Network = Offline) | Funcionamento offline |
| 4 | Recibo com status "Pendente" + chip "1 ação pendente" | Fila de ações offline |
| 5 | IndexedDB `pendentes` com o registro do voto | Persistência local IndexedDB |
| 6 | Recibo mudando para "Confirmado" após voltar a rede | Sincronização automática |
| 7 | Notificação do sistema aparecendo | Push Notifications |
| 8 | Aba Network com `preload`, `prefetch` no cabeçalho das requisições | Preload / Prefetch / DNS-prefetch |

> _(Adicione os prints aqui ou em uma pasta `/evidencias` no repositório e link cada um na tabela acima)_

---

## 🎬 Vídeo de Demonstração

> Link: _(adicione aqui)_

O vídeo (até 7 minutos) demonstra:
1. Navegação pelas 4 páginas com internet
2. Ativação do Service Worker e inspeção do cache no DevTools
3. Simulação offline (Network → Offline)
4. Votação offline → recibo "Pendente"
5. Retorno da conexão → sincronização automática → recibo "Confirmado"
6. Disparo de notificações

---

## 📝 Notas Finais

- Para renovar o cache após alterar arquivos, troque `VERSAO` em `sw.js` (ex.: `v1` → `v2`)
- Os candidatos, propostas e clube são **fictícios** — projeto acadêmico
- O arquivo `build.py` regenera HTMLs e SVGs caso queira personalizar a aparência

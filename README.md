# Eleição simulada, EC Alvorada

Site de eleição simulada para a presidência de um clube de futebol fictício (Esporte Clube Alvorada). Funciona offline: Service Worker, Cache API, IndexedDB com fila de sincronização e notificações.

## Como rodar

Precisa do Node.js (qualquer versão recente). Não há dependências para instalar.

```
node server.js
```

Abra http://localhost:3000. O `localhost` conta como contexto seguro, então Service Worker e notificações funcionam sem HTTPS.

Sem Node, qualquer servidor estático serve (por exemplo o Live Server do VS Code). Nesse caso não existe `/api`, e o site entra em **modo simulado**: o voto pendente é "confirmado" localmente ao voltar a internet, e a apuração soma o voto aos números fictícios.

## O que cada arquivo faz

| Arquivo | Função |
|---|---|
| `index.html` | Candidatos: número, foto, cargo e propostas |
| `votar.html` | Voto simulado com confirmação e recibo |
| `apuracao.html` | Resultado simulado com barras e percentuais |
| `tecnico.html` | Painel para a demonstração: SW, cache, fila, notificações, roteiro de teste e explicação de preload/prefetch/dns-prefetch |
| `sw.js` | Service Worker: cache do site, abertura offline e Background Sync |
| `js/db.js` | IndexedDB: voto pendente, trava de voto duplo e sincronização |
| `js/app.js` | Telas, status de rede e notificações |
| `data/candidatos.json` | Candidatos e propostas (edite aqui) |
| `server.js` | Servidor estático e API `/api/votar` e `/api/apuracao` (guarda os votos em `votos.json`) |
| `build.py` | Gera os HTMLs, as imagens SVG e os ícones. Só rode se quiser alterar as páginas: `python3 build.py` |

## Como cada requisito foi atendido

- **Um voto por sessão:** o voto e a marca "já votou" são gravados na mesma transação do IndexedDB, então nem clique duplo vota duas vezes. O servidor também recusa um segundo voto do mesmo eleitor (resposta 409).
- **Funciona offline:** o Service Worker guarda 19 arquivos na Cache API na instalação e responde do cache (estratégia stale-while-revalidate).
- **Ação offline pendente:** o voto vai para a store `pendentes` do IndexedDB. Ao voltar a internet, o evento `online` (e o Background Sync, onde existir) envia a fila e o recibo muda de "Pendente" para "Confirmado".
- **Notificação:** "Apuração disponível" (ao atualizar a apuração ou confirmar o voto) e "Nova proposta publicada" (botão de teste no painel técnico).

## Preload, prefetch e dns-prefetch

| Técnica | Onde | Por que |
|---|---|---|
| `preload` | `data/candidatos.json` e `img/campo.svg` | O navegador só descobriria esses arquivos tarde (o JSON é pedido por JavaScript e o campo está dentro do CSS). Baixar com prioridade alta acelera a primeira tela. |
| `prefetch` | `votar.html` e `apuracao.html` | São as próximas páginas prováveis. Baixam em tempo ocioso, com prioridade baixa, para o clique seguinte ser quase instantâneo. |
| `dns-prefetch` | `fonts.googleapis.com` e `fonts.gstatic.com` | Único domínio de terceiros. Resolver o DNS antes economiza tempo ao buscar as fontes, de forma mais leve que `preconnect`. |

## Roteiro de teste no DevTools (F12)

1. Com internet, navegue pelas 4 páginas. Em **Application > Service Workers** confira "activated" e, em **Cache Storage**, os arquivos guardados.
2. Em **Network**, troque "No throttling" por **Offline** e recarregue. O site abre com CSS e JS funcionando e os candidatos aparecem.
3. Em Votar, escolha um candidato e confirme. O recibo mostra **Pendente** e o topo mostra "1 ação pendente". Veja o registro em **Application > IndexedDB > eleicao-ec-alvorada > pendentes**.
4. Volte para "No throttling". O voto sincroniza sozinho e o recibo muda para **Confirmado**.
5. No Painel técnico, clique em "Permitir notificações" e depois em "Notificar: Apuração disponível".
6. Para repetir a demonstração, use "Zerar sessão" no painel técnico.

## Observações

- Se alterar qualquer arquivo do site, troque `VERSAO` no `sw.js` (por exemplo para `v2`) para renovar o cache.
- As fontes vêm do Google Fonts. Na primeira visita é preciso internet para baixá-las, depois o Service Worker as guarda. Sem elas, o site usa fontes do sistema.
- Candidatos, propostas e clube são fictícios.

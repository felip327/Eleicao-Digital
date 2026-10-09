#!/usr/bin/env python3
"""Gera páginas HTML, imagens SVG e ícones PNG do site. Rode: python3 build.py"""
import os
from PIL import Image, ImageDraw

RAIZ = os.path.dirname(os.path.abspath(__file__))
def gravar(caminho, texto):
    with open(os.path.join(RAIZ, caminho), 'w', encoding='utf-8') as f:
        f.write(texto)

# ---------------- SVGs ----------------
escudo = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 120">
<path d="M8 8h84v56c0 28-22 44-42 52C30 108 8 92 8 64z" fill="#17613a" stroke="#f2b90f" stroke-width="6"/>
<path d="M50 8v108" stroke="#f1f5ec" stroke-width="3" opacity=".5"/>
<circle cx="50" cy="44" r="20" fill="none" stroke="#f1f5ec" stroke-width="4"/>
<path d="M50 30l10 7-4 12H44l-4-12z" fill="#f2b90f"/>
<text x="50" y="96" text-anchor="middle" font-family="Arial Narrow,Impact,sans-serif" font-weight="700" font-size="26" fill="#f1f5ec">ECA</text>
</svg>'''
gravar('img/escudo.svg', escudo)
gravar('icons/icon.svg', escudo)

campo = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice" fill="none" stroke="#f1f5ec" stroke-opacity=".35" stroke-width="4">
<rect x="30" y="30" width="1140" height="540"/>
<path d="M600 30v540"/>
<circle cx="600" cy="300" r="90"/>
<circle cx="600" cy="300" r="6" fill="#f1f5ec" fill-opacity=".35"/>
<rect x="30" y="170" width="170" height="260"/><rect x="1000" y="170" width="170" height="260"/>
<rect x="30" y="240" width="60" height="120"/><rect x="1110" y="240" width="60" height="120"/>
</svg>'''
gravar('img/campo.svg', campo)

def foto(nome, cor, fundo, pele, cabelo, numero, estilo):
    cab = {
        'longo': f'<path d="M62 92c-6-40 12-58 38-58s44 18 38 58c-4-18-14-26-38-26s-34 8-38 26z" fill="{cabelo}"/><path d="M62 92c0 30 8 40 14 44l-4-44zM138 92c0 30-8 40-14 44l4-44z" fill="{cabelo}"/>',
        'curto': f'<path d="M66 84c-2-34 14-48 34-48s36 14 34 48c-6-14-16-20-34-20s-28 6-34 20z" fill="{cabelo}"/>',
        'coque': f'<circle cx="100" cy="30" r="14" fill="{cabelo}"/><path d="M66 84c-2-34 14-48 34-48s36 14 34 48c-6-14-16-20-34-20s-28 6-34 20z" fill="{cabelo}"/>',
        'nenhum': ''
    }[estilo]
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
<rect width="200" height="200" fill="{fundo}"/>
{cab if estilo=='longo' else ''}
<path d="M30 200c0-40 30-62 70-62s70 22 70 62z" fill="{cor}"/>
<path d="M82 140l18 18 18-18" fill="none" stroke="#f1f5ec" stroke-width="5"/>
<text x="100" y="188" text-anchor="middle" font-family="Arial Narrow,Impact,sans-serif" font-weight="700" font-size="30" fill="#f1f5ec">{numero}</text>
<rect x="88" y="112" width="24" height="28" fill="{pele}"/>
<ellipse cx="100" cy="86" rx="30" ry="36" fill="{pele}"/>
{cab if estilo!='longo' else ''}
<circle cx="89" cy="88" r="3" fill="#10241a"/><circle cx="111" cy="88" r="3" fill="#10241a"/>
<path d="M90 104q10 8 20 0" fill="none" stroke="#10241a" stroke-width="3" stroke-linecap="round"/>
</svg>'''
gravar('img/marina.svg',  foto('Marina',  '#1b6ca8', '#d9e8f3', '#c68a62', '#2b1a12', '10', 'coque'))
gravar('img/rogerio.svg', foto('Rogerio', '#b97300', '#f4e6c8', '#e0b08a', '#3b3b3b', '7',  'curto'))
gravar('img/helena.svg',  foto('Helena',  '#c2362d', '#f3d9d6', '#8d5a3b', '#150d0a', '9',  'longo'))
gravar('img/branco.svg', '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#e4eadf"/>
<rect x="55" y="45" width="90" height="110" rx="6" fill="#fff" stroke="#5f7066" stroke-width="6"/><path d="M75 80h50M75 105h50M75 130h30" stroke="#5f7066" stroke-width="6" stroke-linecap="round" opacity=".5"/></svg>''')

# ---------------- Ícones PNG (manifest e notificações) ----------------
for tam in (192, 512):
    im = Image.new('RGBA', (tam, tam), (15, 65, 40, 255))
    d = ImageDraw.Draw(im)
    m = tam * 0.14
    d.ellipse([m, m, tam - m, tam - m], outline=(242, 185, 15, 255), width=max(4, tam // 32))
    d.ellipse([tam * .38, tam * .38, tam * .62, tam * .62], fill=(241, 245, 236, 255))
    d.line([tam / 2, m, tam / 2, tam - m], fill=(241, 245, 236, 160), width=max(2, tam // 80))
    im.save(os.path.join(RAIZ, f'icons/icon-{tam}.png'))

gravar('manifest.webmanifest', '''{
  "name": "Eleição EC Alvorada 2026",
  "short_name": "Eleição Alvorada",
  "description": "Eleição simulada para a presidência do Esporte Clube Alvorada. Funciona offline.",
  "lang": "pt-BR",
  "start_url": "./index.html",
  "scope": "./",
  "display": "standalone",
  "background_color": "#0f4128",
  "theme_color": "#0f4128",
  "icons": [
    { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "icons/icon.svg", "sizes": "any", "type": "image/svg+xml" }
  ]
}
''')

# ---------------- HTML ----------------
FONTES = 'https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700&amp;family=Big+Shoulders+Display:wght@800&amp;display=swap'

def cabecalho(titulo, extras=''):
    return f'''<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{titulo} | EC Alvorada</title>
  <meta name="theme-color" content="#0f4128">
  <link rel="manifest" href="manifest.webmanifest">
  <link rel="icon" href="icons/icon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="icons/icon-192.png">

  <!-- DNS-PREFETCH: o único domínio externo é o do Google Fonts. Resolver o DNS antes
       poupa alguns milissegundos quando o navegador achar a fonte. -->
  <link rel="dns-prefetch" href="https://fonts.googleapis.com">
  <link rel="dns-prefetch" href="https://fonts.gstatic.com">
{extras}
  <link rel="stylesheet" href="css/style.css">
  <link rel="stylesheet" href="{FONTES}">
  <script src="js/db.js" defer></script>
  <script src="js/app.js" defer></script>
</head>
'''

PRELOAD = '''
  <!-- PRELOAD: recursos críticos que o navegador só descobriria tarde.
       O JSON é pedido por JavaScript; o desenho do campo é citado dentro do CSS. -->
  <link rel="preload" href="data/candidatos.json" as="fetch" type="application/json" crossorigin>
  <link rel="preload" href="img/campo.svg" as="image">
'''

def prefetch(*paginas):
    linhas = ''.join(f'  <link rel="prefetch" href="{p}" as="document">\n' for p in paginas)
    return '\n  <!-- PREFETCH: páginas que a pessoa provavelmente abrirá a seguir. Baixadas com prioridade baixa, em tempo ocioso. -->\n' + linhas

def topo(atual):
    itens = [('index.html', 'Candidatos'), ('votar.html', 'Votar'), ('apuracao.html', 'Apuração'), ('tecnico.html', 'Painel técnico')]
    menu = ''.join(f'<a href="{h}"{" aria-current=\"page\"" if h == atual else ""}>{t}</a>' for h, t in itens)
    return f'''<body data-pagina="{{pag}}">
<header class="topo">
  <div class="topo-in">
    <a class="marca" href="index.html"><img src="img/escudo.svg" alt="" width="38" height="38">EC Alvorada</a>
    <nav class="menu" aria-label="Principal">{menu}</nav>
  </div>
  <div class="faixa-status"><div><span id="chip-rede" class="chip">Verificando rede</span><span id="chip-fila" class="chip">Fila</span></div></div>
</header>
'''

RODAPE = '''
<footer class="rodape"><p>Eleição simulada, feita para fins de estudo. Os candidatos, as propostas e o clube são fictícios.</p></footer>
<div id="aviso" role="status" aria-live="polite"></div>
</body>
</html>
'''

def pagina(arq, pag, titulo, extras, corpo):
    html = cabecalho(titulo, extras) + topo(arq).replace('{pag}', pag) + corpo + RODAPE
    gravar(arq, html)

pagina('index.html', 'candidatos', 'Candidatos', PRELOAD + prefetch('votar.html', 'apuracao.html'), '''
<section class="hero">
  <div class="hero-in">
    <p class="hero-chamada">Eleição para a presidência 2026, Esporte Clube Alvorada</p>
    <h1>Quem veste a camisa 10 do Alvorada?</h1>
    <p>Conheça os três candidatos, leia as propostas e dê o seu voto. O site abre e registra o voto mesmo sem internet.</p>
    <div class="hero-acoes">
      <a class="botao" href="#candidatos">Ver os candidatos</a>
      <a class="botao vazado" href="votar.html">Ir direto para o voto</a>
    </div>
  </div>
</section>
<main>
  <section class="secao" id="candidatos" style="margin-top:0">
    <h2>Os candidatos</h2>
    <p class="apoio">Cada um tem um número, uma história no clube e três propostas para os próximos quatro anos.</p>
    <div class="escalacao-grade" id="lista" aria-live="polite"></div>
  </section>
</main>''')

pagina('votar.html', 'votar', 'Votar', PRELOAD + prefetch('apuracao.html'), '''
<main>
  <h2>Votar</h2>
  <p class="apoio" style="color:var(--muda);max-width:60ch">Escolha um candidato ou vote em branco. Cada sessão pode votar uma única vez. Sem internet, o voto fica guardado neste aparelho e é enviado quando a conexão voltar.</p>
  <form id="form-voto">
    <fieldset class="opcoes" id="opcoes"><legend>Escolha uma opção</legend></fieldset>
    <div class="votar-acoes"><button class="botao escuro" id="btn-votar" type="submit" disabled>Revisar meu voto</button></div>
  </form>
  <section id="recibo" class="recibo" hidden aria-live="polite"></section>
  <dialog id="dialogo" aria-labelledby="dialogo-titulo">
    <h3 id="dialogo-titulo">Confirmar voto</h3>
    <p id="dialogo-texto"></p>
    <div class="linha-botoes">
      <button class="botao vazado" id="dialogo-corrigir" type="button" style="color:var(--tinta)">Corrigir</button>
      <button class="botao escuro" id="dialogo-confirmar" type="button">Confirmar voto</button>
    </div>
  </dialog>
</main>''')

pagina('apuracao.html', 'apuracao', 'Apuração', PRELOAD + prefetch('votar.html'), '''
<main>
  <h2>Apuração</h2>
  <p class="apoio" style="color:var(--muda);max-width:60ch">Resultado simulado da eleição. Os números iniciais são fictícios e os votos feitos aqui são somados a eles.</p>
  <div class="placar" id="placar" style="margin-top:1.25rem"></div>
  <div class="barras" id="barras"></div>
  <p class="fonte-dados" id="fonte"></p>
  <div class="acoes">
    <button class="botao escuro" data-acao="atualizar-apuracao" type="button">Atualizar apuração</button>
    <button class="botao vazado" data-acao="ativar-notif" type="button" style="color:var(--tinta)">Ativar notificações</button>
  </div>
</main>''')

pagina('tecnico.html', 'tecnico', 'Painel técnico', prefetch('index.html'), '''
<main>
  <h2>Painel técnico</h2>
  <p class="apoio" style="color:var(--muda);max-width:60ch">Mostra o que está acontecendo por baixo do site. Use junto com o DevTools (F12) na demonstração.</p>

  <div class="painel-grade">
    <div class="painel"><h3>Service Worker</h3><p class="valor" id="t-sw">Verificando</p></div>
    <div class="painel"><h3>Rede</h3><p class="valor" id="t-rede">Verificando</p></div>
    <div class="painel"><h3>Notificações</h3><p class="valor" id="t-notif">Verificando</p>
      <button class="botao escuro" data-acao="ativar-notif" type="button">Permitir notificações</button></div>
    <div class="painel"><h3>Seu voto</h3><p class="valor" id="t-voto">Verificando</p></div>
    <div class="painel"><h3>Fila pendente (IndexedDB)</h3><ul id="t-fila"></ul>
      <p style="margin-top:.75rem"><button class="botao escuro" data-acao="sincronizar" type="button">Sincronizar agora</button></p></div>
    <div class="painel"><h3>Cache API</h3><ul id="t-cache"></ul></div>
  </div>

  <section class="secao">
    <h2>Testar notificações</h2>
    <div class="acoes">
      <button class="botao escuro" data-acao="teste-apuracao" type="button">Notificar: Apuração disponível</button>
      <button class="botao escuro" data-acao="teste-proposta" type="button">Notificar: Nova proposta publicada</button>
      <button class="botao perigo" data-acao="zerar" type="button">Zerar sessão (repetir a demo)</button>
    </div>
  </section>

  <section class="secao">
    <h2>Roteiro de teste no DevTools</h2>
    <ol class="roteiro">
      <li>Abra o site com internet e navegue pelas 4 páginas. Em <code>Application &gt; Service Workers</code>, confira o status "activated". Em <code>Cache Storage</code>, veja os arquivos guardados.</li>
      <li>Em <code>Network</code>, troque "No throttling" por <strong>Offline</strong> e recarregue (F5). O site abre, com CSS e JavaScript funcionando.</li>
      <li>Na página inicial, os candidatos, números, fotos e propostas aparecem normalmente (vêm do cache).</li>
      <li>Em Votar, escolha um candidato e confirme. O recibo aparece como <strong>Pendente</strong>, e a faixa do topo mostra "1 ação pendente".</li>
      <li>Aqui no painel técnico, a fila lista o voto. Em <code>Application &gt; IndexedDB &gt; eleicao-ec-alvorada &gt; pendentes</code>, o registro também aparece.</li>
      <li>Volte a rede para "No throttling". A sincronização roda sozinha, o recibo muda para <strong>Confirmado</strong> e a fila esvazia.</li>
      <li>Clique em "Permitir notificações" e depois em "Notificar: Apuração disponível". A notificação do sistema aparece. Ela também aparece sozinha quando o voto offline é sincronizado.</li>
    </ol>
  </section>

  <section class="secao">
    <h2>Preload, prefetch e dns-prefetch</h2>
    <div class="tabela-rolagem">
    <table class="explica">
      <thead><tr><th>Técnica</th><th>Onde usamos</th><th>Por que escolhemos</th></tr></thead>
      <tbody>
        <tr><td><code>preload</code></td><td><code>data/candidatos.json</code> e <code>img/campo.svg</code></td><td>São recursos críticos que o navegador descobre tarde: o JSON só é pedido depois que o JavaScript roda, e o desenho do campo está dentro do CSS. O preload manda baixar já, com prioridade alta, e a tela dos candidatos aparece mais rápido.</td></tr>
        <tr><td><code>prefetch</code></td><td><code>votar.html</code> e <code>apuracao.html</code></td><td>Quem vê os candidatos vai votar em seguida, e quem vota vai ver a apuração. O prefetch baixa essas páginas em tempo ocioso, com prioridade baixa, para o próximo clique ser quase instantâneo.</td></tr>
        <tr><td><code>dns-prefetch</code></td><td><code>fonts.googleapis.com</code> e <code>fonts.gstatic.com</code></td><td>É o único domínio de terceiros do site. Resolver o DNS antes economiza a espera na hora de buscar as fontes. É mais leve que <code>preconnect</code>, que abre a conexão inteira, e basta para um domínio secundário.</td></tr>
      </tbody>
    </table>
    </div>
    <p style="margin-top:1rem;max-width:70ch">Depois que o Service Worker instala, as páginas e os arquivos já estão no cache e o prefetch deixa de fazer diferença. Ele ajuda na primeira visita, quando o cache ainda está sendo montado.</p>
  </section>
</main>''')

print('ok')

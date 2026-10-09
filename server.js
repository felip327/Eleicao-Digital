/* server.js — servidor estático + API de apuração (sem dependências).
   Rodar: node server.js   ->  http://localhost:3000
   A API é opcional: sem ela (ex.: Live Server), o site usa o modo simulado. */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORTA = process.env.PORT || 3000;
const RAIZ = __dirname;
const ARQ_VOTOS = path.join(RAIZ, 'votos.json');
const dados = JSON.parse(fs.readFileSync(path.join(RAIZ, 'data/candidatos.json'), 'utf8'));
const opcoes = [...dados.candidatos, dados.branco];
const idsValidos = new Set(opcoes.map((c) => c.id));

// votos reais recebidos: { idEleitor: { idVoto, candidatoId, criadoEm } }
let votos = {};
try { votos = JSON.parse(fs.readFileSync(ARQ_VOTOS, 'utf8')); } catch (e) { /* começa vazio */ }

function totais() {
  const t = {};
  opcoes.forEach((c) => { t[c.id] = c.votosSimulados || 0; });
  Object.values(votos).forEach((v) => { t[v.candidatoId] += 1; });
  return t;
}

const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.webmanifest': 'application/manifest+json'
};

function json(res, status, corpo) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(corpo));
}

http.createServer((req, res) => {
  let url;
  try { url = new URL(req.url.replace(/^\/{2,}/, '/'), 'http://localhost'); }
  catch (e) { res.writeHead(400); return res.end('Requisição inválida'); }

  if (url.pathname === '/api/apuracao' && req.method === 'GET') {
    return json(res, 200, { totais: totais(), recebidos: Object.keys(votos).length });
  }

  if (url.pathname === '/api/votar' && req.method === 'POST') {
    let corpo = '';
    req.on('data', (c) => { corpo += c; if (corpo.length > 10000) req.destroy(); });
    req.on('end', () => {
      let v;
      try { v = JSON.parse(corpo); } catch (e) { return json(res, 400, { erro: 'JSON inválido' }); }
      if (!v.idEleitor || !v.idVoto || !idsValidos.has(v.candidatoId)) return json(res, 400, { erro: 'Voto inválido' });
      if (votos[v.idEleitor]) return json(res, 409, { erro: 'Este eleitor já votou' });
      votos[v.idEleitor] = { idVoto: v.idVoto, candidatoId: v.candidatoId, criadoEm: v.criadoEm };
      fs.writeFile(ARQ_VOTOS, JSON.stringify(votos, null, 2), () => {});
      json(res, 200, { ok: true });
    });
    return;
  }

  if (url.pathname.startsWith('/api/')) return json(res, 404, { erro: 'Não encontrado' });

  let rel = decodeURIComponent(url.pathname);
  if (rel.endsWith('/')) rel += 'index.html';
  const arq = path.normalize(path.join(RAIZ, rel));
  if (!arq.startsWith(RAIZ + path.sep) || ['server.js', 'votos.json', 'build.py'].includes(path.basename(arq))) {
    res.writeHead(403); return res.end('Proibido');
  }
  fs.readFile(arq, (err, conteudo) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('Não encontrado'); }
    const cab = { 'Content-Type': TIPOS[path.extname(arq)] || 'application/octet-stream' };
    if (path.basename(arq) === 'sw.js') cab['Cache-Control'] = 'no-cache';
    res.writeHead(200, cab);
    res.end(conteudo);
  });
}).listen(PORTA, () => console.log('Eleição EC Alvorada em http://localhost:' + PORTA));

/* db.js — IndexedDB + fila de sincronização.
   Roda tanto na página (window) quanto no Service Worker (self). */
(function (g) {
  'use strict';

  const DB_NOME = 'eleicao-ec-alvorada';
  const DB_VERSAO = 1;
  const canal = 'BroadcastChannel' in g ? new BroadcastChannel('eleicao-ec') : null;

  function abrir() {
    return new Promise((ok, erro) => {
      const r = indexedDB.open(DB_NOME, DB_VERSAO);
      r.onupgradeneeded = () => {
        const db = r.result;
        if (!db.objectStoreNames.contains('pendentes')) db.createObjectStore('pendentes', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'chave' });
      };
      r.onsuccess = () => ok(r.result);
      r.onerror = () => erro(r.error);
    });
  }

  const req = (r) => new Promise((ok, erro) => { r.onsuccess = () => ok(r.result); r.onerror = () => erro(r.error); });
  const fim = (tx) => new Promise((ok, erro) => { tx.oncomplete = () => ok(); tx.onerror = () => erro(tx.error); tx.onabort = () => erro(tx.error); });
  const novoId = () => (g.crypto && g.crypto.randomUUID ? g.crypto.randomUUID() : 'id-' + Date.now() + '-' + Math.random().toString(16).slice(2));

  async function getMeta(chave) {
    const db = await abrir();
    const v = await req(db.transaction('meta').objectStore('meta').get(chave));
    return v ? v.valor : undefined;
  }

  async function setMeta(chave, valor) {
    const db = await abrir();
    const tx = db.transaction('meta', 'readwrite');
    tx.objectStore('meta').put({ chave, valor });
    return fim(tx);
  }

  async function idDoEleitor() {
    let id = await getMeta('idEleitor');
    if (!id) { id = novoId(); await setMeta('idEleitor', id); }
    return id;
  }

  async function listarPendentes() {
    const db = await abrir();
    const lista = await req(db.transaction('pendentes').objectStore('pendentes').getAll());
    return lista.sort((a, b) => a.criadoEm.localeCompare(b.criadoEm));
  }

  /* Registra o voto localmente como PENDENTE.
     Checagem e gravação na mesma transação: impede voto duplo (inclusive duplo clique). */
  async function registrarVoto(candidatoId) {
    const idEleitor = await idDoEleitor();
    const db = await abrir();
    return new Promise((ok, erro) => {
      const tx = db.transaction(['pendentes', 'meta'], 'readwrite');
      const meta = tx.objectStore('meta');
      const pend = tx.objectStore('pendentes');
      const leitura = meta.get('meuVoto');
      let resultado;
      leitura.onsuccess = () => {
        if (leitura.result) { resultado = { jaVotou: true, voto: leitura.result.valor }; return; }
        const voto = {
          id: novoId(),
          idEleitor,
          candidatoId,
          criadoEm: new Date().toISOString(),
          feitoOffline: g.navigator ? !g.navigator.onLine : false
        };
        pend.put(voto);
        const meu = { id: voto.id, candidatoId, criadoEm: voto.criadoEm, feitoOffline: voto.feitoOffline, status: 'pendente' };
        meta.put({ chave: 'meuVoto', valor: meu });
        resultado = { jaVotou: false, voto: meu };
      };
      tx.oncomplete = () => ok(resultado);
      tx.onerror = () => erro(tx.error);
      tx.onabort = () => erro(tx.error);
    });
  }

  async function notificar(titulo, corpo, tag, url) {
    if (!('Notification' in g) || Notification.permission !== 'granted') return false;
    const opcoes = { body: corpo, tag, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', data: { url: url || 'apuracao.html' } };
    let reg = g.registration; // dentro do Service Worker
    if (!reg && g.navigator && g.navigator.serviceWorker) {
      try { reg = await g.navigator.serviceWorker.ready; } catch (e) { reg = null; }
    }
    if (reg && reg.showNotification) { await reg.showNotification(titulo, opcoes); return true; }
    new Notification(titulo, opcoes);
    return true;
  }

  async function atualizarMeuVoto(status) {
    const atual = await getMeta('meuVoto');
    if (atual) await setMeta('meuVoto', Object.assign({}, atual, { status }));
  }

  async function somarVotoLocal(candidatoId) {
    const locais = (await getMeta('votosLocais')) || {};
    locais[candidatoId] = (locais[candidatoId] || 0) + 1;
    await setMeta('votosLocais', locais);
  }

  async function removerPendente(id) {
    const db = await abrir();
    const tx = db.transaction('pendentes', 'readwrite');
    tx.objectStore('pendentes').delete(id);
    return fim(tx);
  }

  /* Envia os votos pendentes para o servidor.
     - 200: confirmado
     - 409: o servidor já tinha voto desse eleitor (não conta duas vezes)
     - 404/405/501: não há API (ex.: Live Server) -> confirma em modo simulado
     - erro de rede (offline): continua pendente */
  let emAndamento = null;
  function sincronizar() {
    if (emAndamento) return emAndamento;
    emAndamento = (async () => {
      const resumo = { enviados: 0, duplicados: 0, simulados: 0, falhas: 0, restantes: 0 };
      const lista = await listarPendentes();
      for (const v of lista) {
        let resp;
        try {
          resp = await fetch('api/votar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idVoto: v.id, idEleitor: v.idEleitor, candidatoId: v.candidatoId, criadoEm: v.criadoEm })
          });
        } catch (e) { resumo.falhas++; break; }

        if (resp.ok) { resumo.enviados++; await atualizarMeuVoto('confirmado'); }
        else if (resp.status === 409) { resumo.duplicados++; await atualizarMeuVoto('duplicado'); }
        else if ([404, 405, 501].includes(resp.status)) { resumo.simulados++; await somarVotoLocal(v.candidatoId); await atualizarMeuVoto('confirmado-simulado'); }
        else { resumo.falhas++; break; }
        await removerPendente(v.id);
      }
      resumo.restantes = (await listarPendentes()).length;
      if (resumo.enviados + resumo.duplicados + resumo.simulados > 0) {
        if (canal) canal.postMessage({ tipo: 'sincronizado', resumo });
        await notificar('Voto confirmado', 'Seu voto offline foi sincronizado com a apuração do Alvorada.', 'voto-sincronizado', 'apuracao.html');
      }
      return resumo;
    })().finally(() => { emAndamento = null; });
    return emAndamento;
  }

  async function limpar() {
    const db = await abrir();
    const tx = db.transaction(['pendentes', 'meta'], 'readwrite');
    tx.objectStore('pendentes').clear();
    tx.objectStore('meta').clear();
    return fim(tx);
  }

  g.DB = { getMeta, setMeta, idDoEleitor, listarPendentes, registrarVoto, sincronizar, notificar, limpar, canal };
})(typeof self !== 'undefined' ? self : window);

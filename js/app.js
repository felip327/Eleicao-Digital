/* app.js — lógica compartilhada por todas as páginas. */
(() => {
  'use strict';

  const $ = (sel, raiz = document) => raiz.querySelector(sel);
  const pagina = document.body.dataset.pagina;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const hora = (t) => new Date(t).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  /* ---------- Dados ---------- */
  let dadosCache = null;
  async function carregarDados() {
    if (!dadosCache) {
      const r = await fetch('data/candidatos.json');
      if (!r.ok) throw new Error('Não foi possível carregar os candidatos.');
      dadosCache = await r.json();
    }
    return dadosCache;
  }
  const todasOpcoes = (d) => [...d.candidatos, d.branco];
  const achar = (d, id) => todasOpcoes(d).find((c) => c.id === id);

  /* ---------- Avisos na tela ---------- */
  let temporizadorAviso;
  function aviso(msg) {
    const el = $('#aviso');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('visivel');
    clearTimeout(temporizadorAviso);
    temporizadorAviso = setTimeout(() => el.classList.remove('visivel'), 4500);
  }

  /* ---------- Barra de status (rede e fila) ---------- */
  async function atualizarStatus() {
    const rede = $('#chip-rede');
    const fila = $('#chip-fila');
    const online = navigator.onLine;
    if (rede) {
      rede.textContent = online ? 'Online' : 'Offline';
      rede.className = 'chip ' + (online ? 'online' : 'offline');
    }
    if (fila) {
      const n = (await DB.listarPendentes()).length;
      fila.textContent = n === 0 ? 'Nenhuma ação pendente' : n + (n === 1 ? ' ação pendente' : ' ações pendentes');
      fila.className = 'chip' + (n > 0 ? ' fila-cheia' : '');
    }
  }

  /* ---------- Service Worker ---------- */
  let registro = null;
  async function registrarSW() {
    if (!('serviceWorker' in navigator)) return null;
    try {
      registro = await navigator.serviceWorker.register('sw.js');
    } catch (e) {
      console.warn('Falha ao registrar o Service Worker:', e);
    }
    return registro;
  }

  /* ---------- Sincronização ---------- */
  async function pedirSincronizacao() {
    // Background Sync (quando existir) cobre o caso de a aba ser fechada antes de a internet voltar.
    try {
      const reg = await navigator.serviceWorker.ready;
      if ('sync' in reg) await reg.sync.register('sync-votos');
    } catch (e) { /* sem suporte: o evento "online" cuida */ }
    if (navigator.onLine) return sincronizarAgora(false);
    return null;
  }

  async function sincronizarAgora(mostrarMensagem) {
    const resumo = await DB.sincronizar();
    await atualizarStatus();
    await reagir();
    const feitos = resumo.enviados + resumo.duplicados + resumo.simulados;
    if (feitos > 0) aviso('Sincronizado: ' + feitos + (feitos === 1 ? ' ação enviada.' : ' ações enviadas.'));
    else if (mostrarMensagem) aviso(resumo.falhas ? 'Sem conexão com o servidor. A ação continua pendente.' : 'Nada pendente para sincronizar.');
    return resumo;
  }

  /* ---------- Notificações ---------- */
  async function garantirPermissao() {
    if (!('Notification' in window)) { aviso('Este navegador não suporta notificações.'); return false; }
    if (Notification.permission === 'default') await Notification.requestPermission();
    if (Notification.permission !== 'granted') { aviso('Notificações bloqueadas. Libere nas configurações do site.'); return false; }
    return true;
  }

  /* ---------- Apuração (servidor, cópia salva ou simulação local) ---------- */
  async function obterApuracao(dados) {
    try {
      if (!navigator.onLine) throw new Error('offline');
      const r = await fetch('api/apuracao', { cache: 'no-store' });
      if ((r.headers.get('content-type') || '').includes('json') && r.ok) {
        const j = await r.json();
        const agora = Date.now();
        await DB.setMeta('apuracaoCache', { totais: j.totais, em: agora });
        return { totais: j.totais, origem: 'servidor', em: agora };
      }
    } catch (e) { /* cai para a cópia salva */ }
    const copia = await DB.getMeta('apuracaoCache');
    if (copia) return { totais: copia.totais, origem: 'copia', em: copia.em };
    const locais = (await DB.getMeta('votosLocais')) || {};
    const totais = {};
    todasOpcoes(dados).forEach((c) => { totais[c.id] = (c.votosSimulados || 0) + (locais[c.id] || 0); });
    return { totais, origem: 'simulada', em: Date.now() };
  }

  const TEXTO_FONTE = {
    servidor: (em) => 'Dados do servidor, atualizados às ' + hora(em) + '.',
    copia: (em) => 'Sem conexão com o servidor. Mostrando a última cópia salva neste aparelho, de ' + hora(em) + '.',
    simulada: () => 'Modo simulado: não há servidor de apuração disponível. Os números iniciais são fictícios e somam apenas os votos feitos neste navegador.'
  };

  /* ---------- Página: candidatos ---------- */
  async function paginaCandidatos() {
    const lista = $('#lista');
    const dados = await carregarDados();
    lista.innerHTML = dados.candidatos.map((c) => `
      <article class="escalacao" style="--cor:${c.cor}" id="${c.id}">
        <div class="cartao-topo">
          <span class="numero" aria-label="Número ${c.numero}">${c.numero}</span>
          <img class="foto" src="${c.foto}" alt="Foto de ${esc(c.nome)}" width="104" height="104">
        </div>
        <h3>${esc(c.nome)}</h3>
        <p class="cargo">${esc(c.cargo)}</p>
        <p class="slogan">“${esc(c.slogan)}”</p>
        <h4>Por que ele é o melhor?</h4>
        <ul class="propostas">
          ${c.propostas.map((p) => `<li><strong>${esc(p.titulo)}</strong>${esc(p.texto)}</li>`).join('')}
        </ul>
        <a class="botao" href="votar.html#${c.id}">Votar em ${esc(c.nome)}</a>
      </article>`).join('');
  }

  /* ---------- Página: votar ---------- */
  function textoRecibo(meu) {
    switch (meu.status) {
      case 'confirmado': return { classe: '', selo: 'Confirmado', msg: 'Seu voto foi enviado e já conta na apuração.' };
      case 'confirmado-simulado': return { classe: '', selo: 'Confirmado (simulado)', msg: 'Não há servidor de apuração nesta execução. O voto foi contado só neste navegador.' };
      case 'duplicado': return { classe: 'alerta', selo: 'Já contado', msg: 'O servidor já tinha um voto desta sessão. Seu voto não foi contado duas vezes.' };
      default: return {
        classe: 'pendente',
        selo: 'Pendente',
        msg: meu.feitoOffline
          ? 'Você votou sem internet. O voto está guardado neste aparelho e será enviado quando a conexão voltar.'
          : 'Voto guardado neste aparelho. Ele será enviado assim que o servidor responder.'
      };
    }
  }

  async function mostrarRecibo(dados) {
    const meu = await DB.getMeta('meuVoto');
    const caixa = $('#recibo');
    if (!meu) { caixa.hidden = true; $('#form-voto').hidden = false; return; }
    const c = achar(dados, meu.candidatoId);
    const t = textoRecibo(meu);
    $('#form-voto').hidden = true;
    caixa.hidden = false;
    caixa.className = 'recibo ' + t.classe;
    caixa.innerHTML = `
      <p><span class="selo ${t.classe}">${t.selo}</span></p>
      <h2>Você votou em ${esc(c ? c.nome : meu.candidatoId)}</h2>
      <p>${t.msg}</p>
      <p class="codigo">Recibo ${esc(meu.id.slice(0, 8))}, registrado às ${hora(meu.criadoEm)}</p>
      <p>Cada sessão vota uma vez. <a href="apuracao.html">Ver apuração</a></p>`;
  }

  async function paginaVotar() {
    const dados = await carregarDados();
    const opcoes = $('#opcoes');
    opcoes.insertAdjacentHTML('beforeend', todasOpcoes(dados).map((c) => `
      <label class="opcao" style="--cor:${c.cor}">
        <input type="radio" name="candidato" value="${c.id}">
        <img src="${c.foto}" alt="" width="60" height="60">
        <span class="n">${c.numero}</span>
        <span class="nome">${esc(c.nome)}${c.cargo ? `<small>${esc(c.cargo)}</small>` : ''}</span>
      </label>`).join(''));

    const botao = $('#btn-votar');
    const dialogo = $('#dialogo');
    const marcar = (id) => { const r = $(`input[value="${id}"]`, opcoes); if (r) { r.checked = true; botao.disabled = false; } };
    if (location.hash) marcar(location.hash.slice(1));
    opcoes.addEventListener('change', () => { botao.disabled = false; });

    $('#form-voto').addEventListener('submit', (ev) => {
      ev.preventDefault();
      const sel = $('input[name="candidato"]:checked', opcoes);
      if (!sel) return;
      const c = achar(dados, sel.value);
      $('#dialogo-texto').textContent = c.id === 'branco'
        ? 'Você vai votar em branco. Depois de confirmar, não dá para mudar.'
        : `Você vai votar em ${c.nome} (número ${c.numero}). Depois de confirmar, não dá para mudar.`;
      dialogo.dataset.escolha = c.id;
      dialogo.showModal();
    });

    $('#dialogo-corrigir').addEventListener('click', () => dialogo.close());
    $('#dialogo-confirmar').addEventListener('click', async () => {
      const id = dialogo.dataset.escolha;
      dialogo.close();
      const r = await DB.registrarVoto(id);
      if (r.jaVotou) aviso('Esta sessão já votou. Um voto por sessão.');
      else aviso(navigator.onLine ? 'Voto registrado.' : 'Voto registrado offline. Fica pendente até a internet voltar.');
      await mostrarRecibo(dados);
      await atualizarStatus();
      if (!r.jaVotou) await pedirSincronizacao();
    });

    await mostrarRecibo(dados);
  }

  /* ---------- Página: apuração ---------- */
  async function paginaApuracao(notificarAoAtualizar) {
    const dados = await carregarDados();
    const ap = await obterApuracao(dados);
    const opcoes = todasOpcoes(dados);
    const total = opcoes.reduce((s, c) => s + (ap.totais[c.id] || 0), 0);
    const ordenadas = [...opcoes].sort((a, b) => (ap.totais[b.id] || 0) - (ap.totais[a.id] || 0));
    const maior = ap.totais[ordenadas[0].id] || 0;

    $('#placar').innerHTML = `<div><div class="rotulo">Votos apurados</div><div class="total">${total.toLocaleString('pt-BR')}</div></div>
      <div class="rotulo">Quem é o melhor jogador?</div>`;
    $('#barras').innerHTML = ordenadas.map((c) => {
      const v = ap.totais[c.id] || 0;
      const pct = total ? (v / total) * 100 : 0;
      return `<div class="barra-linha${v === maior && v > 0 ? ' lider' : ''}" style="--cor:${c.cor}">
        <div class="quem">${esc(c.nome)}<small>${c.id === 'branco' ? 'Voto em branco' : 'Camisa ' + c.numero}</small></div>
        <div class="trilho" role="img" aria-label="${esc(c.nome)}: ${pct.toFixed(1)}%"><div class="preenche" data-pct="${pct}"></div></div>
        <div class="votos">${v.toLocaleString('pt-BR')}<small>${pct.toFixed(1).replace('.', ',')}%</small></div>
      </div>`;
    }).join('');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      document.querySelectorAll('.preenche').forEach((el) => { el.style.width = el.dataset.pct + '%'; });
    }));
    $('#fonte').textContent = TEXTO_FONTE[ap.origem](ap.em);

    if (notificarAoAtualizar && ap.origem === 'servidor') {
      await DB.notificar('Apuração disponível', 'Os resultados atualizados da eleição do Alvorada já podem ser conferidos.', 'apuracao', 'apuracao.html');
    }
  }

  /* ---------- Página: painel técnico ---------- */
  async function paginaTecnico() {
    const sw = $('#t-sw');
    const ctrl = navigator.serviceWorker && navigator.serviceWorker.controller;
    const reg = navigator.serviceWorker ? await navigator.serviceWorker.getRegistration() : null;
    sw.textContent = !('serviceWorker' in navigator) ? 'Sem suporte neste navegador'
      : !reg ? 'Não registrado'
      : ctrl ? 'Ativo e controlando esta página'
      : 'Registrado. Recarregue a página para ele assumir o controle';

    $('#t-rede').textContent = navigator.onLine ? 'Online' : 'Offline';
    $('#t-notif').textContent = !('Notification' in window) ? 'Sem suporte' : ({ granted: 'Permitidas', denied: 'Bloqueadas', default: 'Ainda não pedidas' })[Notification.permission];

    const pend = await DB.listarPendentes();
    const dados = await carregarDados().catch(() => null);
    $('#t-fila').innerHTML = pend.length
      ? pend.map((p) => `<li>Voto em ${esc(dados && achar(dados, p.candidatoId) ? achar(dados, p.candidatoId).nome : p.candidatoId)}, criado às ${hora(p.criadoEm)}${p.feitoOffline ? ' (offline)' : ''}</li>`).join('')
      : '<li>Fila vazia</li>';

    const nomes = await caches.keys();
    let html = '';
    for (const n of nomes) {
      const c = await caches.open(n);
      const chaves = await c.keys();
      html += `<li><strong>${esc(n)}</strong>: ${chaves.length} arquivos</li>`;
    }
    $('#t-cache').innerHTML = html || '<li>Nenhum cache ainda</li>';

    const meu = await DB.getMeta('meuVoto');
    $('#t-voto').textContent = meu ? 'Já votou (' + meu.status + ')' : 'Ainda não votou';
  }

  /* ---------- Reação a mudanças ---------- */
  async function reagir() {
    try {
      if (pagina === 'votar') await mostrarRecibo(await carregarDados());
      else if (pagina === 'apuracao') await paginaApuracao(false);
      else if (pagina === 'tecnico') await paginaTecnico();
    } catch (e) { console.warn(e); }
  }

  /* ---------- Botões com data-acao ---------- */
  document.addEventListener('click', async (ev) => {
    const alvo = ev.target.closest('[data-acao]');
    if (!alvo) return;
    const acao = alvo.dataset.acao;
    if (acao === 'ativar-notif') {
      if (await garantirPermissao()) aviso('Notificações ativadas.');
      await reagir();
    } else if (acao === 'sincronizar') {
      await sincronizarAgora(true);
    } else if (acao === 'atualizar-apuracao') {
      await paginaApuracao(true);
      aviso('Apuração atualizada.');
    } else if (acao === 'teste-apuracao') {
      if (await garantirPermissao()) await DB.notificar('Apuração disponível', 'Os resultados da eleição do Alvorada já podem ser conferidos.', 'teste-apuracao', 'apuracao.html');
    } else if (acao === 'teste-proposta') {
      if (await garantirPermissao()) await DB.notificar('Nova proposta publicada', 'Marina Duarte publicou uma proposta nova. Toque para ler.', 'teste-proposta', 'index.html#marina');
    } else if (acao === 'zerar') {
      if (confirm('Apagar o voto, a fila pendente e o identificador desta sessão? Use só para repetir a demonstração.')) {
        await DB.limpar();
        aviso('Sessão zerada. Você pode votar de novo.');
        await atualizarStatus();
        await reagir();
      }
    }
  });

  /* ---------- Início ---------- */
  window.addEventListener('online', async () => {
    aviso('A internet voltou. Sincronizando…');
    await atualizarStatus();
    await sincronizarAgora(false);
    await reagir();
  });
  window.addEventListener('offline', async () => {
    aviso('Você está offline. O site continua funcionando.');
    await atualizarStatus();
    await reagir();
  });
  if (DB.canal) {
    DB.canal.onmessage = async () => { await atualizarStatus(); await reagir(); };
  }

  (async () => {
    await atualizarStatus();
    registrarSW();
    try {
      if (pagina === 'candidatos') await paginaCandidatos();
      else if (pagina === 'votar') await paginaVotar();
      else if (pagina === 'apuracao') await paginaApuracao(false);
      else if (pagina === 'tecnico') await paginaTecnico();
    } catch (e) {
      console.error(e);
      aviso('Não foi possível carregar os dados desta página.');
    }
    if (navigator.onLine && (await DB.listarPendentes()).length) await sincronizarAgora(false);
  })();
})();

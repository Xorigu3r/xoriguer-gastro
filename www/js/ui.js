/* Xoriguer Gastro — peces d'interfície reutilitzables. */
'use strict';
(function (g) {
  const t = (s, v) => (g.I18N ? g.I18N.t(s, v) : s);

  /** h('div.classe#id', {props}, ...fills) */
  function h(sel, props, ...fills) {
    if (props == null || typeof props !== 'object' || props instanceof Node || Array.isArray(props)) { fills.unshift(props); props = {}; }
    const m = sel.match(/^([a-z0-9]+)?((?:[.#][\w-]+)*)$/i) || [];
    const el = document.createElement(m[1] || 'div');
    (m[2] || '').replace(/([.#])([\w-]+)/g, (_, k, v) => { if (k === '.') el.classList.add(v); else el.id = v; });
    for (const [k, v] of Object.entries(props)) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className += ' ' + v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'html') el.innerHTML = v;
      else if (k in el && k !== 'list' && typeof v !== 'string') el[k] = v;
      else if (k === 'value') el.value = v;
      else el.setAttribute(k, v === true ? '' : v);
    }
    afegeix(el, fills);
    return el;
  }
  function afegeix(el, fills) {
    for (const f of fills.flat(Infinity)) {
      if (f == null || f === false) continue;
      el.appendChild(f instanceof Node ? f : document.createTextNode(String(f)));
    }
    return el;
  }
  const buida = (el) => { while (el.firstChild) el.removeChild(el.firstChild); return el; };

  // ── Icones (traç 24×24) ─────────────────────────────────────────────────
  const P = {
    tauler: 'M3 13h8V3H3zM13 21h8v-8h-8zM3 21h8v-6H3zM13 11h8V3h-8z',
    recepta: 'M6 3h9l4 4v14H6zM15 3v4h4M9 12h7M9 16h7M9 8h3',
    ingredient: 'M12 3c3 3 5 6 5 9a5 5 0 0 1-10 0c0-3 2-6 5-9zM12 15v-3',
    produccio: 'M4 21V10l6-4v4l6-4v4l4-2v13zM8 17h2M14 17h2',
    proveidor: 'M3 7h11v9H3zM14 10h4l3 3v3h-7M7 19a2 2 0 1 0 0-.01M17 19a2 2 0 1 0 0-.01',
    compra: 'M6 6h15l-2 8H8L6 3H3M9 20a1 1 0 1 0 0-.01M18 20a1 1 0 1 0 0-.01',
    estoc: 'M3 8l9-5 9 5v8l-9 5-9-5zM3 8l9 5 9-5M12 13v8',
    comanda: 'M8 4h8v3H8zM6 6H5v15h14V6h-1M9 12h6M9 16h4',
    vendes: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
    analisi: 'M3 3v18h18M7 15l4-4 3 3 6-7',
    carta: 'M4 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4zM20 4h-6M20 4v14h-6',
    menu: 'M4 5h16M4 12h16M4 19h10',
    appcc: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4',
    ajustos: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
    ajuda: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17v.01',
    cerca: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-5-5',
    mes: 'M12 5v14M5 12h14', x: 'M6 6l12 12M18 6L6 18', check: 'M5 12l5 5L20 7',
    edita: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4', paperera: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
    copia: 'M8 8h12v12H8zM4 16V4h12', imprimeix: 'M7 9V3h10v6M7 17H4v-7h16v7h-3M7 14h10v7H7z',
    baixa: 'M12 3v12M7 10l5 5 5-5M4 21h16', puja: 'M12 21V9M7 14l5-5 5 5M4 3h16',
    menuHam: 'M4 6h16M4 12h16M4 18h16', fletxa: 'M9 6l6 6-6 6', enrere: 'M15 6l-6 6 6 6',
    alerta: 'M12 3l10 18H2zM12 10v5M12 18v.01', info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7v.01',
    estrella: 'M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z',
    termo: 'M10 14V5a2 2 0 1 1 4 0v9a4 4 0 1 1-4 0zM12 9v7',
    etiqueta: 'M3 12V4h8l10 10-8 8zM7.5 8.5v.01', calendari: 'M4 5h16v16H4zM4 10h16M9 3v4M15 3v4',
    euro: 'M18 6a7 7 0 1 0 0 12M4 10h9M4 14h9', qr: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v2M14 18h2v2M18 18h2v2',
    plegar: 'M15 6l-6 6 6 6M20 4v16', desfer: 'M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3',
    foto: 'M4 7h3l2-3h6l2 3h3v13H4zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', balanc: 'M12 3v18M5 7h14M5 7l-3 7a3 3 0 0 0 6 0zM19 7l-3 7a3 3 0 0 0 6 0z',
    llista: 'M9 6h11M9 12h11M9 18h11M4 6v.01M4 12v.01M4 18v.01', merma: 'M4 4l16 16M12 3c3 3 5 6 5 9 0 1-.2 2-.6 2.8M8 8c-.7 1.3-1 2.6-1 4a5 5 0 0 0 8.5 3.5',
  };
  function ic(nom, cls = '') {
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor');
    s.setAttribute('stroke-width', '1.8'); s.setAttribute('stroke-linecap', 'round'); s.setAttribute('stroke-linejoin', 'round');
    s.setAttribute('width', '18'); s.setAttribute('height', '18');
    if (cls) s.setAttribute('class', cls);
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', P[nom] || P.info); s.appendChild(p);
    return s;
  }

  // ── Formats ──────────────────────────────────────────────────────────────
  const loc = () => ({ ca: 'ca-ES', es: 'es-ES', fr: 'fr-FR', en: 'en-GB' }[g.I18N?.llengua || 'ca']);
  const fN = (x, d = 2) => (Number.isFinite(x) ? x : 0).toLocaleString(loc(), { minimumFractionDigits: d, maximumFractionDigits: d });
  const eur = (x, d = 2) => fN(x, d) + ' ' + (g.Store?.D?.ajustos?.moneda || '€');
  const pct = (x, d = 1) => fN(x, d) + ' %';
  const qty = (x, u = '') => {
    const v = Math.abs(x) >= 100 ? fN(x, 0) : Math.abs(x) >= 10 ? fN(x, 1).replace(/[,.]0$/, '') : (+x.toFixed(3)).toLocaleString(loc(), { maximumFractionDigits: 3 });
    return u ? `${v} ${u}` : v;
  };
  const data = (iso, llarga = false) => {
    if (!iso) return '';
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(loc(), llarga ? { weekday: 'long', day: 'numeric', month: 'long' } : { day: '2-digit', month: '2-digit', year: '2-digit' });
  };
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ── Botons i camps ───────────────────────────────────────────────────────
  const btn = (txt, onclick, cls = '', icona = '', props = {}) => h('button.btn' + (cls ? '.' + cls.split(' ').join('.') : ''), { type: 'button', onclick, ...props }, icona ? ic(icona) : null, txt ? t(txt) : null);
  const btnIc = (icona, onclick, titol, cls = '') => h('button.btn.ic.fantasma' + (cls ? '.' + cls : ''), { type: 'button', onclick, title: t(titol) }, ic(icona));
  function camp(etiqueta, input, cls = '') { return h('label.camp' + (cls ? '.' + cls : ''), h('span', t(etiqueta)), input); }
  function inp(valor, oninput, props = {}) {
    const e = h('input', { type: 'text', value: valor ?? '', ...props });
    if (oninput) e.addEventListener('input', () => oninput(e.value, e));
    return e;
  }
  function inpNum(valor, oninput, props = {}) {
    const e = h('input', { type: 'text', inputmode: 'decimal', value: valor === '' || valor == null ? '' : String(valor).replace('.', ','), ...props });
    e.style.textAlign = 'right';
    e.addEventListener('focus', () => e.select());
    if (oninput) e.addEventListener('input', () => oninput(g.GL.num(e.value, 0), e));
    return e;
  }
  function ambU(input, u) { return h('div.amb-u', input, h('i', u)); }
  function sel(opcions, valor, onchange, props = {}) {
    const s = h('select', props);
    for (const o of opcions) {
      const [v, txt] = Array.isArray(o) ? o : [o, o];
      s.appendChild(h('option', { value: v, selected: String(v) === String(valor) }, t(String(txt))));
    }
    if (onchange) s.addEventListener('change', () => onchange(s.value, s));
    return s;
  }
  function cercador(placeholder, oninput, valor = '') {
    const i = h('input', { type: 'search', placeholder: t(placeholder), value: valor });
    let tmr; i.addEventListener('input', () => { clearTimeout(tmr); tmr = setTimeout(() => oninput(i.value), 90); });
    return h('div.cercador', ic('cerca'), i);
  }
  function grupBtn(opcions, valor, onchange) {
    const w = h('div.grup-btn');
    for (const [v, txt] of opcions) {
      w.appendChild(h('button', { type: 'button', class: v === valor ? 'on' : '', onclick: () => {
        [...w.children].forEach((b) => b.classList.remove('on'));
        w.children[opcions.findIndex((o) => o[0] === v)].classList.add('on'); onchange(v);
      } }, t(txt)));
    }
    return w;
  }
  /** Xips d'al·lèrgens: estat[k] = 'c' (conté) | 't' (traces) | undefined. Clic: res → conté → traces → res */
  function xipsAllergens(conte, traces, onchange, ambTraces = true) {
    const w = h('div.xips');
    const C = new Set(conte || []), T = new Set(traces || []);
    for (const a of g.GL.ALLERGENS) {
      const x = h('span.xip', { title: ambTraces ? t('Clic: conté · 2n clic: pot contenir traces · 3r: res') : '' }, a.ic, ' ', t(a.nom));
      const pinta = () => { x.classList.toggle('on', C.has(a.k)); x.classList.toggle('tr', T.has(a.k)); };
      x.onclick = () => {
        if (C.has(a.k)) { C.delete(a.k); if (ambTraces) T.add(a.k); } else if (T.has(a.k)) T.delete(a.k); else C.add(a.k);
        pinta(); onchange([...C], [...T]);
      };
      pinta(); w.appendChild(x);
    }
    return w;
  }
  function icAllergens(conte, traces = []) {
    if (!conte.length && !traces.length) return h('span.suau.petit', '—');
    return h('span.algs', conte.map((k) => h('span.alg', { title: t(g.GL.ALG[k].nom) }, g.GL.ALG[k].ic)),
      traces.map((k) => h('span.alg.tr', { title: t('Traces') + ': ' + t(g.GL.ALG[k].nom) }, g.GL.ALG[k].ic)));
  }

  // ── Taula ordenable ──────────────────────────────────────────────────────
  /** cols: [{k, t, r(ow)=>valor|node, v(row)=>valor per ordenar, cls:'r'|'c'|'nom', w}] */
  function taula({ cols, files, clau = 'id', onclic, ordre, peu, buit, cls = '', marcat }) {
    const est = { k: ordre?.[0] ?? null, dir: ordre?.[1] ?? 1 };
    const w = h('div.taula-w' + (cls ? '.' + cls : ''));
    const tb = h('table.t');
    const thead = h('thead'), tbody = h('tbody');
    tb.append(thead, tbody);
    function pinta() {
      buida(thead); buida(tbody);
      const tr = h('tr');
      cols.forEach((c) => {
        const th = h('th', { class: [c.cls || '', c.v !== false ? 'ord' : '', est.k === c.k ? 'on' : ''].join(' '), style: c.w ? { width: c.w } : null },
          c.t ? t(c.t) : '', est.k === c.k ? (est.dir > 0 ? ' ↑' : ' ↓') : '');
        if (c.v !== false) th.onclick = () => { est.dir = est.k === c.k ? -est.dir : (c.desc ? -1 : 1); est.k = c.k; pinta(); };
        tr.appendChild(th);
      });
      thead.appendChild(tr);
      let fs = files.slice();
      if (est.k != null) {
        const c = cols.find((x) => x.k === est.k);
        const val = (f) => (c.v ? c.v(f) : f[c.k]);
        fs.sort((a, b) => {
          const x = val(a), y = val(b);
          return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x ?? '').localeCompare(String(y ?? ''), undefined, { numeric: true, sensitivity: 'base' })) * est.dir;
        });
      }
      if (!fs.length) tbody.appendChild(h('tr', h('td', { colspan: cols.length }, buit || h('div.buit', t('Res a mostrar')))));
      for (const f of fs) {
        const tr2 = h('tr', { class: (onclic ? 'clic ' : '') + (marcat && marcat(f) ? 'sel' : '') });
        if (onclic) tr2.onclick = (ev) => { if (!ev.target.closest('button,input,select,a,.no-clic')) onclic(f, ev); };
        for (const c of cols) {
          const v = c.r ? c.r(f) : f[c.k];
          tr2.appendChild(h('td', { class: c.cls || '' }, v instanceof Node ? v : v ?? ''));
        }
        tbody.appendChild(tr2);
      }
      if (peu) { const tf = h('tfoot', h('tr', peu.map((p) => h('td', { class: p?.cls || '' }, p?.v ?? p ?? '')))); tb.appendChild(tf); }
    }
    pinta();
    w.appendChild(tb);
    w.refresca = (nous) => { files = nous; const tf = tb.querySelector('tfoot'); if (tf) tf.remove(); pinta(); };
    return w;
  }

  // ── Panell lliscant, modal i avisos ─────────────────────────────────────
  let obert = [];
  function tancaTot() { while (obert.length) obert.pop()(); }
  /** Panell editor a la dreta. Retorna {cos, peu, tanca}. onTanca() pot retornar false per no tancar. */
  function panell(titol, { ample = false, onTanca, accions } = {}) {
    const vel = h('div.vel'), p = h('div.panell' + (ample ? '.ample' : ''));
    const cos = h('div.p-cos'), peu = h('div.p-peu');
    const ap = peu.append.bind(peu); peu.append = (...xs) => ap(...xs.filter((x) => x != null && x !== false)); // sense «null»
    const tanca = (forcat) => {
      if (!forcat && onTanca && onTanca() === false) return;
      vel.remove(); p.remove(); obert = obert.filter((f) => f !== tanca); document.removeEventListener('keydown', tecla);
    };
    const tecla = (e) => { if (e.key === 'Escape' && obert[obert.length - 1] === tanca && !document.querySelector('.modal,.paleta')) { e.preventDefault(); tanca(); } };
    vel.onclick = () => tanca();
    p.append(h('div.p-cap', typeof titol === 'string' ? h('h2', t(titol)) : titol, accions || null, btnIc('x', () => tanca(), 'Tancar')), cos, peu);
    document.body.append(vel, p);
    document.addEventListener('keydown', tecla);
    obert.push(tanca);
    return { p, cos, peu, tanca, titol: p.querySelector('h2') };
  }
  function modal(titol, cos, botons = [], ample = false) {
    return new Promise((res) => {
      const vel = h('div.vel.m'), m = h('div.modal' + (ample ? '.ample' : ''));
      const tanca = (v) => { vel.remove(); m.remove(); document.removeEventListener('keydown', tecla, true); res(v); };
      const tecla = (e) => {
        if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); tanca(null); }
        if (e.key === 'Enter' && !e.target.matches('textarea')) { const d = botons.find((b) => b.pri); if (d) { e.preventDefault(); tanca(d.v); } }
      };
      vel.onclick = () => tanca(null);
      m.append(h('div.m-cos', titol ? h('h2', t(titol)) : null, cos), h('div.m-peu', botons.map((b) => btn(b.t, () => tanca(b.v), b.pri ? 'pri' : b.cls || ''))));
      document.body.append(vel, m);
      document.addEventListener('keydown', tecla, true);
      setTimeout(() => (m.querySelector('input,select,textarea') || m.querySelector('.btn.pri'))?.focus(), 30);
    });
  }
  const confirma = (text, siTxt = 'Sí', perill = false) => modal('', h('p', { style: { margin: 0, fontSize: '15px' } }, t(text)),
    [{ t: 'Cancel·lar', v: false }, { t: siTxt, v: true, pri: !perill, cls: perill ? 'perill' : '' }]).then((v) => !!v);
  async function demana(titol, etiqueta, valor = '', esNum = false) {
    const i = esNum ? inpNum(valor) : inp(valor);
    const v = await modal(titol, camp(etiqueta, i), [{ t: 'Cancel·lar', v: null }, { t: 'Acceptar', v: 1, pri: true }]);
    return v ? (esNum ? g.GL.num(i.value, NaN) : i.value.trim()) : null;
  }
  function toast(text, { tipus = '', desfer, ms = 4200 } = {}) {
    const z = document.getElementById('toasts');
    const el = h('div.toast' + (tipus ? '.' + tipus : ''), h('span', t(text)), desfer ? h('button', { onclick: () => { desfer(); el.remove(); } }, t('Desfer')) : null);
    z.appendChild(el);
    setTimeout(() => el.remove(), desfer ? ms + 3000 : ms);
  }

  /** Cercador desplegable (ingredients i elaboracions a les receptes). items: [{id, nom, sub, grup, obj}] */
  function combo({ items, valor = '', placeholder = '', onTria, onNou }) {
    const i = h('input', { type: 'text', value: valor, placeholder: t(placeholder), autocomplete: 'off' });
    const w = h('div.combo', i);
    let llista = null, sel = 0, vis = [];
    const tanca = () => { llista?.remove(); llista = null; };
    const obre = () => {
      tanca();
      const q = g.GL.norm(i.value);
      vis = items().filter((x) => !q || g.GL.norm(x.nom).includes(q)).sort((a, b) => {
        const pa = g.GL.norm(a.nom).startsWith(q) ? 0 : 1, pb = g.GL.norm(b.nom).startsWith(q) ? 0 : 1;
        return pa - pb || a.nom.localeCompare(b.nom);
      }).slice(0, 40);
      llista = h('div.combo-llista');
      vis.forEach((x, n) => llista.appendChild(h('div', { class: n === sel ? 'on' : '', onmousedown: (e) => { e.preventDefault(); tria(x); } },
        x.ic || '', h('span', x.nom), x.sub ? h('span.sub', x.sub) : null)));
      if (onNou && i.value.trim() && !vis.some((x) => g.GL.norm(x.nom) === q))
        llista.appendChild(h('div.nou', { onmousedown: (e) => { e.preventDefault(); tanca(); onNou(i.value.trim()); } }, '+ ', t('Crear l\'ingredient'), ` «${i.value.trim()}»`));
      w.appendChild(llista);
    };
    const tria = (x) => { i.value = x.nom; tanca(); onTria(x); };
    i.addEventListener('focus', () => { sel = 0; obre(); i.select(); });
    i.addEventListener('input', () => { sel = 0; obre(); });
    i.addEventListener('blur', () => setTimeout(tanca, 120));
    i.addEventListener('keydown', (e) => {
      if (!llista) return;
      if (e.key === 'ArrowDown') { sel = Math.min(sel + 1, vis.length - 1); obre(); e.preventDefault(); }
      else if (e.key === 'ArrowUp') { sel = Math.max(sel - 1, 0); obre(); e.preventDefault(); }
      else if (e.key === 'Enter') { e.preventDefault(); if (vis[sel]) tria(vis[sel]); else if (onNou && i.value.trim()) { tanca(); onNou(i.value.trim()); } }
      else if (e.key === 'Escape') { tanca(); e.stopPropagation(); }
    });
    w.input = i;
    return w;
  }

  // ── Gràfics SVG ──────────────────────────────────────────────────────────
  const NS = 'http://www.w3.org/2000/svg';
  function s(tag, attrs = {}, ...fills) {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) if (v != null) e.setAttribute(k, v);
    for (const f of fills) if (f != null) e.appendChild(typeof f === 'string' ? document.createTextNode(f) : f);
    return e;
  }
  function spark(valors, color = 'var(--taronja)') {
    const W = 80, H = 22;
    if (!valors || valors.length < 2) return h('span.suau.petit', '—');
    const mn = Math.min(...valors), mx = Math.max(...valors), d = mx - mn || 1;
    const pts = valors.map((v, i) => `${(i / (valors.length - 1)) * (W - 4) + 2},${H - 3 - ((v - mn) / d) * (H - 6)}`).join(' ');
    return s('svg', { class: 'spark', viewBox: `0 0 ${W} ${H}` }, s('polyline', { points: pts, fill: 'none', stroke: color, 'stroke-width': 1.8, 'stroke-linejoin': 'round' }));
  }
  /** Barres verticals: dades [{et, v, c}] */
  function barres(dades, { alt = 180, format = (x) => fN(x, 0) } = {}) {
    const W = Math.max(320, dades.length * 26), H = alt, mb = 22, mt = 14;
    const mx = Math.max(1, ...dades.map((d) => d.v));
    const bw = (W - 10) / dades.length;
    const svg = s('svg', { class: 'graf', viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: 'none', style: `height:${H}px` });
    svg.appendChild(s('line', { x1: 0, x2: W, y1: H - mb, y2: H - mb, class: 'eix' }));
    dades.forEach((d, i) => {
      const bh = ((H - mb - mt) * d.v) / mx, x = 5 + i * bw;
      const r = s('rect', { x: x + bw * 0.15, y: H - mb - bh, width: bw * 0.7, height: Math.max(0, bh), rx: 3, fill: d.c || 'var(--taronja)', opacity: 0.9 });
      r.appendChild(s('title', {}, `${d.et}: ${format(d.v)}`));
      svg.appendChild(r);
      if (dades.length <= 16 || i % Math.ceil(dades.length / 12) === 0) svg.appendChild(s('text', { x: x + bw / 2, y: H - 6, 'text-anchor': 'middle' }, d.et));
    });
    return svg;
  }
  /** Línia simple: dades [{et, v}] */
  function linia(dades, { alt = 160, color = 'var(--taronja)' } = {}) {
    const W = 600, H = alt, mb = 22, mt = 10, ml = 6;
    const svg = s('svg', { class: 'graf', viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: 'none', style: `height:${H}px` });
    if (dades.length < 2) return svg;
    const mx = Math.max(...dades.map((d) => d.v)) || 1;
    const X = (i) => ml + (i / (dades.length - 1)) * (W - 2 * ml), Y = (v) => H - mb - ((H - mb - mt) * v) / mx;
    const pts = dades.map((d, i) => `${X(i)},${Y(d.v)}`).join(' ');
    svg.appendChild(s('polygon', { points: `${X(0)},${H - mb} ${pts} ${X(dades.length - 1)},${H - mb}`, fill: color, opacity: 0.12 }));
    svg.appendChild(s('polyline', { points: pts, fill: 'none', stroke: color, 'stroke-width': 2.2, 'vector-effect': 'non-scaling-stroke' }));
    const pas = Math.ceil(dades.length / 8);
    dades.forEach((d, i) => { if (i % pas === 0) svg.appendChild(s('text', { x: X(i), y: H - 6, 'text-anchor': 'middle' }, d.et)); });
    return svg;
  }

  // ── Impressió ────────────────────────────────────────────────────────────
  function imprimeix(node, titol = '') {
    const z = document.getElementById('impressio');
    buida(z).appendChild(node);
    const ant = document.title; if (titol) document.title = titol;
    // Android (APK): el WebView no té window.print; MainActivity hi posa XoriguerImpressio (PrintManager del sistema)
    setTimeout(() => { if (g.XoriguerImpressio) g.XoriguerImpressio.imprimeix(titol || ant); else window.print(); document.title = ant; }, 60);
  }

  g.UI = { h, afegeix, buida, ic, s, fN, eur, pct, qty, data, esc, btn, btnIc, camp, inp, inpNum, ambU, sel, cercador, grupBtn,
    xipsAllergens, icAllergens, taula, panell, modal, confirma, demana, toast, combo, spark, barres, linia, imprimeix, tancaTot, t };
})(window);

/* Vendes: resum per període, entrada ràpida i importació (TPV o CSV). Les vendes descompten l'estoc per diferència. */
'use strict';
(function (g) {
  const V = (g.V = g.V || {});
  const { h, ic, btn, eur, pct, qty, t, camp, inpNum, sel } = UI;
  let pest = 'resum', periode = '30', desde = '', fins = '', dia = '';

  function rang() {
    const A = GL.avui();
    if (periode === 'avui') return [A, A];
    if (periode === 'ahir') return [GL.sumaDies(A, -1), GL.sumaDies(A, -1)];
    if (periode === 'mes') return [A.slice(0, 8) + '01', A];
    if (periode === 'mesant') { const d = new Date(+A.slice(0, 4), +A.slice(5, 7) - 2, 1); const i = GL.isoData(d); const f2 = GL.isoData(new Date(d.getFullYear(), d.getMonth() + 1, 0)); return [i, f2]; }
    if (periode === 'pers') return [desde || GL.sumaDies(A, -30), fins || A];
    return [GL.sumaDies(A, -(+periode - 1)), A];
  }

  V.vendes = {
    titol: 'Vendes', ic: 'vendes',
    render(el, arg) {
      if (arg === 'entrar') { pest = 'entrar'; dia = GL.avui(); history.replaceState(null, '', '#/vendes'); }
      const pp = h('div.pestanyes'), cos = h('div');
      const pinta = () => {
        UI.buida(pp); UI.buida(cos);
        [['resum', 'Resum'], ['entrar', 'Entrar vendes'], ['importar', 'Importar']].forEach(([k, txt]) => pp.appendChild(h('button', { class: pest === k ? 'on' : '', onclick: () => { pest = k; pinta(); } }, t(txt))));
        ({ resum, entrar, importar })[pest](cos, pinta);
      };
      el.append(pp, cos); pinta();
    },
  };

  function resum(el, repinta) {
    const D = Store.D;
    const [a, b] = rang();
    const vend = GL.vendesPeriode(D, a, b);
    const R = GL.resumVendes(D, vend);
    const dies = GL.diesPeriode(D, a, b);
    // comparació amb el període anterior de la mateixa llargada
    const nd = Math.round((new Date(b) - new Date(a)) / 864e5) + 1;
    const Rp = GL.resumVendes(D, GL.vendesPeriode(D, GL.sumaDies(a, -nd), GL.sumaDies(a, -1)));
    const tend = (x, y) => (y > 0 ? ((x - y) / y) * 100 : null);
    const kpi = (et, val, sub, c, tn) => h('div.targeta.kpi', { style: { '--c': c } }, h('div.et', t(et)), h('div.val.num', val),
      h('div.sub', tn != null ? h('span.tend.' + (tn >= 0 ? 'puja' : 'baixa'), (tn >= 0 ? '▲ ' : '▼ ') + Math.abs(tn).toFixed(0) + ' % ') : null, sub || ''));
    const selP = sel([['avui', 'Avui'], ['ahir', 'Ahir'], ['7', '7 dies'], ['30', '30 dies'], ['90', '90 dies'], ['mes', 'Aquest mes'], ['mesant', 'Mes passat'], ['pers', 'Personalitzat']], periode, (v) => { periode = v; repinta(); }, { style: { width: '170px' } });
    const dA = h('input', { type: 'date', value: a, onchange: (e) => { desde = e.target.value; periode = 'pers'; repinta(); }, style: { width: '150px' } });
    const dB = h('input', { type: 'date', value: b, onchange: (e) => { fins = e.target.value; periode = 'pers'; repinta(); }, style: { width: '150px' } });
    el.append(h('div.cap', selP, dA, h('span.suau', '→'), dB, h('div.esp'), btn('Exportar CSV', () => exporta(R, a, b), '', 'baixa'), btn('Entrar vendes', () => { pest = 'entrar'; dia = GL.avui(); repinta(); }, 'pri', 'mes')),
      h('div.graella.g4', { style: { marginBottom: '14px' } },
        kpi('Facturació (amb IVA)', eur(R.fact, 0), t('{n} dies amb vendes', { n: dies.length }), 'var(--taronja)', tend(R.fact, Rp.fact)),
        kpi('Marge brut', eur(R.marge, 0), t('sense IVA'), 'var(--verd)', tend(R.marge, Rp.marge)),
        kpi('Food cost teòric', pct(R.fc), t('cost de les receptes venudes'), R.fc > 35 ? 'var(--vermell)' : 'var(--verd)'),
        kpi('Unitats venudes', UI.fN(R.uts, 0), dies.length ? t('{n} al dia', { n: UI.fN(R.uts / dies.length, 0) }) : '', 'var(--blau)', tend(R.uts, Rp.uts))));
    if (!R.files.length) { el.append(h('div.buit', ic('vendes'), h('h3', t('Cap venda en aquest període')), h('p', t('Entra-les a mà per dies, importa-les del TPV o d\'un CSV.')))); return; }
    const perDia = [];
    for (let d = a; d <= b; d = GL.sumaDies(d, 1)) { perDia.push({ et: d.slice(8) + '/' + d.slice(5, 7), v: GL.resumVendes(D, D.vendes[d] || {}).fact }); if (perDia.length > 120) break; }
    // per categoria
    const cats = {};
    R.files.forEach((f) => { cats[f.cat || 'Altres'] = (cats[f.cat || 'Altres'] || 0) + f.fact; });
    const colors = ['var(--taronja)', 'var(--blau)', 'var(--verd)', 'var(--lila)', 'var(--groc)', 'var(--vermell)', '#5fc7c0', '#c98b5a'];
    const catsS = Object.entries(cats).sort((x, y) => y[1] - x[1]);
    el.append(h('div.graella', { style: { gridTemplateColumns: '2fr 1fr', marginBottom: '14px' } },
      h('div.targeta', h('h3', t('Facturació per dia')), perDia.length > 1 ? UI.barres(perDia, { format: (x) => eur(x, 0) }) : h('p.suau', t('Un sol dia'))),
      h('div.targeta', h('h3', t('Per categoria')), catsS.map(([c, v], k) => h('div', { style: { marginBottom: '8px' } },
        h('div', { style: { display: 'flex', justifyContent: 'space-between', fontSize: '13px' } }, h('span', t(c)), h('span.num', eur(v, 0) + ' · ' + pct((v / R.fact) * 100, 0))),
        h('div.barra-prog', { style: { '--c': colors[k % colors.length] } }, h('i', { style: { width: (v / catsS[0][1]) * 100 + '%' } })))))));
    el.append(UI.taula({ cols: [
      { k: 'nom', t: 'Plat', cls: 'nom', r: (f) => h('span', f.nom, h('span.sub', t(f.cat || ''))) },
      { k: 'q', t: 'Unitats', cls: 'r num', r: (f) => UI.fN(f.q, 0), desc: true },
      { k: 'fact', t: 'Facturat', cls: 'r num', r: (f) => eur(f.fact), desc: true },
      { k: 'cost', t: 'Cost', cls: 'r num', r: (f) => eur(f.cost) },
      { k: 'marge', t: 'Marge', cls: 'r num', r: (f) => h('span', { class: f.estat === 'baix' ? 'vermell' : '' }, eur(f.marge)), desc: true },
      { k: 'pes', t: '% vendes', cls: 'r num', r: (f) => pct((f.fact / R.fact) * 100), v: (f) => f.fact }],
    files: R.files, ordre: ['fact', -1], onclic: (f) => App.ves('receptes', f.id),
    peu: [t('Total'), { v: UI.fN(R.uts, 0), cls: 'r num' }, { v: eur(R.fact), cls: 'r num' }, { v: eur(R.cost), cls: 'r num' }, { v: eur(R.marge), cls: 'r num' }, ''] }));
  }

  function entrar(el, repinta) {
    const D = Store.D;
    dia = dia || GL.avui();
    const abans = { ...(D.vendes[dia] || {}) };
    const nou = { ...abans };
    let q = '';
    const total = h('b.num.taronja');
    const actTotal = () => { const R = GL.resumVendes(D, nou); total.textContent = eur(R.fact) + ' · ' + t('{n} unitats', { n: UI.fN(R.uts, 0) }); };
    const llista = h('div');
    const plats = D.receptes.filter((r) => r.tipus !== 'elab');
    const pinta = () => {
      UI.buida(llista);
      const cats = [...new Set(plats.map((r) => r.cat || 'Altres'))];
      const gr = h('div.graella', { style: { gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))' } });
      for (const c of cats) {
        const ps = plats.filter((r) => (r.cat || 'Altres') === c && (!q || GL.norm(r.nom).includes(GL.norm(q))));
        if (!ps.length) continue;
        gr.appendChild(h('div.targeta', h('h3', t(c)), ps.map((r) => {
          const inN = inpNum(nou[r.id] || '', (v) => { if (v > 0) nou[r.id] = v; else delete nou[r.id]; actTotal(); }, { placeholder: '0' });
          inN.style.width = '70px';
          inN.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); const ins = [...llista.querySelectorAll('input')]; ins[ins.indexOf(inN) + 1]?.focus(); } });
          const suma = (k) => { const v = Math.max(0, GL.num(inN.value) + k); inN.value = v ? String(v) : ''; inN.dispatchEvent(new Event('input')); };
          return h('div', { style: { display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 0' } },
            h('span', { style: { flex: 1 } }, r.nom, h('span.suau.petit', ' ' + eur(r.pvp))), btn('−', () => suma(-1), 'mini'), inN, btn('+', () => suma(1), 'mini'));
        })));
      }
      llista.appendChild(gr);
    };
    const dIn = h('input', { type: 'date', value: dia, onchange: (e) => { if (JSON.stringify(nou) !== JSON.stringify(abans)) desa(); dia = e.target.value; repinta(); }, style: { width: '160px' } });
    const desa = () => {
      Store.canvi(t('Vendes del {d} desades', { d: UI.data(dia) }), (D2) => {
        GL.aplicaVendesEstoc(D2, D2.vendes[dia] || {}, nou);
        if (Object.keys(nou).length) D2.vendes[dia] = { ...nou }; else delete D2.vendes[dia];
      });
    };
    el.append(h('div.cap', btn('◀', () => { dia = GL.sumaDies(dia, -1); repinta(); }, 'ic'), dIn, btn('▶', () => { dia = GL.sumaDies(dia, 1); repinta(); }, 'ic'),
      h('span.suau', UI.data(dia, true)), UI.cercador('Cerca un plat…', (v) => { q = v; pinta(); }), h('div.esp'), total,
      btn('Copiar d\'una setmana enrere', () => { Object.assign(nou, D.vendes[GL.sumaDies(dia, -7)] || {}); pinta(); actTotal(); }, ''),
      btn('Desar', () => { desa(); App.refresca(); }, 'pri', 'check')),
      h('p.suau.petit', { style: { marginTop: '-6px' } }, t('Les vendes descompten els ingredients de l\'estoc. Si tornes a desar el mateix dia, només es descompta la diferència.')),
      llista);
    pinta(); actTotal();
  }

  async function importar(el, repinta) {
    const D = Store.D;
    const tpv = await Store.tpvDisponible();
    const dA = h('input', { type: 'date', value: GL.sumaDies(GL.avui(), -6), style: { width: '160px' } });
    const dB = h('input', { type: 'date', value: GL.avui(), style: { width: '160px' } });
    const res = h('div');
    el.append(
      h('div.targeta', { style: { marginBottom: '14px' } }, h('h3', ic('vendes'), t('Des de Xoriguer TPV')),
        tpv ? h('div', h('p.suau.petit', t('Llegeix les vendes de la base de dades del TPV d\'aquest ordinador (només lectura). Cada producte del TPV s\'assigna al plat amb el mateix nom.')),
          h('div', { style: { display: 'flex', gap: '8px', alignItems: 'center' } }, dA, h('span.suau', '→'), dB, btn('Importar', () => delTPV(dA.value, dB.value, res), 'pri', 'baixa')))
          : h('p.suau', t('No s\'ha trobat el TPV en aquest ordinador (%USERPROFILE%\\.tpv_bar\\tpv.db).'))),
      h('div.targeta', h('h3', ic('puja'), t('Des d\'un fitxer CSV')),
        h('p.suau.petit', t('Columnes: data; plat; unitats (data en format AAAA-MM-DD o DD/MM/AAAA). Serveix per a qualsevol TPV que exporti les vendes.')),
        btn('Triar fitxer CSV', () => delCSV(res), '', 'puja')),
      res);
  }
  function resultat(res, dies, noTrobats) {
    UI.buida(res).appendChild(h('div.targeta', { style: { marginTop: '14px' } }, h('h3.verd', '✓ ', t('Importades les vendes de {n} dies', { n: dies })),
      noTrobats.length ? h('div', h('p.taronja', t('Productes sense plat amb el mateix nom (crea\'ls o canvia\'n el nom):')), h('div.xips', noTrobats.slice(0, 40).map((n) => h('span.xip', { onclick: () => V.receptes.nou({ nom: n }) }, '+ ' + n)))) : null));
  }
  function assigna(D, nom) {
    const n = GL.norm(nom);
    return D.receptes.find((r) => GL.norm(r.nom) === n) || D.receptes.find((r) => n.length > 3 && (GL.norm(r.nom).includes(n) || n.includes(GL.norm(r.nom))));
  }
  async function delTPV(a, b, res) {
    const noTrobats = new Set(); let dies = 0;
    const D = Store.D, per = {};
    for (let d = a; d <= b; d = GL.sumaDies(d, 1)) {
      const files = await Store.tpvVendes(d);
      if (!files.length) continue;
      per[d] = {};
      for (const [nom, q] of files) { const r = assigna(D, nom); if (r) per[d][r.id] = (per[d][r.id] || 0) + q; else noTrobats.add(nom); }
      dies++;
    }
    Store.canvi('Vendes importades del TPV', (D2) => { for (const [d, v] of Object.entries(per)) { GL.aplicaVendesEstoc(D2, D2.vendes[d] || {}, v); D2.vendes[d] = v; } });
    resultat(res, dies, [...noTrobats]);
  }
  async function delCSV(res) {
    const text = await Store.obreFitxer('.csv,.txt');
    if (!text) return;
    const files = V.ingredients.llegeixCSV(text.replace(/^﻿/, ''));
    const D = Store.D, per = {}, noTrobats = new Set();
    for (const f of files) {
      let [d, nom, q] = f.map((x) => (x || '').trim());
      if (!d || !nom) continue;
      const m = d.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);
      if (m) d = `${m[3].length === 2 ? '20' + m[3] : m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) continue;
      const r = assigna(D, nom);
      if (!r) { noTrobats.add(nom); continue; }
      (per[d] = per[d] || {})[r.id] = (per[d][r.id] || 0) + GL.num(q, 1);
    }
    if (!Object.keys(per).length) return UI.toast('No s\'ha pogut llegir cap venda', { tipus: 'err' });
    Store.canvi('Vendes importades', (D2) => { for (const [d, v] of Object.entries(per)) { GL.aplicaVendesEstoc(D2, D2.vendes[d] || {}, v); D2.vendes[d] = v; } });
    resultat(res, Object.keys(per).length, [...noTrobats]);
  }
  function exporta(R, a, b) {
    const f = (x) => x.toFixed(2).replace('.', ',');
    const L = [[t('Plat'), t('Categoria'), t('Unitats'), t('Facturat'), t('Cost'), t('Marge')].join(';'), ...R.files.map((x) => [x.nom, t(x.cat || ''), x.q, f(x.fact), f(x.cost), f(x.marge)].join(';'))];
    Store.desaFitxer(`vendes_${a}_${b}.csv`, '﻿' + L.join('\r\n'), 'CSV').then((r) => r && UI.toast('Exportat'));
  }
})(window);

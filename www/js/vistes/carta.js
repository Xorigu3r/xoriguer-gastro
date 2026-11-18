/* Sala: carta imprimible, matriu d'al·lèrgens, menú del dia i QR. */
'use strict';
(function (g) {
  const V = (g.V = g.V || {});
  const { h, ic, btn, btnIc, eur, pct, t, camp, inp, inpNum, sel } = UI;
  let pest = 'carta';
  const ESTILS = {
    classic: { fons: '#fffdf8', text: '#2b2118', acc: '#9a5b13', titol: "Georgia, 'Times New Roman', serif", linia: 'dotted' },
    modern: { fons: '#ffffff', text: '#1d2430', acc: '#F2650F', titol: "Montserrat, 'Segoe UI', sans-serif", linia: 'solid' },
    pissarra: { fons: '#1E2A3B', text: '#F6EFE2', acc: '#FFA82E', titol: "Montserrat, 'Segoe UI', sans-serif", linia: 'dashed' },
  };
  const opcCarta = () => (Store.D.ajustos.carta = { estil: 'modern', alg: true, desc: true, cols: 2, peu: 'IVA inclòs. Demaneu-nos informació sobre al·lèrgens.', ...Store.D.ajustos.carta });

  V.carta = {
    titol: 'Carta i al·lèrgens', ic: 'carta',
    render(el, arg) {
      if (arg) { pest = arg; history.replaceState(null, '', '#/carta'); }
      const pp = h('div.pestanyes'), cos = h('div');
      const pinta = () => {
        UI.buida(pp); UI.buida(cos);
        [['carta', 'Carta'], ['allergens', 'Al·lèrgens'], ['menu', 'Menú del dia'], ['qr', 'Carta QR']].forEach(([k, txt]) =>
          pp.appendChild(h('button', { class: pest === k ? 'on' : '', onclick: () => { pest = k; pinta(); } }, t(txt))));
        ({ carta, allergens, menu, qr })[pest](cos, pinta);
      };
      el.append(pp, cos); pinta();
    },
  };

  function platsCarta() {
    const D = Store.D, C = GL.context(D);
    const ps = D.receptes.filter((r) => r.tipus !== 'elab' && r.carta !== false && GL.num(r.pvp) > 0);
    const ordre = [...GL.CATEGORIES, ...new Set(ps.map((r) => r.cat))];
    const grups = [];
    for (const c of [...new Set(ordre)]) { const xs = ps.filter((r) => (r.cat || 'Altres') === c).sort((a, b) => a.nom.localeCompare(b.nom)); if (xs.length) grups.push([c, xs.map((r) => ({ r, a: GL.allergens(r, C) }))]); }
    return grups;
  }

  function paperCarta() {
    const D = Store.D, o = opcCarta(), E = ESTILS[o.estil] || ESTILS.modern;
    const grups = platsCarta();
    return h('div', { style: { background: E.fons, color: E.text, padding: '28px 34px', fontFamily: "'Segoe UI', sans-serif", minHeight: '100%', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' } },
      h('div', { style: { textAlign: 'center', marginBottom: '18px' } },
        h('div', { style: { fontFamily: E.titol, fontSize: '34px', fontWeight: 800, color: E.text, letterSpacing: '.02em' } }, D.ajustos.local || t('La nostra carta')),
        D.ajustos.adreca ? h('div', { style: { fontSize: '12px', opacity: 0.75 } }, D.ajustos.adreca + (D.ajustos.telefon ? ' · ' + D.ajustos.telefon : '')) : null,
        h('div', { style: { width: '60px', height: '3px', background: E.acc, margin: '10px auto 0' } })),
      h('div', { style: { columnCount: o.cols, columnGap: '34px' } }, grups.map(([c, xs]) => h('div', { style: { breakInside: 'avoid', marginBottom: '16px' } },
        h('div', { style: { fontFamily: E.titol, color: E.acc, fontWeight: 800, fontSize: '16px', textTransform: 'uppercase', letterSpacing: '.08em', borderBottom: `1px ${E.linia} ${E.acc}`, paddingBottom: '3px', marginBottom: '6px' } }, t(c)),
        xs.map(({ r, a }) => h('div', { style: { margin: '7px 0', breakInside: 'avoid' } },
          h('div', { style: { display: 'flex', gap: '8px', alignItems: 'baseline' } }, h('b', { style: { fontSize: '14px' } }, r.nom),
            h('span', { style: { flex: 1, borderBottom: `1px dotted ${E.text}`, opacity: 0.35, transform: 'translateY(-3px)' } }),
            h('b', { style: { fontSize: '14px', color: E.acc } }, eur(r.pvp))),
          o.desc && r.desc ? h('div', { style: { fontSize: '12px', opacity: 0.78, fontStyle: 'italic' } }, r.desc) : null,
          o.alg && a.conte.length ? h('div', { style: { fontSize: '12px', marginTop: '1px' } }, a.conte.map((k) => GL.ALG[k].ic).join(' '),
            a.traces.length ? h('span', { style: { opacity: 0.6 } }, '  (' + a.traces.map((k) => GL.ALG[k].ic).join('') + ')') : null) : null))))),
      o.alg ? h('div', { style: { fontSize: '10px', opacity: 0.75, borderTop: `1px ${E.linia} ${E.acc}`, paddingTop: '6px', marginTop: '10px', textAlign: 'center' } },
        GL.ALLERGENS.map((x) => `${x.ic} ${t(x.nom)}`).join('  ·  '), h('br'), t('Entre parèntesis: pot contenir traces.')) : null,
      o.peu ? h('div', { style: { fontSize: '11px', textAlign: 'center', marginTop: '8px', opacity: 0.8 } }, t(o.peu)) : null);
  }

  function carta(el, repinta) {
    const o = opcCarta();
    const prev = h('div.prev-paper', { style: { padding: 0, maxWidth: '900px' } });
    const act = () => { UI.buida(prev).appendChild(paperCarta()); Store.desa(); };
    const opc = h('div.targeta', { style: { position: 'sticky', top: 0 } },
      h('h3', t('Opcions')),
      camp('Estil', UI.grupBtn([['classic', 'Clàssic'], ['modern', 'Modern'], ['pissarra', 'Pissarra']], o.estil, (v) => { o.estil = v; act(); })),
      h('div', { style: { height: '10px' } }),
      camp('Columnes', UI.grupBtn([[1, '1'], [2, '2'], [3, '3']].map(([a, b]) => [a, b]), o.cols, (v) => { o.cols = +v; act(); })),
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: '6px', margin: '12px 0' } },
        h('label', h('input', { type: 'checkbox', checked: o.alg, onchange: (e) => { o.alg = e.target.checked; act(); } }), ' ', t('Mostrar al·lèrgens')),
        h('label', h('input', { type: 'checkbox', checked: o.desc, onchange: (e) => { o.desc = e.target.checked; act(); } }), ' ', t('Mostrar descripcions'))),
      camp('Peu de la carta', inp(o.peu, (v) => { o.peu = v; act(); })),
      h('p.suau.petit', t('Surten els plats i articles marcats «a la carta» i amb preu. El nom i l\'adreça del local es canvien a Ajustos.')),
      btn('Imprimir / PDF', () => UI.imprimeix(paperCarta(), t('Carta')), 'pri', 'imprimeix'));
    el.append(h('div.graella', { style: { gridTemplateColumns: '1fr 300px', alignItems: 'start' } }, prev, opc));
    act();
  }

  function paperAllergens() {
    const D = Store.D, grups = platsCarta();
    const td = { border: '1px solid #bbb', padding: '3px 4px', textAlign: 'center', fontSize: '11px' };
    return h('div.paper', { style: { padding: '0' } },
      h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: '8px' } },
        h('div', h('h1', { style: { fontSize: '20px' } }, t('Informació sobre al·lèrgens')), h('div', { style: { fontSize: '11px', color: '#555' } }, (D.ajustos.local || '') + ' · ' + t('Reglament (UE) 1169/2011'))),
        h('div', { style: { fontSize: '11px' } }, t('Actualitzat') + ': ' + UI.data(GL.avui()))),
      h('table', { style: { width: '100%', borderCollapse: 'collapse' } },
        h('thead', h('tr', h('th', { style: { ...td, textAlign: 'left' } }, t('Plat')), GL.ALLERGENS.map((a) => h('th', { style: { ...td, width: '46px' } }, h('div', { style: { fontSize: '15px' } }, a.ic), h('div', { style: { fontSize: '8.5px', lineHeight: 1.1 } }, t(a.nom)))))),
        h('tbody', grups.flatMap(([c, xs]) => [h('tr', h('td', { colspan: 15, style: { ...td, textAlign: 'left', background: '#f1ede6', fontWeight: 700 } }, t(c))),
          ...xs.map(({ r, a }) => h('tr', h('td', { style: { ...td, textAlign: 'left' } }, r.nom), GL.ALLERGENS.map((x) => h('td', { style: { ...td, fontWeight: 700, color: a.conte.includes(x.k) ? '#c0392b' : '#b58900' } },
            a.conte.includes(x.k) ? '●' : a.traces.includes(x.k) ? '○' : ''))))]))),
      h('p', { style: { fontSize: '10.5px', marginTop: '8px' } }, '● ' + t('Conté') + '   ○ ' + t('Pot contenir traces') + '.   ' + t('Si tens alguna al·lèrgia o intolerància, informa\'n el personal abans de demanar.')));
  }
  function allergens(el) {
    const grups = platsCarta();
    if (!grups.length) { el.append(h('div.buit', h('p', t('No hi ha plats a la carta amb preu.')))); return; }
    const C = GL.context(Store.D);
    const sense = Store.D.ingredients.filter((i) => !(i.allergens || []).length && Store.D.receptes.some((r) => r.carta !== false && GL.usaIngredient(r, i.id, C)));
    el.append(h('div.cap', h('p.suau', { style: { margin: 0 } }, t('Matriu obligatòria dels 14 al·lèrgens, calculada dels ingredients de cada plat (també de les elaboracions de dins).')), h('div.esp'),
      btn('Imprimir / PDF', () => UI.imprimeix(paperAllergens(), t('Al·lèrgens')), 'pri', 'imprimeix')),
      sense.length ? h('div.targeta', { style: { marginBottom: '12px', borderColor: 'var(--taronja)' } }, h('b.taronja', '⚠ ', t('Revisa aquests ingredients: no tenen cap al·lergen marcat')), ' ', h('span.suau.petit', t('(si és correcte, cap problema)')),
        h('div.xips', { style: { marginTop: '6px' } }, sense.slice(0, 40).map((i) => h('span.xip', { onclick: () => App.ves('ingredients', i.id) }, i.nom)))) : null,
      h('div.prev-paper', { style: { overflow: 'auto' } }, paperAllergens()));
  }

  function menu(el, repinta) {
    const D = Store.D;
    const llista = h('div.graella', { style: { gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', alignItems: 'start' } });
    for (const m of D.menus) llista.appendChild(targetaMenu(m, repinta));
    el.append(h('div.cap', h('p.suau', { style: { margin: 0 } }, t('Menú del dia, de grup o d\'esdeveniment. Si el nom del plat coincideix amb una recepta, en surt el cost, el marge i el que cal produir.')), h('div.esp'),
      btn('Nou menú', () => { Store.canvi('Menú creat', (D2) => { D2.menus.push({ id: GL.uid('m'), nom: t('Menú del dia'), preu: 14, primers: [], segons: [], postres: [], inclou: t('Pa, beguda i postres o cafè'), extra: 0.8 }); }); repinta(); }, 'pri', 'mes')),
    D.menus.length ? llista : h('div.buit', h('p', t('Encara no hi ha cap menú.'))));
  }
  function targetaMenu(m, repinta) {
    const D = Store.D, iva = D.ajustos.iva;
    const resum = h('div'), estats = {};
    const act = () => {
      const C = GL.context(Store.D), x = GL.costMenu(m, C, iva);
      for (const s of x.secc) {
        const el = estats[s.k]; if (!el) continue;
        UI.buida(el).append(...s.plats.map((p) => p.rec
          ? h('span.xip', { title: t('Cost/ració'), onclick: () => App.ves('receptes', p.rec.id) }, '✓ ', p.text, ' · ', eur(p.cost), ' ', UI.icAllergens(GL.allergens(p.rec, C).conte, []))
          : h('span.xip', { style: { opacity: 0.6 }, title: t('No hi ha cap recepta amb aquest nom') }, '? ', p.text)));
      }
      const cls = x.estat === 'baix' ? 'vermell' : x.estat === 'just' ? 'taronja' : x.estat === 'ok' ? 'verd' : '';
      UI.buida(resum).append(h('div.resum-cost', { style: { marginTop: '10px' } },
        h('div.targeta', h('div.suau.petit', t('Cost per comensal')), h('div.val.num', eur(x.cost)), h('div.suau.petit', t('Si tothom tria el més car') + ': ' + eur(x.max))),
        h('div.targeta', h('div.suau.petit', t('Food cost')), h('div.val.num', { class: 'val num ' + cls }, x.net ? pct(x.fc) : '—'), h('div.suau.petit', t('{a} de {b} plats amb escandall', { a: x.lligats, b: x.total }))),
        h('div.targeta', h('div.suau.petit', t('Marge per comensal')), h('div.val.num', eur(x.marge)), h('div.suau.petit', t('Sense IVA') + ': ' + eur(x.net))),
        h('div.targeta', h('div.suau.petit', t('PVP suggerit per l\'objectiu')), h('div.val.num.taronja', x.pvpSuggerit ? eur(x.pvpSuggerit) : '—'))));
    };
    const desa = () => { Store.desa(); act(); };
    const seccio = (k, et) => {
      const x = h('textarea', { rows: 3, placeholder: t('Un plat per línia') }, (m[k] || []).join('\n'));
      x.oninput = () => { m[k] = x.value.split('\n').map((s) => s.trim()).filter(Boolean); desa(); };
      const cmb = UI.combo({ items: () => Store.D.receptes.filter((r) => r.tipus !== 'elab').map((r) => ({ id: r.id, nom: r.nom, sub: t(r.cat || ''), ic: '🍽' })), placeholder: '+ ' + t('Afegeix una recepta'),
        onTria: (r) => { m[k] = [...(m[k] || []), r.nom]; x.value = m[k].join('\n'); desa(); } });
      estats[k] = h('div.xips', { style: { marginTop: '4px' } });
      return h('div', { style: { marginBottom: '8px' } }, camp(et, x), h('div', { style: { marginTop: '4px' } }, cmb), estats[k]);
    };
    const comensals = inpNum(m.comensals || 20, (v) => { m.comensals = v; Store.desa(); });
    comensals.style.width = '90px';
    const card = h('div.targeta',
      h('div.fila.f2', camp('Nom', inp(m.nom, (v) => { m.nom = v; Store.desa(); })), camp('Preu per comensal (amb IVA)', UI.ambU(inpNum(m.preu, (v) => { m.preu = v; desa(); }), '€'))),
      seccio('primers', 'Primers'), seccio('segons', 'Segons'), seccio('postres', 'Postres'),
      h('div.fila.f3', camp('Inclou', inp(m.inclou || '', (v) => { m.inclou = v; Store.desa(); })),
        camp('Extres per comensal (pa, beguda…)', UI.ambU(inpNum(m.extra ?? '', (v) => { m.extra = v; desa(); }), '€')),
        camp('Marge objectiu', UI.ambU(inpNum(m.obj || 65, (v) => { m.obj = v; desa(); }), '%'))),
      resum,
      h('div', { style: { display: 'flex', gap: '8px', marginTop: '12px', alignItems: 'center', flexWrap: 'wrap' } },
        btn('Imprimir', () => UI.imprimeix(paperMenu(m), m.nom), 'pri', 'imprimeix'),
        h('span.suau.petit', t('Per a')), comensals, h('span.suau.petit', t('comensals')),
        btn('Afegir a la producció', () => {
          const C = GL.context(Store.D), plan = GL.produccioMenu(m, GL.num(comensals.value, 0), C);
          if (!plan.length) return UI.toast('Cap plat del menú té recepta', { tipus: 'av' });
          Store.canvi('Afegit a la producció', (D2) => {
            D2.produccio = D2.produccio || [];
            for (const p of plan) { const y = D2.produccio.find((z) => z.rec === p.rec); if (y) y.n = GL.num(y.n) + p.n; else D2.produccio.push({ ...p }); }
          });
          App.ves('produccio');
        }, '', 'produccio'),
        h('div.esp'),
        btn('Duplicar', () => { Store.canvi('Menú duplicat', (D2) => { D2.menus.push({ ...JSON.parse(JSON.stringify(m)), id: GL.uid('m'), nom: m.nom + ' (' + t('còpia') + ')' }); }); repinta(); }, 'mini', 'copia'),
        btn('Eliminar', async () => { if (await UI.confirma(t('Eliminar «{n}»?', { n: m.nom }), 'Eliminar', true)) { Store.canvi('Menú eliminat', (D2) => { D2.menus = D2.menus.filter((x) => x.id !== m.id); }); repinta(); } }, 'mini perill', 'paperera')));
    act();
    return card;
  }
  function paperMenu(m) {
    const E = ESTILS[opcCarta().estil] || ESTILS.modern, C = GL.context(Store.D), o = opcCarta();
    const per = new Map(Store.D.receptes.map((r) => [GL.norm(r.nom), r]));
    const alg = (x) => { const r = per.get(GL.norm(x)); if (!r || !o.alg) return null; const a = GL.allergens(r, C).conte; return a.length ? h('span', { style: { fontSize: '13px', marginLeft: '6px' } }, a.map((k) => GL.ALG[k].ic).join(' ')) : null; };
    const bloc = (tit, xs) => xs?.length ? h('div', { style: { margin: '18px 0' } }, h('div', { style: { fontFamily: E.titol, color: E.acc, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', fontSize: '15px' } }, t(tit)),
      xs.map((x) => h('div', { style: { fontSize: '19px', margin: '5px 0' } }, x, alg(x)))) : null;
    return h('div', { style: { background: E.fons, color: E.text, textAlign: 'center', padding: '40px', minHeight: '100%', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' } },
      h('div', { style: { fontSize: '13px', letterSpacing: '.2em', textTransform: 'uppercase', opacity: 0.7 } }, Store.D.ajustos.local || ''),
      h('div', { style: { fontFamily: E.titol, fontSize: '40px', fontWeight: 800 } }, m.nom), h('div', { style: { width: '60px', height: '3px', background: E.acc, margin: '8px auto' } }),
      bloc('Primers', m.primers), bloc('Segons', m.segons), bloc('Postres', m.postres),
      h('div', { style: { fontFamily: E.titol, fontSize: '34px', fontWeight: 800, color: E.acc, marginTop: '16px' } }, eur(m.preu)),
      m.inclou ? h('div', { style: { fontSize: '14px', opacity: 0.8 } }, m.inclou) : null,
      o.alg ? h('div', { style: { fontSize: '10px', opacity: 0.7, marginTop: '18px' } }, GL.ALLERGENS.map((x) => `${x.ic} ${t(x.nom)}`).join('  ·  ')) : null);
  }

  // ── Carta digital: una sola pàgina HTML (mòbil, 4 idiomes, filtre d'al·lèrgens) per penjar a qualsevol web ──
  function cartaDigital() {
    const D = Store.D, o = opcCarta(), LL = ['ca', 'es', 'fr', 'en'];
    const tr = (k) => Object.fromEntries(LL.map((l) => [l, l === 'ca' ? k : (g.TR?.[l]?.[k.replace(/\s+/g, ' ').trim()] || k)]));
    const textos = {};
    for (const k of ['La nostra carta', 'Al·lèrgens', 'Amaga els plats que contenen:', 'Pot contenir traces de', 'Cap plat amb aquests filtres.',
      'Si tens alguna al·lèrgia o intolerància, informa\'n el personal abans de demanar.', 'Netejar']) textos[k] = tr(k);
    const grups = platsCarta().map(([c, xs]) => ({ c: tr(c), plats: xs.map(({ r, a }) => ({ n: r.nom, d: o.desc ? r.desc || '' : '', p: eur(r.pvp), a: a.conte, t: a.traces })) }));
    const alg = GL.ALLERGENS.map((x) => ({ k: x.k, ic: x.ic, n: tr(x.nom) }));
    const dades = { local: D.ajustos.local || '', adreca: [D.ajustos.adreca, D.ajustos.telefon].filter(Boolean).join(' · '), peu: o.peu ? tr(o.peu) : null, grups, alg, textos, ll: I18N.llengua };
    const json = JSON.stringify(dades).replace(/</g, '\\u003c');
    return `<!doctype html><html lang="${I18N.llengua}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${(D.ajustos.local || 'Carta').replace(/[<&]/g, '')}</title><style>
:root{--f:#1E2A3B;--c:#27354A;--l:#41506A;--t:#F6EFE2;--s:#B9B2A5;--o:#FFA82E}
*{box-sizing:border-box}body{margin:0;font-family:'Segoe UI',system-ui,sans-serif;color:var(--t);background:linear-gradient(#24344A,#1A2533) fixed;min-height:100vh}
header{text-align:center;padding:26px 16px 10px}h1{margin:0;font-size:30px;letter-spacing:.02em}.adr{color:var(--s);font-size:13px;margin-top:4px}
.barra{width:60px;height:3px;background:linear-gradient(90deg,#FFA82E,#F2650F);margin:12px auto 0;border-radius:2px}
.ll{display:flex;justify-content:center;gap:6px;margin:12px 0 0}.ll button,.xip{background:var(--c);color:var(--t);border:1px solid var(--l);border-radius:20px;padding:5px 11px;font-size:13px;cursor:pointer}
.ll button.on{background:var(--o);color:#2a1400;border-color:var(--o);font-weight:700}
main{max-width:720px;margin:0 auto;padding:0 16px 40px}.filtre{background:var(--c);border:1px solid var(--l);border-radius:12px;padding:10px 12px;margin:14px 0}
.filtre b{font-size:13px}.xips{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.xip.on{background:#7a2e1a;border-color:#F2650F}
h2{color:var(--o);font-size:15px;text-transform:uppercase;letter-spacing:.1em;border-bottom:1px solid var(--l);padding-bottom:4px;margin:22px 0 6px}
.p{padding:8px 0;border-bottom:1px dashed #33435c}.p .f{display:flex;gap:10px;align-items:baseline}.p .n{font-weight:700;flex:1}.p .pr{color:var(--o);font-weight:700;white-space:nowrap}
.p .d{color:var(--s);font-size:13px;font-style:italic;margin-top:2px}.p .a{font-size:15px;margin-top:3px}.p .tr{color:var(--s);font-size:12px}
.peu{color:var(--s);font-size:12px;text-align:center;margin-top:24px}.buit{color:var(--s);text-align:center;padding:20px}
</style></head><body><header><h1 id="local"></h1><div class="adr" id="adr"></div><div class="barra"></div><div class="ll" id="ll"></div></header>
<main><div class="filtre"><b id="tf"></b><div class="xips" id="xips"></div></div><div id="carta"></div><div class="peu" id="peu"></div></main>
<script>const D=${json};let L=(navigator.language||'').slice(0,2);if(!['ca','es','fr','en'].includes(L))L=D.ll;const amaga=new Set();
const T=(o)=>o[L]||o.ca,X=(k)=>T(D.textos[k]),E=(s)=>String(s).replace(/[&<>"]/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function pinta(){document.documentElement.lang=L;document.getElementById('local').textContent=D.local||X('La nostra carta');document.getElementById('adr').textContent=D.adreca;
document.getElementById('ll').innerHTML=['ca','es','fr','en'].map((l)=>'<button class="'+(l===L?'on':'')+'" data-l="'+l+'">'+l.toUpperCase()+'</button>').join('');
document.getElementById('tf').textContent=X('Amaga els plats que contenen:');
document.getElementById('xips').innerHTML=D.alg.map((a)=>'<button class="xip'+(amaga.has(a.k)?' on':'')+'" data-a="'+a.k+'">'+a.ic+' '+E(T(a.n))+'</button>').join('')+(amaga.size?'<button class="xip" data-net="1">✕ '+E(X('Netejar'))+'</button>':'');
const ic=(ks)=>ks.map((k)=>D.alg.find((a)=>a.k===k)).filter(Boolean);let h='';
for(const g of D.grups){const ps=g.plats.filter((p)=>!p.a.some((k)=>amaga.has(k)));if(!ps.length)continue;h+='<h2>'+E(T(g.c))+'</h2>';
for(const p of ps)h+='<div class="p"><div class="f"><span class="n">'+E(p.n)+'</span><span class="pr">'+E(p.p)+'</span></div>'+(p.d?'<div class="d">'+E(p.d)+'</div>':'')+
(p.a.length?'<div class="a" title="'+E(ic(p.a).map((a)=>T(a.n)).join(', '))+'">'+ic(p.a).map((a)=>a.ic).join(' ')+'</div>':'')+
(p.t.length?'<div class="tr">'+E(X('Pot contenir traces de'))+': '+E(ic(p.t).map((a)=>T(a.n)).join(', '))+'</div>':'')+'</div>';}
document.getElementById('carta').innerHTML=h||'<div class="buit">'+E(X('Cap plat amb aquests filtres.'))+'</div>';
document.getElementById('peu').innerHTML=E(X("Si tens alguna al·lèrgia o intolerància, informa'n el personal abans de demanar."))+(D.peu?'<br>'+E(T(D.peu)):'');}
document.addEventListener('click',(e)=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.l)L=b.dataset.l;else if(b.dataset.a){amaga.has(b.dataset.a)?amaga.delete(b.dataset.a):amaga.add(b.dataset.a);}else if(b.dataset.net)amaga.clear();pinta();});
pinta();</script></body></html>`;
  }

  async function qr(el) {
    const D = Store.D;
    const img = h('div');
    const url = inp(D.ajustos.urlCarta || '', (v) => { D.ajustos.urlCarta = v; Store.desa(); }, { placeholder: 'https://…', type: 'url' });
    const genera = async () => {
      UI.buida(img);
      if (!D.ajustos.urlCarta) return;
      const src = await Store.qr(D.ajustos.urlCarta);
      if (!src) { img.appendChild(h('p.taronja', t("No s'ha pogut fer el codi QR."))); return; }
      img.append(h('img', { src, style: { width: '220px', background: '#fff', padding: '10px', borderRadius: '10px' } }), h('div', { style: { marginTop: '10px', display: 'flex', gap: '8px' } },
        btn('Imprimir targetes per a les taules', () => UI.imprimeix(h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10mm' } },
          Array.from({ length: 9 }, () => h('div', { style: { border: '1px dashed #999', borderRadius: '8px', padding: '6mm', textAlign: 'center', fontFamily: 'Segoe UI' } },
            h('div', { style: { fontWeight: 800, fontSize: '15px', fontFamily: 'Montserrat, Segoe UI' } }, D.ajustos.local || ''), h('img', { src, style: { width: '42mm' } }),
            h('div', { style: { fontSize: '12px' } }, t('Escaneja i mira la carta'))))), t('QR')), 'pri', 'imprimeix')));
    };
    el.append(h('div.targeta', { style: { maxWidth: '760px', marginBottom: '14px' } }, h('h3', '📱 ', t('Carta digital')),
      h('p.suau.petit', t('Una pàgina per al mòbil amb tota la carta, en català, castellà, francès i anglès, i un filtre per amagar els plats amb els al·lèrgens que el client no pot menjar. Es fa amb els plats marcats «a la carta».')),
      h('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap' } },
        btn('Desar la carta digital (HTML)', async () => { const ok = await Store.desaFitxer('carta.html', cartaDigital(), 'HTML'); if (ok) UI.toast('Carta digital desada'); }, 'pri', 'baixa'),
        btn('Veure-la', () => UI.modal('Carta digital', h('iframe', { srcdoc: cartaDigital(), style: { width: '390px', maxWidth: '80vw', height: '70vh', border: '1px solid var(--linia)', borderRadius: '14px', display: 'block' } }), [{ t: 'Tancar', v: 1, pri: true }]), '', 'carta')),
      h('p.suau.petit', { style: { marginBottom: 0 } }, t('Penja el fitxer carta.html a la teva web, a Netlify Drop o a GitHub Pages, i posa l\'enllaç aquí sota per fer el QR.'))));
    el.append(h('div.targeta', { style: { maxWidth: '760px' } }, h('h3', ic('qr'), t('Carta QR')),
      h('p.suau.petit', t('Enganxa l\'enllaç públic de la carta digital (o d\'un PDF de la carta a Google Drive o Dropbox) i imprimeix les targetes per a les taules.')),
      h('div', { style: { display: 'flex', gap: '8px' } }, h('div', { style: { flex: 1 } }, url), btn('Generar QR', genera, 'pri', 'qr')), h('div', { style: { marginTop: '14px' } }, img)));
    genera();
  }
})(window);

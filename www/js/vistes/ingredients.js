/* Ingredients: preus de compra, rendiment, al·lèrgens, nutrició i historial de preus. */
'use strict';
(function (g) {
  const V = (g.V = g.V || {});
  const { h, ic, btn, eur, pct, qty, t, camp, inp, inpNum, sel } = UI;
  const filtre = { q: '', fam: '', prov: '', ori: false };

  const tendencia = (i) => {
    const hh = i.hist || [];
    if (hh.length < 2 || !(hh[hh.length - 2].p > 0)) return null;
    return ((hh[hh.length - 1].p - hh[hh.length - 2].p) / hh[hh.length - 2].p) * 100;
  };

  V.ingredients = {
    titol: 'Ingredients', ic: 'ingredient', nouTxt: 'Nou ingredient',
    badge: (D) => ({ n: D.ingredients.filter((i) => (!(GL.num(i.preu) > 0) || i.orientatiu) && i.actiu !== false).length, niv: 'alt' }),
    nou(base = {}) { obre({ id: null, nom: '', familia: 'Altres', unitat: 'kg', preu: 0, rend: 100, allergens: [], traces: [], estoc: 0, minim: 0, ...base }); },
    render(el, arg) {
      const D = Store.D, C = GL.context(D);
      const usos = new Map();
      for (const r of D.receptes) for (const i of D.ingredients) if (GL.usaIngredient(r, i.id, C)) usos.set(i.id, (usos.get(i.id) || 0) + 1);
      const fams = [...new Set(D.ingredients.map((i) => i.familia).filter(Boolean))].sort();
      const nOri = D.ingredients.filter((i) => i.orientatiu).length;
      if (!nOri) filtre.ori = false;
      const files = () => D.ingredients.filter((i) => (!filtre.ori || i.orientatiu) && (!filtre.fam || i.familia === filtre.fam) && (!filtre.prov || i.prov === filtre.prov)
        && (!filtre.q || GL.norm(i.nom + ' ' + (i.ref || '')).includes(GL.norm(filtre.q))));
      const T = UI.taula({
        cols: [
          { k: 'nom', t: 'Ingredient', cls: 'nom', r: (i) => h('span', i.nom, h('span.sub', t(i.familia || '') + (i.format ? ' · ' + i.format : ''))) },
          { k: 'prov', t: 'Proveïdor', r: (i) => h('span.suau', C.prov.get(i.prov)?.nom || '—'), v: (i) => C.prov.get(i.prov)?.nom || '' },
          { k: 'preu', t: 'Preu', cls: 'r num', r: (i) => { const tn = tendencia(i); return h('span', i.orientatiu ? h('span.etq.just', { title: t('Preu orientatiu: posa-hi el preu real'), style: { marginRight: '6px' } }, t('orientatiu')) : null,
            GL.num(i.preu) > 0 ? h('span', { class: i.orientatiu ? 'taronja' : '' }, eur(i.preu)) : h('span.vermell', t('sense preu')), h('span.suau.petit', ' /' + i.unitat),
            tn && Math.abs(tn) >= 0.5 ? h('span', { class: tn > 0 ? 'vermell petit' : 'verd petit' }, ` ${tn > 0 ? '▲' : '▼'}${Math.abs(tn).toFixed(0)}%`) : null); }, v: (i) => GL.num(i.preu) },
          { k: 'hist', t: 'Evolució', v: false, r: (i) => UI.spark((i.hist || []).map((x) => x.p)) },
          { k: 'rend', t: 'Rend.', cls: 'r num', r: (i) => i.rend < 100 ? pct(i.rend, 0) : h('span.suau', '100 %') },
          { k: 'real', t: 'Preu net', cls: 'r num', r: (i) => eur(GL.preuReal(i)), v: (i) => GL.preuReal(i) },
          { k: 'estoc', t: 'Estoc', cls: 'r num', r: (i) => { const e = GL.estatEstoc(i); return h('span', { class: e === 'esgotat' ? 'vermell' : e === 'baix' ? 'taronja' : '' }, qty(GL.num(i.estoc), i.unitat)); }, v: (i) => GL.num(i.estoc) },
          { k: 'alg', t: 'Al·lèrgens', r: (i) => UI.icAllergens(i.allergens || [], i.traces || []), v: (i) => (i.allergens || []).length },
          { k: 'usos', t: 'Receptes', cls: 'r num', r: (i) => usos.get(i.id) ? String(usos.get(i.id)) : h('span.suau', '0'), v: (i) => usos.get(i.id) || 0 },
        ],
        files: files(), ordre: ['nom', 1], onclic: (i) => App.ves('ingredients', i.id),
        buit: h('div.buit', ic('ingredient'), h('h3', t('Cap ingredient')), h('p', t('Afegeix el que compres amb el preu i la unitat. Després el pots fer servir a totes les receptes.')),
          h('div', { style: { display: 'flex', gap: '8px', justifyContent: 'center' } }, btn('Afegir de la base', deLaBase, 'pri', 'llista'), btn('Nou ingredient', () => V.ingredients.nou(), '', 'mes'), btn('Importar CSV', importaCSV, '', 'puja'))),
      });
      const resum = h('span.suau.petit');
      const refresca = () => { const f = files(); T.refresca(f); resum.textContent = t('{n} ingredients', { n: f.length }); };
      el.append(h('div.cap', UI.cercador('Cerca ingredients…', (q) => { filtre.q = q; refresca(); }, filtre.q),
        sel([['', 'Totes les famílies'], ...fams.map((f) => [f, f])], filtre.fam, (v) => { filtre.fam = v; refresca(); }, { style: { width: '190px' } }),
        sel([['', 'Tots els proveïdors'], ...D.proveidors.map((p) => [p.id, p.nom])], filtre.prov, (v) => { filtre.prov = v; refresca(); }, { style: { width: '200px' } }),
        nOri ? h('span.xip' + (filtre.ori ? '.on' : ''), { title: t('Preu orientatiu: posa-hi el preu real'), onclick: (e) => { filtre.ori = !filtre.ori; e.currentTarget.classList.toggle('on', filtre.ori); refresca(); } }, '⚠ ', t('Preus orientatius ({n})', { n: nOri })) : null,
        h('div.esp'), resum, btn('Afegir de la base', deLaBase, '', 'llista'), btn('Importar CSV', importaCSV, '', 'puja'), btn('Exportar CSV', exportaCSV, '', 'baixa')), T);
      refresca();
      if (arg) { const i = D.ingredients.find((x) => x.id === arg); if (i) obre(JSON.parse(JSON.stringify(i))); }
    },
  };

  function obre(I) {
    const D = Store.D, C = GL.context(D);
    const original = JSON.stringify(I);
    const preuOrig = GL.num(I.preu);
    const P = UI.panell(I.nom || t('Nou ingredient'), { onTanca: () => { if (JSON.stringify(I) !== original && I.nom.trim()) desa(true); if (location.hash.startsWith('#/ingredients/')) history.replaceState(null, '', '#/ingredients'); } });
    const preuNet = h('span.taronja');
    const actNet = () => { preuNet.textContent = eur(GL.preuReal(I)) + ' / ' + I.unitat + ' ' + t('net'); };
    const nom = inp(I.nom, (v) => { I.nom = v; P.titol.textContent = v || t('Nou ingredient'); });
    const preu = inpNum(I.preu || '', (v) => { I.preu = v; actNet(); });
    const rend = inpNum(I.rend, (v) => { I.rend = Math.min(100, Math.max(1, v || 100)); actNet(); });
    const uSel = sel(['kg', 'g', 'l', 'ml', 'cl', 'u'], I.unitat, (v) => { I.unitat = v; actNet(); });
    const gU = inpNum(I.gU || '', (v) => { I.gU = v; });
    // Format de compra: «caixa de 6 kg a 21 €» → 3,50 €/kg
    const fmtQ = inpNum('', null), fmtP = inpNum('', null);
    const calc = btn('Calcular', () => {
      const q = GL.num(fmtQ.value), p = GL.num(fmtP.value);
      if (q > 0 && p > 0) { I.preu = Math.round((p / q) * 10000) / 10000; preu.value = String(I.preu).replace('.', ','); actNet(); }
    }, 'mini');
    const provSel = sel([['', '—'], ...D.proveidors.map((p) => [p.id, p.nom])], I.prov || '', (v) => { I.prov = v; });
    const zones = [...new Set([...GL.ZONES.map((x) => t(x)), ...D.ingredients.map((i) => i.zona).filter(Boolean)])];
    const zonaIn = h('input', { type: 'text', value: I.zona || '', list: 'llista-zones', placeholder: t('Cambra, congelador…') });
    zonaIn.oninput = () => { I.zona = zonaIn.value.trim(); };
    const fams = [...new Set([...GL.FAMILIES, ...D.ingredients.map((i) => i.familia).filter(Boolean)])];
    const famIn = h('input', { type: 'text', value: I.familia || '', list: 'llista-fams' });
    famIn.oninput = () => { I.familia = famIn.value; };
    P.cos.append(
      h('div.fila.f2', camp('Nom', nom), camp('Família', famIn)), h('datalist#llista-fams', fams.map((f) => h('option', { value: f }))),
      h('div.fila.f4', camp('Unitat', uSel), camp('Preu per unitat (sense IVA)', UI.ambU(preu, '€')), camp('Rendiment', UI.ambU(rend, '%')),
        h('div', { title: t('Opcional. Permet posar a les receptes «2 u» d\'un producte que compres a kg (o grams d\'un que compres per unitats).') }, camp('Pes d\'una peça', UI.ambU(gU, 'g')))),
      I.orientatiu ? h('div.targeta', { style: { borderColor: 'var(--taronja)', padding: '8px 12px', marginBottom: '10px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' } },
        h('span.taronja', '⚠ ', h('b', t('Preu orientatiu.')), ' ', t('És una mitjana de mercat: posa-hi el preu real del teu proveïdor. Es canvia sol amb la primera compra.')),
        h('div.esp'), btn('El preu és correcte', (e) => { delete I.orientatiu; e.currentTarget.parentElement.remove(); }, 'mini')) : null,
      h('div', { style: { margin: '-4px 0 12px' } }, h('span.suau.petit', t('Preu real (amb el rendiment)') + ': '), preuNet,
        h('span.suau.petit', ' · ' + t('Rendiment: la part que aprofites després de netejar o pelar (patata ≈ 80 %, lluç ≈ 55 %).'))),
      h('div.targeta', { style: { padding: '10px 12px', marginBottom: '12px' } }, h('div.suau.petit', { style: { marginBottom: '6px' } }, t('Calculadora: si compres per format (caixa, sac, garrafa…)')),
        h('div', { style: { display: 'flex', gap: '8px', alignItems: 'center' } }, h('span.petit', t('Un format de')), h('div', { style: { width: '90px' } }, fmtQ), h('span.petit', I.unitat || ''),
          h('span.petit', t('costa')), h('div', { style: { width: '90px' } }, fmtP), h('span.petit', '€'), calc,
          h('div', { style: { flex: 1 } }, inp(I.format || '', (v) => { I.format = v; }, { placeholder: t('Nom del format (ex.: caixa 6 kg)') })))),
      h('div.fila.f4', camp('Proveïdor', provSel), camp('On es guarda', zonaIn), camp('Referència / codi', inp(I.ref || '', (v) => { I.ref = v; })), camp('IVA de compra', sel([[4, '4 %'], [10, '10 %'], [21, '21 %']], I.iva ?? 10, (v) => { I.iva = +v; }))),
      h('datalist#llista-zones', zones.map((z) => h('option', { value: z }))),
      seccioPreusProv(I, D, () => desa()),
      h('div.seccio', t('Al·lèrgens')), h('p.suau.petit', t('1r clic: conté · 2n clic: pot contenir traces · 3r clic: res')),
      UI.xipsAllergens(I.allergens, I.traces, (c, tr) => { I.allergens = c; I.traces = tr; }),
      h('div.seccio', t('Estoc')),
      h('div.fila.f3', camp('Estoc actual', UI.ambU(inpNum(I.estoc ?? 0, (v) => { I.estoc = v; }), I.unitat)),
        camp('Mínim (avís i comanda)', UI.ambU(inpNum(I.minim || '', (v) => { I.minim = v; }), I.unitat)),
        camp('Màxim (fins on demanar)', UI.ambU(inpNum(I.maxim || '', (v) => { I.maxim = v; }), I.unitat))),
      h('div.seccio', t('Valor nutricional per 100 g')), seccioNutri(I),
      h('div.seccio', t('Notes')), h('textarea', { rows: 2, oninput: (e) => { I.notes = e.target.value; } }, I.notes || ''));
    actNet();
    if (I.id) {
      const hist = I.hist || [];
      if (hist.length) P.cos.append(h('div.seccio', t('Historial de preus')),
        hist.length >= 2 ? UI.linia(hist.map((x) => ({ et: UI.data(x.d), v: x.p })), { alt: 120 }) : null,
        h('div.suau.petit', hist.slice(-8).reverse().map((x) => `${UI.data(x.d)}: ${eur(x.p, 3)}`).join('   ·   ')));
      const recs = D.receptes.filter((r) => GL.usaIngredient(r, I.id, C));
      P.cos.append(h('div.seccio', t('Es fa servir a')), recs.length ? h('div.xips', recs.map((r) => h('span.xip', { onclick: () => { P.tanca(); App.ves('receptes', r.id); } }, (r.tipus === 'elab' ? '🧪 ' : '') + r.nom))) : h('p.suau', t('Cap recepta')));
    }
    function desa(enTancar = false) {
      if (!I.nom.trim()) { UI.toast('Posa-li un nom', { tipus: 'av' }); return; }
      const nou = !I.id;
      if (nou) { I.id = GL.uid('i'); I._alta = GL.avui(); }
      const preuNou = GL.num(I.preu);
      Store.canvi(nou ? 'Ingredient creat' : 'Ingredient desat', (D2) => {
        const neta = JSON.parse(JSON.stringify(I));
        if (!nou && Math.abs(preuNou - preuOrig) > 1e-9) { neta.preu = preuOrig; GL.nouPreu(neta, preuNou); }
        const k = D2.ingredients.findIndex((x) => x.id === I.id);
        if (k >= 0) D2.ingredients[k] = neta; else D2.ingredients.push(neta);
      });
      if (!enTancar) { P.tanca(true); App.refresca(); } else setTimeout(() => App.refresca(), 0);
    }
    P.peu.append(
      I.id ? btn('Eliminar', async () => {
        const recs = D.receptes.filter((r) => r.linies.some((l) => l.t === 'i' && l.id === I.id));
        if (!(await UI.confirma(recs.length ? t('«{n}» es fa servir a {k} receptes; se\'n traurà. Eliminar?', { n: I.nom, k: recs.length }) : t('Eliminar «{n}»?', { n: I.nom }), 'Eliminar', true))) return;
        Store.canvi('Ingredient eliminat', (D2) => { D2.ingredients = D2.ingredients.filter((x) => x.id !== I.id); for (const r of D2.receptes) r.linies = r.linies.filter((l) => !(l.t === 'i' && l.id === I.id)); });
        P.tanca(true); App.refresca();
      }, 'perill', 'paperera') : null,
      h('div.esp'), h('span.suau.petit', t('Es desa en tancar')), btn('Desar', () => desa(), 'pri', 'check'));
    if (!I.nom) setTimeout(() => nom.focus(), 50);
  }
  V.ingredients.obre = (i) => obre(JSON.parse(JSON.stringify(i)));

  /** Comparador: l'últim preu de cada proveïdor (surt de les compres). */
  function seccioPreusProv(I, D, fet) {
    const pp = Object.entries(I.preusProv || {}).filter(([, x]) => x.p > 0);
    if (pp.length < 1 || (pp.length === 1 && pp[0][0] === I.prov)) return null;
    const C = GL.context(D), min = Math.min(...pp.map(([, x]) => x.p));
    return h('div.targeta', { style: { padding: '10px 12px', marginBottom: '12px' } },
      h('div.suau.petit', { style: { marginBottom: '6px' } }, t('Preus per proveïdor (de les compres)')),
      h('table.t.t-compacta', h('tbody', pp.sort((a, b) => a[1].p - b[1].p).map(([prov, x]) => h('tr',
        h('td.nom', C.prov.get(prov)?.nom || '?', prov === I.prov ? h('span.etq', { style: { marginLeft: '6px' } }, t('habitual')) : null),
        h('td.r.num', { class: 'r num ' + (x.p === min ? 'verd' : '') }, eur(x.p, 3) + ' /' + I.unitat), h('td.suau.petit', UI.data(x.d)),
        h('td', prov !== I.prov ? btn('Fer-lo habitual', () => { I.prov = prov; I.preu = x.p; fet(); }, 'mini') : ''))))));
  }

  function seccioNutri(I) {
    const base = NUTRI.busca(I.nom) || {};
    I.nutri = I.nutri || {};
    const camps = [['kcal', 'Energia (kcal)'], ['prot', 'Proteïnes'], ['greix', 'Greixos'], ['sat', 'Saturats'], ['carbo', 'Hidrats'], ['sucres', 'Sucres'], ['fibra', 'Fibra'], ['sal', 'Sal']];
    return h('div', h('p.suau.petit', t('Si ho deixes buit es fan servir els valors orientatius (en gris).')),
      h('div.fila.f4', camps.map(([k, et]) => camp(et, inpNum(I.nutri[k] ?? '', (v, e) => { if (e.value.trim() === '') delete I.nutri[k]; else I.nutri[k] = v; }, { placeholder: base[k] != null ? String(base[k]).replace('.', ',') : '' })))));
  }

  // ── Base d'ingredients habituals ────────────────────────────────────────
  async function deLaBase() {
    const D = Store.D, tens = new Set(D.ingredients.map((i) => GL.norm(i.nom)));
    const items = BASE.items(I18N.llengua), triats = new Set();
    let q = '';
    const llista = h('div', { style: { maxHeight: '52vh', overflow: 'auto', marginTop: '8px' } }), compte = h('span.suau.petit');
    const pinta = () => {
      UI.buida(llista); let fam = null;
      for (const x of items) {
        if (q && !GL.norm(x.nom + ' ' + x.ca).includes(GL.norm(q))) continue;
        if (x.familia !== fam) { fam = x.familia; llista.appendChild(h('div.seccio', { style: { margin: '10px 0 4px' } }, t(fam))); }
        const ja = tens.has(GL.norm(x.nom)) || tens.has(GL.norm(x.ca));
        llista.appendChild(h('label', { style: { display: 'flex', gap: '8px', alignItems: 'center', padding: '3px 2px', opacity: ja ? 0.45 : 1 } },
          h('input', { type: 'checkbox', disabled: ja, checked: triats.has(x.n), onchange: (e) => { if (e.target.checked) triats.add(x.n); else triats.delete(x.n); compte.textContent = t('{n} triats', { n: triats.size }); } }),
          h('span', { style: { flex: 1 } }, x.nom), h('span.suau.petit', '≈ ' + eur(x.preu) + '/' + x.unitat + (x.rend < 100 ? ` · ${x.rend} %` : '')), x.allergens.length ? UI.icAllergens(x.allergens, []) : null, ja ? h('span.suau.petit', t('ja el tens')) : null));
      }
    };
    const cerca = UI.cercador('Cerca…', (v) => { q = v; pinta(); });
    pinta(); compte.textContent = t('{n} triats', { n: 0 });
    const ok = await UI.modal('Afegir de la base', h('div', { style: { minWidth: 'min(560px, 80vw)' } },
      h('p.suau.petit', { style: { marginTop: 0 } }, t('Ingredients habituals amb la família, el rendiment i els al·lèrgens ja posats. Porten un preu orientatiu perquè el cost dels plats surti des del primer moment.')),
      h('p.taronja.petit', '⚠ ', t('Els preus orientatius són una mitjana de mercat i no són els teus: canvia\'ls pels preus reals del teu proveïdor (o es canviaran sols amb la primera compra).')),
      h('div', { style: { display: 'flex', gap: '8px', alignItems: 'center' } }, cerca, compte), llista),
      [{ t: 'Cancel·lar', v: 0 }, { t: 'Afegir', v: 1, pri: true }], true);
    if (!ok || !triats.size) return;
    Store.canvi('Ingredients afegits', (D2) => {
      for (const x of items.filter((y) => triats.has(y.n)))
        D2.ingredients.push({ id: GL.uid('i'), nom: x.nom, familia: x.familia, unitat: x.unitat, preu: x.preu, orientatiu: x.preu > 0, rend: x.rend, allergens: x.allergens, traces: [],
          gU: x.gU || undefined, nutri: { ...(NUTRI.busca(x.ca) || {}) }, estoc: 0, minim: 0, _alta: GL.avui() });
    });
    UI.toast(t('{n} ingredients afegits amb preu orientatiu. Canvia\'l pel preu real del teu proveïdor.', { n: triats.size }));
    App.refresca();
  }

  // ── CSV ────────────────────────────────────────────────────────────────
  function exportaCSV() {
    const D = Store.D, C = GL.context(D);
    const cols = ['nom', 'familia', 'unitat', 'preu', 'rend', 'proveidor', 'ref', 'allergens', 'estoc', 'minim'];
    const q = (v) => /[;"\n]/.test(String(v)) ? '"' + String(v).replace(/"/g, '""') + '"' : String(v);
    const linies = [cols.join(';'), ...D.ingredients.map((i) => [i.nom, i.familia || '', i.unitat, String(i.preu).replace('.', ','), i.rend, C.prov.get(i.prov)?.nom || '', i.ref || '',
      (i.allergens || []).join('|'), String(i.estoc || 0).replace('.', ','), String(i.minim || 0).replace('.', ',')].map(q).join(';'))];
    Store.desaFitxer('ingredients.csv', '﻿' + linies.join('\r\n'), 'CSV').then((c) => c && UI.toast('Exportat'));
  }
  function llegeixCSV(text) {
    const sep = (text.split('\n')[0].match(/;/g) || []).length >= (text.split('\n')[0].match(/,/g) || []).length ? ';' : ',';
    const files = []; let f = [], c = '', cometes = false;
    for (let k = 0; k < text.length; k++) {
      const x = text[k];
      if (cometes) { if (x === '"' && text[k + 1] === '"') { c += '"'; k++; } else if (x === '"') cometes = false; else c += x; }
      else if (x === '"') cometes = true;
      else if (x === sep) { f.push(c); c = ''; }
      else if (x === '\n' || x === '\r') { if (x === '\r' && text[k + 1] === '\n') k++; f.push(c); files.push(f); f = []; c = ''; }
      else c += x;
    }
    if (c || f.length) { f.push(c); files.push(f); }
    return files.filter((r) => r.some((x) => x.trim()));
  }
  V.ingredients.llegeixCSV = llegeixCSV;
  async function importaCSV() {
    const text = await Store.obreFitxer('.csv,.txt');
    if (!text) return;
    const files = llegeixCSV(text.replace(/^﻿/, ''));
    if (files.length < 2) return UI.toast('El fitxer és buit', { tipus: 'err' });
    const cap = files[0].map((x) => GL.norm(x));
    const col = (...noms) => cap.findIndex((x) => noms.some((n) => x.includes(n)));
    const ci = { nom: col('nom', 'nombre', 'name', 'ingredient', 'producte', 'articulo', 'descripcio'), preu: col('preu', 'precio', 'price', 'cost'),
      u: col('unitat', 'unidad', 'unit'), fam: col('famil', 'categ'), prov: col('prove', 'supplier'), rend: col('rend', 'yield'), ref: col('ref', 'codi', 'codigo') };
    if (ci.nom < 0) return UI.toast('Cal una columna «nom»', { tipus: 'err' });
    let nous = 0, act = 0;
    Store.canvi('Ingredients importats', (D) => {
      const per = new Map(D.ingredients.map((i) => [GL.norm(i.nom), i]));
      const provs = new Map(D.proveidors.map((p) => [GL.norm(p.nom), p]));
      for (const r of files.slice(1)) {
        const nom = (r[ci.nom] || '').trim(); if (!nom) continue;
        const preu = ci.preu >= 0 ? GL.num(r[ci.preu]) : 0;
        let provId = '';
        if (ci.prov >= 0 && r[ci.prov]?.trim()) {
          const k = GL.norm(r[ci.prov]);
          if (!provs.has(k)) { const p = { id: GL.uid('p'), nom: r[ci.prov].trim() }; D.proveidors.push(p); provs.set(k, p); }
          provId = provs.get(k).id;
        }
        const u0 = ci.u >= 0 ? GL.norm(r[ci.u]) : '';
        const u = { kg: 'kg', kilo: 'kg', g: 'g', gr: 'g', l: 'l', litre: 'l', litro: 'l', ml: 'ml', cl: 'cl' }[u0] || (u0 ? 'u' : 'kg');
        const i = per.get(GL.norm(nom));
        if (i) { if (preu > 0) GL.nouPreu(i, preu); if (provId) i.prov = provId; act++; }
        else {
          const n = { id: GL.uid('i'), nom, unitat: u, preu, rend: ci.rend >= 0 ? GL.num(r[ci.rend], 100) || 100 : 100, familia: ci.fam >= 0 ? r[ci.fam] || 'Altres' : 'Altres',
            prov: provId, ref: ci.ref >= 0 ? r[ci.ref] : '', allergens: [], traces: [], estoc: 0, minim: 0, _alta: GL.avui() };
          D.ingredients.push(n); per.set(GL.norm(nom), n); nous++;
        }
      }
    }, { silenci: true });
    UI.toast(t('Importats: {n} nous i {k} actualitzats', { n: nous, k: act }));
    App.refresca();
  }
})(window);

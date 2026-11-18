/* Receptes: plats, elaboracions (sub-receptes) i articles de venda directa. Escandall en viu. */
'use strict';
(function (g) {
  const V = (g.V = g.V || {});
  const { h, ic, btn, btnIc, eur, pct, qty, t, camp, inp, inpNum, sel } = UI;
  const filtre = { q: '', tipus: 'tots', cat: '' };
  const TIPUS = [['plat', 'Plat'], ['elab', 'Elaboració'], ['article', 'Article']];

  const etqEstat = (e) => e.estat === 'sense' ? h('span.etq', t('Sense preu'))
    : h('span.etq.' + e.estat, t(e.estat === 'ok' ? 'Bé' : e.estat === 'just' ? 'Just' : 'Baix'));

  V.receptes = {
    titol: 'Receptes', ic: 'recepta', nouTxt: 'Nova recepta',
    badge: (D) => { const C = GL.context(D); const n = D.receptes.filter((r) => r.tipus !== 'elab' && GL.num(r.pvp) > 0 && GL.economia(r, C, D.ajustos.iva).estat === 'baix').length; return { n, niv: 'mig' }; },
    nou(base = {}) { obreEditor({ id: null, nom: '', tipus: 'plat', cat: 'Plats principals', pvp: 0, iva: Store.D.ajustos.iva, racions: 1, linies: [], traces: [], carta: true, ...base }); },
    render(el, arg) {
      const D = Store.D, C = GL.context(D), iva = D.ajustos.iva;
      const cats = [...new Set(D.receptes.map((r) => r.cat).filter(Boolean))].sort();
      const llista = () => D.receptes.filter((r) => (filtre.tipus === 'tots' || r.tipus === filtre.tipus) && (!filtre.cat || r.cat === filtre.cat)
        && (!filtre.q || GL.norm(r.nom + ' ' + (r.cat || '')).includes(GL.norm(filtre.q))));
      const files = () => llista().map((r) => ({ r, e: GL.economia(r, C, iva), a: GL.allergens(r, C), o: GL.orientatius(r, C).length, id: r.id }));
      const nOri = D.receptes.filter((r) => GL.orientatius(r, C).length).length;
      const T = UI.taula({
        cols: [
          { k: 'nom', t: 'Recepta', cls: 'nom', r: (f) => h('span', f.r.foto ? '📷 ' : '', f.r.nom, h('span.sub', t(f.r.cat || ''))), v: (f) => f.r.nom },
          { k: 'partida', t: 'Partida', r: (f) => h('span.suau.petit', f.r.partida || ''), v: (f) => f.r.partida || '' },
          { k: 'tipus', t: 'Tipus', r: (f) => f.r.tipus === 'plat' ? h('span.suau.petit', t('Plat')) : h('span.etq.' + f.r.tipus, t(f.r.tipus === 'elab' ? 'Elaboració' : 'Article')), v: (f) => f.r.tipus },
          { k: 'cost', t: 'Cost/ració', cls: 'r num', r: (f) => f.r.tipus === 'elab' ? h('span', eur(GL.costUnitatElab(f.r, C)), h('span.suau.petit', '/' + (f.r.rendU || 'u'))) : eur(f.e.cost), v: (f) => f.e.cost },
          { k: 'pvp', t: 'PVP', cls: 'r num', r: (f) => f.r.tipus === 'elab' ? '' : f.e.pvp ? eur(f.e.pvp) : h('span.suau.petit', t('suggerit') + ' ' + eur(f.e.pvpSuggerit)), v: (f) => f.e.pvp },
          { k: 'fc', t: 'Food cost', cls: 'r num', r: (f) => f.r.tipus === 'elab' || !f.e.net ? '' : h('span', { class: f.e.estat === 'baix' ? 'vermell' : f.e.estat === 'just' ? 'taronja' : 'verd' }, pct(f.e.fc)), v: (f) => f.e.fc },
          { k: 'marge', t: 'Marge', cls: 'r num', r: (f) => f.r.tipus === 'elab' || !f.e.net ? '' : eur(f.e.marge), v: (f) => f.e.marge, desc: true },
          { k: 'estat', t: 'Estat', r: (f) => h('span', f.r.tipus === 'elab' ? '' : etqEstat(f.e), f.o ? h('span.etq.just', { title: t('Calculat amb preus orientatius: posa els preus reals als ingredients'), style: { marginLeft: '4px' } }, '≈') : null), v: (f) => ({ baix: 0, just: 1, ok: 2, sense: 3 }[f.e.estat]) },
          { k: 'alg', t: 'Al·lèrgens', r: (f) => UI.icAllergens(f.a.conte, f.a.traces), v: (f) => f.a.conte.length },
          { k: 'carta', t: 'Carta', cls: 'c', v: false, r: (f) => f.r.tipus === 'elab' ? '' : h('input.no-clic', { type: 'checkbox', checked: f.r.carta !== false, title: t('Surt a la carta'),
            onchange: (e) => Store.canvi('', (D2) => { D2.receptes.find((x) => x.id === f.r.id).carta = e.target.checked; }, { silenci: true }) }) },
        ],
        files: files(), ordre: ['nom', 1], onclic: (f) => App.ves('receptes', f.r.id),
        buit: h('div.buit', ic('recepta'), h('h3', t('Cap recepta')), h('p', t('Crea el primer plat: tria els ingredients i la quantitat per ració, i el cost surt sol.')), h('div', { style: { display: 'flex', gap: '8px', justifyContent: 'center' } }, btn('Afegir de la base', deLaBase, 'pri', 'llista'), btn('Nova recepta', () => V.receptes.nou(), '', 'mes'))),
      });
      const resum = h('span.suau.petit');
      const refresca = () => { const f = files(); T.refresca(f); resum.textContent = t('{n} receptes', { n: f.length }); };
      const xipsCat = h('div.filtres', [['', 'Totes'], ...cats.map((c) => [c, c])].map(([v, txt]) => h('span.xip' + (filtre.cat === v ? '.on' : ''), { onclick: (e) => {
        filtre.cat = v; [...xipsCat.children].forEach((x) => x.classList.remove('on')); e.currentTarget.classList.add('on'); refresca(); } }, t(txt))));
      el.append(
        h('div.cap', UI.cercador('Cerca receptes…', (q) => { filtre.q = q; refresca(); }, filtre.q),
          UI.grupBtn([['tots', 'Totes'], ['plat', 'Plats'], ['elab', 'Elaboracions'], ['article', 'Articles']], filtre.tipus, (v) => { filtre.tipus = v; refresca(); }),
          h('div.esp'), resum, btn('Afegir de la base', deLaBase, '', 'llista'), btn('Al·lèrgens', () => App.ves('carta', 'allergens'), '', 'imprimeix')),
        nOri ? h('div.targeta', { style: { borderColor: 'var(--taronja)', padding: '8px 12px', marginBottom: '12px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' } },
          h('span.taronja', '⚠ ', t('{n} receptes estan calculades amb preus orientatius (≈). Els costos i els marges no són reals fins que posis els preus del teu proveïdor.', { n: nOri })),
          h('div.esp'), btn('Posar els preus reals', () => App.ves('ingredients'), 'mini pri', 'euro')) : null,
        h('div', { style: { marginBottom: '12px' } }, xipsCat), T);
      refresca();
      if (arg) { const r = D.receptes.find((x) => x.id === arg); if (r) obreEditor(JSON.parse(JSON.stringify(r))); }
    },
  };

  // ── Base de plats elaborats ─────────────────────────────────────────────
  async function deLaBase() {
    const D = Store.D, ll = I18N.llengua, items = PLATS.items(ll), triats = new Set();
    const tens = new Set(D.receptes.map((r) => GL.norm(r.nom)));
    const ja = (x) => x.noms.some((n) => tens.has(GL.norm(n)));
    const algBase = new Map(BASE.llista.map((b) => [b[0], b[7] ? b[7].split(' ') : []]));
    const algs = (x, pila = []) => { const s = new Set(); for (const [n] of x.linies) {
      if (n[0] === '@') { const sub = items.find((y) => y.ca === n.slice(1)); if (sub && !pila.includes(sub.ca)) algs(sub, pila.concat(x.ca)).forEach((k) => s.add(k)); }
      else (algBase.get(n) || []).forEach((k) => s.add(k)); } return GL.ALLERGENS.map((a) => a.k).filter((k) => s.has(k)); };
    let q = '', tipus = 'tots';
    const llista = h('div', { style: { maxHeight: '52vh', overflow: 'auto', marginTop: '8px' } }), compte = h('span.suau.petit');
    const actCompte = () => { compte.textContent = t('{n} triats', { n: triats.size }); };
    const pinta = () => {
      UI.buida(llista); let cat = null;
      const xs = items.filter((x) => (tipus === 'tots' || x.tipus === tipus) && (!q || x.noms.some((n) => GL.norm(n).includes(GL.norm(q)))))
        .sort((a, b) => (a.tipus === 'elab') - (b.tipus === 'elab') || GL.CATEGORIES.indexOf(a.cat) - GL.CATEGORIES.indexOf(b.cat));
      for (const x of xs) {
        const c = x.tipus === 'elab' ? 'Elaboracions' : x.cat;
        if (c !== cat) { cat = c; llista.appendChild(h('div.seccio', { style: { margin: '10px 0 4px' } }, t(c))); }
        const j = ja(x);
        llista.appendChild(h('label', { style: { display: 'flex', gap: '8px', alignItems: 'center', padding: '3px 2px', opacity: j ? 0.45 : 1 } },
          h('input', { type: 'checkbox', disabled: j, checked: triats.has(x.n), onchange: (e) => { if (e.target.checked) triats.add(x.n); else triats.delete(x.n); actCompte(); } }),
          h('span', { style: { flex: 1 } }, x.nom), h('span.suau.petit', t('{n} ingredients', { n: x.linies.length })),
          (() => { const a = algs(x); return a.length ? UI.icAllergens(a, []) : null; })(), j ? h('span.suau.petit', t('ja el tens')) : null));
      }
    };
    pinta(); actCompte();
    const ok = await UI.modal('Afegir plats de la base', h('div', { style: { minWidth: 'min(620px, 82vw)' } },
      h('p.suau.petit', { style: { marginTop: 0 } }, t('Plats i elaboracions habituals amb l\'escandall per ració. Es fan servir els teus ingredients si ja els tens i es creen els que falten. El cost surt dels teus preus i es recalcula sol quan en canvies un. Les quantitats són una referència: ajusta-les a la teva cuina.')),
      h('p.taronja.petit', '⚠ ', t('Els ingredients nous arriben amb un preu orientatiu (mitjana de mercat). Els plats quedaran marcats amb ≈ fins que hi posis els preus reals del teu proveïdor.')),
      h('div', { style: { display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' } }, UI.cercador('Cerca…', (v) => { q = v; pinta(); }),
        UI.grupBtn([['tots', 'Tots'], ['plat', 'Plats'], ['elab', 'Elaboracions'], ['article', 'Articles']], tipus, (v) => { tipus = v; pinta(); }), compte), llista),
      [{ t: 'Cancel·lar', v: 0 }, { t: 'Afegir', v: 1, pri: true }], true);
    if (!ok || !triats.size) return;
    const creats = { ing: 0, rec: 0 };
    Store.canvi('Plats afegits', (D2) => { for (const n of triats) PLATS.afegeix(D2, n, ll, creats); });
    UI.toast(creats.ing ? t('{n} receptes afegides i {k} ingredients nous amb preu orientatiu. Canvia\'ls pels preus reals: els costos es recalcularan sols.', { n: creats.rec, k: creats.ing }) : t('{n} receptes afegides', { n: creats.rec }), { tipus: creats.ing ? 'av' : undefined, ms: 9000 });
    App.refresca();
  }
  V.receptes.deLaBase = deLaBase;

  // ── Editor ──────────────────────────────────────────────────────────────
  function obreEditor(R) {
    const D = Store.D;
    const original = JSON.stringify(R);
    let pest = 'escandall';
    // si canvies un preu des d'aquí (p. ex. un ingredient orientatiu), l'escandall es torna a calcular
    const prou = Store.escolta(() => { if (pest === 'escandall' && document.body.contains(cosPest) && !cosPest.contains(document.activeElement)) pinta(); });
    const P = UI.panell('', { ample: true, onTanca: () => {
      prou();
      if (JSON.stringify(R) !== original && R.nom.trim()) { desa(true); }
      if (location.hash.startsWith('#/receptes/')) history.replaceState(null, '', '#/receptes');
    } });
    const titol = h('h2'); P.p.querySelector('.p-cap').replaceChild(titol, P.p.querySelector('.p-cap h2') || P.p.querySelector('.p-cap').firstChild);
    const cosPest = h('div');
    const pestanyes = h('div.pestanyes');
    const PEST = [['escandall', 'Escandall'], ['elaboracio', 'Elaboració'], ['allergens', 'Al·lèrgens i nutrició'], ['produccio', 'Produir']];
    const pintaPest = () => {
      UI.buida(pestanyes);
      PEST.forEach(([k, txt]) => pestanyes.appendChild(h('button', { class: pest === k ? 'on' : '', onclick: () => { pest = k; pintaPest(); pinta(); } }, t(txt))));
    };
    P.cos.append(capcalera(), pestanyes, cosPest);
    pintaPest();

    function ctx() {  // context amb la recepta en edició
      const D2 = { ...D, receptes: D.receptes.filter((x) => x.id !== R.id).concat([{ ...R, id: R.id || '__nou' }]) };
      return GL.context(D2);
    }
    function capcalera() {
      const w = h('div');
      const nom = inp(R.nom, (v) => { R.nom = v; titol.textContent = v || t('Nova recepta'); }, { placeholder: t('Nom del plat o elaboració'), style: { fontSize: '18px', fontWeight: '700' } });
      titol.textContent = R.nom || t('Nova recepta');
      const cats = [...new Set([...GL.CATEGORIES, ...D.receptes.map((r) => r.cat).filter(Boolean)])];
      const catSel = h('input', { type: 'text', value: R.cat || '', list: 'llista-cats' });
      catSel.oninput = () => { R.cat = catSel.value; refrescaResum(); };
      const dl = h('datalist#llista-cats', cats.map((c) => h('option', { value: c })));
      const rac = inpNum(R.racions, (v) => { R.racions = Math.max(1, v || 1); pinta(); });
      const elabCamps = h('div.fila.f3',
        camp('Quantitat que surt', inpNum(R.rendQ ?? 1, (v) => { R.rendQ = v; pinta(); })),
        camp('Unitat', sel(['kg', 'g', 'l', 'ml', 'u'], R.rendU || 'kg', (v) => { R.rendU = v; pinta(); })),
        camp('Es conserva (dies)', inpNum(R.conserva ?? D.ajustos.diesConserva, (v) => { R.conserva = v; })));
      const tipus = UI.grupBtn(TIPUS, R.tipus, (v) => {
        R.tipus = v; elabCamps.classList.toggle('amaga', v !== 'elab');
        if (v === 'elab') { R.carta = false; R.rendU = R.rendU || 'kg'; R.rendQ = R.rendQ || 1; } pinta();
      });
      elabCamps.classList.toggle('amaga', R.tipus !== 'elab');
      const parts = [...new Set([...GL.PARTIDES.map((x) => t(x)), ...D.receptes.map((r) => r.partida).filter(Boolean)])];
      const partIn = h('input', { type: 'text', value: R.partida || '', list: 'llista-partides', placeholder: t('Cuina calenta, barra…') });
      partIn.oninput = () => { R.partida = partIn.value.trim(); };
      w.append(h('div.fila.f2', camp('Nom', nom), camp('Tipus', tipus)),
        h('div.fila.f4', camp('Categoria', catSel), camp('Partida', partIn), camp('Racions que surten', rac), camp('Temps de preparació (min)', inpNum(R.temps ?? '', (v) => { R.temps = v; })) ),
        dl, h('datalist#llista-partides', parts.map((c) => h('option', { value: c }))), elabCamps);
      setTimeout(() => { if (!R.nom) nom.focus(); }, 50);
      return w;
    }

    let refrescaResum = () => {};
    function pinta() {
      UI.buida(cosPest);
      ({ escandall, elaboracio, allergens, produccio })[pest]();
    }

    // Pestanya 1: escandall
    function escandall() {
      const taulaL = h('table.t.linies');
      const resum = h('div');
      let pintaLinies = () => {
        UI.buida(taulaL);
        const C = ctx(), total = GL.costRecepta({ ...R, id: R.id || '__nou' }, C) || 0;
        taulaL.appendChild(h('thead', h('tr', h('th', t('Ingredient o elaboració')), h('th.r', t('Quantitat')), h('th', t('Unitat')),
          h('th.r', t('Preu')), h('th.r', t('Cost')), h('th.r', '%'), h('th'))));
        const tb = h('tbody');
        R.linies.forEach((l, n) => tb.appendChild(filaLinia(l, n, C, total, pintaLinies)));
        tb.appendChild(filaNova(pintaLinies));
        taulaL.appendChild(tb);
        taulaL.appendChild(h('tfoot', h('tr', h('td', { colspan: 4 }, t('Total recepta')), h('td.r.num', eur(total)), h('td'), h('td'))));
        refrescaResum();
      };
      refrescaResum = () => { UI.buida(resum).appendChild(blocResum()); };
      const avisOri = h('div');
      cosPest.append(avisOri, h('div.taula-w', { style: { overflow: 'visible' } }, taulaL), resum);
      const pintaAvis = () => { UI.buida(avisOri); const os = GL.orientatius({ ...R, id: R.id || '__nou' }, ctx()); if (!os.length) return;
        avisOri.appendChild(h('div.targeta', { style: { borderColor: 'var(--taronja)', padding: '8px 12px', marginBottom: '10px' } },
          h('span.taronja', '⚠ ', h('b', t('Cost calculat amb preus orientatius')), ' — ', t('posa el preu real a')), ' ',
          ...os.map((i) => h('span.xip', { style: { margin: '2px' }, onclick: () => V.ingredients.obre(i) }, i.nom, ' ≈ ', eur(i.preu)))));
      };
      const pl0 = pintaLinies; pintaLinies = () => { pl0(); pintaAvis(); };
      pintaLinies();
    }

    function itemsCombo() {
      const D0 = Store.D;
      return [
        ...D0.ingredients.filter((i) => i.actiu !== false).map((i) => ({ t: 'i', id: i.id, nom: i.nom, sub: eur(i.preu) + '/' + i.unitat, ic: '🧺' })),
        ...D0.receptes.filter((r) => r.tipus === 'elab' && r.id !== R.id).map((r) => ({ t: 'r', id: r.id, nom: r.nom, sub: t('elaboració'), ic: '🧪' })),
      ];
    }
    function infoLinia(l, C) {
      if (l.t === 'r') { const s = C.rec.get(l.id); return s ? { nom: s.nom, u: s.rendU || 'u', preu: GL.costUnitatElab(s, C), elab: true } : null; }
      const i = C.ing.get(l.id); return i ? { nom: i.nom, u: i.unitat, preu: GL.preuReal(i), rend: i.rend, us: GL.unitatsIng(i), ori: !!i.orientatiu } : null;
    }
    function filaLinia(l, n, C, total, repinta) {
      const inf = infoLinia(l, C) || { nom: '?', u: l.u || 'u', preu: 0 };
      const cost = GL.costLinia(l, C);
      const cmb = UI.combo({ items: itemsCombo, valor: inf.nom, onTria: (x) => { l.t = x.t; l.id = x.id; l.u = infoLinia(l, ctx())?.u; repinta(); }, onNou: (nom) => creaIngredient(nom, (id) => { l.t = 'i'; l.id = id; l.u = Store.D.ingredients.find((i) => i.id === id).unitat; repinta(); }) });
      const q = inpNum(l.q, (v) => { l.q = v; actualitzaFila(); }, { placeholder: '0' });
      q.classList.add('q'); q.dataset.n = n;
      q.addEventListener('keydown', (e) => { if (e.key === 'Enter' || (e.key === 'Tab' && !e.shiftKey && n === R.linies.length - 1)) { e.preventDefault(); repinta(); setTimeout(() => taulaUltim()?.focus(), 30); } });
      const us = inf.us || GL.unitatsPer(inf.u);
      const u = sel(us, l.u || inf.u, (v) => { l.u = v; actualitzaFila(); }, { class: 'u' });
      const tdCost = h('td.r.num', eur(cost)), tdPct = h('td.r.num.suau', total ? pct((cost / total) * 100, 0) : '');
      function actualitzaFila() {
        const C2 = ctx(), c2 = GL.costLinia(l, C2), tot = GL.costRecepta({ ...R, id: R.id || '__nou' }, C2);
        tdCost.textContent = eur(c2); tdPct.textContent = tot ? pct((c2 / tot) * 100, 0) : '';
        const tf = tdCost.closest('table').querySelector('tfoot td.r'); if (tf) tf.textContent = eur(tot);
        refrescaResum();
      }
      return h('tr', h('td', cmb, inf.elab ? h('span.etq.elab', { style: { marginLeft: '6px' } }, t('elaboració')) : null), h('td', q), h('td', u),
        h('td.r.num', { class: 'r num ' + (inf.ori ? 'taronja' : 'suau'), title: inf.ori ? t('Preu orientatiu: posa-hi el preu real') : '' }, (inf.ori ? '≈ ' : '') + eur(inf.preu) + '/' + inf.u + (inf.rend && inf.rend < 100 ? ` · ${inf.rend}%` : '')), tdCost, tdPct,
        h('td', btnIc('x', () => { R.linies.splice(n, 1); repinta(); }, 'Treure')));
    }
    function taulaUltim() { return cosPest.querySelector('tbody tr:last-child input'); }
    function filaNova(repinta) {
      const cmb = UI.combo({ items: itemsCombo, placeholder: '+ ' + t('Afegeix un ingredient (escriu per cercar)'),
        onTria: (x) => { const i = infoLinia({ t: x.t, id: x.id }, ctx()); const u = { kg: 'g', l: 'ml' }[i?.u] || i?.u;
          R.linies.push({ t: x.t, id: x.id, q: '', u }); repinta(); setTimeout(() => cosPest.querySelector(`input.q[data-n="${R.linies.length - 1}"]`)?.focus(), 30); },
        onNou: (nom) => creaIngredient(nom, (id) => { R.linies.push({ t: 'i', id, q: 1, u: Store.D.ingredients.find((i) => i.id === id).unitat }); repinta(); }) });
      return h('tr', h('td', { colspan: 7 }, cmb));
    }
    async function creaIngredient(nom, fet) {
      const u = sel(['kg', 'g', 'l', 'ml', 'u'], 'kg'), p = inpNum(''), al = h('div');
      let alg = [];
      al.appendChild(UI.xipsAllergens([], [], (c) => { alg = c; }, false));
      const ok = await UI.modal('Nou ingredient', h('div', h('p', h('b', nom)), h('div.fila', camp('Unitat de compra', u), camp('Preu (sense IVA)', p)), camp('Al·lèrgens', al)),
        [{ t: 'Cancel·lar', v: 0 }, { t: 'Crear', v: 1, pri: true }], true);
      if (!ok) return;
      const id = GL.uid('i');
      Store.canvi('Ingredient creat', (D2) => { D2.ingredients.push({ id, nom, unitat: u.value, preu: GL.num(p.value), rend: 100, familia: 'Altres', allergens: alg, traces: [], estoc: 0, minim: 0, _alta: GL.avui() }); });
      fet(id);
    }

    function blocResum() {
      const C = ctx(), Rx = { ...R, id: R.id || '__nou' };
      if (R.tipus === 'elab') {
        const tot = GL.costRecepta(Rx, C), u = GL.costUnitatElab(Rx, C);
        const usos = Store.D.receptes.filter((x) => (x.linies || []).some((l) => l.t === 'r' && l.id === R.id));
        return h('div', { style: { marginTop: '14px' } }, h('div.resum-cost',
          h('div.targeta', h('div.suau.petit', t('Cost de la tanda')), h('div.val.num', eur(tot))),
          h('div.targeta', h('div.suau.petit', t('Cost per') + ' ' + (R.rendU || 'kg')), h('div.val.num.taronja', eur(u))),
          h('div.targeta', h('div.suau.petit', t('Surt')), h('div.val.num', qty(GL.num(R.rendQ, 1), R.rendU || 'kg'))),
          h('div.targeta', h('div.suau.petit', t('Es fa servir a')), h('div.val.num', String(usos.length)), h('div.suau.petit', usos.map((x) => x.nom).join(', ')))));
      }
      const e = GL.economia(Rx, C, Store.D.ajustos.iva);
      const pvp = inpNum(R.pvp || '', (v) => { R.pvp = v; upd(); });
      const ivaS = sel([[4, '4 %'], [10, '10 %'], [21, '21 %'], [0, '0 %']], R.iva ?? Store.D.ajustos.iva, (v) => { R.iva = +v; upd(); });
      const obj = inpNum(R.obj || e.obj, (v) => { R.obj = v; upd(); });
      const vals = { fc: h('div.val.num'), marge: h('div.val.num'), net: h('div.suau.petit'), sug: h('span.num'), est: h('span'), cost: h('div.val.num') };
      const bSug = btn('', () => { R.pvp = GL.economia({ ...R, id: R.id || '__nou' }, ctx(), Store.D.ajustos.iva).pvpSuggerit; pvp.value = String(R.pvp).replace('.', ','); upd(); }, 'mini');
      bSug.append(t('Aplicar') + ' ', vals.sug);
      function upd() {
        const x = GL.economia({ ...R, id: R.id || '__nou' }, ctx(), Store.D.ajustos.iva);
        vals.cost.textContent = eur(x.cost);
        vals.fc.textContent = x.net ? pct(x.fc) : '—'; vals.fc.className = 'val num ' + (x.estat === 'baix' ? 'vermell' : x.estat === 'just' ? 'taronja' : x.estat === 'ok' ? 'verd' : '');
        vals.marge.textContent = eur(x.marge);
        vals.net.textContent = t('Sense IVA') + ': ' + eur(x.net) + ' · ' + t('marge') + ' ' + pct(x.margePct);
        vals.sug.textContent = eur(x.pvpSuggerit);
        bSug.firstChild.textContent = x.estat === 'ok' ? t('Objectiu complert · mínim') + ' ' : t('Aplicar') + ' ';
        bSug.classList.toggle('pri', x.estat === 'baix' || x.estat === 'just');
        UI.buida(vals.est).appendChild(etqEstat(x));
      }
      upd();
      return h('div', { style: { marginTop: '14px' } },
        h('div.resum-cost',
          h('div.targeta', h('div.suau.petit', t('Cost per ració')), vals.cost, h('div.suau.petit', R.racions > 1 ? t('{n} racions', { n: R.racions }) : '')),
          h('div.targeta', h('div.suau.petit', t('Food cost')), vals.fc, vals.est),
          h('div.targeta', h('div.suau.petit', t('Marge per ració')), vals.marge, vals.net),
          h('div.targeta', h('div.suau.petit', t('PVP suggerit per l\'objectiu')), bSug)),
        h('div.fila.f3', { style: { marginTop: '12px' } }, camp('PVP amb IVA', UI.ambU(pvp, '€')), camp('IVA', ivaS), camp('Marge objectiu', UI.ambU(obj, '%'))),
        h('label', { style: { display: 'flex', gap: '8px', alignItems: 'center' } }, h('input', { type: 'checkbox', checked: R.carta !== false, onchange: (ev) => { R.carta = ev.target.checked; } }), t('Surt a la carta')),
        blocMides());
    }
    // Mides de ració: tapa, mitja, ració… cadascuna amb el seu preu i el seu marge
    function blocMides() {
      const w = h('div', { style: { marginTop: '14px' } });
      const pintaM = () => {
        UI.buida(w);
        R.mides = R.mides || [];
        w.append(h('div.seccio', t('Mides de ració'), h('span.suau.petit', { style: { marginLeft: '8px', fontWeight: 400, textTransform: 'none', letterSpacing: 0 } }, t('Tapa, mitja ració… amb el seu preu. El cost és proporcional a la ració sencera.'))));
        if (R.mides.length) w.append(h('table.t.t-compacta', { style: { maxWidth: '760px' } },
          h('thead', h('tr', h('th', t('Mida')), h('th.r', t('Part de la ració')), h('th.r', t('PVP amb IVA')), h('th.r', t('Cost')), h('th.r', t('Food cost')), h('th.r', t('Marge')), h('th'), h('th'))),
          h('tbody', R.mides.map((m, k) => {
            const nomM = inp(m.nom || '', (v) => { m.nom = v; }, { placeholder: t('Mitja ració') });
            const tdC = h('td.r.num'), tdF = h('td.r.num'), tdM = h('td.r.num'), tdS = h('td');
            const act = () => {
              const e = GL.economiaMides({ ...R, id: R.id || '__nou' }, ctx(), Store.D.ajustos.iva)[k];
              tdC.textContent = eur(e.cost); tdM.textContent = eur(e.marge);
              tdF.textContent = e.net ? pct(e.fc) : '—'; tdF.className = 'r num ' + (e.estat === 'baix' ? 'vermell' : e.estat === 'just' ? 'taronja' : e.estat === 'ok' ? 'verd' : '');
              UI.buida(tdS); if (e.estat !== 'ok' && e.pvpSuggerit) tdS.appendChild(btn(t('Aplicar') + ' ' + eur(e.pvpSuggerit), () => { m.pvp = e.pvpSuggerit; pv.value = String(m.pvp).replace('.', ','); act(); }, 'mini'));
            };
            const f = inpNum(Math.round((GL.num(m.f, 1) || 1) * 100), (v) => { m.f = Math.max(1, v || 100) / 100; act(); });
            const pv = inpNum(m.pvp || '', (v) => { m.pvp = v; act(); });
            f.style.width = '96px'; pv.style.width = '104px';
            act();
            return h('tr', h('td', nomM), h('td.r', UI.ambU(f, '%')), h('td.r', UI.ambU(pv, '€')), tdC, tdF, tdM, tdS,
              h('td', btnIc('x', () => { R.mides.splice(k, 1); pintaM(); }, 'Treure')));
          }))));
        w.append(h('div', { style: { display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' } },
          [['Tapa', 0.35], ['Mitja ració', 0.6], ['Ració doble', 2]].map(([n, f]) => btn('+ ' + t(n), () => { R.mides.push({ nom: t(n), f, pvp: GL.economiaMides({ ...R, mides: [{ f, pvp: 0 }], id: R.id || '__nou' }, ctx(), Store.D.ajustos.iva)[0].pvpSuggerit }); pintaM(); }, 'mini')),
          btn('+ ' + t('Una altra mida'), () => { R.mides.push({ nom: '', f: 1, pvp: 0 }); pintaM(); }, 'mini')));
      };
      pintaM();
      return w;
    }

    // Pestanya 2: elaboració
    function elaboracio() {
      const foto = h('div');
      const pintaFoto = () => {
        UI.buida(foto);
        if (R.foto) foto.append(h('img', { src: R.foto, style: { maxWidth: '100%', maxHeight: '220px', borderRadius: '10px', display: 'block', marginBottom: '8px' } }),
          btn('Treure la foto', () => { R.foto = ''; pintaFoto(); }, 'mini perill'));
        else foto.append(btn('Afegir una foto', triaFoto, '', 'foto'));
      };
      const triaFoto = () => {
        const i = h('input', { type: 'file', accept: 'image/*' });
        i.onchange = () => { const f = i.files[0]; if (!f) return; const rd = new FileReader();
          rd.onload = () => { const im = new Image(); im.onload = () => {
            const m = 800, k = Math.min(1, m / Math.max(im.width, im.height)), cv = document.createElement('canvas');
            cv.width = im.width * k; cv.height = im.height * k; cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
            R.foto = cv.toDataURL('image/jpeg', 0.82); pintaFoto(); }; im.src = rd.result; };
          rd.readAsDataURL(f); };
        i.click();
      };
      pintaFoto();
      const passos = h('textarea', { rows: 10, placeholder: t('Un pas per línia. Ex.: Pelar i tallar les patates a daus de 2 cm.') }, R.passos || '');
      passos.oninput = () => { R.passos = passos.value; };
      const notes = h('textarea', { rows: 3, placeholder: t('Emplatat, punts crítics, conservació…') }, R.notes || '');
      notes.oninput = () => { R.notes = notes.value; };
      const desc = inp(R.desc || '', (v) => { R.desc = v; }, { placeholder: t('Text curt per a la carta') });
      cosPest.append(h('div.graella', { style: { gridTemplateColumns: '2fr 1fr' } },
        h('div', camp('Passos de l\'elaboració', passos), h('div', { style: { height: '10px' } }), camp('Notes i emplatat', notes), h('div', { style: { height: '10px' } }), camp('Descripció a la carta', desc)),
        h('div', h('div.seccio', t('Foto')), foto)));
    }

    // Pestanya 3: al·lèrgens i nutrició
    function allergens() {
      const C = ctx(), Rx = { ...R, id: R.id || '__nou' };
      const a = GL.allergens(Rx, C);
      const n = GL.nutricio(Rx, C, NUTRI.busca);
      const rac = Math.max(1, GL.num(R.racions, 1));
      const per100 = (k) => (n.grams ? (n.tot[k] / n.grams) * 100 : 0);
      const fila = (k, et, u) => h('tr', h('td', t(et)), h('td.r.num', UI.fN(n.tot[k] / rac, 1) + ' ' + u), h('td.r.num', UI.fN(per100(k), 1) + ' ' + u),
        h('td', GL.semafor(k, per100(k)) ? h('span.etq.' + ({ verd: 'ok', groc: 'just', vermell: 'baix' }[GL.semafor(k, per100(k))]), t({ verd: 'Baix', groc: 'Mitjà', vermell: 'Alt' }[GL.semafor(k, per100(k))])) : ''));
      cosPest.append(
        h('div.seccio', t('Al·lèrgens (calculats dels ingredients)')),
        a.conte.length ? h('div.xips', a.conte.map((k) => h('span.xip.on', GL.ALG[k].ic, ' ', t(GL.ALG[k].nom)))) : h('p.verd', '✓ ', t('Sense al·lèrgens declarats als ingredients')),
        h('div.seccio', t('Pot contenir traces de')),
        h('p.suau.petit', t('Marca els al·lèrgens per contaminació creuada a la cuina (fregidora compartida, superfícies…).')),
        UI.xipsAllergens([], R.traces || [], (c) => { R.traces = c; }, false),
        h('div.seccio', t('Valor nutricional')),
        n.falten.length ? h('p.taronja.petit', '⚠ ', t('Sense dades de'), ': ', n.falten.join(', '), ' — ', t('posa\'ls el pes per unitat o els valors a l\'ingredient.')) : null,
        h('div.taula-w', { style: { maxWidth: '620px' } }, h('table.t.t-compacta',
          h('thead', h('tr', h('th'), h('th.r', t('Per ració')), h('th.r', t('Per 100 g')), h('th', t('Semàfor')))),
          h('tbody', fila('kcal', 'Energia', 'kcal'), fila('prot', 'Proteïnes', 'g'), fila('carbo', 'Hidrats de carboni', 'g'),
            fila('sucres', '  dels quals sucres', 'g'), fila('greix', 'Greixos', 'g'), fila('sat', '  dels quals saturats', 'g'),
            fila('fibra', 'Fibra', 'g'), fila('sal', 'Sal', 'g')))),
        h('p.suau.petit', t('Pes aproximat per ració') + ': ' + UI.fN(n.grams / rac, 0) + ' g · ' + t('Valors orientatius (BEDCA/USDA) si l\'ingredient no en té de propis.')));
    }

    // Pestanya 4: producció (escalat)
    function produccio() {
      let n = R.tipus === 'elab' ? GL.num(R.rendQ, 1) : Math.max(10, R.racions);
      const res = h('div');
      const pinta2 = () => {
        UI.buida(res);
        const C = ctx(), Rx = { ...R, id: R.id || '__nou' };
        const rac = R.tipus === 'elab' ? (n / (GL.num(R.rendQ, 1) || 1)) * R.racions : n;
        const f = rac / R.racions;
        res.appendChild(UI.taula({ cols: [
          { k: 'nom', t: 'Ingredient', cls: 'nom' }, { k: 'q', t: 'Quantitat', cls: 'r num', r: (x) => qty(x.q, x.u) },
          { k: 'estoc', t: 'Estoc', cls: 'r num', r: (x) => x.estoc == null ? '' : h('span', { class: x.estoc < x.q ? 'vermell' : 'suau' }, qty(x.estoc, x.u)) }],
        files: R.linies.map((l, k) => { const i = infoLinia(l, C) || {}; const ing = l.t === 'i' ? C.ing.get(l.id) : null;
          return { id: k, nom: (l.t === 'r' ? '🧪 ' : '') + (i.nom || '?'), q: GL.num(l.q) * f, u: l.u || i.u, estoc: ing ? GL.conv(GL.num(ing.estoc), ing.unitat, l.u || ing.unitat) : null }; }) }));
        res.appendChild(h('p.suau', t('Cost') + ': ' + eur(GL.costRecepta(Rx, C) * f)));
      };
      const inN = inpNum(n, (v) => { n = v; pinta2(); });
      cosPest.append(h('div.fila', { style: { maxWidth: '420px' } }, camp(R.tipus === 'elab' ? t('Quantitat a fer') + ` (${R.rendU || 'kg'})` : t('Racions a fer'), inN)), res,
        btn('Afegir a la planificació de producció', () => { if (!R.id) return UI.toast('Desa la recepta primer', { tipus: 'av' }); V.produccio.afegeix(R.id, R.tipus === 'elab' ? (n / (GL.num(R.rendQ, 1) || 1)) * R.racions : n); }, '', 'produccio'));
      pinta2();
    }

    function desa(enTancar = false) {
      if (!R.nom.trim()) { UI.toast('Posa-li un nom', { tipus: 'av' }); return false; }
      R.linies = R.linies.filter((l) => l.id != null && GL.num(l.q) > 0);
      if (R.mides) R.mides = R.mides.filter((m) => (m.nom || '').trim());
      const nou = !R.id;
      R.revisat = GL.avui();
      if (nou) R.id = GL.uid('r');
      Store.canvi(nou ? 'Recepta creada' : 'Recepta desada', (D2) => {
        const k = D2.receptes.findIndex((x) => x.id === R.id);
        const neta = JSON.parse(JSON.stringify(R));
        if (k >= 0) D2.receptes[k] = neta; else D2.receptes.push(neta);
      });
      if (!enTancar) { P.tanca(true); App.refresca(); }
      else setTimeout(() => App.refresca(), 0);
      return true;
    }
    P.peu.append(
      R.id ? btn('Eliminar', async () => {
        const usos = Store.D.receptes.filter((x) => x.linies.some((l) => l.t === 'r' && l.id === R.id));
        if (!(await UI.confirma(usos.length ? t('Aquesta elaboració es fa servir a {n} receptes. Eliminar-la igualment?', { n: usos.length }) : t('Eliminar «{n}»?', { n: R.nom }), 'Eliminar', true))) return;
        Store.canvi('Recepta eliminada', (D2) => { D2.receptes = D2.receptes.filter((x) => x.id !== R.id); for (const x of D2.receptes) x.linies = x.linies.filter((l) => !(l.t === 'r' && l.id === R.id)); });
        P.tanca(true); App.refresca();
      }, 'perill', 'paperera') : null,
      R.id ? btn('Duplicar', () => { const c = JSON.parse(JSON.stringify(R)); c.id = null; c.nom += ' (' + t('còpia') + ')'; P.tanca(true); obreEditor(c); }, '', 'copia') : null,
      btn('Fitxa tècnica', () => fitxaTecnica(R), '', 'imprimeix'),
      h('div.esp'), h('span.suau.petit', t('Es desa en tancar')),
      btn('Desar', () => desa(), 'pri', 'check'));
    pinta();
  }
  V.receptes.obre = (r) => obreEditor(JSON.parse(JSON.stringify(r)));

  // ── Fitxa tècnica (paper) ───────────────────────────────────────────────
  async function fitxaTecnica(R) {
    const ambCost = await UI.modal('Fitxa tècnica', h('p', t('Vols que la fitxa porti els costos i el preu?')),
      [{ t: 'Cancel·lar', v: null }, { t: 'Per a la cuina (sense preus)', v: 'no' }, { t: 'Amb costos', v: 'si', pri: true }]);
    if (!ambCost) return;
    const D = Store.D, C = GL.context({ ...D, receptes: D.receptes.filter((x) => x.id !== R.id).concat([{ ...R, id: R.id || '__nou' }]) });
    const Rx = C.rec.get(R.id || '__nou');
    const e = GL.economia(Rx, C, D.ajustos.iva), a = GL.allergens(Rx, C), n = GL.nutricio(Rx, C, NUTRI.busca);
    const rac = GL.racions(R);
    const nom = (l) => l.t === 'r' ? (C.rec.get(l.id)?.nom || '?') + ' *' : C.ing.get(l.id)?.nom || '?';
    const p = h('div.paper', { style: { padding: '0' } },
      h('div', { style: { display: 'flex', justifyContent: 'space-between', borderBottom: '3px solid #F2650F', paddingBottom: '8px', marginBottom: '10px' } },
        h('div', h('div', { style: { fontSize: '11px', color: '#777' } }, (D.ajustos.local || '') + ' · ' + t('Fitxa tècnica')), h('h1', { style: { fontSize: '26px', fontFamily: 'Montserrat, Segoe UI' } }, R.nom)),
        h('div', { style: { textAlign: 'right', fontSize: '12px' } }, h('div', t(R.cat || '')), h('div', t('{n} racions', { n: rac })), R.partida ? h('div', R.partida) : null, R.temps ? h('div', `${R.temps} min`) : null, h('div', t('Revisió') + ': ' + UI.data(R.revisat || GL.avui())))),
      h('div', { style: { display: 'flex', gap: '16px' } },
        h('div', { style: { flex: 1 } },
          h('h3', t('Ingredients')),
          h('table', h('thead', h('tr', h('th', t('Ingredient')), h('th', t('Quantitat')), ambCost === 'si' ? h('th', t('Cost')) : null)),
            h('tbody', R.linies.map((l) => h('tr', h('td', nom(l)), h('td', { style: { textAlign: 'right' } }, qty(GL.num(l.q), l.u || '')), ambCost === 'si' ? h('td', { style: { textAlign: 'right' } }, eur(GL.costLinia(l, C))) : null)))),
          R.linies.some((l) => l.t === 'r') ? h('div', { style: { fontSize: '10px', color: '#777' } }, '* ' + t('elaboració pròpia (té la seva fitxa)')) : null),
        R.foto ? h('img', { src: R.foto, style: { width: '38%', objectFit: 'cover', borderRadius: '6px', maxHeight: '220px' } }) : null),
      R.passos ? h('div', h('h3', { style: { marginTop: '12px' } }, t('Elaboració')), h('ol', { style: { fontSize: '12px', paddingLeft: '18px' } }, R.passos.split('\n').filter((x) => x.trim()).map((x) => h('li', { style: { marginBottom: '3px' } }, x.replace(/^\s*\d+[.)-]\s*/, ''))))) : null,
      R.notes ? h('div', h('h3', t('Notes')), h('p', { style: { fontSize: '12px' } }, R.notes)) : null,
      h('h3', { style: { marginTop: '12px' } }, t('Al·lèrgens')),
      h('p', { style: { fontSize: '13px' } }, a.conte.length ? a.conte.map((k) => GL.ALG[k].ic + ' ' + t(GL.ALG[k].nom)).join('   ') : t('Cap'),
        a.traces.length ? h('span', { style: { color: '#777' } }, '   ·   ' + t('Pot contenir traces de') + ': ' + a.traces.map((k) => t(GL.ALG[k].nom)).join(', ')) : null),
      h('div', { style: { display: 'flex', gap: '20px', fontSize: '12px', marginTop: '8px' } },
        h('div', h('b', t('Per ració') + ': '), `${UI.fN(n.tot.kcal / rac, 0)} kcal · ${t('Proteïnes')} ${UI.fN(n.tot.prot / rac, 1)} g · ${t('Greixos')} ${UI.fN(n.tot.greix / rac, 1)} g · ${t('Hidrats de carboni')} ${UI.fN(n.tot.carbo / rac, 1)} g · ${t('Sal')} ${UI.fN(n.tot.sal / rac, 1)} g`)),
      ambCost === 'si' && R.tipus !== 'elab' ? h('div', { style: { marginTop: '12px', padding: '8px 10px', background: '#f6f1e8', borderRadius: '6px', fontSize: '13px', display: 'flex', gap: '24px' } },
        h('span', t('Cost/ració') + ': ', h('b', eur(e.cost))), h('span', 'PVP: ', h('b', eur(e.pvp))), h('span', t('Food cost') + ': ', h('b', pct(e.fc))), h('span', t('Marge') + ': ', h('b', eur(e.marge)))) : null,
      ambCost === 'si' && GL.orientatius(Rx, C).length ? h('div', { style: { marginTop: '6px', fontSize: '11px', color: '#b06000' } }, '≈ ' + t('Cost calculat amb preus orientatius de') + ': ' + GL.orientatius(Rx, C).map((i) => i.nom).join(', ')) : null,
      ambCost === 'si' && (R.mides || []).length ? h('div', { style: { marginTop: '6px', fontSize: '12px' } }, GL.economiaMides(Rx, C, D.ajustos.iva).map((m) => `${m.nom}: ${eur(m.pvp)} · ${t('cost')} ${eur(m.cost)} · ${pct(m.fc)}`).join('   ·   ')) : null);
    UI.imprimeix(p, R.nom);
  }
})(window);

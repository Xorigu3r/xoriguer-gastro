/* Producció: què cal fer avui/aquesta setmana → ingredients necessaris contra l'estoc. */
'use strict';
(function (g) {
  const V = (g.V = g.V || {});
  const { h, ic, btn, btnIc, eur, qty, t, inpNum } = UI;

  V.produccio = {
    titol: 'Producció', ic: 'produccio',
    afegeix(id, n) {
      Store.canvi('Afegit a la producció', (D) => {
        D.produccio = D.produccio || [];
        const x = D.produccio.find((p) => p.rec === id);
        if (x) x.n = GL.num(x.n) + n; else D.produccio.push({ rec: id, n });
      });
    },
    render(el) {
      const D = Store.D;
      D.produccio = D.produccio || [];
      const C = GL.context(D);
      const llista = h('div'), resultat = h('div');
      const pinta = () => {
        UI.buida(llista); UI.buida(resultat);
        const plan = D.produccio.filter((p) => C.rec.get(p.rec));
        const cmb = UI.combo({ items: () => D.receptes.map((r) => ({ id: r.id, nom: r.nom, ic: r.tipus === 'elab' ? '🧪' : '🍽', sub: r.tipus === 'elab' ? (r.rendU || 'kg') : t('racions') })),
          placeholder: '+ ' + t('Afegeix un plat o una elaboració a produir'),
          onTria: (x) => { const r = C.rec.get(x.id); Store.canvi('', (D2) => { (D2.produccio = D2.produccio || []).push({ rec: x.id, n: r.tipus === 'elab' ? GL.racions(r) : 10 }); }, { silenci: true }); App.refresca(); } });
        llista.appendChild(h('div.targeta', h('h3', ic('llista'), t('Què cal fer')),
          plan.length ? h('table.t.t-compacta', h('tbody', plan.map((p, k) => {
            const r = C.rec.get(p.rec);
            const n = inpNum(p.n, (v) => { Store.D.produccio[k].n = v; Store.desa(); calcula(); });
            n.style.width = '90px';
            const tandes = r.tipus === 'elab' ? h('span.suau.petit', ' = ' + qty((GL.num(p.n) / GL.racions(r)) * GL.num(r.rendQ, 1), r.rendU || 'kg')) : null;
            return h('tr', h('td.nom', (r.tipus === 'elab' ? '🧪 ' : '') + r.nom), h('td', { style: { width: '120px' } }, n), h('td.suau.petit', t(r.tipus === 'elab' ? 'racions de recepta' : 'racions'), tandes),
              h('td', btnIc('x', () => { Store.canvi('', (D2) => { D2.produccio.splice(k, 1); }, { silenci: true }); App.refresca(); }, 'Treure')));
          }))) : h('p.suau', t('Afegeix els plats o elaboracions que vols preparar i les racions. Et diré tot el que necessites.')),
          h('div', { style: { marginTop: '10px' } }, cmb),
          plan.length ? h('div', { style: { marginTop: '10px', display: 'flex', gap: '8px' } }, btn('Buidar', () => { Store.canvi('Producció buidada', (D2) => { D2.produccio = []; }); App.refresca(); }, 'mini'),
            btn('Omplir amb les vendes d\'una setmana', () => {
              const v = GL.vendesPeriode(D, GL.sumaDies(GL.avui(), -7), GL.sumaDies(GL.avui(), -1));
              Store.canvi('Producció d\'una setmana', (D2) => { D2.produccio = Object.entries(v).filter(([id, q]) => q > 0 && C.rec.get(id)?.tipus !== 'article').map(([rec, n]) => ({ rec, n })); });
              App.refresca();
            }, 'mini')) : btn('Omplir amb les vendes d\'una setmana', () => {
            const v = GL.vendesPeriode(D, GL.sumaDies(GL.avui(), -7), GL.sumaDies(GL.avui(), -1));
            Store.canvi('Producció d\'una setmana', (D2) => { D2.produccio = Object.entries(v).filter(([id, q]) => q > 0 && C.rec.get(id)?.tipus !== 'article').map(([rec, n]) => ({ rec, n })); });
            App.refresca();
          }, 'mini')));
        calcula();
      };
      function calcula() {
        UI.buida(resultat);
        const C2 = GL.context(Store.D);
        const acc = new Map();
        for (const p of Store.D.produccio || []) { const r = C2.rec.get(p.rec); if (r) GL.explota(r, GL.num(p.n), C2, acc); }
        if (!acc.size) return;
        const files = [...acc.entries()].map(([id, q]) => { const i = C2.ing.get(id); const falta = Math.max(0, q - Math.max(0, GL.num(i.estoc)));
          return { id, nom: i.nom, q, u: i.unitat, estoc: GL.num(i.estoc), falta, cost: q * GL.preuReal(i), prov: C2.prov.get(i.prov)?.nom || '—' }; });
        const cost = files.reduce((s, f) => s + f.cost, 0);
        const falten = files.filter((f) => f.falta > 0);
        resultat.appendChild(h('div.targeta', h('h3', ic('ingredient'), t('Ingredients necessaris'), h('span.suau.petit', { style: { marginLeft: 'auto' } }, t('Cost') + ': ' + eur(cost))),
          UI.taula({ cls: 't-compacta', cols: [
            { k: 'nom', t: 'Ingredient', cls: 'nom' }, { k: 'prov', t: 'Proveïdor', r: (f) => h('span.suau', f.prov) },
            { k: 'q', t: 'Cal', cls: 'r num', r: (f) => qty(f.q, f.u) }, { k: 'estoc', t: 'Tens', cls: 'r num', r: (f) => h('span.suau', qty(f.estoc, f.u)) },
            { k: 'falta', t: 'Falta', cls: 'r num', r: (f) => f.falta > 0 ? h('b.vermell', qty(f.falta, f.u)) : h('span.verd', '✓'), desc: true }],
          files, ordre: ['falta', -1] }),
          h('div', { style: { marginTop: '10px', display: 'flex', gap: '8px' } },
            btn('Imprimir full de producció', () => imprimeix(files), '', 'imprimeix'),
            falten.length ? btn(t('Afegir el que falta a la comanda ({n})', { n: falten.length }), () => { V.comandes.afegeix(falten.map((f) => ({ ing: f.id, q: Math.ceil(f.falta * 100) / 100 }))); }, 'pri', 'comanda') : null)));
      }
      function imprimeix(files) {
        const C2 = GL.context(Store.D);
        // Mise en place per partida: cada recepta amb les quantitats ja escalades
        const plan = (Store.D.produccio || []).map((p) => ({ p, r: C2.rec.get(p.rec) })).filter((x) => x.r);
        const parts = [...new Set(plan.map((x) => x.r.partida || ''))].sort((a, b) => (a === '') - (b === '') || a.localeCompare(b));
        const qtyB = (q, u) => (u === 'g' || u === 'ml') && q >= 1000 ? qty(q / 1000, u === 'g' ? 'kg' : 'l') : qty(q, u);
        const nomL = (l) => l.t === 'r' ? '🧪 ' + (C2.rec.get(l.id)?.nom || '?') : C2.ing.get(l.id)?.nom || '?';
        const blocPartida = (pt) => h('div', { style: { breakInside: 'avoid', marginTop: '12px' } },
          h('h3', { style: { borderBottom: '2px solid #F2650F', paddingBottom: '2px' } }, pt || t('Sense partida')),
          plan.filter((x) => (x.r.partida || '') === pt).map(({ p, r }) => {
            const f = GL.num(p.n) / GL.racions(r);
            return h('div', { style: { margin: '6px 0 10px', breakInside: 'avoid' } },
              h('div', { style: { fontWeight: 700 } }, '☐ ' + r.nom + ' — ' + (r.tipus === 'elab' ? qty(f * GL.num(r.rendQ, 1), r.rendU || 'kg') : qty(GL.num(p.n)) + ' ' + t('racions'))),
              h('table', { style: { fontSize: '11px' } }, h('tbody', (r.linies || []).map((l) => h('tr', h('td', { style: { paddingLeft: '18px' } }, nomL(l)), h('td', { style: { textAlign: 'right', width: '90px' } }, qtyB(GL.num(l.q) * f, l.u || (l.t === 'r' ? C2.rec.get(l.id)?.rendU : C2.ing.get(l.id)?.unitat) || '')))))));
          }));
        UI.imprimeix(h('div.paper', h('h1', t('Full de producció') + ' · ' + UI.data(GL.avui())),
          ...parts.map(blocPartida),
          h('h3', { style: { marginTop: '14px', breakBefore: 'auto' } }, t('Total d\'ingredients')),
          h('table', h('thead', h('tr', h('th', t('Ingredient')), h('th', t('Quantitat')), h('th', t('Falta')))),
            h('tbody', files.map((f) => h('tr', h('td', f.nom), h('td', { style: { textAlign: 'right' } }, qty(f.q, f.u)), h('td', { style: { textAlign: 'right' } }, f.falta > 0 ? qty(f.falta, f.u) : '')))))), t('Producció'));
      }
      el.append(h('p.suau', { style: { marginTop: 0 } }, t('Planifica la feina de cuina: tria què vols preparar i quantes racions. Les elaboracions de dins es desglossen soles.')),
        h('div.graella', { style: { gridTemplateColumns: '1fr 1.2fr', alignItems: 'start' } }, llista, resultat));
      pinta();
    },
  };
})(window);

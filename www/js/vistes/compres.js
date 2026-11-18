/* Compres i albarans: entren estoc, actualitzen preus i fan el llibre de compres (IVA suportat). */
'use strict';
(function (g) {
  const V = (g.V = g.V || {});
  const { h, ic, btn, btnIc, eur, t, camp, inp, inpNum, sel } = UI;
  let mes = GL.avui().slice(0, 7);

  V.compres = {
    titol: 'Compres', ic: 'compra', nouTxt: 'Nova compra',
    nou(base = {}) { obre({ id: null, data: GL.avui(), prov: '', num: '', linies: [], ivaPct: 10, ...base }); },
    render(el, arg) {
      const D = Store.D, C = GL.context(D);
      const mesos = [...new Set([GL.avui().slice(0, 7), ...D.compres.map((c) => c.data.slice(0, 7))])].sort().reverse();
      const files = () => D.compres.filter((c) => !mes || c.data.startsWith(mes)).map((c) => ({ ...c, ...GL.totalsCompra(c), provNom: C.prov.get(c.prov)?.nom || '—' }));
      const resum = h('div.graella.g3', { style: { marginBottom: '14px' } });
      const pintaResum = (fs) => {
        UI.buida(resum);
        const tot = fs.reduce((a, c) => ({ base: a.base + c.base, iva: a.iva + c.iva, total: a.total + c.total }), { base: 0, iva: 0, total: 0 });
        const perProv = {};
        fs.forEach((c) => { perProv[c.provNom] = (perProv[c.provNom] || 0) + c.base; });
        const top = Object.entries(perProv).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([n, v]) => `${n} ${eur(v, 0)}`).join(' · ');
        resum.append(h('div.targeta.kpi', { style: { '--c': 'var(--taronja)' } }, h('div.et', t('Compres (base)')), h('div.val.num', eur(tot.base)), h('div.sub', top)),
          h('div.targeta.kpi', { style: { '--c': 'var(--blau)' } }, h('div.et', t('IVA suportat')), h('div.val.num', eur(tot.iva)), h('div.sub', t('Deduïble'))),
          h('div.targeta.kpi', { style: { '--c': 'var(--verd)' } }, h('div.et', t('Total amb IVA')), h('div.val.num', eur(tot.total)), h('div.sub', t('{n} documents', { n: fs.length }))));
      };
      const T = UI.taula({ cols: [
        { k: 'data', t: 'Data', r: (c) => UI.data(c.data) },
        { k: 'provNom', t: 'Proveïdor', cls: 'nom' }, { k: 'num', t: 'Núm. albarà / factura', r: (c) => h('span.suau', c.num || '') },
        { k: 'lin', t: 'Línies', cls: 'r num', r: (c) => c.linies.length ? String(c.linies.length) : h('span.suau', t('import')), v: (c) => c.linies.length },
        { k: 'base', t: 'Base', cls: 'r num', r: (c) => eur(c.base) }, { k: 'iva', t: 'IVA', cls: 'r num', r: (c) => eur(c.iva) },
        { k: 'total', t: 'Total', cls: 'r num', r: (c) => h('b', eur(c.total)) }],
      files: files(), ordre: ['data', -1], onclic: (c) => App.ves('compres', c.id),
      buit: h('div.buit', ic('compra'), h('h3', t('Cap compra aquest mes')), h('p', t('Entra els albarans: l\'estoc puja sol i els preus dels ingredients s\'actualitzen.')), btn('Nova compra', () => V.compres.nou(), 'pri', 'mes')) });
      const refresca = () => { const f = files(); T.refresca(f); pintaResum(f); };
      el.append(h('div.cap', sel([['', 'Tots els mesos'], ...mesos.map((m) => [m, m])], mes, (v) => { mes = v; refresca(); }, { style: { width: '170px' } }),
        h('div.esp'), btn('Exportar el llibre de compres (CSV)', exporta, '', 'baixa')), resum, T);
      refresca();
      if (arg) { const c = D.compres.find((x) => x.id === arg); if (c) obre(JSON.parse(JSON.stringify(c))); }
    },
  };

  function obre(Cm) {
    const D = Store.D, C = GL.context(D);
    const abans = Cm.id ? JSON.parse(JSON.stringify(Cm)) : null;
    const P = UI.panell(Cm.id ? t('Compra') + ' · ' + UI.data(Cm.data) : t('Nova compra'), { ample: true, onTanca: () => { if (location.hash.startsWith('#/compres/')) history.replaceState(null, '', '#/compres'); } });
    let senseLinies = Cm.id && !Cm.linies.length;
    const totals = h('div');
    const taula = h('div');
    const pintaTotals = () => {
      const x = GL.totalsCompra(senseLinies ? { ...Cm, linies: [] } : Cm);
      UI.buida(totals).appendChild(h('div', { style: { display: 'flex', gap: '24px', justifyContent: 'flex-end', marginTop: '10px', fontSize: '15px' } },
        h('span', t('Base') + ': ', h('b.num', eur(x.base))), h('span', t('IVA') + ': ', h('b.num', eur(x.iva))), h('span', t('Total') + ': ', h('b.num.taronja', eur(x.total)))));
    };
    const pintaLinies = () => {
      UI.buida(taula);
      if (senseLinies) {
        taula.append(h('p.suau.petit', t('Només l\'import (factures de llum, lloguer, serveis…). No mou estoc.')),
          h('div.fila.f3', camp('Concepte', inp(Cm.nota || '', (v) => { Cm.nota = v; })), camp('Base imposable', UI.ambU(inpNum(Cm.base || '', (v) => { Cm.base = v; pintaTotals(); }), '€')),
            camp('IVA', sel([[0, '0 %'], [4, '4 %'], [10, '10 %'], [21, '21 %']], Cm.ivaPct ?? 10, (v) => { Cm.ivaPct = +v; pintaTotals(); }))));
        pintaTotals(); return;
      }
      const tb = h('tbody');
      Cm.linies.forEach((l, n) => {
        const ing = C.ing.get(l.ing);
        const preuAnt = ing ? GL.num(ing.preu) : 0;
        const var_ = h('span.petit');
        const actVar = () => { const p = GL.num(l.preu); var_.textContent = preuAnt > 0 && p > 0 && Math.abs(p - preuAnt) > 1e-6 ? ` ${p > preuAnt ? '▲' : '▼'}${Math.abs(((p - preuAnt) / preuAnt) * 100).toFixed(1)}%` : ''; var_.className = 'petit ' + (p > preuAnt ? 'vermell' : 'verd'); };
        const imp = h('td.r.num', eur(GL.num(l.q) * GL.num(l.preu)));
        const upd = () => { imp.textContent = eur(GL.num(l.q) * GL.num(l.preu)); actVar(); pintaTotals(); };
        const cmb = UI.combo({ items: () => Store.D.ingredients.map((i) => ({ id: i.id, nom: i.nom, sub: eur(i.preu) + '/' + i.unitat })), valor: ing?.nom || '',
          onTria: (x) => { l.ing = x.id; const i2 = Store.D.ingredients.find((i) => i.id === x.id); if (!GL.num(l.preu)) l.preu = i2.preu; pintaLinies(); } });
        const q = inpNum(l.q, (v) => { l.q = v; upd(); }); q.style.width = '90px';
        const pr = inpNum(l.preu, (v) => { l.preu = v; upd(); }); pr.style.width = '100px';
        actVar();
        tb.appendChild(h('tr', h('td', cmb), h('td', q), h('td.suau', ing?.unitat || ''), h('td', pr, var_), imp, h('td', btnIc('x', () => { Cm.linies.splice(n, 1); pintaLinies(); }, 'Treure'))));
      });
      const nova = UI.combo({ items: () => Store.D.ingredients.filter((i) => !Cm.prov || !i.prov || i.prov === Cm.prov).map((i) => ({ id: i.id, nom: i.nom, sub: eur(i.preu) + '/' + i.unitat })),
        placeholder: '+ ' + t('Afegeix un producte'), onTria: (x) => { const i = Store.D.ingredients.find((y) => y.id === x.id); Cm.linies.push({ ing: x.id, q: 1, preu: i.preu }); pintaLinies();
          setTimeout(() => taula.querySelectorAll('tbody tr')[Cm.linies.length - 1]?.querySelectorAll('input')[1]?.focus(), 20); } });
      tb.appendChild(h('tr', h('td', { colspan: 6 }, nova)));
      taula.append(h('div.taula-w', { style: { overflow: 'visible' } }, h('table.t.linies', h('thead', h('tr', h('th', t('Producte')), h('th.r', t('Quantitat')), h('th', t('Unitat')), h('th.r', t('Preu unitari')), h('th.r', t('Import')), h('th'))), tb)),
        h('div.fila', { style: { maxWidth: '260px', marginTop: '10px' } }, camp('IVA dels productes', sel([[4, '4 %'], [10, '10 %'], [21, '21 %']], Cm.ivaPct ?? 10, (v) => { Cm.ivaPct = +v; pintaTotals(); }))));
      pintaTotals();
    };
    const provSel = sel([['', '—'], ...D.proveidors.map((p) => [p.id, p.nom])], Cm.prov, (v) => { Cm.prov = v; });
    const data = h('input', { type: 'date', value: Cm.data, onchange: (e) => { Cm.data = e.target.value; } });
    const tipus = UI.grupBtn([['l', 'Amb productes'], ['i', 'Només import']], senseLinies ? 'i' : 'l', (v) => { senseLinies = v === 'i'; pintaLinies(); });
    P.cos.append(h('div.fila.f4', camp('Data', data), camp('Proveïdor', provSel), camp('Número', inp(Cm.num || '', (v) => { Cm.num = v; })), camp('Tipus', tipus)), taula, totals);
    pintaLinies();
    P.peu.append(Cm.id ? btn('Eliminar', async () => {
      if (!(await UI.confirma('Eliminar aquesta compra? L\'estoc que va entrar es descomptarà.', 'Eliminar', true))) return;
      Store.canvi('Compra eliminada', (D2) => { GL.aplicaCompra(D2, { linies: [] }, abans); D2.compres = D2.compres.filter((x) => x.id !== Cm.id); });
      P.tanca(); App.refresca();
    }, 'perill', 'paperera') : null, h('div.esp'),
    btn('Desar', () => {
      if (senseLinies) Cm.linies = []; else Cm.linies = Cm.linies.filter((l) => l.ing && GL.num(l.q) > 0);
      if (!senseLinies && !Cm.linies.length) return UI.toast('Afegeix algun producte', { tipus: 'av' });
      const nou = !Cm.id; if (nou) Cm.id = GL.uid('c');
      const x = GL.totalsCompra(Cm); Cm.base = senseLinies ? GL.num(Cm.base) : x.base;
      let canvis = [];
      Store.canvi(nou ? 'Compra registrada' : 'Compra desada', (D2) => {
        canvis = GL.aplicaCompra(D2, Cm, abans);
        const k = D2.compres.findIndex((y) => y.id === Cm.id);
        if (k >= 0) D2.compres[k] = JSON.parse(JSON.stringify(Cm)); else D2.compres.push(JSON.parse(JSON.stringify(Cm)));
      });
      if (canvis.length) setTimeout(() => UI.toast(t('Preus actualitzats') + ': ' + canvis.map((c) => `${c.nom} ${c.pct > 0 ? '+' : ''}${c.pct.toFixed(1)}%`).join(', '), { tipus: canvis.some((c) => c.pct > 0) ? 'av' : '', ms: 8000 }), 300);
      P.tanca(); App.refresca();
    }, 'pri', 'check'));
  }

  function exporta() {
    const D = Store.D, C = GL.context(D);
    const cs = D.compres.filter((c) => !mes || c.data.startsWith(mes)).sort((a, b) => a.data.localeCompare(b.data));
    const f = (x) => x.toFixed(2).replace('.', ',');
    const linies = [['Data', 'Proveïdor', 'NIF', 'Número', 'Concepte', 'Base', '% IVA', 'IVA', 'Total'].map((x) => t(x)).join(';'),
      ...cs.map((c) => { const x = GL.totalsCompra(c), p = C.prov.get(c.prov); return [c.data, p?.nom || '', p?.nif || '', c.num || '', (c.nota || '').replace(/;/g, ','), f(x.base), c.ivaPct ?? 10, f(x.iva), f(x.total)].join(';'); })];
    Store.desaFitxer(`llibre_compres_${mes || 'tot'}.csv`, '﻿' + linies.join('\r\n'), 'CSV').then((r) => r && UI.toast('Exportat'));
  }
})(window);

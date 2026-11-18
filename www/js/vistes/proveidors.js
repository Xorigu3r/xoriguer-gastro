/* Proveïdors. */
'use strict';
(function (g) {
  const V = (g.V = g.V || {});
  const { h, ic, btn, eur, qty, t, camp, inp, inpNum } = UI;
  let q = '';
  V.proveidors = {
    titol: 'Proveïdors', ic: 'proveidor', nouTxt: 'Nou proveïdor',
    nou() { obre({ id: null, nom: '' }); },
    render(el, arg) {
      const D = Store.D, desde = GL.sumaDies(GL.avui(), -30);
      const files = () => D.proveidors.filter((p) => !q || GL.norm(p.nom + ' ' + (p.contacte || '')).includes(GL.norm(q))).map((p) => ({
        ...p, nIng: D.ingredients.filter((i) => i.prov === p.id).length,
        compres: D.compres.filter((c) => c.prov === p.id && c.data >= desde).reduce((s, c) => s + GL.totalsCompra(c).total, 0),
        demanar: D.ingredients.filter((i) => i.prov === p.id && ['baix', 'esgotat'].includes(GL.estatEstoc(i))).length }));
      const T = UI.taula({ cols: [
        { k: 'nom', t: 'Proveïdor', cls: 'nom', r: (p) => h('span', p.nom, p.contacte ? h('span.sub', p.contacte) : null) },
        { k: 'tel', t: 'Telèfon', r: (p) => p.tel ? h('a', { href: 'tel:' + p.tel }, p.tel) : '' },
        { k: 'email', t: 'Correu', r: (p) => p.email ? h('a', { href: 'mailto:' + p.email }, p.email) : '' },
        { k: 'dies', t: 'Dies de repartiment', r: (p) => h('span.suau', p.dies || '') },
        { k: 'nIng', t: 'Productes', cls: 'r num' },
        { k: 'compres', t: 'Compres 30 dies', cls: 'r num', r: (p) => p.compres ? eur(p.compres) : h('span.suau', '—'), desc: true },
        { k: 'demanar', t: 'A demanar', cls: 'r', r: (p) => p.demanar ? h('span.etq.just', String(p.demanar)) : '' }],
      files: files(), ordre: ['nom', 1], onclic: (p) => App.ves('proveidors', p.id),
      buit: h('div.buit', ic('proveidor'), h('h3', t('Cap proveïdor')), h('p', t('Afegeix-los per agrupar les comandes i comparar què et costa cadascun.')), btn('Nou proveïdor', () => V.proveidors.nou(), 'pri', 'mes')) });
      el.append(h('div.cap', UI.cercador('Cerca proveïdors…', (v) => { q = v; T.refresca(files()); }, q)), T);
      if (arg) { const p = D.proveidors.find((x) => x.id === arg); if (p) obre({ ...p }); }
    },
  };
  function obre(P0) {
    const D = Store.D;
    const P = UI.panell(P0.nom || t('Nou proveïdor'), { onTanca: () => { if (location.hash.startsWith('#/proveidors/')) history.replaceState(null, '', '#/proveidors'); } });
    const c = (k, et, tipus = 'text') => camp(et, inp(P0[k] || '', (v) => { P0[k] = v; if (k === 'nom') P.titol.textContent = v; }, { type: tipus }));
    P.cos.append(h('div.fila.f2', c('nom', 'Nom'), c('contacte', 'Persona de contacte')),
      h('div.fila.f3', c('tel', 'Telèfon', 'tel'), c('email', 'Correu', 'email'), c('dies', 'Dies de repartiment')),
      h('div.fila.f3', camp('Comanda mínima (€)', inpNum(P0.minimComanda || '', (v) => { P0.minimComanda = v; })), c('nif', 'NIF'), c('web', 'Web / botiga en línia')),
      camp('Notes', h('textarea', { rows: 3, oninput: (e) => { P0.notes = e.target.value; } }, P0.notes || '')));
    if (P0.id) {
      const ings = D.ingredients.filter((i) => i.prov === P0.id);
      P.cos.append(h('div.seccio', t('Productes')), ings.length ? UI.taula({ cls: 't-compacta', cols: [
        { k: 'nom', t: 'Ingredient', cls: 'nom' }, { k: 'preu', t: 'Preu', cls: 'r num', r: (i) => eur(i.preu) + '/' + i.unitat },
        { k: 'estoc', t: 'Estoc', cls: 'r num', r: (i) => qty(GL.num(i.estoc), i.unitat) }], files: ings, ordre: ['nom', 1], onclic: (i) => { P.tanca(); App.ves('ingredients', i.id); } }) : h('p.suau', t('Encara no té productes assignats.')));
      const cs = D.compres.filter((x) => x.prov === P0.id).sort((a, b) => b.data.localeCompare(a.data)).slice(0, 10);
      if (cs.length) P.cos.append(h('div.seccio', t('Últimes compres')), UI.taula({ cls: 't-compacta', cols: [
        { k: 'data', t: 'Data', r: (x) => UI.data(x.data) }, { k: 'num', t: 'Número' }, { k: 'total', t: 'Total', cls: 'r num', r: (x) => eur(GL.totalsCompra(x).total) }],
      files: cs, onclic: (x) => { P.tanca(); App.ves('compres', x.id); } }));
    }
    P.peu.append(P0.id ? btn('Eliminar', async () => {
      if (!(await UI.confirma(t('Eliminar «{n}»? Els ingredients i compres es mantenen sense proveïdor.', { n: P0.nom }), 'Eliminar', true))) return;
      Store.canvi('Proveïdor eliminat', (D2) => { D2.proveidors = D2.proveidors.filter((x) => x.id !== P0.id); for (const i of D2.ingredients) if (i.prov === P0.id) i.prov = ''; });
      P.tanca(); App.refresca();
    }, 'perill', 'paperera') : null, P0.id ? btn('Fer comanda', () => { P.tanca(); App.ves('comandes'); }, '', 'comanda') : null, h('div.esp'),
    btn('Desar', () => {
      if (!(P0.nom || '').trim()) return UI.toast('Posa-li un nom', { tipus: 'av' });
      const nou = !P0.id; if (nou) P0.id = GL.uid('p');
      Store.canvi(nou ? 'Proveïdor creat' : 'Proveïdor desat', (D2) => { const k = D2.proveidors.findIndex((x) => x.id === P0.id); if (k >= 0) D2.proveidors[k] = { ...P0 }; else D2.proveidors.push({ ...P0 }); });
      P.tanca(); App.refresca();
    }, 'pri', 'check'));
  }
})(window);

/* Tauler: resum del negoci, avisos i accions ràpides. */
'use strict';
(function (g) {
  const V = (g.V = g.V || {});
  const { h, ic, btn, eur, pct, t } = UI;

  function kpi(et, val, sub, c, tend) {
    return h('div.targeta.kpi', { style: { '--c': c } }, h('div.et', t(et)), h('div.val.num', val),
      h('div.sub', tend != null ? h('span.tend.' + (tend >= 0 ? 'puja' : 'baixa'), (tend >= 0 ? '▲ ' : '▼ ') + Math.abs(tend).toFixed(0) + ' %') : null, tend != null ? ' ' : null, sub || ''));
  }

  V.tauler = {
    titol: 'Tauler', ic: 'tauler',
    badge: (D) => { const a = GL.avisos(D).filter((x) => x.niv === 'alt').length; return { n: a, niv: 'alt' }; },
    render(el) {
      const D = Store.D, A = GL.avui();
      const v7 = GL.resumVendes(D, GL.vendesPeriode(D, GL.sumaDies(A, -6), A));
      const v7a = GL.resumVendes(D, GL.vendesPeriode(D, GL.sumaDies(A, -13), GL.sumaDies(A, -7)));
      const tend = v7a.fact > 0 ? ((v7.fact - v7a.fact) / v7a.fact) * 100 : null;
      const C = GL.context(D), iva = D.ajustos.iva;
      const plats = D.receptes.filter((r) => r.tipus !== 'elab' && GL.num(r.pvp) > 0);
      const baixos = plats.filter((r) => GL.economia(r, C, iva).estat === 'baix').length;
      const hora = new Date().getHours();
      const salut = hora < 13 ? 'Bon dia' : hora < 20 ? 'Bona tarda' : 'Bona nit';
      el.appendChild(h('div.cap', h('div', h('h2', t(salut) + (D.ajustos.local ? ', ' + D.ajustos.local : '')),
        h('div.suau', UI.data(A, true))), h('div.esp'),
        btn('Entrar vendes', () => App.ves('vendes', 'entrar'), '', 'vendes'),
        btn('Nova compra', () => V.compres.nou(), '', 'compra'),
        btn('Nova recepta', () => V.receptes.nou(), 'pri', 'mes')));

      el.appendChild(h('div.graella.g4', { style: { marginBottom: '14px' } },
        kpi('Vendes 7 dies', eur(v7.fact, 0), t('vs. 7 dies abans'), 'var(--taronja)', tend),
        kpi('Food cost teòric', pct(v7.fc), t('Cost de matèria primera sobre vendes sense IVA'), v7.fc > 35 ? 'var(--vermell)' : 'var(--verd)'),
        kpi('Marge brut 7 dies', eur(v7.marge, 0), t('{n} plats venuts', { n: UI.fN(v7.uts, 0) }), 'var(--verd)'),
        kpi('Valor de l\'estoc', eur(GL.valorEstoc(D), 0), t('{n} plats per sota de l\'objectiu', { n: baixos }), 'var(--blau)')));

      // Vendes dels últims 30 dies
      const dies = [];
      for (let k = 29; k >= 0; k--) {
        const d = GL.sumaDies(A, -k);
        const r = GL.resumVendes(D, D.vendes[d] || {});
        dies.push({ et: d.slice(8), v: r.fact, c: new Date(d).getDay() % 6 === 0 ? 'var(--taronja-f)' : 'var(--taronja)' });
      }
      const avisos = GL.avisos(D);
      el.appendChild(h('div.graella', { style: { gridTemplateColumns: '1.6fr 1fr', marginBottom: '14px' } },
        h('div.targeta', h('h3', ic('vendes'), t('Vendes dels últims 30 dies')),
          dies.some((d) => d.v > 0) ? UI.barres(dies, { alt: 190, format: (x) => eur(x, 0) })
            : h('div.buit', h('p', t('Encara no hi ha vendes. Entra-les a mà o importa-les del TPV.')), btn('Entrar vendes', () => App.ves('vendes', 'entrar'), 'pri'))),
        h('div.targeta', h('h3', ic('alerta'), t('Avisos')),
          avisos.length ? avisos.map((a) => h('div', { style: { padding: '8px 0', borderBottom: '1px solid rgba(65,80,106,.5)', cursor: 'pointer' }, onclick: () => App.ves(a.anar) },
            h('div', h('span', { class: a.niv === 'alt' ? 'vermell' : a.niv === 'mig' ? 'taronja' : 'suau' }, '● '), h('b', t(a.text)), h('span.suau', ` (${a.items.length})`)),
            h('div.suau.petit', a.items.slice(0, 6).join(' · ') + (a.items.length > 6 ? ' …' : ''))))
            : h('div.buit', { style: { padding: '24px' } }, h('div.verd', '✓ ', t('Tot en ordre')), h('p.petit', t('Cap avís d\'estoc, preus, marges ni temperatures.'))))));

      // Millors i pitjors
      const em = GL.enginyeriaMenu(D, GL.vendesPeriode(D, GL.sumaDies(A, -29), A));
      const top = em.files.slice(0, 6);
      const fcAlt = plats.map((r) => ({ r, e: GL.economia(r, C, iva) })).filter((x) => x.e.net > 0).sort((a, b) => b.e.fc - a.e.fc).slice(0, 6);
      el.appendChild(h('div.graella.g2',
        h('div.targeta', h('h3', ic('estrella'), t('Els que més deixen (30 dies)')),
          top.length ? UI.taula({ cls: 't-compacta', cols: [
            { k: 'nom', t: 'Plat', cls: 'nom' }, { k: 'q', t: 'Unitats', cls: 'r num', r: (f) => UI.fN(f.q, 0) },
            { k: 'cmTot', t: 'Marge total', cls: 'r num', r: (f) => eur(f.cmTot, 0) }], files: top, onclic: (f) => App.ves('receptes', f.id) })
            : h('p.suau', t('Sense vendes.'))),
        h('div.targeta', h('h3', ic('alerta'), t('Food cost més alt')),
          UI.taula({ cls: 't-compacta', cols: [
            { k: 'nom', t: 'Plat', cls: 'nom', r: (x) => x.r.nom, v: (x) => x.r.nom },
            { k: 'fc', t: 'Food cost', cls: 'r num', r: (x) => h('span', { class: x.e.estat === 'baix' ? 'vermell' : x.e.estat === 'just' ? 'taronja' : 'verd' }, pct(x.e.fc)), v: (x) => x.e.fc },
            { k: 'pvp', t: 'PVP', cls: 'r num', r: (x) => eur(x.e.pvp) },
            { k: 'sug', t: 'PVP suggerit', cls: 'r num', r: (x) => x.e.estat === 'ok' ? h('span.suau', '—') : eur(x.e.pvpSuggerit) }],
            files: fcAlt, onclic: (x) => App.ves('receptes', x.r.id) }))));
    },
  };
})(window);

/* Anàlisi: enginyeria de menú, food cost real, preus, simulador i compte de resultats. */
'use strict';
(function (g) {
  const V = (g.V = g.V || {});
  const { h, ic, btn, eur, pct, t, camp, inpNum, sel, s } = UI;
  let pest = 'menu', dies = 30, cat = '';
  const CLASSES = {
    estrella: ['⭐', 'Estrelles', 'var(--verd)', "Es venen molt i deixen molt. Mantén-los, cuida'n la qualitat i dona'ls bona posició a la carta."],
    cavall: ['🐴', 'Cavalls de batalla', 'var(--blau)', "Es venen molt però deixen poc. Puja una mica el preu, ajusta la ració o abaixa'n el cost."],
    enigma: ['❓', 'Enigmes', 'var(--taronja)', "Deixen molt però es venen poc. Dona'ls visibilitat, recomana'ls a sala o canvia'ls el nom."],
    gos: ['🐶', 'Gossos', 'var(--vermell)', "Es venen poc i deixen poc. Replanteja'ls o treu-los de la carta."],
  };

  V.analisi = {
    titol: 'Anàlisi', ic: 'analisi',
    render(el) {
      const pp = h('div.pestanyes'), cos = h('div');
      const pinta = () => {
        UI.buida(pp); UI.buida(cos);
        [['menu', 'Enginyeria de menú'], ['real', 'Food cost real'], ['preus', 'Evolució de preus'], ['sim', 'Simulador'], ['pyg', 'Compte de resultats']].forEach(([k, txt]) =>
          pp.appendChild(h('button', { class: pest === k ? 'on' : '', onclick: () => { pest = k; pinta(); } }, t(txt))));
        ({ menu, real, preus, sim, pyg })[pest](cos, pinta);
      };
      el.append(pp, cos); pinta();
    },
  };

  function menu(el, repinta) {
    const D = Store.D, A = GL.avui();
    const vend = GL.vendesPeriode(D, GL.sumaDies(A, -(dies - 1)), A);
    const em = GL.enginyeriaMenu(D, vend, cat);
    const cats = [...new Set(D.receptes.filter((r) => r.tipus !== 'elab').map((r) => r.cat).filter(Boolean))];
    el.append(h('div.cap', sel([[7, '7 dies'], [30, '30 dies'], [90, '90 dies'], [365, '1 any']], dies, (v) => { dies = +v; repinta(); }, { style: { width: '130px' } }),
      sel([['', 'Totes les categories'], ...cats.map((c) => [c, c])], cat, (v) => { cat = v; repinta(); }, { style: { width: '220px' } }),
      h('div.esp'), h('span.suau.petit', t('Mètode Kasavana i Smith · marge sobre el preu sense IVA')), btn('Imprimir', () => UI.imprimeix(paper(em), t('Enginyeria de menú')), '', 'imprimeix')));
    if (!em.files.length) { el.append(h('div.buit', ic('analisi'), h('h3', t('Cal tenir vendes')), h('p', t('L\'enginyeria de menú creua el que es ven amb el que deixa cada plat. Entra o importa vendes primer.')), btn('Entrar vendes', () => App.ves('vendes', 'entrar'), 'pri'))); return; }
    el.append(h('div.graella', { style: { gridTemplateColumns: '1.25fr 1fr', marginBottom: '14px', alignItems: 'start' } },
      h('div.targeta', grafic(em)),
      h('div.graella.g2', Object.entries(CLASSES).map(([k, [icona, nom, c, consell]]) => {
        const fs = em.files.filter((f) => f.classe === k);
        return h('div.quadrant', { style: { borderColor: c, background: `color-mix(in srgb, ${c} 9%, transparent)` } },
          h('h3', { style: { color: c } }, icona + ' ' + t(nom) + ` (${fs.length})`), h('p.petit.suau', { style: { margin: '2px 0 6px' } }, t(consell)),
          h('div.petit', fs.slice(0, 6).map((f) => f.nom).join(' · ') || '—'));
      }))));
    el.append(UI.taula({ cols: [
      { k: 'nom', t: 'Plat', cls: 'nom', r: (f) => h('span', f.nom, h('span.sub', t(f.cat || ''))) },
      { k: 'q', t: 'Unitats', cls: 'r num', desc: true }, { k: 'mix', t: 'Popularitat', cls: 'r num', r: (f) => pct(f.mix * 100), desc: true },
      { k: 'cm', t: 'Marge/plat', cls: 'r num', r: (f) => eur(f.cm), desc: true }, { k: 'fc', t: 'Food cost', cls: 'r num', r: (f) => pct(f.fc) },
      { k: 'cmTot', t: 'Marge total', cls: 'r num', r: (f) => h('b', eur(f.cmTot)), desc: true },
      { k: 'classe', t: 'Classe', r: (f) => h('span', { style: { color: CLASSES[f.classe][2], fontWeight: 600 } }, CLASSES[f.classe][0] + ' ' + t(CLASSES[f.classe][1]).replace(/s$/, '')) }],
    files: em.files, ordre: ['cmTot', -1], onclic: (f) => App.ves('receptes', f.id) }),
    h('p.suau.petit', t('Popularitat alta: més del 70 % de la mitjana ({p}). Marge alt: per sobre del marge mitjà ponderat ({m}).', { p: pct((em.llindarPop) * 100), m: eur(em.cmMig) })));
  }
  function grafic(em) {
    const W = 620, H = 380, m = { l: 54, r: 16, t: 14, b: 40 };
    const mx = Math.max(...em.files.map((f) => f.mix)) * 1.12 || 1;
    const cms = em.files.map((f) => f.cm), lo = Math.min(0, ...cms), hi = Math.max(...cms) * 1.12 || 1;
    const X = (v) => m.l + (v / mx) * (W - m.l - m.r), Y = (v) => H - m.b - ((v - lo) / (hi - lo || 1)) * (H - m.t - m.b);
    const svg = s('svg', { class: 'graf', viewBox: `0 0 ${W} ${H}` });
    const cx = X(em.llindarPop), cy = Y(em.cmMig);
    [[cx, m.t, W - m.r - cx, cy - m.t, 'estrella'], [cx, cy, W - m.r - cx, H - m.b - cy, 'cavall'], [m.l, m.t, cx - m.l, cy - m.t, 'enigma'], [m.l, cy, cx - m.l, H - m.b - cy, 'gos']]
      .forEach(([x, y, w, hh, k]) => {
        svg.appendChild(s('rect', { x, y, width: Math.max(0, w), height: Math.max(0, hh), fill: CLASSES[k][2], opacity: 0.08 }));
        const tx = k === 'estrella' || k === 'cavall' ? x + w - 8 : x + 8, ty = k === 'estrella' || k === 'enigma' ? y + 16 : y + hh - 8;
        svg.appendChild(s('text', { x: tx, y: ty, 'text-anchor': k === 'estrella' || k === 'cavall' ? 'end' : 'start', style: `fill:${CLASSES[k][2]};font-weight:700` }, CLASSES[k][0] + ' ' + t(CLASSES[k][1])));
      });
    svg.appendChild(s('line', { x1: cx, x2: cx, y1: m.t, y2: H - m.b, stroke: 'var(--linia)', 'stroke-dasharray': '4 4' }));
    svg.appendChild(s('line', { x1: m.l, x2: W - m.r, y1: cy, y2: cy, stroke: 'var(--linia)', 'stroke-dasharray': '4 4' }));
    svg.appendChild(s('line', { x1: m.l, x2: W - m.r, y1: H - m.b, y2: H - m.b, class: 'eix' }));
    svg.appendChild(s('line', { x1: m.l, x2: m.l, y1: m.t, y2: H - m.b, class: 'eix' }));
    svg.appendChild(s('text', { x: (W + m.l) / 2, y: H - 10, 'text-anchor': 'middle' }, t('Popularitat') + ' →'));
    svg.appendChild(s('text', { x: 14, y: (H - m.b + m.t) / 2, transform: `rotate(-90 14 ${(H - m.b + m.t) / 2})`, 'text-anchor': 'middle' }, t('Marge per plat') + ' →'));
    for (let k = 0; k <= 4; k++) { const v = lo + ((hi - lo) * k) / 4; svg.appendChild(s('text', { x: m.l - 6, y: Y(v) + 4, 'text-anchor': 'end' }, UI.fN(v, 1))); }
    for (const f of em.files) {
      const x = X(f.mix), y = Y(f.cm);
      const c = s('circle', { cx: x, cy: y, r: 7, fill: CLASSES[f.classe][2], stroke: '#F6EFE2', 'stroke-width': 1.2, style: 'cursor:pointer' });
      c.appendChild(s('title', {}, `${f.nom}: ${f.q} u · ${eur(f.cm)}`));
      c.addEventListener('click', () => App.ves('receptes', f.id));
      svg.appendChild(c);
      const nom = f.nom.length > 20 ? f.nom.slice(0, 19) + '…' : f.nom;
      const dreta = x < W - 140;
      svg.appendChild(s('text', { x: dreta ? x + 10 : x - 10, y: y + 4, 'text-anchor': dreta ? 'start' : 'end', style: 'fill:var(--crema)' }, nom));
    }
    return svg;
  }
  function paper(em) {
    return h('div.paper', h('h1', t('Enginyeria de menú') + ' · ' + (Store.D.ajustos.local || '')), h('p', t('Últims {n} dies', { n: dies })),
      h('table', h('thead', h('tr', ['Plat', 'Unitats', 'Popularitat', 'Marge/plat', 'Marge total', 'Classe'].map((x) => h('th', t(x))))),
        h('tbody', em.files.map((f) => h('tr', h('td', f.nom), h('td', String(f.q)), h('td', pct(f.mix * 100)), h('td', eur(f.cm)), h('td', eur(f.cmTot)), h('td', CLASSES[f.classe][0] + ' ' + t(CLASSES[f.classe][1])))))));
  }

  function real(el) {
    const D = Store.D;
    const invs = D.inventaris.slice().sort((a, b) => a.data.localeCompare(b.data));
    el.append(h('p.suau', { style: { marginTop: 0 } }, t('El food cost teòric és el que haurien costat les receptes venudes. El real és el que has gastat de veritat: inventari inicial + compres − inventari final. La diferència són mermes, racions massa generoses, errors o pèrdues.')));
    if (invs.length < 2) {
      el.append(h('div.buit', ic('balanc'), h('h3', t('Cal fer dos inventaris')), h('p', t('Fes un inventari ara i un altre d\'aquí a una setmana o un mes. Entre mig, entra les compres i les vendes.')),
        btn('Fer inventari', () => App.ves('estoc', 'inventari'), 'pri', 'balanc'))); return;
    }
    let ini = invs[invs.length - 2].id, fi = invs[invs.length - 1].id;
    const res = h('div');
    const opcs = invs.map((v) => [v.id, UI.data(v.data) + ' · ' + eur(v.valor ?? GL.valorInventari(D, v), 0)]);
    const pinta = () => {
      UI.buida(res);
      const a = invs.find((v) => v.id === ini), b = invs.find((v) => v.id === fi);
      if (!a || !b || a.data >= b.data) { res.appendChild(h('p.taronja', t('L\'inventari inicial ha de ser anterior al final.'))); return; }
      const r = GL.foodCostReal(D, a, b);
      const desconegut = r.diferencia - r.mermes;
      res.append(h('div.graella.g4', { style: { margin: '14px 0' } },
        h('div.targeta.kpi', { style: { '--c': 'var(--verd)' } }, h('div.et', t('Food cost teòric')), h('div.val.num', pct(r.fcTeoric)), h('div.sub', eur(r.costTeoric, 0))),
        h('div.targeta.kpi', { style: { '--c': r.fcReal > r.fcTeoric + 3 ? 'var(--vermell)' : 'var(--taronja)' } }, h('div.et', t('Food cost real')), h('div.val.num', pct(r.fcReal)), h('div.sub', eur(r.consum, 0))),
        h('div.targeta.kpi', { style: { '--c': 'var(--vermell)' } }, h('div.et', t('Diferència')), h('div.val.num', eur(r.diferencia, 0)), h('div.sub', pct(r.fcReal - r.fcTeoric) + ' ' + t('de les vendes'))),
        h('div.targeta.kpi', { style: { '--c': 'var(--blau)' } }, h('div.et', t('Vendes sense IVA')), h('div.val.num', eur(r.vendesNet, 0)), h('div.sub', t('{n} dies amb vendes', { n: r.dies })))),
        h('div.targeta', h('h3', t('D\'on surt la diferència')),
          h('table.t.t-compacta', h('tbody',
            h('tr', h('td', t('Inventari inicial')), h('td.r.num', eur(a.valor ?? GL.valorInventari(D, a)))),
            h('tr', h('td', '+ ' + t('Compres')), h('td.r.num', eur(r.comprat))),
            h('tr', h('td', '− ' + t('Inventari final')), h('td.r.num', eur(b.valor ?? GL.valorInventari(D, b)))),
            h('tr', h('td', h('b', '= ' + t('Consum real'))), h('td.r.num', h('b', eur(r.consum)))),
            h('tr', h('td', t('Consum teòric (receptes venudes)')), h('td.r.num', eur(r.costTeoric))),
            h('tr', h('td', t('Mermes registrades')), h('td.r.num', eur(r.mermes))),
            h('tr', h('td', h('b', t('Pèrdua sense explicar'))), h('td.r.num', h('b', { class: desconegut > 0 ? 'vermell' : 'verd' }, eur(desconegut))))))),
        r.dies === 0 ? h('p.taronja', t('No hi ha vendes registrades entre aquests inventaris: el teòric surt a zero.')) : null);
    };
    el.append(h('div.cap', camp('Inventari inicial', sel(opcs, ini, (v) => { ini = v; pinta(); })), camp('Inventari final', sel(opcs, fi, (v) => { fi = v; pinta(); }))), res);
    pinta();
  }

  function preus(el) {
    const D = Store.D;
    const cs = GL.canvisPreu(D);
    const pujades = cs.filter((c) => c.pct > 0);
    const mitjana = cs.length ? cs.reduce((a, c) => a + c.pct, 0) / cs.length : 0;
    el.append(h('div.graella.g3', { style: { marginBottom: '14px' } },
      h('div.targeta.kpi', { style: { '--c': 'var(--vermell)' } }, h('div.et', t('Pujades')), h('div.val.num', String(pujades.length))),
      h('div.targeta.kpi', { style: { '--c': 'var(--verd)' } }, h('div.et', t('Baixades')), h('div.val.num', String(cs.length - pujades.length))),
      h('div.targeta.kpi', { style: { '--c': 'var(--taronja)' } }, h('div.et', t('Variació mitjana')), h('div.val.num', (mitjana > 0 ? '+' : '') + pct(mitjana)))),
    UI.taula({ cols: [
      { k: 'nom', t: 'Ingredient', cls: 'nom' }, { k: 'data', t: 'Data', r: (c) => UI.data(c.data) },
      { k: 'ant', t: 'Abans', cls: 'r num', r: (c) => eur(c.ant, 3) }, { k: 'nou', t: 'Ara', cls: 'r num', r: (c) => eur(c.nou, 3) },
      { k: 'pct', t: 'Variació', cls: 'r num', r: (c) => h('b', { class: c.pct > 0 ? 'vermell' : 'verd' }, (c.pct > 0 ? '+' : '') + pct(c.pct)), desc: true },
      { k: 'plats', t: 'Plats afectats', r: (c) => h('span.suau.petit', c.plats.slice(0, 5).join(', ') + (c.plats.length > 5 ? '…' : '')), v: (c) => c.plats.length }],
    files: cs, ordre: ['pct', -1], onclic: (c) => App.ves('ingredients', c.id),
    buit: h('div.buit', h('p', t('Encara no hi ha canvis de preu. Es registren sols quan entres compres o canvies el preu d\'un ingredient.'))) }));
  }

  function sim(el) {
    const D = Store.D;
    const tria = [];
    let pc = 10;
    const xips = h('div.xips'), res = h('div');
    const pinta = () => {
      UI.buida(xips);
      if (!tria.length) xips.appendChild(h('span.xip.on', t('Tots els ingredients')));
      tria.forEach((id, k) => xips.appendChild(h('span.xip.on', { onclick: () => { tria.splice(k, 1); pinta(); } }, D.ingredients.find((i) => i.id === id)?.nom, ' ✕')));
      UI.buida(res);
      const r = GL.simula(D, tria, pc);
      const pitjor = r.filter((x) => x.mB < x.mA - 0.01).length;
      res.append(h('p', t('{n} plats afectats', { n: r.length }), ' · ', h('span.suau', t('{k} perden marge', { k: pitjor }))),
        UI.taula({ cols: [
          { k: 'nom', t: 'Plat', cls: 'nom' }, { k: 'costA', t: 'Cost ara', cls: 'r num', r: (x) => eur(x.costA) },
          { k: 'costB', t: 'Cost nou', cls: 'r num', r: (x) => eur(x.costB) },
          { k: 'mA', t: 'Marge ara', cls: 'r num', r: (x) => pct(x.mA) }, { k: 'mB', t: 'Marge nou', cls: 'r num', r: (x) => h('b', { class: x.mB < x.mA ? 'vermell' : 'verd' }, pct(x.mB)) },
          { k: 'pvp', t: 'PVP ara', cls: 'r num', r: (x) => eur(x.pvp) }, { k: 'pvpMantenir', t: 'PVP per mantenir el marge', cls: 'r num', r: (x) => h('b.taronja', eur(x.pvpMantenir)) }],
        files: r, ordre: ['costB', -1], onclic: (x) => App.ves('receptes', x.id) }));
    };
    const cmb = UI.combo({ items: () => D.ingredients.map((i) => ({ id: i.id, nom: i.nom })), placeholder: t('Afegeix un ingredient (o deixa-ho buit per a tots)'), onTria: (x) => { if (!tria.includes(x.id)) tria.push(x.id); cmb.input.value = ''; pinta(); } });
    el.append(h('p.suau', { style: { marginTop: 0 } }, t('Què passa si puja el preu? Tria ingredients i el percentatge: veuràs com queden els marges i quin preu caldria per mantenir-los.')),
      h('div.fila', { style: { gridTemplateColumns: '2fr 140px' } }, camp('Ingredients', cmb), camp('Variació', UI.ambU(inpNum(pc, (v) => { pc = v; pinta(); }), '%'))), xips, h('div', { style: { height: '10px' } }), res);
    pinta();
  }

  function pyg(el, repinta) {
    const D = Store.D;
    const mesos = [...new Set([GL.avui().slice(0, 7), ...Object.keys(D.vendes).map((d) => d.slice(0, 7))])].sort().reverse();
    let mes = pyg.mes || mesos[0];
    const cf = D.costosFixos;
    const res = h('div');
    const pinta = () => {
      UI.buida(res);
      const ultim = new Date(+mes.slice(0, 4), +mes.slice(5), 0).getDate();
      const R = GL.resumVendes(D, GL.vendesPeriode(D, mes + '-01', mes + '-' + String(ultim).padStart(2, '0')));
      const compres = D.compres.filter((c) => c.data.startsWith(mes)).reduce((a, c) => a + GL.totalsCompra(c).base, 0);
      const fixos = Object.values(cf).reduce((a, b) => a + GL.num(b), 0);
      const benBrut = R.net - R.cost, benNet = benBrut - fixos;
      const margePct = R.net ? benBrut / R.net : 0;
      const puntMort = margePct > 0 ? fixos / margePct : 0;
      const fila = (et, v, cls = '', negreta = false) => h('tr', h('td', negreta ? h('b', t(et)) : t(et)), h('td.r.num', h(negreta ? 'b' : 'span', { class: cls }, eur(v))), h('td.r.num.suau', R.net ? pct((v / R.net) * 100) : ''));
      res.append(h('div.graella', { style: { gridTemplateColumns: '1.2fr 1fr', alignItems: 'start' } },
        h('div.targeta', h('h3', t('Compte de resultats') + ' · ' + mes),
          h('table.t.t-compacta', h('tbody',
            fila('Vendes (amb IVA)', R.fact), fila('Vendes sense IVA', R.net, '', true),
            fila('− Cost de matèria primera (teòric)', R.cost, 'vermell'), fila('= Marge brut', benBrut, 'verd', true),
            ...Object.entries(cf).map(([k, v]) => fila('− ' + ({ personal: 'Personal', lloguer: 'Lloguer', llum: 'Llum i gas', aigua: 'Aigua', asseguranca: 'Assegurances', altres: 'Altres despeses' }[k] || k), GL.num(v))),
            fila('= Benefici net', benNet, benNet >= 0 ? 'verd' : 'vermell', true))),
          h('p.suau.petit', t('Compres del mes (base)') + ': ' + eur(compres) + ' · ' + t('serveix per comparar amb el cost teòric.'))),
        h('div',
          h('div.targeta.kpi', { style: { '--c': 'var(--taronja)', marginBottom: '14px' } }, h('div.et', t('Punt d\'equilibri mensual')), h('div.val.num', eur(puntMort, 0)),
            h('div.sub', t('Vendes sense IVA necessàries per cobrir els costos fixos amb el marge actual'))),
          R.net && puntMort ? h('div.targeta', h('div.suau.petit', t('Has fet el {p} del punt d\'equilibri', { p: pct((R.net / puntMort) * 100, 0) })),
            h('div.barra-prog', { style: { height: '10px', marginTop: '6px', '--c': R.net >= puntMort ? 'var(--verd)' : 'var(--taronja)' } }, h('i', { style: { width: Math.min(100, (R.net / puntMort) * 100) + '%' } }))) : null,
          h('div.targeta', { style: { marginTop: '14px' } }, h('h3', t('Costos fixos mensuals')),
            h('div.fila.f2', [['personal', 'Personal'], ['lloguer', 'Lloguer'], ['llum', 'Llum i gas'], ['aigua', 'Aigua'], ['asseguranca', 'Assegurances'], ['altres', 'Altres despeses']].map(([k, et]) =>
              camp(et, UI.ambU(inpNum(cf[k] || '', (v) => { cf[k] = v; Store.desa(); }), '€')))),
            btn('Recalcular', () => pinta(), 'mini')))));
    };
    el.append(h('div.cap', sel(mesos.map((m) => [m, m]), mes, (v) => { mes = pyg.mes = v; pinta(); }, { style: { width: '150px' } })), res);
    pinta();
  }
})(window);

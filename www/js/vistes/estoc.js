/* Estoc (inventari i mermes) i Comandes a proveïdors. */
'use strict';
(function (g) {
  const V = (g.V = g.V || {});
  const { h, ic, btn, btnIc, eur, qty, t, camp, inp, inpNum, sel } = UI;
  const f = { q: '', estat: '' };
  let pest = 'estoc';
  const ETQ = { ok: ['ok', 'Correcte'], baix: ['just', 'Baix'], esgotat: ['esgotat', 'Esgotat'], sense: ['', 'Sense mínim'] };

  V.estoc = {
    titol: 'Estoc', ic: 'estoc',
    badge: (D) => ({ n: D.ingredients.filter((i) => GL.estatEstoc(i) === 'esgotat').length, niv: 'alt' }),
    render(el, arg) {
      if (arg === 'inventari') { pest = 'inventari'; history.replaceState(null, '', '#/estoc'); }
      const pp = h('div.pestanyes');
      const cos = h('div');
      const pinta = () => {
        UI.buida(pp); UI.buida(cos);
        [['estoc', 'Estoc actual'], ['inventari', 'Fer inventari'], ['historial', 'Inventaris'], ['mermes', 'Mermes']].forEach(([k, txt]) =>
          pp.appendChild(h('button', { class: pest === k ? 'on' : '', onclick: () => { pest = k; pinta(); } }, t(txt))));
        ({ estoc: estocActual, inventari, historial, mermes })[pest](cos);
      };
      el.append(pp, cos);
      pinta();
    },
  };

  function estocActual(el) {
    const D = Store.D, C = GL.context(D);
    const files = () => D.ingredients.filter((i) => i.actiu !== false && (!f.estat || GL.estatEstoc(i) === f.estat || (f.estat === 'demanar' && ['baix', 'esgotat'].includes(GL.estatEstoc(i))))
      && (!f.q || GL.norm(i.nom).includes(GL.norm(f.q))));
    const T = UI.taula({ cols: [
      { k: 'nom', t: 'Ingredient', cls: 'nom', r: (i) => h('span', i.nom, h('span.sub', t(i.familia || ''))) },
      { k: 'prov', t: 'Proveïdor', r: (i) => h('span.suau', C.prov.get(i.prov)?.nom || '—'), v: (i) => C.prov.get(i.prov)?.nom || '' },
      { k: 'estoc', t: 'Estoc', cls: 'r num', r: (i) => h('b', qty(GL.num(i.estoc), i.unitat)), v: (i) => GL.num(i.estoc) },
      { k: 'minim', t: 'Mínim', cls: 'r num', r: (i) => GL.num(i.minim) ? qty(GL.num(i.minim), i.unitat) : h('span.suau', '—'), v: (i) => GL.num(i.minim) },
      { k: 'barra', t: '', v: false, r: (i) => { const m = GL.num(i.minim) || 0, mx = GL.num(i.maxim) || 2 * m; if (!m) return ''; const p = Math.min(100, (GL.num(i.estoc) / mx) * 100); const e = GL.estatEstoc(i);
        return h('div.barra-prog', { style: { width: '90px', '--c': e === 'ok' ? 'var(--verd)' : e === 'baix' ? 'var(--taronja)' : 'var(--vermell)' } }, h('i', { style: { width: Math.max(2, p) + '%' } })); } },
      { k: 'valor', t: 'Valor', cls: 'r num', r: (i) => eur(Math.max(0, GL.num(i.estoc)) * GL.num(i.preu)), v: (i) => Math.max(0, GL.num(i.estoc)) * GL.num(i.preu), desc: true },
      { k: 'estat', t: 'Estat', r: (i) => { const e = ETQ[GL.estatEstoc(i)]; return h('span.etq' + (e[0] ? '.' + e[0] : ''), t(e[1])); }, v: (i) => ({ esgotat: 0, baix: 1, ok: 2, sense: 3 }[GL.estatEstoc(i)]) },
      { k: 'acc', t: '', v: false, r: (i) => h('span', { style: { display: 'inline-flex', gap: '4px' } },
        btn('+', () => entrada(i), 'mini', '', { title: t('Entrada') }), btn('', () => merma(i), 'mini', 'merma', { title: t('Merma') })) }],
    files: files(), ordre: ['estat', 1], onclic: (i) => App.ves('ingredients', i.id) });
    const refresca = () => T.refresca(files());
    const esg = D.ingredients.filter((i) => GL.estatEstoc(i) === 'esgotat').length, baix = D.ingredients.filter((i) => GL.estatEstoc(i) === 'baix').length;
    el.append(h('div.graella.g4', { style: { marginBottom: '14px' } },
      h('div.targeta.kpi', { style: { '--c': 'var(--blau)' } }, h('div.et', t('Valor de l\'estoc')), h('div.val.num', eur(GL.valorEstoc(D), 0))),
      h('div.targeta.kpi', { style: { '--c': 'var(--vermell)' } }, h('div.et', t('Esgotats')), h('div.val.num', String(esg))),
      h('div.targeta.kpi', { style: { '--c': 'var(--taronja)' } }, h('div.et', t('Per sota del mínim')), h('div.val.num', String(baix))),
      h('div.targeta.kpi', { style: { '--c': 'var(--verd)', cursor: 'pointer' }, onclick: () => App.ves('comandes') }, h('div.et', t('Comanda proposada')),
        h('div.val.num', eur(GL.proposaComanda(D).reduce((s, x) => s + x.total, 0), 0)), h('div.sub', t('Obre la llista de comanda →')))),
      h('div.cap', UI.cercador('Cerca…', (v) => { f.q = v; refresca(); }, f.q),
        UI.grupBtn([['', 'Tots'], ['demanar', 'A demanar'], ['esgotat', 'Esgotats'], ['ok', 'Correctes']], f.estat, (v) => { f.estat = v; refresca(); }),
        h('div.esp'), btn('Registrar merma', () => merma(), '', 'merma'), btn('Fer inventari', () => { pest = 'inventari'; App.refresca(); }, '', 'balanc'), btn('Llista de comanda', () => App.ves('comandes'), 'pri', 'comanda')), T);
  }

  async function entrada(i) {
    const v = await UI.demana('Entrada d\'estoc', t('Quantitat que entra de «{n}»', { n: i.nom }) + ` (${i.unitat})`, '', true);
    if (!(v > 0)) return;
    Store.canvi(t('Entrada de {q} {u} de {n}', { q: UI.fN(v, 2), u: i.unitat, n: i.nom }), (D) => { const x = D.ingredients.find((y) => y.id === i.id); x.estoc = GL.r3(GL.num(x.estoc) + v); });
    App.refresca();
  }
  async function merma(i0) {
    const D = Store.D;
    let ingId = i0?.id || '';
    const cmb = UI.combo({ items: () => D.ingredients.map((i) => ({ id: i.id, nom: i.nom, sub: qty(GL.num(i.estoc), i.unitat) })), valor: i0?.nom || '', placeholder: t('Ingredient'), onTria: (x) => { ingId = x.id; } });
    const q = inpNum(''), motiu = sel(['Caducat', 'Fet malbé', 'Error de cuina', 'Sobrant del servei', 'Devolució', 'Consum del personal', 'Altres'], 'Caducat');
    const ok = await UI.modal('Registrar merma', h('div', camp('Ingredient', cmb), h('div.fila', { style: { marginTop: '10px' } }, camp('Quantitat', q), camp('Motiu', motiu))), [{ t: 'Cancel·lar', v: 0 }, { t: 'Registrar', v: 1, pri: true }]);
    const qq = GL.num(q.value);
    if (!ok || !ingId || !(qq > 0)) return;
    Store.canvi('Merma registrada', (D2) => {
      const x = D2.ingredients.find((y) => y.id === ingId);
      x.estoc = GL.r3(GL.num(x.estoc) - qq);
      D2.mermes.push({ id: GL.uid('m'), data: GL.avui(), ing: ingId, q: qq, cost: GL.r2(qq * GL.preuReal(x)), motiu: motiu.value });
    });
    App.refresca();
  }
  V.estoc.merma = merma;

  function inventari(el) {
    const D = Store.D;
    const comptat = {};
    let q = '';
    const tbody = h('tbody'), resum = h('span.suau');
    const hiHaZones = D.ingredients.some((i) => i.zona);
    let grup = D.ajustos.grupInventari || (hiHaZones ? 'zona' : 'familia');
    const clau = (i) => (grup === 'zona' ? i.zona || t('Sense zona') : t(i.familia || 'Altres'));
    let ings = [];
    const ordena = () => { ings = D.ingredients.filter((i) => i.actiu !== false).sort((a, b) => clau(a).localeCompare(clau(b)) || a.nom.localeCompare(b.nom)); };
    ordena();
    const pinta = () => {
      UI.buida(tbody); let fam = null;
      for (const i of ings) {
        if (q && !GL.norm(i.nom).includes(GL.norm(q))) continue;
        if (clau(i) !== fam) { fam = clau(i); tbody.appendChild(h('tr', h('td', { colspan: 5, style: { color: 'var(--taronja)', fontWeight: 700, background: 'var(--fons3)' } }, fam))); }
        const dif = h('td.r.num');
        const actDif = () => { if (comptat[i.id] == null) { dif.textContent = ''; return; } const d = comptat[i.id] - GL.num(i.estoc); dif.textContent = (d > 0 ? '+' : '') + qty(d, i.unitat) + '  ·  ' + eur(d * GL.num(i.preu)); dif.className = 'r num ' + (d < 0 ? 'vermell' : d > 0 ? 'verd' : 'suau'); };
        const inN = inpNum(comptat[i.id] ?? '', (v, e) => { if (e.value.trim() === '') delete comptat[i.id]; else comptat[i.id] = v; actDif(); actResum(); }, { placeholder: qty(GL.num(i.estoc)) });
        inN.style.width = '110px';
        inN.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === 'ArrowDown') { e.preventDefault(); const ins = [...tbody.querySelectorAll('input')]; ins[ins.indexOf(inN) + 1]?.focus(); } if (e.key === 'ArrowUp') { e.preventDefault(); const ins = [...tbody.querySelectorAll('input')]; ins[ins.indexOf(inN) - 1]?.focus(); } });
        actDif();
        tbody.appendChild(h('tr', h('td.nom', i.nom), h('td.r.num.suau', qty(GL.num(i.estoc), i.unitat)), h('td', inN), h('td.suau', i.unitat), dif));
      }
    };
    const actResum = () => {
      const n = Object.keys(comptat).length;
      const dif = Object.entries(comptat).reduce((s, [id, v]) => { const i = D.ingredients.find((x) => x.id === id); return s + (v - GL.num(i.estoc)) * GL.num(i.preu); }, 0);
      resum.textContent = t('{n} comptats', { n }) + ' · ' + t('diferència') + ' ' + eur(dif);
    };
    actResum();
    el.append(h('p.suau', { style: { marginTop: 0 } }, t('Compta el que tens i escriu-ho. El que deixis buit no es toca. Amb Intro passes al següent. En desar, l\'estoc queda com l\'has comptat i es guarda l\'inventari (serveix per calcular el food cost real).')),
      h('div.cap', UI.cercador('Cerca…', (v) => { q = v; pinta(); }),
        UI.grupBtn([['zona', 'Per zona'], ['familia', 'Per família']], grup, (v) => { grup = v; D.ajustos.grupInventari = v; Store.desa(); ordena(); pinta(); }),
        h('div.esp'), resum,
        btn('Imprimir full de recompte', () => {
          let g0 = null; const files = [];
          for (const i of ings) { if (clau(i) !== g0) { g0 = clau(i); files.push(h('tr', h('td', { colspan: 4, style: { fontWeight: 700, background: '#f1ede6' } }, g0))); }
            files.push(h('tr', h('td', i.nom), h('td', i.unitat), h('td', { style: { textAlign: 'right', color: '#888' } }, qty(GL.num(i.estoc))), h('td', { style: { width: '35%' } }, ' '))); }
          UI.imprimeix(h('div.paper', h('h1', t('Inventari') + ' · ' + UI.data(GL.avui())), h('table', h('thead', h('tr', h('th', t('Ingredient')), h('th', t('Unitat')), h('th', t('Teòric')), h('th', t('Comptat')))), h('tbody', files))), t('Inventari'));
        }, '', 'imprimeix'),
        btn('Desar l\'inventari', () => {
          if (!Object.keys(comptat).length) return UI.toast('No has comptat res', { tipus: 'av' });
          Store.canvi('Inventari desat', (D2) => {
            const valors = {};
            for (const i of D2.ingredients) {
              const v = comptat[i.id];
              valors[i.id] = v != null ? v : GL.num(i.estoc);
              if (v != null) i.estoc = v;
            }
            const inv = { id: GL.uid('v'), data: GL.avui(), valors, parcial: Object.keys(comptat).length < D2.ingredients.length };
            inv.valor = GL.r2(GL.valorInventari(D2, inv));
            D2.inventaris = D2.inventaris.filter((x) => x.data !== inv.data).concat([inv]);
          });
          pest = 'historial'; App.refresca();
        }, 'pri', 'check')),
      h('div.taula-w', h('table.t.t-compacta', h('thead', h('tr', h('th', t('Ingredient')), h('th.r', t('Teòric')), h('th', t('Comptat')), h('th'), h('th.r', t('Diferència')))), tbody)));
    pinta();
    setTimeout(() => tbody.querySelector('input')?.focus(), 50);
  }

  function historial(el) {
    const D = Store.D;
    const invs = D.inventaris.slice().sort((a, b) => b.data.localeCompare(a.data));
    el.append(h('p.suau', { style: { marginTop: 0 } }, t('Amb dos inventaris, a Anàlisi → Food cost real veuràs quant has gastat de veritat comparat amb el que diuen les receptes.')),
      UI.taula({ cols: [
        { k: 'data', t: 'Data', r: (v) => UI.data(v.data, true) },
        { k: 'n', t: 'Productes', cls: 'r num', r: (v) => String(Object.keys(v.valors || {}).length) },
        { k: 'valor', t: 'Valor', cls: 'r num', r: (v) => eur(v.valor ?? GL.valorInventari(D, v)) },
        { k: 'parcial', t: '', r: (v) => v.parcial ? h('span.etq', t('parcial')) : '' },
        { k: 'acc', t: '', v: false, r: (v) => btnIc('paperera', async () => { if (await UI.confirma('Eliminar aquest inventari?', 'Eliminar', true)) { Store.canvi('Inventari eliminat', (D2) => { D2.inventaris = D2.inventaris.filter((x) => x.id !== v.id); }); App.refresca(); } }, 'Eliminar') }],
      files: invs, buit: h('div.buit', h('p', t('Encara no has fet cap inventari.')), btn('Fer inventari', () => { pest = 'inventari'; App.refresca(); }, 'pri')) }));
  }

  function mermes(el) {
    const D = Store.D, C = GL.context(D);
    const mes = GL.avui().slice(0, 7);
    const ms = D.mermes.slice().sort((a, b) => b.data.localeCompare(a.data));
    const perMotiu = {};
    ms.filter((m) => m.data.startsWith(mes)).forEach((m) => { perMotiu[m.motiu] = (perMotiu[m.motiu] || 0) + GL.num(m.cost); });
    const totMes = Object.values(perMotiu).reduce((a, b) => a + b, 0);
    el.append(h('div.graella.g3', { style: { marginBottom: '14px' } },
      h('div.targeta.kpi', { style: { '--c': 'var(--vermell)' } }, h('div.et', t('Mermes aquest mes')), h('div.val.num', eur(totMes))),
      h('div.targeta', { style: { gridColumn: 'span 2' } }, h('div.suau.petit', t('Per motiu')), h('div', Object.entries(perMotiu).sort((a, b) => b[1] - a[1]).map(([k, v]) => h('span.etq', { style: { marginRight: '6px' } }, `${t(k)}: ${eur(v)}`))))),
    h('div.cap', h('div.esp'), btn('Registrar merma', () => merma(), 'pri', 'merma')),
    UI.taula({ cols: [
      { k: 'data', t: 'Data', r: (m) => UI.data(m.data) }, { k: 'nom', t: 'Ingredient', cls: 'nom', r: (m) => C.ing.get(m.ing)?.nom || '?', v: (m) => C.ing.get(m.ing)?.nom || '' },
      { k: 'q', t: 'Quantitat', cls: 'r num', r: (m) => qty(GL.num(m.q), C.ing.get(m.ing)?.unitat || '') }, { k: 'motiu', t: 'Motiu', r: (m) => t(m.motiu) },
      { k: 'cost', t: 'Cost', cls: 'r num', r: (m) => eur(GL.num(m.cost)) },
      { k: 'acc', t: '', v: false, r: (m) => btnIc('paperera', () => { Store.canvi('Merma eliminada', (D2) => { const x = D2.ingredients.find((i) => i.id === m.ing); if (x) x.estoc = GL.r3(GL.num(x.estoc) + GL.num(m.q)); D2.mermes = D2.mermes.filter((y) => y.id !== m.id); }); App.refresca(); }, 'Eliminar') }],
    files: ms, buit: h('div.buit', h('p', t('Cap merma registrada. Apunta el que llences: saber-ho és el primer pas per reduir-ho.'))) }));
  }

  // ── Comandes ────────────────────────────────────────────────────────────
  V.comandes = {
    titol: 'Comandes', ic: 'comanda',
    badge: (D) => ({ n: D.ingredients.filter((i) => GL.estatEstoc(i) === 'baix').length, niv: 'mig' }),
    afegeix(linies) {
      Store.canvi('Afegit a la comanda', (D) => {
        D.comanda = D.comanda || [];
        for (const l of linies) { const x = D.comanda.find((y) => y.ing === l.ing); if (x) x.q = GL.num(x.q) + l.q; else D.comanda.push({ ...l }); }
      });
      App.ves('comandes');
    },
    render(el) {
      const D = Store.D, C = GL.context(D);
      D.comanda = D.comanda || [];
      // proposta automàtica + afegits a mà (els afegits manen)
      const prop = GL.proposaComanda(D).flatMap((gr) => gr.linies.map((l) => ({ ...l, auto: true })));
      const mapa = new Map(prop.map((l) => [l.ing, l]));
      for (const m of D.comanda) { const i = C.ing.get(m.ing); if (i) mapa.set(m.ing, { ing: i.id, nom: i.nom, unitat: i.unitat, q: GL.num(m.q), preu: GL.num(i.preu), auto: false }); }
      const linies = [...mapa.values()].filter((l) => l.q > 0);
      const grups = {};
      for (const l of linies) { const k = C.ing.get(l.ing)?.prov || ''; (grups[k] = grups[k] || []).push(l); }
      el.append(h('p.suau', { style: { marginTop: 0 } }, t('Proposta automàtica amb el que està per sota del mínim (fins al màxim o 2 vegades el mínim). Canvia les quantitats, envia-la i, quan arribi, converteix-la en albarà.')));
      const cmb = UI.combo({ items: () => D.ingredients.map((i) => ({ id: i.id, nom: i.nom, sub: qty(GL.num(i.estoc), i.unitat) })), placeholder: '+ ' + t('Afegeix un producte a la comanda'),
        onTria: (x) => { Store.canvi('', (D2) => { (D2.comanda = D2.comanda || []).push({ ing: x.id, q: 1 }); }, { silenci: true }); App.refresca(); } });
      el.append(h('div.cap', h('div', { style: { width: '380px' } }, cmb), h('div.esp'),
        D.comanda.length ? btn('Buidar els afegits a mà', () => { Store.canvi('Comanda buidada', (D2) => { D2.comanda = []; }); App.refresca(); }, '') : null));
      if (!linies.length) { el.append(h('div.buit', ic('comanda'), h('h3', t('No cal demanar res')), h('p', t('Tot l\'estoc està per sobre del mínim. Posa mínims als ingredients perquè la comanda es faci sola.')))); return; }
      const graella = h('div.graella', { style: { gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))' } });
      for (const [provId, ls] of Object.entries(grups)) {
        const prov = C.prov.get(provId);
        const tot = h('b.num');
        const actTot = () => { tot.textContent = eur(ls.reduce((s, l) => s + l.q * l.preu, 0)); };
        const tb = h('tbody', ls.map((l) => {
          const q = inpNum(l.q, (v) => { l.q = v; actTot(); desaQ(l); }); q.style.width = '90px';
          return h('tr', h('td.nom', l.nom, l.auto ? null : h('span.sub', t('afegit a mà'))), h('td', q), h('td.suau', l.unitat), h('td.r.num.suau', eur(l.preu)),
            h('td', btnIc('x', () => { Store.canvi('', (D2) => { D2.comanda = (D2.comanda || []).filter((y) => y.ing !== l.ing); if (l.auto) D2.comanda.push({ ing: l.ing, q: 0 }); }, { silenci: true }); App.refresca(); }, 'Treure')));
        }));
        actTot();
        const text = () => `${t('Hola')}${prov?.contacte ? ' ' + prov.contacte : ''}, ${t('us faig la comanda per a')} ${D.ajustos.local || ''}:\n` + ls.filter((l) => l.q > 0).map((l) => `- ${l.nom}: ${UI.qty(l.q, l.unitat)}`).join('\n') + `\n${t('Gràcies!')}`;
        graella.appendChild(h('div.targeta',
          h('h3', ic('proveidor'), prov?.nom || t('Sense proveïdor'), h('span.suau.petit', { style: { marginLeft: 'auto' } }, prov?.dies || '')),
          h('table.t.t-compacta', tb), h('div', { style: { display: 'flex', justifyContent: 'space-between', margin: '8px 0', alignItems: 'center' } },
            prov?.minimComanda ? h('span.petit', { class: ls.reduce((s, l) => s + l.q * l.preu, 0) < prov.minimComanda ? 'taronja' : 'suau' }, t('Mínim') + ' ' + eur(prov.minimComanda)) : h('span'),
            h('span', t('Total aprox.') + ' ', tot)),
          h('div', { style: { display: 'flex', gap: '6px', flexWrap: 'wrap' } },
            btn('Copiar', () => { navigator.clipboard?.writeText(text()); UI.toast('Copiat'); }, 'mini', 'copia'),
            prov?.tel ? btn('WhatsApp', () => obreURL(`https://wa.me/${prov.tel.replace(/\D/g, '').replace(/^(?=[6789]\d{8}$)/, '34')}?text=${encodeURIComponent(text())}`), 'mini') : null,
            prov?.email ? btn('Correu', () => obreURL(`mailto:${prov.email}?subject=${encodeURIComponent(t('Comanda') + ' ' + (D.ajustos.local || ''))}&body=${encodeURIComponent(text())}`), 'mini') : null,
            h('div.esp', { style: { flex: 1 } }),
            btn('Ha arribat → albarà', () => { V.compres.nou({ prov: provId, linies: ls.filter((l) => l.q > 0).map((l) => ({ ing: l.ing, q: l.q, preu: l.preu })) });
              Store.canvi('', (D2) => { D2.comanda = (D2.comanda || []).filter((y) => !ls.some((l) => l.ing === y.ing)); }, { silenci: true }); }, 'mini pri', 'check'))));
      }
      el.append(graella);
      function desaQ(l) { Store.D.comanda = Store.D.comanda.filter((y) => y.ing !== l.ing).concat([{ ing: l.ing, q: l.q }]); Store.desa(); }
    },
  };
  function obreURL(u) { Store.obre(u); }
  V.obreURL = obreURL;
})(window);

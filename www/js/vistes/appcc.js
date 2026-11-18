/* Qualitat (APPCC): registre de temperatures i etiquetes de producció (lot, caducitat, al·lèrgens). */
'use strict';
(function (g) {
  const V = (g.V = g.V || {});
  const { h, ic, btn, btnIc, t, camp, inp, inpNum, sel } = UI;
  let pest = 'temps';
  const torn = () => (new Date().getHours() < 15 ? 'mati' : 'tarda');

  V.appcc = {
    titol: 'APPCC', ic: 'appcc',
    badge: (D) => {
      const eq = D.appcc?.equips || [];
      if (!eq.length) return null;
      const fets = new Set((D.appcc.registres || []).filter((r) => r.data === GL.avui()).map((r) => r.equip));
      return { n: eq.filter((e) => !fets.has(e.id)).length, niv: 'mig' };
    },
    render(el, arg) {
      if (arg) { pest = arg; history.replaceState(null, '', '#/appcc'); }
      const pp = h('div.pestanyes'), cos = h('div');
      const pinta = () => {
        UI.buida(pp); UI.buida(cos);
        [['temps', 'Temperatures'], ['etiquetes', 'Etiquetes'], ['equips', 'Equips']].forEach(([k, txt]) => pp.appendChild(h('button', { class: pest === k ? 'on' : '', onclick: () => { pest = k; pinta(); } }, t(txt))));
        ({ temps, etiquetes, equips })[pest](cos, pinta);
      };
      el.append(pp, cos); pinta();
    },
  };

  function temps(el, repinta) {
    const D = Store.D, A = D.appcc;
    if (!A.equips.length) { el.append(h('div.buit', ic('termo'), h('h3', t('Afegeix les neveres i congeladors')), h('p', t('Per a cada equip, el rang de temperatura correcte. Cada dia hi apuntes la lectura.')), btn('Afegir equips', () => { pest = 'equips'; repinta(); }, 'pri', 'mes'))); return; }
    const T = torn();
    const avui = GL.avui();
    const graella = h('div.graella', { style: { gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', marginBottom: '16px' } });
    for (const e of A.equips) {
      const reg = A.registres.find((r) => r.data === avui && r.equip === e.id && r.torn === T);
      const val = inpNum(reg?.t ?? '', null, { placeholder: '°C' });
      const accio = inp(reg?.accio || '', null, { placeholder: t('Acció correctora (si està fora de rang)') });
      const estat = h('div.petit');
      const comprova = () => { const v = GL.num(val.value, NaN); const fora = Number.isFinite(v) && (v < e.min || v > e.max); estat.textContent = !Number.isFinite(v) ? '' : fora ? '⚠ ' + t('Fora de rang') : '✓ ' + t('Correcte'); estat.className = 'petit ' + (fora ? 'vermell' : 'verd'); accio.classList.toggle('amaga', !fora); return { v, fora }; };
      val.addEventListener('input', comprova);
      const desa = () => {
        const { v, fora } = comprova();
        if (!Number.isFinite(v)) return;
        if (fora && !accio.value.trim()) { accio.focus(); return UI.toast('Apunta l\'acció correctora', { tipus: 'av' }); }
        Store.canvi(t('Temperatura de {n} desada', { n: e.nom }), (D2) => {
          D2.appcc.registres = D2.appcc.registres.filter((r) => !(r.data === avui && r.equip === e.id && r.torn === T));
          D2.appcc.registres.push({ id: GL.uid('t'), data: avui, torn: T, equip: e.id, t: v, fora, accio: accio.value.trim(), hora: new Date().toTimeString().slice(0, 5), qui: D2.ajustos.responsable || '' });
        });
        repinta();
      };
      val.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') desa(); });
      comprova();
      graella.appendChild(h('div.targeta', { style: { borderColor: reg ? (reg.fora ? 'var(--vermell)' : 'var(--verd)') : 'var(--linia)' } },
        h('h3', ic('termo'), e.nom, h('span.suau.petit', { style: { marginLeft: 'auto' } }, `${e.min} / ${e.max} °C`)),
        h('div', { style: { display: 'flex', gap: '8px' } }, h('div', { style: { width: '110px' } }, UI.ambU(val, '°C')), btn(reg ? 'Actualitzar' : 'Desar', desa, reg ? '' : 'pri')),
        h('div', { style: { marginTop: '6px' } }, accio), estat, reg ? h('div.suau.petit', t('Apuntat a les {h}', { h: reg.hora })) : null));
    }
    const des = GL.sumaDies(avui, -30);
    const regs = A.registres.filter((r) => r.data >= des).sort((a, b) => (b.data + b.torn).localeCompare(a.data + a.torn));
    el.append(h('div.cap', h('h2', t('Lectura d\'avui') + ' · ' + t(T === 'mati' ? 'matí' : 'tarda')), h('div.esp'),
      btn('Imprimir el registre del mes', () => imprimeixMes(), '', 'imprimeix')), graella,
      h('h3', { style: { margin: '6px 0 10px' } }, t('Últims 30 dies')),
      UI.taula({ cols: [
        { k: 'data', t: 'Data', r: (r) => UI.data(r.data) }, { k: 'torn', t: 'Torn', r: (r) => t(r.torn === 'mati' ? 'matí' : 'tarda') },
        { k: 'equip', t: 'Equip', cls: 'nom', r: (r) => A.equips.find((e) => e.id === r.equip)?.nom || '?' },
        { k: 't', t: 'Temperatura', cls: 'r num', r: (r) => h('b', { class: r.fora ? 'vermell' : 'verd' }, UI.fN(r.t, 1) + ' °C') },
        { k: 'accio', t: 'Acció correctora', r: (r) => h('span.suau', r.accio || '') }, { k: 'hora', t: 'Hora', r: (r) => h('span.suau', r.hora || '') }],
      files: regs, buit: h('div.buit.petit', t('Encara no hi ha registres.')) }));
  }
  function imprimeixMes() {
    const D = Store.D, A = D.appcc, mes = GL.avui().slice(0, 7);
    const dies = new Date(+mes.slice(0, 4), +mes.slice(5), 0).getDate();
    const td = { border: '1px solid #bbb', padding: '2px 4px', fontSize: '10px', textAlign: 'center' };
    UI.imprimeix(h('div.paper', h('h1', { style: { fontSize: '18px' } }, t('Registre de temperatures') + ' · ' + mes + ' · ' + (D.ajustos.local || '')),
      h('table', { style: { borderCollapse: 'collapse', width: '100%' } },
        h('thead', h('tr', h('th', { style: td }, t('Dia')), A.equips.flatMap((e) => [h('th', { style: td }, e.nom + ' ' + t('matí')), h('th', { style: td }, e.nom + ' ' + t('tarda'))]), h('th', { style: td }, t('Incidències')))),
        h('tbody', Array.from({ length: dies }, (_, k) => {
          const d = mes + '-' + String(k + 1).padStart(2, '0');
          const inc = A.registres.filter((r) => r.data === d && r.fora).map((r) => r.accio).join('; ');
          return h('tr', h('td', { style: td }, String(k + 1)), A.equips.flatMap((e) => ['mati', 'tarda'].map((tn) => { const r = A.registres.find((x) => x.data === d && x.equip === e.id && x.torn === tn);
            return h('td', { style: { ...td, color: r?.fora ? '#c0392b' : '#111' } }, r ? UI.fN(r.t, 1) : ''); })), h('td', { style: { ...td, textAlign: 'left' } }, inc));
        }))),
      h('p', { style: { fontSize: '10px' } }, A.equips.map((e) => `${e.nom}: ${e.min} / ${e.max} °C`).join(' · '))), t('Temperatures'));
  }

  function equips(el, repinta) {
    const D = Store.D;
    el.append(h('p.suau', { style: { marginTop: 0 } }, t('Rangs habituals: nevera 0 a 5 °C, congelador −25 a −18 °C, vitrina freda 0 a 8 °C, manteniment en calent ≥ 65 °C.')),
      h('div.taula-w', h('table.t', h('thead', h('tr', h('th', t('Equip')), h('th.r', t('Mínim °C')), h('th.r', t('Màxim °C')), h('th'))),
        h('tbody', D.appcc.equips.map((e) => h('tr', h('td', inp(e.nom, (v) => { e.nom = v; Store.desa(); })), h('td', inpNum(e.min, (v) => { e.min = v; Store.desa(); })),
          h('td', inpNum(e.max, (v) => { e.max = v; Store.desa(); })), h('td', btnIc('paperera', () => { Store.canvi('Equip eliminat', (D2) => { D2.appcc.equips = D2.appcc.equips.filter((x) => x.id !== e.id); }); repinta(); }, 'Eliminar'))))))),
      h('div', { style: { marginTop: '10px', display: 'flex', gap: '8px' } },
        btn('Nevera', () => afegeix('Nevera', 0, 5), '', 'mes'), btn('Congelador', () => afegeix('Congelador', -25, -18), '', 'mes'),
        btn('Vitrina', () => afegeix('Vitrina', 0, 8), '', 'mes'), btn('Calent', () => afegeix('Manteniment calent', 65, 95), '', 'mes')),
      h('div', { style: { marginTop: '16px', maxWidth: '380px' } }, camp('Responsable (surt als registres)', inp(D.ajustos.responsable || '', (v) => { D.ajustos.responsable = v; Store.desa(); }))));
    function afegeix(nom, min, max) { Store.canvi('Equip afegit', (D2) => { const n = D2.appcc.equips.filter((x) => x.nom.startsWith(t(nom))).length; D2.appcc.equips.push({ id: GL.uid('e'), nom: t(nom) + (n ? ' ' + (n + 1) : ''), min, max }); }); repinta(); }
  }

  function etiquetes(el) {
    const D = Store.D, C = GL.context(D);
    const cua = [];
    const llista = h('div');
    const pinta = () => {
      UI.buida(llista);
      if (!cua.length) { llista.appendChild(h('p.suau', t('Tria què has preparat. L\'etiqueta porta el nom, la data, la caducitat, el lot i els al·lèrgens.'))); return; }
      llista.appendChild(h('div.taula-w', h('table.t.t-compacta', h('thead', h('tr', ['Producte', 'Elaborat', 'Caduca', 'Lot', 'Còpies', ''].map((x) => h('th', t(x))))),
        h('tbody', cua.map((x, k) => h('tr', h('td.nom', x.nom), h('td', h('input', { type: 'date', value: x.elab, onchange: (e) => { x.elab = e.target.value; x.cad = GL.sumaDies(x.elab, x.dies); pinta(); } })),
          h('td', h('input', { type: 'date', value: x.cad, onchange: (e) => { x.cad = e.target.value; } })), h('td', inp(x.lot, (v) => { x.lot = v; })),
          h('td', { style: { width: '90px' } }, inpNum(x.n, (v) => { x.n = Math.max(1, Math.round(v)); })), h('td', btnIc('x', () => { cua.splice(k, 1); pinta(); }, 'Treure'))))))));
    };
    const cmb = UI.combo({ items: () => D.receptes.map((r) => ({ id: r.id, nom: r.nom, ic: r.tipus === 'elab' ? '🧪' : '🍽' })), placeholder: '+ ' + t('Què has preparat?'),
      onTria: (x) => { const r = C.rec.get(x.id); const dies = GL.num(r.conserva, D.ajustos.diesConserva || 3); const avui = GL.avui();
        cua.push({ id: r.id, nom: r.nom, elab: avui, cad: GL.sumaDies(avui, dies), dies, lot: avui.slice(2).replace(/-/g, '') + '-' + String(cua.length + 1).padStart(2, '0'), n: 1 }); cmb.input.value = ''; pinta(); } });
    const imprimeix = () => {
      if (!cua.length) return;
      const ets = cua.flatMap((x) => Array.from({ length: x.n }, () => x));
      UI.imprimeix(h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3, 62mm)', gap: '4mm' } }, ets.map((x) => {
        const a = GL.allergens(C.rec.get(x.id), C);
        return h('div', { style: { width: '62mm', height: '40mm', border: '1px solid #333', borderRadius: '2mm', padding: '2.5mm 3mm', fontFamily: 'Segoe UI', fontSize: '9pt', color: '#000', overflow: 'hidden', breakInside: 'avoid' } },
          h('div', { style: { fontWeight: 800, fontSize: '11.5pt', lineHeight: 1.1 } }, x.nom),
          h('div', { style: { marginTop: '1.5mm' } }, t('Elaborat') + ': ', h('b', UI.data(x.elab))),
          h('div', t('Consumir abans de') + ': ', h('b', UI.data(x.cad))),
          h('div', t('Lot') + ': ' + x.lot),
          h('div', { style: { marginTop: '1mm', fontSize: '8pt' } }, h('b', t('Al·lèrgens') + ': '), a.conte.length ? a.conte.map((k) => t(GL.ALG[k].nom).toUpperCase()).join(', ') : t('cap'),
            a.traces.length ? ' · ' + t('Traces') + ': ' + a.traces.map((k) => t(GL.ALG[k].nom)).join(', ') : ''),
          D.ajustos.local ? h('div', { style: { fontSize: '7pt', color: '#555', marginTop: '0.5mm' } }, D.ajustos.local) : null);
      })), t('Etiquetes'));
    };
    el.append(h('div.cap', h('div', { style: { width: '380px' } }, cmb), h('div.esp'), btn('Imprimir etiquetes', imprimeix, 'pri', 'etiqueta')),
      h('p.suau.petit', t('La caducitat surt dels dies de conservació de cada recepta (o del valor per defecte d\'Ajustos). Etiquetes de 62 × 40 mm.')), llista);
    pinta();
  }
})(window);

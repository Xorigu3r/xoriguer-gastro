/* Ajustos i Ajuda. */
'use strict';
(function (g) {
  const V = (g.V = g.V || {});
  const { h, ic, btn, t, camp, inp, inpNum, sel } = UI;

  V.ajustos = {
    titol: 'Ajustos', ic: 'ajustos',
    exporta() {
      const nom = `xoriguer_gastro_${GL.avui()}.json`;
      Store.desaFitxer(nom, JSON.stringify(Store.D, null, 1), 'JSON').then((c) => c && UI.toast(t('Còpia desada') + (typeof c === 'string' && c.includes('\\') ? ': ' + c : '')));
    },
    async render(el) {
      const D = Store.D, A = D.ajustos;
      const desa = () => Store.desa();
      const idioma = sel([['', 'Automàtic'], ['ca', 'Català'], ['es', 'Español'], ['fr', 'Français'], ['en', 'English']], A.idioma || '', (v) => { A.idioma = v; Store.desaAra().then(() => location.reload()); });
      el.append(h('div.graella.g2', { style: { alignItems: 'start' } },
        h('div.targeta', h('h3', ic('carta'), t('El local')),
          h('div.fila.f2', camp('Nom del local', inp(A.local, (v) => { A.local = v; desa(); })), camp('Telèfon', inp(A.telefon || '', (v) => { A.telefon = v; desa(); }))),
          camp('Adreça', inp(A.adreca || '', (v) => { A.adreca = v; desa(); })), h('div', { style: { height: '12px' } }),
          h('div.fila.f3', camp('IVA per defecte', sel([[10, '10 %'], [21, '21 %'], [4, '4 %'], [0, '0 %']], A.iva, (v) => { A.iva = +v; desa(); })),
            camp('Moneda', inp(A.moneda || '€', (v) => { A.moneda = v || '€'; desa(); })), camp('Idioma', idioma)),
          camp('Dies de conservació per defecte (etiquetes)', inpNum(A.diesConserva ?? 3, (v) => { A.diesConserva = v; desa(); }))),
        h('div.targeta', h('h3', ic('euro'), t('Marge objectiu per categoria')),
          h('p.suau.petit', t('Marge brut sobre el preu sense IVA. Per sota de l\'objectiu, el plat surt en taronja; 8 punts per sota, en vermell. Cada plat pot tenir el seu.')),
          h('div.fila', { style: { gridTemplateColumns: 'repeat(3, 1fr)' } }, Object.keys({ ...GL.OBJECTIUS, ...A.objectius }).map((c) =>
            camp(c, UI.ambU(inpNum(A.objectius[c] ?? GL.OBJECTIUS[c], (v) => { A.objectius[c] = v; GL.OBJECTIUS[c] = v; desa(); }), '%')))))));

      const info = await Store.info();
      const copies = await Store.copies();
      el.append(h('div.targeta', { style: { marginTop: '14px' } }, h('h3', ic('baixa'), t('Dades i còpies de seguretat')),
        h('p.suau.petit', t('Les dades es desen soles a cada canvi.') + ' ' + (Store.escriptori ? t('Fitxer') + ': ' + info.dades + ' · ' + t('Cada dia es fa una còpia automàtica (es guarden les 30 últimes).') : (Store.NATIU ? t("A la tauleta les dades es guarden dins de l'app. Exporta'n una còpia de seguretat de tant en tant (a Drive, al correu…).") : t('Ara funciona dins del navegador: fes còpies de seguretat sovint.')))),
        h('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap' } },
          btn('Exportar còpia de seguretat', () => V.ajustos.exporta(), 'pri', 'baixa'),
          btn('Restaurar d\'un fitxer', async () => {
            const txt = await Store.obreFitxer('.json'); if (!txt) return;
            let d; try { d = JSON.parse(txt); } catch { return UI.toast('El fitxer no és vàlid', { tipus: 'err' }); }
            if (!(await UI.confirma('Les dades actuals se substituiran per les del fitxer. Continuar?', 'Restaurar', true))) return;
            Store.canvi('Còpia restaurada', () => { Store.D = d.plats && !d.receptes ? GL.migraRaconet(d) : GL.completa(d); }, { silenci: false });
            Store.desaAra(); App.refresca();
          }, '', 'puja'),
          Store.NATIU ? null : btn('Importar del Raconet / TPV', async () => {
            const R = await Store.raconet();
            if (!R) return UI.toast('No s\'ha trobat el fitxer del Raconet en aquest ordinador', { tipus: 'av' });
            if (!(await UI.confirma('S\'afegiran els plats, ingredients i vendes del Raconet a les dades actuals (els que tinguin el mateix nom no es dupliquen). Continuar?'))) return;
            const M = GL.migraRaconet(JSON.parse(R));
            Store.canvi('Dades del Raconet importades', (D2) => fusiona(D2, M)); App.refresca();
          }, '', 'puja'),
          Store.escriptori ? btn('Obrir la carpeta de dades', () => Store.carpeta(), '', 'estoc') : null),
        copies.length ? h('div', { style: { marginTop: '12px' } }, h('div.suau.petit', t('Còpies automàtiques')), h('div.xips', { style: { marginTop: '6px' } }, copies.slice(0, 30).map((c) =>
          h('span.xip', { title: t('Restaurar aquesta còpia'), onclick: async () => {
            if (!(await UI.confirma(t('Tornar a les dades del {d}? Les actuals es poden recuperar amb «Desfer».', { d: c.replace(/\D+/g, ' ').trim() }), 'Restaurar', true))) return;
            const txt = await Store.restauraCopia(c); if (!txt) return;
            Store.canvi('Còpia restaurada', () => { Store.D = GL.completa(JSON.parse(txt)); }); App.refresca();
          } }, '⟲ ', c.replace('dades_', '').replace('.json', ''))))) : null));

      // Actualitzacions
      const estatAct = h('span.suau.petit');
      const bAct = btn('Busca actualitzacions', async () => {
        bAct.disabled = true; estatAct.textContent = t('Buscant…');
        const r = await Actualitza.busca(true);
        bAct.disabled = false;
        estatAct.textContent = !r ? t('No s\'ha pogut comprovar (sense connexió?)') : r.nova ? t('Versió nova: {v}', { v: r.v.versio }) : t('Ja tens la versió més nova.');
        if (r && r.nova) estatAct.after(btn(t('Actualitzar a la {v}', { v: r.v.versio }), () => Actualitza.instal_la(r.v), 'pri', 'baixa'));
      }, 'pri', 'desfer');
      el.append(h('div.targeta', { style: { marginTop: '14px' } }, h('h3', ic('baixa'), t('Actualitzacions')),
        h('p.suau.petit', t('Tens la versió {v}.', { v: App.VERSIO }) + ' ' + (Store.plataforma === 'windows' ? t('A Windows es baixa l\'instal·lador i s\'instal·la a sobre: les dades no es toquen.')
          : Store.plataforma === 'android' ? t('A la tauleta es baixa l\'APK nova i s\'instal·la a sobre: les dades no es toquen.') : t('S\'obre la pàgina de baixades (xoriguer.dev).'))),
        h('div', { style: { display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' } }, bAct, estatAct),
        h('label', { style: { display: 'flex', gap: '8px', alignItems: 'center', marginTop: '10px' } },
          h('input', { type: 'checkbox', checked: Actualitza.auto, onchange: (e) => { Actualitza.auto = e.target.checked; } }), t('Comprova-ho sol un cop al dia'))));

      el.append(h('div.targeta', { style: { marginTop: '14px', borderColor: 'rgba(229,83,61,.5)' } }, h('h3.vermell', ic('alerta'), t('Zona perillosa')),
        h('div', { style: { display: 'flex', gap: '8px' } },
          btn('Carregar les dades d\'exemple', async () => { if (await UI.confirma('Se substituiran totes les dades per les d\'exemple. Es pot desfer.', 'Carregar', true)) { Store.canvi('Dades d\'exemple', () => { Store.D = GL.exemple(); }); App.refresca(); } }, ''),
          btn('Esborrar-ho tot', async () => { if (await UI.confirma('S\'esborraran totes les receptes, ingredients, vendes i compres. Es pot desfer fins que tanquis el programa.', 'Esborrar-ho tot', true)) { Store.canvi('Tot esborrat', () => { const loc = Store.D.ajustos; Store.D = GL.buides(); Store.D.ajustos = loc; }); App.refresca(); } }, 'perill', 'paperera'))),
        h('p.suau.petit', { style: { marginTop: '14px' } }, `Xoriguer Gastro ${App.VERSIO}`));
    },
  };

  /** Afegeix M a D sense duplicar per nom (receptes, ingredients, proveïdors) i fusiona vendes. */
  function fusiona(D, M) {
    const mapa = {};
    const uneix = (llista, clau) => {
      const per = new Map(D[llista].map((x) => [GL.norm(x.nom), x]));
      for (const x of M[llista]) {
        const ja = per.get(GL.norm(x.nom));
        if (ja) { mapa[x.id] = ja.id; continue; }
        const nouId = D[llista].some((y) => y.id === x.id) ? GL.uid(clau) : x.id;
        mapa[x.id] = nouId; D[llista].push({ ...x, id: nouId });
      }
    };
    uneix('proveidors', 'p'); uneix('ingredients', 'i');
    for (const i of D.ingredients) if (i.prov && mapa[i.prov]) i.prov = mapa[i.prov];
    uneix('receptes', 'r');
    for (const r of D.receptes) for (const l of r.linies) if (mapa[l.id]) l.id = mapa[l.id];
    for (const [d, v] of Object.entries(M.vendes)) { D.vendes[d] = D.vendes[d] || {}; for (const [id, q] of Object.entries(v)) { const k = mapa[id] || id; D.vendes[d][k] = Math.max(D.vendes[d][k] || 0, q); } }
    D.compres.push(...M.compres.map((c) => ({ ...c, prov: mapa[c.prov] || c.prov })));
    if (!D.menus.length) D.menus = M.menus;
    if (!D.ajustos.local) D.ajustos.local = M.ajustos.local;
  }

  V.ajuda = {
    titol: 'Ajuda', ic: 'ajuda',
    render(el, arg) {
      const ll = I18N.llengua;
      let doc = arg === 'manual' ? 'manual' : (V.ajuda._doc || 'guia');
      const marc = h('iframe', { src: `manual/${doc}_${ll}.html`, style: { width: '100%', height: 'calc(100vh - 196px)', border: '1px solid var(--linia)', borderRadius: '10px', background: 'var(--fons)' } });
      el.append(h('div.cap', UI.grupBtn([['guia', 'Guia de posada en marxa'], ['manual', 'Manual']], doc, (v) => { doc = V.ajuda._doc = v; marc.src = `manual/${v}_${ll}.html`; }),
        h('div.esp'), Store.NATIU ? null : btn('Obrir al navegador', () => Store.obreGuia(`${doc}_${ll}`), '', 'imprimeix')));
      el.append(h('div.ajuda-g',
        marc,
        h('div.targeta', h('h3', ic('info'), t('Dreceres de teclat')),
          h('table.t.t-compacta', h('tbody', [['Ctrl K', 'Cercar o fer una acció'], ['N', 'Nou (a la pantalla actual)'], ['/', 'Anar al cercador'], ['Ctrl Z', 'Desfer'], ['Ctrl S', 'Desar ara'],
            ['Ctrl 1…9', 'Canviar de pantalla'], ['Esc', 'Tancar el panell'], ['Intro', 'Següent camp a les llistes']].map(([k, d]) => h('tr', h('td', h('kbd', k)), h('td', t(d)))))),
          h('p.suau.petit', { style: { marginTop: '12px' } }, `Xoriguer Gastro ${App.VERSIO}`))));
    },
  };
})(window);

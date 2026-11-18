/* Xoriguer Gastro — closca: menú, rutes (#/vista/id), paleta d'ordres (Ctrl+K), dreceres i primer ús. */
'use strict';
(function (g) {
  const { h, ic, buida, btn, t } = UI;
  const VERSIO = '3.4.1';
  const V = (g.V = g.V || {}); // vistes registrades pels fitxers de vistes/
  const MENU = [
    ['Cuina', ['tauler', 'receptes', 'ingredients', 'produccio']],
    ['Compres i estoc', ['proveidors', 'compres', 'estoc', 'comandes']],
    ['Vendes', ['vendes', 'analisi']],
    ['Sala', ['carta']],
    ['Qualitat', ['appcc']],
  ];
  const App = {
    VERSIO, actual: 'tauler', arg: null,
    ves(vista, arg = null) {
      const hash = '#/' + vista + (arg ? '/' + encodeURIComponent(arg) : '');
      if (location.hash === hash) this.pinta(); else location.hash = hash;
    },
    refresca() { this.pinta(true); },
    pinta(mantenScroll = false) {
      const [, vista = 'tauler', arg = null] = (location.hash || '#/tauler').split('/');
      const nom = V[vista] ? vista : 'tauler';
      // Encara no hi ha dades (primer ús): totes les pantalles, menys l'ajuda, porten a la benvinguda
      if (!Store.D && nom !== 'ajuda') { this.actual = ''; UI.tancaTot(); benvinguda(); this.menu(); return; }
      const el = document.getElementById('vista');
      const sc = mantenScroll && nom === this.actual ? el.scrollTop : 0;
      this.actual = nom; this.arg = arg ? decodeURIComponent(arg) : null;
      document.getElementById('titol').textContent = t(V[nom].titol);
      buida(document.getElementById('barra-acc'));
      if (V[nom].nou) document.getElementById('barra-acc').appendChild(btn(V[nom].nouTxt || 'Nou', () => V[nom].nou(), 'pri', 'mes', { title: t('Nou') + ' (N)' }));
      buida(el);
      try { V[nom].render(el, this.arg); } catch (e) { console.error(e); el.appendChild(h('div.buit', h('h3', t('Hi ha hagut un error')), h('p', String(e.message || e)))); }
      el.scrollTop = sc;
      this.menu();
    },
    menu() {
      const D = Store.D, navs = buida(document.getElementById('navs'));
      for (const [grup, items] of MENU) {
        navs.appendChild(h('div.grup-t', t(grup)));
        for (const k of items) navs.appendChild(this.itemNav(k, D));
      }
      const peu = buida(document.getElementById('peu-nav'));
      peu.append(this.itemNav('ajustos', D), this.itemNav('ajuda', D));
    },
    itemNav(k, D) {
      const v = V[k];
      const b = v.badge && D ? v.badge(D) : null;
      return h('a.nav' + (this.actual === k ? '.actiu' : ''), { href: '#/' + k, title: t(v.titol) },
        ic(v.ic), h('span.nav-txt', t(v.titol)), b && b.n ? h('span.nav-badge' + (b.niv === 'mig' ? '.mig' : ''), String(b.n)) : null);
    },
  };
  g.App = App;

  // ── Paleta d'ordres ───────────────────────────────────────────────────
  function paleta() {
    if (document.querySelector('.paleta') || !Store.D) return; // sense dades encara (benvinguda)
    const D = Store.D;
    const vel = h('div.vel.p'), p = h('div.paleta');
    const i = h('input', { type: 'text', placeholder: t('Cerca plats, ingredients, proveïdors o accions…') });
    const res = h('div.res');
    p.append(i, res); document.body.append(vel, p);
    const tanca = () => { vel.remove(); p.remove(); };
    vel.onclick = tanca;
    const accions = [
      ['Nova recepta', 'recepta', () => V.receptes.nou()],
      ['Nou ingredient', 'ingredient', () => V.ingredients.nou()],
      ['Nova compra / albarà', 'compra', () => V.compres.nou()],
      ['Entrar les vendes d\'avui', 'vendes', () => App.ves('vendes', 'entrar')],
      ['Fer inventari', 'balanc', () => App.ves('estoc', 'inventari')],
      ['Llista de comanda', 'comanda', () => App.ves('comandes')],
      ['Planificar producció', 'produccio', () => App.ves('produccio')],
      ['Imprimir la carta d\'al·lèrgens', 'imprimeix', () => App.ves('carta', 'allergens')],
      ['Registrar temperatures', 'termo', () => App.ves('appcc')],
      ['Imprimir etiquetes de producció', 'etiqueta', () => App.ves('appcc', 'etiquetes')],
      ['Desfer l\'últim canvi', 'desfer', () => Store.desfesUn()],
      ['Còpia de seguretat', 'baixa', () => V.ajustos.exporta()],
    ];
    const tots = () => [
      ...Object.entries(V).filter(([, v]) => v.titol).map(([k, v]) => ({ gr: 'Anar a', nom: t(v.titol), ic: v.ic, fes: () => App.ves(k) })),
      ...accions.map(([n, icona, fes]) => ({ gr: 'Accions', nom: t(n), ic: icona, fes })),
      ...D.receptes.map((r) => ({ gr: 'Receptes', nom: r.nom, ic: 'recepta', tipus: t(r.tipus === 'elab' ? 'Elaboració' : r.cat || ''), fes: () => App.ves('receptes', r.id) })),
      ...D.ingredients.map((x) => ({ gr: 'Ingredients', nom: x.nom, ic: 'ingredient', tipus: UI.eur(x.preu) + '/' + x.unitat, fes: () => App.ves('ingredients', x.id) })),
      ...D.proveidors.map((x) => ({ gr: 'Proveïdors', nom: x.nom, ic: 'proveidor', fes: () => App.ves('proveidors', x.id) })),
    ];
    let sel = 0, vis = [];
    const pinta = () => {
      const q = GL.norm(i.value);
      const T = tots();
      vis = q ? T.filter((x) => GL.norm(x.nom).includes(q)).sort((a, b) => (GL.norm(a.nom).startsWith(q) ? 0 : 1) - (GL.norm(b.nom).startsWith(q) ? 0 : 1)).slice(0, 30)
        : T.filter((x) => x.gr !== 'Ingredients' && x.gr !== 'Receptes' && x.gr !== 'Proveïdors').slice(0, 30);
      buida(res); let gr = '';
      vis.forEach((x, n) => {
        if (x.gr !== gr) { gr = x.gr; res.appendChild(h('div.gr', t(gr))); }
        res.appendChild(h('div.it' + (n === sel ? '.on' : ''), { onmousedown: (e) => { e.preventDefault(); tanca(); x.fes(); } }, ic(x.ic), h('span', x.nom), x.tipus ? h('span.tipus', x.tipus) : null));
      });
      if (!vis.length) res.appendChild(h('div.buit.petit', t('Cap resultat')));
    };
    i.addEventListener('input', () => { sel = 0; pinta(); });
    i.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { sel = Math.min(sel + 1, vis.length - 1); pinta(); e.preventDefault(); res.querySelector('.on')?.scrollIntoView({ block: 'nearest' }); }
      else if (e.key === 'ArrowUp') { sel = Math.max(sel - 1, 0); pinta(); e.preventDefault(); res.querySelector('.on')?.scrollIntoView({ block: 'nearest' }); }
      else if (e.key === 'Enter') { e.preventDefault(); const x = vis[sel]; if (x) { tanca(); x.fes(); } }
      else if (e.key === 'Escape') { e.preventDefault(); tanca(); }
    });
    pinta(); setTimeout(() => i.focus(), 10);
  }
  App.paleta = paleta;

  function dreceres() {
    document.addEventListener('keydown', (e) => {
      const escrivint = !!e.target.matches?.('input,textarea,select,[contenteditable]');
      const k = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && k === 'k') { e.preventDefault(); paleta(); return; }
      if ((e.ctrlKey || e.metaKey) && k === 'z' && !escrivint) { e.preventDefault(); Store.desfesUn(); return; }
      if ((e.ctrlKey || e.metaKey) && k === 's') { e.preventDefault(); Store.desaAra(); UI.toast('Desat'); return; }
      if ((e.ctrlKey || e.metaKey) && /^[1-9]$/.test(k)) {
        const llista = MENU.flatMap((m) => m[1]); const v = llista[+k - 1];
        if (v) { e.preventDefault(); App.ves(v); } return;
      }
      if (escrivint || e.ctrlKey || e.altKey || e.metaKey || document.querySelector('.panell,.modal,.paleta')) return;
      if (k === 'n' && V[App.actual]?.nou) { e.preventDefault(); V[App.actual].nou(); }
      if (k === '/' ) { e.preventDefault(); document.querySelector('#vista .cercador input')?.focus(); }
      if (k === 'f1' || k === '?') { e.preventDefault(); App.ves('ajuda'); }
    });
  }

  // ── Primer ús ─────────────────────────────────────────────────────────
  async function benvinguda() {
    const el = buida(document.getElementById('vista'));
    document.getElementById('titol').textContent = t('Benvingut/da');
    const R = await Store.raconet();
    const tria = (D, msg) => { D.ajustos = { ...D.ajustos, idioma: I18N.llengua }; Store.nou(D); App.menu(); App.ves('tauler'); if (msg) UI.toast(msg); };
    const opc = [];
    if (R) opc.push(h('div.targeta', { onclick: () => { try { tria(GL.migraRaconet(JSON.parse(R)), 'Dades del Raconet importades'); } catch (e) { UI.toast(String(e), { tipus: 'err' }); } } },
      h('h3', '⬆ ', t('Importar les dades del Raconet')), h('p.suau.petit', t('S\'ha trobat el fitxer del Raconet Gastronomia / Xoriguer TPV en aquest ordinador. Se\'n copien els plats, ingredients, vendes i compres (l\'original no es toca).'))));
    opc.push(h('div.targeta', { onclick: () => tria(GL.exemple(), 'Dades d\'exemple carregades') },
      h('h3', '🍳 ', t('Començar amb un exemple')), h('p.suau.petit', t('Un bar amb plats, elaboracions, proveïdors, vendes d\'un mes i estoc. Ideal per veure-ho tot funcionant.'))));
    opc.push(h('div.targeta', { onclick: () => tria(GL.buides()) },
      h('h3', '✨ ', t('Començar en blanc')), h('p.suau.petit', t('Sense res. Comença pels ingredients i després crea els plats.'))));
    opc.push(h('div.targeta', { onclick: async () => { const txt = await Store.obreFitxer('.json'); if (!txt) return; try { const d = JSON.parse(txt); tria(d.plats && !d.receptes ? GL.migraRaconet(d) : GL.completa(d), 'Còpia restaurada'); } catch { UI.toast('El fitxer no és vàlid', { tipus: 'err' }); } } },
      h('h3', '📂 ', t('Obrir una còpia de seguretat')), h('p.suau.petit', t('Un fitxer .json exportat abans.'))));
    el.appendChild(h('div.benvinguda', h('img', { src: 'img/icona-256.png', alt: '' }),
      h('h1', { style: { fontSize: '30px', marginTop: '14px', marginBottom: '2px' } }, 'Xoriguer Gastro'),
      h('div.taronja', { style: { fontSize: '17px', fontWeight: 700, marginBottom: '8px' } }, t('Escandalls i gestió de cuina')),
      h('p.suau', { style: { fontSize: '16px' } }, t('Escandalls, al·lèrgens, estoc, compres i vendes del teu restaurant, en un sol lloc.')),
      h('div', { style: { display: 'inline-flex', marginTop: '6px' } }, UI.grupBtn([['ca', 'Català'], ['es', 'Español'], ['fr', 'Français'], ['en', 'English']], I18N.llengua, (v) => {
        try { localStorage.setItem('xg-idioma', v); } catch { /* res */ } location.reload(); })),
      h('div.opc', { style: { gridTemplateColumns: `repeat(${Math.min(opc.length, 4)}, 1fr)` } }, opc)));
  }

  async function inicia() {
    // Mode captura (imatges de la guia): ?captura=ca&ruta=receptes/r2&accio=basePlats — dades d'exemple, no desa res
    const Q = new URLSearchParams(location.search), CAPT = Q.get('captura');
    if (CAPT) {
      I18N.posa(CAPT);
      Store.desa = Store.desaAra = async () => true;
      Store.D = Q.get('ruta') === 'benvinguda' ? null : GL.completa(GL.exemple());
      if (Store.D) for (const i of Store.D.ingredients) if (['i5', 'i6', 'i7', 'i13'].includes(i.id)) i.orientatiu = true; // per ensenyar l'avís
      if (Store.D) { Store.D.ajustos.idioma = CAPT; Store.D.ajustos.adreca = 'C. Major, 12'; Store.D.ajustos.telefon = '972 000 000'; }
    }
    const D0 = CAPT ? Store.D : await Store.carrega().catch(() => 'err');
    let pref = CAPT || Store.D?.ajustos?.idioma;
    if (pref == null) { try { pref = localStorage.getItem('xg-idioma') || 'ca'; } catch { pref = 'ca'; } }
    I18N.posa(pref);
    I18N.tradueix(document.body); I18N.vigila(document.body);
    document.title = 'Xoriguer Gastro · ' + t('Escandalls i gestió de cuina');
    try { g.pywebview?.api?.titol?.(document.title); } catch { /* res */ }
    window.addEventListener('pywebviewready', () => { try { g.pywebview.api.titol(document.title); } catch { /* res */ } });
    const bp = document.getElementById('obre-paleta');
    bp.append(ic('cerca'), h('span', t('Cerca o fes una acció…')), h('kbd', 'Ctrl K'));
    bp.onclick = paleta;
    document.getElementById('marca').onclick = () => {
      document.getElementById('app').classList.toggle('plegat');
      try { localStorage.setItem('xg-plegat', document.getElementById('app').classList.contains('plegat') ? '1' : ''); } catch { /* res */ }
    };
    // Menú plegat: el que hagi triat l'usuari; si no ho ha triat mai, plegat a les pantalles estretes (tauleta en vertical)
    let prefP = null; try { prefP = localStorage.getItem('xg-plegat'); } catch { /* res */ }
    const estreta = matchMedia('(max-width: 1100px)');
    const aplicaPlegat = () => document.getElementById('app').classList.toggle('plegat', prefP === null ? estreta.matches : prefP === '1');
    aplicaPlegat();
    estreta.addEventListener('change', () => { try { prefP = localStorage.getItem('xg-plegat'); } catch { /* res */ } aplicaPlegat(); });
    dreceres();
    window.addEventListener('hashchange', () => { UI.tancaTot(); App.pinta(); });
    Store.escolta(() => App.menu());
    if (D0 === 'err') {
      document.getElementById('vista').appendChild(h('div.buit', h('h3', t('No es poden llegir les dades')), h('p', t('El fitxer de dades està malmès. Ves a Ajustos per restaurar una còpia automàtica.'))));
      Store.D = GL.buides(); App.ves('ajustos'); return;
    }
    if (!D0) { App.menu(); benvinguda(); return; }
    if (CAPT) {
      const r = Q.get('ruta') || 'tauler';
      if (location.hash !== '#/' + r) { history.replaceState(null, '', '#/' + r); }
      App.pinta();
      const acc = { basePlats: () => V.receptes.deLaBase(), baseIng: () => [...document.querySelectorAll('#vista .cap button')].find((x) => x.querySelector('svg') && x.textContent.includes(t('Afegir de la base')))?.click(),
        novaCompra: () => V.compres.nou(), paleta: () => paleta(),
        prod: () => { Store.D.produccio = [{ rec: 'r2', n: 20 }, { rec: 'r3', n: 16 }, { rec: 'r6', n: 10 }, { rec: 'r1', n: 8 }]; App.pinta(); },
        appcc: () => { const ap = Store.D.appcc; ap.registres = ap.equips.flatMap((e, k) => [0, 1, 2, 3, 4].map((d) => ({ id: e.id + d, equip: e.id, data: GL.sumaDies(GL.avui(), -d), torn: d % 2 ? 'tarda' : 'mati', t: e.min + 1.5 + ((d + k) % 3), fora: false, hora: '09:15', qui: 'Marta' }))); App.pinta(); } }[Q.get('accio')];
      if (acc) setTimeout(acc, 150);
      return;
    }
    App.pinta();
  }
  document.addEventListener('DOMContentLoaded', inicia);
})(window);

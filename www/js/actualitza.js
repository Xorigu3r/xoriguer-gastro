/* Xoriguer Gastro — actualitzacions.
 * Llegeix https://xoriguer.dev/versions/gastro/versio.json (el genera XoriguerMirall/munta.py) i, si hi ha una versió nova:
 *   Windows: baixa l'instal·lador (comprova el sha256) i l'obre; s'instal·la a sobre i les dades no es toquen.
 *   Android: baixa l'APK nova (el navegador del sistema).   Linux i navegador: obre la pàgina de baixades.
 * Sol: un cop cada 20 h, 6 s després d'obrir (es pot desactivar a Ajustos). */
'use strict';
(function (g) {
  const URL_VERSIO = 'https://xoriguer.dev/versions/gastro/versio.json';
  const PAGINA = 'https://xoriguer.dev/#p-gastro';
  const CLAU = 'xg-actualitza';
  const { t } = UI;

  /** -1, 0, 1 comparant «3.4.1» amb «3.10» per números. */
  function compara(a, b) {
    const x = String(a).split(/[.\-\s]/).map((n) => parseInt(n, 10) || 0), y = String(b).split(/[.\-\s]/).map((n) => parseInt(n, 10) || 0);
    for (let k = 0; k < Math.max(x.length, y.length); k++) { const d = (x[k] || 0) - (y[k] || 0); if (d) return d > 0 ? 1 : -1; }
    return 0;
  }
  const llegeix = () => { try { return JSON.parse(localStorage.getItem(CLAU) || '{}'); } catch { return {}; } };
  const desa = (o) => { try { localStorage.setItem(CLAU, JSON.stringify({ ...llegeix(), ...o })); } catch { /* res */ } };

  async function consulta() {
    const r = await fetch(URL_VERSIO + '?t=' + Date.now(), { cache: 'no-store' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }

  /** Instal·la la versió `v` segons la plataforma. */
  async function instal_la(v) {
    const pl = Store.plataforma;
    if (pl === 'windows' && v.url && g.pywebview?.api?.actualitza) {
      UI.toast(t('Baixant la versió {v}…', { v: v.versio }), { ms: 60000 });
      try {
        const ok = await g.pywebview.api.actualitza(v.url, v.sha256 || '');
        if (ok) UI.toast(t('S\'obre l\'instal·lador. Tanca Xoriguer Gastro quan t\'ho demani: les dades es mantenen.'), { ms: 12000 });
      } catch (e) { UI.toast(t('No s\'ha pogut baixar l\'actualització') + ': ' + (e.message || e), { tipus: 'err' }); Store.obre(v.url); }
      return;
    }
    if (pl === 'android' && v.apk) { Store.obre(v.apk); UI.toast(t('S\'està baixant l\'APK nova: obre-la per instal·lar-la a sobre (les dades es mantenen).'), { ms: 10000 }); return; }
    Store.obre(PAGINA);
  }

  const Actualitza = {
    URL_VERSIO, compara,
    get auto() { return llegeix().auto !== false; },
    set auto(v) { desa({ auto: !!v }); },
    /** Comprova. manual = l'usuari ha premut el botó (diu sempre alguna cosa). Torna {nova, v} o null si error. */
    async busca(manual = false) {
      let v;
      try { v = await consulta(); } catch (e) {
        if (manual) UI.toast(t('No s\'ha pogut comprovar (sense connexió?)'), { tipus: 'av' });
        return null;
      }
      desa({ ultima: Date.now() });
      const actual = App.VERSIO;
      const nova = !!v.versio && compara(v.versio, actual) > 0;
      if (nova) {
        UI.toast(t('Hi ha una versió nova de Xoriguer Gastro: {v} (tens la {a}).', { v: v.versio, a: actual }),
          { ms: 20000, accio: { t: t('Actualitzar'), fn: () => instal_la(v) } });
      } else if (manual) UI.toast(t('Ja tens la versió més nova ({v}).', { v: actual }));
      return { nova, v };
    },
    instal_la,
    /** Comprovació automàtica (com a molt un cop cada 20 h). */
    inicia() {
      if (!this.auto || Store.plataforma === 'web') return;
      if (Date.now() - (llegeix().ultima || 0) < 20 * 3600 * 1000) return;
      setTimeout(() => this.busca(false), 6000);
    },
  };
  g.Actualitza = Actualitza;
})(window);

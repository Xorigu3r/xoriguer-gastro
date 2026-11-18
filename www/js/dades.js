/* Xoriguer Gastro — magatzem de dades i ponts amb cada plataforma.
 *   Windows (.exe):  window.pywebview.api (escriptori/gastro.py) → %APPDATA%\XoriguerGastro\dades.json, còpies diàries.
 *   Linux:           el servidor local d'escriptori/linux respon /api/<mètode> (amb testimoni) → ~/.local/share/XoriguerGastro.
 *   Android (APK):   Capacitor; dades a localStorage del WebView, fitxers amb Filesystem + Share, impressió nativa.
 *   Navegador:       localStorage (proves).
 * Tot canvi passa per Store.canvi(): desa sol i es pot desfer. */
'use strict';
(function (g) {
  const CLAU = 'xoriguer-gastro-dades';
  const NATIU = !!(g.Capacitor && g.Capacitor.isNativePlatform && g.Capacitor.isNativePlatform());
  const P = (nom) => (g.Capacitor && g.Capacitor.Plugins && g.Capacitor.Plugins[nom]) || null;

  // Linux: API per HTTP. El testimoni només el rep la pàgina servida pel programa.
  const testimoni = document.querySelector('meta[name="xg-api"]')?.content || '';
  const HTTP = testimoni ? new Proxy({ _http: true }, {
    get(o, k) {
      if (k in o || typeof k !== 'string' || k === 'then') return o[k];
      return (...args) => fetch('/api/' + k, { method: 'POST', headers: { 'X-XG-Testimoni': testimoni, 'Content-Type': 'application/json' }, body: JSON.stringify(args) })
        .then(async (r) => { const j = await r.json(); if (!r.ok) throw new Error(j && j.error || r.status); return j; });
    },
  }) : null;
  if (HTTP) setInterval(() => { HTTP.ping().catch(() => {}); }, 20000); // senyal de vida (el servidor s'atura quan es tanca)

  const api = () => (g.pywebview && g.pywebview.api) || HTTP || null;
  const esperaApi = () => new Promise((res) => {
    if (api()) return res(api());
    let fet = false;
    const fi = () => { if (!fet) { fet = true; res(api()); } };
    window.addEventListener('pywebviewready', fi);
    // Si no som a l'escriptori de Windows, no arribarà mai
    setTimeout(fi, /XoriguerEscriptori/.test(navigator.userAgent) ? 4000 : 250);
  });
  const plataforma = () => (g.pywebview && g.pywebview.api) ? 'windows' : HTTP ? 'linux' : NATIU ? 'android' : 'web';

  const Store = {
    D: null, escriptori: false, desfer: [], _tmr: null, _escoltes: new Set(), estat: 'desat', NATIU,
    get plataforma() { return plataforma(); },
    async carrega() {
      const a = await esperaApi();
      this.escriptori = !!a;
      let text = '';
      try { text = a ? await a.carrega() : (localStorage.getItem(CLAU) || ''); } catch (e) { console.error(e); }
      if (!text) return null;
      try { this.D = GL.completa(JSON.parse(text)); return this.D; } catch (e) {
        console.error('Dades il·legibles', e);
        throw new Error('dades');
      }
    },
    nou(D) { this.D = GL.completa(D); this.desaAra(); },
    escolta(fn) { this._escoltes.add(fn); return () => this._escoltes.delete(fn); },
    _avisa() { for (const f of this._escoltes) try { f(); } catch (e) { console.error(e); } },
    /** Aplica un canvi. desc = text del «Desfer». */
    canvi(desc, fn, { silenci = false } = {}) {
      const abans = JSON.stringify(this.D);
      const r = fn(this.D);
      this.desfer.push({ desc, abans });
      if (this.desfer.length > 30) this.desfer.shift();
      this.desa();
      this._avisa();
      if (!silenci && desc) UI.toast(desc, { desfer: () => this.desfesUn() });
      return r;
    },
    desfesUn() {
      const u = this.desfer.pop();
      if (!u) { UI.toast('No hi ha res a desfer', { tipus: 'av' }); return; }
      this.D = GL.completa(JSON.parse(u.abans));
      this.desa(); this._avisa();
      g.App?.refresca();
      UI.toast(UI.t('Desfet') + ': ' + UI.t(u.desc));
    },
    desa() {
      this.estat = 'pendent';
      clearTimeout(this._tmr);
      this._tmr = setTimeout(() => this.desaAra(), 350);
    },
    async desaAra() {
      clearTimeout(this._tmr);
      const text = JSON.stringify(this.D);
      try {
        if (api()) await api().desa(text); else localStorage.setItem(CLAU, text);
        this.estat = 'desat';
      } catch (e) {
        this.estat = 'error';
        UI.toast('No s\'han pogut desar les dades', { tipus: 'err' });
        console.error(e);
      }
    },
    // ── Fitxers ──
    async desaFitxer(nom, text, tipus = 'JSON') {
      if (g.pywebview && g.pywebview.api) return g.pywebview.api.desa_fitxer(nom, text, tipus);
      if (NATIU && P('Filesystem') && P('Share')) {
        // Android: es desa a la memòria cau de l'app i s'obre «Compartir» (Drive, correu, Fitxers, WhatsApp…)
        const w = await P('Filesystem').writeFile({ path: nom, data: text, directory: 'CACHE', encoding: 'utf8' });
        try { await P('Share').share({ title: nom, files: [w.uri], dialogTitle: UI.t('Desa o comparteix') }); } catch { return ''; }
        return nom;
      }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
      a.download = nom; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      return nom;
    },
    obreFitxer(accept = '.json,.csv,.txt') {
      if (g.pywebview && g.pywebview.api) return g.pywebview.api.obre_fitxer(accept);
      return new Promise((res) => {
        const i = document.createElement('input'); i.type = 'file'; if (!NATIU) i.accept = accept;
        i.onchange = () => { const f = i.files[0]; if (!f) return res(''); const r = new FileReader(); r.onload = () => res(r.result); r.readAsText(f); };
        i.click();
      });
    },
    /** Obre un enllaç extern (WhatsApp, correu, web) fora del programa. */
    obre(url) {
      if (api() && api().obre) return api().obre(url);
      if (NATIU) { location.href = url; return; } // Capacitor l'envia a l'app que toca
      window.open(url, '_blank');
    },
    /** Obre la guia o el manual al navegador del sistema. false = no es pot (Android: ja es veu dins l'app). */
    obreGuia(nom) {
      if (api() && api().obre_guia) { api().obre_guia(nom); return true; }
      if (NATIU) return false;
      window.open(`manual/${nom}.html`, '_blank'); return true;
    },
    async raconet() { return api() ? api().raconet() : ''; },
    async tpvDisponible() { return api() ? api().tpv_disponible() : false; },
    async tpvVendes(dia) { return api() ? api().tpv_vendes(dia) : []; },
    /** QR en data: URL. Windows el fa en Python; si no, la mateixa web (vendor/qrcode.js, MIT). */
    async qr(text) {
      let src = '';
      try { if (api()) src = await api().qr(text); } catch { src = ''; }
      if (src) return src;
      if (!g.qrcode) return '';
      const q = g.qrcode(0, 'M'); q.addData(unescape(encodeURIComponent(text))); q.make();
      return q.createDataURL(10, 8);
    },
    async carpeta() { if (api() && api().carpeta) return api().carpeta(); },
    async info() { return api() ? api().info() : { dades: NATIU ? UI.t('dins de l\'app (Android)') : 'localStorage', copies: '' }; },
    async copies() { return api() ? api().copies() : []; },
    async restauraCopia(nom) { return api() ? api().llegeix_copia(nom) : ''; },
  };
  window.addEventListener('beforeunload', () => { if (Store.estat === 'pendent') Store.desaAra(); });
  // Android: si l'app passa a segon pla, desa ja (el sistema la pot tancar)
  document.addEventListener('visibilitychange', () => { if (document.hidden && Store.estat === 'pendent') Store.desaAra(); });
  g.Store = Store;
})(window);

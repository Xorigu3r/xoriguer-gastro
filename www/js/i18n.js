/* Xoriguer Gastro — idiomes (català, castellà, francès, anglès). Mateix motor que Xoriguer Receptes.
 * La clau és el text en català tal com surt al codi; TR (traduccions.js) té les altres llengües.
 * t('{n} plats', {n: 3}) admet variables. Tot el que s'afegeix a la pàgina es tradueix sol (MutationObserver):
 * cada element que només té text i etiquetes de format, i si no, els seus trossos de text. També placeholder i title. */
'use strict';
(function (g) {
  const LLENGUES = ['ca', 'es', 'fr', 'en'];
  const INLINE = new Set(['B', 'I', 'BR', 'EM', 'STRONG', 'SPAN', 'A', 'SMALL']);
  const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
  let L = 'ca', obs = null;

  function delSistema() {
    const ll = (typeof navigator !== 'undefined' && (navigator.languages || [navigator.language])) || [];
    for (const x of ll) {
      const s = String(x || '').toLowerCase().split('-')[0];
      if (s === 'ca') return 'ca';
      if (s === 'es' || s === 'gl' || s === 'eu') return 'es';
      if (s === 'fr') return 'fr';
      if (s === 'en') return 'en';
    }
    return 'ca';
  }
  function posa(pref) { L = LLENGUES.includes(pref) ? pref : delSistema(); if (typeof document !== 'undefined') document.documentElement.lang = L; return L; }
  const dic = () => (g.TR || {})[L] || {};
  function t(s, v) {
    let r = s;
    if (L !== 'ca') { const x = dic()[norm(s)]; if (x != null) r = x; }
    if (v) r = String(r).replace(/\{(\w+)\}/g, (m, k) => (k in v ? v[k] : m));
    return r;
  }
  function esUnitat(el) {
    let text = false;
    for (const n of el.childNodes) if (n.nodeType === 3 && n.nodeValue.trim()) text = true;
    if (!text) return false;
    for (const d of el.querySelectorAll('*')) if (!INLINE.has(d.tagName)) return false;
    return true;
  }
  function recorre(el, fes) {
    if (el.nodeType !== 1 || /^(SCRIPT|STYLE|SVG|svg|TEXTAREA|INPUT|path|OPTION_X)$/.test(el.tagName) || el.hasAttribute('data-no-t') || el.closest('[data-no-t]')) return;
    for (const a of ['placeholder', 'title']) {
      const v = el.getAttribute(a);
      if (v && v.trim()) fes(norm(v), (x) => el.setAttribute(a, x));
    }
    if (esUnitat(el)) { fes(norm(el.innerHTML), (x) => { el.innerHTML = x; }); return; }
    for (const n of [...el.childNodes]) {
      if (n.nodeType === 3 && n.nodeValue.trim()) {
        const o = n.nodeValue, k = norm(o);
        fes(k, (x) => { n.nodeValue = o.replace(o.trim(), x); });
      } else if (n.nodeType === 1) recorre(n, fes);
    }
  }
  function tradueix(root) {
    if (L === 'ca' || !root) return;
    const d = dic();
    recorre(root, (k, aplica) => { if (d[k] != null) aplica(d[k]); });
  }
  /** Tradueix sola qualsevol cosa nova que aparegui a la pàgina. */
  function vigila(root) {
    if (obs) obs.disconnect();
    if (L === 'ca') return;
    obs = new MutationObserver((ms) => {
      for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1) tradueix(n);
    });
    obs.observe(root, { childList: true, subtree: true });
  }
  function falten(root, l) {
    const d = (g.TR || {})[l] || {}, out = new Set();
    recorre(root, (k) => { if (!(k in d) && /\p{L}{2}/u.test(k) && !/^[\d\s.,€%+-]+$/.test(k)) out.add(k); });
    return [...out];
  }
  g.I18N = { LLENGUES, posa, t, tradueix, vigila, falten, get llengua() { return L; }, delSistema };
})(typeof window !== 'undefined' ? window : globalThis);

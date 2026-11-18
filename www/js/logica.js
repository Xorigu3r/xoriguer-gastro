/* Xoriguer Gastro — lògica pura (sense interfície). Es prova amb `node test.mjs`.
 *
 * Model de dades (dades.json):
 *   ingredients[]: {id, nom, familia, unitat (kg|g|l|ml|cl|u), preu (€ per unitat, sense IVA), rend (%),
 *                   prov (id proveïdor), ref, allergens[codis], traces[codis], nutri{kcal,prot,greix,sat,carbo,sucres,fibra,sal} per 100 g,
 *                   gU (pes d'una peça, g: receptes en peces si es compra a pes i al revés), zona (on es guarda),
 *                   estoc, minim, maxim, hist[{d,p}], preusProv{idProv:{p,d}}, orientatiu (preu de la base, encara no real), actiu}
 *   receptes[]:    {id, nom, tipus ('plat'|'elab'|'article'), cat, pvp (amb IVA), iva, racions, rendQ, rendU (per a 'elab'),
 *                   linies[{t:'i'|'r', id, q, u}], passos, notes, temps, conserva (dies), traces[], carta, obj (marge objectiu %), foto,
 *                   partida (estació de treball), mides[{nom, f, pvp}] (tapa, mitja…), revisat (data)}
 *   proveidors[]:  {id, nom, tel, email, contacte, dies, minimComanda, notes}
 *   compres[]:     {id, data, prov, num, linies[{ing, q, preu}], base, iva, total, nota}
 *   vendes{}:      {'AAAA-MM-DD': {idRecepta: unitats}}
 *   mermes[]:      {id, data, ing, q, cost, motiu}
 *   inventaris[]:  {id, data, valors{idIng: quantitat}, valor}
 *   menus[{id, nom, preu, primers[], segons[], postres[], inclou, extra (€/comensal), obj}] (plats lligats per nom),
 *   appcc{equips[], registres[]}, costosFixos{}, ajustos{}
 */
'use strict';
(function (g) {
  // ── Al·lèrgens (Reglament UE 1169/2011, annex II) ─────────────────────────
  const ALLERGENS = [
    { k: 'gluten', nom: 'Gluten', ic: '🌾', c: '#C8902E' },
    { k: 'crustacis', nom: 'Crustacis', ic: '🦐', c: '#E5533D' },
    { k: 'ous', nom: 'Ous', ic: '🥚', c: '#E9B949' },
    { k: 'peix', nom: 'Peix', ic: '🐟', c: '#4F8EF7' },
    { k: 'cacauets', nom: 'Cacauets', ic: '🥜', c: '#B7793E' },
    { k: 'soja', nom: 'Soja', ic: '🫘', c: '#6BAF4F' },
    { k: 'llet', nom: 'Llet i làctics', ic: '🥛', c: '#9DB7D5' },
    { k: 'closca', nom: 'Fruits de closca', ic: '🌰', c: '#9C6B3F' },
    { k: 'api', nom: 'Api', ic: '🥬', c: '#4CC38A' },
    { k: 'mostassa', nom: 'Mostassa', ic: '🟡', c: '#D9B300' },
    { k: 'sesam', nom: 'Sèsam', ic: '⚪', c: '#C9B48A' },
    { k: 'sulfits', nom: 'Sulfits', ic: '🍷', c: '#9B4D7A' },
    { k: 'tramussos', nom: 'Tramussos', ic: '🌼', c: '#E0B83A' },
    { k: 'molluscs', nom: 'Mol·luscs', ic: '🦑', c: '#7C5CD6' },
  ];
  const ALG = Object.fromEntries(ALLERGENS.map((a) => [a.k, a]));
  // Noms antics (Raconet / v2) → codi
  const ALG_ANTICS = {
    gluten: 'gluten', crustacis: 'crustacis', ous: 'ous', peix: 'peix', cacauets: 'cacauets', soja: 'soja',
    lactics: 'llet', 'làctics': 'llet', llet: 'llet', 'fruita closca': 'closca', 'fruits secs': 'closca',
    'fruits de closca': 'closca', api: 'api', mostassa: 'mostassa', sesam: 'sesam', 'sèsam': 'sesam',
    sulfits: 'sulfits', 'diòxid sofre': 'sulfits', llobarro: 'tramussos', tramussos: 'tramussos',
    molluscs: 'molluscs', 'mol·luscs': 'molluscs',
  };

  const CATEGORIES = ['Entrants', 'Amanides', 'Tapes', 'Entrepans', 'Hamburgueses', 'Plats principals',
    'Carns', 'Peixos', 'Pasta i arròs', 'Plats combinats', 'Postres', 'Begudes', 'Cafès', 'Vins', 'Altres'];
  const FAMILIES = ['Carn', 'Peix i marisc', 'Fruita i verdura', 'Làctics i ous', 'Pa i cereals', 'Rebost',
    'Olis i greixos', 'Condiments i espècies', 'Congelats', 'Begudes', 'Vins i licors', 'Elaborats', 'Neteja i envasos', 'Altres'];
  // Marge brut objectiu (%) per categoria (sobre el preu sense IVA)
  const OBJECTIUS = { Entrants: 70, Amanides: 72, Tapes: 72, Entrepans: 68, Hamburgueses: 68, 'Plats principals': 68,
    Carns: 65, Peixos: 65, 'Pasta i arròs': 75, 'Plats combinats': 68, Postres: 75, Begudes: 78, Cafès: 85, Vins: 65, Altres: 68 };

  // ── Unitats ────────────────────────────────────────────────────────────────
  const UNITATS = { kg: ['m', 1000], g: ['m', 1], l: ['v', 1000], ml: ['v', 1], cl: ['v', 10], u: ['u', 1] };
  const compatibles = (a, b) => !!(UNITATS[a] && UNITATS[b] && UNITATS[a][0] === UNITATS[b][0]);
  /** Converteix q de la unitat `de` a la unitat `a` (si són compatibles). */
  function conv(q, de, a) {
    if (!de || de === a) return q;
    if (!compatibles(de, a)) return q;
    return (q * UNITATS[de][1]) / UNITATS[a][1];
  }
  const unitatsPer = (u) => Object.keys(UNITATS).filter((x) => compatibles(x, u));
  const PARTIDES = ['Cuina freda', 'Cuina calenta', 'Planxa i brasa', 'Fregidora', 'Pastisseria', 'Barra'];
  const ZONES = ['Cambra', 'Congelador', 'Magatzem sec', 'Barra', 'Celler'];
  /** Quantitat `q` en la unitat `u` passada a la unitat de l'ingredient. Amb el pes per peça (gU)
   *  permet escriure «2 u» d'un producte que es compra a kg, o «150 g» d'un que es compra per unitats. */
  function qIng(q, u, ing) {
    const de = u || ing.unitat, a = ing.unitat;
    if (de === a || compatibles(de, a)) return conv(q, de, a);
    const gU = num(ing.gU, 0);
    if (!(gU > 0) || !UNITATS[de] || !UNITATS[a]) return q;
    if (de === 'u') return conv(q * gU, UNITATS[a][0] === 'v' ? 'ml' : 'g', a); // ml ≈ g
    if (a === 'u') return (q * UNITATS[de][1]) / gU;
    return q;
  }
  /** Unitats que es poden fer servir per a un ingredient a les receptes. */
  const unitatsIng = (ing) => num(ing.gU, 0) > 0
    ? [...new Set([...unitatsPer(ing.unitat), ...(ing.unitat === 'u' ? ['g', 'kg'] : ['u'])])] : unitatsPer(ing.unitat);

  const num = (v, def = 0) => {
    if (typeof v === 'number') return Number.isFinite(v) ? v : def;
    const n = parseFloat(String(v ?? '').replace(/\s/g, '').replace('€', '').replace(',', '.'));
    return Number.isFinite(n) ? n : def;
  };
  const r2 = (x) => Math.round(x * 100) / 100;
  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
  let _n = 0;
  const uid = (p = '') => p + Date.now().toString(36) + (++_n).toString(36) + Math.random().toString(36).slice(2, 5);
  const avui = () => isoData(new Date());
  function isoData(d) {
    const z = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
  }
  function sumaDies(iso, n) {
    const [y, m, d] = iso.split('-').map(Number);
    return isoData(new Date(y, m - 1, d + n));
  }

  // ── Context (índexs) ───────────────────────────────────────────────────────
  function context(D) {
    return {
      D,
      ing: new Map((D.ingredients || []).map((i) => [i.id, i])),
      rec: new Map((D.receptes || []).map((r) => [r.id, r])),
      prov: new Map((D.proveidors || []).map((p) => [p.id, p])),
      _cost: new Map(),
    };
  }

  const preuReal = (ing) => num(ing.preu) / (Math.min(100, Math.max(1, num(ing.rend, 100) || 100)) / 100);

  /** Cost d'una unitat de rendiment d'una elaboració (€/rendU). */
  function costUnitatElab(rec, C, pila) {
    const q = num(rec.rendQ, 0) || 1;
    return costRecepta(rec, C, pila) / q;
  }

  /** Cost d'una línia (€). */
  function costLinia(l, C, pila = []) {
    const q = num(l.q);
    if (l.t === 'r') {
      const sub = C.rec.get(l.id);
      if (!sub || pila.includes(sub.id)) return 0;
      return costUnitatElab(sub, C, pila) * conv(q, l.u || sub.rendU, sub.rendU || l.u);
    }
    const ing = C.ing.get(l.id);
    if (!ing) return 0;
    return preuReal(ing) * qIng(q, l.u, ing);
  }

  /** Cost total de la recepta (tota la tanda, no per ració). Protegit contra cicles. */
  function costRecepta(rec, C, pila = []) {
    if (!rec) return 0;
    if (C._cost.has(rec.id) && !pila.length) return C._cost.get(rec.id);
    const p2 = pila.concat(rec.id);
    let t = 0;
    for (const l of rec.linies || []) t += costLinia(l, C, p2);
    if (!pila.length) C._cost.set(rec.id, t);
    return t;
  }
  const racions = (rec) => Math.max(1, num(rec.racions, 1) || 1);
  const costRacio = (rec, C) => costRecepta(rec, C) / racions(rec);
  const pvpNet = (rec, ivaDef = 10) => num(rec.pvp) / (1 + num(rec.iva ?? ivaDef, ivaDef) / 100);

  /** Indicadors econòmics per ració (marges sobre el preu sense IVA). */
  function economia(rec, C, ivaDef = 10) {
    const cost = costRacio(rec, C);
    const net = pvpNet(rec, ivaDef);
    const marge = net - cost;
    const fc = net > 0 ? (cost / net) * 100 : 0;
    const obj = num(rec.obj, 0) || OBJECTIUS[rec.cat] || 68;
    return { cost, net, pvp: num(rec.pvp), marge, fc, margePct: net > 0 ? 100 - fc : 0, obj,
      estat: net <= 0 ? 'sense' : 100 - fc >= obj ? 'ok' : 100 - fc >= obj - 8 ? 'just' : 'baix',
      pvpSuggerit: pvpPerMarge(cost, obj, num(rec.iva ?? ivaDef, ivaDef)) };
  }
  /** Economia de cada mida de ració (tapa, mitja…): cost proporcional i el seu preu. */
  function economiaMides(rec, C, ivaDef = 10) {
    const base = costRacio(rec, C), iva = num(rec.iva ?? ivaDef, ivaDef);
    const obj = num(rec.obj, 0) || OBJECTIUS[rec.cat] || 68;
    return (rec.mides || []).map((m) => {
      const f = num(m.f, 1) || 1, cost = base * f, net = num(m.pvp) / (1 + iva / 100), fc = net > 0 ? (cost / net) * 100 : 0;
      return { nom: m.nom, f, pvp: num(m.pvp), cost, net, marge: net - cost, fc, margePct: net > 0 ? 100 - fc : 0,
        estat: net <= 0 ? 'sense' : 100 - fc >= obj ? 'ok' : 100 - fc >= obj - 8 ? 'just' : 'baix', pvpSuggerit: pvpPerMarge(cost, obj, iva) };
    });
  }
  /** PVP (amb IVA) per obtenir un marge `obj` %, arrodonit a 0,05 € (o 0,10 si > 10 €). */
  function pvpPerMarge(cost, obj, iva = 10, arrodonir = true) {
    if (obj >= 100 || cost <= 0) return 0;
    const p = (cost / (1 - obj / 100)) * (1 + iva / 100);
    if (!arrodonir) return p;
    const pas = p >= 10 ? 0.1 : 0.05;
    return Math.round(Math.ceil(p / pas - 1e-9) * pas * 100) / 100;
  }

  /** Al·lèrgens de la recepta (recursiu), més traces declarades. */
  function allergens(rec, C, pila = []) {
    const s = new Set(), tr = new Set(rec.traces || []);
    for (const l of rec.linies || []) {
      if (l.t === 'r') {
        const sub = C.rec.get(l.id);
        if (sub && !pila.includes(sub.id)) {
          const a = allergens(sub, C, pila.concat(rec.id));
          a.conte.forEach((x) => s.add(x)); a.traces.forEach((x) => tr.add(x));
        }
      } else {
        const ing = C.ing.get(l.id);
        if (ing) { (ing.allergens || []).forEach((x) => s.add(x)); (ing.traces || []).forEach((x) => tr.add(x)); }
      }
    }
    s.forEach((x) => tr.delete(x));
    const ordre = (a) => ALLERGENS.map((x) => x.k).filter((k) => a.has(k));
    return { conte: ordre(s), traces: ordre(tr) };
  }

  // ── Nutrició ──────────────────────────────────────────────────────────────
  const CAMPS_NUTRI = ['kcal', 'prot', 'greix', 'sat', 'carbo', 'sucres', 'fibra', 'sal'];
  function grams(q, u, ing) {
    const uu = u || ing.unitat;
    if (UNITATS[uu] && UNITATS[uu][0] !== 'u') return q * UNITATS[uu][1]; // ml ≈ g
    const gU = num(ing.gU, 0);
    return gU ? q * gU : null;
  }
  function nutriIng(ing, base) {
    if (ing.nutri && Object.keys(ing.nutri).some((k) => num(ing.nutri[k], NaN) === num(ing.nutri[k], NaN))) return ing.nutri;
    return base ? base(ing.nom) : null;
  }
  /** Nutrició de tota la tanda: {tot{...}, grams, falten[noms]} */
  function nutricio(rec, C, base, pila = []) {
    const tot = Object.fromEntries(CAMPS_NUTRI.map((k) => [k, 0]));
    let gTot = 0; const falten = [];
    for (const l of rec.linies || []) {
      const q = num(l.q);
      if (l.t === 'r') {
        const sub = C.rec.get(l.id);
        if (!sub || pila.includes(sub.id)) continue;
        const n = nutricio(sub, C, base, pila.concat(rec.id));
        const f = conv(q, l.u || sub.rendU, sub.rendU) / (num(sub.rendQ, 1) || 1);
        CAMPS_NUTRI.forEach((k) => { tot[k] += n.tot[k] * f; });
        gTot += n.grams * f; falten.push(...n.falten);
        continue;
      }
      const ing = C.ing.get(l.id);
      if (!ing) continue;
      const gr = grams(q, l.u, ing);
      const nb = nutriIng(ing, base);
      if (gr == null || !nb) { falten.push(ing.nom); continue; }
      gTot += gr * (num(ing.rend, 100) / 100 || 1);
      CAMPS_NUTRI.forEach((k) => { tot[k] += (num(nb[k]) * gr) / 100; });
    }
    return { tot, grams: gTot, falten: [...new Set(falten)] };
  }
  /** Semàfor per 100 g (criteris FSA): 'verd' | 'groc' | 'vermell' */
  function semafor(camp, per100) {
    const L = { greix: [3, 17.5], sat: [1.5, 5], sucres: [5, 22.5], sal: [0.3, 1.5] }[camp];
    if (!L) return '';
    return per100 <= L[0] ? 'verd' : per100 > L[1] ? 'vermell' : 'groc';
  }

  // ── Explosió de receptes (producció, consum teòric) ──────────────────────
  /** Quantitats d'ingredient (en la seva unitat) per fer `n` racions de la recepta. Expandeix sub-receptes. */
  function explota(rec, n, C, acc = new Map(), pila = []) {
    if (!rec || pila.includes(rec.id)) return acc;
    const f = n / racions(rec);
    for (const l of rec.linies || []) {
      const q = num(l.q) * f;
      if (l.t === 'r') {
        const sub = C.rec.get(l.id);
        if (!sub) continue;
        const qU = conv(q, l.u || sub.rendU, sub.rendU);
        const tandes = qU / (num(sub.rendQ, 1) || 1);
        explota(sub, tandes * racions(sub), C, acc, pila.concat(rec.id));
      } else {
        const ing = C.ing.get(l.id);
        if (!ing) continue;
        acc.set(ing.id, (acc.get(ing.id) || 0) + qIng(q, l.u, ing));
      }
    }
    return acc;
  }
  /** Consum teòric d'ingredients per unes vendes {idRecepta: unitats}. */
  function consumVendes(vendesDia, C) {
    const acc = new Map();
    for (const [id, q] of Object.entries(vendesDia || {})) {
      const r = C.rec.get(id);
      if (r && q) explota(r, q, C, acc);
    }
    return acc;
  }
  /** Aplica a l'estoc la diferència entre vendes abans i després (no descompta mai dues vegades). */
  function aplicaVendesEstoc(D, abans, despres) {
    const C = context(D);
    const a = consumVendes(abans, C), d = consumVendes(despres, C);
    const ids = new Set([...a.keys(), ...d.keys()]);
    for (const id of ids) {
      const ing = C.ing.get(id);
      if (ing) ing.estoc = r3(num(ing.estoc) - ((d.get(id) || 0) - (a.get(id) || 0)));
    }
  }
  const r3 = (x) => Math.round(x * 1000) / 1000;

  // ── Compres ───────────────────────────────────────────────────────────────
  /** Registra el preu nou a l'historial (un per dia) i l'aplica. */
  function nouPreu(ing, preu, data = avui()) {
    preu = num(preu);
    if (!(preu > 0)) return false;
    delete ing.orientatiu; // ja és un preu real
    const h = (ing.hist = ing.hist || []);
    if (!h.length && num(ing.preu) > 0 && Math.abs(num(ing.preu) - preu) > 1e-9) h.push({ d: ing._alta || data, p: num(ing.preu) });
    const ult = h[h.length - 1];
    if (ult && ult.d === data) ult.p = preu;
    else if (!ult || Math.abs(ult.p - preu) > 1e-9) h.push({ d: data, p: preu });
    if (h.length > 40) h.splice(0, h.length - 40);
    const canvi = Math.abs(num(ing.preu) - preu) > 1e-9;
    ing.preu = preu;
    return canvi;
  }
  /** Totals d'una compra. Les línies porten el preu unitari sense IVA. */
  function totalsCompra(c) {
    const base = (c.linies || []).reduce((s, l) => s + num(l.q) * num(l.preu), 0) || num(c.base);
    const iva = (c.linies || []).length ? (c.linies || []).reduce((s, l) => s + num(l.q) * num(l.preu) * num(l.iva ?? c.ivaPct ?? 10) / 100, 0)
      : base * num(c.ivaPct ?? 10) / 100;
    return { base: r2(base), iva: r2(iva), total: r2(base + iva) };
  }
  /** Aplica una compra: suma estoc i actualitza preus. `abans` = versió anterior (per editar sense duplicar). */
  function aplicaCompra(D, c, abans = null) {
    const C = context(D);
    if (abans) for (const l of abans.linies || []) {
      const ing = C.ing.get(l.ing); if (ing) ing.estoc = r3(num(ing.estoc) - num(l.q));
    }
    const canvis = [];
    for (const l of c.linies || []) {
      const ing = C.ing.get(l.ing); if (!ing) continue;
      ing.estoc = r3(num(ing.estoc) + num(l.q));
      const ant = num(ing.preu);
      if (nouPreu(ing, l.preu, c.data) && ant > 0) canvis.push({ nom: ing.nom, ant, nou: num(l.preu), pct: ((num(l.preu) - ant) / ant) * 100 });
      if (c.prov && !ing.prov) ing.prov = c.prov;
      if (c.prov && num(l.preu) > 0) {
        const pp = (ing.preusProv = ing.preusProv || {});
        if (!pp[c.prov] || pp[c.prov].d <= c.data) pp[c.prov] = { p: num(l.preu), d: c.data };
      }
    }
    return canvis;
  }

  // ── Estoc i comandes ─────────────────────────────────────────────────────
  function estatEstoc(ing) {
    const e = num(ing.estoc), m = num(ing.minim);
    if (m <= 0) return 'sense';
    if (e <= 0) return 'esgotat';
    if (e < m) return 'baix';
    return 'ok';
  }
  const valorEstoc = (D) => (D.ingredients || []).reduce((s, i) => s + Math.max(0, num(i.estoc)) * num(i.preu), 0);
  /** Proposta de comanda per proveïdor: fins al màxim (o 2× el mínim). */
  function proposaComanda(D) {
    const grups = new Map();
    for (const i of D.ingredients || []) {
      if (i.actiu === false) continue;
      const m = num(i.minim); if (m <= 0 || num(i.estoc) >= m) continue;
      const obj = num(i.maxim) > m ? num(i.maxim) : 2 * m;
      const q = Math.ceil((obj - num(i.estoc)) * 100) / 100;
      const k = i.prov || '';
      if (!grups.has(k)) grups.set(k, []);
      grups.get(k).push({ ing: i.id, nom: i.nom, unitat: i.unitat, q, preu: num(i.preu), imp: q * num(i.preu) });
    }
    return [...grups.entries()].map(([prov, linies]) => ({ prov, linies, total: linies.reduce((s, l) => s + l.imp, 0) }));
  }

  /** Ingredients que un altre proveïdor ha venut més barat (últims `dies`). */
  function estalvis(D, dies = 120, minPct = 3) {
    const C = context(D), desde = sumaDies(avui(), -dies), out = [];
    for (const i of D.ingredients || []) {
      const pp = i.preusProv || {}, actual = num(i.preu);
      if (!(actual > 0) || i.actiu === false) continue;
      let millor = null;
      for (const [prov, x] of Object.entries(pp)) {
        if (prov === i.prov || x.d < desde || !(x.p > 0)) continue;
        if (!millor || x.p < millor.p) millor = { prov, p: x.p, d: x.d };
      }
      if (millor && millor.p < actual * (1 - minPct / 100))
        out.push({ id: i.id, nom: i.nom, unitat: i.unitat, actual, provActual: C.prov.get(i.prov)?.nom || '', millor: millor.p,
          prov: millor.prov, provNom: C.prov.get(millor.prov)?.nom || '?', data: millor.d, pct: ((actual - millor.p) / actual) * 100 });
    }
    return out.sort((a, b) => b.pct - a.pct);
  }

  // ── Menús (menú del dia, grups, esdeveniments) ───────────────────────────
  const SECCIONS_MENU = [['primers', 'Primers'], ['segons', 'Segons'], ['postres', 'Postres']];
  /** Plats del menú, lligats a les receptes pel nom. */
  function platsMenu(m, C) {
    const per = new Map([...C.rec.values()].map((r) => [norm(r.nom), r]));
    return SECCIONS_MENU.map(([k, nom]) => ({ k, nom, plats: (m[k] || []).map((x) => ({ text: x, rec: per.get(norm(x)) || null })) }));
  }
  /** Cost per comensal: mitjana de cada secció (cada comensal en tria un) + extres (pa, beguda, cafè…). */
  function costMenu(m, C, ivaDef = 10) {
    const secc = platsMenu(m, C);
    let cost = num(m.extra), max = num(m.extra), lligats = 0, total = 0;
    for (const s of secc) {
      const cs = s.plats.filter((p) => p.rec).map((p) => (p.cost = costRacio(p.rec, C)));
      total += s.plats.length; lligats += cs.length;
      if (cs.length) { cost += cs.reduce((a, b) => a + b, 0) / cs.length; max += Math.max(...cs); }
    }
    const net = num(m.preu) / (1 + ivaDef / 100), fc = net > 0 ? (cost / net) * 100 : 0;
    const obj = num(m.obj, 0) || 65;
    return { secc, cost, max, net, fc, marge: net - cost, margePct: net > 0 ? 100 - fc : 0, obj, lligats, total,
      estat: net <= 0 ? 'sense' : 100 - fc >= obj ? 'ok' : 100 - fc >= obj - 8 ? 'just' : 'baix', pvpSuggerit: pvpPerMarge(cost, obj, ivaDef) };
  }
  /** Racions de cada plat per a `n` comensals (a parts iguals entre els plats de cada secció; només els que tenen recepta). */
  function produccioMenu(m, n, C) {
    const out = [];
    for (const s of platsMenu(m, C)) {
      for (const p of s.plats.filter((x) => x.rec)) { const q = Math.ceil(n / s.plats.length - 1e-9); if (q > 0) out.push({ rec: p.rec.id, n: q }); }
    }
    return out;
  }

  // ── Vendes i anàlisi ─────────────────────────────────────────────────────
  function diesPeriode(D, desde, fins) {
    return Object.keys(D.vendes || {}).filter((d) => d >= desde && d <= fins).sort();
  }
  function vendesPeriode(D, desde, fins) {
    const tot = {};
    for (const d of diesPeriode(D, desde, fins))
      for (const [id, q] of Object.entries(D.vendes[d])) tot[id] = (tot[id] || 0) + num(q);
    return tot;
  }
  /** Resum econòmic d'unes vendes agregades. */
  function resumVendes(D, vend) {
    const C = context(D), iva = num(D.ajustos?.iva, 10);
    let fact = 0, net = 0, cost = 0, uts = 0;
    const files = [];
    for (const [id, q] of Object.entries(vend)) {
      const r = C.rec.get(id); if (!r || !q) continue;
      const e = economia(r, C, iva);
      fact += e.pvp * q; net += e.net * q; cost += e.cost * q; uts += q;
      files.push({ id, nom: r.nom, cat: r.cat, q, pvp: e.pvp, fact: e.pvp * q, net: e.net * q, cost: e.cost * q, marge: (e.net - e.cost) * q, estat: e.estat });
    }
    return { fact, net, cost, marge: net - cost, fc: net ? (cost / net) * 100 : 0, uts, files: files.sort((a, b) => b.q - a.q) };
  }
  /** Enginyeria de menú (Kasavana i Smith). Marge de contribució sobre el preu sense IVA. */
  function enginyeriaMenu(D, vend, cat = '') {
    const C = context(D), iva = num(D.ajustos?.iva, 10);
    const plats = (D.receptes || []).filter((r) => r.tipus !== 'elab' && num(r.pvp) > 0 && (!cat || r.cat === cat));
    const files = plats.map((r) => {
      const e = economia(r, C, iva);
      return { id: r.id, nom: r.nom, cat: r.cat, q: num(vend[r.id]), cm: e.net - e.cost, fc: e.fc };
    }).filter((f) => f.q > 0 || plats.length <= 40);
    const totQ = files.reduce((s, f) => s + f.q, 0);
    if (!files.length || totQ <= 0) return { files: [], llindarPop: 0, cmMig: 0 };
    const llindarPop = 0.7 / files.length;
    const cmMig = files.reduce((s, f) => s + f.cm * f.q, 0) / totQ;
    for (const f of files) {
      f.mix = f.q / totQ;
      const pop = f.mix >= llindarPop, cm = f.cm >= cmMig;
      f.classe = pop && cm ? 'estrella' : pop ? 'cavall' : cm ? 'enigma' : 'gos';
      f.cmTot = f.cm * f.q;
    }
    return { files: files.sort((a, b) => b.cmTot - a.cmTot), llindarPop, cmMig };
  }
  /** Valor d'un inventari amb els preus actuals. */
  function valorInventari(D, inv) {
    const C = context(D);
    return Object.entries(inv.valors || {}).reduce((s, [id, q]) => s + num(q) * num(C.ing.get(id)?.preu), 0);
  }
  /** Food cost real entre dos inventaris: (inv. inicial + compres − inv. final) / vendes netes.
   *  Es compara amb el teòric (el que haurien costat les receptes venudes). */
  function foodCostReal(D, invIni, invFi) {
    const compres = (D.compres || []).filter((c) => c.data > invIni.data && c.data <= invFi.data);
    const comprat = compres.reduce((s, c) => s + totalsCompra(c).base, 0);
    const consum = num(invIni.valor ?? valorInventari(D, invIni)) + comprat - num(invFi.valor ?? valorInventari(D, invFi));
    const vend = vendesPeriode(D, sumaDies(invIni.data, 1), invFi.data);
    const r = resumVendes(D, vend);
    const mermes = (D.mermes || []).filter((m) => m.data > invIni.data && m.data <= invFi.data).reduce((s, m) => s + num(m.cost), 0);
    return { comprat, consum, vendesNet: r.net, costTeoric: r.cost,
      fcReal: r.net ? (consum / r.net) * 100 : 0, fcTeoric: r.fc, diferencia: consum - r.cost, mermes, dies: diesPeriode(D, sumaDies(invIni.data, 1), invFi.data).length };
  }
  /** Simulació: plats afectats si el preu dels ingredients `ids` (o tots, si buit) canvia un `pct` %. */
  function simula(D, ids, pct) {
    const D2 = { ...D, ingredients: (D.ingredients || []).map((i) => ((!ids.length || ids.includes(i.id)) ? { ...i, preu: num(i.preu) * (1 + pct / 100) } : i)) };
    const C1 = context(D), C2 = context(D2), iva = num(D.ajustos?.iva, 10);
    return (D.receptes || []).filter((r) => r.tipus !== 'elab').map((r) => {
      const a = economia(r, C1, iva), b = economia(r, C2, iva);
      return { id: r.id, nom: r.nom, costA: a.cost, costB: b.cost, mA: a.margePct, mB: b.margePct,
        pvpMantenir: b.cost > 0 && a.margePct < 100 ? pvpPerMarge(b.cost, a.margePct, num(r.iva ?? iva, iva)) : 0, pvp: a.pvp };
    }).filter((x) => Math.abs(x.costB - x.costA) > 1e-6).sort((x, y) => (y.costB - y.costA) - (x.costB - x.costA));
  }
  /** Últims canvis de preu (per ingredient) amb l'impacte en els plats. */
  function canvisPreu(D, desde = '') {
    const C = context(D);
    const out = [];
    for (const i of D.ingredients || []) {
      const h = i.hist || [];
      if (h.length < 2) continue;
      const a = h[h.length - 2], b = h[h.length - 1];
      if (b.d < desde || !(a.p > 0)) continue;
      const plats = (D.receptes || []).filter((r) => usaIngredient(r, i.id, C));
      out.push({ id: i.id, nom: i.nom, ant: a.p, nou: b.p, pct: ((b.p - a.p) / a.p) * 100, data: b.d, plats: plats.map((p) => p.nom) });
    }
    return out.sort((x, y) => Math.abs(y.pct) - Math.abs(x.pct));
  }
  /** Ingredients amb preu orientatiu que fa servir la recepta (també dins de les elaboracions). */
  function orientatius(rec, C, pila = [], acc = new Map()) {
    for (const l of rec.linies || []) {
      if (l.t === 'r') { const s = C.rec.get(l.id); if (s && !pila.includes(s.id)) orientatius(s, C, pila.concat(rec.id), acc); }
      else { const i = C.ing.get(l.id); if (i && i.orientatiu) acc.set(i.id, i); }
    }
    return [...acc.values()];
  }
  function usaIngredient(rec, idIng, C, pila = []) {
    for (const l of rec.linies || []) {
      if (l.t === 'i' && l.id === idIng) return true;
      if (l.t === 'r') {
        const s = C.rec.get(l.id);
        if (s && !pila.includes(s.id) && usaIngredient(s, idIng, C, pila.concat(rec.id))) return true;
      }
    }
    return false;
  }
  /** Avisos per al tauler. */
  function avisos(D) {
    const C = context(D), iva = num(D.ajustos?.iva, 10), out = [];
    const esg = (D.ingredients || []).filter((i) => estatEstoc(i) === 'esgotat');
    const baix = (D.ingredients || []).filter((i) => estatEstoc(i) === 'baix');
    if (esg.length) out.push({ niv: 'alt', tipus: 'estoc', text: 'Esgotats', items: esg.map((i) => i.nom), anar: 'estoc' });
    if (baix.length) out.push({ niv: 'mig', tipus: 'estoc', text: 'Per sota del mínim', items: baix.map((i) => i.nom), anar: 'comandes' });
    const baixMarge = (D.receptes || []).filter((r) => r.tipus !== 'elab' && num(r.pvp) > 0 && economia(r, C, iva).estat === 'baix');
    if (baixMarge.length) out.push({ niv: 'mig', tipus: 'marge', text: 'Plats per sota del marge objectiu', items: baixMarge.map((r) => r.nom), anar: 'receptes' });
    const pujades = canvisPreu(D, sumaDies(avui(), -30)).filter((c) => c.pct >= 5);
    if (pujades.length) out.push({ niv: 'mig', tipus: 'preu', text: 'Pujades de preu (30 dies)', items: pujades.map((c) => `${c.nom} +${c.pct.toFixed(0)}%`), anar: 'analisi' });
    const sensePreu = (D.ingredients || []).filter((i) => !(num(i.preu) > 0) && i.actiu !== false);
    if (sensePreu.length) out.push({ niv: 'alt', tipus: 'preu', text: 'Ingredients sense preu', items: sensePreu.map((i) => i.nom), anar: 'ingredients' });
    const senseRecepta = (D.receptes || []).filter((r) => r.tipus !== 'article' && !(r.linies || []).length);
    if (senseRecepta.length) out.push({ niv: 'baix', tipus: 'recepta', text: 'Plats sense ingredients', items: senseRecepta.map((r) => r.nom), anar: 'receptes' });
    const ori = (D.ingredients || []).filter((i) => i.orientatiu && i.actiu !== false);
    if (ori.length) {
      out.push({ niv: 'mig', tipus: 'preu', text: 'Ingredients amb preu orientatiu: posa-hi el preu real', items: ori.map((i) => i.nom), anar: 'ingredients' });
      const pl = (D.receptes || []).filter((r) => r.tipus !== 'elab' && orientatius(r, C).length);
      if (pl.length) out.push({ niv: 'mig', tipus: 'marge', text: 'Plats calculats amb preus orientatius', items: pl.map((r) => r.nom), anar: 'receptes' });
    }
    const est = estalvis(D);
    if (est.length) out.push({ niv: 'baix', tipus: 'preu', text: 'Més barat a un altre proveïdor', items: est.map((e) => `${e.nom} −${e.pct.toFixed(0)}% (${e.provNom})`), anar: 'ingredients' });
    const vell = sumaDies(avui(), -365);
    const perRevisar = (D.receptes || []).filter((r) => r.revisat && r.revisat < vell);
    if (perRevisar.length) out.push({ niv: 'baix', tipus: 'recepta', text: "Fitxes sense revisar fa més d'un any", items: perRevisar.map((r) => r.nom), anar: 'receptes' });
    const ap = D.appcc || {};
    const fora = (ap.registres || []).filter((x) => x.data === avui() && x.fora);
    if (fora.length) out.push({ niv: 'alt', tipus: 'appcc', text: 'Temperatures fora de rang avui', items: fora.map((x) => (ap.equips || []).find((e) => e.id === x.equip)?.nom || '?'), anar: 'appcc' });
    return out;
  }

  // ── Dades noves i migració ───────────────────────────────────────────────
  function buides() {
    return {
      _ver: 3, ingredients: [], receptes: [], proveidors: [], compres: [], vendes: {}, mermes: [], inventaris: [],
      menus: [], appcc: { equips: [], registres: [] }, costosFixos: {},
      ajustos: { local: '', iva: 10, moneda: '€', idioma: 'ca', objectius: { ...OBJECTIUS }, adreca: '', telefon: '', urlCarta: '', diesConserva: 3 },
    };
  }
  /** Completa claus i valors (fitxers antics o editats a mà). */
  function completa(D) {
    const B = buides();
    for (const k of Object.keys(B)) if (D[k] == null) D[k] = B[k];
    D.ajustos = { ...B.ajustos, ...D.ajustos, objectius: { ...OBJECTIUS, ...(D.ajustos || {}).objectius } };
    D.appcc = { equips: [], registres: [], ...D.appcc };
    for (const i of D.ingredients) {
      i.unitat = UNITATS[i.unitat] ? i.unitat : 'u';
      i.preu = num(i.preu); i.rend = Math.min(100, Math.max(1, num(i.rend, 100) || 100));
      i.allergens = (i.allergens || []).filter((k) => ALG[k]); i.traces = (i.traces || []).filter((k) => ALG[k]);
      i.estoc = num(i.estoc); i.minim = num(i.minim);
    }
    for (const r of D.receptes) {
      r.tipus = r.tipus || 'plat'; r.linies = (r.linies || []).filter((l) => l && l.id != null);
      r.racions = racions(r); if (r.carta == null) r.carta = r.tipus !== 'elab';
    }
    D._ver = 3;
    return D;
  }
  const UNI_ANTIGA = { kg: 'kg', g: 'g', l: 'l', litre: 'l', ml: 'ml', cl: 'cl' };
  const CAT_ANTIGA = { 'entrepa fred': 'Entrepans', 'entrepa calent': 'Entrepans', entrepa: 'Entrepans', hamburguesa: 'Hamburgueses',
    amanida: 'Amanides', tapa: 'Tapes', 'plat combinat': 'Plats combinats', postres: 'Postres', beguda: 'Begudes',
    'beguda alcoholica': 'Vins', altres: 'Altres', 'elaboració': 'Altres' };
  const FAM_ANTIGA = { carn: 'Carn', lactics: 'Làctics i ous', ous: 'Làctics i ous', peix: 'Peix i marisc', verdura: 'Fruita i verdura',
    'pa/cereal': 'Pa i cereals', condiment: 'Condiments i espècies', 'oli/greix': 'Olis i greixos', elaborat: 'Elaborats',
    beguda: 'Begudes', 'beguda alcoholica': 'Vins i licors', altres: 'Altres' };
  /** Importa el fitxer del Raconet Gastronomia / Xoriguer Gastro 2 (raconet_gestio.json). */
  function migraRaconet(R) {
    const D = buides();
    const provs = new Map();
    const provId = (nom) => {
      nom = String(nom || '').trim(); if (!nom) return '';
      const k = norm(nom);
      if (!provs.has(k)) { const p = { id: 'p' + (provs.size + 1), nom }; provs.set(k, p); D.proveidors.push(p); }
      return provs.get(k).id;
    };
    const algs = (l) => [...new Set((l || []).map((a) => ALG_ANTICS[norm(a)] || ALG_ANTICS[String(a).toLowerCase()]).filter(Boolean))];
    const elabDe = new Map();
    for (const i of R.ingredients || []) {
      const u = UNI_ANTIGA[String(i.unitat || '').toLowerCase()] || 'u';
      const ing = { id: 'i' + i.id, nom: i.nom, familia: FAM_ANTIGA[norm(i.familia)] || 'Altres', unitat: u,
        format: u === 'u' && i.unitat && i.unitat !== 'unitat' ? i.unitat : '', preu: num(i.preu), rend: num(i.rend, 100) || 100,
        prov: provId(i.prov), allergens: algs(i.allergens), traces: [], estoc: num(i.estoc_actual), minim: num(i.estoc_minim),
        notes: i.desc_rac || '', hist: (i.historial || []).map((h) => ({ d: h.data, p: num(h.preu) })).filter((h) => h.p > 0) };
      if (i.g_unitat) ing.gU = num(i.g_unitat);
      if (i.nutri && Object.keys(i.nutri).length) ing.nutri = { ...i.nutri };
      if (i.elab_plat) elabDe.set(ing.id, { plat: 'r' + i.elab_plat, q: num(i.elab_qty, 1) || 1, u });
      D.ingredients.push(ing);
    }
    for (const p of R.plats || []) {
      const cat = CAT_ANTIGA[norm(p.cat)] || (CATEGORIES.includes(p.cat) ? p.cat : 'Altres');
      const elab = p.cat === 'Elaboració';
      D.receptes.push({ id: 'r' + p.id, nom: p.nom, tipus: elab ? 'elab' : 'plat', cat, pvp: num(p.preu), iva: 10,
        racions: num(p.racions, 1) || 1, linies: (p.ingredients || []).map((l) => ({ t: 'i', id: 'i' + l.ingId, q: num(l.qty) })),
        desc: p.desc || '', carta: elab ? false : p.a_carta !== false, obj: num(p.obj, 0) || undefined, traces: [] });
    }
    // Ingredients que eren elaboracions: les línies apunten directament a la recepta
    for (const [idIng, e] of elabDe) {
      const r = D.receptes.find((x) => x.id === e.plat);
      if (!r) continue;
      r.tipus = 'elab'; r.rendQ = e.q; r.rendU = e.u === 'u' ? 'u' : e.u; r.carta = false;
      for (const x of D.receptes) for (const l of x.linies) if (l.t === 'i' && l.id === idIng) { l.t = 'r'; l.id = r.id; l.u = r.rendU; }
    }
    for (const a of R.articles || []) {
      if (D.ingredients.some((i) => norm(i.nom) === norm(a.nom))) continue;
      const ing = { id: 'ia' + a.id, nom: a.nom, familia: 'Begudes', unitat: 'u', preu: num(a.preu_compra), rend: 100,
        allergens: [], traces: [], estoc: num(a.estoc_actual), minim: num(a.estoc_minim) };
      D.ingredients.push(ing);
      D.receptes.push({ id: 'ra' + a.id, nom: a.nom, tipus: 'article', cat: /caf/i.test(a.cat) ? 'Cafès' : /licor|cerves/i.test(a.cat) ? 'Vins' : 'Begudes',
        pvp: num(a.preu), iva: 10, racions: 1, linies: [{ t: 'i', id: ing.id, q: 1 }], carta: !!a.a_carta, traces: [] });
    }
    for (const [d, v] of Object.entries(R.vendes || {})) {
      D.vendes[d] = {};
      for (const [pid, q] of Object.entries(v)) if (num(q) > 0) D.vendes[d]['r' + pid] = num(q);
    }
    for (const m of R.menus || []) D.menus.push({ id: 'm' + (m.id ?? D.menus.length + 1), nom: m.nom, preu: num(m.preu),
      primers: m.primers || [], segons: m.segons || [], postres: m.postres || [], inclou: m.inclou || 'Pa, beguda i postres o cafè' });
    for (const f of R.factures_compra || []) D.compres.push({ id: uid('c'), data: f.data || avui(), prov: provId(f.prov), num: f.num || '',
      nota: f.concepte || '', linies: [], base: num(f.base), ivaPct: num(f.iva_pct, 10) });
    for (const m of R.mermes || []) D.mermes.push({ id: uid('m'), data: m.data, ing: 'i' + m.ingId, q: num(m.qty), cost: num(m.cost), motiu: m.motiu || '' });
    const cp = R.carta_prefs || {};
    D.ajustos.local = cp.nom || '';
    D.ajustos.urlCarta = cp.url_qr || '';
    const cf = R.costos_fixos || {};
    D.costosFixos = { personal: num(cf.personal_dia) * 30, lloguer: num(cf.lloguer_mes), llum: num(cf.llum_mes), aigua: num(cf.aigua_mes),
      asseguranca: num(cf.asseguranca_mes), altres: num(cf.brossa_mes) + num(cf.subministraments_mes) + num(cf.altres_mes) };
    return completa(D);
  }

  // ── Dades d'exemple (primer ús) ──────────────────────────────────────────
  function exemple() {
    const D = buides();
    D.ajustos.local = 'El meu bar';
    D.proveidors = [
      { id: 'p1', nom: 'Fruites Mercat', tel: '', dies: 'Dl, Dc, Dv' },
      { id: 'p2', nom: 'Carns Serra', tel: '', dies: 'Dm, Dj' },
      { id: 'p3', nom: 'Distribucions Begudes', tel: '', dies: 'Dl' },
      { id: 'p4', nom: 'Forn de pa', tel: '', dies: 'Cada dia' },
    ];
    const I = (id, nom, familia, unitat, preu, rend, prov, allergens = [], extra = {}) => ({ id, nom, familia, unitat, preu, rend, prov, allergens, traces: [], estoc: 0, minim: 0, ...extra });
    D.ingredients = [
      I('i1', 'Patata', 'Fruita i verdura', 'kg', 0.85, 80, 'p1', [], { estoc: 12, minim: 10 }),
      I('i2', 'Oli d\'oliva verge extra', 'Olis i greixos', 'l', 7.9, 100, 'p1', [], { estoc: 4, minim: 5 }),
      I('i3', 'Ou fresc', 'Làctics i ous', 'u', 0.22, 100, 'p1', ['ous'], { gU: 60, estoc: 60, minim: 36 }),
      I('i4', 'Tomàquet madur', 'Fruita i verdura', 'kg', 1.9, 90, 'p1', [], { estoc: 3, minim: 4 }),
      I('i5', 'Pebrot vermell', 'Fruita i verdura', 'kg', 2.4, 85, 'p1'),
      I('i6', 'All', 'Fruita i verdura', 'kg', 5.5, 85, 'p1'),
      I('i7', 'Pebre vermell picant', 'Condiments i espècies', 'kg', 18, 100, 'p1'),
      I('i8', 'Barra de pa', 'Pa i cereals', 'u', 0.45, 100, 'p4', ['gluten'], { gU: 250, estoc: 20, minim: 15 }),
      I('i9', 'Tonyina en oli', 'Peix i marisc', 'kg', 14.5, 100, 'p3', ['peix'], { estoc: 1.2, minim: 1 }),
      I('i10', 'Llom de porc', 'Carn', 'kg', 7.2, 88, 'p2', [], { estoc: 2.5, minim: 3 }),
      I('i11', 'Formatge semicurat', 'Làctics i ous', 'kg', 11.5, 95, 'p2', ['llet'], { estoc: 1, minim: 1 }),
      I('i12', 'Enciam', 'Fruita i verdura', 'u', 0.9, 70, 'p1', [], { gU: 400 }),
      I('i13', 'Farina de blat', 'Pa i cereals', 'kg', 0.9, 100, 'p1', ['gluten']),
      I('i14', 'Llet sencera', 'Làctics i ous', 'l', 0.95, 100, 'p1', ['llet']),
      I('i15', 'Sucre', 'Rebost', 'kg', 1.2, 100, 'p1'),
      I('i16', 'Refresc de cola 33 cl', 'Begudes', 'u', 0.48, 100, 'p3', [], { estoc: 48, minim: 24 }),
      I('i17', 'Cafè en gra', 'Begudes', 'kg', 16, 100, 'p3', [], { estoc: 2, minim: 1 }),
      I('i18', 'Pernil serrà', 'Carn', 'kg', 16.5, 90, 'p2'),
      I('i19', 'Sal', 'Condiments i espècies', 'kg', 0.6, 100, 'p1'),
    ];
    const d0 = sumaDies(avui(), -60), d1 = sumaDies(avui(), -6);
    for (const [id, a] of [['i10', 6.6], ['i2', 7.1], ['i9', 13.2], ['i4', 1.6]]) {
      const i = D.ingredients.find((x) => x.id === id); i.hist = [{ d: d0, p: a }, { d: d1, p: i.preu }];
    }
    const R = (id, nom, tipus, cat, pvp, linies, extra = {}) => ({ id, nom, tipus, cat, pvp, iva: 10, racions: 1, linies, traces: [], carta: tipus !== 'elab', ...extra });
    const L = (id, q, u) => ({ t: 'i', id, q, ...(u ? { u } : {}) });
    D.receptes = [
      R('r1', 'Salsa brava', 'elab', 'Altres', 0, [L('i2', 300, 'ml'), L('i7', 40, 'g'), L('i6', 50, 'g'), L('i13', 60, 'g'), L('i19', 10, 'g')],
        { rendQ: 1, rendU: 'l', conserva: 5, passos: 'Sofregir l\'all, afegir el pebre i la farina, mullar amb brou i reduir.' }),
      R('r2', 'Patates braves', 'plat', 'Tapes', 4.8, [L('i1', 250, 'g'), L('i2', 30, 'ml'), { t: 'r', id: 'r1', q: 60, u: 'ml' }, L('i19', 2, 'g')],
        { temps: 12, passos: 'Tallar, confitar a 140 °C i acabar a 180 °C. Salsa per sobre.' }),
      R('r3', 'Truita de patates', 'plat', 'Tapes', 15, [L('i1', 1, 'kg'), L('i3', 8), L('i2', 250, 'ml'), L('i19', 8, 'g')], { racions: 8, temps: 30 }),
      R('r4', 'Entrepà de tonyina', 'plat', 'Entrepans', 4.5, [L('i8', 0.5), L('i9', 70, 'g'), L('i4', 40, 'g'), L('i2', 5, 'ml')], { temps: 4 }),
      R('r5', 'Entrepà de llom amb formatge', 'plat', 'Entrepans', 5.5, [L('i8', 0.5), L('i10', 120, 'g'), L('i11', 30, 'g'), L('i2', 5, 'ml')], { temps: 6 }),
      R('r6', 'Amanida catalana', 'plat', 'Amanides', 9.5, [L('i12', 0.25), L('i4', 120, 'g'), L('i18', 40, 'g'), L('i3', 1), L('i2', 15, 'ml')], { temps: 8 }),
      R('r7', 'Flam d\'ou casolà', 'plat', 'Postres', 4.5, [L('i14', 500, 'ml'), L('i3', 4), L('i15', 120, 'g')], { racions: 6, temps: 50 }),
      R('r8', 'Refresc de cola', 'article', 'Begudes', 2.4, [L('i16', 1)]),
      R('r9', 'Cafè sol', 'article', 'Cafès', 1.5, [L('i17', 7, 'g')]),
      R('r10', 'Pa amb tomàquet i pernil', 'plat', 'Tapes', 7.5, [L('i8', 0.5), L('i4', 60, 'g'), L('i18', 50, 'g'), L('i2', 10, 'ml'), L('i19', 1, 'g')], { temps: 5 }),
    ];
    const PT = { r1: 'Cuina calenta', r2: 'Fregidora', r3: 'Cuina calenta', r4: 'Barra', r5: 'Barra', r6: 'Cuina freda', r7: 'Pastisseria', r8: 'Barra', r9: 'Barra', r10: 'Barra' };
    for (const r of D.receptes) r.partida = PT[r.id];
    D.receptes.find((r) => r.id === 'r2').mides = [{ nom: 'Mitja ració', f: 0.6, pvp: 3.2 }];
    const ZN = { Carn: 'Cambra', 'Peix i marisc': 'Cambra', 'Làctics i ous': 'Cambra', 'Fruita i verdura': 'Cambra', Begudes: 'Barra' };
    for (const i of D.ingredients) i.zona = i.id === 'i1' ? 'Magatzem sec' : ZN[i.familia] || 'Magatzem sec';
    D.ingredients.find((i) => i.id === 'i2').preusProv = { p1: { p: 7.9, d: sumaDies(avui(), -6) }, p3: { p: 7.3, d: sumaDies(avui(), -20) } };
    // vendes dels últims 35 dies (deterministes)
    const base = { r2: 9, r3: 6, r4: 7, r5: 5, r6: 2, r7: 3, r8: 14, r9: 22, r10: 4 };
    for (let k = 1; k <= 35; k++) {
      const d = sumaDies(avui(), -k), v = {};
      for (const [id, b] of Object.entries(base)) v[id] = Math.max(0, Math.round(b * (0.6 + ((k * 7 + id.length * 13 + b) % 9) / 10)));
      D.vendes[d] = v;
    }
    D.menus = [{ id: 'm1', nom: 'Menú del dia', preu: 13.5, primers: ['Amanida catalana', 'Patates braves', 'Crema de carbassa'], segons: ['Llom a la planxa amb patates', 'Lluç a la romana', 'Truita de patates'], postres: ['Flam d\'ou casolà', 'Fruita del temps'], inclou: 'Pa, beguda i postres o cafè', extra: 0.8, obj: 65, comensals: 30 }];
    D.appcc.equips = [{ id: 'e1', nom: 'Nevera 1', min: 0, max: 5 }, { id: 'e2', nom: 'Congelador', min: -25, max: -18 }, { id: 'e3', nom: 'Vitrina', min: 0, max: 8 }];
    D.costosFixos = { personal: 3800, lloguer: 1200, llum: 450, aigua: 80, asseguranca: 90, altres: 250 };
    // En l'idioma de la interfície
    const T = (x) => (g.I18N ? g.I18N.t(x) : x);
    D.ajustos.local = T(D.ajustos.local);
    for (const x of [...D.ingredients, ...D.receptes, ...D.proveidors, ...D.appcc.equips]) { x.nom = T(x.nom); if (x.partida) x.partida = T(x.partida); if (x.zona) x.zona = T(x.zona); for (const m of x.mides || []) m.nom = T(m.nom); if (x.passos) x.passos = T(x.passos); if (x.dies) x.dies = T(x.dies); }
    for (const m of D.menus) { m.nom = T(m.nom); m.inclou = T(m.inclou); for (const k of ['primers', 'segons', 'postres']) m[k] = m[k].map(T); }
    D.inventaris = [{ id: 'v1', data: sumaDies(avui(), -31), valors: { i1: 15, i2: 6, i3: 90, i8: 30, i9: 1.5, i10: 4, i11: 1.5, i16: 72, i17: 2.5 } }];
    D.compres = [{ id: 'c1', data: sumaDies(avui(), -6), prov: 'p2', num: 'A-1042', linies: [{ ing: 'i10', q: 5, preu: 7.2 }, { ing: 'i11', q: 2, preu: 11.5 }], ivaPct: 10 }];
    return completa(D);
  }

  const API = {
    ALLERGENS, ALG, ALG_ANTICS, CATEGORIES, FAMILIES, OBJECTIUS, UNITATS, CAMPS_NUTRI, PARTIDES, ZONES, SECCIONS_MENU,
    compatibles, conv, unitatsPer, num, r2, r3, norm, uid, avui, isoData, sumaDies,
    context, preuReal, costLinia, costRecepta, costRacio, costUnitatElab, pvpNet, economia, pvpPerMarge, racions,
    allergens, grams, nutricio, semafor, explota, consumVendes, aplicaVendesEstoc,
    nouPreu, totalsCompra, aplicaCompra, estatEstoc, valorEstoc, proposaComanda,
    qIng, unitatsIng, economiaMides, estalvis, platsMenu, costMenu, produccioMenu,
    diesPeriode, vendesPeriode, resumVendes, enginyeriaMenu, valorInventari, foodCostReal, simula, canvisPreu, usaIngredient, orientatius, avisos,
    buides, completa, migraRaconet, exemple,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  g.GL = API;
})(typeof window !== 'undefined' ? window : globalThis);

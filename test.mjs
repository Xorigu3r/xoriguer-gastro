// Proves de la lògica de Xoriguer Gastro:  node test.mjs
import { createRequire } from 'module';
import { readFileSync, existsSync } from 'fs';
import { homedir } from 'os';
const require = createRequire(import.meta.url);
const L = require('./www/js/logica.js');
const N = require('./www/js/nutri.js');

let ok = 0;
const prop = (a, b, msg, eps = 1e-6) => { if (Math.abs(a - b) > eps) throw new Error(`${msg}: ${a} ≠ ${b}`); ok++; };
const cert = (c, msg) => { if (!c) throw new Error(msg); ok++; };

// Unitats
prop(L.conv(250, 'g', 'kg'), 0.25, 'g→kg');
prop(L.conv(30, 'cl', 'l'), 0.3, 'cl→l');
prop(L.conv(3, 'u', 'kg'), 3, 'incompatibles no converteix');
prop(L.num('1,25 €'), 1.25, 'num amb coma');

// Exemple
const D = L.exemple();
const C = L.context(D);
const brava = C.rec.get('r1'), braves = C.rec.get('r2');
// Salsa: 0,3 l oli (7,9) + 0,04 kg pebre (18) + 0,05 kg all (5,5/0,85) + 0,06 kg farina (0,9) + 0,01 kg sal (0,6)
const costSalsa = 0.3 * 7.9 + 0.04 * 18 + 0.05 * 5.5 / 0.85 + 0.06 * 0.9 + 0.01 * 0.6;
prop(L.costRecepta(brava, C), costSalsa, 'cost salsa brava');
// Braves: 0,25 kg patata (0,85/0,8) + 0,03 l oli + 0,06 l salsa + sal
const costBraves = 0.25 * 0.85 / 0.8 + 0.03 * 7.9 + 0.06 * costSalsa + 0.002 * 0.6;
prop(L.costRacio(braves, C), costBraves, 'cost braves amb sub-recepta');
const e = L.economia(braves, C, 10);
prop(e.net, 4.8 / 1.1, 'preu sense IVA');
prop(e.fc, costBraves / (4.8 / 1.1) * 100, 'food cost %');
cert(e.pvpSuggerit > 0 && Math.abs(e.pvpSuggerit * 20 - Math.round(e.pvpSuggerit * 20)) < 1e-6, 'PVP suggerit arrodonit a 0,05');
prop(L.pvpPerMarge(1, 75, 10), 4.4, 'PVP per marge 75 %');
// Truita: 8 racions
prop(L.costRacio(C.rec.get('r3'), C), (1 * 0.85 / 0.8 + 8 * 0.22 + 0.25 * 7.9 + 0.008 * 0.6) / 8, 'cost per ració (8 racions)');

// Al·lèrgens recursius i traces
D.ingredients.find((i) => i.id === 'i7').traces = ['mostassa'];
let C2 = L.context(D);
const a = L.allergens(braves, C2);
cert(a.conte.includes('gluten') && a.traces.includes('mostassa'), 'al·lèrgens de la sub-recepta (farina) i traces');

// Cicle: no penja
brava.linies.push({ t: 'r', id: 'r2', q: 1 });
C2 = L.context(D);
cert(Number.isFinite(L.costRecepta(braves, C2)), 'cicle protegit');
brava.linies.pop();

// Explosió i estoc
C2 = L.context(D);
const ex = L.explota(braves, 10, C2);
prop(ex.get('i1'), 2.5, 'patata per 10 racions');
prop(ex.get('i2'), 0.3 + 10 * 0.06 * 0.3, 'oli directe + oli de la salsa');
const patata = D.ingredients.find((i) => i.id === 'i1');
const e0 = patata.estoc;
L.aplicaVendesEstoc(D, {}, { r2: 4 });
prop(patata.estoc, e0 - 1, 'descompte vendes');
L.aplicaVendesEstoc(D, { r2: 4 }, { r2: 4 });
prop(patata.estoc, e0 - 1, 'tornar a desar no descompta');
L.aplicaVendesEstoc(D, { r2: 4 }, { r2: 0 });
prop(patata.estoc, e0, 'esborrar vendes retorna estoc');

// Compres: estoc, preu i historial; editar sense duplicar
const llom = D.ingredients.find((i) => i.id === 'i10');
const st = llom.estoc;
const comp = { id: 'cx', data: L.avui(), prov: 'p2', linies: [{ ing: 'i10', q: 4, preu: 7.8 }], ivaPct: 10 };
const canvis = L.aplicaCompra(D, comp);
prop(llom.estoc, st + 4, 'compra suma estoc');
prop(llom.preu, 7.8, 'compra actualitza preu');
cert(canvis.length === 1 && canvis[0].pct > 0, 'compra avisa de la pujada');
L.aplicaCompra(D, { ...comp, linies: [{ ing: 'i10', q: 3, preu: 7.8 }] }, comp);
prop(llom.estoc, st + 3, 'editar compra no duplica');
const tc = L.totalsCompra({ linies: [{ q: 2, preu: 10 }], ivaPct: 10 });
prop(tc.total, 22, 'total compra amb IVA');

// Comanda
const prop1 = L.proposaComanda(D);
cert(prop1.length > 0 && prop1.every((g) => g.linies.every((l) => l.q > 0)), 'proposta de comanda');

// Enginyeria de menú
const vend = L.vendesPeriode(D, L.sumaDies(L.avui(), -30), L.avui());
const em = L.enginyeriaMenu(D, vend);
cert(em.files.length >= 5 && em.files.every((f) => ['estrella', 'cavall', 'enigma', 'gos'].includes(f.classe)), 'enginyeria de menú');
cert(!em.files.some((f) => f.id === 'r1'), 'les elaboracions no hi compten');

// Food cost real
const inv2 = { id: 'v2', data: L.avui(), valors: { i1: 5, i2: 3 } };
const fcr = L.foodCostReal(D, D.inventaris[0], inv2);
cert(fcr.vendesNet > 0 && Number.isFinite(fcr.fcReal) && fcr.costTeoric > 0, 'food cost real vs teòric');

// Simulador
const sim = L.simula(D, ['i2'], 20);
cert(sim.length >= 3 && sim.every((s) => s.costB > s.costA), 'simulador oli +20 %');

// Nutrició
const n = L.nutricio(C2.rec.get('r3'), C2, N.busca);
cert(n.falten.length === 0 && n.tot.kcal > 1000, 'nutrició truita (ous amb pes per unitat)');
cert(N.busca('Sal marina').sal === 98, 'sal');
cert(N.busca('Ou fresc').prot > 10 && N.busca('Oli d\'oliva').greix === 100, 'cerca nutricional');
cert(L.semafor('sal', 2) === 'vermell' && L.semafor('sucres', 3) === 'verd', 'semàfor');

// Avisos
cert(L.avisos(D).length > 0, 'avisos');

// Equivalències: peces d'un producte a pes i grams d'un producte per unitats
const ou = { unitat: 'u', gU: 60, preu: 0.25, rend: 100 }, pa = { unitat: 'kg', gU: 250, preu: 4, rend: 100 };
prop(L.qIng(120, 'g', ou), 2, '120 g d\'ou = 2 u');
prop(L.qIng(2, 'u', pa), 0.5, '2 barres de 250 g = 0,5 kg');
cert(L.unitatsIng(pa).includes('u') && !L.unitatsIng({ unitat: 'kg' }).includes('u'), 'unitats per ingredient');

// Mides de ració
const mid = L.economiaMides({ ...braves, mides: [{ nom: 'Mitja', f: 0.5, pvp: 3 }] }, C, 10)[0];
prop(mid.cost, costBraves / 2, 'cost mitja ració');

// Preus per proveïdor i estalvis
const D3 = L.exemple();
const oli = D3.ingredients.find((i) => i.id === 'i2');
oli.prov = 'p1';
L.aplicaCompra(D3, { id: 'cx', data: L.avui(), prov: 'p2', linies: [{ ing: 'i2', q: 1, preu: 6 }] });
cert(oli.preusProv.p2.p === 6, 'preu guardat per proveïdor');
oli.preu = 7.9;
cert(L.estalvis(D3).some((x) => x.id === 'i2' && x.prov === 'p2'), 'detecta proveïdor més barat');

// Menús
const menu = { preu: 13.2, primers: ['Amanida catalana', 'Inventat'], segons: ['Truita de patates'], postres: [], extra: 1 };
const cm = L.costMenu(menu, C, 10);
prop(cm.cost, 1 + L.costRacio(C.rec.get('r6'), C) + L.costRacio(C.rec.get('r3'), C), 'cost del menú per comensal');
cert(cm.lligats === 2 && cm.total === 3, 'plats lligats per nom');
const pm = L.produccioMenu(menu, 20, C);
cert(pm.find((x) => x.rec === 'r6').n === 10 && pm.find((x) => x.rec === 'r3').n === 20 && pm.length === 2, 'producció per comensals');

// Base de plats: tots els ingredients i elaboracions existeixen; afegir reaprofita i recalcula
globalThis.GL = L; globalThis.NUTRI = N.busca ? N : globalThis.NUTRI;
require('./www/js/base.js'); require('./www/js/plats.js');
const BASE = globalThis.BASE, PLATS = globalThis.PLATS;
const nomsBase = new Set(BASE.llista.map((x) => x[0]));
const nomsPlats = new Set(PLATS.llista.map((p) => p.noms[0]));
for (const p of PLATS.llista) for (const [nom] of p.linies)
  cert(nom[0] === '@' ? nomsPlats.has(nom.slice(1)) : nomsBase.has(nom), `plat «${p.noms[0]}»: falta «${nom}»`);
cert(PLATS.llista.every((p) => p.noms.length === 4 && p.noms.every(Boolean)), 'plats en 4 idiomes');
cert(BASE.llista.every((x) => x.length >= 8 && x.slice(0, 4).every(Boolean)), 'base en 4 idiomes');
const DB = L.buides();
DB.ingredients.push({ id: 'meu', nom: 'Patatas', unitat: 'kg', preu: 1, rend: 80, allergens: [], traces: [] }); // no coincideix → es crea
DB.ingredients.push({ id: 'oli', nom: 'Aceite de oliva virgen extra', unitat: 'l', preu: 8, rend: 100, allergens: [], traces: [] });
const creats = { ing: 0, rec: 0 };
const nB = PLATS.items().findIndex((x) => x.ca === 'Patates braves');
const idB = PLATS.afegeix(DB, nB, 'es', creats);
cert(creats.rec === 2 && DB.receptes.some((r) => r.nom === 'Salsa brava' && r.tipus === 'elab'), 'afegeix el plat i la seva elaboració');
cert(DB.receptes.find((r) => r.id === idB).nom === 'Patatas bravas', 'nom en la llengua triada');
cert(DB.receptes.find((r) => r.nom === 'Salsa brava').linies.some((l) => l.id === 'oli'), 'reaprofita l\'ingredient que ja tens (en un altre idioma)');
cert(PLATS.afegeix(DB, nB, 'es', creats) === idB && creats.rec === 2, 'no duplica un plat que ja tens');
for (const i of DB.ingredients) if (!i.preu) i.preu = 2;
const c1 = L.costRacio(DB.receptes.find((r) => r.id === idB), L.context(DB));
DB.ingredients.find((i) => i.id === 'oli').preu = 16;
const c2 = L.costRacio(DB.receptes.find((r) => r.id === idB), L.context(DB));
cert(c1 > 0 && c2 > c1, 'el cost del plat es recalcula si canvia el preu d\'un ingredient (també dins l\'elaboració)');
const DT = L.buides();
PLATS.items().forEach((x) => PLATS.afegeix(DT, x.n, 'ca'));
cert(DT.receptes.length === PLATS.llista.length && DT.receptes.every((r) => r.linies.length > 0), 'tots els plats s\'afegeixen sencers');

// Preus orientatius: tots els de la base en tenen; els plats nous queden marcats; el preu real treu la marca
cert(BASE.items().every((x) => x.preu > 0), 'tots els ingredients de la base tenen preu orientatiu');
const DO = L.buides();
const idT = PLATS.afegeix(DO, PLATS.items().findIndex((x) => x.ca === 'Truita de patates'), 'ca');
const CO = L.context(DO), truita = CO.rec.get(idT);
cert(L.costRacio(truita, CO) > 0.3 && L.orientatius(truita, CO).length === truita.linies.length, 'plat nou amb cost orientatiu i marcat');
cert(L.avisos(DO).some((a) => a.text.startsWith('Plats calculats amb preus orientatius')), 'avís de plats amb preus orientatius');
const ouO = DO.ingredients.find((i) => i.nom === 'Ou');
L.aplicaCompra(DO, { id: 'cO', data: L.avui(), prov: '', linies: [{ ing: ouO.id, q: 30, preu: 0.21 }] });
cert(!ouO.orientatiu && L.orientatius(truita, L.context(DO)).length === truita.linies.length - 1, 'la compra posa el preu real i treu la marca');
const fcPlats = PLATS.items().filter((x) => x.tipus !== 'elab').map((x) => { const D9 = L.buides(); const id = PLATS.afegeix(D9, x.n, 'ca'); const C9 = L.context(D9); return [x.ca, L.costRacio(C9.rec.get(id), C9)]; });
cert(fcPlats.every(([, c]) => c > 0.05 && c < 12), 'costos orientatius raonables: ' + fcPlats.filter(([, c]) => !(c > 0.05 && c < 12)).map((x) => x.join('=')).join(', '));

// Migració del Raconet (fitxer real si hi és, si no, un de mínim)
const real = homedir() + '/.tpv_bar/raconet_gestio.json';
const R = existsSync(real) ? JSON.parse(readFileSync(real, 'utf8')) : {
  ingredients: [{ id: 1, nom: 'Pa', unitat: 'barra', preu: 0.35, rend: 100, allergens: ['Gluten', 'Llobarro'], prov: 'Forn' },
    { id: 2, nom: 'Salsa', unitat: 'kg', preu: 3, elab_plat: 9, elab_qty: 2 }],
  plats: [{ id: 1, nom: 'Entrepà', cat: 'Entrepa', preu: 3.8, ingredients: [{ ingId: 1, qty: 1 }, { ingId: 2, qty: 0.05 }] },
    { id: 9, nom: 'Salsa', cat: 'Elaboració', preu: 0, ingredients: [{ ingId: 1, qty: 1 }] }],
  vendes: { '2026-01-01': { 1: 3 } }, articles: [{ id: 1, nom: 'Cola', preu: 2, preu_compra: 0.5, cat: 'Begudes' }],
};
const M = L.migraRaconet(R);
cert(M.receptes.length >= (R.plats || []).length && M.ingredients.length >= (R.ingredients || []).length, 'migració: comptes');
cert(M.ingredients.every((i) => i.allergens.every((k) => L.ALG[k])), 'migració: al·lèrgens com a codis');
if (!existsSync(real)) {
  cert(M.ingredients[0].allergens.includes('tramussos'), 'Llobarro → Tramussos');
  const ent = M.receptes.find((r) => r.nom === 'Entrepà');
  cert(ent.linies.some((l) => l.t === 'r' && l.id === 'r9'), 'elaboració antiga → línia de sub-recepta');
  cert(M.vendes['2026-01-01'].r1 === 3, 'vendes migrades');
}
console.log(`OK: ${ok} comprovacions` + (existsSync(real) ? ' (amb el fitxer real del Raconet)' : ''));

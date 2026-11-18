// Llista els textos catalans de la interfície que encara no tenen traducció.
// Ús: node eines/textos.mjs [es|fr|en]   (per defecte, els que falten en qualsevol llengua)
import { readFileSync, readdirSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
globalThis.window = globalThis;
require('../www/js/traduccions.js');
const TR = globalThis.TR;
const L = process.argv[2];
const fitxers = ['www/js/app.js', 'www/js/ui.js', 'www/js/dades.js', 'www/js/logica.js', ...readdirSync('www/js/vistes').map((f) => 'www/js/vistes/' + f)];
const NO = /^(#|\.|[a-z_]+$|[a-z]+[A-Z]|https?:|mailto|data:|var\(|[\d\s.,%€+-]+$|[a-z-]+:|M\d|[A-Z_]+$|\w+\.\w+$)/;
const vistos = new Set();
const re = /(['"`])((?:\\.|(?!\1)[^\\\n])*)\1/g;
for (const f of fitxers) {
  const src = readFileSync(f, 'utf8');
  for (const m of src.matchAll(re)) {
    let s = m[2].replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\n/g, '\n');
    if (m[1] === '`' && s.includes('${')) continue;
    s = s.replace(/\s+/g, ' ').trim();
    if (s.length < 2 || !/\p{L}{2}/u.test(s) || NO.test(s)) continue;
    if (/[{};]\s*$|=>|\(\)|^\w+\(|px|rgba|#[0-9a-f]{3}/i.test(s) && !/\{\w+\}/.test(s)) continue;
    if (/^(div|span|button|input|select|option|table|tbody|thead|tr|td|th|label|svg|path|textarea|img|kbd|h1|h2|h3|p|b|i|a|ol|li|iframe|datalist)(\.|#|$)/.test(s)) continue;
    vistos.add(s);
  }
}
const falten = [...vistos].filter((s) => (L ? !(s in (TR[L] || {})) : ['es', 'fr', 'en'].some((l) => !(s in (TR[l] || {})))));
for (const s of falten) console.log(JSON.stringify(s));
console.error(`# ${falten.length} de ${vistos.size}`);

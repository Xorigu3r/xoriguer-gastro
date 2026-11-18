/* Xoriguer Gastro — base nutricional orientativa per 100 g (o 100 ml). Fonts: BEDCA / USDA / etiquetes habituals.
 * Camps: kcal, prot, greix, sat (saturats), carbo, sucres, fibra, sal. Es busca per paraules clau del nom de l'ingredient. */
'use strict';
(function (g) {
  // [paraules clau (separades per |), kcal, prot, greix, sat, carbo, sucres, fibra, sal]
  const T = [
    ['farina|harina', 364, 10.3, 1, 0.2, 76.3, 0.3, 2.7, 0],
    ['barra de pa|pa de barra|baguette|pa blanc|pan', 265, 8.7, 1.3, 0.3, 54, 2, 2.7, 1.3],
    ['pa de motlle|pa de molde', 280, 9, 3.5, 0.8, 54, 4, 2.5, 1.2],
    ['arros|arroz', 360, 6.7, 0.7, 0.2, 80.4, 0.1, 1.4, 0],
    ['pasta|macarrons|espaguetis|fideus', 357, 12.5, 1.8, 0.4, 72.2, 3.6, 2.9, 0],
    ['patata|papa', 77, 2, 0.1, 0, 17.5, 0.8, 2.2, 0],
    ['tomaquet|tomate', 18, 0.9, 0.2, 0, 3.9, 2.6, 1.2, 0],
    ['ceba|cebolla', 40, 1.1, 0.1, 0, 9.3, 4.2, 1.7, 0],
    ['all|ajo', 149, 6.4, 0.5, 0.1, 33.1, 1, 2.1, 0],
    ['enciam|lechuga|lletuga', 15, 1.4, 0.2, 0, 2.9, 1.2, 1.3, 0],
    ['pebrot|pimiento', 31, 1, 0.3, 0, 6, 4.2, 2.1, 0],
    ['pastanaga|zanahoria', 41, 0.9, 0.2, 0, 9.6, 4.7, 2.8, 0.1],
    ['espinac', 23, 2.9, 0.4, 0.1, 3.6, 0.4, 2.2, 0.2],
    ['bolet|xampinyo|champin|seta', 22, 3.1, 0.3, 0.1, 3.3, 2, 1, 0],
    ['alberginia|berenjena', 25, 1, 0.2, 0, 5.9, 3.5, 3, 0],
    ['carbasso|calabacin', 17, 1.2, 0.3, 0.1, 3.1, 2.5, 1, 0],
    ['carbassa|calabaza', 26, 1, 0.1, 0, 6.5, 2.8, 0.5, 0],
    ['cogombre|pepino', 15, 0.7, 0.1, 0, 3.6, 1.7, 0.5, 0],
    ['mongeta tendra|judia verde', 31, 1.8, 0.2, 0, 7, 3.3, 2.7, 0],
    ['llegum|llentia|lenteja', 353, 24, 1.1, 0.2, 60, 2, 10.6, 0],
    ['cigro|garbanzo', 364, 19.3, 6, 0.6, 60.7, 10.7, 17.4, 0],
    ['mongeta seca|alubia|judia blanca', 333, 23, 0.9, 0.2, 60, 2, 15, 0],
    ['poma|manzana', 52, 0.3, 0.2, 0, 13.8, 10.4, 2.4, 0],
    ['taronja|naranja', 47, 0.9, 0.1, 0, 11.8, 9.4, 2.4, 0],
    ['llimona|limon', 29, 1.1, 0.3, 0, 9.3, 2.5, 2.8, 0],
    ['platan|banana', 89, 1.1, 0.3, 0.1, 22.8, 12.2, 2.6, 0],
    ['maduixa|fresa', 32, 0.7, 0.3, 0, 7.7, 4.9, 2, 0],
    ['alvocat|aguacate', 160, 2, 14.7, 2.1, 8.5, 0.7, 6.7, 0],
    ['oliva', 115, 0.8, 10.7, 1.4, 6.3, 0, 3.2, 2.5],
    ['ou|huevo', 143, 12.6, 9.5, 3.1, 0.7, 0.4, 0, 0.36],
    ['llet|leche', 64, 3.3, 3.6, 2.3, 4.8, 4.8, 0, 0.1],
    ['nata|crema de llet', 337, 2.1, 35, 22, 3, 3, 0, 0.1],
    ['mantega|mantequilla', 717, 0.9, 81, 51, 0.1, 0.1, 0, 0.7],
    ['iogurt|yogur', 61, 3.5, 3.3, 2.1, 4.7, 4.7, 0, 0.1],
    ['mozzarella', 280, 18, 22, 14, 2, 1, 0, 0.6],
    ['formatge|queso', 380, 25, 30, 19, 1.3, 0.5, 0, 1.7],
    ['llom|lomo', 143, 22, 6, 2, 0, 0, 0, 0.1],
    ['pernil serra|jamon serrano|pernil iberic|jamon iberico', 290, 30, 18.5, 6.5, 0, 0, 0, 4.5],
    ['pernil dolc|jamon cocido|jamon york', 107, 17, 3.5, 1.2, 1.5, 1, 0, 2.1],
    ['pollastre|pollo', 165, 31, 3.6, 1, 0, 0, 0, 0.2],
    ['vedella|ternera|vaca|bou', 215, 26, 12, 5, 0, 0, 0, 0.1],
    ['porc|cerdo', 242, 27, 14, 5, 0, 0, 0, 0.1],
    ['xai|cordero', 294, 25, 21, 9, 0, 0, 0, 0.2],
    ['hamburguesa|carn picada|carne picada', 254, 17, 20, 8, 0, 0, 0, 0.2],
    ['cansalada|bacon|panceta', 458, 12, 45, 16, 0, 0, 0, 1.9],
    ['botifarra|salsitxa|salchicha', 301, 14, 26, 9.5, 2, 0.5, 0, 1.8],
    ['xoriço|chorizo', 455, 21, 40, 15, 1.5, 0.5, 0, 2.5],
    ['tonyina|atun', 198, 24, 11, 1.8, 0, 0, 0, 0.9],
    ['anxova|anchoa|seito|boqueron', 210, 28, 11, 2.5, 0, 0, 0, 7],
    ['salmo|salmon', 208, 20, 13, 3.1, 0, 0, 0, 0.1],
    ['lluç|lluc|merluza', 86, 17, 2, 0.4, 0, 0, 0, 0.2],
    ['bacalla|bacalao', 82, 18, 0.7, 0.1, 0, 0, 0, 0.3],
    ['gamba|llagosti|langostino|gamba', 99, 20, 1.7, 0.3, 0.9, 0, 0, 0.6],
    ['calamar|sepia', 92, 15.6, 1.4, 0.4, 3.1, 0, 0, 0.1],
    ['musclo|mejillon', 86, 12, 2.2, 0.4, 3.7, 0, 0, 0.7],
    ["oli|aceite|oli d'oliva|aceite de oliva|oli de gira-sol|aceite de girasol|oli verge", 884, 0, 100, 14, 0, 0, 0, 0],
    ['maionesa|mayonesa|allioli', 680, 1.3, 75, 11, 2.6, 2, 0, 1.3],
    ['ketchup|quetxup', 112, 1.5, 0.1, 0, 27, 22, 0.3, 2],
    ['mostassa|mostaza', 67, 4.4, 3.3, 0.2, 5.8, 2.5, 3.2, 2.4],
    ['vinagre', 18, 0, 0, 0, 0.6, 0, 0, 0],
    ['sal ', 0, 0, 0, 0, 0, 0, 0, 98],
    ['sucre|azucar', 387, 0, 0, 0, 99.8, 99.8, 0, 0],
    ['mel|miel', 304, 0.3, 0, 0, 82.4, 82.1, 0.2, 0],
    ['xocolata|chocolate', 546, 4.9, 31, 19, 61, 48, 7, 0.1],
    ['ametlla|almendra', 579, 21.2, 49.9, 3.8, 21.7, 4.4, 12.5, 0],
    ['nou|nueces', 654, 15.2, 65.2, 6.1, 13.7, 2.6, 6.7, 0],
    ['cacauet|cacahuete', 567, 25.8, 49.2, 6.3, 16.1, 4.7, 8.5, 0],
    ['pebre|pimenton|espècia|especia|comi|oregan|julivert|perejil', 282, 14, 13, 2, 54, 10, 35, 0.2],
    ['tomaquet fregit|tomate frito|salsa de tomaquet', 80, 1.6, 4, 0.5, 9, 6.3, 1.5, 0.9],
    ['beixamel|bechamel', 118, 3.5, 7, 4, 10, 3.5, 0.3, 0.6],
    ['croqueta', 230, 8, 14, 3, 20, 1.5, 1, 0.8],
    ['patates fregides|patatas fritas', 312, 3.4, 15, 2.3, 41, 0.3, 3.8, 0.6],
    ['cervesa|cerveza', 43, 0.5, 0, 0, 3.6, 0, 0, 0],
    ['vi negre|vino tinto', 85, 0.1, 0, 0, 2.6, 0.6, 0, 0],
    ['vi blanc|vino blanco|cava', 82, 0.1, 0, 0, 2.6, 0.6, 0, 0],
    ['suc de taronja|zumo de naranja', 45, 0.7, 0.2, 0, 10.4, 8.4, 0.2, 0],
    ['cola|refresc|refresco', 42, 0, 0, 0, 10.6, 10.6, 0, 0],
    ['cafe', 2, 0.3, 0, 0, 0, 0, 0, 0],
    ['aigua|agua', 0, 0, 0, 0, 0, 0, 0, 0],
  ];
  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const IDX = T.map(([k, ...v]) => [k.split('|').map(norm), v]);
  const CAMPS = ['kcal', 'prot', 'greix', 'sat', 'carbo', 'sucres', 'fibra', 'sal'];
  /** Valors per 100 g a partir del nom (o null). La coincidència més llarga guanya. */
  function busca(nom) {
    const n = ' ' + norm(nom) + ' ';
    let millor = null, llarg = 0;
    for (const [claus, v] of IDX) for (const c of claus) {
      if (c.length > llarg && (n.includes(' ' + c) || n.includes(c + ' ') || (c.length >= 5 && n.includes(c)))) {
        millor = v; llarg = c.length;
      }
    }
    return millor ? Object.fromEntries(CAMPS.map((k, i) => [k, millor[i]])) : null;
  }
  const API = { busca, CAMPS };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  g.NUTRI = API;
})(typeof window !== 'undefined' ? window : globalThis);

"""Genera la guia il·lustrada de posada en marxa: www/manual/guia_<ll>.html (imatges a www/manual/img/<ll>/).
Les imatges es fan amb eines/captures.py.   Ús: py -3.12 eines/genera_guia.py
Format dels textos: **negreta**, línies que comencen per «- » = llista, «> » = consell destacat."""
import html
import re
from pathlib import Path

DIR = Path(__file__).resolve().parent.parent / 'www' / 'manual'

CAP = {
    'ca': ('Guia de posada en marxa', 'Com es configura Xoriguer Gastro per a un establiment nou, pas a pas, i com es fa servir cada dia.', 'Pas', 'Índex', 'Llista de comprovació', 'Xoriguer Gastro · guia', 'Imatge'),
    'es': ('Guía de puesta en marcha', 'Cómo se configura Xoriguer Gastro para un establecimiento nuevo, paso a paso, y cómo se usa cada día.', 'Paso', 'Índice', 'Lista de comprobación', 'Xoriguer Gastro · guía', 'Imagen'),
    'fr': ('Guide de démarrage', 'Comment configurer Xoriguer Gastro pour un nouvel établissement, étape par étape, et comment l\'utiliser au quotidien.', 'Étape', 'Sommaire', 'Liste de contrôle', 'Xoriguer Gastro · guide', 'Image'),
    'en': ('Getting started guide', 'How to set up Xoriguer Gastro for a new venue, step by step, and how to use it every day.', 'Step', 'Contents', 'Checklist', 'Xoriguer Gastro · guide', 'Image'),
}

# (imatge, {ll: (títol, text)})
SECCIONS = [
    ('01-benvinguda', {
        'ca': ('Primer inici', """En obrir el programa per primera vegada, tria l'**idioma** i com vols començar:
- **Començar en blanc**: per a un establiment nou. És el que farem en aquesta guia.
- **Començar amb un exemple**: un bar d'exemple per tocar-ho tot sense por. Després ho pots esborrar a Ajustos.
- **Importar les dades del Raconet**: només surt si el programa troba el Raconet Gastronomia o el Xoriguer TPV en aquest ordinador.
- **Obrir una còpia de seguretat**: si ja tens un fitxer .json exportat.
> Tot es desa sol a cada canvi. No cal buscar cap botó de desar."""),
        'es': ('Primer inicio', """Al abrir el programa por primera vez, elige el **idioma** y cómo quieres empezar:
- **Empezar en blanco**: para un establecimiento nuevo. Es lo que haremos en esta guía.
- **Empezar con un ejemplo**: un bar de ejemplo para probarlo todo sin miedo. Después lo puedes borrar en Ajustes.
- **Importar los datos del Raconet**: solo aparece si el programa encuentra Raconet Gastronomia o Xoriguer TPV en este ordenador.
- **Abrir una copia de seguridad**: si ya tienes un archivo .json exportado.
> Todo se guarda solo con cada cambio. No hace falta buscar ningún botón de guardar."""),
        'fr': ('Premier démarrage', """À la première ouverture, choisissez la **langue** et la façon de commencer :
- **Commencer à vide** : pour un nouvel établissement. C'est ce que nous ferons dans ce guide.
- **Commencer avec un exemple** : un bar fictif pour tout essayer sans crainte. Vous pourrez l'effacer ensuite dans Réglages.
- **Importer les données de Raconet** : n'apparaît que si le programme trouve Raconet Gastronomia ou Xoriguer TPV sur cet ordinateur.
- **Ouvrir une sauvegarde** : si vous avez déjà un fichier .json exporté.
> Tout est enregistré automatiquement à chaque modification. Pas besoin de chercher un bouton Enregistrer."""),
        'en': ('First launch', """The first time you open the program, pick the **language** and how you want to start:
- **Start blank**: for a new venue. That's what we'll do in this guide.
- **Start with an example**: a sample bar to try everything safely. You can wipe it later in Settings.
- **Import Raconet data**: only shown if Raconet Gastronomia or Xoriguer TPV is found on this computer.
- **Open a backup**: if you already have an exported .json file.
> Everything saves itself on every change. There's no save button to look for."""),
    }),
    ('02-ajustos', {
        'ca': ('Les dades del local', """Ves a **Ajustos** i omple:
- **Nom, adreça i telèfon**: surten a la carta, les fitxes i les etiquetes.
- **IVA per defecte** (10 % en hostaleria) i la **moneda**.
- **Marge objectiu per categoria**: el marge brut que vols guanyar en tapes, entrepans, postres… El programa et dirà si cada plat hi arriba i quin preu caldria.
- **Dies de conservació** per defecte de les etiquetes de producció.
> Els marges es calculen sobre el preu **sense IVA**, que és el que de debò entra a caixa."""),
        'es': ('Los datos del local', """Ve a **Ajustes** y rellena:
- **Nombre, dirección y teléfono**: salen en la carta, las fichas y las etiquetas.
- **IVA por defecto** (10 % en hostelería) y la **moneda**.
- **Margen objetivo por categoría**: el margen bruto que quieres ganar en tapas, bocadillos, postres… El programa te dirá si cada plato llega y qué precio haría falta.
- **Días de conservación** por defecto de las etiquetas de producción.
> Los márgenes se calculan sobre el precio **sin IVA**, que es lo que de verdad entra en caja."""),
        'fr': ("Les informations de l'établissement", """Allez dans **Réglages** et remplissez :
- **Nom, adresse et téléphone** : ils apparaissent sur la carte, les fiches et les étiquettes.
- **TVA par défaut** (10 % en restauration en Espagne) et la **devise**.
- **Marge visée par catégorie** : la marge brute souhaitée pour les tapas, sandwichs, desserts… Le programme vous dira si chaque plat l'atteint et à quel prix il faudrait le vendre.
- **Jours de conservation** par défaut des étiquettes de production.
> Les marges se calculent sur le prix **hors TVA**, ce qui rentre vraiment dans la caisse."""),
        'en': ('Your venue details', """Go to **Settings** and fill in:
- **Name, address and phone**: they appear on the menu, recipe cards and labels.
- **Default VAT** (10 % for hospitality in Spain) and the **currency**.
- **Target margin per category**: the gross margin you want on tapas, sandwiches, desserts… The program tells you whether each dish gets there and what price it would need.
- **Default shelf life** for production labels.
> Margins are worked out on the price **before VAT**, which is what really goes into the till."""),
    }),
    ('03-proveidors', {
        'ca': ('Els proveïdors', """A **Proveïdors**, crea'n un per a cada empresa que et serveix: nom, telèfon (per a WhatsApp), correu, persona de contacte, **dies de repartiment** i **comanda mínima**.
Després els assignaràs als ingredients i les comandes sortiran agrupades per proveïdor, a punt per enviar."""),
        'es': ('Los proveedores', """En **Proveedores**, crea uno por cada empresa que te sirve: nombre, teléfono (para WhatsApp), correo, persona de contacto, **días de reparto** y **pedido mínimo**.
Después los asignarás a los ingredientes y los pedidos saldrán agrupados por proveedor, listos para enviar."""),
        'fr': ('Les fournisseurs', """Dans **Fournisseurs**, créez-en un par entreprise qui vous livre : nom, téléphone (pour WhatsApp), e-mail, contact, **jours de livraison** et **minimum de commande**.
Vous les associerez ensuite aux ingrédients et les commandes seront regroupées par fournisseur, prêtes à envoyer."""),
        'en': ('Suppliers', """In **Suppliers**, create one for each company that delivers to you: name, phone (for WhatsApp), email, contact person, **delivery days** and **minimum order**.
You'll then link them to ingredients and orders will be grouped by supplier, ready to send."""),
    }),
    ('04-base-ingredients', {
        'ca': ('Els ingredients: comença per la base', """A **Ingredients → Afegir de la base** tens més de 120 productes habituals amb la família, el rendiment, els al·lèrgens, la nutrició i un **preu orientatiu** ja posats. Marca els que fas servir i prem **Afegir**.
- Els que ja tens surten en gris («ja el tens»), així no es dupliquen.
- També pots importar un **CSV** de la tarifa del proveïdor, o crear-los d'un en un amb **Nou ingredient** (o la tecla N)."""),
        'es': ('Los ingredientes: empieza por la base', """En **Ingredientes → Añadir de la base** tienes más de 120 productos habituales con la familia, el rendimiento, los alérgenos, la nutrición y un **precio orientativo** ya puestos. Marca los que usas y pulsa **Añadir**.
- Los que ya tienes salen en gris («ya lo tienes»), así no se duplican.
- También puedes importar un **CSV** con la tarifa del proveedor, o crearlos uno a uno con **Nuevo ingrediente** (o la tecla N)."""),
        'fr': ('Les ingrédients : partez de la base', """Dans **Ingrédients → Ajouter depuis la base**, plus de 120 produits courants avec la famille, le rendement, les allergènes, la nutrition et un **prix indicatif** déjà renseignés. Cochez ceux que vous utilisez et cliquez sur **Ajouter**.
- Ceux que vous avez déjà apparaissent en gris (« déjà présent ») : pas de doublons.
- Vous pouvez aussi importer un **CSV** du tarif fournisseur, ou les créer un par un avec **Nouvel ingrédient** (ou la touche N)."""),
        'en': ('Ingredients: start from the library', """In **Ingredients → Add from the library** there are over 120 common products with family, yield, allergens, nutrition and a **guide price** already set. Tick the ones you use and press **Add**.
- Ones you already have are greyed out (“already added”), so nothing is duplicated.
- You can also import a supplier price list as **CSV**, or create them one by one with **New ingredient** (or the N key)."""),
    }),
    ('05-ingredient', {
        'ca': ("Posa'ls el preu", """Clica cada ingredient per obrir la fitxa a la dreta:
- **Unitat i preu sense IVA** (€/kg, €/l o €/unitat). Si compres per caixes, la **calculadora de format** ho passa a preu per kg.
- **Rendiment**: la part que aprofites després de netejar (patata ≈ 80 %, lluç ≈ 55 %). El preu real puja sol.
- **Pes d'una peça** (opcional): per posar «2 u» a les receptes d'un producte que compres a kg.
- **Proveïdor**, **on es guarda** (cambra, congelador…) i **mínim/màxim d'estoc** per a les comandes automàtiques.
- **Preus per proveïdor**: cada albarà hi guarda el preu; si un altre proveïdor és més barat, el tauler t'avisa.
> **Els preus de la base són orientatius** (una mitjana de mercat) i surten marcats en taronja amb l'etiqueta «orientatiu». Canvia'ls pels preus reals del teu proveïdor: amb el filtre **⚠ Preus orientatius** de la llista els trobes tots. Si el preu ja és bo, prem **El preu és correcte**. La primera compra de cada producte també el canvia sol."""),
        'es': ('Ponles el precio', """Haz clic en cada ingrediente para abrir la ficha a la derecha:
- **Unidad y precio sin IVA** (€/kg, €/l o €/unidad). Si compras por cajas, la **calculadora de formato** lo pasa a precio por kg.
- **Rendimiento**: la parte que aprovechas después de limpiar (patata ≈ 80 %, merluza ≈ 55 %). El precio real sube solo.
- **Peso de una pieza** (opcional): para poner «2 u» en las recetas de un producto que compras por kg.
- **Proveedor**, **dónde se guarda** (cámara, congelador…) y **mínimo/máximo de stock** para los pedidos automáticos.
- **Precios por proveedor**: cada albarán guarda el precio; si otro proveedor es más barato, el panel te avisa.
> **Los precios de la base son orientativos** (una media de mercado) y salen marcados en naranja con la etiqueta «orientativo». Cámbialos por los precios reales de tu proveedor: con el filtro **⚠ Precios orientativos** de la lista los encuentras todos. Si el precio ya es bueno, pulsa **El precio es correcto**. La primera compra de cada producto también lo cambia solo."""),
        'fr': ('Indiquez les prix', """Cliquez sur chaque ingrédient pour ouvrir sa fiche à droite :
- **Unité et prix HT** (€/kg, €/l ou €/unité). Si vous achetez par carton, le **calculateur de conditionnement** le convertit en prix au kg.
- **Rendement** : la part utilisable après épluchage ou nettoyage (pomme de terre ≈ 80 %, merlu ≈ 55 %). Le prix réel s'ajuste tout seul.
- **Poids d'une pièce** (facultatif) : pour écrire « 2 u » dans les recettes d'un produit acheté au kg.
- **Fournisseur**, **où il est rangé** (chambre froide, congélateur…) et **stock mini/maxi** pour les commandes automatiques.
- **Prix par fournisseur** : chaque bon de livraison enregistre le prix ; si un autre fournisseur est moins cher, le tableau de bord vous prévient.
> **Les prix de la base sont indicatifs** (une moyenne du marché) et apparaissent en orange avec l'étiquette « indicatif ». Remplacez-les par les prix réels de votre fournisseur : le filtre **⚠ Prix indicatifs** de la liste les regroupe. Si le prix est bon, cliquez sur **Le prix est correct**. Le premier achat de chaque produit le met aussi à jour."""),
        'en': ('Add the prices', """Click each ingredient to open its card on the right:
- **Unit and price before VAT** (€/kg, €/l or €/unit). If you buy by the box, the **pack calculator** turns it into a price per kg.
- **Yield**: the usable part after cleaning (potato ≈ 80 %, hake ≈ 55 %). The real price adjusts itself.
- **Weight per piece** (optional): to use “2 u” in recipes for a product bought by the kg.
- **Supplier**, **storage area** (fridge, freezer…) and **min/max stock** for automatic orders.
- **Prices by supplier**: every delivery note keeps the price; if another supplier is cheaper, the dashboard tells you.
> **Library prices are guide prices** (a market average) and show in orange with a “guide” tag. Replace them with your supplier's real prices: the **⚠ Guide prices** filter in the list gathers them all. If a price is already right, press **The price is right**. The first purchase of each product also updates it."""),
    }),
    ('06-base-plats', {
        'ca': ('Els plats: afegeix-los de la base', """A **Receptes → Afegir de la base** hi ha uns 70 plats, elaboracions (salsa brava, allioli, beixamel, sofregit…) i articles de barra amb l'escandall per ració.
- Es fan servir **els teus ingredients** si ja els tens (encara que estiguin en un altre idioma) i es creen els que falten.
- Les **elaboracions de dins** s'afegeixen soles: si tries unes braves, també tindràs la salsa brava.
- El cost surt dels teus preus i **es recalcula sol** quan en canvies un, també dins de les elaboracions.
> **Atenció:** mentre els ingredients tinguin preu orientatiu, el plat surt marcat amb **≈** i un avís, i el seu cost i el seu marge **no són reals**. Posa els preus del teu proveïdor i tot es recalcula sol. Revisa també les quantitats i ajusta-les a les teves racions."""),
        'es': ('Los platos: añádelos de la base', """En **Recetas → Añadir de la base** hay unos 70 platos, elaboraciones (salsa brava, alioli, bechamel, sofrito…) y artículos de barra con el escandallo por ración.
- Se usan **tus ingredientes** si ya los tienes (aunque estén en otro idioma) y se crean los que faltan.
- Las **elaboraciones de dentro** se añaden solas: si eliges unas bravas, también tendrás la salsa brava.
- El coste sale de tus precios y **se recalcula solo** cuando cambias uno, también dentro de las elaboraciones.
> **Atención:** mientras los ingredientes tengan precio orientativo, el plato sale marcado con **≈** y un aviso, y su coste y su margen **no son reales**. Pon los precios de tu proveedor y todo se recalcula solo. Revisa también las cantidades y ajústalas a tus raciones."""),
        'fr': ('Les plats : ajoutez-les depuis la base', """Dans **Recettes → Ajouter depuis la base**, environ 70 plats, préparations (sauce brava, aïoli, béchamel, sofrito…) et articles de bar avec la fiche de coût par portion.
- **Vos ingrédients** sont réutilisés s'ils existent déjà (même dans une autre langue) et ceux qui manquent sont créés.
- Les **préparations incluses** sont ajoutées automatiquement : en choisissant des patatas bravas, vous aurez aussi la sauce brava.
- Le coût vient de vos prix et **se recalcule tout seul** dès que vous en modifiez un, y compris dans les préparations.
> **Attention :** tant que des ingrédients ont un prix indicatif, le plat est marqué **≈** avec un avertissement, et son coût et sa marge **ne sont pas réels**. Saisissez les prix de votre fournisseur et tout se recalcule. Vérifiez aussi les quantités et adaptez-les à vos portions."""),
        'en': ('Dishes: add them from the library', """In **Recipes → Add from the library** there are about 70 dishes, preparations (brava sauce, aioli, béchamel, sofrito…) and bar items, each costed per portion.
- **Your own ingredients** are reused if you have them (even in another language) and missing ones are created.
- **Preparations inside** are added automatically: pick patatas bravas and you also get the brava sauce.
- Cost comes from your prices and **updates itself** when you change one, including inside preparations.
> **Note:** while ingredients have guide prices, the dish is marked **≈** with a warning, and its cost and margin **aren't real**. Enter your supplier's prices and everything updates itself. Also check the quantities and adjust them to your portions."""),
    }),
    ('07-escandall', {
        'ca': ("L'escandall de cada plat", """Obre un plat per veure i retocar l'escandall:
- Afegeix ingredients o elaboracions escrivint el nom; posa la **quantitat per ració** en qualsevol unitat (g, kg, ml, l, u). Si no existeix, el crees allà mateix.
- A baix tens el **cost per ració**, el **food cost** (verd: bé, taronja: just, vermell: baix) i el **marge**.
- Escriu el **PVP amb IVA** o prem el botó del **PVP suggerit** per arribar al marge objectiu.
- **Mides de ració**: tapa, mitja, doble… cadascuna amb el seu preu i el seu marge.
- **Partida** (cuina freda, calenta, fregidora, barra): ordena el full de producció.
- Pestanyes: **Elaboració** (passos, foto, descripció per a la carta), **Al·lèrgens i nutrició** (calculats sols) i **Produir** (escalar a N racions).
- **Fitxa tècnica** imprimible, amb costos o sense."""),
        'es': ('El escandallo de cada plato', """Abre un plato para ver y retocar el escandallo:
- Añade ingredientes o elaboraciones escribiendo el nombre; pon la **cantidad por ración** en cualquier unidad (g, kg, ml, l, u). Si no existe, lo creas ahí mismo.
- Abajo tienes el **coste por ración**, el **food cost** (verde: bien, naranja: justo, rojo: bajo) y el **margen**.
- Escribe el **PVP con IVA** o pulsa el botón del **PVP sugerido** para llegar al margen objetivo.
- **Tamaños de ración**: tapa, media, doble… cada uno con su precio y su margen.
- **Partida** (cocina fría, caliente, freidora, barra): ordena la hoja de producción.
- Pestañas: **Elaboración** (pasos, foto, descripción para la carta), **Alérgenos y nutrición** (calculados solos) y **Producir** (escalar a N raciones).
- **Ficha técnica** imprimible, con o sin costes."""),
        'fr': ('La fiche de coût de chaque plat', """Ouvrez un plat pour voir et ajuster sa fiche :
- Ajoutez des ingrédients ou des préparations en tapant leur nom ; indiquez la **quantité par portion** dans n'importe quelle unité (g, kg, ml, l, u). S'il n'existe pas, créez-le sur place.
- En bas : le **coût par portion**, le **food cost** (vert : bien, orange : juste, rouge : insuffisant) et la **marge**.
- Saisissez le **prix TTC** ou cliquez sur le **prix conseillé** pour atteindre la marge visée.
- **Tailles de portion** : tapa, demi, double… chacune avec son prix et sa marge.
- **Poste** (cuisine froide, chaude, friteuse, bar) : organise la feuille de production.
- Onglets : **Préparation** (étapes, photo, description pour la carte), **Allergènes et nutrition** (calculés automatiquement) et **Produire** (adapter à N portions).
- **Fiche technique** imprimable, avec ou sans coûts."""),
        'en': ('Costing each dish', """Open a dish to see and adjust its costing:
- Add ingredients or preparations by typing their name; enter the **quantity per portion** in any unit (g, kg, ml, l, u). If it doesn't exist, create it right there.
- Below you see the **cost per portion**, the **food cost** (green: good, orange: tight, red: low) and the **margin**.
- Type the **price incl. VAT** or press the **suggested price** button to hit your target margin.
- **Portion sizes**: tapa, half, double… each with its own price and margin.
- **Station** (cold kitchen, hot kitchen, fryer, bar): organises the production sheet.
- Tabs: **Method** (steps, photo, menu description), **Allergens & nutrition** (worked out for you) and **Produce** (scale to N portions).
- Printable **recipe card**, with or without costs."""),
    }),
    ('08-receptes', {
        'ca': ('La llista de receptes', """La llista et dona d'un cop d'ull el cost, el PVP, el food cost, el marge, l'estat i els al·lèrgens de cada plat. Clica qualsevol columna per ordenar-la (per exemple, per food cost, per trobar els plats que menys deixen).
Filtra per plats, elaboracions o articles, i per categoria. La casella **Carta** decideix si el plat surt a la carta impresa i a la digital."""),
        'es': ('La lista de recetas', """La lista te da de un vistazo el coste, el PVP, el food cost, el margen, el estado y los alérgenos de cada plato. Haz clic en cualquier columna para ordenarla (por ejemplo, por food cost, para encontrar los platos que menos dejan).
Filtra por platos, elaboraciones o artículos, y por categoría. La casilla **Carta** decide si el plato sale en la carta impresa y en la digital."""),
        'fr': ('La liste des recettes', """La liste montre d'un coup d'œil le coût, le prix, le food cost, la marge, l'état et les allergènes de chaque plat. Cliquez sur une colonne pour trier (par exemple par food cost, pour repérer les plats les moins rentables).
Filtrez par plats, préparations ou articles, et par catégorie. La case **Carte** détermine si le plat figure sur la carte imprimée et numérique."""),
        'en': ('The recipe list', """The list shows at a glance each dish's cost, price, food cost, margin, status and allergens. Click any column to sort (for example by food cost, to find the dishes that earn least).
Filter by dishes, preparations or items, and by category. The **Menu** tick box decides whether the dish appears on the printed and digital menu."""),
    }),
    ('10-inventari', {
        'ca': ('El primer inventari', """A **Estoc → Fer inventari**, compta el que tens i escriu-ho (amb Intro passes al següent). Pots ordenar-lo **per zona** (cambra, congelador, magatzem) per anar-hi caminant, o imprimir el **full de recompte**.
En desar, l'estoc queda com l'has comptat. Fes-ne un al començament i un altre al final de mes: a **Anàlisi → Food cost real** veuràs quant has gastat de veritat comparat amb el que diuen les receptes."""),
        'es': ('El primer inventario', """En **Stock → Hacer inventario**, cuenta lo que tienes y escríbelo (con Intro pasas al siguiente). Puedes ordenarlo **por zona** (cámara, congelador, almacén) para ir recorriéndolas, o imprimir la **hoja de recuento**.
Al guardar, el stock queda como lo has contado. Haz uno al principio y otro a final de mes: en **Análisis → Food cost real** verás cuánto has gastado de verdad comparado con lo que dicen las recetas."""),
        'fr': ('Le premier inventaire', """Dans **Stock → Faire l'inventaire**, comptez ce que vous avez et saisissez-le (Entrée passe au suivant). Vous pouvez le trier **par zone** (chambre froide, congélateur, réserve) pour suivre votre parcours, ou imprimer la **feuille de comptage**.
En enregistrant, le stock prend les valeurs comptées. Faites-en un en début et un en fin de mois : dans **Analyse → Food cost réel**, vous verrez ce que vous avez vraiment consommé par rapport aux recettes."""),
        'en': ('Your first stocktake', """In **Stock → Do a stocktake**, count what you have and type it in (Enter moves to the next). Sort it **by area** (fridge, freezer, dry store) to walk round in order, or print the **count sheet**.
Saving sets stock to your count. Do one at the start and another at the end of the month: **Analysis → Actual food cost** shows what you really used compared with what the recipes say."""),
    }),
    ('09-compra', {
        'ca': ('Cada dia: les compres', """Quan arriba un albarà, a **Compres → Nova compra** tria el proveïdor i escriu els productes, la quantitat i el preu.
- L'**estoc puja sol** i el **preu de l'ingredient s'actualitza**: tots els plats que el fan servir es recalculen.
- Si un preu puja, t'avisa amb el percentatge.
- Les factures sense productes (llum, lloguer) es poden apuntar només amb l'import, per al compte de resultats."""),
        'es': ('Cada día: las compras', """Cuando llega un albarán, en **Compras → Nueva compra** elige el proveedor y escribe los productos, la cantidad y el precio.
- El **stock sube solo** y el **precio del ingrediente se actualiza**: todos los platos que lo usan se recalculan.
- Si un precio sube, te avisa con el porcentaje.
- Las facturas sin productos (luz, alquiler) se pueden apuntar solo con el importe, para la cuenta de resultados."""),
        'fr': ('Au quotidien : les achats', """À l'arrivée d'un bon de livraison, dans **Achats → Nouvel achat**, choisissez le fournisseur et saisissez les produits, la quantité et le prix.
- Le **stock augmente tout seul** et le **prix de l'ingrédient est mis à jour** : tous les plats qui l'utilisent sont recalculés.
- Si un prix augmente, vous êtes prévenu avec le pourcentage.
- Les factures sans produits (électricité, loyer) peuvent être saisies avec leur seul montant, pour le compte de résultat."""),
        'en': ('Every day: purchases', """When a delivery arrives, go to **Purchases → New purchase**, pick the supplier and enter the products, quantity and price.
- **Stock goes up** and the **ingredient price updates**: every dish using it is recalculated.
- If a price rises, you get an alert with the percentage.
- Bills without products (power, rent) can be logged with just the amount, for the profit & loss."""),
    }),
    ('11-comandes', {
        'ca': ('Les comandes', """A **Comandes** la llista es fa sola amb el que està per sota del mínim, agrupada per proveïdor. Retoca les quantitats, afegeix el que vulguis i envia-la per **WhatsApp** o **correu** amb un clic.
Quan arribi, prem **Ha arribat → albarà** i es converteix en una compra."""),
        'es': ('Los pedidos', """En **Pedidos** la lista se hace sola con lo que está por debajo del mínimo, agrupada por proveedor. Retoca las cantidades, añade lo que quieras y envíala por **WhatsApp** o **correo** con un clic.
Cuando llegue, pulsa **Ha llegado → albarán** y se convierte en una compra."""),
        'fr': ('Les commandes', """Dans **Commandes**, la liste se crée toute seule avec ce qui est sous le minimum, regroupée par fournisseur. Ajustez les quantités, ajoutez ce que vous voulez et envoyez-la par **WhatsApp** ou **e-mail** en un clic.
À la livraison, cliquez sur **Arrivé → bon de livraison** : elle devient un achat."""),
        'en': ('Orders', """In **Orders** the list builds itself from items below minimum, grouped by supplier. Adjust quantities, add anything else and send it by **WhatsApp** or **email** in one click.
When it arrives, press **Arrived → delivery note** and it becomes a purchase."""),
    }),
    ('12-vendes', {
        'ca': ('Les vendes', """A **Vendes → Entrar vendes** apunta les unitats venudes de cada plat (amb + i − o escrivint), o importa-les de **Xoriguer TPV** o d'un **CSV** de la teva caixa.
Les vendes descompten l'estoc segons les receptes (si tornes a desar el mateix dia, només es descompta la diferència) i alimenten totes les anàlisis."""),
        'es': ('Las ventas', """En **Ventas → Introducir ventas** apunta las unidades vendidas de cada plato (con + y − o escribiendo), o impórtalas de **Xoriguer TPV** o de un **CSV** de tu caja.
Las ventas descuentan el stock según las recetas (si vuelves a guardar el mismo día, solo se descuenta la diferencia) y alimentan todos los análisis."""),
        'fr': ('Les ventes', """Dans **Ventes → Saisir les ventes**, notez les unités vendues de chaque plat (avec + et − ou en tapant), ou importez-les depuis **Xoriguer TPV** ou un **CSV** de votre caisse.
Les ventes déduisent le stock selon les recettes (si vous réenregistrez le même jour, seule la différence est déduite) et alimentent toutes les analyses."""),
        'en': ('Sales', """In **Sales → Enter sales** log the units sold of each dish (with + and − or by typing), or import them from **Xoriguer TPV** or a **CSV** from your till.
Sales deduct stock according to the recipes (saving the same day again only deducts the difference) and feed every analysis."""),
    }),
    ('17-produccio', {
        'ca': ('La producció', """A **Producció** tria què vols preparar i quantes racions (o omple-ho amb les vendes d'una setmana). Veuràs tot el que necessites, el que tens i el que **falta**, que pots enviar a la comanda amb un botó.
El **full de producció** imprès surt agrupat per **partida**, amb les quantitats de cada recepta ja escalades (mise en place)."""),
        'es': ('La producción', """En **Producción** elige qué quieres preparar y cuántas raciones (o rellénalo con las ventas de una semana). Verás todo lo que necesitas, lo que tienes y lo que **falta**, que puedes enviar al pedido con un botón.
La **hoja de producción** impresa sale agrupada por **partida**, con las cantidades de cada receta ya escaladas (mise en place)."""),
        'fr': ('La production', """Dans **Production**, choisissez ce que vous voulez préparer et combien de portions (ou remplissez avec les ventes d'une semaine). Vous voyez tout ce qu'il faut, ce que vous avez et ce qui **manque**, à envoyer en commande d'un clic.
La **feuille de production** imprimée est regroupée par **poste**, avec les quantités de chaque recette déjà calculées (mise en place)."""),
        'en': ('Production', """In **Production** choose what to prepare and how many portions (or fill it from a week of sales). You see everything you need, what you have and what's **short**, which you can send to the order with one button.
The printed **production sheet** is grouped by **station**, with each recipe's quantities already scaled (mise en place)."""),
    }),
    ('13-tauler', {
        'ca': ('El tauler', """El **Tauler** és la pantalla d'inici: vendes de 7 dies, food cost teòric, marge brut i valor de l'estoc, el gràfic de 30 dies i els **avisos**: productes esgotats o per sota del mínim, pujades de preu, plats per sota del marge, ingredients sense preu, un proveïdor més barat, temperatures fora de rang…
Clica un avís per anar directament on cal actuar."""),
        'es': ('El panel', """El **Panel** es la pantalla de inicio: ventas de 7 días, food cost teórico, margen bruto y valor del stock, el gráfico de 30 días y los **avisos**: productos agotados o bajo mínimo, subidas de precio, platos bajo el margen, ingredientes sin precio, un proveedor más barato, temperaturas fuera de rango…
Haz clic en un aviso para ir directamente donde hay que actuar."""),
        'fr': ('Le tableau de bord', """Le **Tableau de bord** est l'écran d'accueil : ventes sur 7 jours, food cost théorique, marge brute et valeur du stock, le graphique sur 30 jours et les **alertes** : produits épuisés ou sous le minimum, hausses de prix, plats sous la marge, ingrédients sans prix, un fournisseur moins cher, températures hors plage…
Cliquez sur une alerte pour aller droit à l'endroit où agir."""),
        'en': ('The dashboard', """The **Dashboard** is the home screen: 7-day sales, theoretical food cost, gross margin and stock value, the 30-day chart and the **alerts**: items out of stock or below minimum, price rises, dishes below target margin, ingredients without a price, a cheaper supplier, temperatures out of range…
Click an alert to jump straight to where you need to act."""),
    }),
    ('14-enginyeria', {
        'ca': ('Analitzar el negoci', """A **Anàlisi** tens:
- **Enginyeria de menú**: cada plat és ⭐ estrella (es ven molt i deixa molt), 🐴 cavall de batalla, ❓ enigma o 🐶 gos, amb què fer amb cadascun.
- **Food cost real** entre dos inventaris, comparat amb el teòric: la diferència són mermes, racions massa grans o pèrdues.
- **Evolució de preus** i **simulador** («si l'oli puja un 20 %, quins plats perden marge i a quin preu els hauria de posar?»).
- **Compte de resultats** amb els costos fixos i el **punt d'equilibri**."""),
        'es': ('Analizar el negocio', """En **Análisis** tienes:
- **Ingeniería de menú**: cada plato es ⭐ estrella (se vende mucho y deja mucho), 🐴 caballo de batalla, ❓ enigma o 🐶 perro, con qué hacer con cada uno.
- **Food cost real** entre dos inventarios, comparado con el teórico: la diferencia son mermas, raciones demasiado grandes o pérdidas.
- **Evolución de precios** y **simulador** («si el aceite sube un 20 %, ¿qué platos pierden margen y a qué precio los tendría que poner?»).
- **Cuenta de resultados** con los costes fijos y el **punto de equilibrio**."""),
        'fr': ("Analyser l'activité", """Dans **Analyse** :
- **Ingénierie de menu** : chaque plat est ⭐ étoile (se vend bien et rapporte), 🐴 cheval de labour, ❓ énigme ou 🐶 poids mort, avec la conduite à tenir.
- **Food cost réel** entre deux inventaires, comparé au théorique : l'écart vient des pertes, des portions trop grandes ou du gaspillage.
- **Évolution des prix** et **simulateur** (« si l'huile augmente de 20 %, quels plats perdent de la marge et à quel prix les vendre ? »).
- **Compte de résultat** avec les charges fixes et le **seuil de rentabilité**."""),
        'en': ('Analysing the business', """In **Analysis** you have:
- **Menu engineering**: each dish is a ⭐ star (sells well, earns well), 🐴 plowhorse, ❓ puzzle or 🐶 dog, with what to do about each.
- **Actual food cost** between two stocktakes, compared with theoretical: the gap is waste, over-portioning or losses.
- **Price history** and **simulator** (“if oil goes up 20 %, which dishes lose margin and what should they cost?”).
- **Profit & loss** with fixed costs and the **break-even point**."""),
    }),
    ('15-carta', {
        'ca': ('La carta i els al·lèrgens', """A **Carta i al·lèrgens**:
- **Carta** imprimible en tres estils (clàssic, modern, pissarra), amb al·lèrgens i descripcions.
- **Matriu dels 14 al·lèrgens** (Reglament UE 1169/2011), obligatòria i calculada sola de les receptes.
- **Carta QR**: desa la **carta digital** (una pàgina per al mòbil en 4 idiomes, amb filtre d'al·lèrgens), penja-la a la teva web i imprimeix les targetes QR per a les taules."""),
        'es': ('La carta y los alérgenos', """En **Carta y alérgenos**:
- **Carta** imprimible en tres estilos (clásico, moderno, pizarra), con alérgenos y descripciones.
- **Matriz de los 14 alérgenos** (Reglamento UE 1169/2011), obligatoria y calculada sola a partir de las recetas.
- **Carta QR**: guarda la **carta digital** (una página para el móvil en 4 idiomas, con filtro de alérgenos), súbela a tu web e imprime las tarjetas QR para las mesas."""),
        'fr': ('La carte et les allergènes', """Dans **Carte et allergènes** :
- **Carte** imprimable en trois styles (classique, moderne, ardoise), avec allergènes et descriptions.
- **Tableau des 14 allergènes** (règlement UE 1169/2011), obligatoire et calculé automatiquement d'après les recettes.
- **Carte QR** : enregistrez la **carte numérique** (une page mobile en 4 langues avec filtre d'allergènes), publiez-la sur votre site et imprimez les cartes QR pour les tables."""),
        'en': ('Menu and allergens', """In **Menu & allergens**:
- Printable **menu** in three styles (classic, modern, chalkboard), with allergens and descriptions.
- **14-allergen matrix** (EU Regulation 1169/2011), mandatory and worked out from the recipes.
- **QR menu**: save the **digital menu** (a mobile page in 4 languages with an allergen filter), upload it to your website and print QR cards for the tables."""),
    }),
    ('16-menu', {
        'ca': ('El menú del dia', """A **Menú del dia** escriu els primers, segons i postres (o tria'ls de les receptes) i el preu. Si el nom coincideix amb una recepta, el programa calcula el **cost per comensal**, el **food cost**, el **marge** i el **preu suggerit**.
Indica quants comensals esperes i prem **Afegir a la producció**: sabràs què preparar i què comprar. Imprimeix-lo per a la pissarra o les taules."""),
        'es': ('El menú del día', """En **Menú del día** escribe los primeros, segundos y postres (o elígelos de las recetas) y el precio. Si el nombre coincide con una receta, el programa calcula el **coste por comensal**, el **food cost**, el **margen** y el **precio sugerido**.
Indica cuántos comensales esperas y pulsa **Añadir a la producción**: sabrás qué preparar y qué comprar. Imprímelo para la pizarra o las mesas."""),
        'fr': ('Le menu du jour', """Dans **Menu du jour**, saisissez entrées, plats et desserts (ou choisissez-les parmi les recettes) et le prix. Si le nom correspond à une recette, le programme calcule le **coût par couvert**, le **food cost**, la **marge** et le **prix conseillé**.
Indiquez le nombre de couverts attendus et cliquez sur **Ajouter à la production** : vous saurez quoi préparer et quoi acheter. Imprimez-le pour l'ardoise ou les tables."""),
        'en': ('Set menu', """In **Set menu** enter the starters, mains and desserts (or pick them from your recipes) and the price. If a name matches a recipe, the program works out the **cost per guest**, **food cost**, **margin** and **suggested price**.
Enter how many guests you expect and press **Add to production**: you'll know what to prepare and buy. Print it for the chalkboard or the tables."""),
    }),
    ('18-appcc', {
        'ca': ("L'APPCC", """A **APPCC** registra cada dia les **temperatures** de neveres i congeladors (si està fora de rang, et demana l'acció correctora), imprimeix el registre del mes per a la inspecció i fes **etiquetes de producció** amb data, caducitat, lot i al·lèrgens.
A la pestanya **Equips** hi poses cada nevera amb el seu rang correcte."""),
        'es': ('El APPCC', """En **APPCC** registra cada día las **temperaturas** de neveras y congeladores (si está fuera de rango, te pide la acción correctora), imprime el registro del mes para la inspección y haz **etiquetas de producción** con fecha, caducidad, lote y alérgenos.
En la pestaña **Equipos** pones cada nevera con su rango correcto."""),
        'fr': ('Le HACCP', """Dans **HACCP**, relevez chaque jour les **températures** des frigos et congélateurs (hors plage, une action corrective est demandée), imprimez le registre du mois pour l'inspection et créez des **étiquettes de production** avec date, DLC, lot et allergènes.
Dans l'onglet **Équipements**, ajoutez chaque frigo avec sa plage correcte."""),
        'en': ('HACCP', """In **HACCP** log fridge and freezer **temperatures** every day (if one is out of range, you're asked for the corrective action), print the monthly log for inspections and make **production labels** with date, use-by, batch and allergens.
In the **Equipment** tab add each fridge with its correct range."""),
    }),
    ('19-paleta', {
        'ca': ('Trucs per anar de pressa', """- **Ctrl + K**: cerca qualsevol plat, ingredient o proveïdor, o fes una acció («fer inventari», «nova compra»…).
- **N**: crea un element nou a la pantalla on ets. **/**: va al cercador.
- **Ctrl + Z**: desfà l'últim canvi (també des de l'avís de baix a la dreta).
- **Ctrl + 1…9**: canvia de pantalla. **Esc**: tanca el panell.
- Les dades són a **%APPDATA%\\XoriguerGastro** amb una **còpia automàtica cada dia** (30 dies). A **Ajustos** pots exportar-ne una o restaurar-la."""),
        'es': ('Trucos para ir rápido', """- **Ctrl + K**: busca cualquier plato, ingrediente o proveedor, o haz una acción («hacer inventario», «nueva compra»…).
- **N**: crea un elemento nuevo en la pantalla donde estás. **/**: va al buscador.
- **Ctrl + Z**: deshace el último cambio (también desde el aviso de abajo a la derecha).
- **Ctrl + 1…9**: cambia de pantalla. **Esc**: cierra el panel.
- Los datos están en **%APPDATA%\\XoriguerGastro** con una **copia automática cada día** (30 días). En **Ajustes** puedes exportar una o restaurarla."""),
        'fr': ('Astuces pour aller vite', """- **Ctrl + K** : cherchez un plat, un ingrédient ou un fournisseur, ou lancez une action (« faire l'inventaire », « nouvel achat »…).
- **N** : crée un nouvel élément sur l'écran en cours. **/** : va à la recherche.
- **Ctrl + Z** : annule la dernière modification (aussi depuis l'avis en bas à droite).
- **Ctrl + 1…9** : change d'écran. **Échap** : ferme le panneau.
- Les données sont dans **%APPDATA%\\XoriguerGastro** avec une **sauvegarde automatique chaque jour** (30 jours). Dans **Réglages**, vous pouvez en exporter ou en restaurer une."""),
        'en': ('Shortcuts to go faster', """- **Ctrl + K**: find any dish, ingredient or supplier, or run an action (“do a stocktake”, “new purchase”…).
- **N**: create a new item on the current screen. **/**: jump to search.
- **Ctrl + Z**: undo the last change (also from the notice at the bottom right).
- **Ctrl + 1…9**: switch screen. **Esc**: close the panel.
- Data lives in **%APPDATA%\\XoriguerGastro** with an **automatic daily backup** (30 days). In **Settings** you can export or restore one."""),
    }),
]

CHECK = {
    'ca': ["Nom, adreça, IVA i marges objectiu a Ajustos", "Proveïdors creats", "Ingredients afegits de la base o d'un CSV, amb preu, proveïdor i estoc mínim",
           "Plats afegits de la base o creats, amb les quantitats revisades i el PVP", "Al·lèrgens revisats (matriu impresa a la vista dels clients)",
           "Primer inventari fet", "Neveres i congeladors donats d'alta a l'APPCC", "Carta impresa i/o carta digital amb QR a les taules"],
    'es': ["Nombre, dirección, IVA y márgenes objetivo en Ajustes", "Proveedores creados", "Ingredientes añadidos de la base o de un CSV, con precio, proveedor y stock mínimo",
           "Platos añadidos de la base o creados, con las cantidades revisadas y el PVP", "Alérgenos revisados (matriz impresa a la vista de los clientes)",
           "Primer inventario hecho", "Neveras y congeladores dados de alta en el APPCC", "Carta impresa y/o carta digital con QR en las mesas"],
    'fr': ["Nom, adresse, TVA et marges visées dans Réglages", "Fournisseurs créés", "Ingrédients ajoutés depuis la base ou un CSV, avec prix, fournisseur et stock minimum",
           "Plats ajoutés depuis la base ou créés, quantités vérifiées et prix de vente fixé", "Allergènes vérifiés (tableau imprimé visible par les clients)",
           "Premier inventaire fait", "Frigos et congélateurs enregistrés dans le HACCP", "Carte imprimée et/ou carte numérique avec QR sur les tables"],
    'en': ["Name, address, VAT and target margins in Settings", "Suppliers created", "Ingredients added from the library or a CSV, with price, supplier and minimum stock",
           "Dishes added from the library or created, with quantities checked and prices set", "Allergens checked (printed matrix on display for guests)",
           "First stocktake done", "Fridges and freezers set up in HACCP", "Printed menu and/or digital menu with QR on the tables"],
}

LEMA = {'ca': 'Escandalls i gestió de cuina', 'es': 'Escandallos y gestión de cocina', 'fr': 'Fiches de coût et gestion de cuisine', 'en': 'Recipe costing &amp; kitchen management'}

CSS = """.cap .lema { color: #FFA82E; font-weight: 700; letter-spacing: .04em; margin-top: 6px; }
@font-face { font-family: 'Montserrat'; font-weight: 800; src: url('../fonts/Montserrat-ExtraBold.ttf'); }
:root { --f: #1E2A3B; --c: #27354A; --c3: #31405A; --l: #41506A; --t: #F6EFE2; --s: #B9B2A5; --o: #FFA82E; }
* { box-sizing: border-box; }
body { margin: 0; background: linear-gradient(#24344A, #1A2533) fixed; color: var(--t); font: 15px/1.6 'Segoe UI', system-ui, sans-serif; }
.cap { text-align: center; padding: 34px 16px 18px; }
.cap img { width: 72px; } h1 { font: 800 30px 'Montserrat', 'Segoe UI'; margin: 8px 0 4px; } .cap p { color: var(--s); margin: 0 auto; max-width: 640px; }
.barra { width: 70px; height: 3px; margin: 14px auto 0; border-radius: 2px; background: linear-gradient(90deg, #FFA82E, #F2650F); }
main { max-width: 1040px; margin: 0 auto; padding: 0 16px 50px; }
nav { background: var(--c); border: 1px solid var(--l); border-radius: 12px; padding: 12px 16px; margin: 18px 0 26px; columns: 2 260px; column-gap: 24px; }
nav b { display: block; color: var(--o); font: 800 13px 'Montserrat', 'Segoe UI'; letter-spacing: .08em; text-transform: uppercase; margin-bottom: 6px; column-span: all; }
nav a { display: block; color: var(--t); text-decoration: none; padding: 2px 0; font-size: 14px; break-inside: avoid; } nav a:hover { color: var(--o); }
nav a span { color: var(--s); display: inline-block; width: 26px; }
section { background: var(--c); border: 1px solid var(--l); border-radius: 14px; padding: 18px 20px 20px; margin: 0 0 22px; }
h2 { font: 800 19px 'Montserrat', 'Segoe UI'; margin: 0 0 10px; display: flex; align-items: center; gap: 10px; }
h2 .n { background: linear-gradient(135deg, #FFA82E, #F2650F); color: #2a1400; border-radius: 50%; width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; font-size: 14px; flex: none; }
b { color: #FFC46B; } ul { padding-left: 20px; margin: 6px 0; } li { margin: 4px 0; } p { margin: 6px 0; }
.consell { background: var(--c3); border-left: 3px solid var(--o); border-radius: 8px; padding: 8px 12px; margin: 10px 0 0; font-size: 14px; }
figure { margin: 14px 0 0; } figure img { width: 100%; display: block; border-radius: 10px; border: 1px solid var(--l); cursor: zoom-in; box-shadow: 0 8px 24px rgba(10,16,26,.35); }
figure.gran { position: fixed; inset: 0; margin: 0; background: rgba(16,24,36,.92); display: flex; align-items: center; justify-content: center; z-index: 9; padding: 2vh 2vw; }
figure.gran img { width: auto; max-width: 96vw; max-height: 96vh; cursor: zoom-out; }
.check { list-style: none; padding: 0; } .check li { padding: 6px 0 6px 30px; position: relative; border-bottom: 1px dashed var(--l); }
.check li::before { content: '☐'; position: absolute; left: 4px; color: var(--o); font-size: 18px; line-height: 1.2; }
.peu { color: var(--s); text-align: center; font-size: 12px; margin-top: 26px; }
@media print { body { background: #fff; color: #222; } section, nav { background: #fff; border-color: #ccc; break-inside: avoid; } b { color: #000; } .consell { background: #f4efe6; }
  figure img { box-shadow: none; } .cap p, nav a span, .peu { color: #555; } nav a { color: #222; } }
"""


def md(text):
    out, llista = [], False
    for l in text.strip().split('\n'):
        e = html.escape(l.strip()[2:] if l.strip().startswith(('- ', '> ')) else l.strip())
        e = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', e)
        if l.startswith('- '):
            if not llista: out.append('<ul>'); llista = True
            out.append(f'<li>{e}</li>'); continue
        if llista: out.append('</ul>'); llista = False
        out.append(f'<p class="consell">💡 {e}</p>' if l.startswith('> ') else f'<p>{e}</p>')
    if llista: out.append('</ul>')
    return '\n'.join(out)


for ll, (titol, sub, pas, index, check, peu, imatge) in CAP.items():
    nav = ''.join(f'<a href="#s{k + 1}"><span>{k + 1}</span>{html.escape(s[1][ll][0])}</a>' for k, s in enumerate(SECCIONS))
    secc = ''.join(
        f'<section id="s{k + 1}"><h2><span class="n">{k + 1}</span>{html.escape(s[1][ll][0])}</h2>{md(s[1][ll][1])}'
        f'<figure><img src="img/{ll}/{s[0]}.webp" alt="{imatge} {k + 1}: {html.escape(s[1][ll][0])}" loading="lazy"></figure></section>'
        for k, s in enumerate(SECCIONS))
    chk = ''.join(f'<li>{html.escape(x)}</li>' for x in CHECK[ll])
    doc = f"""<!doctype html>
<html lang="{ll}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{html.escape(titol)} · Xoriguer Gastro</title><style>{CSS}</style></head><body>
<div class="cap"><img src="../img/icona-256.png" alt=""><div class="lema">Xoriguer Gastro · {LEMA[ll]}</div><h1>{html.escape(titol)}</h1><p>{html.escape(sub)}</p><div class="barra"></div></div>
<main><nav><b>{index}</b>{nav}</nav>{secc}
<section><h2><span class="n">✓</span>{html.escape(check)}</h2><ul class="check">{chk}</ul></section>
<div class="peu">{peu} · v3.4</div></main>
<script>document.addEventListener('click', (e) => {{ const f = e.target.closest('figure'); if (f) f.classList.toggle('gran'); }});
document.addEventListener('keydown', (e) => {{ if (e.key === 'Escape') document.querySelectorAll('figure.gran').forEach((f) => f.classList.remove('gran')); }});</script>
</body></html>"""
    (DIR / f'guia_{ll}.html').write_text(doc, encoding='utf-8')
    print('guia', ll)

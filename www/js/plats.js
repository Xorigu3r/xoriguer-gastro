/* Base de plats i elaboracions habituals (cuina de bar i restaurant), amb l'escandall per ració.
 * Cada línia: [ingredient (nom català de base.js) | '@elaboració', quantitat, unitat].
 * En afegir un plat: es fan servir els ingredients que ja tens (pel nom, en qualsevol idioma) i els que falten
 * es creen des de la base amb un PREU ORIENTATIU (marcat fins que hi poses el real); les elaboracions de dins també
 * s'afegeixen. El cost surt dels preus dels ingredients i es
 * recalcula sol quan canvies el preu d'un ingredient. Les quantitats són una referència: ajusta-les a la teva cuina. */
'use strict';
(function (g) {
  const P = (noms, tipus, cat, partida, racions, linies, extra = {}) => ({ noms: noms.split('|'), tipus, cat, partida, racions, linies, ...extra });
  const OLI = "Oli d'oliva verge extra", GIRA = 'Oli de gira-sol';
  const F = [
    // ── Elaboracions (sub-receptes) ──
    P('Salsa brava|Salsa brava|Sauce brava|Brava sauce', 'elab', 'Altres', 'Cuina calenta', 1,
      [[OLI, 200, 'ml'], ['Pebre vermell picant', 20, 'g'], ['Pebre vermell dolç', 20, 'g'], ['All', 30, 'g'], ['Farina de blat', 50, 'g'], ['Brou de pollastre', 600, 'ml'], ['Sal', 8, 'g']], { rend: [1, 'l'], conserva: 5 }),
    P('Allioli|Alioli|Aïoli|Aioli', 'elab', 'Altres', 'Cuina freda', 1,
      [['All', 40, 'g'], [OLI, 500, 'ml'], ['Ou', 1, 'u'], ['Sal', 5, 'g']], { rend: [550, 'g'], conserva: 2 }),
    P('Beixamel|Bechamel|Béchamel|Béchamel sauce', 'elab', 'Altres', 'Cuina calenta', 1,
      [['Llet sencera', 1, 'l'], ['Mantega', 80, 'g'], ['Farina de blat', 80, 'g'], ['Nou moscada', 1, 'g'], ['Sal', 6, 'g']], { rend: [1.1, 'kg'], conserva: 3 }),
    P('Sofregit|Sofrito|Sofrito|Sofrito', 'elab', 'Altres', 'Cuina calenta', 1,
      [['Ceba', 1, 'kg'], ['Tomàquet triturat', 1, 'kg'], [OLI, 150, 'ml'], ['All', 30, 'g'], ['Sal', 10, 'g']], { rend: [1.2, 'kg'], conserva: 5 }),
    P('Salsa de tomàquet|Salsa de tomate|Sauce tomate|Tomato sauce', 'elab', 'Altres', 'Cuina calenta', 1,
      [['Tomàquet triturat', 1, 'kg'], [OLI, 60, 'ml'], ['Ceba', 200, 'g'], ['All', 10, 'g'], ['Sucre', 10, 'g'], ['Orenga', 2, 'g'], ['Sal', 8, 'g']], { rend: [900, 'g'], conserva: 5 }),
    P('Vinagreta|Vinagreta|Vinaigrette|Vinaigrette', 'elab', 'Altres', 'Cuina freda', 1,
      [[OLI, 300, 'ml'], ['Vinagre de vi', 100, 'ml'], ['Mostassa', 20, 'g'], ['Sal', 5, 'g']], { rend: [420, 'ml'], conserva: 7 }),
    P('Romesco|Romesco|Sauce romesco|Romesco sauce', 'elab', 'Altres', 'Cuina freda', 1,
      [['Tomàquet', 500, 'g'], ['All', 40, 'g'], ['Ametlla', 100, 'g'], ['Pa de pagès', 50, 'g'], [OLI, 200, 'ml'], ['Vinagre de vi', 30, 'ml'], ['Pebre vermell dolç', 10, 'g'], ['Sal', 6, 'g']], { rend: [700, 'g'], conserva: 4 }),
    P('Massa de croquetes de pernil|Masa de croquetas de jamón|Appareil à croquettes au jambon|Ham croquette mix', 'elab', 'Altres', 'Cuina calenta', 1,
      [['@Beixamel', 900, 'g'], ['Pernil serrà', 200, 'g'], ['Ceba', 80, 'g'], ['Mantega', 20, 'g']], { rend: [1.1, 'kg'], conserva: 2 }),

    // ── Tapes ──
    P('Patates braves|Patatas bravas|Pommes de terre bravas|Patatas bravas', 'plat', 'Tapes', 'Fregidora', 1,
      [['Patata', 250, 'g'], [GIRA, 30, 'ml'], ['@Salsa brava', 60, 'ml'], ['Sal', 2, 'g']]),
    P('Patates amb allioli|Patatas con alioli|Pommes de terre à l\'aïoli|Potatoes with aioli', 'plat', 'Tapes', 'Fregidora', 1,
      [['Patata', 250, 'g'], [GIRA, 30, 'ml'], ['@Allioli', 50, 'g'], ['Sal', 2, 'g']]),
    P('Croquetes de pernil (6 u)|Croquetas de jamón (6 u)|Croquettes au jambon (6 p.)|Ham croquettes (6)', 'plat', 'Tapes', 'Fregidora', 1,
      [['@Massa de croquetes de pernil', 210, 'g'], ['Farina de blat', 15, 'g'], ['Ou', 0.5, 'u'], ['Pa ratllat', 30, 'g'], [GIRA, 30, 'ml']]),
    P('Calamars a la romana|Calamares a la romana|Calamars frits|Fried squid rings', 'plat', 'Tapes', 'Fregidora', 1,
      [['Calamar', 180, 'g'], ['Farina de blat', 40, 'g'], [GIRA, 40, 'ml'], ['Llimona', 30, 'g'], ['Sal', 2, 'g']]),
    P('Pebrots del padró|Pimientos de padrón|Piments de padrón|Padrón peppers', 'plat', 'Tapes', 'Planxa i brasa', 1,
      [['Pebrots del padró', 150, 'g'], [OLI, 15, 'ml'], ['Sal', 3, 'g']]),
    P('Pop a la gallega|Pulpo a la gallega|Poulpe à la galicienne|Galician-style octopus', 'plat', 'Tapes', 'Cuina calenta', 1,
      [['Pop', 150, 'g'], ['Patata', 150, 'g'], [OLI, 20, 'ml'], ['Pebre vermell dolç', 2, 'g'], ['Sal', 3, 'g']]),
    P('Gambes a l\'all|Gambas al ajillo|Crevettes à l\'ail|Garlic prawns', 'plat', 'Tapes', 'Cuina calenta', 1,
      [['Gambes', 150, 'g'], ['All', 15, 'g'], [OLI, 60, 'ml'], ['Pebre vermell picant', 1, 'g'], ['Julivert', 3, 'g'], ['Sal', 2, 'g']]),
    P('Musclos a la marinera|Mejillones a la marinera|Moules marinières|Mussels marinière', 'plat', 'Tapes', 'Cuina calenta', 1,
      [['Musclos', 400, 'g'], ['@Sofregit', 80, 'g'], ['Vi blanc', 50, 'ml'], ['Julivert', 3, 'g']]),
    P('Seitons en vinagre|Boquerones en vinagre|Anchois marinés|Marinated anchovies', 'plat', 'Tapes', 'Cuina freda', 1,
      [['Seitons', 150, 'g'], ['Vinagre de vi', 60, 'ml'], ['All', 5, 'g'], ['Julivert', 3, 'g'], [OLI, 20, 'ml'], ['Sal', 3, 'g']]),
    P('Pa amb tomàquet|Pan con tomate|Pain à la tomate|Tomato bread', 'plat', 'Tapes', 'Barra', 1,
      [['Pa de pagès', 120, 'g'], ['Tomàquet de penjar', 80, 'g'], [OLI, 10, 'ml'], ['Sal', 1, 'g']]),
    P('Pa amb tomàquet i pernil|Pan con tomate y jamón|Pain à la tomate et jambon cru|Tomato bread with ham', 'plat', 'Tapes', 'Barra', 1,
      [['Pa de pagès', 120, 'g'], ['Tomàquet de penjar', 80, 'g'], ['Pernil serrà', 60, 'g'], [OLI, 10, 'ml'], ['Sal', 1, 'g']]),
    P('Truita de patates|Tortilla de patatas|Tortilla espagnole|Spanish omelette', 'plat', 'Tapes', 'Cuina calenta', 8,
      [['Patata', 1, 'kg'], ['Ou', 8, 'u'], ['Ceba', 200, 'g'], [OLI, 250, 'ml'], ['Sal', 8, 'g']]),
    P('Ous estrellats amb pernil|Huevos rotos con jamón|Œufs au plat, frites et jambon|Fried eggs with chips and ham', 'plat', 'Tapes', 'Fregidora', 1,
      [['Ou', 2, 'u'], ['Patata', 200, 'g'], ['Pernil serrà', 50, 'g'], [GIRA, 30, 'ml'], ['Sal', 2, 'g']]),
    P('Ració de formatge manxec|Ración de queso manchego|Assiette de manchego|Manchego cheese plate', 'plat', 'Tapes', 'Barra', 1,
      [['Formatge manxec', 100, 'g'], [OLI, 5, 'ml']]),
    P('Olives|Aceitunas|Olives|Olives', 'plat', 'Tapes', 'Barra', 1, [['Olives', 100, 'g']]),
    P('Escalivada|Escalivada|Légumes grillés catalans|Catalan roasted vegetables', 'plat', 'Tapes', 'Planxa i brasa', 1,
      [['Pebrot vermell', 150, 'g'], ['Albergínia', 150, 'g'], ['Ceba', 100, 'g'], [OLI, 20, 'ml'], ['Sal', 2, 'g']]),

    // ── Amanides ──
    P('Amanida verda|Ensalada verde|Salade verte|Green salad', 'plat', 'Amanides', 'Cuina freda', 1,
      [['Enciam', 120, 'g'], ['Tomàquet', 100, 'g'], ['Ceba', 30, 'g'], ['Cogombre', 50, 'g'], ['@Vinagreta', 30, 'ml']]),
    P('Amanida catalana|Ensalada catalana|Salade catalane|Catalan salad', 'plat', 'Amanides', 'Cuina freda', 1,
      [['Enciam', 100, 'g'], ['Tomàquet', 100, 'g'], ['Pernil serrà', 30, 'g'], ['Fuet', 30, 'g'], ['Ou', 1, 'u'], ['Olives', 20, 'g'], ['@Vinagreta', 25, 'ml']]),
    P('Amanida de formatge de cabra|Ensalada de queso de cabra|Salade de chèvre|Goat cheese salad', 'plat', 'Amanides', 'Cuina freda', 1,
      [['Enciam', 100, 'g'], ['Formatge de cabra', 80, 'g'], ['Nous', 20, 'g'], ['Poma', 60, 'g'], ['Mel', 10, 'g'], ['@Vinagreta', 25, 'ml']]),
    P('Amanida César|Ensalada César|Salade César|Caesar salad', 'plat', 'Amanides', 'Cuina freda', 1,
      [['Enciam', 150, 'g'], ['Pit de pollastre', 120, 'g'], ['Formatge parmesà', 20, 'g'], ['Pa de motlle', 30, 'g'], ['Maionesa', 30, 'g'], ['Anxoves', 10, 'g'], [OLI, 10, 'ml']]),

    // ── Primers ──
    P('Crema de carbassa|Crema de calabaza|Velouté de potiron|Pumpkin soup', 'plat', 'Entrants', 'Cuina calenta', 1,
      [['Carbassa', 250, 'g'], ['Ceba', 40, 'g'], ['Patata', 50, 'g'], ['Nata per cuinar', 30, 'ml'], [OLI, 10, 'ml'], ['Brou de pollastre', 200, 'ml'], ['Sal', 2, 'g']]),
    P('Gaspatxo|Gazpacho|Gaspacho|Gazpacho', 'plat', 'Entrants', 'Cuina freda', 1,
      [['Tomàquet', 250, 'g'], ['Cogombre', 40, 'g'], ['Pebrot verd', 30, 'g'], ['All', 2, 'g'], ['Pa de pagès', 20, 'g'], [OLI, 25, 'ml'], ['Vinagre de vi', 10, 'ml'], ['Sal', 2, 'g']]),
    P('Macarrons a la bolonyesa|Macarrones a la boloñesa|Macaronis à la bolognaise|Macaroni bolognese', 'plat', 'Pasta i arròs', 'Cuina calenta', 1,
      [['Macarrons', 100, 'g'], ['Carn picada de vedella', 80, 'g'], ['@Salsa de tomàquet', 120, 'g'], ['Ceba', 30, 'g'], ['Formatge parmesà', 15, 'g'], [OLI, 10, 'ml']]),
    P('Espaguetis a la carbonara|Espaguetis a la carbonara|Spaghetti à la carbonara|Spaghetti carbonara', 'plat', 'Pasta i arròs', 'Cuina calenta', 1,
      [['Espaguetis', 100, 'g'], ['Bacó', 60, 'g'], ['Ou', 1, 'u'], ['Formatge parmesà', 25, 'g'], ['Pebre negre', 1, 'g'], ['Sal', 2, 'g']]),
    P('Llenties estofades|Lentejas estofadas|Lentilles mijotées|Lentil stew', 'plat', 'Entrants', 'Cuina calenta', 1,
      [['Llenties', 80, 'g'], ['Xoriço', 40, 'g'], ['@Sofregit', 60, 'g'], ['Pastanaga', 40, 'g'], ['Patata', 60, 'g'], ['Pebre vermell dolç', 2, 'g'], ['Sal', 2, 'g']]),
    P('Paella de marisc|Paella de marisco|Paella aux fruits de mer|Seafood paella', 'plat', 'Pasta i arròs', 'Cuina calenta', 1,
      [['Arròs bomba', 90, 'g'], ['Gambes', 60, 'g'], ['Musclos', 80, 'g'], ['Calamar', 60, 'g'], ['@Sofregit', 50, 'g'], ['Fumet de peix', 300, 'ml'], ['Safrà', 0.1, 'g'], [OLI, 20, 'ml'], ['Sal', 2, 'g']]),
    P('Fideuà|Fideuá|Fideuà|Fideuà (noodle paella)', 'plat', 'Pasta i arròs', 'Cuina calenta', 1,
      [['Fideus', 90, 'g'], ['Gambes', 60, 'g'], ['Sípia', 60, 'g'], ['@Sofregit', 40, 'g'], ['Fumet de peix', 250, 'ml'], [OLI, 20, 'ml'], ['@Allioli', 20, 'g']]),

    // ── Segons ──
    P('Hamburguesa clàssica amb patates|Hamburguesa clásica con patatas|Burger classique et frites|Classic burger with fries', 'plat', 'Hamburgueses', 'Planxa i brasa', 1,
      [["Pa d'hamburguesa", 1, 'u'], ['Hamburguesa de vedella', 1, 'u'], ['Formatge en llesques', 20, 'g'], ['Enciam', 15, 'g'], ['Tomàquet', 30, 'g'], ['Ceba', 15, 'g'], ['Quètxup', 15, 'g'], ['Patates congelades', 150, 'g'], [GIRA, 20, 'ml']]),
    P('Entrecot a la brasa amb patates|Entrecot a la brasa con patatas|Entrecôte grillée et frites|Grilled sirloin with fries', 'plat', 'Carns', 'Planxa i brasa', 1,
      [['Entrecot de vedella', 300, 'g'], ['Patates congelades', 150, 'g'], ['Pebrots del padró', 40, 'g'], [GIRA, 20, 'ml'], ['Sal', 3, 'g']]),
    P('Llom a la planxa amb patates|Lomo a la plancha con patatas|Longe de porc grillée et frites|Grilled pork loin with fries', 'plat', 'Carns', 'Planxa i brasa', 1,
      [['Llom de porc', 180, 'g'], ['Patates congelades', 150, 'g'], ['Enciam', 30, 'g'], [GIRA, 20, 'ml'], ['Sal', 2, 'g']]),
    P('Pit de pollastre a la planxa amb amanida|Pechuga a la plancha con ensalada|Blanc de poulet grillé et salade|Grilled chicken breast with salad', 'plat', 'Carns', 'Planxa i brasa', 1,
      [['Pit de pollastre', 200, 'g'], ['Enciam', 60, 'g'], ['Tomàquet', 60, 'g'], [OLI, 15, 'ml'], ['Sal', 2, 'g']]),
    P('Botifarra amb mongetes|Butifarra con judías|Saucisse catalane aux haricots|Catalan sausage with beans', 'plat', 'Carns', 'Planxa i brasa', 1,
      [['Botifarra', 200, 'g'], ['Mongetes seques', 70, 'g'], [OLI, 15, 'ml'], ['All', 3, 'g'], ['Julivert', 2, 'g'], ['Sal', 2, 'g']]),
    P('Lluç a la romana|Merluza a la romana|Merlu frit|Battered hake', 'plat', 'Peixos', 'Fregidora', 1,
      [['Lluç', 180, 'g'], ['Farina de blat', 30, 'g'], ['Ou', 1, 'u'], [GIRA, 40, 'ml'], ['Llimona', 20, 'g'], ['Sal', 2, 'g']]),
    P('Bacallà a la llauna|Bacalao a la llauna|Morue à la catalane|Baked salt cod', 'plat', 'Peixos', 'Cuina calenta', 1,
      [['Bacallà dessalat', 200, 'g'], ['All', 10, 'g'], ['Pebre vermell dolç', 2, 'g'], ['Vi blanc', 40, 'ml'], [OLI, 40, 'ml'], ['Farina de blat', 15, 'g'], ['Julivert', 2, 'g']]),
    P('Salmó a la planxa amb espinacs|Salmón a la plancha con espinacas|Saumon grillé aux épinards|Grilled salmon with spinach', 'plat', 'Peixos', 'Planxa i brasa', 1,
      [['Salmó', 180, 'g'], ['Espinacs', 120, 'g'], ['Llimona', 20, 'g'], [OLI, 15, 'ml'], ['Sal', 2, 'g']]),
    P('Orada al forn|Dorada al horno|Dorade au four|Baked sea bream', 'plat', 'Peixos', 'Cuina calenta', 1,
      [['Orada', 400, 'g'], ['Patata', 150, 'g'], ['Ceba', 50, 'g'], [OLI, 25, 'ml'], ['Vi blanc', 30, 'ml'], ['Sal', 3, 'g']]),
    P('Plat combinat de llom|Plato combinado de lomo|Assiette complète au porc|Pork combo plate', 'plat', 'Plats combinats', 'Planxa i brasa', 1,
      [['Llom de porc', 120, 'g'], ['Ou', 2, 'u'], ['Patates congelades', 150, 'g'], ['Enciam', 30, 'g'], ['Tomàquet', 40, 'g'], [GIRA, 30, 'ml']]),
    P('Pizza margarida|Pizza margarita|Pizza margherita|Margherita pizza', 'plat', 'Plats principals', 'Cuina calenta', 1,
      [['Massa de pizza', 1, 'u'], ['@Salsa de tomàquet', 80, 'g'], ['Mozzarella', 125, 'g'], ['Alfàbrega', 3, 'g'], ['Orenga', 1, 'g'], [OLI, 10, 'ml']]),

    // ── Entrepans ──
    P('Entrepà de pernil|Bocadillo de jamón|Sandwich au jambon cru|Serrano ham sandwich', 'plat', 'Entrepans', 'Barra', 1,
      [['Pa de barra', 0.5, 'u'], ['Pernil serrà', 60, 'g'], ['Tomàquet de penjar', 30, 'g'], [OLI, 5, 'ml']]),
    P('Entrepà de llom amb formatge|Bocadillo de lomo con queso|Sandwich porc et fromage|Pork loin and cheese sandwich', 'plat', 'Entrepans', 'Planxa i brasa', 1,
      [['Pa de barra', 0.5, 'u'], ['Llom de porc', 120, 'g'], ['Formatge en llesques', 30, 'g'], [OLI, 5, 'ml']]),
    P('Entrepà de truita|Bocadillo de tortilla|Sandwich à l\'omelette|Omelette sandwich', 'plat', 'Entrepans', 'Cuina calenta', 1,
      [['Pa de barra', 0.5, 'u'], ['Ou', 2, 'u'], [OLI, 15, 'ml'], ['Sal', 1, 'g']]),
    P('Entrepà de tonyina|Bocadillo de atún|Sandwich au thon|Tuna sandwich', 'plat', 'Entrepans', 'Barra', 1,
      [['Pa de barra', 0.5, 'u'], ['Tonyina en conserva', 70, 'g'], ['Tomàquet', 40, 'g'], ['Olives', 15, 'g'], [OLI, 5, 'ml']]),
    P('Entrepà de botifarra|Bocadillo de butifarra|Sandwich à la saucisse catalane|Catalan sausage sandwich', 'plat', 'Entrepans', 'Planxa i brasa', 1,
      [['Pa de barra', 0.5, 'u'], ['Botifarra', 150, 'g'], [OLI, 5, 'ml']]),
    P('Bikini|Sándwich mixto|Croque-monsieur|Ham and cheese toastie', 'plat', 'Entrepans', 'Planxa i brasa', 1,
      [['Pa de motlle', 80, 'g'], ['Pernil cuit', 40, 'g'], ['Formatge en llesques', 30, 'g'], ['Mantega', 10, 'g']]),

    // ── Postres ──
    P('Crema catalana|Crema catalana|Crème catalane|Crema catalana', 'plat', 'Postres', 'Pastisseria', 1,
      [['Llet sencera', 125, 'ml'], ['Ou', 1, 'u'], ['Sucre', 30, 'g'], ['Farina de blat', 8, 'g'], ['Llimona', 5, 'g'], ['Canyella', 0.5, 'g']]),
    P("Flam d'ou|Flan de huevo|Flan aux œufs|Egg custard flan", 'plat', 'Postres', 'Pastisseria', 1,
      [['Llet sencera', 100, 'ml'], ['Ou', 1, 'u'], ['Sucre', 30, 'g']]),
    P('Pastís de formatge|Tarta de queso|Gâteau au fromage|Cheesecake', 'plat', 'Postres', 'Pastisseria', 10,
      [['Formatge cremós', 600, 'g'], ['Nata per cuinar', 200, 'ml'], ['Ou', 4, 'u'], ['Sucre', 150, 'g'], ['Farina de blat', 20, 'g']]),
    P('Pastís de xocolata i nous|Brownie de chocolate y nueces|Brownie chocolat-noix|Chocolate walnut brownie', 'plat', 'Postres', 'Pastisseria', 12,
      [['Xocolata negra', 200, 'g'], ['Mantega', 150, 'g'], ['Ou', 4, 'u'], ['Sucre', 180, 'g'], ['Farina de blat', 100, 'g'], ['Nous', 80, 'g']]),
    P('Macedònia de fruita|Macedonia de frutas|Salade de fruits|Fruit salad', 'plat', 'Postres', 'Cuina freda', 1,
      [['Taronja', 80, 'g'], ['Poma', 80, 'g'], ['Plàtan', 60, 'g'], ['Maduixes', 60, 'g'], ['Sucre', 5, 'g']]),
    P('Gelat (2 boles)|Helado (2 bolas)|Glace (2 boules)|Ice cream (2 scoops)', 'plat', 'Postres', 'Barra', 1,
      [['Gelat de vainilla', 120, 'ml']]),
    P('Iogurt amb mel i nous|Yogur con miel y nueces|Yaourt au miel et aux noix|Yogurt with honey and walnuts', 'plat', 'Postres', 'Barra', 1,
      [['Iogurt natural', 1, 'u'], ['Mel', 15, 'g'], ['Nous', 15, 'g']]),

    // ── Barra ──
    P('Cafè sol|Café solo|Café expresso|Espresso', 'article', 'Cafès', 'Barra', 1, [['Cafè en gra', 7, 'g']]),
    P('Tallat|Cortado|Noisette|Cortado', 'article', 'Cafès', 'Barra', 1, [['Cafè en gra', 7, 'g'], ['Llet sencera', 30, 'ml']]),
    P('Cafè amb llet|Café con leche|Café au lait|White coffee', 'article', 'Cafès', 'Barra', 1, [['Cafè en gra', 7, 'g'], ['Llet sencera', 120, 'ml']]),
    P('Canya de cervesa|Caña de cerveza|Demi pression|Small draught beer', 'article', 'Begudes', 'Barra', 1, [['Cervesa de barril', 200, 'ml']]),
    P('Copa de vi negre|Copa de vino tinto|Verre de vin rouge|Glass of red wine', 'article', 'Vins', 'Barra', 1, [['Vi negre', 150, 'ml']]),
    P('Copa de vi blanc|Copa de vino blanco|Verre de vin blanc|Glass of white wine', 'article', 'Vins', 'Barra', 1, [['Vi blanc', 150, 'ml']]),
    P('Copa de cava|Copa de cava|Coupe de cava|Glass of cava', 'article', 'Vins', 'Barra', 1, [['Cava', 120, 'ml']]),
    P('Vermut|Vermut|Vermouth|Vermouth', 'article', 'Begudes', 'Barra', 1, [['Vermut', 100, 'ml'], ['Olives', 10, 'g'], ['Taronja', 10, 'g']]),
    P('Refresc de cola|Refresco de cola|Soda au cola|Cola', 'article', 'Begudes', 'Barra', 1, [['Refresc de cola 33 cl', 1, 'u']]),
    P('Aigua mineral|Agua mineral|Eau minérale|Mineral water', 'article', 'Begudes', 'Barra', 1, [['Aigua mineral 50 cl', 1, 'u']]),
    P('Cervesa (ampolla)|Cerveza (botellín)|Bière (bouteille)|Bottled beer', 'article', 'Begudes', 'Barra', 1, [['Cervesa 33 cl', 1, 'u']]),
    P('Suc de taronja natural|Zumo de naranja natural|Jus d\'orange pressé|Fresh orange juice', 'article', 'Begudes', 'Barra', 1, [['Taronja', 450, 'g']]),
  ];

  const LL = { ca: 0, es: 1, fr: 2, en: 3 };
  const N = (s) => (g.GL ? g.GL.norm(s) : String(s).toLowerCase().trim());
  const perNom = new Map(F.map((p) => [p.noms[0], p]));

  /** Afegeix el plat `n` (índex) a les dades D: reaprofita els teus ingredients i elaboracions (pel nom, en qualsevol idioma)
   *  i crea els que falten. Torna l'id de la recepta (o el de la que ja tenies amb aquest nom). */
  function afegeix(D, n, ll = 'ca', creats = { ing: 0, rec: 0 }) {
    const GL = g.GL, B = g.BASE, k = LL[ll] ?? 0;
    const p = F[n]; if (!p) return null;
    const ja = D.receptes.find((r) => p.noms.some((x) => N(x) === N(r.nom)));
    if (ja) return ja.id;
    const linies = [];
    for (const [nom, q, u] of p.linies) {
      if (nom[0] === '@') {
        const sub = perNom.get(nom.slice(1));
        const id = afegeix(D, F.indexOf(sub), ll, creats);
        if (id) linies.push({ t: 'r', id, q, u });
        continue;
      }
      const b = B.llista.find((x) => x[0] === nom);
      const noms = b ? b.slice(0, 4) : [nom];
      let ing = D.ingredients.find((i) => noms.some((x) => N(x) === N(i.nom)));
      if (!ing && b) {
        ing = { id: GL.uid('i'), nom: b[k], familia: b[4], unitat: b[5], preu: B.preu(b[0]), orientatiu: B.preu(b[0]) > 0, rend: b[6], allergens: b[7] ? b[7].split(' ') : [], traces: [],
          nutri: { ...((g.NUTRI && g.NUTRI.busca(b[0])) || {}) }, estoc: 0, minim: 0, _alta: GL.avui() };
        if (b[8]) ing.gU = b[8];
        D.ingredients.push(ing); creats.ing++;
      }
      if (ing) linies.push({ t: 'i', id: ing.id, q, u: u || ing.unitat });
    }
    const T = (x) => (g.I18N ? g.I18N.t(x) : x);
    const r = { id: GL.uid('r'), nom: p.noms[k], tipus: p.tipus, cat: p.cat, partida: T(p.partida), pvp: 0, iva: GL.num(D.ajustos?.iva, 10),
      racions: p.racions, linies, traces: [], carta: p.tipus !== 'elab', revisat: GL.avui(), deLaBase: true };
    if (p.rend) { r.rendQ = p.rend[0]; r.rendU = p.rend[1]; }
    if (p.conserva) r.conserva = p.conserva;
    D.receptes.push(r); creats.rec++;
    return r.id;
  }
  /** Llista per triar: {n, nom, tipus, cat, partida} en la llengua `ll`. */
  const items = (ll = 'ca') => F.map((p, n) => ({ n, nom: p.noms[LL[ll] ?? 0], ca: p.noms[0], noms: p.noms, tipus: p.tipus, cat: p.cat, partida: p.partida, linies: p.linies }));
  g.PLATS = { llista: F, items, afegeix };
})(typeof window !== 'undefined' ? window : globalThis);

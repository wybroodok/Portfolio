// Corteza — Maison catalogue. Single source of truth for the eyewear collection.
// Imagery references editorial/product photography (Unsplash). The client degrades
// gracefully to a tonal gradient render if any asset fails to load.

const img = (id, w = 1600) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

export const maison = {
  name: 'CORTEZA',
  origin: 'Firenze, Italia',
  est: 'MCMXXIV',
  manifesto:
    'Occhiali forgiati a mano. Un tributo alla luce del Mediterraneo — dove il tempo rallenta e lo sguardo trova la sua misura.',
  manifestoEn:
    'Handmade eyewear — a tribute to Mediterranean light, where time slows and the gaze finds its measure.',
};

// The face of the season — hero editorial worn on a model.
export const hero = {
  id: 'riviera',
  eyebrow: 'La Collezione — Estate',
  title: 'Corteza',
  model: 'Riviera',
  tagline: 'La luce, addomesticata.',
  image: img('1610904329458-2512c4748c8d', 2400),
  imagePortrait: img('1610904329458-2512c4748c8d', 2400),
};

// The collection — models revealed one by one on scroll.
export const collection = [
  {
    id: 'riviera',
    name: 'Riviera',
    index: '01',
    silhouette: 'Angular Cat-Eye',
    tagline: 'La luce, addomesticata.',
    story:
      'Ispirata alle terrazze di Portofino al tramonto. Un profilo felino tagliato in acetato color miele.',
    material: 'Acetato Mazzucchelli — Miele',
    lens: 'Cristallo minerale, sfumatura ambra',
    price: 640,
    accent: '#E2622E',
    image: img('1511499767150-a48a237f0083'),
  },
  {
    id: 'fiorentina',
    name: 'Fiorentina',
    index: '02',
    silhouette: 'Round',
    tagline: 'Il classico, senza tempo.',
    story:
      'Il tondo rinascimentale. Cerchiatura sottile in oro spazzolato, per uno sguardo da poeta.',
    material: 'Titanio placcato oro 18k',
    lens: 'Cristallo grigio fumo',
    price: 720,
    accent: '#C9922E',
    image: img('1577803645773-f96470509666'),
  },
  {
    id: 'milano-nero',
    name: 'Milano Nero',
    index: '03',
    silhouette: 'Rectangular',
    tagline: 'L’eleganza è discrezione.',
    story:
      'Rigore milanese. Linee nette, nero assoluto — l’occhiale del sarto e del direttore.',
    material: 'Acetato nero opaco',
    lens: 'Cristallo antracite polarizzato',
    price: 580,
    accent: '#8A8A8A',
    image: img('1572635196237-14b3f281503f'),
  },
  {
    id: 'aviatore',
    name: 'Aviatore',
    index: '04',
    silhouette: 'Aviator',
    tagline: 'Per chi guarda lontano.',
    story:
      'La goccia aeronautica, reinterpretata. Ponte doppio in metallo bronzato, curve morbide.',
    material: 'Metallo bronzato a mano',
    lens: 'Cristallo verde G-15 sfumato',
    price: 690,
    accent: '#B87333',
    image: img('1473496169904-658ba7c44d8a'),
  },
  {
    id: 'veneziano',
    name: 'Veneziano',
    index: '05',
    silhouette: 'Oversized Square',
    tagline: 'Il dramma della laguna.',
    story:
      'Volumi generosi, spirito teatrale. Acetato tartaruga che cattura la luce dei canali.',
    material: 'Acetato tartaruga Havana',
    lens: 'Cristallo marrone graduato',
    price: 610,
    accent: '#9C6B3C',
    image: img('1559070081-648fb00b2ed1'),
  },
  {
    id: 'solaro',
    name: 'Solaro',
    index: '06',
    silhouette: 'Wrap Sport',
    tagline: 'Il meridiano di mezzogiorno.',
    story:
      'Avvolgente, scultoreo. Pensato per la vela e per la costa scoscesa, senza rinunciare allo stile.',
    material: 'Nylon Grilamid ultraleggero',
    lens: 'Cristallo specchiato arancio',
    price: 560,
    accent: '#E2622E',
    image: img('1509695507497-903c140c43b0'),
  },
];

export const catalogue = { maison, hero, collection };
export default catalogue;

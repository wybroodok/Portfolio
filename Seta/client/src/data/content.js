// Centralized content + imagery. Photos are high-resolution editorial shots
// served from the Unsplash CDN. Each <SmartImage> degrades to a branded
// gradient if a URL ever fails, so the layout never breaks.
const u = (id, w = 1400) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

// The two layers of the cursor-driven "x-ray" hero — the same man in the same
// pose, shot twice in different looks, so the reveal lines up perfectly.
// base = default look (black jacket), reveal = the look the x-ray uncovers
// (grey coat). Served from /public.
export const HERO = {
  base: '/xray-base.jpg',
  reveal: '/xray-reveal.png',
};

export const SLOGANS = [
  {
    kicker: 'Comfort',
    title: 'Weightless by design.',
    body: 'Every seam is engineered to disappear. What remains is the feeling of wearing nothing at all — only the quiet confidence of being perfectly dressed.',
  },
  {
    kicker: 'Freedom',
    title: 'Move without permission.',
    body: 'Cut for motion, not for the mannequin. Seta bends where you bend and holds where you hold, so the garment is never the thing you think about.',
  },
  {
    kicker: 'Restraint',
    title: 'Loud is easy. Quiet is hard.',
    body: 'No logos shouting for attention. Deep blacks, honest materials, and a single ember of warmth. The kind of luxury you feel before anyone sees it.',
  },
];

// Static editorial gallery — dark-tone menswear.
export const GALLERY = [
  { src: u('1490578474895-699cd4e2cf59', 900), alt: 'Studio portrait in charcoal', tall: true, tag: 'Charcoal' },
  { src: u('1488161628813-04466f872be2', 900), alt: 'Wool overcoat', tag: 'Overcoat' },
  { src: u('1503341504253-dff4815485f1', 900), alt: 'Textured knitwear', tag: 'Knit' },
  { src: u('1509087859087-a384654eca4d', 900), alt: 'Tailored silhouette in shadow', tall: true, tag: 'Tailoring' },
  { src: u('1521572163474-6864f9cf17ab', 900), alt: 'Minimal streetwear', tag: 'Street' },
  { src: u('1507003211169-0a1dd7228f2d', 900), alt: 'Portrait in low light', tag: 'Editorial' },
];

// Numbers strip on the Main page.
export const STATS = [
  { value: '01', label: 'Idea, endlessly refined' },
  { value: '42', label: 'Hours of hand-finishing per coat' },
  { value: '0', label: 'Logos on the outside' },
  { value: '∞', label: 'Ways to wear freedom' },
];

// House / Seta page.
export const STORY = [
  {
    year: '2019',
    title: 'A refusal',
    body: 'Seta began as a refusal — of fast fashion, of noise, of clothing that ages in a season. Two friends, one atelier, and an obsession with the feeling of fabric against skin.',
  },
  {
    year: '2021',
    title: 'The first black',
    body: 'It took two years to get the black right. Not grey pretending to be black. Not the black that fades. A deep, still #0A0A0A that swallows light and gives nothing back.',
  },
  {
    year: '2024',
    title: 'Made to be forgotten',
    body: 'Our highest ambition is to be forgotten on the body — a garment so comfortable you stop noticing it, and start noticing everything else. Freedom, worn.',
  },
];

export const CONTACT_EMAIL = 'atelier@seta.studio';

export const MATERIALS = [
  'Japanese-milled cotton',
  'Recycled Italian wool',
  'Vegetable-tanned leather',
  'Naturally dyed indigo',
];

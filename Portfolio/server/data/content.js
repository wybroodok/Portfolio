/**
 * Single source of truth for all portfolio content.
 *
 * This is intentionally plain data so it is trivial to edit without touching
 * any application logic. Swap the placeholder values below for the real
 * person's projects, links and bio.
 */

export const profile = {
  name: 'wybroodok',
  role: 'Product Designer & Full-Stack Engineer',
  tagline: 'I build quiet, precise interfaces where nothing is louder than it needs to be.',
  location: 'Remote · Worldwide',
  email: 'wybroodok@proton.me',
  available: true,
  bio: [
    'I design and ship digital products end to end — from the first sketch to the deployed pixel.',
    'My work lives at the intersection of restraint and craft: interfaces that feel inevitable, motion that feels physical, and systems that scale without noise.',
  ],
  socials: [
    {
      id: 'telegram',
      label: 'Telegram',
      handle: '@wybroodok',
      url: 'https://t.me/wybroodok',
      description: 'Fastest way to reach me',
    },
    {
      id: 'github',
      label: 'GitHub',
      handle: '@wybroodok',
      url: 'https://github.com/wybroodok',
      description: 'Open source & experiments',
    },
    {
      id: 'email',
      label: 'Email',
      handle: 'wybroodok@proton.me',
      url: 'mailto:wybroodok@proton.me',
      description: 'For long-form & business',
    },
  ],
};

/**
 * Testimonials shown on the Main page. `rating` drives the star row (1–5).
 * Edit / add entries freely — no app code needs to change.
 */
export const reviews = [
  {
    id: 'r1',
    rating: 5,
    quote:
      'We needed to take orders without building a whole website, and the Telegram bot with a mini app does exactly that. People place an order inside Telegram in under a minute now. He also walked me through managing it myself afterwards, which I really appreciated.',
    author: 'James K. — home bakery',
  },
  {
    id: 'r2',
    rating: 5,
    quote:
      'Delivered our iOS app pretty much how we pictured it, and the small animations make it feel far more expensive than it actually cost. I always knew which stage we were at — no chasing him for updates.',
    author: 'Priya S. — fitness coach',
  },
  {
    id: 'r3',
    rating: 5,
    quote:
      'Сделал сайт для нашей автомастерской быстро и без лишней воды. Скидывал промежуточные версии, правки вносил в тот же день. Клиенты наконец записываются онлайн, а не только по телефону.',
    author: 'Алексей — автосервис',
  },
  {
    id: 'r4',
    rating: 4,
    quote:
      'The Android app works great and our users love it. It took a few days longer than we first agreed, but he kept me in the loop the whole time and the final quality more than made up for it. Would hire again.',
    author: 'Marco D. — logistics startup',
  },
  {
    id: 'r5',
    rating: 5,
    quote:
      'Заказывала мини-приложение для магазина косметики в Телеграме. Получилось аккуратно и понятно даже моей маме — она теперь сама принимает заказы. Спасибо за терпение с моими бесконечными правками :)',
    author: 'Марина — магазин косметики',
  },
  {
    id: 'r6',
    rating: 5,
    quote:
      'Honestly expected a template and got something that actually feels like our brand. He asked the right questions early instead of just building whatever came to mind, and it showed in the result. Loads instantly on my phone too.',
    author: 'Emily T. — interior studio',
  },
];

/**
 * Projects. `featured: true` surfaces the project on the Main page.
 * `accent` (optional) overrides the default neon accent for a project's hero.
 */
export const projects = [
  {
    id: 'kinetik',
    title: 'Kinetik',
    subtitle: 'Linear-style SaaS task tracker',
    year: '2026',
    role: 'Designer & Full-Stack Engineer',
    tags: ['SaaS', 'Next.js', 'PostgreSQL'],
    summary:
      'A multi-tenant Kanban task tracker with fluid drag-and-drop and optimistic UI, built in the spirit of Linear.',
    description:
      'Kinetik is a production SaaS task tracker with a four-column Kanban board, workspace-based multi-tenancy and invite links. Built on Next.js (App Router) with TypeScript, Tailwind and Prisma over PostgreSQL, its backend is pure Server Actions for end-to-end type safety with no hand-rolled endpoints. Drag-and-drop uses fractional indexing so a move rewrites a single row, an optimistic UI reconciles against server truth via revalidation, and a requireMembership tenant-guard on every mutation makes cross-workspace access physically impossible.',
    cover: '#0C0E1A',
    accent: '#5E6AD2',
    featured: true,
    url: '/Kinetik',
    metrics: [
      { label: 'Backend', value: 'Server Actions' },
      { label: 'DB', value: 'Postgres' },
      { label: 'DnD', value: 'Fractional' },
    ],
  },
  {
    id: 'seta',
    title: 'Seta',
    subtitle: 'Wear Your Freedom — premium apparel brand',
    year: '2026',
    role: 'Designer & Full-Stack Engineer',
    tags: ['Brand', 'React', 'Node.js'],
    summary:
      'A production website for a premium apparel brand, built around a cursor-driven x-ray hero that reveals an alternate look.',
    description:
      'Seta pairs deep-black dark mode with a subtle orange ember and an atmosphere of freedom. Its signature is a cursor-driven x-ray hero: a soft lens follows the pointer and punches through the top layer with a CSS mask to reveal an alternate Seta outfit. A centralized Zustand router drives navigation via tabs, side arrows and arrow keys, while a rate-limited Express /api/contact endpoint powers the collaboration form end to end.',
    cover: '#141008',
    accent: '#FF7A1A',
    featured: true,
    url: '/Seta',
    metrics: [
      { label: 'Hero', value: 'X-ray' },
      { label: 'Backend', value: 'Express' },
      { label: 'Motion', value: 'Framer' },
    ],
  },
  {
    id: 'glowspace',
    title: 'GlowSpace',
    subtitle: 'Telegram Mini App for a beauty salon',
    year: '2026',
    role: 'Designer & Full-Stack Engineer',
    tags: ['Telegram Mini App', 'React', 'Python'],
    summary:
      'A booking Mini App living entirely inside Telegram — clients book services, track appointments and leave reviews without a separate site.',
    description:
      'GlowSpace is a full booking experience for a beauty salon, delivered as a Telegram Mini App with no separate website required. Clients pick a service, choose an available time slot, see their upcoming appointments, browse promotions and leave reviews — all inside Telegram. An aiogram bot and a FastAPI backend share a single SQLite database in one asyncio process, while the Mini App front end is a React 19 + TypeScript app built with Vite and Tailwind. Admins manage services, time slots and promotions from within the same Mini App — no external panel.',
    cover: '#1A0E16',
    accent: '#FF6FA5',
    featured: true,
    url: 'https://t.me/GlowSpaaceBot',
    metrics: [
      { label: 'Platform', value: 'Telegram' },
      { label: 'Bot', value: 'aiogram' },
      { label: 'Backend', value: 'FastAPI' },
    ],
  },
  {
    id: 'corteza',
    title: 'Corteza',
    subtitle: 'Maison di Occhiali — premium Italian eyewear',
    year: '2026',
    role: 'Designer & Full-Stack Engineer',
    tags: ['Brand', 'React', 'Node.js'],
    summary:
      'A production website for a premium Italian eyewear house — ultra-minimal dark mode with a subtle orange accent.',
    description:
      'Corteza is a full-brand experience for a maison of eyewear. An enum-driven central router (Zustand) powers a single Destination Switcher across La Collezione and La Maison, with Framer Motion shared-element flights from a model card into its full-screen detail view. A Node.js API serves the catalogue, and resilient imagery degrades to on-brand tonal gradients so the site stays premium even offline.',
    cover: '#1A130E',
    accent: '#FF7A1A',
    featured: true,
    url: '/Corteza',
    metrics: [
      { label: 'Models', value: '6' },
      { label: 'Tabs', value: '2' },
      { label: 'Router', value: 'Zustand' },
    ],
  },
  {
    id: 'logiqai',
    title: 'LogiqAI',
    subtitle: 'AI-powered automated audit intelligence',
    year: '2026',
    role: 'Designer & Full-Stack Engineer',
    tags: ['AI', 'FastAPI', 'React'],
    summary:
      'Upload code, financial spend or a résumé and get a structured audit — health score, interactive analytics and prioritized AI recommendations.',
    description:
      'LogiqAI turns any uploaded file into a structured audit. A fully async FastAPI backend streams the upload to Google Gemini (gemini-2.0-flash) using Structured Output constrained to a Pydantic schema, so the model can only return strictly-valid JSON — and if the key is missing or the provider fails, /api/analyze returns 503 with no mock fallback. The React + Vite front end renders three animated tabs driven by Zustand: a Dashboard with a score ring and metric cards, an Analytics view with Recharts area and donut charts on a Tech-Cyber graphite surface, and AI Insights grouped into Critical / Important / Tips with collapsible detail.',
    cover: '#141619',
    accent: '#c8a253',
    featured: true,
    url: '/LogiqAI',
    metrics: [
      { label: 'AI', value: 'Gemini' },
      { label: 'Backend', value: 'FastAPI' },
      { label: 'Output', value: 'Structured' },
    ],
  },
  {
    id: 'talkly',
    title: 'Talkly',
    subtitle: 'Corporate real-time messenger',
    year: '2026',
    role: 'Designer & Full-Stack Engineer',
    tags: ['Real-time', 'Socket.io', 'Redis'],
    summary:
      'A Cyberpunk-Corporate messenger built for thousands of stable concurrent connections and horizontal scaling.',
    description:
      'Talkly is a real-time corporate messenger engineered to scale horizontally across instances. A TypeScript Node.js + Socket.io backend broadcasts through the @socket.io/redis-adapter so any room event fans out to every instance behind an Nginx sticky load balancer. A two-tier cache serves the last 50 messages instantly from a Redis ZSET and falls back to keyset pagination in PostgreSQL on scroll-up, while socket-counted presence and Redis-backed session sync keep multi-tab clients consistent. A single shared events contract is imported by both sides, so client and server types physically cannot drift — powering typing indicators, delivery/read receipts and resilient reconnects.',
    cover: '#0D0F12',
    accent: '#A855F7',
    featured: true,
    url: '/Talkly',
    metrics: [
      { label: 'Transport', value: 'Socket.io' },
      { label: 'Scale', value: 'Redis adapter' },
      { label: 'Store', value: 'Postgres' },
    ],
  },
  {
    id: 'atlas',
    title: 'Atlas',
    subtitle: 'Internal tooling platform',
    year: '2023',
    role: 'Frontend Lead',
    tags: ['Platform', 'React', 'DX'],
    summary:
      'A unified shell that hosts dozens of internal micro-apps behind one coherent surface.',
    description:
      'Atlas gave 300+ engineers a single, fast home for internal tools. I designed the app-shell architecture and the plugin contract that let teams ship modules without touching the core.',
    cover: '#101210',
    accent: '#00FF9D',
    featured: false,
    url: 'https://example.com/atlas',
    metrics: [
      { label: 'Modules', value: '32' },
      { label: 'Engineers', value: '300+' },
    ],
  },
  {
    id: 'echo',
    title: 'Echo',
    subtitle: 'Voice-first note taking',
    year: '2023',
    role: 'Product Designer',
    tags: ['Mobile', 'AI', 'Audio'],
    summary:
      'Capture a thought by speaking; Echo transcribes, structures and files it away silently.',
    description:
      'Echo reimagines note-taking around the voice. I designed the ambient capture flow and the review surface that turns raw speech into structured, searchable notes.',
    cover: '#120E12',
    accent: '#B388FF',
    featured: false,
    url: 'https://example.com/echo',
    metrics: [
      { label: 'Accuracy', value: '98%' },
      { label: 'Languages', value: '12' },
    ],
  },
  {
    id: 'terra',
    title: 'Terra',
    subtitle: 'E-commerce for sustainable goods',
    year: '2022',
    role: 'Full-Stack Engineer',
    tags: ['E-commerce', 'Node.js', 'Payments'],
    summary:
      'A storefront that foregrounds provenance — every product tells where it came from.',
    description:
      'Terra pairs a fast headless storefront with a transparent supply-chain layer. I built the checkout, payments and the provenance timeline shown on every product page.',
    cover: '#0E120E',
    accent: '#7CFF6B',
    featured: false,
    url: 'https://example.com/terra',
    metrics: [
      { label: 'Conversion', value: '+24%' },
      { label: 'Markets', value: '9' },
    ],
  },
];

export const getFeaturedProjects = () => projects.filter((p) => p.featured);
export const getProjectById = (id) => projects.find((p) => p.id === id);

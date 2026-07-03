import { create } from 'zustand';

/**
 * Centralised, enum-driven router for Corteza.
 * The whole app navigates through this single store — the <AppRouter> reads
 * `destination` and renders the matching screen, while `product` layers a
 * detail view on top (shared-element / matchedGeometryEffect transition).
 */
export const DESTINATIONS = {
  COLLEZIONE: 'COLLEZIONE', // the collection (home)
  MAISON: 'MAISON', // the house / story
};

export const useRouter = create((set, get) => ({
  destination: DESTINATIONS.COLLEZIONE,
  product: null, // active product id (detail overlay), or null
  // id of the element the transition should originate from — powers layoutId
  originId: null,

  navigate: (destination) => {
    if (get().destination === destination) return;
    set({ destination, product: null });
    window.scrollTo({ top: 0, behavior: 'auto' });
  },

  openProduct: (id) => set({ product: id, originId: id }),

  closeProduct: () => set({ product: null }),
}));

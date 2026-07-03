import { AnimatePresence } from 'framer-motion';
import { useCatalogue } from './data/useCatalogue.js';
import Loader from './components/Loader.jsx';
import Navigation from './components/Navigation.jsx';
import AppRouter from './router/AppRouter.jsx';
import './App.css';

export default function App() {
  const { data, ready } = useCatalogue();

  return (
    <>
      <AnimatePresence>{!ready && <Loader key="loader" />}</AnimatePresence>

      {ready && (
        <>
          <Navigation maison={data.maison} />
          <AppRouter data={data} />
        </>
      )}
    </>
  );
}

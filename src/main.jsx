import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import App from './App';

/*
  This is the entry point — the first file Vite loads.
  It does two things only:
    1. Import global CSS so it applies to the whole app.
    2. Mount <App /> into the #root div in index.html.

  StrictMode is a React development tool that intentionally
  double-renders components to help catch bugs early.
  It has no effect in the production build.
*/
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);

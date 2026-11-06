import {createRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router';
import App from './App.tsx';
import {AppStateProvider} from './app/AppStateContext.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <AppStateProvider>
      <App />
    </AppStateProvider>
  </BrowserRouter>
);

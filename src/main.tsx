import {createRoot} from 'react-dom/client';
import '@fontsource-variable/plus-jakarta-sans';
import {BrowserRouter} from 'react-router';
import App from './App.tsx';
import {AppStateProvider} from './app/AppStateContext.tsx';
import {ThemeProvider} from './app/providers/ThemeProvider';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <BrowserRouter>
      <AppStateProvider>
        <App />
      </AppStateProvider>
    </BrowserRouter>
  </ThemeProvider>,
);

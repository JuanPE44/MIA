import {createRoot} from 'react-dom/client';
import '@fontsource-variable/fraunces/full.css';
import '@fontsource-variable/hanken-grotesk';
import '@fontsource-variable/jetbrains-mono';
import {BrowserRouter} from 'react-router';
import App from './App.tsx';
import {AppStateProvider} from './app/AppStateContext.tsx';
import {ThemeProvider} from './app/providers/ThemeProvider';
import {ToastProvider} from './ui/Toast';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <ToastProvider>
      <BrowserRouter>
        <AppStateProvider>
          <App />
        </AppStateProvider>
      </BrowserRouter>
    </ToastProvider>
  </ThemeProvider>,
);

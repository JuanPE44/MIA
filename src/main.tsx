import {createRoot} from 'react-dom/client';
import '@fontsource-variable/jetbrains-mono';
import './styles/ranade.css';
import {BrowserRouter} from 'react-router';
import App from './App.tsx';
import {AppStateProvider} from './app/AppStateContext.tsx';
import {ThemeProvider} from './app/providers/ThemeProvider';
import {ErrorBoundary} from './ui/ErrorBoundary';
import {ToastProvider} from './ui/Toast';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
  <ThemeProvider>
    <ToastProvider>
      <BrowserRouter>
        <AppStateProvider>
          <App />
        </AppStateProvider>
      </BrowserRouter>
    </ToastProvider>
  </ThemeProvider>
  </ErrorBoundary>,
);

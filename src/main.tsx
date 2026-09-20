import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { DataProvider } from './contexts/DataContext';
import { DataLoader } from './contexts/DataLoader';
import { ErrorBoundary } from './components/ErrorBoundary';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <DataProvider>
        <DataLoader>
          <App />
        </DataLoader>
      </DataProvider>
    </ErrorBoundary>
  </StrictMode>,
);

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { DataProvider } from './contexts/DataContext';
import { DataLoader } from './contexts/DataLoader';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DataProvider>
      <DataLoader>
        <App />
      </DataLoader>
    </DataProvider>
  </StrictMode>,
);

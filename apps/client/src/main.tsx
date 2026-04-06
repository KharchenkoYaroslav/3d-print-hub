import { StrictMode } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import * as ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; 
import './styles.scss';

import App from './app/app';
import Auth from './app/pages/auth/auth';
import Catalog from './app/pages/catalog/catalog';
import ModelPage from './app/pages/model/model';
import { AuthProvider } from './app/providers/AuthProvider';

const queryClient = new QueryClient();

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);

root.render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<App />}>
              <Route index element={<Catalog />} />
              <Route path="category/:id" element={<Catalog />} />
              <Route path="author-models/:id" element={<Catalog />} />
              <Route path="model/:id" element={<ModelPage />} />
              <Route path="model/:id/edit" element={<ModelPage />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);

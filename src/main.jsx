import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

// Bootstrap أولًا حتى تتمكن تنسيقات المشروع من تجاوزه.
import 'bootstrap/dist/css/bootstrap.min.css';
import 'leaflet/dist/leaflet.css';
import './index.css';
import './pages.css/overlays.css';

import App from './App';
import { CartProvider } from './context/CartContext';
import { CartUIProvider } from './context/CartUIProvider';
import { ToastProvider } from './context/ToastProvider';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <CartProvider>
          <CartUIProvider>
            <App />
          </CartUIProvider>
        </CartProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>
);

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { configureAuth } from './auth-config';
import App from './App.tsx';
import './index.css';

// Initialize Amplify
configureAuth();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Authenticator.Provider>
      <App />
    </Authenticator.Provider>
  </StrictMode>,
);

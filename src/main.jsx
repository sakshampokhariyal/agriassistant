import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AppProvider } from './context/AppContext';
import { WeatherProvider } from './context/WeatherContext';
import { LocationProvider } from './context/LocationContext';
import { ChatProvider } from './context/ChatContext';
import { APP_TITLE } from './config/brand';
import './index.css';

document.title = APP_TITLE;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppProvider>
      <LocationProvider>
        <WeatherProvider>
          <ChatProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </ChatProvider>
        </WeatherProvider>
      </LocationProvider>
    </AppProvider>
  </React.StrictMode>
);

// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import AppSelector from './AppSelector'; // Cambiado de './App' a './AppSelector'
import './index.css'; // Asegúrate de tener este archivo o quita esta línea

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppSelector />
  </React.StrictMode>
);

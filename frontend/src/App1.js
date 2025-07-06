// App.js
import React from 'react';
import './App.css';
import UsuariosList from './UsuariosList'; // 👈 importas tu lista

function App() {
  return (
    <div className="app-container">
      {/* Muestra el componente separado */}
      <UsuariosList />
    </div>
  );
}

export default App;

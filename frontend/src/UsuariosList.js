// UsuariosList.js
import React, { useEffect, useState } from 'react';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function UsuariosList() {
  const [usuarios, setUsuarios] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/api/users`)
      .then((res) => res.json())
      .then((data) => setUsuarios(data))
      .catch((err) => console.error('Error al cargar usuarios:', err));
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Listado de Usuarios</h2>
      <ul className="space-y-2">
        {usuarios.map((usuario) => (
          <li key={usuario.id} className="p-3 border rounded-xl shadow-sm">
            <strong>{usuario.username}</strong> - {usuario.email}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default UsuariosList;

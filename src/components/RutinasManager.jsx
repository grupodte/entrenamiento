// src/components/RutinasManager.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const RutinasManager = () => {
  const [rutinas, setRutinas] = useState([]);
  const navigate = useNavigate();

  const fetchRutinas = async () => {
    const { data } = await supabase.from('rutinas_base').select('*');
    setRutinas(data);
  };

  useEffect(() => {
    fetchRutinas();
  }, []);

  return (
    <div className="p-6 bg-white rounded shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Rutinas base</h2>
        <button
          onClick={() => navigate('/crear-rutina')}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          ➕ Crear nueva rutina
        </button>
      </div>

      <ul className="space-y-2">
        {rutinas.map(r => (
          <li key={r.id} className="border p-3 rounded bg-gray-50">
            <strong>{r.nombre}</strong> <span className="text-sm text-gray-500">({r.tipo})</span>
            <p className="text-sm text-gray-600">{r.descripcion}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RutinasManager;
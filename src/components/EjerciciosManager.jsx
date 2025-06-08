import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const EjerciciosManager = () => {
  const [ejercicios, setEjercicios] = useState([]);
  const [nuevoEjercicio, setNuevoEjercicio] = useState({
    nombre: '',
    descripcion: '',
    video_url: '',
  });

  const fetchEjercicios = async () => {
    const { data, error } = await supabase.from('ejercicios').select('*');
    if (!error) setEjercicios(data);
  };

  const crearEjercicio = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('ejercicios').insert([nuevoEjercicio]);
    if (!error) {
      setNuevoEjercicio({ nombre: '', descripcion: '', video_url: '' });
      fetchEjercicios();
    }
  };

  useEffect(() => {
    fetchEjercicios();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Ejercicios</h1>

      <form onSubmit={crearEjercicio} className="bg-white p-4 border rounded-lg shadow-md mb-6">
        <h3 className="text-lg font-semibold mb-2">Nuevo ejercicio</h3>
        <input
          type="text"
          placeholder="Nombre"
          value={nuevoEjercicio.nombre}
          onChange={(e) => setNuevoEjercicio({ ...nuevoEjercicio, nombre: e.target.value })}
          className="w-full mb-2 border rounded px-3 py-2"
          required
        />
        <textarea
          placeholder="Descripción"
          value={nuevoEjercicio.descripcion}
          onChange={(e) => setNuevoEjercicio({ ...nuevoEjercicio, descripcion: e.target.value })}
          className="w-full mb-2 border rounded px-3 py-2"
        />
        <input
          type="url"
          placeholder="URL de video"
          value={nuevoEjercicio.video_url}
          onChange={(e) => setNuevoEjercicio({ ...nuevoEjercicio, video_url: e.target.value })}
          className="w-full mb-2 border rounded px-3 py-2"
        />
        <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Agregar</button>
      </form>

      <ul className="space-y-4">
        {ejercicios.map((ej) => (
          <li key={ej.id} className="p-4 border rounded bg-white shadow-sm">
            <h4 className="font-bold text-lg">{ej.nombre}</h4>
            <p className="text-sm text-gray-600">{ej.descripcion}</p>
            {ej.video_url && (
              <a href={ej.video_url} className="text-blue-500 underline text-sm" target="_blank" rel="noreferrer">
                Ver video
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default EjerciciosManager;
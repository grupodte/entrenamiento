import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const RutinasManager = () => {
  const [rutinas, setRutinas] = useState([]);
  const [ejercicios, setEjercicios] = useState([]);
  const [ejerciciosSeleccionados, setEjerciciosSeleccionados] = useState([]);
  const [nuevaRutina, setNuevaRutina] = useState({
    nombre: '',
    descripcion: '',
    video_url: '',
  });

  const fetchData = async () => {
    const { data: ruts } = await supabase.from('rutinas').select('*');
    const { data: ejs } = await supabase.from('ejercicios').select('id, nombre');
    setRutinas(ruts || []);
    setEjercicios(ejs || []);
  };

  const crearRutina = async (e) => {
    e.preventDefault();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    const { data: nuevaRutinaInsertada, error } = await supabase
      .from('rutinas')
      .insert([{ ...nuevaRutina, creador_id: user.id }])
      .select()
      .single();

    if (error) {
      console.error('Error al crear rutina:', error);
      return;
    }

    const relaciones = ejerciciosSeleccionados.map((ejercicioId) => ({
      rutina_id: nuevaRutinaInsertada.id,
      ejercicio_id: ejercicioId,
    }));

    const { error: errorRelaciones } = await supabase.from('rutinas_ejercicios').insert(relaciones);
    if (errorRelaciones) {
      console.error('Error al asignar ejercicios:', errorRelaciones);
    } else {
      setNuevaRutina({ nombre: '', descripcion: '', video_url: '' });
      setEjerciciosSeleccionados([]);
      fetchData();
    }
  };

  const toggleEjercicio = (id) => {
    setEjerciciosSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Rutinas</h1>

      <form onSubmit={crearRutina} className="bg-white p-4 border rounded-lg shadow-md mb-6">
        <h3 className="text-lg font-semibold mb-2">Crear rutina</h3>
        <input
          type="text"
          placeholder="Nombre"
          value={nuevaRutina.nombre}
          onChange={(e) => setNuevaRutina({ ...nuevaRutina, nombre: e.target.value })}
          className="w-full mb-2 border rounded px-3 py-2"
          required
        />
        <textarea
          placeholder="Descripción"
          value={nuevaRutina.descripcion}
          onChange={(e) => setNuevaRutina({ ...nuevaRutina, descripcion: e.target.value })}
          className="w-full mb-2 border rounded px-3 py-2"
        />
        <input
          type="url"
          placeholder="URL de video"
          value={nuevaRutina.video_url}
          onChange={(e) => setNuevaRutina({ ...nuevaRutina, video_url: e.target.value })}
          className="w-full mb-2 border rounded px-3 py-2"
        />
        <div className="mb-4">
          <h4 className="font-medium">Seleccionar ejercicios:</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
            {ejercicios.map((ej) => (
              <label key={ej.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={ejerciciosSeleccionados.includes(ej.id)}
                  onChange={() => toggleEjercicio(ej.id)}
                />
                {ej.nombre}
              </label>
            ))}
          </div>
        </div>
        <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
          Guardar rutina
        </button>
      </form>

      <ul className="space-y-4">
        {rutinas.map((rutina) => (
          <li key={rutina.id} className="p-4 border rounded bg-white shadow-sm">
            <h4 className="font-bold text-lg">{rutina.nombre}</h4>
            <p className="text-sm text-gray-600">{rutina.descripcion}</p>
            {rutina.video_url && (
              <a
                href={rutina.video_url}
                target="_blank"
                rel="noreferrer"
                className="text-blue-500 text-sm underline"
              >
                Ver video
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RutinasManager;
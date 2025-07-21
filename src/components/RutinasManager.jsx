import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { gsap } from 'gsap';
import FadeContent from './FadeContent';
import { FaClipboardList, FaTrashAlt } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const RutinasManager = () => {
  const [rutinas, setRutinas] = useState([]);
  const navigate = useNavigate();
  const listaRef = useRef(null);

  const fetchRutinas = async () => {
    const { data } = await supabase.from('rutinas_base').select('*').order('id', { ascending: false });
    if (data) setRutinas(data);
  };

  useEffect(() => {
    fetchRutinas();
  }, []);

  useEffect(() => {
    if (listaRef.current && listaRef.current.children.length > 0) {
      gsap.fromTo(
        listaRef.current.children,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out' }
      );
    }
  }, [rutinas]);

  const eliminarRutina = async (id) => {
    const confirm = window.confirm('¿Estás seguro de que querés eliminar esta rutina? Esta acción no se puede deshacer.');
    if (!confirm) return;

    const { error } = await supabase.from('rutinas_base').delete().eq('id', id);
    if (error) {
      toast.error('Error al eliminar rutina');
    } else {
      toast.success('Rutina eliminada');
      fetchRutinas(); // Actualizar lista
    }
  };

  return (
    <div className="px-2 md:px-6 py-4 transition-all">
      <h1 className="text-2xl font-bold mb-4 text-white flex items-center gap-2">
        <FaClipboardList /> Rutinas creadas
      </h1>

      <input
        type="text"
        placeholder="Buscar por nombre..."
        className="mb-6 w-full md:w-1/2 px-4 py-2 rounded-lg bg-white/10 backdrop-blur text-white placeholder-gray-300"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />

      {cargando ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-16 bg-white/10 rounded-lg animate-pulse"
            ></div>
          ))}
        </div>
      ) : (
        <ul className="grid gap-4">
          {rutinasFiltradas.map((rutina, index) => (
            <Transition
              appear
              show
              key={rutina.id}
              enter="transition-opacity duration-500 delay-[index*50] ease-out"
              enterFrom="opacity-0 translate-y-2"
              enterTo="opacity-100 translate-y-0"
            >
              <li className="p-4 bg-white/10 backdrop-blur rounded-xl shadow-md flex justify-between items-center hover:bg-white/20 transition duration-300">
                <div>
                  <p className="font-semibold text-white">{rutina.nombre}</p>
                  <p className="text-sm text-gray-300">{rutina.descripcion || 'Sin descripción'}</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/admin/rutinas/ver/${rutina.id}`)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
                  >
                    Ver
                  </button>
                  <button
                    onClick={() => navigate(`/admin/rutinas/editar/${rutina.id}`)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => eliminarRutina(rutina.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm"
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            </Transition>
          ))}
        </ul>
      )}
    </div>
  );
};

export default RutinasManager;

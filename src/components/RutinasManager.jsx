import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { FaTrashAlt, FaEye, FaEdit, FaCopy } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

// 🎨 Reutilizamos el gradiente de marca
const BRAND_GRADIENT = "from-orange-500 via-pink-500 to-red-600";

const RutinasManager = () => {
  const [rutinas, setRutinas] = useState([]);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  const fetchRutinas = async () => {
    try {
      setLoading(true);
      const { data } = await supabase.from('rutinas_base').select('*').order('id', { ascending: false });
      if (data) setRutinas(data);
    } catch (error) {
      console.error('Error fetching rutinas:', error);
      toast.error('Error al cargar rutinas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRutinas();
  }, []);

  const eliminarRutina = async (id) => {
    // Usamos un toast de confirmación para una mejor UX
    toast((t) => (
      <div className="flex flex-col gap-2 text-white">
        <p>¿Seguro que quieres eliminar?</p>
        <div className="flex gap-2">
          <button
            onClick={() => {
              toast.dismiss(t.id);
              _performDelete(id);
            }}
            className="px-3 py-1 rounded-lg bg-red-500 text-white"
          >
            Sí, eliminar
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1 rounded-lg bg-white/20 text-white"
          >
            Cancelar
          </button>
        </div>
      </div>
    ), {
      style: {
        background: 'rgba(30, 30, 30, 0.8)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        color: '#fff',
      },
    });
  };

  const _performDelete = async (id) => {
    const { error } = await supabase.from('rutinas_base').delete().eq('id', id);
    if (error) {
      toast.error('Error al eliminar rutina');
    } else {
      toast.success('Rutina eliminada');
      setRutinas(prev => prev.filter(r => r.id !== id));
    }
  };


  // Mostrar loading mientras se cargan los datos
  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-8 text-white pb-[calc(4rem+env(safe-area-inset-bottom))]">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-40 bg-white/5 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-8 text-white pb-[calc(4rem+env(safe-area-inset-bottom))]">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {rutinas.map((rutina) => (
          <div key={rutina.id} className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-orange-500 rounded-2xl blur opacity-0 group-hover:opacity-50 transition duration-500"></div>
            <div className="relative bg-white/5 backdrop-blur-lg p-5 rounded-2xl border border-white/10 h-full flex flex-col justify-between transition-transform duration-300 group-hover:scale-[1.03]">
              <div>
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-bold text-white pr-4">{rutina.nombre}</h3>
                  <button
                    onClick={() => eliminarRutina(rutina.id)}
                    title="Eliminar rutina"
                    className="text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <FaTrashAlt size={16} />
                  </button>
                </div>
                <p className="text-sm text-white/70 mb-1 line-clamp-2">{rutina.descripcion || 'Sin descripción'}</p>
                <p className="text-xs text-white/50 font-mono">{rutina.tipo || 'General'}</p>
              </div>

              <div className="mt-6 flex gap-2 border-t border-white/10 pt-4">
                <button
                  onClick={() => navigate(`/admin/rutinas/ver/${rutina.id}`)}
                  className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition"
                >
                  <FaEye /> Ver
                </button>
                <button
                  onClick={() => navigate(`/admin/rutinas/editar/${rutina.id}`)}
                  className="flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 transition"
                >
                  <FaEdit /> Editar
                </button>
                <button
                  onClick={() => navigate(`/admin/rutinas/duplicar/${rutina.id}`)}
                  className="flex items-center gap-2 text-sm text-green-400 hover:text-green-300 transition"
                >
                  <FaCopy /> Duplicar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RutinasManager;

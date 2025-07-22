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
    <div className=" md:max-w-6xl mx-auto text-white">
      {/* Encabezado con botón flotante */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigate('/admin/rutinas/crear')}
          className="bg-white/20 text-white text-[14px]  px-3 py-2 rounded-lg  focus:ring-2 focus:ring-yellow-300"
        >
          Nueva rutina
        </button>
      </div>

      {/* Lista animada */}
      <div ref={listaRef} className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
        {rutinas.map((rutina, i) => (
          <FadeContent
            key={rutina.id}
            className="bg-white/5 backdrop-blur-lg p-4 rounded-xl border border-white/10 transition flex flex-col justify-between"
            delay={i * 80}
            blur
          >
            <div>
              <div className="flex items-center justify-between">
                <h3 className=" text-[12px] md:text-[14px] font-bold text-white">{rutina.nombre}</h3>
                <button
                  onClick={() => eliminarRutina(rutina.id)}
                
                  className="text-red-400"
                >
                  <FaTrashAlt size={12} />
                </button>
              </div>
              <p className=" text-[10px] md:text-[12px]  text-white/80">{rutina.descripcion || 'Sin descripción'}</p>
              <p className="text-[10px] md:text-[12px] text-white/50 italic mt-1">{rutina.tipo || 'Sin tipo definido'}</p>
            </div>

            <div className="mt-4 flex gap-3">
              <button
                onClick={() => navigate(`/admin/rutinas/ver/${rutina.id}`)}
                className="text-[10px] md:text-[12px] underline hover:text-white transition"
              >
                Ver
              </button>
              <button
                onClick={() => navigate(`/admin/rutinas/editar/${rutina.id}`)}
                className="text-yellow-400 text-[10px] md:text-[12px] underline hover:text-white transition"
              >
                Editar
              </button>
            </div>
          </FadeContent>
        ))}
      </div>
    </div>
  );
};

export default RutinasManager;

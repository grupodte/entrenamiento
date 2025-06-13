// src/pages/Admin/EjerciciosManager.jsx
import { useState, useEffect, useRef, Fragment } from 'react';
import { createPortal } from 'react-dom';
import { Listbox } from '@headlessui/react';
import { supabase } from '../lib/supabaseClient';
import { gsap } from 'gsap';
import { FaChevronDown } from 'react-icons/fa';
import clsx from 'clsx';
import { useVideo } from '../context/VideoContext';
import VideoPanel from './VideoPanel'; // ruta correcta si estás en /pages/Admin
import FadeContent from './FadeContent';


const gruposMusculares = [
  'Pecho', 'Espalda', 'Piernas', 'Hombros', 'Bíceps', 'Tríceps', 'Core',
];


const EjerciciosManager = () => {
  const [ejercicios, setEjercicios] = useState([]);
  const [nuevo, setNuevo] = useState({
    nombre: '',
    descripcion: '',
    video_url: '',
    grupo_muscular: '',
  });
  const [verVideo, setVerVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const listaRef = useRef(null);
  const dropdownRef = useRef(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const { showVideo } = useVideo();


  const cargarEjercicios = async () => {
    const { data, error } = await supabase
      .from('ejercicios')
      .select('*')
      .order('id', { ascending: false });
    if (!error) setEjercicios(data);
  };

  const crearEjercicio = async (e) => {
    e.preventDefault();

    const { data, error } = await supabase.from('ejercicios').insert([nuevo]).select().single();
    if (!error && data) {
      setEjercicios((prev) => [data, ...prev]); // 👈 agrega arriba
      setNuevo({ nombre: '', descripcion: '', video_url: '', grupo_muscular: '' });
    } else {
      console.error('❌ Error al insertar:', error?.message);
    }
  };
  
  useEffect(() => {
    cargarEjercicios();
  }, []);

  useEffect(() => {
    if (listaRef.current && listaRef.current.children.length > 0) {
      gsap.fromTo(
        listaRef.current.children,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out' }
      );
    }
  }, [ejercicios]);
  

  const updateDropdownPosition = () => {
    if (dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      });
    }
  };

  useEffect(() => {
    updateDropdownPosition();
    window.addEventListener('resize', updateDropdownPosition);
    window.addEventListener('scroll', updateDropdownPosition, true);
    return () => {
      window.removeEventListener('resize', updateDropdownPosition);
      window.removeEventListener('scroll', updateDropdownPosition, true);
    };
  }, []);

  return (
    <div className="space-y-10 relative z-0  ">
      {/* Formulario */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/10">
        <h2 className="text-xl font-semibold text-white mb-4">➕ Nuevo ejercicio</h2>
        <form onSubmit={crearEjercicio} className="space-y-4">
          <input
            type="text"
            placeholder="Nombre del ejercicio"
            value={nuevo.nombre}
            onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
            required
            className="w-full rounded-xl bg-white/10 backdrop-blur px-4 py-2 text-white placeholder-white/50 focus:ring-2 focus:ring-skyblue"
          />
          <textarea
            placeholder="Descripción"
            value={nuevo.descripcion}
            onChange={(e) => setNuevo({ ...nuevo, descripcion: e.target.value })}
            className="w-full rounded-xl bg-white/10 backdrop-blur px-4 py-2 text-white placeholder-white/50"
          />
          <input
            type="url"
            placeholder="URL de video (opcional)"
            value={nuevo.video_url}
            onChange={(e) => setNuevo({ ...nuevo, video_url: e.target.value })}
            className="w-full rounded-xl bg-white/10 backdrop-blur px-4 py-2 text-white placeholder-white/50"
          />

          {/* Dropdown custom con Portal */}
          <Listbox
            value={nuevo.grupo_muscular}
            onChange={(val) => setNuevo({ ...nuevo, grupo_muscular: val })}
          >
            {({ open }) => (
              <div>
                <div className="relative z-0">
                  <Listbox.Button
                    ref={dropdownRef}
                    onClick={updateDropdownPosition}
                    className="w-full rounded-xl bg-white/10 backdrop-blur-xl px-4 py-2 text-white pr-10 text-left shadow-inner ring-1 ring-white/10 focus:ring-2 focus:ring-skyblue transition-all"
                  >
                    {nuevo.grupo_muscular || 'Sin grupo específico'}
                    <span className="absolute inset-y-0 right-0 flex items-center pr-4">
                      <FaChevronDown className="text-white/60 text-sm" />
                    </span>
                  </Listbox.Button>
                </div>

                {open && createPortal(
                  <div
                    className="rounded-xl bg-black/80 backdrop-blur border border-white/10 text-white shadow-lg overflow-hidden"
                    style={{
                      position: 'fixed',
                      top: dropdownPosition.top,
                      left: dropdownPosition.left,
                      width: dropdownPosition.width,
                      zIndex: 9999,
                    }}
                  >
                    <Listbox.Options static as={Fragment}>
                      <div>
                        <Listbox.Option value="">
                          {({ active }) => (
                            <div
                              className={clsx(
                                'px-4 py-2 text-sm cursor-pointer',
                                active && 'bg-white/10'
                              )}
                            >
                              Sin grupo específico
                            </div>
                          )}
                        </Listbox.Option>
                        {gruposMusculares.map((grupo) => (
                          <Listbox.Option key={grupo} value={grupo}>
                            {({ active }) => (
                              <div
                                className={clsx(
                                  'px-4 py-2 text-sm cursor-pointer',
                                  active && 'bg-white/10'
                                )}
                              >
                                {grupo}
                              </div>
                            )}
                          </Listbox.Option>
                        ))}
                      </div>
                    </Listbox.Options>
                  </div>,
                  document.body
                )}
              </div>
            )}
          </Listbox>

          <button
            type="submit"
            className="w-full bg-skyblue text-white font-semibold rounded-xl py-2 hover:bg-white/20 transition"
          >
            Guardar ejercicio
          </button>
        </form>
      </div>

      {/* Lista de ejercicios */}
      <div
        ref={listaRef}
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
      >
        {ejercicios.map((ej, i) => (
          <FadeContent
            key={ej.id}
            className="bg-white/5 backdrop-blur-lg p-4 rounded-xl border border-white/10 transition hover:scale-[1.01]"
            delay={i * 80}
            blur
          >
            <h3 className="text-lg font-bold text-white">{ej.nombre}</h3>
            <p className="text-sm text-white/80 mt-1">{ej.descripcion}</p>
            <p className="text-xs text-white/50 mt-1">{ej.grupo_muscular}</p>
            {ej.video_url && (
              <button
                onClick={() => showVideo(ej.video_url)}
                className="text-skyblue underline mt-2 text-sm"
              >
                ▶ Ver video
              </button>
            )}
          </FadeContent>
        ))}
      </div>


      {/* Modal de video */}
      <VideoPanel
        open={verVideo}
        onClose={() => setVerVideo(false)}
        videoUrl={videoUrl}
      />
    </div>
  );
};

export default EjerciciosManager;

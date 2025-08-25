import { useState, useEffect, Fragment } from 'react';
import { createPortal } from 'react-dom';
import { Listbox, Transition, Dialog } from '@headlessui/react';
import { supabase } from '../lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronDown, FaPlus, FaTrashAlt, FaVideo, FaEdit, FaTimes, FaSave } from 'react-icons/fa';
import { useVideo } from '../context/VideoContext';
import VideoPanel from './VideoPanel';
import { toast } from 'react-hot-toast';

const BRAND_GRADIENT = "from-orange-500 via-pink-500 to-red-600";
const INPUT_CLASS = "w-full rounded-xl bg-white/10 px-4 py-3 text-white placeholder-white/50 focus:ring-2 focus:ring-pink-500 border border-transparent focus:border-pink-400 transition-all outline-none";

const gruposMusculares = [
  'Pecho', 'Espalda', 'Piernas', 'Hombros', 'Bíceps', 'Tríceps', 'Core',
];

const EjerciciosManager = () => {
  const [ejercicios, setEjercicios] = useState([]);
  const [nuevo, setNuevo] = useState({ nombre: '', descripcion: '', video_url: '', grupo_muscular: '' });
  const [editando, setEditando] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { showVideo, isOpen: isVideoOpen, videoUrl, hideVideo } = useVideo();

  useEffect(() => {
    const cargarEjercicios = async () => {
      const { data, error } = await supabase.from('ejercicios').select('*').order('id', { ascending: false });
      if (!error) setEjercicios(data);
    };
    cargarEjercicios();
  }, []);

  const crearEjercicio = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase.from('ejercicios').insert([nuevo]).select().single();
    if (!error && data) {
      setEjercicios(prev => [data, ...prev]);
      setNuevo({ nombre: '', descripcion: '', video_url: '', grupo_muscular: '' });
      toast.success('Ejercicio creado');
    } else {
      toast.error(error?.message || 'Error al crear el ejercicio.');
    }
  };

  const borrarEjercicio = async (id) => {
    toast((t) => (
      <div className="flex flex-col gap-2 text-white">
        <p>¿Seguro que quieres eliminar?</p>
        <div className="flex gap-2">
          <button onClick={() => { toast.dismiss(t.id); _performDelete(id); }} className="px-3 py-1 rounded-lg bg-red-500 text-white">Sí, eliminar</button>
          <button onClick={() => toast.dismiss(t.id)} className="px-3 py-1 rounded-lg bg-white/20 text-white">Cancelar</button>
        </div>
      </div>
    ), { style: { background: 'rgba(30,30,30,0.8)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' } });
  };

  const _performDelete = async (id) => {
    const { error } = await supabase.from("ejercicios").delete().eq("id", id);
    if (!error) {
      setEjercicios(prev => prev.filter(ej => ej.id !== id));
      toast.success('Ejercicio eliminado');
    } else {
      toast.error('Error al borrar el ejercicio.');
    }
  };

  const iniciarEdicion = (ejercicio) => {
    setEditando({
      id: ejercicio.id,
      nombre: ejercicio.nombre || '',
      descripcion: ejercicio.descripcion || '',
      video_url: ejercicio.video_url || '',
      grupo_muscular: ejercicio.grupo_muscular || ''
    });
    setIsEditModalOpen(true);
  };

  const cancelarEdicion = () => {
    setEditando(null);
    setIsEditModalOpen(false);
  };

  const actualizarEjercicio = async (e) => {
    e.preventDefault();
    if (!editando || !editando.id) return;

    const { error } = await supabase
      .from('ejercicios')
      .update({
        nombre: editando.nombre,
        descripcion: editando.descripcion,
        video_url: editando.video_url,
        grupo_muscular: editando.grupo_muscular
      })
      .eq('id', editando.id);

    if (!error) {
      setEjercicios(prev => prev.map(ej => 
        ej.id === editando.id ? { ...ej, ...editando } : ej
      ));
      toast.success('Ejercicio actualizado');
      cancelarEdicion();
    } else {
      toast.error('Error al actualizar el ejercicio');
    }
  };

  const containerVariants = { visible: { transition: { staggerChildren: 0.07 } } };
  const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };

  return (
    <div className="space-y-10">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="relative z-10 bg-white/5 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/10">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2"><FaPlus /> Nuevo Ejercicio</h2>
        <form onSubmit={crearEjercicio} className="space-y-4">
          <input type="text" placeholder="Nombre del ejercicio" value={nuevo.nombre} onChange={e => setNuevo({ ...nuevo, nombre: e.target.value })} required className={INPUT_CLASS} />
          <textarea placeholder="Descripción (opcional)" value={nuevo.descripcion} onChange={e => setNuevo({ ...nuevo, descripcion: e.target.value })} className={`${INPUT_CLASS} h-24`} />
          <input type="url" placeholder="URL de video (opcional)" value={nuevo.video_url} onChange={e => setNuevo({ ...nuevo, video_url: e.target.value })} className={INPUT_CLASS} />
          
          <div className="relative z-[200]">
            <Listbox value={nuevo.grupo_muscular} onChange={val => setNuevo({ ...nuevo, grupo_muscular: val })}>
              <div className="relative">
                <Listbox.Button className={`${INPUT_CLASS} text-left flex justify-between items-center`}>
                  <span className={nuevo.grupo_muscular ? 'text-white' : 'text-white/50'}>{nuevo.grupo_muscular || 'Seleccionar grupo muscular'}</span>
                  <FaChevronDown className="text-white/60" />
                </Listbox.Button>
                <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                  <Listbox.Options className="absolute z-[300] mt-1 w-full bg-black/80 backdrop-blur-lg border border-white/10 rounded-xl shadow-lg max-h-60 overflow-auto focus:outline-none">
                    {gruposMusculares.map(grupo => (
                      <Listbox.Option key={grupo} value={grupo} className={({ active }) => `cursor-pointer select-none relative py-2 pl-10 pr-4 ${active ? 'text-white bg-white/10' : 'text-gray-300'}`}>
                        {grupo}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </Transition>
              </div>
            </Listbox>
          </div>

          <motion.button type="submit" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className={`w-full font-semibold rounded-xl py-3 bg-gradient-to-r ${BRAND_GRADIENT} text-white shadow-[0_8px_20px_rgba(236,72,153,0.3)]`}>
            Guardar Ejercicio
          </motion.button>
        </form>
      </motion.div>

      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence>
          {ejercicios.map(ej => (
            <motion.div key={ej.id} variants={itemVariants} layout className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-orange-500 rounded-2xl blur opacity-0 group-hover:opacity-60 transition duration-500"></div>
              <div className="relative bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-lg flex flex-col justify-between h-full transition-transform duration-300 group-hover:scale-[1.03]">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">{ej.nombre}</h3>
                  {ej.grupo_muscular && <span className="inline-block bg-cyan-400/20 text-cyan-300 px-2.5 py-1 rounded-full text-xs mb-3 font-medium">{ej.grupo_muscular}</span>}
                  <p className="text-sm text-white/80 mb-4 line-clamp-3">{ej.descripcion || 'Sin descripción'}</p>
                </div>
                <div className="flex items-center justify-between mt-4 border-t border-white/10 pt-4">
                  {ej.video_url ? (
                    <button onClick={() => showVideo(ej.video_url)} className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition">
                      <FaVideo /> Ver video
                    </button>
                  ) : <span className="text-white/40 text-xs">Sin video</span>}
                  <div className="flex items-center gap-2">
                    <motion.button 
                      whileHover={{ scale: 1.2, color: '#10b981' }} 
                      whileTap={{ scale: 0.9 }} 
                      onClick={() => iniciarEdicion(ej)} 
                      className="text-gray-400 hover:text-emerald-500 transition-colors"
                      title="Editar ejercicio"
                    >
                      <FaEdit />
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.2, color: '#ef4444' }} 
                      whileTap={{ scale: 0.9 }} 
                      onClick={() => borrarEjercicio(ej.id)} 
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      title="Eliminar ejercicio"
                    >
                      <FaTrashAlt />
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      <VideoPanel isOpen={isVideoOpen} onClose={hideVideo} videoUrl={videoUrl} />

      {/* Modal de Edición */}
      <Transition appear show={isEditModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={cancelarEdicion}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 to-black p-6 shadow-2xl transition-all border border-white/10">
                  <Dialog.Title className="text-2xl font-bold text-white mb-6 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <FaEdit className="text-emerald-400" />
                      Editar Ejercicio
                    </span>
                    <button
                      onClick={cancelarEdicion}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <FaTimes size={24} />
                    </button>
                  </Dialog.Title>

                  {editando && (
                    <form onSubmit={actualizarEjercicio} className="space-y-4">
                      <input
                        type="text"
                        placeholder="Nombre del ejercicio"
                        value={editando.nombre}
                        onChange={e => setEditando({ ...editando, nombre: e.target.value })}
                        required
                        className={INPUT_CLASS}
                      />
                      
                      <textarea
                        placeholder="Descripción (opcional)"
                        value={editando.descripcion}
                        onChange={e => setEditando({ ...editando, descripcion: e.target.value })}
                        className={`${INPUT_CLASS} h-24`}
                      />
                      
                      <input
                        type="url"
                        placeholder="URL de video (opcional)"
                        value={editando.video_url}
                        onChange={e => setEditando({ ...editando, video_url: e.target.value })}
                        className={INPUT_CLASS}
                      />
                      
                      <div className="relative z-[200]">
                        <Listbox value={editando.grupo_muscular} onChange={val => setEditando({ ...editando, grupo_muscular: val })}>
                          <div className="relative">
                            <Listbox.Button className={`${INPUT_CLASS} text-left flex justify-between items-center`}>
                              <span className={editando.grupo_muscular ? 'text-white' : 'text-white/50'}>
                                {editando.grupo_muscular || 'Seleccionar grupo muscular'}
                              </span>
                              <FaChevronDown className="text-white/60" />
                            </Listbox.Button>
                            <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                              <Listbox.Options className="absolute z-[300] mt-1 w-full bg-black/80 backdrop-blur-lg border border-white/10 rounded-xl shadow-lg max-h-60 overflow-auto focus:outline-none">
                                {gruposMusculares.map(grupo => (
                                  <Listbox.Option
                                    key={grupo}
                                    value={grupo}
                                    className={({ active }) => `cursor-pointer select-none relative py-2 pl-10 pr-4 ${active ? 'text-white bg-white/10' : 'text-gray-300'}`}
                                  >
                                    {grupo}
                                  </Listbox.Option>
                                ))}
                              </Listbox.Options>
                            </Transition>
                          </div>
                        </Listbox>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <motion.button
                          type="submit"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`flex-1 font-semibold rounded-xl py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-[0_8px_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2`}
                        >
                          <FaSave />
                          Guardar Cambios
                        </motion.button>
                        <motion.button
                          type="button"
                          onClick={cancelarEdicion}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex-1 font-semibold rounded-xl py-3 bg-white/10 text-white hover:bg-white/20 transition-colors"
                        >
                          Cancelar
                        </motion.button>
                      </div>
                    </form>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default EjerciciosManager;

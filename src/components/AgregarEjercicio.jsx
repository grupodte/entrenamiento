import { useState, useEffect, useMemo, Fragment } from 'react';
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

const groupColors = {
  Pecho: { bg: 'bg-rose-500/30', text: 'text-rose-300', border: 'border-rose-500/50', hover: 'hover:bg-rose-500/50' },
  Espalda: { bg: 'bg-cyan-500/30', text: 'text-cyan-300', border: 'border-cyan-500/50', hover: 'hover:bg-cyan-500/50' },
  Piernas: { bg: 'bg-amber-500/30', text: 'text-amber-300', border: 'border-amber-500/50', hover: 'hover:bg-amber-500/50' },
  Hombros: { bg: 'bg-indigo-500/30', text: 'text-indigo-300', border: 'border-indigo-500/50', hover: 'hover:bg-indigo-500/50' },
  Bíceps: { bg: 'bg-pink-500/30', text: 'text-pink-300', border: 'border-pink-500/50', hover: 'hover:bg-pink-500/50' },
  Tríceps: { bg: 'bg-teal-500/30', text: 'text-teal-300', border: 'border-teal-500/50', hover: 'hover:bg-teal-500/50' },
  Core: { bg: 'bg-lime-500/30', text: 'text-lime-300', border: 'border-lime-500/50', hover: 'hover:bg-lime-500/50' },
  Default: { bg: 'bg-gray-500/30', text: 'text-gray-300', border: 'border-gray-500/50', hover: 'hover:bg-gray-500/50' },
};

const normalizeText = (text) => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
};

const EjerciciosManager = () => {
  const [ejercicios, setEjercicios] = useState([]);
  const [nuevo, setNuevo] = useState({ nombre: '', descripcion: '', video_url: '', grupo_muscular: '' });
  const [editando, setEditando] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroups, setSelectedGroups] = useState([]);
  const { showVideo, isOpen: isVideoOpen, videoUrl, hideVideo } = useVideo();

  useEffect(() => {
    const cargarEjercicios = async () => {
      const { data, error } = await supabase.from('ejercicios').select('*').order('nombre', { ascending: true });
      if (!error) setEjercicios(data);
    };
    cargarEjercicios();
  }, []);

  const toggleGroupFilter = (group) => {
    setSelectedGroups(prev =>
      prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]
    );
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedGroups([]);
  };

  const filteredAndSortedEjercicios = useMemo(() => {
    const normalizedSearch = normalizeText(searchTerm);
    const searchKeywords = normalizedSearch.split(' ').filter(k => k);

    return ejercicios
      .filter(ejercicio => {
        // Filtro por grupo muscular
        const groupMatch = selectedGroups.length === 0 || selectedGroups.includes(ejercicio.grupo_muscular);
        if (!groupMatch) return false;

        // Filtro por término de búsqueda
        if (searchKeywords.length === 0) return true;

        const normalizedName = normalizeText(ejercicio.nombre);
        const normalizedDesc = normalizeText(ejercicio.descripcion);

        return searchKeywords.every(keyword =>
          normalizedName.includes(keyword) || normalizedDesc.includes(keyword)
        );
      })
      .sort((a, b) => {
        // Ordenar por relevancia
        const aNameMatch = normalizeText(a.nombre).includes(normalizedSearch);
        const bNameMatch = normalizeText(b.nombre).includes(normalizedSearch);

        if (aNameMatch && !bNameMatch) return -1;
        if (!aNameMatch && bNameMatch) return 1;

        return 0; // Mantener orden original si la relevancia es la misma
      });
  }, [ejercicios, searchTerm, selectedGroups]);

  const groupedEjercicios = useMemo(() => {
    const groups = filteredAndSortedEjercicios.reduce((acc, ejercicio) => {
      const groupName = ejercicio.grupo_muscular || 'Otros';
      if (!acc[groupName]) {
        acc[groupName] = [];
      }
      acc[groupName].push(ejercicio);
      return acc;
    }, {});

    const orderedGroupNames = Object.keys(groups).sort((a, b) => {
      if (a === 'Otros') return 1;
      if (b === 'Otros') return -1;
      if (gruposMusculares.indexOf(a) < gruposMusculares.indexOf(b)) return -1;
      if (gruposMusculares.indexOf(a) > gruposMusculares.indexOf(b)) return 1;
      return 0;
    });

    const orderedGroups = {};
    orderedGroupNames.forEach(name => {
      orderedGroups[name] = groups[name];
    });

    return orderedGroups;
  }, [filteredAndSortedEjercicios]);

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

      {/* Search and Filter Section */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/10 space-y-4">
        <input
          type="text"
          placeholder="Buscar ejercicio por nombre o descripción..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className={INPUT_CLASS}
        />
        <div className="flex flex-wrap gap-3 items-center">
          <span className="text-white/80 font-medium text-sm">Filtrar por:</span>
          {gruposMusculares.map(group => (
            <motion.button
              key={group}
              onClick={() => toggleGroupFilter(group)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 border ${selectedGroups.includes(group)
                  ? `${(groupColors[group] || groupColors.Default).bg} ${(groupColors[group] || groupColors.Default).text} ${(groupColors[group] || groupColors.Default).border}`
                  : `bg-white/10 border-transparent text-white/70 ${groupColors[group]?.hover || groupColors.Default.hover}`
                }`}
            >
              {group}
            </motion.button>
          ))}
          {(searchTerm || selectedGroups.length > 0) && (
            <motion.button
              onClick={clearFilters}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-2 text-sm text-pink-400 hover:text-pink-300 transition"
            >
              <FaTimes /> Limpiar filtros
            </motion.button>
          )}
        </div>
      </motion.div>

      <div className="space-y-8">
        <AnimatePresence>
          {Object.entries(groupedEjercicios).map(([groupName, exercises]) => (
            <motion.section
              key={groupName}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-4 mb-5">
                <span className={`px-4 py-1.5 rounded-full text-lg font-bold ${groupColors[groupName]?.bg || groupColors.Default.bg} ${groupColors[groupName]?.text || groupColors.Default.text}`}>
                  {groupName}
                </span>
                <span className="text-white/50 font-medium">
                  {exercises.length} {exercises.length === 1 ? 'ejercicio' : 'ejercicios'}
                </span>
                <div className="flex-grow h-px bg-white/10"></div>
              </div>

              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
              >
                {exercises.map(ej => (
                  <motion.div key={ej.id} variants={itemVariants} layout className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-orange-500 rounded-2xl blur opacity-0 group-hover:opacity-75 transition duration-500 pointer-events-none"></div>
                    <div className="relative bg-black/40 backdrop-blur-lg p-5 rounded-2xl border border-white/10 shadow-lg flex flex-col justify-between h-full transition-transform duration-300 group-hover:scale-[1.03] group-hover:shadow-pink-500/20">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-2">{ej.nombre}</h3>
                        <p className="text-sm text-white/70 mb-4 line-clamp-3 h-[60px]">{ej.descripcion || 'Sin descripción'}</p>
                      </div>
                      <div className="flex items-center justify-between mt-4 border-t border-white/10 pt-4">
                        {ej.video_url ? (
                          <button onClick={() => showVideo(ej.video_url)} className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
                            <FaVideo /> Ver video
                          </button>
                        ) : <span className="text-white/40 text-xs italic">Sin video</span>}
                        <div className="flex items-center gap-2">
                          <motion.button
                            whileHover={{ scale: 1.2, color: '#34d399' }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => iniciarEdicion(ej)}
                            className="text-gray-400 transition-colors"
                            title="Editar ejercicio"
                          >
                            <FaEdit />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.2, color: '#f87171' }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => borrarEjercicio(ej.id)}
                            className="text-gray-400 transition-colors"
                            title="Eliminar ejercicio"
                          >
                            <FaTrashAlt />
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.section>
          ))}
        </AnimatePresence>
      </div>

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

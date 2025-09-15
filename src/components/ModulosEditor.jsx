import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Trash2, 
  ChevronDown, 
  ChevronUp,
  Play,
  Clock,
  Eye,
  EyeOff,
  GripVertical,
  Edit3,
  Save,
  X
} from 'lucide-react';

const ModulosEditor = ({ modulos, onModulosChange }) => {
  const [expandedModulo, setExpandedModulo] = useState(null);
  const [editingModulo, setEditingModulo] = useState(null);
  const [editingLeccion, setEditingLeccion] = useState(null);
  const [tempModulo, setTempModulo] = useState({});
  const [tempLeccion, setTempLeccion] = useState({});

  const agregarModulo = () => {
    // Usar un ID temporal único que no conflicte con IDs de base de datos
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const nuevoModulo = {
      id: tempId,
      titulo: 'Nuevo Módulo',
      descripcion: '',
      orden: modulos.length + 1,
      duracion_estimada: '',
      lecciones: []
    };
    
    onModulosChange([...modulos, nuevoModulo]);
    setExpandedModulo(nuevoModulo.id);
    setEditingModulo(nuevoModulo.id);
    setTempModulo(nuevoModulo);
  };

  const eliminarModulo = (moduloId) => {
    const nuevosModulos = modulos.filter(m => m.id !== moduloId)
      .map((m, index) => ({ ...m, orden: index + 1 }));
    onModulosChange(nuevosModulos);
  };

  const actualizarModulo = (moduloId, datosNuevos) => {
    const nuevosModulos = modulos.map(m => 
      m.id === moduloId ? { ...m, ...datosNuevos } : m
    );
    onModulosChange(nuevosModulos);
  };

  const agregarLeccion = (moduloId) => {
    // Usar un ID temporal único que no conflicte con IDs de base de datos
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const nuevaLeccion = {
      id: tempId,
      titulo: 'Nueva Lección',
      descripcion: '',
      contenido: '',
      video_url: '',
      duracion_segundos: 0,
      orden: 1,
      es_preview: false
    };

    const nuevosModulos = modulos.map(modulo => {
      if (modulo.id === moduloId) {
        const nuevasLecciones = [...(modulo.lecciones || []), {
          ...nuevaLeccion,
          orden: (modulo.lecciones?.length || 0) + 1
        }];
        return { ...modulo, lecciones: nuevasLecciones };
      }
      return modulo;
    });

    onModulosChange(nuevosModulos);
    setEditingLeccion(`${moduloId}-${nuevaLeccion.id}`);
    setTempLeccion(nuevaLeccion);
  };

  const eliminarLeccion = (moduloId, leccionId) => {
    const nuevosModulos = modulos.map(modulo => {
      if (modulo.id === moduloId) {
        const nuevasLecciones = (modulo.lecciones || [])
          .filter(l => l.id !== leccionId)
          .map((l, index) => ({ ...l, orden: index + 1 }));
        return { ...modulo, lecciones: nuevasLecciones };
      }
      return modulo;
    });
    onModulosChange(nuevosModulos);
  };

  const actualizarLeccion = (moduloId, leccionId, datosNuevos) => {
    const nuevosModulos = modulos.map(modulo => {
      if (modulo.id === moduloId) {
        const nuevasLecciones = (modulo.lecciones || []).map(leccion =>
          leccion.id === leccionId ? { ...leccion, ...datosNuevos } : leccion
        );
        return { ...modulo, lecciones: nuevasLecciones };
      }
      return modulo;
    });
    onModulosChange(nuevosModulos);
  };

  const moverModulo = (index, direccion) => {
    const newIndex = direccion === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= modulos.length) return;

    const nuevosModulos = [...modulos];
    [nuevosModulos[index], nuevosModulos[newIndex]] = [nuevosModulos[newIndex], nuevosModulos[index]];
    
    // Reordenar
    nuevosModulos.forEach((modulo, idx) => {
      modulo.orden = idx + 1;
    });

    onModulosChange(nuevosModulos);
  };

  const moverLeccion = (moduloId, leccionIndex, direccion) => {
    const modulo = modulos.find(m => m.id === moduloId);
    if (!modulo || !modulo.lecciones) return;

    const newIndex = direccion === 'up' ? leccionIndex - 1 : leccionIndex + 1;
    if (newIndex < 0 || newIndex >= modulo.lecciones.length) return;

    const nuevasLecciones = [...modulo.lecciones];
    [nuevasLecciones[leccionIndex], nuevasLecciones[newIndex]] = [nuevasLecciones[newIndex], nuevasLecciones[leccionIndex]];
    
    // Reordenar
    nuevasLecciones.forEach((leccion, idx) => {
      leccion.orden = idx + 1;
    });

    actualizarModulo(moduloId, { lecciones: nuevasLecciones });
  };

  const guardarModulo = () => {
    if (editingModulo && tempModulo.titulo.trim()) {
      actualizarModulo(editingModulo, tempModulo);
      setEditingModulo(null);
      setTempModulo({});
    }
  };

  const cancelarEdicionModulo = () => {
    setEditingModulo(null);
    setTempModulo({});
  };

  const guardarLeccion = () => {
    if (editingLeccion && tempLeccion.titulo.trim()) {
      const [moduloId, leccionId] = editingLeccion.split('-');
      actualizarLeccion(moduloId, leccionId, tempLeccion);
      setEditingLeccion(null);
      setTempLeccion({});
    }
  };

  const cancelarEdicionLeccion = () => {
    setEditingLeccion(null);
    setTempLeccion({});
  };

  const formatearDuracion = (segundos) => {
    if (!segundos) return '0:00';
    const minutos = Math.floor(segundos / 60);
    const segs = segundos % 60;
    return `${minutos}:${segs.toString().padStart(2, '0')}`;
  };

  const parsearDuracion = (texto) => {
    const match = texto.match(/^(\d+):(\d+)$/);
    if (match) {
      return parseInt(match[1]) * 60 + parseInt(match[2]);
    }
    return 0;
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <Play className="w-5 h-5" />
          Módulos y Lecciones
        </h2>
        <button
          type="button"
          onClick={agregarModulo}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Agregar Módulo
        </button>
      </div>

      <div className="space-y-4">
        {modulos.map((modulo, moduloIndex) => (
          <div key={modulo.id} className="border border-gray-600 rounded-lg overflow-hidden">
            {/* Header del módulo */}
            <div className="bg-gray-700/50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  {/* Controles de orden */}
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => moverModulo(moduloIndex, 'up')}
                      disabled={moduloIndex === 0}
                      className="text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-gray-400 text-center">{modulo.orden}</span>
                    <button
                      type="button"
                      onClick={() => moverModulo(moduloIndex, 'down')}
                      disabled={moduloIndex === modulos.length - 1}
                      className="text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>

                  {editingModulo === modulo.id ? (
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        value={tempModulo.titulo || ''}
                        onChange={(e) => setTempModulo({ ...tempModulo, titulo: e.target.value })}
                        className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-1 text-white text-sm focus:border-purple-500 focus:outline-none"
                        placeholder="Título del módulo"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={guardarModulo}
                        className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={cancelarEdicionModulo}
                        className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1">
                      <h3 className="text-white font-medium">{modulo.titulo}</h3>
                      <p className="text-sm text-gray-400">
                        {(modulo.lecciones?.length || 0)} lecciones
                        {modulo.duracion_estimada && ` • ${modulo.duracion_estimada}`}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingModulo(modulo.id);
                      setTempModulo(modulo);
                    }}
                    className="p-1 text-gray-400 hover:text-white"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => eliminarModulo(modulo.id)}
                    className="p-1 text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setExpandedModulo(expandedModulo === modulo.id ? null : modulo.id)}
                    className="p-1 text-gray-400 hover:text-white"
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform ${expandedModulo === modulo.id ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Edición de descripción y duración del módulo */}
              {editingModulo === modulo.id && (
                <div className="mt-3 space-y-2">
                  <textarea
                    value={tempModulo.descripcion || ''}
                    onChange={(e) => setTempModulo({ ...tempModulo, descripcion: e.target.value })}
                    placeholder="Descripción del módulo"
                    className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none resize-none"
                    rows={2}
                  />
                  <input
                    type="text"
                    value={tempModulo.duracion_estimada || ''}
                    onChange={(e) => setTempModulo({ ...tempModulo, duracion_estimada: e.target.value })}
                    placeholder="Duración estimada (ej: 2h 30min)"
                    className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-1 text-white text-sm focus:border-purple-500 focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Lecciones del módulo */}
            <AnimatePresence>
              {expandedModulo === modulo.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 bg-gray-800/30">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-sm font-medium text-gray-300">Lecciones</h4>
                      <button
                        type="button"
                        onClick={() => agregarLeccion(modulo.id)}
                        className="flex items-center gap-1 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        Lección
                      </button>
                    </div>

                    <div className="space-y-2">
                      {(modulo.lecciones || []).map((leccion, leccionIndex) => (
                        <div key={leccion.id} className="bg-gray-700/50 rounded-lg p-3">
                          <div className="flex items-center gap-3">
                            {/* Controles de orden de lección */}
                            <div className="flex flex-col gap-1">
                              <button
                                type="button"
                                onClick={() => moverLeccion(modulo.id, leccionIndex, 'up')}
                                disabled={leccionIndex === 0}
                                className="text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <ChevronUp className="w-3 h-3" />
                              </button>
                              <span className="text-xs text-gray-400 text-center">{leccion.orden}</span>
                              <button
                                type="button"
                                onClick={() => moverLeccion(modulo.id, leccionIndex, 'down')}
                                disabled={leccionIndex === (modulo.lecciones?.length || 0) - 1}
                                className="text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <ChevronDown className="w-3 h-3" />
                              </button>
                            </div>

                            {editingLeccion === `${modulo.id}-${leccion.id}` ? (
                              <div className="flex-1 space-y-2">
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={tempLeccion.titulo || ''}
                                    onChange={(e) => setTempLeccion({ ...tempLeccion, titulo: e.target.value })}
                                    placeholder="Título de la lección"
                                    className="flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:border-purple-500 focus:outline-none"
                                  />
                                  <input
                                    type="text"
                                    value={formatearDuracion(tempLeccion.duracion_segundos || 0)}
                                    onChange={(e) => setTempLeccion({ ...tempLeccion, duracion_segundos: parsearDuracion(e.target.value) })}
                                    placeholder="5:30"
                                    className="w-20 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:border-purple-500 focus:outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setTempLeccion({ ...tempLeccion, es_preview: !tempLeccion.es_preview })}
                                    className={`px-2 py-1 rounded text-xs ${tempLeccion.es_preview ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'}`}
                                  >
                                    {tempLeccion.es_preview ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                  </button>
                                </div>
                                
                                <input
                                  type="url"
                                  value={tempLeccion.video_url || ''}
                                  onChange={(e) => setTempLeccion({ ...tempLeccion, video_url: e.target.value })}
                                  placeholder="URL del video"
                                  className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:border-purple-500 focus:outline-none"
                                />
                                
                                <textarea
                                  value={tempLeccion.contenido || ''}
                                  onChange={(e) => setTempLeccion({ ...tempLeccion, contenido: e.target.value })}
                                  placeholder="Contenido de la lección"
                                  className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:border-purple-500 focus:outline-none resize-none"
                                  rows={2}
                                />
                                
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={guardarLeccion}
                                    className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                                  >
                                    <Save className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={cancelarEdicionLeccion}
                                    className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-white font-medium">{leccion.titulo}</span>
                                    {leccion.es_preview && (
                                      <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">
                                        Preview
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      <span>{formatearDuracion(leccion.duracion_segundos || 0)}</span>
                                    </div>
                                    {leccion.video_url && (
                                      <div className="flex items-center gap-1">
                                        <Play className="w-3 h-3" />
                                        <span className="truncate max-w-32">{leccion.video_url}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="flex gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingLeccion(`${modulo.id}-${leccion.id}`);
                                      setTempLeccion(leccion);
                                    }}
                                    className="p-1 text-gray-400 hover:text-white"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => eliminarLeccion(modulo.id, leccion.id)}
                                    className="p-1 text-red-400 hover:text-red-300"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      {(!modulo.lecciones || modulo.lecciones.length === 0) && (
                        <div className="text-center py-6 text-gray-400">
                          <Play className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No hay lecciones en este módulo</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}

        {modulos.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Play className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">No hay módulos creados</p>
            <p className="text-sm">Agrega un módulo para comenzar a estructurar tu curso</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModulosEditor;

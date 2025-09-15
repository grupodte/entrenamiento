import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import VideoPlayer from '../components/VideoPlayer/VideoPlayer';
import { 
  Play, 
  Book,
  Clock,
  CheckCircle,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  Lock,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  User,
  Star,
  Calendar,
  Trophy,
  FileText,
  Download
} from 'lucide-react';

const VisualizarCurso = () => {
  const { cursoId } = useParams();
  const { user, rol } = useAuth();
  const navigate = useNavigate();
  
  const [curso, setCurso] = useState(null);
  const [modulos, setModulos] = useState([]);
  const [leccionActual, setLeccionActual] = useState(null);
  const [progreso, setProgreso] = useState({});
  const [loading, setLoading] = useState(true);
  const [tieneAcceso, setTieneAcceso] = useState(false);
  const [modulosExpandidos, setModulosExpandidos] = useState({});
  const [sidebarColapsado, setSidebarColapsado] = useState(false);

  useEffect(() => {
    if (user && cursoId && rol) {
      verificarAccesoYCargarCurso();
    }
  }, [user, cursoId, rol]);

  const verificarAccesoYCargarCurso = async () => {
    try {
      setLoading(true);
      
      // Verificar que el usuario tenga rol apropiado
      if (rol !== 'alumno' && rol !== 'admin') {
        setTieneAcceso(false);
        setLoading(false);
        return;
      }
      
      // Los admins tienen acceso automático
      if (rol === 'admin') {
        setTieneAcceso(true);
      } else {
        // Verificar acceso del usuario al curso
        const { data: acceso } = await supabase
          .from('acceso_cursos')
          .select('*')
          .eq('usuario_id', user.id)
          .eq('curso_id', cursoId)
          .eq('activo', true)
          .single();

        if (!acceso) {
          setTieneAcceso(false);
          setLoading(false);
          return;
        }
        
        setTieneAcceso(true);
      }

      // Cargar datos del curso
      const { data: cursoData } = await supabase
        .from('cursos')
        .select('*')
        .eq('id', cursoId)
        .single();

      setCurso(cursoData);

      // Cargar módulos y lecciones
      const { data: modulosData } = await supabase
        .from('modulos_curso')
        .select(`
          *,
          lecciones (*)
        `)
        .eq('curso_id', cursoId)
        .order('orden');

      setModulos(modulosData || []);

      // Cargar progreso del usuario
      const { data: progresoData } = await supabase
        .from('progreso_lecciones')
        .select('*')
        .eq('usuario_id', user.id)
        .eq('curso_id', cursoId);

      const progresoMap = {};
      progresoData?.forEach(p => {
        progresoMap[p.leccion_id] = p;
      });
      setProgreso(progresoMap);

      // Establecer primera lección como actual si no hay progreso
      if (modulosData && modulosData.length > 0 && modulosData[0].lecciones.length > 0) {
        const primeraLeccion = modulosData[0].lecciones[0];
        setLeccionActual(primeraLeccion);
        
        // Expandir el primer módulo por defecto
        setModulosExpandidos({ [modulosData[0].id]: true });
      }

    } catch (error) {
      console.error('Error al cargar curso:', error);
    } finally {
      setLoading(false);
    }
  };

  const seleccionarLeccion = (leccion) => {
    setLeccionActual(leccion);
    
    // Marcar como primera vista si es necesario
    if (!progreso[leccion.id]?.fecha_primera_vista) {
      actualizarProgreso(leccion.id, { fecha_primera_vista: new Date().toISOString() });
    }
  };

  const actualizarProgreso = async (leccionId, datos) => {
    try {
      const { error } = await supabase
        .from('progreso_lecciones')
        .upsert({
          usuario_id: user.id,
          leccion_id: leccionId,
          curso_id: cursoId,
          ...datos,
          fecha_ultima_vista: new Date().toISOString()
        });

      if (!error) {
        setProgreso(prev => ({
          ...prev,
          [leccionId]: { ...prev[leccionId], ...datos }
        }));
      }
    } catch (error) {
      console.error('Error al actualizar progreso:', error);
    }
  };

  const marcarLeccionCompletada = (leccionId, completada = true) => {
    const datos = { 
      completada,
      fecha_completada: completada ? new Date().toISOString() : null
    };
    actualizarProgreso(leccionId, datos);
  };

  const toggleModulo = (moduloId) => {
    setModulosExpandidos(prev => ({
      ...prev,
      [moduloId]: !prev[moduloId]
    }));
  };

  const handleVideoProgress = (progressData) => {
    if (leccionActual) {
      actualizarProgreso(leccionActual.id, {
        tiempo_visto_segundos: Math.max(
          progreso[leccionActual.id]?.tiempo_visto_segundos || 0,
          progressData.currentTime
        ),
        ultima_posicion_segundos: progressData.currentTime
      });

      // Marcar como completada si vio más del 90%
      if (progressData.percentComplete > 90 && !progreso[leccionActual.id]?.completada) {
        marcarLeccionCompletada(leccionActual.id, true);
      }
    }
  };

  const ModuloItem = ({ modulo, index }) => {
    const isExpanded = modulosExpandidos[modulo.id];
    const leccionesCompletadas = modulo.lecciones?.filter(l => progreso[l.id]?.completada).length || 0;
    const totalLecciones = modulo.lecciones?.length || 0;

    return (
      <div className="border border-gray-700/50 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleModulo(modulo.id)}
          className="w-full p-4 bg-gray-800/30 hover:bg-gray-700/30 transition-colors flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-purple-600 rounded-lg text-white font-bold text-sm">
              {index + 1}
            </div>
            <div>
              <h3 className="text-white font-semibold">{modulo.titulo}</h3>
              <p className="text-gray-400 text-sm">
                {leccionesCompletadas}/{totalLecciones} lecciones • {modulo.duracion_estimada}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm text-gray-400">
              {Math.round((leccionesCompletadas / totalLecciones) * 100) || 0}%
            </div>
            <ChevronDown 
              className={`w-5 h-5 text-gray-400 transition-transform ${
                isExpanded ? 'rotate-180' : ''
              }`} 
            />
          </div>
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="">
                {modulo.lecciones?.map((leccion, leccionIndex) => {
                  const isCompleted = progreso[leccion.id]?.completada;
                  const isActive = leccionActual?.id === leccion.id;
                  
                  return (
                    <button
                      key={leccion.id}
                      onClick={() => seleccionarLeccion(leccion)}
                      className={`w-full p-4 text-left hover:bg-gray-700/30 transition-colors border-t border-gray-700/30 flex items-center gap-3 ${
                        isActive ? 'bg-purple-600/20 border-l-4 border-l-purple-500' : ''
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        isCompleted ? 'bg-green-500' : isActive ? 'bg-purple-500' : 'bg-gray-600'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="w-4 h-4 text-white" />
                        ) : (
                          <Play className="w-3 h-3 text-white ml-0.5" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="text-white font-medium">{leccion.titulo}</h4>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Clock className="w-3 h-3" />
                          <span>
                            {leccion.duracion_segundos ? 
                              `${Math.ceil(leccion.duracion_segundos / 60)} min` : 
                              'N/A'
                            }
                          </span>
                          {leccion.es_preview && (
                            <>
                              <span>•</span>
                              <span className="text-green-400">Preview</span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {isActive && (
                        <ChevronRight className="w-4 h-4 text-purple-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Cargando curso...</div>
      </div>
    );
  }

  if (!tieneAcceso) {
    return (
      <div className="min-h-screen  flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <Lock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Acceso Restringido</h1>
          <p className="text-gray-400 mb-6">No tienes acceso a este curso. Compra el curso para continuar.</p>
          <button
            onClick={() => navigate('/cursos')}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300"
          >
            Ver Catálogo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gray-800/50 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/mis-cursos')}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Mis Cursos</span>
            </button>
            <ChevronRight className="w-4 h-4 text-gray-600" />
            <h1 className="text-xl font-semibold text-white">{curso?.titulo}</h1>
          </div>
        </div>
      </div>

      <div className="flex relative">
        {/* Toggle Sidebar Button */}
        <button
          onClick={() => setSidebarColapsado(!sidebarColapsado)}
          className={`fixed top-1/2 z-50 transform -translate-y-1/2 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white p-2 rounded-l-lg transition-all duration-300 ${
            sidebarColapsado ? 'right-0' : 'right-96'
          }`}
          title={sidebarColapsado ? 'Mostrar contenido del curso' : 'Ocultar contenido del curso'}
        >
          {sidebarColapsado ? (
            <ChevronsLeft className="w-5 h-5" />
          ) : (
            <ChevronsRight className="w-5 h-5" />
          )}
        </button>

        {/* Video Player Area */}
        <div className={`flex-1 transition-all duration-300 ${
          sidebarColapsado ? 'mr-0' : 'mr-96'
        }`}>
          <div className="aspect-video bg-black">
            {leccionActual?.video_url ? (
              <VideoPlayer
                src={leccionActual.video_url}
                title={leccionActual.titulo}
                onProgressUpdate={handleVideoProgress}
                onVideoComplete={() => marcarLeccionCompletada(leccionActual.id, true)}
                allowDownload={false}
                className="w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Selecciona una lección para comenzar</p>
                </div>
              </div>
            )}
          </div>

          {/* Información de la lección actual */}
          {leccionActual && (
            <div className="p-6 bg-gray-800/30">
              <div className="max-w-4xl">
                <h2 className="text-2xl font-bold text-white mb-2">
                  {leccionActual.titulo}
                </h2>
                
                {leccionActual.descripcion && (
                  <p className="text-gray-400 mb-4">
                    {leccionActual.descripcion}
                  </p>
                )}

                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>
                      {leccionActual.duracion_segundos ? 
                        `${Math.ceil(leccionActual.duracion_segundos / 60)} min` : 
                        'Duración no disponible'
                      }
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => marcarLeccionCompletada(leccionActual.id, !progreso[leccionActual.id]?.completada)}
                      className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        progreso[leccionActual.id]?.completada 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-gray-600/20 text-gray-400 hover:bg-gray-600/30'
                      }`}
                    >
                      <CheckCircle className="w-4 h-4" />
                      {progreso[leccionActual.id]?.completada ? 'Completada' : 'Marcar completada'}
                    </button>
                  </div>
                </div>

                {leccionActual.contenido && (
                  <div className="rounded-lg p-4">
                    <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Contenido de la lección
                    </h3>
                    <p className="text-gray-300">{leccionActual.contenido}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar con módulos y lecciones */}
        <div className={`fixed top-0 right-0 w-96 bg-gray-800/50 border-l border-gray-700 h-screen overflow-y-auto transition-transform duration-300 z-40 ${
          sidebarColapsado ? 'translate-x-full' : 'translate-x-0'
        }`}>
          <div className="p-4 border-b border-gray-700 mt-16">
            <h3 className="text-lg font-semibold text-white">Contenido del curso</h3>
            <p className="text-sm text-gray-400">
              {modulos.length} módulos • {modulos.reduce((total, m) => total + (m.lecciones?.length || 0), 0)} lecciones
            </p>
          </div>
          
          <div className="p-4 space-y-3">
            {modulos.map((modulo, index) => (
              <ModuloItem key={modulo.id} modulo={modulo} index={index} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualizarCurso;

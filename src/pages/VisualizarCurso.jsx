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
  Download,
  Menu,
  X,
  SkipBack,
  SkipForward
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
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);

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

  // Obtener lección anterior y siguiente para navegación móvil
  const obtenerLeccionesNavegacion = () => {
    if (!leccionActual || !modulos.length) return { anterior: null, siguiente: null };
    
    let todasLecciones = [];
    modulos.forEach(modulo => {
      if (modulo.lecciones) {
        todasLecciones.push(...modulo.lecciones);
      }
    });
    
    const indiceActual = todasLecciones.findIndex(l => l.id === leccionActual.id);
    
    return {
      anterior: indiceActual > 0 ? todasLecciones[indiceActual - 1] : null,
      siguiente: indiceActual < todasLecciones.length - 1 ? todasLecciones[indiceActual + 1] : null
    };
  };

  const { anterior, siguiente } = obtenerLeccionesNavegacion();

  const ModuloItem = ({ modulo, index, onLeccionSelect }) => {
    const isExpanded = modulosExpandidos[modulo.id];
    const leccionesCompletadas = modulo.lecciones?.filter(l => progreso[l.id]?.completada).length || 0;
    const totalLecciones = modulo.lecciones?.length || 0;

    return (
      <div className="rounded-lg overflow-hidden">
        <button
          onClick={() => toggleModulo(modulo.id)}
          className="w-full p-3 md:p-4 bg-gray-800/30 hover:bg-gray-700/30 transition-colors flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
            <div className="flex items-center justify-center w-7 h-7 md:w-8 md:h-8 bg-purple-600 rounded-lg text-white font-bold text-xs md:text-sm flex-shrink-0">
              {index + 1}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-white font-semibold text-sm md:text-base truncate">{modulo.titulo}</h3>
              <p className="text-gray-400 text-xs md:text-sm">
                {leccionesCompletadas}/{totalLecciones} lecciones
              </p>
              <p className="text-gray-500 text-xs hidden sm:block">
                {modulo.duracion_estimada}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="text-xs md:text-sm text-gray-400">
              {Math.round((leccionesCompletadas / totalLecciones) * 100) || 0}%
            </div>
            <ChevronDown 
              className={`w-4 h-4 md:w-5 md:h-5 text-gray-400 transition-transform ${
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
                      onClick={() => {
                        seleccionarLeccion(leccion);
                        if (onLeccionSelect) onLeccionSelect();
                      }}
                      className={` w-full p-3 md:p-4 text-left hover:bg-gray-700/30 transition-colors  flex items-center gap-3 ${
                        isActive ? 'bg-purple-600/20 border-l-4 border-l-purple-500' : ''
                      }`}
                    >
                      <div className={`w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isCompleted ? 'bg-green-500' : isActive ? 'bg-purple-500' : 'bg-gray-600'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-white" />
                        ) : (
                          <Play className="w-2.5 h-2.5 md:w-3 md:h-3 text-white ml-0.5" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-medium text-sm md:text-base truncate">{leccion.titulo}</h4>
                        <div className="flex items-center gap-2 text-xs md:text-sm text-gray-400 flex-wrap">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>
                              {leccion.duracion_segundos ? 
                                `${Math.ceil(leccion.duracion_segundos / 60)} min` : 
                                'N/A'
                              }
                            </span>
                          </div>
                          {leccion.es_preview && (
                            <span className="text-green-400 bg-green-500/20 px-2 py-0.5 rounded-full text-xs">
                              Preview
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {isActive && (
                        <ChevronRight className="w-3 h-3 md:w-4 md:h-4 text-purple-400 flex-shrink-0" />
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
    <div className="min-h-screen ">
      {/* Header Responsive */}
      <div className="sticky top-0 z-30">
        <div className="px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
              <button
                onClick={() => navigate('/mis-cursos')}
                className="flex items-center gap-1 md:gap-2 text-gray-400 hover:text-white transition-colors flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline text-sm md:text-base">Mis Cursos</span>
              </button>
              <ChevronRight className="w-3 h-3 md:w-4 md:h-4 text-gray-600 hidden sm:block" />
              <h1 className="text-sm md:text-xl font-semibold text-white truncate">{curso?.titulo}</h1>
            </div>
            
        
            
            {/* Toggle Desktop Sidebar Button - Solo visible en desktop */}
            <button
              onClick={() => setSidebarColapsado(!sidebarColapsado)}
              className="hidden lg:flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg transition-colors"
            >
              {sidebarColapsado ? (
                <>
                  <ChevronsLeft className="w-4 h-4" />
                  <span className="text-sm">Mostrar contenido</span>
                </>
              ) : (
                <>
                  <ChevronsRight className="w-4 h-4" />
                  <span className="text-sm">Ocultar contenido</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Layout Responsive */}
      <div className="flex flex-col lg:flex-row relative">
        {/* Área principal de contenido */}
        <div className={`flex-1 min-h-0 transition-all duration-300 ${sidebarColapsado ? '' : 'lg:mr-96'}`}>
          {/* Video Player Responsive */}
          <div className="relative">
            <div className="aspect-video bg-black">
              {leccionActual?.video_url ? (
                <VideoPlayer
                  src={leccionActual.video_url}
                  title={leccionActual.titulo}
                  onProgressUpdate={handleVideoProgress}
                  onVideoComplete={() => marcarLeccionCompletada(leccionActual.id, true)}
                  allowDownload={false}
                  className="w-full h-full "
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <div className="text-center p-4">
                    <Play className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-sm md:text-base">Selecciona una lección para comenzar</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Navegación móvil entre lecciones */}
          <div className="lg:hidden bg-gray-800/50 border-t border-gray-700 px-4 py-3">
            <div className="flex items-center justify-between">
              <button
                onClick={() => anterior && seleccionarLeccion(anterior)}
                disabled={!anterior}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  anterior 
                    ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                }`}
              >
                <SkipBack className="w-4 h-4" />
                <span className="text-sm">Anterior</span>
              </button>
              
              <button
                onClick={() => setMenuMovilAbierto(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <span className="text-sm font-medium">Ver lecciones</span>
              </button>
              
              <button
                onClick={() => siguiente && seleccionarLeccion(siguiente)}
                disabled={!siguiente}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  siguiente 
                    ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                }`}
              >
                <span className="text-sm">Siguiente</span>
                <SkipForward className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Información de la lección actual */}
          {leccionActual && (
            <div className="p-4 md:p-6 bg-gray-800/30">
              <div className="max-w-4xl">
                <h2 className="text-lg md:text-2xl font-bold text-white mb-2">
                  {leccionActual.titulo}
                </h2>
                
                {leccionActual.descripcion && (
                  <p className="text-gray-400 mb-4 text-sm md:text-base">
                    {leccionActual.descripcion}
                  </p>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>
                      {leccionActual.duracion_segundos ? 
                        `${Math.ceil(leccionActual.duracion_segundos / 60)} min` : 
                        'Duración no disponible'
                      }
                    </span>
                  </div>
                  
                  <button
                    onClick={() => marcarLeccionCompletada(leccionActual.id, !progreso[leccionActual.id]?.completada)}
                    className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      progreso[leccionActual.id]?.completada 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                        : 'bg-gray-600/20 text-gray-400 hover:bg-gray-600/30 border border-gray-600/30'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    {progreso[leccionActual.id]?.completada ? 'Completada' : 'Marcar completada'}
                  </button>
                </div>

                {leccionActual.contenido && (
                  <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                    <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Contenido de la lección
                    </h3>
                    <p className="text-gray-300 text-sm md:text-base leading-relaxed">{leccionActual.contenido}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Desktop Sidebar */}
        <div className={`hidden lg:block fixed top-0 right-0 w-96 bg-gray-800/50 border-l border-gray-700 h-screen overflow-y-auto transition-transform duration-300 z-40 ${
          sidebarColapsado ? 'translate-x-full' : 'translate-x-0'
        }`}>
          <div className="p-4 border-b border-gray-700" style={{ marginTop: '73px' }}>
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

        {/* Modal/Drawer móvil para contenido del curso con blur */}
        <AnimatePresence>
          {menuMovilAbierto && (
            <>
              {/* Overlay con blur */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-md z-40 "
                onClick={() => setMenuMovilAbierto(false)}
              />
              
              {/* Modal Content */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className=" lg:hidden fixed  right-0 w-full bg-gray-800/20 sm:w-80 max-w-xs h-full z-50 overflow-y-auto overflow-x-hidden  shadow-2xl"
              >
            
                
                {/* Lista de módulos y lecciones */}
                <div className="p-4 space-y-3 pb-8">
                  {modulos.map((modulo, index) => (
                    <ModuloItem 
                      key={modulo.id} 
                      modulo={modulo} 
                      index={index}
                      onLeccionSelect={() => setMenuMovilAbierto(false)}
                    />
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default VisualizarCurso;

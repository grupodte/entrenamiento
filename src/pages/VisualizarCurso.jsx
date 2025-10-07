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
  X
} from 'lucide-react';
import ArrowBackIcon from '../assets/arrow-back.svg';
import SwipeBack from '../assets/swipe-back.svg';
import SwipeForward from '../assets/swipe-forward.svg';

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
      <div className=" overflow-hidden mx-auto w-full flex flex-col gap-2">
        <button
          onClick={() => toggleModulo(modulo.id)}
          className="p-4 border-[1px] rounded-[10px] border-[#ffffff]/20 flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-2 md:gap-3 ">
            <div className="flex items-center justify-center w-[42px] h-[42px] md:w-8 md:h-8 bg-[#FF0000] rounded-[5px] text-[#000000] font-bold text-[33px]  flex-shrink-0">
              {index + 1}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-white font-semibold text-[20px] leading-none">{modulo.titulo}</h3>
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
                      className={` w-full p-3 md:p-4 text-left  transition-colors  flex items-center gap-3 mb-2 ${
                        isActive ? 'bg-[#F84B4B]/20 border-[1px] border-[#FFFFFF]/20 rounded-[10px] ' : 'bg-[#F84B4B]/20 border-[1px] border-[#FFFFFF]/20 rounded-[10px]'
                      }`}
                    >
                      <div className={`w-[42px] h-[42px] rounded-[5px] flex items-center justify-center flex-shrink-0 ${
                        isCompleted ? 'bg-green-500' : isActive ? 'bg-[#FF0000] ' : 'bg-[#FF0000]'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="w-[20px] h-[20px] text-black" />
                        ) : (
                            <Play className="w-[20px] h-[20px] text-black " />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-medium text-sm md:text-base truncate">{leccion.titulo}</h4>
                    
                      </div>
                      
                      {isActive && (
                        <ChevronRight className="w-[20px] h-[20px] text-[#FF0000] flex-shrink-0" />
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
    <div className="min-h-screen pt-10 ">
      {/* Header Responsive */}
      <div className="sticky top-0 z-30">
        <div className="w-full justify-center flex flex-col m-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center ">
              <button
                onClick={() => navigate('/mis-cursos')}
                className="flex p-6 "
              >
                <img src={ArrowBackIcon} alt="Mis Cursos" className= " w-[25px] h-[25px] " />
              </button>
            </div>
            
        
            
        
          </div>
        </div>
      </div>

      {/* Layout Responsive */}
      <div className="flex flex-col w-auto mx-auto ">

    
          {/* Información de la lección actual */}
          {leccionActual && (
          <div className="p-4 md:p-6  bg-[#000000]">
              <div className="max-w-4xl">
              <h2 className="text-[27px]  leading-none font-bold text-[#F04444] mb-2">
                  {leccionActual.titulo}
                </h2>
                
                {leccionActual.descripcion && (
                  <p className="text-[#FFFFFF]  mb-4 text-[13px]">
                    {leccionActual.descripcion}
                  </p>
                )}

              

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

      {/* Área principal de contenido */}
      <div className={`flex-1 min-h-0 transition-all duration-300 w-full ${sidebarColapsado ? '' : 'lg:mr-96'}`}>
        {/* Video Player Responsive */}
        <div className="relative">
          <div className="aspect-video ">
            {leccionActual?.video_url ? (
              <VideoPlayer
                src={leccionActual.video_url}
                title={leccionActual.titulo}
                onProgressUpdate={handleVideoProgress}
                onVideoComplete={() => marcarLeccionCompletada(leccionActual.id, true)}
                allowDownload={false}
                className="w-full h-full rounded-none "
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center p-4">
                  <Play className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-sm md:text-base">Selecciona una lección para comenzar</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navegación móvil entre lecciones */}
        <div className="p-2">
          <div className="flex items-center justify-between">
            <button
              onClick={() => anterior && seleccionarLeccion(anterior)}
              disabled={!anterior}
              className={`flex items-center justify-center gap-2 h-[41px] w-[124px] rounded-[10px]  transition-colors ${anterior
                  ? 'bg-[#D9D9D9] hover:bg-gray-600 text-[#222020]'
                  : 'bg-[#D9D9D9] text-[#222020] cursor-not-allowed'
                }`}
            >
              <img src={SwipeBack} alt="Anterior" className="w-4 h-4" />
              <span className="text-sm">Anterior</span>
            </button>

            <button
              onClick={() => setMenuMovilAbierto(true)}
              className="bg-[#F84B4B] text-[15px] text-[#FFFFFF] w-[123px] h-[41px]  rounded-[10px] leading-none"
            >
              <span className="">Ver lecciones</span>
            </button>

            <button
              onClick={() => siguiente && seleccionarLeccion(siguiente)}
              disabled={!siguiente}
              className={` flex items-center justify-center gap-2 h-[41px] w-[124px] rounded-[10px]  transition-colors ${siguiente
                  ? 'bg-[#D9D9D9] hover:bg-gray-600 text-[#222020]'
                  : 'bg-[#D9D9D9] text-[#222020] cursor-not-allowed'
                }`}
            >
              <span className="text-sm">Siguiente</span>
              <img src={SwipeForward} alt="Siguiente" className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-[50px] md:mt-[20px] w-[261px] justify-center flex flex-col text-center mx-auto">

            <button
              onClick={() => marcarLeccionCompletada(leccionActual.id, !progreso[leccionActual.id]?.completada)}
              className={` flex items-center justify-center gap-2 h-[41px]  rounded-[10px] text-[17px] ${progreso[leccionActual.id]?.completada
                ? 'bg-[#47D065] text-[#222020]'
                : 'bg-[#D9D9D9] text-[#222020]'
                }`}
            >
              {progreso[leccionActual.id]?.completada ? 'Completada' : 'Marcar completada'}
            </button>

          </div>
        </div>



      </div>

      {/* Drawer de lecciones para móvil */}
      <AnimatePresence>
        {menuMovilAbierto && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuMovilAbierto(false)}
              className="fixed inset-0 bg-black/50 z-50"
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed top-0 pt-10 right-0 h-full w-full max-w-md bg-[#191919]/90 backdrop-blur-md z-50 flex flex-col"
            >
              {/* Header del drawer */}
              <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
              
                <button
                  onClick={() => setMenuMovilAbierto(false)}
                  className="w-10  h-10 flex items-center justify-center "
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Contenido scrolleable */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
  );
};

export default VisualizarCurso;

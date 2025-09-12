import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'react-hot-toast';
import { MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useDragState } from '../../context/DragStateContext';
import { FaArrowLeft, FaUser, FaDumbbell, FaChartLine } from 'react-icons/fa';
import { BookOpen, Users, Plus, X, Calendar, Gift } from 'lucide-react';
import { AnimatedLayout } from '../../components/animations';
import { motion, AnimatePresence } from 'framer-motion';

// Importar las secciones
import InfoAlumno from './AlumnoSecciones/InfoAlumno';
import RutinasAlumno from './AlumnoSecciones/RutinasAlumno';
import ProgresoAlumno from './AlumnoSecciones/ProgresoAlumno';

const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const AlumnoPerfil = () => {
    const { id } = useParams(); // Este es el alumnoId
    const location = useLocation();
    const navigate = useNavigate();
    const { alumnoInicial } = location.state || {};
    
    // Estados del perfil
    const [alumno, setAlumno] = useState(alumnoInicial);
    const [asignacionesPorDia, setAsignacionesPorDia] = useState({});
    const [rutinasBase, setRutinasBase] = useState([]);
    const [rutinasDeVerdad, setRutinasDeVerdad] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Estados para drag and drop
    const [activeId, setActiveId] = useState(null);
    const { setIsDragging } = useDragState();
    
    // Estado del tab activo
    const [tab, setTab] = useState('info'); // info | rutinas | progreso | cursos
    
    // Estados para cursos
    const [cursosAsignados, setCursosAsignados] = useState([]);
    const [cursosDisponibles, setCursosDisponibles] = useState([]);
    const [showAsignarCurso, setShowAsignarCurso] = useState(false);
    const [assigningAccess, setAssigningAccess] = useState(false);

    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor)
    );

    // Función para obtener datos
    const fetchData = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const [perfilResult, rutinasResult, asignacionesResult, rutinasDeVerdadResult] = await Promise.all([
                alumnoInicial ? { data: alumnoInicial } : supabase.from('perfiles').select('id, nombre, apellido, email, avatar_url').eq('id', id).single(),
                supabase.from('rutinas_base').select('id, nombre').order('nombre'),
                supabase.from('asignaciones')
                    .select(`
                        id, dia_semana, rutina_base_id, rutina_personalizada_id,
                        rutina_base:rutina_base_id (id, nombre),
                        rutina_personalizada:rutina_personalizada_id (id, nombre)
                    `)
                    .eq('alumno_id', id),
                supabase.from('rutinas_de_verdad').select('id, nombre')
            ]);

            if (perfilResult.error) throw perfilResult.error;
            setAlumno(perfilResult.data);

            if (rutinasResult.error) throw rutinasResult.error;
            setRutinasBase(rutinasResult.data || []);

            if (asignacionesResult.error) throw asignacionesResult.error;
            const asignaciones = asignacionesResult.data || [];

            if (rutinasDeVerdadResult.error) throw rutinasDeVerdadResult.error;
            setRutinasDeVerdad(rutinasDeVerdadResult.data || []);

            const map = {};
            for (const asig of asignaciones) {
                map[asig.dia_semana] = { asignacion: asig, ejercicios: [] };
            }
            setAsignacionesPorDia(map);
        } catch (error) {
            console.error("Error al cargar datos del perfil del alumno:", error);
            setAlumno(null);
            setRutinasBase([]);
            setAsignacionesPorDia({});
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        if (tab === 'cursos') {
            fetchCursos();
        }
    }, [id, alumnoInicial]);

    useEffect(() => {
        if (tab === 'cursos') {
            fetchCursos();
        }
    }, [tab]);

    // Función para cargar cursos
    const fetchCursos = async () => {
        try {
            // Cargar cursos asignados al alumno
            const { data: accesosData, error: accesosError } = await supabase
                .from('acceso_cursos')
                .select(`
                    *,
                    cursos(id, titulo, descripcion, categoria, nivel, precio, imagen_portada)
                `)
                .eq('usuario_id', id)
                .eq('activo', true);

            if (accesosError) throw accesosError;
            setCursosAsignados(accesosData || []);

            // Cargar todos los cursos disponibles
            const { data: cursosData, error: cursosError } = await supabase
                .from('cursos')
                .select('id, titulo, descripcion, categoria, nivel, precio, imagen_portada')
                .eq('estado', 'publicado')
                .order('titulo');

            if (cursosError) throw cursosError;
            
            // Filtrar cursos que ya tienen acceso
            const cursosYaAsignados = (accesosData || []).map(acceso => acceso.cursos.id);
            const cursosDisponiblesFiltrados = (cursosData || []).filter(
                curso => !cursosYaAsignados.includes(curso.id)
            );
            
            setCursosDisponibles(cursosDisponiblesFiltrados);
        } catch (error) {
            console.error('Error al cargar cursos:', error);
            toast.error('Error al cargar los cursos');
        }
    };

    // Función para asignar acceso a curso
    const asignarCurso = async (cursoId, tipoAcceso = 'regalo') => {
        try {
            setAssigningAccess(true);
            
            const { error } = await supabase
                .from('acceso_cursos')
                .insert({
                    usuario_id: id,
                    curso_id: cursoId,
                    tipo_acceso: tipoAcceso,
                    activo: true,
                    notas: `Asignado manualmente desde perfil del alumno el ${new Date().toLocaleString()}`
                });

            if (error) throw error;

            toast.success('Curso asignado correctamente');
            fetchCursos(); // Recargar cursos
            setShowAsignarCurso(false);
        } catch (error) {
            console.error('Error al asignar curso:', error);
            toast.error('Error al asignar el curso');
        } finally {
            setAssigningAccess(false);
        }
    };

    // Función para remover acceso a curso
    const removerAccesoCurso = async (accesoId) => {
        try {
            const { error } = await supabase
                .from('acceso_cursos')
                .delete()
                .eq('id', accesoId);

            if (error) throw error;

            toast.success('Acceso al curso removido correctamente');
            fetchCursos(); // Recargar cursos
        } catch (error) {
            console.error('Error al remover acceso:', error);
            toast.error('Error al remover el acceso');
        }
    };

    // Función para manejar drop de drag and drop
    const handleDrop = async (event) => {
        const itemId = event.active?.id;
        const overId = event.over?.id;

        setActiveId(null);

        if (!itemId || !overId || !overId.startsWith('dia-')) {
            console.warn("❌ Drop inválido", { itemId, overId });
            return;
        }

        const diaSemanaTexto = diasSemana[Number(overId.replace('dia-', ''))];
        const fechaHoy = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD

        if (asignacionesPorDia[Number(overId.replace('dia-', ''))] && asignacionesPorDia[Number(overId.replace('dia-', ''))].asignacion) {
            toast.error(`El ${diaSemanaTexto} ya tiene una rutina asignada.`);
            return;
        }

        const diaIndex = Number(overId.replace('dia-', ''));

        try {
            if (itemId.startsWith('rutina-')) {
                const rutinaBaseId = itemId.replace('rutina-', '');
                const alumnoId = id;

                toast.loading(`Asignando rutina a ${diaSemanaTexto}...`);

                const { data: existingAsignacion, error: fetchError } = await supabase
                    .from('asignaciones')
                    .select('id')
                    .eq('alumno_id', alumnoId)
                    .eq('dia_semana', diaIndex)
                    .maybeSingle();

                if (fetchError) {
                    console.error("Error al verificar asignación existente:", fetchError);
                    toast.dismiss();
                    toast.error('Error al verificar asignaciones previas.');
                    return;
                }

                if (existingAsignacion) {
                    toast.dismiss();
                    toast.warn(`El ${diaSemanaTexto} ya tiene una rutina asignada.`);
                    fetchData(true);
                    return;
                }

                const { error: insertError } = await supabase
                    .from('asignaciones')
                    .insert({
                        alumno_id: alumnoId,
                        dia_semana: diaIndex,
                        rutina_base_id: rutinaBaseId,
                        rutina_personalizada_id: null,
                        fecha_inicio: fechaHoy,
                    });

                if (insertError) {
                    throw insertError;
                }

                toast.dismiss();
                toast.success(`Rutina base asignada al ${diaSemanaTexto}.`);
                fetchData(true);

            } else {
                console.warn(`Item no soportado para asignación: ${itemId}`);
                toast.error('Este elemento no se puede asignar como rutina.');
            }
        } catch (error) {
            toast.dismiss();
            console.error("Error al asignar rutina base:", error);
            toast.error(`Error: ${error.message || 'No se pudo asignar la rutina.'}`);
        }
    };

    const handleAssignRutinaDeVerdad = async (rutinaDeVerdadId) => {
        if (!rutinaDeVerdadId) return;

        toast.loading("Asignando rutina completa...");

        try {
            // 1. Fetch all sessions for the selected routine
            const { data: sesiones, error: sesionesError } = await supabase
                .from('rutinas_de_verdad_sesiones')
                .select('dia_semana, sesion_id')
                .eq('rutina_id', rutinaDeVerdadId);

            if (sesionesError) throw sesionesError;

            // 2. Delete all existing assignments for this student for the entire week
            const dias = [0, 1, 2, 3, 4, 5, 6]; // Lunes a Domingo
            const { error: deleteError } = await supabase
                .from('asignaciones')
                .delete()
                .eq('alumno_id', id)
                .in('dia_semana', dias);

            if (deleteError) throw deleteError;

            // 3. Create new assignments
            const newAssignments = sesiones.map(s => ({
                alumno_id: id,
                dia_semana: s.dia_semana === 'lunes' ? 0 : s.dia_semana === 'martes' ? 1 : s.dia_semana === 'miercoles' ? 2 : s.dia_semana === 'jueves' ? 3 : s.dia_semana === 'viernes' ? 4 : s.dia_semana === 'sabado' ? 5 : 6,
                rutina_base_id: s.sesion_id,
                fecha_inicio: new Date().toISOString().split('T')[0],
            }));

            const { error: insertError } = await supabase
                .from('asignaciones')
                .insert(newAssignments);

            if (insertError) throw insertError;

            toast.dismiss();
            toast.success("Rutina completa asignada con éxito.");
            fetchData(true); // Refresh data silently

        } catch (error) {
            toast.dismiss();
            console.error("Error al asignar rutina de verdad:", error);
            toast.error(`Error: ${error.message || 'No se pudo asignar la rutina completa.'}`);
        }
    };

    // Configuración de tabs
    const tabs = [
        { id: 'info', label: 'Información', icon: FaUser },
        { id: 'rutinas', label: 'Rutinas', icon: FaDumbbell },
        { id: 'progreso', label: 'Progreso', icon: FaChartLine },
        { id: 'cursos', label: 'Cursos', icon: BookOpen }
    ];

    if (loading) {
        return (
            <AnimatedLayout className="p-4 max-w-6xl mx-auto text-white">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-white/10 rounded w-1/3"></div>
                    <div className="h-12 bg-white/10 rounded"></div>
                    <div className="h-64 bg-white/10 rounded"></div>
                </div>
            </AnimatedLayout>
        );
    }

    return (
        <AnimatedLayout className="p-4 max-w-6xl mx-auto text-white space-y-6 pb-safe">
            {/* Header con botón de volver */}
            <div className="flex items-center gap-4 mb-6">
                <motion.button
                    onClick={() => navigate('/admin/alumnos')}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur rounded-lg hover:bg-white/20 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <FaArrowLeft />
                    Volver
                </motion.button>
                
                <div className="flex items-center gap-3">
                    {alumno?.avatar_url ? (
                        <img
                            src={alumno.avatar_url}
                            alt={`${alumno.nombre} ${alumno.apellido}`}
                            className="w-12 h-12 rounded-full object-cover border-2 border-white/20"
                        />
                    ) : (
                        <div className="bg-white/20 rounded-full p-3">
                            <FaUser className="text-white text-lg" />
                        </div>
                    )}
                    <div>
                        <h1 className="text-2xl font-bold">
                            {alumno?.nombre} {alumno?.apellido}
                        </h1>
                        <p className="text-white/70">{alumno?.email}</p>
                    </div>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex gap-2 mb-6 border-b border-white/10 pb-2">
                {tabs.map((tabConfig) => {
                    const Icon = tabConfig.icon;
                    return (
                        <motion.button
                            key={tabConfig.id}
                            onClick={() => setTab(tabConfig.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                                tab === tabConfig.id
                                    ? 'bg-blue-500 text-white font-semibold'
                                    : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                            }`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Icon className="text-sm" />
                            {tabConfig.label}
                        </motion.button>
                    );
                })}
            </div>

            {/* Contenido dinámico según el tab activo */}
            <motion.div
                key={tab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                {tab === 'info' && <InfoAlumno alumnoId={id} />}
                {tab === 'rutinas' && (
                    <RutinasAlumno
                        alumnoId={id}
                        alumno={alumno}
                        asignacionesPorDia={asignacionesPorDia}
                        rutinasBase={rutinasBase}
                        rutinasDeVerdad={rutinasDeVerdad}
                        fetchData={fetchData}
                        diasSemana={diasSemana}
                        handleDrop={handleDrop}
                        handleAssignRutinaDeVerdad={handleAssignRutinaDeVerdad}
                        activeId={activeId}
                        setActiveId={setActiveId}
                        setIsDragging={setIsDragging}
                        sensors={sensors}
                    />
                )}
                {tab === 'progreso' && <ProgresoAlumno alumnoId={id} />}
                {tab === 'cursos' && (
                    <div className="space-y-6">
                        {/* Header de cursos */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-white">Cursos del Alumno</h2>
                                <p className="text-gray-400 text-sm mt-1">
                                    Gestiona los cursos asignados a este alumno
                                </p>
                            </div>
                            <motion.button
                                onClick={() => setShowAsignarCurso(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Plus className="w-4 h-4" />
                                Asignar Curso
                            </motion.button>
                        </div>

                        {/* Cursos asignados */}
                        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <BookOpen className="w-5 h-5" />
                                Cursos Asignados ({cursosAsignados.length})
                            </h3>
                            
                            {cursosAsignados.length > 0 ? (
                                <div className="space-y-3">
                                    {cursosAsignados.map((acceso) => (
                                        <motion.div
                                            key={acceso.id}
                                            className="bg-gray-700/50 rounded-lg p-4 flex items-center gap-4"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            layout
                                        >
                                            {acceso.cursos.imagen_portada ? (
                                                <img
                                                    src={acceso.cursos.imagen_portada}
                                                    alt={acceso.cursos.titulo}
                                                    className="w-16 h-12 rounded object-cover"
                                                />
                                            ) : (
                                                <div className="w-16 h-12 bg-purple-500/20 rounded flex items-center justify-center">
                                                    <BookOpen className="w-6 h-6 text-purple-400" />
                                                </div>
                                            )}
                                            
                                            <div className="flex-1">
                                                <h4 className="text-white font-medium">
                                                    {acceso.cursos.titulo}
                                                </h4>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-sm text-gray-400">
                                                        {acceso.cursos.categoria}
                                                    </span>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                                                        acceso.tipo_acceso === 'comprado' ? 'bg-blue-500/20 text-blue-400' :
                                                        acceso.tipo_acceso === 'regalo' ? 'bg-green-500/20 text-green-400' :
                                                        'bg-purple-500/20 text-purple-400'
                                                    }`}>
                                                        {acceso.tipo_acceso === 'comprado' ? 'Comprado' :
                                                         acceso.tipo_acceso === 'regalo' ? 'Regalo' :
                                                         acceso.tipo_acceso}
                                                    </span>
                                                    {acceso.fecha_expiracion && (
                                                        <span className="text-xs text-gray-400 flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            Expira: {new Date(acceso.fecha_expiracion).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div className="text-right">
                                                <div className="text-lg font-bold text-purple-400">
                                                    ${acceso.cursos.precio}
                                                </div>
                                                <button
                                                    onClick={() => removerAccesoCurso(acceso.id)}
                                                    className="mt-1 p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                                                    title="Remover acceso"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-400">
                                    <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p className="mb-2">Este alumno no tiene cursos asignados</p>
                                    <p className="text-sm">Usa el botón "Asignar Curso" para darle acceso a un curso</p>
                                </div>
                            )}
                        </div>

                        {/* Modal para asignar curso */}
                        <AnimatePresence>
                            {showAsignarCurso && (
                                <motion.div
                                className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowAsignarCurso(false)}
                            >
                                <motion.div
                                    className="bg-gray-900 rounded-xl p-6 w-full max-w-md border border-gray-700"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-white">Asignar Curso</h3>
                                        <button
                                            onClick={() => setShowAsignarCurso(false)}
                                            className="p-2 text-gray-400 hover:text-white rounded-lg transition-colors"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                    
                                    <div className="space-y-4 max-h-96 overflow-y-auto">
                                        {cursosDisponibles.length > 0 ? (
                                            cursosDisponibles.map((curso) => (
                                                <motion.div
                                                    key={curso.id}
                                                    className="bg-gray-800/50 rounded-lg p-4 hover:bg-gray-800 transition-colors cursor-pointer"
                                                    whileHover={{ scale: 1.02 }}
                                                    onClick={() => asignarCurso(curso.id)}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {curso.imagen_portada ? (
                                                            <img
                                                                src={curso.imagen_portada}
                                                                alt={curso.titulo}
                                                                className="w-12 h-8 rounded object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-12 h-8 bg-purple-500/20 rounded flex items-center justify-center">
                                                                <BookOpen className="w-4 h-4 text-purple-400" />
                                                            </div>
                                                        )}
                                                        
                                                        <div className="flex-1">
                                                            <h4 className="text-white font-medium text-sm">
                                                                {curso.titulo}
                                                            </h4>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-xs text-gray-400">
                                                                    {curso.categoria}
                                                                </span>
                                                                <span className="text-sm font-semibold text-purple-400">
                                                                    ${curso.precio}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        
                                                        <Gift className="w-5 h-5 text-green-400" />
                                                    </div>
                                                </motion.div>
                                            ))
                                        ) : (
                                            <div className="text-center py-8 text-gray-400">
                                                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                                <p>No hay cursos disponibles para asignar</p>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {assigningAccess && (
                                        <div className="mt-4 flex items-center justify-center gap-2 text-purple-400">
                                            <motion.div
                                                className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full"
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                            />
                                            Asignando curso...
                                        </div>
                                    )}
                                </motion.div>
                            </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </motion.div>
        </AnimatedLayout>
    );
};

export default AlumnoPerfil;

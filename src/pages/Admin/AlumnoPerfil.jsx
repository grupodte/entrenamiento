import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'react-hot-toast';
import { MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useDragState } from '../../context/DragStateContext';
import { FaArrowLeft, FaUser, FaDumbbell, FaChartLine } from 'react-icons/fa';
import { BookOpen, Users, Plus, X, Calendar, Gift, Heart, Download, Trash2 } from 'lucide-react';
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
    
    // Estados para dietas
    const [dietas, setDietas] = useState([]);
    const [dietasAsignadas, setDietasAsignadas] = useState([]);
    const [showAsignarDieta, setShowAsignarDieta] = useState(false);
    const [dietaSeleccionada, setDietaSeleccionada] = useState('');
    const [showEliminarDieta, setShowEliminarDieta] = useState(false);
    const [dietaAEliminar, setDietaAEliminar] = useState(null);
    const [assigningDiet, setAssigningDiet] = useState(false);

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
                supabase.from('rutinas_de_verdad').select('id, nombre, descripcion')
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
        } else if (tab === 'dietas') {
            fetchDietas();
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

    // Función para cargar dietas
    const fetchDietas = async () => {
        try {
            // Cargar todas las dietas disponibles
            const { data: dietasData, error: dietasError } = await supabase
                .from('dietas')
                .select('id, nombre, descripcion, archivo_url, archivo_nombre, archivos, fecha_creacion, calorias, macronutrientes, tipo, etiquetas')
                .eq('activo', true)
                .order('nombre');

            if (dietasError) throw dietasError;
            setDietas(dietasData || []);

            // Cargar dietas asignadas directamente al alumno
            const { data: asignacionesDirectas, error: errorDirectas } = await supabase
                .from('asignaciones_dietas_alumnos')
                .select(`
                    *,
                    dieta:dieta_id (id, nombre, descripcion, archivo_url, archivo_nombre, archivos, fecha_creacion, calorias, macronutrientes, tipo, etiquetas)
                `)
                .eq('alumno_id', id)
                .eq('activo', true);

            if (errorDirectas) throw errorDirectas;

            // Cargar dietas asignadas a través de grupos
            const { data: asignacionesGrupos, error: errorGrupos } = await supabase
                .from('asignaciones_dietas_grupos')
                .select(`
                    *,
                    dieta:dieta_id (id, nombre, descripcion, archivo_url, archivo_nombre, archivos, fecha_creacion, calorias, macronutrientes, tipo, etiquetas),
                    grupos_alumnos!inner (
                        asignaciones_grupos_alumnos!inner (
                            alumno_id,
                            activo
                        )
                    )
                `)
                .eq('activo', true)
                .eq('grupos_alumnos.asignaciones_grupos_alumnos.alumno_id', id)
                .eq('grupos_alumnos.asignaciones_grupos_alumnos.activo', true);

            if (errorGrupos) throw errorGrupos;

            // Combinar asignaciones directas y por grupos
            const todasAsignaciones = [];
            
            // Agregar asignaciones directas
            if (asignacionesDirectas) {
                asignacionesDirectas.forEach(asignacion => {
                    todasAsignaciones.push({
                        ...asignacion,
                        tipo_asignacion: 'directa'
                    });
                });
            }

            // Agregar asignaciones por grupos (evitando duplicados)
            if (asignacionesGrupos) {
                asignacionesGrupos.forEach(asignacion => {
                    const yaExiste = todasAsignaciones.some(a => 
                        a.dieta && asignacion.dieta && a.dieta.id === asignacion.dieta.id
                    );
                    if (!yaExiste) {
                        todasAsignaciones.push({
                            ...asignacion,
                            tipo_asignacion: 'grupo'
                        });
                    }
                });
            }

            // Ordenar por fecha de asignación más reciente
            todasAsignaciones.sort((a, b) => 
                new Date(b.fecha_asignacion) - new Date(a.fecha_asignacion)
            );

            setDietasAsignadas(todasAsignaciones);
        } catch (error) {
            console.error('Error al cargar dietas:', error);
            toast.error('Error al cargar las dietas');
        }
    };

    // Función para asignar dieta
    const asignarDieta = async () => {
        if (!dietaSeleccionada) {
            toast.error('Selecciona una dieta');
            return;
        }

        try {
            setAssigningDiet(true);
            
            // Verificar si ya tiene esta dieta asignada
            const { data: existingAssignment, error: checkError } = await supabase
                .from('asignaciones_dietas_alumnos')
                .select('id')
                .eq('alumno_id', id)
                .eq('dieta_id', dietaSeleccionada)
                .eq('activo', true)
                .maybeSingle();

            if (checkError) throw checkError;
            
            if (existingAssignment) {
                toast.error('Este alumno ya tiene esta dieta asignada');
                return;
            }

            const { error } = await supabase
                .from('asignaciones_dietas_alumnos')
                .insert({
                    alumno_id: id,
                    dieta_id: dietaSeleccionada,
                    activo: true
                });

            if (error) throw error;

            toast.success('Dieta asignada correctamente');
            fetchDietas();
            setShowAsignarDieta(false);
            setDietaSeleccionada('');
        } catch (error) {
            console.error('Error al asignar dieta:', error);
            toast.error('Error al asignar la dieta');
        } finally {
            setAssigningDiet(false);
        }
    };

    // Función para eliminar dieta asignada
    const eliminarDietaAsignada = async () => {
        if (!dietaAEliminar) return;

        try {
            const { error } = await supabase
                .from('asignaciones_dietas_alumnos')
                .update({ activo: false })
                .eq('id', dietaAEliminar.id);

            if (error) throw error;

            toast.success('Dieta eliminada correctamente');
            fetchDietas();
            setShowEliminarDieta(false);
            setDietaAEliminar(null);
        } catch (error) {
            console.error('Error al eliminar dieta:', error);
            toast.error('Error al eliminar la dieta');
        }
    };

    // Función para descargar archivos de dieta
    const descargarArchivos = async (dieta) => {
        try {
            // Si tiene múltiples archivos, descargar todos
            if (dieta.archivos && Array.isArray(dieta.archivos) && dieta.archivos.length > 0) {
                for (const archivo of dieta.archivos) {
                    try {
                        const fileName = archivo.url.split('/').pop();
                        const { data, error } = await supabase.storage
                            .from('dietas')
                            .createSignedUrl(fileName, 300); // URL válida por 5 minutos

                        if (error) {
                            console.error('Error al generar URL de descarga:', error);
                            // Fallback: usar URL directa
                            const link = document.createElement('a');
                            link.href = archivo.url;
                            link.download = archivo.name || `${dieta.nombre}_${Math.random().toString(36).substring(2, 7)}.pdf`;
                            link.target = '_blank';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        } else {
                            // Usar URL firmada
                            const link = document.createElement('a');
                            link.href = data.signedUrl;
                            link.download = archivo.name || `${dieta.nombre}_${Math.random().toString(36).substring(2, 7)}.pdf`;
                            link.target = '_blank';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        }
                        
                        // Pequeña pausa entre descargas
                        await new Promise(resolve => setTimeout(resolve, 200));
                    } catch (error) {
                        console.error('Error descargando archivo individual:', error);
                    }
                }
                toast.success(`Descargando ${dieta.archivos.length} archivo${dieta.archivos.length > 1 ? 's' : ''}`);
            } else if (dieta.archivo_url) {
                // Archivo único (compatibilidad con dietas anteriores)
                let filePath;
                if (dieta.archivo_url.includes('dietas/')) {
                    filePath = dieta.archivo_url.split('dietas/')[1];
                } else {
                    filePath = dieta.archivo_url;
                }
                
                const { data: signedUrlData, error: urlError } = await supabase.storage
                    .from('dietas')
                    .createSignedUrl(filePath, 60);

                if (urlError) {
                    console.error('Error creando URL firmada:', urlError);
                    // Fallback: usar URL pública
                    const { data: { publicUrl } } = supabase.storage
                        .from('dietas')
                        .getPublicUrl(filePath);
                    
                    const link = document.createElement('a');
                    link.href = publicUrl;
                    link.download = dieta.archivo_nombre || `${dieta.nombre}.pdf`;
                    link.target = '_blank';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                } else {
                    const link = document.createElement('a');
                    link.href = signedUrlData.signedUrl;
                    link.download = dieta.archivo_nombre || `${dieta.nombre}.pdf`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
                
                toast.success('Descarga iniciada');
            } else {
                toast.error('No hay archivos para descargar');
            }
        } catch (error) {
            console.error('Error al descargar archivos:', error);
            toast.error('Error al descargar los archivos');
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
        { id: 'cursos', label: 'Cursos', icon: BookOpen },
        { id: 'dietas', label: 'Dietas', icon: Heart }
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
                {tab === 'dietas' && (
                    <div className="space-y-6">
                        {/* Header de dietas */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-white">Dietas del Alumno</h2>
                                <p className="text-gray-400 text-sm mt-1">
                                    Gestiona las dietas asignadas a este alumno
                                </p>
                            </div>
                            <motion.button
                                onClick={() => setShowAsignarDieta(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Plus className="w-4 h-4" />
                                Asignar Dieta
                            </motion.button>
                        </div>

                        {/* Dietas asignadas */}
                        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Heart className="w-5 h-5" />
                                Dietas Asignadas ({dietasAsignadas.length})
                            </h3>
                            
                            {dietasAsignadas.length > 0 ? (
                                <div className="space-y-4">
                                    {dietasAsignadas.map((asignacion) => (
                                        <motion.div
                                            key={asignacion.id}
                                            className="bg-gray-700/50 rounded-lg p-4"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            layout
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="bg-green-500/20 rounded-lg p-3">
                                                    <Heart className="w-6 h-6 text-green-400" />
                                                </div>
                                                
                                                <div className="flex-1">
                                                    <h4 className="text-white font-semibold text-lg mb-2">
                                                        {asignacion.dieta.nombre}
                                                    </h4>
                                                    
                                                    {asignacion.dieta.descripcion && (
                                                        <p className="text-gray-300 text-sm mb-3">
                                                            {asignacion.dieta.descripcion}
                                                        </p>
                                                    )}
                                                    
                                                    {/* Información nutricional */}
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                                                        {asignacion.dieta.calorias && (
                                                            <div className="bg-blue-500/10 rounded-lg p-2 text-center">
                                                                <div className="text-blue-400 font-bold text-sm">
                                                                    {asignacion.dieta.calorias}
                                                                </div>
                                                                <div className="text-gray-400 text-xs">Calorías</div>
                                                            </div>
                                                        )}
                                                        {asignacion.dieta.macronutrientes?.proteinas && (
                                                            <div className="bg-red-500/10 rounded-lg p-2 text-center">
                                                                <div className="text-red-400 font-bold text-sm">
                                                                    {asignacion.dieta.macronutrientes.proteinas}g
                                                                </div>
                                                                <div className="text-gray-400 text-xs">Proteínas</div>
                                                            </div>
                                                        )}
                                                        {asignacion.dieta.macronutrientes?.carbohidratos && (
                                                            <div className="bg-yellow-500/10 rounded-lg p-2 text-center">
                                                                <div className="text-yellow-400 font-bold text-sm">
                                                                    {asignacion.dieta.macronutrientes.carbohidratos}g
                                                                </div>
                                                                <div className="text-gray-400 text-xs">Carbohidratos</div>
                                                            </div>
                                                        )}
                                                        {asignacion.dieta.macronutrientes?.grasas && (
                                                            <div className="bg-purple-500/10 rounded-lg p-2 text-center">
                                                                <div className="text-purple-400 font-bold text-sm">
                                                                    {asignacion.dieta.macronutrientes.grasas}g
                                                                </div>
                                                                <div className="text-gray-400 text-xs">Grasas</div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-3 text-sm text-gray-400">
                                                        <div className="flex items-center gap-1">
                                                            <Calendar className="w-4 h-4" />
                                                            <span>Asignada el {new Date(asignacion.fecha_asignacion).toLocaleDateString()}</span>
                                                        </div>
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                            asignacion.tipo_asignacion === 'directa' 
                                                                ? 'bg-cyan-500/20 text-cyan-400' 
                                                                : 'bg-purple-500/20 text-purple-400'
                                                        }`}>
                                                            {asignacion.tipo_asignacion === 'directa' ? 'Directa' : 'Por Grupo'}
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                {/* Botones de acción */}
                                                <div className="flex flex-col gap-2">
                                                    {(asignacion.dieta.archivo_url || (asignacion.dieta.archivos && asignacion.dieta.archivos.length > 0)) && (
                                                        <motion.button
                                                            onClick={() => descargarArchivos(asignacion.dieta)}
                                                            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                        >
                                                            <Download className="w-4 h-4" />
                                                            {(asignacion.dieta.archivos && asignacion.dieta.archivos.length > 1) ? 'Archivos' : 'Descargar'}
                                                        </motion.button>
                                                    )}
                                                    
                                                    <motion.button
                                                        onClick={() => {
                                                            setDietaAEliminar(asignacion);
                                                            setShowEliminarDieta(true);
                                                        }}
                                                        className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                        Eliminar
                                                    </motion.button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-400">
                                    <Heart className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p className="mb-2">Este alumno no tiene dietas asignadas</p>
                                    <p className="text-sm">Usa el botón "Asignar Dieta" para asignar una dieta</p>
                                </div>
                            )}
                        </div>

                        {/* Modal para asignar dieta */}
                        <AnimatePresence>
                            {showAsignarDieta && (
                                <motion.div
                                    className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => {
                                        setShowAsignarDieta(false);
                                        setDietaSeleccionada('');
                                    }}
                                >
                                    <motion.div
                                        className="bg-gray-900 rounded-xl p-6 w-full max-w-2xl border border-gray-700 max-h-[80vh] overflow-y-auto"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-semibold text-white">Asignar Dieta</h3>
                                            <button
                                                onClick={() => {
                                                    setShowAsignarDieta(false);
                                                    setDietaSeleccionada('');
                                                }}
                                                className="p-2 text-gray-400 hover:text-white rounded-lg transition-colors"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                        
                                        <div className="space-y-4">
                                            {/* Filtrar dietas ya asignadas */}
                                            {dietas.filter(dieta => 
                                                !dietasAsignadas.some(asignada => asignada.dieta.id === dieta.id)
                                            ).length > 0 ? (
                                                dietas.filter(dieta => 
                                                    !dietasAsignadas.some(asignada => asignada.dieta.id === dieta.id)
                                                ).map((dieta) => (
                                                    <motion.div
                                                        key={dieta.id}
                                                        className={`bg-gray-800/50 rounded-lg p-4 border-2 transition-all cursor-pointer ${
                                                            dietaSeleccionada === dieta.id
                                                                ? 'border-green-500 bg-green-500/10'
                                                                : 'border-transparent hover:border-green-500/50 hover:bg-gray-800'
                                                        }`}
                                                        whileHover={{ scale: 1.02 }}
                                                        onClick={() => setDietaSeleccionada(dieta.id)}
                                                    >
                                                        <div className="flex items-start gap-4">
                                                            <div className="bg-green-500/20 rounded-lg p-3 flex-shrink-0">
                                                                <Heart className="w-6 h-6 text-green-400" />
                                                            </div>
                                                            
                                                            <div className="flex-1">
                                                                <h4 className="text-white font-semibold mb-2">
                                                                    {dieta.nombre}
                                                                </h4>
                                                                
                                                                {dieta.descripcion && (
                                                                    <p className="text-gray-300 text-sm mb-3">
                                                                        {dieta.descripcion}
                                                                    </p>
                                                                )}
                                                                
                                                                {/* Información nutricional */}
                                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
                                                                    {dieta.calorias && (
                                                                        <div className="bg-blue-500/10 rounded p-2 text-center">
                                                                            <div className="text-blue-400 font-bold text-sm">
                                                                                {dieta.calorias}
                                                                            </div>
                                                                            <div className="text-gray-400 text-xs">Cal</div>
                                                                        </div>
                                                                    )}
                                                                    {dieta.macronutrientes?.proteinas && (
                                                                        <div className="bg-red-500/10 rounded p-2 text-center">
                                                                            <div className="text-red-400 font-bold text-sm">
                                                                                {dieta.macronutrientes.proteinas}g
                                                                            </div>
                                                                            <div className="text-gray-400 text-xs">Prot</div>
                                                                        </div>
                                                                    )}
                                                                    {dieta.macronutrientes?.carbohidratos && (
                                                                        <div className="bg-yellow-500/10 rounded p-2 text-center">
                                                                            <div className="text-yellow-400 font-bold text-sm">
                                                                                {dieta.macronutrientes.carbohidratos}g
                                                                            </div>
                                                                            <div className="text-gray-400 text-xs">Carb</div>
                                                                        </div>
                                                                    )}
                                                                    {dieta.macronutrientes?.grasas && (
                                                                        <div className="bg-purple-500/10 rounded p-2 text-center">
                                                                            <div className="text-purple-400 font-bold text-sm">
                                                                                {dieta.macronutrientes.grasas}g
                                                                            </div>
                                                                            <div className="text-gray-400 text-xs">Gras</div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ))
                                            ) : (
                                                <div className="text-center py-8 text-gray-400">
                                                    <Heart className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                                    <p>No hay dietas disponibles para asignar</p>
                                                    <p className="text-sm mt-1">Todas las dietas ya están asignadas a este alumno</p>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {dietaSeleccionada && (
                                            <div className="mt-6 flex gap-3 justify-end">
                                                <button
                                                    onClick={() => {
                                                        setShowAsignarDieta(false);
                                                        setDietaSeleccionada('');
                                                    }}
                                                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                                                    disabled={assigningDiet}
                                                >
                                                    Cancelar
                                                </button>
                                                <motion.button
                                                    onClick={asignarDieta}
                                                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    disabled={assigningDiet}
                                                >
                                                    {assigningDiet ? 'Asignando...' : 'Asignar Dieta'}
                                                </motion.button>
                                            </div>
                                        )}
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Modal para confirmar eliminación */}
                        <AnimatePresence>
                            {showEliminarDieta && dietaAEliminar && (
                                <motion.div
                                    className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => {
                                        setShowEliminarDieta(false);
                                        setDietaAEliminar(null);
                                    }}
                                >
                                    <motion.div
                                        className="bg-gray-900 rounded-xl p-6 w-full max-w-md border border-gray-700"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className="text-center">
                                            <div className="bg-red-500/20 rounded-full p-3 w-16 h-16 mx-auto mb-4">
                                                <Trash2 className="w-10 h-10 text-red-400 mx-auto" />
                                            </div>
                                            
                                            <h3 className="text-lg font-semibold text-white mb-2">Eliminar Dieta</h3>
                                            <p className="text-gray-300 mb-6">
                                                ¿Estás seguro de que quieres eliminar la dieta 
                                                <span className="font-semibold text-white">"{dietaAEliminar.dieta.nombre}"</span> 
                                                de este alumno?
                                            </p>
                                            
                                            <div className="flex gap-3 justify-center">
                                                <button
                                                    onClick={() => {
                                                        setShowEliminarDieta(false);
                                                        setDietaAEliminar(null);
                                                    }}
                                                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                                                >
                                                    Cancelar
                                                </button>
                                                <motion.button
                                                    onClick={eliminarDietaAsignada}
                                                    className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                >
                                                    Eliminar
                                                </motion.button>
                                            </div>
                                        </div>
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

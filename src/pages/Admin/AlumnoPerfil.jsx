import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'react-hot-toast';
import { MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useDragState } from '../../context/DragStateContext';
import { FaArrowLeft, FaUser, FaDumbbell, FaChartLine } from 'react-icons/fa';
import { AnimatedLayout } from '../../components/animations';
import { motion } from 'framer-motion';

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
    const [loading, setLoading] = useState(true);
    
    // Estados para drag and drop
    const [activeId, setActiveId] = useState(null);
    const { setIsDragging } = useDragState();
    
    // Estado del tab activo
    const [tab, setTab] = useState('info'); // info | rutinas | progreso

    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor)
    );

    // Función para obtener datos
    const fetchData = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const [perfilResult, rutinasResult, asignacionesResult] = await Promise.all([
                alumnoInicial ? { data: alumnoInicial } : supabase.from('perfiles').select('id, nombre, apellido, email, avatar_url').eq('id', id).single(),
                supabase.from('rutinas_base').select('id, nombre').order('nombre'),
                supabase.from('asignaciones')
                    .select(`
                        id, dia_semana, rutina_base_id, rutina_personalizada_id,
                        rutina_base:rutina_base_id (id, nombre),
                        rutina_personalizada:rutina_personalizada_id (id, nombre)
                    `)
                    .eq('alumno_id', id)
            ]);

            if (perfilResult.error) throw perfilResult.error;
            setAlumno(perfilResult.data);

            if (rutinasResult.error) throw rutinasResult.error;
            setRutinasBase(rutinasResult.data || []);

            if (asignacionesResult.error) throw asignacionesResult.error;
            const asignaciones = asignacionesResult.data || [];

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
    }, [id, alumnoInicial]);

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

    // Configuración de tabs
    const tabs = [
        { id: 'info', label: 'Información', icon: FaUser },
        { id: 'rutinas', label: 'Rutinas', icon: FaDumbbell },
        { id: 'progreso', label: 'Progreso', icon: FaChartLine }
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
                        fetchData={fetchData}
                        diasSemana={diasSemana}
                        handleDrop={handleDrop}
                        activeId={activeId}
                        setActiveId={setActiveId}
                        setIsDragging={setIsDragging}
                        sensors={sensors}
                    />
                )}
                {tab === 'progreso' && <ProgresoAlumno alumnoId={id} />}
            </motion.div>
        </AnimatedLayout>
    );
};

export default AlumnoPerfil;

import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import {
    FaDumbbell,
    FaUtensils,
    FaEnvelope,
    FaPlayCircle,
    FaCheckCircle,
    FaArrowRight,
    FaChevronDown
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

import SeleccionOrdenBloques from './SeleccionOrdenBloques';
import { useRutinaCache } from '../../hooks/useRutinaCache';
import { useRutinaPrefetch } from '../../hooks/useRutinaPrefetch';
import DashboardSkeleton from '../../components/DashboardSkeleton';

const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const getSaludo = () => {
    const hora = new Date().getHours();
    if (hora < 12) return "Buenos días,";
    if (hora < 19) return "Buenas tardes,";
    return "Buenas noches,";
};

const tipsDelDia = [
    "Mantén una buena hidratación durante el día.",
    "Haz estiramientos después de entrenar para mejorar la recuperación.",
    "La constancia es más importante que la intensidad.",
    "Una buena alimentación es clave para tus resultados.",
    "Descansa bien, el sueño es parte del progreso.",
    "Calienta antes de entrenar para evitar lesiones.",
    "Escucha a tu cuerpo y evita sobreentrenarte."
];

const getTipDelDia = () => tipsDelDia[new Date().getDay() % tipsDelDia.length];

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { clearAllCache } = useRutinaCache();
    const [nombre, setNombre] = useState('');
    const [rutinas, setRutinas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mostrarTodas, setMostrarTodas] = useState(false);
    const [completedWorkoutsThisWeek, setCompletedWorkoutsThisWeek] = useState(0);
    const [totalWorkoutsThisWeek, setTotalWorkoutsThisWeek] = useState(0);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selectedRutina, setSelectedRutina] = useState(null);

    const todayIndex = useMemo(() => (new Date().getDay() + 6) % 7, []);

    useEffect(() => {
        if (!user?.id) {
            setLoading(false);
            return;
        }

        const fetchPerfilYRutinas = async () => {
            setLoading(true);

            // Perfil
            const { data: perfilData, error: perfilError } = await supabase
                .from('perfiles').select('nombre').eq('id', user.id).single();

            if (perfilError) console.error('Error al obtener perfil:', perfilError.message);
            setNombre(perfilData?.nombre ?? 'Usuario');

            // Asignaciones
            const { data: asignaciones, error: errorAsignaciones } = await supabase
                .from('asignaciones')
                .select('dia_semana, rutina_personalizada_id, rutinas_personalizadas ( nombre ), rutina_base_id, rutinas_base ( nombre )')
                .eq('alumno_id', user.id);

            if (errorAsignaciones) {
                console.error('Error al cargar asignaciones:', errorAsignaciones);
                setRutinas([]);
                setLoading(false);
                return;
            }

            // Sesiones de hoy
            const hoy = new Date();
            const inicioDelDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).toISOString();
            const finDelDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1).toISOString();

            const { data: sesionesCompletadas, error: errorSesiones } = await supabase
                .from('sesiones_entrenamiento').select('rutina_personalizada_id, rutina_base_id')
                .eq('alumno_id', user.id).gte('created_at', inicioDelDia).lt('created_at', finDelDia);

            if (errorSesiones) console.error('Error al verificar sesiones completadas:', errorSesiones);

            const idsCompletados = new Set();
            sesionesCompletadas?.forEach(sesion => {
                if (sesion.rutina_personalizada_id) idsCompletados.add(`p-${sesion.rutina_personalizada_id}`);
                if (sesion.rutina_base_id) idsCompletados.add(`b-${sesion.rutina_base_id}`);
            });

            const formateadas = (asignaciones || []).map((a) => {
                const esPersonalizada = !!a.rutina_personalizada_id;
                const rutinaId = esPersonalizada ? `p-${a.rutina_personalizada_id}` : `b-${a.rutina_base_id}`;
                const nombre = esPersonalizada ? a.rutinas_personalizadas?.nombre : a.rutinas_base?.nombre;
                const tipo = esPersonalizada ? 'personalizada' : 'base';
                return { dia: a.dia_semana, rutinaId, nombre: nombre || 'Rutina Asignada', tipo, isCompleted: idsCompletados.has(rutinaId) };
            }).sort((a, b) => a.dia - b.dia);

            setRutinas(formateadas);

            // Progreso semanal
            const startOfWeek = new Date();
            startOfWeek.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7));
            startOfWeek.setHours(0, 0, 0, 0);

            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 7);

            const { data: sesionesSemana, error: errorSemana } = await supabase
                .from('sesiones_entrenamiento').select('id')
                .eq('alumno_id', user.id).gte('created_at', startOfWeek.toISOString()).lt('created_at', endOfWeek.toISOString());

            if (errorSemana) console.error('Error al cargar sesiones de la semana:', errorSemana);

            setCompletedWorkoutsThisWeek(sesionesSemana?.length || 0);
            setTotalWorkoutsThisWeek((asignaciones || []).length);
            setLoading(false);
        };

        fetchPerfilYRutinas();
    }, [user]);

    const iniciarRutina = useCallback((rutina) => {
        setSelectedRutina(rutina);
        setIsSheetOpen(true);
    }, []);

    const handleCloseSheet = useCallback(() => {
        setIsSheetOpen(false);
        setTimeout(() => setSelectedRutina(null), 300);
    }, []);

    const rutinaHoy = useMemo(() =>
        rutinas.find(r => r.dia === todayIndex),
        [rutinas, todayIndex]
    );

    const proximasRutinas = useMemo(() =>
        rutinas.filter(r => r.dia !== todayIndex),
        [rutinas, todayIndex]
    );

    const rutinasVisibles = useMemo(() =>
        mostrarTodas ? proximasRutinas : proximasRutinas.slice(0, 2),
        [mostrarTodas, proximasRutinas]
    );

    useRutinaPrefetch(rutinas);

    const progreso = totalWorkoutsThisWeek > 0 ? (completedWorkoutsThisWeek / totalWorkoutsThisWeek) * 100 : 0;

    if (loading) {
        return <DashboardSkeleton />;
    }

    return (
        <div className="dashboard">
            {/* Header */}
            <header className="dashboard-header">
                <p className="greeting-text">{getSaludo()}</p>
                <h1 className="user-name">{nombre}</h1>
            </header>

            {/* Stats Grid */}
            <div className="stats-grid">
                {/* Weekly Progress */}
                <div className="stat-card">
                    <h3 className="stat-title">Progreso Semanal</h3>
                    <div className="progress-circle">
                        <svg className="w-16 h-16" viewBox="0 0 36 36">
                            <path
                                className="text-gray-700"
                                stroke="currentColor"
                                strokeWidth="3"
                                fill="none"
                                d="M18 2a16 16 0 1 1 0 32 16 16 0 1 1 0-32"
                            />
                            <path
                                className="text-cyan-400"
                                stroke="currentColor"
                                strokeWidth="3"
                                fill="none"
                                strokeDasharray={`${progreso}, 100`}
                                strokeLinecap="round"
                                d="M18 2a16 16 0 1 1 0 32 16 16 0 1 1 0-32"
                            />
                        </svg>
                        <div className="progress-text">
                            <span className="progress-number">{completedWorkoutsThisWeek}</span>
                            <span className="progress-total">de {totalWorkoutsThisWeek}</span>
                        </div>
                    </div>
                </div>

                {/* Tip of the day */}
                <div className="stat-card">
                    <h3 className="tip-title">
                        <FaDumbbell />
                        Tip del Día
                    </h3>
                    <p className="tip-text">{getTipDelDia()}</p>
                </div>
            </div>

            {/* Today's workout */}
            <section className="today-section">
                {rutinaHoy ? (
                    <div className={`workout-card ${rutinaHoy.isCompleted ? 'completed' : 'pending'}`}>
                        <div className="workout-info">
                            <p className="workout-day">{diasSemana[rutinaHoy.dia]}</p>
                            <h3 className="workout-name">{rutinaHoy.nombre}</h3>
                        </div>
                        {rutinaHoy.isCompleted ? (
                            <div className="completed-badge">
                                <FaCheckCircle />
                                <span>Completado</span>
                            </div>
                        ) : (
                            <button
                                onClick={() => iniciarRutina(rutinaHoy)}
                                className="start-button"
                            >
                                <FaPlayCircle />
                                <span>Iniciar</span>
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="rest-day-card">
                        <p>No tienes ninguna rutina para hoy. ¡Día de descanso!</p>
                    </div>
                )}
            </section>

            {/* Next workouts */}
            {proximasRutinas.length > 0 && (
                <section className="upcoming-section">
                    <h3 className="section-title">Próximos entrenamientos</h3>
                    <motion.div layout className="upcoming-list">
                        <AnimatePresence>
                            {rutinasVisibles.map(rutina => (
                                <motion.div
                                    key={rutina.dia}
                                    layout
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="upcoming-card"
                                >
                                    <div className="upcoming-info">
                                        <p className="upcoming-day">{diasSemana[rutina.dia]}</p>
                                        <p className="upcoming-name">{rutina.nombre}</p>
                                    </div>
                                    <FaArrowRight className="upcoming-arrow" />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                    {proximasRutinas.length > 2 && (
                        <button
                            onClick={() => setMostrarTodas(!mostrarTodas)}
                            className="show-more-button"
                        >
                            {mostrarTodas ? 'Mostrar menos' : 'Mostrar todos'}
                            <motion.div animate={{ rotate: mostrarTodas ? 180 : 0 }}>
                                <FaChevronDown />
                            </motion.div>
                        </button>
                    )}
                </section>
            )}

            {/* More options */}
            <section className="options-section">
                <h3 className="section-title">Más opciones</h3>
                <div className="options-grid">
                    <div className="option-card disabled">
                        <div className="option-icon green">
                            <FaUtensils />
                        </div>
                        <div className="option-info">
                            <h4 className="option-title">Mi Dieta</h4>
                            <p className="option-subtitle">Próximamente</p>
                        </div>
                    </div>
                    <div className="option-card disabled">
                        <div className="option-icon red">
                            <FaEnvelope />
                        </div>
                        <div className="option-info">
                            <h4 className="option-title">Mensajes</h4>
                            <p className="option-subtitle">Próximamente</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Modal */}
            {selectedRutina && (
                <SeleccionOrdenBloques
                    isOpen={isSheetOpen}
                    onClose={handleCloseSheet}
                    rutinaId={selectedRutina.rutinaId.replace(/^[pb]-/, '')}
                    tipo={selectedRutina.tipo}
                />
            )}
        </div>
    );
};

export default Dashboard;

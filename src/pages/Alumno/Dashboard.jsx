import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import {
    FaDumbbell,
    FaPlayCircle,
    FaCheckCircle,
    FaArrowRight,
    FaChevronDown,
    FaUserCircle,
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

    const progreso = totalWorkoutsThisWeek > 0
        ? (completedWorkoutsThisWeek / totalWorkoutsThisWeek) * 100
        : 0;

    if (loading) return <DashboardSkeleton />;

    return (
        <div className="min-h-svh  text-white dashboard">
      

            {/* Contenido */}
            <main className="max-w-screen-md mx-auto px-2 pb-[env(safe-area-inset-bottom)] py-6 space-y-8">
                {/* Stats */}
                <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Progreso semanal */}
                    <div className="rounded-2xl p-4 bg-white/[0.03] border border-white/10 backdrop-blur-md shadow-[0_6px_30px_rgba(0,0,0,0.35)]">
                        <h3 className="text-sm font-medium text-white/80 mb-4">Progreso Semanal</h3>
                        <div className="flex items-center gap-4">
                            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                                {/* fondo */}
                                <path
                                    stroke="currentColor"
                                    className="text-white/15"
                                    strokeWidth="3.5"
                                    fill="none"
                                    d="M18 2a16 16 0 1 1 0 32 16 16 0 1 1 0-32"
                                />
                                {/* progreso */}
                                <path
                                    stroke="url(#grad)"
                                    strokeWidth="3.5"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeDasharray={`${Math.max(0, Math.min(100, progreso))}, 100`}
                                    d="M18 2a16 16 0 1 1 0 32 16 16 0 1 1 0-32"
                                />
                                <defs>
                                    <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
                                        <stop offset="0%" stopColor="currentColor" />
                                        <stop offset="100%" stopColor="currentColor" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div>
                                <div className="text-3xl font-bold">
                                    {completedWorkoutsThisWeek}
                                    <span className="text-white/60 text-base font-medium"> / {totalWorkoutsThisWeek}</span>
                                </div>
                                <p className="text-xs text-white/60 mt-1">Sesiones completadas</p>
                            </div>
                        </div>
                    </div>

          
                </section>

                {/* Rutina de hoy */}
                <section className="space-y-3">
                    <h3 className="text-base font-semibold text-white/90">Rutina de hoy</h3>

                    {rutinaHoy ? (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`rounded-2xl p-4 border backdrop-blur-md shadow-[0_6px_30px_rgba(0,0,0,0.35)]
               ${rutinaHoy.isCompleted
                                    ? 'bg-emerald-500/10 border-emerald-400/20'
                                    : 'bg-white/[0.03] border-white/10'}`}
                        >
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-white/60">
                                        {diasSemana[rutinaHoy.dia]}
                                    </p>
                                    <h4 className="text-lg font-semibold leading-tight">{rutinaHoy.nombre}</h4>
                                </div>

                                {rutinaHoy.isCompleted ? (
                                    <span className="inline-flex items-center gap-2 text-emerald-400 text-sm font-medium">
                                        <FaCheckCircle /> Completado
                                    </span>
                                ) : (
                                    <motion.button
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => iniciarRutina(rutinaHoy)}
                                        className="inline-flex items-center gap-2 rounded-xl px-4 py-2 bg-cyan-500 text-white font-semibold
                               shadow-[0_6px_20px_rgba(56,189,248,0.3)] hover:bg-cyan-400 transition"
                                    >
                                        <FaPlayCircle /> Iniciar
                                    </motion.button>
                                )}
                            </div>
                        </motion.div>
                    ) : (
                        <div className="rounded-2xl p-4 bg-white/[0.03] border border-white/10 text-white/80">
                            No tenés rutina hoy. ¡Día de descanso!
                        </div>
                    )}
                </section>

                {/* Próximos entrenamientos */}
                {proximasRutinas.length > 0 && (
                    <section className="space-y-3">
                        <h3 className="text-base font-semibold text-white/90">Próximos entrenamientos</h3>

                        <motion.div layout className="space-y-2">
                            <AnimatePresence>
                                {rutinasVisibles.map((rutina) => (
                                    <motion.button
                                        key={rutina.dia}
                                        layout
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        onClick={() => iniciarRutina(rutina)}
                                        className="w-full text-left rounded-2xl p-4 bg-white/[0.03] border border-white/10 
                               hover:bg-white/[0.06] transition flex items-center justify-between"
                                    >
                                        <div>
                                            <p className="text-xs uppercase tracking-wide text-white/60">
                                                {diasSemana[rutina.dia]}
                                            </p>
                                            <p className="text-sm font-medium text-white/90">{rutina.nombre}</p>
                                        </div>
                                        <FaArrowRight className="text-white/50" />
                                    </motion.button>
                                ))}
                            </AnimatePresence>
                        </motion.div>

                        {proximasRutinas.length > 2 && (
                            <button
                                onClick={() => setMostrarTodas(!mostrarTodas)}
                                className="mx-auto flex items-center gap-2 text-sm text-white/80 hover:text-white transition"
                            >
                                {mostrarTodas ? 'Mostrar menos' : 'Mostrar todos'}
                                <motion.span animate={{ rotate: mostrarTodas ? 180 : 0 }}>
                                    <FaChevronDown />
                                </motion.span>
                            </button>
                        )}
                    </section>
                )}
            </main>

            {/* Sheet / Modal */}
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

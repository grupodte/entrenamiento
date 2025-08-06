import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { FaDumbbell, FaUtensils, FaEnvelope, FaUserCircle, FaPlayCircle, FaCheckCircle, FaArrowRight, FaChevronDown } from 'react-icons/fa';
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

// Tips del día
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

    const todayIndex = useMemo(() => (new Date().getDay() + 6) % 7, []); // Lunes = 0

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
            startOfWeek.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7)); // lunes
            startOfWeek.setHours(0, 0, 0, 0);

            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 7);

            const { data: sesionesSemana, error: errorSemana } = await supabase
                .from('sesiones_entrenamiento').select('id')
                .eq('alumno_id', user.id).gte('created_at', startOfWeek.toISOString()).lt('created_at', endOfWeek.toISOString());

            if (errorSemana) console.error('Error al cargar sesiones de la semana:', errorSemana);

            setCompletedWorkoutsThisWeek(sesionesSemana?.length || 0);

            // Calculate totalWorkoutsThisWeek based on all assigned routines for the entire current week
            const totalAssignedWorkoutsThisWeek = (asignaciones || []).length;
            setTotalWorkoutsThisWeek(totalAssignedWorkoutsThisWeek);

            setLoading(false);
        };

        fetchPerfilYRutinas();
    }, [user]);

    // Optimizar con useCallback para evitar re-renders
    const iniciarRutina = useCallback((rutina) => {
        setSelectedRutina(rutina);
        setIsSheetOpen(true);
    }, []);

    const handleCloseSheet = useCallback(() => {
        setIsSheetOpen(false);
        // Pequeño delay para permitir que la animación termine
        setTimeout(() => setSelectedRutina(null), 300);
    }, []);

    // Memoizar cálculos pesados
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

    // Prefetch inteligente de rutinas
    useRutinaPrefetch(rutinas);

    const Card = ({ children, className, onClick }) => (
        <div
            className={`bg-gray-800 rounded-xl p-4 shadow-md ${className}`}
            onClick={onClick}
            role={onClick ? "button" : undefined}
            tabIndex={onClick ? 0 : undefined}
        >
            {children}
        </div>
    );

    const progreso = totalWorkoutsThisWeek > 0 ? (completedWorkoutsThisWeek / totalWorkoutsThisWeek) * 100 : 0;

    return (
        <div className="font-sans">
            <main>
                {loading ? (
                    <DashboardSkeleton />
                ) : (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-4 py-12 px-6">
                        <header>
                            <p className="text-gray-400 text-base">{getSaludo()}</p>
                            <h1 className="text-2xl font-bold text-white">{nombre}</h1>
                        </header>

                        {/* Grid for Progress and Tip */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Weekly Progress */}
                            <div className="bg-gray-800/40 backdrop-blur-md rounded-xl p-4 flex flex-col items-center justify-center text-center">
                                <h3 className="font-bold text-white text-sm mb-2">Progreso Semanal</h3>
                                <div className="relative w-20 h-20">
                                    <svg className="w-full h-full" viewBox="0 0 36 36">
                                        <path className="text-gray-700" stroke="currentColor" strokeWidth="3" fill="none" d="M18 2a16 16 0 1 1 0 32 16 16 0 1 1 0-32" />
                                        <path className="text-cyan-400" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray={`${progreso}, 100`} strokeLinecap="round" d="M18 2a16 16 0 1 1 0 32 16 16 0 1 1 0-32" />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-white font-bold text-lg">{completedWorkoutsThisWeek}</span>
                                        <span className="text-gray-400 text-xs">de {totalWorkoutsThisWeek}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Tip of the day */}
                            <div className="bg-gray-800/40 backdrop-blur-md rounded-xl p-4 flex flex-col items-center justify-center text-center">
                                <h3 className="text-sm font-semibold text-cyan-300 mb-2 flex items-center gap-2">
                                    <FaDumbbell />
                                    Tip del Día
                                </h3>
                                <p className="text-gray-300 text-xs">{getTipDelDia()}</p>
                            </div>
                        </div>

                        {/* Today's workout */}
                        <div>
                            {rutinaHoy ? (
                                <Card className={`border ${rutinaHoy.isCompleted ? 'border-green-500/50' : 'border-cyan-400/50'}`}>
                                    <div className="flex flex-col justify-between h-full">
                                        <div>
                                            <p className="font-bold text-xs text-gray-400 uppercase tracking-wider">{diasSemana[rutinaHoy.dia]}</p>
                                            <h3 className="text-xl font-bold text-white mt-1">{rutinaHoy.nombre}</h3>
                                        </div>
                                        {rutinaHoy.isCompleted ? (
                                            <div className="mt-4 flex items-center gap-2 text-green-400 font-bold py-2 px-3 rounded-lg bg-gray-700 text-sm">
                                                <FaCheckCircle className="text-lg" />
                                                <span>Completado</span>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => iniciarRutina(rutinaHoy)}
                                                className="mt-4 w-full flex items-center justify-center gap-2 bg-cyan-400 text-gray-900 font-bold py-2 px-4 rounded-lg shadow-lg hover:bg-cyan-300 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                                            >
                                                <FaPlayCircle className="text-lg" />
                                                <span>Iniciar</span>
                                            </button>
                                        )}
                                    </div>
                                </Card>
                            ) : (
                                <Card>
                                    <p className="text-gray-300 text-sm">No tienes ninguna rutina para hoy. ¡Día de descanso!</p>
                                </Card>
                            )}
                        </div>

                        {/* Next workouts */}
                        {proximasRutinas.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-3">Próximos entrenamientos</h3>
                                <motion.div layout className="space-y-3">
                                    <AnimatePresence>
                                        {rutinasVisibles.map(rutina => (
                                            <motion.div key={rutina.dia} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                                <Card
                                                    className="flex items-center gap-3 hover:bg-gray-700 bg-gray-800/20 backdrop-blur-md rounded-xl transition-colors duration-200"
                                                    onClick={() => iniciarRutina(rutina)}
                                                >
                                                    <div>
                                                        <p className="text-xs text-gray-400 font-medium">{diasSemana[rutina.dia]}</p>
                                                        <p className="font-semibold text-base text-white">{rutina.nombre}</p>
                                                    </div>
                                                    <FaArrowRight className="text-gray-400" />
                                                </Card>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </motion.div>
                                {proximasRutinas.length > 2 && (
                                    <button onClick={() => setMostrarTodas(!mostrarTodas)} className="w-full mt-3 flex items-center justify-center gap-2 text-cyan-300 text-sm font-semibold hover:text-cyan-200 transition-colors">
                                        {mostrarTodas ? 'Mostrar menos' : 'Mostrar todos'}
                                        <motion.div animate={{ rotate: mostrarTodas ? 180 : 0 }}><FaChevronDown /></motion.div>
                                    </button>
                                )}
                            </div>
                        )}

                        {/* More options */}
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-3">Más opciones</h3>
                            <div className="grid grid-cols-2 gap-4 ">
                                <Card className="flex items-center gap-3 hover:bg-gray-700 bg-gray-800/20 backdrop-blur-md rounded-xl transition-colors duration-200 cursor-not-allowed opacity-50">
                                    <div className="p-2 bg-green-500/20 rounded-lg">
                                        <FaUtensils className="text-xl text-green-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-base text-white">Mi Dieta</h4>
                                        <p className="text-xs text-gray-400">Próximamente</p>
                                    </div >
                                </Card>
                                <Card className="flex items-center gap-3 hover:bg-gray-700 bg-gray-800/20 backdrop-blur-md rounded-xl transition-colors duration-200 cursor-not-allowed opacity-50">
                                    <div className="p-2 bg-red-500/20 rounded-lg">
                                        <FaEnvelope className="text-xl text-red-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-base text-white">Mensajes</h4>
                                        <p className="text-xs text-gray-400">Próximamente</p>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </motion.div>
                )}
            </main>
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
import { useAuth } from '../../context/AuthContext';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import {
    FaDumbbell,
    FaPlayCircle,
    FaCheckCircle,
    FaCalendarDay,
    FaFire,
} from 'react-icons/fa';
import { motion } from 'framer-motion';

import SeleccionOrdenBloques from './SeleccionOrdenBloques';
import { useRutinaCache } from '../../hooks/useRutinaCache';
import { useRutinaPrefetch } from '../../hooks/useRutinaPrefetch';
import DashboardSkeleton from '../../components/DashboardSkeleton';

const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const diasSemanaCortos = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];

const getSaludo = () => {
    const hora = new Date().getHours();
    if (hora < 12) return 'Buenos días,';
    if (hora < 19) return 'Buenas tardes,';
    return 'Buenas noches,';
};

const getDateInfo = (dayOffset = 0) => {
    const date = new Date();
    date.setDate(date.getDate() + dayOffset);

    return {
        dayNumber: date.getDate(),
        month: date.toLocaleDateString('es', { month: 'short' }),
        isToday: dayOffset === 0,
        isPast: dayOffset < 0,
        isFuture: dayOffset > 0,
    };
};

const tipsDelDia = [
    'Mantén una buena hidratación durante el día.',
    'Haz estiramientos después de entrenar para mejorar la recuperación.',
    'La constancia es más importante que la intensidad.',
    'Una buena alimentación es clave para tus resultados.',
    'Descansa bien, el sueño es parte del progreso.',
    'Calienta antes de entrenar para evitar lesiones.',
    'Escucha a tu cuerpo y evita sobreentrenarte.',
];

const getTipDelDia = () => tipsDelDia[new Date().getDay() % tipsDelDia.length];

const Dashboard = () => {
    const { user } = useAuth();
    const { clearAllCache } = useRutinaCache();

    const [nombre, setNombre] = useState('');
    const [rutinas, setRutinas] = useState([]);
    const [loading, setLoading] = useState(true);

    const [completedWorkoutsThisWeek, setCompletedWorkoutsThisWeek] = useState(0);
    const [totalWorkoutsThisWeek, setTotalWorkoutsThisWeek] = useState(0);
    const [currentStreak, setCurrentStreak] = useState(0);

    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selectedRutina, setSelectedRutina] = useState(null);

    useEffect(() => {
        if (!user?.id) {
            setLoading(false);
            return;
        }

        const fetchPerfilYRutinas = async () => {
            setLoading(true);

            // Perfil
            const { data: perfilData, error: perfilError } = await supabase
                .from('perfiles')
                .select('nombre')
                .eq('id', user.id)
                .single();
            if (perfilError) console.error('Error al obtener perfil:', perfilError.message);
            setNombre(perfilData?.nombre ?? 'Usuario');

            // Asignaciones
            const { data: asignaciones, error: errorAsignaciones } = await supabase
                .from('asignaciones')
                .select(
                    'dia_semana, rutina_personalizada_id, rutinas_personalizadas ( nombre ), rutina_base_id, rutinas_base ( nombre )'
                )
                .eq('alumno_id', user.id);

            if (errorAsignaciones) {
                console.error('Error al cargar asignaciones:', errorAsignaciones);
                setRutinas([]);
                setLoading(false);
                return;
            }

            // Sesiones completadas HOY
            const hoy = new Date();
            const inicioDelDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).toISOString();
            const finDelDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1).toISOString();

            const { data: sesionesCompletadas, error: errorSesiones } = await supabase
                .from('sesiones_entrenamiento')
                .select('rutina_personalizada_id, rutina_base_id')
                .eq('alumno_id', user.id)
                .gte('created_at', inicioDelDia)
                .lt('created_at', finDelDia);

            if (errorSesiones) console.error('Error al verificar sesiones completadas:', errorSesiones);

            const idsCompletados = new Set();
            sesionesCompletadas?.forEach((sesion) => {
                if (sesion.rutina_personalizada_id) idsCompletados.add(`p-${sesion.rutina_personalizada_id}`);
                if (sesion.rutina_base_id) idsCompletados.add(`b-${sesion.rutina_base_id}`);
            });

            const formateadas = (asignaciones || [])
                .map((a) => {
                    const esPersonalizada = !!a.rutina_personalizada_id;
                    const rutinaId = esPersonalizada ? `p-${a.rutina_personalizada_id}` : `b-${a.rutina_base_id}`;
                    const nombre = esPersonalizada ? a.rutinas_personalizadas?.nombre : a.rutinas_base?.nombre;
                    const tipo = esPersonalizada ? 'personalizada' : 'base';
                    return {
                        dia: a.dia_semana,
                        rutinaId,
                        nombre: nombre || 'Rutina Asignada',
                        tipo,
                        isCompleted: idsCompletados.has(rutinaId),
                    };
                })
                .sort((a, b) => a.dia - b.dia);

            setRutinas(formateadas);

            // Progreso semanal
            const startOfWeek = new Date();
            startOfWeek.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7));
            startOfWeek.setHours(0, 0, 0, 0);

            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 7);

            const { data: sesionesSemana, error: errorSemana } = await supabase
                .from('sesiones_entrenamiento')
                .select('id, created_at')
                .eq('alumno_id', user.id)
                .gte('created_at', startOfWeek.toISOString())
                .lt('created_at', endOfWeek.toISOString());
            if (errorSemana) console.error('Error al cargar sesiones de la semana:', errorSemana);

            setCompletedWorkoutsThisWeek(sesionesSemana?.length || 0);
            setTotalWorkoutsThisWeek((asignaciones || []).length);

            // Calcular racha actual (días consecutivos)
            const { data: sesionesRecientes, error: errorRacha } = await supabase
                .from('sesiones_entrenamiento')
                .select('created_at')
                .eq('alumno_id', user.id)
                .order('created_at', { ascending: false })
                .limit(30); // últimos 30 entrenamientos

            if (!errorRacha && sesionesRecientes) {
                let streak = 0;
                const today = new Date();
                today.setHours(23, 59, 59, 999);

                for (let i = 0; i < 30; i++) {
                    const checkDate = new Date(today);
                    checkDate.setDate(today.getDate() - i);
                    checkDate.setHours(0, 0, 0, 0);

                    const hasWorkout = sesionesRecientes.some(sesion => {
                        const sesionDate = new Date(sesion.created_at);
                        sesionDate.setHours(0, 0, 0, 0);
                        return sesionDate.getTime() === checkDate.getTime();
                    });

                    if (hasWorkout) {
                        streak++;
                    } else {
                        break;
                    }
                }
                setCurrentStreak(streak);
            }

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

    useRutinaPrefetch(rutinas);

    const progreso =
        totalWorkoutsThisWeek > 0 ? (completedWorkoutsThisWeek / totalWorkoutsThisWeek) * 100 : 0;

    if (loading) return <DashboardSkeleton />;

    return (
        <div className="min-h-screen  px-6 py-8">
            {/* Header */}
            <header className="mb-8">
                <p className="text-slate-400 text-base mb-2">{getSaludo()}</p>
                <h1 className="text-3xl font-bold text-white">{nombre}</h1>
            </header>

            {/* Estadísticas */}
            <section className="mb-8">
                <div className="overflow-x-auto scrollbar-hide">
                    <div className="flex gap-4 pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>

                        {/* Progreso semanal */}
                        <motion.div 
                            className="min-w-48 bg-gradient-to-br from-slate-800/50 via-slate-800/40 to-slate-900/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/30 flex-shrink-0 hover:border-emerald-500/30 transition-all duration-300 group"
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <h3 className="text-slate-400 text-xs font-medium mb-3 uppercase tracking-wider group-hover:text-emerald-300 transition-colors duration-300">
                                <FaFire className="inline mr-1.5" />
                                Progreso Semanal
                            </h3>
                            <div className="flex items-center gap-3 relative z-10">
                                <div className="relative">
                                    <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                                        <path
                                            className="text-slate-700/60"
                                            stroke="currentColor"
                                            strokeWidth="2.5"
                                            fill="none"
                                            d="M18 2a16 16 0 1 1 0 32 16 16 0 1 1 0-32"
                                        />
                                        <motion.path
                                            className="text-emerald-400 group-hover:text-emerald-300"
                                            stroke="currentColor"
                                            strokeWidth="2.5"
                                            fill="none"
                                            strokeDasharray={`${progreso}, 100`}
                                            strokeLinecap="round"
                                            d="M18 2a16 16 0 1 1 0 32 16 16 0 1 1 0-32"
                                            initial={{ strokeDasharray: "0, 100" }}
                                            animate={{ strokeDasharray: `${progreso}, 100` }}
                                            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <motion.span 
                                            className="text-sm font-bold text-white group-hover:text-emerald-100 transition-colors duration-300"
                                            initial={{ opacity: 0, scale: 0.5 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ duration: 0.5, delay: 0.8 }}
                                        >
                                            {Math.round(progreso)}%
                                        </motion.span>
                                    </div>
                                </div>
                                <div>
                                    <motion.div 
                                        className="text-xl font-bold text-white group-hover:text-emerald-100 transition-colors duration-300"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5, delay: 0.3 }}
                                    >
                                        {completedWorkoutsThisWeek}
                                    </motion.div>
                                    <div className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors duration-300">de {totalWorkoutsThisWeek}</div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Racha actual */}
                        <motion.div 
                            className="min-w-48 bg-gradient-to-br from-slate-800/50 via-slate-800/40 to-slate-900/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/30 flex-shrink-0 hover:border-orange-500/30 transition-all duration-300 group relative overflow-hidden"
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-amber-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <h3 className="text-slate-400 text-xs font-medium mb-3 uppercase tracking-wider group-hover:text-orange-300 transition-colors duration-300 relative z-10">
                                <FaFire className="inline mr-1.5 text-orange-500" />
                                Racha Actual
                            </h3>
                            <div className="flex items-center gap-3 relative z-10">
                                <motion.div 
                                    className="text-2xl font-bold text-orange-400 group-hover:text-orange-300 transition-colors duration-300"
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ duration: 0.6, delay: 0.4, type: "spring", stiffness: 200 }}
                                >
                                    {currentStreak}
                                </motion.div>
                                <motion.div 
                                    className="text-slate-400 group-hover:text-slate-300 transition-colors duration-300"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.5, delay: 0.7 }}
                                >
                                    <div className="text-sm font-medium">
                                        {currentStreak === 1 ? 'día' : 'días'}
                                    </div>
                                    <div className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors duration-300">consecutivos</div>
                                </motion.div>
                            </div>
                            {/* Efecto de llama sutil */}
                            <motion.div 
                                className="absolute top-2 right-2 text-orange-400/20 text-xs"
                                animate={{ 
                                    rotate: [0, 5, -5, 0],
                                    scale: [1, 1.1, 1]
                                }}
                                transition={{ 
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                            >
                            </motion.div>
                        </motion.div>

                        {/* Consejo del día */}
                        <motion.div 
                            className="min-w-48 bg-gradient-to-br from-slate-800/50 via-slate-800/40 to-slate-900/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/30 flex-shrink-0 hover:border-blue-500/30 transition-all duration-300 group relative overflow-hidden"
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <h3 className="text-slate-400 text-xs font-medium mb-3 uppercase tracking-wider group-hover:text-blue-300 transition-colors duration-300 relative z-10">
                                <motion.div 
                                    className="inline-block mr-1.5"
                                    animate={{ 
                                        rotate: [0, 10, -10, 0],
                                    }}
                                    transition={{ 
                                        duration: 3,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                >
                                    <FaDumbbell className="text-blue-500" />
                                </motion.div>
                                Consejo del Día
                            </h3>
                            <motion.p 
                                className="text-slate-200 text-sm leading-relaxed group-hover:text-slate-100 transition-colors duration-300 relative z-10"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.5 }}
                            >
                                {getTipDelDia()}
                            </motion.p>
                            {/* Icono decorativo flotante */}
                        
                        </motion.div>
                        

                    </div>
                </div>
                <style jsx>{`
          .overflow-x-auto::-webkit-scrollbar {
            display: none;
          }
        `}</style>
            </section>
            <section className="mb-8">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                    <div className="w-1 h-6 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-full"></div>
                    Mis Rutinas
                </h3>

                <div className="max-h-[28rem] overflow-y-auto space-y-4 pr-1"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {Array.from({ length: 7 })
                        .map((_, index) => {
                            const r = rutinas.find((x) => x.dia === index);
                            const isRest = !r;
                            const dateInfo = getDateInfo(index - new Date().getDay() + (new Date().getDay() === 0 ? -6 : 1));

                            return { index, r, isRest, dateInfo };
                        })
                        .filter(({ isRest }) => !isRest) // Filtrar días de descanso
                        .map(({ index, r, dateInfo }) => (
                            <motion.div
                                key={index}
                                className={`group relative p-6 rounded-2xl backdrop-blur-sm shadow-lg border transition-all duration-300
                  ${dateInfo.isToday
                                        ? 'bg-gradient-to-r from-emerald-900/40 to-teal-900/40 border-emerald-500/30 shadow-emerald-500/10'
                                        : dateInfo.isPast
                                            ? 'bg-gradient-to-r from-slate-800/30 to-slate-900/30 border-slate-700/20 opacity-80'
                                            : 'bg-gradient-to-r from-slate-800/40 to-slate-900/40 border-slate-700/30 hover:border-slate-600/50 hover:shadow-xl'
                                    }
                `}
                                whileHover={{ scale: 1.02, y: -2 }}
                                layout
                            >
                                <div className="flex items-center justify-between">
                                    {/* Info del día */}
                                    <div className="flex items-center gap-6">
                                        <div className="flex flex-col items-center">
                                            <div className={`text-xs font-bold uppercase tracking-wider mb-1
                        ${dateInfo.isToday ? 'text-emerald-300' : 'text-slate-400'}`}>
                                                {diasSemanaCortos[index]}
                                            </div>
                                            <div className={`flex flex-col items-center gap-1
                        ${dateInfo.isToday ? 'text-emerald-200' : 'text-slate-500'}`}>
                                                <FaCalendarDay className="text-sm" />
                                                <div className="text-lg font-bold">{dateInfo.dayNumber}</div>
                                                <div className="text-xs uppercase">{dateInfo.month}</div>
                                            </div>
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h4 className={`font-bold text-xl
                          ${dateInfo.isToday ? 'text-white' : 'text-slate-200'}`}>
                                                    {r.nombre}
                                                </h4>
                                                {dateInfo.isToday && (
                                                    <span className="px-3 py-1 text-xs font-bold bg-emerald-500 text-slate-900 rounded-full animate-pulse">
                                                        HOY
                                                    </span>
                                                )}
                                            </div>

                                            {r.isCompleted && (
                                                <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
                                                    <FaCheckCircle className="text-lg" />
                                                    <span>Entrenamiento completado</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Acción */}
                                    <div className="flex-shrink-0">
                                        {r.isCompleted ? (
                                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-600/20 flex items-center justify-center border border-emerald-500/30">
                                                <FaCheckCircle className="text-emerald-400 text-2xl" />
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => iniciarRutina(r)}
                                                className={`w-20 h-20 rounded-2xl font-bold transition-all duration-300 flex items-center justify-center group-hover:scale-105 active:scale-95
                          ${dateInfo.isToday
                                                        ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40'
                                                        : 'bg-gradient-to-br from-slate-600 to-slate-700 text-white hover:from-slate-500 hover:to-slate-600'
                                                    }`}
                                            >
                                                <FaPlayCircle className="text-2xl" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Indicador de progreso para día actual */}
                                {dateInfo.isToday && (
                                    <div className="mt-4 pt-4 border-t border-emerald-500/20">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-emerald-200 font-medium">Estado del entrenamiento</span>
                                            <span className={`font-bold px-3 py-1 rounded-full text-xs
                        ${r.isCompleted
                                                    ? 'bg-emerald-500/20 text-emerald-300'
                                                    : 'bg-amber-500/20 text-amber-300'}`}>
                                                {r.isCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Efecto de brillo sutil */}
                                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                            </motion.div>
                        ))}
                </div>

                {/* Estilos para ocultar scrollbar */}
                <style jsx>{`
          .max-h-[28rem]::-webkit-scrollbar {
            display: none;
          }
        `}</style>
            </section>


            {/* Sheet de selección de bloque */}
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
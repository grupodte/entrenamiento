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

import arrow from '../../assets/arrow.svg';


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

    // valores de ejemplo
    // const completedWorkoutsThisWeek = 1;
    // const totalWorkoutsThisWeek = 3;

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
        ? Math.max(0, Math.min(100, (completedWorkoutsThisWeek / totalWorkoutsThisWeek) * 100))
        : 0;


    return (
        <div className={`min-h-svh text-white dashboard transition-all duration-300 ${loading ? 'blur-[20px] pointer-events-none' : 'blur-0'}`}>
      

            {/* Contenido */}
            <main className="mx-auto w-[380px] ">
                {/* Stats */}
                <section className="grid grid-cols-1">
                    {/* Progreso semanal */}
                    <div className="bg-black rounded-2xl p-5 sm:p-6 text-white ">
                        <div className="flex items-center justify-between">
                            {/* Izquierda: título en dos líneas */}
                            <p className="flex text-[28px] sm:text-[32px] leading-none tracking-tight font-medium">
                                Progreso<br />semanal
                            </p>

                            {/* derecha:  contador  */}
                            <div className="flex grid grid-cols-2 items-center gap-2">
                            {/* Centro: anillo de progreso con número */}
                            <div className="relative w-24 h-24 -rotate-90">
                                <svg className="w-full h-full" viewBox="0 0 36 36">
                                    {/* Fondo (anillo gris) */}
                                    <path
                                        d="M18 2a16 16 0 1 1 0 32 16 16 0 1 1 0-32"
                                        fill="none"
                                        stroke="#3A414D"           
                                        strokeWidth="4"
                                        pathLength="100"
                                    />
                                    {/* Progreso (rojo) */}
                                    <path
                                        d="M18 2a16 16 0 1 1 0 32 16 16 0 1 1 0-32"
                                        fill="none"
                                        stroke="#FF0000"           
                                        strokeWidth="4"
                                        strokeLinecap="round"
                                        pathLength="100"
                                        strokeDasharray={`${progreso} 100`}
                                    />
                                </svg>

                                {/* Número al centro */}
                                <span className="absolute inset-0 grid place-items-center rotate-90 text-[36px] font-semibold text-[#FF0000]">
                                    {completedWorkoutsThisWeek}
                                </span>
                                
                            </div>

                            {/* Derecha: "de N" */}
                            <span className="text-[19px] text-white/80">
                                de {totalWorkoutsThisWeek}
                            </span>
                            </div>
                        
                        </div>

                        {/* Pie opcional */}
                        {/* <p className="text-xs text-white/60 mt-4">Sesiones completadas</p> */}
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
                        <h3 className="text-[20px] text-[#000000]">Próximos entrenamientos</h3>

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
                                        className="w-full  h-[110px] text-left leading-none p-2 rounded-2xl bg-[#000000] flex items-center justify-between pr-8 pl-4"
                                    >
                                        <div>
                                            <p className="text-[15px] tracking-wide text-white/60 mb-1">
                                                {diasSemana[rutina.dia]}
                                            </p>
                                            <p className="text-[27px] font-bold text-[#F84B4B]">{rutina.nombre}</p>
                                        </div>

                                            <div className="">
                                                          <img src={arrow} alt="arrow" />
                                                        </div>

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

// src/pages/Alumno/DashboardRutinas.jsx

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { FaSignOutAlt, FaArrowLeft, FaPlayCircle, FaCheckCircle } from 'react-icons/fa'; // Importado FaCheckCircle
import { motion, AnimatePresence } from 'framer-motion';

const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const DashboardRutinas = () => {
    const { user, logout } = useAuth();
    const [rutinas, setRutinas] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const todayIndex = (new Date().getDay() + 6) % 7;

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        // Reemplaza tu función fetchRutinasYCompletadas en DashboardRutinas.jsx con esta:

        const fetchRutinasYCompletadas = async () => {
            setLoading(true);

            // 1. Obtener las rutinas asignadas (esto ya estaba bien)
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

            // --- INICIO DE LA CORRECCIÓN ---

            // 2. OBTENER RUTINAS COMPLETADAS HOY (DE AMBOS TIPOS)
            const hoy = new Date();
            const inicioDelDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).toISOString();
            const finDelDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1).toISOString();

            // CAMBIO 1: Pedimos tanto el ID de la rutina base como el de la personalizada
            const { data: sesionesCompletadas, error: errorSesiones } = await supabase
                .from('sesiones_entrenamiento')
                .select('rutina_personalizada_id, rutina_base_id')
                .eq('alumno_id', user.id)
                .gte('created_at', inicioDelDia)
                .lt('created_at', finDelDia);

            if (errorSesiones) {
                console.error('Error al verificar sesiones completadas:', errorSesiones);
            }

            // CAMBIO 2: Procesamos ambos IDs para crear el conjunto de rutinas completadas
            const idsCompletados = new Set();
            sesionesCompletadas?.forEach(sesion => {
                if (sesion.rutina_personalizada_id) {
                    idsCompletados.add(sesion.rutina_personalizada_id);
                }
                if (sesion.rutina_base_id) {
                    idsCompletados.add(sesion.rutina_base_id);
                }
            });

            // --- FIN DE LA CORRECCIÓN ---

            // 3. Añadir el estado 'isCompleted' a cada rutina (esto ya estaba bien)
            const formateadas = asignaciones
                .map((a) => {
                    const esPersonalizada = !!a.rutina_personalizada_id;
                    const rutinaId = esPersonalizada ? a.rutina_personalizada_id : a.rutina_base_id;
                    const nombre = esPersonalizada ? a.rutinas_personalizadas?.nombre : a.rutinas_base?.nombre;
                    const tipo = esPersonalizada ? 'personalizada' : 'base';
                    return {
                        dia: a.dia_semana,
                        rutinaId,
                        nombre: nombre || 'Rutina Asignada',
                        tipo,
                        isCompleted: idsCompletados.has(rutinaId) // Ahora esto funcionará para ambos tipos
                    };
                })
                .sort((a, b) => a.dia - b.dia);

            setRutinas(formateadas);
            setLoading(false);
        };

        fetchRutinasYCompletadas();
    }, [user]);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const iniciarRutina = (rutina) => {
        navigate(`/rutina/${rutina.rutinaId}?tipo=${rutina.tipo}`, {
            state: { startTimer: true }
        });
    }

    const verDetalleRutina = (rutina) => {
        navigate(`/rutina/${rutina.rutinaId}?tipo=${rutina.tipo}`);
    }

    return (
        <div className="min-h-screen pb-24 bg-gray-100 font-inter">
            <header className="w-full bg-white shadow-sm sticky top-0 z-20">
                <div className="max-w-5xl mx-auto flex justify-between items-center px-6 py-4">
                    <h1 className="text-xl font-bold text-gray-800">
                        Bienvenido, {user?.user_metadata?.nombre || 'Alumno'}
                    </h1>
                    <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-red-600 hover:text-red-800 transition">
                        <FaSignOutAlt />
                        <span className="hidden sm:inline">Cerrar sesión</span>
                    </button>
                </div>
            </header>

            <main className="max-w-5xl mx-auto p-6">
                <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:underline mb-8">
                    <FaArrowLeft />
                    Volver al Panel Principal
                </Link>

                {loading ? (
                    <div className="text-center py-10">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                        <p className="mt-4 text-gray-500">Cargando tu plan...</p>
                    </div>
                ) : rutinas.length > 0 ? (
                    <div className="space-y-10">
                        <AnimatePresence>
                            {rutinas.filter(r => r.dia === todayIndex).map(rutina => (
                                <motion.div
                                    key="hoy"
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className={`rounded-2xl shadow-xl p-6 md:p-8 text-white ${rutina.isCompleted
                                            ? 'bg-gradient-to-br from-green to-emerald-500'
                                            : 'bg-gradient-to-br from-indigo to-blue-500'
                                        }`}
                                >
                                    <p className="font-bold text-sm text-white/80 uppercase tracking-wider">Rutina de Hoy: {diasSemana[rutina.dia]}</p>
                                    <h3 className="text-3xl lg:text-4xl font-extrabold mt-2 drop-shadow-md">{rutina.nombre}</h3>

                                    {/* --- NUEVO: RENDERIZADO CONDICIONAL DEL BOTÓN --- */}
                                    {rutina.isCompleted ? (
                                        <div className="mt-8 flex items-center justify-center gap-3 bg-white/20 text-white font-bold py-3 px-8 rounded-full cursor-not-allowed">
                                            <FaCheckCircle className="text-2xl" />
                                            <span>Entrenamiento Completado</span>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => iniciarRutina(rutina)}
                                            className="mt-8 w-full md:w-auto flex items-center justify-center gap-3 bg-white text-indigo-600 font-bold py-3 px-8 rounded-full shadow-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-white/50"
                                        >
                                            <FaPlayCircle className="text-2xl" />
                                            <span>Iniciar Entrenamiento</span>
                                        </button>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>

                            {/* Dentro del return de DashboardRutinas.jsx */}

                            <div className="border-t border-gray-200 pt-8">
                                <h3 className="text-2xl font-bold text-gray-700 mb-5">Próximos Días</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {rutinas.filter(r => r.dia !== todayIndex).map((rutina) => (
                                        <motion.div
                                            key={rutina.dia}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: rutina.dia * 0.05 }}
                                            className="bg-white rounded-xl shadow-md border p-5 flex flex-col justify-between group transition-all duration-300 hover:shadow-lg hover:border-indigo-500"
                                        >
                                            <div>
                                                <p className="text-sm text-gray-500 font-medium">{diasSemana[rutina.dia]}</p>
                                                <p className="font-semibold text-lg text-gray-800 mt-1">{rutina.nombre}</p>
                                            </div>

                                            {/* --- AQUÍ ESTÁ LA CORRECCIÓN --- */}
                                            <button
                                                onClick={() => iniciarRutina(rutina)} // CAMBIO: Se usa iniciarRutina en lugar de verDetalleRutina
                                                className="mt-4 text-sm font-semibold text-indigo-600 self-start flex items-center gap-2 group-hover:text-indigo-800 transition-colors"
                                            >
                                                <FaPlayCircle /> {/* Se añade ícono para consistencia */}
                                                <span>Iniciar Entrenamiento</span> {/* Se cambia el texto para consistencia */}
                                            </button>
                                            {/* --- FIN DE LA CORRECCIÓN --- */}

                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                    </div>
                ) : (
                    <div className="text-center text-gray-600 bg-white p-8 rounded-lg shadow-sm">
                        <p className="font-semibold text-xl">¡Todo listo para empezar!</p>
                        <p className="text-sm mt-2">Aún no tienes rutinas asignadas. Ponte en contacto con tu entrenador para que te arme un plan.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default DashboardRutinas;
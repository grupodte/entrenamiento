// src/pages/Alumno/DashboardRutinas.jsx

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { FaSignOutAlt, FaArrowLeft, FaPlayCircle } from 'react-icons/fa'; // Importado FaPlayCircle
import { motion, AnimatePresence } from 'framer-motion';

const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const DashboardRutinas = () => {
    const { user, logout } = useAuth();
    const [rutinas, setRutinas] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Obtiene el índice del día actual (Lunes=0, Martes=1, ..., Domingo=6)
    const todayIndex = (new Date().getDay() + 6) % 7;

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const fetchRutinas = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('asignaciones')
                .select('dia_semana, rutina_personalizada_id, rutinas_personalizadas ( nombre ), rutina_base_id, rutinas_base ( nombre )')
                .eq('alumno_id', user.id);

            if (error) {
                console.error('Error al cargar asignaciones:', error);
                setRutinas([]);
            } else {
                const formateadas = data
                    .map((a) => {
                        const esPersonalizada = !!a.rutina_personalizada_id;
                        const rutinaId = esPersonalizada ? a.rutina_personalizada_id : a.rutina_base_id;
                        const nombre = esPersonalizada ? a.rutinas_personalizadas?.nombre : a.rutinas_base?.nombre;
                        const tipo = esPersonalizada ? 'personalizada' : 'base';
                        return { dia: a.dia_semana, rutinaId, nombre: nombre || 'Rutina Asignada', tipo };
                    })
                    .sort((a, b) => a.dia - b.dia);
                setRutinas(formateadas);
            }
            setLoading(false);
        };

        fetchRutinas();
    }, [user]);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    // Nueva función que navega y pasa el estado para iniciar el cronómetro
    const iniciarRutina = (rutina) => {
        navigate(`/rutina/${rutina.rutinaId}?tipo=${rutina.tipo}`, {
            state: { startTimer: true }
        });
    }

    // Función para ver detalles sin iniciar el cronómetro
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
                        {/* Sección para la rutina de HOY */}
                        <AnimatePresence>
                            {rutinas.filter(r => r.dia === todayIndex).map(rutina => (
                                <motion.div
                                    key="hoy"
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="bg-gradient-to-br from-indigo-600 to-blue-500 rounded-2xl shadow-xl p-6 md:p-8 text-white"
                                >
                                    <p className="font-bold text-sm text-white/80 uppercase tracking-wider">Rutina de Hoy: {diasSemana[rutina.dia]}</p>
                                    <h3 className="text-3xl lg:text-4xl font-extrabold mt-2 drop-shadow-md">{rutina.nombre}</h3>
                                    <button
                                        onClick={() => iniciarRutina(rutina)}
                                        className="mt-8 w-full md:w-auto flex items-center justify-center gap-3 bg-white text-indigo-600 font-bold py-3 px-8 rounded-full shadow-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-white/50"
                                    >
                                        <FaPlayCircle className="text-2xl" />
                                        <span>Iniciar Entrenamiento</span>
                                    </button>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {/* Sección para las otras rutinas */}
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
                                        <button
                                            onClick={() => verDetalleRutina(rutina)}
                                            className="mt-4 text-sm font-semibold text-indigo-600 text-left self-start group-hover:underline"
                                        >
                                            Ver detalle →
                                        </button>
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
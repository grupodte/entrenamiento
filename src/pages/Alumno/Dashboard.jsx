import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { FaDumbbell, FaUtensils, FaEnvelope, FaUserCircle, FaPlayCircle, FaCheckCircle, FaArrowRight, FaChevronDown } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const getSaludo = () => {
    const hora = new Date().getHours();
    if (hora < 12) return "Buenos días,";
    if (hora < 19) return "Buenas tardes,";
    return "Buenas noches,";
}

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [nombre, setNombre] = useState('');
    const [rutinas, setRutinas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mostrarTodas, setMostrarTodas] = useState(false);

    const todayIndex = (new Date().getDay() + 6) % 7;

    useEffect(() => {
        if (!user?.id) {
            setLoading(false);
            return;
        }

        const fetchPerfilYRutinas = async () => {
            setLoading(true);

            const { data: perfilData, error: perfilError } = await supabase
                .from('perfiles').select('nombre').eq('id', user.id).single();

            if (perfilError) console.error('Error al obtener perfil:', perfilError.message);
            else setNombre(perfilData?.nombre || 'Usuario');

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

            const hoy = new Date();
            const inicioDelDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).toISOString();
            const finDelDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1).toISOString();

            const { data: sesionesCompletadas, error: errorSesiones } = await supabase
                .from('sesiones_entrenamiento').select('rutina_personalizada_id, rutina_base_id')
                .eq('alumno_id', user.id).gte('created_at', inicioDelDia).lt('created_at', finDelDia);

            if (errorSesiones) console.error('Error al verificar sesiones completadas:', errorSesiones);

            const idsCompletados = new Set();
            sesionesCompletadas?.forEach(sesion => {
                if (sesion.rutina_personalizada_id) idsCompletados.add(sesion.rutina_personalizada_id);
                if (sesion.rutina_base_id) idsCompletados.add(sesion.rutina_base_id);
            });

            const formateadas = asignaciones.map((a) => {
                const esPersonalizada = !!a.rutina_personalizada_id;
                const rutinaId = esPersonalizada ? a.rutina_personalizada_id : a.rutina_base_id;
                const nombre = esPersonalizada ? a.rutinas_personalizadas?.nombre : a.rutinas_base?.nombre;
                const tipo = esPersonalizada ? 'personalizada' : 'base';
                return { dia: a.dia_semana, rutinaId, nombre: nombre || 'Rutina Asignada', tipo, isCompleted: idsCompletados.has(rutinaId) };
            }).sort((a, b) => a.dia - b.dia);

            setRutinas(formateadas);
            setLoading(false);
        };

        fetchPerfilYRutinas();
    }, [user]);

    const iniciarRutina = (rutina) => {
        navigate(`/rutina/${rutina.rutinaId}/orden`, { state: { tipo: rutina.tipo } });
    }

    const rutinaHoy = rutinas.find(r => r.dia === todayIndex);
    const proximasRutinas = rutinas.filter(r => r.dia !== todayIndex);
    const rutinasVisibles = mostrarTodas ? proximasRutinas : proximasRutinas.slice(0, 2);

    const Card = ({ children, className, onClick }) => (
        <div className={`bg-gray-800 rounded-2xl p-6 shadow-lg ${className}`} onClick={onClick}>
            {children}
        </div>
    );

    return (
        <div className="font-sans">
            

            <main className="pt-safe">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
                    </div>
                ) : (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="p-4">
                        <h2 className="text-xl font-semibold text-white mb-4">Tu rutina de hoy</h2>
                        {rutinaHoy ? (
                            <Card className={`border-2 ${rutinaHoy.isCompleted ? 'border-green-500' : 'border-cyan-400'}`}>
                                <div className="flex flex-col justify-between h-full">
                                    <div>
                                        <p className="font-bold text-sm text-gray-400 uppercase tracking-wider">{diasSemana[rutinaHoy.dia]}</p>
                                        <h3 className="text-2xl font-bold text-white mt-1">{rutinaHoy.nombre}</h3>
                                    </div>
                                    {rutinaHoy.isCompleted ? (
                                        <div className="mt-6 flex items-center gap-3 text-green-400 font-bold py-3 px-5 rounded-full bg-gray-700">
                                            <FaCheckCircle className="text-2xl" />
                                            <span>Entrenamiento Completado</span>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => iniciarRutina(rutinaHoy)}
                                            className="mt-6 w-full flex items-center justify-center gap-3 bg-cyan-400 text-gray-900 font-bold py-3 px-5 rounded-full shadow-lg hover:bg-cyan-300 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-cyan-400/50"
                                        >
                                            <FaPlayCircle className="text-xl" />
                                            <span>Iniciar Entrenamiento</span>
                                        </button>
                                    )}
                                </div>
                            </Card>
                        ) : (
                            <Card>
                                <p className="text-gray-300">No tienes ninguna rutina para hoy. ¡Día de descanso!</p>
                            </Card>
                        )}

                        {proximasRutinas.length > 0 && (
                            <div className="mt-10">
                                <h3 className="text-xl font-semibold text-white mb-4">Próximos entrenamientos</h3>
                                <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <AnimatePresence>
                                        {rutinasVisibles.map(rutina => (
                                            <motion.div key={rutina.dia} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                                <Card className="flex justify-between items-center hover:bg-gray-700 transition-colors duration-200 cursor-pointer" onClick={() => iniciarRutina(rutina)}>
                                                    <div>
                                                        <p className="text-sm text-gray-400 font-medium">{diasSemana[rutina.dia]}</p>
                                                        <p className="font-semibold text-lg text-white mt-1">{rutina.nombre}</p>
                                                    </div>
                                                    <FaArrowRight className="text-gray-500" />
                                                </Card>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </motion.div>
                                {proximasRutinas.length > 2 && (
                                    <button onClick={() => setMostrarTodas(!mostrarTodas)} className="w-full mt-4 flex items-center justify-center gap-2 text-cyan-300 font-semibold hover:text-cyan-200 transition-colors">
                                        {mostrarTodas ? 'Mostrar menos' : 'Mostrar todos'}
                                        <motion.div animate={{ rotate: mostrarTodas ? 180 : 0 }}><FaChevronDown /></motion.div>
                                    </button>
                                )}
                            </div>
                        )}

                        <div className="mt-10">
                            <h3 className="text-xl font-semibold text-white mb-4">Más opciones</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card className="flex items-center gap-4 hover:bg-gray-700 transition-colors duration-200 cursor-not-allowed opacity-50">
                                    <div className="p-3 bg-green-500/20 rounded-lg">
                                        <FaUtensils className="text-2xl text-green-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-lg text-white">Mi Dieta</h4>
                                        <p className="text-sm text-gray-400">Próximamente...</p>
                                    </div>
                                </Card>
                                <Card className="flex items-center gap-4 hover:bg-gray-700 transition-colors duration-200 cursor-not-allowed opacity-50">
                                    <div className="p-3 bg-red-500/20 rounded-lg">
                                        <FaEnvelope className="text-2xl text-red-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-lg text-white">Mensajes</h4>
                                        <p className="text-sm text-gray-400">Próximamente...</p>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </motion.div>
                )}
            </main>
        </div>
    );
};

export default Dashboard;

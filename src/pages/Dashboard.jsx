// src/pages/Dashboard.jsx
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaSignOutAlt } from 'react-icons/fa';

// Array para mapear el índice del día a su nombre
const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const DashboardAlumno = () => {
    const { user, logout } = useAuth();
    const [rutinas, setRutinas] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        // Si no hay un usuario logueado, no se hace nada.
        if (!user) {
            setLoading(false);
            return;
        }

        const fetchRutinas = async () => {
            // 1. La consulta pide los datos tanto de la rutina personalizada como de la rutina base.
            const { data, error } = await supabase
                .from('asignaciones')
                .select(`
                    dia_semana,
                    rutina_personalizada_id,
                    rutinas_personalizadas ( nombre ),
                    rutina_base_id,
                    rutinas_base ( nombre )
                `)
                .eq('alumno_id', user.id);

            if (error) {
                console.error('Error al cargar asignaciones:', error);
                setRutinas([]);
            } else {
                // 2. Se procesan todas las asignaciones, sin filtrar.
                const formateadas = data
                    .map((a) => {
                        const esPersonalizada = !!a.rutina_personalizada_id;

                        // Se determina el ID y el nombre correctos según el tipo de rutina.
                        const rutinaId = esPersonalizada ? a.rutina_personalizada_id : a.rutina_base_id;
                        const nombre = esPersonalizada
                            ? a.rutinas_personalizadas?.nombre
                            : a.rutinas_base?.nombre;
                        const tipo = esPersonalizada ? 'personalizada' : 'base';

                        return {
                            dia: a.dia_semana,
                            rutinaId,
                            nombre: nombre || 'Rutina Asignada',
                            tipo, // 'base' o 'personalizada'
                        };
                    })
                    .sort((a, b) => a.dia - b.dia); // Se ordenan por día de la semana.

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

    // 3. La función de navegación ahora pasa el tipo de rutina en la URL.
    // Esto es crucial para que la página de detalle sepa qué datos cargar.
    const verDetalleRutina = (rutina) => {
        navigate(`/rutina/${rutina.rutinaId}?tipo=${rutina.tipo}`);
    }

    return (
        <div className="min-h-screen pb-24 bg-gray-50">
            <header className="w-full bg-white shadow-sm">
                <div className="max-w-4xl mx-auto flex justify-between items-center px-6 py-4">
                    <h1 className="text-xl font-bold text-blue-800">
                        Bienvenido, {user?.user_metadata?.nombre || 'Alumno'}
                    </h1>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-sm text-red-600 hover:text-red-800 transition"
                    >
                        <FaSignOutAlt />
                        Cerrar sesión
                    </button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-6">
                <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Mi Rutina Semanal</h2>

                {loading ? (
                    <p className="text-center text-gray-500">Cargando tus rutinas...</p>
                ) : rutinas.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                        {rutinas.map((rutina) => (
                            <div key={rutina.dia}>
                                <button
                                    onClick={() => verDetalleRutina(rutina)}
                                    className="w-full h-full text-left p-5 border rounded-xl bg-white hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                                >
                                    <p className="text-sm text-gray-500 font-medium">{diasSemana[rutina.dia]}</p>
                                    <p className="font-semibold text-lg text-blue-700 mt-1">{rutina.nombre}</p>
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-gray-600 bg-white p-8 rounded-lg shadow-sm">
                        <p className="font-semibold">Aún no tienes rutinas asignadas.</p>
                        <p className="text-sm mt-2">Ponte en contacto con tu entrenador para que te asigne un plan.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default DashboardAlumno;
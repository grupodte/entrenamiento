// src/pages/Dashboard.jsx
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaSignOutAlt } from 'react-icons/fa';

const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const DashboardAlumno = () => {
    const { user, logout } = useAuth();
    const [rutinas, setRutinas] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchRutinas = async () => {
            const { data, error } = await supabase
                .from('asignaciones')
                .select('dia_semana, rutina_personalizada_id, rutinas_personalizadas (nombre)')
                .eq('alumno_id', user.id);

            if (error) {
                console.error('Error al cargar asignaciones:', error);
                setRutinas([]);
            } else {
                const formateadas = data
                    .filter(a => a.rutina_personalizada_id)
                    .map((a) => ({
                        dia: a.dia_semana,
                        rutinaId: a.rutina_personalizada_id,
                        nombre: a.rutinas_personalizadas?.nombre || 'Rutina sin nombre',
                    }))
                    .sort((a, b) => a.dia - b.dia);

                setRutinas(formateadas);
            }

            setLoading(false);
        };

        if (user) fetchRutinas();
    }, [user]);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen pb-24 bg-gray-50">
            <div className="w-full flex justify-end px-6 py-4">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-sm text-red-600 hover:text-red-800 transition"
                >
                    <FaSignOutAlt />
                    Cerrar sesión
                </button>
            </div>

            <div className="max-w-3xl mx-auto p-6">
                <h1 className="text-3xl font-bold mb-6 text-center text-blue-700">Mi Rutina Semanal</h1>

                {loading ? (
                    <p className="text-center">Cargando tus rutinas...</p>
                ) : rutinas.length > 0 ? (
                    <ul className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {rutinas.map(({ dia, rutinaId, nombre }) => (
                            <li key={dia}>
                                <button
                                    onClick={() => navigate(`/rutina/${rutinaId}`)}
                                    className="w-full text-left p-4 border rounded bg-white hover:shadow"
                                >
                                    <p className="text-sm text-gray-500 font-medium">{diasSemana[dia]}</p>
                                    <p className="font-semibold text-blue-700">{nombre}</p>
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-center text-gray-600">No tenés rutinas asignadas aún.</p>
                )}
            </div>
        </div>
    );
};

export default DashboardAlumno;


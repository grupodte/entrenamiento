import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaHome, FaDumbbell, FaUser, FaSignOutAlt } from 'react-icons/fa';

const DashboardAlumno = () => {
    const { user, logout } = useAuth();
    const [rutina, setRutina] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            const { data: asignacion } = await supabase
                .from('asignaciones')
                .select('rutina_id')
                .eq('alumno_id', user.id)
                .order('fecha_asignacion', { ascending: false })
                .limit(1)
                .single();

            if (!asignacion) {
                setRutina(null);
                setLoading(false);
                return;
            }

            const { data: rutinaData } = await supabase
                .from('rutinas')
                .select('*')
                .eq('id', asignacion.rutina_id)
                .single();

            setRutina(rutinaData);
            setLoading(false);
        };

        if (user) fetchData();
    }, [user]);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen pb-24 bg-gray-50">
            <div className="max-w-3xl mx-auto p-6">
                <h1 className="text-3xl font-bold mb-6 text-center text-blue-700">Mi Rutina</h1>

                {loading ? (
                    <p className="text-center">Cargando rutina asignada...</p>
                ) : rutina ? (
                    <div className="border rounded-xl p-6 bg-white shadow-md space-y-4">
                        <h2 className="text-xl font-semibold text-blue-600">{rutina.nombre}</h2>
                        <p className="text-gray-700">{rutina.descripcion}</p>
                        <button
                            onClick={() => navigate(`/rutina/${rutina.id}`)}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                        >
                           Empezar Rutina
                        </button>
                    </div>
                ) : (
                    <p className="text-center text-gray-600">Aún no se te ha asignado una rutina.</p>
                )}
            </div>

            {/* Bottom nav igual que antes */}
        </div>
    );
};

export default DashboardAlumno;

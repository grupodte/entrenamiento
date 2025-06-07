// src/pages/Dashboard.jsx
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
        const fetchRutinaAsignada = async () => {
            const { data: asignaciones, error } = await supabase
                .from('asignaciones')
                .select('rutina_id')
                .eq('alumno_id', user.id)
                .order('fecha_asignacion', { ascending: false })
                .limit(1);

            if (error || !asignaciones || asignaciones.length === 0) {
                setRutina(null);
                setLoading(false);
                return;
            }

            const rutinaId = asignaciones[0].rutina_id;

            const { data: rutinaData } = await supabase
                .from('rutinas')
                .select('*')
                .eq('id', rutinaId)
                .single();

            setRutina(rutinaData || null);
            setLoading(false);
        };

        if (user) fetchRutinaAsignada();
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
                    <div className="border rounded-xl p-6 bg-white shadow-md">
                        <h2 className="text-xl font-semibold text-blue-600 mb-2">{rutina.nombre}</h2>
                        <p className="text-gray-700 mb-4">{rutina.descripcion}</p>
                        {rutina.video_url && (
                            <a
                                href={rutina.video_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block text-sm text-white bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 transition"
                            >
                                Ver video de rutina
                            </a>
                        )}
                    </div>
                ) : (
                    <p className="text-center text-gray-600">Aún no se te ha asignado una rutina.</p>
                )}
            </div>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 flex justify-around items-center h-16 md:hidden">
                <button className="flex flex-col items-center text-blue-600">
                    <FaHome size={20} />
                    <span className="text-xs mt-1">Inicio</span>
                </button>
                <button className="flex flex-col items-center text-gray-500">
                    <FaDumbbell size={20} />
                    <span className="text-xs mt-1">Rutinas</span>
                </button>
                <button className="flex flex-col items-center text-gray-500">
                    <FaUser size={20} />
                    <span className="text-xs mt-1">Perfil</span>
                </button>
                <button
                    onClick={handleLogout}
                    className="flex flex-col items-center text-red-500"
                >
                    <FaSignOutAlt size={20} />
                    <span className="text-xs mt-1">Salir</span>
                </button>
            </nav>
        </div>
    );
};

export default DashboardAlumno;

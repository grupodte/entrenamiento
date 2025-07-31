import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import { FaArrowLeft, FaEdit, FaUserCircle, FaEnvelope, FaPhone, FaBirthdayCake, FaTransgender, FaMapMarkerAlt, FaBullseye, FaChartLine, FaBook } from 'react-icons/fa';

const PerfilPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [perfil, setPerfil] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!user) { navigate('/login'); return; }

        const fetchPerfil = async () => {
            setLoading(true);
            const { data, error: err } = await supabase.from('perfiles').select('*').eq('id', user.id).single();
            if (err) {
                console.error('Error al cargar el perfil:', err);
                setError('No se pudo cargar el perfil.');
            } else {
                setPerfil(data);
            }
            setLoading(false);
        };
        fetchPerfil();
    }, [user, navigate]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white">
                Cargando perfil...
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-900 text-red-400">
                <p>{error}</p>
            </div>
        );
    }

    if (!perfil) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-900 text-gray-400">
                <p>No se encontró información de perfil.</p>
                <button onClick={() => navigate('/alumno/editar-perfil')} className="ml-4 px-4 py-2 bg-cyan-600 text-white rounded-lg">Crear Perfil</button>
            </div>
        );
    }

    const InfoRow = ({ icon, label, value }) => {
        if (!value) return null;
        return (
            <div className="flex items-center text-gray-300">
                {icon && <span className="mr-3 text-cyan-400 text-lg">{icon}</span>}
                <div>
                    <p className="text-sm font-semibold text-gray-400">{label}</p>
                    <p className="text-base text-white">{value}</p>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col">
            <header className=" top-0 bg-gray-900/80 backdrop-blur-lg z-20 p-4 flex items-center justify-between border-b border-gray-800">
                <Link to="/dashboard" className="p-2 rounded-full hover:bg-gray-700">
                    <FaArrowLeft />
                </Link>
                <h1 className="text-xl font-bold text-white">Mi Perfil</h1>
                <button onClick={() => navigate('/alumno/editar-perfil')} className="p-2 rounded-full bg-cyan-600 hover:bg-cyan-700 transition-colors">
                    <FaEdit className="text-white" />
                </button>
            </header>

            <main className="flex-grow max-w-xl mx-auto w-full pt-safe p-4 space-y-6">
                <div className="flex flex-col items-center bg-gray-800 rounded-xl p-6 shadow-lg">
                    {perfil.avatar_url ? (
                        <img src={perfil.avatar_url} alt="Avatar" className="w-32 h-32 rounded-full object-cover border-4 border-cyan-500 shadow-md" />
                    ) : (
                        <FaUserCircle className="text-8xl text-blue-400 mb-2" />
                    )}
                    <h2 className="text-3xl font-bold text-white mt-4">{perfil.nombre} {perfil.apellido}</h2>
                    <p className="text-gray-400 text-sm">{user.email}</p>
                </div>

                <div className="bg-gray-800 rounded-xl p-6 shadow-lg space-y-4">
                    <h3 className="text-xl font-bold text-white mb-4">Información Personal</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InfoRow icon={<FaBirthdayCake />} label="Edad" value={perfil.edad ? `${perfil.edad} años` : null} />
                        <InfoRow icon={<FaTransgender />} label="Género" value={perfil.genero} />
                        <InfoRow icon={<FaPhone />} label="Teléfono" value={perfil.telefono} />
                        <InfoRow icon={<FaMapMarkerAlt />} label="Ubicación" value={perfil.ciudad && perfil.pais ? `${perfil.ciudad}, ${perfil.pais}` : perfil.ciudad || perfil.pais} />
                    </div>
                </div>

                <div className="bg-gray-800 rounded-xl p-6 shadow-lg space-y-4">
                    <h3 className="text-xl font-bold text-white mb-4">Objetivos y Nivel</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InfoRow icon={<FaBullseye />} label="Objetivo" value={perfil.objetivo} />
                        <InfoRow icon={<FaChartLine />} label="Nivel" value={perfil.nivel} />
                    </div>
                </div>

                {perfil.biografia && (
                    <div className="bg-gray-800 rounded-xl p-6 shadow-lg space-y-4">
                        <h3 className="text-xl font-bold text-white mb-4">Biografía</h3>
                        <InfoRow icon={<FaBook />} value={perfil.biografia} />
                    </div>
                )}
            </main>
        </div>
    );
};

export default PerfilPage;
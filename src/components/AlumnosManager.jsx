import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { FaUser } from 'react-icons/fa';

const AlumnosManager = () => {
    const [alumnos, setAlumnos] = useState([]);
    const [esAdmin, setEsAdmin] = useState(null);
    const [fadeIn, setFadeIn] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const verificarRol = async () => {
            const { data: user } = await supabase.auth.getUser();
            const { data: perfil } = await supabase
                .from('perfiles')
                .select('rol')
                .eq('id', user?.user?.id)
                .maybeSingle();

            setEsAdmin(perfil?.rol === 'admin');
        };

        verificarRol();
    }, []);

    useEffect(() => {
        const obtenerAlumnos = async () => {
            const { data, error } = await supabase
                .from('perfiles')
                .select('id, nombre, apellido, email, avatar_url')
                .eq('rol', 'alumno');

            if (!error) setAlumnos(data);
        };

        if (esAdmin) obtenerAlumnos();
    }, [esAdmin]);

    useEffect(() => {
        const timer = setTimeout(() => setFadeIn(true), 50);
        return () => clearTimeout(timer);
    }, []);

    if (esAdmin === null) return null;

    if (!esAdmin) {
        return (
            <div className="p-6 text-red-400 font-semibold text-center text-lg">
                ⛔ Acceso denegado — Solo administradores pueden ver esta sección.
            </div>
        );
    }

    return (
        <div className={`px-2 md:px-6 py-4 transition-all duration-500 ease-out ${fadeIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <h1 className="text-2xl font-bold mb-6 animate-fadeIn">👥 Alumnos registrados</h1>

        
                <ul className="grid gap-4">
                    {alumnos.map((alumno, index) => (
                        <li
                            key={alumno.id}
                            className="p-4 bg-white/10 backdrop-blur rounded-xl shadow-md flex justify-between items-center hover:bg-white/20 transition duration-300 animate-fadeIn"
                            style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
                        >
                            <div className="flex items-center gap-4">
                                {alumno.avatar_url ? (
                                    <img
                                        src={alumno.avatar_url}
                                        alt={`${alumno.nombre} ${alumno.apellido}`}
                                        className="w-12 h-12 rounded-full object-cover border border-white/20"
                                    />
                                ) : (
                                    <div className="bg-white/20 rounded-full p-3">
                                        <FaUser className="text-white text-lg" />
                                    </div>
                                )}

                                <div>
                                    <p className="font-semibold text-white">
                                        {alumno.nombre} {alumno.apellido}
                                    </p>
                                    <p className="text-sm text-gray-300">{alumno.email}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => navigate(`/admin/alumno/${alumno.id}`)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
                            >
                                Ver Perfil
                            </button>
                        </li>
                    ))}
                </ul>
            
        </div>
    );
};

export default AlumnosManager;

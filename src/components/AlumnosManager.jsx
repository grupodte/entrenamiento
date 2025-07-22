import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { FaUser } from 'react-icons/fa';
import { Transition } from '@headlessui/react';

const AlumnosManager = () => {
    const [alumnos, setAlumnos] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [esAdmin, setEsAdmin] = useState(null);
    const [cargando, setCargando] = useState(true);
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
            setCargando(true);
            const { data, error } = await supabase
                .from('perfiles')
                .select('id, nombre, apellido, email, avatar_url')
                .eq('rol', 'alumno');

            if (!error) setAlumnos(data);
            setCargando(false);
        };

        if (esAdmin) obtenerAlumnos();
    }, [esAdmin]);

    const alumnosFiltrados = alumnos.filter((al) =>
        `${al.nombre} ${al.apellido}`.toLowerCase().includes(busqueda.toLowerCase())
    );

    if (esAdmin === null) return null;

    if (!esAdmin) {
        return (
            <div className="p-6 text-red-400 font-semibold text-center text-lg">
                ⛔ Acceso denegado — Solo administradores pueden ver esta sección.
            </div>
        );
    }

    return (
        <div className="px-2 md:px-6 py-4 transition-all">
            <h1 className="text-2xl font-bold mb-4 text-white">👥 Alumnos registrados</h1>

            <input
                type="text"
                placeholder="Buscar por nombre..."
                className="mb-6 w-full md:w-1/2 px-4 py-2 rounded-lg bg-white/10 backdrop-blur text-white placeholder-gray-300"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
            />

            {cargando ? (
                <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                        <div
                            key={i}
                            className="h-16 bg-white/10 rounded-lg animate-pulse"
                        ></div>
                    ))}
                </div>
            ) : (
                <ul className="grid gap-4">
                    {alumnosFiltrados.map((alumno, index) => (
                        <Transition
                            appear
                            show
                            key={alumno.id}
                            enter="transition-opacity duration-500 delay-[index*50] ease-out"
                            enterFrom="opacity-0 translate-y-2"
                            enterTo="opacity-100 translate-y-0"
                        >
                            <li className="p-4 bg-white/10 backdrop-blur rounded-xl shadow-md flex justify-between items-center hover:bg-white/20 transition duration-300">
                                <div className="flex items-center gap-4" onClick={() => navigate(`/admin/alumno/${alumno.id}`)}>
                                    {alumno.avatar_url ? (
                                        <img
                                            src={alumno.avatar_url}
                                            alt={`${alumno.nombre} ${alumno.apellido}`}
                                            className="w-12 h-12 rounded-full object-cover border border-white/20"
                                        />
                                    ) : (
                                        <div className="bg-white/20 rounded-full p-3">
                                            <FaUser className="text-white text-[12px]" />
                                        </div>
                                    )}

                                    <div>
                                        <p className="font-semibold text-[12px] text-white">
                                            {alumno.nombre} {alumno.apellido}
                                        </p>
                                    </div>
                                </div>
                             
                            </li>
                        </Transition>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default AlumnosManager;

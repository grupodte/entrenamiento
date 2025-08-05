import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { FaUser } from 'react-icons/fa';
import { AnimatedList, AnimatedListItem } from './animations';
import { motion } from 'framer-motion';

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

            <input
                type="text"
                placeholder="Buscar por nombre..."
                className="mb-6 w-full md:w-1/2 px-4 py-2 rounded-lg bg-white/10 backdrop-blur text-white placeholder-gray-300"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
            />

            {cargando ? (
                <AnimatedList className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                        <AnimatedListItem key={i}>
                            <div className="h-16 bg-white/10 rounded-lg animate-pulse"></div>
                        </AnimatedListItem>
                    ))}
                </AnimatedList>
            ) : (
                <AnimatedList className="grid gap-4" staggerDelay={0.05}>
                    {alumnosFiltrados.map((alumno) => (
                        <AnimatedListItem key={alumno.id}>
                            <motion.li
                                onClick={() => navigate(`/admin/alumno/${alumno.id}`, { state: { alumnoInicial: alumno } })}
                                className="p-4 bg-white/10 backdrop-blur rounded-xl shadow-md flex justify-between items-center cursor-pointer"
                                whileHover={{ 
                                    scale: 1.02, 
                                    backgroundColor: 'rgba(255, 255, 255, 0.2)' 
                                }}
                                whileTap={{ scale: 0.98 }}
                                transition={{
                                    type: 'spring',
                                    stiffness: 400,
                                    damping: 25,
                                }}
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
                                            <FaUser className="text-white text-[12px]" />
                                        </div>
                                    )}

                                    <div>
                                        <p className="font-semibold text-[12px] text-white">
                                            {alumno.nombre} {alumno.apellido}
                                        </p>
                                    </div>
                                </div>
                            </motion.li>
                        </AnimatedListItem>
                    ))}
                </AnimatedList>
            )}
        </div>
    );
};

export default AlumnosManager;

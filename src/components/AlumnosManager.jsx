import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaSearch } from 'react-icons/fa';

const INPUT_CLASS = "w-full rounded-xl bg-white/10 pl-12 pr-4 py-3 text-white placeholder-white/50 focus:ring-2 focus:ring-pink-500 border border-transparent focus:border-pink-400 transition-all outline-none shadow-inner";

const AlumnosManager = () => {
    const [alumnos, setAlumnos] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [esAdmin, setEsAdmin] = useState(null);
    const [cargando, setCargando] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const verificarRolYAlumnos = async () => {
            setCargando(true);
            const { data: { user } } = await supabase.auth.getUser();
            const { data: perfil } = await supabase.from('perfiles').select('rol').eq('id', user?.id).single();

            const isAdmin = perfil?.rol === 'admin';
            setEsAdmin(isAdmin);

            if (isAdmin) {
                const { data, error } = await supabase.from('perfiles').select('id, nombre, apellido, email, avatar_url').eq('rol', 'alumno');
                if (!error) setAlumnos(data);
            }
            setCargando(false);
        };
        verificarRolYAlumnos();
    }, []);

    const alumnosFiltrados = useMemo(() => 
        alumnos.filter(al =>
            `${al.nombre} ${al.apellido} ${al.email}`.toLowerCase().includes(busqueda.toLowerCase())
        ), [alumnos, busqueda]);

    if (cargando) {
        return <AlumnosSkeleton />;
    }

    if (!esAdmin) {
        return (
            <div className="p-6 text-red-400 font-semibold text-center text-lg bg-red-500/10 rounded-2xl">
                ⛔ Acceso denegado — Solo administradores pueden ver esta sección.
            </div>
        );
    }


    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-white">Gestor de Alumnos</h1>
            <div className="relative">
                <FaSearch className="absolute top-1/2 left-4 -translate-y-1/2 text-white/40" />
                <input
                    type="text"
                    placeholder="Buscar por nombre..."
                    className={INPUT_CLASS}
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                />
            </div>

            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {alumnosFiltrados.map(alumno => (
                    <AlumnoCard key={alumno.id} alumno={alumno} onClick={() => navigate(`/admin/alumno/${alumno.id}`)} />
                ))}
            </ul>
        </div>
    );
};

const AlumnoCard = ({ alumno, onClick }) => (
    <li
        onClick={onClick}
        className="relative group cursor-pointer"
    >
        <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-orange-500 rounded-2xl blur opacity-0 group-hover:opacity-75 transition duration-500"></div>
        <div className="relative bg-white/5 backdrop-blur-lg p-4 rounded-2xl border border-white/10 h-full flex items-center gap-4 transition-transform duration-300 group-hover:scale-105">
            {alumno.avatar_url ? (
                <img src={alumno.avatar_url} alt={alumno.nombre} className="w-14 h-14 rounded-full object-cover border-2 border-white/20" />
            ) : (
                <div className="w-14 h-14 grid place-items-center bg-white/10 rounded-full border-2 border-white/20">
                    <FaUser className="text-white/70 text-2xl" />
                </div>
            )}
            <div>
                <p className="font-bold text-lg text-white">{alumno.nombre} {alumno.apellido && alumno.apellido !== '-' ? alumno.apellido : ''}</p>
                <p className="text-sm text-white/50">{alumno.email}</p>
            </div>
        </div>
    </li>
);

const AlumnosSkeleton = () => (
    <div className="space-y-8">
        <h1 className="text-3xl font-bold text-white">Gestor de Alumnos</h1>
        <div className="h-12 w-full lg:w-1/2 bg-white/10 rounded-xl animate-pulse"></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
                <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse"></div>
            ))}
        </div>
    </div>
);

export default AlumnosManager;

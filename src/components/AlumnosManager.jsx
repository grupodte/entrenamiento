import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FaUser, FaSearch } from 'react-icons/fa';
import { Users, UserPlus, X, Check, Filter } from 'lucide-react';

const INPUT_CLASS = "w-full rounded-xl bg-white/10 pl-12 pr-4 py-3 text-white placeholder-white/50 focus:ring-2 focus:ring-pink-500 border border-transparent focus:border-pink-400 transition-all outline-none shadow-inner";

const AlumnosManager = () => {
    const [alumnos, setAlumnos] = useState([]);
    const [grupos, setGrupos] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [esAdmin, setEsAdmin] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [showAsignarGrupos, setShowAsignarGrupos] = useState(false);
    const [alumnosSeleccionados, setAlumnosSeleccionados] = useState([]);
    const [grupoSeleccionado, setGrupoSeleccionado] = useState('');
    const [modoSeleccion, setModoSeleccion] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const verificarRolYAlumnos = async () => {
            setCargando(true);
            const { data: { user } } = await supabase.auth.getUser();
            const { data: perfil } = await supabase.from('perfiles').select('rol').eq('id', user?.id).single();

            const isAdmin = perfil?.rol === 'admin';
            setEsAdmin(isAdmin);

            if (isAdmin) {
                const [alumnosResult, gruposResult] = await Promise.all([
                    supabase.from('perfiles')
                        .select('id, nombre, apellido, email, avatar_url')
                        .eq('rol', 'alumno'),
                    supabase.from('grupos_alumnos')
                        .select('id, nombre, color')
                        .eq('activo', true)
                        .order('nombre')
                ]);
                
                if (!alumnosResult.error && !gruposResult.error) {
                    const alumnosData = alumnosResult.data || [];
                    const gruposData = gruposResult.data || [];
                    
                    // Cargar asignaciones de grupos
                    const { data: asignacionesData } = await supabase
                        .from('asignaciones_grupos_alumnos')
                        .select(`
                            alumno_id,
                            grupo_id,
                            grupos_alumnos!inner(id, nombre, color)
                        `)
                        .eq('activo', true);
                    
                    // Procesar alumnos con sus grupos
                    const alumnosConGrupos = alumnosData.map(alumno => {
                        const gruposAlumno = (asignacionesData || [])
                            .filter(asig => asig.alumno_id === alumno.id)
                            .map(asig => asig.grupos_alumnos);
                        
                        return {
                            ...alumno,
                            grupos: gruposAlumno
                        };
                    });
                    
                    setAlumnos(alumnosConGrupos);
                    setGrupos(gruposData);
                }
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


    const asignarAlumnosAGrupo = async () => {
        if (alumnosSeleccionados.length === 0 || !grupoSeleccionado) {
            toast.error('Selecciona alumnos y un grupo');
            return;
        }

        try {
            const asignaciones = alumnosSeleccionados.map(alumnoId => ({
                grupo_id: grupoSeleccionado,
                alumno_id: alumnoId,
                activo: true
            }));

            const { error } = await supabase
                .from('asignaciones_grupos_alumnos')
                .insert(asignaciones);

            if (error) throw error;

            const grupoNombre = grupos.find(g => g.id === grupoSeleccionado)?.nombre;
            toast.success(`${alumnosSeleccionados.length} alumno${alumnosSeleccionados.length > 1 ? 's asignados' : ' asignado'} al grupo "${grupoNombre}"`);
            
            setShowAsignarGrupos(false);
            setAlumnosSeleccionados([]);
            setGrupoSeleccionado('');
            setModoSeleccion(false);
            
            // Recargar alumnos para mostrar los nuevos grupos
            verificarRolYAlumnos();
        } catch (error) {
            console.error('Error al asignar alumnos a grupo:', error);
            toast.error('Error al asignar alumnos al grupo');
        }
    };

    const toggleSeleccionAlumno = (alumnoId) => {
        if (!modoSeleccion) return;
        
        setAlumnosSeleccionados(prev => 
            prev.includes(alumnoId)
                ? prev.filter(id => id !== alumnoId)
                : [...prev, alumnoId]
        );
    };

    const toggleModoSeleccion = () => {
        setModoSeleccion(!modoSeleccion);
        setAlumnosSeleccionados([]);
    };

    const seleccionarTodos = () => {
        if (alumnosSeleccionados.length === alumnosFiltrados.length) {
            setAlumnosSeleccionados([]);
        } else {
            setAlumnosSeleccionados(alumnosFiltrados.map(a => a.id));
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Gestor de Alumnos</h1>
                    <p className="text-gray-400 mt-1">
                        Administra a todos tus alumnos y asígnalos a grupos
                    </p>
                </div>
                
                <div className="flex items-center gap-2">
                    {modoSeleccion && (
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-white">
                                {alumnosSeleccionados.length} seleccionados
                            </span>
                            <button
                                onClick={() => setShowAsignarGrupos(true)}
                                disabled={alumnosSeleccionados.length === 0}
                                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1 transition-colors"
                            >
                                <UserPlus className="w-4 h-4" />
                                Asignar a Grupo
                            </button>
                        </div>
                    )}
                    
                    <motion.button
                        onClick={toggleModoSeleccion}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                            modoSeleccion 
                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                : 'bg-purple-600 hover:bg-purple-700 text-white'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {modoSeleccion ? (
                            <>
                                <X className="w-4 h-4" />
                                Cancelar
                            </>
                        ) : (
                            <>
                                <Users className="w-4 h-4" />
                                Asignar Grupos
                            </>
                        )}
                    </motion.button>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <FaSearch className="absolute top-1/2 left-4 -translate-y-1/2 text-white/40" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre..."
                        className={INPUT_CLASS}
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                </div>
                
                {modoSeleccion && (
                    <button
                        onClick={seleccionarTodos}
                        className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors whitespace-nowrap flex items-center gap-2"
                    >
                        <Check className="w-4 h-4" />
                        {alumnosSeleccionados.length === alumnosFiltrados.length ? 'Deseleccionar' : 'Seleccionar'} todos
                    </button>
                )}
            </div>

            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {alumnosFiltrados.map(alumno => (
                    <AlumnoCard 
                        key={alumno.id} 
                        alumno={alumno} 
                        onClick={() => modoSeleccion ? toggleSeleccionAlumno(alumno.id) : navigate(`/admin/alumno/${alumno.id}`)} 
                        modoSeleccion={modoSeleccion}
                        seleccionado={alumnosSeleccionados.includes(alumno.id)}
                    />
                ))}
            </ul>

            {/* Modal para asignar a grupos */}
            <AnimatePresence>
                {showAsignarGrupos && (
                    <motion.div
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowAsignarGrupos(false)}
                    >
                        <motion.div
                            className="bg-gray-900 rounded-xl p-6 w-full max-w-md border border-gray-700"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white">Asignar a Grupo</h2>
                                <button
                                    onClick={() => setShowAsignarGrupos(false)}
                                    className="p-2 text-gray-400 hover:text-white rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="mb-4">
                                <p className="text-gray-300 mb-4">
                                    Seleccionaste <strong>{alumnosSeleccionados.length}</strong> alumno{alumnosSeleccionados.length > 1 ? 's' : ''}.
                                    Elige un grupo para asignarlos:
                                </p>
                                
                                <select
                                    value={grupoSeleccionado}
                                    onChange={(e) => setGrupoSeleccionado(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-600 rounded-lg py-3 px-4 text-white focus:border-purple-500 focus:outline-none"
                                >
                                    <option value="">Selecciona un grupo...</option>
                                    {grupos.map(grupo => (
                                        <option key={grupo.id} value={grupo.id}>
                                            {grupo.nombre}
                                        </option>
                                    ))}
                                </select>
                                
                                {grupos.length === 0 && (
                                    <p className="text-sm text-gray-400 mt-2">
                                        No hay grupos disponibles. 
                                        <button 
                                            onClick={() => navigate('/admin/grupos')}
                                            className="text-blue-400 hover:text-blue-300 underline ml-1"
                                        >
                                            Crear primer grupo
                                        </button>
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowAsignarGrupos(false)}
                                    className="flex-1 bg-gray-700 text-gray-300 px-4 py-3 rounded-lg hover:bg-gray-600 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={asignarAlumnosAGrupo}
                                    disabled={!grupoSeleccionado || alumnosSeleccionados.length === 0}
                                    className="flex-1 bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Asignar
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const AlumnoCard = ({ alumno, onClick, modoSeleccion, seleccionado }) => (
    <li
        onClick={onClick}
        className={`relative group cursor-pointer ${
            modoSeleccion && seleccionado ? 'ring-2 ring-purple-500' : ''
        }`}
    >
        <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-orange-500 rounded-2xl blur opacity-0 group-hover:opacity-75 transition duration-500"></div>
        <div className={`relative bg-white/5 backdrop-blur-lg p-4 rounded-2xl border h-full transition-all duration-300 group-hover:scale-105 ${
            modoSeleccion && seleccionado 
                ? 'border-purple-400/50 bg-purple-500/10' 
                : 'border-white/10'
        }`}>
            <div className="flex items-center gap-4">
                {modoSeleccion && (
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                        seleccionado 
                            ? 'border-purple-500 bg-purple-500' 
                            : 'border-gray-600'
                    }`}>
                        {seleccionado && (
                            <Check className="w-3 h-3 text-white" />
                        )}
                    </div>
                )}
                
                {alumno.avatar_url ? (
                    <img src={alumno.avatar_url} alt={alumno.nombre} className="w-14 h-14 rounded-full object-cover border-2 border-white/20 flex-shrink-0" />
                ) : (
                    <div className="w-14 h-14 grid place-items-center bg-white/10 rounded-full border-2 border-white/20 flex-shrink-0">
                        <FaUser className="text-white/70 text-2xl" />
                    </div>
                )}
                
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-lg text-white truncate">
                        {alumno.nombre} {alumno.apellido && alumno.apellido !== '-' ? alumno.apellido : ''}
                    </p>
                    <p className="text-sm text-white/50 truncate">{alumno.email}</p>
                    
                    {/* Mostrar grupos del alumno */}
                    {alumno.grupos && alumno.grupos.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                            {alumno.grupos.slice(0, 2).map(grupo => (
                                <span
                                    key={grupo.id}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-700/50 rounded-full text-xs text-gray-300"
                                >
                                    <div 
                                        className="w-2 h-2 rounded-full" 
                                        style={{ backgroundColor: grupo.color }}
                                    />
                                    {grupo.nombre}
                                </span>
                            ))}
                            {alumno.grupos.length > 2 && (
                                <span className="inline-flex items-center px-2 py-0.5 bg-gray-700/50 rounded-full text-xs text-gray-300">
                                    +{alumno.grupos.length - 2} más
                                </span>
                            )}
                        </div>
                    )}
                </div>
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

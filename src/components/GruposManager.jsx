import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';
import { 
    Users, 
    Plus, 
    Search, 
    Calendar, 
    Target,
    UserPlus,
    Edit2,
    Trash2,
    Eye,
    BookOpen,
    Dumbbell
} from 'lucide-react';

const INPUT_CLASS = "w-full rounded-xl bg-white/10 pl-12 pr-4 py-3 text-white placeholder-white/50 focus:ring-2 focus:ring-pink-500 border border-transparent focus:border-pink-400 transition-all outline-none shadow-inner";

const COLORES_GRUPO = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316', 
    '#eab308', '#22c55e', '#10b981', '#06b6d4', '#3b82f6'
];

const GruposManager = () => {
    const [grupos, setGrupos] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [cargando, setCargando] = useState(true);
    const [esAdmin, setEsAdmin] = useState(null);
    const [showCrearGrupo, setShowCrearGrupo] = useState(false);
    const navigate = useNavigate();

    // Estados del formulario de crear grupo
    const [formulario, setFormulario] = useState({
        nombre: '',
        descripcion: '',
        objetivo: '',
        color: '#6366f1',
        fecha_inicio_curso: '',
        fecha_fin_curso: ''
    });

    useEffect(() => {
        verificarRolYCargarGrupos();
    }, []);

    const verificarRolYCargarGrupos = async () => {
        setCargando(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data: perfil } = await supabase
                .from('perfiles')
                .select('rol')
                .eq('id', user?.id)
                .single();

            const isAdmin = perfil?.rol === 'admin';
            setEsAdmin(isAdmin);

            if (isAdmin) {
                await cargarGrupos();
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al cargar los datos');
        }
        setCargando(false);
    };

    const cargarGrupos = async () => {
        try {
            // Primero cargar todos los grupos
            const { data: gruposData, error: gruposError } = await supabase
                .from('grupos_alumnos')
                .select('*')
                .eq('activo', true)
                .order('fecha_creacion', { ascending: false });

            if (gruposError) throw gruposError;

            if (!gruposData || gruposData.length === 0) {
                setGrupos([]);
                return;
            }

            // Cargar las asignaciones de grupos con miembros
            const { data: asignacionesData, error: asignacionesError } = await supabase
                .from('asignaciones_grupos_alumnos')
                .select(`
                    grupo_id,
                    perfiles!inner(id, nombre, apellido, avatar_url)
                `)
                .eq('activo', true);

            // Procesar grupos con conteo de miembros
            const gruposConMiembros = gruposData.map(grupo => {
                const miembrosGrupo = (asignacionesData || [])
                    .filter(asig => asig.grupo_id === grupo.id)
                    .map(asig => asig.perfiles);

                return {
                    ...grupo,
                    total_miembros: miembrosGrupo.length,
                    miembros: miembrosGrupo
                };
            });

            setGrupos(gruposConMiembros);
        } catch (error) {
            console.error('Error al cargar grupos:', error);
            toast.error('Error al cargar los grupos');
        }
    };

    const gruposFiltrados = useMemo(() => 
        grupos.filter(grupo =>
            `${grupo.nombre} ${grupo.descripcion || ''} ${grupo.objetivo || ''}`.toLowerCase()
            .includes(busqueda.toLowerCase())
        ), [grupos, busqueda]);

    const handleSubmitCrearGrupo = async (e) => {
        e.preventDefault();
        
        if (!formulario.nombre.trim()) {
            toast.error('El nombre del grupo es obligatorio');
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            const { error } = await supabase
                .from('grupos_alumnos')
                .insert({
                    ...formulario,
                    creado_por: user.id
                });

            if (error) {
                if (error.code === '23505') { // Violación de constraint único
                    toast.error('Ya existe un grupo con ese nombre');
                } else {
                    throw error;
                }
                return;
            }

            toast.success('Grupo creado exitosamente');
            setShowCrearGrupo(false);
            setFormulario({
                nombre: '',
                descripcion: '',
                objetivo: '',
                color: '#6366f1',
                fecha_inicio_curso: '',
                fecha_fin_curso: ''
            });
            await cargarGrupos();
        } catch (error) {
            console.error('Error al crear grupo:', error);
            toast.error('Error al crear el grupo');
        }
    };

    const eliminarGrupo = async (grupoId, nombreGrupo) => {
        if (!confirm(`¿Estás seguro de eliminar el grupo "${nombreGrupo}"? Esta acción no se puede deshacer.`)) {
            return;
        }

        try {
            const { error } = await supabase
                .from('grupos_alumnos')
                .update({ activo: false })
                .eq('id', grupoId);

            if (error) throw error;

            toast.success('Grupo eliminado correctamente');
            await cargarGrupos();
        } catch (error) {
            console.error('Error al eliminar grupo:', error);
            toast.error('Error al eliminar el grupo');
        }
    };

    if (cargando) {
        return <GruposSkeleton />;
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Grupos de Alumnos</h1>
                    <p className="text-gray-400 mt-1">
                        Organiza a tus alumnos en grupos para asignar cursos y rutinas masivamente
                    </p>
                </div>
                
                <motion.button
                    onClick={() => setShowCrearGrupo(true)}
                    className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-orange-500 text-white px-6 py-3 rounded-xl hover:from-pink-600 hover:to-orange-600 transition-all shadow-lg"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <Plus className="w-5 h-5" />
                    Crear Grupo
                </motion.button>
            </div>

            {/* Barra de búsqueda */}
            <div className="relative">
                <Search className="absolute top-1/2 left-4 -translate-y-1/2 text-white/40" />
                <input
                    type="text"
                    placeholder="Buscar grupos por nombre, descripción u objetivo..."
                    className={INPUT_CLASS}
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                />
            </div>

            {/* Grid de grupos */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence>
                    {gruposFiltrados.map(grupo => (
                        <GrupoCard 
                            key={grupo.id} 
                            grupo={grupo} 
                            onEliminar={eliminarGrupo}
                            onEditar={(grupoId) => navigate(`/admin/grupos/${grupoId}`)}
                            onVer={(grupoId) => navigate(`/admin/grupos/${grupoId}`)}
                        />
                    ))}
                </AnimatePresence>
            </div>

            {gruposFiltrados.length === 0 && (
                <div className="text-center py-12">
                    <Users className="w-20 h-20 text-white/20 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">
                        {busqueda ? 'No se encontraron grupos' : 'No tienes grupos creados'}
                    </h3>
                    <p className="text-gray-400 mb-4">
                        {busqueda 
                            ? 'Intenta con otros términos de búsqueda' 
                            : 'Crea tu primer grupo para organizar a tus alumnos'
                        }
                    </p>
                    {!busqueda && (
                        <motion.button
                            onClick={() => setShowCrearGrupo(true)}
                            className="bg-gradient-to-r from-pink-500 to-orange-500 text-white px-6 py-3 rounded-xl hover:from-pink-600 hover:to-orange-600 transition-all"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Crear primer grupo
                        </motion.button>
                    )}
                </div>
            )}

            {/* Modal para crear grupo */}
            <AnimatePresence>
                {showCrearGrupo && (
                    <motion.div
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowCrearGrupo(false)}
                    >
                        <motion.form
                            onSubmit={handleSubmitCrearGrupo}
                            className="bg-gray-900 rounded-xl p-6 w-full max-w-md border border-gray-700 max-h-[90vh] overflow-y-auto"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2 className="text-2xl font-bold text-white mb-6">Crear Nuevo Grupo</h2>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-white font-medium mb-2">
                                        Nombre del Grupo *
                                    </label>
                                    <input
                                        type="text"
                                        value={formulario.nombre}
                                        onChange={(e) => setFormulario(prev => ({ ...prev, nombre: e.target.value }))}
                                        className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-pink-500 focus:outline-none"
                                        placeholder="Ej: Curso Bajar de Peso Octubre 2025"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-white font-medium mb-2">
                                        Descripción
                                    </label>
                                    <textarea
                                        value={formulario.descripcion}
                                        onChange={(e) => setFormulario(prev => ({ ...prev, descripcion: e.target.value }))}
                                        className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-pink-500 focus:outline-none h-20 resize-none"
                                        placeholder="Describe el propósito de este grupo..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-white font-medium mb-2">
                                        Objetivo
                                    </label>
                                    <input
                                        type="text"
                                        value={formulario.objetivo}
                                        onChange={(e) => setFormulario(prev => ({ ...prev, objetivo: e.target.value }))}
                                        className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-pink-500 focus:outline-none"
                                        placeholder="Ej: Bajar de peso, Ganar masa muscular..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-white font-medium mb-2">
                                        Color del Grupo
                                    </label>
                                    <div className="flex gap-2 flex-wrap">
                                        {COLORES_GRUPO.map(color => (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() => setFormulario(prev => ({ ...prev, color }))}
                                                className={`w-8 h-8 rounded-full border-2 transition-all ${
                                                    formulario.color === color 
                                                        ? 'border-white scale-110' 
                                                        : 'border-gray-600'
                                                }`}
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-white font-medium mb-2">
                                            Fecha Inicio
                                        </label>
                                        <input
                                            type="date"
                                            value={formulario.fecha_inicio_curso}
                                            onChange={(e) => setFormulario(prev => ({ ...prev, fecha_inicio_curso: e.target.value }))}
                                            className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-pink-500 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-white font-medium mb-2">
                                            Fecha Fin
                                        </label>
                                        <input
                                            type="date"
                                            value={formulario.fecha_fin_curso}
                                            onChange={(e) => setFormulario(prev => ({ ...prev, fecha_fin_curso: e.target.value }))}
                                            className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-pink-500 focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowCrearGrupo(false)}
                                    className="flex-1 bg-gray-700 text-gray-300 px-4 py-3 rounded-lg hover:bg-gray-600 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-gradient-to-r from-pink-500 to-orange-500 text-white px-4 py-3 rounded-lg hover:from-pink-600 hover:to-orange-600 transition-all"
                                >
                                    Crear Grupo
                                </button>
                            </div>
                        </motion.form>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const GrupoCard = ({ grupo, onEliminar, onEditar, onVer }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="group relative"
        >
            <div className="absolute -inset-0.5 rounded-2xl blur opacity-0 group-hover:opacity-75 transition duration-500"
                 style={{ background: `linear-gradient(45deg, ${grupo.color}, ${grupo.color}80)` }} />
            
            <div className="relative bg-white/5 backdrop-blur-lg p-6 rounded-2xl border border-white/10 h-full">
                {/* Header con color */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: grupo.color }}
                        />
                        <h3 className="font-bold text-lg text-white line-clamp-1">
                            {grupo.nombre}
                        </h3>
                    </div>
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <motion.button
                            onClick={() => onVer(grupo.id)}
                            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <Eye className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                            onClick={() => onEditar(grupo.id)}
                            className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <Edit2 className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                            onClick={() => onEliminar(grupo.id, grupo.nombre)}
                            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <Trash2 className="w-4 h-4" />
                        </motion.button>
                    </div>
                </div>

                {/* Descripción */}
                {grupo.descripcion && (
                    <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                        {grupo.descripcion}
                    </p>
                )}

                {/* Objetivo */}
                {grupo.objetivo && (
                    <div className="flex items-center gap-2 mb-4">
                        <Target className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-300 text-sm">{grupo.objetivo}</span>
                    </div>
                )}

                {/* Stats */}
                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                        <UserPlus className="w-4 h-4 text-gray-400" />
                        <span className="text-white font-medium">
                            {grupo.total_miembros} miembro{grupo.total_miembros !== 1 ? 's' : ''}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span className="text-xs">
                            {new Date(grupo.fecha_creacion).toLocaleDateString()}
                        </span>
                    </div>
                </div>

                {/* Fechas del curso */}
                {(grupo.fecha_inicio_curso || grupo.fecha_fin_curso) && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                        <div className="text-xs text-gray-400">
                            {grupo.fecha_inicio_curso && (
                                <div>Inicio: {new Date(grupo.fecha_inicio_curso).toLocaleDateString()}</div>
                            )}
                            {grupo.fecha_fin_curso && (
                                <div>Fin: {new Date(grupo.fecha_fin_curso).toLocaleDateString()}</div>
                            )}
                        </div>
                    </div>
                )}

                {/* Avatares de miembros (preview) */}
                {grupo.miembros && grupo.miembros.length > 0 && (
                    <div className="mt-4 flex items-center justify-between">
                        <div className="flex -space-x-2">
                            {grupo.miembros.slice(0, 4).map((miembro, index) => (
                                <div key={index} className="w-8 h-8 rounded-full border-2 border-gray-800 overflow-hidden">
                                    {miembro.avatar_url ? (
                                        <img 
                                            src={miembro.avatar_url} 
                                            alt={miembro.nombre}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gray-600 flex items-center justify-center">
                                            <Users className="w-3 h-3 text-gray-400" />
                                        </div>
                                    )}
                                </div>
                            ))}
                            {grupo.total_miembros > 4 && (
                                <div className="w-8 h-8 rounded-full border-2 border-gray-800 bg-gray-700 flex items-center justify-center">
                                    <span className="text-xs text-white">+{grupo.total_miembros - 4}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

const GruposSkeleton = () => (
    <div className="space-y-8">
        <div className="flex justify-between items-center">
            <div>
                <div className="h-8 w-64 bg-white/10 rounded animate-pulse mb-2" />
                <div className="h-4 w-96 bg-white/5 rounded animate-pulse" />
            </div>
            <div className="h-12 w-32 bg-white/10 rounded-xl animate-pulse" />
        </div>
        
        <div className="h-12 w-full bg-white/10 rounded-xl animate-pulse" />
        
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-white/5 rounded-2xl animate-pulse" />
            ))}
        </div>
    </div>
);

export default GruposManager;

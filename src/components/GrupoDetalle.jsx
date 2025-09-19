import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';
import {
    ArrowLeft,
    Users,
    UserPlus,
    UserMinus,
    Settings,
    Plus,
    Search,
    Dumbbell,
    BookOpen,
    Calendar,
    Target,
    Edit2,
    Save,
    X,
    Check,
    Gift,
    Clock,
    Award,
    Trash2,
    AlertTriangle,
    RotateCcw,
    Info
} from 'lucide-react';

const INPUT_CLASS = "w-full rounded-xl bg-white/10 pl-4 pr-4 py-3 text-white placeholder-white/50 focus:ring-2 focus:ring-pink-500 border border-transparent focus:border-pink-400 transition-all outline-none shadow-inner";

const GrupoDetalle = () => {
    const { grupoId } = useParams();
    const navigate = useNavigate();
    
    const [grupo, setGrupo] = useState(null);
    const [miembros, setMiembros] = useState([]);
    const [alumnosDisponibles, setAlumnosDisponibles] = useState([]);
    const [rutinasBase, setRutinasBase] = useState([]);
    const [rutinasCompletas, setRutinasCompletas] = useState([]);
    const [cursos, setCursos] = useState([]);
    const [asignacionesGrupo, setAsignacionesGrupo] = useState([]);
    
    const [loading, setLoading] = useState(true);
    const [showAgregarMiembros, setShowAgregarMiembros] = useState(false);
    const [showAsignarRutina, setShowAsignarRutina] = useState(false);
    const [showAsignarCurso, setShowAsignarCurso] = useState(false);
    const [showEditarGrupo, setShowEditarGrupo] = useState(false);
    const [showEliminarAsignacion, setShowEliminarAsignacion] = useState(null);
    const [showCambiarAsignacion, setShowCambiarAsignacion] = useState(null);
    
    const [busquedaAlumnos, setBusquedaAlumnos] = useState('');
    const [alumnosSeleccionados, setAlumnosSeleccionados] = useState([]);
    const [tipoAsignacion, setTipoAsignacion] = useState('rutina'); // 'rutina', 'rutina_completa', 'curso'
    const [tipoAsignacionCambio, setTipoAsignacionCambio] = useState('rutina'); // Para el modal de cambio
    
    // Estados para editar grupo
    const [formularioEdicion, setFormularioEdicion] = useState({
        nombre: '',
        descripcion: '',
        objetivo: '',
        fecha_inicio_curso: '',
        fecha_fin_curso: ''
    });

    useEffect(() => {
        if (grupoId) {
            cargarDatosGrupo();
        }
    }, [grupoId]);

    const cargarDatosGrupo = async () => {
        setLoading(true);
        try {
            // Cargar información del grupo
            const { data: grupoData, error: grupoError } = await supabase
                .from('grupos_alumnos')
                .select('*')
                .eq('id', grupoId)
                .eq('activo', true)
                .single();

            if (grupoError) {
                if (grupoError.code === 'PGRST116') {
                    toast.error('Grupo no encontrado');
                    setTimeout(() => navigate('/admin/grupos'), 0);
                    return;
                }
                throw grupoError;
            }

            setGrupo(grupoData);
            setFormularioEdicion({
                nombre: grupoData.nombre,
                descripcion: grupoData.descripcion || '',
                objetivo: grupoData.objetivo || '',
                fecha_inicio_curso: grupoData.fecha_inicio_curso || '',
                fecha_fin_curso: grupoData.fecha_fin_curso || ''
            });

            // Cargar miembros del grupo
            const { data: miembrosData, error: miembrosError } = await supabase
                .from('asignaciones_grupos_alumnos')
                .select(`
                    *,
                    perfiles!inner(id, nombre, apellido, email, avatar_url)
                `)
                .eq('grupo_id', grupoId)
                .eq('activo', true);

            if (miembrosError) throw miembrosError;
            setMiembros(miembrosData || []);

            // Cargar alumnos disponibles (no en el grupo)
            const miembrosIds = (miembrosData || []).map(m => m.alumno_id);
            
            const { data: todosAlumnos, error: alumnosError } = await supabase
                .from('perfiles')
                .select('id, nombre, apellido, email, avatar_url')
                .eq('rol', 'alumno')
                .order('nombre');
            
            if (alumnosError) throw alumnosError;
            
            // Filtrar alumnos que no están en el grupo
            const alumnosDisponibles = (todosAlumnos || []).filter(
                alumno => !miembrosIds.includes(alumno.id)
            );
            setAlumnosDisponibles(alumnosDisponibles);

            // Cargar rutinas base
            const { data: rutinasData, error: rutinasError } = await supabase
                .from('rutinas_base')
                .select('id, nombre')
                .order('nombre');
            if (rutinasError) throw rutinasError;
            setRutinasBase(rutinasData || []);

            // Cargar rutinas completas
            const { data: rutinasCompletasData, error: rutinasCompletasError } = await supabase
                .from('rutinas_de_verdad')
                .select('id, nombre')
                .order('nombre');
            if (rutinasCompletasError) throw rutinasCompletasError;
            setRutinasCompletas(rutinasCompletasData || []);

            // Cargar cursos
            const { data: cursosData, error: cursosError } = await supabase
                .from('cursos')
                .select('id, titulo, descripcion, precio')
                .eq('estado', 'publicado')
                .order('titulo');
            if (cursosError) throw cursosError;
            setCursos(cursosData || []);

            // Cargar asignaciones del grupo
            const { data: asignacionesData, error: asignacionesError } = await supabase
                .from('asignaciones_grupos_contenido')
                .select(`
                    *,
                    rutinas_base(nombre),
                    rutinas_de_verdad(nombre),
                    cursos(titulo)
                `)
                .eq('grupo_id', grupoId)
                .eq('activo', true)
                .order('fecha_asignacion', { ascending: false });

            if (asignacionesError) throw asignacionesError;
            setAsignacionesGrupo(asignacionesData || []);

        } catch (error) {
            console.error('Error al cargar datos del grupo:', error);
            toast.error('Error al cargar los datos del grupo');
            setTimeout(() => navigate('/admin/grupos'), 0);
        } finally {
            setLoading(false);
        }
    };

    const agregarMiembrosAlGrupo = async () => {
        if (alumnosSeleccionados.length === 0) {
            toast.error('Selecciona al menos un alumno');
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            const asignaciones = alumnosSeleccionados.map(alumnoId => ({
                grupo_id: grupoId,
                alumno_id: alumnoId,
                activo: true
            }));

            const { error } = await supabase
                .from('asignaciones_grupos_alumnos')
                .insert(asignaciones);

            if (error) throw error;

            toast.success(`${alumnosSeleccionados.length} alumno${alumnosSeleccionados.length > 1 ? 's agregados' : ' agregado'} al grupo`);
            setShowAgregarMiembros(false);
            setAlumnosSeleccionados([]);
            setBusquedaAlumnos('');
            await cargarDatosGrupo();
        } catch (error) {
            console.error('Error al agregar miembros:', error);
            toast.error('Error al agregar miembros al grupo');
        }
    };

    const removerMiembroDelGrupo = async (asignacionId, nombreAlumno) => {
        if (!confirm(`¿Remover a ${nombreAlumno} del grupo?`)) return;

        try {
            const { error } = await supabase
                .from('asignaciones_grupos_alumnos')
                .update({ activo: false, fecha_desasignacion: new Date().toISOString() })
                .eq('id', asignacionId);

            if (error) throw error;

            toast.success(`${nombreAlumno} removido del grupo`);
            await cargarDatosGrupo();
        } catch (error) {
            console.error('Error al remover miembro:', error);
            toast.error('Error al remover el miembro');
        }
    };

    const asignarContenidoMasivo = async (contenidoId, tipo) => {
        const miembrosActivos = miembros.filter(m => m.activo);
        
        if (miembrosActivos.length === 0) {
            toast.error('No hay miembros en el grupo para asignar contenido');
            return;
        }

        // Validar que tenemos el contenido necesario
        if (!contenidoId || !tipo) {
            toast.error('Faltan datos para realizar la asignación');
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error('Usuario no autenticado');
                return;
            }

            console.log('Iniciando asignación masiva:', { contenidoId, tipo, miembros: miembrosActivos.length });

            // Primero registrar la asignación al grupo
            const asignacionGrupo = {
                grupo_id: grupoId,
                tipo: tipo,
                asignado_por: user.id,
                fecha_inicio: new Date().toISOString().split('T')[0],
                activo: true
            };

            if (tipo === 'rutina') asignacionGrupo.rutina_base_id = contenidoId;
            else if (tipo === 'rutina_completa') asignacionGrupo.rutina_de_verdad_id = contenidoId;
            else if (tipo === 'curso') asignacionGrupo.curso_id = contenidoId;

            console.log('Insertando asignación de grupo:', asignacionGrupo);

            const { error: asignacionError } = await supabase
                .from('asignaciones_grupos_contenido')
                .insert(asignacionGrupo);

            if (asignacionError) {
                console.error('Error al insertar asignación de grupo:', asignacionError);
                throw asignacionError;
            }

            // Luego asignar individualmente a cada miembro
            if (tipo === 'curso') {
                // Para cursos, crear acceso individual
                const grupoNombre = grupo?.nombre || 'Grupo sin nombre';
                
                console.log('Creando accesos de curso para miembros:', miembrosActivos.length);
                
                const accesos = miembrosActivos.map(miembro => ({
                    usuario_id: miembro.alumno_id,
                    curso_id: contenidoId,
                    tipo_acceso: 'regalo',
                    activo: true,
                    creado_por: user.id,
                    notas: `Asignado vía grupo: ${grupoNombre}`
                }));

                console.log('Datos de accesos a insertar:', accesos);

                // Verificar si ya tienen acceso para evitar duplicados
                const { data: accesosExistentes, error: checkError } = await supabase
                    .from('acceso_cursos')
                    .select('usuario_id')
                    .eq('curso_id', contenidoId)
                    .in('usuario_id', miembrosActivos.map(m => m.alumno_id))
                    .eq('activo', true);

                if (checkError) {
                    console.error('Error al verificar accesos existentes:', checkError);
                    // No es crítico, continuamos
                }

                // Filtrar accesos que ya existen
                const usuariosConAcceso = (accesosExistentes || []).map(a => a.usuario_id);
                const accesosNuevos = accesos.filter(acceso => !usuariosConAcceso.includes(acceso.usuario_id));

                if (accesosNuevos.length === 0) {
                    toast.warning('Todos los miembros ya tienen acceso a este curso');
                } else {
                    console.log('Insertando accesos nuevos:', accesosNuevos.length);
                    
                    const { error: cursosError } = await supabase
                        .from('acceso_cursos')
                        .insert(accesosNuevos);

                    if (cursosError) {
                        console.error('Error al insertar accesos de curso:', cursosError);
                        throw cursosError;
                    }
                }
            } else if (tipo === 'rutina_completa') {
                // Para rutinas completas, asignar todas las sesiones
                const { data: sesiones, error: sesionesError } = await supabase
                    .from('rutinas_de_verdad_sesiones')
                    .select('dia_semana, sesion_id')
                    .eq('rutina_id', contenidoId);

                if (sesionesError) throw sesionesError;

                const asignacionesIndividuales = [];
                miembrosActivos.forEach(miembro => {
                    // Eliminar asignaciones existentes para esta semana
                    const dias = [0, 1, 2, 3, 4, 5, 6];
                    
                    // Crear nuevas asignaciones
                    sesiones.forEach(sesion => {
                        const diaIndex = sesion.dia_semana === 'lunes' ? 0 : 
                                       sesion.dia_semana === 'martes' ? 1 :
                                       sesion.dia_semana === 'miercoles' ? 2 :
                                       sesion.dia_semana === 'jueves' ? 3 :
                                       sesion.dia_semana === 'viernes' ? 4 :
                                       sesion.dia_semana === 'sabado' ? 5 : 6;
                        
                        asignacionesIndividuales.push({
                            alumno_id: miembro.alumno_id,
                            dia_semana: diaIndex,
                            rutina_base_id: sesion.sesion_id,
                            fecha_inicio: new Date().toISOString().split('T')[0]
                        });
                    });
                });

                // Primero eliminar asignaciones existentes
                for (const miembro of miembrosActivos) {
                    const { error: deleteError } = await supabase
                        .from('asignaciones')
                        .delete()
                        .eq('alumno_id', miembro.alumno_id)
                        .in('dia_semana', [0, 1, 2, 3, 4, 5, 6]);
                    
                    if (deleteError) console.warn('Error al eliminar asignaciones previas:', deleteError);
                }

                const { error: rutinasError } = await supabase
                    .from('asignaciones')
                    .insert(asignacionesIndividuales);

                if (rutinasError) throw rutinasError;
            }

            const contenidoNombre = tipo === 'rutina' ? rutinasBase.find(r => r.id === contenidoId)?.nombre :
                                   tipo === 'rutina_completa' ? rutinasCompletas.find(r => r.id === contenidoId)?.nombre :
                                   cursos.find(c => c.id === contenidoId)?.titulo;

            toast.success(`${contenidoNombre} asignado a ${miembrosActivos.length} miembro${miembrosActivos.length > 1 ? 's' : ''} del grupo`);
            
            setShowAsignarRutina(false);
            setShowAsignarCurso(false);
            await cargarDatosGrupo();
        } catch (error) {
            console.error('Error al asignar contenido masivo:', error);
            toast.error('Error al realizar la asignación masiva');
        }
    };

    const guardarEdicionGrupo = async (e) => {
        e.preventDefault();
        
        try {
            const { error } = await supabase
                .from('grupos_alumnos')
                .update(formularioEdicion)
                .eq('id', grupoId);

            if (error) {
                if (error.code === '23505') {
                    toast.error('Ya existe un grupo con ese nombre');
                } else {
                    throw error;
                }
                return;
            }

            toast.success('Grupo actualizado correctamente');
            setShowEditarGrupo(false);
            await cargarDatosGrupo();
        } catch (error) {
            console.error('Error al actualizar grupo:', error);
            toast.error('Error al actualizar el grupo');
        }
    };

    const eliminarAsignacionMasiva = async (asignacionId, asignacion) => {
        const miembrosActivos = miembros.filter(m => m.activo);
        
        if (miembrosActivos.length === 0) {
            toast.error('No hay miembros en el grupo');
            return;
        }

        try {
            toast.loading('Eliminando asignación masiva...');

            // 1. Marcar la asignación grupal como inactiva
            const { error: grupoError } = await supabase
                .from('asignaciones_grupos_contenido')
                .update({ activo: false })
                .eq('id', asignacionId);

            if (grupoError) throw grupoError;

            // 2. Eliminar asignaciones individuales según el tipo
            if (asignacion.tipo === 'curso') {
                // Eliminar accesos a cursos
                const grupoNombre = grupo?.nombre || 'Grupo sin nombre';
                
                console.log('Eliminando accesos de curso:', {
                    curso_id: asignacion.curso_id,
                    usuarios: miembrosActivos.map(m => m.alumno_id),
                    grupo: grupoNombre
                });
                
                const { error: cursosError } = await supabase
                    .from('acceso_cursos')
                    .delete()
                    .eq('curso_id', asignacion.curso_id)
                    .in('usuario_id', miembrosActivos.map(m => m.alumno_id))
                    .ilike('notas', `%${grupoNombre}%`); // Solo los asignados via grupo

                if (cursosError) {
                    console.error('Error al eliminar accesos a cursos:', cursosError);
                    // Intentar eliminar sin filtrar por notas (fallback)
                    const { error: fallbackError } = await supabase
                        .from('acceso_cursos')
                        .delete()
                        .eq('curso_id', asignacion.curso_id)
                        .in('usuario_id', miembrosActivos.map(m => m.alumno_id))
                        .eq('tipo_acceso', 'regalo');
                    
                    if (fallbackError) {
                        console.error('Error en fallback de eliminación:', fallbackError);
                    }
                }
            } else if (asignacion.tipo === 'rutina_completa') {
                // Eliminar asignaciones de rutina completa (toda la semana)
                for (const miembro of miembrosActivos) {
                    const { error: deleteError } = await supabase
                        .from('asignaciones')
                        .delete()
                        .eq('alumno_id', miembro.alumno_id)
                        .in('dia_semana', [0, 1, 2, 3, 4, 5, 6]);
                    
                    if (deleteError) console.warn('Error al eliminar asignaciones de rutina:', deleteError);
                }
            }
            // Para rutinas individuales no eliminamos automáticamente porque pueden haber sido asignadas manualmente también

            toast.dismiss();
            const contenidoNombre = asignacion.tipo === 'rutina' ? asignacion.rutinas_base?.nombre :
                                   asignacion.tipo === 'rutina_completa' ? asignacion.rutinas_de_verdad?.nombre :
                                   asignacion.cursos?.titulo;

            toast.success(`Asignación de "${contenidoNombre}" eliminada del grupo`);
            
            setShowEliminarAsignacion(null);
            await cargarDatosGrupo();
        } catch (error) {
            toast.dismiss();
            console.error('Error al eliminar asignación masiva:', error);
            toast.error('Error al eliminar la asignación');
        }
    };

    const cambiarAsignacionMasiva = async (asignacionId, asignacionVieja, nuevoContenidoId, nuevoTipo) => {
        try {
            toast.loading('Cambiando asignación...');

            console.log('Cambiando asignación:', {
                asignacionId,
                tipoViejo: asignacionVieja.tipo,
                nuevoTipo,
                nuevoContenidoId
            });

            // 1. Marcar la asignación vieja como inactiva
            const { error: updateError } = await supabase
                .from('asignaciones_grupos_contenido')
                .update({ activo: false })
                .eq('id', asignacionId);

            if (updateError) throw updateError;

            // 2. Si es el mismo tipo, intentar eliminar las asignaciones individuales
            if (asignacionVieja.tipo === nuevoTipo && asignacionVieja.tipo === 'curso') {
                // Para cursos, eliminar accesos previos
                const miembrosActivos = miembros.filter(m => m.activo);
                const grupoNombre = grupo?.nombre || 'Grupo sin nombre';
                
                await supabase
                    .from('acceso_cursos')
                    .delete()
                    .eq('curso_id', asignacionVieja.curso_id)
                    .in('usuario_id', miembrosActivos.map(m => m.alumno_id))
                    .ilike('notas', `%${grupoNombre}%`);
            }

            // 3. Crear la nueva asignación
            await asignarContenidoMasivo(nuevoContenidoId, nuevoTipo);

            toast.dismiss();
            toast.success('Asignación cambiada correctamente');
            setShowCambiarAsignacion(null);
        } catch (error) {
            toast.dismiss();
            console.error('Error al cambiar asignación:', error);
            toast.error('Error al cambiar la asignación');
        }
    };

    const alumnosDisponiblesFiltrados = alumnosDisponibles.filter(alumno =>
        `${alumno.nombre} ${alumno.apellido} ${alumno.email}`.toLowerCase()
        .includes(busquedaAlumnos.toLowerCase())
    );

    if (loading) {
        return (
            <div className="p-6 max-w-6xl mx-auto">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-white/10 rounded w-1/3"></div>
                    <div className="h-64 bg-white/10 rounded"></div>
                </div>
            </div>
        );
    }

    if (!grupo) {
        return (
            <div className="p-6 max-w-6xl mx-auto text-center">
                <h1 className="text-2xl font-bold text-white mb-4">Grupo no encontrado</h1>
                <button
                    onClick={() => navigate('/admin/grupos')}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
                >
                    Volver a Grupos
                </button>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/admin/grupos')}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Volver
                </button>
                
                <div className="flex items-center gap-3 flex-1">
                    <div 
                        className="w-6 h-6 rounded-full" 
                        style={{ backgroundColor: grupo.color }}
                    />
                    <h1 className="text-3xl font-bold text-white">{grupo.nombre}</h1>
                </div>

                <button
                    onClick={() => setShowEditarGrupo(true)}
                    className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                    <Edit2 className="w-4 h-4" />
                    Editar
                </button>
            </div>

            {/* Info del grupo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                    <div className="bg-white/5 backdrop-blur-lg p-6 rounded-2xl border border-white/10">
                        <h2 className="text-xl font-semibold text-white mb-4">Información del Grupo</h2>
                        
                        {grupo.descripcion && (
                            <div className="mb-4">
                                <h3 className="font-medium text-gray-300 mb-2">Descripción:</h3>
                                <p className="text-gray-300">{grupo.descripcion}</p>
                            </div>
                        )}
                        
                        {grupo.objetivo && (
                            <div className="mb-4 flex items-center gap-2">
                                <Target className="w-5 h-5 text-gray-400" />
                                <span className="text-gray-300"><strong>Objetivo:</strong> {grupo.objetivo}</span>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-300">
                                    Creado: {new Date(grupo.fecha_creacion).toLocaleDateString()}
                                </span>
                            </div>
                            
                            {grupo.fecha_inicio_curso && (
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-green-400" />
                                    <span className="text-gray-300">
                                        Inicio: {new Date(grupo.fecha_inicio_curso).toLocaleDateString()}
                                    </span>
                                </div>
                            )}
                            
                            {grupo.fecha_fin_curso && (
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-red-400" />
                                    <span className="text-gray-300">
                                        Fin: {new Date(grupo.fecha_fin_curso).toLocaleDateString()}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div>
                    <div className="bg-white/5 backdrop-blur-lg p-6 rounded-2xl border border-white/10">
                        <h2 className="text-xl font-semibold text-white mb-4">Estadísticas</h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Users className="w-5 h-5 text-blue-400" />
                                    <span className="text-gray-300">Miembros:</span>
                                </div>
                                <span className="font-bold text-white">{miembros.length}</span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Dumbbell className="w-5 h-5 text-orange-400" />
                                    <span className="text-gray-300">Rutinas:</span>
                                </div>
                                <span className="font-bold text-white">
                                    {asignacionesGrupo.filter(a => a.tipo === 'rutina' || a.tipo === 'rutina_completa').length}
                                </span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <BookOpen className="w-5 h-5 text-purple-400" />
                                    <span className="text-gray-300">Cursos:</span>
                                </div>
                                <span className="font-bold text-white">
                                    {asignacionesGrupo.filter(a => a.tipo === 'curso').length}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Miembros del grupo */}
            <div className="bg-white/5 backdrop-blur-lg p-6 rounded-2xl border border-white/10">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white">
                        Miembros del Grupo ({miembros.length})
                    </h2>
                    <motion.button
                        onClick={() => setShowAgregarMiembros(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <UserPlus className="w-4 h-4" />
                        Agregar Miembros
                    </motion.button>
                </div>

                {miembros.length > 0 ? (
                    <div className="grid gap-3">
                        {miembros.map(miembro => (
                            <div key={miembro.id} className="flex items-center justify-between bg-gray-700/30 rounded-lg p-4">
                                <div className="flex items-center gap-3">
                                    {miembro.perfiles.avatar_url ? (
                                        <img 
                                            src={miembro.perfiles.avatar_url} 
                                            alt={miembro.perfiles.nombre}
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                                            <Users className="w-5 h-5 text-gray-400" />
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="text-white font-medium">
                                            {miembro.perfiles.nombre} {miembro.perfiles.apellido}
                                        </h3>
                                        <p className="text-gray-400 text-sm">{miembro.perfiles.email}</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-400">
                                        Desde: {new Date(miembro.fecha_asignacion).toLocaleDateString()}
                                    </span>
                                    <button
                                        onClick={() => removerMiembroDelGrupo(miembro.id, miembro.perfiles.nombre)}
                                        className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded"
                                    >
                                        <UserMinus className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-400">
                        <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No hay miembros en este grupo</p>
                        <button
                            onClick={() => setShowAgregarMiembros(true)}
                            className="mt-3 text-blue-400 hover:text-blue-300 underline"
                        >
                            Agregar primeros miembros
                        </button>
                    </div>
                )}
            </div>

            {/* Asignaciones masivas */}
            <div className="bg-white/5 backdrop-blur-lg p-6 rounded-2xl border border-white/10">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white">Asignaciones Masivas</h2>
                    <div className="flex gap-2">
                        <motion.button
                            onClick={() => setShowAsignarRutina(true)}
                            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Dumbbell className="w-4 h-4" />
                            Asignar Rutina
                        </motion.button>
                        <motion.button
                            onClick={() => setShowAsignarCurso(true)}
                            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <BookOpen className="w-4 h-4" />
                            Asignar Curso
                        </motion.button>
                    </div>
                </div>

                {asignacionesGrupo.length > 0 ? (
                    <div className="space-y-3">
                        {asignacionesGrupo.map(asignacion => (
                            <motion.div 
                                key={asignacion.id} 
                                className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/30 hover:border-gray-500/50 transition-colors"
                                layout
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {asignacion.tipo === 'curso' ? (
                                            <BookOpen className="w-5 h-5 text-purple-400" />
                                        ) : (
                                            <Dumbbell className="w-5 h-5 text-orange-400" />
                                        )}
                                        <div>
                                            <h3 className="text-white font-medium">
                                                {asignacion.tipo === 'rutina' ? asignacion.rutinas_base?.nombre :
                                                 asignacion.tipo === 'rutina_completa' ? asignacion.rutinas_de_verdad?.nombre :
                                                 asignacion.cursos?.titulo}
                                            </h3>
                                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                                <span className={`px-2 py-0.5 rounded-full text-xs ${
                                                    asignacion.tipo === 'curso' ? 'bg-purple-500/20 text-purple-300' :
                                                    asignacion.tipo === 'rutina_completa' ? 'bg-orange-500/20 text-orange-300' :
                                                    'bg-blue-500/20 text-blue-300'
                                                }`}>
                                                    {asignacion.tipo === 'rutina' ? 'Rutina Base' :
                                                     asignacion.tipo === 'rutina_completa' ? 'Rutina Completa' :
                                                     'Curso'}
                                                </span>
                                                <span>
                                                    Asignado: {new Date(asignacion.fecha_asignacion).toLocaleDateString()}
                                                </span>
                                                <span className="flex items-center gap-1 text-gray-500">
                                                    <Users className="w-3 h-3" />
                                                    {miembros.length} miembro{miembros.length !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Botones de acción */}
                                    <div className="flex items-center gap-2">
                                        <motion.button
                                            onClick={() => {
                                                setTipoAsignacionCambio(asignacion.tipo);
                                                setShowCambiarAsignacion(asignacion);
                                            }}
                                            className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors"
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            title="Cambiar asignación"
                                        >
                                            <RotateCcw className="w-4 h-4" />
                                        </motion.button>
                                        <motion.button
                                            onClick={() => setShowEliminarAsignacion(asignacion)}
                                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            title="Eliminar asignación"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </motion.button>
                                    </div>
                                </div>
                                
                                {/* Información adicional */}
                                {(asignacion.fecha_inicio || asignacion.fecha_fin) && (
                                    <div className="mt-3 pt-3 border-t border-gray-600/30">
                                        <div className="flex items-center gap-4 text-xs text-gray-400">
                                            {asignacion.fecha_inicio && (
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    Inicia: {new Date(asignacion.fecha_inicio).toLocaleDateString()}
                                                </span>
                                            )}
                                            {asignacion.fecha_fin && (
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    Termina: {new Date(asignacion.fecha_fin).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-400">
                        <Award className="w-16 h-16 mx-auto mb-4 opacity-30" />
                        <h3 className="text-lg font-semibold text-gray-300 mb-2">Sin asignaciones masivas</h3>
                        <p className="mb-4 max-w-md mx-auto leading-relaxed">
                            Este grupo no tiene rutinas o cursos asignados masivamente. 
                            Puedes asignar contenido que se aplicará automáticamente a todos los miembros.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2 justify-center">
                            <button
                                onClick={() => setShowAsignarRutina(true)}
                                className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                <Dumbbell className="w-4 h-4" />
                                Asignar Rutina
                            </button>
                            <button
                                onClick={() => setShowAsignarCurso(true)}
                                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                <BookOpen className="w-4 h-4" />
                                Asignar Curso
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal agregar miembros */}
            <AnimatePresence>
                {showAgregarMiembros && (
                    <motion.div
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowAgregarMiembros(false)}
                    >
                        <motion.div
                            className="bg-gray-900 rounded-xl p-6 w-full max-w-lg border border-gray-700 max-h-[90vh] overflow-y-auto"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white">Agregar Miembros</h2>
                                <button
                                    onClick={() => setShowAgregarMiembros(false)}
                                    className="p-2 text-gray-400 hover:text-white rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="mb-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        placeholder="Buscar alumnos..."
                                        value={busquedaAlumnos}
                                        onChange={(e) => setBusquedaAlumnos(e.target.value)}
                                        className="w-full bg-gray-800 border border-gray-600 rounded-lg py-2 pl-10 pr-4 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
                                {alumnosDisponiblesFiltrados.map(alumno => (
                                    <div
                                        key={alumno.id}
                                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                                            alumnosSeleccionados.includes(alumno.id)
                                                ? 'bg-blue-500/20 border border-blue-400/30'
                                                : 'bg-gray-800 hover:bg-gray-700'
                                        }`}
                                        onClick={() => {
                                            setAlumnosSeleccionados(prev => 
                                                prev.includes(alumno.id)
                                                    ? prev.filter(id => id !== alumno.id)
                                                    : [...prev, alumno.id]
                                            );
                                        }}
                                    >
                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                            alumnosSeleccionados.includes(alumno.id)
                                                ? 'border-blue-500 bg-blue-500'
                                                : 'border-gray-600'
                                        }`}>
                                            {alumnosSeleccionados.includes(alumno.id) && (
                                                <Check className="w-3 h-3 text-white" />
                                            )}
                                        </div>
                                        
                                        {alumno.avatar_url ? (
                                            <img 
                                                src={alumno.avatar_url} 
                                                alt={alumno.nombre}
                                                className="w-8 h-8 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                                                <Users className="w-4 h-4 text-gray-400" />
                                            </div>
                                        )}
                                        
                                        <div>
                                            <h3 className="text-white font-medium text-sm">
                                                {alumno.nombre} {alumno.apellido}
                                            </h3>
                                            <p className="text-gray-400 text-xs">{alumno.email}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {alumnosDisponiblesFiltrados.length === 0 && (
                                <div className="text-center py-4 text-gray-400">
                                    <p>No se encontraron alumnos disponibles</p>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowAgregarMiembros(false)}
                                    className="flex-1 bg-gray-700 text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={agregarMiembrosAlGrupo}
                                    disabled={alumnosSeleccionados.length === 0}
                                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Agregar ({alumnosSeleccionados.length})
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal asignar rutina */}
            <AnimatePresence>
                {showAsignarRutina && (
                    <motion.div
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowAsignarRutina(false)}
                    >
                        <motion.div
                            className="bg-gray-900 rounded-xl p-6 w-full max-w-lg border border-gray-700 max-h-[90vh] overflow-y-auto"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white">Asignar Rutina al Grupo</h2>
                                <button
                                    onClick={() => setShowAsignarRutina(false)}
                                    className="p-2 text-gray-400 hover:text-white rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="mb-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                                <div className="flex items-center gap-2 text-orange-400 mb-2">
                                    <Dumbbell className="w-5 h-5" />
                                    <span className="font-medium">Asignación de Rutinas Completas</span>
                                </div>
                                <p className="text-sm text-gray-300">
                                    Las asignaciones masivas solo permiten rutinas completas (semana entera). 
                                    Las rutinas individuales se asignan día por día desde el perfil del alumno.
                                </p>
                            </div>

                            <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
                                {rutinasCompletas.length > 0 ? (
                                    rutinasCompletas.map(rutina => (
                                        <button
                                            key={rutina.id}
                                            onClick={() => asignarContenidoMasivo(rutina.id, 'rutina_completa')}
                                            className="w-full text-left bg-gray-800 hover:bg-gray-700 p-3 rounded-lg transition-colors border border-gray-700/50 hover:border-orange-500/30"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Dumbbell className="w-5 h-5 text-orange-400" />
                                                <div className="flex-1">
                                                    <span className="text-white font-medium block">{rutina.nombre}</span>
                                                    <span className="text-xs text-gray-400">Rutina completa • 7 días</span>
                                                </div>
                                                <span className="text-xs bg-orange-500/20 text-orange-300 px-2 py-1 rounded-full">
                                                    Semana completa
                                                </span>
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-gray-400">
                                        <Dumbbell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                        <p className="mb-2">No hay rutinas completas disponibles</p>
                                        <p className="text-sm">Crea primero una rutina completa desde el panel de rutinas</p>
                                    </div>
                                )}
                            </div>

                            <div className="text-sm text-gray-400 bg-gray-800/50 p-3 rounded-lg">
                                💡 <strong>Tip:</strong> Esto asignará la rutina seleccionada a todos los {miembros.length} miembro{miembros.length !== 1 ? 's' : ''} del grupo.
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal asignar curso */}
            <AnimatePresence>
                {showAsignarCurso && (
                    <motion.div
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowAsignarCurso(false)}
                    >
                        <motion.div
                            className="bg-gray-900 rounded-xl p-6 w-full max-w-lg border border-gray-700 max-h-[90vh] overflow-y-auto"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white">Asignar Curso al Grupo</h2>
                                <button
                                    onClick={() => setShowAsignarCurso(false)}
                                    className="p-2 text-gray-400 hover:text-white rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
                                {cursos.map(curso => (
                                    <button
                                        key={curso.id}
                                        onClick={() => asignarContenidoMasivo(curso.id, 'curso')}
                                        className="w-full text-left bg-gray-800 hover:bg-gray-700 p-3 rounded-lg transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <BookOpen className="w-5 h-5 text-purple-400" />
                                            <div className="flex-1">
                                                <span className="text-white font-medium block">{curso.titulo}</span>
                                                {curso.descripcion && (
                                                    <span className="text-gray-400 text-sm line-clamp-1">{curso.descripcion}</span>
                                                )}
                                            </div>
                                            <span className="text-purple-400 font-bold">${curso.precio}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <div className="text-sm text-gray-400 bg-gray-800/50 p-3 rounded-lg">
                                💡 <strong>Tip:</strong> Esto dará acceso gratuito al curso a todos los {miembros.length} miembro{miembros.length !== 1 ? 's' : ''} del grupo.
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal editar grupo */}
            <AnimatePresence>
                {showEditarGrupo && (
                    <motion.div
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowEditarGrupo(false)}
                    >
                        <motion.form
                            onSubmit={guardarEdicionGrupo}
                            className="bg-gray-900 rounded-xl p-6 w-full max-w-md border border-gray-700 max-h-[90vh] overflow-y-auto"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white">Editar Grupo</h2>
                                <button
                                    type="button"
                                    onClick={() => setShowEditarGrupo(false)}
                                    className="p-2 text-gray-400 hover:text-white rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-white font-medium mb-2">Nombre del Grupo *</label>
                                    <input
                                        type="text"
                                        value={formularioEdicion.nombre}
                                        onChange={(e) => setFormularioEdicion(prev => ({ ...prev, nombre: e.target.value }))}
                                        className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-pink-500 focus:outline-none"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-white font-medium mb-2">Descripción</label>
                                    <textarea
                                        value={formularioEdicion.descripcion}
                                        onChange={(e) => setFormularioEdicion(prev => ({ ...prev, descripcion: e.target.value }))}
                                        className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-pink-500 focus:outline-none h-20 resize-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-white font-medium mb-2">Objetivo</label>
                                    <input
                                        type="text"
                                        value={formularioEdicion.objetivo}
                                        onChange={(e) => setFormularioEdicion(prev => ({ ...prev, objetivo: e.target.value }))}
                                        className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-pink-500 focus:outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-white font-medium mb-2">Fecha Inicio</label>
                                        <input
                                            type="date"
                                            value={formularioEdicion.fecha_inicio_curso}
                                            onChange={(e) => setFormularioEdicion(prev => ({ ...prev, fecha_inicio_curso: e.target.value }))}
                                            className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-pink-500 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-white font-medium mb-2">Fecha Fin</label>
                                        <input
                                            type="date"
                                            value={formularioEdicion.fecha_fin_curso}
                                            onChange={(e) => setFormularioEdicion(prev => ({ ...prev, fecha_fin_curso: e.target.value }))}
                                            className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-pink-500 focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowEditarGrupo(false)}
                                    className="flex-1 bg-gray-700 text-gray-300 px-4 py-3 rounded-lg hover:bg-gray-600 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-orange-500 text-white px-4 py-3 rounded-lg hover:from-pink-600 hover:to-orange-600 transition-all"
                                >
                                    <Save className="w-4 h-4" />
                                    Guardar
                                </button>
                            </div>
                        </motion.form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal para eliminar asignación */}
            <AnimatePresence>
                {showEliminarAsignacion && (
                    <motion.div
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowEliminarAsignacion(null)}
                    >
                        <motion.div
                            className="bg-gray-900 rounded-xl p-6 w-full max-w-md border border-gray-700"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-red-500/20 rounded-full">
                                    <AlertTriangle className="w-6 h-6 text-red-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-white">Eliminar Asignación</h3>
                                    <p className="text-sm text-gray-400">Esta acción no se puede deshacer</p>
                                </div>
                            </div>
                            
                            <div className="mb-6">
                                <p className="text-gray-300 mb-3">
                                    ¿Estás seguro de eliminar la asignación de <strong>
                                    {showEliminarAsignacion.tipo === 'rutina' ? showEliminarAsignacion.rutinas_base?.nombre :
                                     showEliminarAsignacion.tipo === 'rutina_completa' ? showEliminarAsignacion.rutinas_de_verdad?.nombre :
                                     showEliminarAsignacion.cursos?.titulo}
                                    </strong>?
                                </p>
                                
                                <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700">
                                    <div className="flex items-center gap-2 text-sm text-gray-300 mb-2">
                                        <Info className="w-4 h-4 text-blue-400" />
                                        <span>Esto afectará:</span>
                                    </div>
                                    <ul className="text-sm text-gray-400 list-disc list-inside space-y-1 ml-6">
                                        <li>{miembros.length} miembro{miembros.length !== 1 ? 's' : ''} del grupo</li>
                                        {showEliminarAsignacion.tipo === 'curso' && (
                                            <li>Se eliminará el acceso al curso para todos los miembros</li>
                                        )}
                                        {showEliminarAsignacion.tipo === 'rutina_completa' && (
                                            <li>Se eliminarán las rutinas de toda la semana para todos los miembros</li>
                                        )}
                                        {showEliminarAsignacion.tipo === 'rutina' && (
                                            <li>Las rutinas asignadas manualmente no se eliminarán</li>
                                        )}
                                    </ul>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowEliminarAsignacion(null)}
                                    className="flex-1 bg-gray-700 text-gray-300 px-4 py-3 rounded-lg hover:bg-gray-600 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => eliminarAsignacionMasiva(showEliminarAsignacion.id, showEliminarAsignacion)}
                                    className="flex-1 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Eliminar
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal para cambiar asignación */}
            <AnimatePresence>
                {showCambiarAsignacion && (
                    <motion.div
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowCambiarAsignacion(null)}
                    >
                        <motion.div
                            className="bg-gray-900 rounded-xl p-6 w-full max-w-lg border border-gray-700 max-h-[90vh] overflow-y-auto"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-blue-500/20 rounded-full">
                                    <RotateCcw className="w-6 h-6 text-blue-400" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">Cambiar Asignación</h2>
                                    <p className="text-sm text-gray-400">Reemplazar el contenido actual</p>
                                </div>
                            </div>

                            <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                                <div className="flex items-center gap-2 text-yellow-400 text-sm">
                                    <AlertTriangle className="w-4 h-4" />
                                    <span>Actual: {showCambiarAsignacion.tipo === 'rutina' ? showCambiarAsignacion.rutinas_base?.nombre :
                                                  showCambiarAsignacion.tipo === 'rutina_completa' ? showCambiarAsignacion.rutinas_de_verdad?.nombre :
                                                  showCambiarAsignacion.cursos?.titulo}
                                    </span>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-white font-medium mb-2">Cambiar a:</label>
                                <select
                                    value={tipoAsignacionCambio}
                                    onChange={(e) => setTipoAsignacionCambio(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-600 rounded-lg py-2 px-3 text-white focus:border-blue-500 focus:outline-none"
                                >
                                    <option value="rutina">Rutina Individual</option>
                                    <option value="rutina_completa">Rutina Completa (Semana)</option>
                                    <option value="curso">Curso</option>
                                </select>
                            </div>

                            {/* Indicador del tipo de contenido actual */}
                            <div className="mb-3 p-2 bg-gray-800/30 rounded-lg border border-gray-700/50">
                                <div className="text-sm text-gray-400 mb-1">Mostrando:</div>
                                <div className="flex items-center gap-2">
                                    {tipoAsignacionCambio === 'curso' ? (
                                        <>
                                            <BookOpen className="w-4 h-4 text-purple-400" />
                                            <span className="text-purple-400 font-medium">Cursos disponibles</span>
                                        </>
                                    ) : (
                                        <>
                                            <Dumbbell className="w-4 h-4 text-orange-400" />
                                            <span className="text-orange-400 font-medium">
                                                {tipoAsignacionCambio === 'rutina_completa' ? 'Rutinas completas' : 'Rutinas individuales'}
                                            </span>
                                        </>
                                    )}
                                    <span className="text-xs text-gray-500">({tipoAsignacionCambio === 'rutina' ? rutinasBase.length : tipoAsignacionCambio === 'rutina_completa' ? rutinasCompletas.length : cursos.length} disponibles)</span>
                                </div>
                            </div>
                            
                            <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
                                {tipoAsignacionCambio === 'rutina' 
                                    ? rutinasBase.map(rutina => (
                                        <button
                                            key={rutina.id}
                                            onClick={() => cambiarAsignacionMasiva(showCambiarAsignacion.id, showCambiarAsignacion, rutina.id, tipoAsignacionCambio)}
                                            className="w-full text-left bg-gray-800 hover:bg-gray-700 p-3 rounded-lg transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Dumbbell className="w-5 h-5 text-orange-400" />
                                                <span className="text-white font-medium">{rutina.nombre}</span>
                                            </div>
                                        </button>
                                    ))
                                    : tipoAsignacionCambio === 'rutina_completa'
                                    ? rutinasCompletas.map(rutina => (
                                        <button
                                            key={rutina.id}
                                            onClick={() => cambiarAsignacionMasiva(showCambiarAsignacion.id, showCambiarAsignacion, rutina.id, tipoAsignacionCambio)}
                                            className="w-full text-left bg-gray-800 hover:bg-gray-700 p-3 rounded-lg transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Dumbbell className="w-5 h-5 text-orange-400" />
                                                <span className="text-white font-medium">{rutina.nombre}</span>
                                                <span className="text-xs bg-orange-500/20 text-orange-300 px-2 py-1 rounded-full ml-auto">
                                                    Semana completa
                                                </span>
                                            </div>
                                        </button>
                                    ))
                                    : cursos.map(curso => (
                                        <button
                                            key={curso.id}
                                            onClick={() => cambiarAsignacionMasiva(showCambiarAsignacion.id, showCambiarAsignacion, curso.id, tipoAsignacionCambio)}
                                            className="w-full text-left bg-gray-800 hover:bg-gray-700 p-3 rounded-lg transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <BookOpen className="w-5 h-5 text-purple-400" />
                                                <div className="flex-1">
                                                    <span className="text-white font-medium block">{curso.titulo}</span>
                                                    {curso.descripcion && (
                                                        <span className="text-gray-400 text-sm line-clamp-1">{curso.descripcion}</span>
                                                    )}
                                                </div>
                                                <span className="text-purple-400 font-bold">${curso.precio}</span>
                                            </div>
                                        </button>
                                    ))
                                }
                            </div>

                            <div className="text-sm text-gray-400 bg-gray-800/50 p-3 rounded-lg mb-4">
                                💡 <strong>Tip:</strong> Esto eliminará la asignación actual y creará una nueva para todos los {miembros.length} miembro{miembros.length !== 1 ? 's' : ''} del grupo.
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowCambiarAsignacion(null)}
                                    className="flex-1 bg-gray-700 text-gray-300 px-4 py-3 rounded-lg hover:bg-gray-600 transition-colors"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default GrupoDetalle;

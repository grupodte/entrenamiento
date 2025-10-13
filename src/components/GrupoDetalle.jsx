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
    Info,
    FileText,
    Download,
    Zap,
    CheckCircle,
    XCircle,
    RefreshCw,
    Shield
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
    const [dietas, setDietas] = useState([]);
    const [asignacionesGrupo, setAsignacionesGrupo] = useState([]);
    const [dietasGrupo, setDietasGrupo] = useState([]);
    
    const [loading, setLoading] = useState(true);
    const [showAgregarMiembros, setShowAgregarMiembros] = useState(false);
    const [showAsignarRutina, setShowAsignarRutina] = useState(false);
    const [showAsignarCurso, setShowAsignarCurso] = useState(false);
    const [showAsignarDieta, setShowAsignarDieta] = useState(false);
    const [showEditarGrupo, setShowEditarGrupo] = useState(false);
    const [showEliminarAsignacion, setShowEliminarAsignacion] = useState(null);
    const [showCambiarAsignacion, setShowCambiarAsignacion] = useState(null);
    const [estadoConsistencia, setEstadoConsistencia] = useState(null); // { esConsistente, inconsistencias, validandose }
    const [validandoConsistencia, setValidandoConsistencia] = useState(false);
    
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

            // Cargar dietas
            const { data: dietasData, error: dietasError } = await supabase
                .from('dietas')
                .select('id, nombre, descripcion, tipo, calorias, macronutrientes, etiquetas')
                .eq('activo', true)
                .order('nombre');
            if (dietasError) throw dietasError;
            setDietas(dietasData || []);

            // Cargar dietas asignadas al grupo
            const { data: dietasGrupoData, error: dietasGrupoError } = await supabase
                .from('asignaciones_dietas_grupos')
                .select(`
                    *,
                    dietas(id, nombre, descripcion, tipo, calorias, macronutrientes, etiquetas, archivo_url, archivo_nombre)
                `)
                .eq('grupo_id', grupoId)
                .eq('activo', true)
                .order('fecha_asignacion', { ascending: false });
            if (dietasGrupoError) throw dietasGrupoError;
            setDietasGrupo(dietasGrupoData || []);

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

            // Validar consistencia automáticamente después de cargar los datos
            if ((asignacionesData?.length > 0 || dietasGrupoData?.length > 0) && miembrosData?.length > 0) {
                console.log('[CargarDatos] Validando consistencia automáticamente...');
                setTimeout(async () => {
                    try {
                        const resultadoConsistencia = await validarConsistenciaAsignaciones(false);
                        setEstadoConsistencia(resultadoConsistencia);
                    } catch (error) {
                        console.warn('[CargarDatos] Error en validación automática:', error);
                        setEstadoConsistencia({ esConsistente: false, inconsistencias: [], error: error.message });
                    }
                }, 1000); // Delay para dar tiempo a que se actualicen todos los estados
            } else {
                setEstadoConsistencia({ esConsistente: true, inconsistencias: [] });
            }

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

        const loadingToast = toast.loading('Agregando miembros al grupo...');
        let miembrosAgregadosExitosamente = [];
        let erroresAsignacion = [];

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                throw new Error('Usuario no autenticado');
            }
            
            // 1. Crear las asignaciones de grupo para los alumnos
            const asignaciones = alumnosSeleccionados.map(alumnoId => ({
                grupo_id: grupoId,
                alumno_id: alumnoId,
                activo: true
            }));

            console.log('Insertando asignaciones de grupo:', asignaciones.length);
            const { error: asignacionError, data: asignacionesInsertadas } = await supabase
                .from('asignaciones_grupos_alumnos')
                .insert(asignaciones)
                .select('alumno_id');

            if (asignacionError) {
                console.error('Error al insertar asignaciones de grupo:', asignacionError);
                throw asignacionError;
            }

            miembrosAgregadosExitosamente = asignacionesInsertadas.map(a => a.alumno_id);
            console.log('Miembros agregados exitosamente:', miembrosAgregadosExitosamente.length);

            // 2. Asignar automáticamente las rutinas/cursos/dietas actuales del grupo a los nuevos miembros
            const totalAsignaciones = asignacionesGrupo.length + dietasGrupo.length;
            if (totalAsignaciones > 0) {
                toast.loading('Asignando contenido del grupo a nuevos miembros...', { id: loadingToast });
                
                // Asignar contenido a cada miembro con manejo de errores individual
                for (const alumnoId of miembrosAgregadosExitosamente) {
                    console.log(`Procesando asignaciones para alumno ${alumnoId}`);
                    
                    try {
                        // Asignar rutinas y cursos
                        for (const asignacion of asignacionesGrupo) {
                            try {
                                await asignarContenidoAAlumno(alumnoId, asignacion);
                                console.log(`✓ Contenido ${asignacion.tipo} asignado a alumno ${alumnoId}`);
                            } catch (contenidoError) {
                                console.error(`Error al asignar contenido ${asignacion.tipo} a alumno ${alumnoId}:`, contenidoError);
                                erroresAsignacion.push({
                                    alumnoId,
                                    tipo: asignacion.tipo,
                                    error: contenidoError.message
                                });
                            }
                        }
                        
                        // Asignar dietas
                        for (const dietaAsignacion of dietasGrupo) {
                            try {
                                await asignarDietaAAlumno(alumnoId, dietaAsignacion.dieta_id);
                                console.log(`✓ Dieta asignada a alumno ${alumnoId}`);
                            } catch (dietaError) {
                                console.error(`Error al asignar dieta a alumno ${alumnoId}:`, dietaError);
                                erroresAsignacion.push({
                                    alumnoId,
                                    tipo: 'dieta',
                                    error: dietaError.message
                                });
                            }
                        }
                    } catch (alumnoError) {
                        console.error(`Error general al procesar alumno ${alumnoId}:`, alumnoError);
                        erroresAsignacion.push({
                            alumnoId,
                            tipo: 'general',
                            error: alumnoError.message
                        });
                    }
                }
                
                toast.dismiss(loadingToast);
                
                // Preparar mensaje de resultado
                const rutinasAsignadas = asignacionesGrupo.length;
                const dietasAsignadas = dietasGrupo.length;
                let mensaje = `${miembrosAgregadosExitosamente.length} alumno${miembrosAgregadosExitosamente.length > 1 ? 's agregados' : ' agregado'} al grupo`;
                
                if (rutinasAsignadas > 0) {
                    mensaje += ` y se ${rutinasAsignadas === 1 ? 'procesó' : 'procesaron'} ${rutinasAsignadas} asignación${rutinasAsignadas > 1 ? 'es' : ''} de rutinas/cursos`;
                }
                
                if (dietasAsignadas > 0) {
                    mensaje += `${rutinasAsignadas > 0 ? ' y ' : ' y se procesaron '}${dietasAsignadas} dieta${dietasAsignadas > 1 ? 's' : ''}`;
                }
                
                // Mostrar resultado según si hubo errores
                if (erroresAsignacion.length === 0) {
                    toast.success(mensaje + ' correctamente');
                } else {
                    console.warn('Errores de asignación:', erroresAsignacion);
                    toast.success(mensaje, {
                        duration: 6000
                    });
                    toast.warning(`Se encontraron ${erroresAsignacion.length} error${erroresAsignacion.length > 1 ? 'es' : ''} al asignar contenido. Revisa la consola para detalles.`, {
                        duration: 8000
                    });
                }
            } else {
                toast.dismiss(loadingToast);
                toast.success(`${miembrosAgregadosExitosamente.length} alumno${miembrosAgregadosExitosamente.length > 1 ? 's agregados' : ' agregado'} al grupo`);
            }
            
            setShowAgregarMiembros(false);
            setAlumnosSeleccionados([]);
            setBusquedaAlumnos('');
            await cargarDatosGrupo();
        } catch (error) {
            console.error('Error crítico al agregar miembros:', error);
            toast.dismiss(loadingToast);
            
            if (miembrosAgregadosExitosamente.length > 0) {
                toast.error(`Error parcial: ${miembrosAgregadosExitosamente.length} miembro${miembrosAgregadosExitosamente.length > 1 ? 's fueron agregados' : ' fue agregado'} pero hubo problemas con las asignaciones de contenido.`, {
                    duration: 8000
                });
            } else {
                toast.error('Error al agregar miembros al grupo: ' + (error.message || 'Error desconocido'));
            }
        }
    };

    const removerMiembroDelGrupo = async (asignacionId, nombreAlumno) => {
        if (!confirm(`¿Remover a ${nombreAlumno} del grupo? Esto también eliminará sus rutinas y accesos a cursos asignados a través del grupo.`)) return;

        try {
            // Primero obtener el alumno_id de la asignación
            const { data: asignacionData, error: fetchError } = await supabase
                .from('asignaciones_grupos_alumnos')
                .select('alumno_id')
                .eq('id', asignacionId)
                .single();

            if (fetchError) throw fetchError;

            const alumnoId = asignacionData.alumno_id;

            // 1. Limpiar asignaciones individuales del alumno relacionadas al grupo
            const totalAsignaciones = asignacionesGrupo.length + dietasGrupo.length;
            if (totalAsignaciones > 0) {
                toast.loading(`Limpiando asignaciones de ${nombreAlumno}...`);
                await limpiarAsignacionesAlumno(alumnoId, asignacionesGrupo);
                await limpiarDietasAlumno(alumnoId, dietasGrupo);
                toast.dismiss();
            }

            // 2. Desactivar la asignación al grupo
            const { error } = await supabase
                .from('asignaciones_grupos_alumnos')
                .update({ activo: false, fecha_desasignacion: new Date().toISOString() })
                .eq('id', asignacionId);

            if (error) throw error;

            const rutinasLimpiadas = asignacionesGrupo.length;
            const dietasLimpiadas = dietasGrupo.length;
            let mensaje = `${nombreAlumno} removido del grupo`;
            
            if (rutinasLimpiadas > 0) {
                mensaje += ` y se ${rutinasLimpiadas === 1 ? 'eliminó' : 'eliminaron'} ${rutinasLimpiadas} asignación${rutinasLimpiadas > 1 ? 'es' : ''}`;
            }
            
            if (dietasLimpiadas > 0) {
                mensaje += `${rutinasLimpiadas > 0 ? ' y ' : ' y se eliminaron '}${dietasLimpiadas} dieta${dietasLimpiadas > 1 ? 's' : ''}`;
            }
            
            toast.success(mensaje);
            await cargarDatosGrupo();
        } catch (error) {
            console.error('Error al remover miembro:', error);
            toast.dismiss();
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

        const loadingToast = toast.loading(`Asignando ${tipo === 'curso' ? 'curso' : 'rutina'} a ${miembrosActivos.length} miembro${miembrosActivos.length > 1 ? 's' : ''}...`);
        let asignacionesExitosas = 0;
        let erroresAsignacion = [];

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                throw new Error('Usuario no autenticado');
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

            // Luego asignar individualmente a cada miembro con manejo de errores por miembro
            console.log('Asignando contenido individualmente a cada miembro...');
            
            for (const miembro of miembrosActivos) {
                try {
                    if (tipo === 'curso') {
                        await asignarContenidoAAlumno(miembro.alumno_id, {
                            tipo: 'curso',
                            curso_id: contenidoId
                        });
                    } else if (tipo === 'rutina_completa') {
                        await asignarContenidoAAlumno(miembro.alumno_id, {
                            tipo: 'rutina_completa',
                            rutina_de_verdad_id: contenidoId
                        });
                    }
                    
                    asignacionesExitosas++;
                    console.log(`✓ Contenido asignado exitosamente a miembro ${miembro.alumno_id}`);
                    
                } catch (miembroError) {
                    console.error(`Error al asignar contenido a miembro ${miembro.alumno_id}:`, miembroError);
                    erroresAsignacion.push({
                        miembroId: miembro.alumno_id,
                        nombre: `${miembro.perfiles.nombre} ${miembro.perfiles.apellido}`,
                        error: miembroError.message
                    });
                }
            }

            toast.dismiss(loadingToast);
            
            const contenidoNombre = tipo === 'rutina' ? rutinasBase.find(r => r.id === contenidoId)?.nombre :
                                   tipo === 'rutina_completa' ? rutinasCompletas.find(r => r.id === contenidoId)?.nombre :
                                   cursos.find(c => c.id === contenidoId)?.titulo;

            // Mostrar resultado según el éxito de las asignaciones
            if (erroresAsignacion.length === 0) {
                toast.success(`✓ ${contenidoNombre} asignado exitosamente a ${asignacionesExitosas} miembro${asignacionesExitosas > 1 ? 's' : ''} del grupo`);
            } else {
                const exitosos = asignacionesExitosas;
                const fallidos = erroresAsignacion.length;
                
                if (exitosos > 0) {
                    toast.success(`${contenidoNombre} asignado a ${exitosos} miembro${exitosos > 1 ? 's' : ''}`, {
                        duration: 6000
                    });
                    toast.warning(`${fallidos} asignación${fallidos > 1 ? 'es fallaron' : ' falló'}. Ver consola para detalles.`, {
                        duration: 8000
                    });
                } else {
                    toast.error(`Error: No se pudo asignar ${contenidoNombre} a ningún miembro`);
                }
                
                console.warn('Errores en asignación masiva:', erroresAsignacion);
            }
            
            setShowAsignarRutina(false);
            setShowAsignarCurso(false);
            await cargarDatosGrupo();
            
            // Re-validar consistencia después de la asignación masiva
            setTimeout(async () => {
                try {
                    console.log('[AsignacionMasiva] Re-validando consistencia...');
                    const nuevoEstado = await validarConsistenciaAsignaciones(false);
                    setEstadoConsistencia(nuevoEstado);
                    
                    if (!nuevoEstado.esConsistente && nuevoEstado.inconsistencias?.length > 0) {
                        console.log('[AsignacionMasiva] Se detectaron inconsistencias post-asignación, mostrando opción de corrección');
                        toast.info('Se detectó que algunos miembros podrían necesitar re-sincronización. Usa el botón "Re-sincronizar" si es necesario.', {
                            duration: 8000
                        });
                    }
                } catch (error) {
                    console.warn('[AsignacionMasiva] Error en re-validación:', error);
                }
            }, 1500);
            
        } catch (error) {
            toast.dismiss(loadingToast);
            console.error('Error crítico al asignar contenido masivo:', error);
            
            if (asignacionesExitosas > 0) {
                toast.error(`Error parcial: ${asignacionesExitosas} asignación${asignacionesExitosas > 1 ? 'es exitosas' : ' exitosa'} pero ocurrió un error crítico: ${error.message}`);
            } else {
                toast.error('Error al realizar la asignación masiva: ' + (error.message || 'Error desconocido'));
            }
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

    // Función auxiliar para asignar contenido de grupo a un alumno específico
    const asignarContenidoAAlumno = async (alumnoId, asignacion) => {
        if (!alumnoId || !asignacion) {
            throw new Error('Faltan parámetros requeridos: alumnoId o asignacion');
        }

        console.log(`[AsignarContenido] Iniciando asignación para alumno ${alumnoId}, tipo: ${asignacion.tipo}`);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                throw new Error('Usuario no autenticado para asignación individual');
            }

            if (asignacion.tipo === 'curso') {
                console.log(`[AsignarContenido] Procesando curso ${asignacion.curso_id}`);
                
                if (!asignacion.curso_id) {
                    throw new Error('curso_id no especificado en la asignación');
                }

                // Crear acceso al curso para el alumno
                const grupoNombre = grupo?.nombre || 'Grupo sin nombre';
                
                // Verificar si ya tiene acceso
                const { data: accesoExistente, error: checkError } = await supabase
                    .from('acceso_cursos')
                    .select('id')
                    .eq('curso_id', asignacion.curso_id)
                    .eq('usuario_id', alumnoId)
                    .eq('activo', true)
                    .single();

                if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
                    throw new Error(`Error al verificar acceso existente: ${checkError.message}`);
                }

                if (!accesoExistente) {
                    console.log(`[AsignarContenido] Creando nuevo acceso al curso para alumno ${alumnoId}`);
                    
                    const { error: cursosError } = await supabase
                        .from('acceso_cursos')
                        .insert({
                            usuario_id: alumnoId,
                            curso_id: asignacion.curso_id,
                            tipo_acceso: 'regalo',
                            activo: true,
                            creado_por: user.id,
                            notas: `Asignado vía grupo: ${grupoNombre}`
                        });

                    if (cursosError) {
                        throw new Error(`Error al insertar acceso al curso: ${cursosError.message}`);
                    }
                    
                    console.log(`[AsignarContenido] ✓ Acceso al curso creado para alumno ${alumnoId}`);
                } else {
                    console.log(`[AsignarContenido] Alumno ${alumnoId} ya tiene acceso al curso`);
                }
                
            } else if (asignacion.tipo === 'rutina_completa') {
                console.log(`[AsignarContenido] Procesando rutina completa ${asignacion.rutina_de_verdad_id}`);
                
                if (!asignacion.rutina_de_verdad_id) {
                    throw new Error('rutina_de_verdad_id no especificado en la asignación');
                }

                // Asignar rutina completa al alumno
                const { data: sesiones, error: sesionesError } = await supabase
                    .from('rutinas_de_verdad_sesiones')
                    .select('dia_semana, sesion_id')
                    .eq('rutina_id', asignacion.rutina_de_verdad_id);

                if (sesionesError) {
                    throw new Error(`Error al obtener sesiones de rutina: ${sesionesError.message}`);
                }

                if (!sesiones || sesiones.length === 0) {
                    throw new Error(`No se encontraron sesiones para la rutina ${asignacion.rutina_de_verdad_id}`);
                }

                console.log(`[AsignarContenido] Procesando ${sesiones.length} sesiones de rutina`);

                const asignacionesIndividuales = [];
                sesiones.forEach((sesion, index) => {
                    const diaIndex = sesion.dia_semana === 'lunes' ? 0 : 
                                   sesion.dia_semana === 'martes' ? 1 :
                                   sesion.dia_semana === 'miercoles' ? 2 :
                                   sesion.dia_semana === 'jueves' ? 3 :
                                   sesion.dia_semana === 'viernes' ? 4 :
                                   sesion.dia_semana === 'sabado' ? 5 : 6;
                    
                    if (!sesion.sesion_id) {
                        console.warn(`[AsignarContenido] Sesión ${index} sin sesion_id válido`);
                        return;
                    }
                    
                    asignacionesIndividuales.push({
                        alumno_id: alumnoId,
                        dia_semana: diaIndex,
                        rutina_base_id: sesion.sesion_id,
                        fecha_inicio: new Date().toISOString().split('T')[0]
                    });
                });

                if (asignacionesIndividuales.length === 0) {
                    throw new Error('No se generaron asignaciones válidas para la rutina completa');
                }

                console.log(`[AsignarContenido] Eliminando asignaciones previas para alumno ${alumnoId}`);
                // Primero eliminar asignaciones existentes para esta semana
                const { error: deleteError } = await supabase
                    .from('asignaciones')
                    .delete()
                    .eq('alumno_id', alumnoId)
                    .in('dia_semana', [0, 1, 2, 3, 4, 5, 6]);

                if (deleteError) {
                    console.warn(`[AsignarContenido] Advertencia al eliminar asignaciones previas: ${deleteError.message}`);
                    // No lanzamos error porque esto no es crítico
                }

                console.log(`[AsignarContenido] Insertando ${asignacionesIndividuales.length} nuevas asignaciones`);
                // Insertar nuevas asignaciones
                const { error: rutinasError } = await supabase
                    .from('asignaciones')
                    .insert(asignacionesIndividuales);

                if (rutinasError) {
                    throw new Error(`Error al insertar asignaciones de rutina: ${rutinasError.message}`);
                }
                
                console.log(`[AsignarContenido] ✓ Rutina completa asignada para alumno ${alumnoId}`);
                
            } else {
                console.log(`[AsignarContenido] Tipo de asignación '${asignacion.tipo}' no requiere procesamiento individual`);
            }
            
        } catch (error) {
            console.error(`[AsignarContenido] Error en asignación individual para alumno ${alumnoId}:`, error);
            throw error; // Re-lanzar para que el caller pueda manejarlo
        }
    };

    // Función auxiliar para limpiar asignaciones de un alumno que vienen del grupo
    const limpiarAsignacionesAlumno = async (alumnoId, asignacionesGrupoActuales) => {
        try {
            const grupoNombre = grupo?.nombre || 'Grupo sin nombre';
            
            for (const asignacion of asignacionesGrupoActuales) {
                if (asignacion.tipo === 'curso') {
                    // Eliminar acceso a cursos asignados vía grupo
                    await supabase
                        .from('acceso_cursos')
                        .delete()
                        .eq('curso_id', asignacion.curso_id)
                        .eq('usuario_id', alumnoId)
                        .ilike('notas', `%${grupoNombre}%`);
                } else if (asignacion.tipo === 'rutina_completa') {
                    // Eliminar asignaciones de rutina completa (toda la semana)
                    await supabase
                        .from('asignaciones')
                        .delete()
                        .eq('alumno_id', alumnoId)
                        .in('dia_semana', [0, 1, 2, 3, 4, 5, 6]);
                }
            }
        } catch (error) {
            console.error('Error al limpiar asignaciones del alumno:', error);
        }
    };

    // Funciones para manejar dietas
    const asignarDietaAGrupo = async (dietaId) => {
        const miembrosActivos = miembros.filter(m => m.activo);
        
        if (miembrosActivos.length === 0) {
            toast.error('No hay miembros en el grupo para asignar dieta');
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error('Usuario no autenticado');
                return;
            }

            toast.loading('Asignando dieta al grupo...');

            // 1. Crear asignación de dieta al grupo
            const { error: grupoError } = await supabase
                .from('asignaciones_dietas_grupos')
                .insert({
                    grupo_id: grupoId,
                    dieta_id: dietaId,
                    asignado_por: user.id,
                    activo: true
                });

            if (grupoError) throw grupoError;

            // 2. Asignar individualmente a cada miembro
            const asignacionesIndividuales = miembrosActivos.map(miembro => ({
                alumno_id: miembro.alumno_id,
                dieta_id: dietaId,
                asignado_por: user.id,
                observaciones: `Asignado vía grupo: ${grupo?.nombre || 'Grupo sin nombre'}`,
                activo: true
            }));

            // Verificar si algún alumno ya tiene esta dieta asignada
            const { data: asignacionesExistentes, error: checkError } = await supabase
                .from('asignaciones_dietas_alumnos')
                .select('alumno_id')
                .eq('dieta_id', dietaId)
                .in('alumno_id', miembrosActivos.map(m => m.alumno_id))
                .eq('activo', true);

            if (checkError) {
                console.warn('Error al verificar asignaciones existentes:', checkError);
            }

            // Filtrar las asignaciones que ya existen
            const alumnosConDieta = (asignacionesExistentes || []).map(a => a.alumno_id);
            const asignacionesNuevas = asignacionesIndividuales.filter(
                asignacion => !alumnosConDieta.includes(asignacion.alumno_id)
            );

            if (asignacionesNuevas.length > 0) {
                const { error: alumnosError } = await supabase
                    .from('asignaciones_dietas_alumnos')
                    .insert(asignacionesNuevas);

                if (alumnosError) throw alumnosError;
            }

            toast.dismiss();
            const dietaNombre = dietas.find(d => d.id === dietaId)?.nombre;
            toast.success(
                `Dieta "${dietaNombre}" asignada a ${miembrosActivos.length} miembro${miembrosActivos.length > 1 ? 's' : ''} del grupo` +
                (alumnosConDieta.length > 0 ? ` (${alumnosConDieta.length} ya tenían la dieta)` : '')
            );
            
            setShowAsignarDieta(false);
            await cargarDatosGrupo();
            
            // Re-validar consistencia después de la asignación de dieta
            setTimeout(async () => {
                try {
                    console.log('[AsignacionDieta] Re-validando consistencia...');
                    const nuevoEstado = await validarConsistenciaAsignaciones(false);
                    setEstadoConsistencia(nuevoEstado);
                    
                    if (!nuevoEstado.esConsistente && nuevoEstado.inconsistencias?.length > 0) {
                        console.log('[AsignacionDieta] Se detectaron inconsistencias post-asignación');
                        toast.info('Se detectó que algunos miembros podrían necesitar re-sincronización de dietas.', {
                            duration: 6000
                        });
                    }
                } catch (error) {
                    console.warn('[AsignacionDieta] Error en re-validación:', error);
                }
            }, 1500);
            
        } catch (error) {
            toast.dismiss();
            console.error('Error al asignar dieta:', error);
            toast.error('Error al asignar la dieta');
        }
    };

    const eliminarDietaDeGrupo = async (asignacionId, dietaNombre) => {
        if (!confirm(`¿Eliminar la dieta "${dietaNombre}" del grupo? Esto también la eliminará de todos los miembros.`)) return;

        try {
            toast.loading('Eliminando dieta del grupo...');

            // 1. Obtener la asignación de dieta para obtener el dieta_id
            const { data: asignacionData, error: fetchError } = await supabase
                .from('asignaciones_dietas_grupos')
                .select('dieta_id')
                .eq('id', asignacionId)
                .single();

            if (fetchError) throw fetchError;

            const dietaId = asignacionData.dieta_id;
            const grupoNombre = grupo?.nombre || 'Grupo sin nombre';
            const miembrosActivos = miembros.filter(m => m.activo);

            // 2. Eliminar asignaciones individuales que vinieron del grupo
            if (miembrosActivos.length > 0) {
                await supabase
                    .from('asignaciones_dietas_alumnos')
                    .update({ activo: false })
                    .eq('dieta_id', dietaId)
                    .in('alumno_id', miembrosActivos.map(m => m.alumno_id))
                    .ilike('observaciones', `%${grupoNombre}%`);
            }

            // 3. Desactivar la asignación del grupo
            const { error: grupoError } = await supabase
                .from('asignaciones_dietas_grupos')
                .update({ activo: false })
                .eq('id', asignacionId);

            if (grupoError) throw grupoError;

            toast.dismiss();
            toast.success(`Dieta "${dietaNombre}" eliminada del grupo`);
            await cargarDatosGrupo();
        } catch (error) {
            toast.dismiss();
            console.error('Error al eliminar dieta:', error);
            toast.error('Error al eliminar la dieta');
        }
    };

    const asignarDietaAAlumno = async (alumnoId, dietaId) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const grupoNombre = grupo?.nombre || 'Grupo sin nombre';
            
            // Verificar si ya tiene esta dieta
            const { data: asignacionExistente } = await supabase
                .from('asignaciones_dietas_alumnos')
                .select('id')
                .eq('alumno_id', alumnoId)
                .eq('dieta_id', dietaId)
                .eq('activo', true)
                .single();

            if (!asignacionExistente) {
                const { error } = await supabase
                    .from('asignaciones_dietas_alumnos')
                    .insert({
                        alumno_id: alumnoId,
                        dieta_id: dietaId,
                        asignado_por: user.id,
                        observaciones: `Asignado vía grupo: ${grupoNombre}`,
                        activo: true
                    });

                if (error) {
                    console.error('Error al asignar dieta individual:', error);
                }
            }
        } catch (error) {
            console.error('Error en asignación de dieta individual:', error);
        }
    };

    const limpiarDietasAlumno = async (alumnoId, dietasGrupoActuales) => {
        try {
            const grupoNombre = grupo?.nombre || 'Grupo sin nombre';
            
            for (const dietaAsignacion of dietasGrupoActuales) {
                await supabase
                    .from('asignaciones_dietas_alumnos')
                    .update({ activo: false })
                    .eq('alumno_id', alumnoId)
                    .eq('dieta_id', dietaAsignacion.dieta_id)
                    .ilike('observaciones', `%${grupoNombre}%`);
            }
        } catch (error) {
            console.error('Error al limpiar dietas del alumno:', error);
        }
    };

    // Función para validar consistencia de asignaciones
    const validarConsistenciaAsignaciones = async (mostrarResultados = false) => {
        try {
            console.log('[ValidarConsistencia] Iniciando validación de consistencia...');
            
            const miembrosActivos = miembros.filter(m => m.activo);
            if (miembrosActivos.length === 0) {
                console.log('[ValidarConsistencia] No hay miembros activos para validar');
                return { esConsistente: true, inconsistencias: [] };
            }

            const inconsistencias = [];
            const grupoNombre = grupo?.nombre || 'Grupo sin nombre';

            // Validar asignaciones de cursos
            for (const asignacionGrupo of asignacionesGrupo) {
                if (asignacionGrupo.tipo === 'curso' && asignacionGrupo.curso_id) {
                    console.log(`[ValidarConsistencia] Validando curso ${asignacionGrupo.curso_id}`);
                    
                    const { data: accesosActuales, error: accesosError } = await supabase
                        .from('acceso_cursos')
                        .select('usuario_id')
                        .eq('curso_id', asignacionGrupo.curso_id)
                        .in('usuario_id', miembrosActivos.map(m => m.alumno_id))
                        .eq('activo', true)
                        .ilike('notas', `%${grupoNombre}%`);

                    if (accesosError) {
                        console.error('[ValidarConsistencia] Error al verificar accesos:', accesosError);
                        continue;
                    }

                    const usuariosConAcceso = (accesosActuales || []).map(a => a.usuario_id);
                    const miembrosSinAcceso = miembrosActivos.filter(m => !usuariosConAcceso.includes(m.alumno_id));

                    if (miembrosSinAcceso.length > 0) {
                        inconsistencias.push({
                            tipo: 'curso',
                            contenidoId: asignacionGrupo.curso_id,
                            contenidoNombre: asignacionGrupo.cursos?.titulo || 'Curso sin nombre',
                            miembrosSinAsignar: miembrosSinAcceso.map(m => ({
                                id: m.alumno_id,
                                nombre: `${m.perfiles.nombre} ${m.perfiles.apellido}`
                            }))
                        });
                    }
                }

                // Validar rutinas completas
                if (asignacionGrupo.tipo === 'rutina_completa' && asignacionGrupo.rutina_de_verdad_id) {
                    console.log(`[ValidarConsistencia] Validando rutina completa ${asignacionGrupo.rutina_de_verdad_id}`);
                    
                    // Obtener sesiones de la rutina
                    const { data: sesiones, error: sesionesError } = await supabase
                        .from('rutinas_de_verdad_sesiones')
                        .select('dia_semana, sesion_id')
                        .eq('rutina_id', asignacionGrupo.rutina_de_verdad_id);

                    if (sesionesError || !sesiones?.length) {
                        console.warn(`[ValidarConsistencia] No se pudieron obtener sesiones para rutina ${asignacionGrupo.rutina_de_verdad_id}`);
                        continue;
                    }

                    const miembrosSinRutinaCompleta = [];

                    for (const miembro of miembrosActivos) {
                        // Verificar si el miembro tiene asignada toda la semana
                        const { data: asignacionesMiembro, error: asignacionesError } = await supabase
                            .from('asignaciones')
                            .select('dia_semana, rutina_base_id')
                            .eq('alumno_id', miembro.alumno_id)
                            .in('dia_semana', [0, 1, 2, 3, 4, 5, 6]);

                        if (asignacionesError) {
                            console.error(`[ValidarConsistencia] Error al obtener asignaciones para miembro ${miembro.alumno_id}:`, asignacionesError);
                            continue;
                        }

                        const diasAsignados = asignacionesMiembro?.map(a => a.dia_semana) || [];
                        const sesionesRequeridas = sesiones.map(s => {
                            const diaIndex = s.dia_semana === 'lunes' ? 0 : 
                                           s.dia_semana === 'martes' ? 1 :
                                           s.dia_semana === 'miercoles' ? 2 :
                                           s.dia_semana === 'jueves' ? 3 :
                                           s.dia_semana === 'viernes' ? 4 :
                                           s.dia_semana === 'sabado' ? 5 : 6;
                            return diaIndex;
                        });

                        const diasFaltantes = sesionesRequeridas.filter(dia => !diasAsignados.includes(dia));
                        
                        if (diasFaltantes.length > 0) {
                            miembrosSinRutinaCompleta.push({
                                id: miembro.alumno_id,
                                nombre: `${miembro.perfiles.nombre} ${miembro.perfiles.apellido}`,
                                diasFaltantes
                            });
                        }
                    }

                    if (miembrosSinRutinaCompleta.length > 0) {
                        inconsistencias.push({
                            tipo: 'rutina_completa',
                            contenidoId: asignacionGrupo.rutina_de_verdad_id,
                            contenidoNombre: asignacionGrupo.rutinas_de_verdad?.nombre || 'Rutina sin nombre',
                            miembrosSinAsignar: miembrosSinRutinaCompleta
                        });
                    }
                }
            }

            // Validar dietas
            for (const dietaAsignacion of dietasGrupo) {
                if (dietaAsignacion.dieta_id) {
                    console.log(`[ValidarConsistencia] Validando dieta ${dietaAsignacion.dieta_id}`);
                    
                    const { data: dietasActuales, error: dietasError } = await supabase
                        .from('asignaciones_dietas_alumnos')
                        .select('alumno_id')
                        .eq('dieta_id', dietaAsignacion.dieta_id)
                        .in('alumno_id', miembrosActivos.map(m => m.alumno_id))
                        .eq('activo', true)
                        .ilike('observaciones', `%${grupoNombre}%`);

                    if (dietasError) {
                        console.error('[ValidarConsistencia] Error al verificar dietas:', dietasError);
                        continue;
                    }

                    const usuariosConDieta = (dietasActuales || []).map(a => a.alumno_id);
                    const miembrosSinDieta = miembrosActivos.filter(m => !usuariosConDieta.includes(m.alumno_id));

                    if (miembrosSinDieta.length > 0) {
                        inconsistencias.push({
                            tipo: 'dieta',
                            contenidoId: dietaAsignacion.dieta_id,
                            contenidoNombre: dietaAsignacion.dietas?.nombre || 'Dieta sin nombre',
                            miembrosSinAsignar: miembrosSinDieta.map(m => ({
                                id: m.alumno_id,
                                nombre: `${m.perfiles.nombre} ${m.perfiles.apellido}`
                            }))
                        });
                    }
                }
            }

            const esConsistente = inconsistencias.length === 0;
            
            console.log(`[ValidarConsistencia] Validación completada. Consistente: ${esConsistente}, Inconsistencias: ${inconsistencias.length}`);
            
            if (mostrarResultados) {
                if (esConsistente) {
                    toast.success('✅ Todas las asignaciones están sincronizadas correctamente');
                } else {
                    toast.warning(`⚠️ Se encontraron ${inconsistencias.length} inconsistencia${inconsistencias.length > 1 ? 's' : ''} en las asignaciones`, {
                        duration: 6000
                    });
                    console.log('[ValidarConsistencia] Detalles de inconsistencias:', inconsistencias);
                }
            }

            return { esConsistente, inconsistencias };
        } catch (error) {
            console.error('[ValidarConsistencia] Error en validación:', error);
            if (mostrarResultados) {
                toast.error('Error al validar consistencia de asignaciones');
            }
            return { esConsistente: false, inconsistencias: [], error: error.message };
        }
    };

    // Función para re-sincronizar asignaciones inconsistentes
    const reSincronizarAsignaciones = async (inconsistencias) => {
        if (!inconsistencias || inconsistencias.length === 0) {
            toast.info('No hay inconsistencias para sincronizar');
            return;
        }

        const loadingToast = toast.loading('Re-sincronizando asignaciones...');
        let correccionesRealizadas = 0;
        let erroresCorreccion = [];

        try {
            for (const inconsistencia of inconsistencias) {
                console.log(`[ReSincronizar] Procesando inconsistencia de ${inconsistencia.tipo}: ${inconsistencia.contenidoNombre}`);
                
                for (const miembro of inconsistencia.miembrosSinAsignar) {
                    try {
                        if (inconsistencia.tipo === 'curso') {
                            // Re-asignar acceso al curso
                            await asignarContenidoAAlumno(miembro.id, {
                                tipo: 'curso',
                                curso_id: inconsistencia.contenidoId
                            });
                        } else if (inconsistencia.tipo === 'rutina_completa') {
                            // Re-asignar rutina completa
                            await asignarContenidoAAlumno(miembro.id, {
                                tipo: 'rutina_completa',
                                rutina_de_verdad_id: inconsistencia.contenidoId
                            });
                        } else if (inconsistencia.tipo === 'dieta') {
                            // Re-asignar dieta
                            await asignarDietaAAlumno(miembro.id, inconsistencia.contenidoId);
                        }
                        
                        correccionesRealizadas++;
                        console.log(`[ReSincronizar] ✓ Corregida asignación de ${inconsistencia.tipo} para ${miembro.nombre}`);
                        
                    } catch (error) {
                        console.error(`[ReSincronizar] Error al corregir ${inconsistencia.tipo} para ${miembro.nombre}:`, error);
                        erroresCorreccion.push({
                            miembro: miembro.nombre,
                            tipo: inconsistencia.tipo,
                            error: error.message
                        });
                    }
                }
            }

            toast.dismiss(loadingToast);
            
            if (erroresCorreccion.length === 0) {
                toast.success(`✅ Re-sincronización completada: ${correccionesRealizadas} asignación${correccionesRealizadas > 1 ? 'es corregidas' : ' corregida'}`);
            } else {
                toast.success(`Parcialmente completado: ${correccionesRealizadas} correcciones realizadas`, {
                    duration: 6000
                });
                toast.warning(`${erroresCorreccion.length} error${erroresCorreccion.length > 1 ? 'es' : ''} durante la corrección. Ver consola.`, {
                    duration: 8000
                });
                console.warn('[ReSincronizar] Errores de corrección:', erroresCorreccion);
            }

            // Recargar datos después de la sincronización
            await cargarDatosGrupo();
            
        } catch (error) {
            toast.dismiss(loadingToast);
            console.error('[ReSincronizar] Error crítico en re-sincronización:', error);
            toast.error('Error durante la re-sincronización: ' + error.message);
        }
    };

    // Función para validar consistencia manualmente
    const validarConsistenciaManual = async () => {
        setValidandoConsistencia(true);
        try {
            const resultado = await validarConsistenciaAsignaciones(true);
            setEstadoConsistencia(resultado);
        } catch (error) {
            console.error('Error en validación manual:', error);
            setEstadoConsistencia({ esConsistente: false, inconsistencias: [], error: error.message });
        } finally {
            setValidandoConsistencia(false);
        }
    };

    // Función para re-sincronizar y actualizar estado
    const reSincronizarYActualizar = async () => {
        if (!estadoConsistencia?.inconsistencias?.length) {
            toast.info('No hay inconsistencias para sincronizar');
            return;
        }

        await reSincronizarAsignaciones(estadoConsistencia.inconsistencias);
        
        // Validar nuevamente después de la sincronización
        setTimeout(async () => {
            try {
                const nuevoResultado = await validarConsistenciaAsignaciones(false);
                setEstadoConsistencia(nuevoResultado);
            } catch (error) {
                console.error('Error al re-validar después de sincronización:', error);
            }
        }, 500);
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
                            
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-cyan-400" />
                                    <span className="text-gray-300">Dietas:</span>
                                </div>
                                <span className="font-bold text-white">
                                    {dietasGrupo.length}
                                </span>
                            </div>
                            
                            {/* Indicador de consistencia */}
                            <div className="flex items-center justify-between pt-3 border-t border-gray-600/30">
                                <div className="flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-gray-400" />
                                    <span className="text-gray-300">Sincronización:</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {estadoConsistencia === null ? (
                                        <div className="flex items-center gap-1">
                                            <div className="w-3 h-3 bg-gray-500 rounded-full animate-pulse" />
                                            <span className="text-xs text-gray-400">Validando...</span>
                                        </div>
                                    ) : estadoConsistencia.esConsistente ? (
                                        <div className="flex items-center gap-1">
                                            <CheckCircle className="w-4 h-4 text-green-400" />
                                            <span className="text-xs text-green-400 font-medium">Sincronizado</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1">
                                            <XCircle className="w-4 h-4 text-red-400" />
                                            <span className="text-xs text-red-400 font-medium">
                                                {estadoConsistencia.inconsistencias?.length || 0} inconsistencia{(estadoConsistencia.inconsistencias?.length || 0) !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                    )}
                                </div>
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
                    <div className="flex gap-2 flex-wrap">
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
                        <motion.button
                            onClick={() => setShowAsignarDieta(true)}
                            className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg transition-colors"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <FileText className="w-4 h-4" />
                            Asignar Dieta
                        </motion.button>
                    </div>
                </div>
                
                {/* Botones de sincronización */}
                {(asignacionesGrupo.length > 0 || dietasGrupo.length > 0) && miembros.length > 0 && (
                    <div className="mb-4 p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-gray-400" />
                                    <span className="text-white font-medium">Estado de Sincronización</span>
                                </div>
                                
                                {estadoConsistencia === null ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-gray-500 rounded-full animate-pulse" />
                                        <span className="text-sm text-gray-400">Validando...</span>
                                    </div>
                                ) : estadoConsistencia.esConsistente ? (
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5 text-green-400" />
                                        <span className="text-sm text-green-400 font-medium">Todas las asignaciones están sincronizadas</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <XCircle className="w-5 h-5 text-red-400" />
                                        <div>
                                            <span className="text-sm text-red-400 font-medium block">
                                                {estadoConsistencia.inconsistencias?.length || 0} inconsistencia{(estadoConsistencia.inconsistencias?.length || 0) !== 1 ? 's detectadas' : ' detectada'}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                Algunos miembros no tienen todas las asignaciones del grupo
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex gap-2">
                                <motion.button
                                    onClick={validarConsistenciaManual}
                                    disabled={validandoConsistencia}
                                    className="flex items-center gap-2 bg-gray-600 hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg transition-colors text-sm"
                                    whileHover={{ scale: validandoConsistencia ? 1 : 1.02 }}
                                    whileTap={{ scale: validandoConsistencia ? 1 : 0.98 }}
                                >
                                    <RefreshCw className={`w-4 h-4 ${validandoConsistencia ? 'animate-spin' : ''}`} />
                                    {validandoConsistencia ? 'Validando...' : 'Validar'}
                                </motion.button>
                                
                                {estadoConsistencia && !estadoConsistencia.esConsistente && estadoConsistencia.inconsistencias?.length > 0 && (
                                    <motion.button
                                        onClick={reSincronizarYActualizar}
                                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors text-sm"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <Shield className="w-4 h-4" />
                                        Re-sincronizar
                                    </motion.button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

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

            {/* Dietas del grupo */}
            <div className="bg-white/5 backdrop-blur-lg p-6 rounded-2xl border border-white/10">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white">Dietas del Grupo</h2>
                    <motion.button
                        onClick={() => setShowAsignarDieta(true)}
                        className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <FileText className="w-4 h-4" />
                        Asignar Dieta
                    </motion.button>
                </div>

                {dietasGrupo.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {dietasGrupo.map(dietaAsignacion => {
                            const dieta = dietaAsignacion.dietas;
                            const TIPOS_DIETA = [
                                { value: 'deficit_calorico', label: 'Déficit Calórico', color: '#f87171' },
                                { value: 'aumento_masa', label: 'Aumento de Masa', color: '#34d399' },
                                { value: 'mantenimiento', label: 'Mantenimiento', color: '#60a5fa' },
                                { value: 'definicion', label: 'Definición', color: '#fbbf24' },
                                { value: 'volumen', label: 'Volumen', color: '#a78bfa' },
                                { value: 'especial', label: 'Especial', color: '#fb7185' }
                            ];
                            const tipoConfig = TIPOS_DIETA.find(t => t.value === dieta.tipo) || TIPOS_DIETA[0];
                            
                            return (
                                <motion.div 
                                    key={dietaAsignacion.id} 
                                    className="relative bg-gray-700/30 rounded-lg p-4 border border-gray-600/30 hover:border-gray-500/50 transition-colors group"
                                    layout
                                >
                                    <div className="absolute -inset-0.5 rounded-lg blur opacity-0 group-hover:opacity-50 transition duration-300"
                                         style={{ background: `linear-gradient(45deg, ${tipoConfig.color}, ${tipoConfig.color}80)` }} />
                                    
                                    <div className="relative">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <div 
                                                    className="w-4 h-4 rounded-full flex-shrink-0" 
                                                    style={{ backgroundColor: tipoConfig.color }}
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="text-white font-medium line-clamp-1">{dieta.nombre}</h3>
                                                    <span className="text-xs px-2 py-1 rounded-full font-medium inline-block mt-1"
                                                          style={{ backgroundColor: `${tipoConfig.color}20`, color: tipoConfig.color }}>
                                                        {tipoConfig.label}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <motion.button
                                                    onClick={() => {
                                                        const link = document.createElement('a');
                                                        link.href = dieta.archivo_url;
                                                        link.download = dieta.archivo_nombre || `${dieta.nombre}.pdf`;
                                                        link.target = '_blank';
                                                        document.body.appendChild(link);
                                                        link.click();
                                                        document.body.removeChild(link);
                                                    }}
                                                    className="p-1.5 text-gray-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    title="Descargar PDF"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </motion.button>
                                                <motion.button
                                                    onClick={() => eliminarDietaDeGrupo(dietaAsignacion.id, dieta.nombre)}
                                                    className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    title="Eliminar del grupo"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </motion.button>
                                            </div>
                                        </div>

                                        {dieta.descripcion && (
                                            <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                                                {dieta.descripcion}
                                            </p>
                                        )}

                                        {/* Información nutricional */}
                                        {(dieta.calorias || dieta.macronutrientes) && (
                                            <div className="bg-black/20 rounded-lg p-3 mb-3">
                                                {dieta.calorias && (
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Zap className="w-4 h-4 text-yellow-400" />
                                                        <span className="text-white font-medium text-sm">{dieta.calorias} kcal</span>
                                                    </div>
                                                )}
                                                {dieta.macronutrientes && (
                                                    <div className="grid grid-cols-3 gap-2 text-xs">
                                                        {dieta.macronutrientes.proteinas && (
                                                            <div className="text-center">
                                                                <div className="text-gray-400">Proteínas</div>
                                                                <div className="text-white font-medium">{dieta.macronutrientes.proteinas}g</div>
                                                            </div>
                                                        )}
                                                        {dieta.macronutrientes.carbohidratos && (
                                                            <div className="text-center">
                                                                <div className="text-gray-400">Carbohidratos</div>
                                                                <div className="text-white font-medium">{dieta.macronutrientes.carbohidratos}g</div>
                                                            </div>
                                                        )}
                                                        {dieta.macronutrientes.grasas && (
                                                            <div className="text-center">
                                                                <div className="text-gray-400">Grasas</div>
                                                                <div className="text-white font-medium">{dieta.macronutrientes.grasas}g</div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Etiquetas */}
                                        {dieta.etiquetas && dieta.etiquetas.length > 0 && (
                                            <div className="mb-3">
                                                <div className="flex flex-wrap gap-1">
                                                    {dieta.etiquetas.slice(0, 3).map((etiqueta, index) => (
                                                        <span key={index} className="text-xs bg-gray-600/50 text-gray-300 px-2 py-1 rounded-full">
                                                            {etiqueta}
                                                        </span>
                                                    ))}
                                                    {dieta.etiquetas.length > 3 && (
                                                        <span className="text-xs text-gray-400">+{dieta.etiquetas.length - 3}</span>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Footer */}
                                        <div className="flex items-center justify-between text-xs text-gray-400">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-3 h-3" />
                                                <span>Asignada: {new Date(dietaAsignacion.fecha_asignacion).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Users className="w-3 h-3" />
                                                <span>{miembros.length} miembro{miembros.length !== 1 ? 's' : ''}</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-400">
                        <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
                        <h3 className="text-lg font-semibold text-gray-300 mb-2">Sin dietas asignadas</h3>
                        <p className="mb-4 max-w-md mx-auto leading-relaxed">
                            Este grupo no tiene dietas asignadas. 
                            Puedes asignar planes nutricionales que se aplicarán automáticamente a todos los miembros.
                        </p>
                        <button
                            onClick={() => setShowAsignarDieta(true)}
                            className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg transition-colors mx-auto"
                        >
                            <FileText className="w-4 h-4" />
                            Asignar Primera Dieta
                        </button>
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

            {/* Modal asignar dieta */}
            <AnimatePresence>
                {showAsignarDieta && (
                    <motion.div
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowAsignarDieta(false)}
                    >
                        <motion.div
                            className="bg-gray-900 rounded-xl p-6 w-full max-w-2xl border border-gray-700 max-h-[90vh] overflow-y-auto"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white">Asignar Dieta al Grupo</h2>
                                <button
                                    onClick={() => setShowAsignarDieta(false)}
                                    className="p-2 text-gray-400 hover:text-white rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {dietas.length > 0 ? (
                                <div className="space-y-3 max-h-[60vh] overflow-y-auto mb-4">
                                    {dietas.map(dieta => {
                                        const TIPOS_DIETA = [
                                            { value: 'deficit_calorico', label: 'Déficit Calórico', color: '#f87171' },
                                            { value: 'aumento_masa', label: 'Aumento de Masa', color: '#34d399' },
                                            { value: 'mantenimiento', label: 'Mantenimiento', color: '#60a5fa' },
                                            { value: 'definicion', label: 'Definición', color: '#fbbf24' },
                                            { value: 'volumen', label: 'Volumen', color: '#a78bfa' },
                                            { value: 'especial', label: 'Especial', color: '#fb7185' }
                                        ];
                                        const tipoConfig = TIPOS_DIETA.find(t => t.value === dieta.tipo) || TIPOS_DIETA[0];
                                        
                                        return (
                                            <button
                                                key={dieta.id}
                                                onClick={() => asignarDietaAGrupo(dieta.id)}
                                                className="w-full text-left bg-gray-800 hover:bg-gray-700 p-4 rounded-lg transition-colors border border-gray-700/50 hover:border-cyan-500/30"
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div 
                                                        className="w-4 h-4 rounded-full flex-shrink-0 mt-1" 
                                                        style={{ backgroundColor: tipoConfig.color }}
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="flex-1 min-w-0">
                                                                <span className="text-white font-medium block">{dieta.nombre}</span>
                                                                <span className="text-xs px-2 py-1 rounded-full font-medium inline-block mt-1"
                                                                      style={{ backgroundColor: `${tipoConfig.color}20`, color: tipoConfig.color }}>
                                                                    {tipoConfig.label}
                                                                </span>
                                                            </div>
                                                            {dieta.calorias && (
                                                                <div className="flex items-center gap-1 text-yellow-400">
                                                                    <Zap className="w-4 h-4" />
                                                                    <span className="font-medium">{dieta.calorias} kcal</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        
                                                        {dieta.descripcion && (
                                                            <p className="text-gray-400 text-sm mt-2 line-clamp-2">{dieta.descripcion}</p>
                                                        )}
                                                        
                                                        {/* Macronutrientes */}
                                                        {dieta.macronutrientes && (
                                                            <div className="flex gap-4 mt-2 text-xs">
                                                                {dieta.macronutrientes.proteinas && (
                                                                    <span className="text-gray-400">
                                                                        <strong className="text-white">{dieta.macronutrientes.proteinas}g</strong> prot.
                                                                    </span>
                                                                )}
                                                                {dieta.macronutrientes.carbohidratos && (
                                                                    <span className="text-gray-400">
                                                                        <strong className="text-white">{dieta.macronutrientes.carbohidratos}g</strong> carb.
                                                                    </span>
                                                                )}
                                                                {dieta.macronutrientes.grasas && (
                                                                    <span className="text-gray-400">
                                                                        <strong className="text-white">{dieta.macronutrientes.grasas}g</strong> grasas
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                        
                                                        {/* Etiquetas */}
                                                        {dieta.etiquetas && dieta.etiquetas.length > 0 && (
                                                            <div className="flex flex-wrap gap-1 mt-2">
                                                                {dieta.etiquetas.slice(0, 3).map((etiqueta, index) => (
                                                                    <span key={index} className="text-xs bg-gray-600/50 text-gray-300 px-2 py-1 rounded-full">
                                                                        {etiqueta}
                                                                    </span>
                                                                ))}
                                                                {dieta.etiquetas.length > 3 && (
                                                                    <span className="text-xs text-gray-400">+{dieta.etiquetas.length - 3}</span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-400">
                                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                    <p className="mb-2">No hay dietas disponibles</p>
                                    <p className="text-sm">Crea primero algunas dietas desde el panel de dietas</p>
                                </div>
                            )}

                            <div className="text-sm text-gray-400 bg-gray-800/50 p-3 rounded-lg">
                                💡 <strong>Tip:</strong> Esto asignará la dieta seleccionada a todos los {miembros.length} miembro{miembros.length !== 1 ? 's' : ''} del grupo.
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

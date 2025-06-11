import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { FaArrowLeft, FaEnvelope, FaBullseye, FaSignal } from 'react-icons/fa';
import AdminLayout from './AdminLayout';

const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const AlumnoPerfil = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [alumno, setAlumno] = useState(null);
    const [asignacionesPorDia, setAsignacionesPorDia] = useState({});
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: perfil, error: errorPerfil } = await supabase
                .from('perfiles')
                .select('*')
                .eq('id', id)
                .single();

            if (errorPerfil) throw errorPerfil;
            setAlumno(perfil);

            const { data: asignaciones, error: errorAsignaciones } = await supabase
                .from('asignaciones')
                .select('id, dia_semana, rutina_personalizada_id, rutina_base_id') // Se incluye 'id' para la key
                .eq('alumno_id', id);

            if (errorAsignaciones) throw errorAsignaciones;

            const asignacionesTemp = {};

            for (const asignacion of asignaciones) {
                let ejerciciosFinales = [];

                // ✅ Rutina personalizada tiene prioridad
                if (asignacion.rutina_personalizada_id) {
                    const { data: dataPers, error: errorPers } = await supabase
                        .from('rutinas_personalizadas_ejercicios')
                        .select(`
              id,
              ejercicio_id,
              ejercicios(nombre),
              rutinas_personalizadas_series (
                nro_set,
                reps,
                pausa,
                carga
              )
            `)
                        .eq('rutina_personalizada_id', asignacion.rutina_personalizada_id)
                        .order('orden', { ascending: true });

                    if (errorPers) throw errorPers;

                    ejerciciosFinales = (dataPers || []).map(ej => ({
                        id: ej.id, // Se añade id para la key
                        nombre: ej.ejercicios?.nombre || 'Nombre no encontrado',
                        series: ej.rutinas_personalizadas_series?.length || 0,
                        reps: ej.rutinas_personalizadas_series?.[0]?.reps || '-',
                    }));

                    // ✅ Rutina base
                } else if (asignacion.rutina_base_id) {
                    const rutinaId = asignacion.rutina_base_id;

                    const { data: ejerciciosEnRutina, error: errorEjercicios } = await supabase
                        .from('rutinas_base_ejercicios')
                        .select('orden, ejercicio_id')
                        .eq('rutina_base_id', rutinaId)
                        .order('orden', { ascending: true });

                    if (errorEjercicios) throw errorEjercicios;

                    ejerciciosFinales = await Promise.all(
                        (ejerciciosEnRutina || []).map(async (ejercicio) => {
                            const { data: ejercicioData, error: errorEj } = await supabase
                                .from('ejercicios')
                                .select('nombre')
                                .eq('id', ejercicio.ejercicio_id)
                                .maybeSingle();

                            if (errorEj) throw errorEj;

                            const { data: series, error: errorSeries } = await supabase
                                .from('rutinas_base_series')
                                .select('nro_set, reps, pausa, carga_sugerida')
                                .eq('rutina_base_id', rutinaId)
                                .eq('ejercicio_id', ejercicio.ejercicio_id)
                                .order('nro_set', { ascending: true });

                            if (errorSeries) throw errorSeries;

                            return {
                                id: ejercicio.ejercicio_id, // Se añade id para la key
                                nombre: ejercicioData?.nombre || 'Ejercicio no encontrado',
                                orden: ejercicio.orden,
                                series: series || [],
                            };
                        })
                    );
                }

                asignacionesTemp[asignacion.dia_semana] = {
                    asignacion,
                    ejercicios: ejerciciosFinales,
                };
            }

            setAsignacionesPorDia(asignacionesTemp);
        } catch (error) {
            console.error("Error cargando los datos del perfil:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const irASeleccionarRutina = (dia) => navigate(`/admin/asignar-rutina/${id}?dia=${dia}`);
    const irAEditarDia = (dia) => navigate(`/admin/rutinas/editar-dia/${id}?dia=${dia}`);

    const eliminarDia = async (dia) => {
        const confirmacion = window.confirm(`¿Seguro que quieres eliminar la rutina del día ${diasSemana[dia]}?`);
        if (!confirmacion) return;

        try {
            // 1. Buscar asignación actual
            const { data: asignacion, error } = await supabase
                .from('asignaciones')
                .select('id, rutina_personalizada_id')
                .eq('alumno_id', id)
                .eq('dia_semana', dia)
                .maybeSingle();

            if (error || !asignacion) {
                alert('❌ No se encontró asignación para eliminar.');
                return;
            }

            // 2. Si hay rutina personalizada, borrar en orden:
            if (asignacion.rutina_personalizada_id) {
                const rutinaId = asignacion.rutina_personalizada_id;

                // 2.1 Buscar ejercicios personalizados
                const { data: ejerciciosPersonalizados, error: errorEj } = await supabase
                    .from('rutinas_personalizadas_ejercicios')
                    .select('id')
                    .eq('rutina_personalizada_id', rutinaId);

                if (errorEj) throw errorEj;

                const ejercicioIds = ejerciciosPersonalizados.map(ej => ej.id);

                // 2.2 Borrar series asociadas a esos ejercicios
                if (ejercicioIds.length > 0) {
                    const { error: errorSeries } = await supabase
                        .from('rutinas_personalizadas_series')
                        .delete()
                        .in('rutina_personalizada_ejercicio_id', ejercicioIds);

                    if (errorSeries) throw errorSeries;
                }

                // 2.3 Borrar los ejercicios personalizados
                const { error: errorEjerciciosPers } = await supabase
                    .from('rutinas_personalizadas_ejercicios')
                    .delete()
                    .eq('rutina_personalizada_id', rutinaId);

                if (errorEjerciciosPers) throw errorEjerciciosPers;

                // 2.4 Borrar la rutina personalizada
                const { error: errorRutinaPers } = await supabase
                    .from('rutinas_personalizadas')
                    .delete()
                    .eq('id', rutinaId);

                if (errorRutinaPers) throw errorRutinaPers;
            }

            // 3. Borrar la asignación en sí
            const { error: deleteAsignacionError } = await supabase
                .from('asignaciones')
                .delete()
                .eq('id', asignacion.id);

            if (deleteAsignacionError) throw deleteAsignacionError;

            alert('✅ Rutina del día eliminada correctamente.');
            fetchData();
        } catch (error) {
            console.error('Error al eliminar rutina del día:', error);
            alert(`❌ Ocurrió un error: ${error.message}`);
        }
    };
    
    if (loading) return <p className="text-center mt-10">Cargando datos del alumno...</p>;

    return (
        <AdminLayout>
            <div className="max-w-5xl mx-auto mt-10 p-6 bg-white rounded shadow">
                <button onClick={() => navigate('/admin/alumnos')} className="text-blue-600 hover:underline mb-6 flex items-center">
                    <FaArrowLeft className="mr-2" /> Volver a alumnos
                </button>
                <div className="mb-6">
                    <h1 className="text-3xl font-bold">{alumno?.nombre} {alumno?.apellido}</h1>
                    <p className="text-sm text-gray-700 flex items-center gap-2 mt-1"><FaEnvelope /> {alumno?.email}</p>
                    <p className="text-sm text-gray-700 flex items-center gap-2 mt-1"><FaBullseye /> Objetivo: <strong>{alumno?.objetivo || 'No definido'}</strong></p>
                    <p className="text-sm text-gray-700 flex items-center gap-2"><FaSignal /> Nivel: <strong>{alumno?.nivel || 'No definido'}</strong></p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {diasSemana.map((dia, index) => {
                        const diaInfo = asignacionesPorDia[index];
                        const tieneAsignacion = !!diaInfo;
                        // --- NUEVO: Determinar si la rutina es personalizada ---
                        const esPersonalizada = tieneAsignacion && !!diaInfo.asignacion.rutina_personalizada_id;
                        const tieneEjercicios = diaInfo && diaInfo.ejercicios.length > 0;

                        // --- NUEVO: Clases de estilo condicionales para el fondo ---
                        const cardBgClass = esPersonalizada
                            ? 'bg-purple-50 border-purple-200'
                            : tieneAsignacion
                                ? 'bg-green-50 border-green-200'
                                : 'bg-gray-50 border-gray-200';

                        return (
                            <div key={index} className={`border rounded p-4 flex flex-col justify-between ${cardBgClass}`}>
                                <div>
                                    <h3 className="font-bold mb-2">{dia}</h3>
                                    {tieneAsignacion ? (
                                        <>
                                            {/* --- NUEVO: Etiqueta para el tipo de rutina --- */}
                                            <div className="mb-2">
                                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${esPersonalizada ? 'bg-purple-200 text-purple-800' : 'bg-blue-200 text-blue-800'}`}>
                                                    {esPersonalizada ? '⭐ Personalizada' : '📘 Base'}
                                                </span>
                                            </div>

                                            {tieneEjercicios ? (
                                                <ul className="text-sm mb-2 space-y-1">
                                                    {diaInfo.ejercicios.map((ej, i) => {
                                                        const esRutinaBase = Array.isArray(ej.series);
                                                        const seriesCount = esRutinaBase ? ej.series.length : ej.series;
                                                        const repsText = esRutinaBase ? 'series' : `x ${ej.reps} reps`;
                                                        return (
                                                            <li key={ej.id || i} className="truncate">✅ {ej.nombre} ({seriesCount} {repsText})</li>
                                                        );
                                                    })}
                                                </ul>
                                            ) : (
                                                <p className="text-sm text-yellow-600 mb-2">⚠️ Rutina asignada pero sin ejercicios definidos.</p>
                                            )}
                                        </>
                                    ) : (
                                        <p className="text-sm text-gray-500">Sin rutina.</p>
                                    )}
                                </div>
                                <div className="mt-4 flex gap-3">
                                    {tieneAsignacion ? (
                                        <>
                                            <button onClick={() => irAEditarDia(index)} className="text-yellow-700 text-sm underline hover:opacity-80">✏️ Editar</button>
                                            <button onClick={() => eliminarDia(index)} className="text-red-600 text-sm underline hover:opacity-80">🗑️ Quitar</button>
                                        </>
                                    ) : (
                                        <button onClick={() => irASeleccionarRutina(index)} className="text-blue-600 hover:underline text-sm">➕ Asignar rutina</button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </AdminLayout>
    );
};

export default AlumnoPerfil;
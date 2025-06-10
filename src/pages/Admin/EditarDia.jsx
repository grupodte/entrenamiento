// src/pages/Admin/EditarDia.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const EditarDia = () => {
    const { id: alumnoId } = useParams();
    const [searchParams] = useSearchParams();
    const dia = parseInt(searchParams.get('dia'), 10);
    const navigate = useNavigate();

    const [ejercicios, setEjercicios] = useState([]);
    const [rutinaPersonalizadaId, setRutinaPersonalizadaId] = useState(null);
    const [asignacionOriginal, setAsignacionOriginal] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mensaje, setMensaje] = useState('');
    const [mostrarSelector, setMostrarSelector] = useState(false);
    const [ejerciciosDisponibles, setEjerciciosDisponibles] = useState([]);
    const [nombreRutinaBase, setNombreRutinaBase] = useState('');

    useEffect(() => {
        const inicializarVista = async () => {
            const { data: asignacion, error: errorAsignacion } = await supabase
                .from('asignaciones')
                .select('id, rutina_personalizada_id, rutina_base_id')
                .eq('alumno_id', alumnoId)
                .eq('dia_semana', dia)
                .single();

            if (errorAsignacion || !asignacion) {
                setMensaje('No hay una rutina asignada para este día. Redirigiendo...');
                setTimeout(() => navigate(`/admin/alumno/${alumnoId}`), 2000);
                return;
            }

            setAsignacionOriginal(asignacion);

            if (asignacion.rutina_personalizada_id) {
                setRutinaPersonalizadaId(asignacion.rutina_personalizada_id);
                const { data: ejerciciosDia } = await supabase
                    .from('rutinas_personalizadas_ejercicios')
                    .select('id, ejercicio_id, orden, ejercicios(nombre)')
                    .eq('rutina_personalizada_id', asignacion.rutina_personalizada_id)
                    .eq('dia_semana', dia)
                    .order('orden', { ascending: true });

                const ejerciciosConSeries = await Promise.all(ejerciciosDia.map(async (ej) => {
                    const { data: series } = await supabase
                        .from('rutinas_personalizadas_series')
                        .select('id, nro_set, reps, pausa, carga')
                        .eq('rutina_personalizada_ejercicio_id', ej.id)
                        .order('nro_set', { ascending: true });

                    return {
                        ...ej,
                        series_personalizadas: series || [],
                    };
                }));

                setEjercicios(ejerciciosConSeries);

            } else {
                if (asignacion.rutina_base_id) {
                    const { data: infoRutinaBase } = await supabase
                        .from('rutinas_base')
                        .select('nombre')
                        .eq('id', asignacion.rutina_base_id)
                        .single();
                    if (infoRutinaBase) setNombreRutinaBase(infoRutinaBase.nombre);
                }

                const { data: ejerciciosBase } = await supabase
                    .from('rutinas_base_ejercicios')
                    .select('*, ejercicios(nombre)')
                    .eq('rutina_base_id', asignacion.rutina_base_id)
                    .order('orden', { ascending: true });

                // --- INICIO DE LA CORRECCIÓN ---

                // 1. OBTENER LOS DETALLES CORRECTOS DESDE 'rutinas_base_series'
                const { data: seriesDeLaRutinaBase, error: errorSeries } = await supabase
                    .from('rutinas_base_series')
                    .select('ejercicio_id, reps, pausa, carga_sugerida')
                    .eq('rutina_base_id', asignacion.rutina_base_id);

                if (errorSeries) {
                    throw new Error('No se pudieron cargar los detalles de las series');
                }

                // 2. CONSTRUIR EL ESTADO 'ejerciciosParaEditar' USANDO LOS DATOS CORRECTOS
                const ejerciciosParaEditar = ejerciciosBase.map((ejercicio) => {
                    // Filtramos las series que le pertenecen a este ejercicio en particular
                    const seriesDelEjercicio = seriesDeLaRutinaBase
                        .filter(serie => serie.ejercicio_id === ejercicio.ejercicio_id)
                        .map(s => ({
                            reps: s.reps,
                            pausa: s.pausa,
                            carga: s.carga_sugerida || ''
                        }));

                    return {
                        id: null, // Es nulo porque aún no existe en la tabla de personalizadas
                        ejercicio_id: ejercicio.ejercicio_id,
                        ejercicios: ejercicio.ejercicios,
                        orden: ejercicio.orden,
                        // Usamos las series encontradas. Si no hay ninguna, creamos una vacía como fallback.
                        series_personalizadas: seriesDelEjercicio.length > 0 ? seriesDelEjercicio : [{ reps: '', pausa: '', carga: '' }],
                    };
                });

                // --- FIN DE LA CORRECCIÓN ---

                setEjercicios(ejerciciosParaEditar);
            }
            setLoading(false);
        };

        inicializarVista().catch((err) => {
            console.error(err);
            setLoading(false);
        });
    }, [alumnoId, dia, navigate]);

    const handleSetChange = (ejIndex, setIndex, campo, valor) => {
        const nuevos = [...ejercicios];
        nuevos[ejIndex].series_personalizadas[setIndex][campo] = valor;
        setEjercicios(nuevos);
    };

    const agregarSet = (ejIndex) => {
        const nuevos = [...ejercicios];
        nuevos[ejIndex].series_personalizadas.push({ reps: '', pausa: '', carga: '' });
        setEjercicios(nuevos);
    };

    const eliminarSet = (ejIndex, setIndex) => {
        const nuevos = [...ejercicios];
        nuevos[ejIndex].series_personalizadas.splice(setIndex, 1);
        setEjercicios(nuevos);
    };

    const handleGuardar = async () => {
        setLoading(true);
        try {
            if (!rutinaPersonalizadaId) {
                const { data: nuevaRutina, error: errorCrearRutina } = await supabase
                    .from('rutinas_personalizadas')
                    .insert({
                        alumno_id: alumnoId,
                        nombre: nombreRutinaBase || `Rutina Personalizada - ${diasSemana[dia]}`,
                        fecha_inicio: new Date().toISOString(),
                    })
                    .select('id')
                    .single();

                if (errorCrearRutina) throw errorCrearRutina;
                const newId = nuevaRutina.id;

                await Promise.all(
                    ejercicios.map(async (ej, index) => {
                        const { data: inserted, error } = await supabase
                            .from('rutinas_personalizadas_ejercicios')
                            .insert({
                                rutina_personalizada_id: newId,
                                ejercicio_id: ej.ejercicio_id,
                                dia_semana: dia,
                                orden: index,
                            })
                            .select()
                            .single();
                        if (error) throw error;

                        const sets = ej.series_personalizadas.map((set, i) => ({
                            rutina_personalizada_ejercicio_id: inserted.id,
                            nro_set: i + 1,
                            reps: Number(set.reps),
                            pausa: Number(set.pausa),
                            carga: set.carga || '',
                        }));

                        await supabase.from('rutinas_personalizadas_series').insert(sets);
                    })
                );

                await supabase.from('asignaciones').update({ rutina_personalizada_id: newId }).eq('id', asignacionOriginal.id);

            } else {
                for (const ej of ejercicios) {
                    if (ej.id) {
                        await supabase
                            .from('rutinas_personalizadas_series')
                            .delete()
                            .eq('rutina_personalizada_ejercicio_id', ej.id);

                        const nuevosSets = ej.series_personalizadas.map((set, i) => ({
                            rutina_personalizada_ejercicio_id: ej.id,
                            nro_set: i + 1,
                            reps: Number(set.reps),
                            pausa: Number(set.pausa),
                            carga: set.carga || '',
                        }));

                        await supabase.from('rutinas_personalizadas_series').insert(nuevosSets);
                    }
                }
            }

            alert('✅ Día actualizado con éxito');
            navigate(`/admin/alumno/${alumnoId}`);

        } catch (error) {
            console.error('Error al guardar los cambios:', error);
            alert(`❌ Ocurrió un error al guardar: ${error.message}`);
            setLoading(false);
        }
    };

    const agregarEjercicio = (ejercicio) => {
        setEjercicios((prev) => [
            ...prev,
            {
                id: null,
                ejercicio_id: ejercicio.id,
                ejercicios: { nombre: ejercicio.nombre },
                series_personalizadas: [{ reps: '', pausa: '', carga: '' }],
                orden: prev.length,
            },
        ]);
        setMostrarSelector(false);
    };

    const cargarEjerciciosDisponibles = async () => {
        const { data, error } = await supabase.from('ejercicios').select('id, nombre');
        if (error) {
            alert('❌ Error al cargar ejercicios disponibles');
            return;
        }
        setEjerciciosDisponibles(data);
        setMostrarSelector(true);
    };

    if (loading) return <p className="text-center mt-10">Cargando editor...</p>;
    if (mensaje) return <p className="text-center mt-10">{mensaje}</p>;

    return (
        <div className="max-w-3xl mx-auto mt-10 p-6 bg-white shadow rounded space-y-6">
            <h1 className="text-2xl font-bold mb-4">Editar rutina – {diasSemana[dia]}</h1>

            {ejercicios.map((ej, i) => (
                <div key={ej.ejercicio_id + '-' + i} className="border p-4 rounded shadow bg-gray-50">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold">{ej.ejercicios?.nombre || 'Ejercicio Nuevo'}</h3>
                        <button
                            onClick={() => setEjercicios((prev) => prev.filter((_, idx) => idx !== i))}
                            className="text-red-500 text-sm underline hover:opacity-80"
                        >
                            🗑️ Eliminar
                        </button>
                    </div>

                    {ej.series_personalizadas.map((set, setIdx) => (
                        <div key={setIdx} className="grid grid-cols-4 gap-2 mb-2">
                            <input
                                type="number"
                                value={set.reps}
                                onChange={(e) => handleSetChange(i, setIdx, 'reps', e.target.value)}
                                placeholder="Reps"
                                className="input"
                            />
                            <input
                                type="number"
                                value={set.pausa}
                                onChange={(e) => handleSetChange(i, setIdx, 'pausa', e.target.value)}
                                placeholder="Pausa"
                                className="input"
                            />
                            <input
                                type="text"
                                value={set.carga}
                                onChange={(e) => handleSetChange(i, setIdx, 'carga', e.target.value)}
                                placeholder="Carga"
                                className="input"
                            />
                            <button
                                onClick={() => eliminarSet(i, setIdx)}
                                className="text-red-500"
                            >
                                ❌
                            </button>
                        </div>
                    ))}

                    <button onClick={() => agregarSet(i)} className="text-blue-600 text-sm">
                        ➕ Agregar set
                    </button>
                </div>
            ))}

            {mostrarSelector && (
                <div className="border p-4 rounded bg-gray-100 space-y-2">
                    <h3 className="font-bold">Seleccionar ejercicio para agregar</h3>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {ejerciciosDisponibles.map((e) => (
                            <li key={e.id} className="flex justify-between items-center border p-2 rounded bg-white">
                                <span>{e.nombre}</span>
                                <button
                                    onClick={() => agregarEjercicio(e)}
                                    className="text-blue-600 text-sm underline hover:opacity-80"
                                >
                                    ➕ Agregar
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="flex items-center gap-4">
                <button
                    onClick={cargarEjerciciosDisponibles}
                    className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
                >
                    ➕ Agregar ejercicio
                </button>

                <button
                    onClick={handleGuardar}
                    disabled={ejercicios.length === 0}
                    className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                >
                    ✅ Guardar cambios
                </button>
            </div>
        </div>
    );
};

export default EditarDia;
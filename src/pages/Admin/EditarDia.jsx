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
    const [asignacionOriginal, setAsignacionOriginal] = useState(null);
    const [rutinaPersonalizadaId, setRutinaPersonalizadaId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mostrarSelector, setMostrarSelector] = useState(false);
    const [ejerciciosDisponibles, setEjerciciosDisponibles] = useState([]);

    useEffect(() => {
        const cargarDatos = async () => {
            setLoading(true);

            const { data: asignacion, error } = await supabase
                .from('asignaciones')
                .select('id, rutina_base_id, rutina_personalizada_id')
                .eq('alumno_id', alumnoId)
                .eq('dia_semana', dia)
                .maybeSingle();

            if (error || !asignacion) {
                console.error("Asignación no encontrada", error);
                setLoading(false);
                return;
            }

            setAsignacionOriginal(asignacion);
            setRutinaPersonalizadaId(asignacion.rutina_personalizada_id);

            let ejerciciosFinales = [];

            if (asignacion.rutina_personalizada_id) {
                const { data: dataPers } = await supabase
                    .from('rutinas_personalizadas_ejercicios')
                    .select(`id, ejercicio_id, ejercicios(nombre), rutinas_personalizadas_series(id, nro_set, reps, pausa, carga)`)
                    .eq('rutina_personalizada_id', asignacion.rutina_personalizada_id)
                    .order('orden', { ascending: true });

                ejerciciosFinales = (dataPers || []).map(ej => ({
                    id: ej.id,
                    ejercicio_id: ej.ejercicio_id,
                    nombre: ej.ejercicios?.nombre || 'Sin nombre',
                    series: ej.rutinas_personalizadas_series || []
                }));

            } else if (asignacion.rutina_base_id) {
                const { data: ejerciciosBase } = await supabase
                    .from('rutinas_base_ejercicios')
                    .select('orden, ejercicio_id')
                    .eq('rutina_base_id', asignacion.rutina_base_id)
                    .order('orden', { ascending: true });

                ejerciciosFinales = await Promise.all(
                    ejerciciosBase.map(async (ej) => {
                        const { data: info } = await supabase
                            .from('ejercicios')
                            .select('nombre')
                            .eq('id', ej.ejercicio_id)
                            .maybeSingle();

                        const { data: seriesBase } = await supabase
                            .from('rutinas_base_series')
                            .select('nro_set, reps, pausa, carga_sugerida')
                            .eq('rutina_base_id', asignacion.rutina_base_id)
                            .eq('ejercicio_id', ej.ejercicio_id);

                        return {
                            ejercicio_id: ej.ejercicio_id,
                            nombre: info?.nombre || 'Desconocido',
                            series: (seriesBase || []).map((s, i) => ({
                                nro_set: i + 1,
                                reps: s.reps,
                                pausa: s.pausa,
                                carga: s.carga_sugerida
                            }))
                        };
                    })
                );
            }

            setEjercicios(ejerciciosFinales);
            setLoading(false);
        };

        cargarDatos();
    }, [alumnoId, dia]);

    const actualizarSerie = (indexEjercicio, indexSerie, campo, valor) => {
        setEjercicios(prev => {
            const nuevos = [...prev];
            nuevos[indexEjercicio].series[indexSerie][campo] = valor;
            return nuevos;
        });
    };

    const eliminarSerie = (indexEjercicio, indexSerie) => {
        setEjercicios(prev => {
            const nuevos = [...prev];
            nuevos[indexEjercicio].series.splice(indexSerie, 1);
            return nuevos;
        });
    };

    const agregarEjercicio = (ejercicio) => {
        setEjercicios((prev) => [
            ...prev,
            {
                id: null,
                ejercicio_id: ejercicio.id,
                nombre: ejercicio.nombre,
                series: [{ nro_set: 1, reps: '', pausa: '', carga: '' }]
            }
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

    const handleGuardar = async () => {
        let rutinaId = rutinaPersonalizadaId;

        if (!rutinaId && asignacionOriginal?.rutina_base_id) {
            const { data: nuevaRutina, error: errorInsert } = await supabase
                .from('rutinas_personalizadas')
                .insert({ alumno_id: alumnoId, nombre: `Rutina personalizada día ${dia}` })
                .select()
                .single();

            if (errorInsert) {
                alert("Error creando rutina personalizada");
                return;
            }

            rutinaId = nuevaRutina.id;
            setRutinaPersonalizadaId(rutinaId);

            await supabase
                .from('asignaciones')
                .update({ rutina_personalizada_id: rutinaId, rutina_base_id: null })
                .eq('id', asignacionOriginal.id);
        }

        await supabase.from('rutinas_personalizadas_series')
            .delete()
            .in('rutina_personalizada_ejercicio_id', ejercicios.map(e => e.id).filter(Boolean));

        await supabase.from('rutinas_personalizadas_ejercicios')
            .delete()
            .eq('rutina_personalizada_id', rutinaId);

        for (const [orden, ej] of ejercicios.entries()) {
            const { data: insertedEj, error: errEj } = await supabase
                .from('rutinas_personalizadas_ejercicios')
                .insert({ rutina_personalizada_id: rutinaId, ejercicio_id: ej.ejercicio_id, orden, dia_semana: dia })
                .select()
                .single();

            if (errEj) continue;

            const seriesAInsertar = ej.series.map((s, i) => ({
                rutina_personalizada_ejercicio_id: insertedEj.id,
                nro_set: i + 1,
                reps: Number(s.reps),
                pausa: Number(s.pausa),
                carga: s.carga
            }));

            await supabase.from('rutinas_personalizadas_series').insert(seriesAInsertar);
        }

        alert("Cambios guardados correctamente ✅");
        navigate(-1);
    };

    if (loading) return <p className="text-center mt-10">Cargando rutina...</p>;

    return (
        <div className="max-w-4xl mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Editar rutina del día {diasSemana[dia]}</h1>

            <ul className="space-y-4">
                {ejercicios.map((ej, indexEj) => (
                    <li key={indexEj} className="p-4 bg-gray-100 rounded shadow">
                        <div className="flex justify-between mb-2">
                            <p className="font-semibold">{ej.nombre}</p>
                            <button onClick={() => setEjercicios(prev => prev.filter((_, i) => i !== indexEj))} className="text-red-600 text-sm">Eliminar</button>
                        </div>
                        {ej.series.map((serie, indexSer) => (
                            <div key={indexSer} className="flex gap-2 mb-2 items-center">
                                <input
                                    type="number"
                                    className="w-20 px-2 py-1 border rounded"
                                    value={serie.reps}
                                    onChange={e => actualizarSerie(indexEj, indexSer, 'reps', parseInt(e.target.value))}
                                    placeholder="Reps"
                                />
                                <input
                                    type="number"
                                    className="w-20 px-2 py-1 border rounded"
                                    value={serie.pausa}
                                    onChange={e => actualizarSerie(indexEj, indexSer, 'pausa', parseInt(e.target.value))}
                                    placeholder="Pausa"
                                />
                                <input
                                    type="number"
                                    className="w-20 px-2 py-1 border rounded"
                                    value={serie.carga}
                                    onChange={e => actualizarSerie(indexEj, indexSer, 'carga', parseFloat(e.target.value))}
                                    placeholder="Carga"
                                />
                                <button onClick={() => eliminarSerie(indexEj, indexSer)} className="text-red-500 text-sm">❌</button>
                            </div>
                        ))}
                    </li>
                ))}
            </ul>

            {mostrarSelector && (
                <div className="mt-6 bg-gray-50 p-4 rounded shadow">
                    <h2 className="text-lg font-semibold mb-2">Seleccionar ejercicio</h2>
                    <ul className="space-y-2">
                        {ejerciciosDisponibles.map(ej => (
                            <li key={ej.id} className="flex justify-between items-center">
                                <span>{ej.nombre}</span>
                                <button onClick={() => agregarEjercicio(ej)} className="text-blue-600">Agregar</button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="mt-6 flex gap-4">
                <button onClick={cargarEjerciciosDisponibles} className="bg-yellow-500 text-white px-4 py-2 rounded">➕ Agregar ejercicio</button>
                <button onClick={handleGuardar} className="bg-blue-600 text-white px-4 py-2 rounded">Guardar cambios</button>
            </div>
        </div>
    );
};

export default EditarDia;
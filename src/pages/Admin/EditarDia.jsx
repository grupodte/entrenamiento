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

    // --- PASO 1: AÑADIMOS UN ESTADO PARA GUARDAR EL NOMBRE DE LA RUTINA BASE ---
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
                setTimeout(() => navigate(`/alumno/${alumnoId}`), 2000);
                return;
            }

            setAsignacionOriginal(asignacion);

            if (asignacion.rutina_personalizada_id) {
                setRutinaPersonalizadaId(asignacion.rutina_personalizada_id);
                const { data: ejerciciosDia } = await supabase
                    .from('rutinas_personalizadas_ejercicios')
                    .select('id, ejercicio_id, orden, series, reps, pausa, carga, ejercicios(nombre)')
                    .eq('rutina_personalizada_id', asignacion.rutina_personalizada_id)
                    .order('orden', { ascending: true });
                setEjercicios(ejerciciosDia || []);
            } else {
                // --- PASO 2: SI LA RUTINA NO ES PERSONALIZADA, BUSCAMOS EL NOMBRE DE LA RUTINA BASE ---
                if (asignacion.rutina_base_id) {
                    const { data: infoRutinaBase } = await supabase
                        .from('rutinas_base')
                        .select('nombre')
                        .eq('id', asignacion.rutina_base_id)
                        .single();

                    if (infoRutinaBase) {
                        setNombreRutinaBase(infoRutinaBase.nombre);
                    }
                }

                const { data: ejerciciosBase } = await supabase
                    .from('rutinas_base_ejercicios')
                    .select('*, ejercicios(nombre)')
                    .eq('rutina_base_id', asignacion.rutina_base_id)
                    .order('orden', { ascending: true });

                const ejerciciosParaEditar = ejerciciosBase.map(ej => ({
                    id: null,
                    ejercicio_id: ej.ejercicio_id,
                    ejercicios: ej.ejercicios,
                    orden: ej.orden,
                    series: ej.series,
                    reps: ej.reps,
                    pausa: ej.pausa,
                    carga: ej.carga_sugerida || '',
                }));
                setEjercicios(ejerciciosParaEditar);
            }
            setLoading(false);
        };

        inicializarVista().catch(err => {
            console.error(err);
            setLoading(false);
        });
    }, [alumnoId, dia, navigate]);

    const handleGuardar = async () => {
        setLoading(true);
        try {
            if (!rutinaPersonalizadaId) {
                // Si la rutina no era personalizada, la creamos ahora
                const { data: nuevaRutina, error: errorCrearRutina } = await supabase
                    .from('rutinas_personalizadas')
                    .insert({
                        alumno_id: alumnoId,
                        // --- PASO 3: USAMOS EL NOMBRE GUARDADO EN EL ESTADO ---
                        nombre: nombreRutinaBase || `Rutina Personalizada - ${diasSemana[dia]}`, // Usa el nombre de la base, o uno por defecto si falla
                        fecha_inicio: new Date().toISOString(),
                    })
                    .select('id')
                    .single();

                if (errorCrearRutina) throw errorCrearRutina;
                const newId = nuevaRutina.id;

                const ejerciciosParaInsertar = ejercicios.map((ej, index) => ({
                    rutina_personalizada_id: newId,
                    ejercicio_id: ej.ejercicio_id,
                    dia_semana: dia,
                    orden: index,
                    series: ej.series,
                    reps: ej.reps,
                    pausa: ej.pausa,
                    carga: ej.carga,
                }));

                await supabase.from('rutinas_personalizadas_ejercicios').insert(ejerciciosParaInsertar);
                await supabase.from('asignaciones').update({ rutina_personalizada_id: newId }).eq('id', asignacionOriginal.id);

            } else {
                // Si la rutina ya era personalizada, solo actualizamos los ejercicios existentes
                const updates = ejercicios
                    .filter(ej => ej.id)
                    .map(ej => supabase
                        .from('rutinas_personalizadas_ejercicios')
                        .update({ series: ej.series, reps: ej.reps, pausa: ej.pausa, carga: ej.carga })
                        .eq('id', ej.id)
                    );

                const inserts = ejercicios
                    .filter(ej => !ej.id)
                    .map((ej, i) => ({
                        rutina_personalizada_id: rutinaPersonalizadaId,
                        ejercicio_id: ej.ejercicio_id,
                        dia_semana: dia,
                        orden: ejercicios.length + i,
                        series: ej.series,
                        reps: ej.reps,
                        pausa: ej.pausa,
                        carga: ej.carga,
                    }));

                await Promise.all(updates);
                if (inserts.length > 0) {
                    await supabase.from('rutinas_personalizadas_ejercicios').insert(inserts);
                }
            }

            alert('✅ Día actualizado con éxito');
            navigate(`/alumno/${alumnoId}`);

        } catch (error) {
            console.error('Error al guardar los cambios:', error);
            alert(`❌ Ocurrió un error al guardar: ${error.message}`);
            setLoading(false);
        }
    };

    const handleChange = (index, campo, valor) => {
        const nuevos = [...ejercicios];
        nuevos[index][campo] = valor;
        setEjercicios(nuevos);
    };

    const agregarEjercicio = (ejercicio) => {
        setEjercicios((prev) => [
            ...prev,
            {
                id: null,
                ejercicio_id: ejercicio.id,
                ejercicios: { nombre: ejercicio.nombre },
                series: 3,
                reps: 10,
                pausa: 60,
                carga: '',
                orden: prev.length,
            },
        ]);
        setMostrarSelector(false);
    };

    const eliminarEjercicio = (index) => {
        setEjercicios((prev) => prev.filter((_, i) => i !== index));
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
    if (mensaje) return <p className="text-center mt-10">{mensaje}</p>

    return (
        <div className="max-w-3xl mx-auto mt-10 p-6 bg-white shadow rounded space-y-6">
            <h1 className="text-2xl font-bold mb-4">Editar rutina – {diasSemana[dia]}</h1>

            {ejercicios.map((ej, i) => (
                <div key={ej.ejercicio_id + '-' + i} className="border p-4 rounded shadow bg-gray-50">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold">{ej.ejercicios?.nombre || 'Ejercicio Nuevo'}</h3>
                        <button
                            onClick={() => eliminarEjercicio(i)}
                            className="text-red-500 text-sm underline hover:opacity-80"
                        >
                            🗑️ Eliminar
                        </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <input type="number" value={ej.series} onChange={(e) => handleChange(i, 'series', e.target.value)} className="input" placeholder="Series" />
                        <input type="number" value={ej.reps} onChange={(e) => handleChange(i, 'reps', e.target.value)} className="input" placeholder="Reps" />
                        <input type="number" value={ej.pausa} onChange={(e) => handleChange(i, 'pausa', e.target.value)} className="input" placeholder="Pausa" />
                        <input type="text" value={ej.carga} onChange={(e) => handleChange(i, 'carga', e.target.value)} className="input" placeholder="Carga" />
                    </div>
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

            <div className='flex items-center gap-4'>
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
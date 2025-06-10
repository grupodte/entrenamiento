import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const EditarDia = () => {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const dia = parseInt(searchParams.get('dia'), 10);
    const navigate = useNavigate();

    const [ejercicios, setEjercicios] = useState([]);
    const [rutinaId, setRutinaId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mostrarSelector, setMostrarSelector] = useState(false);
    const [ejerciciosDisponibles, setEjerciciosDisponibles] = useState([]);

    useEffect(() => {
        const fetchEjercicios = async () => {
            const { data: rutina, error: errorRutina } = await supabase
                .from('rutinas_personalizadas')
                .select('id')
                .eq('alumno_id', id)
                .order('fecha_inicio', { ascending: false })
                .limit(1)
                .single();

            if (errorRutina || !rutina) {
                console.error('❌ No se encontró rutina personalizada', errorRutina);
                setLoading(false);
                return;
            }

            setRutinaId(rutina.id);

            const { data: ejerciciosDia, error } = await supabase
                .from('rutinas_personalizadas_ejercicios')
                .select('id, ejercicio_id, orden, series, reps, pausa, carga, ejercicios (nombre)')
                .eq('rutina_personalizada_id', rutina.id)
                .eq('dia_semana', dia)
                .order('orden', { ascending: true });

            if (error) {
                console.error("❌ Error al obtener ejercicios:", error);
            }

            setEjercicios(ejerciciosDia || []);
            setLoading(false);
        };

        fetchEjercicios();
    }, [id, dia]);

    const handleChange = (index, campo, valor) => {
        const nuevos = [...ejercicios];
        nuevos[index][campo] = valor;
        setEjercicios(nuevos);
    };

    const handleGuardar = async () => {
        for (const ej of ejercicios) {
            if (ej.id) {
                await supabase
                    .from('rutinas_personalizadas_ejercicios')
                    .update({
                        series: ej.series,
                        reps: ej.reps,
                        pausa: ej.pausa,
                        carga: ej.carga,
                    })
                    .eq('id', ej.id);
            } else {
                await supabase
                    .from('rutinas_personalizadas_ejercicios')
                    .insert({
                        rutina_personalizada_id: rutinaId,
                        ejercicio_id: ej.ejercicio_id,
                        dia_semana: dia,
                        orden: ej.orden,
                        series: ej.series,
                        reps: ej.reps,
                        pausa: ej.pausa,
                        carga: ej.carga,
                    });
            }
        }

        alert('✅ Día actualizado con éxito');
        navigate(`/alumno/${id}`);
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

    const eliminarEjercicio = async (index) => {
        const ejercicio = ejercicios[index];
        if (ejercicio.id) {
            const { error } = await supabase
                .from('rutinas_personalizadas_ejercicios')
                .delete()
                .eq('id', ejercicio.id);
            if (error) {
                alert('❌ Error al eliminar ejercicio');
                return;
            }
        }
        setEjercicios((prev) => prev.filter((_, i) => i !== index));
    };

    if (loading) return <p className="text-center mt-10">Cargando ejercicios del día...</p>;

    return (
        <div className="max-w-3xl mx-auto mt-10 p-6 bg-white shadow rounded space-y-6">
            <h1 className="text-2xl font-bold mb-4">Editar rutina – Día {diasSemana[dia]}</h1>

            {ejercicios.length === 0 ? (
                <p className="text-gray-600">Este día no tiene ejercicios asignados aún.</p>
            ) : (
                ejercicios.map((ej, i) => (
                    <div key={`${ej.id ?? 'nuevo'}-${i}`} className="border p-4 rounded shadow bg-gray-50">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-semibold">{ej.ejercicios?.nombre || 'Ejercicio'}</h3>
                            <button
                                onClick={() => eliminarEjercicio(i)}
                                className="text-red-500 text-sm underline hover:opacity-80"
                            >
                                🗑️ Eliminar
                            </button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <input
                                type="number"
                                value={ej.series}
                                onChange={(e) => handleChange(i, 'series', e.target.value)}
                                className="input"
                                placeholder="Series"
                            />
                            <input
                                type="number"
                                value={ej.reps}
                                onChange={(e) => handleChange(i, 'reps', e.target.value)}
                                className="input"
                                placeholder="Reps"
                            />
                            <input
                                type="number"
                                value={ej.pausa}
                                onChange={(e) => handleChange(i, 'pausa', e.target.value)}
                                className="input"
                                placeholder="Pausa"
                            />
                            <input
                                type="text"
                                value={ej.carga}
                                onChange={(e) => handleChange(i, 'carga', e.target.value)}
                                className="input"
                                placeholder="Carga"
                            />
                        </div>
                    </div>
                ))
            )}

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
    );
};

export default EditarDia;

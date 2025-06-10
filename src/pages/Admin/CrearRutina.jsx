// src/pages/CrearRutina.jsx
import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import AdminLayout from './AdminLayout';

const CrearRutina = () => {
    const { state } = useLocation();
    const navigate = useNavigate();
    const [nombre, setNombre] = useState(state?.nombre || '');
    const [tipo, setTipo] = useState(state?.tipo || '');
    const [descripcion, setDescripcion] = useState(state?.descripcion || '');
    const [ejercicios, setEjercicios] = useState(
        state?.ejerciciosSeleccionados?.map((ej) => ({
            id: ej.id,
            nombre: ej.nombre,
            series_personalizadas: [{ reps: '', pausa: '', carga: '' }],
        })) || []
    );

    const handleEjercicioChange = (index, campo, valor) => {
        const nuevos = [...ejercicios];
        nuevos[index][campo] = valor;
        setEjercicios(nuevos);
    };

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

    const guardarRutina = async () => {
        try {
            // Crear rutina base
            const { data: rutina, error: errorRutina } = await supabase
                .from('rutinas_base')
                .insert({ nombre, tipo, descripcion })
                .select()
                .single();

            if (errorRutina || !rutina?.id) throw new Error('Error al crear rutina');

            // Validar que todos los ejercicios tengan ID
            for (const e of ejercicios) {
                if (!e.id) {
                    console.error('Ejercicio sin ID:', e);
                    throw new Error('Uno de los ejercicios seleccionados no tiene ID.');
                }
            }

            // Insertar ejercicios en rutinas_base_ejercicios
            const ejerciciosConRutina = ejercicios.map((e, i) => ({
                rutina_base_id: rutina.id,
                ejercicio_id: e.id,
                orden: i,
                semana_inicio: 1,
                semana_fin: 4,
            }));

            console.log('Ejercicios a insertar:', ejerciciosConRutina);

            const { data: ejerciciosGuardados, error: errorEj } = await supabase
                .from('rutinas_base_ejercicios')
                .insert(ejerciciosConRutina)
                .select('rutina_base_id, ejercicio_id');

            console.log('Respuesta de Supabase:', ejerciciosGuardados);
            console.error('Error Supabase:', errorEj);

            if (errorEj || !ejerciciosGuardados?.length) {
                console.error('Error guardando ejercicios:', errorEj);
                throw new Error('No se pudieron guardar los ejercicios');
            }

            // Insertar series personalizadas
            const seriesAInsertar = [];

            ejerciciosGuardados.forEach((ej) => {
                const ejOriginal = ejercicios.find((e) => e.id === ej.ejercicio_id);
                if (!ejOriginal) return;

                ejOriginal.series_personalizadas?.forEach((set, i) => {
                    seriesAInsertar.push({
                        rutina_base_id: rutina.id,
                        ejercicio_id: ej.ejercicio_id,
                        nro_set: i + 1,
                        reps: Number(set.reps),
                        pausa: Number(set.pausa),
                        carga_sugerida: set.carga || '',
                    });
                });
            });

            if (seriesAInsertar.length === 0) {
                console.warn('No se encontró ninguna serie para insertar');
            } else {
                const { error: errorSeries } = await supabase
                    .from('rutinas_base_series')
                    .insert(seriesAInsertar);

                if (errorSeries) {
                    console.error('Error guardando series:', errorSeries);
                    throw new Error('No se pudieron guardar las series');
                }
            }

            alert('✅ Rutina guardada con éxito');
            navigate('/admin');
        } catch (err) {
            console.error('Error en guardarRutina:', err);
            alert(err.message || 'Error desconocido al guardar rutina');
        }
    };

    const irASeleccionarEjercicios = () => {
        navigate('/admin/ejercicios/seleccionar', {
            state: {
                nombre,
                tipo,
                descripcion,
                ejerciciosSeleccionados: ejercicios,
            },
        });
    };

    return (
        <AdminLayout>
            <div className="max-w-4xl mx-auto p-6 bg-white rounded shadow mt-8 space-y-6">
                <h1 className="text-2xl font-bold">Crear nueva rutina</h1>

                <input
                    type="text"
                    placeholder="Nombre de la rutina"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="input w-full"
                />
                <input
                    type="text"
                    placeholder="Tipo (opcional)"
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                    className="input w-full"
                />
                <textarea
                    placeholder="Descripción (opcional)"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    className="input w-full"
                />

                <button
                    onClick={irASeleccionarEjercicios}
                    className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
                >
                    ➕ Agregar ejercicios
                </button>

                <div className="space-y-6">
                    {ejercicios.map((ej, index) => (
                        <div key={ej.id} className="border p-4 rounded shadow">
                            <h3 className="font-semibold mb-2">{ej.nombre || `Ejercicio ID: ${ej.id}`}</h3>

                            {ej.series_personalizadas.map((set, setIndex) => (
                                <div key={setIndex} className="grid grid-cols-4 gap-2 mb-2">
                                    <input
                                        type="number"
                                        value={set.reps}
                                        onChange={(e) => handleSetChange(index, setIndex, 'reps', e.target.value)}
                                        placeholder="Reps"
                                        className="input"
                                    />
                                    <input
                                        type="number"
                                        value={set.pausa}
                                        onChange={(e) => handleSetChange(index, setIndex, 'pausa', e.target.value)}
                                        placeholder="Pausa"
                                        className="input"
                                    />
                                    <input
                                        type="text"
                                        value={set.carga}
                                        onChange={(e) => handleSetChange(index, setIndex, 'carga', e.target.value)}
                                        placeholder="Carga"
                                        className="input"
                                    />
                                    <button
                                        onClick={() => eliminarSet(index, setIndex)}
                                        className="text-red-500"
                                    >
                                        ❌
                                    </button>
                                </div>
                            ))}

                            <button
                                onClick={() => agregarSet(index)}
                                className="text-sm text-blue-600"
                            >
                                ➕ Agregar set
                            </button>
                        </div>
                    ))}
                </div>

                {ejercicios.length > 0 && (
                    <button
                        onClick={guardarRutina}
                        className="mt-4 bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
                    >
                        ✅ Guardar rutina
                    </button>
                )}
            </div>
        </AdminLayout>
    );
};

export default CrearRutina;

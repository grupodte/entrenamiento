// src/pages/CrearRutina.jsx
import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import AdminLayout from '../../layouts/AdminLayout';

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
            console.log('--- INICIANDO PROCESO DE GUARDADO DE RUTINA ---');

            // 1. Crear la rutina base
            const { data: rutina, error: errorRutina } = await supabase
                .from('rutinas_base')
                .insert({ nombre, tipo, descripcion })
                .select()
                .single();

            if (errorRutina || !rutina?.id) throw new Error('Error al crear la rutina base');
            console.log('✅ PASO 1: Rutina base creada con ID:', rutina.id);

            // 2. Preparar los ejercicios
            const ejerciciosParaInsertar = ejercicios.map((e, i) => ({
                rutina_base_id: rutina.id,
                ejercicio_id: e.id,
                orden: i,
            }));
            console.log('PASO 2: Objeto preparado para insertar en rutinas_base_ejercicios:', ejerciciosParaInsertar);


            // 3. Insertar los ejercicios y obtener sus IDs únicos
            const { data: ejerciciosGuardados, error: errorEj } = await supabase
                .from('rutinas_base_ejercicios')
                .insert(ejerciciosParaInsertar)
                .select();

            if (errorEj) throw new Error(`Error en Supabase al guardar ejercicios: ${errorEj.message}`);
            console.log('✅ PASO 3: Respuesta de Supabase (ejerciciosGuardados):', ejerciciosGuardados);


            // 4. Preparar las series, el paso más crítico
            console.log('--- INICIANDO PASO 4: Preparación de series ---');
            const seriesAInsertar = [];
            ejercicios.forEach((ejercicioLocal, index) => {
                console.log(`\nIteración ${index} del bucle de ejercicios...`);
                console.log('Buscando coincidencia para el ejercicio local:', ejercicioLocal);

                const ejercicioGuardado = ejerciciosGuardados.find(
                    eg => eg.ejercicio_id === ejercicioLocal.id
                );

                console.log('Resultado de la búsqueda (ejercicioGuardado):', ejercicioGuardado);

                if (!ejercicioGuardado) {
                    console.warn('¡ADVERTENCIA! No se encontró el ejercicio guardado correspondiente. Se saltarán sus series.');
                    return;
                }

                ejercicioLocal.series_personalizadas?.forEach((set, i) => {
                    seriesAInsertar.push({
                        nro_set: i + 1,
                        reps: Number(set.reps) || 0,
                        pausa: Number(set.pausa) || 0,
                        carga_sugerida: set.carga || '',
                        rutinas_base_ejercicio_id: ejercicioGuardado.id
                    });
                });
            });

            console.log('✅ PASO 4: Array final de series a insertar:', seriesAInsertar);


            // 5. Insertar todas las series
            if (seriesAInsertar.length > 0) {
                console.log('--- INICIANDO PASO 5: Insertando series en la BD ---');
                const { error: errorSeries } = await supabase
                    .from('rutinas_base_series')
                    .insert(seriesAInsertar);

                if (errorSeries) throw new Error(`Error en Supabase al guardar series: ${errorSeries.message}`);
                console.log('✅ PASO 5: Series insertadas con éxito.');
            } else {
                console.warn('ADVERTENCIA: No hay series para insertar. El proceso terminará aquí.');
            }

            alert('✅ Rutina guardada con éxito');
            navigate('/admin');
        } catch (err) {
            console.error('❌ ERROR FATAL en guardarRutina:', err);
            alert(err.message || 'Error desconocido al guardar la rutina');
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

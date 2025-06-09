// src/pages/CrearRutina.jsx
import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const CrearRutina = () => {
    const { state } = useLocation();
    const navigate = useNavigate();
    const [nombre, setNombre] = useState(state?.nombre || '');
    const [tipo, setTipo] = useState(state?.tipo || '');
    const [descripcion, setDescripcion] = useState(state?.descripcion || '');
    const [ejercicios, setEjercicios] = useState(state?.ejerciciosSeleccionados || []);

    const handleEjercicioChange = (index, campo, valor) => {
        const nuevos = [...ejercicios];
        nuevos[index][campo] = valor;
        setEjercicios(nuevos);
    };

    const guardarRutina = async () => {
        const { data: rutina, error: errorRutina } = await supabase
            .from('rutinas_base')
            .insert({ nombre, tipo, descripcion })
            .select()
            .single();

        if (errorRutina) return alert('Error al crear rutina');

        const ejerciciosConRutina = ejercicios.map((e, i) => ({
            rutina_base_id: rutina.id,
            ejercicio_id: e.id,
            orden: i,
            semana_inicio: 1,
            semana_fin: 4,
            series: Number(e.series) || 0,
            reps: Number(e.reps) || 0,
            pausa: Number(e.pausa) || 0,
            carga_sugerida: e.carga || ''
        }));
          

        const { error: errorEj } = await supabase
            .from('rutinas_base_ejercicios')
            .insert(ejerciciosConRutina);

        if (errorEj) return alert('Error al guardar ejercicios');

        alert('✅ Rutina guardada con éxito');
        navigate('/admin');
    };

    const irASeleccionarEjercicios = () => {
        navigate('/seleccionar-ejercicios', {
            state: {
                nombre,
                tipo,
                descripcion,
                ejerciciosSeleccionados: ejercicios
            }
        });
    };

    return (
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

            <div className="space-y-4">
                {ejercicios.map((ej, index) => (
                    <div key={ej.id} className="border p-4 rounded shadow">
                        <h3 className="font-semibold mb-2">{ej.nombre || `Ejercicio ID: ${ej.id}`}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <input
                                type="number"
                                value={ej.series}
                                onChange={(e) => handleEjercicioChange(index, 'series', e.target.value)}
                                className="input"
                                placeholder="Series"
                            />
                            <input
                                type="number"
                                value={ej.reps}
                                onChange={(e) => handleEjercicioChange(index, 'reps', e.target.value)}
                                className="input"
                                placeholder="Reps"
                            />
                            <input
                                type="number"
                                value={ej.pausa}
                                onChange={(e) => handleEjercicioChange(index, 'pausa', e.target.value)}
                                className="input"
                                placeholder="Pausa"
                            />
                            <input
                                type="text"
                                value={ej.carga}
                                onChange={(e) => handleEjercicioChange(index, 'carga', e.target.value)}
                                className="input"
                                placeholder="Carga"
                            />
                        </div>
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
    );
};

export default CrearRutina;

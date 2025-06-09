// src/pages/EditarRutinaPersonalizada.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { FaArrowLeft } from 'react-icons/fa';

const EditarRutinaPersonalizada = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [rutina, setRutina] = useState(null);
    const [ejercicios, setEjercicios] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRutina = async () => {
            const { data: rutinaData } = await supabase
                .from('rutinas_personalizadas')
                .select('*')
                .eq('id', id)
                .single();

            setRutina(rutinaData);

            const { data: ejerciciosData } = await supabase
                .from('rutinas_personalizadas_ejercicios')
                .select('id, ejercicio_id, orden, dia_semana, series, repeticiones, pausa, carga, ejercicios (nombre, descripcion)')
                .eq('rutina_personalizada_id', id)
                .order('orden', { ascending: true });

            setEjercicios(ejerciciosData);
            setLoading(false);
        };

        fetchRutina();
    }, [id]);

    const handleChange = (index, field, value) => {
        setEjercicios((prev) => {
            const updated = [...prev];
            updated[index][field] = value;
            return updated;
        });
    };

    const guardarCambios = async () => {
        for (const ej of ejercicios) {
            await supabase
                .from('rutinas_personalizadas_ejercicios')
                .update({
                    series: ej.series,
                    repeticiones: ej.repeticiones,
                    pausa: ej.pausa,
                    carga: ej.carga,
                    dia_semana: ej.dia_semana
                })
                .eq('id', ej.id);
        }
        alert('✅ Cambios guardados.');
    };

    if (loading) return <p className="p-6">Cargando rutina personalizada...</p>;

    return (
        <div className="max-w-3xl mx-auto p-6 bg-white rounded shadow mt-8">
            <button onClick={() => navigate(-1)} className="text-blue-600 flex items-center mb-4 hover:underline">
                <FaArrowLeft className="mr-2" /> Volver
            </button>
            <h1 className="text-2xl font-bold mb-6">Editar Rutina: {rutina?.nombre}</h1>
            <div className="space-y-6">
                {ejercicios.map((ej, i) => (
                    <div key={ej.id} className="border-b pb-4">
                        <h2 className="font-semibold">{i + 1}. {ej.ejercicios?.nombre}</h2>
                        <p className="text-sm text-gray-600 mb-2">{ej.ejercicios?.descripcion}</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm">Series</label>
                                <input type="number" value={ej.series} onChange={(e) => handleChange(i, 'series', e.target.value)} className="input" />
                            </div>
                            <div>
                                <label className="block text-sm">Reps</label>
                                <input type="number" value={ej.repeticiones} onChange={(e) => handleChange(i, 'repeticiones', e.target.value)} className="input" />
                            </div>
                            <div>
                                <label className="block text-sm">Pausa</label>
                                <input type="text" value={ej.pausa} onChange={(e) => handleChange(i, 'pausa', e.target.value)} className="input" />
                            </div>
                            <div>
                                <label className="block text-sm">Carga</label>
                                <input type="text" value={ej.carga} onChange={(e) => handleChange(i, 'carga', e.target.value)} className="input" />
                            </div>
                            <div>
                                <label className="block text-sm">Día (0=lun)</label>
                                <input type="number" min="0" max="6" value={ej.dia_semana} onChange={(e) => handleChange(i, 'dia_semana', e.target.value)} className="input" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <button onClick={guardarCambios} className="mt-6 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                💾 Guardar cambios
            </button>
        </div>
    );
};

export default EditarRutinaPersonalizada;

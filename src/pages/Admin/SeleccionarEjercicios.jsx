// src/pages/SeleccionarEjercicios.jsx
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import AdminLayout from './AdminLayout';


const SeleccionarEjercicios = () => {
    const { state } = useLocation();
    const navigate = useNavigate();
    const [ejercicios, setEjercicios] = useState([]);
    const [seleccionados, setSeleccionados] = useState(new Set());
    const [busqueda, setBusqueda] = useState('');

    useEffect(() => {
        const fetchEjercicios = async () => {
            const { data, error } = await supabase.from('ejercicios').select('*');
            if (!error) {
                const idsPrevios = new Set(state?.ejerciciosSeleccionados?.map((e) => e.id) || []);
                const filtrados = data.filter((ej) => !idsPrevios.has(ej.id));
                setEjercicios(filtrados);
            }
        };
        fetchEjercicios();
    }, [state]);

    const toggleSeleccion = (id) => {
        const copia = new Set(seleccionados);
        if (copia.has(id)) {
            copia.delete(id);
        } else {
            copia.add(id);
        }
        setSeleccionados(copia);
    };

    const handleAgregar = () => {
        const nuevosSeleccionados = Array.from(seleccionados).map((id) => {
            const ejercicio = ejercicios.find((e) => e.id === id);
            return {
                id,
                nombre: ejercicio?.nombre || '',
                series: 3,
                reps: 10,
                pausa: 60,
                carga: ''
            };
        });

        const yaSeleccionados = state?.ejerciciosSeleccionados || [];

        navigate('/crear-rutina', {
            state: {
                ...state,
                ejerciciosSeleccionados: [...yaSeleccionados, ...nuevosSeleccionados]
            }
        });
    };

    const ejerciciosFiltrados = ejercicios.filter((ej) =>
        ej.nombre.toLowerCase().includes(busqueda.toLowerCase())
    );

    return (
        <AdminLayout>
        <div className="max-w-5xl mx-auto p-6 bg-white rounded shadow mt-8">
            <h1 className="text-2xl font-bold mb-6">Seleccionar ejercicios</h1>

            <input
                type="text"
                placeholder="Buscar ejercicio..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="mb-6 w-full border px-4 py-2 rounded shadow"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ejerciciosFiltrados.map((ej) => (
                    <div
                        key={ej.id}
                        className={`border p-4 rounded shadow cursor-pointer ${seleccionados.has(ej.id) ? 'bg-yellow-100' : ''}`}
                        onClick={() => toggleSeleccion(ej.id)}
                    >
                        <h3 className="font-semibold text-lg">{ej.nombre}</h3>
                    </div>
                ))}
            </div>

            {seleccionados.size > 0 && (
                <div className="mt-6 text-right">
                    <button
                        onClick={handleAgregar}
                        className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
                    >
                        ➕ Agregar ejercicios ({seleccionados.size})
                    </button>
                </div>
            )}
        </div>
        </AdminLayout>
    );
};

export default SeleccionarEjercicios;

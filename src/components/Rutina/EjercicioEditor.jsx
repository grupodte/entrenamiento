// src/componentes/Rutina/EjercicioEditor.jsx
import React from 'react';
import SeriesInput from './SeriesInput';
import { Trash2, PlusCircle } from 'lucide-react';

const EjercicioEditor = ({ ejercicio, onChange, onRemove }) => {
    const actualizarSerie = (index, nuevaSerie) => {
        const nuevasSeries = [...ejercicio.series];
        nuevasSeries[index] = nuevaSerie;
        onChange({ ...ejercicio, series: nuevasSeries });
    };

    const agregarSerie = () => {
        const nuevasSeries = [...ejercicio.series, { reps: '', pausa: '', carga: '' }];
        onChange({ ...ejercicio, series: nuevasSeries });
    };

    return (
        <div className="bg-gradient-to-tr from-white/5 to-white/10 p-5 rounded-2xl border border-white/10 shadow-inner hover:shadow-lg transition-all duration-300">
            {/* Encabezado del ejercicio */}
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-white tracking-wide">{ejercicio.nombre}</h3>
                <button
                    onClick={onRemove}
                    className="flex items-center gap-1 text-sm text-red-400 hover:text-red-500 transition"
                >
                    <Trash2 size={16} /> Eliminar
                </button>
            </div>

            {/* Series */}
            <div className="space-y-2">
                {ejercicio.series.map((serie, index) => (
                    <SeriesInput
                        key={index}
                        serie={serie}
                        index={index}
                        onChange={actualizarSerie}
                    />
                ))}
            </div>

            {/* Botón de agregar set */}
            <div className="mt-4">
                <button
                    onClick={agregarSerie}
                    className="flex items-center gap-2 text-sm text-sky-400 hover:text-sky-300 font-medium transition"
                >
                    <PlusCircle size={18} /> Agregar serie
                </button>
            </div>
        </div>
    );
};

export default EjercicioEditor;

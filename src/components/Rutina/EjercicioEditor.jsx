// src/componentes/Rutina/EjercicioEditor.jsx
import React from 'react';
import SeriesInput from './SeriesInput';

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
        <div className="bg-white/10 p-3 rounded-xl space-y-3 border border-white/10">
            <div className="flex justify-between items-center">
                <div className="font-semibold text-white">{ejercicio.nombre}</div>
                <button
                    onClick={onRemove}
                    className="text-red-400 hover:text-red-600 text-sm"
                >
                    🗑️ Eliminar ejercicio
                </button>
            </div>

            {/* Series */}
            {ejercicio.series.map((serie, index) => (
                <SeriesInput
                    key={index}
                    serie={serie}
                    index={index}
                    onChange={actualizarSerie}
                />
            ))}

            <button
                onClick={agregarSerie}
                className="text-sm text-skyblue hover:underline"
            >
                ➕ Agregar set
            </button>
        </div>
    );
};

export default EjercicioEditor;

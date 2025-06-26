// src/components/Rutina/SharedSeriesEditor.jsx
import React from 'react';
import SeriesInput from './SeriesInput'; // Reusing SeriesInput

const SharedSeriesEditor = ({ sharedSeries, onSharedSeriesChange }) => {
    const actualizarSerieCompartida = (index, nuevaSerie) => {
        const nuevasSeries = [...sharedSeries];
        nuevasSeries[index] = nuevaSerie;
        onSharedSeriesChange(nuevasSeries);
    };

    const agregarSerieCompartida = () => {
        onSharedSeriesChange([...sharedSeries, { reps: '', pausa: '', carga: '' }]);
    };

    const eliminarSerieCompartida = (index) => {
        const nuevasSeries = sharedSeries.filter((_, i) => i !== index);
        onSharedSeriesChange(nuevasSeries);
    };

    if (!sharedSeries) {
        return (
            <div className="text-sm text-white/50 p-3 bg-white/5 rounded-lg">
                No hay series compartidas definidas. Agregue una para configurar este subbloque.
            </div>
        );
    }

    return (
        <div className="space-y-3 p-3 bg-white/5 rounded-lg">
            <h4 className="text-sm font-semibold text-white/80">Series Compartidas para este Subbloque:</h4>
            {sharedSeries.map((serie, index) => (
                <div key={index} className="flex items-center gap-2">
                    <SeriesInput
                        serie={serie}
                        index={index}
                        onChange={actualizarSerieCompartida}
                    // Pass a prop to SeriesInput if it needs to behave differently for shared series,
                    // e.g., different placeholders or additional fields (week_start, week_end)
                    // For now, assuming SeriesInput is directly reusable.
                    />
                    <button
                        onClick={() => eliminarSerieCompartida(index)}
                        className="text-red-400 hover:text-red-600 text-xs"
                        title="Eliminar serie compartida"
                    >
                        X
                    </button>
                </div>
            ))}
            <button
                onClick={agregarSerieCompartida}
                className="hover:text-sky-300 text-sm font-medium"
            >
                + Agregar Set Compartido
            </button>
        </div>
    );
};

export default SharedSeriesEditor;

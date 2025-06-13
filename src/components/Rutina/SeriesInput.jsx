// src/componentes/Rutina/SeriesInput.jsx
import React from 'react';

const SeriesInput = ({ serie, index, onChange }) => {
    return (
        <div className="grid grid-cols-4 gap-2 text-white">
            <input
                value={serie.reps}
                onChange={(e) => onChange(index, { ...serie, reps: e.target.value })}
                placeholder="Reps"
                className="rounded bg-white/10 px-2 py-1"
            />
            <input
                value={serie.pausa}
                onChange={(e) => onChange(index, { ...serie, pausa: e.target.value })}
                placeholder="Pausa"
                className="rounded bg-white/10 px-2 py-1"
            />
            <input
                value={serie.carga}
                onChange={(e) => onChange(index, { ...serie, carga: e.target.value })}
                placeholder="Carga"
                className="rounded bg-white/10 px-2 py-1"
            />
            <span className="text-xs text-white/50 self-center">Set {index + 1}</span>
        </div>
    );
};

export default SeriesInput;




import React from 'react';
import SubBloqueDisplay from './SubBloqueDisplay';

const BloqueDisplay = (props) => { // Passthrough de todas las props necesarias
    const { bloque } = props;

    // Función de ordenamiento de sub-bloques (puede ser pasada como prop si es más compleja o varía)
    const sortSubBloques = (a, b) => {
        const prioridad = (nombre = "") => {
            nombre = nombre.toLowerCase();
            if (nombre.includes("calentamiento")) return 0;
            if (nombre.includes("principal")) return 1;
            if (nombre.includes("cooldown")) return 2;
            if (nombre.includes("estiramiento")) return 3;
            return 4;
        };
        return prioridad(a.nombre) - prioridad(b.nombre);
    };

    return (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 sm:p-4 shadow-lg space-y-3 sm:space-y-4">
            <h2 className="text-lg sm:text-xl font-semibold text-sky-400">Bloque {bloque.orden + 1}</h2>

            {[...(bloque.subbloques ?? [])]
                .sort(sortSubBloques)
                .map(subbloque => (
                    <SubBloqueDisplay
                        key={subbloque.id}
                        subbloque={subbloque}
                        {...props} // Pasa todas las props hacia abajo
                    />
                ))}
        </div>
    );
};

export default BloqueDisplay;

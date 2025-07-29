import React from 'react';
import SubBloqueDisplay from './SubBloqueDisplay';

const BloqueDisplay = (props) => {
    const { bloque } = props;

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
        <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-4 shadow-md">
            <h2 className="text-lg font-bold text-cyan-300 mb-4">Bloque {bloque.orden + 1}</h2>
            <div className="relative space-y-4">
                 {/* Línea de tiempo visual */}
                <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gray-700"></div>
                {[...(bloque.subbloques ?? [])]
                    .sort(sortSubBloques)
                    .map(subbloque => (
                        <SubBloqueDisplay
                            key={subbloque.id}
                            subbloque={subbloque}
                            {...props}
                        />
                    ))}
            </div>
        </div>
    );
};

export default BloqueDisplay;

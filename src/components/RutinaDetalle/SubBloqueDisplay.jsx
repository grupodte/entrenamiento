import React from 'react';
import EjercicioSimpleDisplay from './EjercicioSimpleDisplay';
import SupersetDisplay from './SupersetDisplay';

const SubBloqueDisplay = (props) => { // Passthrough de todas las props necesarias
    const { subbloque } = props;

    return (
        <div className="border-t border-slate-700 pt-3 sm:pt-4 first:pt-0 first:border-none">
            <h3 className={`text-base sm:text-lg font-bold px-2 sm:px-3 py-1.5 sm:py-2 rounded-t-md ${subbloque.tipo === "superset" ? "bg-purple-700/80" : "bg-sky-700/80"} text-white`}>
                {subbloque.nombre || "Sub-bloque"}
                <span className="text-xs font-normal text-white/70 ml-1.5">({subbloque.tipo})</span>
            </h3>

            {subbloque.tipo === "superset" && (
                <p className="text-[0.65rem] sm:text-xs italic text-purple-300 mb-2 px-2 sm:px-3 bg-purple-700/40 py-1 rounded-b-md">
                    Ejercicios consecutivos por serie. Pausa después de cada serie del superset.
                </p>
            )}

            <div className="space-y-2.5 sm:space-y-3 mt-1.5 sm:mt-2">
                {subbloque.tipo === 'simple' && subbloque.subbloques_ejercicios?.map(sbe => (
                    <EjercicioSimpleDisplay
                        key={sbe.id}
                        sbe={sbe}
                        subbloqueId={subbloque.id}
                        {...props} // Pasa el resto de las props
                    />
                ))}

                {subbloque.tipo === 'superset' && (
                    <SupersetDisplay
                        // key={subbloque.id} // El key ya está en el map que llama a SubBloqueDisplay
                        subbloque={subbloque} // Pasa el subbloque completo
                        {...props} // Pasa el resto de las props
                    />
                )}
            </div>
        </div>
    );
};

export default SubBloqueDisplay;

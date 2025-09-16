import React from 'react';
import BloqueDisplay from "./BloqueDisplay";
// Se eliminaron 'EntrenamientoCompletado' y 'motion'

const RutinaContent = ({
    rutinaBloques,
    elementosCompletados,
    elementoActivoId,
    toggleElementoCompletado,
    elementoRefs,
    lastSessionData,
    progressPorSubBloque,
    openVideoPanel
}) => {
    // Objeto de props para pasar a los hijos
    const displayProps = {
        elementosCompletados,
        elementoActivoId,
        toggleElementoCompletado,
        elementoRefs,
        lastSessionData,
        progressPorSubBloque,
        openVideoPanel
    };

    return (
        <main className="px-1 pt-4 space-y-2">
            {rutinaBloques?.map(bloque => (
                <BloqueDisplay key={bloque.id} bloque={bloque} {...displayProps} />
            ))}
        </main>
    );
};

export default RutinaContent;
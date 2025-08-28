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
        <main className="py-10 space-y-4 pb-20  ">
            {rutinaBloques?.map(bloque => (
                <BloqueDisplay key={bloque.id} bloque={bloque} {...displayProps} />
            ))}
        </main>
    );
};

export default RutinaContent;
import React from 'react';
import { useDroppable } from '@dnd-kit/core';

const DiaCard = ({ index, dia, diaInfo, id }) => {
    const { isOver, setNodeRef } = useDroppable({ id });

    const tieneAsignacion = !!diaInfo;
    const esPersonalizada = tieneAsignacion && !!diaInfo.asignacion.rutina_personalizada_id;
    const esBase = tieneAsignacion && !!diaInfo.asignacion.rutina_base_id;

    const nombreRutina =
        esPersonalizada
            ? diaInfo.asignacion.rutina_personalizada?.nombre
            : esBase
                ? diaInfo.asignacion.rutina_base?.nombre
                : null;

    const cardBgClass = isOver
        ? 'bg-blue-100 border-blue-300'
        : esPersonalizada
            ? 'bg-purple-50 border-purple-200'
            : esBase
                ? 'bg-green-50 border-green-200'
                : 'bg-gray-50 border-gray-200';

    const labelTipo = esPersonalizada
        ? '⭐ Personalizada'
        : esBase
            ? '📘 Base'
            : null;

    return (
        <div
            ref={setNodeRef}
            className={`border rounded p-4 transition-all duration-300 hover:shadow-md ${cardBgClass}`}
        >
            <h3 className="font-bold mb-2">{dia}</h3>

            {tieneAsignacion ? (
                <>
                    {labelTipo && (
                        <span className="text-xs font-semibold bg-white/50 px-2 py-1 rounded-full text-gray-700 mb-2 inline-block">
                            {labelTipo}
                        </span>
                    )}
                    <p className="text-sm text-gray-700 mt-1">
                        ✔ Rutina: <span className="font-medium">{nombreRutina || 'Sin nombre'}</span>
                    </p>
                </>
            ) : (
                <p className="text-sm text-gray-500">Sin rutina asignada</p>
            )}

            <p className="mt-4 text-xs text-gray-400">
                Arrastrá una rutina base para asignarla
            </p>
        </div>
    );
};

export default DiaCard;

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

const DiaCard = ({ index, dia, diaInfo, id, onAsignacionEliminada }) => {
    const { isOver, setNodeRef } = useDroppable({ id });
    const navigate = useNavigate();

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

    const handleEditar = () => {
        if (esPersonalizada) {
            navigate(`/admin/rutina-personalizada/${diaInfo.asignacion.rutina_personalizada_id}`);
        } else if (esBase) {
            navigate(`/admin/rutina-base/${diaInfo.asignacion.rutina_base_id}`);
        }
    };

    const handleEliminar = async () => {
        if (!diaInfo?.asignacion?.id) return;
        const { error } = await supabase
            .from('asignaciones')
            .delete()
            .eq('id', diaInfo.asignacion.id);
        if (error) {
            console.error("Error al eliminar asignación:", error);
        } else {
            if (typeof onAsignacionEliminada === 'function') {
                onAsignacionEliminada(); // actualiza desde AlumnoPerfil sin recargar
            }
        }
    };

    return (
        <div
            ref={setNodeRef}
            className={`border rounded p-4 transition-all duration-300 hover:shadow-md ${cardBgClass}`}
        >
            <h3 className="font-bold text-black mb-2">{dia}</h3>

            {tieneAsignacion ? (
                <>
                    {labelTipo && (
                        <span className="text-xs font-semibold bg-white/50 px-2 py-1 rounded-full text-gray-700 mb-2 inline-block">
                            {labelTipo}
                        </span>
                    )}
                    <p className="text-sm text-gray-700 mt-1">
                        <span className="font-medium">{nombreRutina || 'Sin nombre'}</span>
                    </p>

                    <div className="flex items-center gap-2 mt-3">
                        <button
                            onClick={handleEditar}
                            className="text-xs text-blue-600 hover:underline"
                        >
                            ✏️ Editar
                        </button>
                        <button
                            onClick={handleEliminar}
                            className="text-xs text-red-600 hover:underline"
                        >
                            🗑️ Eliminar
                        </button>
                    </div>
                </>
            ) : (
                <p className="text-sm text-gray-500">Sin rutina asignada</p>
            )}

      
        </div>
    );
};

export default DiaCard;

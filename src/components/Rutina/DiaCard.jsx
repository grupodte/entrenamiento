import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuthUser } from '../../hooks/useAuthUser'; // Para obtener el entrenadorId
import { clonarRutinaBaseHaciaPersonalizada } from '../../utils/clonarRutina'; // Función de clonación
import { toast } from 'react-hot-toast'; // Para notificaciones

// Props actualizadas: alumnoId y onRutinaPersonalizada
const DiaCard = ({ index, dia, diaInfo, id, alumnoId, onAsignacionEliminada, onRutinaPersonalizada }) => {
    const { isOver, setNodeRef } = useDroppable({ id });
    const navigate = useNavigate();
    const { perfil: perfilEntrenador, isLoading: isLoadingAuthUser } = useAuthUser();

    const asignacionActual = diaInfo?.asignacion;
    const tieneAsignacion = !!asignacionActual;
    // Asegurarse de que rutina_personalizada_id y rutina_base_id se lean de asignacionActual
    const esPersonalizada = tieneAsignacion && !!asignacionActual.rutina_personalizada_id;
    const esBase = tieneAsignacion && !!asignacionActual.rutina_base_id && !asignacionActual.rutina_personalizada_id;

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

    const handlePersonalizarYEditar = () => { // Ya no es async, solo navega
        if (!esBase || !asignacionActual?.rutina_base_id || !alumnoId || !asignacionActual?.id) {
            toast.error("Falta información para iniciar la personalización.");
            console.error("Datos faltantes para personalizar:", { esBase, asignacionActual, alumnoId });
            return;
        }

        const idRutinaBaseOriginal = asignacionActual.rutina_base_id;
        const idAsignacionOriginal = asignacionActual.id;

        // Navegar al formulario de edición en modo "personalizar"
        // Se pasa el ID de la rutina base original para cargar sus datos
        // y los IDs de alumno y asignación para el proceso de guardado posterior.
        navigate(`/admin/rutinas/editar/${idRutinaBaseOriginal}?alumnoId=${alumnoId}&asignacionId=${idAsignacionOriginal}&modo=personalizar`);

    };

    const handleEditarRutinaPersonalizada = () => {
        if (!esPersonalizada || !asignacionActual?.rutina_personalizada_id) return;
        // La ruta para editar rutinas personalizadas podría ser diferente a la de rutinas base
        // Asumiendo que tienes una ruta como /admin/editar-rutina/:id que maneja ambos tipos o una específica
        navigate(`/admin/rutinas/editar/${asignacionActual.rutina_personalizada_id}?tipo=personalizada`);
    };


    const handleEliminar = async () => {
        if (!asignacionActual?.id) return;
        const confirmacion = window.confirm(`¿Estás seguro de que quieres eliminar la rutina "${nombreRutina}" del ${dia}?`);
        if (!confirmacion) return;

        try {
            toast.loading("Eliminando asignación...");
            const { error } = await supabase
                .from('asignaciones')
                .delete()
                .eq('id', asignacionActual.id);

            if (error) throw error;

            // Si la rutina era personalizada Y NO está asignada a ningún otro día para este alumno (o globalmente, según reglas de negocio)
            // podrías ofrecer eliminar también la rutina personalizada en sí.
            // Por ahora, solo eliminamos la asignación.
            // if (esPersonalizada && asignacionActual.rutina_personalizada_id) {
            //     // Verificar si hay otras asignaciones para esta rutina personalizada...
            //     // const { count } = await supabase.from('asignaciones').select('*', { count: 'exact' }).eq('rutina_personalizada_id', asignacionActual.rutina_personalizada_id);
            //     // if (count === 0) { /* ofrecer eliminar rutina_personalizada */ }
            // }

            toast.dismiss();
            toast.success("Asignación eliminada.");
            if (typeof onAsignacionEliminada === 'function') {
                onAsignacionEliminada();
            }
        } catch (error) {
            toast.dismiss();
            console.error("Error al eliminar asignación:", error);
            toast.error("No se pudo eliminar la asignación.");
        }
    };

    return (
        <div
            ref={setNodeRef}
            className={`border rounded p-4 transition-all duration-300 hover:shadow-md ${cardBgClass} flex flex-col justify-between min-h-[150px]`}
        >
            <div>
                <h3 className="font-bold text-black mb-1">{dia}</h3>
                {tieneAsignacion && labelTipo && (
                    <span className="text-xs font-semibold bg-white/60 px-2 py-0.5 rounded-full text-gray-700 mb-2 inline-block shadow-sm">
                        {labelTipo}
                    </span>
                )}
                {tieneAsignacion && (
                    <p className="text-sm text-gray-700 mt-1">
                        <span className="font-medium">{nombreRutina || 'Rutina sin nombre'}</span>
                    </p>
                )}
            </div>

            {tieneAsignacion ? (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 pt-2 border-t border-gray-200/60">
                    {esBase && (
                        <button
                            onClick={handlePersonalizarYEditar}
                            disabled={isLoadingAuthUser}
                            className="text-xs text-indigo-600 hover:underline disabled:opacity-50"
                        >
                            🎨 Personalizar y Editar
                        </button>
                    )}
                    {esPersonalizada && (
                        <button
                            onClick={handleEditarRutinaPersonalizada}
                            className="text-xs text-blue-600 hover:underline"
                        >
                            ✏️ Editar Rutina
                        </button>
                    )}
                    <button
                        onClick={handleEliminar}
                        className="text-xs text-red-600 hover:underline"
                    >
                        🗑️ Eliminar Asignación
                    </button>
                </div>
            ) : (
                <p className="text-sm text-gray-400 mt-2 self-center">Sin rutina asignada</p>
            )}
        </div>
    );
};

export default DiaCard;

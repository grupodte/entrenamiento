import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useAuthUser } from "../../hooks/useAuthUser";
import { toast } from "react-hot-toast";
import { Pencil, Trash2, Brush, Star, Book } from "lucide-react";

const DiaCard = ({
    index,
    dia,
    diaInfo,
    id,
    alumnoId,
    onAsignacionEliminada,
}) => {
    const { isOver, setNodeRef } = useDroppable({ id });
    const navigate = useNavigate();
    const { perfil: perfilEntrenador, isLoading: isLoadingAuthUser } = useAuthUser();

    const asignacionActual = diaInfo?.asignacion;
    const tieneAsignacion = !!asignacionActual;
    const esPersonalizada =
        tieneAsignacion && !!asignacionActual.rutina_personalizada_id;
    const esBase =
        tieneAsignacion &&
        !!asignacionActual.rutina_base_id &&
        !asignacionActual.rutina_personalizada_id;

    const nombreRutina =
        esPersonalizada
            ? diaInfo.asignacion.rutina_personalizada?.nombre
            : esBase
                ? diaInfo.asignacion.rutina_base?.nombre
                : null;

    const cardBgClass = isOver
        ? "bg-white/30 border-indigo-300"
        : "bg-white/10 border-gray-200 backdrop-blur-sm";

    const badge = esPersonalizada ? (
        <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-semibold">
            <Star className="w-3 h-3" />
            Personalizada
        </span>
    ) : esBase ? (
        <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-semibold">
            <Book className="w-3 h-3" />
            Base
        </span>
    ) : null;

    const handlePersonalizarYEditar = () => {
        if (!esBase || !asignacionActual?.rutina_base_id || !alumnoId) {
            toast.error("Faltan datos para personalizar.");
            return;
        }
        navigate(
            `/admin/rutinas/editar/${asignacionActual.rutina_base_id}?alumnoId=${alumnoId}&asignacionId=${asignacionActual.id}&modo=personalizar`
        );
    };

    const handleEditarRutinaPersonalizada = () => {
        if (!esPersonalizada) return;
        navigate(
            `/admin/rutinas/editar/${asignacionActual.rutina_personalizada_id}?tipo=personalizada`
        );
    };

    const handleVerRutina = () => {
        if (esBase && asignacionActual?.rutina_base_id) {
            navigate(`/admin/rutinas/ver/${asignacionActual.rutina_base_id}`);
        } else if (esPersonalizada && asignacionActual?.rutina_personalizada_id) {
            navigate(`/admin/rutinas/ver/${asignacionActual.rutina_personalizada_id}?tipo=personalizada`);
        } else {
            toast.error("No se encontró la rutina para ver.");
        }
    };

    const handleEliminar = async () => {
        if (!asignacionActual?.id) return;
        if (
            !window.confirm(`¿Eliminar la rutina "${nombreRutina}" de ${dia}?`)
        )
            return;

        try {
            toast.loading("Eliminando...");
            const { error } = await supabase
                .from("asignaciones")
                .delete()
                .eq("id", asignacionActual.id);
            if (error) throw error;
            toast.dismiss();
            toast.success("Asignación eliminada.");
            onAsignacionEliminada?.();
        } catch (err) {
            toast.dismiss();
            toast.error("No se pudo eliminar.");
            console.error(err);
        }
    };

    return (
        <div
            ref={setNodeRef}
            className={` rounded-2xl p-4 transition-all duration-300 hover:shadow-md ${cardBgClass} flex flex-col justify-between min-h-[160px]`}
        >
            <div>
                <h3 className="text-base font-bold mb-2 text-white">{dia}</h3>
                {tieneAsignacion && (
                    <div className="flex items-center gap-2 mb-1">
                        {badge}
                        <span className="text-sm truncate font-medium text-white max-w-[140px]">
                            {nombreRutina || "Sin nombre"}
                        </span>
                    </div>
                )}
            </div>

            {tieneAsignacion ? (
                <div className="flex flex-wrap gap-2 mt-4 border-t pt-3 border-gray-200">
                    {esBase && (
                        <button
                            onClick={handlePersonalizarYEditar}
                            disabled={isLoadingAuthUser}
                            className="flex items-center gap-1 text-xs px-3 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition w-full sm:w-auto"
                        >
                            <Brush className="w-3 h-3" />
                            Personalizar
                        </button>
                    )}
                    {esPersonalizada && (
                        <button
                            onClick={handleEditarRutinaPersonalizada}
                            className="flex items-center gap-1 text-xs px-3 py-1 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition w-full sm:w-auto"
                        >
                            <Pencil className="w-3 h-3" />
                            Editar
                        </button>
                    )}
                    <button
                        onClick={handleVerRutina}
                        className="flex items-center gap-1 text-xs px-3 py-1 rounded-md bg-sky-600 text-white hover:bg-sky-700 transition w-full sm:w-auto"
                    >
                        <Book className="w-3 h-3" />
                        Ver
                    </button>
                    <button
                        onClick={handleEliminar}
                        className="flex items-center gap-1 text-xs px-3 py-1 rounded-md bg-red-600 text-white hover:bg-red-700 transition w-full sm:w-auto"
                    >
                        <Trash2 className="w-3 h-3" />
                        Eliminar
                    </button>
                </div>
            ) : (
                <div className="flex items-center justify-center text-gray-400 text-xs italic mt-4 border-t pt-3 border-gray-200">
                    Sin rutina asignada
                </div>
            )}
        </div>
    );
};

export default DiaCard;

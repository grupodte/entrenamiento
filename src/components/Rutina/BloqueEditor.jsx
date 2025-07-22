import React from 'react';
import SubbloqueEditor from './SubbloqueEditor';
import { v4 as uuidv4 } from 'uuid';
import { DndContext } from '@dnd-kit/core';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const BloqueEditor = ({ bloque, onChange, onRemove, onDuplicate, ejerciciosDisponibles, className = "" }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: bloque.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : undefined,
        boxShadow: isDragging ? '0 8px 32px 0 rgba(0,0,0,0.25)' : undefined,
        opacity: isDragging ? 0.85 : 1,
    };

    const semanaInicio = bloque.semana_inicio ?? 1;
    const semanaFin = bloque.semana_fin ?? semanaInicio;

    const actualizarSubbloques = (nuevos) => {
        onChange({ ...bloque, subbloques: nuevos });
    };

    const agregarSubbloque = () => {
        const nuevo = {
            id: uuidv4(),
            nombre: '',
            tipo: '',
            ejercicios: [],
        };
        actualizarSubbloques([...(bloque.subbloques || []), nuevo]);
    };

    const actualizarSubbloque = (actualizado) => {
        actualizarSubbloques(
            (bloque.subbloques || []).map((sb) => sb.id === actualizado.id ? actualizado : sb)
        );
    };

    const eliminarSubbloque = (id) => {
        actualizarSubbloques((bloque.subbloques || []).filter((sb) => sb.id !== id));
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            const oldIndex = bloque.subbloques.findIndex(s => s.id === active.id);
            const newIndex = bloque.subbloques.findIndex(s => s.id === over?.id);
            const reordered = [...bloque.subbloques];
            const [moved] = reordered.splice(oldIndex, 1);
            reordered.splice(newIndex, 0, moved);
            actualizarSubbloques(reordered);
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`bg-white/5 border border-white/10 rounded-xl p-3 md:p-4 max-w-[300px] md:max-w-5xl mx-auto space-y-3 sm:space-y-4 ${className} ${isDragging ? 'ring-2 ring-yellow-400' : ''}`}
        >
            {/* Encabezado del bloque */}
            <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4">
                <span className="text-sm text-white/80 font-semibold">
                    Semana {semanaInicio} – {semanaFin}
                </span>
                <div className="flex gap-3 text-xs items-center">
                    {/* Drag handle */}
                    <button
                        type="button"
                        className="cursor-grab active:cursor-grabbing text-white/40 hover:text-yellow-400 transition p-1"
                        aria-label="Mover bloque"
                        {...listeners}
                        {...attributes}
                    >
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><circle cx="6" cy="7" r="1.5" fill="currentColor"/><circle cx="6" cy="12" r="1.5" fill="currentColor"/><circle cx="6" cy="17" r="1.5" fill="currentColor"/><circle cx="12" cy="7" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="17" r="1.5" fill="currentColor"/><circle cx="18" cy="7" r="1.5" fill="currentColor"/><circle cx="18" cy="12" r="1.5" fill="currentColor"/><circle cx="18" cy="17" r="1.5" fill="currentColor"/></svg>
                    </button>
                    <button
                        onClick={() => onDuplicate(bloque)}
                        className="text-yellow-400 hover:text-yellow-300 transition"
                    >
                        Duplicar
                    </button>
                    <button
                        onClick={onRemove}
                        className="text-red-400 hover:text-red-300 transition"
                    >
                        Eliminar
                    </button>
                </div>
            </div>

            {/* Subbloques con drag & drop */}
            <DndContext onDragEnd={handleDragEnd}>
                <SortableContext
                    items={(bloque.subbloques || []).map(sb => sb.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-3 sm:space-y-4">
                        {(bloque.subbloques || []).map((subbloque) => (
                            <SubbloqueEditor
                                key={subbloque.id}
                                subbloque={subbloque}
                                onChange={actualizarSubbloque}
                                onRemove={() => eliminarSubbloque(subbloque.id)}
                                ejerciciosDisponibles={ejerciciosDisponibles}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            {/* Botón agregar subbloque */}
            <div className="pt-2">
                <button
                    onClick={agregarSubbloque}
                    className="text-sm text-white/80 font-medium hover:text-sky-400 transition"
                >
                    + Agregar subbloque
                </button>
            </div>
        </div>
    );
};

export default BloqueEditor;

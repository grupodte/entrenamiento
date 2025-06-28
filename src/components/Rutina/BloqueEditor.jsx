import React from 'react';
import SubbloqueEditor from './SubbloqueEditor';
import { v4 as uuidv4 } from 'uuid';
import { DndContext } from '@dnd-kit/core';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const BloqueEditor = ({ bloque, onChange, onRemove, onDuplicate, ejerciciosDisponibles }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: bloque.id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
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

    const duplicarBloque = () => {
        const semanasPorBloque = semanaFin - semanaInicio + 1;
        const bloqueDuplicado = {
            ...bloque,
            id: uuidv4(),
            semana_inicio: semanaFin + 1,
            semana_fin: semanaFin + semanasPorBloque,
            subbloques: bloque.subbloques.map(sb => ({
                ...sb,
                id: uuidv4(),
                ejercicios: sb.ejercicios.map(ej => ({
                    ...ej,
                    id: uuidv4(),
                    series: ej.series?.map(s => ({ ...s })) || [],
                    sets_config: ej.sets_config?.map(s => ({ ...s })) || []
                }))
            }))
        };
        onDuplicate(bloqueDuplicado);
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
            className="bg-white/5  p-4 rounded-xl border border-white/10 space-y-4"
        >
            <div className="flex flex-wrap justify-between items-center gap-3">
                <span className="text-white text-sm font-medium">
                    Semana ({semanaInicio} - {semanaFin})
                </span>
                <div className="flex gap-2">
                    <button onClick={duplicarBloque} className="text-yellow-400 hover:text-yellow-500 text-sm">
                        Duplicar
                    </button>
                    <button onClick={onRemove} className="text-red-400 hover:text-red-600 text-sm">
                        Eliminar
                    </button>
                </div>
            </div>

            <DndContext onDragEnd={handleDragEnd}>
                <SortableContext
                    items={(bloque.subbloques || []).map(sb => sb.id)}
                    strategy={verticalListSortingStrategy}
                >

                    {(bloque.subbloques || []).map((subbloque) => (
                        <SubbloqueEditor
                            key={subbloque.id}
                            subbloque={subbloque}
                            onChange={actualizarSubbloque}
                            onRemove={() => eliminarSubbloque(subbloque.id)}
                            ejerciciosDisponibles={ejerciciosDisponibles}
                        />
                    ))}
                </SortableContext>
            </DndContext>

            <div className="pt-2">
                <button
                    onClick={agregarSubbloque}
                    className="text-white/90 text-sm font-semibold hover:text-skyblue transition"
                >
                    Agregar ejercicio
                </button>
            </div>
        </div>
    );
};

export default BloqueEditor;

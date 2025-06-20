import React from 'react';
import SubbloqueEditor from './SubbloqueEditor';
import { v4 as uuidv4 } from 'uuid';
import { GripVertical, Copy } from 'lucide-react';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { DndContext } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

const BloqueEditor = ({ bloque, onChange, onRemove, onDuplicate, ejerciciosDisponibles }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: bloque.id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

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
        const semanasPorBloque = bloque.semana_fin - bloque.semana_inicio + 1;
        const bloqueDuplicado = {
            ...bloque,
            id: uuidv4(),
            semana_inicio: bloque.semana_fin + 1,
            semana_fin: bloque.semana_fin + semanasPorBloque,
            subbloques: bloque.subbloques.map(sb => ({
                ...sb,
                id: uuidv4(),
                ejercicios: sb.ejercicios.map(ej => ({
                    ...ej,
                    id: uuidv4(),
                    series: ej.series.map(s => ({ ...s }))
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
            className="bg-white/10 p-4 rounded-xl border border-white/10 space-y-2"
        >
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                 
                    <span className="text-[12px] md:text-16px text-white font-normal">
                        Bloque (semanas {bloque.semana_inicio} - {bloque.semana_fin})
                    </span>
                </div>
                <div className=" flex gap-3">
                    <button onClick={duplicarBloque} className="text-yellow-400 hover:text-yellow-500 text-[12px] md:text-16px flex items-center gap-1">
                         Duplicar                    </button>
                    <button onClick={onRemove} className="text-red-400 hover:text-red-600 text-[12px] md:text-16px ">
                        Eliminar
                    </button>
                </div>
            </div>

            <DndContext onDragEnd={handleDragEnd}>
                <SortableContext
                    items={bloque.subbloques.map(sb => sb.id)}
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

            <button
                onClick={agregarSubbloque}
                className="text-white font-bold rounded-xl px-4 py-2"
            >
                ➕ Agregar subbloque
            </button>
        </div>
    );
};

export default BloqueEditor;

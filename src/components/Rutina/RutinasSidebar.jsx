// src/components/Rutina/RutinasSidebar.jsx
import React, { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';

const RutinaItem = ({ rutina }) => {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: `rutina-${rutina.id}`,
    });

    const style = transform
        ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
        : undefined;

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            draggable="true"
            style={{
                ...style,
                touchAction: 'none', // previene interferencia en touch
                WebkitUserSelect: 'none', // mejora compatibilidad
                userSelect: 'none'
            }}
            className="bg-white/10 text-white px-3 py-2 rounded-md mb-2 hover:bg-white/20 cursor-grab active:cursor-grabbing z-10 relative"
        >
            {rutina.nombre}
        </div>
      
    );
};

const RutinasSidebar = ({ rutinas }) => {
    const [filtro, setFiltro] = useState('');

    const rutinasFiltradas = rutinas.filter((r) =>
        r.nombre.toLowerCase().includes(filtro.toLowerCase())
    );

    return (
        <div className="p-4 bg-white/5 backdrop-blur rounded-xl border border-white/10">
            <input
                type="text"
                placeholder="Buscar rutina..."
                className="w-full mb-4 p-2 rounded-md bg-white/10 text-white placeholder-gray-400"
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
            />
            <div className="overflow-y-auto max-h-[70vh] pr-1">
                {rutinasFiltradas.map((rutina) => (
                    <RutinaItem key={rutina.id} rutina={rutina} />
                ))}
            </div>
        </div>
    );
};

export default RutinasSidebar;

import React from 'react';
import { useDraggable } from '@dnd-kit/core';

const RutinaItem = ({ rutina }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `rutina-${rutina.id}`,
    });

    const style = transform
        ? {
            transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
            touchAction: 'none', // previene interferencia en touch
            WebkitUserSelect: 'none', // mejora compatibilidad
            userSelect: 'none',
            zIndex: 10, // Asegura que el item arrastrado esté por encima
        }
        : {
            touchAction: 'none',
            WebkitUserSelect: 'none',
            userSelect: 'none',
        };

    return (
        <li
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={`cursor-grab active:cursor-grabbing p-3 rounded-md border transition-colors ${isDragging ? 'bg-blue-100 border-blue-400 shadow-lg' : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
                }`}
        >
            <span className="font-medium text-sm text-gray-800">{rutina.nombre}</span>
        </li>
    );
};

export default RutinaItem;

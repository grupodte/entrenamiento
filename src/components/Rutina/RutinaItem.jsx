import React from 'react';
import { useDraggable } from '@dnd-kit/core';

const RutinaItem = ({ rutina }) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `rutina-${rutina.id}`,
    });

    return (
        <li
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className={`cursor-move p-3 rounded-md border transition-colors ${isDragging ? 'bg-blue-100 border-blue-400' : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
                }`}
        >
            <span className="font-medium text-sm">{rutina.nombre}</span>
        </li>
    );
};

export default RutinaItem;

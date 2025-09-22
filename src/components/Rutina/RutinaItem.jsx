import React from 'react';
import { useDraggable } from '@dnd-kit/core';

const RutinaItem = ({ rutina }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `rutina-${rutina.id}`,
    });

    const baseStyle = transform
        ? {
            transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
            zIndex: 10, // Asegura que el item arrastrado esté por encima durante la transición si es visible
        }
        : {};

    const combinedStyle = {
        ...baseStyle,
        touchAction: 'none', // previene interferencia en touch y scroll en móviles
        WebkitUserSelect: 'none', // mejora compatibilidad de selección en navegadores WebKit
        userSelect: 'none', // previene selección de texto durante el drag
        opacity: isDragging ? 0 : 1, // Clave: Oculta el item original mientras se arrastra
    };

    // Se mantiene el cambio de clase para isDragging por si se quiere dar feedback visual 
    // al placeholder que podría quedar (aunque con opacity:0 no se verá)
    // o si en el futuro se cambia opacity:0 por otra estrategia (ej. moverlo fuera de pantalla)
    const draggingClass = isDragging
        ? 'bg-blue-100 border-blue-400 shadow-lg text-gray-800' // Mantener texto oscuro en fondo claro
        : 'bg-white/5 hover:bg-white/10 border-white/10 text-white';

    return (
        <li
            ref={setNodeRef}
            style={combinedStyle}   
            {...listeners}
            {...attributes}
            title={`Tipo: ${rutina.tipo}\n\n${rutina.descripcion}`}
            className={`cursor-grab active:cursor-grabbing p-3 rounded-md border transition-colors ${draggingClass}`}>
            <span className="font-medium text-sm">{rutina.nombre}</span>
        </li>
    );
};

export default RutinaItem;

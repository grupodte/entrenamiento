import React, { useState } from 'react';
import RutinaItem from './RutinaItem';

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
            <ul className="space-y-2">
                {rutinasFiltradas.map((rutina) => (
                    <RutinaItem key={rutina.id} rutina={rutina} />
                ))}
            </ul>
        </div>
    );
};

export default RutinasSidebar;

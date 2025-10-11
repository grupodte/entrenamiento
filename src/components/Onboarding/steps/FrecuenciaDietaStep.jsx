import React, { useState } from 'react';
import OptionCard from '../OptionCard'; // usa el OptionCard mejorado

const FrecuenciaDietaStep = ({ value, comentario, onChange, onComentarioChange }) => {
    const opciones = [
        { id: 'desayuno', title: 'Desayuno • Almuerzo • Merienda • Cena', description: '4 comidas  al día' },
        { id: 'sin_desayuno', title: 'Almuerzo • Merienda • Cena', description: '3 comidas al día' },
       
    ];

    return (
        <div className="space-y-6">
  
            {/* Opciones de frecuencia */}
            <div className="grid gap-3 md:gap-4">
                {opciones.map(({ id, title, description }) => (
                    <OptionCard
                        key={id}
                        title={title}
                        description={description}
                        selected={value === id}
                        onClick={() => onChange(id)}
                    />
                ))}
            </div>

            {/* Campo de comentario */}
            <div>
                <label className="block text-[13px] text-white/70 mb-2">
                    Comentarios adicionales (alergias, intolerancias, restricciones, etc.)
                </label>
                <textarea
                    value={comentario || ''}
                    onChange={(e) => onComentarioChange(e.target.value)}
                    rows={4}
                    className="w-full p-3 rounded-xl bg-[#191919] border border-white/10 text-white placeholder-white/40 text-[14px] 
             focus:outline-none focus:ring-0 focus:border-[#FF0000]/50"
                    placeholder="Ejemplo: Soy intolerante a la lactosa, no consumo gluten..."
                />

            </div>
        </div>
    );
};

export default FrecuenciaDietaStep;

import React from 'react';
import SubBloqueDisplay from './SubBloqueDisplay';




const BloqueDisplay = (props) => {
    const { bloque, progressPorSubBloque, lastSessionData } = props;

    // Definir esquemas de colores para cada tipo de bloque
    const getBlockTheme = (nombre = '') => {
        const nombreLower = nombre.toLowerCase();
        if (nombreLower.includes('calentamiento')) {
            return {
                iconColor: 'bg-orange-500',
                accentColor: 'orange',
                iconColorClass: 'text-white'
            };
        }
        if (nombreLower.includes('principal')) {
            return {
                iconColor: 'bg-red-500',
                accentColor: 'red', 
                iconColorClass: 'text-white'
            };
        }
        if (nombreLower.includes('cooldown')) {
            return {
                iconColor: 'bg-green-500',
                accentColor: 'green',
                iconColorClass: 'text-white'
            };
        }
        if (nombreLower.includes('estiramiento')) {
            return {
                iconColor: 'bg-purple-500',
                accentColor: 'purple',
                iconColorClass: 'text-white'
            };
        }
        // Default theme
        return {
            iconColor: 'bg-red-500',
            accentColor: 'red',
            iconColorClass: 'text-white'
        };
    };

    /** Ordena los bloques segun su tipo_bloque */
    const sortSubBloques = (a, b) => {
        const prioridad = (nombre = '') => {
            nombre = nombre.toLowerCase();
            if (nombre.includes('calentamiento')) return 0;
            if (nombre.includes('principal')) return 1;
            if (nombre.includes('cooldown')) return 2;
            if (nombre.includes('estiramiento')) return 3;
            return 4;
        };
        return prioridad(a.nombre) - prioridad(b.nombre);
    };


    // Agrupa los subbloques por nombre (o individualmente si no tienen nombre)
    // Los bloques principales se agrupan juntos, otros por nombre

    const groupedSubBloques = [...(bloque.subbloques ?? [])]
        .sort(sortSubBloques)
        .reduce((acc, subbloque) => {
            const nombreLower = subbloque.nombre?.toLowerCase() || '';
            
            // Agrupar todos los bloques principales juntos
            if (nombreLower.includes('principal')) {
                const key = 'Principal';
                if (!acc[key]) {
                    acc[key] = [];
                }
                acc[key].push(subbloque);
            } else {
                // Usar el nombre como clave o un ID único si no hay nombre para no agruparlos
                const key = subbloque.nombre || `__individual__${subbloque.id}`;
                if (!acc[key]) {
                    acc[key] = [];
                }
                acc[key].push(subbloque);
            }
            return acc;
        }, {});



    return (
        <div className="space-y-4 px-4">
            {Object.entries(groupedSubBloques).map(([nombre, subbloquesDelGrupo]) => {
                const isAGroupWithTitle = !nombre.startsWith('__individual__');
                const theme = getBlockTheme(nombre);

                return (
                    <div key={nombre} className="space-y-3">
                        {/* Header del grupo si existe */}
                        {isAGroupWithTitle && (
                            <div className="mb-4">
                                <h2 className="text-2xl font-bold text-black/80 tracking-tight">
                                    {nombre.charAt(0).toUpperCase() + nombre.slice(1)}
                                </h2>
                            </div>
                        )}
                        
                        {/* Grid de tarjetas */}
                        <div className="grid grid-cols-1 gap-3">
                            {subbloquesDelGrupo.map((subbloque, index) => {
                                const progressInfo = progressPorSubBloque[subbloque.id] || { isCompleted: false, isInProgress: false };
                                
                                // Para bloques principales, usar numeración secuencial
                                const isPrincipal = nombre === 'Principal';
                                const displayNumber = isPrincipal ? index + 1 : index + 1;
                                const displayName = isPrincipal ? `Bloque ${displayNumber}` : null;
                                
                                return (
                                    <SubBloqueDisplay
                                        key={subbloque.id}
                                        subbloque={subbloque}
                                        isCompleted={progressInfo.isCompleted}
                                        isInProgress={progressInfo.isInProgress}
                                        {...props}
                                        lastSessionData={lastSessionData}
                                        index={index}
                                        hideTitle={false} // Siempre mostrar el título del bloque individual
                                        blockTheme={theme}
                                        blockNumber={displayNumber}
                                        blockName={displayName}
                                    />
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default BloqueDisplay;




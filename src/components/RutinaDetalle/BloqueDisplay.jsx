import React from 'react';
import SubBloqueDisplay from './SubBloqueDisplay';




const BloqueDisplay = (props) => {
    const { bloque, progressPorSubBloque, lastSessionData } = props;

    // Definir esquemas de colores para cada tipo de bloque
    const getBlockTheme = (nombre = '') => {
        const nombreLower = nombre.toLowerCase();
        if (nombreLower.includes('calentamiento')) {
            return {
                iconColor: 'bg-[#FFA500]',
                accentColor: 'orange',
                iconColorClass: 'text-white'
            };
        }
        if (nombreLower.includes('principal')) {
            return {
                iconColor: 'bg-[#F04444]',
                accentColor: 'red', 
                iconColorClass: 'text-white'
            };
        }
        if (nombreLower.includes('cooldown')) {
            return {
                iconColor: 'bg-[#F04444]',
                accentColor: 'green',
                iconColorClass: 'text-white'
            };
        }
        if (nombreLower.includes('estiramiento')) {
            return {
                iconColor: 'bg-[#F04444]',
                accentColor: 'purple',
                iconColorClass: 'text-white'
            };
        }
        // Default theme
        return {
            iconColor: 'bg-[#F04444]',
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


    // Agrupa los subbloques por tipo (calentamiento, principal, cooldown, etc.)
    // Todos los bloques del mismo tipo se agrupan bajo una sola sección

    const groupedSubBloques = [...(bloque.subbloques ?? [])]
        .sort(sortSubBloques)
        .reduce((acc, subbloque) => {
            const nombreLower = subbloque.nombre?.toLowerCase() || '';
            
            // Determinar el tipo de bloque y agrupar por tipo
            let tipoBloque = 'Otros'; // Default
            
            if (nombreLower.includes('calentamiento')) {
                tipoBloque = 'Calentamiento';
            } else if (nombreLower.includes('principal')) {
                tipoBloque = 'Principal';
            } else if (nombreLower.includes('cooldown')) {
                tipoBloque = 'Cooldown';
            } else if (nombreLower.includes('estiramiento')) {
                tipoBloque = 'Estiramiento';
            } else if (subbloque.nombre) {
                // Si tiene un nombre pero no coincide con los tipos conocidos
                tipoBloque = subbloque.nombre.charAt(0).toUpperCase() + subbloque.nombre.slice(1);
            }
            
            if (!acc[tipoBloque]) {
                acc[tipoBloque] = [];
            }
            acc[tipoBloque].push(subbloque);
            
            return acc;
        }, {});



    return (
        <div className="space-y-2 pb-16">
            {Object.entries(groupedSubBloques).map(([tipoBloque, subbloquesDelGrupo]) => {
                const theme = getBlockTheme(tipoBloque.toLowerCase());

                return (
                    <div key={tipoBloque} className="space-y-2 bg-[#D8D8D8] px-1 py-2 rounded-[10px]">
                        {/* Header del grupo de tipo de bloque */}
                        <div className="mb-1 ">  
                            <h2 className="px-2 text-[27px]  text-[#3D3D3D]  ">
                                {tipoBloque}
                            </h2>
                        </div>
                        
                        {/* Grid de tarjetas del mismo tipo */}
                        <div className="grid grid-cols-1 gap-1">
                            {subbloquesDelGrupo.map((subbloque, index) => {
                                const progressInfo = progressPorSubBloque[subbloque.id] || { isCompleted: false, isInProgress: false };
                                
                                // Generar nombre apropiado según el tipo
                                // Como ya hay títulos de sección, siempre usar numeración
                                let displayName;
                                const blockNumber = index + 1;
                                
                                if (tipoBloque === 'Principal') {
                                    displayName = `Bloque ${blockNumber}`;
                                } else {
                                    // Para todos los otros tipos, usar "Bloque X" ya que el tipo ya está en el header de sección
                                    displayName = `Bloque ${blockNumber}`;
                                }
                                
                                return (
                                    <SubBloqueDisplay
                                        key={subbloque.id}
                                        subbloque={subbloque}
                                        isCompleted={progressInfo.isCompleted}
                                        isInProgress={progressInfo.isInProgress}
                                        {...props}
                                        lastSessionData={lastSessionData}
                                        index={index}
                                        hideTitle={false}
                                        blockTheme={theme}
                                        blockNumber={blockNumber}
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




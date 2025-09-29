import React from 'react';
import SubBloqueDisplay from './SubBloqueDisplay';




const BloqueDisplay = (props) => {
    const { bloque, progressPorSubBloque, lastSessionData } = props;

    // Definir esquemas de colores para cada tipo de bloque
    const getBlockTheme = (nombre = '') => {
        const nombreLower = nombre.toLowerCase();
        if (nombreLower.includes('calentamiento')) {
            return {
                border: 'border-orange-600/30',
                accentColor: 'orange'
            };
        }
        if (nombreLower.includes('principal')) {
            return {
                border: 'border-blue-600/30',
                accentColor: 'blue'
            };
        }
        if (nombreLower.includes('cooldown')) {
            return {
                border: 'border-green-600/30',
                accentColor: 'green'
            };
        }
        if (nombreLower.includes('estiramiento')) {
            return {
                border: 'border-purple-600/30',
                accentColor: 'purple'
            };
        }
        // Default theme
        return {
            bg: 'bg-gradient-to-br from-gray-900/15 to-gray-800/10',
            border: 'border-gray-600/30',
            titleColor: 'text-gray-300',
            accentColor: 'gray'
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

    const groupedSubBloques = [...(bloque.subbloques ?? [])]
        .sort(sortSubBloques)
        .reduce((acc, subbloque) => {
            // Usar el nombre como clave o un ID único si no hay nombre para no agruparlos
            const key = subbloque.nombre || `__individual__${subbloque.id}`;
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(subbloque);
            return acc;
        }, {});



    return (
        <div className="space-y-2 ">
            {Object.entries(groupedSubBloques).map(([nombre, subbloquesDelGrupo]) => {
                const isAGroupWithTitle = !nombre.startsWith('__individual__');
                const theme = getBlockTheme(nombre);

                return (
                    <div 
                        key={nombre} 
                        className={`rounded-xl bg-[#D8D8D8] px-2 py-4 ${
                            isAGroupWithTitle ? `${theme.bg} ${theme.border}` : ' '
                        }`}
                    >
                        {isAGroupWithTitle && (
                            <div className="flex items-center justify-start ">
                                
                                <h2 className="text-[27px] text-[#3C3C3C]">
                                    {nombre.charAt(0).toUpperCase() + nombre.slice(1)}
                                </h2>
                            </div>
                        )}
                        <div className="space-y-1">
                            {subbloquesDelGrupo.map((subbloque, index) => {
                                const progressInfo = progressPorSubBloque[subbloque.id] || { isCompleted: false, isInProgress: false };
                                
                                // Calcular el número de bloque para este ejercicio dentro del tipo
                                const ejercicioNumero = index + 1;
                                
                                return (
                                    <SubBloqueDisplay
                                        key={subbloque.id}
                                        subbloque={subbloque}
                                        isCompleted={progressInfo.isCompleted}
                                        isInProgress={progressInfo.isInProgress}
                                        {...props}
                                        lastSessionData={lastSessionData}
                                        index={index}
                                        // Ocultar el título si ya mostramos un título de grupo
                                        hideTitle={isAGroupWithTitle}
                                        blockTheme={theme}
                                        blockNumber={ejercicioNumero}
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




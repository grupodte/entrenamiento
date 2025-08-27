import React from 'react';
import SubBloqueDisplay from './SubBloqueDisplay';

const BloqueDisplay = (props) => {
    const { bloque, progressPorSubBloque, lastSessionData } = props;

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
        <div className="z-10 space-y-4">
            {Object.entries(groupedSubBloques).map(([nombre, subbloquesDelGrupo], groupIndex) => {
                const isAGroupWithTitle = !nombre.startsWith('__individual__');

                return (
                    <div key={nombre} className="space-y-3">
                        {isAGroupWithTitle && (
                            <h3 className="text-base font-semibold text-gray-300 px-2 pt-2">
                                {nombre}
                            </h3>
                        )}
                        {subbloquesDelGrupo.map((subbloque, index) => {
                            const progressInfo = progressPorSubBloque[subbloque.id] || { isCompleted: false, isInProgress: false };
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
                                />
                            );
                        })}
                    </div>
                );
            })}
        </div>
    );
};

export default BloqueDisplay;

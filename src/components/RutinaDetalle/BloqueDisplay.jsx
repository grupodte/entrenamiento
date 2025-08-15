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

    return (
            <div className=" z-10 space-y-10 ">
                {[...(bloque.subbloques ?? [])]
                    .sort(sortSubBloques)
                    .map((subbloque, index) => {
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
                            />
                        );
                    })}
            </div>
    );
};

export default BloqueDisplay;

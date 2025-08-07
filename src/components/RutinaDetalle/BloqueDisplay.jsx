import React from 'react';
import SubBloqueDisplay from './SubBloqueDisplay';
import {
    generarIdSerieSimple,
    generarIdEjercicioEnSerieDeSuperset
} from '../../utils/rutinaIds';

const BloqueDisplay = (props) => {
    const { bloque, elementosCompletados, lastSessionData } = props;

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

    const isSubBloqueCompleted = (subbloque) => {
        let total = 0;
        let completed = 0;

        if (subbloque.tipo === 'simple') {
            subbloque.subbloques_ejercicios?.forEach((sbe) => {
                sbe.series?.forEach((serie) => {
                    const id = generarIdSerieSimple(subbloque.id, sbe.id, serie.nro_set);
                    total++;
                    if (elementosCompletados[id]) completed++;
                });
            });
        } else {
            Array.from({ length: subbloque.num_series_superset || 1 }).forEach((_, i) => {
                const n = i + 1;
                subbloque.subbloques_ejercicios?.forEach((sbe) => {
                    const id = generarIdEjercicioEnSerieDeSuperset(subbloque.id, sbe.id, n);
                    total++;
                    if (elementosCompletados[id]) completed++;
                });
            });
        }

        return total > 0 && total === completed;
    };

    const isSubBloqueInProgress = (subbloque) => {
        let total = 0;
        let completed = 0;

        if (subbloque.tipo === 'simple') {
            subbloque.subbloques_ejercicios?.forEach((sbe) => {
                sbe.series?.forEach((serie) => {
                    const id = generarIdSerieSimple(subbloque.id, sbe.id, serie.nro_set);
                    total++;
                    if (elementosCompletados[id]) completed++;
                });
            });
        } else {
            Array.from({ length: subbloque.num_series_superset || 1 }).forEach((_, i) => {
                const n = i + 1;
                subbloque.subbloques_ejercicios?.forEach((sbe) => {
                    const id = generarIdEjercicioEnSerieDeSuperset(subbloque.id, sbe.id, n);
                    total++;
                    if (elementosCompletados[id]) completed++;
                });
            });
        }

        return completed > 0 && completed < total;
    };

    return (
        <div className=" rounded-2xl px-3 py-4 shadow-dashboard-lg backdrop-blur-md relative overflow-hidden">
            {/* Línea base tipo timeline */}

            <div className="relative z-10 ">
                {[...(bloque.subbloques ?? [])]
                    .sort(sortSubBloques)
                    .map((subbloque) => (
                        <SubBloqueDisplay
                            key={subbloque.id}
                            subbloque={subbloque}
                            isCompleted={isSubBloqueCompleted(subbloque)}
                            isInProgress={isSubBloqueInProgress(subbloque)}
                            {...props}
                            lastSessionData={lastSessionData}
                        />
                    ))}
            </div>
        </div>
    );
};

export default BloqueDisplay;

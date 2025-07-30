import React, { useEffect, useState } from 'react';
import SubBloqueDisplay from './SubBloqueDisplay';
import { generarIdSerieSimple, generarIdEjercicioEnSerieDeSuperset } from '../../utils/rutinaIds';
import { motion } from 'framer-motion';

const BloqueDisplay = (props) => {
    const { bloque, elementosCompletados } = props;
    const [progressHeight, setProgressHeight] = useState(0);

    const sortSubBloques = (a, b) => {
        const prioridad = (nombre = "") => {
            nombre = nombre.toLowerCase();
            if (nombre.includes("calentamiento")) return 0;
            if (nombre.includes("principal")) return 1;
            if (nombre.includes("cooldown")) return 2;
            if (nombre.includes("estiramiento")) return 3;
            return 4;
        };
        return prioridad(a.nombre) - prioridad(b.nombre);
    };

    useEffect(() => {
        let totalElements = 0;
        let completedElements = 0;

        bloque.subbloques?.forEach(subbloque => {
            if (subbloque.tipo === 'simple') {
                subbloque.subbloques_ejercicios?.forEach(sbe => {
                    sbe.series?.forEach(serie => {
                        const serieId = generarIdSerieSimple(subbloque.id, sbe.id, serie.nro_set);
                        totalElements++;
                        if (elementosCompletados[serieId]) {
                            completedElements++;
                        }
                    });
                });
            } else if (subbloque.tipo === 'superset') {
                Array.from({ length: subbloque.num_series_superset || 1 }).forEach((_, setIndex) => {
                    const setNumeroSuperset = setIndex + 1;
                    subbloque.subbloques_ejercicios?.forEach(sbe => {
                        const elementoId = generarIdEjercicioEnSerieDeSuperset(subbloque.id, sbe.id, setNumeroSuperset);
                        totalElements++;
                        if (elementosCompletados[elementoId]) {
                            completedElements++;
                        }
                    });
                });
            }
        });

        const percentage = totalElements > 0 ? (completedElements / totalElements) * 100 : 0;
        setProgressHeight(percentage);
    }, [bloque, elementosCompletados]);

    const isSubBloqueCompleted = (subbloque, elementosCompletados) => {
        let totalSubBloqueElements = 0;
        let completedSubBloqueElements = 0;

        if (subbloque.tipo === 'simple') {
            subbloque.subbloques_ejercicios?.forEach(sbe => {
                sbe.series?.forEach(serie => {
                    const serieId = generarIdSerieSimple(subbloque.id, sbe.id, serie.nro_set);
                    totalSubBloqueElements++;
                    if (elementosCompletados[serieId]) {
                        completedSubBloqueElements++;
                    }
                });
            });
        } else if (subbloque.tipo === 'superset') {
            Array.from({ length: subbloque.num_series_superset || 1 }).forEach((_, setIndex) => {
                const setNumeroSuperset = setIndex + 1;
                subbloque.subbloques_ejercicios?.forEach(sbe => {
                    const elementoId = generarIdEjercicioEnSerieDeSuperset(subbloque.id, sbe.id, setNumeroSuperset);
                    totalSubBloqueElements++;
                    if (elementosCompletados[elementoId]) {
                        completedSubBloqueElements++;
                    }
                });
            });
        }
        return totalSubBloqueElements > 0 && totalSubBloqueElements === completedSubBloqueElements;
    };

    const isSubBloqueInProgress = (subbloque, elementosCompletados) => {
        let totalSubBloqueElements = 0;
        let completedSubBloqueElements = 0;

        if (subbloque.tipo === 'simple') {
            subbloque.subbloques_ejercicios?.forEach(sbe => {
                sbe.series?.forEach(serie => {
                    const serieId = generarIdSerieSimple(subbloque.id, sbe.id, serie.nro_set);
                    totalSubBloqueElements++;
                    if (elementosCompletados[serieId]) {
                        completedSubBloqueElements++;
                    }
                });
            });
        } else if (subbloque.tipo === 'superset') {
            Array.from({ length: subbloque.num_series_superset || 1 }).forEach((_, setIndex) => {
                const setNumeroSuperset = setIndex + 1;
                subbloque.subbloques_ejercicios?.forEach(sbe => {
                    const elementoId = generarIdEjercicioEnSerieDeSuperset(subbloque.id, sbe.id, setNumeroSuperset);
                    totalSubBloqueElements++;
                    if (elementosCompletados[elementoId]) {
                        completedSubBloqueElements++;
                    }
                });
            });
        }
        return completedSubBloqueElements > 0 && completedSubBloqueElements < totalSubBloqueElements;
    };

    return (
        <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-2 shadow-lg">
            <div className="relative space-y-4">
                {/* Línea de tiempo base */}
                <div className="absolute left-1 top-4 bottom-4 w-0.5 bg-gray-700"></div>
                {/* Línea de progreso dinámica */}
                <motion.div
                    className="absolute left-1 top-1 w-0.5 bg-cyan-400 rounded-full"
                    initial={{ height: 10 }}
                    animate={{ height: `${progressHeight}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                ></motion.div>
                {[...(bloque.subbloques ?? [])]
                    .sort(sortSubBloques)
                    .map(subbloque => (
                        <SubBloqueDisplay
                            key={subbloque.id}
                            subbloque={subbloque}
                            isCompleted={isSubBloqueCompleted(subbloque, elementosCompletados)}
                            isInProgress={isSubBloqueInProgress(subbloque, elementosCompletados)}
                            {...props}
                        />
                    ))}
            </div>
        </div>
    );
};

export default BloqueDisplay;

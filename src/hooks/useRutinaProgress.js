import { useMemo } from 'react';
import { generarIdSerieSimple, generarIdEjercicioEnSerieDeSuperset } from '../utils/rutinaIds';

const useRutinaProgress = (rutina, elementosCompletados) => {
    const progressData = useMemo(() => {
        if (!rutina) {
            return {
                progressGlobal: 0,
                progressPorBloque: {},
                progressPorSubBloque: {},
                totalSeries: 0,
                seriesCompletadas: 0,
            };
        }

        let totalSeriesRutina = 0;
        let completadasRutina = 0;
        const progressPorBloque = {};
        const progressPorSubBloque = {};

        rutina.bloques.forEach(bloque => {
            let totalSeriesBloque = 0;
            let completadasBloque = 0;

            bloque.subbloques.forEach(subbloque => {
                let totalSeriesSubBloque = 0;
                let completadasSubBloque = 0;

                if (subbloque.tipo === 'simple') {
                    subbloque.subbloques_ejercicios.forEach(sbe => {
                        sbe.series.forEach(serie => {
                            const id = generarIdSerieSimple(subbloque.id, sbe.id, serie.nro_set);
                            totalSeriesSubBloque++;
                            if (elementosCompletados[id]) {
                                completadasSubBloque++;
                            }
                        });
                    });
                } else if (subbloque.tipo === 'superset') {
                    Array.from({ length: subbloque.num_series_superset || 1 }).forEach((_, i) => {
                        const n = i + 1;
                        subbloque.subbloques_ejercicios.forEach(sbe => {
                            const id = generarIdEjercicioEnSerieDeSuperset(subbloque.id, sbe.id, n);
                            totalSeriesSubBloque++;
                            if (elementosCompletados[id]) {
                                completadasSubBloque++;
                            }
                        });
                    });
                }

                totalSeriesBloque += totalSeriesSubBloque;
                completadasBloque += completadasSubBloque;

                const progress = totalSeriesSubBloque > 0 ? (completadasSubBloque / totalSeriesSubBloque) * 100 : 0;
                progressPorSubBloque[subbloque.id] = {
                    progress,
                    isCompleted: totalSeriesSubBloque > 0 && completadasSubBloque === totalSeriesSubBloque,
                    isInProgress: completadasSubBloque > 0 && completadasSubBloque < totalSeriesSubBloque,
                };
            });

            totalSeriesRutina += totalSeriesBloque;
            completadasRutina += completadasBloque;

            progressPorBloque[bloque.id] = {
                progress: totalSeriesBloque > 0 ? (completadasBloque / totalSeriesBloque) * 100 : 0,
            };
        });

        return {
            progressGlobal: totalSeriesRutina > 0 ? (completadasRutina / totalSeriesRutina) * 100 : 0,
            progressPorBloque,
            progressPorSubBloque,
            totalSeries: totalSeriesRutina,
            seriesCompletadas: completadasRutina,
        };
    }, [rutina, elementosCompletados]);

    return progressData;
};

export default useRutinaProgress;

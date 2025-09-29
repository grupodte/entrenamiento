import React from 'react';
import { motion } from 'framer-motion';
import { FaDumbbell, FaCheckCircle } from 'react-icons/fa';
import SerieItem from './SerieItem';
import { generarIdSerieSimple } from '../../utils/rutinaIds';

const EjercicioSimpleDisplay = ({ sbe, subbloqueId, lastSessionData, ...props }) => {
    const ejercicio = sbe.ejercicio;
    const totalSets = sbe.series?.length || 0;
    
    // Calcular si algún set está en progreso
    const hasActiveSet = sbe.series?.some(serie => {
        const serieId = generarIdSerieSimple(subbloqueId, sbe.id, serie.nro_set);
        return props.elementoActivoId === serieId;
    });
    
    // Calcular cuántos sets están completados
    const completedSets = sbe.series?.filter(serie => {
        const serieId = generarIdSerieSimple(subbloqueId, sbe.id, serie.nro_set);
        return !!props.elementosCompletados[serieId];
    }).length || 0;
    
    const allCompleted = completedSets === totalSets && totalSets > 0;

    return (
        <div className="space-y-3">
            {sbe.series?.sort((a, b) => a.nro_set - b.nro_set).map(serie => {
                const serieId = generarIdSerieSimple(subbloqueId, sbe.id, serie.nro_set);
                const isCompletada = !!props.elementosCompletados[serieId];
                const isActive = props.elementoActivoId === serieId;

                return (
                    <SerieItem
                        key={serieId}
                        ref={el => { if (el) props.elementoRefs.current[serieId] = el; }}
                        serieId={serieId}
                        textoPrincipal={ejercicio?.nombre || 'Ejercicio'}
                        nroSet={serie.nro_set}
                        ejercicio={ejercicio}
                        openVideoPanel={props.openVideoPanel}
                        isCompletada={isCompletada}
                        isActive={isActive}
                        onItemClick={props.toggleElementoCompletado}
                        reps={serie.reps}
                        carga={serie.carga_sugerida || serie.carga}
                        pausa={serie.pausa}
                        nota={serie.nota}
                        tipoElemento={'simple'}
                        tipoEjecucion={serie.tipo_ejecucion}
                        duracionSegundos={serie.duracion_segundos}
                        unidadTiempo={serie.unidad_tiempo}
                        lastSessionData={lastSessionData}
                        esEjercicioSimple={true}
                        hideExerciseName={false}
                        blockTheme={props.blockTheme}
                    />
                );
            })}
        </div>
    );
};

export default EjercicioSimpleDisplay;
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
        <div className="space-y-1.5 mt-1">
            <div className={`relative rounded-lg backdrop-blur-md border transition-all duration-200 p-2.5 ${
                allCompleted 
                    ? 'bg-cyan-900/20 border-green-500/40 ring-1 ring-green-400/20'
                    : hasActiveSet 
                        ? 'bg-cyan-900/40 border-cyan-400/60 ring-1 ring-cyan-400/50'
                        : 'bg-cyan-900/15 border-cyan-700/30'
            }`}>
                {/* Header del ejercicio simple */}
                <div className={`flex items-center justify-between mb-2 pb-1.5 border-b transition-all duration-300 ${
                    allCompleted ? 'border-green-600/30' : 'border-cyan-600/20'
                }`}>
                    <div className="flex items-center gap-2">
                        <div className={`flex items-center justify-center w-7 h-7 rounded-full transition-all duration-300 ${
                            allCompleted 
                                ? 'bg-green-600/30 border border-green-500/50 shadow-sm shadow-green-500/20'
                                : 'bg-cyan-600/20 border border-cyan-500/40'
                        }`}>
                            {allCompleted ? (
                                <FaCheckCircle className="text-sm text-green-400" />
                            ) : (
                                <FaDumbbell className="text-xs text-cyan-400" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className={`text-sm font-medium transition-all duration-300 truncate ${
                                allCompleted ? 'text-green-200' : 'text-cyan-200'
                            }`}>
                                {ejercicio?.nombre || 'Ejercicio'}
                            </h4>
                        </div>
                    </div>
                    <div className={`text-xs transition-all duration-300 ${
                        allCompleted ? 'text-green-300/80' : 'text-cyan-300/80'
                    }`}>
                        {completedSets}/{totalSets} sets
                    </div>
                </div>

                {/* Sets individuales */}
                <div className="space-y-2">
                    {sbe.series?.map(serie => {
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
                                lastSessionData={lastSessionData}
                                esEjercicioSimple={true}
                                // Ocultar nombre del ejercicio ya que está en el header
                                hideExerciseName={true}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default EjercicioSimpleDisplay;
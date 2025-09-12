import React, { useState } from 'react';
import { FaCheck, FaPlayCircle } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    EXECUTION_TYPES, 
    getExecutionTypeConfig, 
    TIME_UNITS,
    getTimeUnitConfig,
    convertFromSeconds,
    detectBestTimeUnit 
} from '../../constants/executionTypes';

const SerieItem = React.forwardRef(({
    serieId,
    textoPrincipal,
    isCompletada,
    isActive,
    onItemClick,
    reps,
    carga,
    pausa,
    tipoElemento,
    subbloqueId,
    numSerieSupersetActual,
    lastSessionData,
    classNameExtra = '',
    nroSet,
    ejercicio,
    openVideoPanel,
    nota,
    esEjercicioSimple = false,
    hideExerciseName = false,
    tipoEjecucion = EXECUTION_TYPES.STANDARD,
    duracionSegundos,
    unidadTiempo = TIME_UNITS.MINUTES,
}, ref) => {
    const lastSessionData_item = lastSessionData[`${serieId}`] || {};
    const lastCarga = lastSessionData_item?.carga_realizada || '';
    const lastReps = lastSessionData_item?.reps_realizadas || '';
    const lastDuracion = lastSessionData_item?.duracion_realizada_segundos || '';
    const lastTipoEjecucion = lastSessionData_item?.tipo_ejecucion || tipoEjecucion;
    const config = getExecutionTypeConfig(tipoEjecucion);
    
    // Solo mantener estado para el peso que sigue siendo editable
    const [actualCarga, setActualCarga] = useState(lastCarga || carga || '');

    const variants = {
        inactive: { scale: 1 },
        active: { scale: 1.02 },
        completed: { scale: 1 },
    };

    const status = isCompletada ? 'completed' : isActive ? 'active' : 'inactive';

    const handleClick = () => {
        // En supersets, no manejar clicks individuales - el click es en el contenedor padre
        if (tipoElemento?.includes('superset')) {
            return;
        }
        
        if (onItemClick) {
            const clickData = {
                tipoElemento,
                pausa,
                subbloqueId,
                numSerieSupersetActual,
                actualCarga,
                tipoEjecucion,
            };
            
            // Agregar datos específicos según el tipo de ejecución
            if (tipoEjecucion === EXECUTION_TYPES.STANDARD) {
                clickData.actualReps = parseInt(reps, 10) || 0;
            } else if (tipoEjecucion === EXECUTION_TYPES.TIEMPO) {
                // Usar duración en segundos directamente
                clickData.actualDuracion = duracionSegundos || 0;
            } else if (tipoEjecucion === EXECUTION_TYPES.FALLO) {
                clickData.actualReps = parseInt(reps, 10) || 0; // Usar reps originales
            }
            
            onItemClick(serieId, clickData);
        }
    };

    // Extraer el nombre del ejercicio del texto principal
    const nombreEjercicio = textoPrincipal.split(' — ')[0] || textoPrincipal.split(': ')[1] || textoPrincipal;

    // Determinar colores según el tipo (superset vs ejercicio simple)
    const getItemStyles = () => {
        const isSuperset = tipoElemento?.includes('superset');
        const baseColor = isSuperset ? 'violet' : 'cyan';
        
        if (isCompletada) {
            return `bg-gray-800/40 border-green-500/50 ring-1 ring-green-400/30`;
        }
        // En supersets NO resaltar ejercicios individuales, solo el conjunto completo
        if (isActive && !isSuperset) {
            return `bg-gray-800/60 border-${baseColor}-400/50 ring-2 ring-${baseColor}-400/40 shadow-lg shadow-${baseColor}-500/20`;
        }
        // Estilo base más sutil para supersets
        if (isSuperset) {
            return `bg-gray-800/20 border-gray-700/30`;
        }
        return `bg-gray-800/30 border-gray-600/40 hover:bg-gray-800/50 hover:border-${baseColor}-500/30`;
    };

    const getAccentColor = () => {
        const isSuperset = tipoElemento?.includes('superset');
        return isSuperset ? 'violet' : 'cyan';
    };

    const accentColor = getAccentColor();

    return (
        <motion.div
            ref={ref}
            layout
            variants={variants}
            animate={status}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            onClick={handleClick}
            className={`
                        relative w-full rounded-lg p-2.5 transition-all duration-200
                        backdrop-blur-md border min-h-[40px] touch-manipulation
                        ${tipoElemento?.includes('superset') ? 'cursor-default' : 'cursor-pointer'}
                        ${getItemStyles()}
                        ${classNameExtra}
                    `}
            role="button"
            tabIndex={0}
            aria-pressed={isCompletada}
        >
            {/* Header compacto con nombre y controles - condicional */}
            {(!hideExerciseName || ejercicio?.video_url || isCompletada || nota) && (
                <div className="flex items-center justify-between mb-2">
                    <div className="flex-1 min-w-0">
                        {!hideExerciseName && (
                            <h4 className="text-sm font-medium text-white truncate">
                                {nombreEjercicio}
                            </h4>
                        )}
                        {nota && (
                            <p className="text-[10px] text-white/60 mt-0.5 truncate">{nota}</p>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {ejercicio?.video_url && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    openVideoPanel(ejercicio.video_url);
                                }}
                                className={`p-1.5 rounded-full text-${accentColor}-400 active:text-${accentColor}-300 touch-manipulation`}
                                aria-label="Ver video"
                            >
                                <FaPlayCircle className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Grid adaptativo: 2 columnas para supersets, 4 para ejercicios simples */}
            <div className={`grid gap-2 text-center ${
                tipoElemento?.includes('superset') ? 'grid-cols-2' : 'grid-cols-4'
            }`}>
                {/* Set - Solo mostrar en ejercicios simples */}
                {!tipoElemento?.includes('superset') && (
                    <div>
                        <label className="block text-[10px] font-medium text-gray-400 mb-1 uppercase">
                            Set
                        </label>
                        <div className={`relative text-lg font-bold text-white bg-gray-900/50 py-1.5 rounded border border-gray-600/30 ${
                            isCompletada ? 'bg-green-600/30 border-green-500/50' : ''
                        }`}>
                            {nroSet || '0'}
                            {/* Check absolute en la esquina del set */}
                            {isCompletada && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                    <FaCheck className="w-2 h-2 text-white" />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Campo principal según tipo de ejecución */}
                <div>
                    {tipoEjecucion === EXECUTION_TYPES.STANDARD && (
                        <>
                            <label className="block text-[10px] font-medium text-gray-400 mb-1 uppercase">
                                Reps
                            </label>
                            <div className="w-full text-lg font-bold text-center py-1.5 rounded bg-gray-900/50 text-white border border-gray-600/30">
                                {reps || '0'}
                            </div>
                        </>
                    )}
                    
                    {tipoEjecucion === EXECUTION_TYPES.TIEMPO && (
                        (() => {
                            // Detectar la mejor unidad o usar la especificada
                            const unidadFinal = unidadTiempo || detectBestTimeUnit(duracionSegundos);
                            const config = getTimeUnitConfig(unidadFinal);
                            const valorTiempo = duracionSegundos ? convertFromSeconds(duracionSegundos, unidadFinal) || '0' : '0';
                            
                            return (
                                <>
                                    <label className="block text-[10px] font-medium text-gray-400 mb-1 uppercase">
                                        <span>{config.label}</span>
                                    </label>
                                    <div className="w-full text-lg font-bold text-center py-1.5 rounded bg-blue-900/50 text-white border border-blue-600/30 flex items-center justify-center gap-1">
                                        <span>{valorTiempo}</span>
                                    </div>
                                </>
                            );
                        })()
                    )}
                    
                    {tipoEjecucion === EXECUTION_TYPES.FALLO && (
                        <>
                            <label className="block text-[10px] font-medium text-gray-400 mb-1 uppercase">
                                Ejecución
                            </label>
                            <div className="text-sm font-bold text-orange-300 bg-orange-900/50 py-1.5 rounded border border-orange-600/30 flex items-center justify-center">
                                Al Fallo
                            </div>
                        </>
                    )}
                </div>

                {/* Peso */}
                <div>
                    <label className="block text-[10px] font-medium text-gray-400 mb-1 uppercase">
                        Peso
                    </label>
                    <input
                        type="text"
                        value={actualCarga}
                        onChange={(e) => setActualCarga(e.target.value)}
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                        }}
                        onFocus={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        placeholder="0kg"
                        className={`w-full text-lg font-bold text-center py-1.5 rounded bg-gray-900/50 text-white border border-gray-600/30 focus:ring-1 focus:ring-${accentColor}-400/40 focus:outline-none focus:border-${accentColor}-400/50 touch-manipulation`}
                    />
                </div>

                {/* Pausa - Solo mostrar en ejercicios simples */}
                {!tipoElemento?.includes('superset') && (
                    <div>
                        <label className="block text-[10px] font-medium text-gray-400 mb-1 uppercase">
                            Pausa
                        </label>
                        <div className={`text-sm font-bold py-1.5 rounded border border-gray-600/30 ${
                            isCompletada ? 'bg-green-600/30 border-green-500/50 text-green-100' : 'bg-gray-900/50 text-white'
                        }`}>
                            {pausa && pausa > 0 ? `${pausa}s` : 'Sin pausa'}
                        </div>
                    </div>
                )}
            </div>

            {/* Overlay completado */}
            {isCompletada && (
                <div className="absolute inset-0 bg-gray-600/5 rounded-lg pointer-events-none" />
            )}
        </motion.div>
    );
});

SerieItem.displayName = 'SerieItem';
export default SerieItem;
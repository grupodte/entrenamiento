import React from 'react';
import { motion } from 'framer-motion';
import { FaDumbbell, FaCheckCircle } from 'react-icons/fa';
import SerieItem from './SerieItem';
import { generarIdSerieSimple } from '../../utils/rutinaIds';
import tickRutina from '../../assets/tick-rutina.svg';
import pausaRutina from '../../assets/pausa-clock-rutina.svg';
import { useUniversalTouch } from '../../hooks/useUniversalTouch';

const EjercicioSimpleDisplay = ({ sbe, subbloqueId, lastSessionData, ...props }) => {
    const ejercicio = sbe.ejercicio;
    const totalSets = sbe.series?.length || 0;
    
    const handleToggleSimpleSet = (setNumero) => {
        const serieId = generarIdSerieSimple(subbloqueId, sbe.id, setNumero);
        const detalleSerie = sbe.series?.find(s => s.nro_set === setNumero);
        const pausaSet = detalleSerie?.pausa || 0;
        
        // Capturar datos del ejercicio antes de completar
        const elementRef = props.elementoRefs.current[serieId];
        let exerciseData = {};
        
        if (elementRef) {
            const tipoEjecucion = detalleSerie?.tipo_ejecucion || 'standard';
            
            // Intentar obtener la carga mediante el método expuesto por el ref
            let actualCarga = '0';
            if (elementRef.getActualCarga && typeof elementRef.getActualCarga === 'function') {
                actualCarga = elementRef.getActualCarga() || '0';
            } else {
                // Fallback: buscar el input de peso en el DOM (para vista legacy)
                const inputCarga = elementRef.querySelector && elementRef.querySelector('input[type="text"]');
                actualCarga = inputCarga?.value || '0';
            }
            
            exerciseData = {
                actualCarga,
                tipoEjecucion,
            };
            
            // Agregar datos específicos según tipo de ejecución
            if (tipoEjecucion === 'standard') {
                // En la vista minimal no hay input de reps, usar el valor de la configuración
                const inputReps = elementRef.querySelector && elementRef.querySelector('input[type="number"]');
                exerciseData.actualReps = inputReps?.value 
                    ? parseInt(inputReps.value, 10) 
                    : parseInt(detalleSerie?.reps || '0', 10);
            } else if (tipoEjecucion === 'tiempo') {
                // Para ejercicios de tiempo, usar la duración configurada
                const inputTiempo = elementRef.querySelector && elementRef.querySelector('input[type="number"]');
                if (inputTiempo?.value) {
                    const minutos = parseInt(inputTiempo.value, 10);
                    exerciseData.actualDuracion = minutos * 60;
                } else {
                    exerciseData.actualDuracion = detalleSerie?.duracion_segundos || 0;
                }
            } else if (tipoEjecucion === 'fallo') {
                // Para al fallo, usar 0 reps como indicador o valor por defecto
                const inputReps = elementRef.querySelector && elementRef.querySelector('input[type="number"]');
                exerciseData.actualReps = inputReps?.value 
                    ? parseInt(inputReps.value, 10) 
                    : 0; // Al fallo no tiene reps específicas
            }
        } else {
            // Si no hay elementRef, usar valores por defecto
            console.warn('No se encontró elementRef para', serieId);
            const tipoEjecucion = detalleSerie?.tipo_ejecucion || 'standard';
            exerciseData = {
                actualCarga: detalleSerie?.carga || '0',
                tipoEjecucion: tipoEjecucion,
                actualReps: tipoEjecucion === 'standard' ? parseInt(detalleSerie?.reps || '0', 10) : undefined,
                actualDuracion: tipoEjecucion === 'tiempo' ? detalleSerie?.duracion_segundos || 0 : undefined
            };
        }

        
        props.toggleElementoCompletado(serieId, {
            tipoElemento: 'simple',
            pausa: pausaSet,
            subbloqueId: subbloqueId,
            actualCarga: exerciseData.actualCarga,
            tipoEjecucion: exerciseData.tipoEjecucion,
            actualReps: exerciseData.actualReps,
            actualDuracion: exerciseData.actualDuracion
        });
    };

    return (
        <div className="space-y-4">
            {sbe.series?.sort((a, b) => a.nro_set - b.nro_set).map(serie => {
                const serieId = generarIdSerieSimple(subbloqueId, sbe.id, serie.nro_set);
                const isCompletada = !!props.elementosCompletados[serieId];
                const isActive = props.elementoActivoId === serieId;
                const setNumero = serie.nro_set;

                return (
                    <div
                        key={serieId}
                        className={`relative rounded-[10px] transition-all duration-200 ease-in-out ${
                            isCompletada 
                            ? 'border-2 border-[#47D065] opacity-60' 
                                : isActive 
                                ? 'bg-[#E7E7E7] border-2 border-[#FF0000]'
                                : 'bg-[#E7E7E7]'
                        }`}
                    >
                        {/* Header del ejercicio simple */}
                        <div className="flex items-center justify-between w-full px-6 py-4">
                            {/* Lado izquierdo: Set */}
                            <div className="flex items-center gap-2">
                                <h4 className="text-[25px] font-semibold text-gray-800">
                                    Set {setNumero} {totalSets > 1 && `de ${totalSets}`}
                                </h4>
                            </div>

                            {/* Lado derecho: checkbox style */}
                            <TouchButtonWrapper
                                onClick={() => handleToggleSimpleSet(setNumero)}
                                className="flex items-center gap-2 cursor-pointer"
                            >
                                <span className="text-[8px] text-gray-600 select-none">
                                    Marcar al finalizar
                                </span>
                                <div className={`w-[44px] h-[44px] rounded  flex items-center justify-center transition-all rounded-[8px] ${
                                    isCompletada 
                                    ? 'bg-[#47D065]' 
                                    : 'bg-[#C1C1C1] '
                                }`}>
                                    {isCompletada && (
                                        <img src={tickRutina} alt="Completado" className="w-4 h-4" />
                                    )}
                                </div>
                            </TouchButtonWrapper>
                        </div>

                        {/* Contenido adicional - oculto cuando completado */}
                        <div className={`transition-opacity duration-200 ease-in-out ${isCompletada ? 'hidden' : 'block'}`}>
                            {/* Info secundaria */}
                            <div className="flex items-center justify-center mt-2 text-[20px] text-[#3F3F3F] bg-[#D0D0D0] px-4 py-2 rounded-[12px]">
                                <span className="flex items-center gap-2">
                                    <img src={pausaRutina} alt="Icono pausa" className="w-5 h-5" />
                                    {serie.pausa > 0 ? `Pausa ${serie.pausa}s` : 'Sin pausa'}
                                </span>
                            </div>

                            {/* Ejercicio */}
                            <div className="space-y-3">
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
                                    onItemClick={null}
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
                                    classNameExtra="!cursor-default"
                                />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// Componente wrapper para usar touch optimizado con divs
const TouchButtonWrapper = ({ onClick, className, children }) => {
    const touchProps = useUniversalTouch(onClick, {
        preventDoubleClick: true,
        doubleClickDelay: 200,
        scaleOnTouch: true,
        scaleValue: 0.95,
        hapticFeedback: true,
        minTouchSize: true
    });

    return (
        <div
            ref={touchProps.ref}
            className={className}
            style={touchProps.style}
            onTouchStart={touchProps.onTouchStart}
            onTouchEnd={touchProps.onTouchEnd}
            onTouchCancel={touchProps.onTouchCancel}
            onClick={touchProps.onClick}
        >
            {children}
        </div>
    );
};

export default EjercicioSimpleDisplay;

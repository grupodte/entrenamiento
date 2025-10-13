// src/components/RutinaDetalle/SupersetDisplay.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { FaExchangeAlt, FaCheckCircle } from 'react-icons/fa';
import SerieItem from './SerieItem';
import { generarIdEjercicioEnSerieDeSuperset } from '../../utils/rutinaIds';
import tickRutina from '../../assets/tick-rutina.svg';
import pausaRutina from '../../assets/pausa-clock-rutina.svg';
import { useUniversalTouch } from '../../hooks/useUniversalTouch';

const SupersetDisplay = ({ subbloque, lastSessionData, ...props }) => {
    const totalSeries = subbloque.num_series_superset || 1;

    const handleToggleSupersetSet = (setNumero) => {
        const childIds = subbloque.subbloques_ejercicios.map(sbe =>
            generarIdEjercicioEnSerieDeSuperset(subbloque.id, sbe.id, setNumero)
        );

        let pausaSet = subbloque.pausa_compartida || 0;
        if (!pausaSet) {
            subbloque.subbloques_ejercicios.forEach(sbe => {
                const detalleSerie = sbe.series?.find(s => s.nro_set === setNumero) || sbe.series?.[0];
                if (detalleSerie?.pausa > pausaSet) {
                    pausaSet = detalleSerie.pausa;
                }
            });
        }

        // Capturar datos de cada ejercicio del superset antes de completar
        const exerciseData = {};
        childIds.forEach((childId, index) => {
            const sbe = subbloque.subbloques_ejercicios[index];
            const detalleSerie = sbe.series?.find(s => s.nro_set === setNumero) || sbe.series?.[0];
            const tipoEjecucion = detalleSerie?.tipo_ejecucion || 'standard';
            
            const elementRef = props.elementoRefs.current[childId];
            if (elementRef) {
                // Intentar obtener la carga mediante el método expuesto por el ref
                let actualCarga = '0';
                if (elementRef.getActualCarga && typeof elementRef.getActualCarga === 'function') {
                    actualCarga = elementRef.getActualCarga() || '0';
                } else {
                    // Fallback: buscar el input de peso en el DOM (para vista legacy)
                    const inputCarga = elementRef.querySelector('input[type="text"]');
                    actualCarga = inputCarga?.value || '0';
                }
                
                // Datos básicos
                exerciseData[childId] = {
                    actualCarga,
                    tipoEjecucion,
                };
                
                // Agregar datos específicos según tipo de ejecución
                if (tipoEjecucion === 'standard') {
                    // En la vista minimal no hay input de reps, usar el valor de la configuración
                    const inputReps = elementRef.querySelector && elementRef.querySelector('input[type="number"]');
                    exerciseData[childId].actualReps = inputReps?.value 
                        ? parseInt(inputReps.value, 10) 
                        : parseInt(detalleSerie?.reps || '0', 10);
                } else if (tipoEjecucion === 'tiempo') {
                    // Para ejercicios de tiempo, usar la duración configurada
                    const inputTiempo = elementRef.querySelector && elementRef.querySelector('input[type="number"]');
                    if (inputTiempo?.value) {
                        const minutos = parseInt(inputTiempo.value, 10);
                        exerciseData[childId].actualDuracion = minutos * 60;
                    } else {
                        exerciseData[childId].actualDuracion = detalleSerie?.duracion_segundos || 0;
                    }
                } else if (tipoEjecucion === 'fallo') {
                    // Para al fallo, usar 0 reps como indicador o valor por defecto
                    const inputReps = elementRef.querySelector && elementRef.querySelector('input[type="number"]');
                    exerciseData[childId].actualReps = inputReps?.value 
                        ? parseInt(inputReps.value, 10) 
                        : 0; // Al fallo no tiene reps específicas
                }
            } else {
                // Si no hay elementRef, usar valores por defecto
                console.warn('No se encontró elementRef para', childId);
                exerciseData[childId] = {
                    actualCarga: detalleSerie?.carga || '0',
                    tipoEjecucion: tipoEjecucion,
                    actualReps: tipoEjecucion === 'standard' ? parseInt(detalleSerie?.reps || '0', 10) : undefined,
                    actualDuracion: tipoEjecucion === 'tiempo' ? detalleSerie?.duracion_segundos || 0 : undefined
                };
            }
        });

        props.toggleElementoCompletado({
            tipoElemento: 'superset_set',
            childIds: childIds,
            pausa: pausaSet,
            exerciseData: exerciseData // Pasar los datos de cada ejercicio
        });
    };

    return (
        <div className="space-y-4">
            {Array.from({ length: totalSeries }).map((_, setIndex) => {
                const setNumero = setIndex + 1;

                const primerIdDelSet = subbloque.subbloques_ejercicios.length > 0
                    ? generarIdEjercicioEnSerieDeSuperset(subbloque.id, subbloque.subbloques_ejercicios[0].id, setNumero)
                    : null;
                const completado = primerIdDelSet ? !!props.elementosCompletados[primerIdDelSet] : false;

                const isActive = subbloque.subbloques_ejercicios.some(sbe =>
                    generarIdEjercicioEnSerieDeSuperset(subbloque.id, sbe.id, setNumero) === props.elementoActivoId
                );

                // Calcular pausa del set
                let pausaSet = subbloque.pausa_compartida || 0;
                if (!pausaSet) {
                    subbloque.subbloques_ejercicios.forEach(sbe => {
                        const detalleSerie = sbe.series?.find(s => s.nro_set === setNumero) || sbe.series?.[0];
                        if (detalleSerie?.pausa > pausaSet) {
                            pausaSet = detalleSerie.pausa;
                        }
                    });
                }

                return (
                    <div
                        key={`ss-${subbloque.id}-s${setNumero}`}
                        className={`relative rounded-[10px] transition-all duration-200 ease-in-out ${
                            completado 
                            ? ' border-2 border-[#47D065] opacity-60' 
                                : isActive 
                                ? 'bg-[#E7E7E7] border-2 border-[#FF0000]'
                                : 'bg-[#E7E7E7] '
                        }`}
                    >
                        {/* Header del superset */}
                        <div className="flex items-center justify-between w-full px-4 py-4">
                            {/* Lado izquierdo: Icono + Set */}
                            <div className="flex items-center gap-2">
                                
                                <h4 className="text-[25px] font-semibold text-gray-800">
                                    Set {setNumero} {totalSeries > 1 && `de ${totalSeries}`}
                                </h4>
                            </div>

                            {/* Lado derecho: checkbox style */}
                            <TouchButtonWrapper
                                onClick={() => handleToggleSupersetSet(setNumero)}
                                className="flex items-center gap-2 cursor-pointer"
                            >
                                <span className="text-[8px] text-gray-600 select-none">
                                    Marcar al finalizar
                                </span>
                                <div className={`w-[44px] h-[44px] rounded  flex items-center justify-center transition-all rounded-[8px] ${
                                    completado 
                                    ? 'bg-[#47D065]' 
                                    : 'bg-[#C1C1C1] '
                                }`}>
                                    {completado && (
                                        <img src={tickRutina} alt="Completado" className="w-4 h-4" />
                                    )}
                                </div>
                            </TouchButtonWrapper>
                        </div>

                        {/* Contenido adicional - oculto cuando completado */}
                        <div className={`transition-opacity duration-200 ease-in-out ${completado ? 'hidden' : 'block'}`}>
                            {/* Info secundaria */}
                            <div className="flex items-center justify-between mt-2 text-[20px] text-[#3F3F3F] bg-[#D0D0D0] px-4 py-2 rounded-[12px]">
                                <span>{subbloque.subbloques_ejercicios.length} Ejercicios</span>

                                <span className="flex items-center gap-2">
                                    <img src={pausaRutina} alt="Icono pausa" className="w-5 h-5" />
                                    {pausaSet > 0 ? `Pausa ${pausaSet}s` : 'Sin pausa'}
                                </span>
                            </div>

                            {/* Lista de ejercicios del superset */}
                            <div className="space-y-3">
                                {subbloque.subbloques_ejercicios.map((sbe, index) => {
                                    const elementoId = generarIdEjercicioEnSerieDeSuperset(
                                        subbloque.id,
                                        sbe.id,
                                        setNumero
                                    );

                                    const detalleSerie =
                                        sbe.series?.find((s) => s.nro_set === setNumero) || sbe.series?.[0];
                                    const reps = detalleSerie?.reps || '';
                                    const carga = detalleSerie?.carga_sugerida || detalleSerie?.carga || '';
                                    const pausa = subbloque.pausa_compartida || detalleSerie?.pausa || 0;
                                    const nota = detalleSerie?.nota || '';
                                    const isCompletada = !!props.elementosCompletados[elementoId];
                                    const isLastInGroup = index === subbloque.subbloques_ejercicios.length - 1;

                                    return (
                                        <SerieItem
                                            key={elementoId}
                                            ref={(el) => {
                                                if (el) props.elementoRefs.current[elementoId] = el;
                                            }}
                                            serieId={elementoId}
                                            textoPrincipal={`${sbe.ejercicio?.nombre || 'Ejercicio'}`}
                                            nroSet={setNumero}
                                            isCompletada={isCompletada}
                                            isActive={props.elementoActivoId === elementoId}
                                            reps={reps}
                                            carga={carga}
                                            pausa={pausa}
                                            nota={nota}
                                            tipoElemento="superset_ejercicio"
                                            tipoEjecucion={detalleSerie?.tipo_ejecucion}
                                            duracionSegundos={detalleSerie?.duracion_segundos}
                                            unidadTiempo={detalleSerie?.unidad_tiempo}
                                            subbloqueId={subbloque.id}
                                            numSerieSupersetActual={setNumero}
                                            lastSessionData={lastSessionData}
                                            ejercicio={sbe.ejercicio}
                                            openVideoPanel={props.openVideoPanel}
                                            hideExerciseName={false}
                                            blockTheme={props.blockTheme}
                                            classNameExtra="!cursor-default"
                                            index={index}
                                            isLastInGroup={isLastInGroup}
                                        />
                                    );
                                })}
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

export default SupersetDisplay;

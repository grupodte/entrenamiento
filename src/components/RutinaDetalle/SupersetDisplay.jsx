// src/components/RutinaDetalle/SupersetDisplay.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { FaExchangeAlt, FaCheckCircle } from 'react-icons/fa';
import SerieItem from './SerieItem';
import { generarIdEjercicioEnSerieDeSuperset } from '../../utils/rutinaIds';

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
                // Obtener el input de peso (siempre presente)
                const inputCarga = elementRef.querySelector('input[type="text"]');
                const actualCarga = inputCarga?.value || '0';
                
                // Datos básicos
                exerciseData[childId] = {
                    actualCarga,
                    tipoEjecucion,
                };
                
                // Agregar datos específicos según tipo de ejecución
                if (tipoEjecucion === 'standard') {
                    const inputReps = elementRef.querySelector('input[type="number"]');
                    exerciseData[childId].actualReps = parseInt(inputReps?.value || detalleSerie?.reps || '0', 10);
                } else if (tipoEjecucion === 'tiempo') {
                    const inputTiempo = elementRef.querySelector('input[type="number"]');
                    // Convertir de minutos a segundos
                    const minutos = parseInt(inputTiempo?.value || (detalleSerie?.duracion_segundos ? Math.round(detalleSerie.duracion_segundos / 60) : 0), 10);
                    exerciseData[childId].actualDuracion = minutos * 60;
                } else if (tipoEjecucion === 'fallo') {
                    const inputReps = elementRef.querySelector('input[type="number"]');
                    exerciseData[childId].actualReps = parseInt(inputReps?.value || '0', 10);
                }
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
        <div className="space-y-1.5 mt-1">
            {Array.from({ length: totalSeries }).map((_, setIndex) => {
                const setNumero = setIndex + 1;

                const primerIdDelSet = subbloque.subbloques_ejercicios.length > 0
                    ? generarIdEjercicioEnSerieDeSuperset(subbloque.id, subbloque.subbloques_ejercicios[0].id, setNumero)
                    : null;
                const completado = primerIdDelSet ? !!props.elementosCompletados[primerIdDelSet] : false;

                const isActive = subbloque.subbloques_ejercicios.some(sbe =>
                    generarIdEjercicioEnSerieDeSuperset(subbloque.id, sbe.id, setNumero) === props.elementoActivoId
                );

                // Estilos optimizados para móvil con resaltado del conjunto completo
                const getSetStyles = () => {
                    if (completado) {
                        return 'bg-black border-green-500/40 ';
                    }
                    if (isActive) {
                        return ' bg-[#C6C6C6] border-[#FFFFFF] ';
                    }
                    return '  ';
                };

                return (
                    <motion.section
                        key={`ss-${subbloque.id}-s${setNumero}`}
                        aria-labelledby={`title-ss-${subbloque.id}-s${setNumero}`}
                        onClick={() => handleToggleSupersetSet(setNumero)}
                        className={`relative rounded-lg backdrop-blur-md cursor-pointer transition-all duration-200 border p-3 min-h-[44px] touch-manipulation ${getSetStyles()}`}
                        whileTap={{ scale: 0.98 }}
                    >
                        {/* Header del superset con número de set */}
                        <div className={`flex items-center justify-between mb-2 pb-2 border-b transition-all duration-300 ${
                            completado ? 'border-green-600/30' : 'border-violet-600/20'
                        }`}>
                            <div className="flex items-center gap-2">
                                <div className={`flex items-center justify-center w-7 h-7 rounded-full transition-all duration-300 ${
                                    completado 
                                        ? 'bg-green-600/30 border border-green-500/50 shadow-sm shadow-green-500/20'
                                        : 'bg-violet-600/20 border border-violet-500/40'
                                }`}>
                                    {completado ? (
                                        <FaCheckCircle className="text-sm text-green-400" />
                                    ) : (
                                        <FaExchangeAlt className="text-xs text-violet-400" />
                                    )}
                                </div>
                                <span className={`text-sm font-medium transition-all duration-300 ${
                                    completado ? 'text-green-200' : 'text-violet-200'
                                }`}>
                                    Set {setNumero}
                                    {totalSeries > 1 && (
                                        <span className={`text-xs ml-1 ${
                                            completado ? 'text-green-300/70' : 'text-violet-300/60'
                                        }`}>
                                            de {totalSeries}
                                        </span>
                                    )}
                                </span>
                            </div>
                            <div className={`text-xs transition-all duration-300 flex flex-col items-end ${
                                completado ? 'text-green-300/80' : 'text-violet-300/80'
                            }`}>
                                <span>{subbloque.subbloques_ejercicios.length} ejercicios</span>
                                {(() => {
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
                                        <span className={`text-[10px] font-medium ${
                                            completado 
                                                ? 'text-green-100 opacity-90' 
                                                : 'text-violet-100 opacity-95'
                                        }`}>
                                            {pausaSet > 0 ? `Pausa: ${pausaSet}s` : 'Sin pausa'}
                                        </span>
                                    );
                                })()}
                            </div>
                        </div>

                        <div className="space-y-2">
                            {subbloque.subbloques_ejercicios.map((sbe) => {
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
                                        classNameExtra="!cursor-default"
                                    />
                                );
                            })}
                        </div>
                    </motion.section>
                );
            })}
        </div>
    );
};

export default SupersetDisplay;
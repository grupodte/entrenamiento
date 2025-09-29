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
                    <motion.div
                        key={`ss-${subbloque.id}-s${setNumero}`}
                        onClick={() => handleToggleSupersetSet(setNumero)}
                        className={`relative rounded-2xl p-4 cursor-pointer transition-all duration-200 shadow-sm touch-manipulation ${
                            completado 
                                ? 'bg-green-50 border-2 border-green-500' 
                                : isActive 
                                    ? 'bg-red-50 border-2 border-red-500 ring-2 ring-red-200'
                                    : 'bg-white border-2 border-gray-200 hover:border-gray-300'
                        }`}
                        whileTap={{ scale: 0.98 }}
                    >
                        {/* Header del superset */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                    completado 
                                        ? 'bg-green-500' 
                                        : props.blockTheme?.iconColor || 'bg-red-500'
                                }`}>
                                    {completado ? (
                                        <FaCheckCircle className="text-white text-sm" />
                                    ) : (
                                        <FaExchangeAlt className="text-white text-sm" />
                                    )}
                                </div>
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-800">
                                        Set {setNumero} {totalSeries > 1 && `de ${totalSeries}`}
                                    </h4>
                                    <p className="text-sm text-gray-600">
                                        {subbloque.subbloques_ejercicios.length} ejercicios
                                        {pausaSet > 0 && ` • Pausa: ${pausaSet}s`}
                                    </p>
                                </div>
                            </div>

                            {/* Botón ¡LISTO! */}
                            {!completado && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleSupersetSet(setNumero);
                                    }}
                                    className="px-4 py-2 bg-gray-800 text-white rounded-xl font-semibold hover:bg-gray-700 transition-colors touch-manipulation"
                                >
                                    ¡LISTO!
                                </button>
                            )}
                        </div>

                        {/* Lista de ejercicios del superset */}
                        <div className="space-y-3">
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
                                        hideExerciseName={false}
                                        blockTheme={props.blockTheme}
                                        classNameExtra="!cursor-default"
                                    />
                                );
                            })}
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
};

export default SupersetDisplay;

// src/components/RutinaDetalle/SupersetDisplay.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { FaExchangeAlt, FaCheckCircle } from 'react-icons/fa';
import SerieItem from './SerieItem';
import { generarIdEjercicioEnSerieDeSuperset } from '../../utils/rutinaIds';
import tickRutina from '../../assets/tick-rutina.svg';
import pausaRutina from '../../assets/pausa-clock-rutina.svg';

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
                            <div 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleSupersetSet(setNumero);
                                }}
                                className="flex items-center gap-2 cursor-pointer touch-manipulation"
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
                            </div>
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

export default SupersetDisplay;

import React from 'react';
import SerieItem from './SerieItem'; // Reutilizaremos SerieItem para los ejercicios dentro del superset
import { generarIdEjercicioEnSerieDeSuperset } from '../../utils/rutinaIds';

// Icono de Check (si no se importa globalmente o desde utils)
const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5 inline-block text-green-300">
        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
    </svg>
);

const SupersetDisplay = ({
    subbloque, // subBloqueData completo
    elementosCompletados,
    elementoActivoId,
    toggleElementoCompletado,
    activarTemporizadorPausa,
    showRestTimer,
    elementoRefs,
    providePausaContext // (serieSupersetId, tipo) => ({ nombreSiguiente, idParaTimer })
}) => {
    return (
        <div className="space-y-2 sm:space-y-2.5">
            {Array.from({ length: subbloque.num_series_superset || 1 }).map((_, setIndex) => {
                const setNumeroSuperset = setIndex + 1;
                // ID para la serie completa del superset (usado para el botón de pausa manual)
                const serieSupersetPausaId = `superset-${subbloque.id}-serie${setNumeroSuperset}-pausa`;

                const todosEjerciciosDeEstaSerieCompletados = subbloque.subbloques_ejercicios.every(sbe_c =>
                    !!elementosCompletados[generarIdEjercicioEnSerieDeSuperset(subbloque.id, sbe_c.id, setNumeroSuperset)]
                );

                const pausaContext = providePausaContext ? providePausaContext(serieSupersetPausaId, 'superset_serie_pausa', setNumeroSuperset) : { nombreSiguiente: `Pausa Superset S${setNumeroSuperset}`, idParaTimer: serieSupersetPausaId };

                return (
                    <div
                        key={`ss-${subbloque.id}-s${setNumeroSuperset}`}
                        className={`p-2 sm:p-2.5 rounded-lg shadow-md transition-colors duration-200 ${todosEjerciciosDeEstaSerieCompletados ? 'bg-green-700/50 border border-green-600/70' : 'bg-slate-700/40 border border-transparent'}`}
                    >
                        <h5 className="font-medium text-white/95 mb-1.5 flex justify-between items-center text-sm sm:text-base">
                            Serie {setNumeroSuperset} del Superset
                            {todosEjerciciosDeEstaSerieCompletados && <CheckIcon />}
                        </h5>
                        <div className="space-y-1.5">
                            {subbloque.subbloques_ejercicios.map((sbe, sbeIdx) => {
                                const elementoId = generarIdEjercicioEnSerieDeSuperset(subbloque.id, sbe.id, setNumeroSuperset);
                                const isCompletada = !!elementosCompletados[elementoId];
                                const isActive = elementoActivoId === elementoId;

                                const detalleSerieEjercicio = sbe.series?.find(s => s.nro_set === setNumeroSuperset) || sbe.series?.[0];
                                const reps = detalleSerieEjercicio?.reps || 'N/A';
                                const peso = detalleSerieEjercicio?.peso;

                                return (
                                    <SerieItem
                                        key={elementoId}
                                        ref={el => { if (el) elementoRefs.current[elementoId] = el; }}
                                        serieId={elementoId}
                                        textoPrincipal={`${sbeIdx + 1}. ${sbe.ejercicio?.nombre || 'Ej.'}: ${reps} ${peso ? `(${peso}kg)` : ''}`}
                                        isCompletada={isCompletada}
                                        isActive={isActive}
                                        showPausaButton={false} // La pausa es global para el superset, no por ejercicio interno
                                        onItemClick={() => toggleElementoCompletado(elementoId, {
                                            tipoElemento: 'superset_ejercicio',
                                            subbloqueId: subbloque.id,
                                            ejercicioId: sbe.id, // ID del subbloque_ejercicio
                                            nroSet: setNumeroSuperset, // Número de la serie del superset
                                            pausaSuperset: subbloque.pausa_entre_series_superset,
                                            numSerieSupersetActual: setNumeroSuperset,
                                            totalSeriesSuperset: subbloque.num_series_superset || 1,
                                        })}
                                        isSupersetEjercicio={true}
                                    />
                                );
                            })}
                        </div>
                        {todosEjerciciosDeEstaSerieCompletados && subbloque.pausa_entre_series_superset && (setNumeroSuperset < (subbloque.num_series_superset || 1)) && !showRestTimer &&
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    activarTemporizadorPausa(
                                        subbloque.pausa_entre_series_superset,
                                        pausaContext.nombreSiguiente,
                                        pausaContext.idParaTimer
                                    );
                                }}
                                className="mt-2 w-full bg-indigo-600 hover:bg-indigo-500 text-white text-[0.7rem] sm:text-xs px-2 py-1 rounded"
                                aria-label={`Iniciar pausa del superset serie ${setNumeroSuperset}`}
                            >
                                Pausa Superset ({subbloque.pausa_entre_series_superset}s)
                            </button>
                        }
                    </div>
                );
            })}
        </div>
    );
};

export default SupersetDisplay;
    
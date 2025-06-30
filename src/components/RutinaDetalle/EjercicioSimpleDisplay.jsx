import React from 'react';
import SerieItem from './SerieItem';
import { generarIdSerieSimple } from '../../utils/rutinaIds';

const EjercicioSimpleDisplay = ({
    sbe,
    subbloqueId,
    elementosCompletados,
    elementoActivoId,
    toggleElementoCompletado,
    activarTemporizadorPausa,
    showRestTimer, // Para saber si se debe mostrar el botón de pausa manual
    elementoRefs,
    // Props para el nombre del siguiente ejercicio en pausa manual
    providePausaContext // Función: (serieId) => ({ nombreSiguiente: "...", idParaTimer: "..." })
}) => {
    const ejercicio = sbe.ejercicio;

    return (
        <div className="bg-slate-700/40 p-2 sm:p-2.5 rounded-md shadow-md">
            <h4 className="font-medium text-white/90 text-sm sm:text-base mb-1.5">{ejercicio?.nombre || 'Ejercicio'}</h4>
            <div className="space-y-1.5">
                {sbe.series?.map(serie => {
                    const serieId = generarIdSerieSimple(subbloqueId, sbe.id, serie.nro_set);
                    const isCompletada = !!elementosCompletados[serieId];
                    const isActive = elementoActivoId === serieId;

                    const pausaContext = providePausaContext ? providePausaContext(serieId) : { nombreSiguiente: `Pausa para ${ejercicio?.nombre || ''} S${serie.nro_set}`, idParaTimer: serieId + '-manual' };

                    return (
                        <SerieItem
                            key={serieId}
                            ref={el => { if (el) elementoRefs.current[serieId] = el; }}
                            serieId={serieId}
                            textoPrincipal={`S${serie.nro_set}: ${serie.reps} reps ${serie.peso ? `(${serie.peso}kg)` : ''}`}
                            isCompletada={isCompletada}
                            isActive={isActive}
                            showPausaButton={!isCompletada && !isActive && !!serie.pausa && !showRestTimer}
                            pausaDuracion={serie.pausa}
                            onItemClick={() => toggleElementoCompletado(serieId, {
                                tipoElemento: 'simple',
                                subbloqueId: subbloqueId,
                                ejercicioId: sbe.id,
                                nroSet: serie.nro_set,
                                pausa: serie.pausa
                            })}
                            onPausaManualClick={() => activarTemporizadorPausa(
                                serie.pausa,
                                pausaContext.nombreSiguiente,
                                pausaContext.idParaTimer
                            )}
                        />
                    );
                })}
            </div>
        </div>
    );
};

export default EjercicioSimpleDisplay;

import React from 'react';
import SerieItem from './SerieItem';
import { generarIdEjercicioEnSerieDeSuperset } from '../../utils/rutinaIds';
import { FaCheckCircle } from 'react-icons/fa';

const SupersetDisplay = ({ subbloque, ...props }) => {

    return (
        <div className="space-y-2">
            {Array.from({ length: subbloque.num_series_superset || 1 }).map((_, setIndex) => {
                const setNumeroSuperset = setIndex + 1;
                const todosEjerciciosDeEstaSerieCompletados = subbloque.subbloques_ejercicios.every(sbe_c =>
                    !!props.elementosCompletados[generarIdEjercicioEnSerieDeSuperset(subbloque.id, sbe_c.id, setNumeroSuperset)]
                );

                return (
                    <div
                        key={`ss-${subbloque.id}-s${setNumeroSuperset}`}
                        className={`p-2.5 rounded-md transition-colors duration-300 ${
                            todosEjerciciosDeEstaSerieCompletados ? 'bg-green-800/50' : 'bg-gray-800/50'
                        }`}>
                        <h5 className="font-semibold text-white mb-2 flex justify-between items-center text-sm">
                            <span>Superset - Serie {setNumeroSuperset}</span>
                        </h5>
                        <div className="space-y-1.5">
                            {subbloque.subbloques_ejercicios.map((sbe, sbeIdx) => {
                                const elementoId = generarIdEjercicioEnSerieDeSuperset(subbloque.id, sbe.id, setNumeroSuperset);
                                const detalleSerieEjercicio = sbe.series?.find(s => s.nro_set === setNumeroSuperset) || sbe.series?.[0];
                                const reps = detalleSerieEjercicio?.reps || 'N/A';

                                return (
                                    <SerieItem
                                        key={elementoId}
                                        ref={el => { if (el) props.elementoRefs.current[elementoId] = el; }}
                                        serieId={elementoId}
                                        textoPrincipal={`${sbe.ejercicio?.nombre || 'Ej.'}: ${reps} reps`}
                                        isCompletada={!!props.elementosCompletados[elementoId]}
                                        isActive={props.elementoActivoId === elementoId}
                                        onItemClick={() => props.toggleElementoCompletado(elementoId, {
                                            tipoElemento: 'superset_ejercicio',
                                            subbloqueId: subbloque.id,
                                            numSerieSupersetActual: setNumeroSuperset,
                                        })}
                                    />
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default SupersetDisplay;
    
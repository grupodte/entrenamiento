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

    // step en kg (cambiá a 2.5 si querés)
    const STEP_KG = 1;

    const toNumber = (v) => {
      const n = parseFloat(String(v).replace(',', '.'));
      return Number.isFinite(n) ? n : 0;
    };

    const incKg = (step = STEP_KG) => {
      const next = Math.max(0, toNumber(actualCarga) + step);
      setActualCarga(String(next));
    };

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
            return `bg-gray-800/40 border-none`;
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

    // --- NUEVO: derivar layout "minimal" para superset ---
    const isSuperset = tipoElemento?.includes('superset');

    // Derivar label y valor central según tipo de ejecución
    let labelArriba = 'Rep';
    let valorCentral = reps || '—';

    if (tipoEjecucion === EXECUTION_TYPES.FALLO) {
      labelArriba = 'Ejecución';
      valorCentral = 'Al fallo';
    } else if (tipoEjecucion === EXECUTION_TYPES.TIEMPO) {
      const unidadFinal = unidadTiempo || detectBestTimeUnit(duracionSegundos);
      const unitCfg = getTimeUnitConfig(unidadFinal);
      labelArriba = unitCfg.label; // p.ej. "Seg" / "Min"
      valorCentral = duracionSegundos
        ? convertFromSeconds(duracionSegundos, unidadFinal) || '0'
        : '0';
    }

    const pesoTexto = `Peso ${toNumber(actualCarga)}kg`;

    return (
        <motion.div
          ref={ref}
          layout
          variants={variants}
          animate={status}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          onClick={handleClick}
          className={`
            relative w-full p-2 transition-all duration-200 justify-center items-center flex flex-col
            ${isSuperset ? 'cursor-default' : 'cursor-pointer'}
            ${isCompletada ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}
            ${isActive && !isSuperset ? 'border-red-500 ring-2 ring-red-200' : ''}
            ${classNameExtra}
          `}
          role="button"
          tabIndex={0}
          aria-pressed={isCompletada}
        >
          {isSuperset ? (
            // ====== VISTA MINIMAL (como la imagen) ======
            <div className="py-5 text-center select-none">
              {/* Nombre con botón de video */}
              {!hideExerciseName && (
                <div className="flex items-center justify-center gap-3">
                  <h4 className="text-[22px] font-semibold text-[#1E1E1E]">
                    {nombreEjercicio}
                  </h4>
                  {ejercicio?.video_url && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openVideoPanel(ejercicio.video_url);
                      }}
                      className="bg-[#2E2E2E] p-1 rounded-full touch-manipulation"
                      aria-label="Ver video"
                    >
                      <FaPlayCircle className="w-5 h-5 text-white" />
                    </button>
                  )}
                </div>
              )}

              {/* Subtítulo */}
              <div className="text-[19px] text-[#8C8C8C]">
                {labelArriba}
              </div>

              {/* Pill central negro */}
                    <div className="inline-flex items-center justify-center w-[144px] h-[62px] rounded-[8px] bg-[#232323]">
                        <span className="text-[29px] leading-none font-bold text-[#F84B4B]">
                  {valorCentral}
                </span>
              </div>

              {/* Chip de peso (estilo imagen) - abajo del pill */}
              <div className="mt-2 flex justify-center">
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F0F0F0]">
                <span className="text-[12px] text-[#7C7C7C] select-none">
                  {pesoTexto}
                </span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); incKg(); }}
                  className="w-5 h-5 leading-none rounded-md bg-white/80 hover:bg-white text-[#1E1E1E] text-[13px] font-bold flex items-center justify-center"
                  aria-label="Aumentar peso"
                >
                  +
                </button>
                </div>
              </div>
            </div>
          ) : (
            // ====== TU VISTA ACTUAL PARA EJERCICIO SIMPLE (sin cambios) ======
            <>
              {/* Header con nombre del ejercicio */}
              {!hideExerciseName && (
                  <div className="flex items-center justify-between ">
                      <h4 className="text-[25px] font-semibold text-[#2E2E2E]">
                          {nombreEjercicio}
                      </h4>
                      {ejercicio?.video_url && (
                          <button
                              onClick={(e) => {
                                  e.stopPropagation();
                                  openVideoPanel(ejercicio.video_url);
                              }}
                              className=" bg-[#2E2E2E]  p-1 rounded-full  touch-manipulation"
                              aria-label="Ver video"
                          >
                              <FaPlayCircle className="w-5 h-5" />
                          </button>
                      )}
                  </div>
              )}

              {nota && (
                  <p className="text-sm text-gray-600 mb-3 truncate">{nota}</p>
              )}

              {/* Grid principal */}
              <div className={`grid gap-6 ${isSuperset ? 'grid-cols-2' : 'grid-cols-4'}`}>
                  {/* Set */}
                  {!isSuperset && (
                      <div className="text-center">
                          <div className="text-sm text-gray-500 mb-1 uppercase tracking-wide font-medium">
                              Set
                          </div>
                          <div className={`relative text-3xl font-bold py-2 rounded-xl ${
                              isCompletada ? 'text-green-600 bg-green-100' : 'text-gray-800 bg-gray-100'
                          }`}>
                              {nroSet || '0'}
                              {isCompletada && (
                                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                      <FaCheck className="w-3 h-3 text-white" />
                                  </div>
                              )}
                          </div>
                      </div>
                  )}

                  {/* Campo principal según tipo de ejecución */}
                  <div className="text-center">
                      {tipoEjecucion === EXECUTION_TYPES.STANDARD && (
                          <>
                              <div className="text-sm text-gray-500 mb-1 uppercase tracking-wide font-medium">
                                  Reps
                              </div>
                              <div className="text-3xl font-bold py-2 rounded-xl bg-gray-100 text-gray-800">
                                  {reps || '0'}
                              </div>
                          </>
                      )}

                      {tipoEjecucion === EXECUTION_TYPES.TIEMPO && (() => {
                          const unidadFinal = unidadTiempo || detectBestTimeUnit(duracionSegundos);
                          const config = getTimeUnitConfig(unidadFinal);
                          const valorTiempo = duracionSegundos ? convertFromSeconds(duracionSegundos, unidadFinal) || '0' : '0';
                          return (
                              <>
                                  <div className="text-sm text-gray-500 mb-1 uppercase tracking-wide font-medium">
                                      {config.label}
                                  </div>
                                  <div className="text-3xl font-bold py-2 rounded-xl bg-gray-100 text-gray-800">
                                      {valorTiempo}
                                  </div>
                              </>
                          );
                      })()}

                      {tipoEjecucion === EXECUTION_TYPES.FALLO && (
                          <>
                              <div className="text-sm text-gray-500 mb-1 uppercase tracking-wide font-medium">
                                  Ejecución
                              </div>
                              <div className="text-lg font-bold py-2 rounded-xl bg-orange-100 text-orange-600">
                                  Al Fallo
                              </div>
                          </>
                      )}
                  </div>

                  {/* Peso editable */}
                  <div className="text-center">
                      <div className="text-sm text-gray-500 mb-1 uppercase tracking-wide font-medium">
                          Peso
                      </div>
                      <input
                          type="text"
                          inputMode="numeric"
                          value={actualCarga}
                          onChange={(e) => setActualCarga(e.target.value)}
                          onPointerDown={(e) => e.stopPropagation()}
                          onFocus={(e) => { e.stopPropagation(); e.target.select(); }}
                          placeholder="0kg"
                          className="w-full text-2xl font-bold text-center py-2 rounded-xl bg-white border-2 border-gray-200 focus:border-red-500 focus:outline-none text-gray-800"
                          style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                      />
                  </div>

                  {/* Pausa */}
                  {!isSuperset && (
                      <div className="text-center">
                          <div className="text-sm text-gray-500 mb-1 uppercase tracking-wide font-medium">
                              Pausa
                          </div>
                          <div className="text-xl font-bold py-2 rounded-xl bg-gray-100 text-gray-800">
                              {pausa && pausa > 0 ? `${pausa}s` : '0s'}
                          </div>
                      </div>
                  )}
              </div>

              {/* Botón LISTO (solo ejercicios simples) */}
              {!isSuperset && !isCompletada && (
                  <div className="mt-4 pt-3 ">
                      <button
                          onClick={handleClick}
                                    className=" w-[107px] h-[50px] bg-[#2A2A2A] text-[#47D065] rounded-[8px] font-semibold text-[27px]"
                          style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                      >
                          
                          LISTO!
                      </button>
                  </div>
              )}

              {isCompletada && (
                  <div className="absolute inset-0 bg-green-50/50 rounded-2xl pointer-events-none" />
              )}
            </>
          )}
        </motion.div>
    );
});

SerieItem.displayName = 'SerieItem';
export default SerieItem;
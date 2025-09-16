import { Pencil, Trash2, Check, GripVertical } from 'lucide-react';
import ComboboxEjercicios from './ComboboxEjercicios';
import ExecutionTypeSelector from './ExecutionTypeSelector';
import TimeUnitSelector from './TimeUnitSelector';
import { useState, Fragment } from 'react';
import { 
    EXECUTION_TYPES, 
    getExecutionTypeConfig, 
    TIME_UNITS, 
    getTimeUnitConfig,
    convertToSeconds,
    convertFromSeconds,
    detectBestTimeUnit 
} from '../../constants/executionTypes';

const EjercicioChip = ({
    ejercicio,
    onChange,
    onRemove,
    ejerciciosDisponibles,
    isSharedStructure = false,
    numberOfSharedSets = 0,
    dragControls,
}) => {
    const [modoEditar, setModoEditar] = useState(false);

    const handleCambioEjercicio = (nuevoEjercicioSeleccionado) => {
        onChange({
            ...ejercicio,
            ejercicio_id: nuevoEjercicioSeleccionado.value,
            nombre: nuevoEjercicioSeleccionado.label,
        });
        setModoEditar(false);
    };

    const updateSetConfig = (index, campo, valor) => {
        const actual = ejercicio.sets_config?.[index] || {};
        const nuevos = [...(ejercicio.sets_config || [])];
        nuevos[index] = { ...actual, [campo]: valor };
        
        // Si se cambia el tipo de ejecución en superset, limpiar campos irrelevantes
        if (campo === 'tipo_ejecucion') {
            const config = getExecutionTypeConfig(valor);
            if (valor === EXECUTION_TYPES.TIEMPO) {
                delete nuevos[index].reps;
                // Asegurar que tenga unidad de tiempo por defecto
                if (!nuevos[index].unidad_tiempo) {
                    nuevos[index].unidad_tiempo = TIME_UNITS.MINUTES;
                }
            } else if (valor === EXECUTION_TYPES.FALLO) {
                delete nuevos[index].reps;
                delete nuevos[index].duracion_segundos;
                delete nuevos[index].unidad_tiempo;
            } else if (valor === EXECUTION_TYPES.STANDARD) {
                delete nuevos[index].duracion_segundos;
                delete nuevos[index].unidad_tiempo;
            }
        }
        
        onChange({ ...ejercicio, sets_config: nuevos });
    };

    const updateSerieCampo = (index, campo, valor) => {
        const nuevas = [...(ejercicio.series || [])];
        nuevas[index] = { ...nuevas[index], [campo]: valor };
        
        // Si se cambia el tipo de ejecución, limpiar campos irrelevantes
        if (campo === 'tipo_ejecucion') {
            const config = getExecutionTypeConfig(valor);
            if (valor === EXECUTION_TYPES.TIEMPO) {
                delete nuevas[index].reps;
                // Asegurar que tenga unidad de tiempo por defecto
                if (!nuevas[index].unidad_tiempo) {
                    nuevas[index].unidad_tiempo = TIME_UNITS.MINUTES;
                }
            } else if (valor === EXECUTION_TYPES.FALLO) {
                delete nuevas[index].reps;
                delete nuevas[index].duracion_segundos;
                delete nuevas[index].unidad_tiempo;
            } else if (valor === EXECUTION_TYPES.STANDARD) {
                delete nuevas[index].duracion_segundos;
                delete nuevas[index].unidad_tiempo;
            }
        }
        
        onChange({ ...ejercicio, series: nuevas });
    };

    return (
        <Fragment>
            {/* Fila principal */}
            <tr className="border-b border-white/10 hover:bg-white/5 transition group">
                <td className="p-2 text-sm text-white font-medium">
                    {modoEditar ? (
                        <ComboboxEjercicios
                            ejerciciosDisponibles={ejerciciosDisponibles}
                            onSelect={handleCambioEjercicio}
                            defaultValue={{ value: ejercicio.ejercicio_id, label: ejercicio.nombre }}
                        />
                    ) : (
                        ejercicio.nombre || <span className="text-white/40 italic">Seleccionar ejercicio</span>
                    )}
                </td>

                <td className="p-2 flex items-center justify-end gap-2">
                    <div
                        className="cursor-grab text-white/40"
                        title="Arrastrar para reordenar"
                        onPointerDown={(e) => dragControls.start(e)}
                    >
                        <GripVertical size={18} />
                    </div>
                    <button
                        onClick={() => setModoEditar(!modoEditar)}
                        className={`${modoEditar ? 'text-green-400 hover:text-green-300' : 'text-sky-400 hover:text-sky-300'
                            }`}
                        title={modoEditar ? 'Confirmar selección' : 'Editar'}
                    >
                        {modoEditar ? <Check size={16} /> : <Pencil size={16} />}
                    </button>
                    <button
                        onClick={onRemove}
                        className="text-red-400 hover:text-red-500"
                        title="Eliminar ejercicio"
                    >
                        <Trash2 size={16} />
                    </button>
                </td>
            </tr>

            {/* Shared Sets con tipos de ejecución */}
            {isSharedStructure &&
                Array.from({ length: numberOfSharedSets }).map((_, i) => {
                    const setConfig = ejercicio.sets_config?.[i] || {};
                    const tipoEjecucion = setConfig.tipo_ejecucion || EXECUTION_TYPES.STANDARD;
                    const config = getExecutionTypeConfig(tipoEjecucion);
                    
                    return (
                        <Fragment key={`shared-set-frag-${i}`}>
                            <tr className="border-t border-white/10 bg-white/5">
                                <td className="p-2 text-xs text-white/60 align-top pt-3">Set {i + 1}</td>
                                <td className="p-2 space-y-2 relative" style={{ overflow: 'visible' }}>
                                    {/* Selector de tipo de ejecución para superset */}
                                    <div className="mb-2 relative" style={{ overflow: 'visible', zIndex: 1000 }}>
                                        <label className="block text-xs text-white/60 mb-1">Tipo de Ejecución</label>
                                        <div className="relative" style={{ overflow: 'visible' }}>
                                            <ExecutionTypeSelector
                                                value={tipoEjecucion}
                                                onChange={(newType) => updateSetConfig(i, 'tipo_ejecucion', newType)}
                                            />
                                        </div>
                                    </div>
                                    
                                    {/* Campos dinámicos según tipo */}
                                    <div className="grid grid-cols-2 gap-2">
                                        {tipoEjecucion === EXECUTION_TYPES.STANDARD && (
                                            <input
                                                type="number"
                                                placeholder="Reps"
                                                value={setConfig.reps || ''}
                                                onChange={(e) => updateSetConfig(i, 'reps', e.target.value)}
                                                className="w-full bg-white/10 text-white text-xs rounded px-2 py-1 focus:ring-1 focus:ring-pink-500 focus:outline-none"
                                            />
                                        )}
                                        
                                        {tipoEjecucion === EXECUTION_TYPES.TIEMPO && (
                                            <>
                                                <input
                                                    type="number"
                                                    placeholder="Tiempo"
                                                    value={setConfig.duracion_segundos ? convertFromSeconds(setConfig.duracion_segundos, setConfig.unidad_tiempo || TIME_UNITS.MINUTES) || '' : ''}
                                                    onChange={(e) => {
                                                        const valor = parseInt(e.target.value) || 0;
                                                        const unidad = setConfig.unidad_tiempo || TIME_UNITS.MINUTES;
                                                        const segundos = convertToSeconds(valor, unidad);
                                                        updateSetConfig(i, 'duracion_segundos', segundos);
                                                    }}
                                                    className="w-full bg-white/10 text-white text-xs rounded px-2 py-1 focus:ring-1 focus:ring-pink-500 focus:outline-none"
                                                />
                                                <div className="w-full">
                                                    <TimeUnitSelector
                                                        value={setConfig.unidad_tiempo || TIME_UNITS.MINUTES}
                                                        onChange={(newUnit) => {
                                                            // Simplemente cambiar la unidad, los segundos ya están correctos
                                                            updateSetConfig(i, 'unidad_tiempo', newUnit);
                                                        }}
                                                    />
                                                </div>
                                            </>
                                        )}
                                        
                                        {tipoEjecucion === EXECUTION_TYPES.FALLO && (
                                            <div className="flex items-center justify-center px-2 py-1 bg-orange-500/20 text-orange-300 text-xs rounded border border-orange-500/30">
                                                <span className="text-sm mr-1">🔥</span>
                                                Al Fallo
                                            </div>
                                        )}
                                        
                                        <input
                                            type="text"
                                            placeholder="Carga"
                                            value={setConfig.carga || ''}
                                            onChange={(e) => updateSetConfig(i, 'carga', e.target.value)}
                                            className="w-full bg-white/10 text-white text-xs rounded px-2 py-1 focus:ring-1 focus:ring-pink-500 focus:outline-none"
                                        />
                                    </div>
                                </td>
                            </tr>
                        </Fragment>
                    );
                })}

            {/* Cantidad de series */}
            {!isSharedStructure && (
                <tr className="border-t border-white/10 bg-white/5">
                    <td className="p-2 text-xs text-white/60">Cantidad de series</td>
                    <td className="p-2">
                        <input
                            type="number"
                            min={1}
                            value={ejercicio.series?.length === 0 ? '' : ejercicio.series?.length ?? ''}
                            onChange={(e) => {
                                const valorInput = e.target.value;

                                if (valorInput === '') {
                                    onChange({ ...ejercicio, series: [] }); // dejarlo vacío
                                    return;
                                }

                                const nuevaCantidad = parseInt(valorInput);
                                if (!isNaN(nuevaCantidad)) {
                                    const nuevasSeries = Array.from({ length: nuevaCantidad }).map((_, i) => ({
                                        reps: ejercicio.series?.[i]?.reps || '',
                                        pausa: ejercicio.series?.[i]?.pausa || '',
                                        nota: ejercicio.series?.[i]?.nota || '',
                                        tipo_ejecucion: ejercicio.series?.[i]?.tipo_ejecucion || EXECUTION_TYPES.STANDARD,
                                        duracion_segundos: ejercicio.series?.[i]?.duracion_segundos || null,
                                        unidad_tiempo: ejercicio.series?.[i]?.unidad_tiempo || TIME_UNITS.MINUTES,
                                    }));
                                    onChange({ ...ejercicio, series: nuevasSeries });
                                }
                            }}
                            className="w-1/2 bg-white/10 text-white text-xs rounded px-2 py-1"
                        />

                    </td>
                </tr>
            )}


            {/* Series individuales */}
            {!isSharedStructure &&
                (ejercicio.series || []).map((serie, i) => {
                    const tipoEjecucion = serie.tipo_ejecucion || EXECUTION_TYPES.STANDARD;
                    const config = getExecutionTypeConfig(tipoEjecucion);
                    
                    // Tipo de ejecución calculado para esta serie
                    
                    return (
                        <Fragment key={`serie-frag-${i}`}>
                            <tr className="border-t border-white/10 bg-white/5">
                                <td className="p-2 text-xs text-white/60 align-top pt-3">Serie {i + 1}</td>
                                <td className="p-2 space-y-2 relative" style={{ overflow: 'visible' }}>
                                    {/* Selector de tipo de ejecución */}
                                    <div className="mb-2 relative" style={{ overflow: 'visible', zIndex: 1000 }}>
                                        <label className="block text-xs text-white/60 mb-1">Tipo de Ejecución</label>
                                        <div className="relative" style={{ overflow: 'visible' }}>
                                            <ExecutionTypeSelector
                                                value={tipoEjecucion}
                                                onChange={(newType) => updateSerieCampo(i, 'tipo_ejecucion', newType)}
                                            />
                                        </div>
                                    </div>
                                    
                                    {/* Campos dinámicos según tipo */}
                                    <div className="grid grid-cols-2 gap-2">
                                        {tipoEjecucion === EXECUTION_TYPES.STANDARD && (
                                            <input
                                                type="number"
                                                placeholder="Reps"
                                                value={serie.reps || ''}
                                                onChange={(e) => updateSerieCampo(i, 'reps', e.target.value)}
                                                className="w-full bg-white/10 text-white text-xs rounded px-2 py-1 focus:ring-1 focus:ring-pink-500 focus:outline-none"
                                            />
                                        )}
                                        
                                        {tipoEjecucion === EXECUTION_TYPES.TIEMPO && (
                                            <>
                                                <input
                                                    type="number"
                                                    placeholder="Tiempo"
                                                    value={serie.duracion_segundos ? convertFromSeconds(serie.duracion_segundos, serie.unidad_tiempo || TIME_UNITS.MINUTES) || '' : ''}
                                                    onChange={(e) => {
                                                        const valor = parseInt(e.target.value) || 0;
                                                        const unidad = serie.unidad_tiempo || TIME_UNITS.MINUTES;
                                                        const segundos = convertToSeconds(valor, unidad);
                                                        updateSerieCampo(i, 'duracion_segundos', segundos);
                                                    }}
                                                    className="w-full bg-white/10 text-white text-xs rounded px-2 py-1 focus:ring-1 focus:ring-pink-500 focus:outline-none"
                                                />
                                                <div className="w-full">
                                                    <TimeUnitSelector
                                                        value={serie.unidad_tiempo || TIME_UNITS.MINUTES}
                                                        onChange={(newUnit) => {
                                                            // Simplemente cambiar la unidad, los segundos ya están correctos
                                                            updateSerieCampo(i, 'unidad_tiempo', newUnit);
                                                        }}
                                                    />
                                                </div>
                                            </>
                                        )}
                                        
                                        {tipoEjecucion === EXECUTION_TYPES.FALLO && (
                                            <div className="flex items-center justify-center px-2 py-1 bg-orange-500/20 text-orange-300 text-xs rounded border border-orange-500/30">
                                                <span className="text-sm mr-1">🔥</span>
                                                Al Fallo
                                            </div>
                                        )}
                                        
                                        <input
                                            type="text"
                                            placeholder="Pausa"
                                            value={serie.pausa || ''}
                                            onChange={(e) => updateSerieCampo(i, 'pausa', e.target.value)}
                                            className="w-full bg-white/10 text-white text-xs rounded px-2 py-1 focus:ring-1 focus:ring-pink-500 focus:outline-none"
                                        />
                                    </div>
                                    
                                    <div className="mt-2">
                                        <input
                                            type="text"
                                            placeholder="Añadir nota..."
                                            value={serie.nota || ''}
                                            onChange={(e) => updateSerieCampo(i, 'nota', e.target.value)}
                                            className="w-full bg-white/10 text-white/70 text-xs rounded px-2 py-1 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                                        />
                                    </div>
                                </td>
                            </tr>
                        </Fragment>
                    )
                })}
        </Fragment>
    );
};

export default EjercicioChip;

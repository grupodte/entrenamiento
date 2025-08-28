import { Pencil, Trash2, Check } from 'lucide-react';
import ComboboxEjercicios from './ComboboxEjercicios';
import { useState, Fragment } from 'react';

const EjercicioChip = ({
    ejercicio,
    onChange,
    onRemove,
    ejerciciosDisponibles,
    isSharedStructure = false,
    numberOfSharedSets = 0,
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
        onChange({ ...ejercicio, sets_config: nuevos });
    };

    const updateSerieCampo = (index, campo, valor) => {
        const nuevas = [...(ejercicio.series || [])];
        nuevas[index] = { ...nuevas[index], [campo]: valor };
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

                <td className="p-2 flex justify-end gap-2">
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

            {/* Shared Sets */}
            {isSharedStructure &&
                Array.from({ length: numberOfSharedSets }).map((_, i) => (
                    <tr key={`shared-${i}`} className="border-t border-white/10">
                        <td className="p-2 text-xs text-white/60">Set {i + 1}</td>
                        <td className="p-2">
                            <input
                                type="number"
                                className="w-full bg-white/10 text-white text-xs rounded px-2 py-1"
                                placeholder="Reps"
                                value={ejercicio.sets_config?.[i]?.reps || ''}
                                onChange={(e) => updateSetConfig(i, 'reps', e.target.value)}
                            />
                        </td>
                    </tr>
                ))}

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
                (ejercicio.series || []).map((serie, i) => (
                    <Fragment key={`serie-frag-${i}`}>
                        <tr className="border-t border-white/10 bg-white/5">
                            <td className="p-2 text-xs text-white/60 align-top pt-3">Serie {i + 1}</td>
                            <td className="p-2 space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="number"
                                        placeholder="Reps"
                                        value={serie.reps || ''}
                                        onChange={(e) => updateSerieCampo(i, 'reps', e.target.value)}
                                        className="w-full bg-white/10 text-white text-xs rounded px-2 py-1 focus:ring-1 focus:ring-pink-500 focus:outline-none"
                                    />
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
                ))}
        </Fragment>
    );
};

export default EjercicioChip;

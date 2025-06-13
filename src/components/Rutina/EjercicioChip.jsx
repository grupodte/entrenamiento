import { useState } from 'react';
import { Disclosure } from '@headlessui/react';
import { Pencil, Trash2, ChevronDown } from 'lucide-react';
import EjercicioSetEditor from './EjercicioSetEditor';
import ComboboxEjercicios from './ComboboxEjercicios';

const EjercicioChip = ({ ejercicio, onChange, onRemove, ejerciciosDisponibles }) => {
    const [open, setOpen] = useState(false);
    const [modoEditar, setModoEditar] = useState(false);

    const handleCambioEjercicio = (nuevoEjercicio) => {
        onChange({
            ...ejercicio,
            ejercicio_id: nuevoEjercicio.value,
            nombre: nuevoEjercicio.label,
        });
        setModoEditar(false);
    };

    return (
        <div className="rounded-xl bg-white/10 backdrop-blur px-4 py-3 space-y-2 transition-all">
            <div className="flex items-center justify-between">
                {modoEditar ? (
                    <div className="w-full max-w-xs">
                        <ComboboxEjercicios
                            ejerciciosDisponibles={ejerciciosDisponibles}
                            onSelect={handleCambioEjercicio}
                        />
                    </div>
                ) : (
                    <span className=" text-[12px] md:text-[16px] text-white font-semibold">
                        {ejercicio.nombre} ({ejercicio.series.length} sets)
                    </span>
                )}

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setModoEditar(!modoEditar)}
                        className="text-skyblue hover:text-skysoft"
                        title="Editar ejercicio"
                    >
                        <Pencil size={16} />
                    </button>
                    <button onClick={onRemove} className="text-red-400 hover:text-red-600" title="Eliminar">
                        <Trash2 size={16} />
                    </button>
                    <button onClick={() => setOpen(!open)} className="text-white/50">
                        <ChevronDown size={16} className={`${open ? 'rotate-180' : ''} transition-transform`} />
                    </button>
                </div>
            </div>

            {open && (
                <EjercicioSetEditor
                    series={ejercicio.series}
                    onSeriesChange={(nuevasSeries) => onChange({ ...ejercicio, series: nuevasSeries })}
                />
            )}
        </div>
    );
};

export default EjercicioChip;

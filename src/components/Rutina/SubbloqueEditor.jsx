import React from 'react';
import EjercicioEditor from './EjercicioEditor';
import { v4 as uuidv4 } from 'uuid';
import Select from 'react-select';
import { GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const tiposSubbloque = [
    { value: 'calentamiento', label: 'Calentamiento' },
    { value: 'principal', label: 'Principal' },
    { value: 'cooldown', label: 'Cooldown' },
];

const SubbloqueEditor = ({ subbloque, onChange, onRemove, ejerciciosDisponibles, attributes, listeners }) => {
    const { attributes: dragAttributes, listeners: dragListeners, setNodeRef, transform, transition } = useSortable({ id: subbloque.id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const actualizarEjercicios = (nuevosEjercicios) => {
        onChange({ ...subbloque, ejercicios: nuevosEjercicios });
    };

    const agregarEjercicio = (selectedOption) => {
        if (!selectedOption) return;
        const nuevoEjercicio = {
            id: uuidv4(),
            ejercicio_id: selectedOption.value,
            nombre: selectedOption.label,
            series: [{ reps: '', pausa: '', carga: '' }],
        };
        actualizarEjercicios([...(subbloque.ejercicios || []), nuevoEjercicio]);
    };

    const actualizarEjercicio = (ejercicioActualizado) => {
        actualizarEjercicios(
            (subbloque.ejercicios || []).map((ej) =>
                ej.id === ejercicioActualizado.id ? ejercicioActualizado : ej
            )
        );
    };

    const eliminarEjercicio = (ejercicioId) => {
        actualizarEjercicios(
            (subbloque.ejercicios || []).filter((ej) => ej.id !== ejercicioId)
        );
    };

    const subbloqueValido = subbloque.nombre && subbloque.tipo && (subbloque.ejercicios?.length > 0);

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`bg-white/10 p-3 rounded-xl space-y-4 border ${subbloqueValido ? 'border-white/10' : 'border-red-500/50'}`}
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <button {...dragListeners} {...dragAttributes} className="text-white cursor-move">
                        <GripVertical size={18} />
                    </button>
                    <input
                        value={subbloque.nombre}
                        onChange={(e) => onChange({ ...subbloque, nombre: e.target.value })}
                        placeholder="Nombre del subbloque (Ej: Tren superior, Core...)"
                        className="flex-1 bg-white/10 rounded px-3 py-2 text-white placeholder-white/50"
                    />
                </div>
                <Select
                    options={tiposSubbloque}
                    value={tiposSubbloque.find(opt => opt.value === subbloque.tipo) || null}
                    onChange={(selected) => onChange({ ...subbloque, tipo: selected?.value })}
                    placeholder="Tipo de subbloque"
                    className="w-full md:w-60 text-black"
                    styles={{
                        control: (base) => ({
                            ...base,
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                            color: 'white',
                        }),
                        singleValue: (base) => ({ ...base, color: 'white' }),
                        input: (base) => ({ ...base, color: 'white' }),
                        menu: (base) => ({ ...base, backgroundColor: '#333' }),
                        option: (base, state) => ({
                            ...base,
                            backgroundColor: state.isFocused ? '#555' : '#333',
                            color: 'white',
                        }),
                    }}
                />
                <button
                    onClick={onRemove}
                    className="text-red-400 hover:text-red-600 text-sm"
                >
                    🗑️ Eliminar
                </button>
            </div>

            {(subbloque.ejercicios || []).map((ejercicio) => (
                <EjercicioEditor
                    key={ejercicio.id}
                    ejercicio={ejercicio}
                    onChange={actualizarEjercicio}
                    onRemove={() => eliminarEjercicio(ejercicio.id)}
                />
            ))}

            <Select
                options={ejerciciosDisponibles.map((ej) => ({
                    value: ej.id,
                    label: `${ej.nombre} (${ej.grupo_muscular || 'Sin grupo'})`,
                }))}
                onChange={agregarEjercicio}
                placeholder="Buscar y agregar ejercicio..."
                isSearchable
                className="text-black"
                styles={{
                    control: (base) => ({
                        ...base,
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                        color: 'white',
                    }),
                    singleValue: (base) => ({ ...base, color: 'white' }),
                    input: (base) => ({ ...base, color: 'white' }),
                    menu: (base) => ({ ...base, backgroundColor: '#333' }),
                    option: (base, state) => ({
                        ...base,
                        backgroundColor: state.isFocused ? '#555' : '#333',
                        color: 'white',
                    }),
                }}
            />
        </div>
    );
};

export default SubbloqueEditor;

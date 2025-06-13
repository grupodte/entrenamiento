import React from 'react';
import { Trash2, ChevronDown } from 'lucide-react';
import Select from 'react-select';
import { Disclosure } from '@headlessui/react';
import ComboboxEjercicios from './ComboboxEjercicios';
import EjercicioChip from './EjercicioChip';

const tipoOpciones = [
    { value: 'calentamiento', label: 'Calentamiento' },
    { value: 'principal', label: 'Principal' },
    { value: 'cooldown', label: 'Cooldown' },
    { value: 'estiramiento', label: 'Estiramiento' },
];

const SubbloqueEditor = ({ subbloque, onChange, onRemove, ejerciciosDisponibles }) => {
    const actualizarCampo = (campo, valor) => {
        onChange({ ...subbloque, [campo]: valor });
    };

    const agregarEjercicio = (ejercicio) => {
        const nuevo = {
            ejercicio_id: ejercicio.value,
            nombre: ejercicio.label,
            id: crypto.randomUUID(),
            series: [{ reps: '', pausa: '', carga: '' }],
        };
        onChange({ ...subbloque, ejercicios: [...subbloque.ejercicios, nuevo] });
    };

    const actualizarEjercicio = (index, actualizado) => {
        const ejercicios = [...subbloque.ejercicios];
        ejercicios[index] = actualizado;
        onChange({ ...subbloque, ejercicios });
    };

    const eliminarEjercicio = (id) => {
        onChange({
            ...subbloque,
            ejercicios: subbloque.ejercicios.filter(e => e.id !== id),
        });
    };

    return (
        <Disclosure defaultOpen={false}>
            {({ open }) => (
                <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-xl p-2 space-y-2">
                    {/* Encabezado del subbloque */}
                    <Disclosure.Button className="w-full flex items-center justify-between">
                        <div className="flex items-center gap-2 w-full max-w-xs">
                            <Select
                                options={tipoOpciones}
                                value={tipoOpciones.find(opt => opt.value === subbloque.nombre)}
                                onChange={(e) => actualizarCampo("nombre", e.value)}
                                placeholder="Tipo de subbloque"
                                className="text-[12px] flex-1 "
                                styles={{
                                    control: (base, state) => ({
                                        ...base,
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                        border: 'none',
                                        borderRadius: '0.75rem',
                                        padding: '0.25rem 0.5rem',
                                        minHeight: '2.5rem',
                                        boxShadow: 'none',
                                        color: 'white',
                                        backdropFilter: 'blur(6px)',
                                        fontSize: '0.875rem',
                                    }),
                                    placeholder: (base) => ({
                                        ...base,
                                        color: 'rgba(255,255,255,0.4)',
                                    }),
                                    singleValue: (base) => ({
                                        ...base,
                                        color: 'white',
                                        fontWeight: 500,
                                    }),
                                    menu: (base) => ({
                                        ...base,
                                        backgroundColor: 'rgba(24, 24, 27, 0.95)', // similar a zinc-900
                                        borderRadius: '0.75rem',
                                        padding: '0.25rem 0',
                                        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                                        zIndex: 50,
                                    }),
                                    option: (base, state) => ({
                                        ...base,
                                        backgroundColor: state.isFocused ? 'rgba(255,255,255,0.1)' : 'transparent',
                                        color: 'white',
                                        cursor: 'pointer',
                                        padding: '0.5rem 1rem',
                                        fontWeight: state.isSelected ? 600 : 400,
                                    }),
                                    dropdownIndicator: (base) => ({
                                        ...base,
                                        color: 'rgba(255,255,255,0.5)',
                                        padding: '0 6px',
                                    }),
                                    indicatorSeparator: () => ({
                                        display: 'none',
                                    }),
                                }}
                                  
                                  
                            />
                        </div>

                        <div className="flex justify-center items-center gap-2 w-[100px]">
                            <button onClick={onRemove} className="text-red-400 hover:text-red-600 text-sm">
                                <Trash2 size={16} />
                            </button>
                            <ChevronDown
                                size={18}
                                className={`transition-transform ${open ? 'rotate-180' : ''} text-white/60`}
                            />
                        </div>
                    </Disclosure.Button>

                    <Disclosure.Panel className="space-y-4">
                        <ComboboxEjercicios
                            ejerciciosDisponibles={ejerciciosDisponibles}
                            onSelect={agregarEjercicio}
                        />

                        <div className="space-y-3">
                            {subbloque.ejercicios.map((ejercicio, i) => (
                                <EjercicioChip
                                    key={ejercicio.id}
                                    ejercicio={ejercicio}
                                    onChange={(nuevo) => actualizarEjercicio(i, nuevo)}
                                    onRemove={() => eliminarEjercicio(ejercicio.id)}
                                    ejerciciosDisponibles={ejerciciosDisponibles}
                                />
                            ))}
                        </div>
                    </Disclosure.Panel>
                </div>
            )}
        </Disclosure>
    );
};

export default SubbloqueEditor;

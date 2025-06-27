import React from 'react';
import { Trash2, ChevronDown } from 'lucide-react';
import Select from 'react-select';
import { Disclosure } from '@headlessui/react';
import { v4 as uuidv4 } from 'uuid';
import ComboboxEjercicios from './ComboboxEjercicios';
import EjercicioChip from './EjercicioChip';
import SupersetSharedConfigEditor from './SupersetSharedConfigEditor';

const selectStyles = {
    control: (base) => ({
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
        flexGrow: 1,
    }),
    placeholder: (base) => ({ ...base, color: 'rgba(255,255,255,0.4)' }),
    singleValue: (base) => ({ ...base, color: 'white', fontWeight: 500 }),
    menu: (base) => ({
        ...base,
        backgroundColor: 'rgba(24, 24, 27, 0.95)',
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
    dropdownIndicator: (base) => ({ ...base, color: 'rgba(255,255,255,0.5)', padding: '0 6px' }),
    indicatorSeparator: () => ({ display: 'none' }),
};

const nombreOpciones = [
    { value: 'calentamiento', label: 'Calentamiento' },
    { value: 'principal', label: 'Principal' },
    { value: 'cooldown', label: 'Cooldown' },
    { value: 'estiramiento', label: 'Estiramiento' },
];

const structureOptions = [
    { value: 'simple', label: 'Simple (series por ejercicio)' },
    { value: 'superset', label: 'Superset (series compartidas)' },
];

const createDefaultSetsConfig = (numSets, reps = '', carga = '') =>
    Array(numSets).fill(null).map(() => ({ reps, carga }));

const SubbloqueEditor = ({ subbloque, onChange, onRemove, ejerciciosDisponibles }) => {
    const currentSubbloque = {
        ...subbloque,
        nombre: subbloque.nombre || 'principal',
        tipo: subbloque.tipo || 'simple',
        ejercicios: (subbloque.ejercicios || []).map(ej => {
            const sets_config = ej.sets_config || (ej.series?.map(s => ({
                reps: s.reps || '',
                carga: s.carga_sugerida || '',
            })) || []);
            return { ...ej, sets_config };
        }),
        shared_config: subbloque.shared_config || { num_sets: 1, shared_rest: '' },
    };

    const isShared = currentSubbloque.tipo !== 'simple';

    const actualizarCampo = (campo, valor) => {
        let updated = { ...currentSubbloque, [campo]: valor };

        if (campo === 'tipo') {
            if (valor === 'simple') {
                updated.shared_config = { num_sets: '', shared_rest: '' };
                updated.ejercicios = updated.ejercicios.map(ej => ({
                    ...ej,
                    series: [{ reps: '', pausa: '', carga: '' }],
                    sets_config: undefined,
                }));
            } else {
                const numSets = currentSubbloque.shared_config?.num_sets || 1;
                updated.ejercicios = updated.ejercicios.map(ej => ({
                    ...ej,
                    series: [],
                    sets_config: createDefaultSetsConfig(numSets),
                }));
            }
        }

        onChange(updated);
    };
    const handleSharedConfigChange = (newSharedConfig) => {
        const numSets = parseInt(newSharedConfig.num_sets || 1);

        const ejerciciosActualizados = currentSubbloque.ejercicios.map(ej => {
            const setsExistentes = ej.sets_config || [];

            if (setsExistentes.length === numSets) return ej;

            const nuevosSets = Array(numSets).fill(null).map((_, i) => ({
                reps: setsExistentes[i]?.reps || '',
                carga: setsExistentes[i]?.carga || '',
            }));

            return {
                ...ej,
                sets_config: nuevosSets,
            };
        });

        onChange({
            ...currentSubbloque,
            shared_config: newSharedConfig,
            ejercicios: ejerciciosActualizados,
        });
    };
    
    
    const agregarEjercicio = (ejercicio) => {
        const nuevo = {
            id: uuidv4(),
            ejercicio_id: ejercicio.value,
            nombre: ejercicio.label,
        };

        if (isShared) {
            nuevo.sets_config = createDefaultSetsConfig(currentSubbloque.shared_config?.num_sets || 1);
        } else {
            nuevo.series = [{ reps: '', pausa: '', carga: '' }];
        }

        onChange({
            ...currentSubbloque,
            ejercicios: [...currentSubbloque.ejercicios, nuevo],
        });
    };

    const actualizarEjercicio = (index, data) => {
        const copia = [...currentSubbloque.ejercicios];
        copia[index] = data;
        onChange({ ...currentSubbloque, ejercicios: copia });
    };

    const eliminarEjercicio = (id) => {
        onChange({
            ...currentSubbloque,
            ejercicios: currentSubbloque.ejercicios.filter(e => e.id !== id),
        });
    };

    return (
        <Disclosure defaultOpen>
            {({ open }) => (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-4 shadow-xl">
                    {/* Header */}
                    <div className="flex flex-wrap md:flex-nowrap items-center gap-4">
                        <div className="flex-1 min-w-[150px]">
                            <Select
                                options={nombreOpciones}
                                value={nombreOpciones.find(opt => opt.value === currentSubbloque.nombre)}
                                onChange={(e) => actualizarCampo('nombre', e.value)}
                                styles={selectStyles}
                            />
                        </div>
                        <div className="flex-1 min-w-[180px]">
                            <Select
                                options={structureOptions}
                                value={structureOptions.find(opt => opt.value === currentSubbloque.tipo)}
                                onChange={(e) => actualizarCampo('tipo', e.value)}
                                styles={selectStyles}
                            />
                        </div>
                        <div className="ml-auto flex items-center gap-2 pt-4 md:pt-0">
                            <button onClick={onRemove} className="text-red-400 hover:text-red-600">
                                <Trash2 size={18} />
                            </button>
                            <Disclosure.Button className="text-white/60 hover:text-white">
                                <ChevronDown size={20} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
                            </Disclosure.Button>
                        </div>
                    </div>

                    {/* Resumen */}
                    {!open && (
                        <div className="bg-white/5 p-3 rounded-lg text-white/80 text-sm space-y-2">
                            {currentSubbloque.ejercicios.length === 0 ? (
                                <div className="italic text-white/50">Sin ejercicios aún.</div>
                            ) : (
                                <>
                                    <div className="text-xs mb-1">
                                        Contiene <strong>{currentSubbloque.ejercicios.length}</strong> ejercicio(s)
                                    </div>
                                    <ul className="space-y-1 text-xs">
                                        {currentSubbloque.ejercicios.map((ej) => {
                                            const sets = ej.series || ej.sets_config || [];
                                            const reps = sets.map((s) => s.reps || '-').join(', ');
                                            return (
                                                <li key={ej.id} className="flex justify-between border-b border-white/10 pb-1">
                                                    <span className="font-medium text-white/90 truncate">{ej.nombre}</span>
                                                    <span className="text-white/60 text-right">{sets.length}x [{reps}]</span>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </>
                            )}
                        </div>
                    )}

                    <Disclosure.Panel className="space-y-4 pt-2">
                        {isShared && (
                            <SupersetSharedConfigEditor
                                sharedConfig={currentSubbloque.shared_config}
                                onConfigChange={handleSharedConfigChange}
                            />
                        )}

                        <ComboboxEjercicios
                            ejerciciosDisponibles={ejerciciosDisponibles}
                            onSelect={agregarEjercicio}
                        />

                        <table className="w-full text-sm text-white border border-white/10 rounded-lg overflow-hidden">
                            <tbody>
                                {currentSubbloque.ejercicios.map((ejercicio, i) => (
                                    <EjercicioChip
                                        key={ejercicio.id || i}
                                        ejercicio={ejercicio}
                                        onChange={(nuevo) => actualizarEjercicio(i, nuevo)}
                                        onRemove={() => eliminarEjercicio(ejercicio.id)}
                                        ejerciciosDisponibles={ejerciciosDisponibles}
                                        isSharedStructure={isShared}
                                        numberOfSharedSets={isShared ? (currentSubbloque.shared_config?.num_sets || 0) : 0}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </Disclosure.Panel>
                </div>
            )}
        </Disclosure>
    );
};

export default SubbloqueEditor;

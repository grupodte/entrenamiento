// src/components/Rutina/ComboboxEjercicios.jsx
import { Fragment, useState } from 'react';
import { Combobox, Transition } from '@headlessui/react';
import { Check, Search } from 'lucide-react';

const ComboboxEjercicios = ({ ejerciciosDisponibles, onSelect, defaultValue = null }) => {
    const [query, setQuery] = useState('');
    const [selected, setSelected] = useState(defaultValue);

    const ejerciciosFiltrados =
        query === ''
            ? ejerciciosDisponibles
            : ejerciciosDisponibles.filter((e) =>
                e.nombre.toLowerCase().includes(query.toLowerCase()) ||
                (e.grupo_muscular || '').toLowerCase().includes(query.toLowerCase())
            );

    const handleSelect = (ej) => {
        setSelected(null);
        setQuery('');
        onSelect(ej);
    };

    return (
        <div className="relative w-full">
            <Combobox value={selected} onChange={handleSelect}>
                <div className="relative">
                    {/* Input + Icon */}
                    <div className="relative w-full ios-glass border border-white/10 shadow-inner focus-within:ring-2 focus-within:ring-skyblue transition">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            <Search className="h-4 w-4 text-white/50" />
                        </div>
                        <Combobox.Input
                            className="w-full bg-transparent py-2 pl-10 pr-3 rounded-xl text-sm placeholder-white/50 focus:outline-none"
                            placeholder="Buscar ejercicio..."
                            displayValue={(ej) => ej?.label}
                            onChange={(event) => setQuery(event.target.value)}
                        />
                    </div>

                    {/* Lista de resultados */}
                    <Transition
                        as={Fragment}
                        leave="transition ease-in duration-150"
                        leaveFrom="opacity-100 translate-y-0"
                        leaveTo="opacity-0 translate-y-1"
                        afterLeave={() => setQuery('')}
                    >
                        <Combobox.Options
                            className="
    absolute z-50 mt-2 w-full
    rounded-xl
    bg-black/80 backdrop-blur
    border border-white/10
    py-1 text-sm shadow-xl ring-1 ring-white/10 focus:outline-none
  "
                        >
                            <div className="max-h-60 overflow-auto">
                                {ejerciciosFiltrados.length === 0 && (
                                    <div className="cursor-default select-none px-4 py-2 text-white/50">
                                        Sin resultados...
                                    </div>
                                )}
                                {ejerciciosFiltrados.map((ejercicio) => (
                                    <Combobox.Option
                                        key={ejercicio.id}
                                        value={{
                                            value: ejercicio.id,
                                            label: `${ejercicio.nombre} (${ejercicio.grupo_muscular || 'Sin grupo'})`,
                                        }}
                                        className={({ active }) =>
                                            `cursor-pointer select-none px-4 py-2 rounded transition
           ${active ? 'bg-skyblue text-white' : 'text-white/90'}`
                                        }
                                    >
                                        {({ selected }) => (
                                            <div className="flex justify-between items-center">
                                                <span className={`truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                                    {ejercicio.nombre}
                                                    <span className="ml-2 text-xs text-white/50">
                                                        ({ejercicio.grupo_muscular || 'Sin grupo'})
                                                    </span>
                                                </span>
                                                {selected && <Check className="h-4 w-4 text-white" />}
                                            </div>
                                        )}
                                    </Combobox.Option>
                                ))}
                            </div>
                        </Combobox.Options>

                    </Transition>
                </div>
            </Combobox>
        </div>
    );
};

export default ComboboxEjercicios;

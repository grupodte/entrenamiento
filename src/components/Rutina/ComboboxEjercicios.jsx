// src/components/Rutina/ComboboxEjercicios.jsx
import { Fragment, useState } from 'react';
import { Combobox, Transition } from '@headlessui/react';
import { Check, ChevronsUpDown } from 'lucide-react';

const ComboboxEjercicios = ({ ejerciciosDisponibles, onSelect }) => {
    const [query, setQuery] = useState('');
    const [selected, setSelected] = useState(null);

    const ejerciciosFiltrados = query === ''
        ? ejerciciosDisponibles
        : ejerciciosDisponibles.filter(e =>
            e.nombre.toLowerCase().includes(query.toLowerCase()) ||
            (e.grupo_muscular || '').toLowerCase().includes(query.toLowerCase())
        );

    const handleSelect = (ej) => {
        setSelected(null);
        setQuery('');
        onSelect(ej);
    };

    return (
        <div className="w-full max-w-xl">
            <Combobox value={selected} onChange={handleSelect}>
                <div className="relative">
                    <div className="relative w-full cursor-default overflow-hidden rounded-xl bg-white/10 text-left text-white shadow-md backdrop-blur focus:outline-none focus:ring">
                        <Combobox.Input
                            className="w-full border-none bg-transparent py-2 pl-3 pr-10 text-sm leading-5 placeholder-white/50"
                            displayValue={(ej) => ej?.label}
                            placeholder="Buscar ejercicio..."
                            onChange={(event) => setQuery(event.target.value)}
                        />
                        <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronsUpDown className="h-4 w-4 text-white/40" />
                        </Combobox.Button>
                    </div>

                    <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0" afterLeave={() => setQuery('')}>
                        <Combobox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl bg-zinc-800 py-1 text-sm shadow-xl ring-1 ring-black/20 focus:outline-none">
                            {ejerciciosFiltrados.length === 0 && (
                                <div className="relative cursor-default select-none px-4 py-2 text-white/50">
                                    Sin resultados...
                                </div>
                            )}
                            {ejerciciosFiltrados.map((ejercicio) => (
                                <Combobox.Option
                                    key={ejercicio.id}
                                    value={{
                                        value: ejercicio.id,
                                        label: `${ejercicio.nombre} (${ejercicio.grupo_muscular || 'Sin grupo'})`
                                    }}
                                    className={({ active }) =>
                                        `relative cursor-pointer select-none px-4 py-2 ${active ? 'bg-skyblue text-white' : 'text-white/90'
                                        }`
                                    }
                                >
                                    {({ selected }) => (
                                        <>
                                            <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                                {ejercicio.nombre} <span className="text-xs text-white/40">({ejercicio.grupo_muscular || 'Sin grupo'})</span>
                                            </span>
                                            {selected && (
                                                <span className="absolute inset-y-0 right-2 flex items-center">
                                                    <Check className="h-4 w-4 text-white" />
                                                </span>
                                            )}
                                        </>
                                    )}
                                </Combobox.Option>
                            ))}
                        </Combobox.Options>
                    </Transition>
                </div>
            </Combobox>
        </div>
    );
};

export default ComboboxEjercicios;

import { Fragment, useState } from 'react';
import { Combobox, Transition } from '@headlessui/react';
import { Check, Search, ChevronsUpDown } from 'lucide-react';

const ComboboxRutinas = ({ rutinasDisponibles, onSelect, defaultValue = null }) => {
    const [query, setQuery] = useState('');
    const [selected, setSelected] = useState(defaultValue);

    const rutinasFiltradas =
        query === ''
            ? rutinasDisponibles
            : rutinasDisponibles.filter((r) =>
                r.nombre.toLowerCase().includes(query.toLowerCase())
            );

    const handleSelect = (rutina) => {
        setSelected(rutina);
        onSelect(rutina.id);
    };

    return (
        <div className="relative w-full">
            <Combobox value={selected} onChange={handleSelect}>
                <div className="relative">
                    <div className="relative w-full ios-glass border border-white/10 shadow-inner focus-within:ring-2 focus-within:ring-sky-400 transition rounded-xl">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            <Search className="h-4 w-4 text-white/50" />
                        </div>
                        <Combobox.Input
                            className="w-full bg-transparent py-2 pl-10 pr-10 rounded-xl text-sm placeholder-white/50 focus:outline-none"
                            placeholder="Buscar rutina..."
                            displayValue={(r) => r?.nombre}
                            onChange={(event) => setQuery(event.target.value)}
                        />
                        <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <ChevronsUpDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </Combobox.Button>
                    </div>

                    <Transition
                        as={Fragment}
                        leave="transition ease-in duration-150"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                        afterLeave={() => setQuery('')}
                    >
                        <Combobox.Options
                            className="absolute z-50 mt-2 w-full rounded-xl bg-black/80 backdrop-blur border border-white/10 py-1 text-sm shadow-xl ring-1 ring-white/10 focus:outline-none"
                        >
                            <div className="max-h-60 overflow-auto">
                                {rutinasFiltradas.length === 0 && (
                                    <div className="cursor-default select-none px-4 py-2 text-white/50">
                                        Sin resultados...
                                    </div>
                                )}
                                {rutinasFiltradas.map((rutina) => (
                                    <Combobox.Option
                                        key={rutina.id}
                                        value={rutina}
                                        className={({ active }) =>
                                            `cursor-pointer select-none px-4 py-2 rounded transition
                                            ${active ? 'bg-sky-500 text-white' : 'text-white/90'}`
                                        }
                                    >
                                        {({ selected }) => (
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                                        {rutina.nombre}
                                                    </span>
                                                    {rutina.descripcion && (
                                                        <span className="block text-xs text-white/70 truncate">
                                                            {rutina.descripcion}
                                                        </span>
                                                    )}
                                                </div>
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

export default ComboboxRutinas;

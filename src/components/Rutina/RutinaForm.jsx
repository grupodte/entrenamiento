import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'react-hot-toast';
import BloqueEditor from '../../components/Rutina/BloqueEditor';

const RutinaForm = () => {
    const [nombre, setNombre] = useState('');
    const [tipo, setTipo] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [bloques, setBloques] = useState([]);
    const LOCAL_STORAGE_KEY = 'rutinaDraft';
    const [isHydrated, setIsHydrated] = useState(false);



    const [ejerciciosDisponibles, setEjerciciosDisponibles] = useState([]);


    useEffect(() => {
        const draft = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (draft) {
            try {
                const data = JSON.parse(draft);
                if (data.nombre) setNombre(data.nombre);
                if (data.tipo) setTipo(data.tipo);
                if (data.descripcion) setDescripcion(data.descripcion);
                if (data.bloques) setBloques(data.bloques);
            } catch (error) {
                console.error('Error al parsear localStorage', error);
            }
        }
        setIsHydrated(true); // solo después de leer
    }, []);


    useEffect(() => {
        if (!isHydrated) return; // ⛔️ evita sobrescribir al cargar
        const rutinaDraft = { nombre, tipo, descripcion, bloques };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(rutinaDraft));
    }, [nombre, tipo, descripcion, bloques, isHydrated]);



    useEffect(() => {
        const fetchEjercicios = async () => {
            const { data, error } = await supabase
                .from('ejercicios')
                .select('id, nombre, grupo_muscular');

            if (!error) setEjerciciosDisponibles(data);
            else toast.error('Error al cargar ejercicios.');
        };

        fetchEjercicios();
    }, []);

    const agregarBloque = () => {
        const ultimaSemana = bloques[bloques.length - 1]?.semana_fin || 0;
        const nuevoBloque = {
            id: uuidv4(),
            semana_inicio: ultimaSemana + 1,
            semana_fin: ultimaSemana + 4,
            subbloques: [],
        };
        setBloques(prev => [...prev, nuevoBloque]);
    };

    const actualizarBloque = (bloqueActualizado) => {
        setBloques(prev =>
            prev.map(b => (b.id === bloqueActualizado.id ? bloqueActualizado : b))
        );
    };

    const eliminarBloque = (bloqueId) => {
        setBloques(prev => prev.filter(b => b.id !== bloqueId));
    };

    const duplicarBloque = (bloqueDuplicado) => {
        setBloques(prev => [...prev, bloqueDuplicado]);
    };

    const guardarRutina = async () => {
        if (!nombre || bloques.length === 0) {
            toast.error('Faltan datos: nombre o bloques');
            return;
        }

        try {
            toast.loading('Guardando rutina...');

            // 1. Insertar en rutinas_base
            const { data: rutinaBase, error: errorRutina } = await supabase
                .from('rutinas_base')
                .insert([{ nombre, tipo, descripcion }])
                .select()
                .single();

            if (errorRutina) throw errorRutina;
            const rutinaBaseId = rutinaBase.id;

            for (const [iBloque, bloque] of bloques.entries()) {
                const { data: bloqueData, error: errorBloque } = await supabase
                    .from('bloques')
                    .insert([
                        {
                            rutina_base_id: rutinaBaseId,
                            semana_inicio: bloque.semana_inicio,
                            semana_fin: bloque.semana_fin,
                            orden: iBloque,
                        },
                    ])
                    .select()
                    .single();

                if (errorBloque) throw errorBloque;
                const bloqueId = bloqueData.id;

                for (const [iSub, subbloque] of bloque.subbloques.entries()) {
                    const { data: subData, error: errorSub } = await supabase
                        .from('subbloques')
                        .insert([
                            {
                                bloque_id: bloqueId,
                                tipo: subbloque.tipo,
                                nombre: subbloque.nombre,
                                orden: iSub,
                            },
                        ])
                        .select()
                        .single();

                    if (errorSub) throw errorSub;
                    const subbloqueId = subData.id;

                    if (subbloque.tipo === 'simple' || !subbloque.tipo) {
                        // --- SIMPLE STRUCTURE ---
                        if (!subbloque.ejercicios || subbloque.ejercicios.length === 0) {
                            throw new Error(`Subbloque simple '${subbloque.nombre}' debe tener al menos un ejercicio.`);
                        }
                        for (const [iEj, ejercicio] of subbloque.ejercicios.entries()) {
                            if (!ejercicio.series || ejercicio.series.length === 0) {
                                throw new Error(`Ejercicio '${ejercicio.nombre}' en subbloque simple '${subbloque.nombre}' requiere al menos una serie.`);
                            }

                            const { data: ejData, error: errorEj } = await supabase
                                .from('subbloques_ejercicios')
                                .insert([{ subbloque_id: subbloqueId, ejercicio_id: ejercicio.ejercicio_id, orden: iEj }])
                                .select().single();
                            if (errorEj) throw errorEj;
                            const subEjId = ejData.id;

                            for (const [iSerie, serie] of ejercicio.series.entries()) {
                                const { error: errorSerie } = await supabase.from('series_subejercicio').insert([{
                                    subbloque_ejercicio_id: subEjId,
                                    nro_set: iSerie + 1,
                                    reps: serie.reps,
                                    pausa: serie.pausa,
                                }]);
                                if (errorSerie) throw errorSerie;
                            }
                        }
                    } else if (['superset', 'triset', 'circuit'].includes(subbloque.tipo)) {
                        // --- SUPERSET, TRISET, CIRCUIT STRUCTURE (New Logic) ---
                        if (!subbloque.shared_config || !subbloque.shared_config.num_sets || subbloque.shared_config.num_sets <= 0) {
                            throw new Error(`Subbloque '${subbloque.nombre}' (${subbloque.tipo}) debe tener un número de series compartidas definido y mayor a 0.`);
                        }
                        if (!subbloque.ejercicios || subbloque.ejercicios.length < (subbloque.tipo === 'superset' ? 2 : 3)) {
                            throw new Error(`Subbloque '${subbloque.nombre}' (${subbloque.tipo}) no tiene suficientes ejercicios para su estructura.`);
                        }

                        const numSets = parseInt(subbloque.shared_config.num_sets, 10);
                        const sharedRest = subbloque.shared_config.shared_rest ? parseInt(subbloque.shared_config.shared_rest, 10) : null;

                        // 1. Save entries to shared_series_subblock (defines set count and shared rest)
                        for (let s = 0; s < numSets; s++) {
                            const { error: errorSharedSet } = await supabase
                                .from('shared_series_subblock')
                                .insert([{
                                    subbloque_id: subbloqueId,
                                    set_number: s + 1,
                                    rest: sharedRest,
                                    // reps and suggested_load in this table are NOT used for this new superset logic
                                }]);
                            if (errorSharedSet) throw errorSharedSet;
                        }

                        // 2. For each exercise, save its specific reps/load for each shared set into series_subejercicio
                        for (const [iEj, ejercicio] of subbloque.ejercicios.entries()) {
                            const { data: ejData, error: errorEj } = await supabase
                                .from('subbloques_ejercicios')
                                .insert([{ subbloque_id: subbloqueId, ejercicio_id: ejercicio.ejercicio_id, orden: iEj }])
                                .select().single();
                            if (errorEj) throw errorEj;
                            const subEjId = ejData.id;

                            if (!ejercicio.sets_config || ejercicio.sets_config.length !== numSets) {
                                throw new Error(`Ejercicio '${ejercicio.nombre}' en subbloque '${subbloque.nombre}' (${subbloque.tipo}) no tiene la configuración de series (reps/carga) correspondiente al número de sets compartidos (${numSets}). Se esperaban ${numSets} configuraciones, se recibieron ${ejercicio.sets_config?.length || 0}.`);
                            }

                            for (let k = 0; k < numSets; k++) {
                                const setConfig = ejercicio.sets_config[k];
                                if (!setConfig) {
                                    throw new Error(`Falta configuración (reps/carga) para el set ${k + 1} del ejercicio '${ejercicio.nombre}' en el subbloque '${subbloque.nombre}'.`);
                                }
                                const { error: errorSerie } = await supabase
                                    .from('series_subejercicio')
                                    .insert([{
                                        subbloque_ejercicio_id: subEjId,
                                        nro_set: k + 1, // Corresponds to shared_series_subblock.set_number
                                        reps: setConfig.reps,
                                        carga_sugerida: setConfig.carga,
                                        // 'pausa' field in series_subejercicio is not used for shared rest in supersets
                                    }]);
                                if (errorSerie) throw errorSerie;
                            }
                        }
                    }
                }
            }

            toast.dismiss();
            toast.success('✅ Rutina guardada correctamente');
            setNombre('');
            setTipo('');
            setDescripcion('');
            setBloques([]);
            localStorage.removeItem(LOCAL_STORAGE_KEY);


        } catch (error) {
            toast.dismiss();
            console.error(error.message);
            toast.error(`❌ Error al guardar: ${error.message}`);
        }
    };

    return (
        <div className="flex flex-col md:flex-row h-full gap-4">
            {/* Sidebar izquierda (arriba en mobile) */}
            <aside className="w-full md:w-[280px] p-4 space-y-4 overflow-y-auto bg-white/5 border-b md:border-b-0 md:border-r border-white/10">
                <div className="flex flex-col gap-3">
                    <input
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        placeholder="Nombre"
                        className="rounded-lg bg-white/10 backdrop-blur px-3 py-2 text-white placeholder-white/50 text-sm w-full"
                    />
                    <input
                        value={tipo}
                        onChange={(e) => setTipo(e.target.value)}
                        placeholder="Tipo"
                        className="rounded-lg bg-white/10 backdrop-blur px-3 py-2 text-white placeholder-white/50 text-sm w-full"
                    />
                    <textarea
                        value={descripcion}
                        onChange={(e) => setDescripcion(e.target.value)}
                        placeholder="Descripción"
                        rows={3}
                        className="rounded-lg bg-white/10 backdrop-blur px-3 py-2 text-white placeholder-white/50 text-sm resize-none w-full"
                    />
                    {bloques.length > 0 && (
                        <button
                            onClick={guardarRutina}
                            className="bg-green-600/30 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm"
                        >
                            Guardar rutina
                        </button>
                    )}
                    <button
                        onClick={agregarBloque}
                        className="bg-white/20 hover:bg-white/30 text-white font-semibold rounded-lg px-4 py-2 text-sm"
                    >
                        Agregar mes
                    </button>
                </div>
            </aside>

            {/* Contenido principal (debajo en mobile) */}
            <section className="flex-1  pr-2 space-y-4 px-4 md:px-0">
                {bloques.map((bloque) => (
                    <BloqueEditor
                        key={bloque.id}
                        bloque={bloque}
                        onChange={actualizarBloque}
                        onRemove={() => eliminarBloque(bloque.id)}
                        onDuplicate={duplicarBloque}
                        ejerciciosDisponibles={ejerciciosDisponibles}
                    />
                ))}
            </section>
        </div>
    );
      
      
      
};

export default RutinaForm;

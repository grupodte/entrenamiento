// RutinaForm.jsx
import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'react-hot-toast';
import BloqueEditor from '../../components/Rutina/BloqueEditor';

const createDefaultSetsConfig = (numSets, reps = '', carga = '') => {
    return Array(numSets).fill(null).map(() => ({ reps, carga }));
};

const RutinaForm = () => {
    const [nombre, setNombre] = useState('');
    const [tipo, setTipo] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [bloques, setBloques] = useState([]);
    const [ejerciciosDisponibles, setEjerciciosDisponibles] = useState([]);
    const LOCAL_STORAGE_KEY = 'rutinaDraft';
    const [isHydrated, setIsHydrated] = useState(false);

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
        setIsHydrated(true);
    }, []);

    useEffect(() => {
        if (!isHydrated) return;
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
        setBloques(prev => prev.map(b => (b.id === bloqueActualizado.id ? bloqueActualizado : b)));
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
                    .insert([{
                        rutina_base_id: rutinaBaseId,
                        semana_inicio: bloque.semana_inicio,
                        semana_fin: bloque.semana_fin,
                        orden: iBloque,
                    }])
                    .select()
                    .single();

                if (errorBloque) throw errorBloque;
                const bloqueId = bloqueData.id;

                for (const [iSub, subbloque] of bloque.subbloques.entries()) {
                    const { data: subData, error: errorSub } = await supabase
                        .from('subbloques')
                        .insert([{
                            bloque_id: bloqueId,
                            tipo: subbloque.tipo,
                            nombre: subbloque.nombre,
                            orden: iSub,
                        }])
                        .select()
                        .single();

                    if (errorSub) throw errorSub;
                    const subbloqueId = subData.id;

                    if (subbloque.tipo === 'simple' || !subbloque.tipo) {
                        for (const [iEj, ejercicio] of subbloque.ejercicios.entries()) {
                            const { data: ejData, error: errorEj } = await supabase
                                .from('subbloques_ejercicios')
                                .insert([{ subbloque_id: subbloqueId, ejercicio_id: ejercicio.ejercicio_id, orden: iEj }])
                                .select().single();
                            if (errorEj) throw errorEj;
                            const subEjId = ejData.id;

                            for (const [iSerie, serie] of ejercicio.series.entries()) {
                                const { error: errorSerie } = await supabase
                                    .from('series_subejercicio')
                                    .insert([{
                                        subbloque_ejercicio_id: subEjId,
                                        nro_set: iSerie + 1,
                                        reps: serie.reps,
                                        pausa: serie.pausa,
                                    }]);
                                if (errorSerie) throw errorSerie;
                            }
                        }
                    } else {
                        const numSets = parseInt(subbloque.shared_config?.num_sets || 0, 10);
                        const sharedRest = subbloque.shared_config?.shared_rest || '';

                        for (const [iEj, ejercicio] of subbloque.ejercicios.entries()) {
                            const { data: ejData, error: errorEj } = await supabase
                                .from('subbloques_ejercicios')
                                .insert([{ subbloque_id: subbloqueId, ejercicio_id: ejercicio.ejercicio_id, orden: iEj }])
                                .select().single();
                            if (errorEj) throw errorEj;
                            const subEjId = ejData.id;

                            const sets = ejercicio.sets_config?.length ? ejercicio.sets_config : createDefaultSetsConfig(numSets);

                            for (let k = 0; k < numSets; k++) {
                                const config = sets[k];
                                const { error: errorSerie } = await supabase
                                    .from('series_subejercicio')
                                    .insert([{
                                        subbloque_ejercicio_id: subEjId,
                                        nro_set: k + 1,
                                        reps: config.reps,
                                        carga_sugerida: config.carga,
                                        pausa: sharedRest || null,
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
            <aside className="w-full md:w-[280px] p-4 space-y-4 overflow-y-auto bg-white/5 border-b md:border-b-0 md:border-r border-white/10">
                <div className="flex flex-col gap-3">
                    <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre" className="rounded-lg bg-white/10 backdrop-blur px-3 py-2 text-white placeholder-white/50 text-sm w-full" />
                    <input value={tipo} onChange={e => setTipo(e.target.value)} placeholder="Tipo" className="rounded-lg bg-white/10 backdrop-blur px-3 py-2 text-white placeholder-white/50 text-sm w-full" />
                    <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Descripción" rows={3} className="rounded-lg bg-white/10 backdrop-blur px-3 py-2 text-white placeholder-white/50 text-sm resize-none w-full" />
                    {bloques.length > 0 && <button onClick={guardarRutina} className="bg-green-600/30 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm">Guardar rutina</button>}
                    <button onClick={agregarBloque} className="bg-white/20 hover:bg-white/30 text-white font-semibold rounded-lg px-4 py-2 text-sm">Agregar mes</button>
                </div>
            </aside>
            <section className="flex-1 pr-2 space-y-4 px-4 md:px-0">
                {bloques.map(bloque => (
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
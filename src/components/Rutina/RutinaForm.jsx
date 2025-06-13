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

                    for (const [iEj, ejercicio] of subbloque.ejercicios.entries()) {
                        const { data: ejData, error: errorEj } = await supabase
                            .from('subbloques_ejercicios')
                            .insert([
                                {
                                    subbloque_id: subbloqueId,
                                    ejercicio_id: ejercicio.ejercicio_id,
                                    orden: iEj,
                                },
                            ])
                            .select()
                            .single();

                        if (errorEj) throw errorEj;
                        const subEjId = ejData.id;

                        for (const [iSerie, serie] of ejercicio.series.entries()) {
                            const { error: errorSerie } = await supabase
                                .from('series_subejercicio')
                                .insert([
                                    {
                                        subbloque_ejercicio_id: subEjId,
                                        nro_set: iSerie + 1,
                                        reps: serie.reps,
                                        pausa: serie.pausa,
                                        carga_sugerida: serie.carga,
                                    },
                                ]);
                            if (errorSerie) throw errorSerie;
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
        <div className="max-w-5xl mx-auto p-2 space-y-2 sm:space-y-3">
            {bloques.length > 0 && (
                <button
                    onClick={guardarRutina}
                    className="w-full bg-green-600/30 backdrop-blur hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm"
                >
                    Guardar rutina
                </button>
            )}

            <div className="grid grid-cols-2  gap-2">
                <input
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Nombre"
                    className="w-full rounded-lg bg-white/10 backdrop-blur px-3 py-1.5 text-white placeholder-white/50 text-sm"
                />
                <input
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                    placeholder="Tipo"
                    className="w-full rounded-lg bg-white/10 backdrop-blur px-3 py-1.5 text-white placeholder-white/50 text-sm"
                />
            </div>

            <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Descripción"
                rows={2}
                className="w-full rounded-lg bg-white/10 backdrop-blur px-3 py-1.5 text-white placeholder-white/50 text-sm resize-none"
            />

    

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

                <button
                    onClick={agregarBloque}
                className="w-full bg-skyblue text-white font-semibold rounded-xl py-2 bg-white/20 hover:bg transition"
                >
                    Agregar mes
                </button>

            
            </div>
    );
};

export default RutinaForm;

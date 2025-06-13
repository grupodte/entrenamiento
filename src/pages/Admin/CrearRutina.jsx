// src/pages/Admin/CrearRutina.jsx
import { useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'react-hot-toast';

const tiposBloque = ['calentamiento', 'principal', 'cooldown'];

const CrearRutina = () => {
    const [nombre, setNombre] = useState('');
    const [tipo, setTipo] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [bloques, setBloques] = useState([]);

    const guardarRutina = async () => {
        if (!nombre || bloques.length === 0) {
            toast.error('Faltan datos: nombre o bloques');
            return;
        }

        try {
            toast.loading('Guardando rutina...');

            // 1. Insertar rutina_base
            const { data: rutinaBase, error: errorRutina } = await supabase
                .from('rutinas_base')
                .insert([{ nombre, tipo, descripcion }])
                .select()
                .single();

            if (errorRutina) throw errorRutina;

            const rutinaId = rutinaBase.id;

            for (const [bloqueOrden, bloque] of bloques.entries()) {
                // 2. Insertar bloque
                const { data: bloqueData, error: errorBloque } = await supabase
                    .from('bloques')
                    .insert([
                        {
                            rutina_base_id: rutinaId,
                            tipo: bloque.tipo,
                            nombre: bloque.nombre,
                            orden: bloqueOrden,
                        },
                    ])
                    .select()
                    .single();

                if (errorBloque) throw errorBloque;

                const bloqueId = bloqueData.id;

                for (const [ejercicioOrden, ejercicio] of bloque.ejercicios.entries()) {
                    // 3. Insertar bloque_ejercicio
                    const { data: bloqueEjData, error: errorBloqueEj } = await supabase
                        .from('bloques_ejercicios')
                        .insert([
                            {
                                bloque_id: bloqueId,
                                ejercicio_id: ejercicio.ejercicio_id,
                                orden: ejercicioOrden,
                            },
                        ])
                        .select()
                        .single();

                    if (errorBloqueEj) throw errorBloqueEj;

                    const bloqueEjId = bloqueEjData.id;

                    for (const [i, serie] of ejercicio.series.entries()) {
                        // 4. Insertar cada set
                        const { error: errorSerie } = await supabase
                            .from('series_bloques_ejercicios')
                            .insert([
                                {
                                    bloques_ejercicio_id: bloqueEjId,
                                    nro_set: i + 1,
                                    reps: serie.reps,
                                    pausa: serie.pausa,
                                    carga_sugerida: serie.carga,
                                },
                            ]);

                        if (errorSerie) throw errorSerie;
                    }
                }
            }

            toast.dismiss();
            toast.success('🎉 Rutina guardada correctamente');
            setNombre('');
            setTipo('');
            setDescripcion('');
            setBloques([]);
        } catch (error) {
            toast.dismiss();
            console.error('❌ Error al guardar:', error.message);
            toast.error('Error al guardar la rutina');
        }
    };
      

    const agregarBloque = () => {
        setBloques(prev => [
            ...prev,
            {
                id: uuidv4(),
                nombre: '',
                tipo: 'principal',
                ejercicios: [],
            }
        ]);
    };

    const eliminarBloque = (bloqueId) => {
        setBloques(prev => prev.filter(b => b.id !== bloqueId));
    };

    const agregarEjercicio = (bloqueId) => {
        setBloques(prev =>
            prev.map(b =>
                b.id === bloqueId
                    ? {
                        ...b,
                        ejercicios: [
                            ...b.ejercicios,
                            {
                                id: uuidv4(),
                                ejercicio_id: '', // Este se completará con un selector real
                                nombre: '',
                                series: [{ reps: '', pausa: '', carga: '' }],
                            },
                        ],
                    }
                    : b
            )
        );
    };

    const agregarSerie = (bloqueId, ejercicioId) => {
        setBloques(prev =>
            prev.map(b =>
                b.id === bloqueId
                    ? {
                        ...b,
                        ejercicios: b.ejercicios.map(e =>
                            e.id === ejercicioId
                                ? {
                                    ...e,
                                    series: [...e.series, { reps: '', pausa: '', carga: '' }],
                                }
                                : e
                        ),
                    }
                    : b
            )
        );
    };

    return (
        <AdminLayout>
            <div className="max-w-5xl mx-auto space-y-6 mt-10 px-4">
                <h1 className="text-2xl font-bold text-white">➕ Crear nueva rutina con bloques</h1>

                <input
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Nombre de la rutina"
                    className="w-full rounded-xl bg-white/10 backdrop-blur px-4 py-2 text-white placeholder-white/50"
                />
                <input
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                    placeholder="Tipo de rutina (fuerza, movilidad...)"
                    className="w-full rounded-xl bg-white/10 backdrop-blur px-4 py-2 text-white placeholder-white/50"
                />
                <textarea
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Descripción opcional"
                    className="w-full rounded-xl bg-white/10 backdrop-blur px-4 py-2 text-white placeholder-white/50"
                />

                <button
                    onClick={agregarBloque}
                    className="bg-skyblue text-white font-semibold rounded-xl px-4 py-2"
                >
                    ➕ Agregar bloque
                </button>

                {bloques.map((bloque, bloqueIdx) => (
                    <div
                        key={bloque.id}
                        className="bg-white/5 backdrop-blur p-4 rounded-xl border border-white/10 space-y-4"
                    >
                        <div className="flex justify-between items-center">
                            <input
                                value={bloque.nombre}
                                onChange={(e) =>
                                    setBloques(prev =>
                                        prev.map(b =>
                                            b.id === bloque.id ? { ...b, nombre: e.target.value } : b
                                        )
                                    )
                                }
                                placeholder={`Nombre del bloque (Ej: Piernas, Core...)`}
                                className="w-full rounded bg-white/10 px-3 py-2 text-white placeholder-white/50"
                            />
                            <select
                                value={bloque.tipo}
                                onChange={(e) =>
                                    setBloques(prev =>
                                        prev.map(b =>
                                            b.id === bloque.id ? { ...b, tipo: e.target.value } : b
                                        )
                                    )
                                }
                                className="ml-4 bg-white/10 text-white rounded px-3 py-2"
                            >
                                {tiposBloque.map(tipo => (
                                    <option key={tipo} value={tipo}>{tipo}</option>
                                ))}
                            </select>
                            <button
                                onClick={() => eliminarBloque(bloque.id)}
                                className="ml-4 text-red-400 hover:text-red-600 text-sm"
                            >
                                🗑️ Eliminar bloque
                            </button>
                        </div>

                        <button
                            onClick={() => agregarEjercicio(bloque.id)}
                            className="text-sm text-yellow-400 hover:underline"
                        >
                            ➕ Agregar ejercicio a este bloque
                        </button>

                        {bloque.ejercicios.map((ej, ejIdx) => (
                            <div key={ej.id} className="bg-white/10 p-3 rounded-xl space-y-2 border border-white/10">
                                <input
                                    value={ej.nombre}
                                    onChange={(e) =>
                                        setBloques(prev =>
                                            prev.map(b =>
                                                b.id === bloque.id
                                                    ? {
                                                        ...b,
                                                        ejercicios: b.ejercicios.map(ej2 =>
                                                            ej2.id === ej.id
                                                                ? { ...ej2, nombre: e.target.value }
                                                                : ej2
                                                        ),
                                                    }
                                                    : b
                                            )
                                        )
                                    }
                                    placeholder="Nombre del ejercicio"
                                    className="w-full bg-white/10 rounded px-3 py-1 text-white placeholder-white/50"
                                />

                                {ej.series.map((s, sIdx) => (
                                    <div key={sIdx} className="grid grid-cols-4 gap-2 text-white">
                                        <input
                                            value={s.reps}
                                            onChange={(e) =>
                                                setBloques(prev =>
                                                    prev.map(b =>
                                                        b.id === bloque.id
                                                            ? {
                                                                ...b,
                                                                ejercicios: b.ejercicios.map(ej2 =>
                                                                    ej2.id === ej.id
                                                                        ? {
                                                                            ...ej2,
                                                                            series: ej2.series.map((set, i) =>
                                                                                i === sIdx
                                                                                    ? { ...set, reps: e.target.value }
                                                                                    : set
                                                                            ),
                                                                        }
                                                                        : ej2
                                                                ),
                                                            }
                                                            : b
                                                    )
                                                )
                                            }
                                            placeholder="Reps"
                                            className="rounded bg-white/10 px-2 py-1"
                                        />
                                        <input
                                            value={s.pausa}
                                            onChange={(e) =>
                                                setBloques(prev =>
                                                    prev.map(b =>
                                                        b.id === bloque.id
                                                            ? {
                                                                ...b,
                                                                ejercicios: b.ejercicios.map(ej2 =>
                                                                    ej2.id === ej.id
                                                                        ? {
                                                                            ...ej2,
                                                                            series: ej2.series.map((set, i) =>
                                                                                i === sIdx
                                                                                    ? { ...set, pausa: e.target.value }
                                                                                    : set
                                                                            ),
                                                                        }
                                                                        : ej2
                                                                ),
                                                            }
                                                            : b
                                                    )
                                                )
                                            }
                                            placeholder="Pausa"
                                            className="rounded bg-white/10 px-2 py-1"
                                        />
                                        <input
                                            value={s.carga}
                                            onChange={(e) =>
                                                setBloques(prev =>
                                                    prev.map(b =>
                                                        b.id === bloque.id
                                                            ? {
                                                                ...b,
                                                                ejercicios: b.ejercicios.map(ej2 =>
                                                                    ej2.id === ej.id
                                                                        ? {
                                                                            ...ej2,
                                                                            series: ej2.series.map((set, i) =>
                                                                                i === sIdx
                                                                                    ? { ...set, carga: e.target.value }
                                                                                    : set
                                                                            ),
                                                                        }
                                                                        : ej2
                                                                ),
                                                            }
                                                            : b
                                                    )
                                                )
                                            }
                                            placeholder="Carga"
                                            className="rounded bg-white/10 px-2 py-1"
                                        />
                                        <span className="text-xs text-white/50 self-center">Set {sIdx + 1}</span>
                                    </div>
                                ))}

                                <button
                                    onClick={() => agregarSerie(bloque.id, ej.id)}
                                    className="text-sm text-skyblue hover:underline"
                                >
                                    ➕ Agregar set
                                </button>
                            </div>
                        ))}
                    </div>
                ))}

                {/* Botón de guardar (lógica se implementa en el próximo paso) */}
                {bloques.length > 0 && (
                    <button
                        onClick={() => console.log({ nombre, tipo, descripcion, bloques })}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-xl"
                    >
                        ✅ Guardar rutina (solo consola)
                    </button>
                )}
            </div>
        </AdminLayout>
    );
};

export default CrearRutina;

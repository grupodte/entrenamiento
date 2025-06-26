import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import AdminLayout from '../../layouts/AdminLayout';

const VerRutina = () => {
    const { id } = useParams();
    const [rutina, setRutina] = useState(null);

    useEffect(() => {
        const fetchRutina = async () => {
            const { data, error } = await supabase
                .from('rutinas_base')
                .select(`
          id,
          nombre,
          descripcion,
          bloques (
            id,
            orden,
            tipo,
            subbloques (
              id,
              orden,
              nombre,
                tipo, 
              subbloques_ejercicios (
                id,
                orden,
                ejercicio_id,
                ejercicio: ejercicios ( nombre ),
                series: series_subejercicio (
                  id,
                  nro_set,
                  reps,
                  pausa,
                  carga_sugerida
                )
              )
            )
          )
        `)
                .eq('id', id)
                .single();

            if (error) {
                console.error('Error al cargar rutina:', error);
            } else {
                setRutina(data);
            }
        };

        fetchRutina();
    }, [id]);

    if (!rutina) return null;

    return (
        <AdminLayout>
            <div className="p-6 max-w-6xl mx-auto space-y-6 text-white">
                <div>
                    <h1 className="text-3xl font-bold mb-1">{rutina.nombre}</h1>
                    <p className="text-white/70">{rutina.descripcion}</p>
                </div>

                {rutina.bloques?.map((bloque) => (
                    <div
                        key={bloque.id}
                        className="bg-white/5 border border-white/10 rounded-lg p-5 shadow-sm"
                    >
                        <h2 className="text-2xl font-semibold text-sky-400 mb-4">
                            🧱 Bloque {bloque.orden} — {bloque.tipo}
                        </h2>

                        {bloque.subbloques?.map((subbloque) => (
                            <div key={subbloque.id} className="mb-6">
                                <h3 className="text-lg font-bold text-white mb-2">
                                    {subbloque.nombre} ({subbloque.tipo === 'superset' ? 'Superset' : 'Simple'}
                                    )
                                </h3>

                                {subbloque.subbloques_ejercicios?.map((se) => (
                                    <div
                                        key={se.id}
                                        className="mb-3 p-3 rounded-md bg-white/10 border border-white/10"
                                    >
                                        <p className="text-white font-medium text-lg">
                                            {se.ejercicio?.nombre}
                                        </p>
                                        <ul className="mt-2 text-sm text-white/80 ml-4 list-disc">
                                            {se.series?.map((serie) => (
                                                <li key={serie.id}>
                                                    Set {serie.nro_set}: {serie.reps} reps — pausa {serie.pausa}s
                                                    {serie.carga_sugerida && ` — ${serie.carga_sugerida}`}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </AdminLayout>
    );
};

export default VerRutina;

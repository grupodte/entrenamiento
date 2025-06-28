import { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import AdminLayout from "../../layouts/AdminLayout";

const VerRutina = () => {
    const { id } = useParams();
    const location = useLocation();
    const [rutina, setRutina] = useState(null);

    const searchParams = new URLSearchParams(location.search);
    const tipo = searchParams.get("tipo") || "base";

    useEffect(() => {
        const fetchRutina = async () => {
            let res;

            if (tipo === "personalizada") {
                res = await supabase
                    .from("rutinas_personalizadas")
                    .select(`
            id,
            nombre,
            descripcion,
            bloques (
              id,
              orden,
              subbloques (
                id,
                orden,
                nombre,
                tipo,
                subbloques_ejercicios (
                  id,
                  ejercicio: ejercicios ( nombre ),
                  series: series_subejercicio (
                    id,
                    nro_set,
                    reps,
                    pausa
                  )
                )
              )
            )
          `)
                    .eq("id", id)
                    .single();
            } else {
                res = await supabase
                    .from("rutinas_base")
                    .select(`
            id,
            nombre,
            descripcion,
            bloques (
              id,
              orden,
              subbloques (
                id,
                orden,
                nombre,
                tipo,
                subbloques_ejercicios (
                  id,
                  ejercicio: ejercicios ( nombre ),
                  series: series_subejercicio (
                    id,
                    nro_set,
                    reps,
                    pausa
                  )
                )
              )
            )
          `)
                    .eq("id", id)
                    .single();
            }

            if (res.error) {
                console.error("Error al cargar rutina:", res.error);
            } else {
                setRutina(res.data);
            }
        };

        fetchRutina();
    }, [id, tipo]);

    if (!rutina) return null;

    return (
            <div className="p-6 max-w-6xl mx-auto text-white pb-[calc(4rem+env(safe-area-inset-bottom))] space-y-6">
                <div>
                    <h1 className="text-3xl font-bold mb-1">{rutina.nombre}</h1>
                    <p className="text-white/70">{rutina.descripcion}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {rutina.bloques?.map((bloque) => (
                        <div
                            key={bloque.id}
                            className="bg-white/5 border border-white/10 rounded-lg p-5 shadow-sm space-y-6"
                        >
                            <h2 className="text-xl font-semibold text-sky-400 mb-2">
                                Semana {bloque.orden * 4 + 1}–{(bloque.orden + 1) * 4}
                            </h2>

                            {[...(bloque.subbloques ?? [])]
                                .sort((a, b) => {
                                    const prioridad = (nombre) => {
                                        nombre = nombre.toLowerCase();
                                        if (nombre.includes("calentamiento")) return 0;
                                        if (nombre.includes("principal")) return 1;
                                        if (nombre.includes("cooldown")) return 2;
                                        if (nombre.includes("estiramiento")) return 3;
                                        return 4;
                                    };
                                    return prioridad(a.nombre) - prioridad(b.nombre);
                                })
                                .map((subbloque) => (
                                    <div key={subbloque.id}>
                                        <h3
                                            className={`text-lg font-bold px-2 py-1 rounded ${subbloque.tipo === "superset"
                                                    ? "bg-purple-700 text-white"
                                                    : "bg-sky-700 text-white"
                                                }`}
                                        >
                                            {subbloque.nombre}
                                            <span className="text-xs font-normal text-white/70 ml-2">
                                                ({subbloque.tipo})
                                            </span>
                                        </h3>
                                        {subbloque.tipo === "superset" && (
                                            <p className="text-xs italic text-white/70 mt-1 ml-2">
                                                Realizá en forma alternada: ejercicio 1 serie 1 → ejercicio 2
                                                serie 1 → pausa → repetir hasta completar todas las series.
                                            </p>
                                        )}

                                        <div className="overflow-x-auto rounded-md border border-white/10 mt-2">
                                            <table className="min-w-full text-xs text-left border-collapse">
                                                <thead className="bg-white/10 uppercase text-white">
                                                    <tr>
                                                        <th className="px-3 py-2 border border-white/10">Ejercicio</th>
                                                        <th className="px-3 py-2 border border-white/10">Series</th>
                                                        <th className="px-3 py-2 border border-white/10">Reps</th>
                                                        <th className="px-3 py-2 border border-white/10">Pausa</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {subbloque.tipo === "superset" ? (
                                                        subbloque.subbloques_ejercicios?.map((se, index) => {
                                                            const primerSerie = se.series?.[0];
                                                            const maxSeries = Math.max(
                                                                ...subbloque.subbloques_ejercicios.flatMap((e) =>
                                                                    e.series?.map((s) => s.nro_set) || []
                                                                ),
                                                                0
                                                            );
                                                            const pause =
                                                                primerSerie?.pausa ? `${primerSerie.pausa}s` : "-";
                                                            return (
                                                                <tr key={se.id}>
                                                                    <td className="px-3 py-2 border border-white/10">
                                                                        {se.ejercicio?.nombre}
                                                                    </td>
                                                                    {index === 0 && (
                                                                        <td
                                                                            className="px-3 py-2 border border-white/10"
                                                                            rowSpan={subbloque.subbloques_ejercicios.length}
                                                                        >
                                                                            {maxSeries}
                                                                        </td>
                                                                    )}
                                                                    <td className="px-3 py-2 border border-white/10">
                                                                        {primerSerie?.reps ?? "-"}
                                                                    </td>
                                                                    {index === 0 && (
                                                                        <td
                                                                            className="px-3 py-2 border border-white/10"
                                                                            rowSpan={subbloque.subbloques_ejercicios.length}
                                                                        >
                                                                            {pause}
                                                                        </td>
                                                                    )}
                                                                </tr>
                                                            );
                                                        })
                                                    ) : (
                                                        subbloque.subbloques_ejercicios?.map((se) => {
                                                            const series = se.series || [];
                                                            const maxSeries = Math.max(
                                                                ...series.map((s) => s.nro_set),
                                                                0
                                                            );
                                                            const primerSerie = series[0];
                                                            return (
                                                                <tr
                                                                    key={se.id}
                                                                    className="odd:bg-white/5 even:bg-white/10"
                                                                >
                                                                    <td className="px-3 py-2 border border-white/10">
                                                                        {se.ejercicio?.nombre}
                                                                    </td>
                                                                    <td className="px-3 py-2 border border-white/10">
                                                                        {maxSeries}
                                                                    </td>
                                                                    <td className="px-3 py-2 border border-white/10">
                                                                        {primerSerie?.reps ?? "-"}
                                                                    </td>
                                                                    <td className="px-3 py-2 border border-white/10">
                                                                        {primerSerie?.pausa
                                                                            ? `${primerSerie.pausa}s`
                                                                            : "-"}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    ))}
                </div>
            </div>
        
    );
};

export default VerRutina;

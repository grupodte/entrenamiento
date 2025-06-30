// src/pages/Alumno/RutinaDetalle.jsx
import { useEffect, useState } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";

const RutinaDetalle = () => {
    const { id } = useParams();
    const location = useLocation();
    const [rutina, setRutina] = useState(null);
    const [loading, setLoading] = useState(true);

    // Paso 1: guardar series realizadas en estado local
    const [seriesRealizadas, setSeriesRealizadas] = useState([]);

    // Paso 2: temporizador de pausa
    const [temporizadorActivo, setTemporizadorActivo] = useState(false);
    const [tiempoRestante, setTiempoRestante] = useState(0);

    const searchParams = new URLSearchParams(location.search);
    const tipo = searchParams.get("tipo") || "base";
    const bloqueSeleccionado = searchParams.get("bloque");

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
                let data = res.data;
                if (bloqueSeleccionado) {
                    data.bloques = data.bloques.filter((b) => b.id === bloqueSeleccionado);
                }
                setRutina(data);
            }
            setLoading(false);
        };

        fetchRutina();
    }, [id, tipo, bloqueSeleccionado]);

    // Paso 1: toggle marcar serie
    const toggleSerieRealizada = (serieId) => {
        setSeriesRealizadas((prev) =>
            prev.includes(serieId) ? prev.filter((s) => s !== serieId) : [...prev, serieId]
        );
    };

    // Paso 2: iniciar temporizador
    const iniciarTemporizador = (segundos) => {
        setTiempoRestante(segundos);
        setTemporizadorActivo(true);
    };

    // Paso 2: manejar countdown
    useEffect(() => {
        if (!temporizadorActivo) return;

        const interval = setInterval(() => {
            setTiempoRestante((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    setTemporizadorActivo(false);
                    // Podés agregar aquí un sonido o vibración si querés
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [temporizadorActivo]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-gray-700">
                Cargando tu rutina...
            </div>
        );
    }

    if (!rutina) return null;

    return (
        <div className="p-6 max-w-6xl mx-auto text-white pb-[calc(4rem+env(safe-area-inset-bottom))] space-y-6">
            <div>
                <h1 className="text-3xl font-bold mb-1">{rutina.nombre}</h1>
                <p className="text-white/70">{rutina.descripcion}</p>
                <Link
                    to="/dashboard/rutinas"
                    className="text-indigo-400 hover:underline text-sm block mt-2"
                >
                    ← Volver a mis rutinas
                </Link>
            </div>

            {/* Temporizador visual */}
            {temporizadorActivo && (
                <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-sky-700 text-white px-4 py-2 rounded-full shadow-lg z-50 animate-pulse">
                    Descanso: {tiempoRestante}s
                </div>
            )}

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
                                                    <th className="px-3 py-2 border border-white/10">Timer</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {subbloque.tipo === "superset"
                                                    ? subbloque.subbloques_ejercicios?.map((se, index) => {
                                                        const primerSerie = se.series?.[0];
                                                        const maxSeries = Math.max(
                                                            ...subbloque.subbloques_ejercicios.flatMap((e) =>
                                                                e.series?.map((s) => s.nro_set) || []
                                                            ),
                                                            0
                                                        );
                                                        const pause = primerSerie?.pausa ? `${primerSerie.pausa}s` : "-";
                                                        // identificador a nivel subbloque
                                                        const serieId = `superset-${subbloque.id}`;

                                                        return (
                                                            <tr
                                                                key={se.id}
                                                                className={`cursor-pointer border-b border-white/10 transition ${seriesRealizadas.includes(serieId)
                                                                        ? "bg-green-700 text-white"
                                                                        : "hover:bg-white/10"
                                                                    }`}
                                                                onClick={() => toggleSerieRealizada(serieId)}
                                                            >
                                                                <td className="px-3 py-2 border-r border-white/10">
                                                                    {se.ejercicio?.nombre}
                                                                </td>
                                                                {index === 0 && (
                                                                    <td
                                                                        className="px-3 py-2 border-r border-white/10"
                                                                        rowSpan={subbloque.subbloques_ejercicios.length}
                                                                    >
                                                                        {maxSeries}
                                                                    </td>
                                                                )}
                                                                <td className="px-3 py-2 border-r border-white/10">
                                                                    {primerSerie?.reps ?? "-"}
                                                                </td>
                                                                {index === 0 && (
                                                                    <>
                                                                        <td
                                                                            className="px-3 py-2 border-r border-white/10"
                                                                            rowSpan={subbloque.subbloques_ejercicios.length}
                                                                        >
                                                                            {pause}
                                                                        </td>
                                                                        <td
                                                                            className="px-3 py-2 border-r border-white/10"
                                                                            rowSpan={subbloque.subbloques_ejercicios.length}
                                                                        >
                                                                            {primerSerie?.pausa ? (
                                                                                <button
                                                                                    className="bg-indigo-600 hover:bg-indigo-700 transition px-2 py-1 rounded text-xs"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        iniciarTemporizador(primerSerie.pausa);
                                                                                    }}
                                                                                >
                                                                                    Iniciar
                                                                                </button>
                                                                            ) : (
                                                                                "-"
                                                                            )}
                                                                        </td>
                                                                    </>
                                                                )}
                                                            </tr>
                                                        );
                                                    })
                                                    : subbloque.subbloques_ejercicios?.map((se) => {
                                                        const series = se.series || [];
                                                        const maxSeries = Math.max(
                                                            ...series.map((s) => s.nro_set),
                                                            0
                                                        );
                                                        const primerSerie = series[0];
                                                        const serieId = `${subbloque.id}-${se.id}-${primerSerie?.nro_set}`;
                                                        return (
                                                            <tr
                                                                key={se.id}
                                                                className={`cursor-pointer border-b border-white/10 transition ${seriesRealizadas.includes(serieId)
                                                                        ? "bg-green-700 text-white"
                                                                        : "hover:bg-white/10"
                                                                    }`}
                                                                onClick={() => toggleSerieRealizada(serieId)}
                                                            >
                                                                <td className="px-3 py-2 border-r border-white/10">
                                                                    {se.ejercicio?.nombre}
                                                                </td>
                                                                <td className="px-3 py-2 border-r border-white/10">{maxSeries}</td>
                                                                <td className="px-3 py-2 border-r border-white/10">
                                                                    {primerSerie?.reps ?? "-"}
                                                                </td>
                                                                <td className="px-3 py-2 border-r border-white/10">
                                                                    {primerSerie?.pausa ? `${primerSerie.pausa}s` : "-"}
                                                                </td>
                                                                <td className="px-3 py-2 border-r border-white/10">
                                                                    {primerSerie?.pausa ? (
                                                                        <button
                                                                            className="bg-indigo-600 hover:bg-indigo-700 transition px-2 py-1 rounded text-xs"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                iniciarTemporizador(primerSerie.pausa);
                                                                            }}
                                                                        >
                                                                            Iniciar
                                                                        </button>
                                                                    ) : (
                                                                        "-"
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
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

export default RutinaDetalle;

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";

const VerRutinaReal = () => {
    const { id } = useParams();
    const [rutina, setRutina] = useState(null);
    const [sesiones, setSesiones] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRutina = async () => {
            setLoading(true);
            // 1. Fetch the main routine details
            const { data: rutinaData, error: rutinaError } = await supabase
                .from("rutinas_de_verdad")
                .select("id, nombre, descripcion, etiquetas")
                .eq("id", id)
                .single();

            if (rutinaError) {
                console.error("Error fetching rutina_de_verdad:", rutinaError);
                setLoading(false);
                return;
            }
            setRutina(rutinaData);

            // 2. Fetch the session mappings
            const { data: sesionesMap, error: mapError } = await supabase
                .from("rutinas_de_verdad_sesiones")
                .select("dia_semana, orden, sesion:rutinas_base(id, nombre, descripcion, tipo)")
                .eq("rutina_id", id)
                .order("orden");

            if (mapError) {
                console.error("Error fetching session mappings:", mapError);
                setLoading(false);
                return;
            }

            // 3. Group sessions by day
            const sesionesPorDia = {};
            for (const s of sesionesMap) {
                if (!sesionesPorDia[s.dia_semana]) {
                    sesionesPorDia[s.dia_semana] = [];
                }
                sesionesPorDia[s.dia_semana].push(s.sesion);
            }
            setSesiones(sesionesPorDia);

            setLoading(false);
        };

        fetchRutina();
    }, [id]);

    if (loading) {
        return <div className="text-white">Cargando...</div>;
    }

    if (!rutina) {
        return <div className="text-white">Rutina no encontrada.</div>;
    }

    const DIAS = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6 text-white min-h-[calc(100dvh-4rem)] pb-[90px]">
            <div>
                <h1 className="text-3xl font-bold mb-1">{rutina.nombre}</h1>
                <p className="text-white/70">{rutina.descripcion}</p>
                <div className="flex gap-2 mt-2">
                    {rutina.etiquetas?.map(tag => (
                        <span key={tag} className="px-2 py-1 text-xs rounded-full bg-white/10 text-white">{tag}</span>
                    ))}
                </div>
            </div>

            <div className="space-y-6">
                {DIAS.map(dia => (
                    sesiones[dia] && sesiones[dia].length > 0 && (
                        <div key={dia} className="bg-white/5 border border-white/10 rounded-lg p-5 shadow-sm">
                            <h2 className="text-xl font-semibold capitalize text-sky-400 mb-4">{dia}</h2>
                            <div className="space-y-4">
                                {sesiones[dia].map(sesion => (
                                    <div key={sesion.id} className="p-4 rounded-lg bg-white/10">
                                        <h3 className="font-bold text-lg">{sesion.nombre}</h3>
                                        <p className="text-sm text-white/70">{sesion.descripcion}</p>
                                        <p className="text-xs text-white/50 font-mono mt-1">Tipo: {sesion.tipo || 'General'}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                ))}
            </div>
        </div>
    );
};

export default VerRutinaReal;

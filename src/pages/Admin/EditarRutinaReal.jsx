import React, { useEffect, useMemo, useState } from "react";
import { DndContext, MouseSensor, TouchSensor, useSensor, useSensors, DragOverlay, useDroppable } from "@dnd-kit/core";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";

import { supabase } from "../../lib/supabaseClient";
import { AnimatedLayout } from '../../components/animations';
import RutinasSidebar from "../../components/Rutina/RutinasSidebar";
import RutinaItem from "../../components/Rutina/RutinaItem";
import { Loader2, Save, Trash2 } from "lucide-react";

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const diaSlugToIndex = { lunes: 0, martes: 1, miercoles: 2, jueves: 3, viernes: 4, sabado: 5, domingo: 6 };
const diaIndexToSlug = (idx) => ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"][idx];

const INPUT = "w-full rounded-xl bg-white/10 px-4 py-3 text-white placeholder-white/50 focus:ring-2 focus:ring-cyan-400/80 border border-white/10 focus:border-cyan-300 transition-all outline-none shadow-inner";

export default function EditarRutinaReal() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [rutinasBase, setRutinasBase] = useState([]);
    const [sesionesPorDia, setSesionesPorDia] = useState(() => DIAS.map(() => []));
    const [activeId, setActiveId] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [nombre, setNombre] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [etiquetas, setEtiquetas] = useState("");
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor)
    );

    useEffect(() => {
        const fetchRutinaData = async () => {
            setLoading(true);

            // Fetch existing routine data
            const { data: rutinaData, error: rutinaError } = await supabase
                .from('rutinas_de_verdad')
                .select('*')
                .eq('id', id)
                .single();

            if (rutinaError) {
                toast.error("No se pudo cargar la rutina para editar.");
                navigate("/admin/rutinas-reales");
                return;
            }

            setNombre(rutinaData.nombre || "");
            setDescripcion(rutinaData.descripcion || "");
            setEtiquetas(rutinaData.etiquetas?.join(", ") || "");

            // Fetch session mappings
            const { data: sesionesMap, error: mapError } = await supabase
                .from('rutinas_de_verdad_sesiones')
                .select('dia_semana, orden, sesion:rutinas_base(*)')
                .eq('rutina_id', id)
                .order('orden');

            if (mapError) {
                toast.error("Error al cargar las sesiones de la rutina.");
            } else {
                const sesionesPorDiaInitial = DIAS.map(() => []);
                for (const s of sesionesMap) {
                    const dayIndex = diaSlugToIndex[s.dia_semana];
                    if (dayIndex !== undefined) {
                        sesionesPorDiaInitial[dayIndex].push(s.sesion);
                    }
                }
                setSesionesPorDia(sesionesPorDiaInitial);
            }

            // Fetch all available base routines for the sidebar
            const { data: baseData, error: baseError } = await supabase
                .from("rutinas_base")
                .select("id, nombre, tipo, descripcion");
            
            if (baseError) {
                toast.error("No se pudieron cargar las sesiones disponibles.");
            } else {
                setRutinasBase(baseData || []);
            }

            setLoading(false);
        };

        fetchRutinaData();
    }, [id, navigate]);

    const findSesion = (id) => rutinasBase.find((r) => r.id === id);

    const handleDrop = (event) => {
        const { active, over } = event;
        if (!active || !over) return;

        const draggedId = active.id.toString().replace("rutina-", "");
        const targetId = over.id.toString();

        if (!targetId.startsWith("dia-")) return;

        const dayIndex = Number(targetId.replace("dia-", ""));
        const sesion = findSesion(draggedId);

        if (sesion) {
            setSesionesPorDia(prev => {
                const newSesiones = prev.map(d => [...d]);
                if (!newSesiones[dayIndex].some(s => s.id === sesion.id)) {
                    newSesiones[dayIndex].push(sesion);
                }
                return newSesiones;
            });
        }
    };

    const handleRemoveFromDay = (dayIndex, sesionId) => {
        setSesionesPorDia(prev => {
            const newSesiones = [...prev];
            newSesiones[dayIndex] = newSesiones[dayIndex].filter(s => s.id !== sesionId);
            return newSesiones;
        });
    };

    const handleGuardar = async () => {
        if (!nombre.trim()) {
            toast.error("El nombre de la rutina es obligatorio.");
            return;
        }
        setIsSaving(true);
        toast.loading("Guardando cambios...");

        const etiquetasArray = etiquetas.split(",").map(s => s.trim()).filter(Boolean);

        // 1. Update routine details
        const { error: updateError } = await supabase
            .from('rutinas_de_verdad')
            .update({ nombre, descripcion, etiquetas: etiquetasArray })
            .eq('id', id);

        if (updateError) {
            toast.dismiss();
            toast.error("Error al actualizar la rutina.");
            setIsSaving(false);
            return;
        }

        // 2. Delete old session mappings
        const { error: deleteError } = await supabase
            .from('rutinas_de_verdad_sesiones')
            .delete()
            .eq('rutina_id', id);

        if (deleteError) {
            toast.dismiss();
            toast.error("Error al limpiar sesiones antiguas.");
            setIsSaving(false);
            return;
        }

        // 3. Insert new session mappings
        const newMappings = [];
        sesionesPorDia.forEach((sesiones, dayIndex) => {
            sesiones.forEach((sesion, orden) => {
                newMappings.push({
                    rutina_id: id,
                    sesion_id: sesion.id,
                    dia_semana: diaIndexToSlug(dayIndex),
                    orden: orden + 1,
                });
            });
        });

        if (newMappings.length > 0) {
            const { error: insertError } = await supabase
                .from('rutinas_de_verdad_sesiones')
                .insert(newMappings);

            if (insertError) {
                toast.dismiss();
                toast.error("Error al guardar las nuevas sesiones.");
                setIsSaving(false);
                return;
            }
        }

        toast.dismiss();
        toast.success("Rutina actualizada con éxito!");
        navigate("/admin/rutinas-reales");
        setIsSaving(false);
    };

    if (loading) {
        return <div className="text-white p-6">Cargando editor...</div>;
    }

    return (
        <AnimatedLayout className="min-h-[calc(100dvh-4rem)] pb-[90px] py-6 text-white">
            <DndContext
                sensors={sensors}
                onDragStart={(e) => setActiveId(e.active.id)}
                onDragEnd={handleDrop}
                onDragCancel={() => setActiveId(null)}
            >
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 px-4">
                    <aside className="md:col-span-1 space-y-4">
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                            <h3 className="text-lg font-semibold mb-4">Editar Rutina</h3>
                            <div className="space-y-3">
                                <input className={INPUT} placeholder="Nombre de la rutina" value={nombre} onChange={e => setNombre(e.target.value)} />
                                <textarea className={`${INPUT} min-h-[100px]`} placeholder="Descripción" value={descripcion} onChange={e => setDescripcion(e.target.value)} />
                                <input className={INPUT} placeholder="Etiquetas (separadas por coma)" value={etiquetas} onChange={e => setEtiquetas(e.target.value)} />
                            </div>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                            <h3 className="text-lg font-semibold mb-4">Sesiones Disponibles</h3>
                            <RutinasSidebar rutinas={rutinasBase} />
                        </div>
                    </aside>

                    <section className="md:col-span-3 space-y-6">
                        <AnimatedList className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {DIAS.map((dia, idx) => (
                                <AnimatedListItem key={idx}>
                                    <DropDayCard
                                        id={`dia-${idx}`}
                                        titulo={dia}
                                        sesiones={sesionesPorDia[idx]}
                                        onRemove={(sesionId) => handleRemoveFromDay(idx, sesionId)}
                                    />
                                </AnimatedListItem>
                            ))}
                        </AnimatedList>
                        <div className="flex justify-end">
                            <button onClick={handleGuardar} disabled={isSaving} className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 text-black font-semibold px-5 py-3 hover:bg-cyan-300 transition shadow-lg disabled:opacity-60">
                                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                {isSaving ? "Guardando..." : "Guardar Cambios"}
                            </button>
                        </div>
                    </section>
                </div>
                <DragOverlay>
                    {activeId ? <RutinaItem rutina={rutinasBase.find(r => `rutina-${r.id}` === activeId)} /> : null}
                </DragOverlay>
            </DndContext>
        </AnimatedLayout>
    );
}

function DropDayCard({ id, titulo, sesiones, onRemove }) {
    const { isOver, setNodeRef } = useDroppable({ id });
    return (
        <div ref={setNodeRef} className={`rounded-2xl p-4 min-h-[170px] transition-all border ${isOver ? "bg-white/20 border-cyan-300" : "bg-white/10 border-white/10"}`}>
            <h3 className="text-base font-bold mb-3">{titulo}</h3>
            {sesiones.length === 0 ? (
                <div className="text-xs text-white/50 italic">Soltá una sesión aquí…</div>
            ) : (
                <ul className="space-y-2">
                    {sesiones.map((s) => (
                        <li key={s.id} className="flex items-center justify-between rounded-lg bg-white/5 border border-white/10 px-3 py-2">
                            <div className="truncate">
                                <p className="text-sm font-medium">{s?.nombre || "Sin nombre"}</p>
                                {s?.tipo ? <p className="text-[11px] text-white/50 mt-0.5">Tipo: {s.tipo}</p> : null}
                            </div>
                            <button onClick={() => onRemove(s.id)} title="Quitar de este día" className="p-1 rounded-md bg-red-500/20 hover:bg-red-500/30 text-red-200">
                                <Trash2 size={16} />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

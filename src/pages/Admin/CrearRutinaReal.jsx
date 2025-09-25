// src/pages/Admin/CrearRutinaReal.jsx
import React, { useEffect, useMemo, useState } from "react";
import { DndContext, MouseSensor, TouchSensor, useSensor, useSensors, DragOverlay, useDroppable } from "@dnd-kit/core";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import { supabase } from "../../lib/supabaseClient";
// Componentes de animación eliminados - usando motion directamente

// Reutilizamos el sidebar y la tarjeta de item (lo que ya usás para drag de sesiones)
import RutinasSidebar from "../../components/Rutina/RutinasSidebar";
import RutinaItem from "../../components/Rutina/RutinaItem";

// UI
import { Loader2, Save, Trash2 } from "lucide-react";

// ====== CONSTANTES ======
const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const INPUT = "w-full rounded-xl bg-white/10 px-4 py-3 text-white placeholder-white/50 focus:ring-2 focus:ring-cyan-400/80 border border-white/10 focus:border-cyan-300 transition-all outline-none shadow-inner";

// Map para guardar en DB
const diaIndexToSlug = (idx) => ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"][idx];

// ====== COMPONENTE PRINCIPAL ======
export default function CrearRutinaReal() {
    const navigate = useNavigate();
    const [rutinasBase, setRutinasBase] = useState([]); // sesiones existentes (tabla rutinas_base)
    const [sesionesPorDia, setSesionesPorDia] = useState(() => DIAS.map(() => [])); // array[7] de arrays de sesiones
    const [activeId, setActiveId] = useState(null);
    const [isDragging, setIsDragging] = useState(false);

    // Cabecera rutina_de_verdad
    const [nombre, setNombre] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [etiquetas, setEtiquetas] = useState("fullbody,base");

    // Loading/guardado
    const [loadingSesiones, setLoadingSesiones] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Sensores DnD
    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor)
    );

    // Cargar sesiones (rutinas_base)
    useEffect(() => {
        (async () => {
            setLoadingSesiones(true);
            const { data, error } = await supabase
                .from("rutinas_base")
                .select("id, nombre, tipo, descripcion");
            if (error) {
                console.error(error);
                toast.error("No se pudieron cargar las sesiones (rutinas_base).");
            } else {
                setRutinasBase(
                    (data || []).map((r) => ({
                        ...r,
                        // Se usa en DragOverlay y Sidebar (mismo contrato que tu RutinaItem/RutinasSidebar)
                        id: r.id,
                    }))
                );
            }
            setLoadingSesiones(false);
        })();
    }, []);

    // Buscar sesión por id
    const findSesion = (id) => rutinasBase.find((r) => r.id === id);

    // Manejo de drop: activeId será algo tipo "rutina-<id>"
    const handleDrop = (event) => {
        const { active, over } = event;
        setIsDragging(false);

        if (!active || !over) return;

        // Esperamos ID tipo "rutina-<uuid>" desde RutinasSidebar/RutinaItem
        // y "dia-<index>" para el dropzone
        const dragged = active.id;
        const target = over.id;

        if (!dragged?.startsWith("rutina-") || !target?.startsWith("dia-")) return;

        const sesionId = dragged.replace("rutina-", "");
        const dayIndex = Number(target.replace("dia-", ""));
        if (Number.isNaN(dayIndex)) return;

        const sesion = findSesion(sesionId);
        if (!sesion) return;

        setSesionesPorDia((prev) => {
            const clone = prev.map((arr) => [...arr]);
            // Evitar duplicados exactos dentro del mismo día
            if (!clone[dayIndex].some((s) => s.id === sesion.id)) {
                clone[dayIndex].push(sesion);
            } else {
                toast("Esa sesión ya está en este día.");
            }
            return clone;
        });
    };

    const handleRemoveFromDay = (dayIndex, sesionId) => {
        setSesionesPorDia((prev) => {
            const clone = prev.map((arr) => [...arr]);
            clone[dayIndex] = clone[dayIndex].filter((s) => s.id !== sesionId);
            return clone;
        });
    };

    const etiquetasArray = useMemo(
        () => etiquetas.split(",").map((s) => s.trim()).filter(Boolean),
        [etiquetas]
    );

    const validar = () => {
        const errors = [];
        if (!nombre.trim()) errors.push("El nombre es obligatorio.");
        const totalSesiones = sesionesPorDia.reduce((acc, arr) => acc + arr.length, 0);
        if (totalSesiones === 0) errors.push("Agrega al menos una sesión en algún día.");
        return errors;
    };

    // Guardar en: rutinas_de_verdad + rutinas_de_verdad_sesiones
    const handleGuardar = async () => {
        const errs = validar();
        if (errs.length) {
            toast.error(errs.join("\n"));
            return;
        }
        if (isSaving) return;

        try {
            setIsSaving(true);
            toast.loading("Guardando rutina…");

            // 1) Cabecera
            const { data: rutina, error: errRutina } = await supabase
                .from("rutinas_de_verdad")
                .insert({
                    nombre: nombre.trim(),
                    descripcion: descripcion || null,
                    etiquetas: etiquetasArray.length ? etiquetasArray : null,
                })
                .select()
                .single();
            if (errRutina) throw errRutina;

            // 2) Mapeo día/sesiones
            const rows = [];
            sesionesPorDia.forEach((arr, idx) => {
                const dia_semana = diaIndexToSlug(idx);
                arr.forEach((sesion, orden) => {
                    rows.push({
                        rutina_id: rutina.id,
                        sesion_id: sesion.id, // id de rutinas_base
                        dia_semana,
                        orden: orden + 1,
                    });
                });
            });

            if (rows.length) {
                const { error: errMap } = await supabase
                    .from("rutinas_de_verdad_sesiones")
                    .insert(rows);
                if (errMap) throw errMap;
            }

            toast.dismiss();
            toast.success("Rutina creada correctamente.");
            // Redirigimos al listado de rutinas (o a detalle si ya lo tenés)
            navigate("/admin/rutinas");
        } catch (e) {
            console.error(e);
            toast.dismiss();
            toast.error("No se pudo guardar la rutina.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <motion.div 
            className="min-h-[calc(100dvh-4rem)] pb-[90px] py-6 text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
        >
            <DndContext
                sensors={sensors}
                onDragStart={(e) => { setActiveId(e.active.id); setIsDragging(true); }}
                onDragEnd={handleDrop}
                onDragCancel={() => { setActiveId(null); setIsDragging(false); }}
                autoScroll
            >
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 px-4">
                    {/* SIDEBAR IZQUIERDO: sesiones existentes */}
                    <aside className="md:col-span-1 space-y-4">
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-2xl">
                            <h3 className="text-lg font-semibold text-white/90 border-b border-white/10 pb-3 mb-4">
                                Datos de la rutina
                            </h3>
                            <div className="space-y-3">
                                <input
                                    className={INPUT}
                                    placeholder="Nombre de la rutina (p. ej. FullBody Semana 1)"
                                    value={nombre}
                                    onChange={(e) => setNombre(e.target.value)}
                                />
                                <textarea
                                    className={`${INPUT} min-h-[100px]`}
                                    placeholder="Descripción (opcional)"
                                    value={descripcion}
                                    onChange={(e) => setDescripcion(e.target.value)}
                                />
                                <input
                                    className={INPUT}
                                    placeholder="Etiquetas separadas por coma (p. ej. fullbody,base)"
                                    value={etiquetas}
                                    onChange={(e) => setEtiquetas(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-2xl">
                            <h3 className="text-lg font-semibold text-white/90 border-b border-white/10 pb-3 mb-4">
                                Sesiones disponibles
                            </h3>
                            {loadingSesiones ? (
                                <div className="flex items-center gap-2 text-white/70">
                                    <Loader2 className="animate-spin" /> Cargando…
                                </div>
                            ) : (
                                <RutinasSidebar rutinas={rutinasBase} />
                            )}
                            <p className="text-xs text-white/40 mt-3">
                                Arrastrá una sesión al día correspondiente para armar la rutina.
                            </p>
                        </div>
                    </aside>

                    {/* ZONA CENTRAL: 7 días con dropzones */}
                    <section className="md:col-span-3 space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {DIAS.map((dia, idx) => (
                                <motion.div 
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                >
                                    <DropDayCard
                                        id={`dia-${idx}`}
                                        titulo={dia}
                                        sesiones={sesionesPorDia[idx]}
                                        onRemove={(sesionId) => handleRemoveFromDay(idx, sesionId)}
                                    />
                                </motion.div>
                            ))}
                        </div>

                        <div className="flex justify-end">
                            <button
                                onClick={handleGuardar}
                                disabled={isSaving}
                                className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 text-black font-semibold px-5 py-3 hover:bg-cyan-300 transition shadow-lg disabled:opacity-60"
                            >
                                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                {isSaving ? "Guardando…" : "Guardar rutina"}
                            </button>
                        </div>
                    </section>
                </div>

                <DragOverlay>
                    {activeId?.startsWith("rutina-") ? (
                        <motion.div
                            initial={{ scale: 1.1, opacity: 0.8 }}
                            animate={{ scale: 1.1, opacity: 0.8 }}
                            style={{ transform: 'rotate(5deg)' }}
                        >
                            <RutinaItem rutina={rutinasBase.find((r) => `rutina-${r.id}` === activeId)} />
                        </motion.div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </motion.div>
    );
}

// ====== Card de Día (dropzone genérico sin alumno) ======
function DropDayCard({ id, titulo, sesiones, onRemove }) {
    const { isOver, setNodeRef } = useDroppable({ id });

    return (
        <div
            ref={setNodeRef}
            className={`rounded-2xl p-4 min-h-[170px] transition-all border ${isOver ? "bg-white/20 border-cyan-300" : "bg-white/10 border-white/10"}`}>
            <h3 className="text-base font-bold mb-3">{titulo}</h3>

            {sesiones.length === 0 ? (
                <div className="text-xs text-white/50 italic">Soltá una sesión aquí…</div>
            ) : (
                <ul className="space-y-2">
                    {sesiones.map((s) => (
                        <li
                            key={s.id}
                            className="flex items-center justify-between rounded-lg bg-white/5 border border-white/10 px-3 py-2"
                        >
                            <div className="truncate">
                                <p className="text-sm font-medium">{s?.nombre || "Sin nombre"}</p>
                                {s?.tipo ? (
                                    <p className="text-[11px] text-white/50 mt-0.5">Tipo: {s.tipo}</p>
                                ) : null}
                            </div>
                            <button
                                className="p-1 rounded-md bg-red-500/20 hover:bg-red-500/30 text-red-200"
                                onClick={() => onRemove(s.id)}
                                title="Quitar de este día"
                            >
                                <Trash2 size={16} />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

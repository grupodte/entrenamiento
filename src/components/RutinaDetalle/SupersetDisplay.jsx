// src/components/RutinaDetalle/SupersetDisplay.jsx
import React from 'react';
import { motion } from 'framer-motion';
import SerieItem from './SerieItem';
import { generarIdEjercicioEnSerieDeSuperset } from '../../utils/rutinaIds';

// Paleta simplificada usando solo grays y cyan
const PALETTE = [
    {
        name: 'cyan',
        chip: 'bg-cyan-400/15 text-cyan-300 border-cyan-400/30',
        ring: 'ring-cyan-400/20',
        fill: 'bg-cyan-400',
        text: 'text-cyan-300',
        bg: 'bg-cyan-400/5'
    },
    {
        name: 'gray-light',
        chip: 'bg-gray-500/15 text-gray-300 border-gray-400/30',
        ring: 'ring-gray-400/20',
        fill: 'bg-gray-400',
        text: 'text-gray-300',
        bg: 'bg-gray-400/5'
    },
    {
        name: 'gray-medium',
        chip: 'bg-gray-600/15 text-gray-200 border-gray-500/30',
        ring: 'ring-gray-500/20',
        fill: 'bg-gray-500',
        text: 'text-gray-200',
        bg: 'bg-gray-500/5'
    },
    {
        name: 'white',
        chip: 'bg-white/10 text-white border-white/20',
        ring: 'ring-white/20',
        fill: 'bg-white',
        text: 'text-white',
        bg: 'bg-white/5'
    },
];

const SupersetDisplay = ({ subbloque, lastSessionData, ...props }) => {
    const totalSeries = subbloque.num_series_superset || 1;
    const totalEjercicios = subbloque.subbloques_ejercicios?.length || 0;

    return (
        <div className="space-y-4">
            {Array.from({ length: totalSeries }).map((_, setIndex) => {
                const setNumero = setIndex + 1;
                const color = PALETTE[setIndex % PALETTE.length];

                // Progreso por serie
                const checks = subbloque.subbloques_ejercicios.map((sbe) => {
                    const id = generarIdEjercicioEnSerieDeSuperset(subbloque.id, sbe.id, setNumero);
                    return !!props.elementosCompletados[id];
                });
                const completadas = checks.filter(Boolean).length;
                const completado = completadas === totalEjercicios;
                const parcial = completadas > 0 && !completado;
                const progressPct = totalEjercicios > 0 ? Math.round((completadas / totalEjercicios) * 100) : 0;

                return (
                    <motion.section
                        key={`ss-${subbloque.id}-s${setNumero}`}
                        initial={{ opacity: 1, y: 8, height: 'auto', marginBottom: '1rem' }}
                        animate={completado ? {
                            opacity: 1,
                            y: 0,
                            height: 'auto',
                            marginBottom: '1rem',
                            transition: { duration: 0.25 }
                        } : {
                            opacity: 1,
                            y: 0,
                            height: 'auto',
                            marginBottom: '1rem',
                            transition: { duration: 0.25 }
                        }}
                        // Animación de desaparición después de un delay
                        exit={completado ? {
                            opacity: 0,
                            height: 0,
                            marginBottom: 0,
                            transition: {
                                opacity: { duration: 0.3, delay: 2 },
                                height: { duration: 0.4, delay: 2.3 },
                                marginBottom: { duration: 0.4, delay: 2.3 }
                            }
                        } : {}}
                        aria-labelledby={`title-ss-${subbloque.id}-s${setNumero}`}
                        className={[
                            "relative rounded-2xl overflow-hidden backdrop-blur-md",
                            "border bg-gray-800/30",
                            completado ? "border-gray-500/40 ring-1 ring-gray-400/20" : "border-gray-700/30",
                            "p-4",
                            color.bg
                        ].join(' ')}
                    >
                        {/* Barra lateral de color */}
                        <div className={`absolute inset-y-0 left-0 w-1 ${color.fill} rounded-l-2xl`} />

                        {/* Encabezado de la serie */}
                        <header className="pl-3 mb-4 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                {/* Número/Chip de Serie */}
                                <div
                                    className={[
                                        "h-9 w-9 shrink-0 rounded-xl grid place-items-center font-bold text-sm",
                                        color.chip, "border"
                                    ].join(' ')}
                                    aria-hidden
                                >
                                    {setNumero}
                                </div>

                                <div>
                                    <h5
                                        id={`title-ss-${subbloque.id}-s${setNumero}`}
                                        className="font-semibold text-sm text-white/95 tracking-wide"
                                    >
                                        <span className={`${color.text}`}>Serie {setNumero}</span>
                                    </h5>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        {completado && (
                                            <span className="text-gray-300 text-xs font-medium">Completada ✓</span>
                                        )}
                                        {parcial && (
                                            <span className="text-cyan-300 text-xs font-medium">En progreso...</span>
                                        )}
                                        {!parcial && !completado && (
                                            <span className="text-gray-400 text-xs">Pendiente</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Porcentaje */}
                            <div className="text-right">
                                <span className={`block text-sm font-bold ${color.text}`}>{progressPct}%</span>
                            </div>
                        </header>

                        {/* Barra de progreso */}
                        <div className="mb-4 px-3">
                            <div className="h-2 w-full rounded-full bg-gray-700/50 overflow-hidden">
                                <div
                                    className={`h-full ${color.fill} transition-all duration-500 rounded-full`}
                                    style={{ width: `${progressPct}%` }}
                                />
                            </div>
                        </div>

                        {/* Lista de ejercicios de la serie */}
                        <div className="space-y-3">
                            {subbloque.subbloques_ejercicios.map((sbe) => {
                                const elementoId = generarIdEjercicioEnSerieDeSuperset(
                                    subbloque.id,
                                    sbe.id,
                                    setNumero
                                );

                                const detalleSerie =
                                    sbe.series?.find((s) => s.nro_set === setNumero) || sbe.series?.[0];
                                const reps = detalleSerie?.reps || '';
                                const carga = detalleSerie?.carga_sugerida || detalleSerie?.carga || '';

                                const isCompletada = !!props.elementosCompletados[elementoId];
                                const isActive = props.elementoActivoId === elementoId;

                                return (
                                    <SerieItem
                                        key={elementoId}
                                        ref={(el) => {
                                            if (el) props.elementoRefs.current[elementoId] = el;
                                        }}
                                        serieId={elementoId}
                                        textoPrincipal={`${sbe.ejercicio?.nombre || 'Ejercicio'}`}
                                        isCompletada={isCompletada}
                                        isActive={isActive}
                                        onItemClick={props.toggleElementoCompletado}
                                        reps={reps}
                                        carga={carga}
                                        tipoElemento="superset_ejercicio"
                                        subbloqueId={subbloque.id}
                                        numSerieSupersetActual={setNumero}
                                        lastSessionData={lastSessionData}
                                        shouldDisappear={true}
                                        // Estética por serie (bordes/hover diferenciados)
                                        classNameExtra={[
                                            "transition-all duration-300",
                                            isActive ? `ring-1 ${color.ring}` : "",
                                        ].join(' ')}
                                    />
                                );
                            })}
                        </div>
                    </motion.section>
                );
            })}
        </div>
    );
};

export default SupersetDisplay;
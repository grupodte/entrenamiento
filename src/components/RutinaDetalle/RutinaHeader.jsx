import React from "react";
import { FaArrowLeft, FaStopwatch } from "react-icons/fa";

const RutinaHeader = ({
    rutinaNombre = "",
    workoutTime = 0,
    formatWorkoutTime = (t) => t,
    onBackClick = () => { },
    progressGlobal = 0,
    todosCompletados = false,
}) => {
    return (
        <>
            {/* Botón de back flotante - Izquierda superior */}
            <button
                onClick={onBackClick}
                aria-label="Volver"
                className="
                    fixed top-4 left-4
                    group
                    h-10 w-10 sm:h-12 sm:w-12
                    rounded-full
                    bg-black/20 hover:bg-black/40 active:scale-95
                    backdrop-blur-xl
                    border border-white/20
                    shadow-lg
                    grid place-items-center
                    transition-all duration-200
                "
                style={{
                    zIndex: 'var(--z-critical)',
                    backdropFilter: 'blur(16px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(16px) saturate(180%)'
                }}
            >
                <FaArrowLeft
                    className="
                        text-white text-[16px] sm:text-[20px]
                        drop-shadow
                        transition-transform duration-200
                        group-active:-translate-x-0.5
                    "
                />
            </button>

            {/* Timer flotante - Derecha superior */}
            <div
                className="
                    fixed top-4 right-4
                    flex items-center gap-1.5 sm:gap-2
                    px-3 py-2 sm:px-4 sm:py-2.5
                    rounded-xl
                    bg-cyan-500/20 hover:bg-cyan-500/30
                    backdrop-blur-xl
                    border border-cyan-400/30
                    shadow-lg
                    transition-all duration-200
                "
                style={{
                    zIndex: 'var(--z-critical)',
                    backdropFilter: 'blur(16px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(16px) saturate(180%)'
                }}
            >
                <FaStopwatch className="text-cyan-300 text-sm sm:text-base" aria-hidden="true" />
                <span
                    className="
                        font-mono font-extrabold
                        text-[18px] sm:text-[22px] leading-none
                        text-cyan-300
                        tabular-nums
                    "
                >
                    {formatWorkoutTime(workoutTime)}
                </span>
            </div>

            {/* Título flotante - Centro superior */}
            <div
                className="
                    fixed top-4 left-1/2 transform -translate-x-1/2
                    px-4 py-2 sm:px-6 sm:py-3
                    rounded-xl
                    bg-black/20 hover:bg-black/30
                    backdrop-blur-xl
                    border border-white/20
                    shadow-lg
                    transition-all duration-200
                    max-w-[60vw]
                "
                style={{
                    zIndex: 'var(--z-critical)',
                    backdropFilter: 'blur(16px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(16px) saturate(180%)'
                }}
            >
                <h1 className="text-[14px] sm:text-[16px] font-bold leading-tight truncate text-white text-center">
                    {rutinaNombre || "Entrenamiento"}
                </h1>
                <p className="text-[10px] sm:text-[11px] text-gray-300 text-center">Entrenamiento en curso</p>
            </div>

            {/* Barra de progreso flotante - Debajo del título */}
            {!todosCompletados && (
                <div
                    className="
                        fixed top-20 left-1/2 transform -translate-x-1/2
                        w-[80vw] max-w-xs
                        px-4 py-2
                        rounded-full
                        bg-black/20
                        backdrop-blur-xl
                        border border-white/10
                        shadow-lg
                        transition-all duration-300
                    "
                    style={{
                        zIndex: 'var(--z-critical)',
                        backdropFilter: 'blur(16px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(16px) saturate(180%)'
                    }}
                >
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-gray-300">Progreso</span>
                        <span className="text-[10px] text-cyan-300 font-mono">{Math.round(progressGlobal)}%</span>
                    </div>
                    <div className="w-full bg-gray-700/50 rounded-full h-1.5">
                        <div 
                            className="bg-gradient-to-r from-cyan-400 to-cyan-500 h-1.5 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${Math.min(100, Math.max(0, progressGlobal))}%` }}
                        >
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default RutinaHeader;
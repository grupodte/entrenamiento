import React from "react";
import { FaArrowLeft, FaStopwatch } from "react-icons/fa";

const RutinaHeader = ({
    rutinaNombre = "",
    workoutTime = 0,
    formatWorkoutTime = (t) => t,
    onBackClick = () => { },
}) => {
    return (
        <header
            className="
        fixed top-0 inset-x-0 z-30
        h-20 /* 80px */
        bg-gradient-to-b from-black/60 to-transparent
        backdrop-blur-xl
        border-b border-white/10
        pt-safe
      "
            role="banner"
        >
            <div
                className="
          h-full
          max-w-dashboard mx-auto
          px-4
          flex items-center justify-between gap-3
        "
            >
                {/* IZQUIERDA: Back enfatizado */}
                <button
                    onClick={onBackClick}
                    aria-label="Volver"
                    className="
            group
            h-12 w-12 min-w-12
            rounded-full
            bg-white/5 hover:bg-white/10 active:scale-95
            border border-white/10
            shadow-[0_6px_20px_rgba(0,0,0,0.35)]
            grid place-items-center
            transition-all duration-200 ease-ios
          "
                >
                    <FaArrowLeft
                        className="
              text-white text-[20px]
              drop-shadow
              transition-transform duration-200
              group-active:-translate-x-0.5
            "
                    />
                </button>

                {/* CENTRO: Título */}
                <div className="flex-1 min-w-0 text-center px-1">
                    <h1 className="text-[18px] sm:text-[20px] font-bold leading-tight truncate">
                        {rutinaNombre || "Entrenamiento"}
                    </h1>
                    <p className="text-[12px] text-gray-400">Entrenamiento en curso</p>
                </div>

                {/* DERECHA: Timer destacado */}
                <div
                    className="
            shrink-0
            flex items-center gap-2
            px-3 py-2
            rounded-xl
            bg-cyan-500/15
            border border-cyan-400/30
          "
                >
                    <FaStopwatch className="text-cyan-300 text-base" aria-hidden="true" />
                    <span
                        className="
              font-mono font-extrabold
              text-[22px] leading-none
              text-cyan-300
              tabular-nums
            "
                    >
                        {formatWorkoutTime(workoutTime)}
                    </span>
                </div>
            </div>
        </header>
    );
};

export default RutinaHeader;

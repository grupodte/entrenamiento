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
        fixed top-0 left-0 right-0 z-30
        h-[83px] /* 80px */
        bg-gradient-to-b from-black/60 to-transparent
        backdrop-blur-sm
        border-b border-white/10
        pt-safe
        max-w-full
      "
            role="banner"
        >
            <div
                className="
          h-full
          w-full
          flex items-center justify-between gap-2 sm:gap-3
          px-3 sm:px-4
        "
            >
                {/* IZQUIERDA: Back enfatizado */}
                <button
                    onClick={onBackClick}
                    aria-label="Volver"
                    className="
            group
            h-10 w-10 sm:h-12 sm:w-12 min-w-[40px] sm:min-w-[48px]
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
              text-white text-[16px] sm:text-[20px]
              drop-shadow
              transition-transform duration-200
              group-active:-translate-x-0.5
            "
                    />
                </button>

                {/* CENTRO: Título */}
                <div className="flex-1 min-w-0 text-center px-1">
                    <h1 className="text-[16px] sm:text-[18px] md:text-[20px] font-bold leading-tight truncate">
                        {rutinaNombre || "Entrenamiento"}
                    </h1>
                    <p className="text-[11px] sm:text-[12px] text-gray-400">Entrenamiento en curso</p>
                </div>

                {/* DERECHA: Timer destacado */}
                <div
                    className="
            shrink-0
            flex items-center gap-1.5 sm:gap-2
            px-2 py-1.5 sm:px-3 sm:py-2
            rounded-lg sm:rounded-xl
            bg-cyan-500/15
            border border-cyan-400/30
          "
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
            </div>
        </header>
    );
};

export default RutinaHeader;

import React from 'react';

// Icono de Check
const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5 inline-block text-green-300">
        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
    </svg>
);

const SerieItem = React.forwardRef(({
    serieId,
    textoPrincipal,
    isCompletada,
    isActive,
    showPausaButton,
    pausaDuracion,
    onItemClick,
    onPausaManualClick,
    // isSupersetEjercicio = false, // Podría usarse para variar estilos si es necesario
}, ref) => {

    const baseClasses = "flex items-center p-1.5 sm:p-2 rounded cursor-pointer transition-all duration-200 ease-in-out";
    // Clases actualizadas para mayor contraste y claridad
    const completadaClasses = "bg-green-600/90 hover:bg-green-600/70 text-white";
    const activaClasses = isActive && !isCompletada ? "bg-sky-600/80 hover:bg-sky-600/70 ring-2 ring-sky-400 ring-offset-1 ring-offset-slate-700 text-white" : "";
    const normalClasses = !isCompletada && !isActive ? "bg-slate-600/70 hover:bg-slate-500/70 text-slate-200" : "";

    let currentClasses = normalClasses;
    if (isCompletada) {
        currentClasses = completadaClasses;
    } else if (isActive) {
        currentClasses = activaClasses;
    }

    return (
        <div
            ref={ref}
            onClick={onItemClick}
            className={`${baseClasses} ${currentClasses}`}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onItemClick(); }}
            aria-pressed={isCompletada}
            aria-current={isActive && !isCompletada ? "step" : undefined}
        >
            <span className="flex-1 text-xs sm:text-sm">{textoPrincipal}</span>
            {isCompletada ? <CheckIcon /> : (isActive && <span className="text-xs text-sky-200 animate-pulse ml-1 font-semibold">ACTUAL</span>)}
            {!isCompletada && !isActive && showPausaButton && pausaDuracion > 0 &&
                <button
                    onClick={(e) => { e.stopPropagation(); onPausaManualClick(); }}
                    className="ml-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[0.65rem] sm:text-xs px-1.5 py-0.5 rounded shrink-0"
                    aria-label={`Iniciar pausa de ${pausaDuracion} segundos`}
                >
                    P({pausaDuracion}s)
                </button>
            }
        </div>
    );
});

SerieItem.displayName = 'SerieItem';
export default SerieItem;

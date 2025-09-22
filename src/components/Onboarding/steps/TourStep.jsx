import React from "react";
import { motion } from "framer-motion";

export default function TourStep({ icon = "💪", title, description, bullets = [], note }) {
    return (
        <div className="flex flex-col items-center text-center space-y-6">
            {/* Icono animado */}
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 120, damping: 12 }}
                className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-3xl"
            >
                <span>{icon}</span>
            </motion.div>

            {/* Título */}
            <h2 className="text-2xl font-bold text-white/95">{title}</h2>

            {/* Descripción */}
            {description && (
                <p className="text-white/75 leading-relaxed max-w-md">{description}</p>
            )}

            {/* Bullets */}
            {bullets?.length > 0 && (
                <ul className="text-left text-white/80 space-y-3 max-w-md">
                    {bullets.map((b, i) => (
                        <li key={i} className="flex items-start gap-3">
                            <span className="mt-1.5 inline-block w-2 h-2 rounded-full bg-cyan-400" />
                            <span>{b}</span>
                        </li>
                    ))}
                </ul>
            )}

            {/* Nota/ayuda extra */}
            {note && (
                <div className="rounded-xl p-4 bg-white/[0.03] border border-white/10 backdrop-blur-md shadow-[0_6px_30px_rgba(0,0,0,0.35)] max-w-md">
                    <p className="text-sm text-white/80">{note}</p>
                </div>
            )}
        </div>
    );
}

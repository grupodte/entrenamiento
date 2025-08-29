import React, { useState, useEffect } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

const RutinaHeaderToast = ({
    rutinaNombre = "",
    workoutTime = 0,
    formatWorkoutTime = (t) => t,
    onBackClick = () => { },
    progressGlobal = 0,
    todosCompletados = false,
}) => {
    const [showToast, setShowToast] = useState(true);
    const [isMinimized, setIsMinimized] = useState(false);

    // Auto-minimize toast after 5 seconds
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsMinimized(true);
        }, 5000);

        return () => clearTimeout(timer);
    }, []);

    // Toast variants
    const toastVariants = {
        full: {
            width: "auto",
            height: "auto",
            borderRadius: "16px",
            transition: { duration: 0.4, ease: "easeInOut" }
        },
        minimized: {
            width: "48px",
            height: "48px",
            borderRadius: "24px",
            transition: { duration: 0.4, ease: "easeInOut" }
        }
    };

    return (
        <>
            {/* Botón de back flotante */}
            <button
                onClick={onBackClick}
                aria-label="Volver"
                className="
                    fixed top-6 left-4
                    group
                    h-12 w-12
                    rounded-2xl
                    bg-black/50 hover:bg-black/70 active:scale-95
                    backdrop-blur-2xl
                    border border-white/20
                    shadow-2xl shadow-black/30
                    grid place-items-center
                    transition-all duration-300
                    z-[100000]
                "
            >
                <FaArrowLeft className="text-white text-[18px] drop-shadow-lg" />
            </button>

          
        </>
    );
};

export default RutinaHeaderToast;

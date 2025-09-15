import React from 'react';
import { FaQuestionCircle } from 'react-icons/fa';
import { useWidgetGuide } from '../../context/WidgetGuideContext';

const HelpButton = () => {
    const { startManualGuide, isGuideActive } = useWidgetGuide();

    // No mostrar el botón si la guía está activa
    if (isGuideActive) return null;

    return (
        <button
            onClick={() => startManualGuide()}
            className="fixed bottom-6 right-6 z-50 bg-cyan-600 hover:bg-cyan-700 text-white rounded-full p-3 shadow-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-opacity-50"
            title="Ver guía de ayuda"
        >
            <FaQuestionCircle className="w-6 h-6" />
        </button>
    );
};

export default HelpButton;

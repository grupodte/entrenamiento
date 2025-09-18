import React from 'react';
import { motion } from 'framer-motion';

const OptionCard = ({ 
    title, 
    description, 
    icon: Icon, 
    selected, 
    onClick, 
    className = "" 
}) => {
    return (
        <motion.div
            whileTap={{ scale: 0.98 }}
            className={`relative p-5 rounded-2xl cursor-pointer transition-all duration-200 backdrop-blur-md ${
                selected
                    ? 'bg-cyan-500/10 border border-cyan-400/30 shadow-[0_2px_15px_rgba(56,189,248,0.2)]'
                    : 'bg-white/[0.03] border border-white/10 hover:bg-white/[0.05] hover:border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.1)]'
            } ${className}`}
            onClick={onClick}
        >
            <div className="flex items-start space-x-4">
                {Icon && (
                    <div className={`p-3 rounded-xl ${
                        selected ? 'bg-cyan-500/50 text-white shadow-[0_4px_15px_rgba(56,189,248,0.3)]' : 'bg-white/[0.08] text-cyan-400'
                    }`}>
                        <Icon className="w-6 h-6" />
                    </div>
                )}
                
                <div className="flex-1">
                    <h3 className={`font-semibold mb-2 text-lg ${
                        selected ? 'text-cyan-300' : 'text-white/90'
                    }`}>
                        {title}
                    </h3>
                    {description && (
                        <p className="text-sm text-white/60 leading-relaxed">{description}</p>
                    )}
                </div>
                
               
            </div>
        </motion.div>
    );
};

export default OptionCard;

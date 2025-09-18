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
            className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                selected
                    ? 'border-glass bg-cyan-500/10'
                    : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
            } ${className}`}
            onClick={onClick}
        >
            <div className="flex items-start space-x-3">
                {Icon && (
                    <div className={`p-2 rounded-lg ${
                        selected ? 'bg-cyan-500 text-white' : 'bg-gray-700 text-gray-300'
                    }`}>
                        <Icon className="w-6 h-6" />
                    </div>
                )}
                
                <div className="flex-1">
                    <h3 className={`font-semibold mb-1 ${
                        selected ? 'text-cyan-300' : 'text-white'
                    }`}>
                        {title}
                    </h3>
                    {description && (
                        <p className="text-sm text-gray-400">{description}</p>
                    )}
                </div>
                
                {selected && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center"
                    >
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
};

export default OptionCard;

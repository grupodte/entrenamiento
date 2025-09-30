import React from 'react';
import { motion } from 'framer-motion';

const OptionCard = ({
    title,
    description,
    selected,
    onClick,
    className = ""
}) => {
    return (
        <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={onClick}
            className={[
                'w-full text-left p-4 md:p-5 rounded-2xl transition-all duration-200 backdrop-blur-md',
                'cursor-pointer select-none group',
                selected
                    ? 'bg-[#191919] border border-[#FF0000]/60 shadow-[0_6px_25px_rgba(255,0,0,0.20)]'
                    : 'bg-[#191919] border border-white/10 hover:border-white/20 hover:shadow-[0_6px_20px_rgba(0,0,0,0.25)]',
                className,
            ].join(' ')}
        >
            <div className="flex items-start gap-3">
                <div className="flex-1">
                    <h3
                        className={[
                            'font-semibold text-[15px] leading-tight',
                            selected ? 'text-[#FF0000]' : 'text-white/90 group-hover:text-white',
                        ].join(' ')}
                    >
                        {title}
                    </h3>
                    {description && (
                        <p className="mt-1 text-sm text-white/60 leading-relaxed">
                            {description}
                        </p>
                    )}
                </div>

                {/* Indicador de selección */}
                <div
                    className={[
                        'w-2.5 h-2.5 mt-1 rounded-full transition-colors duration-200',
                        selected
                            ? 'bg-[#FF0000]'
                            : 'bg-white/15 group-hover:bg-white/25',
                    ].join(' ')}
                />
            </div>
        </motion.button>
    );
};

export default OptionCard;

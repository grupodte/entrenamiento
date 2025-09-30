import { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CustomSelect = ({ 
    options = [], 
    value, 
    onChange, 
    placeholder = "Selecciona una opción",
    disabled = false,
    error = false 
}) => {
    const selectedOption = options.find(option => option.value === value);
    const buttonRef = useRef(null);
    const [isOpen, setIsOpen] = useState(false);
    const [portalPosition, setPortalPosition] = useState({ top: 0, left: 0, width: 0 });

    const handleSelect = (newOption) => {
        onChange(newOption.value);
        setIsOpen(false);
    };

    const handleButtonClick = () => {
        if (disabled) return;
        
        if (!isOpen) {
            updatePosition();
        }
        
        setIsOpen(!isOpen);
    };

    const updatePosition = () => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;
            
            const openUpward = spaceBelow < 200 && spaceAbove > 200;
            
            setPortalPosition({
                top: openUpward ? rect.top - 8 : rect.bottom + 8,
                left: rect.left,
                width: rect.width,
                openUpward
            });
        }
    };

    // Inicializar posición al montar el componente
    useEffect(() => {
        updatePosition();
    }, []);
    
    useEffect(() => {
        if (isOpen) {
            updatePosition();
            
            const handleUpdate = () => updatePosition();
            
            window.addEventListener('scroll', handleUpdate, true);
            window.addEventListener('resize', handleUpdate);
            
            return () => {
                window.removeEventListener('scroll', handleUpdate, true);
                window.removeEventListener('resize', handleUpdate);
            };
        }
    }, [isOpen]);

    // Click outside handler
    useEffect(() => {
        if (isOpen) {
            const handleClickOutside = (event) => {
                if (buttonRef.current && buttonRef.current.contains(event.target)) {
                    return;
                }
                
                const dropdownElement = document.querySelector('.custom-select-dropdown');
                if (dropdownElement && dropdownElement.contains(event.target)) {
                    return;
                }
                
                setIsOpen(false);
            };
            
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    return (
        <div className="relative w-full">
            <button
                ref={buttonRef}
                type="button"
                onClick={handleButtonClick}
                disabled={disabled}
                className={`w-full p-4 rounded-2xl transition-all duration-200 flex items-center justify-between text-left
    focus:outline-none focus:ring-0 focus:border-transparent
    ${disabled
                        ? 'bg-[#191919]'
                        : error
                            ? 'bg-[#191919]'
                            : isOpen
                                ? 'bg-[#191919] border border-cyan-400/50 text-white backdrop-blur-sm shadow-[0_4px_20px_rgba(56,189,248,0.2)]'
                                : 'bg-[#191919]'
                    }`}
            >
                <span className={selectedOption ? 'text-white' : 'text-white/40'}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                {!disabled && (
                    <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ChevronDown className="h-5 w-5 text-[#FF0000]" />
                    </motion.div>
                )}
            </button>


            {isOpen && createPortal(
                <motion.div 
                    initial={{ opacity: 0, y: portalPosition.openUpward ? 10 : -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: portalPosition.openUpward ? 10 : -10 }}
                    transition={{ duration: 0.15 }}
                    className="custom-select-dropdown fixed z-[99999] rounded-2xl backdrop-blur-xl  shadow-2xl ring-1 ring-white/5 max-h-60 overflow-auto"
                    style={{
                        top: `${portalPosition.top}px`,
                        left: `${portalPosition.left}px`,
                        minWidth: `${portalPosition.width}px`,
                        transform: portalPosition.openUpward ? 'translateY(-100%)' : 'none'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {options.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            className={`w-full cursor-pointer select-none px-4 py-3 transition-all duration-150 flex items-center justify-between  ${
                                selectedOption?.value === option.value 
                                ? 'bg-[#FF0000]/20 ' 
                                    : 'text-white/90 '
                            }`}
                            onClick={() => handleSelect(option)}
                        >
                            <span className="font-medium">{option.label}</span>
                            {selectedOption?.value === option.value && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                >
                                    <Check className="h-4 w-4 text-[#f2f2f2]" />
                                </motion.div>
                            )}
                        </button>
                    ))}
                </motion.div>,
                document.body
            )}
        </div>
    );
};

export default CustomSelect;

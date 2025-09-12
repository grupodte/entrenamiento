import { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronsUpDown } from 'lucide-react';
import { getTimeUnitOptions, getTimeUnitConfig, TIME_UNITS } from '../../constants/executionTypes';

const TimeUnitSelector = ({ value = TIME_UNITS.MINUTES, onChange, disabled = false }) => {
    const options = getTimeUnitOptions();
    const selectedOption = options.find(option => option.value === value) || options[0];
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
            
            const openUpward = spaceBelow < 150 && spaceAbove > 150;
            
            setPortalPosition({
                top: openUpward ? rect.top - 8 : rect.bottom + 8,
                left: rect.left,
                width: rect.width,
                openUpward
            });
        }
    };

    // Inicializar posición al montar
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
                
                const dropdownElement = document.querySelector('.time-unit-dropdown');
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
                className={`
                    w-full bg-white/10 text-white text-xs rounded px-2 py-1
                    flex items-center justify-between
                    focus:ring-1 focus:ring-cyan-500 focus:outline-none
                    transition-colors
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/20'}
                `}
            >
                <div className="flex items-center gap-1">
                    <span className="text-xs">{selectedOption.icon}</span>
                    <span className="text-xs">{selectedOption.shortLabel}</span>
                </div>
                {!disabled && (
                    <ChevronsUpDown className="h-3 w-3 text-white/50" aria-hidden="true" />
                )}
            </button>

            {isOpen && createPortal(
                <div 
                    className="time-unit-dropdown fixed z-[99999] w-32 rounded-md bg-black/95 backdrop-blur-xl border border-white/10 py-1 text-sm shadow-2xl ring-1 ring-white/10"
                    style={{
                        top: `${portalPosition.top}px`,
                        left: `${portalPosition.left}px`,
                        minWidth: `${Math.max(portalPosition.width, 128)}px`,
                        transform: portalPosition.openUpward ? 'translateY(-100%)' : 'none'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {options.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            className={`w-full cursor-pointer select-none px-3 py-2 transition flex items-center gap-2 text-left rounded hover:bg-cyan-500/20 hover:text-cyan-300 ${
                                selectedOption.value === option.value ? 'bg-cyan-500/10 text-cyan-400' : 'text-white/90'
                            }`}
                            onClick={() => handleSelect(option)}
                        >
                            <span className="text-xs">{option.icon}</span>
                            <div className="flex-1">
                                <div className={`font-medium text-xs ${selectedOption.value === option.value ? 'text-cyan-400' : ''}`}>
                                    {option.label}
                                </div>
                            </div>
                            {selectedOption.value === option.value && <Check className="h-3 w-3 text-cyan-400" />}
                        </button>
                    ))}
                </div>,
                document.body
            )}
        </div>
    );
};

export default TimeUnitSelector;

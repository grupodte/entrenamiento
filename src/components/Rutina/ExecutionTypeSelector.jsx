import { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronsUpDown } from 'lucide-react';
import { getExecutionTypeOptions, getExecutionTypeConfig, EXECUTION_TYPES } from '../../constants/executionTypes';

const ExecutionTypeSelector = ({ value = EXECUTION_TYPES.STANDARD, onChange, disabled = false }) => {
    const options = getExecutionTypeOptions();
    const selectedOption = options.find(option => option.value === value) || options[0];
    const buttonRef = useRef(null);
    const [isOpen, setIsOpen] = useState(false);
    const [portalPosition, setPortalPosition] = useState({ top: 0, left: 0, width: 0 });
    
    console.log('ExecutionTypeSelector render - value:', value, 'selectedOption:', selectedOption, 'isOpen:', isOpen);

    const handleSelect = (newOption) => {
        console.log('ExecutionTypeSelector - Selecting:', newOption);
        onChange(newOption.value);
        setIsOpen(false);
    };
    
    const handleButtonClick = () => {
        if (disabled) return;
        
        console.log('ExecutionTypeSelector - Button clicked, isOpen:', isOpen);
        
        if (!isOpen) {
            // Calcular posición antes de abrir
            updatePosition();
        }
        
        setIsOpen(!isOpen);
    };

    const updatePosition = () => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;
            
            // Si hay menos de 200px abajo pero más de 200px arriba, abrir hacia arriba
            const openUpward = spaceBelow < 200 && spaceAbove > 200;
            
            // Calcular posición para el portal
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
            
            // Actualizar posición en scroll y resize
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
                // No cerrar si se hace click en el botón
                if (buttonRef.current && buttonRef.current.contains(event.target)) {
                    return;
                }
                
                // No cerrar si se hace click en el dropdown (aunque esté en un portal)
                const dropdownElement = document.querySelector('.execution-type-dropdown');
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
                    focus:ring-1 focus:ring-pink-500 focus:outline-none
                    transition-colors
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/20'}
                `}
            >
                <div className="flex items-center gap-2">
                    <span className="text-sm">{selectedOption.icon}</span>
                    <span>{selectedOption.label}</span>
                </div>
                {!disabled && (
                    <ChevronsUpDown className="h-3 w-3 text-white/50" aria-hidden="true" />
                )}
            </button>

            {isOpen && createPortal(
                <div 
                    className="execution-type-dropdown fixed z-[99999] w-56 rounded-md bg-black/95 backdrop-blur-xl border border-white/10 py-1 text-sm shadow-2xl ring-1 ring-white/10 max-h-60 overflow-auto"
                    style={{
                        top: `${portalPosition.top}px`,
                        left: `${portalPosition.left}px`,
                        minWidth: `${Math.max(portalPosition.width, 224)}px`,
                        transform: portalPosition.openUpward ? 'translateY(-100%)' : 'none'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {options.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            className={`w-full cursor-pointer select-none px-3 py-2 transition flex items-center gap-2 text-left rounded hover:bg-pink-500/20 hover:text-pink-300 ${
                                selectedOption.value === option.value ? 'bg-pink-500/10 text-pink-400' : 'text-white/90'
                            }`}
                            onClick={() => handleSelect(option)}
                        >
                            <span className="text-sm">{option.icon}</span>
                            <div className="flex-1">
                                <div className={`font-medium ${selectedOption.value === option.value ? 'text-pink-400' : ''}`}>
                                    {option.label}
                                </div>
                                <div className="text-xs text-white/60">
                                    {option.description}
                                </div>
                            </div>
                            {selectedOption.value === option.value && <Check className="h-4 w-4 text-pink-400" />}
                        </button>
                    ))}
                </div>,
                document.body
            )}
        </div>
    );
};

export default ExecutionTypeSelector;

/**
 * Utilidades para inputs numéricos que previenen cambios accidentales
 */

/**
 * Props para agregar a inputs numéricos para prevenir cambios accidentales
 * con la ruedita del mouse y las flechas del teclado
 */
export const preventAccidentalChanges = {
    onWheel: (e) => {
        // Quitar foco del input cuando se usa la ruedita del mouse
        e.target.blur();
    },
    onKeyDown: (e) => {
        // Prevenir que las flechas arriba/abajo cambien el valor
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
        }
    }
};

/**
 * Hook personalizado para inputs numéricos seguros
 * @param {string} value - Valor actual del input
 * @param {function} onChange - Callback para cambios de valor
 * @returns {object} Props listas para usar en el input
 */
export const useNumericInput = (value, onChange) => {
    return {
        type: "number",
        value: value || '',
        onChange: (e) => onChange(e.target.value),
        ...preventAccidentalChanges
    };
};

/**
 * Componente de ejemplo de como usar:
 * 
 * // Opción 1: Usando las props directamente
 * <input
 *   type="number"
 *   value={reps}
 *   onChange={(e) => setReps(e.target.value)}
 *   {...preventAccidentalChanges}
 * />
 * 
 * // Opción 2: Usando el hook
 * const repsInputProps = useNumericInput(reps, setReps);
 * <input {...repsInputProps} placeholder="Reps" />
 */

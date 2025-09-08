// Tipos de ejecución de series
export const EXECUTION_TYPES = {
    STANDARD: 'standard',
    TIEMPO: 'tiempo', 
    FALLO: 'fallo'
};

// Configuración de tipos de ejecución
export const EXECUTION_TYPE_CONFIG = {
    [EXECUTION_TYPES.STANDARD]: {
        label: 'Standard',
        description: 'Repeticiones + Peso + Pausa',
        fields: ['reps', 'peso', 'pausa'],
        requiresReps: true,
        requiresWeight: true,
        requiresRest: true
    },
    [EXECUTION_TYPES.TIEMPO]: {
        label: 'Por Tiempo',
        description: 'Duración en minutos',
        fields: ['duracion', 'peso'],
        requiresReps: false,
        requiresWeight: true,
        requiresRest: true
    },
    [EXECUTION_TYPES.FALLO]: {
        label: 'Al Fallo',
        description: 'Máximo esfuerzo sin reps fijas',
        fields: ['peso'],
        requiresReps: false,
        requiresWeight: true,
        requiresRest: true
    }
};

// Helper functions
export const getExecutionTypeConfig = (type) => {
    return EXECUTION_TYPE_CONFIG[type] || EXECUTION_TYPE_CONFIG[EXECUTION_TYPES.STANDARD];
};

export const getExecutionTypeOptions = () => {
    return Object.entries(EXECUTION_TYPE_CONFIG).map(([value, config]) => ({
        value,
        label: config.label,
        description: config.description,
        icon: config.icon
    }));
};

export const validateSerieByType = (serie, type) => {
    const config = getExecutionTypeConfig(type);
    
    // Validaciones básicas por tipo (más permisivas)
    switch (type) {
        case EXECUTION_TYPES.STANDARD:
            // Permitir series sin reps para casos de ejercicios en construcción
            return {
                isValid: true,
                errors: []
            };
            
        case EXECUTION_TYPES.TIEMPO:
            // Permitir series sin duración para casos de ejercicios en construcción
            return {
                isValid: true,
                errors: []
            };
            
        case EXECUTION_TYPES.FALLO:
            return {
                isValid: true, // Al fallo no requiere validaciones específicas
                errors: []
            };
            
        default:
            return {
                isValid: true, // Ser permisivos por defecto
                errors: []
            };
    }
};

// Helper function para normalizar series y asegurar que tengan todos los campos
export const normalizarSerie = (serie) => {
    return {
        id: serie.id,
        nro_set: serie.nro_set,
        reps: serie.reps || '',
        carga_sugerida: serie.carga_sugerida || serie.carga || '',
        pausa: serie.pausa || '',
        nota: serie.nota || '',
        tipo_ejecucion: serie.tipo_ejecucion || EXECUTION_TYPES.STANDARD,
        duracion_segundos: serie.duracion_segundos || ''
    };
};

// Tipos de ejecución de series
export const EXECUTION_TYPES = {
    STANDARD: 'standard',
    TIEMPO: 'tiempo', 
    FALLO: 'fallo'
};

// Unidades de tiempo para ejercicios por tiempo
export const TIME_UNITS = {
    MINUTES: 'minutes',
    SECONDS: 'seconds'
};

// Configuración de unidades de tiempo
export const TIME_UNIT_CONFIG = {
    [TIME_UNITS.MINUTES]: {
        label: 'Minutos',
        shortLabel: 'min',
        icon: '⏱️',
        multiplier: 60 // Para convertir a segundos
    },
    [TIME_UNITS.SECONDS]: {
        label: 'Segundos',
        shortLabel: 'seg',
        icon: '⏲️',
        multiplier: 1 // Ya está en segundos
    }
};

// Configuración de tipos de ejecución
export const EXECUTION_TYPE_CONFIG = {
    [EXECUTION_TYPES.STANDARD]: {
        label: 'Standard',
        description: 'Repeticiones + Peso + Pausa',
        icon: '🔄',
        fields: ['reps', 'peso', 'pausa'],
        requiresReps: true,
        requiresWeight: true,
        requiresRest: true
    },
    [EXECUTION_TYPES.TIEMPO]: {
        label: 'Por Tiempo',
        description: 'Duración en minutos',
        icon: '⏱️',
        fields: ['duracion', 'peso'],
        requiresReps: false,
        requiresWeight: true,
        requiresRest: true
    },
    [EXECUTION_TYPES.FALLO]: {
        label: 'Al Fallo',
        description: 'Máximo esfuerzo sin reps fijas',
        icon: '🔥',
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

// Helper functions para unidades de tiempo
export const getTimeUnitConfig = (unit) => {
    return TIME_UNIT_CONFIG[unit] || TIME_UNIT_CONFIG[TIME_UNITS.MINUTES];
};

export const getTimeUnitOptions = () => {
    return Object.entries(TIME_UNIT_CONFIG).map(([value, config]) => ({
        value,
        label: config.label,
        shortLabel: config.shortLabel,
        icon: config.icon
    }));
};

// Convertir tiempo a segundos basado en la unidad
export const convertToSeconds = (value, unit) => {
    const config = getTimeUnitConfig(unit);
    const result = (parseFloat(value) || 0) * config.multiplier;
    return result;
};

// Convertir segundos a la unidad especificada
export const convertFromSeconds = (seconds, unit) => {
    const config = getTimeUnitConfig(unit);
    const result = Math.round((seconds || 0) / config.multiplier);
    return result;
};

// Detectar la unidad más apropiada basada en la duración en segundos
export const detectBestTimeUnit = (seconds) => {
    if (!seconds || seconds < 60) {
        return TIME_UNITS.SECONDS;
    }
    return TIME_UNITS.MINUTES;
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
        duracion_segundos: serie.duracion_segundos || '',
        unidad_tiempo: serie.unidad_tiempo || TIME_UNITS.MINUTES
    };
};

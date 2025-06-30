export const generarIdSerieSimple = (subbloqueId, ejercicioId, nroSet) => {
    return `simple-${subbloqueId}-${ejercicioId}-set${nroSet}`;
};

export const generarIdEjercicioEnSerieDeSuperset = (subbloqueId, ejercicioEnSupersetId, nroSetSuperset) => {
    // ID Format: superset-{subloqueId}-{ejercicioId}-set{nroSetSuperset}
    // Ejemplo: superset-101-202-set1 (Superset del subloque 101, ejercicio 202, serie 1 del superset)
    return `superset-${subbloqueId}-${ejercicioEnSupersetId}-set${nroSetSuperset}`;
};

import { useState, useEffect, useCallback } from 'react';

/**
 * Hook para manejar URLs firmadas de Mux
 * Solicita una URL firmada al servidor cuando se necesita un video protegido
 */
export const useMuxSignedUrl = () => {
  const [signedUrls, setSignedUrls] = useState({}); // Cache de URLs firmadas
  const [loadingUrls, setLoadingUrls] = useState({}); // Estado de carga por lección
  const [errors, setErrors] = useState({}); // Errores por lección

  /**
   * Solicita una URL firmada para una lección específica
   */
  const getSignedUrl = useCallback(async (leccionId, userId, cursoId) => {
    // Verificar si ya tenemos una URL válida en cache
    const cachedUrl = signedUrls[leccionId];
    if (cachedUrl && cachedUrl.expiresAt > Date.now()) {
      return cachedUrl.url;
    }

    // Evitar múltiples requests simultáneos para la misma lección
    if (loadingUrls[leccionId]) {
      return null;
    }

    setLoadingUrls(prev => ({ ...prev, [leccionId]: true }));
    setErrors(prev => ({ ...prev, [leccionId]: null }));

    try {
      const response = await fetch('/api/mux-signed-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leccionId,
          userId,
          cursoId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get signed URL');
      }

      const data = await response.json();
      
      // Guardar en cache con tiempo de expiración
      const expiresAt = Date.now() + (data.expiresIn * 1000); // Convertir a milisegundos
      const urlData = {
        url: data.signedUrl,
        expiresAt,
        playbackId: data.playbackId,
        leccionTitulo: data.leccionTitulo
      };

      setSignedUrls(prev => ({ ...prev, [leccionId]: urlData }));
      
      return data.signedUrl;

    } catch (error) {
      console.error('Error getting signed URL:', error);
      setErrors(prev => ({ ...prev, [leccionId]: error.message }));
      return null;
    } finally {
      setLoadingUrls(prev => ({ ...prev, [leccionId]: false }));
    }
  }, [signedUrls, loadingUrls]);

  /**
   * Limpia el cache de URLs firmadas (útil al cambiar de usuario)
   */
  const clearCache = useCallback(() => {
    setSignedUrls({});
    setLoadingUrls({});
    setErrors({});
  }, []);

  /**
   * Verifica si una URL en cache ha expirado
   */
  const isUrlExpired = useCallback((leccionId) => {
    const cachedUrl = signedUrls[leccionId];
    return !cachedUrl || cachedUrl.expiresAt <= Date.now();
  }, [signedUrls]);

  /**
   * Preload URLs for multiple lessons (útil para precarga)
   */
  const preloadSignedUrls = useCallback(async (lecciones, userId, cursoId) => {
    const promises = lecciones.map(leccion => 
      getSignedUrl(leccion.id, userId, cursoId)
    );
    
    try {
      await Promise.all(promises);
    } catch (error) {
      console.error('Error preloading signed URLs:', error);
    }
  }, [getSignedUrl]);

  // Limpiar URLs expiradas periódicamente
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setSignedUrls(prev => {
        const updated = { ...prev };
        let hasChanges = false;

        Object.keys(updated).forEach(leccionId => {
          if (updated[leccionId].expiresAt <= now) {
            delete updated[leccionId];
            hasChanges = true;
          }
        });

        return hasChanges ? updated : prev;
      });
    }, 60000); // Verificar cada minuto

    return () => clearInterval(interval);
  }, []);

  return {
    getSignedUrl,
    clearCache,
    preloadSignedUrls,
    isUrlExpired,
    signedUrls,
    loadingUrls,
    errors
  };
};

export default useMuxSignedUrl;
import { supabase } from '../lib/supabaseClient';

/**
 * Utilidad para limpiar archivos duplicados en dietas
 * Esta función puede ser llamada desde el admin para limpiar datos inconsistentes
 */
export const fixDuplicateFiles = async () => {
    try {
        console.log('🔧 Iniciando limpieza de archivos duplicados...');
        
        // Obtener todas las dietas activas
        const { data: dietas, error: dietasError } = await supabase
            .from('dietas')
            .select('id, nombre, archivos, archivo_url, pdf_url')
            .eq('activo', true);

        if (dietasError) throw dietasError;

        console.log(`📊 Procesando ${dietas.length} dietas...`);
        
        let dietasCorregidas = 0;
        
        for (const dieta of dietas) {
            if (!dieta.archivos || !Array.isArray(dieta.archivos)) continue;
            
            const archivosOriginales = dieta.archivos.length;
            
            // Remover duplicados basados en URL y nombre
            const archivosLimpios = [];
            const urlsVistas = new Set();
            
            for (const archivo of dieta.archivos) {
                const clave = `${archivo.url}-${archivo.name || archivo.nombre}`;
                
                if (!urlsVistas.has(clave)) {
                    urlsVistas.add(clave);
                    
                    // Limpiar el objeto archivo
                    const archivoLimpio = {
                        url: archivo.url,
                        name: archivo.name || archivo.nombre,
                        path: archivo.path,
                        size: archivo.size || undefined,
                        type: archivo.type || 'application/pdf'
                    };
                    
                    // Remover propiedades undefined
                    Object.keys(archivoLimpio).forEach(key => {
                        if (archivoLimpio[key] === undefined) {
                            delete archivoLimpio[key];
                        }
                    });
                    
                    archivosLimpios.push(archivoLimpio);
                }
            }
            
            // Solo actualizar si hubo cambios
            if (archivosLimpios.length !== archivosOriginales) {
                console.log(`📝 Limpiando dieta "${dieta.nombre}": ${archivosOriginales} → ${archivosLimpios.length} archivos`);
                
                const updateData = {
                    archivos: archivosLimpios,
                    archivo_url: archivosLimpios[0]?.url || null,
                    pdf_url: archivosLimpios[0]?.url || null
                };
                
                const { error: updateError } = await supabase
                    .from('dietas')
                    .update(updateData)
                    .eq('id', dieta.id);
                
                if (updateError) {
                    console.error(`❌ Error al actualizar dieta ${dieta.nombre}:`, updateError);
                } else {
                    dietasCorregidas++;
                }
            }
        }
        
        console.log(`✅ Limpieza completada. ${dietasCorregidas} dietas corregidas.`);
        return { success: true, dietasCorregidas };
        
    } catch (error) {
        console.error('❌ Error en la limpieza:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Verificar integridad de archivos en dietas
 */
export const verifyFileIntegrity = async () => {
    try {
        console.log('🔍 Verificando integridad de archivos...');
        
        const { data: dietas, error } = await supabase
            .from('dietas')
            .select('id, nombre, archivos')
            .eq('activo', true);

        if (error) throw error;

        const issues = [];
        
        for (const dieta of dietas) {
            if (!dieta.archivos || !Array.isArray(dieta.archivos)) {
                issues.push({
                    dietaId: dieta.id,
                    nombre: dieta.nombre,
                    issue: 'No hay archivos o no es un array'
                });
                continue;
            }
            
            // Verificar duplicados
            const urls = dieta.archivos.map(a => a.url);
            const uniqueUrls = new Set(urls);
            
            if (urls.length !== uniqueUrls.size) {
                issues.push({
                    dietaId: dieta.id,
                    nombre: dieta.nombre,
                    issue: `Duplicados: ${urls.length} archivos, ${uniqueUrls.size} únicos`
                });
            }
            
            // Verificar URLs válidas
            for (const archivo of dieta.archivos) {
                if (!archivo.url || !archivo.url.startsWith('http')) {
                    issues.push({
                        dietaId: dieta.id,
                        nombre: dieta.nombre,
                        issue: `URL inválida: ${archivo.name || 'archivo sin nombre'}`
                    });
                }
            }
        }
        
        console.log(`🔍 Verificación completada. ${issues.length} problemas encontrados.`);
        return { success: true, issues };
        
    } catch (error) {
        console.error('❌ Error en verificación:', error);
        return { success: false, error: error.message };
    }
};
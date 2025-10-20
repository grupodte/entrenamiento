import { supabase } from '../lib/supabaseClient';

/**
 * Diagnóstico completo del sistema de dietas y archivos
 */
export const diagnosticoDietas = async () => {
    console.log('🔍 Iniciando diagnóstico del sistema de dietas...');

    try {
        // 1. Verificar estructura de la tabla dietas
        console.log('\n📋 1. Verificando estructura de la tabla dietas...');
        const { data: dietas, error: dietasError } = await supabase
            .from('dietas')
            .select('*')
            .order('fecha_creacion', { ascending: false })
            .limit(5);

        if (dietasError) {
            console.error('❌ Error consultando dietas:', dietasError);
            return;
        }

        console.log('✅ Dietas encontradas:', dietas?.length || 0);
        
        // Analizar cada dieta
        dietas?.forEach((dieta, index) => {
            console.log(`\n📄 Dieta ${index + 1}: ${dieta.nombre}`);
            console.log('  - ID:', dieta.id);
            console.log('  - archivo_url:', dieta.archivo_url);
            console.log('  - pdf_url:', dieta.pdf_url);
            console.log('  - archivos (tipo):', typeof dieta.archivos);
            console.log('  - archivos (valor):', dieta.archivos);
            console.log('  - archivos (length):', Array.isArray(dieta.archivos) ? dieta.archivos.length : 'N/A');
        });

        // 2. Verificar archivos en Storage
        console.log('\n📁 2. Verificando archivos en Storage...');
        const { data: files, error: storageError } = await supabase.storage
            .from('dietas')
            .list('', {
                limit: 20,
                sortBy: { column: 'created_at', order: 'desc' }
            });

        if (storageError) {
            console.error('❌ Error consultando storage:', storageError);
        } else {
            console.log('✅ Archivos en storage:', files?.length || 0);
            files?.forEach((file, index) => {
                console.log(`  ${index + 1}. ${file.name} (${(file.metadata?.size / 1024 / 1024).toFixed(2)}MB)`);
            });
        }

        // 3. Buscar archivos huérfanos (en storage pero no en BD)
        console.log('\n🔗 3. Verificando consistencia entre Storage y BD...');
        const archivosEnBD = [];
        dietas?.forEach(dieta => {
            if (Array.isArray(dieta.archivos)) {
                dieta.archivos.forEach(archivo => {
                    if (archivo.path) {
                        archivosEnBD.push(archivo.path);
                    }
                });
            }
        });

        const archivosEnStorage = files?.map(f => f.name) || [];
        const archivosHuerfanos = archivosEnStorage.filter(archivo => 
            !archivosEnBD.some(bdArchivo => bdArchivo.includes(archivo))
        );

        console.log('📊 Archivos en BD:', archivosEnBD.length);
        console.log('📊 Archivos en Storage:', archivosEnStorage.length);
        console.log('🚨 Archivos huérfanos:', archivosHuerfanos.length);

        if (archivosHuerfanos.length > 0) {
            console.log('📋 Archivos huérfanos encontrados:');
            archivosHuerfanos.forEach((archivo, index) => {
                console.log(`  ${index + 1}. ${archivo}`);
            });
        }

        return {
            dietasTotal: dietas?.length || 0,
            archivosEnBD: archivosEnBD.length,
            archivosEnStorage: archivosEnStorage.length,
            archivosHuerfanos: archivosHuerfanos.length,
            huerfanos: archivosHuerfanos
        };

    } catch (error) {
        console.error('❌ Error en diagnóstico:', error);
        return null;
    }
};

/**
 * Función para asociar archivos huérfanos a dietas existentes
 */
export const repararArchivosHuerfanos = async () => {
    console.log('🔧 Iniciando reparación de archivos huérfanos...');

    try {
        const diagnostico = await diagnosticoDietas();
        if (!diagnostico || diagnostico.archivosHuerfanos === 0) {
            console.log('✅ No hay archivos huérfanos para reparar');
            return;
        }

        // Obtener dietas sin archivos
        const { data: dietasSinArchivos, error } = await supabase
            .from('dietas')
            .select('*')
            .or('archivos.is.null,archivos.eq.[]')
            .eq('activo', true);

        if (error) {
            console.error('❌ Error obteniendo dietas sin archivos:', error);
            return;
        }

        console.log('📋 Dietas sin archivos:', dietasSinArchivos?.length || 0);

        // Aquí podrías implementar lógica para asociar archivos huérfanos
        // basándose en fechas, nombres, etc.

    } catch (error) {
        console.error('❌ Error en reparación:', error);
    }
};

/**
 * Función para limpiar archivos huérfanos del storage
 */
export const limpiarArchivosHuerfanos = async (confirmar = false) => {
    if (!confirmar) {
        console.warn('⚠️ Esta función eliminará archivos del storage. Llama con confirmar=true para ejecutar.');
        return;
    }

    console.log('🗑️ Iniciando limpieza de archivos huérfanos...');

    try {
        const diagnostico = await diagnosticoDietas();
        if (!diagnostico || diagnostico.archivosHuerfanos === 0) {
            console.log('✅ No hay archivos huérfanos para limpiar');
            return;
        }

        // Eliminar archivos huérfanos del storage
        for (const archivo of diagnostico.huerfanos) {
            const { error } = await supabase.storage
                .from('dietas')
                .remove([archivo]);

            if (error) {
                console.error(`❌ Error eliminando ${archivo}:`, error);
            } else {
                console.log(`✅ Eliminado: ${archivo}`);
            }
        }

        console.log(`🎉 Limpieza completada. ${diagnostico.huerfanos.length} archivos eliminados.`);

    } catch (error) {
        console.error('❌ Error en limpieza:', error);
    }
};
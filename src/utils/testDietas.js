import { supabase } from '../lib/supabaseClient';

/**
 * Test rápido para verificar que los archivos se están guardando correctamente
 */
export const testGuardadoArchivos = async () => {
    console.log('🧪 Iniciando test de guardado de archivos...');

    try {
        // 1. Obtener las últimas 3 dietas
        const { data: dietas, error } = await supabase
            .from('dietas')
            .select('*')
            .order('fecha_creacion', { ascending: false })
            .limit(3);

        if (error) {
            console.error('❌ Error obteniendo dietas:', error);
            return;
        }

        console.log(`📋 Obtenidas ${dietas?.length || 0} dietas:`);

        dietas?.forEach((dieta, index) => {
            console.log(`\n📄 Dieta ${index + 1}:`);
            console.log(`  - ID: ${dieta.id}`);
            console.log(`  - Nombre: ${dieta.nombre}`);
            console.log(`  - archivo_url: ${dieta.archivo_url}`);
            console.log(`  - pdf_url: ${dieta.pdf_url}`);
            console.log(`  - archivos (tipo): ${typeof dieta.archivos}`);
            console.log(`  - archivos (valor):`, dieta.archivos);
            console.log(`  - archivos es array: ${Array.isArray(dieta.archivos)}`);
            console.log(`  - cantidad archivos: ${Array.isArray(dieta.archivos) ? dieta.archivos.length : 'N/A'}`);

            // Verificar estructura de cada archivo si existe
            if (Array.isArray(dieta.archivos) && dieta.archivos.length > 0) {
                dieta.archivos.forEach((archivo, archivoIndex) => {
                    console.log(`    📎 Archivo ${archivoIndex + 1}:`);
                    console.log(`      - name: ${archivo.name}`);
                    console.log(`      - url: ${archivo.url}`);
                    console.log(`      - path: ${archivo.path}`);
                    console.log(`      - size: ${archivo.size}`);
                    console.log(`      - type: ${archivo.type}`);
                });
            } else {
                console.log(`    ❌ Sin archivos válidos`);
            }
        });

    } catch (error) {
        console.error('❌ Error en test:', error);
    }
};

/**
 * Test para verificar la inserción de una dieta de prueba con archivos simulados
 */
export const testInsertarDietaPrueba = async () => {
    console.log('🧪 Iniciando test de inserción de dieta de prueba...');

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.error('❌ Usuario no autenticado');
            return;
        }

        // Datos de dieta de prueba
        const dietaPrueba = {
            nombre: `Dieta Test ${Date.now()}`,
            descripcion: 'Dieta de prueba para verificar guardado de archivos',
            tipo: 'deficit_calorico',
            calorias: 1800,
            creado_por: user.id,
            archivos: [
                {
                    name: 'test1.pdf',
                    url: 'https://ejemplo.com/test1.pdf',
                    path: 'usuario123/test1.pdf',
                    size: 1024000,
                    type: 'application/pdf'
                },
                {
                    name: 'test2.pdf',
                    url: 'https://ejemplo.com/test2.pdf',
                    path: 'usuario123/test2.pdf',
                    size: 2048000,
                    type: 'application/pdf'
                }
            ]
        };

        console.log('📤 Insertando dieta de prueba:', dietaPrueba);

        const { data: insertedData, error } = await supabase
            .from('dietas')
            .insert(dietaPrueba)
            .select();

        if (error) {
            console.error('❌ Error insertando dieta de prueba:', error);
            return;
        }

        console.log('✅ Dieta de prueba insertada:', insertedData);

        // Verificar inmediatamente si se guardó correctamente
        if (insertedData && insertedData[0]) {
            const dietaInsertada = insertedData[0];
            console.log('🔍 Verificando dieta insertada:');
            console.log(`  - archivos (tipo): ${typeof dietaInsertada.archivos}`);
            console.log(`  - archivos (valor):`, dietaInsertada.archivos);
            console.log(`  - cantidad archivos: ${Array.isArray(dietaInsertada.archivos) ? dietaInsertada.archivos.length : 'N/A'}`);
        }

        return insertedData?.[0];

    } catch (error) {
        console.error('❌ Error en test de inserción:', error);
    }
};

/**
 * Test para limpiar dietas de prueba
 */
export const limpiarDietasPrueba = async () => {
    console.log('🗑️ Limpiando dietas de prueba...');

    try {
        const { error } = await supabase
            .from('dietas')
            .update({ activo: false })
            .like('nombre', 'Dieta Test %');

        if (error) {
            console.error('❌ Error limpiando dietas de prueba:', error);
            return;
        }

        console.log('✅ Dietas de prueba limpiadas');

    } catch (error) {
        console.error('❌ Error en limpieza:', error);
    }
};
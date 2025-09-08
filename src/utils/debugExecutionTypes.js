import { supabase } from '../lib/supabaseClient';
import { EXECUTION_TYPES } from '../constants/executionTypes';

// Script de diagnóstico para verificar el estado de los tipos de ejecución
export async function debugExecutionTypes() {
    console.group('🔍 DIAGNÓSTICO DE TIPOS DE EJECUCIÓN');
    
    // 1. Verificar constantes
    console.log('1. Verificando constantes:');
    console.log('EXECUTION_TYPES:', EXECUTION_TYPES);
    
    // 2. Verificar estructura de tabla series_subejercicio
    try {
        console.log('\n2. Verificando estructura de tabla series_subejercicio...');
        
        // Intentar hacer una consulta simple para ver qué columnas existen
        const { data, error } = await supabase
            .from('series_subejercicio')
            .select('*')
            .limit(1);
            
        if (error) {
            console.error('❌ Error al consultar series_subejercicio:', error);
            if (error.message.includes('tipo_ejecucion')) {
                console.error('🚨 La columna tipo_ejecucion NO existe en la tabla.');
                console.error('📝 Necesitas ejecutar la migración SQL:');
                console.error('   database/migrations/add_execution_type_to_series.sql');
            }
        } else {
            console.log('✅ Tabla series_subejercicio accesible');
            if (data && data.length > 0) {
                const columns = Object.keys(data[0]);
                console.log('📋 Columnas existentes:', columns);
                
                if (columns.includes('tipo_ejecucion')) {
                    console.log('✅ Columna tipo_ejecucion existe');
                } else {
                    console.error('❌ Columna tipo_ejecucion NO existe');
                    console.error('📝 Ejecuta la migración SQL para agregar la columna');
                }
                
                if (columns.includes('duracion_segundos')) {
                    console.log('✅ Columna duracion_segundos existe');
                } else {
                    console.error('❌ Columna duracion_segundos NO existe');
                }
            } else {
                console.log('ℹ️ Tabla vacía, no se pueden verificar columnas');
            }
        }
    } catch (err) {
        console.error('💥 Error inesperado:', err);
    }
    
    // 3. Verificar enum execution_type
    try {
        console.log('\n3. Verificando enum execution_type...');
        
        // Intentar insertar un registro de prueba (lo eliminaremos después)
        const testData = {
            subbloque_ejercicio_id: 999999, // ID que seguramente no existe
            nro_set: 1,
            tipo_ejecucion: EXECUTION_TYPES.STANDARD,
            reps: 10
        };
        
        const { error: insertError } = await supabase
            .from('series_subejercicio')
            .insert([testData]);
            
        if (insertError) {
            if (insertError.message.includes('foreign key')) {
                console.log('✅ Enum execution_type existe (error esperado por FK)');
            } else if (insertError.message.includes('tipo_ejecucion')) {
                console.error('❌ Problema con tipo_ejecucion:', insertError.message);
            } else {
                console.log('⚠️ Error de inserción (probablemente esperado):', insertError.message);
            }
        } else {
            console.log('⚠️ Inserción exitosa (inesperado), limpiando...');
            // Si por alguna razón se insertó, lo eliminamos
            await supabase
                .from('series_subejercicio')
                .delete()
                .eq('subbloque_ejercicio_id', 999999);
        }
    } catch (err) {
        console.error('💥 Error al verificar enum:', err);
    }
    
    // 4. Resumen de pasos a seguir
    console.log('\n4. 📋 RESUMEN Y PRÓXIMOS PASOS:');
    console.log('   1. Ejecutar migraciones SQL en Supabase:');
    console.log('      - database/migrations/add_execution_type_to_series.sql');
    console.log('      - database/migrations/add_execution_type_to_sessions.sql');
    console.log('   2. Verificar que las columnas existan en la tabla');
    console.log('   3. Probar el guardado de rutinas con tipos de ejecución');
    
    console.groupEnd();
}

// Función para usar en la consola del navegador
window.debugExecutionTypes = debugExecutionTypes;

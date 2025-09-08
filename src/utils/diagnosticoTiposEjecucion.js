import { supabase } from '../lib/supabaseClient';

// Script de diagnóstico para verificar el estado de los tipos de ejecución
export async function diagnosticarTiposEjecucion() {
    console.group('🔍 DIAGNÓSTICO DE TIPOS DE EJECUCIÓN');
    
    try {
        // 1. Verificar estructura de tabla series_subejercicio
        console.log('1. Verificando estructura de tabla series_subejercicio...');
        
        const { data: muestraData, error: muestraError } = await supabase
            .from('series_subejercicio')
            .select('*')
            .limit(3);
            
        if (muestraError) {
            console.error('❌ Error al consultar series_subejercicio:', muestraError);
        } else {
            console.log('✅ Muestra de datos de series_subejercicio:');
            console.table(muestraData);
            
            if (muestraData && muestraData.length > 0) {
                const columnas = Object.keys(muestraData[0]);
                console.log('📋 Columnas disponibles:', columnas);
                
                if (columnas.includes('tipo_ejecucion')) {
                    console.log('✅ Columna tipo_ejecucion existe');
                } else {
                    console.error('❌ Columna tipo_ejecucion NO existe');
                    console.error('📝 Necesitas ejecutar la migración SQL:');
                    console.error('   database/migrations/add_execution_type_to_series.sql');
                }
                
                if (columnas.includes('duracion_segundos')) {
                    console.log('✅ Columna duracion_segundos existe');
                } else {
                    console.error('❌ Columna duracion_segundos NO existe');
                }
            }
        }
        
        // 2. Verificar datos de rutinas existentes
        console.log('\n2. Verificando datos de rutinas existentes...');
        
        const { data: rutinasData, error: rutinasError } = await supabase
            .from('rutinas_base')
            .select(`
                id,
                nombre,
                bloques (
                    id,
                    subbloques (
                        id,
                        nombre,
                        tipo,
                        subbloques_ejercicios (
                            id,
                            ejercicio:ejercicios (id, nombre),
                            series:series_subejercicio (
                                id,
                                nro_set,
                                reps,
                                tipo_ejecucion,
                                duracion_segundos
                            )
                        )
                    )
                )
            `)
            .limit(2);
        
        if (rutinasError) {
            console.error('❌ Error al cargar rutinas completas:', rutinasError);
        } else {
            console.log('✅ Rutinas cargadas correctamente:');
            
            rutinasData.forEach(rutina => {
                console.log(`\n📋 Rutina: ${rutina.nombre}`);
                
                rutina.bloques.forEach(bloque => {
                    bloque.subbloques.forEach(subbloque => {
                        subbloque.subbloques_ejercicios.forEach(sbe => {
                            console.log(`  🏋️ Ejercicio: ${sbe.ejercicio.nombre}`);
                            
                            sbe.series.forEach(serie => {
                                console.log(`    📊 Serie ${serie.nro_set}:`, {
                                    reps: serie.reps,
                                    tipo_ejecucion: serie.tipo_ejecucion,
                                    duracion_segundos: serie.duracion_segundos,
                                    tiene_tipo: !!serie.tipo_ejecucion
                                });
                            });
                        });
                    });
                });
            });
        }
        
        // 3. Verificar si hay series sin tipo_ejecucion
        console.log('\n3. Buscando series sin tipo_ejecucion...');
        
        const { data: seriesSinTipo, error: errorSinTipo } = await supabase
            .from('series_subejercicio')
            .select('id, nro_set, reps, tipo_ejecucion')
            .is('tipo_ejecucion', null)
            .limit(10);
        
        if (errorSinTipo) {
            console.error('❌ Error al buscar series sin tipo:', errorSinTipo);
        } else {
            if (seriesSinTipo && seriesSinTipo.length > 0) {
                console.warn(`⚠️ Encontradas ${seriesSinTipo.length} series sin tipo_ejecucion:`);
                console.table(seriesSinTipo);
                console.log('💡 Estas series necesitan ser actualizadas o las migraciones no se ejecutaron correctamente');
            } else {
                console.log('✅ Todas las series tienen tipo_ejecucion definido');
            }
        }
        
        // 4. Recomendaciones
        console.log('\n4. 📋 RECOMENDACIONES:');
        console.log('   • Si la columna tipo_ejecucion no existe, ejecuta las migraciones SQL');
        console.log('   • Si hay series sin tipo_ejecucion, considera ejecutar un script de migración de datos');
        console.log('   • Verifica los logs del navegador al editar rutinas para ver el flujo de datos');
        
    } catch (error) {
        console.error('💥 Error inesperado en diagnóstico:', error);
    } finally {
        console.groupEnd();
    }
}

// Para usar en la consola del navegador
if (typeof window !== 'undefined') {
    window.diagnosticarTiposEjecucion = diagnosticarTiposEjecucion;
}

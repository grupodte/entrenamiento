import { supabase } from '../lib/supabaseClient';

/**
 * Diagnóstico completo del storage de Supabase
 */
export const diagnoseStorage = async () => {
    console.log('🔍 === DIAGNÓSTICO DE STORAGE SUPABASE ===');
    
    const results = {
        config: {},
        buckets: [],
        files: [],
        permissions: {},
        errors: []
    };

    try {
        // 1. Verificar configuración básica
        console.log('📋 1. Verificando configuración...');
        results.config = {
            url: supabase.supabaseUrl,
            hasAnonKey: !!supabase.supabaseKey,
            storageUrl: `${supabase.supabaseUrl}/storage/v1`
        };
        console.log('Config:', results.config);

        // 2. Listar buckets
        console.log('🪣 2. Verificando buckets...');
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
        
        if (bucketsError) {
            results.errors.push({ step: 'listBuckets', error: bucketsError });
            console.error('❌ Error listando buckets:', bucketsError);
        } else {
            results.buckets = buckets;
            console.log('✅ Buckets encontrados:', buckets?.map(b => b.name));
        }

        // 3. Verificar bucket 'dietas'
        console.log('🥗 3. Verificando bucket "dietas"...');
        const dietaBucket = buckets?.find(b => b.name === 'dietas');
        
        if (!dietaBucket) {
            console.log('⚠️ Bucket "dietas" no encontrado. Intentando crear...');
            const { data: newBucket, error: createError } = await supabase.storage.createBucket('dietas', {
                public: true
            });
            
            if (createError) {
                results.errors.push({ step: 'createBucket', error: createError });
                console.error('❌ Error creando bucket:', createError);
            } else {
                console.log('✅ Bucket "dietas" creado:', newBucket);
            }
        } else {
            console.log('✅ Bucket "dietas" existe:', dietaBucket);
        }

        // 4. Listar archivos en el bucket
        console.log('📁 4. Listando archivos en bucket "dietas"...');
        const { data: files, error: filesError } = await supabase.storage
            .from('dietas')
            .list('', { limit: 10 });
            
        if (filesError) {
            results.errors.push({ step: 'listFiles', error: filesError });
            console.error('❌ Error listando archivos:', filesError);
        } else {
            results.files = files || [];
            console.log(`📄 ${files?.length || 0} archivos encontrados`);
            files?.forEach(file => {
                console.log(`  - ${file.name} (${file.metadata?.size || 'sin tamaño'})`);
            });
        }

        // 5. Probar subida de archivo de test
        console.log('🧪 5. Probando subida de archivo test...');
        const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
        
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('dietas')
            .upload(`test/${Date.now()}_test.txt`, testFile, {
                cacheControl: '3600',
                upsert: false
            });
            
        if (uploadError) {
            results.errors.push({ step: 'testUpload', error: uploadError });
            console.error('❌ Error en subida test:', uploadError);
        } else {
            console.log('✅ Subida test exitosa:', uploadData);
            
            // Intentar obtener URL pública
            const { data: { publicUrl } } = supabase.storage
                .from('dietas')
                .getPublicUrl(uploadData.path);
                
            console.log('🔗 URL pública:', publicUrl);
            
            // Intentar crear URL firmada
            const { data: signedData, error: signedError } = await supabase.storage
                .from('dietas')
                .createSignedUrl(uploadData.path, 300);
                
            if (signedError) {
                results.errors.push({ step: 'testSignedUrl', error: signedError });
                console.error('❌ Error en URL firmada:', signedError);
            } else {
                console.log('✅ URL firmada creada:', signedData.signedUrl);
            }
            
            // Limpiar archivo test
            await supabase.storage
                .from('dietas')
                .remove([uploadData.path]);
        }

        // 6. Verificar permisos de usuario actual
        console.log('👤 6. Verificando permisos de usuario...');
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
            console.log('✅ Usuario autenticado:', user.email);
            results.permissions.authenticated = true;
            results.permissions.userId = user.id;
            
            // Verificar rol
            const { data: profile, error: profileError } = await supabase
                .from('perfiles')
                .select('rol')
                .eq('id', user.id)
                .single();
                
            if (profileError) {
                results.errors.push({ step: 'getUserProfile', error: profileError });
                console.error('❌ Error obteniendo perfil:', profileError);
            } else {
                results.permissions.role = profile?.rol;
                console.log('👥 Rol de usuario:', profile?.rol);
            }
        } else {
            console.log('❌ Usuario no autenticado');
            results.permissions.authenticated = false;
        }

    } catch (error) {
        console.error('💥 Error general en diagnóstico:', error);
        results.errors.push({ step: 'general', error });
    }

    console.log('🏁 === FIN DEL DIAGNÓSTICO ===');
    console.log('📊 Resumen:', {
        buckets: results.buckets.length,
        files: results.files.length,
        errors: results.errors.length,
        authenticated: results.permissions.authenticated
    });

    return results;
};

/**
 * Probar funciones específicas de storage
 */
export const testStorageFunctions = async () => {
    console.log('🧪 === TEST DE FUNCIONES DE STORAGE ===');

    // Test 1: Subir archivo real
    console.log('📤 Test 1: Subida de archivo...');
    const testContent = `Test file created at ${new Date().toISOString()}`;
    const testFile = new File([testContent], 'storage-test.txt', { type: 'text/plain' });
    
    try {
        const { data, error } = await supabase.storage
            .from('dietas')
            .upload(`tests/storage-test-${Date.now()}.txt`, testFile);
            
        if (error) {
            console.error('❌ Error en subida:', error);
            return { uploadSuccess: false, error };
        }
        
        console.log('✅ Subida exitosa:', data.path);
        
        // Test 2: Obtener URL pública
        console.log('🔗 Test 2: URL pública...');
        const { data: { publicUrl } } = supabase.storage
            .from('dietas')
            .getPublicUrl(data.path);
            
        console.log('✅ URL pública:', publicUrl);
        
        // Test 3: URL firmada
        console.log('🔐 Test 3: URL firmada...');
        const { data: signedData, error: signedError } = await supabase.storage
            .from('dietas')
            .createSignedUrl(data.path, 300);
            
        if (signedError) {
            console.error('❌ Error en URL firmada:', signedError);
        } else {
            console.log('✅ URL firmada:', signedData.signedUrl);
            
            // Test 4: Descargar usando URL firmada
            console.log('⬇️ Test 4: Descarga con URL firmada...');
            try {
                const response = await fetch(signedData.signedUrl);
                const content = await response.text();
                console.log('✅ Contenido descargado:', content.substring(0, 50) + '...');
            } catch (fetchError) {
                console.error('❌ Error en descarga:', fetchError);
            }
        }
        
        // Test 5: Eliminar archivo test
        console.log('🗑️ Test 5: Eliminar archivo test...');
        const { error: deleteError } = await supabase.storage
            .from('dietas')
            .remove([data.path]);
            
        if (deleteError) {
            console.error('❌ Error eliminando:', deleteError);
        } else {
            console.log('✅ Archivo eliminado');
        }
        
        return { 
            uploadSuccess: true, 
            publicUrl, 
            signedUrl: signedData?.signedUrl,
            path: data.path 
        };
        
    } catch (error) {
        console.error('💥 Error en tests:', error);
        return { uploadSuccess: false, error };
    }
};

/**
 * Verificar configuración de políticas RLS
 */
export const checkStoragePolicies = async () => {
    console.log('🛡️ === VERIFICACIÓN DE POLÍTICAS RLS ===');
    
    try {
        // Intentar operaciones como usuario autenticado
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            console.log('❌ Usuario no autenticado - se necesita login para verificar políticas');
            return { authenticated: false };
        }
        
        console.log('👤 Usuario:', user.email);
        
        // Test de lectura
        console.log('📖 Testing política de lectura...');
        const { data: readTest, error: readError } = await supabase.storage
            .from('dietas')
            .list('', { limit: 1 });
            
        if (readError) {
            console.error('❌ Error en lectura:', readError);
        } else {
            console.log('✅ Lectura permitida');
        }
        
        // Test de escritura
        console.log('✍️ Testing política de escritura...');
        const testFile = new File(['policy test'], 'policy-test.txt', { type: 'text/plain' });
        const { data: writeTest, error: writeError } = await supabase.storage
            .from('dietas')
            .upload(`policy-tests/${user.id}/${Date.now()}.txt`, testFile);
            
        if (writeError) {
            console.error('❌ Error en escritura:', writeError);
        } else {
            console.log('✅ Escritura permitida');
            
            // Limpiar
            await supabase.storage
                .from('dietas')
                .remove([writeTest.path]);
        }
        
        return {
            authenticated: true,
            canRead: !readError,
            canWrite: !writeError,
            userId: user.id
        };
        
    } catch (error) {
        console.error('💥 Error verificando políticas:', error);
        return { error };
    }
};

/**
 * Función para ejecutar todos los diagnósticos
 */
export const runFullDiagnosis = async () => {
    console.log('🏥 === DIAGNÓSTICO COMPLETO DE STORAGE ===');
    
    const results = {
        storage: await diagnoseStorage(),
        functions: await testStorageFunctions(),
        policies: await checkStoragePolicies()
    };
    
    console.log('📋 === RESUMEN EJECUTIVO ===');
    console.log('Storage:', results.storage.errors.length === 0 ? '✅' : '❌');
    console.log('Functions:', results.functions.uploadSuccess ? '✅' : '❌');
    console.log('Policies:', results.policies.canRead && results.policies.canWrite ? '✅' : '❌');
    
    return results;
};
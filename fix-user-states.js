// Script para arreglar usuarios sin estado
// Ejecutar una vez para actualizar usuarios existentes

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iyipzkkiqscbzugrakeh.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5aXB6a2tpcXNjYnp1Z3Jha2VoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTMyNzg4NiwiZXhwIjoyMDY0OTAzODg2fQ.qzCtZjPSpPAuK6o_FXKSM4nviHF1-l6rot_BH_mcjWY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixUserStates() {
    try {
        console.log('🔧 Actualizando estados de usuarios...');
        
        // Actualizar todos los usuarios que no tienen estado o tienen estado null
        const { data, error } = await supabase
            .from('perfiles')
            .update({ estado: 'Aprobado' })
            .or('estado.is.null,estado.neq.Aprobado');
        
        if (error) {
            console.error('❌ Error:', error);
            return;
        }
        
        console.log('✅ Usuarios actualizados correctamente');
        console.log('📊 Datos:', data);
        
    } catch (err) {
        console.error('❌ Error inesperado:', err);
    }
}

// Ejecutar
fixUserStates();
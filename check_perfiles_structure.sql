-- Consulta para verificar la estructura actual de la tabla perfiles
-- Ejecuta esto en tu consola de Supabase para ver los campos existentes

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'perfiles' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- También puedes usar esta consulta más simple:
-- \d perfiles

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function backfillGoogleUsers() {
  // Get all users from auth.users
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

  if (usersError) {
    console.error('Error fetching users:', usersError);
    return;
  }

  for (const user of users) {
    // Check if the user signed up with Google
    const isGoogleUser = user.app_metadata.provider === 'google';

    if (isGoogleUser) {
      // Check if a profile already exists
      const { data: profile, error: profileError } = await supabase
        .from('perfiles')
        .select('id, nombre, apellido')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') { // PGRST116: 'Not a single row' (i.e., not found)
        console.error(`Error fetching profile for user ${user.id}:`, profileError);
        continue;
      }

      // If profile exists and name is missing, update it
      if (profile && (!profile.nombre || !profile.apellido || profile.nombre === '' || profile.apellido === '-')) {
        const fullName = user.user_metadata.full_name;
        const nameParts = fullName.split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ') || '-';
        const avatarUrl = user.user_metadata.avatar_url;

        const { error: updateError } = await supabase
          .from('perfiles')
          .update({
            nombre: firstName,
            apellido: lastName,
            avatar_url: avatarUrl,
          })
          .eq('id', user.id);

        if (updateError) {
          console.error(`Error updating profile for user ${user.id}:`, updateError);
        } else {
          console.log(`Updated profile for user ${user.id}`);
        }
      } else if (!profile) {
        // If profile doesn't exist, create it (the trigger should handle this for new users, but this is a good fallback)
        const fullName = user.user_metadata.full_name;
        const nameParts = fullName.split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ') || '-';
        const avatarUrl = user.user_metadata.avatar_url;

        const { error: insertError } = await supabase
            .from('perfiles')
            .insert({
                id: user.id,
                nombre: firstName,
                apellido: lastName,
                email: user.email,
                avatar_url: avatarUrl,
                rol: 'alumno',
            });

        if (insertError) {
            console.error(`Error creating profile for user ${user.id}:`, insertError);
        } else {
            console.log(`Created profile for user ${user.id}`);
        }
      }
    }
  }

  console.log('Backfill complete.');
}

backfillGoogleUsers();
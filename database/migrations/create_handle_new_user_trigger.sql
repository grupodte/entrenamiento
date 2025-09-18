-- Function to create a profile for a new user
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  -- Variable to hold the split name parts
  name_parts text[];
  first_name text;
  last_name text;
begin
  -- Split the full name into parts based on spaces
  name_parts := string_to_array(new.raw_user_meta_data->>'full_name', ' ');
  -- Assign the first part to first_name
  first_name := name_parts[1];
  -- Assign the rest to last_name
  last_name := array_to_string(name_parts[2:array_length(name_parts, 1)], ' ');

  -- If last_name is empty or null, use a placeholder or the full name
  if last_name is null or last_name = '' then
    last_name := '-'; -- Or any other placeholder you prefer
  end if;

  insert into public.perfiles (id, nombre, apellido, email, avatar_url, rol)
  values (
    new.id,
    first_name,
    last_name,
    new.email,
    new.raw_user_meta_data->>'avatar_url',
    'alumno'
  );
  return new;
end;
$$;

-- Trigger to call the function when a new user is created
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

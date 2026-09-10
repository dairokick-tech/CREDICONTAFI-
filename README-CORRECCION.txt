CORRECCIÓN DEL ERROR "Failed to fetch"

Se corrigió el inicio de sesión para que un fallo de conexión con Supabase no deje la pantalla bloqueada.

1. Reintenta el acceso normal con Supabase.
2. Si Supabase no responde, usa "Entrar en modo local" para continuar trabajando en el dispositivo.
3. El modo local guarda los datos en localStorage y no borra los datos anteriores del modo local.
4. Para producción multiempresa y multiusuario, Supabase debe estar operativo y la migración SQL debe estar aplicada.

La clave publishable puede utilizarse en el navegador con RLS; las claves secretas nunca deben ponerse en frontend.

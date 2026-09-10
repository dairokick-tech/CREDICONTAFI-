# ContaPro - corrección de demo

## Qué corrige
- `+ Agregar` ahora abre formularios reales.
- Se pueden registrar, editar y eliminar Empresas, Clientes, Compras y Ventas.
- `Buscar` filtra registros.
- Los cambios se guardan en `localStorage` del navegador.
- No modifica ni borra `supabase.sql` ni las tablas existentes.

## Importante
Esta corrección hace funcional la demo en GitHub Pages. Para que los registros sean compartidos entre varios dispositivos/usuarios y queden en Supabase, hay que conectar estos formularios a tablas nuevas de Supabase y aplicar RLS. No se debe ejecutar un script que elimine o reinicie las tablas actuales.

## Instalación
1. Reemplaza `app.js` por el `app.js` de este paquete.
2. Agrega el contenido de `fix.css` al final de `styles.css`.
3. Sube los cambios al branch `main`.
4. Espera a que GitHub Pages publique.
5. Abre el panel y prueba Empresas > + Agregar.

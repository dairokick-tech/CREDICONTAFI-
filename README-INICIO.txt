CONTAPRO — VERSIÓN PROPIA

Esta carpeta contiene una versión funcional y propia del panel ContaPro.

INCLUYE
- Login real con Supabase Auth cuando config.js está conectado.
- Modo local de respaldo para pruebas.
- Empresas, clientes, proveedores, ventas y compras con formularios reales.
- Edición, eliminación y búsqueda.
- Panel SuperAdmin.
- Migración SQL NO DESTRUCTIVA.
- Auditoría preparada.
- RLS para separar empresas y usuarios.

IMPORTANTE
1. No se ejecuta ningún DROP/TRUNCATE de la tabla public.orders existente.
2. Ejecuta supabase_migration_contapro.sql en Supabase SQL Editor.
3. Crea tu usuario en Supabase Authentication.
4. Crea/actualiza su registro en contapro_profiles con role='superadmin'.
5. Publica estos archivos en el repositorio de GitHub Pages.
6. Si GitHub Pages muestra una versión antigua, usa una recarga forzada o cambia la versión de app.js en index.html.

NOTA DE PRODUCCIÓN
SUNAT real requiere configuración de emisión electrónica, certificado/firma, UBL, credenciales y un backend/servicio seguro. Nunca pongas credenciales SOL ni certificados privados en el frontend.

ARCHIVOS
- index.html
- app.js
- styles.css
- config.js
- supabase_migration_contapro.sql

La migración agrega tablas nuevas y políticas. No reinicia ni borra la información de public.orders.


REVISIÓN 2026-09-10
- Empresas: alta, edición, búsqueda y archivado como Inactivo.
- Ventas y compras: formularios persistentes.
- Contabilidad: libro diario automático desde ventas/compras.
- Reportes: resumen automático, impresión/PDF del navegador y CSV.
- Tributario: resumen informativo de IGV.
- SUNAT: comprobación de conexión Supabase y preparación para backend seguro.
- Se conserva la base anterior; no se ejecuta DROP ni TRUNCATE.

ACTUALIZACIÓN FINAL
- Menús operativos: Inicio, Empresas, Clientes, Proveedores, Ventas, Compras, Contabilidad, Reportes, Tributario, SUNAT y SuperAdmin.
- Reportes con período desde/hasta, impresión/PDF y CSV.
- Ventas y compras alimentan automáticamente indicadores, contabilidad y reportes.
- Registros dados de baja se archivan/anulan para conservar historial.
- SUNAT se mantiene sin cambios.

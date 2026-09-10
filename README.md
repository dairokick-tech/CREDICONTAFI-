# ContaPro Online

Sistema 100% online con backend propio Express y almacenamiento persistente en `data/contapro.json`. No usa Supabase.

## Inicio
`npm install`
`npm start`

Abrir `http://localhost:3000` para probarlo. En producción se despliega el mismo proyecto en un servidor Node con almacenamiento persistente.

## Primer acceso
`admin@contapro.local` / `ContaPro-Admin-2026`

El SuperAdmin puede registrar empresas. Luego selecciona una empresa para registrar clientes, proveedores, ventas y compras. Los registros se guardan en el servidor.

## Conservación
No hay endpoint de eliminación. Empresas se archivan y los demás registros se anulan para conservar historial.

## Nota
El módulo SUNAT queda conservado. La emisión electrónica real ante SUNAT requiere la integración tributaria correspondiente y credenciales/certificados del contribuyente.

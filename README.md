# ContaPro corregido

## Acceso
Usuario: `admin`
Contraseña: `Admin123!`

También:
Usuario: `contador`
Contraseña: `Contador123!`

## Qué se corrigió
- El login ya no acepta cualquier contraseña.
- El dashboard ya no intenta conectarse a `http://localhost:3000`.
- La sesión se controla con `localStorage`.
- Se agregó el SVG que faltaba.
- Se agregó `index.html`; el archivo anterior `index(1).html` se conserva.
- Empresas, clientes y ventas pueden registrar datos localmente.
- El menú funciona en la versión web estática.

## Uso
Abre `index.html` o publícalo en un hosting estático.

## SUNAT
El módulo visual queda preparado, pero el envío real de comprobantes requiere backend, credenciales autorizadas, certificado digital, XML UBL, firma, envío y procesamiento del CDR. No colocar credenciales reales en el frontend.

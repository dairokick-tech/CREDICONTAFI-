# ContaPro — Plataforma contable + integración SUNAT

## Incluye
Frontend + backend Node.js + módulo SUNAT + SVG de marca.

### Integración preparada
- Backend mantiene las credenciales fuera del navegador.
- Endpoint para obtener token OAuth 2.0 del API SIRE cuando se configuren las credenciales autorizadas.
- Endpoint de estado SUNAT.
- Gestión básica de empresas, clientes, compras y ventas.
- Comprobantes demo.
- Estructura lista para persistencia.

### Emisión electrónica real
SUNAT publica servicios web de producción para el envío de comprobantes y servicios de consulta de validez/CDR. Para un sistema propio también deben implementarse el XML UBL, firma digital, reglas de validación, envío y procesamiento del CDR.

El proyecto no contiene certificados ni credenciales reales. Deben configurarse en el servidor.

### Ejecutar
cd backend
npm install
npm start

Abrir http://localhost:3000

### Producción
Antes de usarlo con operaciones reales: incorporar base de datos PostgreSQL/MySQL, autenticación robusta, almacenamiento seguro de secretos, certificado digital, XML/firma, pruebas en beta y luego producción, logging, auditoría, backups y controles de acceso.

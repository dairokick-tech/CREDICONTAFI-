# ContaPro — Backend de integración SUNAT

Este proyecto añade un backend seguro al frontend ContaPro.

## Qué está preparado
- API propia para el frontend.
- Variables de entorno para credenciales.
- Endpoint de salud.
- Endpoint de estado de configuración SUNAT.
- Creación y consulta de comprobantes de prueba.
- Punto de integración para envío a SUNAT.
- Las credenciales nunca se exponen al navegador.

## Importante
El envío real de CPE a SUNAT requiere implementar el formato XML correspondiente, firma digital/certificado y las reglas de validación del comprobante, además de configurar el ambiente y credenciales correspondientes. SUNAT publica los servicios web oficiales y sus manuales; por seguridad, no se incluyen credenciales reales en este paquete.

## Ejecutar
1. Instala Node.js.
2. Copia `.env.example` como `.env`.
3. Completa las variables autorizadas para tu empresa.
4. Ejecuta `npm install`.
5. Ejecuta `npm start`.
6. Abre `http://localhost:3000`.

## Próxima integración
Conectar el módulo `src/sunat.js` con el generador XML + firma digital y el servicio oficial de SUNAT, y después guardar comprobantes/CDR en una base de datos.

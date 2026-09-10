# ContaPro — proyecto integrado

## Flujo
Frontend → API ContaPro → módulo SUNAT → base de datos.

## Estado
La integración frontend/backend está funcional para desarrollo y pruebas locales. El módulo SUNAT incluye comprobantes demo y configuración segura.

## Para emisión real
Antes de usar el sistema con comprobantes reales se debe incorporar:
1. Certificado digital del contribuyente.
2. Generación del XML UBL según tipo de comprobante.
3. Firma digital del XML.
4. Envío al servicio oficial de SUNAT.
5. Lectura y almacenamiento del CDR.
6. Manejo de rechazos y estados.
7. Base de datos persistente.
8. Autenticación real y control de permisos.
9. Auditoría y copias de seguridad.
10. Pruebas en ambiente de pruebas antes de producción.

No coloques credenciales SOL, secretos ni certificados en el frontend.

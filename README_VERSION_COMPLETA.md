# ContaPro — versión completa base

Esta versión integra el frontend y backend del proyecto, autenticación demo, módulos contables, configuración SUNAT/SIRE y arquitectura para despliegue.

## Acceso inicial
Usuario: `admin`
Contraseña: `Admin123!`

Cambia esta contraseña antes de producción.

## SUNAT
Las credenciales y certificados se mantienen en variables de entorno del servidor; nunca en el frontend ni en GitHub.

La emisión CPE real debe pasar por XML UBL, firma digital, envío al WSDL de SUNAT, recepción/almacenamiento del CDR y pruebas beta antes de producción.

WSDL producción: https://e-factura.sunat.gob.pe/ol-ti-itcpfegem/billService?wsdl
WSDL beta: https://e-beta.sunat.gob.pe/ol-ti-itcpfegem-beta/billService?wsdl

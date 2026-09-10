import axios from "axios";

const TOKEN_URL =
  "https://api-seguridad.sunat.gob.pe/v1/clientessol/9cae24a9-10d7-48b0-bee0-e94bd56947e3/oauth2/token/";

export function sunatStatus(){
  return {
    configured:Boolean(process.env.SUNAT_RUC && process.env.SUNAT_SOL_USER &&
      process.env.SUNAT_SOL_PASSWORD && process.env.SUNAT_CLIENT_ID &&
      process.env.SUNAT_CLIENT_SECRET),
    environment:process.env.NODE_ENV==="production"?"production":"development",
    cpeEndpoint:process.env.SUNAT_CPE_WSDL ||
      "https://e-factura.sunat.gob.pe/ol-ti-itcpfegem/billService?wsdl",
    tokenEndpoint:TOKEN_URL,
    note:"Secretos y credenciales se mantienen únicamente en el backend."
  };
}

export async function getSireToken(){
  const required=["SUNAT_CLIENT_ID","SUNAT_CLIENT_SECRET","SUNAT_RUC","SUNAT_SOL_USER","SUNAT_SOL_PASSWORD"];
  const missing=required.filter(k=>!process.env[k]);
  if(missing.length) throw new Error("Faltan variables SUNAT: "+missing.join(", "));
  const body=new URLSearchParams({
    grant_type:"password",
    scope:"https://api-sire.sunat.gob.pe",
    client_id:process.env.SUNAT_CLIENT_ID,
    client_secret:process.env.SUNAT_CLIENT_SECRET,
    username:process.env.SUNAT_RUC+process.env.SUNAT_SOL_USER,
    password:process.env.SUNAT_SOL_PASSWORD
  });
  const {data}=await axios.post(TOKEN_URL,body.toString(),{
    headers:{"Content-Type":"application/x-www-form-urlencoded"}
  });
  return data;
}

export function buildDemoInvoice(data={}){
  const total=Number(data.total||118);
  const gravada=Number((total/1.18).toFixed(2));
  return {
    tipoComprobante:data.tipoComprobante||"01",
    serie:data.serie||"F001",
    numero:data.numero||"00000001",
    fechaEmision:data.fechaEmision||new Date().toISOString().slice(0,10),
    moneda:data.moneda||"PEN",
    cliente:{tipoDocumento:data.cliente?.tipoDocumento||"6",
      numeroDocumento:data.cliente?.numeroDocumento||"00000000000",
      razonSocial:data.cliente?.razonSocial||"CLIENTE DEMO"},
    totales:{gravada,igv:Number((total-gravada).toFixed(2)),total},
    items:data.items||[{descripcion:"Servicio contable demo",cantidad:1,valorUnitario:gravada}]
  };
}

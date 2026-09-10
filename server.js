import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { v4 as uuid } from "uuid";
import { sunatStatus, buildDemoInvoice, getSireToken } from "./sunat.js";
import { store } from "./store.js";

dotenv.config();
const app=express();
app.use(helmet());
app.use(cors({origin:true}));
app.use(express.json({limit:"2mb"}));

app.get("/api/health",(req,res)=>res.json({ok:true,service:"ContaPro API",time:new Date().toISOString()}));
app.get("/api/sunat/status",(req,res)=>res.json(sunatStatus()));
app.post("/api/sunat/sire/token",async(req,res)=>{
  try{
    const token=await getSireToken();
    res.json({ok:true,token_type:token.token_type,expires_in:token.expires_in,scope:token.scope});
  }catch(e){
    const status=e.response?.status||500;
    res.status(status).json({ok:false,error:e.response?.data||e.message});
  }
});

app.get("/api/empresas",(req,res)=>res.json(store.companies));
app.post("/api/empresas",(req,res)=>{
  const {ruc,name}=req.body||{};
  if(!ruc||!name) return res.status(400).json({error:"RUC y razón social son obligatorios"});
  const item={id:Date.now(),ruc,name,status:"Activo"};
  store.companies.push(item); res.status(201).json(item);
});

app.get("/api/clientes",(req,res)=>res.json(store.customers));
app.post("/api/clientes",(req,res)=>{
  const item={id:Date.now(),...req.body};
  store.customers.push(item);res.status(201).json(item);
});

app.get("/api/compras",(req,res)=>res.json(store.purchases));
app.post("/api/compras",(req,res)=>{
  const item={id:Date.now(),...req.body};
  store.purchases.push(item);res.status(201).json(item);
});

app.get("/api/ventas",(req,res)=>res.json(store.sales));
app.post("/api/ventas",(req,res)=>{
  const item={id:Date.now(),...req.body};
  store.sales.push(item);res.status(201).json(item);
});

app.post("/api/comprobantes/demo",(req,res)=>{
  const id=uuid(), invoice=buildDemoInvoice(req.body||{});
  const item={id,status:"PENDIENTE_DE_ENVIO",invoice,createdAt:new Date().toISOString()};
  store.vouchers.push(item); res.status(201).json(item);
});
app.get("/api/comprobantes",(req,res)=>res.json(store.vouchers));
app.get("/api/comprobantes/:id",(req,res)=>{
  const item=store.vouchers.find(x=>x.id===req.params.id);
  if(!item)return res.status(404).json({error:"Comprobante no encontrado"});
  res.json(item);
});
app.post("/api/comprobantes/:id/enviar",(req,res)=>{
  const item=store.vouchers.find(x=>x.id===req.params.id);
  if(!item)return res.status(404).json({error:"Comprobante no encontrado"});
  item.status="LISTO_PARA_ENVIO_SUNAT";
  item.message="Conector SUNAT pendiente de certificado, firma XML y credenciales de producción.";
  res.json(item);
});

app.use(express.static("public"));
const port=process.env.PORT||3000;
app.listen(port,()=>console.log(`ContaPro API ejecutándose en http://localhost:${port}`));

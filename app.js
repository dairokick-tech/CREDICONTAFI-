(() => {
"use strict";
const C = window.CONTAPRO_CONFIG || {};
const hasSupabase = !!(window.supabase && C.supabaseUrl && C.supabaseAnonKey);
const sb = hasSupabase ? window.supabase.createClient(C.supabaseUrl, C.supabaseAnonKey) : null;
const $ = s => document.querySelector(s);
const esc = v => String(v ?? "").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const money = v => new Intl.NumberFormat("es-PE",{style:"currency",currency:"PEN"}).format(Number(v||0));
const today = () => new Date().toISOString().slice(0,10);

let state = { user:null, profile:null, companies:[], clients:[], suppliers:[], sales:[], purchases:[], section:"inicio", companyId:null };

const seed = {
 companies:[{id:"demo-company",name:"Comercial Demo S.A.C.",tax_id:"20600000001",status:"Activo"}],
 clients:[{id:"demo-client",company_id:"demo-company",name:"Cliente Ejemplo S.A.C.",document:"20100000001",balance:0}],
 suppliers:[], sales:[
 {id:"demo-sale",company_id:"demo-company",document_no:"B001-000154",client_name:"Cliente Ejemplo S.A.C.",amount:150,date:today(),status:"Registrada"}
 ], purchases:[]
};

function localKey(){ return "contapro_local_v4"; }
function loadLocal(){
  try { return JSON.parse(localStorage.getItem(localKey())) || seed; } catch { return seed; }
}
function saveLocal(){
  localStorage.setItem(localKey(), JSON.stringify({
    companies:state.companies,clients:state.clients,suppliers:state.suppliers,
    sales:state.sales,purchases:state.purchases
  }));
}
function useLocal(){
  const d=loadLocal(); Object.assign(state,d);
  state.companyId=state.companies[0]?.id||null;
}

async function boot(){
  if(!sb){ useLocal(); render(); return; }
  const {data:{session}} = await sb.auth.getSession();
  if(!session){ renderLogin(); return; }
  state.user=session.user;
  await loadProfile();
  await loadAll();
  render();
  sb.auth.onAuthStateChange((_e,s)=>{ state.user=s?.user||null; if(!state.user) renderLogin(); });
}
async function loadProfile(){
  const {data,error}=await sb.from("contapro_profiles").select("*").eq("id",state.user.id).single();
  if(error){ console.error(error); state.profile={id:state.user.id,role:"user"}; }
  else state.profile=data;
  if(!state.profile?.company_id){
    const {data:c}=await sb.from("contapro_companies").select("id").order("created_at").limit(1).maybeSingle();
    state.companyId=c?.id||null;
  } else state.companyId=state.profile.company_id;
}
async function loadAll(){
  const [c,cl,s,p,v]=await Promise.all([
    sb.from("contapro_companies").select("*").order("created_at"),
    sb.from("contapro_clients").select("*").order("created_at"),
    sb.from("contapro_suppliers").select("*").order("created_at"),
    sb.from("contapro_purchases").select("*").order("date",{ascending:false}),
    sb.from("contapro_sales").select("*").order("date",{ascending:false})
  ]);
  if(c.error||cl.error||s.error||p.error||v.error) {
    console.error(c.error,cl.error,s.error,p.error,v.error);
    toast("No se pudieron cargar todos los datos. Revisa las tablas/RLS.");
  }
  state.companies=c.data||[]; state.clients=cl.data||[]; state.suppliers=s.data||[];
  state.purchases=p.data||[]; state.sales=v.data||[];
  if(!state.companyId) state.companyId=state.companies[0]?.id||null;
}

function renderLogin(){
  $("#app").innerHTML=`<main class="login">
    <section class="login-card">
      <div class="brand">Conta<span>Pro</span></div>
      <p class="muted">Sistema propio de gestión y control empresarial</p>
      <form id="loginForm">
        <label>Correo<input id="email" type="email" required autocomplete="email"></label>
        <label>Contraseña<input id="password" type="password" required autocomplete="current-password"></label>
        <button class="primary wide">Ingresar</button>
      </form>
      <button id="signup" class="ghost wide">Crear usuario</button>
      <small>El acceso real usa Supabase Auth. No se aceptan contraseñas ficticias.</small>
      <div id="msg"></div>
    </section></main>`;
  $("#loginForm").onsubmit=login;
  $("#signup").onclick=signup;
}
async function login(e){
  e.preventDefault(); const msg=$("#msg"); msg.textContent="Ingresando...";
  if(!sb){ msg.textContent="Modo local activado."; state.user={email:$("#email").value}; useLocal(); render(); return; }
  const {error}=await sb.auth.signInWithPassword({email:$("#email").value,password:$("#password").value});
  msg.textContent=error?error.message:"";
  if(!error){ state.user=(await sb.auth.getUser()).data.user; await loadProfile(); await loadAll(); render(); }
}
async function signup(){
  if(!sb){ alert("El modo local no necesita registro."); return; }
  const email=$("#email").value,password=$("#password").value;
  if(!email||password.length<6){ $("#msg").textContent="Ingresa correo y una contraseña de al menos 6 caracteres."; return; }
  const {error}=await sb.auth.signUp({email,password});
  $("#msg").textContent=error?error.message:"Usuario creado. Confirma el correo si tu proyecto lo solicita.";
}

function render(){
  const role=state.profile?.role||"superadmin";
  const canAdmin=role==="superadmin";
  $("#app").innerHTML=`<div class="shell">
    <aside id="side"><div class="brand">Conta<span>Pro</span></div>
      <div class="userbox"><b>${esc(state.user?.email||"Administrador")}</b><small>${esc(role)}</small></div>
      ${nav("inicio","Inicio","▦")}
      ${nav("empresas","Empresas","▣")}
      ${nav("clientes","Clientes","♙")}
      ${nav("proveedores","Proveedores","◈")}
      ${nav("ventas","Ventas","$")}
      ${nav("compras","Compras","▤")}
      ${nav("contabilidad","Contabilidad","◫")}
      ${nav("reportes","Reportes","◒")}
      ${nav("tributario","Tributario","◉")}
      ${nav("sunat","SUNAT","✓")}
      ${canAdmin?nav("admin","SuperAdmin","⚙"):""}
      <button id="logout" class="nav">⇥ Salir</button>
    </aside>
    <main class="main"><header><button id="menu" class="hamb">☰</button><div><h1>${title(state.section)}</h1><small>${esc(currentCompany()?.name||"Sin empresa seleccionada")}</small></div>
      <select id="companySelect">${state.companies.map(c=>`<option value="${c.id}" ${c.id===state.companyId?"selected":""}>${esc(c.name)}</option>`).join("")}</select>
    </header><div id="content"></div></main>
  </div>`;
  document.querySelectorAll(".nav[data-section]").forEach(b=>b.onclick=()=>{state.section=b.dataset.section; render();});
  $("#logout").onclick=async()=>{ if(sb) await sb.auth.signOut(); else {state.user=null;renderLogin();} };
  $("#companySelect").onchange=e=>{state.companyId=e.target.value; render();};
  $("#menu").onclick=()=>$("#side").classList.toggle("open");
  renderSection();
}
function nav(id,t,icon){return `<button class="nav ${state.section===id?"active":""}" data-section="${id}"><i>${icon}</i>${t}</button>`}
function title(s){return ({inicio:"Panel principal",empresas:"Empresas",clientes:"Clientes",proveedores:"Proveedores",ventas:"Ventas",compras:"Compras",contabilidad:"Contabilidad",reportes:"Reportes",tributario:"Tributario",sunat:"SUNAT",admin:"SuperAdmin"}[s]||"ContaPro")}
function currentCompany(){return state.companies.find(x=>x.id===state.companyId)}

function renderSection(){
 const c=$("#content");
 if(state.section==="inicio") return dashboard(c);
 if(["empresas","clientes","proveedores","ventas","compras"].includes(state.section)) return crud(c,state.section);
 if(state.section==="admin") return admin(c);
 const cards={
 contabilidad:["Libro Diario","Libro Mayor","Plan de cuentas","Balance de comprobación"],
 reportes:["Ventas por periodo","Compras por periodo","Resultados","Resumen financiero"],
 tributario:["Comprobantes","IGV","Resumen tributario","Preparación SUNAT"],
 sunat:["Estado de conexión","Comprobantes electrónicos","CDR y respuestas","Configuración de emisión"]
 }[state.section]||[];
 c.innerHTML=`<section class="panel"><div class="empty"><h2>${title(state.section)}</h2><p>Módulo preparado para trabajar con la base propia de ContaPro.</p><div class="grid small">${cards.map(x=>`<article><b>${x}</b><p class="muted">Disponible en la siguiente etapa operativa.</p></article>`).join("")}</div></div></section>`;
}
function dashboard(c){
 const co=state.companyId;
 const sales=state.sales.filter(x=>x.company_id===co), pur=state.purchases.filter(x=>x.company_id===co);
 c.innerHTML=`<div class="cards">
  ${metric("Empresas",state.companies.length,"🏢")}
  ${metric("Clientes",state.clients.filter(x=>x.company_id===co).length,"👥")}
  ${metric("Ventas",money(sales.reduce((a,x)=>a+Number(x.amount||0),0)),"💰")}
  ${metric("Compras",money(pur.reduce((a,x)=>a+Number(x.amount||0),0)),"🧾")}
 </div>
 <section class="panel"><div class="panel-head"><h2>Control del negocio</h2><button class="primary" onclick="go('ventas')">+ Nueva venta</button></div>
 <div class="grid small"><article><b>Registros persistentes</b><p class="muted">Los datos se guardan en Supabase cuando está conectado; el modo local funciona como respaldo de prueba.</p></article>
 <article><b>Auditoría</b><p class="muted">Las tablas registran usuario y fecha de creación/modificación.</p></article>
 <article><b>Seguridad</b><p class="muted">El SuperAdmin controla usuarios y permisos mediante RLS.</p></article></div></section>`;
}
function metric(t,v,i){return `<article class="metric"><span>${i}</span><small>${t}</small><strong>${v}</strong></article>`}

const defs={
 empresas:{label:"Empresa",table:"contapro_companies",fields:[["name","Nombre / razón social","text"],["tax_id","RUC / identificación","text"],["status","Estado","text"]],cols:["name","tax_id","status"]},
 clientes:{label:"Cliente",table:"contapro_clients",fields:[["name","Nombre / razón social","text"],["document","Documento / RUC","text"],["balance","Saldo","number"]],cols:["name","document","balance"]},
 proveedores:{label:"Proveedor",table:"contapro_suppliers",fields:[["name","Nombre / razón social","text"],["document","Documento / RUC","text"],["phone","Teléfono","text"]],cols:["name","document","phone"]},
 ventas:{label:"Venta",table:"contapro_sales",fields:[["document_no","Comprobante","text"],["client_name","Cliente","text"],["amount","Importe","number"],["date","Fecha","date"]],cols:["document_no","client_name","amount","date"]},
 compras:{label:"Compra",table:"contapro_purchases",fields:[["document_no","Comprobante","text"],["supplier_name","Proveedor","text"],["amount","Importe","number"],["date","Fecha","date"]],cols:["document_no","supplier_name","amount","date"]}
};

function listFor(s){return state[s]||[]}
function crud(c,s){
 const d=defs[s], rows=listFor(s).filter(x=>s==="empresas" ? true : x.company_id===state.companyId);
 c.innerHTML=`<section class="panel"><div class="panel-head"><input id="search" class="search" placeholder="Buscar..."><button class="primary" id="add">+ Nuevo ${d.label}</button></div>
 <div class="tablewrap"><table><thead><tr>${d.cols.map(k=>`<th>${esc(fieldLabel(d,k))}</th>`).join("")}<th>Acciones</th></tr></thead><tbody id="rows">${rows.map(r=>rowHtml(d,s,r)).join("")||`<tr><td colspan="${d.cols.length+1}" class="emptycell">No hay registros.</td></tr>`}</tbody></table></div></section>`;
 $("#add").onclick=()=>form(s);
 $("#search").oninput=e=>{const q=e.target.value.toLowerCase();$("#rows").innerHTML=rows.filter(r=>JSON.stringify(r).toLowerCase().includes(q)).map(r=>rowHtml(d,s,r)).join("")||`<tr><td colspan="${d.cols.length+1}" class="emptycell">Sin resultados.</td></tr>`; bindRows(s);};
 bindRows(s);
}
function fieldLabel(d,k){const f=d.fields.find(x=>x[0]===k);return f?f[1]:k}
function rowHtml(d,s,r){return `<tr>${d.cols.map(k=>`<td>${k==="amount"||k==="balance"?money(r[k]):esc(r[k])}</td>`).join("")}<td><button class="link edit" data-id="${r.id}" data-s="${s}">Editar</button> <button class="link danger delete" data-id="${r.id}" data-s="${s}">Eliminar</button></td></tr>`}
function bindRows(){document.querySelectorAll(".edit").forEach(b=>b.onclick=()=>form(b.dataset.s,b.dataset.id));document.querySelectorAll(".delete").forEach(b=>b.onclick=()=>remove(b.dataset.s,b.dataset.id))}
function form(s,id){
 const d=defs[s], old=listFor(s).find(x=>x.id===id)||{};
 const html=d.fields.map(([k,l,t])=>`<label>${esc(l)}<input name="${k}" type="${t}" value="${esc(old[k]??(k==="date"?today():""))}" ${k==="amount"||k==="balance"?"min=0 step=0.01":""} required></label>`).join("");
 const m=document.createElement("div");m.className="modal";m.innerHTML=`<div class="modal-card"><div class="panel-head"><h2>${id?"Editar":"Nuevo"} ${d.label}</h2><button class="x">×</button></div><form id="entityForm">${html}<div class="actions"><button type="button" class="ghost x2">Cancelar</button><button class="primary">Guardar</button></div><div id="formmsg"></div></form></div>`;
 document.body.appendChild(m);m.querySelector(".x").onclick=()=>m.remove();m.querySelector(".x2").onclick=()=>m.remove();
 m.querySelector("form").onsubmit=async e=>{e.preventDefault();const obj=Object.fromEntries(new FormData(e.target).entries());for(const k of Object.keys(obj))if(["amount","balance"].includes(k))obj[k]=Number(obj[k]||0);await persist(s,id,obj);m.remove();render();};
}
async function persist(s,id,obj){
 const d=defs[s];
 if(s!=="empresas") obj.company_id=state.companyId;
 if(!sb){ if(id){const i=state[s].findIndex(x=>x.id===id);state[s][i]={...state[s][i],...obj,updated_at:new Date().toISOString()};}else state[s].unshift({id:crypto.randomUUID(),...obj,created_at:new Date().toISOString()}); saveLocal(); toast("Guardado correctamente"); return; }
 const payload={...obj};
 if(id){const {error}=await sb.from(d.table).update(payload).eq("id",id);if(error) return toast(error.message)}
 else {const {error}=await sb.from(d.table).insert(payload);if(error) return toast(error.message)}
 await loadAll(); toast("Guardado correctamente");
}
async function remove(s,id){
 if(!confirm("¿Eliminar este registro? Esta acción quedará registrada en la auditoría."))return;
 const d=defs[s];
 if(!sb){state[s]=state[s].filter(x=>x.id!==id);saveLocal();render();return}
 const {error}=await sb.from(d.table).delete().eq("id",id);
 if(error) return toast(error.message);
 await loadAll();render();
}
function admin(c){
 c.innerHTML=`<section class="panel"><div class="panel-head"><h2>Control SuperAdmin</h2></div>
 <div class="grid small">
 <article><b>Rol actual</b><p>${esc(state.profile?.role||"superadmin")}</p></article>
 <article><b>Usuarios</b><p>Gestionados mediante Supabase Auth.</p></article>
 <article><b>Empresas</b><p>${state.companies.length} registradas.</p></article>
 <article><b>Base existente</b><p>El esquema de esta versión agrega tablas ContaPro sin eliminar tablas anteriores.</p></article>
 </div>
 <div class="notice"><b>Importante:</b> para producción, desactiva el registro público de usuarios y crea las cuentas desde el panel de Supabase.</div></section>`;
}
window.go=s=>{state.section=s;render()};
function toast(t){let x=$("#toast");if(!x){x=document.createElement("div");x.id="toast";document.body.appendChild(x)}x.textContent=t;x.classList.add("show");setTimeout(()=>x.classList.remove("show"),2500)}
boot();
})();
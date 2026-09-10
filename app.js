(() => {
'use strict';
const C=window.CONTAPRO_CONFIG||{};
const hasSB=!!(window.supabase&&C.supabaseUrl&&C.supabaseAnonKey);
const sb=hasSB?window.supabase.createClient(C.supabaseUrl,C.supabaseAnonKey):null;
const $=s=>document.querySelector(s), esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const money=v=>new Intl.NumberFormat('es-PE',{style:'currency',currency:'PEN'}).format(Number(v||0));
const today=()=>new Date().toISOString().slice(0,10);
const uid=()=>crypto?.randomUUID?crypto.randomUUID():'local-'+Date.now()+'-'+Math.random().toString(16).slice(2);
let state={user:null,profile:null,companies:[],clients:[],suppliers:[],sales:[],purchases:[],section:'inicio',companyId:null,periodFrom:new Date(new Date().getFullYear(),0,1).toISOString().slice(0,10),periodTo:today()};
const localKey='contapro_local_v5';
function localLoad(){try{return JSON.parse(localStorage.getItem(localKey))||{};}catch{return {};}}
function localSave(){localStorage.setItem(localKey,JSON.stringify({companies:state.companies,clients:state.clients,suppliers:state.suppliers,sales:state.sales,purchases:state.purchases}));}
function toast(t){let x=$('#toast');if(!x){x=document.createElement('div');x.id='toast';document.body.appendChild(x)}x.textContent=t;x.classList.add('show');setTimeout(()=>x.classList.remove('show'),2600)}
function go(s){state.section=s;render()}; window.go=go;
async function boot(){
  if(location.search.includes('local=1')) return enterLocalMode();
  if(!sb){return enterLocalMode()}
  try{
    const {data:{session},error}=await sb.auth.getSession();
    if(error) throw error;
    if(!session) return renderLogin();
    state.user=session.user;
    await loadProfile();
    await loadAll();
    render();
    sb.auth.onAuthStateChange((_e,s)=>{state.user=s?.user||null;if(!state.user)renderLogin()})
  }catch(err){
    renderLogin('No se pudo conectar con Supabase. Puedes reintentar o entrar en modo local para seguir trabajando en este dispositivo.');
  }
}
function enterLocalMode(){
  Object.assign(state,localLoad());
  state.user={email:'Administrador local',id:'local-admin'};
  state.profile={id:'local-admin',role:'superadmin'};
  state.companyId=state.companies?.[0]?.id||null;
  render();
  toast('Modo local activado. Los datos se guardan en este dispositivo.');
}
async function loadProfile(){
  let r=await sb.from('contapro_profiles').select('*').eq('id',state.user.id).maybeSingle();
  if(r.error){state.profile={id:state.user.id,role:'user'};state.companyId=null;return}
  if(!r.data){
    const b=await sb.rpc('contapro_bootstrap_first_superadmin');
    if(!b.error){r=await sb.from('contapro_profiles').select('*').eq('id',state.user.id).maybeSingle()}
  }
  state.profile=r.data||{id:state.user.id,role:'user'};
  state.companyId=state.profile.company_id||null
}
async function loadAll(){
  const names=['contapro_companies','contapro_clients','contapro_suppliers','contapro_sales','contapro_purchases'];
  const results=await Promise.all(names.map(t=>sb.from(t).select('*').order('created_at',{ascending:false})));
  [state.companies,state.clients,state.suppliers,state.sales,state.purchases]=results.map(r=>r.data||[]);
  if(!state.companyId)state.companyId=state.companies[0]?.id||null;
  const bad=results.find(r=>r.error);
  if(bad)toast('Base de datos: '+(bad.error.message||'revisa la migración ContaPro'));
}
function renderLogin(message=''){$('#app').innerHTML=`<main class="login"><section class="login-card"><div class="brand">Conta<span>Pro</span></div><p class="muted">Sistema propio de gestión y control empresarial</p><form id="lf"><label>Correo<input id="email" type="email" autocomplete="email" required></label><label>Contraseña<input id="password" type="password" autocomplete="current-password" required></label><button class="primary wide" type="submit">Ingresar</button></form><button id="signup" class="ghost wide">Crear usuario</button><button id="local" class="ghost wide">Entrar en modo local</button><div id="msg" class="notice">${esc(message)}</div><small class="muted">Acceso de instalación local: <b>admin@contapro.local</b> · <b>ContaPro-Admin-2026</b>. Este acceso solo sirve para probar el sistema en este dispositivo y no es una credencial de Supabase.</small></section></main>`;$('#lf').onsubmit=login;$('#signup').onclick=signup;$('#local').onclick=enterLocalMode}
async function login(e){
  e.preventDefault();
  const email=$('#email').value.trim().toLowerCase();
  const password=$('#password').value;
  const msg=$('#msg');
  // Credencial de instalación LOCAL para poder entrar y probar el sistema aun cuando
  // Supabase esté caído o mal configurado. No concede acceso a Supabase ni a datos cloud.
  if(email==='admin@contapro.local' && password==='ContaPro-Admin-2026'){
    enterLocalMode();
    toast('Administrador local iniciado');
    return;
  }
  if(!sb){return enterLocalMode()}
  msg.textContent='Conectando...';
  try{
    const {data,error}=await sb.auth.signInWithPassword({email,password});
    if(error){msg.textContent=error.message;return}
    state.user=data.user;
    await loadProfile();
    await loadAll();
    render();
  }catch(err){
    msg.innerHTML='No se pudo conectar con el servidor. Puedes usar el acceso local de administrador para probar el sistema.';
  }
}
async function signup(){
  if(!sb)return enterLocalMode();
  const email=$('#email').value,p=$('#password').value;
  if(!email||p.length<6)return $('#msg').textContent='Usa un correo y una contraseña de mínimo 6 caracteres.';
  try{const {error}=await sb.auth.signUp({email,password:p});$('#msg').textContent=error?error.message:'Usuario creado. Confirma el correo si está habilitada la confirmación.'}
  catch(err){$('#msg').textContent='No se pudo conectar con Supabase. Puedes continuar en modo local.'}
}
const navs=[['inicio','Inicio','▦'],['empresas','Empresas','▣'],['clientes','Clientes','♙'],['proveedores','Proveedores','◈'],['ventas','Ventas','$'],['compras','Compras','▤'],['contabilidad','Contabilidad','◫'],['reportes','Reportes','◒'],['tributario','Tributario','◉'],['sunat','SUNAT','✓']];
function render(){const role=state.profile?.role||'superadmin',admin=role==='superadmin';$('#app').innerHTML=`<div class="shell"><aside id="side"><div class="brand">Conta<span>Pro</span></div><div class="userbox"><b>${esc(state.user?.email||'Administrador')}</b><small>${esc(role)}</small></div>${navs.map(n=>`<button class="nav ${state.section===n[0]?'active':''}" data-section="${n[0]}"><i>${n[2]}</i>${n[1]}</button>`).join('')}${admin?`<button class="nav ${state.section==='admin'?'active':''}" data-section="admin"><i>⚙</i>SuperAdmin</button>`:''}<button id="logout" class="nav"><i>⇥</i>Salir</button></aside><main class="main"><header><button id="menu" class="hamb">☰</button><div><h1>${title(state.section)}</h1><small>${esc(currentCompany()?.name||'Sin empresa seleccionada')}</small></div><select id="companySelect"><option value="">${state.companies.length?'Seleccionar empresa':'Sin empresas'}</option>${state.companies.map(c=>`<option value="${c.id}" ${c.id===state.companyId?'selected':''}>${esc(c.name)}${c.status==='Inactivo'?' (Inactiva)':''}</option>`).join('')}</select></header><div id="content"></div></main></div>`;document.querySelectorAll('[data-section]').forEach(b=>b.onclick=()=>{state.section=b.dataset.section;render()});$('#companySelect').onchange=e=>{state.companyId=e.target.value||null;render()};$('#logout').onclick=async()=>{if(sb)await sb.auth.signOut();else{state.user=null;renderLogin()}};$('#menu').onclick=()=>$('#side').classList.toggle('open');renderSection()}
function title(s){return ({inicio:'Panel principal',empresas:'Empresas',clientes:'Clientes',proveedores:'Proveedores',ventas:'Ventas',compras:'Compras',contabilidad:'Contabilidad',reportes:'Reportes',tributario:'Tributario',sunat:'SUNAT',admin:'SuperAdmin'})[s]||'ContaPro'}
function currentCompany(){return state.companies.find(x=>x.id===state.companyId)}
function renderSection(){const c=$('#content');if(state.section==='inicio')return dashboard(c);if(['empresas','clientes','proveedores','ventas','compras'].includes(state.section))return crud(c,state.section);if(state.section==='contabilidad')return accounting(c);if(state.section==='reportes')return reports(c);if(state.section==='tributario')return tax(c);if(state.section==='sunat')return sunat(c);if(state.section==='admin')return admin(c)}
function dashboard(c){const co=state.companyId,s=period(state.sales,co),p=period(state.purchases,co),ts=sum(s),tp=sum(p),cl=state.clients.filter(x=>x.company_id===co),sp=state.suppliers.filter(x=>x.company_id===co);c.innerHTML=`<div class="cards">${metric('Empresas',state.companies.length,'🏢')}${metric('Clientes',cl.length,'👥')}${metric('Ventas',money(ts),'💰')}${metric('Compras',money(tp),'🧾')}${metric('Resultado',money(ts-tp),'📈')}</div><section class="panel"><div class="panel-head"><h2>Trabajo automatizado</h2><div class="actions"><button class="primary" onclick="go('empresas')">+ Empresa</button><button class="primary" onclick="go('ventas')">+ Venta</button><button class="primary" onclick="go('compras')">+ Compra</button></div></div><div class="grid small"><article><b>Empresa activa</b><p>${esc(currentCompany()?.name||'Selecciona o registra una empresa')}</p></article><article><b>Período</b><p>${state.periodFrom} al ${state.periodTo}</p></article><article><b>Automatización contable</b><p class="muted">Ventas y compras alimentan automáticamente los indicadores, libro diario, resultados e IGV informativo.</p></article><article><b>Control</b><p class="muted">${esc(state.profile?.role||'superadmin')} · información separada por empresa.</p></article></div></section>`}
function metric(t,v,i){return `<article class="metric"><span>${i}</span><small>${t}</small><strong>${v}</strong></article>`}
function sum(a){return a.reduce((n,x)=>n+Number(x.amount||0),0)}
function period(arr,co){return arr.filter(x=>x.company_id===co&&String(x.date||'')>=state.periodFrom&&String(x.date||'')<=state.periodTo&&x.status!=='Anulada')}
const defs={
 empresas:{label:'Empresa',table:'contapro_companies',fields:[['name','Razón social / nombre','text'],['tax_id','RUC','text'],['address','Dirección','text'],['phone','Teléfono','tel'],['email','Correo','email'],['status','Estado','select:Activo|Inactivo']],cols:['name','tax_id','address','phone','email','status']},
 clientes:{label:'Cliente',table:'contapro_clients',fields:[['name','Nombre / razón social','text'],['document','DNI / RUC','text'],['balance','Saldo inicial','number'],['status','Estado','select:Activo|Inactivo']],cols:['name','document','balance','status']},
 proveedores:{label:'Proveedor',table:'contapro_suppliers',fields:[['name','Nombre / razón social','text'],['document','DNI / RUC','text'],['phone','Teléfono','tel'],['status','Estado','select:Activo|Inactivo']],cols:['name','document','phone','status']},
 ventas:{label:'Venta',table:'contapro_sales',fields:[['document_no','Comprobante','text'],['client_name','Cliente','text'],['amount','Importe total','number'],['date','Fecha','date'],['status','Estado','select:Registrada|Pagada|Anulada']],cols:['document_no','client_name','amount','date','status']},
 compras:{label:'Compra',table:'contapro_purchases',fields:[['document_no','Comprobante','text'],['supplier_name','Proveedor','text'],['amount','Importe total','number'],['date','Fecha','date'],['status','Estado','select:Registrada|Pagada|Anulada']],cols:['document_no','supplier_name','amount','date','status']}
};
function crud(c,s){const d=defs[s],rows=(state[s]||[]).filter(x=>s==='empresas'||x.company_id===state.companyId);c.innerHTML=`<section class="panel"><div class="panel-head"><input id="search" class="search" placeholder="Buscar por nombre, RUC, comprobante..."><button class="primary" id="add">+ Nuevo ${d.label}</button></div><div class="tablewrap"><table><thead><tr>${d.cols.map(k=>`<th>${esc(label(d,k))}</th>`).join('')}<th>Acciones</th></tr></thead><tbody id="rows">${rows.map(r=>row(d,s,r)).join('')||empty(d.cols.length+1)}</tbody></table></div></section>`;$('#add').onclick=()=>form(s);$('#search').oninput=e=>{const q=e.target.value.toLowerCase();$('#rows').innerHTML=rows.filter(r=>JSON.stringify(r).toLowerCase().includes(q)).map(r=>row(d,s,r)).join('')||empty(d.cols.length+1);bind(s)};bind(s)}
function empty(n){return `<tr><td colspan="${n}" class="emptycell">No hay registros.</td></tr>`}
function label(d,k){const f=d.fields.find(x=>x[0]===k);return f?f[1]:k}
function row(d,s,r){return `<tr class="${r.status==='Inactivo'||r.status==='Anulada'?'mutedrow':''}">${d.cols.map(k=>`<td>${k==='amount'||k==='balance'?money(r[k]):esc(r[k])}</td>`).join('')}<td><button class="link edit" data-id="${r.id}" data-s="${s}">Editar</button> <button class="link danger archive" data-id="${r.id}" data-s="${s}">${s==='empresas'?'Archivar':'Anular'}</button></td></tr>`}
function bind(){document.querySelectorAll('.edit').forEach(b=>b.onclick=()=>form(b.dataset.s,b.dataset.id));document.querySelectorAll('.archive').forEach(b=>b.onclick=()=>archive(b.dataset.s,b.dataset.id))}
function form(s,id){const d=defs[s],old=(state[s]||[]).find(x=>x.id===id)||{};const html=d.fields.map(([k,l,t])=>{if(t.startsWith('select:')){const opts=t.slice(7).split('|');return `<label>${esc(l)}<select name="${k}" required>${opts.map(o=>`<option ${String(old[k]??(k==='status'?'Activo':opts[0]))===o?'selected':''}>${esc(o)}</option>`).join('')}</select></label>`}return `<label>${esc(l)}<input name="${k}" type="${t}" value="${esc(old[k]??(k==='date'?today():(k==='status'?'Activo':'')))}" ${k==='amount'||k==='balance'?'min="0" step="0.01"':''} required></label>`}).join('');const m=document.createElement('div');m.className='modal';m.innerHTML=`<div class="modal-card"><div class="panel-head"><h2>${id?'Editar':'Nuevo'} ${d.label}</h2><button class="x">×</button></div><form id="ef">${html}<div class="actions"><button type="button" class="ghost cancel">Cancelar</button><button class="primary">Guardar</button></div><div id="formmsg"></div></form></div>`;document.body.appendChild(m);m.querySelector('.x').onclick=m.querySelector('.cancel').onclick=()=>m.remove();m.querySelector('form').onsubmit=async e=>{e.preventDefault();const obj=Object.fromEntries(new FormData(e.target));for(const k of ['amount','balance'])if(k in obj)obj[k]=Number(obj[k]||0);const ok=await persist(s,id,obj);if(ok){if(!sb)localSave();m.remove();render()}}}
async function persist(s,id,obj){
  const d=defs[s];
  if(s!=='empresas'){
    if(!state.companyId){toast('Primero registra y selecciona una empresa.');return false}
    obj.company_id=state.companyId;
  }
  if(!sb){
    if(id){const i=state[s].findIndex(x=>x.id===id);if(i<0){toast('Registro no encontrado.');return false}state[s][i]={...state[s][i],...obj,updated_at:new Date().toISOString()}}
    else state[s].unshift({id:uid(),...obj,created_at:new Date().toISOString()});
    toast('Guardado correctamente');return true;
  }
  if(s==='empresas' && state.profile?.role!=='superadmin'){toast('Tu usuario aún no tiene rol SuperAdmin. Cierra sesión y vuelve a ingresar después de ejecutar la migración.');return false}
  try{
    let r;
    if(!id){obj.created_by=state.user?.id;r=await sb.from(d.table).insert(obj).select('*').single()}
    else r=await sb.from(d.table).update({...obj,updated_at:new Date().toISOString()}).eq('id',id).select('*').single();
    if(r.error){toast('No se pudo guardar: '+r.error.message);return false}
    await loadAll();toast('Guardado correctamente');return true;
  }catch(err){toast('Error de conexión al guardar.');return false}
}
async function archive(s,id){const msg=s==='empresas'?'La empresa quedará Inactiva y conservará su historial.':'El registro quedará Anulado/Inactivo y conservará su historial.';if(!confirm(msg))return;const status=s==='empresas'?'Inactivo':s==='ventas'||s==='compras'?'Anulada':'Inactivo';if(!sb){const i=state[s].findIndex(x=>x.id===id);if(i>=0)state[s][i].status=status;localSave();return render()}const r=await sb.from(defs[s].table).update({status,updated_at:new Date().toISOString()}).eq('id',id);if(r.error)return toast(r.error.message);await loadAll();render()}
function accounting(c){const s=period(state.sales,state.companyId),p=period(state.purchases,state.companyId);const rows=[...s.map(x=>({date:x.date,ref:x.document_no,detail:`Venta ${x.client_name||''}`,debit:Number(x.amount||0),credit:0})),...p.map(x=>({date:x.date,ref:x.document_no,detail:`Compra ${x.supplier_name||''}`,debit:0,credit:Number(x.amount||0)}))].sort((a,b)=>String(a.date).localeCompare(String(b.date)));c.innerHTML=`<section class="panel"><div class="panel-head"><h2>Contabilidad automática</h2><div class="actions"><button class="ghost" onclick="downloadJournal()">Exportar Diario</button><button class="primary" onclick="go('reportes')">Estados y reportes</button></div></div><div class="cards">${metric('Debe',money(sum(rows.map(x=>({amount:x.debit})))),'D')}${metric('Haber',money(sum(rows.map(x=>({amount:x.credit})))),'H')}</div><div class="tablewrap"><table><thead><tr><th>Fecha</th><th>Comprobante</th><th>Detalle</th><th>Debe</th><th>Haber</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r.date)}</td><td>${esc(r.ref)}</td><td>${esc(r.detail)}</td><td>${money(r.debit)}</td><td>${money(r.credit)}</td></tr>`).join('')||empty(5)}</tbody></table></div></section>`}
window.downloadJournal=()=>{const s=period(state.sales,state.companyId),p=period(state.purchases,state.companyId),rows=[['Fecha','Comprobante','Detalle','Debe','Haber'],...s.map(x=>[x.date,x.document_no,'Venta',x.amount,0]),...p.map(x=>[x.date,x.document_no,'Compra',0,x.amount])];csv(rows,`libro-diario-${today()}.csv`)};
function reports(c){const s=period(state.sales,state.companyId),p=period(state.purchases,state.companyId),ts=sum(s),tp=sum(p),r=ts-tp;c.innerHTML=`<section class="panel"><div class="panel-head"><h2>Reportes financieros</h2><div class="actions"><button class="primary" id="print">Imprimir / PDF</button><button class="ghost" id="export">Exportar CSV</button></div></div><div class="grid filters"><label>Desde<input id="from" type="date" value="${state.periodFrom}"></label><label>Hasta<input id="to" type="date" value="${state.periodTo}"></label><button class="primary" id="apply">Actualizar</button></div><div id="reportArea"><h3>${esc(currentCompany()?.name||'Empresa')}</h3><p>Período: ${state.periodFrom} al ${state.periodTo}</p><div class="cards">${metric('Ventas',money(ts),'💰')}${metric('Compras',money(tp),'🧾')}${metric('Resultado',money(r),'📈')}${metric('Operaciones',s.length+p.length,'📋')}</div><div class="grid small"><article><b>Estado de resultados</b><p>Ingresos: ${money(ts)}<br>Compras/gastos registrados: ${money(tp)}<br><strong>Resultado: ${money(r)}</strong></p></article><article><b>Resumen de operaciones</b><p>Ventas: ${s.length}<br>Compras: ${p.length}<br>Total: ${s.length+p.length}</p></article></div><h3>Ventas</h3><div class="tablewrap"><table><tr><th>Fecha</th><th>Comprobante</th><th>Cliente</th><th>Total</th></tr>${s.map(x=>`<tr><td>${esc(x.date)}</td><td>${esc(x.document_no)}</td><td>${esc(x.client_name)}</td><td>${money(x.amount)}</td></tr>`).join('')||empty(4)}</table></div><h3>Compras</h3><div class="tablewrap"><table><tr><th>Fecha</th><th>Comprobante</th><th>Proveedor</th><th>Total</th></tr>${p.map(x=>`<tr><td>${esc(x.date)}</td><td>${esc(x.document_no)}</td><td>${esc(x.supplier_name)}</td><td>${money(x.amount)}</td></tr>`).join('')||empty(4)}</table></div></div></section>`;$('#apply').onclick=()=>{state.periodFrom=$('#from').value;state.periodTo=$('#to').value;render()};$('#export').onclick=()=>csv([['Tipo','Fecha','Comprobante','Tercero','Importe'],...s.map(x=>['Venta',x.date,x.document_no,x.client_name,x.amount]),...p.map(x=>['Compra',x.date,x.document_no,x.supplier_name,x.amount])],`reporte-${today()}.csv`);$('#print').onclick=()=>{const w=open('','_blank');w.document.write(`<html><body style="font-family:Arial;padding:30px">${$('#reportArea').innerHTML}</body></html>`);w.document.close();w.print()}}
function csv(rows,name){const b=new Blob([rows.map(r=>r.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(',')).join('\n')],{type:'text/csv;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;a.click();URL.revokeObjectURL(a.href)}
function tax(c){const s=period(state.sales,state.companyId),p=period(state.purchases,state.companyId),ts=sum(s),tp=sum(p),bs=ts/1.18,bp=tp/1.18;c.innerHTML=`<section class="panel"><div class="panel-head"><h2>Tributario</h2><button class="primary" onclick="go('reportes')">Generar reporte</button></div><div class="cards">${metric('Ventas',money(ts),'💰')}${metric('Base ventas',money(bs),'')}${metric('IGV ventas',money(bs*.18),'')}${metric('IGV compras',money(bp*.18),'')}${metric('IGV estimado',money(bs*.18-bp*.18),'')}</div><p class="muted">Cálculo informativo al 18% para importes que incluyen IGV. SUNAT se mantiene sin cambios.</p></section>`}
function sunat(c){c.innerHTML=`<section class="panel"><div class="panel-head"><h2>SUNAT</h2><button class="primary" id="check">Comprobar conexión</button></div><div id="status" class="notice">Módulo SUNAT conservado.</div></section>`;$('#check').onclick=()=>$('#status').textContent=C.supabaseUrl?'Conexión de configuración disponible.':'Supabase no está configurado.'}
function admin(c){c.innerHTML=`<section class="panel"><div class="panel-head"><h2>SuperAdmin</h2></div><div class="cards">${metric('Empresas',state.companies.length,'🏢')}${metric('Clientes',state.clients.length,'👥')}${metric('Ventas',money(sum(state.sales)),'💰')}${metric('Compras',money(sum(state.purchases)),'🧾')}</div><div class="grid small"><article><b>Rol</b><p>${esc(state.profile?.role||'superadmin')}</p></article><article><b>Administración</b><p>El SuperAdmin puede crear y administrar empresas. Los datos se aíslan por empresa mediante RLS cuando Supabase está activo.</p></article><article><b>Conservación</b><p>Las bajas se manejan como Inactivo/Anulada para conservar historial.</p></article><article><b>Usuarios</b><p>Autenticación gestionada por Supabase Auth.</p></article></div></section>`}
boot();
})();

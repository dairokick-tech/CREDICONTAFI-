(() => {
  const view = document.querySelector('#view');
  const userEl = document.querySelector('#user');

  const KEY = 'contapro_demo_v2';
  const initial = {
    empresas: [
      {id: crypto.randomUUID(), nombre:'Comercial Demo S.A.C.', identificacion:'RUC 20600000001', estado:'Activo'},
      {id: crypto.randomUUID(), nombre:'Servicios Andinos E.I.R.L.', identificacion:'RUC 20600000002', estado:'Activo'},
      {id: crypto.randomUUID(), nombre:'Inversiones Norte S.A.C.', identificacion:'RUC 20600000003', estado:'Pendiente'}
    ],
    clientes: [
      {id: crypto.randomUUID(), nombre:'Cliente Ejemplo S.A.C.', documento:'RUC 20611111111', saldo:4500},
      {id: crypto.randomUUID(), nombre:'Juan Pérez', documento:'DNI 70123456', saldo:1280},
      {id: crypto.randomUUID(), nombre:'Distribuidora Central', documento:'RUC 20522222222', saldo:8740}
    ],
    compras: [
      {id: crypto.randomUUID(), comprobante:'FAC-001-004521', proveedor:'Proveedor Andino', importe:2850, fecha:'2026-09-10'},
      {id: crypto.randomUUID(), comprobante:'FAC-001-004522', proveedor:'Servicios SAC', importe:1420, fecha:'2026-09-09'},
      {id: crypto.randomUUID(), comprobante:'FAC-001-004523', proveedor:'Oficinas Perú', importe:680, fecha:'2026-09-08'}
    ],
    ventas: [
      {id: crypto.randomUUID(), comprobante:'B001-000154', cliente:'Cliente Ejemplo', importe:3250, fecha:'2026-09-10'},
      {id: crypto.randomUUID(), comprobante:'F001-000982', cliente:'Distribuidora Central', importe:7800, fecha:'2026-09-09'},
      {id: crypto.randomUUID(), comprobante:'F001-000981', cliente:'Comercial Sur', importe:4150, fecha:'2026-09-08'}
    ]
  };

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || structuredClone(initial); }
    catch { return structuredClone(initial); }
  }
  let db = load();
  function save() { localStorage.setItem(KEY, JSON.stringify(db)); }

  userEl.textContent = localStorage.getItem('contapro_user') || 'demo@contapro.pe';

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const money = n => 'S/ ' + Number(n || 0).toLocaleString('es-PE',{minimumFractionDigits:2,maximumFractionDigits:2});
  const fmtDate = s => s ? new Date(s+'T00:00:00').toLocaleDateString('es-PE') : '';

  function table(headers, rows, actions=true) {
    return `<div class="table-wrap"><table class="table"><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}${actions?'<th>Acciones</th>':''}</tr></thead><tbody>${
      rows.length ? rows.map(r=>`<tr>${r.cells.map(c=>`<td>${c}</td>`).join('')}${actions?`<td><button class="link-btn edit" data-id="${r.id}">Editar</button><button class="link-btn danger del" data-id="${r.id}">Eliminar</button></td>`:''}</tr>`).join('')
      : `<tr><td colspan="${headers.length+(actions?1:0)}" class="empty">No hay registros.</td></tr>`
    }</tbody></table></div>`;
  }

  function list(type,title,headers,fields) {
    const search = '';
    view.innerHTML = `<div class="dash-title"><div><h1>${title}</h1><p>Registros guardados en este navegador.</p></div><button class="btn" id="add">+ Agregar</button></div>
      <div class="panel"><div class="toolbar"><input id="q" placeholder="Buscar..."><button class="btn small" id="search">Buscar</button></div><div id="table"></div></div>`;
    const renderTable = () => {
      const q = document.querySelector('#q').value.trim().toLowerCase();
      const rows = db[type].filter(x => JSON.stringify(x).toLowerCase().includes(q));
      let mapped;
      if(type==='empresas') mapped=rows.map(x=>({id:x.id,cells:[esc(x.nombre),esc(x.identificacion),`<span class="tag">${esc(x.estado)}</span>`]}));
      if(type==='clientes') mapped=rows.map(x=>({id:x.id,cells:[esc(x.nombre),esc(x.documento),money(x.saldo)]}));
      if(type==='compras') mapped=rows.map(x=>({id:x.id,cells:[esc(x.comprobante),esc(x.proveedor),money(x.importe),fmtDate(x.fecha)]}));
      if(type==='ventas') mapped=rows.map(x=>({id:x.id,cells:[esc(x.comprobante),esc(x.cliente),money(x.importe),fmtDate(x.fecha)]}));
      document.querySelector('#table').innerHTML=table(headers,mapped);
      document.querySelectorAll('.edit').forEach(b=>b.onclick=()=>openForm(type,title,fields,b.dataset.id));
      document.querySelectorAll('.del').forEach(b=>b.onclick=()=>{
        const item=db[type].find(x=>x.id===b.dataset.id);
        if(!item) return;
        if(confirm(`¿Eliminar "${item.nombre||item.comprobante}"?`)){ db[type]=db[type].filter(x=>x.id!==b.dataset.id); save(); renderTable(); }
      });
    };
    document.querySelector('#add').onclick=()=>openForm(type,title,fields);
    document.querySelector('#search').onclick=renderTable;
    document.querySelector('#q').addEventListener('input',renderTable);
    renderTable();
  }

  function openForm(type,title,fields,id) {
    const item = id ? db[type].find(x=>x.id===id) : {};
    const labels = {nombre:'Nombre',identificacion:'RUC / Identificación',estado:'Estado',documento:'DNI / RUC',saldo:'Saldo',comprobante:'Comprobante',proveedor:'Proveedor',cliente:'Cliente',importe:'Importe',fecha:'Fecha'};
    const form = document.createElement('div');
    form.className='modal-backdrop';
    form.innerHTML=`<div class="modal"><div class="modal-head"><h2>${id?'Editar':'Registrar'} ${title.slice(0,-1)}</h2><button class="x">×</button></div>
      <form id="crudForm">${fields.map(f=>`<label>${labels[f]||f}
        ${f==='estado'?`<select name="${f}"><option>Activo</option><option>Pendiente</option><option>Inactivo</option></select>`
        :`<input name="${f}" type="${f==='importe'||f==='saldo'?'number':f==='fecha'?'date':'text'}" ${f==='importe'||f==='saldo'?'step="0.01"':''} required>`}
      </label>`).join('')}
      <div class="form-actions"><button type="button" class="btn ghost cancel">Cancelar</button><button class="btn" type="submit">Guardar</button></div></form></div>`;
    document.body.appendChild(form);
    fields.forEach(f=>{const el=form.querySelector(`[name="${f}"]`); if(el) el.value=item[f] ?? (f==='fecha'?new Date().toISOString().slice(0,10):'');});
    form.querySelector('.x').onclick=form.querySelector('.cancel').onclick=()=>form.remove();
    form.querySelector('#crudForm').onsubmit=e=>{
      e.preventDefault();
      const fd=new FormData(e.target), obj={};
      fields.forEach(f=>{obj[f]=(f==='importe'||f==='saldo')?Number(fd.get(f)):fd.get(f);});
      if(id){ Object.assign(item,obj); } else { obj.id=crypto.randomUUID(); db[type].unshift(obj); }
      save(); form.remove(); render(location.hash.slice(1)||'inicio');
    };
  }

  function inicio(){
    const totalVentas=db.ventas.reduce((s,x)=>s+Number(x.importe),0);
    const totalCompras=db.compras.reduce((s,x)=>s+Number(x.importe),0);
    view.innerHTML=`<div class="dash-title"><div><h1>Resumen</h1><p>Panel operativo de ContaPro.</p></div><button class="btn" id="quick">+ Nueva empresa</button></div>
      <div class="grid4"><div class="stat"><small>Empresas</small><strong>${db.empresas.length}</strong></div><div class="stat"><small>Ventas</small><strong>${money(totalVentas)}</strong></div><div class="stat"><small>Compras</small><strong>${money(totalCompras)}</strong></div><div class="stat"><small>Resultado</small><strong>${money(totalVentas-totalCompras)}</strong></div></div>
      <div class="panel"><h3>Datos de la demo</h3><p>Ahora los botones <b>Agregar</b>, <b>Editar</b>, <b>Eliminar</b> y <b>Buscar</b> sí ejecutan acciones y los cambios quedan guardados en este dispositivo.</p></div>`;
    document.querySelector('#quick').onclick=()=>openForm('empresas','Empresas',['nombre','identificacion','estado']);
  }

  function generic(title,text){
    view.innerHTML=`<div class="dash-title"><div><h1>${title}</h1><p>${text}</p></div></div>
      <div class="cards-mini"><div class="panel"><h3>Resumen</h3><p>Información centralizada para tu gestión.</p><strong>Operativo</strong></div>
      <div class="panel"><h3>Procesos</h3><p>Este módulo está preparado para registrar operaciones.</p><strong>Disponible</strong></div>
      <div class="panel"><h3>Reportes</h3><p>Consulta y exporta información cuando conectemos el módulo definitivo.</p><strong>Disponible</strong></div></div>`;
  }

  function render(v){
    const type=v||'inicio';
    if(type==='inicio') inicio();
    else if(type==='empresas') list('empresas','Empresas',['Empresa','Identificación','Estado'],['nombre','identificacion','estado']);
    else if(type==='clientes') list('clientes','Clientes',['Cliente','Documento','Saldo'],['nombre','documento','saldo']);
    else if(type==='compras') list('compras','Compras',['Comprobante','Proveedor','Importe','Fecha'],['comprobante','proveedor','importe','fecha']);
    else if(type==='ventas') list('ventas','Ventas',['Comprobante','Cliente','Importe','Fecha'],['comprobante','cliente','importe','fecha']);
    else generic(type==='contabilidad'?'Contabilidad':type==='reportes'?'Reportes':type==='tributario'?'Módulo tributario':'Configuración',
      type==='contabilidad'?'Plan contable, asientos y libros.':type==='reportes'?'Estados financieros e indicadores.':type==='tributario'?'Control de obligaciones tributarias.':'Datos de empresa, usuarios y preferencias.');
  }

  document.querySelectorAll('.nav[data-view]').forEach(b=>b.onclick=()=>{
    document.querySelectorAll('.nav').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    location.hash=b.dataset.view;
    render(b.dataset.view);
    document.querySelector('.sidebar').classList.remove('open');
  });
  document.querySelector('#logout').onclick=()=>{localStorage.removeItem('contapro_user');location.href='login.html'};
  document.querySelector('#menu').onclick=()=>document.querySelector('.sidebar').classList.toggle('open');

  const start=location.hash.slice(1)||'inicio';
  const active=document.querySelector(`.nav[data-view="${start}"]`);
  if(active) active.classList.add('active');
  render(start);
})();
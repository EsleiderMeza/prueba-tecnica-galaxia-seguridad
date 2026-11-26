// API SIMULADA (solo desarrollo): datos en memoria que siguen app-movil/docs/API_CONTRACT.md.
// Sirve para probar la app mientras el backend Laravel no esté listo. Se reinicia al detenerla.
// Usuarios: admin@galaxia.com, tecnico@galaxia.com, tecnico2@galaxia.com, usuario@galaxia.com — clave: password
const http = require('http');
const now = () => new Date().toISOString();
const roles = { admin: { id: 1, nombre: 'Administrador', slug: 'admin' }, tecnico: { id: 2, nombre: 'Técnico', slug: 'tecnico' }, usuario: { id: 3, nombre: 'Usuario', slug: 'usuario' } };
const users = [
  { id: 1, nombre: 'Ana Admin', email: 'admin@galaxia.com', rol: roles.admin },
  { id: 2, nombre: 'Tomás Técnico', email: 'tecnico@galaxia.com', rol: roles.tecnico },
  { id: 3, nombre: 'Laura Técnica', email: 'tecnico2@galaxia.com', rol: roles.tecnico },
  { id: 4, nombre: 'Uriel Usuario', email: 'usuario@galaxia.com', rol: roles.usuario },
];
const estados = [
  { id: 1, nombre: 'Abierta', slug: 'abierta', color: '#2563EB', es_final: false },
  { id: 2, nombre: 'Asignada', slug: 'asignada', color: '#7C3AED', es_final: false },
  { id: 3, nombre: 'En proceso', slug: 'en_proceso', color: '#EA580C', es_final: false },
  { id: 4, nombre: 'Resuelta', slug: 'resuelta', color: '#16A34A', es_final: false },
  { id: 5, nombre: 'Cerrada', slug: 'cerrada', color: '#475569', es_final: true },
];
const categorias = [
  { id: 1, nombre: 'Computador de escritorio', tipo: 'equipo' }, { id: 2, nombre: 'Portátil', tipo: 'equipo' }, { id: 3, nombre: 'Impresora', tipo: 'equipo' }, { id: 4, nombre: 'Red / Switch', tipo: 'equipo' },
  { id: 5, nombre: 'Hardware', tipo: 'solicitud' }, { id: 6, nombre: 'Software', tipo: 'solicitud' }, { id: 7, nombre: 'Red e internet', tipo: 'solicitud' }, { id: 8, nombre: 'Impresión', tipo: 'solicitud' },
];
let equipos = [];
for (let i = 1; i <= 23; i++) equipos.push({ id: i, codigo_inventario: `GS-${String(i).padStart(3, '0')}`, nombre: ['PC Recepción', 'Portátil Gerencia', 'Impresora HP piso 2', 'Switch principal'][i % 4] + ' ' + i, categoria: categorias[i % 4], marca: ['Dell', 'Lenovo', 'HP', 'Cisco'][i % 4], modelo: 'M' + i, serial: 'SN' + (1000 + i), ubicacion: ['Sede principal', 'Bodega', 'Sede norte'][i % 3], responsable: 'Persona ' + i, estado: i % 7 === 0 ? 'en_mantenimiento' : i % 11 === 0 ? 'dado_de_baja' : 'operativo', fecha_adquisicion: '2024-05-10', observaciones: null, created_at: now(), updated_at: now() });
let solicitudes = [], historial = [], nextSol = 1, nextHist = 1, nextEq = 24;
const resumenEq = (e) => e && { id: e.id, codigo_inventario: e.codigo_inventario, nombre: e.nombre };
const pub = (u) => u && { id: u.id, nombre: u.nombre, email: u.email };
function log(s, accion, descripcion, user, ant = null, nue = null) { historial.unshift({ id: nextHist++, solicitud_id: s.id, accion, descripcion, estado_anterior: ant, estado_nuevo: nue, usuario: user && { id: user.id, nombre: user.nombre }, created_at: now() }); }
function crearSol(user, b) { const s = { id: nextSol++, titulo: b.titulo, descripcion: b.descripcion, prioridad: b.prioridad, equipo_id: b.equipo_id, categoria: categorias.find((c) => c.id === b.categoria_id), estado: estados[0], solicitante: pub(user), tecnico: null, diagnostico: null, solucion: null, fecha_asignacion: null, fecha_cierre: null, created_at: now(), updated_at: now() }; solicitudes.unshift(s); log(s, 'creada', 'Solicitud creada', user, null, estados[0]); return s; }
crearSol(users[3], { titulo: 'La impresora no imprime', descripcion: 'Sale papel en blanco desde ayer', prioridad: 'alta', equipo_id: 3, categoria_id: 8 });
crearSol(users[3], { titulo: 'Sin internet en recepción', descripcion: 'No hay conexión a la red cableada', prioridad: 'critica', equipo_id: 4, categoria_id: 7 });
const solOut = (s, full) => ({ ...s, equipo: resumenEq(equipos.find((e) => e.id === s.equipo_id)), equipo_id: undefined, historial: full ? historial.filter((h) => h.solicitud_id === s.id).slice().reverse() : undefined });
const tokens = {};
function paginate(arr, q, map = (x) => x) { const per = Number(q.per_page || 10), page = Number(q.page || 1), last = Math.max(1, Math.ceil(arr.length / per)); return { data: arr.slice((page - 1) * per, page * per).map(map), meta: { current_page: page, last_page: last, per_page: per, total: arr.length } }; }
function visibles(user) { if (user.rol.slug === 'admin') return solicitudes; if (user.rol.slug === 'tecnico') return solicitudes.filter((s) => s.tecnico?.id === user.id || s.solicitante?.id === user.id); return solicitudes.filter((s) => s.solicitante?.id === user.id); }
function validarEquipo(b, id) { const e = {}; if (!b.codigo_inventario) e.codigo_inventario = ['El campo código de inventario es obligatorio.']; else if (equipos.some((x) => x.codigo_inventario === b.codigo_inventario && x.id !== id)) e.codigo_inventario = ['El código de inventario ya ha sido registrado.']; if (!b.nombre) e.nombre = ['El campo nombre es obligatorio.']; if (!b.categoria_id) e.categoria_id = ['El campo categoría es obligatorio.']; return e; }
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); res.setHeader('Access-Control-Allow-Headers', '*'); res.setHeader('Access-Control-Allow-Methods', '*');
  if (req.method === 'OPTIONS') return res.end();
  let body = ''; req.on('data', (c) => (body += c)); req.on('end', () => {
    const url = new URL(req.url, 'http://x'); const q = Object.fromEntries(url.searchParams); const b = body ? JSON.parse(body) : {}; const p = url.pathname.replace(/^\/api/, '');
    const send = (code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(obj)); };
    console.log(req.method, req.url);
    if (p === '/login' && req.method === 'POST') { const u = users.find((x) => x.email === b.email); if (!u || b.password !== 'password') return send(422, { message: 'Las credenciales no son válidas.', errors: { email: ['Las credenciales no son válidas.'] } }); const t = 'tok' + Math.random(); tokens[t] = u; return send(200, { token: t, user: u }); }
    const user = tokens[(req.headers.authorization || '').replace('Bearer ', '')]; if (!user) return send(401, { message: 'Unauthenticated.' });
    let m;
    if (p === '/logout') { return send(200, { message: 'ok' }); }
    if (p === '/me') return send(200, { data: user });
    if (p === '/dashboard') { const vs = visibles(user); return send(200, { data: { equipos_total: equipos.length, solicitudes_total: vs.length, solicitudes_abiertas: vs.filter((s) => !s.estado.es_final).length, mis_asignadas: user.rol.slug === 'tecnico' ? vs.filter((s) => s.tecnico?.id === user.id).length : vs.filter((s) => s.tecnico).length, por_estado: estados.map((e) => ({ id: e.id, nombre: e.nombre, slug: e.slug, color: e.color, total: vs.filter((s) => s.estado.id === e.id).length })), recientes: vs.slice(0, 5).map((s) => solOut(s)) } }); }
    if (p === '/categorias') return send(200, { data: categorias.filter((c) => !q.tipo || c.tipo === q.tipo) });
    if (p === '/estados') return send(200, { data: estados });
    if (p === '/tecnicos') return send(200, { data: users.filter((u) => u.rol.slug === 'tecnico') });
    if (p === '/inventario') { const g = (f) => Object.entries(equipos.reduce((a, e) => ((a[f(e)] = (a[f(e)] || 0) + 1), a), {})); return send(200, { data: { total: equipos.length, por_categoria: g((e) => e.categoria.nombre).map(([n, t], i) => ({ id: i, nombre: n, total: t })), por_estado: g((e) => e.estado).map(([n, t]) => ({ estado: n, total: t })), por_ubicacion: g((e) => e.ubicacion).map(([n, t]) => ({ ubicacion: n, total: t })) } }); }
    if (p === '/equipos' && req.method === 'GET') { let l = equipos.slice().reverse(); if (q.search) l = l.filter((e) => JSON.stringify(e).toLowerCase().includes(q.search.toLowerCase())); if (q.estado) l = l.filter((e) => e.estado === q.estado); return send(200, paginate(l, q)); }
    if (p === '/equipos' && req.method === 'POST') { if (user.rol.slug === 'usuario') return send(403, { message: 'This action is unauthorized.' }); const e = validarEquipo(b); if (Object.keys(e).length) return send(422, { message: Object.values(e)[0][0], errors: e }); const eq = { ...b, id: nextEq++, categoria: categorias.find((c) => c.id === b.categoria_id), created_at: now(), updated_at: now() }; equipos.push(eq); return send(201, { data: eq }); }
    if ((m = p.match(/^\/equipos\/(\d+)$/))) { const eq = equipos.find((e) => e.id === +m[1]); if (!eq) return send(404, { message: 'Equipo no encontrado.' }); if (req.method === 'GET') return send(200, { data: { ...eq, solicitudes: solicitudes.filter((s) => s.equipo_id === eq.id).map((s) => solOut(s)) } }); if (req.method === 'PUT') { const e = validarEquipo(b, eq.id); if (Object.keys(e).length) return send(422, { message: Object.values(e)[0][0], errors: e }); Object.assign(eq, b, { categoria: categorias.find((c) => c.id === b.categoria_id), updated_at: now() }); return send(200, { data: eq }); } if (req.method === 'DELETE') { equipos = equipos.filter((e) => e !== eq); return send(204, {}); } }
    if (p === '/solicitudes' && req.method === 'GET') { let l = visibles(user); if (q.estado_id) l = l.filter((s) => s.estado.id === +q.estado_id); if (q.asignadas_a_mi) l = l.filter((s) => s.tecnico?.id === user.id); if (q.search) l = l.filter((s) => (s.id + s.titulo).toLowerCase().includes(q.search.toLowerCase())); return send(200, paginate(l, q, (s) => solOut(s))); }
    if (p === '/solicitudes' && req.method === 'POST') { const e = {}; if (!b.equipo_id) e.equipo_id = ['El campo equipo es obligatorio.']; if (!b.titulo) e.titulo = ['El campo título es obligatorio.']; if (Object.keys(e).length) return send(422, { message: 'Datos inválidos', errors: e }); return send(201, { data: solOut(crearSol(user, b), true) }); }
    if ((m = p.match(/^\/solicitudes\/(\d+)(\/\w+)?$/))) { const s = solicitudes.find((x) => x.id === +m[1]); if (!s || !visibles(user).includes(s)) return send(404, { message: 'Solicitud no encontrada.' }); const act = m[2];
      if (!act) return send(200, { data: solOut(s, true) });
      if (act === '/asignar') { if (user.rol.slug !== 'admin') return send(403, { message: 'Solo un administrador puede asignar técnicos.' }); const t = users.find((u) => u.id === b.tecnico_id && u.rol.slug === 'tecnico'); if (!t) return send(422, { message: 'Técnico inválido', errors: { tecnico_id: ['Técnico inválido'] } }); const ant = s.estado; s.tecnico = pub(t); s.fecha_asignacion = now(); if (s.estado.slug === 'abierta') s.estado = estados[1]; log(s, 'asignada', `Asignada a ${t.nombre}`, user, ant !== s.estado ? ant : null, ant !== s.estado ? s.estado : null); return send(200, { data: solOut(s, true) }); }
      if (act === '/diagnostico') { s.diagnostico = b.diagnostico; s.solucion = b.solucion || null; const ant = s.estado; if (b.estado_id) s.estado = estados.find((e) => e.id === b.estado_id); log(s, 'diagnostico', `Diagnóstico: ${b.diagnostico}` + (b.solucion ? `. Solución: ${b.solucion}` : ''), user, b.estado_id ? ant : null, b.estado_id ? s.estado : null); if (s.estado.es_final) s.fecha_cierre = now(); return send(200, { data: solOut(s, true) }); }
      if (act === '/estado') { const ant = s.estado; s.estado = estados.find((e) => e.id === b.estado_id); if (s.estado.es_final) s.fecha_cierre = now(); log(s, 'estado', b.comentario || 'Cambio de estado', user, ant, s.estado); return send(200, { data: solOut(s, true) }); } }
    if (p === '/historial') { const ids = visibles(user).map((s) => s.id); return send(200, paginate(historial.filter((h) => ids.includes(h.solicitud_id)), q, (h) => { const s = solicitudes.find((x) => x.id === h.solicitud_id); return { ...h, solicitud: { id: s.id, titulo: s.titulo, equipo: resumenEq(equipos.find((e) => e.id === s.equipo_id)) } }; })); }
    send(404, { message: 'Ruta no encontrada' });
  });
});
const PORT = process.env.PORT || 8787;
server.listen(PORT, '0.0.0.0', () => console.log('API simulada en http://localhost:' + PORT + '/api'));

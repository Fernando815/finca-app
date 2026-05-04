/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

// ── Paleta ────────────────────────────────────────────────────
const G = {
  verde: "#2d6a4f", verdeMed: "#40916c", verdeClaro: "#52b788",
  verdeFondo: "#d8f3dc", verdeLight: "#f0faf3",
  rojo: "#c0392b", rojFondo: "#fdf2f2",
  amber: "#d97706", amberFondo: "#fffbeb",
  azul: "#2563eb", morado: "#7c3aed",
  gris: "#6b7280", grisClar: "#d1d5db", grisFondo: "#f9fafb",
  negro: "#111827", blanco: "#ffffff",
};

// ── Helpers ──────────────────────────────────────────────────
function fmtDate(d?: string | Date | null): string {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (isNaN(dt.getTime())) return "—";
  return `${String(dt.getDate()).padStart(2,"0")}/${String(dt.getMonth()+1).padStart(2,"0")}/${dt.getFullYear()}`;
}
function cap(s?: string | null): string {
  if (!s) return "—";
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase().replace(/_/g," ");
}

const ANIMAL_C: Record<string,string> = {
  ACTIVO:G.verde, ENFERMO:G.rojo, EN_TRATAMIENTO:G.amber,
  PRENADA:G.azul, VENDIDO:G.gris, MUERTO:"#374151", EN_CELO:G.morado, SECO:G.amber,
};
const TAREA_C: Record<string,string> = {
  PENDIENTE:G.amber, EN_PROCESO:G.azul, COMPLETADA:G.verde, VENCIDA:G.rojo, CANCELADA:G.gris,
};
const PRIO_C: Record<string,string> = {
  BAJA:G.gris, MEDIA:G.azul, ALTA:G.amber, URGENTE:G.rojo,
};
const PASTO_C: Record<string,string> = {
  EXCELENTE:G.verde, BUENO:G.verdeClaro, REGULAR:G.amber, MALO:G.rojo, DESCANSANDO:G.azul,
};

// ── Estilos ──────────────────────────────────────────────────
// A4 LANDSCAPE usable width = 841.89 - 60 (padding) = 782px
// Cell padding = 4px each side = 8px total per cell
const S = StyleSheet.create({
  page:        { fontFamily:"Helvetica", fontSize:8, color:G.negro, paddingBottom:50, lineHeight:1.4 },
  content:     { paddingHorizontal:30 },
  // Portada
  coverPage:   { backgroundColor:G.verde },
  coverBody:   { flex:1, justifyContent:"center", alignItems:"center", paddingHorizontal:50 },
  coverApp:    { fontSize:34, fontFamily:"Helvetica-Bold", color:G.blanco, letterSpacing:3, marginBottom:6 },
  coverTag:    { fontSize:10, color:G.verdeFondo, letterSpacing:1, marginBottom:48 },
  coverLine:   { width:180, height:2, backgroundColor:G.verdeClaro, marginBottom:26 },
  coverLabel:  { fontSize:10, fontFamily:"Helvetica-Bold", color:G.verdeFondo, letterSpacing:2, marginBottom:8 },
  coverName:   { fontSize:28, fontFamily:"Helvetica-Bold", color:G.blanco, textAlign:"center", marginBottom:20 },
  coverDate:   { fontSize:9, color:G.verdeFondo, marginBottom:4 },
  coverEnf:    { fontSize:8, color:G.verdeClaro, marginTop:6 },
  coverBtm:    { backgroundColor:G.verdeMed, paddingVertical:14, paddingHorizontal:30, flexDirection:"row", justifyContent:"space-between" },
  coverBtmT:   { fontSize:7.5, color:G.verdeFondo },
  // Encabezado de página
  hdr:         { backgroundColor:G.verde, paddingHorizontal:30, paddingVertical:10, flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom:18 },
  hdrL:        { color:G.blanco, fontFamily:"Helvetica-Bold", fontSize:7.5 },
  hdrR:        { color:G.verdeFondo, fontSize:7 },
  // Títulos
  secT:        { fontSize:12, fontFamily:"Helvetica-Bold", color:G.verde, marginBottom:10, marginTop:14, paddingBottom:4, borderBottomWidth:1.5, borderBottomColor:G.verdeClaro },
  subT:        { fontSize:8.5, fontFamily:"Helvetica-Bold", color:G.gris, marginBottom:5, marginTop:10 },
  divider:     { borderBottomWidth:0.5, borderBottomColor:G.grisClar, marginVertical:10 },
  // Stats
  statsRow:    { flexDirection:"row", marginBottom:14 },
  statBox:     { flex:1, marginHorizontal:3, backgroundColor:G.verdeLight, borderRadius:6, padding:9, alignItems:"center", borderWidth:1, borderColor:G.verdeFondo },
  statNum:     { fontSize:20, fontFamily:"Helvetica-Bold", color:G.verde },
  statLbl:     { fontSize:6, color:G.gris, marginTop:2, textAlign:"center" },
  // Alerta
  alertBox:    { backgroundColor:G.rojFondo, borderRadius:5, borderWidth:1, borderColor:"#fecaca", padding:9, marginBottom:12 },
  alertTitle:  { fontSize:8.5, fontFamily:"Helvetica-Bold", color:G.rojo, marginBottom:5 },
  alertItem:   { flexDirection:"row", marginBottom:3, paddingLeft:5 },
  alertBullet: { fontSize:8, color:G.rojo, marginRight:4 },
  alertText:   { fontSize:7.5, flex:1 },
  // Barra — usa flex en lugar de % para evitar overflow
  barRow:      { flexDirection:"row", alignItems:"center", marginBottom:4 },
  barLabel:    { fontSize:7.5, width:150, color:G.negro },
  barTrack:    { flex:1, flexDirection:"row", backgroundColor:"#e5e7eb", borderRadius:3, height:8, marginHorizontal:5, overflow:"hidden" },
  barCount:    { fontSize:7.5, width:25, textAlign:"right", fontFamily:"Helvetica-Bold" },
  // Tabla — A4 landscape: 782px útiles, padding 8px/col
  // Total fijo + (N_cols * 8) + flex_sum * unitW = 782
  table:       { marginBottom:12 },
  thead:       { flexDirection:"row", backgroundColor:G.verde },
  tHeadCell:   { color:G.blanco, fontFamily:"Helvetica-Bold", fontSize:7, paddingVertical:5, paddingHorizontal:4 },
  tRow:        { flexDirection:"row", borderBottomWidth:0.5, borderBottomColor:"#e5e7eb" },
  tRowAlt:     { backgroundColor:G.grisFondo },
  tRowRed:     { backgroundColor:"#fef2f2" },
  tRowAmber:   { backgroundColor:"#fffbeb" },
  tRowGreen:   { backgroundColor:"#f0faf3" },
  tCell:       { fontSize:7.5, paddingVertical:4, paddingHorizontal:4, color:G.negro },
  tCellBold:   { fontFamily:"Helvetica-Bold" },
  tCellEmpty:  { fontSize:7.5, color:G.gris, textAlign:"center", flex:1, padding:10 },
  // Dos columnas
  twoCol:      { flexDirection:"row" },
  col:         { flex:1, paddingHorizontal:3 },
  // Footer
  footer:      { position:"absolute", bottom:16, left:30, right:30, borderTopWidth:0.5, borderTopColor:G.grisClar, paddingTop:5, flexDirection:"row", justifyContent:"space-between" },
  footerT:     { fontSize:6.5, color:G.gris },
});

// ── Sub-componentes ──────────────────────────────────────────
function Hdr({ f, s }: { f:string; s:string }) {
  return (
    <View style={S.hdr} fixed>
      <Text style={S.hdrL}>{f.toUpperCase()} · REPORTE GENERAL</Text>
      <Text style={S.hdrR}>{s.toUpperCase()}</Text>
    </View>
  );
}
function Foot({ f, fecha }: { f:string; fecha:string }) {
  return (
    <View style={S.footer} fixed>
      <Text style={S.footerT}>FincaApp · {f} · Generado el {fecha}</Text>
      <Text style={S.footerT} render={({pageNumber,totalPages})=>`Página ${pageNumber} de ${totalPages}`} />
    </View>
  );
}
function SecT({ v }:{ v:string }) { return <Text style={S.secT}>{v}</Text>; }
function SubT({ v }:{ v:string }) { return <Text style={S.subT}>{v}</Text>; }
function Div() { return <View style={S.divider} />; }

// Bar con flex en lugar de % — evita overflow
function Bar({ label, value, total, color }:{ label:string; value:number; total:number; color:string }) {
  const pct = total > 0 ? Math.max(0, Math.min(100, Math.round((value/total)*100))) : 0;
  return (
    <View style={S.barRow}>
      <Text style={S.barLabel}>{label}</Text>
      <View style={S.barTrack}>
        {pct > 0 && <View style={{ flex:pct, backgroundColor:color, height:8 }} />}
        {pct < 100 && <View style={{ flex:100-pct, height:8 }} />}
      </View>
      <Text style={[S.barCount, { color }]}>{value}</Text>
    </View>
  );
}

// Tipo de celda
type Cell = string | null | undefined | { v:string; c?:string; bold?:boolean };

// Definición de columna — ancho explícito para evitar overflow
// REGLA: sum(w) + sum(flex)*unitW + N*8 <= 535
interface Col { label:string; w?:number; f?:number }

function Table({ cols, rows, rowBg }:{
  cols:Col[];
  rows:Cell[][];
  rowBg?:(i:number)=>any;
}) {
  const cStyle = (c:Col) => c.w ? { width:c.w, flex:0 } : { flex:c.f ?? 1 };
  return (
    <View style={S.table}>
      <View style={S.thead}>
        {cols.map((c,i)=><Text key={i} style={[S.tHeadCell, cStyle(c)]}>{c.label}</Text>)}
      </View>
      {rows.length===0
        ? <View style={S.tRow}><Text style={S.tCellEmpty}>Sin datos registrados</Text></View>
        : rows.map((row,ri)=>{
            const extra = rowBg ? rowBg(ri) : undefined;
            return (
              <View key={ri} style={[S.tRow, ri%2===1?S.tRowAlt:{}, extra??{}]} wrap={false}>
                {row.map((cell,ci)=>{
                  const c = cols[ci];
                  if (!c) return null;
                  if (!cell || typeof cell==="string") {
                    return <Text key={ci} style={[S.tCell, cStyle(c)]}>{cell||"—"}</Text>;
                  }
                  return (
                    <Text key={ci} style={[S.tCell, cStyle(c), cell.c?{color:cell.c}:{}, cell.bold?S.tCellBold:{}]}>
                      {cell.v||"—"}
                    </Text>
                  );
                })}
              </View>
            );
          })
      }
    </View>
  );
}

// ── DOCUMENTO ────────────────────────────────────────────────
export function ReportePDF({ data }:{ data:any }) {
  const {
    finca, hoy,
    totalAnimales, animalesPorEstado, animalesPorTipo,
    totalCultivos, cultivosPorTipo,
    totalTareas, tareasPorEstado,
    tareasProximas, tareasVencidas,
    totalPotreros, potreros,
    laboresRecientes, movimientosRecientes,
    totalPeones, peonesPorEstado,
    totalInventario, stockBajo, mantVencido, mantProximo,
    animalesLista=[],
    tareasLista=[],
    peonesLista=[],
    cultivosLista=[],
    inventarioLista=[],
    historialReciente=[],
  } = data;

  const fecha = fmtDate(hoy);
  const alertas = tareasVencidas.length + stockBajo.length + mantVencido.length;
  const tareasActivas = tareasLista.filter((t:any)=>!["COMPLETADA","CANCELADA"].includes(t.estado));

  return (
    <Document title={`Reporte — ${finca.nombre}`} author="FincaApp" subject="Reporte General de Finca">

      {/* ══ PORTADA ══════════════════════════════════════════ */}
      <Page size="A4" orientation="landscape" style={[S.page, S.coverPage]}>
        <View style={S.coverBody}>
          <Text style={S.coverApp}>FINCAAPP</Text>
          <Text style={S.coverTag}>Sistema Integral de Gestión Agropecuaria</Text>
          <View style={S.coverLine} />
          <Text style={S.coverLabel}>REPORTE GENERAL DE FINCA</Text>
          <Text style={S.coverName}>{finca.nombre}</Text>
          <Text style={S.coverDate}>Generado el {fecha}</Text>
          {finca.provincia&&<Text style={S.coverDate}>{finca.provincia}{finca.canton?` · ${finca.canton}`:""}</Text>}
          <Text style={S.coverEnf}>
            Enfoque: {cap(finca.enfoque)}{finca.areaTotal?`  ·  Área total: ${finca.areaTotal} ha`:""}
          </Text>
        </View>
        <View style={S.coverBtm}>
          <Text style={S.coverBtmT}>Documento confidencial — Uso interno</Text>
          <Text style={S.coverBtmT}>FincaApp · Costa Rica</Text>
        </View>
      </Page>

      {/* ══ RESUMEN EJECUTIVO ════════════════════════════════ */}
      <Page size="A4" orientation="landscape" style={S.page}>
        <Hdr f={finca.nombre} s="Resumen Ejecutivo" />
        <View style={S.content}>
          <SecT v="📊 Resumen Ejecutivo" />

          {/* Estadísticas — 6 cajas en fila */}
          <View style={S.statsRow}>
            {[
              {label:"Animales",   v:totalAnimales,    c:G.verde},
              {label:"Cultivos",   v:totalCultivos,    c:"#059669"},
              {label:"Tareas",     v:totalTareas,      c:G.azul},
              {label:"Potreros",   v:totalPotreros,    c:G.amber},
              {label:"Peones",     v:totalPeones,      c:G.morado},
              {label:"Inventario", v:totalInventario,  c:"#ea580c"},
            ].map(s=>(
              <View key={s.label} style={S.statBox}>
                <Text style={[S.statNum,{color:s.c}]}>{s.v}</Text>
                <Text style={S.statLbl}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Alertas */}
          {alertas>0&&(
            <View style={S.alertBox}>
              <Text style={S.alertTitle}>⚠  {alertas} alerta{alertas!==1?"s":""} activa{alertas!==1?"s":""}</Text>
              {tareasVencidas.slice(0,4).map((t:any)=>(
                <View key={t.id} style={S.alertItem}>
                  <Text style={S.alertBullet}>•</Text>
                  <Text style={[S.alertText,{color:G.rojo}]}>Tarea vencida: {t.titulo}</Text>
                </View>
              ))}
              {stockBajo.slice(0,3).map((i:any)=>(
                <View key={i.id} style={S.alertItem}>
                  <Text style={S.alertBullet}>•</Text>
                  <Text style={[S.alertText,{color:G.amber}]}>Stock bajo: {i.nombre} — {i.cantidad}/{i.cantidadMinima} {i.unidad}</Text>
                </View>
              ))}
              {mantVencido.slice(0,3).map((i:any)=>(
                <View key={i.id} style={S.alertItem}>
                  <Text style={S.alertBullet}>•</Text>
                  <Text style={[S.alertText,{color:G.morado}]}>Mant. vencido: {i.nombre} — {fmtDate(i.proximoMantenimiento)}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Barras en 2 columnas */}
          <View style={S.twoCol}>
            <View style={S.col}>
              <SubT v="Animales por estado" />
              {animalesPorEstado.map((g:any)=>(
                <Bar key={g.estado} label={cap(g.estado)} value={g._count._all} total={totalAnimales} color={ANIMAL_C[g.estado]??G.gris} />
              ))}
              {!animalesPorEstado.length&&<Text style={{fontSize:7,color:G.gris}}>Sin datos</Text>}
            </View>
            <View style={S.col}>
              <SubT v="Animales por tipo" />
              {animalesPorTipo.map((g:any)=>(
                <Bar key={g.tipo} label={cap(g.tipo)} value={g._count._all} total={totalAnimales} color={G.verdeClaro} />
              ))}
              {!animalesPorTipo.length&&<Text style={{fontSize:7,color:G.gris}}>Sin datos</Text>}
            </View>
          </View>
          <Div />
          <View style={S.twoCol}>
            <View style={S.col}>
              <SubT v="Tareas por estado" />
              {tareasPorEstado.map((g:any)=>(
                <Bar key={g.estado} label={cap(g.estado)} value={g._count._all} total={totalTareas} color={TAREA_C[g.estado]??G.gris} />
              ))}
            </View>
            <View style={S.col}>
              <SubT v="Cultivos por tipo" />
              {cultivosPorTipo.map((g:any)=>(
                <Bar key={g.tipo} label={cap(g.tipo)} value={g._count._all} total={totalCultivos} color="#059669" />
              ))}
            </View>
          </View>
          {mantProximo.length>0&&(<>
            <Div />
            <SubT v={`🔔 Mantenimiento próximo (7 días) — ${mantProximo.length} item${mantProximo.length!==1?"s":""}`} />
            {mantProximo.map((i:any)=>(
              <View key={i.id} style={[S.alertItem,{marginBottom:3}]}>
                <Text style={[S.alertBullet,{color:G.morado}]}>•</Text>
                <Text style={[S.alertText,{color:G.morado}]}>{i.nombre} — {fmtDate(i.proximoMantenimiento)}</Text>
              </View>
            ))}
          </>)}
        </View>
        <Foot f={finca.nombre} fecha={fecha} />
      </Page>

      {/* ══ ANIMALES ═════════════════════════════════════════ */}
      {/* Cols: Código(50)+Nombre(f2)+Tipo(f1)+Estado(f1)+Peso(50)+Edad(42) + 6*8=48 → flex=4: (535-142-48)/4=86px */}
      <Page size="A4" orientation="landscape" style={S.page}>
        <Hdr f={finca.nombre} s="Registro de Animales" />
        <View style={S.content}>
          <SecT v={`🐄 Animales registrados (${totalAnimales})`} />
          <Table
            cols={[
              {label:"Código",  w:50},
              {label:"Nombre",  f:2},
              {label:"Tipo",    f:1},
              {label:"Raza",    f:1},
              {label:"Estado",  f:1},
              {label:"Peso kg", w:50},
              {label:"Edad",    w:42},
            ]}
            rows={animalesLista.map((a:any)=>[
              a.codigo,
              a.nombre??"—",
              cap(a.tipo),
              a.raza??"—",
              {v:cap(a.estado), c:ANIMAL_C[a.estado]??G.negro, bold:true},
              a.pesoEstimado?`${a.pesoEstimado}`:"—",
              a.edadMeses?`${a.edadMeses}m`:"—",
            ])}
            rowBg={i=>{
              const a=animalesLista[i];
              if(!a) return undefined;
              if(a.estado==="ENFERMO") return S.tRowRed;
              if(a.estado==="EN_TRATAMIENTO") return S.tRowAmber;
              if(a.estado==="PRENADA") return S.tRowGreen;
            }}
          />

          {historialReciente.length>0&&(<>
            <SecT v="💉 Historial médico reciente" />
            {/* Cols: Animal(f1.5)+Tipo(f1)+Producto(f1.5)+Dosis(55)+Fecha(62)+Próxima(62) + 6*8=48 → flex=4: (535-179-48)/4=77px */}
            <Table
              cols={[
                {label:"Animal",   f:1.5},
                {label:"Tipo",     f:1},
                {label:"Producto", f:1.5},
                {label:"Dosis",    w:55},
                {label:"Fecha",    w:62},
                {label:"Próxima",  w:62},
              ]}
              rows={historialReciente.map((h:any)=>[
                h.animal?.nombre??h.animal?.codigo??"—",
                cap(h.tipo),
                h.producto??"—",
                h.dosis??"—",
                fmtDate(h.fecha),
                {v:fmtDate(h.proximaFecha), c:h.proximaFecha?G.azul:G.gris},
              ])}
            />
          </>)}
        </View>
        <Foot f={finca.nombre} fecha={fecha} />
      </Page>

      {/* ══ POTREROS ═════════════════════════════════════════ */}
      {/* Cols: Potrero(f1.5)+Área(55)+Cap(50)+Pasto(68)+Lote(f1.2)+Días(42)+Estado(58) + 7*8=56 → flex=2.7: (535-273-56)/2.7=76px */}
      <Page size="A4" orientation="landscape" style={S.page}>
        <Hdr f={finca.nombre} s="Potreros y Rotación" />
        <View style={S.content}>
          <SecT v={`🌿 Estado de potreros (${totalPotreros})`} />
          <Table
            cols={[
              {label:"Potrero",     f:1.5},
              {label:"Área (ha)",   w:55},
              {label:"Cap.",        w:40},
              {label:"Estado pasto",w:72},
              {label:"Lote activo", f:1.2},
              {label:"Días ocup.",  w:50},
              {label:"Estado",      w:58},
            ]}
            rows={potreros.map((p:any)=>{
              const mov=p.movimientos?.[0];
              let dias="—";
              if(mov?.fechaEntrada) dias=String(Math.floor((Date.now()-new Date(mov.fechaEntrada).getTime())/86400000));
              const libre=!mov;
              const diasNum=parseInt(dias);
              return [
                p.nombre,
                p.areHectareas?`${p.areHectareas}`:"—",
                p.capacidadAnimales?`${p.capacidadAnimales}`:"—",
                {v:cap(p.estadoPasto), c:PASTO_C[p.estadoPasto]??G.gris},
                mov?.lote?.nombre??"—",
                {v:dias, c:!libre&&diasNum>(p.diasOcupacionMaximo??7)?G.rojo:G.negro, bold:!libre&&diasNum>(p.diasOcupacionMaximo??7)},
                {v:libre?"Libre":"Ocupado", c:libre?G.verde:G.amber, bold:true},
              ];
            })}
            rowBg={i=>{
              const p=potreros[i];
              if(!p) return undefined;
              const mov=p.movimientos?.[0];
              if(mov?.fechaEntrada){
                const dias=Math.floor((Date.now()-new Date(mov.fechaEntrada).getTime())/86400000);
                if(dias>(p.diasOcupacionMaximo??7)) return S.tRowAmber;
              }
            }}
          />
          <SecT v="🔄 Últimos movimientos" />
          {/* Cols: Lote(f1.5)+Potrero(f1.5)+Entrada(68)+Salida(68)+Días(42)+Estado(58) + 6*8=48 → flex=3: (535-236-48)/3=84px */}
          <Table
            cols={[
              {label:"Lote",    f:1.5},
              {label:"Potrero", f:1.5},
              {label:"Entrada", w:68},
              {label:"Salida",  w:68},
              {label:"Días",    w:42},
              {label:"Estado",  w:58},
            ]}
            rows={movimientosRecientes.map((m:any)=>{
              const dias=m.diasEnPotrero?String(m.diasEnPotrero)
                :m.fechaEntrada?String(Math.floor((Date.now()-new Date(m.fechaEntrada).getTime())/86400000)):"—";
              return [
                m.lote?.nombre??"—",
                m.potrero?.nombre??"—",
                fmtDate(m.fechaEntrada),
                m.fechaSalida?fmtDate(m.fechaSalida):"—",
                dias,
                {v:m.fechaSalida?"Finalizado":"Activo", c:m.fechaSalida?G.gris:G.verde, bold:true},
              ];
            })}
          />
        </View>
        <Foot f={finca.nombre} fecha={fecha} />
      </Page>

      {/* ══ TAREAS ═══════════════════════════════════════════ */}
      {/* Cols: Tarea(f2.5)+Prioridad(58)+Estado(72)+Responsable(f1)+Fecha(68) + 5*8=40 → flex=3.5: (535-198-40)/3.5=85px */}
      <Page size="A4" orientation="landscape" style={S.page}>
        <Hdr f={finca.nombre} s="Gestión de Tareas" />
        <View style={S.content}>
          <SecT v={`✅ Tareas (${totalTareas} total)`} />
          {tareasVencidas.length>0&&(<>
            <SubT v={`⛔ Vencidas (${tareasVencidas.length}) — atención inmediata`} />
            <Table
              cols={[
                {label:"Tarea",        f:2.5},
                {label:"Prioridad",    w:58},
                {label:"Responsable",  f:1},
                {label:"Venció el",    w:68},
              ]}
              rows={tareasVencidas.map((t:any)=>[
                t.titulo,
                {v:t.prioridad, c:PRIO_C[t.prioridad]??G.gris, bold:true},
                t.peon?.nombre??"Sin asignar",
                {v:fmtDate(t.fechaLimite), c:G.rojo, bold:true},
              ])}
              rowBg={()=>S.tRowRed}
            />
          </>)}
          {tareasProximas.length>0&&(<>
            <SubT v={`📅 Próximas 7 días (${tareasProximas.length})`} />
            <Table
              cols={[
                {label:"Tarea",        f:2.5},
                {label:"Prioridad",    w:58},
                {label:"Estado",       w:72},
                {label:"Responsable",  f:1},
                {label:"Fecha límite", w:68},
              ]}
              rows={tareasProximas.map((t:any)=>[
                t.titulo,
                {v:t.prioridad, c:PRIO_C[t.prioridad]??G.gris, bold:true},
                {v:cap(t.estado), c:TAREA_C[t.estado]??G.negro},
                t.peon?.nombre??"Sin asignar",
                {v:fmtDate(t.fechaLimite), c:G.azul},
              ])}
            />
          </>)}
          <SubT v={`📋 Todas las activas (${tareasActivas.length})`} />
          <Table
            cols={[
              {label:"Tarea",       f:2.5},
              {label:"Prioridad",   w:58},
              {label:"Estado",      w:72},
              {label:"Responsable", f:1},
              {label:"Fecha lím.",  w:68},
            ]}
            rows={tareasActivas.map((t:any)=>[
              t.titulo,
              {v:t.prioridad, c:PRIO_C[t.prioridad]??G.gris, bold:true},
              {v:cap(t.estado), c:TAREA_C[t.estado]??G.negro, bold:true},
              t.peon?.nombre??"Sin asignar",
              fmtDate(t.fechaLimite),
            ])}
            rowBg={i=>{
              const t=tareasActivas[i];
              if(!t) return undefined;
              if(t.estado==="VENCIDA") return S.tRowRed;
              if(t.prioridad==="URGENTE") return S.tRowAmber;
            }}
          />
        </View>
        <Foot f={finca.nombre} fecha={fecha} />
      </Page>

      {/* ══ CULTIVOS ═════════════════════════════════════════ */}
      {/* Cols: Tipo(f1)+Parcela(f1)+Área(55)+Etapa(f1)+F.Siembra(68)+Estado(62) + 6*8=48 → flex=3: (535-185-48)/3=101px */}
      <Page size="A4" orientation="landscape" style={S.page}>
        <Hdr f={finca.nombre} s="Cultivos y Agricultura" />
        <View style={S.content}>
          <SecT v={`🌱 Cultivos registrados (${totalCultivos})`} />
          <Table
            cols={[
              {label:"Tipo",         f:1},
              {label:"Parcela",      f:1},
              {label:"Área (ha)",    w:55},
              {label:"Etapa",        f:1},
              {label:"F. siembra",   w:68},
              {label:"Estado",       w:62},
            ]}
            rows={cultivosLista.map((c:any)=>[
              cap(c.tipo),
              c.parcela?.nombre??"—",
              c.areaHectareas?`${c.areaHectareas}`:"—",
              cap(c.etapa),
              fmtDate(c.fechaSiembra),
              {v:cap(c.estado), c:c.estado==="ACTIVO"?G.verde:c.estado==="PERDIDO"?G.rojo:G.gris, bold:true},
            ])}
          />
          <SecT v="🌾 Últimas labores agrícolas" />
          {/* Cols: Labor(f1.5)+Cultivo(f1)+Fecha(62)+Producto(f1)+Cantidad(58)+Costo(58) + 6*8=48 → flex=3.5: (535-178-48)/3.5=88px */}
          <Table
            cols={[
              {label:"Labor",    f:1.5},
              {label:"Cultivo",  f:1},
              {label:"Fecha",    w:62},
              {label:"Producto", f:1},
              {label:"Cantidad", w:58},
              {label:"Costo",    w:58},
            ]}
            rows={laboresRecientes.map((l:any)=>[
              cap((l.tipo??"").replace(/_/g," ")),
              cap(l.cultivo?.tipo??""),
              fmtDate(l.fecha),
              l.producto??"—",
              l.cantidad?`${l.cantidad} ${l.unidad??""}`.trim():"—",
              l.costo?`₡${Number(l.costo).toLocaleString()}`:"—",
            ])}
          />
        </View>
        <Foot f={finca.nombre} fecha={fecha} />
      </Page>

      {/* ══ INVENTARIO ══════════════════════════════════════ */}
      {/* Cols: Nombre(f2)+Categoría(f1.2)+Cant./Mín.(65)+Unidad(50)+Estado(68)+Próx.Mant.(70) + 6*8=48 → flex=3.2: (535-253-48)/3.2=73px */}
      <Page size="A4" orientation="landscape" style={S.page}>
        <Hdr f={finca.nombre} s="Inventario y Mantenimiento" />
        <View style={S.content}>
          <SecT v={`🔧 Inventario (${totalInventario} items)`} />
          {(stockBajo.length>0||mantVencido.length>0)&&(
            <View style={S.alertBox}>
              <Text style={S.alertTitle}>⚠  Alertas de inventario</Text>
              {stockBajo.map((i:any)=>(
                <View key={i.id} style={S.alertItem}>
                  <Text style={S.alertBullet}>•</Text>
                  <Text style={[S.alertText,{color:G.amber}]}>Stock bajo: {i.nombre} — Actual {i.cantidad} · Mín {i.cantidadMinima} {i.unidad}</Text>
                </View>
              ))}
              {mantVencido.map((i:any)=>(
                <View key={i.id} style={S.alertItem}>
                  <Text style={S.alertBullet}>•</Text>
                  <Text style={[S.alertText,{color:G.rojo}]}>Mant. vencido: {i.nombre} — Venció {fmtDate(i.proximoMantenimiento)}</Text>
                </View>
              ))}
            </View>
          )}
          <Table
            cols={[
              {label:"Nombre",     f:2},
              {label:"Categoría",  f:1.2},
              {label:"Cant./Mín.", w:65},
              {label:"Unidad",     w:50},
              {label:"Estado",     w:68},
              {label:"Próx. Mant.",w:70},
            ]}
            rows={inventarioLista.map((i:any)=>{
              const bajo=i.cantidadMinima!=null&&i.cantidad<i.cantidadMinima;
              const venc=i.proximoMantenimiento&&new Date(i.proximoMantenimiento)<new Date(hoy);
              const cantMin=i.cantidadMinima!=null?`${i.cantidad}/${i.cantidadMinima}`:`${i.cantidad}`;
              return [
                {v:i.nombre, bold:bajo},
                cap((i.categoria??"").replace(/_/g," ")),
                {v:cantMin, c:bajo?G.rojo:G.negro, bold:bajo},
                i.unidad??"—",
                {v:cap((i.estado??"").replace(/_/g," ")), c:i.estado==="BUENO"?G.verde:i.estado==="REGULAR"?G.amber:G.rojo, bold:true},
                {v:fmtDate(i.proximoMantenimiento), c:venc?G.rojo:mantProximo.find((m:any)=>m.id===i.id)?G.amber:G.negro, bold:venc},
              ];
            })}
            rowBg={i=>{
              const item=inventarioLista[i];
              if(!item) return undefined;
              const bajo=item.cantidadMinima!=null&&item.cantidad<item.cantidadMinima;
              const venc=item.proximoMantenimiento&&new Date(item.proximoMantenimiento)<new Date(hoy);
              if(venc) return S.tRowRed;
              if(bajo) return S.tRowAmber;
            }}
          />
        </View>
        <Foot f={finca.nombre} fecha={fecha} />
      </Page>

      {/* ══ PEONES ═══════════════════════════════════════════ */}
      {/* Cols: Nombre(f2)+Cargo(f1.2)+Teléfono(f1)+Salario(68)+F.Contrato(72)+Estado(65) + 6*8=48 → flex=4.2: (535-205-48)/4.2=67px */}
      {totalPeones>0&&(
        <Page size="A4" orientation="landscape" style={S.page}>
          <Hdr f={finca.nombre} s="Personal de la Finca" />
          <View style={S.content}>
            <SecT v={`👷 Personal de la finca (${totalPeones})`} />
            <View style={[S.statsRow,{marginBottom:16}]}>
              {peonesPorEstado.map((g:any)=>(
                <View key={g.estado} style={[S.statBox,{flex:0,minWidth:90,marginHorizontal:4}]}>
                  <Text style={[S.statNum,{fontSize:18}]}>{g._count._all}</Text>
                  <Text style={S.statLbl}>{cap(g.estado)}</Text>
                </View>
              ))}
            </View>
            <Table
              cols={[
                {label:"Nombre",     f:2},
                {label:"Cargo",      f:1.2},
                {label:"Teléfono",   f:1},
                {label:"Salario",    w:68},
                {label:"Contratado", w:72},
                {label:"Estado",     w:65},
              ]}
              rows={peonesLista.map((p:any)=>[
                p.nombre,
                cap(p.cargo),
                p.telefono??"—",
                p.salario?`₡${Number(p.salario).toLocaleString()}`:"—",
                fmtDate(p.fechaContratacion),
                {v:cap(p.estado), c:p.estado==="ACTIVO"?G.verde:p.estado==="VACACIONES"?G.azul:G.gris, bold:true},
              ])}
              rowBg={i=>{
                const p=peonesLista[i];
                if(p?.estado==="INACTIVO"||p?.estado==="RETIRADO") return S.tRowRed;
              }}
            />
          </View>
          <Foot f={finca.nombre} fecha={fecha} />
        </Page>
      )}

      {/* ══ CONTRAPORTADA ════════════════════════════════════ */}
      <Page size="A4" orientation="landscape" style={[S.page, S.coverPage]}>
        <View style={[S.coverBody,{justifyContent:"flex-end",paddingBottom:90}]}>
          <Text style={S.coverApp}>FINCAAPP</Text>
          <Text style={[S.coverTag,{marginBottom:28}]}>Sistema Integral de Gestión Agropecuaria</Text>
          <View style={S.coverLine} />
          <Text style={[S.coverDate,{marginTop:22}]}>Reporte generado automáticamente el {fecha}</Text>
          <Text style={[S.coverDate,{marginTop:5}]}>para la finca: {finca.nombre}</Text>
          <Text style={[S.coverDate,{marginTop:5,color:G.verdeClaro}]}>
            Este documento contiene información confidencial. Uso exclusivo del propietario.
          </Text>
        </View>
        <View style={S.coverBtm}>
          <Text style={S.coverBtmT}>© FincaApp — Todos los derechos reservados</Text>
          <Text style={S.coverBtmT}>Costa Rica</Text>
        </View>
      </Page>
    </Document>
  );
}


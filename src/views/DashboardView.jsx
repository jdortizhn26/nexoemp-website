import { useMemo } from "react";
import { L, today } from "../lib/helpers";
import { KCard, Card, Section } from "../components/ui";
import { INGREDIENTS, PENDING_BANK } from "../lib/catalog";
import { filterByScope, filterBranches } from "../lib/permissions";

export function DashboardView({data,goto,onImport,onTV,isAdmin,userRole}) {
  // Scope del usuario: filtrar ventas y sucursales visibles
  data = {
    ...data,
    sales: filterByScope(userRole, data?.sales || [], "branchId"),
    branches: filterBranches(userRole, data?.branches || []),
  };
  const td = today();
  const thisMonth = td.slice(0,7); // "2026-04"

  const todayS = data.sales.filter(s=>s.date===td);
  const allS   = data.sales;
  const monthS = allS.filter(s=>s.date.startsWith(thisMonth));

  const kpi = (arr) => ({
    sales:    arr.reduce((a,s)=>a+s.totalSales,0),
    expenses: arr.reduce((a,s)=>a+s.totalExpenses,0),
    deposited:arr.reduce((a,s)=>a+s.totalDeposited,0),
  });
  const tkpi = kpi(todayS), akpi = kpi(allS), mkpi = kpi(monthS);

  // ── Costo real del día (si hay recetas cargadas) ──────────────────────────
  const realCostToday = useMemo(()=>{
    if(!data.recipes||Object.keys(data.recipes).length===0) return null;
    let cogs=0, covered=0, total=0;
    todayS.forEach(s=>s.items.forEach(it=>{
      total+=it.total;
      const r=data.recipes[it.productId];
      if(r&&r.ingredients){
        const unitCost=r.ingredients.reduce((a,i)=>a+(Number(i.qty)*Number(i.costPerUnit)),0);
        cogs+=unitCost*it.qty; covered+=it.total;
      }
    }));
    if(cogs===0) return null;
    return {cogs,covered,pct:covered>0?((covered-cogs)/covered*100):0};
  },[todayS,data.recipes]);

  // ── Comparativo esta semana vs semana pasada ──────────────────────────────
  const weekCompare = useMemo(()=>{
    const now = new Date();
    const dow  = now.getDay(); // 0=Dom
    const startThis = new Date(now); startThis.setDate(now.getDate()-dow); startThis.setHours(0,0,0,0);
    const startLast = new Date(startThis); startLast.setDate(startThis.getDate()-7);
    const endLast   = new Date(startThis); endLast.setDate(startThis.getDate()-1);

    const fmtD = d => d.toISOString().split("T")[0];
    const thisWeekS = allS.filter(s=>s.date>=fmtD(startThis)&&s.date<=td);
    const lastWeekS = allS.filter(s=>s.date>=fmtD(startLast)&&s.date<=fmtD(endLast));

    const days=["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
    return days.map((d,i)=>{
      const tw = thisWeekS.filter(s=>new Date(s.date+"T12:00:00").getDay()===i).reduce((a,s)=>a+s.totalSales,0);
      const lw = lastWeekS.filter(s=>new Date(s.date+"T12:00:00").getDay()===i).reduce((a,s)=>a+s.totalSales,0);
      return {day:d,this:tw,last:lw};
    }).filter((_,i)=>i<=dow); // Solo días transcurridos
  },[allS,td]);

  // ── Metas del mes ─────────────────────────────────────────────────────────
  const branchGoals = useMemo(()=>{
    return data.branches.map(b=>{
      const goal  = b.goals?.[thisMonth] || 0;
      const sales = monthS.filter(s=>s.branchId===b.id).reduce((a,s)=>a+s.totalSales,0);
      const pct   = goal>0 ? Math.min((sales/goal)*100,100) : 0;
      return {b,goal,sales,pct};
    }).filter(bg=>bg.goal>0);
  },[data.branches,monthS,thisMonth]);

  // ── Top products & branch stats ───────────────────────────────────────────
  const topProd = useMemo(()=>{
    const m={};
    allS.forEach(s=>s.items.forEach(it=>{
      if(!m[it.productId])m[it.productId]={name:it.productName,qty:0,rev:0};
      m[it.productId].qty+=it.qty; m[it.productId].rev+=it.total;
    }));
    return Object.values(m).sort((a,b)=>b.rev-a.rev).slice(0,8);
  },[allS]);

  const branchStats = data.branches.map(b=>{
    const bs=allS.filter(s=>s.branchId===b.id);
    return {b,sales:bs.reduce((a,s)=>a+s.totalSales,0),exp:bs.reduce((a,s)=>a+s.totalExpenses,0),n:bs.length};
  });

  const recent=[...allS].sort((a,b)=>b.submittedAt.localeCompare(a.submittedAt)).slice(0,6);
  const maxWeek = Math.max(...weekCompare.map(w=>Math.max(w.this,w.last)),1);

  // ── Operaciones & Inventario (solo admin) ───────────────────────────────
  const ops = useMemo(() => {
    if (!isAdmin) return null;
    const wh = data.warehouse || {};
    const warehouseValue = INGREDIENTS.reduce((a, ing) => a + Number(wh[ing.id]?.stock || 0) * ing.cost, 0);
    const lowStock = INGREDIENTS.filter(ing => {
      const s = wh[ing.id];
      return s && s.minStock > 0 && Number(s.stock || 0) <= Number(s.minStock);
    });
    const outOfStock = INGREDIENTS.filter(ing => {
      const s = wh[ing.id];
      return s && Number(s.stock || 0) <= 0 && (s.minStock > 0 || Number(s.stock || 0) === 0 && s.stock !== undefined);
    });
    const pendingReqs = (data.requisitions || []).filter(r => r.status === "pendiente");
    const approvedReqs = (data.requisitions || []).filter(r => r.status === "aprobada");
    const pendingTransfers = (data.transfers || []).filter(t => t.status === "pendiente");

    // Dinero en tránsito (depósitos pendientes)
    let pendingDeposits = 0, pendingDepCount = 0;
    allS.forEach(s => (s.deposits || []).forEach(d => {
      if (d.pending || d.bank === PENDING_BANK) { pendingDeposits += Number(d.amount || 0); pendingDepCount++; }
    }));

    return { warehouseValue, lowStock, outOfStock, pendingReqs, approvedReqs, pendingTransfers, pendingDeposits, pendingDepCount };
  }, [isAdmin, data.warehouse, data.requisitions, data.transfers, allS]);

  return (
    <div style={{padding:24,display:"flex",flexDirection:"column",gap:20}}>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <h1 style={{color:"#d4e8f7",fontSize:22,fontWeight:800,margin:0}}>Dashboard</h1>
          <p style={{color:"#5d85aa",fontSize:12,marginTop:4}}>{new Date().toLocaleDateString("es-HN",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</p>
        </div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={onTV} style={{background:"#16304a",color:"#5d85aa",border:"1px solid #1d3b5b",borderRadius:10,padding:"9px 14px",fontSize:12,cursor:"pointer"}}>📺 Vista TV</button>
          {isAdmin && <button onClick={onImport} style={{background:"#16304a",color:"#8aafd2",border:"1px solid #1d3b5b",borderRadius:10,padding:"9px 16px",fontWeight:600,fontSize:12,cursor:"pointer"}}>📥 Importar JSON</button>}
          <button onClick={()=>goto("sales")} style={{background:"#0369a1",color:"#fff",border:"none",borderRadius:10,padding:"9px 18px",fontWeight:700,fontSize:13,cursor:"pointer"}}>+ Ingresar Ventas</button>
        </div>
      </div>

      {/* KPIs Hoy */}
      <Section label={`Hoy — ${td}`}>
        <div style={{display:"grid",gridTemplateColumns:realCostToday?"repeat(4,1fr)":"1fr 1fr 1fr",gap:12}}>
          <KCard label="Ventas del Día"   val={L(tkpi.sales)}             sub={`${todayS.length} registro(s)`} col="#22c55e" icon="💰"/>
          <KCard label="Gastos del Día"   val={L(tkpi.expenses)}           sub="Compras + pagos"               col="#f97316" icon="📤"/>
          <KCard label="Utilidad del Día" val={L(tkpi.sales-tkpi.expenses)} sub="Ventas − Gastos"             col={tkpi.sales-tkpi.expenses>=0?"#22c55e":"#ef4444"} icon="📊"/>
          {realCostToday && (
            <KCard label="Margen Real (recetas)" val={`${realCostToday.pct.toFixed(1)}%`}
              sub={`Costo producción: ${L(realCostToday.cogs)}`} col={realCostToday.pct>=50?"#22c55e":"#f97316"} icon="🧮"/>
          )}
        </div>
      </Section>

      {/* KPIs Mes */}
      <Section label={`Este mes — ${thisMonth}`}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
          <KCard label="Ventas del Mes"  val={L(mkpi.sales)}              sub={`${monthS.length} días registrados`}  col="#60a5fa" icon="📅"/>
          <KCard label="Gastos del Mes"  val={L(mkpi.expenses)}           sub={`${mkpi.sales>0?((mkpi.expenses/mkpi.sales)*100).toFixed(1):0}% sobre ventas`} col="#f97316" icon="💸"/>
          <KCard label="Utilidad del Mes" val={L(mkpi.sales-mkpi.expenses)} sub="Resultado mensual"                col={mkpi.sales-mkpi.expenses>=0?"#22c55e":"#ef4444"} icon="📈"/>
          <KCard label="Depositado Mes"  val={L(mkpi.deposited)}          sub="en cuentas bancarias"              col="#a78bfa" icon="🏛️"/>
        </div>
      </Section>

      {/* Operaciones & Inventario (admin) */}
      {isAdmin && ops && (
        <Section label="🏭 Operaciones & Inventario">
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
            <KCard label="Valor en Bodega" val={L(ops.warehouseValue)}
              sub={`${INGREDIENTS.filter(i=>Number(data.warehouse?.[i.id]?.stock||0)>0).length} ingredientes`}
              col="#a78bfa" icon="🏭"/>
            <KCard label="Stock Bajo / Sin Stock" val={ops.lowStock.length}
              sub={ops.outOfStock.length>0?`${ops.outOfStock.length} sin stock 🔴`:"ningún crítico"}
              col={ops.outOfStock.length>0?"#ef4444":ops.lowStock.length>0?"#f97316":"#22c55e"} icon="📦"/>
            <KCard label="Requisiciones" val={ops.pendingReqs.length}
              sub={ops.approvedReqs.length>0?`+${ops.approvedReqs.length} aprobadas en tránsito`:"sin pendientes"}
              col={ops.pendingReqs.length>0?"#fbbf24":"#3a5c7f"} icon="📝"/>
            <KCard label="Dinero en Tránsito" val={L(ops.pendingDeposits)}
              sub={`${ops.pendingDepCount} depósito(s) por procesar`}
              col={ops.pendingDeposits>0?"#fbbf24":"#3a5c7f"} icon="⏳"/>
          </div>

          {/* Alertas operacionales */}
          {(ops.pendingReqs.length>0 || ops.lowStock.length>0 || ops.pendingTransfers.length>0) && (
            <div style={{marginTop:12,display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:12}}>
              {ops.pendingReqs.length>0 && (
                <div onClick={()=>goto("warehouse")} style={{background:"#451a03",border:"1px solid #92400e",borderRadius:12,padding:14,cursor:"pointer"}}>
                  <p style={{color:"#fbbf24",fontWeight:700,fontSize:12,margin:"0 0 4px"}}>📝 Requisiciones esperando aprobación</p>
                  <p style={{color:"#8aafd2",fontSize:11,margin:"0 0 6px"}}>{ops.pendingReqs.length} pendiente(s)</p>
                  <div style={{display:"flex",flexDirection:"column",gap:3}}>
                    {ops.pendingReqs.slice(0,3).map(r=>(
                      <div key={r.id} style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#b8d8ee"}}>
                        <span>{r.branchName}</span>
                        <span style={{color:"#fbbf24",fontWeight:700}}>{L(r.totalCost||0)}</span>
                      </div>
                    ))}
                    {ops.pendingReqs.length>3 && <span style={{color:"#5d85aa",fontSize:10,marginTop:2}}>y {ops.pendingReqs.length-3} más →</span>}
                  </div>
                </div>
              )}

              {ops.lowStock.length>0 && (
                <div onClick={()=>goto("warehouse")} style={{background:"#1a0505",border:"1px solid #450a0a",borderRadius:12,padding:14,cursor:"pointer"}}>
                  <p style={{color:"#ef4444",fontWeight:700,fontSize:12,margin:"0 0 4px"}}>🚨 Stock crítico en bodega</p>
                  <p style={{color:"#8aafd2",fontSize:11,margin:"0 0 6px"}}>{ops.lowStock.length} ingrediente(s) bajo mínimo</p>
                  <div style={{display:"flex",flexDirection:"column",gap:3}}>
                    {ops.lowStock.slice(0,3).map(ing=>{
                      const s=data.warehouse?.[ing.id];
                      return (
                        <div key={ing.id} style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#b8d8ee"}}>
                          <span>{ing.name}</span>
                          <span style={{color:"#ef4444",fontWeight:700}}>{s?.stock||0} / min {s?.minStock||0} {ing.unit}</span>
                        </div>
                      );
                    })}
                    {ops.lowStock.length>3 && <span style={{color:"#5d85aa",fontSize:10,marginTop:2}}>y {ops.lowStock.length-3} más →</span>}
                  </div>
                </div>
              )}

              {ops.pendingTransfers.length>0 && (
                <div onClick={()=>goto("warehouse")} style={{background:"#170c2a",border:"1px solid #3730a3",borderRadius:12,padding:14,cursor:"pointer"}}>
                  <p style={{color:"#a78bfa",fontWeight:700,fontSize:12,margin:"0 0 4px"}}>🚚 Envíos en tránsito</p>
                  <p style={{color:"#8aafd2",fontSize:11,margin:"0 0 6px"}}>{ops.pendingTransfers.length} envío(s) esperando recepción en sucursal</p>
                </div>
              )}
            </div>
          )}
        </Section>
      )}

      {/* Metas del mes */}
      {branchGoals.length>0 && (
        <Section label="🎯 Metas del Mes">
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:12}}>
            {branchGoals.map(({b,goal,sales,pct})=>(
              <div key={b.id} style={{background:"#0c1828",border:"1px solid #1d3b5b",borderRadius:14,padding:16}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                  <div>
                    <p style={{color:"#d4e8f7",fontWeight:700,fontSize:13,margin:0}}>{b.name}</p>
                    <p style={{color:"#5d85aa",fontSize:11,margin:"3px 0 0"}}>{L(sales)} de {L(goal)}</p>
                  </div>
                  <span style={{fontSize:20,fontWeight:900,color:pct>=100?"#22c55e":pct>=70?"#fbbf24":"#f97316"}}>{pct.toFixed(0)}%</span>
                </div>
                <div style={{height:8,background:"#16304a",borderRadius:4,overflow:"hidden"}}>
                  <div style={{height:"100%",borderRadius:4,transition:"width .5s",
                    background:pct>=100?"#22c55e":pct>=70?"#fbbf24":"#0369a1",
                    width:`${pct}%`}}/>
                </div>
                {pct>=100 && <p style={{color:"#22c55e",fontSize:10,fontWeight:700,margin:"6px 0 0",textAlign:"right"}}>🏆 META ALCANZADA</p>}
              </div>
            ))}
          </div>
        </Section>
      )}

      <div style={{display:"grid",gridTemplateColumns:"3fr 2fr",gap:16}}>
        {/* Top Productos */}
        <Card>
          <h2 style={{color:"#d4e8f7",fontSize:14,fontWeight:700,marginBottom:16}}>🏆 Top Productos</h2>
          {topProd.length===0
            ? <p style={{color:"#3a5c7f",fontSize:13,textAlign:"center",padding:"20px 0"}}>Sin datos aún</p>
            : topProd.map((p,i)=>{
                const pct=topProd[0].rev>0?(p.rev/topProd[0].rev)*100:0;
                return (
                  <div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                    <span style={{color:"#3a5c7f",fontSize:11,width:16}}>{i+1}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                        <span style={{color:"#b8d8ee",fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</span>
                        <span style={{color:"#d4e8f7",fontSize:12,fontWeight:700,marginLeft:8,flexShrink:0}}>{L(p.rev)}</span>
                      </div>
                      <div style={{height:5,background:"#16304a",borderRadius:3,overflow:"hidden"}}>
                        <div style={{height:"100%",background:"#0369a1",width:`${pct}%`,borderRadius:3}}/>
                      </div>
                    </div>
                    <span style={{color:"#5d85aa",fontSize:10,width:40,textAlign:"right"}}>{p.qty}u.</span>
                  </div>
                );
              })
          }
        </Card>

        {/* Por sucursal */}
        <Card>
          <h2 style={{color:"#d4e8f7",fontSize:14,fontWeight:700,marginBottom:16}}>🏪 Por Sucursal</h2>
          {branchStats.map(({b,sales,exp,n})=>(
            <div key={b.id} style={{background:"#16304a",borderRadius:10,padding:"12px",marginBottom:10}}>
              <p style={{color:"#d4e8f7",fontWeight:700,fontSize:13,margin:0}}>{b.name}</p>
              <p style={{color:"#5d85aa",fontSize:11,margin:"2px 0 8px"}}>{n} registros</p>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                <div><p style={{color:"#5d85aa",fontSize:10,margin:0}}>Ventas</p><p style={{color:"#22c55e",fontWeight:700,fontSize:12,margin:0}}>{L(sales)}</p></div>
                <div><p style={{color:"#5d85aa",fontSize:10,margin:0}}>Utilidad</p><p style={{color:sales-exp>=0?"#22c55e":"#ef4444",fontWeight:700,fontSize:12,margin:0}}>{L(sales-exp)}</p></div>
              </div>
            </div>
          ))}
        </Card>
      </div>

      {/* Comparativo semanal */}
      {weekCompare.some(w=>w.this>0||w.last>0) && (
        <Card>
          <h2 style={{color:"#d4e8f7",fontSize:14,fontWeight:700,marginBottom:16}}>📅 Esta Semana vs Semana Anterior</h2>
          <div style={{display:"grid",gridTemplateColumns:`repeat(${weekCompare.length},1fr)`,gap:8}}>
            {weekCompare.map((w,i)=>(
              <div key={i} style={{textAlign:"center"}}>
                <p style={{color:"#5d85aa",fontSize:10,margin:"0 0 8px",fontWeight:600}}>{w.day}</p>
                {/* Barras */}
                <div style={{display:"flex",gap:3,justifyContent:"center",alignItems:"flex-end",height:60,marginBottom:6}}>
                  <div style={{width:16,background:"#0369a1",borderRadius:"3px 3px 0 0",height:`${maxWeek>0?(w.this/maxWeek)*100:0}%`,minHeight:w.this>0?4:0}}/>
                  <div style={{width:16,background:"#1d3b5b",borderRadius:"3px 3px 0 0",height:`${maxWeek>0?(w.last/maxWeek)*100:0}%`,minHeight:w.last>0?4:0}}/>
                </div>
                <p style={{color:"#0369a1",fontSize:10,fontWeight:700,margin:"0 0 2px"}}>{w.this>0?L(w.this).replace("L ",""):"—"}</p>
                <p style={{color:"#3a5c7f",fontSize:9,margin:0}}>{w.last>0?L(w.last).replace("L ",""):"—"}</p>
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:16,marginTop:12,justifyContent:"flex-end"}}>
            <span style={{display:"flex",alignItems:"center",gap:4,color:"#5d85aa",fontSize:10}}><span style={{width:10,height:10,background:"#0369a1",borderRadius:2,display:"inline-block"}}/>Esta semana</span>
            <span style={{display:"flex",alignItems:"center",gap:4,color:"#5d85aa",fontSize:10}}><span style={{width:10,height:10,background:"#1d3b5b",borderRadius:2,display:"inline-block"}}/>Semana anterior</span>
          </div>
        </Card>
      )}

      {/* Registros recientes */}
      <Card>
        <h2 style={{color:"#d4e8f7",fontSize:14,fontWeight:700,marginBottom:12}}>📋 Registros Recientes</h2>
        {recent.length===0
          ? <p style={{color:"#3a5c7f",fontSize:13,textAlign:"center",padding:16}}>
              Sin registros aún. <span style={{color:"#0369a1",cursor:"pointer",textDecoration:"underline"}} onClick={()=>goto("sales")}>Ingresar primer reporte →</span>
            </p>
          : <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead><tr style={{color:"#5d85aa",fontSize:11,borderBottom:"1px solid #1d3b5b"}}>
                {["Fecha","Sucursal","Ventas","Gastos","Utilidad","Depositado"].map(h=>(
                  <th key={h} style={{textAlign:h==="Fecha"||h==="Sucursal"?"left":"right",padding:"6px 8px",fontWeight:600}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {recent.map(s=>{
                  const br=data.branches.find(b=>b.id===s.branchId);
                  const util=s.totalSales-s.totalExpenses;
                  return (
                    <tr key={s.id} style={{borderBottom:"1px solid #16304a"}}>
                      <td style={{padding:"10px 8px",color:"#8aafd2"}}>{s.date}</td>
                      <td style={{padding:"10px 8px",color:"#b8d8ee"}}>{br?.name||s.branchId}</td>
                      <td style={{padding:"10px 8px",textAlign:"right",color:"#22c55e",fontWeight:700}}>{L(s.totalSales)}</td>
                      <td style={{padding:"10px 8px",textAlign:"right",color:"#f97316"}}>{L(s.totalExpenses)}</td>
                      <td style={{padding:"10px 8px",textAlign:"right",fontWeight:700,color:util>=0?"#22c55e":"#ef4444"}}>{L(util)}</td>
                      <td style={{padding:"10px 8px",textAlign:"right",color:"#a78bfa"}}>{L(s.totalDeposited)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
        }
      </Card>
    </div>
  );
}

import { useState, useMemo } from "react";
import { L } from "../lib/helpers";
import { KCard, Card } from "../components/ui";
import { PrintableReportSummary } from "../components/PrintableReportSummary";
import { PrintableMonthlyClose } from "../components/PrintableMonthlyClose";
import { filterByScope, filterBranches, visibleBranchIds, isFranchiseeOrDelegate } from "../lib/permissions";
import { resolveIngredients, calcRecipeCost } from "../lib/catalog";

export function ReportsView({data, userRole, onEditSale}) {
  // Filtrar datos según scope del usuario
  const scopedSales = filterByScope(userRole, data?.sales || [], "branchId");
  const scopedBranches = filterBranches(userRole, data?.branches || []);
  const scopedData = { ...data, sales: scopedSales, branches: scopedBranches };
  data = scopedData;
  const [range,setRange]         = useState("30d");
  const [branchFilter,setBranchFilter] = useState("all");
  const [tab,setTab]             = useState("resumen");
  const [dateFrom,setDateFrom]   = useState("");
  const [dateTo,setDateTo]       = useState("");
  const [showPdf,setShowPdf]     = useState(false);
  const [showMonthly,setShowMonthly] = useState(false);
  const [monthlyMonth,setMonthlyMonth] = useState(new Date().toISOString().slice(0,7));

  const DEPOSIT_LABELS = {
    deposito:"Depósito Bancario", tarjeta:"Tarjeta de Crédito",
    transferencia:"Transferencia", pedidos_ya:"Pedidos Ya / App",
  };

  const filtered = useMemo(()=>{
    let s = [...data.sales];
    const now = new Date();
    if(range==="7d")  { const c=new Date(now-7*864e5).toISOString().split("T")[0]; s=s.filter(x=>x.date>=c); }
    if(range==="30d") { const c=new Date(now-30*864e5).toISOString().split("T")[0]; s=s.filter(x=>x.date>=c); }
    if(range==="custom") {
      if(dateFrom) s=s.filter(x=>x.date>=dateFrom);
      if(dateTo)   s=s.filter(x=>x.date<=dateTo);
    }
    if(branchFilter!=="all") s=s.filter(x=>x.branchId===branchFilter);
    return s.sort((a,b)=>b.date.localeCompare(a.date));
  },[data.sales,range,branchFilter,dateFrom,dateTo]);

  const tot = useMemo(()=>({
    sales: filtered.reduce((a,s)=>a+s.totalSales,0),
    exp:   filtered.reduce((a,s)=>a+s.totalExpenses,0),
    dep:   filtered.reduce((a,s)=>a+s.totalDeposited,0),
  }),[filtered]);

  // ── Tab: Resumen ──────────────────────────────────────────────────────────
  const catRev = useMemo(()=>{
    const m={};
    filtered.forEach(s=>s.items.forEach(it=>{ m[it.category]=(m[it.category]||0)+it.total; }));
    return Object.entries(m).sort((a,b)=>b[1]-a[1]);
  },[filtered]);

  // ── Tab: Depósitos ────────────────────────────────────────────────────────
  // Por cuenta bancaria
  const depositsByBank = useMemo(()=>{
    const m={};
    filtered.forEach(s=>{
      const brName = data.branches.find(b=>b.id===s.branchId)?.name || s.branchId;
      (s.deposits||[]).forEach(d=>{
        const key = d.bank;
        if(!m[key]) m[key]={bank:d.bank, total:0, count:0, types:{}, branches:{}};
        m[key].total  += Number(d.amount);
        m[key].count  += 1;
        m[key].types[d.type]   = (m[key].types[d.type]||0) + Number(d.amount);
        m[key].branches[brName] = (m[key].branches[brName]||0) + Number(d.amount);
      });
    });
    return Object.values(m).sort((a,b)=>b.total-a.total);
  },[filtered,data.branches]);

  // Por tipo
  const depositsByType = useMemo(()=>{
    const m={};
    filtered.forEach(s=>{
      (s.deposits||[]).forEach(d=>{
        m[d.type] = (m[d.type]||0) + Number(d.amount);
      });
    });
    return Object.entries(m).sort((a,b)=>b[1]-a[1]);
  },[filtered]);

  // Detalle línea a línea (ahora incluye ref)
  const depositLines = useMemo(()=>{
    const lines=[];
    filtered.forEach(s=>{
      const brName=data.branches.find(b=>b.id===s.branchId)?.name||s.branchId;
      (s.deposits||[]).filter(d=>Number(d.amount)>0).forEach(d=>{
        lines.push({date:s.date, branch:brName, bank:d.bank, type:d.type, amount:Number(d.amount), ref:d.ref||""});
      });
    });
    return lines.sort((a,b)=>a.date.localeCompare(b.date)); // cronológico asc para agrupar
  },[filtered,data.branches]);

  // Agrupación por mes → semana
  const depositsByMonthWeek = useMemo(()=>{
    const months={};
    depositLines.forEach(d=>{
      const monthKey = d.date.slice(0,7); // "2026-04"
      if(!months[monthKey]) months[monthKey]={key:monthKey, weeks:{}, total:0};
      // Semana: lunes de esa semana
      const dt = new Date(d.date+"T12:00:00");
      const day = dt.getDay(); const diff = day===0?6:day-1;
      const mon = new Date(dt); mon.setDate(mon.getDate()-diff);
      const weekKey = mon.toISOString().split("T")[0];
      if(!months[monthKey].weeks[weekKey]) months[monthKey].weeks[weekKey]={start:weekKey, lines:[], total:0};
      months[monthKey].weeks[weekKey].lines.push(d);
      months[monthKey].weeks[weekKey].total += d.amount;
      months[monthKey].total += d.amount;
    });
    // Convertir a array ordenado
    return Object.values(months)
      .sort((a,b)=>b.key.localeCompare(a.key))
      .map(m=>({...m, weeks:Object.values(m.weeks).sort((a,b)=>b.start.localeCompare(a.start))}));
  },[depositLines]);

  // Exportar CSV depósitos
  const exportCSV = ()=>{
    const header = "Fecha,Sucursal,Cuenta / Banco,Tipo,Referencia,Monto\n";
    const rows = depositLines.map(d=>
      `${d.date},"${d.branch}","${d.bank}",${DEPOSIT_LABELS[d.type]||d.type},"${d.ref}",${d.amount}`
    ).join("\n");
    const blob = new Blob(["\uFEFF"+header+rows],{type:"text/csv;charset=utf-8;"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download=`depositos_${range}_${branchFilter}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  // Exportar CSV Costos & Utilidad
  const exportCostsCSV = () => {
    const esc = (s) => `"${String(s ?? "").replace(/"/g,'""')}"`;
    const header = "Producto,Categoria,Vendido,Ingresos,Precio Prom,Costo Unit,Margen Unit,Margen %,Costo Total,Utilidad Total,Con Receta\n";
    const rows = costData.products.map(p =>
      [esc(p.name), esc(p.category), p.qty, p.revenue.toFixed(2), p.unitPrice.toFixed(2),
       p.hasRecipe ? p.unitCost.toFixed(2) : "",
       p.hasRecipe ? p.unitMargin.toFixed(2) : "",
       p.hasRecipe ? p.marginPct.toFixed(2) : "",
       p.hasRecipe ? p.totalCost.toFixed(2) : "",
       p.hasRecipe ? p.totalMargin.toFixed(2) : "",
       p.hasRecipe ? "Si" : "No"
      ].join(",")
    ).join("\n");
    const totals = `\n,,,,,,,,TOTAL INGRESOS,${costData.totalRevenue.toFixed(2)}\n,,,,,,,,TOTAL COGS,${costData.totalCOGS.toFixed(2)}\n,,,,,,,,UTILIDAD BRUTA,${costData.grossProfit.toFixed(2)}\n,,,,,,,,MARGEN %,${costData.marginPct.toFixed(2)}`;
    const blob = new Blob(["\uFEFF"+header+rows+totals], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `costos_utilidad_${range}_${branchFilter}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  // ── Tab: Gastos ───────────────────────────────────────────────────────────
  // Por descripción (agrupado)
  const expByDesc = useMemo(()=>{
    const m={};
    filtered.forEach(s=>{
      const brName=data.branches.find(b=>b.id===s.branchId)?.name||s.branchId;
      (s.expenses||[]).filter(e=>Number(e.amount)>0).forEach(e=>{
        const key=e.description||"Sin descripción";
        if(!m[key]) m[key]={desc:key,total:0,count:0,type:e.type,branches:{}};
        m[key].total += Number(e.amount);
        m[key].count += 1;
        m[key].branches[brName] = (m[key].branches[brName]||0) + Number(e.amount);
      });
    });
    return Object.values(m).sort((a,b)=>b.total-a.total);
  },[filtered,data.branches]);

  // Detalle gastos línea a línea
  const expLines = useMemo(()=>{
    const lines=[];
    filtered.forEach(s=>{
      const brName=data.branches.find(b=>b.id===s.branchId)?.name||s.branchId;
      (s.expenses||[]).filter(e=>Number(e.amount)>0).forEach(e=>{
        lines.push({date:s.date,branch:brName,desc:e.description||"Sin descripción",type:e.type,amount:Number(e.amount)});
      });
    });
    return lines.sort((a,b)=>b.date.localeCompare(a.date));
  },[filtered,data.branches]);

  const totalDepositsShown = depositsByBank.reduce((a,d)=>a+d.total,0);
  const totalExpShown      = expByDesc.reduce((a,e)=>a+e.total,0);

  // ── Shared UI helpers ─────────────────────────────────────────────────────
  const dinp = {background:"#1e0e06",border:"1px solid #1d3b5b",borderRadius:7,padding:"6px 10px",color:"#d4e8f7",fontSize:11,outline:"none"};
  const Filters = ()=>(
    <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
      <select value={branchFilter} onChange={e=>setBranchFilter(e.target.value)}
        style={{background:"#16304a",border:"1px solid #1d3b5b",color:"#d4e8f7",borderRadius:9,padding:"8px 12px",fontSize:12}}>
        <option value="all">Todas las sucursales</option>
        {data.branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
      </select>
      <div style={{display:"flex",background:"#16304a",border:"1px solid #1d3b5b",borderRadius:9,overflow:"hidden"}}>
        {[["7d","7 días"],["30d","30 días"],["all","Todo"],["custom","📅 Fechas"]].map(([r,lbl])=>(
          <button key={r} onClick={()=>setRange(r)} style={{
            padding:"8px 14px",fontSize:12,border:"none",cursor:"pointer",
            background:range===r?"#0369a1":"transparent",color:range===r?"#fff":"#5d85aa",
          }}>{lbl}</button>
        ))}
      </div>
      {range==="custom" && (
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} style={dinp}/>
          <span style={{color:"#3a5c7f",fontSize:11}}>→</span>
          <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} style={dinp}/>
        </div>
      )}
    </div>
  );

  const TABS = [
    ["resumen","📊 Resumen"],["depositos","🏦 Depósitos"],
    ["gastos","💸 Gastos"],["costos","💰 Costos & Utilidad"],["detalle","📋 Detalle"],
  ];

  // ── Costos & Utilidad Bruta Real (según recetas) ──────────────────────────
  const resolvedIngredients = resolveIngredients(data?.ingredients || []);
  const isFranchise = isFranchiseeOrDelegate(userRole);
  const costData = useMemo(() => {
    const recipes = data?.recipes || {};
    const byProduct = {};
    let totalRevenue = 0;
    let totalCOGS = 0;
    let withRecipe = 0;
    let withoutRecipe = 0;

    filtered.forEach(sale => {
      (sale.items || []).forEach(item => {
        const pid = item.productId;
        const r = recipes[pid];
        const unitCost = calcRecipeCost(r, resolvedIngredients, isFranchise);

        if (!byProduct[pid]) {
          byProduct[pid] = {
            pid, name: item.productName, category: item.category,
            qty: 0, revenue: 0, unitCost, hasRecipe: !!r && r.ingredients?.length > 0,
          };
        }
        const line = byProduct[pid];
        line.qty += Number(item.qty || 0);
        line.revenue += Number(item.total || 0);
        totalRevenue += Number(item.total || 0);
        if (r?.ingredients?.length > 0) {
          totalCOGS += unitCost * Number(item.qty || 0);
          withRecipe += Number(item.qty || 0);
        } else {
          withoutRecipe += Number(item.qty || 0);
        }
      });
    });

    const products = Object.values(byProduct).map(p => {
      const unitPrice = p.qty > 0 ? p.revenue / p.qty : 0;
      const unitMargin = unitPrice - p.unitCost;
      const marginPct = unitPrice > 0 ? (unitMargin / unitPrice) * 100 : 0;
      const totalCost = p.unitCost * p.qty;
      const totalMargin = p.revenue - totalCost;
      return { ...p, unitPrice, unitMargin, marginPct, totalCost, totalMargin };
    }).sort((a, b) => b.revenue - a.revenue);

    return {
      products,
      totalRevenue,
      totalCOGS,
      grossProfit: totalRevenue - totalCOGS,
      marginPct: totalRevenue > 0 ? ((totalRevenue - totalCOGS) / totalRevenue) * 100 : 0,
      itemsWithRecipe: withRecipe,
      itemsWithoutRecipe: withoutRecipe,
      productsNoRecipe: products.filter(p => !p.hasRecipe),
    };
  }, [filtered, data?.recipes, resolvedIngredients, isFranchise]);

  return (
    <div style={{padding:24,display:"flex",flexDirection:"column",gap:16}}>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <h1 style={{color:"#d4e8f7",fontSize:22,fontWeight:800,margin:0}}>📈 Reportes</h1>
          <button onClick={()=>setShowPdf(true)} style={{background:"#16304a",border:"1px solid #1d3b5b",color:"#8aafd2",borderRadius:8,padding:"7px 14px",cursor:"pointer",fontSize:11,fontWeight:600}}>
            🖨️ Generar PDF
          </button>
          <div style={{display:"flex",gap:4,alignItems:"center"}}>
            <input type="month" value={monthlyMonth} onChange={e=>setMonthlyMonth(e.target.value)}
              style={{background:"#1e0e06",border:"1px solid #1d3b5b",borderRadius:7,padding:"6px 10px",color:"#d4e8f7",fontSize:11,outline:"none"}}/>
            <button onClick={()=>setShowMonthly(true)}
              style={{background:"#16304a",border:"1px solid #a78bfa",color:"#a78bfa",borderRadius:8,padding:"7px 14px",cursor:"pointer",fontSize:11,fontWeight:600}}>
              📅 Cierre Mensual
            </button>
          </div>
        </div>
        <Filters/>
      </div>

      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
        <KCard label="Ventas Totales"  val={L(tot.sales)} sub={`${filtered.length} días`} col="#22c55e" icon="💰"/>
        <KCard label="Gastos Totales"  val={L(tot.exp)}   sub={`${tot.sales>0?((tot.exp/tot.sales)*100).toFixed(1):0}% de ventas`} col="#f97316" icon="💸"/>
        <KCard label="Utilidad Bruta"  val={L(tot.sales-tot.exp)} sub={`${tot.sales>0?(((tot.sales-tot.exp)/tot.sales)*100).toFixed(1):0}% margen`} col={tot.sales-tot.exp>=0?"#22c55e":"#ef4444"} icon="📈"/>
        <KCard label="Total Depositado" val={L(tot.dep)}  sub="en cuentas bancarias" col="#a78bfa" icon="🏛️"/>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",borderBottom:"1px solid #1d3b5b",gap:0}}>
        {TABS.map(([t,lbl])=>(
          <button key={t} onClick={()=>setTab(t)} style={{
            padding:"10px 20px",fontSize:12,fontWeight:tab===t?700:400,border:"none",
            borderBottom:tab===t?"2px solid #0369a1":"2px solid transparent",
            background:"none",cursor:"pointer",color:tab===t?"#d4e8f7":"#5d85aa",transition:"color .15s",
          }}>{lbl}</button>
        ))}
      </div>

      {/* ── TAB: RESUMEN ──────────────────────────────────────────────────── */}
      {tab==="resumen" && (
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          <Card>
            <h2 style={{color:"#d4e8f7",fontSize:14,fontWeight:700,marginBottom:16}}>🦐 Ventas por Categoría</h2>
            {catRev.length===0
              ? <p style={{color:"#3a5c7f",fontSize:12,textAlign:"center",padding:"16px 0"}}>Sin datos</p>
              : catRev.map(([cat,rev])=>{
                  const pct=tot.sales>0?(rev/tot.sales)*100:0;
                  return (
                    <div key={cat} style={{marginBottom:12}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4,fontSize:12}}>
                        <span style={{color:"#8aafd2"}}>{cat}</span>
                        <span style={{color:"#d4e8f7",fontWeight:700}}>{L(rev)} <span style={{color:"#5d85aa",fontWeight:400}}>({pct.toFixed(1)}%)</span></span>
                      </div>
                      <div style={{height:6,background:"#16304a",borderRadius:4,overflow:"hidden"}}>
                        <div style={{height:"100%",background:"#0369a1",width:`${pct}%`,borderRadius:4}}/>
                      </div>
                    </div>
                  );
                })
            }
          </Card>
          <Card>
            <h2 style={{color:"#d4e8f7",fontSize:14,fontWeight:700,marginBottom:16}}>💸 Top Gastos (resumen)</h2>
            {expByDesc.length===0
              ? <p style={{color:"#3a5c7f",fontSize:12,textAlign:"center",padding:"16px 0"}}>Sin gastos</p>
              : expByDesc.slice(0,8).map(e=>(
                  <div key={e.desc} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid #16304a",fontSize:12}}>
                    <span style={{color:"#8aafd2",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginRight:12}}>{e.desc}</span>
                    <span style={{color:"#f97316",fontWeight:700,flexShrink:0}}>{L(e.total)}</span>
                  </div>
                ))
            }
          </Card>
        </div>
      )}

      {/* ── TAB: DEPÓSITOS ────────────────────────────────────────────────── */}
      {tab==="depositos" && (
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          {/* Por tipo */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
            {depositsByType.map(([type,amt])=>(
              <div key={type} style={{background:"#0c1828",border:"1px solid #1d3b5b",borderRadius:14,padding:14}}>
                <p style={{color:"#5d85aa",fontSize:10,textTransform:"uppercase",letterSpacing:1,margin:"0 0 6px"}}>{DEPOSIT_LABELS[type]||type}</p>
                <p style={{color:"#a78bfa",fontSize:18,fontWeight:800,margin:0}}>{L(amt)}</p>
                <p style={{color:"#3a5c7f",fontSize:10,margin:"4px 0 0"}}>{((amt/totalDepositsShown)*100).toFixed(1)}% del total</p>
              </div>
            ))}
          </div>

          {/* Por cuenta bancaria */}
          <Card>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <h2 style={{color:"#d4e8f7",fontSize:14,fontWeight:700,margin:0}}>🏦 Desglose por Cuenta Bancaria</h2>
              <span style={{color:"#a78bfa",fontSize:13,fontWeight:800}}>{L(totalDepositsShown)} total</span>
            </div>
            {depositsByBank.length===0
              ? <p style={{color:"#3a5c7f",fontSize:12,textAlign:"center",padding:16}}>Sin depósitos en el período</p>
              : <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                  <thead><tr style={{background:"#16304a"}}>
                    {["Cuenta / Banco","Sucursal(es)","Transacciones","Tipo principal","Total"].map((h,i)=>(
                      <th key={h} style={{padding:"10px 12px",textAlign:i>=2?"right":"left",color:"#5d85aa",fontSize:11,fontWeight:600}}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {depositsByBank.map((d,i)=>{
                      const mainType = Object.entries(d.types).sort((a,b)=>b[1]-a[1])[0]?.[0]||"";
                      const branchList = Object.keys(d.branches).join(", ");
                      const pct = totalDepositsShown>0?(d.total/totalDepositsShown*100).toFixed(1):0;
                      return (
                        <tr key={i} style={{borderTop:"1px solid #16304a"}}>
                          <td style={{padding:"10px 12px"}}>
                            <p style={{color:"#b8d8ee",margin:0,fontWeight:600}}>{d.bank}</p>
                            <div style={{height:3,background:"#16304a",borderRadius:2,marginTop:4,overflow:"hidden"}}>
                              <div style={{height:"100%",background:"#a78bfa",width:`${pct}%`}}/>
                            </div>
                          </td>
                          <td style={{padding:"10px 12px",color:"#5d85aa",fontSize:11}}>{branchList}</td>
                          <td style={{padding:"10px 12px",textAlign:"right",color:"#8aafd2"}}>{d.count}</td>
                          <td style={{padding:"10px 12px",textAlign:"right"}}>
                            <span style={{background:"#1e0e06",color:"#8aafd2",padding:"2px 8px",borderRadius:5,fontSize:10}}>{DEPOSIT_LABELS[mainType]||mainType}</span>
                          </td>
                          <td style={{padding:"10px 12px",textAlign:"right",color:"#a78bfa",fontWeight:800}}>{L(d.total)}</td>
                        </tr>
                      );
                    })}
                    <tr style={{borderTop:"2px solid #1d3b5b",fontWeight:800}}>
                      <td colSpan={4} style={{padding:"10px 12px",color:"#8aafd2"}}>TOTAL DEPOSITADO</td>
                      <td style={{padding:"10px 12px",textAlign:"right",color:"#a78bfa",fontSize:14}}>{L(totalDepositsShown)}</td>
                    </tr>
                  </tbody>
                </table>
            }
          </Card>

          {/* Agrupado por Mes → Semana */}
          <Card>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <h2 style={{color:"#d4e8f7",fontSize:14,fontWeight:700,margin:0}}>📋 Detalle por Semana / Mes</h2>
              <button onClick={exportCSV} style={{background:"#16304a",border:"1px solid #1d3b5b",color:"#a78bfa",borderRadius:8,padding:"6px 14px",cursor:"pointer",fontSize:11,fontWeight:600}}>
                📥 Exportar CSV
              </button>
            </div>
            {depositsByMonthWeek.length===0
              ? <p style={{color:"#3a5c7f",fontSize:12,textAlign:"center",padding:12}}>Sin registros</p>
              : depositsByMonthWeek.map(month=>{
                  const [y,m] = month.key.split("-");
                  const monthName = new Date(Number(y),Number(m)-1).toLocaleString("es-HN",{month:"long",year:"numeric"});
                  return (
                    <div key={month.key} style={{marginBottom:20}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:"#16304a",padding:"10px 14px",borderRadius:10,marginBottom:10}}>
                        <span style={{color:"#d4e8f7",fontWeight:800,fontSize:13,textTransform:"capitalize"}}>📅 {monthName}</span>
                        <span style={{color:"#a78bfa",fontWeight:800,fontSize:14}}>{L(month.total)}</span>
                      </div>
                      {month.weeks.map(week=>{
                        const wEnd = new Date(week.start+"T12:00:00"); wEnd.setDate(wEnd.getDate()+6);
                        const wLabel = `${week.start.slice(5)} → ${wEnd.toISOString().split("T")[0].slice(5)}`;
                        return (
                          <div key={week.start} style={{marginBottom:12,marginLeft:8}}>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                              <span style={{color:"#5d85aa",fontSize:11,fontWeight:600}}>Semana {wLabel}</span>
                              <span style={{color:"#8aafd2",fontSize:11,fontWeight:700}}>Subtotal: {L(week.total)}</span>
                            </div>
                            <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                              <thead><tr style={{background:"#1e0e06"}}>
                                {["Fecha","Sucursal","Cuenta / Banco","Tipo","Ref","Monto"].map((h,i)=>(
                                  <th key={h} style={{padding:"7px 10px",textAlign:i>=4?"right":"left",color:"#3a5c7f",fontSize:10,fontWeight:600}}>{h}</th>
                                ))}
                              </tr></thead>
                              <tbody>
                                {week.lines.map((d,i)=>(
                                  <tr key={i} style={{borderTop:"1px solid #1a0f08"}}>
                                    <td style={{padding:"7px 10px",color:"#8aafd2"}}>{d.date}</td>
                                    <td style={{padding:"7px 10px",color:"#b8d8ee"}}>{d.branch}</td>
                                    <td style={{padding:"7px 10px",color:"#8aafd2",fontSize:10}}>{d.bank}</td>
                                    <td style={{padding:"7px 10px"}}>
                                      <span style={{background:"#1e0e06",color:"#8aafd2",padding:"2px 7px",borderRadius:5,fontSize:9}}>{DEPOSIT_LABELS[d.type]||d.type}</span>
                                    </td>
                                    <td style={{padding:"7px 10px",textAlign:"right",color:"#5d85aa",fontSize:10}}>{d.ref||"—"}</td>
                                    <td style={{padding:"7px 10px",textAlign:"right",color:"#a78bfa",fontWeight:700}}>{L(d.amount)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        );
                      })}
                    </div>
                  );
                })
            }
          </Card>
        </div>
      )}

      {/* ── TAB: GASTOS ───────────────────────────────────────────────────── */}
      {tab==="gastos" && (
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          {/* KPI gastos */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
            <KCard label="Total Gastos" val={L(totalExpShown)} sub={`${expLines.length} transacciones`} col="#f97316" icon="💸"/>
            <KCard label="Concepto más caro" val={expByDesc[0]?.desc||"—"} sub={expByDesc[0]?L(expByDesc[0].total):"sin datos"} col="#fbbf24" icon="⚠️"/>
            <KCard label="% sobre ventas" val={`${tot.sales>0?((totalExpShown/tot.sales)*100).toFixed(1):0}%`} sub="gastos / ventas" col={totalExpShown/tot.sales>0.3?"#ef4444":"#22c55e"} icon="📉"/>
          </div>

          {/* Por concepto */}
          <Card>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <h2 style={{color:"#d4e8f7",fontSize:14,fontWeight:700,margin:0}}>💸 Gastos por Concepto</h2>
              <span style={{color:"#f97316",fontSize:13,fontWeight:800}}>{L(totalExpShown)} total</span>
            </div>
            {expByDesc.length===0
              ? <p style={{color:"#3a5c7f",fontSize:12,textAlign:"center",padding:16}}>Sin gastos en el período</p>
              : <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                  <thead><tr style={{background:"#16304a"}}>
                    {["Concepto","Sucursal(es)","Veces","% del total","Total"].map((h,i)=>(
                      <th key={h} style={{padding:"10px 12px",textAlign:i>=2?"right":"left",color:"#5d85aa",fontSize:11,fontWeight:600}}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {expByDesc.map((e,i)=>{
                      const pct = totalExpShown>0?(e.total/totalExpShown*100):0;
                      const branchList = Object.keys(e.branches).join(", ");
                      return (
                        <tr key={i} style={{borderTop:"1px solid #16304a"}}>
                          <td style={{padding:"10px 12px"}}>
                            <p style={{color:"#b8d8ee",margin:0,fontWeight:600}}>{e.desc}</p>
                            <div style={{height:3,background:"#16304a",borderRadius:2,marginTop:4,overflow:"hidden"}}>
                              <div style={{height:"100%",background:"#f97316",width:`${pct}%`}}/>
                            </div>
                          </td>
                          <td style={{padding:"10px 12px",color:"#5d85aa",fontSize:11}}>{branchList}</td>
                          <td style={{padding:"10px 12px",textAlign:"right",color:"#8aafd2"}}>{e.count}</td>
                          <td style={{padding:"10px 12px",textAlign:"right",color:"#5d85aa"}}>{pct.toFixed(1)}%</td>
                          <td style={{padding:"10px 12px",textAlign:"right",color:"#f97316",fontWeight:800}}>{L(e.total)}</td>
                        </tr>
                      );
                    })}
                    <tr style={{borderTop:"2px solid #1d3b5b",fontWeight:800}}>
                      <td colSpan={4} style={{padding:"10px 12px",color:"#8aafd2"}}>TOTAL GASTOS</td>
                      <td style={{padding:"10px 12px",textAlign:"right",color:"#f97316",fontSize:14}}>{L(totalExpShown)}</td>
                    </tr>
                  </tbody>
                </table>
            }
          </Card>

          {/* Detalle línea a línea */}
          <Card>
            <h2 style={{color:"#d4e8f7",fontSize:14,fontWeight:700,marginBottom:12}}>📋 Detalle de Gastos</h2>
            {expLines.length===0
              ? <p style={{color:"#3a5c7f",fontSize:12,textAlign:"center",padding:12}}>Sin registros</p>
              : <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                  <thead><tr style={{background:"#16304a"}}>
                    {["Fecha","Sucursal","Concepto","Tipo","Monto"].map((h,i)=>(
                      <th key={h} style={{padding:"9px 12px",textAlign:i>=3?"right":"left",color:"#5d85aa",fontSize:11,fontWeight:600}}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {expLines.map((e,i)=>(
                      <tr key={i} style={{borderTop:"1px solid #11233a"}}>
                        <td style={{padding:"9px 12px",color:"#8aafd2"}}>{e.date}</td>
                        <td style={{padding:"9px 12px",color:"#b8d8ee"}}>{e.branch}</td>
                        <td style={{padding:"9px 12px",color:"#8aafd2"}}>{e.desc}</td>
                        <td style={{padding:"9px 12px",textAlign:"right"}}>
                          <span style={{background:"#1e0e06",color:e.type==="tarjeta"?"#60a5fa":e.type==="transferencia"?"#a78bfa":"#8aafd2",padding:"2px 7px",borderRadius:5,fontSize:10,textTransform:"capitalize"}}>{e.type}</span>
                        </td>
                        <td style={{padding:"9px 12px",textAlign:"right",color:"#f97316",fontWeight:700}}>{L(e.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            }
          </Card>
        </div>
      )}

      {/* ── TAB: COSTOS & UTILIDAD ────────────────────────────────────────── */}
      {tab==="costos" && (
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          {/* KPIs */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
            <KCard label="Ventas Totales" val={L(costData.totalRevenue)} sub={`${costData.products.length} productos`} col="#22c55e" icon="💰"/>
            <KCard label="Costo de Ventas" val={L(costData.totalCOGS)} sub="según recetas cargadas" col="#f97316" icon="📦"/>
            <KCard label="Utilidad Bruta Real" val={L(costData.grossProfit)} sub={`Ventas − COGS`} col={costData.grossProfit>=0?"#22c55e":"#ef4444"} icon="💵"/>
            <KCard label="Margen Real" val={`${costData.marginPct.toFixed(1)}%`} sub={costData.marginPct>=50?"excelente":costData.marginPct>=30?"aceptable":"bajo"} col={costData.marginPct>=50?"#22c55e":costData.marginPct>=30?"#fbbf24":"#ef4444"} icon="📊"/>
          </div>

          {/* Alerta de recetas faltantes */}
          {costData.productsNoRecipe.length > 0 && (
            <div style={{background:"#451a03",border:"1px solid #92400e",borderRadius:10,padding:14}}>
              <p style={{color:"#fbbf24",fontSize:13,fontWeight:700,margin:"0 0 6px"}}>
                ⚠ {costData.productsNoRecipe.length} producto(s) sin receta cargada
              </p>
              <p style={{color:"#8aafd2",fontSize:11,margin:"0 0 8px"}}>
                Estos productos no pueden calcular su margen real. Cargá la receta en "Recetas & Costos" para obtener datos precisos. Se vendieron <strong>{costData.itemsWithoutRecipe}</strong> unidades sin costeo vs <strong>{costData.itemsWithRecipe}</strong> con receta.
              </p>
              <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:6}}>
                {costData.productsNoRecipe.slice(0,20).map(p => (
                  <span key={p.pid} style={{background:"#1e0e06",color:"#8aafd2",padding:"3px 9px",borderRadius:5,fontSize:10}}>{p.name} ({p.qty})</span>
                ))}
                {costData.productsNoRecipe.length > 20 && <span style={{color:"#5d85aa",fontSize:10,alignSelf:"center"}}>…y {costData.productsNoRecipe.length-20} más</span>}
              </div>
            </div>
          )}

          {/* Tabla detallada por producto */}
          <Card>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:10}}>
              <h2 style={{color:"#d4e8f7",fontSize:14,fontWeight:700,margin:0}}>🦐 Margen por Producto</h2>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <span style={{color:"#5d85aa",fontSize:11}}>
                  <span style={{color:"#22c55e"}}>●</span> ≥ 50% ·&nbsp;
                  <span style={{color:"#fbbf24"}}>●</span> 30-50% ·&nbsp;
                  <span style={{color:"#ef4444"}}>●</span> &lt; 30%
                </span>
                <button onClick={exportCostsCSV} disabled={costData.products.length===0}
                  style={{background:costData.products.length>0?"#16304a":"#1a1005",border:"1px solid #1d3b5b",color:costData.products.length>0?"#a78bfa":"#3a5c7f",borderRadius:8,padding:"6px 14px",cursor:costData.products.length>0?"pointer":"not-allowed",fontSize:11,fontWeight:600}}>
                  📥 Exportar CSV
                </button>
              </div>
            </div>
            {costData.products.length === 0
              ? <p style={{color:"#3a5c7f",fontSize:12,textAlign:"center",padding:16}}>Sin ventas en el período</p>
              : <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                  <thead><tr style={{background:"#16304a"}}>
                    {["Producto","Cat.","Vendido","Precio prom.","Costo unit.","Margen unit.","%","Ingresos","Costo total","Utilidad"].map((h,i)=>(
                      <th key={h} style={{padding:"9px 8px",textAlign:i>=2?"right":"left",color:"#5d85aa",fontSize:10,fontWeight:600}}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {costData.products.map(p => {
                      const col = !p.hasRecipe ? "#3a5c7f" : p.marginPct>=50?"#22c55e" : p.marginPct>=30?"#fbbf24" : "#ef4444";
                      const bgRow = !p.hasRecipe ? "transparent" : p.marginPct<30 ? "#1a0505" : "transparent";
                      return (
                        <tr key={p.pid} style={{borderTop:"1px solid #16304a",background:bgRow}}>
                          <td style={{padding:"7px 8px",color:p.hasRecipe?"#b8d8ee":"#5d85aa",fontWeight:600}}>
                            {p.hasRecipe ? "" : "⚠ "}{p.name}
                          </td>
                          <td style={{padding:"7px 8px",color:"#5d85aa",fontSize:10}}>{p.category}</td>
                          <td style={{padding:"7px 8px",textAlign:"right",color:"#8aafd2"}}>{p.qty}</td>
                          <td style={{padding:"7px 8px",textAlign:"right",color:"#8aafd2"}}>{L(p.unitPrice)}</td>
                          <td style={{padding:"7px 8px",textAlign:"right",color:p.hasRecipe?"#f97316":"#1d3b5b"}}>{p.hasRecipe?L(p.unitCost):"—"}</td>
                          <td style={{padding:"7px 8px",textAlign:"right",color:col,fontWeight:600}}>{p.hasRecipe?L(p.unitMargin):"—"}</td>
                          <td style={{padding:"7px 8px",textAlign:"right",color:col,fontWeight:700}}>{p.hasRecipe?`${p.marginPct.toFixed(0)}%`:"—"}</td>
                          <td style={{padding:"7px 8px",textAlign:"right",color:"#22c55e"}}>{L(p.revenue)}</td>
                          <td style={{padding:"7px 8px",textAlign:"right",color:p.hasRecipe?"#f97316":"#1d3b5b"}}>{p.hasRecipe?L(p.totalCost):"—"}</td>
                          <td style={{padding:"7px 8px",textAlign:"right",color:col,fontWeight:800}}>{p.hasRecipe?L(p.totalMargin):"—"}</td>
                        </tr>
                      );
                    })}
                    <tr style={{borderTop:"2px solid #1d3b5b",background:"#0f1c30",fontWeight:800}}>
                      <td colSpan={7} style={{padding:"10px 8px",color:"#8aafd2"}}>TOTAL</td>
                      <td style={{padding:"10px 8px",textAlign:"right",color:"#22c55e"}}>{L(costData.totalRevenue)}</td>
                      <td style={{padding:"10px 8px",textAlign:"right",color:"#f97316"}}>{L(costData.totalCOGS)}</td>
                      <td style={{padding:"10px 8px",textAlign:"right",color:costData.grossProfit>=0?"#22c55e":"#ef4444",fontSize:12}}>{L(costData.grossProfit)}</td>
                    </tr>
                  </tbody>
                </table>
            }
          </Card>
        </div>
      )}

      {/* ── TAB: DETALLE DIARIO ───────────────────────────────────────────── */}
      {tab==="detalle" && (
        <Card>
          <h2 style={{color:"#d4e8f7",fontSize:14,fontWeight:700,marginBottom:12}}>📋 Detalle por Fecha</h2>
          {filtered.length===0
            ? <p style={{color:"#3a5c7f",fontSize:12,textAlign:"center",padding:16}}>Sin registros en el período</p>
            : <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead><tr style={{background:"#16304a"}}>
                  {["Fecha","Sucursal","Ventas","Gastos","Utilidad","Depositado","Estado",""].map((h,i)=>(
                    <th key={h} style={{padding:"10px 10px",textAlign:i<2?"left":"right",color:"#5d85aa",fontSize:11,fontWeight:600}}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {filtered.map(s=>{
                    const br=data.branches.find(b=>b.id===s.branchId);
                    const util=s.totalSales-s.totalExpenses;
                    return (
                      <tr key={s.id} style={{borderTop:"1px solid #16304a"}}>
                        <td style={{padding:"10px 10px",color:"#8aafd2"}}>{s.date}</td>
                        <td style={{padding:"10px 10px",color:"#b8d8ee"}}>{br?.name||s.branchId}</td>
                        <td style={{padding:"10px 10px",textAlign:"right",color:"#22c55e",fontWeight:700}}>{L(s.totalSales)}</td>
                        <td style={{padding:"10px 10px",textAlign:"right",color:"#f97316"}}>{L(s.totalExpenses)}</td>
                        <td style={{padding:"10px 10px",textAlign:"right",fontWeight:700,color:util>=0?"#22c55e":"#ef4444"}}>{L(util)}</td>
                        <td style={{padding:"10px 10px",textAlign:"right",color:"#a78bfa"}}>{L(s.totalDeposited)}</td>
                        <td style={{padding:"10px 10px",textAlign:"right"}}>
                          <span style={{background:Math.abs(s.difference)<0.01?"#064e3b":"#450a0a",color:Math.abs(s.difference)<0.01?"#22c55e":"#ef4444",padding:"2px 8px",borderRadius:5,fontSize:10,fontWeight:700}}>
                            {Math.abs(s.difference)<0.01?"✓ OK":"⚠ "+L(s.difference)}
                          </span>
                        </td>
                        <td style={{padding:"10px 10px",textAlign:"right"}}>
                          {onEditSale && (
                            <button onClick={()=>onEditSale(s.id)}
                              style={{background:"none",border:"1px solid #1d3b5b",color:"#60a5fa",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:11}}>
                              ✎ Editar
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
          }
        </Card>
      )}
      {showMonthly && (
        <PrintableMonthlyClose
          data={data}
          month={monthlyMonth}
          branchId={branchFilter}
          onClose={()=>setShowMonthly(false)}
        />
      )}
      {showPdf && (
        <PrintableReportSummary
          filtered={filtered} branches={data.branches} totals={tot}
          catRev={catRev} depositsByBank={depositsByBank} expByDesc={expByDesc}
          depositsByMonthWeek={depositsByMonthWeek} range={range}
          dateFrom={dateFrom} dateTo={dateTo} branchFilter={branchFilter}
          onClose={()=>setShowPdf(false)}
        />
      )}
    </div>
  );
}

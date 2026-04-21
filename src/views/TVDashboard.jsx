import { useState, useEffect, useMemo } from "react";
import { L, today } from "../lib/helpers";

export function TVDashboard({data,onExit}) {
  const [clock,setClock] = useState(new Date());
  const td = today();
  const thisMonth = td.slice(0,7);

  useEffect(()=>{
    const t = setInterval(()=>setClock(new Date()),1000);
    return ()=>clearInterval(t);
  },[]);

  const todayS  = data.sales.filter(s=>s.date===td);
  const monthS  = data.sales.filter(s=>s.date.startsWith(thisMonth));

  const todayByBranch = data.branches.map(b=>{
    const bs=todayS.filter(s=>s.branchId===b.id);
    return {b,sales:bs.reduce((a,s)=>a+s.totalSales,0),n:bs.length};
  });

  const topToday = useMemo(()=>{
    const m={};
    todayS.forEach(s=>s.items.forEach(it=>{
      if(!m[it.productName])m[it.productName]={qty:0,rev:0};
      m[it.productName].qty+=it.qty; m[it.productName].rev+=it.total;
    }));
    return Object.entries(m).sort((a,b)=>b[1].rev-a[1].rev).slice(0,5);
  },[todayS]);

  const monthTotal = monthS.reduce((a,s)=>a+s.totalSales,0);

  const branchGoals = data.branches.map(b=>{
    const goal  = b.goals?.[thisMonth]||0;
    const sales = monthS.filter(s=>s.branchId===b.id).reduce((a,s)=>a+s.totalSales,0);
    return {b,goal,sales,pct:goal>0?Math.min((sales/goal)*100,100):0};
  }).filter(bg=>bg.goal>0);

  return (
    <div style={{height:"100vh",background:"#030611",display:"flex",flexDirection:"column",padding:32,gap:24,position:"relative"}}>
      {/* Exit */}
      <button onClick={onExit} style={{position:"absolute",top:16,right:16,background:"rgba(255,255,255,0.05)",border:"1px solid #1d3b5b",color:"#3a5c7f",borderRadius:8,padding:"6px 14px",cursor:"pointer",fontSize:12}}>
        ✕ Salir
      </button>

      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <div style={{width:48,height:48,borderRadius:"50%",background:"#0369a1",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:900,fontSize:22}}>⚓</div>
          <div>
            <p style={{color:"#d4e8f7",fontWeight:900,fontSize:24,letterSpacing:3,margin:0}}>LA MAR</p>
            <p style={{color:"#5d85aa",fontSize:13,margin:0}}>Control en tiempo real</p>
          </div>
        </div>
        <div style={{textAlign:"right"}}>
          <p style={{color:"#d4e8f7",fontSize:36,fontWeight:900,margin:0,fontVariantNumeric:"tabular-nums"}}>
            {clock.toLocaleTimeString("es-HN",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}
          </p>
          <p style={{color:"#5d85aa",fontSize:12,margin:0}}>{td}</p>
        </div>
      </div>

      {/* Main KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:20}}>
        {[
          ["Ventas Hoy",todayS.reduce((a,s)=>a+s.totalSales,0),"#22c55e","💰"],
          ["Ventas del Mes",monthTotal,"#60a5fa","📅"],
          ["Días Registrados",data.sales.length,"#a78bfa","📋"],
        ].map(([lbl,val,col,icon])=>(
          <div key={lbl} style={{background:"#0a1525",border:"1px solid #1d3b5b",borderRadius:20,padding:24,textAlign:"center"}}>
            <p style={{color:"#5d85aa",fontSize:12,textTransform:"uppercase",letterSpacing:2,margin:"0 0 10px"}}>{icon} {lbl}</p>
            <p style={{color:col,fontSize:typeof val==="number"&&val>999?28:36,fontWeight:900,margin:0}}>
              {typeof val==="number"&&val>100?L(val):val}
            </p>
          </div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,flex:1}}>
        {/* Por sucursal hoy */}
        <div style={{background:"#0a1525",border:"1px solid #1d3b5b",borderRadius:20,padding:24}}>
          <p style={{color:"#5d85aa",fontSize:13,textTransform:"uppercase",letterSpacing:2,margin:"0 0 16px",fontWeight:700}}>🏪 Sucursales — Hoy</p>
          {todayByBranch.map(({b,sales})=>(
            <div key={b.id} style={{marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                <span style={{color:"#b8d8ee",fontSize:14,fontWeight:600}}>{b.name}</span>
                <span style={{color:"#22c55e",fontSize:18,fontWeight:900}}>{L(sales)}</span>
              </div>
              {branchGoals.find(bg=>bg.b.id===b.id) && (()=>{
                const bg=branchGoals.find(bg=>bg.b.id===b.id);
                return (
                  <div>
                    <div style={{height:6,background:"#16304a",borderRadius:3,overflow:"hidden"}}>
                      <div style={{height:"100%",background:bg.pct>=100?"#22c55e":bg.pct>=70?"#fbbf24":"#0369a1",width:`${bg.pct}%`,borderRadius:3}}/>
                    </div>
                    <p style={{color:"#3a5c7f",fontSize:10,margin:"3px 0 0",textAlign:"right"}}>{bg.pct.toFixed(0)}% de meta mensual</p>
                  </div>
                );
              })()}
            </div>
          ))}
        </div>

        {/* Top 5 de hoy */}
        <div style={{background:"#0a1525",border:"1px solid #1d3b5b",borderRadius:20,padding:24}}>
          <p style={{color:"#5d85aa",fontSize:13,textTransform:"uppercase",letterSpacing:2,margin:"0 0 16px",fontWeight:700}}>🏆 Top Productos — Hoy</p>
          {topToday.length===0
            ? <p style={{color:"#1d3b5b",fontSize:14,textAlign:"center",marginTop:30}}>Sin ventas hoy todavía</p>
            : topToday.map(([name,{qty,rev}],i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,paddingBottom:12,borderBottom:"1px solid #16304a"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <span style={{color:"#0369a1",fontWeight:900,fontSize:16,width:20}}>{i+1}</span>
                    <span style={{color:"#b8d8ee",fontSize:14}}>{name}</span>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <p style={{color:"#d4e8f7",fontWeight:700,fontSize:14,margin:0}}>{L(rev)}</p>
                    <p style={{color:"#5d85aa",fontSize:11,margin:0}}>{qty} unidades</p>
                  </div>
                </div>
              ))
          }
        </div>
      </div>
    </div>
  );
}

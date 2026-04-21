// ─── SHARED COMPONENTS ───────────────────────────────────────────────────────
// UI primitives reutilizables en toda la app (tarjetas, secciones, botones).
// Extraído de App.jsx en refactor v2.1 — sin cambios de comportamiento.

export function KCard({label,val,sub,col,icon}) {
  return (
    <div style={{background:"#0c1828",border:"1px solid #1d3b5b",borderRadius:14,padding:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
        <p style={{color:"#5d85aa",fontSize:10,textTransform:"uppercase",letterSpacing:1.5,margin:0,fontWeight:600}}>{label}</p>
        <span style={{fontSize:18}}>{icon}</span>
      </div>
      <p style={{color:col,fontSize:18,fontWeight:800,margin:"0 0 4px"}}>{val}</p>
      <p style={{color:"#5d85aa",fontSize:10,margin:0}}>{sub}</p>
    </div>
  );
}

export function Card({children}) {
  return <div style={{background:"#0c1828",border:"1px solid #1d3b5b",borderRadius:14,padding:20}}>{children}</div>;
}

export function Section({label,children}) {
  return (
    <div>
      <p style={{color:"#5d85aa",fontSize:10,textTransform:"uppercase",letterSpacing:2,marginBottom:10,fontWeight:600}}>{label}</p>
      {children}
    </div>
  );
}

export function Btn({onClick,children}) {
  return (
    <button onClick={onClick} style={{width:24,height:24,borderRadius:6,background:"#1d3b5b",border:"none",color:"#d4e8f7",fontSize:14,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1}}>
      {children}
    </button>
  );
}

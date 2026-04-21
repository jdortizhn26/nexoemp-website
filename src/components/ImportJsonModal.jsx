import { useState } from "react";

export function ImportJsonModal({ branches, importSales, onClose }) {
  const [text, setText]             = useState("");
  const [msg, setMsg]               = useState("");
  const [targetBranch, setTargetBranch] = useState(""); // "" = auto (usar branchId del JSON)

  const handleImport = async () => {
    try {
      const parsed = JSON.parse(text.trim());
      let incoming = parsed.sales || (Array.isArray(parsed) ? parsed : [parsed]);
      if (!incoming.length) { setMsg("❌ No se encontraron registros."); return; }

      // Si el admin eligió una sucursal destino, sobrescribimos el branchId de cada registro
      if (targetBranch) {
        incoming = incoming.map(s => ({ ...s, branchId: targetBranch }));
      }

      const result = await importSales(incoming);
      const branchName = targetBranch ? branches.find(b => b.id === targetBranch)?.name : null;
      const suffix = branchName ? ` → ${branchName}` : "";
      setMsg(`✅ ${result.imported} día(s) importados${suffix}. ${result.skipped} ya existían.`);
      setTimeout(() => onClose(), 3000);
    } catch(e) { setMsg("❌ Error: " + e.message); }
  };

  const close = () => { setText(""); setMsg(""); setTargetBranch(""); onClose(); };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.82)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}}>
      <div style={{background:"#0f1c30",border:"1px solid #1d3b5b",borderRadius:16,padding:28,width:600,maxWidth:"90vw"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <h2 style={{color:"#d4e8f7",fontSize:16,fontWeight:800,margin:0}}>📥 Importar Ventas desde JSON</h2>
          <button onClick={close} style={{background:"none",border:"none",color:"#5d85aa",fontSize:22,cursor:"pointer",lineHeight:1}}>×</button>
        </div>

        <p style={{color:"#5d85aa",fontSize:12,marginBottom:12}}>
          Pega el JSON generado por Gemini. Formato: <code style={{color:"#8aafd2"}}>{"{ \"sales\": [...] }"}</code>
        </p>

        {/* Sucursal destino */}
        <div style={{marginBottom:12}}>
          <label style={{color:"#5d85aa",fontSize:10,display:"block",marginBottom:6,textTransform:"uppercase",letterSpacing:1}}>
            Sucursal destino
          </label>
          <select value={targetBranch} onChange={e=>setTargetBranch(e.target.value)}
            style={{width:"100%",background:"#0f0a06",border:`1px solid ${targetBranch?"#0369a1":"#1d3b5b"}`,borderRadius:9,color:"#d4e8f7",fontSize:12,padding:"10px 12px",outline:"none",boxSizing:"border-box"}}>
            <option value="">🔀 Auto — usar el branchId del JSON</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>🏪 {b.name} (sobrescribir branchId)</option>
            ))}
          </select>
          {targetBranch && (
            <p style={{color:"#fbbf24",fontSize:10,margin:"6px 0 0"}}>
              ⚠ Todos los registros del JSON se asignarán a esta sucursal, ignorando el <code>branchId</code> original.
            </p>
          )}
        </div>

        <textarea value={text} onChange={e=>setText(e.target.value)} placeholder='{ "sales": [ ... ] }'
          style={{width:"100%",height:200,background:"#0f0a06",border:"1px solid #1d3b5b",borderRadius:10,color:"#d4e8f7",fontSize:11,padding:12,resize:"vertical",boxSizing:"border-box",fontFamily:"monospace",outline:"none"}}
        />

        {msg && (
          <div style={{marginTop:10,padding:"8px 12px",borderRadius:8,background:msg.startsWith("✅")?"#064e3b":"#450a0a",color:msg.startsWith("✅")?"#22c55e":"#ef4444",fontSize:12,fontWeight:600}}>{msg}</div>
        )}

        <div style={{display:"flex",gap:10,marginTop:14,justifyContent:"flex-end"}}>
          <button onClick={close}
            style={{background:"none",border:"1px solid #1d3b5b",color:"#5d85aa",borderRadius:9,padding:"9px 18px",cursor:"pointer",fontSize:12}}>Cancelar</button>
          <button onClick={handleImport} disabled={!text.trim()}
            style={{background:text.trim()?"#0369a1":"#1d3b5b",color:text.trim()?"#fff":"#3a5c7f",border:"none",borderRadius:9,padding:"9px 20px",fontWeight:700,fontSize:12,cursor:text.trim()?"pointer":"not-allowed"}}>
            Importar Datos
          </button>
        </div>
      </div>
    </div>
  );
}

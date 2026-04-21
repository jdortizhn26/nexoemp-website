import { useState } from "react";
import { L, today, uid } from "../lib/helpers";

const ADMIN_PIN = "1234";

export function BranchesView({data,addBranch,deleteBranch,updateBranch,saveGoal,saveDefaultExpenses}) {
  const [name,setName]         = useState("");
  const [loc,setLoc]           = useState("");
  const [pinModal,setPinModal] = useState(null);
  const [pinInput,setPinInput] = useState("");
  const [pinError,setPinError] = useState("");
  const [editId,setEditId]     = useState(null);
  const [editName,setEditName] = useState("");
  const [editLoc,setEditLoc]   = useState("");
  const [goalModal,setGoalModal] = useState(null); // {branchId, month}
  const [goalValue,setGoalValue] = useState("");
  const [expModal,setExpModal] = useState(null); // {branchId, items}

  const thisMonth = today().slice(0,7);
  const inp = (s={}) => ({background:"#11233a",border:"1px solid #1d3b5b",borderRadius:9,padding:"9px 12px",color:"#d4e8f7",fontSize:12,outline:"none",...s});

  const requestPin = (action, payload) => { setPinModal({action,payload}); setPinInput(""); setPinError(""); };

  const confirmPin = () => {
    if(pinInput !== ADMIN_PIN) { setPinError("PIN incorrecto"); setPinInput(""); return; }
    const {action,payload} = pinModal;
    if(action==="delete")    deleteBranch(payload);
    else if(action==="edit") { setEditId(payload.id); setEditName(payload.name); setEditLoc(payload.loc||""); }
    else if(action==="saveEdit") { updateBranch({...payload,name:editName,loc:editLoc}); setEditId(null); }
    else if(action==="goal")     { setGoalModal(payload); setGoalValue(payload.current||""); }
    else if(action==="defExp")   { setExpModal({branchId:payload.branchId, items:[...(payload.items||[])]}); }
    setPinModal(null); setPinInput(""); setPinError("");
  };

  const saveGoalValue = async () => {
    if(!goalModal) return;
    await saveGoal(goalModal.branchId, goalModal.month, Number(goalValue));
    setGoalModal(null); setGoalValue("");
  };

  const saveDefExpValues = async () => {
    if(!expModal) return;
    const clean = expModal.items
      .filter(it=>it.description?.trim() && Number(it.amount)>=0)
      .map(it=>({description:it.description.trim(), amount:Number(it.amount)||0, type:it.type||"efectivo"}));
    await saveDefaultExpenses(expModal.branchId, clean);
    setExpModal(null);
  };

  const add = () => {
    if(!name.trim()) return;
    addBranch({id:uid(),name:name.trim(),loc:loc.trim()});
    setName(""); setLoc("");
  };

  return (
    <div style={{padding:24,maxWidth:780}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
        <div>
          <h1 style={{color:"#d4e8f7",fontSize:22,fontWeight:800,margin:0}}>🏪 Gestión de Sucursales</h1>
          <p style={{color:"#5d85aa",fontSize:12,marginTop:4}}>Editar, eliminar y configurar metas requiere PIN de administrador.</p>
        </div>
        <div style={{background:"#16304a",border:"1px solid #1d3b5b",borderRadius:10,padding:"8px 14px",display:"flex",alignItems:"center",gap:6}}>
          <span>🔐</span><span style={{color:"#5d85aa",fontSize:11}}>Solo administrador</span>
        </div>
      </div>

      {/* Agregar */}
      <div style={{background:"#0c1828",border:"1px solid #1d3b5b",borderRadius:14,padding:20,marginBottom:20}}>
        <h2 style={{color:"#d4e8f7",fontSize:14,fontWeight:700,marginBottom:14}}>Agregar Sucursal</h2>
        <div style={{display:"flex",gap:10}}>
          <input placeholder="Nombre" value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()} style={{...inp(),flex:1}}/>
          <input placeholder="Ubicación" value={loc} onChange={e=>setLoc(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()} style={{...inp(),flex:1}}/>
          <button onClick={add} style={{background:"#0369a1",color:"#fff",border:"none",borderRadius:9,padding:"9px 18px",fontWeight:700,fontSize:12,cursor:"pointer"}}>Agregar</button>
        </div>
      </div>

      {/* Lista */}
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {data.branches.map(b=>{
          const salesCount = data.sales.filter(s=>s.branchId===b.id).length;
          const totalRev   = data.sales.filter(s=>s.branchId===b.id).reduce((a,s)=>a+s.totalSales,0);
          const goal       = b.goals?.[thisMonth]||0;
          const monthSales = data.sales.filter(s=>s.branchId===b.id&&s.date.startsWith(thisMonth)).reduce((a,s)=>a+s.totalSales,0);
          const goalPct    = goal>0?Math.min((monthSales/goal)*100,100):0;
          const isEditing  = editId===b.id;
          return (
            <div key={b.id} style={{background:"#0c1828",border:`1px solid ${isEditing?"#0369a1":"#1d3b5b"}`,borderRadius:14,padding:"16px 20px"}}>
              {isEditing ? (
                <div>
                  <p style={{color:"#0369a1",fontSize:11,fontWeight:700,margin:"0 0 12px",textTransform:"uppercase",letterSpacing:1}}>✏️ Editando</p>
                  <div style={{display:"flex",gap:10,marginBottom:12}}>
                    <div style={{flex:1}}><label style={{color:"#5d85aa",fontSize:10,display:"block",marginBottom:4}}>NOMBRE</label><input value={editName} onChange={e=>setEditName(e.target.value)} style={{...inp(),width:"100%",boxSizing:"border-box"}}/></div>
                    <div style={{flex:1}}><label style={{color:"#5d85aa",fontSize:10,display:"block",marginBottom:4}}>UBICACIÓN</label><input value={editLoc} onChange={e=>setEditLoc(e.target.value)} style={{...inp(),width:"100%",boxSizing:"border-box"}}/></div>
                  </div>
                  <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
                    <button onClick={()=>setEditId(null)} style={{background:"none",border:"1px solid #1d3b5b",color:"#5d85aa",borderRadius:8,padding:"7px 16px",cursor:"pointer",fontSize:12}}>Cancelar</button>
                    <button onClick={()=>requestPin("saveEdit",b)} style={{background:"#0369a1",color:"#fff",border:"none",borderRadius:8,padding:"7px 18px",fontWeight:700,fontSize:12,cursor:"pointer"}}>Guardar</button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:goal>0?12:0}}>
                    <div>
                      <p style={{color:"#d4e8f7",fontWeight:700,fontSize:14,margin:0}}>{b.name}</p>
                      <p style={{color:"#5d85aa",fontSize:12,margin:"4px 0 0"}}>{b.loc||"Sin ubicación"} • {salesCount} registros • {L(totalRev)} total</p>
                    </div>
                    <div style={{display:"flex",gap:6}}>
                      <button onClick={()=>requestPin("goal",{branchId:b.id,month:thisMonth,current:goal||""})}
                        style={{background:"none",border:"1px solid #064e3b",color:"#22c55e",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:11}}>🎯 Meta</button>
                      <button onClick={()=>requestPin("defExp",{branchId:b.id,items:b.defaultExpenses||[]})}
                        style={{background:"none",border:"1px solid #451a03",color:"#fbbf24",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:11}}>💰 Gastos {b.defaultExpenses?.length?`(${b.defaultExpenses.length})`:""}</button>
                      <button onClick={()=>requestPin("edit",b)}
                        style={{background:"none",border:"1px solid #1d3b5b",color:"#8aafd2",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:11}}>✏️ Editar</button>
                      <button onClick={()=>requestPin("delete",b.id)}
                        style={{background:"none",border:"1px solid #450a0a",color:"#ef4444",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:11}}>🗑</button>
                    </div>
                  </div>
                  {goal>0 && (
                    <div>
                      <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:4}}>
                        <span style={{color:"#5d85aa"}}>Meta {thisMonth}: {L(goal)}</span>
                        <span style={{color:goalPct>=100?"#22c55e":goalPct>=70?"#fbbf24":"#f97316",fontWeight:700}}>{L(monthSales)} ({goalPct.toFixed(0)}%)</span>
                      </div>
                      <div style={{height:6,background:"#16304a",borderRadius:3,overflow:"hidden"}}>
                        <div style={{height:"100%",borderRadius:3,background:goalPct>=100?"#22c55e":goalPct>=70?"#fbbf24":"#0369a1",width:`${goalPct}%`}}/>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal PIN */}
      {pinModal && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999}}>
          <div style={{background:"#0f1c30",border:"1px solid #1d3b5b",borderRadius:16,padding:28,width:340,textAlign:"center"}}>
            <p style={{fontSize:36,margin:"0 0 12px"}}>🔐</p>
            <h2 style={{color:"#d4e8f7",fontSize:15,fontWeight:800,margin:"0 0 20px"}}>PIN de Administrador</h2>
            <input type="password" placeholder="PIN" value={pinInput} onChange={e=>setPinInput(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&confirmPin()} autoFocus
              style={{width:"100%",boxSizing:"border-box",background:"#0f0a06",border:`1px solid ${pinError?"#ef4444":"#1d3b5b"}`,borderRadius:10,
                padding:"12px",color:"#d4e8f7",fontSize:18,textAlign:"center",letterSpacing:8,outline:"none",marginBottom:6}}/>
            {pinError && <p style={{color:"#ef4444",fontSize:11,margin:"0 0 12px"}}>{pinError}</p>}
            <div style={{display:"flex",gap:8,marginTop:16}}>
              <button onClick={()=>{setPinModal(null);setPinInput("");setPinError("");}} style={{flex:1,background:"none",border:"1px solid #1d3b5b",color:"#5d85aa",borderRadius:9,padding:"10px 0",cursor:"pointer",fontSize:12}}>Cancelar</button>
              <button onClick={confirmPin} style={{flex:1,background:"#0369a1",color:"#fff",border:"none",borderRadius:9,padding:"10px 0",fontWeight:700,fontSize:12,cursor:"pointer"}}>Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Meta */}
      {goalModal && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999}}>
          <div style={{background:"#0f1c30",border:"1px solid #1d3b5b",borderRadius:16,padding:28,width:380}}>
            <h2 style={{color:"#d4e8f7",fontSize:15,fontWeight:800,margin:"0 0 6px"}}>🎯 Meta Mensual</h2>
            <p style={{color:"#5d85aa",fontSize:12,margin:"0 0 16px"}}>Mes: {goalModal.month} — {data.branches.find(b=>b.id===goalModal.branchId)?.name}</p>
            <div style={{marginBottom:16}}>
              <label style={{color:"#5d85aa",fontSize:10,display:"block",marginBottom:6}}>META DE VENTAS (L)</label>
              <input type="number" value={goalValue} onChange={e=>setGoalValue(e.target.value)} placeholder="Ej: 300000"
                style={{...inp(),width:"100%",boxSizing:"border-box",fontSize:18,textAlign:"center",padding:"14px"}}/>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>{setGoalModal(null);setGoalValue("");}} style={{flex:1,background:"none",border:"1px solid #1d3b5b",color:"#5d85aa",borderRadius:9,padding:"10px 0",cursor:"pointer",fontSize:12}}>Cancelar</button>
              <button onClick={saveGoalValue} style={{flex:1,background:"#22c55e",color:"#000",border:"none",borderRadius:9,padding:"10px 0",fontWeight:800,fontSize:12,cursor:"pointer"}}>Guardar Meta</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Gastos Habituales */}
      {expModal && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999}}>
          <div style={{background:"#0f1c30",border:"1px solid #1d3b5b",borderRadius:16,padding:28,width:640,maxWidth:"92vw",maxHeight:"90vh",overflowY:"auto"}}>
            <h2 style={{color:"#d4e8f7",fontSize:15,fontWeight:800,margin:"0 0 6px"}}>💰 Gastos Habituales</h2>
            <p style={{color:"#5d85aa",fontSize:12,margin:"0 0 16px"}}>
              {data.branches.find(b=>b.id===expModal.branchId)?.name} — se precargan al ingresar ventas diarias.
            </p>

            {/* Tabla */}
            <div style={{display:"grid",gridTemplateColumns:"3fr 1fr 1.2fr auto",gap:8,marginBottom:6,paddingBottom:6,borderBottom:"1px solid #1d3b5b"}}>
              {["DESCRIPCIÓN","MONTO (L)","TIPO",""].map(h=>(
                <span key={h} style={{color:"#5d85aa",fontSize:10,fontWeight:600,letterSpacing:1}}>{h}</span>
              ))}
            </div>
            {expModal.items.length===0 && (
              <p style={{color:"#3a5c7f",fontSize:12,textAlign:"center",padding:"16px 0"}}>Sin gastos configurados — agrega abajo</p>
            )}
            {expModal.items.map((it,i)=>(
              <div key={i} style={{display:"grid",gridTemplateColumns:"3fr 1fr 1.2fr auto",gap:8,marginBottom:8,alignItems:"center"}}>
                <input placeholder="Ej. Gas, Agua, Empaques" value={it.description||""}
                  onChange={e=>setExpModal(m=>({...m,items:m.items.map((x,j)=>j===i?{...x,description:e.target.value}:x)}))}
                  style={inp({width:"100%",boxSizing:"border-box"})}/>
                <input type="number" placeholder="0" value={it.amount||""}
                  onChange={e=>setExpModal(m=>({...m,items:m.items.map((x,j)=>j===i?{...x,amount:e.target.value}:x)}))}
                  style={inp({width:"100%",boxSizing:"border-box",textAlign:"right"})}/>
                <select value={it.type||"efectivo"}
                  onChange={e=>setExpModal(m=>({...m,items:m.items.map((x,j)=>j===i?{...x,type:e.target.value}:x)}))}
                  style={inp({width:"100%",boxSizing:"border-box"})}>
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="transferencia">Transferencia</option>
                </select>
                <button onClick={()=>setExpModal(m=>({...m,items:m.items.filter((_,j)=>j!==i)}))}
                  style={{background:"none",border:"none",color:"#3a5c7f",fontSize:18,cursor:"pointer",lineHeight:1}}>×</button>
              </div>
            ))}

            <button onClick={()=>setExpModal(m=>({...m,items:[...m.items,{description:"",amount:"",type:"efectivo"}]}))}
              style={{color:"#0369a1",background:"none",border:"none",cursor:"pointer",fontSize:12,fontWeight:600,marginTop:6}}>+ Agregar gasto habitual</button>

            <div style={{display:"flex",gap:8,marginTop:20,paddingTop:16,borderTop:"1px solid #1d3b5b"}}>
              <button onClick={()=>setExpModal(null)} style={{flex:1,background:"none",border:"1px solid #1d3b5b",color:"#5d85aa",borderRadius:9,padding:"10px 0",cursor:"pointer",fontSize:12}}>Cancelar</button>
              <button onClick={saveDefExpValues} style={{flex:1,background:"#22c55e",color:"#000",border:"none",borderRadius:9,padding:"10px 0",fontWeight:800,fontSize:12,cursor:"pointer"}}>Guardar Gastos</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useMemo, useEffect } from "react";
import { L, today, uid } from "../lib/helpers";
import { CATEGORIES as BASE_CATEGORIES, BANKS, PENDING_BANK, resolveProducts, resolveCategories, resolveBanks } from "../lib/catalog";
import { Btn } from "../components/ui";
import { PrintableReport } from "../components/PrintableReport";

export function SalesView({data,saveSale,userRole,editSale,onEditDone}) {
  const editing = !!editSale;
  const [date,setDate]     = useState(editSale?.date || today());
  const [branchId,setBranchId] = useState(
    editSale?.branchId ||
    (userRole?.role==="branch" ? userRole.branchId : (data.branches[0]?.id||""))
  );
  // Productos resueltos (mergea base + Firestore overrides). Se computa primero
  // para poder detectar qué items de la venta corresponden a productos del
  // catálogo y cuáles son manuales (vienen con productId = "manual" o vacío).
  const resolvedProducts = useMemo(()=>resolveProducts(data?.products||[]),[data?.products]);
  const resolvedCats     = useMemo(()=>resolveCategories(data?.products||[]),[data?.products]);
  const resolvedBanks    = useMemo(()=>resolveBanks(data?.bankAccounts||[]),[data?.bankAccounts]);

  // Split inicial de items: catálogo vs manuales
  const validIds = useMemo(()=>new Set(resolvedProducts.map(p=>p.id)),[resolvedProducts]);
  const initialItems = useMemo(()=>{
    if(!editSale?.items) return { catalog:{}, manual:[] };
    const catalog={}; const manual=[];
    editSale.items.forEach(it=>{
      if(it.productId && validIds.has(it.productId)) {
        catalog[it.productId]=(catalog[it.productId]||0)+Number(it.qty||0);
      } else {
        manual.push({
          productName: it.productName || "",
          category: it.category || "",
          qty: Number(it.qty||0),
          unitPrice: Number(it.unitPrice||0),
        });
      }
    });
    return { catalog, manual };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[editSale?.id, validIds]);

  const [items,setItems]   = useState(initialItems.catalog);
  const [manualItems,setManualItems] = useState(initialItems.manual);

  // Si cambia la venta en edición, re-inicializar
  useEffect(() => {
    setItems(initialItems.catalog);
    setManualItems(initialItems.manual);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editSale?.id, validIds]);

  const [expenses,setExpenses] = useState(()=>
    editSale?.expenses?.length
      ? editSale.expenses.map(e=>({desc:e.description,amt:String(e.amount),type:e.type||"efectivo"}))
      : [{desc:"",amt:"",type:"efectivo"}]
  );
  const [deposits,setDeposits] = useState(()=>
    editSale?.deposits?.length
      ? editSale.deposits.map(d=>({bank:d.bank,amt:String(d.amount),type:d.type||"deposito",ref:d.ref||""}))
      : [{bank:BANKS[0],amt:"",type:"deposito",ref:""}]
  );
  const [cashFund,setCashFund] = useState(editSale?.cashFund ?? 3000);
  const [cat,setCat]       = useState(resolvedCats[0] || BASE_CATEGORIES[0]);
  const [search,setSearch] = useState("");
  const [tab,setTab]       = useState("products");
  const [flash,setFlash]   = useState("");
  const [lastSale,setLastSale] = useState(null); // Para PDF
  const [showPDF,setShowPDF]   = useState(false);
  const [prefillInfo,setPrefillInfo] = useState(""); // Mensaje "se precargaron X gastos"

  const isBranchUser = userRole?.role === "branch";

  // ── Precargar gastos habituales al cambiar de sucursal ───────────────────
  // Solo si la lista de gastos actual está "vacía" (una sola fila sin datos).
  // Si el usuario ya empezó a llenar gastos, no tocamos nada.
  useEffect(() => {
    if (!branchId) return;
    const branch = data.branches.find(b => b.id === branchId);
    const defaults = branch?.defaultExpenses || [];
    if (defaults.length === 0) return;

    const isEmpty = expenses.length<=1 && expenses.every(e=>!e.desc && !e.amt);
    if (isEmpty) {
      // Carga directa: lista vacía
      setExpenses(defaults.map(d=>({desc:d.description, amt:String(d.amount), type:d.type||"efectivo"})));
      setPrefillInfo(`✓ ${defaults.length} gasto(s) habitual(es) precargados`);
      setTimeout(()=>setPrefillInfo(""), 4000);
    } else {
      // Append: agregar solo los habituales que no están ya presentes (por descripción)
      const existingDescs = new Set(expenses.map(e=>(e.desc||"").trim().toLowerCase()).filter(Boolean));
      const missing = defaults.filter(d=>!existingDescs.has((d.description||"").trim().toLowerCase()));
      if (missing.length > 0) {
        setExpenses(prev => {
          // sacar filas totalmente vacías para después re-poner una al final
          const cleaned = prev.filter(e => e.desc || e.amt);
          return [
            ...cleaned,
            ...missing.map(d=>({desc:d.description, amt:"", type:d.type||"efectivo"})),
            { desc:"", amt:"", type:"efectivo" }, // fila vacía al final
          ];
        });
        setPrefillInfo(`✓ ${missing.length} gasto(s) habitual(es) agregado(s) — llená los montos`);
        setTimeout(()=>setPrefillInfo(""), 5000);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId, data.branches]);

  const filtered=useMemo(()=>
    search ? resolvedProducts.filter(p=>p.name.toLowerCase().includes(search.toLowerCase()))
           : resolvedProducts.filter(p=>p.cat===cat),
  [cat,search,resolvedProducts]);

  const saleItems=useMemo(()=>{
    const catalogItems = Object.entries(items).filter(([,q])=>q>0).map(([id,qty])=>{
      const p=resolvedProducts.find(p=>p.id===id);
      if(!p) return null;
      return {productId:id,productName:p.name,category:p.cat,qty,unitPrice:p.price,total:qty*p.price};
    }).filter(Boolean);
    const manualValid = manualItems
      .filter(m=>m.productName && Number(m.qty)>0 && Number(m.unitPrice)>=0)
      .map(m=>({
        productId: "manual",
        productName: m.productName,
        category: m.category || "Manual",
        qty: Number(m.qty),
        unitPrice: Number(m.unitPrice),
        total: Number(m.qty) * Number(m.unitPrice),
      }));
    return [...catalogItems, ...manualValid];
  },[items,resolvedProducts,manualItems]);

  const totalSales = saleItems.reduce((a,i)=>a+i.total,0);
  const totalExp   = expenses.filter(e=>e.desc&&Number(e.amt)>0).reduce((a,e)=>a+Number(e.amt),0);
  const totalDep   = deposits.filter(d=>Number(d.amt)>0).reduce((a,d)=>a+Number(d.amt),0);
  const toDeposit  = totalSales-totalExp;
  const diff       = totalDep-toDeposit;

  const setQty=(id,v)=>setItems(p=>({...p,[id]:Math.max(0,parseInt(v)||0)}));

  const submit=()=>{
    if(!branchId) return alert("Selecciona una sucursal");
    if(saleItems.length===0) return alert("Ingresa al menos un producto vendido");
    // Validación de descuadre
    if(Math.abs(diff) >= 0.01) {
      const msg = `⚠ El cuadre está descuadrado por ${L(diff)}.\n\n`+
        `A depositar: ${L(toDeposit)}\n`+
        `Total depósitos: ${L(totalDep)}\n\n`+
        `¿Guardar igual? (recomendado revisar antes)`;
      if(!confirm(msg)) return;
    }
    const sale={
      id: editing ? editSale.id : uid(),
      branchId,date,items:saleItems,
      expenses:expenses.filter(e=>e.desc&&Number(e.amt)>0).map(e=>({description:e.desc,amount:Number(e.amt),type:e.type})),
      deposits:deposits.filter(d=>Number(d.amt)>0).map(d=>({bank:d.bank,amount:Number(d.amt),type:d.type,...(d.bank===PENDING_BANK?{pending:true}:{}),...(d.ref?.trim()?{ref:d.ref.trim()}:{})})),
      cashFund,totalSales,totalExpenses:totalExp,toDeposit,totalDeposited:totalDep,difference:diff,
      submittedAt: editing ? editSale.submittedAt : new Date().toISOString(),
      ...(editing ? { updatedAt: new Date().toISOString(), updatedBy: userRole?.uid || null } : {}),
    };
    saveSale(sale);
    setLastSale(sale);
    if(editing){
      setFlash("✓ Venta actualizada"); setTimeout(()=>setFlash(""),4000);
      onEditDone?.();
    } else {
      setItems({}); setManualItems([]); setExpenses([{desc:"",amt:"",type:"efectivo"}]); setDeposits([{bank:BANKS[0],amt:"",type:"deposito",ref:""}]);
      setFlash("✓ Guardado"); setTimeout(()=>setFlash(""),4000);
    }
  };

  const inp=(s={})=>({background:"#11233a",border:"1px solid #1d3b5b",borderRadius:8,padding:"8px 10px",color:"#d4e8f7",fontSize:12,outline:"none",...s});

  return (
    <div style={{display:"flex",height:"100%",overflow:"hidden"}}>
      {showPDF && lastSale && (
        <PrintableReport sale={lastSale} branches={data.branches} onClose={()=>setShowPDF(false)}/>
      )}
      {/* LEFT */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{padding:"16px 20px",borderBottom:"1px solid #1d3b5b",background:"#0a1525",flexShrink:0}}>
          <h1 style={{color:"#d4e8f7",fontSize:18,fontWeight:800,margin:"0 0 12px"}}>
            {editing ? `✎ Editando venta — ${editSale.date}` : "📋 Ingreso de Ventas Diarias"}
          </h1>
          {editing && (
            <div style={{background:"#1e3a8a",border:"1px solid #60a5fa",borderRadius:8,padding:"8px 12px",marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{color:"#93c5fd",fontSize:12,fontWeight:600}}>✎ Modo edición — los cambios reemplazarán la venta original</span>
              <button onClick={()=>onEditDone?.()}
                style={{background:"none",border:"1px solid #3730a3",color:"#93c5fd",borderRadius:6,padding:"4px 12px",cursor:"pointer",fontSize:11}}>
                Cancelar edición
              </button>
            </div>
          )}
          <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
            <div>
              <label style={{color:"#5d85aa",fontSize:10,display:"block",marginBottom:4}}>SUCURSAL</label>
              <select value={branchId} onChange={e=>setBranchId(e.target.value)} disabled={isBranchUser} style={{...inp(),paddingRight:28,opacity:isBranchUser?0.7:1}}>
                {data.branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{color:"#5d85aa",fontSize:10,display:"block",marginBottom:4}}>FECHA</label>
              <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={inp()}/>
            </div>
            <div>
              <label style={{color:"#5d85aa",fontSize:10,display:"block",marginBottom:4}}>FONDO EN CAJA (L)</label>
              <input type="number" value={cashFund} onChange={e=>setCashFund(Number(e.target.value))} style={{...inp(),width:90}}/>
            </div>
          </div>
        </div>
        <div style={{display:"flex",borderBottom:"1px solid #1d3b5b",flexShrink:0}}>
          {[["products","🦐 Productos"],["expenses","💸 Gastos"],["deposits","🏦 Depósitos"]].map(([t,lbl])=>(
            <button key={t} onClick={()=>setTab(t)} style={{
              padding:"10px 18px",fontSize:12,fontWeight:tab===t?700:400,border:"none",borderBottom:tab===t?"2px solid #0369a1":"2px solid transparent",
              background:"none",cursor:"pointer",color:tab===t?"#d4e8f7":"#5d85aa",transition:"all .15s"
            }}>{lbl}</button>
          ))}
        </div>
        {tab==="products" && (
          <div style={{display:"flex",flex:1,overflow:"hidden"}}>
            <div style={{width:150,borderRight:"1px solid #1d3b5b",overflowY:"auto",background:"#0f0a06",padding:8,flexShrink:0}}>
              {resolvedCats.map(c=>(
                <button key={c} onClick={()=>{setCat(c);setSearch("");}} style={{
                  display:"block",width:"100%",textAlign:"left",padding:"7px 10px",borderRadius:7,border:"none",cursor:"pointer",fontSize:11,marginBottom:2,
                  background:cat===c&&!search?"#0369a1":"transparent",color:cat===c&&!search?"#fff":"#8aafd2",
                }}>{c}</button>
              ))}
            </div>
            <div style={{flex:1,overflowY:"auto",padding:14}}>
              <input placeholder="🔍 Buscar producto…" value={search} onChange={e=>setSearch(e.target.value)}
                style={{...inp(),width:"100%",boxSizing:"border-box",marginBottom:12}}/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                {filtered.map(p=>{
                  const q=items[p.id]||0;
                  return (
                    <div key={p.id} style={{background:q>0?"#201008":"#0c1828",border:`1px solid ${q>0?"#0369a1":"#1d3b5b"}`,borderRadius:10,padding:"10px 12px",display:"flex",alignItems:"center",gap:8}}>
                      <div style={{flex:1,minWidth:0}}>
                        <p style={{color:"#b8d8ee",fontSize:11,fontWeight:600,margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</p>
                        <p style={{color:"#5d85aa",fontSize:10,margin:"2px 0 0"}}>L {p.price}</p>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
                        <Btn onClick={()=>setQty(p.id,q-1)}>−</Btn>
                        <input type="number" min="0" value={q||""} placeholder="0" onChange={e=>setQty(p.id,e.target.value)}
                          style={{width:36,textAlign:"center",background:"#16304a",border:"1px solid #1d3b5b",borderRadius:5,color:"#d4e8f7",fontSize:11,padding:"4px 2px"}}/>
                        <Btn onClick={()=>setQty(p.id,q+1)}>+</Btn>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        {tab==="products" && manualItems.length>0 && (
          <div style={{padding:"0 20px 20px"}}>
            <div style={{background:"#1a1005",border:"1px solid #92400e",borderRadius:10,padding:14}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <div>
                  <p style={{color:"#fbbf24",fontSize:13,fontWeight:700,margin:0}}>
                    📝 {manualItems.length} ítem(s) manual(es) {editing?"importado(s)":"agregado(s)"}
                  </p>
                  <p style={{color:"#92400e",fontSize:10,margin:"3px 0 0"}}>
                    Productos que no están en el catálogo (o vienen de importación por JSON). Editables abajo.
                  </p>
                </div>
                <button onClick={()=>setManualItems(p=>[...p,{productName:"",category:"Manual",qty:1,unitPrice:0}])}
                  style={{background:"none",border:"1px solid #92400e",color:"#fbbf24",borderRadius:7,padding:"5px 12px",cursor:"pointer",fontSize:11,fontWeight:600}}>
                  + Agregar
                </button>
              </div>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                <thead><tr style={{background:"#1e0e06"}}>
                  {["Producto","Categoría","Cant.","P. Unit.","Total",""].map((h,i)=>(
                    <th key={h} style={{padding:"6px 8px",textAlign:i>=2?"right":"left",color:"#5d85aa",fontSize:10,fontWeight:600}}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {manualItems.map((it,i)=>(
                    <tr key={i} style={{borderTop:"1px solid #16304a"}}>
                      <td style={{padding:"5px 8px"}}>
                        <input value={it.productName} onChange={e=>setManualItems(p=>p.map((x,j)=>j===i?{...x,productName:e.target.value}:x))}
                          placeholder="Nombre del producto"
                          style={{background:"#11233a",border:"1px solid #1d3b5b",borderRadius:5,color:"#d4e8f7",fontSize:11,padding:"4px 7px",width:"100%",boxSizing:"border-box"}}/>
                      </td>
                      <td style={{padding:"5px 8px"}}>
                        <input value={it.category} onChange={e=>setManualItems(p=>p.map((x,j)=>j===i?{...x,category:e.target.value}:x))}
                          style={{background:"#11233a",border:"1px solid #1d3b5b",borderRadius:5,color:"#8aafd2",fontSize:10,padding:"4px 7px",width:"100%",boxSizing:"border-box"}}/>
                      </td>
                      <td style={{padding:"5px 8px",textAlign:"right"}}>
                        <input type="number" step="0.5" value={it.qty||""} onChange={e=>setManualItems(p=>p.map((x,j)=>j===i?{...x,qty:e.target.value}:x))}
                          style={{background:"#11233a",border:"1px solid #1d3b5b",borderRadius:5,color:"#d4e8f7",fontSize:11,padding:"4px 7px",width:60,textAlign:"right"}}/>
                      </td>
                      <td style={{padding:"5px 8px",textAlign:"right"}}>
                        <input type="number" step="0.01" value={it.unitPrice||""} onChange={e=>setManualItems(p=>p.map((x,j)=>j===i?{...x,unitPrice:e.target.value}:x))}
                          style={{background:"#11233a",border:"1px solid #1d3b5b",borderRadius:5,color:"#d4e8f7",fontSize:11,padding:"4px 7px",width:75,textAlign:"right"}}/>
                      </td>
                      <td style={{padding:"5px 8px",textAlign:"right",color:"#22c55e",fontWeight:700}}>
                        {L(Number(it.qty||0)*Number(it.unitPrice||0))}
                      </td>
                      <td style={{padding:"5px 4px",textAlign:"right"}}>
                        <button onClick={()=>setManualItems(p=>p.filter((_,j)=>j!==i))}
                          style={{background:"none",border:"none",color:"#ef4444",fontSize:16,cursor:"pointer",lineHeight:1,padding:"2px 6px"}}>×</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {tab==="expenses" && (() => {
          const branch = data.branches.find(b => b.id === branchId);
          const branchDefaults = branch?.defaultExpenses || [];
          const existingDescs = new Set(expenses.map(e=>(e.desc||"").trim().toLowerCase()).filter(Boolean));
          const missingDefaults = branchDefaults.filter(d=>!existingDescs.has((d.description||"").trim().toLowerCase()));
          const loadMissing = () => {
            setExpenses(prev => {
              const cleaned = prev.filter(e => e.desc || e.amt);
              return [
                ...cleaned,
                ...missingDefaults.map(d=>({desc:d.description, amt:"", type:d.type||"efectivo"})),
                { desc:"", amt:"", type:"efectivo" },
              ];
            });
            setPrefillInfo(`✓ ${missingDefaults.length} gasto(s) habitual(es) agregado(s) — llená los montos`);
            setTimeout(()=>setPrefillInfo(""), 5000);
          };
          return (
          <div style={{flex:1,overflowY:"auto",padding:20}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10,marginBottom:12}}>
              <p style={{color:"#5d85aa",fontSize:12,margin:0}}>Registra todos los gastos del día</p>
              {missingDefaults.length > 0 && (
                <button onClick={loadMissing}
                  style={{background:"#1e3a8a",border:"1px solid #60a5fa",color:"#93c5fd",borderRadius:8,padding:"7px 14px",cursor:"pointer",fontSize:11,fontWeight:700}}>
                  📋 Cargar {missingDefaults.length} gasto(s) habitual(es) de esta sucursal
                </button>
              )}
              {branchDefaults.length > 0 && missingDefaults.length === 0 && (
                <span style={{color:"#22c55e",fontSize:11,fontWeight:600}}>✓ Todos los habituales ya están cargados</span>
              )}
            </div>
            {prefillInfo && (
              <div style={{background:prefillInfo.startsWith("✓")?"#064e3b":"#451a03",color:prefillInfo.startsWith("✓")?"#22c55e":"#fbbf24",padding:"8px 12px",borderRadius:8,fontSize:11,fontWeight:600,marginBottom:12}}>
                {prefillInfo}
              </div>
            )}
            {expenses.map((e,i)=>(
              <div key={i} style={{display:"flex",gap:8,marginBottom:10,alignItems:"center"}}>
                <input placeholder="Descripción del gasto" value={e.desc} onChange={ev=>setExpenses(p=>p.map((x,j)=>j===i?{...x,desc:ev.target.value}:x))} style={{...inp(),flex:1}}/>
                <input type="number" placeholder="Monto" value={e.amt} onChange={ev=>setExpenses(p=>p.map((x,j)=>j===i?{...x,amt:ev.target.value}:x))} style={{...inp(),width:100}}/>
                <select value={e.type} onChange={ev=>setExpenses(p=>p.map((x,j)=>j===i?{...x,type:ev.target.value}:x))} style={{...inp()}}>
                  <option value="efectivo">Efectivo</option><option value="tarjeta">Tarjeta</option><option value="transferencia">Transferencia</option>
                </select>
                <button onClick={()=>setExpenses(p=>p.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:"#3a5c7f",fontSize:18,cursor:"pointer",lineHeight:1}}>×</button>
              </div>
            ))}
            <button onClick={()=>setExpenses(p=>[...p,{desc:"",amt:"",type:"efectivo"}])} style={{color:"#0369a1",background:"none",border:"none",cursor:"pointer",fontSize:12,fontWeight:600}}>+ Agregar gasto</button>
          </div>
          );
        })()}
        {tab==="deposits" && (
          <div style={{flex:1,overflowY:"auto",padding:20}}>
            <p style={{color:"#5d85aa",fontSize:12,marginBottom:16}}>Registra depósitos y pagos electrónicos</p>
            {deposits.map((d,i)=>(
              <div key={i} style={{display:"flex",gap:8,marginBottom:10,alignItems:"center",flexWrap:"wrap"}}>
                <select value={d.bank} onChange={ev=>setDeposits(p=>p.map((x,j)=>j===i?{...x,bank:ev.target.value}:x))} style={{...inp(),flex:1,minWidth:160}}>
                  {resolvedBanks.map(b=><option key={b} value={b}>{b}</option>)}
                </select>
                <input type="number" placeholder="Monto" value={d.amt} onChange={ev=>setDeposits(p=>p.map((x,j)=>j===i?{...x,amt:ev.target.value}:x))} style={{...inp(),width:100}}/>
                <select value={d.type} onChange={ev=>setDeposits(p=>p.map((x,j)=>j===i?{...x,type:ev.target.value}:x))} style={{...inp()}}>
                  <option value="deposito">Depósito</option><option value="tarjeta">Tarjeta</option>
                  <option value="transferencia">Transferencia</option><option value="pedidos_ya">Pedidos Ya</option>
                </select>
                <input placeholder="Ref / Comprobante" value={d.ref||""} onChange={ev=>setDeposits(p=>p.map((x,j)=>j===i?{...x,ref:ev.target.value}:x))} style={{...inp(),width:120,fontSize:11}}/>
                <button onClick={()=>setDeposits(p=>p.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:"#3a5c7f",fontSize:18,cursor:"pointer",lineHeight:1}}>×</button>
              </div>
            ))}
            <button onClick={()=>setDeposits(p=>[...p,{bank:BANKS[0],amt:"",type:"deposito",ref:""}])} style={{color:"#0369a1",background:"none",border:"none",cursor:"pointer",fontSize:12,fontWeight:600}}>+ Agregar depósito</button>
          </div>
        )}
      </div>

      {/* RIGHT SUMMARY */}
      <div style={{width:260,borderLeft:"1px solid #1d3b5b",background:"#0a1525",display:"flex",flexDirection:"column",flexShrink:0}}>
        <div style={{padding:"14px 16px",borderBottom:"1px solid #1d3b5b"}}>
          <p style={{color:"#d4e8f7",fontWeight:700,fontSize:13,margin:0}}>📊 Resumen en Lempiras</p>
        </div>
        <div style={{padding:16,borderBottom:"1px solid #1d3b5b"}}>
          {[["VENTA TOTAL",totalSales,"#22c55e"],["GASTOS",totalExp,"#f97316"],["A DEPOSITAR",toDeposit,"#60a5fa"],["TOTAL DEPOSITADO",totalDep,"#a78bfa"]].map(([lbl,val,col])=>(
            <div key={lbl} style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
              <span style={{color:"#8aafd2",fontSize:11,fontWeight:600}}>{lbl}</span>
              <span style={{color:col,fontSize:12,fontWeight:700}}>{L(val)}</span>
            </div>
          ))}
          <div style={{display:"flex",justifyContent:"space-between",paddingTop:10,borderTop:"1px solid #1d3b5b",fontWeight:700}}>
            <span style={{fontSize:11,color:Math.abs(diff)<0.01?"#22c55e":"#ef4444"}}>DIFERENCIA</span>
            <span style={{fontSize:12,color:Math.abs(diff)<0.01?"#22c55e":"#ef4444"}}>{L(diff)}</span>
          </div>
          <div style={{textAlign:"center",marginTop:8,padding:"5px 0",borderRadius:7,fontSize:11,fontWeight:800,
            background:Math.abs(diff)<0.01?"#064e3b":"#450a0a",color:Math.abs(diff)<0.01?"#22c55e":"#ef4444"}}>
            {Math.abs(diff)<0.01?"✓ CUADRA":"⚠ NO CUADRA"}
          </div>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:16}}>
          <p style={{color:"#5d85aa",fontSize:10,textTransform:"uppercase",letterSpacing:2,marginBottom:10}}>Productos ({saleItems.length})</p>
          {saleItems.length===0
            ? <p style={{color:"#1d3b5b",fontSize:11,fontStyle:"italic"}}>Selecciona productos del menú</p>
            : saleItems.map(it=>(
                <div key={it.productId} style={{display:"flex",justifyContent:"space-between",marginBottom:6,gap:6}}>
                  <span style={{color:"#8aafd2",fontSize:11,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{it.qty}× {it.productName}</span>
                  <span style={{color:"#d4e8f7",fontSize:11,fontWeight:700,flexShrink:0}}>{L(it.total)}</span>
                </div>
              ))
          }
        </div>
        <div style={{padding:14,borderTop:"1px solid #1d3b5b",display:"flex",flexDirection:"column",gap:8}}>
          {flash && (
            <div style={{display:"flex",gap:8}}>
              <div style={{flex:1,background:"#064e3b",color:"#22c55e",borderRadius:8,padding:"8px",fontSize:11,fontWeight:700,textAlign:"center"}}>{flash}</div>
              {lastSale && <button onClick={()=>setShowPDF(true)} style={{background:"#16304a",border:"1px solid #1d3b5b",color:"#8aafd2",borderRadius:8,padding:"8px 10px",cursor:"pointer",fontSize:12,flexShrink:0}}>🖨️ PDF</button>}
            </div>
          )}
          <button onClick={submit} disabled={saleItems.length===0} style={{
            background:saleItems.length===0?"#16304a":"#0369a1",color:saleItems.length===0?"#3a5c7f":"#fff",
            border:"none",borderRadius:12,padding:"12px 0",fontWeight:800,fontSize:13,cursor:saleItems.length===0?"not-allowed":"pointer",
          }}>GUARDAR REPORTE</button>
        </div>
      </div>
    </div>
  );
}

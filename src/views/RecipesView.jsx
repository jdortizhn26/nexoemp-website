import { useState, useMemo } from "react";
import { L } from "../lib/helpers";
import { CATEGORIES as BASE_CATEGORIES, DEF_INGREDIENTS, DEF_COSTS, resolveProducts, resolveCategories, resolveIngredients, calcRecipeCost } from "../lib/catalog";
import { canEditRecipes, canViewRecipeQuantities, isFranchiseeOrDelegate } from "../lib/permissions";
import { Card } from "../components/ui";

export function RecipesView({data,saveRecipe,userRole}) {
  const canEdit = canEditRecipes(userRole);
  const canSeeQty = canViewRecipeQuantities(userRole);

  // Productos + ingredientes resueltos (overrides + nuevos) y categorías dinámicas
  const PRODUCTS_RESOLVED = useMemo(() => resolveProducts(data?.products || []), [data?.products]);
  const CATEGORIES_RESOLVED = useMemo(() => resolveCategories(data?.products || []), [data?.products]);
  const INGREDIENTS_RESOLVED = useMemo(() => resolveIngredients(data?.ingredients || []), [data?.ingredients]);
  const isFranchise = isFranchiseeOrDelegate(userRole);

  // Todos los hooks deben ejecutarse siempre (rules of hooks)
  const [selId,setSelId]=useState(null);
  const [cat,setCat]=useState(CATEGORIES_RESOLVED[0] || BASE_CATEGORIES[0]);
  const [search,setSearch]=useState("");
  const [recipe,setRecipe]=useState(null);
  const [mode,setMode]=useState("edit");
  const [flash,setFlash]=useState("");

  // Vista simplificada para franquiciados: solo lista de costos por producto
  if (!canSeeQty) {
    const costByProduct = PRODUCTS_RESOLVED.map(p => {
      const r = data.recipes[p.id];
      const cost = calcRecipeCost(r, INGREDIENTS_RESOLVED, isFranchise);
      return { p, cost, margin: p.price > 0 ? ((p.price - cost) / p.price) * 100 : 0, hasRecipe: !!r && r.ingredients?.length > 0 };
    }).sort((a, b) => b.margin - a.margin);

    return (
      <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <h1 style={{ color: "#d4e8f7", fontSize: 22, fontWeight: 800, margin: 0 }}>🦐 Costos & Márgenes</h1>
          <p style={{ color: "#5d85aa", fontSize: 12, marginTop: 4 }}>
            Costos calculados según tus precios de compra de materia prima. No incluye detalle de ingredientes.
          </p>
        </div>
        <Card>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead><tr style={{ background: "#16304a" }}>
              {["Producto", "Categoría", "Precio venta", "Costo estimado", "Margen"].map((h, i) => (
                <th key={h} style={{ padding: "10px 12px", textAlign: i >= 2 ? "right" : "left", color: "#5d85aa", fontSize: 11, fontWeight: 600 }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {costByProduct.map(({ p, cost, margin, hasRecipe }) => {
                const col = !hasRecipe ? "#3a5c7f" : margin >= 50 ? "#22c55e" : margin >= 30 ? "#fbbf24" : "#ef4444";
                return (
                  <tr key={p.id} style={{ borderTop: "1px solid #16304a" }}>
                    <td style={{ padding: "9px 12px", color: "#b8d8ee", fontWeight: 600 }}>{p.name}</td>
                    <td style={{ padding: "9px 12px", color: "#5d85aa", fontSize: 11 }}>{p.cat}</td>
                    <td style={{ padding: "9px 12px", textAlign: "right", color: "#8aafd2" }}>{L(p.price)}</td>
                    <td style={{ padding: "9px 12px", textAlign: "right", color: hasRecipe ? "#f97316" : "#1d3b5b" }}>
                      {hasRecipe ? L(cost) : "—"}
                    </td>
                    <td style={{ padding: "9px 12px", textAlign: "right", color: col, fontWeight: 800 }}>
                      {hasRecipe ? `${margin.toFixed(0)}%` : "sin receta"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      </div>
    );
  }

  const selProd=PRODUCTS_RESOLVED.find(p=>p.id===selId);

  const open=(id)=>{
    setSelId(id);
    const ex=data.recipes[id];
    setRecipe(ex ? {productId:id,ingredients:ex.ingredients.map(i=>({...i}))} : {productId:id,ingredients:[]});
  };

  const cost=useMemo(()=>calcRecipeCost(recipe, INGREDIENTS_RESOLVED, isFranchise),[recipe, INGREDIENTS_RESOLVED, isFranchise]);

  const margin=selProd ? ((selProd.price-cost)/selProd.price)*100 : 0;

  const saveR=()=>{
    if(!recipe) return;
    saveRecipe(recipe.productId, recipe);
    setFlash("✓ Receta guardada"); setTimeout(()=>setFlash(""),2000);
  };

  const costReport=useMemo(()=>
    PRODUCTS_RESOLVED.map(p=>{
      const r=data.recipes[p.id]; if(!r) return null;
      const c=calcRecipeCost(r, INGREDIENTS_RESOLVED, isFranchise);
      return {p,cost:c,margin:p.price>0?((p.price-c)/p.price)*100:0};
    }).filter(Boolean).sort((a,b)=>b.margin-a.margin),
  [data.recipes, PRODUCTS_RESOLVED, INGREDIENTS_RESOLVED, isFranchise]);

  const filtProd=useMemo(()=>
    search ? PRODUCTS_RESOLVED.filter(p=>p.name.toLowerCase().includes(search.toLowerCase()))
           : PRODUCTS_RESOLVED.filter(p=>p.cat===cat),
  [cat,search,PRODUCTS_RESOLVED]);

  const inp=(s={})=>({background:"#11233a",border:"1px solid #1d3b5b",borderRadius:7,padding:"7px 9px",color:"#d4e8f7",fontSize:11,outline:"none",...s});

  return (
    <div style={{display:"flex",height:"100%",overflow:"hidden"}}>
      {/* Cat list */}
      <div style={{width:140,borderRight:"1px solid #1d3b5b",background:"#0f0a06",padding:8,overflowY:"auto",flexShrink:0}}>
        <input placeholder="Buscar…" value={search} onChange={e=>setSearch(e.target.value)}
          style={{...inp(),width:"100%",boxSizing:"border-box",marginBottom:8}}/>
        {CATEGORIES_RESOLVED.map(c=>(
          <button key={c} onClick={()=>{setCat(c);setSearch("");}} style={{
            display:"block",width:"100%",textAlign:"left",padding:"6px 10px",borderRadius:7,border:"none",cursor:"pointer",fontSize:10,marginBottom:2,
            background:cat===c&&!search?"#0369a1":"transparent",color:cat===c&&!search?"#fff":"#8aafd2",
          }}>{c}</button>
        ))}
      </div>

      {/* Product list */}
      <div style={{width:220,borderRight:"1px solid #1d3b5b",overflowY:"auto",flexShrink:0}}>
        <div style={{padding:"10px 12px",borderBottom:"1px solid #1d3b5b",display:"flex",gap:6}}>
          <button onClick={()=>setMode("edit")} style={{flex:1,padding:"5px 0",borderRadius:7,border:"none",cursor:"pointer",fontSize:10,fontWeight:600,background:mode==="edit"?"#0369a1":"#16304a",color:mode==="edit"?"#fff":"#5d85aa"}}>Editar</button>
          <button onClick={()=>setMode("report")} style={{flex:1,padding:"5px 0",borderRadius:7,border:"none",cursor:"pointer",fontSize:10,fontWeight:600,background:mode==="report"?"#0369a1":"#16304a",color:mode==="report"?"#fff":"#5d85aa"}}>Reporte</button>
        </div>
        <div style={{padding:8}}>
          {filtProd.map(p=>{
            const has=!!data.recipes[p.id];
            return (
              <button key={p.id} onClick={()=>open(p.id)} style={{
                display:"block",width:"100%",textAlign:"left",padding:"9px 10px",borderRadius:9,border:"none",cursor:"pointer",marginBottom:4,
                background:selId===p.id?"#0369a1":"transparent",
              }}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{color:selId===p.id?"#fff":"#b8d8ee",fontSize:11,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>{p.name}</span>
                  <span style={{fontSize:9,padding:"1px 5px",borderRadius:4,marginLeft:4,flexShrink:0,
                    background:has?"#064e3b":"#451a03",color:has?"#22c55e":"#f97316"}}>{has?"✓":"—"}</span>
                </div>
                <span style={{color:selId===p.id?"#fca5a5":"#5d85aa",fontSize:10}}>L {p.price}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <div style={{flex:1,overflowY:"auto",padding:24}}>
        {mode==="report" ? (
          <>
            <h2 style={{color:"#d4e8f7",fontSize:18,fontWeight:800,margin:"0 0 6px"}}>📊 Reporte de Costos</h2>
            <p style={{color:"#5d85aa",fontSize:12,marginBottom:20}}>{costReport.length} productos con recetas configuradas</p>
            {costReport.length===0
              ? <div style={{textAlign:"center",padding:"40px 0",color:"#3a5c7f"}}><p style={{fontSize:40}}>📋</p><p>Configura recetas para ver el reporte</p></div>
              : <div style={{background:"#0c1828",border:"1px solid #1d3b5b",borderRadius:14,overflow:"hidden"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                    <thead><tr style={{background:"#16304a"}}>
                      {["Producto","Categoría","P. Venta","Costo","Utilidad","Margen"].map((h,i)=>(
                        <th key={h} style={{padding:"10px 14px",textAlign:i<2?"left":"right",color:"#5d85aa",fontSize:11,fontWeight:600}}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {costReport.map(({p,cost:c,margin:m})=>{
                        const util=p.price-c;
                        return (
                          <tr key={p.id} style={{borderTop:"1px solid #16304a"}}>
                            <td style={{padding:"10px 14px",color:"#b8d8ee"}}>{p.name}</td>
                            <td style={{padding:"10px 14px",color:"#5d85aa",fontSize:11}}>{p.cat}</td>
                            <td style={{padding:"10px 14px",textAlign:"right",color:"#d4e8f7"}}>{L(p.price)}</td>
                            <td style={{padding:"10px 14px",textAlign:"right",color:"#f97316"}}>{L(c)}</td>
                            <td style={{padding:"10px 14px",textAlign:"right",fontWeight:700,color:util>=0?"#22c55e":"#ef4444"}}>{L(util)}</td>
                            <td style={{padding:"10px 14px",textAlign:"right"}}>
                              <span style={{background:m>=60?"#064e3b":m>=40?"#451a03":"#450a0a",color:m>=60?"#22c55e":m>=40?"#f97316":"#ef4444",padding:"2px 8px",borderRadius:6,fontWeight:800,fontSize:11}}>{m.toFixed(1)}%</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
            }
          </>
        ) : !selId ? (
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",color:"#3a5c7f",textAlign:"center"}}>
            <div><p style={{fontSize:48,margin:"0 0 12px"}}>🦐</p><p style={{fontSize:16,color:"#5d85aa"}}>Selecciona un producto</p><p style={{fontSize:12,marginTop:4}}>para configurar su receta de costos</p></div>
          </div>
        ) : (
          <>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
              <div>
                <h2 style={{color:"#d4e8f7",fontSize:18,fontWeight:800,margin:0}}>{selProd?.name}</h2>
                <p style={{color:"#5d85aa",fontSize:12,marginTop:4}}>Precio de venta: <span style={{color:"#22c55e",fontWeight:700}}>{L(selProd?.price||0)}</span></p>
              </div>
              <div style={{textAlign:"right"}}>
                <p style={{color:"#5d85aa",fontSize:10,margin:0}}>Costo Total</p>
                <p style={{color:"#f97316",fontSize:20,fontWeight:800,margin:"2px 0"}}>L {cost.toFixed(2)}</p>
                <span style={{background:margin>=60?"#064e3b":margin>=40?"#451a03":"#450a0a",color:margin>=60?"#22c55e":margin>=40?"#f97316":"#ef4444",padding:"3px 10px",borderRadius:7,fontWeight:800,fontSize:11}}>
                  Margen: {margin.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Ingredients table */}
            <div style={{marginBottom:16}}>
              <div style={{display:"grid",gridTemplateColumns:"3fr 1fr 1fr 1fr auto",gap:8,marginBottom:8}}>
                {["Ingrediente","Cantidad","Unidad","L/Unidad",""].map(h=>(
                  <span key={h} style={{color:"#5d85aa",fontSize:10,fontWeight:600}}>{h}</span>
                ))}
              </div>
              {recipe?.ingredients.map((ing,i)=>(
                <div key={i} style={{display:"grid",gridTemplateColumns:"3fr 1fr 1fr 1fr auto",gap:8,marginBottom:8,alignItems:"center"}}>
                  <input list="ing-list" value={ing.name} onChange={e=>{
                    const name=e.target.value;
                    const cost=DEF_COSTS[name]||ing.costPerUnit;
                    setRecipe(r=>({...r,ingredients:r.ingredients.map((x,j)=>j===i?{...x,name,costPerUnit:cost}:x)}));
                  }} style={inp()}/>
                  <input type="number" value={ing.qty||""} step="0.01" placeholder="0"
                    onChange={e=>setRecipe(r=>({...r,ingredients:r.ingredients.map((x,j)=>j===i?{...x,qty:e.target.value}:x)}))}
                    style={inp()}/>
                  <input value={ing.unit}
                    onChange={e=>setRecipe(r=>({...r,ingredients:r.ingredients.map((x,j)=>j===i?{...x,unit:e.target.value}:x)}))}
                    style={inp()}/>
                  <input type="number" value={ing.costPerUnit||""} step="0.01" placeholder="0"
                    onChange={e=>setRecipe(r=>({...r,ingredients:r.ingredients.map((x,j)=>j===i?{...x,costPerUnit:e.target.value}:x)}))}
                    style={inp()}/>
                  <button onClick={()=>setRecipe(r=>({...r,ingredients:r.ingredients.filter((_,j)=>j!==i)}))}
                    style={{background:"none",border:"none",color:"#3a5c7f",fontSize:16,cursor:"pointer",lineHeight:1}}>×</button>
                </div>
              ))}
              <datalist id="ing-list">{DEF_INGREDIENTS.map(n=><option key={n} value={n}/>)}</datalist>
            </div>

            {/* Quick add */}
            <div style={{marginBottom:16}}>
              <p style={{color:"#5d85aa",fontSize:10,marginBottom:8}}>Agregar ingrediente rápido:</p>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {DEF_INGREDIENTS.slice(0,12).map(n=>(
                  <button key={n} onClick={()=>setRecipe(r=>({...r,ingredients:[...r.ingredients,{name:n,qty:0,unit:"lb",costPerUnit:DEF_COSTS[n]||0}]}))}
                    style={{background:"#16304a",border:"1px solid #1d3b5b",color:"#8aafd2",padding:"4px 10px",borderRadius:7,fontSize:10,cursor:"pointer"}}>
                    + {n}
                  </button>
                ))}
              </div>
            </div>

            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}>
              <button onClick={()=>setRecipe(r=>({...r,ingredients:[...r.ingredients,{name:"",qty:0,unit:"lb",costPerUnit:0}]}))}
                style={{color:"#0369a1",background:"none",border:"none",cursor:"pointer",fontSize:12,fontWeight:600}}>+ Agregar ingrediente</button>
              {flash && <span style={{color:"#22c55e",fontSize:12,fontWeight:700}}>{flash}</span>}
              <button onClick={saveR} style={{marginLeft:"auto",background:"#0369a1",color:"#fff",border:"none",borderRadius:10,padding:"9px 20px",fontWeight:700,fontSize:12,cursor:"pointer"}}>Guardar Receta</button>
            </div>

            {/* Cost breakdown */}
            {recipe?.ingredients.length>0 && (
              <div style={{background:"#0c1828",border:"1px solid #1d3b5b",borderRadius:14,padding:16}}>
                <h3 style={{color:"#d4e8f7",fontSize:13,fontWeight:700,marginBottom:12}}>Desglose de Costos</h3>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                  <thead><tr style={{color:"#5d85aa",borderBottom:"1px solid #1d3b5b"}}>
                    {["Ingrediente","Cantidad","Unidad","L/Unidad","Subtotal"].map((h,i)=>(
                      <th key={h} style={{padding:"6px 8px",textAlign:i===0?"left":"right",fontWeight:600}}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {recipe.ingredients.map((ing,i)=>(
                      <tr key={i} style={{borderBottom:"1px solid #16304a"}}>
                        <td style={{padding:"8px",color:"#8aafd2"}}>{ing.name||"—"}</td>
                        <td style={{padding:"8px",textAlign:"right",color:"#d4e8f7"}}>{ing.qty}</td>
                        <td style={{padding:"8px",textAlign:"right",color:"#5d85aa"}}>{ing.unit}</td>
                        <td style={{padding:"8px",textAlign:"right",color:"#5d85aa"}}>L {Number(ing.costPerUnit).toFixed(2)}</td>
                        <td style={{padding:"8px",textAlign:"right",color:"#f97316",fontWeight:700}}>L {(Number(ing.qty)*Number(ing.costPerUnit)).toFixed(2)}</td>
                      </tr>
                    ))}
                    <tr style={{fontWeight:800,borderTop:"1px solid #1d3b5b"}}>
                      <td colSpan={4} style={{padding:"8px",color:"#8aafd2"}}>COSTO TOTAL</td>
                      <td style={{padding:"8px",textAlign:"right",color:"#f97316"}}>L {cost.toFixed(2)}</td>
                    </tr>
                    <tr style={{fontWeight:800}}>
                      <td colSpan={4} style={{padding:"8px",color:"#8aafd2"}}>UTILIDAD BRUTA</td>
                      <td style={{padding:"8px",textAlign:"right",color:(selProd?.price||0)-cost>=0?"#22c55e":"#ef4444"}}>L {((selProd?.price||0)-cost).toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

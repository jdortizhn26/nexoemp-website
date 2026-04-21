import { useState, useEffect } from "react";
import { useData } from "./useData";
import { auth, db } from "./firebase";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { LoginView } from "./views/LoginView";
import { TVDashboard } from "./views/TVDashboard";
import { InventoryView } from "./views/InventoryView";
import { WarehouseView } from "./views/WarehouseView";
import { BanksView } from "./views/BanksView";
import { DifferencesView } from "./views/DifferencesView";
import { UsersView } from "./views/UsersView";
import { ProductsView } from "./views/ProductsView";
import { IngredientsView } from "./views/IngredientsView";
import { BankAccountsView } from "./views/BankAccountsView";
import { BranchesView } from "./views/BranchesView";
import { RecipesView } from "./views/RecipesView";
import { SalesView } from "./views/SalesView";
import { DashboardView } from "./views/DashboardView";
import { ReportsView } from "./views/ReportsView";
import { ImportJsonModal } from "./components/ImportJsonModal";
import { navItemsFor, canAccessView, isAdmin as roleIsAdmin } from "./lib/permissions";

export default function App() {
  const [view, setView]               = useState("dashboard");
  const [sidebar, setSidebar]         = useState(true);
  const [importModal, setImportModal] = useState(false);
  const [authUser, setAuthUser]       = useState(undefined);
  const [userRole, setUserRole]       = useState(null);
  const [tvMode, setTvMode]           = useState(false);
  const [editSaleId, setEditSaleId]   = useState(null);

  const { data, loading, error, saveSale, saveRecipe, importSales, addBranch, deleteBranch, updateBranch, saveGoal, saveDefaultExpenses, saveWarehouse, createTransfer, receiveTransfer, saveInventory, processDeposit, saveRequisition, updateRequisitionStatus, approveRequisition, createUser, updateUserProfile, deleteUserProfile, saveProduct, deleteProduct, restoreProduct, saveIngredient, deleteIngredient, restoreIngredient, saveBankAccount, deleteBankAccount, restoreBankAccount } = useData();

  // ── Auth listener ─────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user || null);
      if (user) {
        try {
          const snap = await getDoc(doc(db, "users", user.uid));
          if (snap.exists()) setUserRole({ uid: user.uid, ...snap.data() });
          else setUserRole({ uid: user.uid, role: "admin" }); // Sin perfil = admin (primer usuario)
        } catch { setUserRole({ uid: user.uid, role: "admin" }); }
      } else {
        setUserRole(null);
      }
    });
    return unsub;
  }, []);

  const isAdmin = roleIsAdmin(userRole);

  const handleSaveSale = async (sale) => { await saveSale(sale); };

  if (authUser === undefined) return (
    <div style={{height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#060b15"}}>
      <div style={{textAlign:"center"}}><div style={{fontSize:48,marginBottom:12}}>🦐</div>
        <p style={{color:"#b8d8ee",fontWeight:700,letterSpacing:4}}>LA MAR</p>
        <p style={{color:"#5d85aa",fontSize:13,marginTop:6}}>Cargando…</p>
      </div>
    </div>
  );

  if (!authUser) return <LoginView/>;

  if (loading) return (
    <div style={{height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#060b15"}}>
      <div style={{textAlign:"center"}}><div style={{fontSize:48,marginBottom:12}}>🦐</div>
        <p style={{color:"#b8d8ee",fontWeight:700,letterSpacing:4}}>LA MAR</p>
        <p style={{color:"#5d85aa",fontSize:13,marginTop:6}}>Conectando con Firebase…</p>
      </div>
    </div>
  );

  if (error) return (
    <div style={{height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#060b15"}}>
      <div style={{textAlign:"center",maxWidth:400}}>
        <p style={{fontSize:40,margin:"0 0 12px"}}>⚠️</p>
        <p style={{color:"#d4e8f7",fontWeight:700}}>Error de conexión</p>
        <p style={{color:"#5d85aa",fontSize:13,marginTop:8}}>{error}</p>
      </div>
    </div>
  );

  if (tvMode) return <TVDashboard data={data} onExit={()=>setTvMode(false)}/>;

  const nav = navItemsFor(userRole);

  // Si la vista actual ya no es accesible para este rol, redirigir a dashboard
  if (!canAccessView(userRole, view)) {
    setTimeout(()=>setView("dashboard"), 0);
  }

  return (
    <div style={{display:"flex",height:"100vh",background:"#060b15",fontFamily:"system-ui,sans-serif",overflow:"hidden"}}>
      <aside style={{width:sidebar?220:52,transition:"width .25s",background:"#0a1525",borderRight:"1px solid #1d3b5b",display:"flex",flexDirection:"column",flexShrink:0}}>
        <div style={{padding:"14px 12px",borderBottom:"1px solid #1d3b5b",display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:32,height:32,borderRadius:"50%",background:"#0369a1",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:900,fontSize:15,flexShrink:0}}>⚓</div>
          {sidebar && <div><p style={{color:"#d4e8f7",fontWeight:800,fontSize:12,letterSpacing:2,margin:0}}>LA MAR</p><p style={{color:"#5d85aa",fontSize:10,margin:"2px 0 0"}}>{isAdmin?"Administrador":userRole?.branchId||"Sucursal"}</p></div>}
        </div>
        <nav style={{flex:1,padding:"10px 8px",display:"flex",flexDirection:"column",gap:2,overflowY:"auto"}}>
          {nav.map(n => (
            <button key={n.id} onClick={()=>setView(n.id)} style={{
              display:"flex",alignItems:"center",gap:10,padding:"9px 10px",borderRadius:8,border:"none",cursor:"pointer",
              background:view===n.id?"#0369a1":"transparent",color:view===n.id?"#fff":"#8aafd2",
              fontWeight:view===n.id?700:400,fontSize:12,textAlign:"left",transition:"all .15s",width:"100%",
            }}
              onMouseEnter={e=>{if(view!==n.id)e.currentTarget.style.background="#16304a"}}
              onMouseLeave={e=>{if(view!==n.id)e.currentTarget.style.background="transparent"}}
            >
              <span style={{fontSize:16,flexShrink:0}}>{n.icon}</span>
              {sidebar && <span style={{whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",flex:1}}>{n.label}</span>}
              {n.id==="warehouse" && isAdmin && (data?.requisitions||[]).filter(r=>r.status==="pendiente").length>0 && (
                <span style={{background:"#fbbf24",color:"#000",borderRadius:10,padding:"1px 7px",fontSize:10,fontWeight:800,flexShrink:0}}>
                  {(data.requisitions||[]).filter(r=>r.status==="pendiente").length}
                </span>
              )}
            </button>
          ))}
        </nav>
        {sidebar && (
          <button onClick={()=>setTvMode(true)} style={{margin:"0 8px 6px",background:"#16304a",border:"1px solid #1d3b5b",color:"#5d85aa",borderRadius:8,padding:"8px 10px",cursor:"pointer",fontSize:11,textAlign:"left"}}>
            📺 Vista TV
          </button>
        )}
        <button onClick={()=>signOut(auth)} style={{
          padding:"10px 12px",background:"none",border:"none",borderTop:"1px solid #1d3b5b",
          color:"#3a5c7f",cursor:"pointer",fontSize:11,display:"flex",alignItems:"center",gap:6,
        }}>
          <span>🚪</span>{sidebar&&<span>Cerrar sesión</span>}
        </button>
        <button onClick={()=>setSidebar(!sidebar)} style={{padding:"8px 12px",background:"none",border:"none",borderTop:"1px solid #1d3b5b",color:"#1d3b5b",cursor:"pointer",fontSize:10,display:"flex",alignItems:"center",gap:6}}>
          <span>{sidebar?"◀":"▶"}</span>
        </button>
      </aside>

      <main style={{flex:1,overflowY:"auto",background:"#100b07"}}>
        {view==="dashboard" && canAccessView(userRole,"dashboard") && <DashboardView data={data} goto={setView} onImport={()=>setImportModal(true)} onTV={()=>setTvMode(true)} isAdmin={isAdmin} userRole={userRole}/>}
        {view==="sales"     && canAccessView(userRole,"sales")     && <SalesView data={data} saveSale={handleSaveSale} userRole={userRole} editSale={editSaleId ? data.sales?.find(s=>s.id===editSaleId) : null} onEditDone={()=>setEditSaleId(null)}/>}
        {view==="inventory" && canAccessView(userRole,"inventory") && <InventoryView data={data} userRole={userRole} receiveTransfer={receiveTransfer} saveInventory={saveInventory} saveRequisition={saveRequisition}/>}
        {view==="recipes"   && canAccessView(userRole,"recipes")   && <RecipesView data={data} saveRecipe={saveRecipe} userRole={userRole}/>}
        {view==="reports"   && canAccessView(userRole,"reports")   && <ReportsView data={data} userRole={userRole} onEditSale={(id)=>{setEditSaleId(id); setView("sales");}}/>}
        {view==="banks"     && canAccessView(userRole,"banks")     && <BanksView data={data} processDeposit={processDeposit} userRole={userRole} saveBankAccount={saveBankAccount} deleteBankAccount={deleteBankAccount} restoreBankAccount={restoreBankAccount}/>}
        {view==="warehouse"   && canAccessView(userRole,"warehouse")   && <WarehouseView data={data} saveWarehouse={saveWarehouse} createTransfer={createTransfer} updateRequisitionStatus={updateRequisitionStatus} approveRequisition={approveRequisition}/>}
        {view==="differences" && canAccessView(userRole,"differences") && <DifferencesView data={data} userRole={userRole}/>}
        {view==="branches"  && canAccessView(userRole,"branches")  && <BranchesView data={data} addBranch={addBranch} deleteBranch={deleteBranch} updateBranch={updateBranch} saveGoal={saveGoal} saveDefaultExpenses={saveDefaultExpenses} userRole={userRole}/>}
        {view==="users"     && canAccessView(userRole,"users")     && <UsersView data={data} userRole={userRole} createUser={createUser} updateUserProfile={updateUserProfile} deleteUserProfile={deleteUserProfile}/>}
        {view==="products"    && isAdmin && <ProductsView data={data} saveProduct={saveProduct} deleteProduct={deleteProduct} restoreProduct={restoreProduct}/>}
        {view==="ingredients"   && isAdmin && <IngredientsView data={data} saveIngredient={saveIngredient} deleteIngredient={deleteIngredient} restoreIngredient={restoreIngredient}/>}
      </main>

      {importModal && isAdmin && (
        <ImportJsonModal
          branches={data.branches}
          importSales={importSales}
          onClose={()=>setImportModal(false)}
        />
      )}
    </div>
  );
}

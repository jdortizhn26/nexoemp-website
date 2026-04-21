import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

export function LoginView({onLogin}) {
  const [email,setEmail]   = useState("");
  const [pass,setPass]     = useState("");
  const [error,setError]   = useState("");
  const [loading,setLoading] = useState(false);

  const submit = async () => {
    if(!email||!pass) return;
    setLoading(true); setError("");
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch(e) {
      setError("Correo o contraseña incorrectos");
    }
    setLoading(false);
  };

  const inp = (s={}) => ({
    width:"100%",boxSizing:"border-box",background:"#11233a",
    border:"1px solid #1d3b5b",borderRadius:10,padding:"12px 14px",
    color:"#d4e8f7",fontSize:13,outline:"none",...s
  });

  return (
    <div style={{height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#060b15"}}>
      <div style={{width:360,padding:36,background:"#0f1c30",border:"1px solid #1d3b5b",borderRadius:20}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{fontSize:52,marginBottom:10}}>🦐</div>
          <p style={{color:"#d4e8f7",fontWeight:900,fontSize:18,letterSpacing:3,margin:0}}>LA MAR</p>
          <p style={{color:"#5d85aa",fontSize:12,marginTop:6}}>Control Operacional</p>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <input type="email" placeholder="Correo electrónico" value={email}
            onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}
            style={inp()}/>
          <input type="password" placeholder="Contraseña" value={pass}
            onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}
            style={inp()}/>
          {error && <p style={{color:"#ef4444",fontSize:12,margin:0,textAlign:"center"}}>{error}</p>}
          <button onClick={submit} disabled={loading||!email||!pass} style={{
            background:loading||!email||!pass?"#1d3b5b":"#0369a1",
            color:loading||!email||!pass?"#3a5c7f":"#fff",
            border:"none",borderRadius:10,padding:"13px 0",fontWeight:800,fontSize:14,
            cursor:loading||!email||!pass?"not-allowed":"pointer",marginTop:4,
          }}>{loading?"Ingresando…":"Ingresar"}</button>
        </div>
        <p style={{color:"#3a5c7f",fontSize:10,textAlign:"center",marginTop:20}}>
          Sistema de control interno • La Mar
        </p>
      </div>
    </div>
  );
}

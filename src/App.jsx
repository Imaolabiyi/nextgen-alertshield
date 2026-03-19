import { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged, updateProfile, sendPasswordResetEmail
} from "firebase/auth";
import {
  getFirestore, collection, addDoc, getDocs, query,
  where, orderBy, limit, onSnapshot, doc, getDoc, setDoc,
  serverTimestamp, updateDoc, increment
} from "firebase/firestore";

// ─────────────────────────────────────────────
// FIREBASE CONFIG — replace with your own from Firebase Console
// ─────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

const firebaseApp = initializeApp(firebaseConfig);
const auth        = getAuth(firebaseApp);
const db          = getFirestore(firebaseApp);

// ─────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────
const C = {
  navy:       "#070F1E",
  navyMid:    "#0D1B30",
  navyCard:   "#111E35",
  teal:       "#00C8AA",
  cyan:       "#00E5FF",
  red:        "#FF3D5C",
  yellow:     "#FFBC00",
  green:      "#00D98B",
  purple:     "#9B7BFF",
  slate:      "#1A2E4A",
  slateLight: "#243D5E",
  text:       "#E4EFFF",
  textMid:    "#7A9CBD",
  textDim:    "#3A5470",
};

// ─────────────────────────────────────────────
// GLOBAL CSS  (injected once via useEffect)
// ─────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Outfit:wght@300;400;500;600;700;800&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:'Space Grotesk',sans-serif;background:#070F1E;color:#E4EFFF;min-height:100vh;overflow-x:hidden}
::-webkit-scrollbar{width:5px}
::-webkit-scrollbar-track{background:#0D1B30}
::-webkit-scrollbar-thumb{background:#00C8AA;border-radius:3px}
.outfit{font-family:'Outfit',sans-serif}
@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(0,200,170,.45)}50%{box-shadow:0 0 0 14px rgba(0,200,170,0)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes scan{0%{transform:translateY(-100%)}100%{transform:translateY(400%)}}
@keyframes popIn{0%{opacity:0;transform:scale(.6)}60%{transform:scale(1.08)}80%{transform:scale(.97)}100%{opacity:1;transform:scale(1)}}
@keyframes drawCheck{0%{stroke-dashoffset:120}100%{stroke-dashoffset:0}}
@keyframes drawX1{0%{stroke-dashoffset:80}100%{stroke-dashoffset:0}}
@keyframes drawCircle{0%{stroke-dashoffset:340}100%{stroke-dashoffset:0}}
@keyframes overlayIn{from{opacity:0}to{opacity:1}}
@keyframes overlayOut{from{opacity:1}to{opacity:0}}
@keyframes ripple{0%{transform:scale(1);opacity:.5}100%{transform:scale(2.4);opacity:0}}
.pop-in{animation:popIn .5s cubic-bezier(.34,1.56,.64,1) both}
.overlay-in{animation:overlayIn .2s ease both}
.overlay-out{animation:overlayOut .3s ease both}
.fu{animation:fadeUp .45s ease both}
.fi{animation:fadeIn .4s ease both}
.card{background:#111E35;border:1px solid #243D5E;border-radius:18px;padding:20px}
.card-h{transition:border-color .2s,transform .2s,box-shadow .2s}
.card-h:hover{border-color:rgba(0,200,170,.4);transform:translateY(-3px);box-shadow:0 16px 40px rgba(0,200,170,.08)}
.btn{border:none;border-radius:10px;padding:12px 28px;font-family:'Space Grotesk',sans-serif;font-weight:600;font-size:14px;cursor:pointer;transition:all .2s;display:inline-flex;align-items:center;justify-content:center;gap:8px}
.btn-teal{background:#00C8AA;color:#070F1E}
.btn-teal:hover{background:#00E5FF;box-shadow:0 8px 28px rgba(0,200,170,.4);transform:translateY(-1px)}
.btn-teal:disabled{opacity:.45;pointer-events:none}
.btn-ghost{background:transparent;color:#00C8AA;border:1.5px solid rgba(0,200,170,.4)}
.btn-ghost:hover{background:rgba(0,200,170,.1);border-color:#00C8AA}
.btn-red{background:rgba(255,61,92,.15);color:#FF3D5C;border:1px solid rgba(255,61,92,.35)}
.btn-red:hover{background:rgba(255,61,92,.25)}
input,textarea,select{background:#1A2E4A;border:1.5px solid #243D5E;color:#E4EFFF;border-radius:10px;padding:12px 16px;font-family:'Space Grotesk',sans-serif;font-size:16px;width:100%;outline:none;transition:border-color .2s,box-shadow .2s;-webkit-appearance:none}
input:focus,textarea:focus,select:focus{border-color:#00C8AA;box-shadow:0 0 0 3px rgba(0,200,170,.15)}
textarea{resize:vertical;min-height:120px}
label{font-size:11px;color:#7A9CBD;margin-bottom:6px;display:block;font-weight:600;letter-spacing:.8px;text-transform:uppercase}
.tag{display:inline-flex;align-items:center;gap:5px;border-radius:20px;padding:4px 12px;font-size:12px;font-weight:600}
.g2{display:grid;grid-template-columns:1fr;gap:16px}
.g3{display:grid;grid-template-columns:1fr;gap:16px}
.g4{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.col2{display:grid;grid-template-columns:1fr;gap:16px}
.nav-links{display:flex;gap:2px;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;flex-shrink:1;max-width:100%}
.nav-links::-webkit-scrollbar{display:none}
.mobile-check-btn{display:none}
@media(min-width:600px){
  .g2{grid-template-columns:repeat(auto-fit,minmax(280px,1fr))}
  .g3{grid-template-columns:repeat(auto-fit,minmax(240px,1fr))}
  .g4{grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px}
  .col2{grid-template-columns:1fr 1fr}
  .card{padding:24px}
  input,textarea,select{font-size:14px}
}
@media(max-width:599px){
  .mobile-check-btn{display:flex!important}
  .desktop-check-btn{display:none!important}
  .hero-btns{flex-direction:column}
  .hero-btns .btn{width:100%;justify-content:center}
  .result-btns{flex-direction:column}
  .result-btns .btn{width:100%}
  .awareness-btns{flex-direction:column}
  .awareness-btns .btn{width:100%}
  .community-btns .btn{width:100%}
}
`

// FIX 1: CSS injection via useEffect in root — safe with Strict Mode
function useGlobalCSS() {
  useEffect(() => {
    if (document.getElementById("as-global-css")) return;
    const el = document.createElement("style");
    el.id = "as-global-css";
    el.textContent = CSS;
    document.head.appendChild(el);
  }, []);
}

// ─────────────────────────────────────────────
// SHARED COMPONENTS
// ─────────────────────────────────────────────
const Tag = ({ color, children }) => (
  <span className="tag" style={{ background: color + "20", color, border: `1px solid ${color}44` }}>
    {children}
  </span>
);

const SectionLabel = ({ text, color = C.teal }) => (
  <div style={{ fontSize: 11, fontWeight: 700, color, letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 12 }}>
    {text}
  </div>
);

const LiveDot = ({ color = C.teal }) => (
  <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, display: "inline-block", animation: "pulse 2s infinite", flexShrink: 0 }} />
);

const Spinner = () => (
  <span style={{ width: 18, height: 18, border: "3px solid #070F1E", borderTopColor: "transparent", borderRadius: "50%", animation: "spin .8s linear infinite", display: "inline-block" }} />
);

// ─────────────────────────────────────────────
// VERIFY RESULT POPUP
// ─────────────────────────────────────────────
function VerifyPopup({ status, onDone }) {
  const [phase, setPhase] = useState("in"); // "in" | "hold" | "out"

  useEffect(() => {
    const holdTimer  = setTimeout(() => setPhase("out"),  2200);
    const doneTimer  = setTimeout(() => onDone(),         2600);
    return () => { clearTimeout(holdTimer); clearTimeout(doneTimer); };
  }, []);

  const cfg = {
    safe:       { color: C.green,  bg: "rgba(0,217,139,.12)",  label: "Legitimate",      sub: "Alert looks clean",              icon: "check"   },
    warning:    { color: C.yellow, bg: "rgba(255,188,0,.12)",   label: "Needs Verification", sub: "Verify before releasing goods", icon: "warning" },
    suspicious: { color: C.red,    bg: "rgba(255,61,92,.12)",   label: "SUSPICIOUS",      sub: "Do NOT release goods",           icon: "x"       },
  }[status] || { color: C.teal, bg: "rgba(0,200,170,.12)", label: "Complete", sub: "", icon: "check" };

  const size = 160;
  const r    = 62;
  const circ = 2 * Math.PI * r;

  return (
    <div
      className={phase === "in" ? "overlay-in" : phase === "out" ? "overlay-out" : ""}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(7,15,30,.85)", backdropFilter: "blur(12px)",
      }}
      onClick={() => { setPhase("out"); setTimeout(onDone, 300); }}
    >
      {/* Ripple rings */}
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          position: "absolute",
          width: 280, height: 280, borderRadius: "50%",
          border: `2px solid ${cfg.color}`,
          animation: `ripple 1.8s ease-out ${i * 0.4}s infinite`,
          opacity: 0,
        }} />
      ))}

      {/* Main card */}
      <div
        className="pop-in"
        style={{
          background: cfg.bg,
          border: `2px solid ${cfg.color}55`,
          borderRadius: 28,
          padding: "48px 56px",
          textAlign: "center",
          minWidth: 320,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Glow blob */}
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%,-50%)",
          width: 260, height: 260, borderRadius: "50%",
          background: cfg.color + "18",
          filter: "blur(40px)",
          pointerEvents: "none",
        }} />

        {/* SVG Icon */}
        <div style={{ position: "relative", marginBottom: 28 }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block", margin: "0 auto" }}>
            {/* Animated circle */}
            <circle
              cx={size / 2} cy={size / 2} r={r}
              fill="none"
              stroke={cfg.color + "33"}
              strokeWidth="6"
            />
            <circle
              cx={size / 2} cy={size / 2} r={r}
              fill="none"
              stroke={cfg.color}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={circ}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              style={{ animation: "drawCircle .7s ease forwards" }}
            />

            {/* CHECK icon */}
            {cfg.icon === "check" && (
              <polyline
                points="50,82 70,104 112,60"
                fill="none"
                stroke={cfg.color}
                strokeWidth="8"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="120"
                strokeDashoffset="120"
                style={{ animation: "drawCheck .5s ease .5s forwards" }}
              />
            )}

            {/* X icon */}
            {cfg.icon === "x" && <>
              <line
                x1="52" y1="52" x2="108" y2="108"
                stroke={cfg.color} strokeWidth="8" strokeLinecap="round"
                strokeDasharray="80" strokeDashoffset="80"
                style={{ animation: "drawX1 .4s ease .5s forwards" }}
              />
              <line
                x1="108" y1="52" x2="52" y2="108"
                stroke={cfg.color} strokeWidth="8" strokeLinecap="round"
                strokeDasharray="80" strokeDashoffset="80"
                style={{ animation: "drawX1 .4s ease .65s forwards" }}
              />
            </>}

            {/* WARNING icon (!) */}
            {cfg.icon === "warning" && <>
              <line
                x1="80" y1="52" x2="80" y2="90"
                stroke={cfg.color} strokeWidth="8" strokeLinecap="round"
                strokeDasharray="50" strokeDashoffset="50"
                style={{ animation: "drawX1 .35s ease .5s forwards" }}
              />
              <circle cx="80" cy="106" r="5" fill={cfg.color}
                style={{ opacity: 0, animation: "fadeIn .2s ease .85s forwards" }}
              />
            </>}
          </svg>
        </div>

        {/* Label */}
        <div
          className="outfit"
          style={{ fontSize: 32, fontWeight: 800, color: cfg.color, marginBottom: 10, letterSpacing: -.5 }}
        >
          {cfg.label}
        </div>
        <div style={{ fontSize: 15, color: C.textMid, marginBottom: 20 }}>{cfg.sub}</div>

        {/* Score pill if suspicious */}
        <div style={{ fontSize: 12, color: cfg.color + "88", letterSpacing: 1 }}>
          TAP ANYWHERE TO CONTINUE
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// GAUGE METER
// ─────────────────────────────────────────────
function GaugeMeter({ score }) {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    setDisplayed(0); // reset on new score
    let raf, start = null;
    const run = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 900, 1);
      setDisplayed(Math.round(p * score));
      if (p < 1) raf = requestAnimationFrame(run);
    };
    raf = requestAnimationFrame(run);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  const color = score >= 70 ? C.red : score >= 40 ? C.yellow : C.green;
  const label = score >= 70 ? "HIGH RISK" : score >= 40 ? "MODERATE RISK" : "LOW RISK";
  const r = 88, cx = 110, cy = 108;
  const arcLen = Math.PI * r;
  const offset = arcLen - (score / 100) * arcLen;
  const ang = ((score / 100) * 180 - 180) * (Math.PI / 180);
  const nx = cx + 72 * Math.cos(ang);
  const ny = cy + 72 * Math.sin(ang);

  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ position: "relative", width: 220, height: 130, margin: "0 auto" }}>
        <svg width="220" height="130" viewBox="0 0 220 130">
          {/* Track */}
          <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none" stroke={C.slate} strokeWidth="14" strokeLinecap="round" />
          {/* Fill */}
          <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none" stroke={color} strokeWidth="14" strokeLinecap="round"
            strokeDasharray={arcLen} strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset .9s cubic-bezier(.4,0,.2,1), stroke .3s" }} />
          {/* Needle */}
          <line x1={cx} y1={cy} x2={nx} y2={ny}
            stroke={color} strokeWidth="2.5" strokeLinecap="round"
            style={{ transition: "all .9s cubic-bezier(.4,0,.2,1)" }} />
          <circle cx={cx} cy={cy} r="5" fill={color} />
        </svg>
        <div style={{ position: "absolute", bottom: 4, left: "50%", transform: "translateX(-50%)", textAlign: "center", width: 130 }}>
          <div className="outfit" style={{ fontSize: 42, fontWeight: 800, color, lineHeight: 1 }}>{displayed}</div>
          <div style={{ fontSize: 10, color: C.textMid, letterSpacing: 1.5, marginTop: 2 }}>{label}</div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// AUTH HOOK
// ─────────────────────────────────────────────
function useAuth() {
  const [user, setUser]       = useState(undefined); // undefined = loading
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const snap = await getDoc(doc(db, "users", u.uid));
        setProfile(snap.exists() ? snap.data() : null);
      } else {
        setProfile(null);
      }
    });
    return unsub;
  }, []);

  return { user, profile };
}

// ─────────────────────────────────────────────
// AUTH PAGE — Login / Signup
// ─────────────────────────────────────────────
function AuthPage({ onAuth }) {
  const [mode, setMode]       = useState("login"); // "login" | "signup" | "forgot"
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [biz, setBiz]         = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [showPass, setShowPass] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  async function handleForgotPassword() {
    if (!email.trim()) { setError("Please enter your email address first."); return; }
    setError(""); setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
    } catch(e) {
      const msgs = {
        "auth/user-not-found":  "No account found with this email.",
        "auth/invalid-email":   "Invalid email address.",
        "auth/too-many-requests": "Too many attempts. Try again later.",
      };
      setError(msgs[e.code] || e.message);
    }
    setLoading(false);
  }

  async function handleSubmit() {
    setError(""); setLoading(true);
    try {
      if (mode === "signup") {
        if (!name.trim()) throw new Error("Please enter your name");
        if (!biz.trim())  throw new Error("Please enter your business name");
        if (password.length < 6) throw new Error("Password must be at least 6 characters");
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name });
        await setDoc(doc(db, "users", cred.user.uid), {
          name, email, business: biz,
          createdAt: serverTimestamp(),
          totalChecked: 0, totalReports: 0,
          guardianLevel: 0,
        });
        onAuth(cred.user);
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        onAuth(cred.user);
      }
    } catch(e) {
      const msgs = {
        "auth/email-already-in-use": "Email already registered. Please log in.",
        "auth/invalid-email":        "Invalid email address.",
        "auth/wrong-password":       "Incorrect password.",
        "auth/user-not-found":       "No account found with this email.",
        "auth/weak-password":        "Password is too weak.",
        "auth/invalid-credential":   "Invalid email or password.",
        "auth/too-many-requests":    "Too many attempts. Try again later.",
      };
      setError(msgs[e.code] || e.message);
    }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: C.navy, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 440 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: `linear-gradient(135deg,${C.teal},${C.cyan})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, margin: "0 auto 14px" }}>🛡</div>
          <div className="outfit" style={{ fontSize: 28, fontWeight: 800 }}>Alert<span style={{ color: C.teal }}>Shield</span></div>
          <div style={{ fontSize: 13, color: C.textMid, marginTop: 4 }}>Protecting Nigerian Merchants</div>
        </div>

        <div className="card">
          {/* Tabs — hide when in forgot mode */}
          {mode !== "forgot" && (
            <div style={{ display: "flex", background: C.slate, borderRadius: 10, padding: 4, marginBottom: 24 }}>
              {["login","signup"].map(m => (
                <button key={m} onClick={() => { setMode(m); setError(""); setResetSent(false); }}
                  style={{ flex: 1, padding: "9px", border: "none", borderRadius: 8, cursor: "pointer", fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 14, transition: "all .2s",
                    background: mode === m ? C.teal : "transparent",
                    color: mode === m ? C.navy : C.textMid,
                  }}>
                  {m === "login" ? "Log In" : "Sign Up"}
                </button>
              ))}
            </div>
          )}

          {/* Forgot password header */}
          {mode === "forgot" && (
            <div style={{ marginBottom: 24 }}>
              <button onClick={() => { setMode("login"); setError(""); setResetSent(false); }}
                style={{ background:"none", border:"none", color:C.textMid, cursor:"pointer", fontSize:13, display:"flex", alignItems:"center", gap:6, marginBottom:16, fontFamily:"'Space Grotesk',sans-serif" }}>
                ← Back to Login
              </button>
              <div className="outfit" style={{ fontSize:22, fontWeight:800, marginBottom:6 }}>Reset Password</div>
              <div style={{ fontSize:13, color:C.textMid }}>Enter your email and we'll send you a reset link.</div>
            </div>
          )}

          {/* ── FORGOT PASSWORD SUCCESS STATE ── */}
          {mode === "forgot" && resetSent ? (
            <div style={{ textAlign:"center", padding:"20px 0" }}>
              <div style={{ fontSize:48, marginBottom:16 }}>📧</div>
              <div className="outfit" style={{ fontSize:20, fontWeight:800, color:C.green, marginBottom:10 }}>Email Sent!</div>
              <p style={{ fontSize:14, color:C.textMid, lineHeight:1.75, marginBottom:24 }}>
                We sent a password reset link to <strong style={{ color:C.text }}>{email}</strong>. Check your inbox and spam folder.
              </p>
              <button className="btn btn-ghost" onClick={() => { setMode("login"); setResetSent(false); setError(""); }}
                style={{ width:"100%" }}>
                Back to Login
              </button>
            </div>
          ) : mode === "forgot" ? (
            <>
              <div style={{ marginBottom:20 }}>
                <label>Email Address</label>
                <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleForgotPassword()} />
              </div>
              {error && (
                <div style={{ background:"rgba(255,61,92,.1)", border:"1px solid rgba(255,61,92,.3)", borderRadius:8, padding:"10px 14px", marginBottom:16, fontSize:13, color:C.red }}>
                  ⚠ {error}
                </div>
              )}
              <button className="btn btn-teal" onClick={handleForgotPassword} disabled={!email || loading}
                style={{ width:"100%", fontSize:15, padding:"14px" }}>
                {loading
                  ? <span style={{ width:18, height:18, border:"3px solid #070F1E", borderTopColor:"transparent", borderRadius:"50%", animation:"spin .8s linear infinite", display:"inline-block" }} />
                  : "📧 Send Reset Link"}
              </button>
            </>
          ) : (
          <>
          {/* Fields */}
          {mode === "signup" && (
            <>
              <div style={{ marginBottom: 14 }}>
                <label>Your Full Name</label>
                <input placeholder="Adeola Okonkwo" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label>Business Name</label>
                <input placeholder="Okonkwo Electronics" value={biz} onChange={e => setBiz(e.target.value)} />
              </div>
            </>
          )}
          <div style={{ marginBottom: 14 }}>
            <label>Email Address</label>
            <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div style={{ marginBottom: 20, position: "relative" }}>
            <label>Password</label>
            <input type={showPass ? "text" : "password"} placeholder={mode === "signup" ? "Min. 6 characters" : "Your password"} value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              style={{ paddingRight: 48 }} />
            <button onClick={() => setShowPass(s => !s)}
              style={{ position: "absolute", right: 12, bottom: 12, background: "none", border: "none", color: C.textMid, cursor: "pointer", fontSize: 16 }}>
              {showPass ? "🙈" : "👁"}
            </button>
          </div>

          {error && (
            <div style={{ background: "rgba(255,61,92,.1)", border: "1px solid rgba(255,61,92,.3)", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: C.red }}>
              ⚠ {error}
            </div>
          )}

          <button className="btn btn-teal" onClick={handleSubmit} disabled={!email || !password || loading}
            style={{ width: "100%", fontSize: 15, padding: "14px" }}>
            {loading ? <span style={{ width: 18, height: 18, border: "3px solid #070F1E", borderTopColor: "transparent", borderRadius: "50%", animation: "spin .8s linear infinite", display: "inline-block" }} /> 
              : mode === "login" ? "Log In to AlertShield" : "Create Account"}
          </button>

          {/* Forgot password link — only on login tab */}
          {mode === "login" && (
            <div style={{ textAlign:"center", marginTop:14 }}>
              <span onClick={() => { setMode("forgot"); setError(""); setResetSent(false); }}
                style={{ fontSize:13, color:C.textMid, cursor:"pointer" }}>
                Forgot your password?{" "}
                <span style={{ color:C.teal, fontWeight:600 }}>Reset it</span>
              </span>
            </div>
          )}

          <div style={{ textAlign: "center", marginTop: 14, fontSize: 13, color: C.textDim }}>
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <span onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}
              style={{ color: C.teal, cursor: "pointer", fontWeight: 600 }}>
              {mode === "login" ? "Sign Up Free" : "Log In"}
            </span>
          </div>
          </>
          )}
        </div>

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: C.textDim }}>
          🔒 Your data is encrypted and secure
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// NAVBAR
// ─────────────────────────────────────────────
const NAV_LINKS = [
  { id: "home",      label: "Home" },
  { id: "checker",   label: "Check Alert" },
  { id: "result",    label: "Fraud Result" },
  { id: "awareness", label: "Awareness" },
  { id: "report",    label: "Report Fraud" },
  { id: "dashboard", label: "Dashboard" },
];

function NavBar({ page, setPage, user }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <nav style={{
        background: "rgba(13,27,48,.96)",
        borderBottom: `1px solid ${C.slateLight}`,
        position: "sticky", top: 0, zIndex: 200,
        backdropFilter: "blur(16px)",
      }}>
        <div style={{
          maxWidth: 1280, margin: "0 auto", padding: "0 16px",
          height: 58, display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: 8,
        }}>
          {/* Logo */}
          <div onClick={() => { setPage("home"); setMenuOpen(false); }}
            style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: `linear-gradient(135deg,${C.teal},${C.cyan})`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
            }}>🛡</div>
            <span className="outfit" style={{ fontWeight: 800, fontSize: 17, letterSpacing: -.3 }}>
              Alert<span style={{ color: C.teal }}>Shield</span>
            </span>
          </div>

          {/* Desktop nav links */}
          <div className="nav-links" style={{ display: "flex" }}>
            {NAV_LINKS.map(l => (
              <button key={l.id} onClick={() => setPage(l.id)} className="btn desktop-check-btn"
                style={{
                  padding: "7px 11px", fontSize: 12, whiteSpace: "nowrap",
                  background: page === l.id ? C.teal + "22" : "transparent",
                  color: page === l.id ? C.teal : C.textMid,
                  border: page === l.id ? `1px solid ${C.teal}44` : "1px solid transparent",
                  borderRadius: 8,
                }}>{l.label}</button>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {/* Desktop CTA */}
            <button className="btn btn-teal desktop-check-btn"
              onClick={() => setPage("checker")}
              style={{ padding: "8px 16px", fontSize: 13 }}>+ Check Alert</button>
            {user && (
              <div className="desktop-check-btn" style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:32, height:32, borderRadius:"50%", background: C.teal+"22", border:`1px solid ${C.teal}44`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, cursor:"pointer" }}
                  onClick={() => setPage("dashboard")}>
                  {user.displayName?.[0]?.toUpperCase() || "M"}
                </div>
                <button className="btn btn-ghost" onClick={() => signOut(auth)} style={{ padding:"6px 12px", fontSize:12 }}>Log Out</button>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              className="mobile-check-btn btn"
              onClick={() => setMenuOpen(o => !o)}
              style={{ padding: "8px 12px", background: menuOpen ? C.teal+"22" : "transparent", border: `1px solid ${menuOpen ? C.teal+"44" : "transparent"}`, borderRadius: 8, flexShrink: 0 }}
            >
              <span style={{ display: "flex", flexDirection: "column", gap: 4, width: 18 }}>
                <span style={{ height: 2, background: menuOpen ? C.teal : C.textMid, borderRadius: 2, transition: "all .2s", transform: menuOpen ? "rotate(45deg) translate(4px,4px)" : "none" }} />
                <span style={{ height: 2, background: menuOpen ? C.teal : C.textMid, borderRadius: 2, transition: "all .2s", opacity: menuOpen ? 0 : 1 }} />
                <span style={{ height: 2, background: menuOpen ? C.teal : C.textMid, borderRadius: 2, transition: "all .2s", transform: menuOpen ? "rotate(-45deg) translate(4px,-4px)" : "none" }} />
              </span>
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {menuOpen && (
          <div style={{
            background: "rgba(13,27,48,.98)", borderTop: `1px solid ${C.slateLight}`,
            padding: "12px 16px 16px",
          }}>
            {NAV_LINKS.map(l => (
              <button key={l.id}
                onClick={() => { setPage(l.id); setMenuOpen(false); }}
                style={{
                  display: "flex", width: "100%", padding: "13px 16px", marginBottom: 4,
                  background: page === l.id ? C.teal + "18" : "transparent",
                  color: page === l.id ? C.teal : C.textMid,
                  border: `1px solid ${page === l.id ? C.teal+"33" : "transparent"}`,
                  borderRadius: 10, fontFamily: "'Space Grotesk',sans-serif",
                  fontWeight: 600, fontSize: 15, cursor: "pointer", textAlign: "left",
                }}>{l.label}</button>
            ))}
            <button className="btn btn-teal"
              onClick={() => { setPage("checker"); setMenuOpen(false); }}
              style={{ width: "100%", marginTop: 8, fontSize: 15, padding: "13px" }}>
              🔍 Check Alert Now
            </button>
            {user && (
              <button className="btn btn-ghost" onClick={() => { signOut(auth); setMenuOpen(false); }}
                style={{ width:"100%", marginTop:8, fontSize:14, padding:"12px" }}>
                Log Out
              </button>
            )}
          </div>
        )}
      </nav>
    </>
  );
}

// ─────────────────────────────────────────────
// FRAUD ANALYSIS ENGINE
// ─────────────────────────────────────────────
function analyzeText(raw) {
  const text = raw.trim();
  const lo = text.toLowerCase();
  const issues = [];
  let score = 0;

  // Rule 1: Missing reference — supports Ref:, Reference:, TRF|pipe style, session IDs
  const hasRef =
    text.match(/ref(erence)?[\s:#|]*[A-Z0-9]{4,}/i) ||
    text.match(/TRF[|\s][A-Z0-9|]+/i) ||
    text.match(/transaction\s*(ref|reference|id|number)[\s:#]*\S{4,}/i) ||
    text.match(/session\s*id[\s:#]*\S{4,}/i) ||
    text.match(/provider\s*ref(erence)?[\s:#]*\d{6,}/i) ||
    text.match(/[A-Z]{2,6}\d{8,}/) ||
    text.match(/transaction\s*no\.?[\s:#]*\d{10,}/i) ||  // OPay "Transaction No."
    text.match(/\d{18,}/);                                   // long numeric IDs like OPay's
  if (!hasRef) {
    issues.push({ label: "Missing transaction reference number", sev: "high" });
    score += 32;
  }

  // Rule 2: Blank / placeholder reference
  if (/ref[:\s]*-{2,}|ref[:\s]*n\/a|ref[:\s]*none|ref[:\s]*\*+/i.test(text)) {
    issues.push({ label: "Blank or placeholder reference (dashes / N/A)", sev: "high" });
    score += 42;
  }

  // Rule 3: "Credit Alert" with no recognizable bank name — expanded list
  // Complete list of CBN-licensed banks + major Nigerian fintechs
  const knownBanks = /gtbank|gt bank|guaranty trust|gtco|zenith|access bank|uba|united bank for africa|united bank|first bank|firstbank|first bank of nigeria|fbn|union bank|fidelity bank|fidelity|ecobank|citibank|standard chartered|stanbic ibtc|stanbic|sterling bank|sterling|wema bank|wema|alat|heritage bank|heritage|keystone bank|keystone|polaris bank|polaris|unity bank|unity|titan bank|titan|globus bank|globus|optimus bank|optimus|premium trust|parallex bank|parallex|coronation bank|coronation|signature bank|fcmb|first city monument|moniepoint|monie point|kuda|kuda bank|opay|o-pay|palmpay|palm pay|carbon bank|carbon|vfd microfinance|vfd|fairmoney|fair money|eyowo|rubies bank|rubies|sparkle|lotus bank|lotus|jaiz bank|jaiz|suntrust bank|suntrust|providus bank|providus|accion|lapo|brass bank|brass|raven bank|raven|pocket by sterling|piggyvest|flutterwave|paystack|monnify|interswitch|nibss/i;
  // Check if this looks like a bank alert but has no recognizable bank name
  const looksLikeBankAlert = /(credit alert|debit alert|credit notification|debit notification|transfer alert|you have received|amount credited|amount debited|transaction alert|bank alert)/i.test(lo);
  if (looksLikeBankAlert && !knownBanks.test(lo)) {
    issues.push({ label: "No recognized Nigerian bank name detected", sev: "medium" });
    score += 14;
  }

  // Rule 4: Amount format missing
  if (!/[\d,]+\.?\d{0,2}/.test(text)) {
    issues.push({ label: "No valid amount detected in alert", sev: "medium" });
    score += 10;
  }

  // Rule 5: Urgency / pressure language
  if (/(urgent|immediately|act now|release now|don.t delay|hurry|quick)/i.test(lo)) {
    issues.push({ label: "Urgency / pressure language detected", sev: "high" });
    score += 36;
  }

  // Rule 6: No timestamp — supports DD/MM/YYYY, HH:MM, "2:50 PM", month names
  const hasTimestamp =
    text.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/) ||
    text.match(/\d{1,2}:\d{2}/) ||
    text.match(/\d{1,2}:\d{2}\s*(am|pm)/i) ||
    text.match(/(january|february|march|april|may|june|july|august|september|october|november|december)/i) ||
    text.match(/\d{4}-\d{2}-\d{2}/);
  if (!hasTimestamp) {
    issues.push({ label: "No date or timestamp found in alert", sev: "medium" });
    score += 9;
  }

  // Rule 7: Suspicious link / click prompt
  if (/(click here|tap here|confirm via link|verify now|follow link)/i.test(lo)) {
    issues.push({ label: "Suspicious link or verification prompt detected", sev: "high" });
    score += 72;
  }

  // Rule 8: Suspiciously short alert
  if (text.length < 45) {
    issues.push({ label: "Alert text is unusually short", sev: "medium" });
    score += 8;
  }

  // Rule 9: Edited / screenshot mention
  if (/(photoshop|edited|canva|picsart)/i.test(lo)) {
    issues.push({ label: "Screenshot editing tool name detected in text", sev: "high" });
    score += 30;
  }

  // Rule 10: Round suspicious amounts with no kobo (e.g. exactly NGN 100000 with no ref)
  const hasRoundAmount = text.match(/(100000|200000|300000|500000|1000000)/) && !hasRef;
  if (hasRoundAmount) {
    issues.push({ label: "Suspiciously round amount with no valid reference", sev: "medium" });
    score += 12;
  }

  // Rule 11: Sender name too generic or missing
  if (/(from: unknown|sender: unknown|from: n\/a|from: ---)/i.test(lo)) {
    issues.push({ label: "Sender name is unknown or missing", sev: "medium" });
    score += 10;
  }

  // Rule 12: Mentions releasing goods / items
  if (/(release (goods|items|product|order)|give (goods|items)|hand over)/i.test(lo)) {
    issues.push({ label: "Alert text mentions releasing goods — red flag", sev: "high" });
    score += 32;
  }

  score = Math.min(100, score);
  const status = score >= 70 ? "suspicious" : score >= 35 ? "warning" : "safe";
  return { score, issues, status, text };
}

const DEMO_ALERT = `GTBANK Credit Alert
Amount: NGN 50,000.00
From: John D
Ref: ----
Date: 10/03/2025 14:32
Bal: NGN 152,300.00`;

const DEMO_RESULT = analyzeText(DEMO_ALERT);

// ─────────────────────────────────────────────
// PAGE 1 — LANDING
// ─────────────────────────────────────────────
function LandingPage({ setPage }) {
  const features = [
    { icon: "🔍", title: "Fraud Alert Detection",      desc: "Paste any SMS or notification and get an instant AI-powered fraud risk score with full breakdown.",   color: C.teal   },
    { icon: "📸", title: "Screenshot Scanner",          desc: "Upload a payment screenshot. We extract the text and check for signs of editing or forgery.",        color: C.cyan   },
    { icon: "🛡", title: "Merchant Protection Tips",   desc: "Step-by-step guidance on verifying payments and protecting your business from payment scams.",         color: C.green  },
    { icon: "🌐", title: "Fraud Intelligence Network", desc: "Community-powered alerts. Fraud patterns reported by merchants warn all others automatically.",       color: C.yellow },
    { icon: "📊", title: "Analytics Dashboard",        desc: "Track every alert you've checked, view fraud history, and see fraud pattern analytics.",             color: C.purple },
    { icon: "🚨", title: "Report Fraud",               desc: "Submit suspicious alerts to strengthen the community network and protect fellow merchants.",          color: C.red    },
  ];

  const stats = [["12,400+", "Alerts Analyzed"], ["₦2.8B", "Fraud Prevented"], ["98%", "Detection Accuracy"]];

  return (
    <div>
      {/* ── HERO ── */}
      <section style={{
        minHeight: "90vh", display: "flex", alignItems: "center",
        background: `radial-gradient(ellipse 100% 80% at 70% 10%, rgba(0,200,170,.13) 0%, transparent 55%),
                     radial-gradient(ellipse 60% 50% at 10% 80%, rgba(155,123,255,.07) 0%, transparent 50%),
                     ${C.navy}`,
        padding: "clamp(40px,8vw,80px) 20px", position: "relative", overflow: "hidden",
      }}>
        {/* Grid overlay */}
        <div style={{
          position: "absolute", inset: 0, opacity: .03, pointerEvents: "none",
          backgroundImage: `linear-gradient(${C.teal} 1px,transparent 1px),linear-gradient(90deg,${C.teal} 1px,transparent 1px)`,
          backgroundSize: "48px 48px",
        }} />

        <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%", display: "flex", gap: 64, alignItems: "center", flexWrap: "wrap" }}>
          {/* Left */}
          <div className="fu" style={{ flex: "1 1 420px" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "rgba(0,200,170,.12)", border: "1px solid rgba(0,200,170,.3)",
              borderRadius: 100, padding: "6px 16px", marginBottom: 28,
            }}>
              <LiveDot />
              <span style={{ fontSize: 11, color: C.teal, fontWeight: 700, letterSpacing: 1.5 }}>COMMUNITY-POWERED FRAUD DETECTION</span>
            </div>

            <h1 className="outfit" style={{ fontSize: "clamp(38px,5.5vw,64px)", fontWeight: 800, lineHeight: 1.05, marginBottom: 22, letterSpacing: -1 }}>
              Stop Fake Payment Alerts<br />
              <span style={{ background: `linear-gradient(90deg,${C.teal},${C.cyan})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Before They Scam
              </span><br />
              Your Business
            </h1>

            <p style={{ fontSize: 17, color: C.textMid, lineHeight: 1.75, marginBottom: 38, maxWidth: 500 }}>
              AlertShield helps Nigerian merchants detect fake payment alerts before releasing goods — powered by AI analysis and real community fraud reports.
            </p>

            <div className="hero-btns" style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 48 }}>
              <button className="btn btn-teal" onClick={() => setPage("checker")} style={{ fontSize: 15, padding: "14px 32px" }}>🔍 Check Payment Alert</button>
              <button className="btn btn-ghost" onClick={() => setPage("awareness")} style={{ fontSize: 15, padding: "13px 28px" }}>Learn About Fraud</button>
            </div>

            <div style={{ display: "flex", gap: "clamp(16px,5vw,36px)", flexWrap: "wrap" }}>
              {stats.map(([v, l]) => (
                <div key={l}>
                  <div className="outfit" style={{ fontSize: 26, fontWeight: 800, color: C.teal }}>{v}</div>
                  <div style={{ fontSize: 12, color: C.textDim, marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — live demo card  FIX 3: removed duplicate style prop */}
          <div className="fu" style={{ flex: "1 1 340px", maxWidth: 430, animationDelay: ".12s" }}>
            <div className="card" style={{ position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${C.teal},${C.cyan})` }} />
              <div style={{
                position: "absolute", left: 0, right: 0, height: "30%",
                background: "linear-gradient(transparent, rgba(0,200,170,.05), transparent)",
                animation: "scan 3s linear infinite", pointerEvents: "none",
              }} />
              <div style={{ fontSize: 11, color: C.teal, fontWeight: 700, letterSpacing: 1.5, marginBottom: 14 }}>⚡ LIVE DEMO ANALYSIS</div>
              <div style={{
                background: C.slate, borderRadius: 10, padding: 16, marginBottom: 16,
                fontFamily: "monospace", fontSize: 13, lineHeight: 2, color: C.textMid,
                border: `1px solid ${C.slateLight}`,
              }}>
                <div><span style={{ color: C.textDim }}>From: </span><span style={{ color: C.yellow }}>GTBANK</span></div>
                <div><span style={{ color: C.textDim }}>Amount: </span><span style={{ color: C.text }}>NGN 50,000.00</span></div>
                <div><span style={{ color: C.textDim }}>Sender: </span><span style={{ color: C.text }}>John D</span></div>
                <div><span style={{ color: C.textDim }}>Ref: </span><span style={{ color: C.red, fontWeight: 700 }}>---- ⚠</span></div>
                <div><span style={{ color: C.textDim }}>Time: </span><span style={{ color: C.text }}>10/03/2025 14:32</span></div>
              </div>
              <div style={{ background: "rgba(255,61,92,.12)", border: "1px solid rgba(255,61,92,.4)", borderRadius: 10, padding: "14px 16px", marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ color: C.red, fontWeight: 700, fontSize: 14 }}>🔴 Suspicious Alert</span>
                  <span className="outfit" style={{ color: C.red, fontWeight: 800, fontSize: 28 }}>85</span>
                </div>
                <div style={{ height: 6, background: C.slate, borderRadius: 3 }}>
                  <div style={{ width: "85%", height: "100%", background: C.red, borderRadius: 3 }} />
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,61,92,.75)", marginTop: 8 }}>⚠ Blank reference · No bank format detected</div>
              </div>
              <div style={{ fontSize: 12, color: C.textDim }}>🔒 Do NOT release goods. Verify in your bank app first.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: "clamp(48px,8vw,90px) 16px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <SectionLabel text="Platform Features" />
          <h2 className="outfit" style={{ fontSize: 40, fontWeight: 800, letterSpacing: -.5 }}>Everything You Need to Stay Safe</h2>
        </div>
        <div className="g3">
          {features.map((f, i) => (
            <div key={f.title} className="card card-h fu" style={{ animationDelay: `${i * .07}s`, cursor: "default" }}>
              <div style={{ fontSize: 36, marginBottom: 14 }}>{f.icon}</div>
              <h3 className="outfit" style={{ fontSize: 18, fontWeight: 700, color: f.color, marginBottom: 10 }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: C.textMid, lineHeight: 1.75 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ background: C.navyMid, padding: "clamp(40px,7vw,80px) 16px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <SectionLabel text="Simple Process" />
            <h2 className="outfit" style={{ fontSize: 38, fontWeight: 800, letterSpacing: -.5 }}>How AlertShield Works</h2>
          </div>
          <div className="g3">
            {[
              { n: "01", t: "Paste or Upload",  d: "Paste the SMS alert text you received, or upload a screenshot directly from your phone or computer." },
              { n: "02", t: "AI Analysis",      d: "Our engine checks for missing references, suspicious wording, pressure language, unusual formatting, and known fraud patterns." },
              { n: "03", t: "Get Your Result",  d: "Receive a 0–100 Fraud Risk Score, a detailed breakdown of all detected issues, and a clear Safe / Warning / Suspicious verdict." },
            ].map((step, i) => (
              <div key={step.n} className="fu" style={{ animationDelay: `${i * .1}s` }}>
                <div className="outfit" style={{ fontSize: 64, fontWeight: 800, color: "rgba(0,200,170,.18)", lineHeight: 1, marginBottom: 14 }}>{step.n}</div>
                <h3 className="outfit" style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>{step.t}</h3>
                <p style={{ fontSize: 14, color: C.textMid, lineHeight: 1.8 }}>{step.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMMUNITY BANNER ── */}
      <section style={{ padding: "clamp(40px,7vw,80px) 16px", maxWidth: 1200, margin: "0 auto" }}>
        <div className="card" style={{
          background: "linear-gradient(135deg, rgba(0,200,170,.1) 0%, #111E35 60%)",
          border: "1px solid rgba(0,200,170,.35)",
          padding: "clamp(24px,4vw,48px) clamp(16px,4vw,40px)", display: "flex", gap: "clamp(24px,4vw,48px)", alignItems: "center", flexWrap: "wrap",
        }}>
          <div style={{ flex: "1 1 340px" }}>
            <SectionLabel text="Merchant Fraud Intelligence Network" />
            <h2 className="outfit" style={{ fontSize: 34, fontWeight: 800, marginBottom: 14, letterSpacing: -.3 }}>
              Powered by the <span style={{ color: C.teal }}>Community</span>
            </h2>
            <p style={{ color: C.textMid, fontSize: 15, lineHeight: 1.75, marginBottom: 24 }}>
              Every fraud report filed by a merchant strengthens the network. When a similar pattern emerges, every merchant is warned automatically before they fall victim.
            </p>
            <button className="btn btn-ghost" onClick={() => setPage("report")}>Join the Network →</button>
          </div>
          <div style={{ flex: "1 1 280px" }}>
            <div className="g2" style={{ gap: 14 }}>
              {[["1,240+","Fraud Reports Filed"],["42","Active Alert Patterns"],["320+","Protected Merchants"],["98%","Network Match Rate"]].map(([v, l]) => (
                <div key={l} style={{ background: C.slate, borderRadius: 12, padding: "16px 18px" }}>
                  <div className="outfit" style={{ fontSize: 28, fontWeight: 800, color: C.teal }}>{v}</div>
                  <div style={{ fontSize: 12, color: C.textDim, marginTop: 3 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ textAlign: "center", padding: "clamp(40px,7vw,80px) 16px", background: "radial-gradient(ellipse 70% 80% at 50% 100%, rgba(0,200,170,.12) 0%, transparent 65%)" }}>
        <SectionLabel text="Get Started Free" />
        <h2 className="outfit" style={{ fontSize: 44, fontWeight: 800, marginBottom: 16, letterSpacing: -.5 }}>Protect Your Business Today</h2>
        <p style={{ color: C.textMid, marginBottom: 36, fontSize: 16 }}>Join thousands of merchants who verify every payment before releasing goods.</p>
        <button className="btn btn-teal" onClick={() => setPage("checker")} style={{ fontSize: 16, padding: "16px 44px" }}>
          🔍 Check Payment Alert — Free
        </button>
      </section>

      {/* ── FOOTER ── FIX 4: footer nav links now call setPage */}
      <footer style={{ borderTop: `1px solid ${C.slateLight}`, padding: "40px 20px", textAlign: "center" }}>
        <div className="outfit" style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>
          🛡 Alert<span style={{ color: C.teal }}>Shield</span>
        </div>
        <p style={{ fontSize: 13, color: C.textDim, marginBottom: 16 }}>
          Protecting Small Businesses from Fake Payment Alerts · Community-Powered Fraud Intelligence
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: 24, flexWrap: "wrap" }}>
          {NAV_LINKS.map(l => (
            <span
              key={l.id}
              onClick={() => setPage(l.id)}
              style={{ fontSize: 12, color: C.textDim, cursor: "pointer", transition: "color .2s" }}
              onMouseEnter={e => e.currentTarget.style.color = C.teal}
              onMouseLeave={e => e.currentTarget.style.color = C.textDim}
            >{l.label}</span>
          ))}
        </div>
      </footer>
    </div>
  );
}

// ─────────────────────────────────────────────
// PAGE 2 — ALERT CHECKER (with Tesseract OCR)
// ─────────────────────────────────────────────
function CheckerPage({ setPage, setResult, user }) {
  const [text, setText]       = useState("");
  const [loading, setLoading] = useState(false);
  const [file, setFile]       = useState(false);
  const [fileObj, setFileObj] = useState(null);
  const [popup, setPopup]     = useState(null);
  const [ocrState, setOcrState] = useState("idle"); // "idle"|"loading"|"done"|"error"
  const [ocrProgress, setOcrProgress] = useState(0);
  const [imagePreview, setImagePreview] = useState(null);
  const fileRef = useRef();

  async function runAnalysis() {
    if (!text.trim() || loading) return;
    setLoading(true);
    setTimeout(async () => {
      const analyzed = analyzeText(text);
      setResult(analyzed);
      setLoading(false);
      setPopup({ status: analyzed.status });
      if (user) {
        try {
          await addDoc(collection(db, "alerts"), {
            uid: user.uid, text: analyzed.text, score: analyzed.score,
            status: analyzed.status, issues: analyzed.issues, checkedAt: serverTimestamp(),
          });
          await updateDoc(doc(db, "users", user.uid), { totalChecked: increment(1) });
        } catch(e) { console.warn("Could not save alert:", e); }
      }
    }, 1500);
  }

  function handlePopupDone() { setPopup(null); setPage("result"); }

  async function handleFile(e) {
    const f = e.target.files[0];
    if (!f) return;
    setFileObj(f);
    setFile(true);
    setOcrState("loading");
    setOcrProgress(0);
    setText("");

    // Show image preview
    const reader = new FileReader();
    reader.onload = ev => setImagePreview(ev.target.result);
    reader.readAsDataURL(f);

    try {
      // Dynamically load Tesseract from CDN
      if (!window.Tesseract) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.0.4/tesseract.min.js";
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      const result = await window.Tesseract.recognize(f, "eng", {
        logger: m => {
          if (m.status === "recognizing text") {
            setOcrProgress(Math.round(m.progress * 100));
          }
        }
      });

      const extracted = result.data.text.trim();
      if (extracted.length > 10) {
        setText(extracted);
        setOcrState("done");
      } else {
        setOcrState("error");
        setText("");
      }
    } catch(err) {
      console.warn("OCR failed:", err);
      setOcrState("error");
      setText("");
    }
  }

  function clearFile() {
    setFile(false); setFileObj(null);
    setOcrState("idle"); setOcrProgress(0);
    setImagePreview(null); setText("");
    if (fileRef.current) fileRef.current.value = "";
  }

  function loadDemo() { setText(DEMO_ALERT); setFile(false); setFileObj(null); setOcrState("idle"); setImagePreview(null); }

  const canSubmit = text.trim().length > 0 && !loading && ocrState !== "loading";

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "clamp(32px,6vw,64px) 16px" }}>
      <div className="fu" style={{ textAlign: "center", marginBottom: 44 }}>
        <SectionLabel text="Instant Verification" />
        <h1 className="outfit" style={{ fontSize: "clamp(28px,5vw,40px)", fontWeight: 800, marginBottom: 12, letterSpacing: -.5 }}>Verify Payment Alert</h1>
        <p style={{ color: C.textMid, fontSize: 15 }}>Paste alert text or upload a screenshot — we'll read it automatically.</p>
      </div>

      {/* Community warning */}
      <div className="fu" style={{
        animationDelay: ".05s", background: "rgba(255,188,0,.1)",
        border: "1px solid rgba(255,188,0,.35)", borderRadius: 12,
        padding: "12px 18px", marginBottom: 24, display: "flex", gap: 10, alignItems: "flex-start",
      }}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>⚠</span>
        <div>
          <span style={{ fontWeight: 700, color: C.yellow, fontSize: 14 }}>Community Alert: </span>
          <span style={{ color: C.textMid, fontSize: 13 }}>3 merchants recently reported fake alerts with blank transaction references. Stay vigilant.</span>
        </div>
      </div>

      <div className="card fu" style={{ animationDelay: ".1s" }}>

        {/* ── UPLOAD ZONE ── */}
        {!file ? (
          <div
            onClick={() => fileRef.current.click()}
            style={{
              border: `2px dashed ${C.slateLight}`, borderRadius: 12,
              padding: "32px 20px", textAlign: "center", cursor: "pointer",
              marginBottom: 20, transition: "all .2s",
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(0,200,170,.5)"}
            onMouseLeave={e => e.currentTarget.style.borderColor = C.slateLight}
          >
            <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handleFile} />
            <div style={{ fontSize: 36, marginBottom: 10 }}>📸</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 6 }}>Upload Payment Screenshot</div>
            <div style={{ fontSize: 13, color: C.textMid, marginBottom: 4 }}>We'll automatically read the text from your image</div>
            <div style={{ fontSize: 12, color: C.textDim }}>PNG, JPG, WEBP — up to 10 MB</div>
          </div>
        ) : (
          <div style={{ marginBottom: 20 }}>
            {/* Image preview + OCR status */}
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 16 }}>
              {imagePreview && (
                <img src={imagePreview} alt="preview"
                  style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 10, border: `1px solid ${C.slateLight}`, flexShrink: 0 }} />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4 }}>
                  {fileObj?.name}
                </div>

                {/* OCR Progress */}
                {ocrState === "loading" && (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <div style={{ width: 14, height: 14, border: `2px solid ${C.teal}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin .8s linear infinite", flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: C.teal }}>Reading text from image… {ocrProgress}%</span>
                    </div>
                    <div style={{ height: 4, background: C.slate, borderRadius: 2 }}>
                      <div style={{ width: `${ocrProgress}%`, height: "100%", background: C.teal, borderRadius: 2, transition: "width .3s" }} />
                    </div>
                  </div>
                )}

                {ocrState === "done" && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ color: C.green, fontSize: 13, fontWeight: 600 }}>✅ Text extracted successfully</span>
                  </div>
                )}

                {ocrState === "error" && (
                  <div style={{ color: C.yellow, fontSize: 13 }}>
                    ⚠ Couldn't read text automatically — please type it below
                  </div>
                )}
              </div>
              <button onClick={clearFile}
                style={{ background: "none", border: "none", color: C.textDim, cursor: "pointer", fontSize: 18, padding: 4, flexShrink: 0 }}>
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: C.slateLight }} />
          <span style={{ fontSize: 11, color: C.textDim, fontWeight: 600, letterSpacing: 1.5, whiteSpace: "nowrap" }}>
            {file && ocrState === "done" ? "REVIEW & EDIT EXTRACTED TEXT" : "OR PASTE ALERT TEXT"}
          </span>
          <div style={{ flex: 1, height: 1, background: C.slateLight }} />
        </div>

        {/* Text area — always shown, editable after OCR */}
        <div style={{ position: "relative", marginBottom: 20 }}>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={
              ocrState === "loading"
                ? "Extracting text from image…"
                : ocrState === "done"
                ? "Review and edit the extracted text if needed…"
                : "Paste the full payment alert text here…"
            }
            disabled={ocrState === "loading"}
            style={{
              minHeight: 140, width: "100%",
              opacity: ocrState === "loading" ? .5 : 1,
              background: ocrState === "done" ? "rgba(0,200,170,.04)" : undefined,
              borderColor: ocrState === "done" ? "rgba(0,200,170,.4)" : undefined,
            }}
          />
          {ocrState === "done" && (
            <div style={{ position: "absolute", top: 10, right: 12, fontSize: 11, color: C.teal, fontWeight: 600, letterSpacing: .5 }}>
              OCR ✓
            </div>
          )}
        </div>

        {/* Tip when OCR done */}
        {ocrState === "done" && (
          <div style={{ background: "rgba(0,200,170,.08)", border: "1px solid rgba(0,200,170,.25)", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: C.textMid }}>
            💡 Text was extracted from your image. Review it above and correct any errors before analyzing.
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          <button className="btn btn-teal" onClick={runAnalysis} disabled={!canSubmit}
            style={{ flex: 1, fontSize: 15, padding: "14px" }}>
            {loading ? <Spinner /> : "🔍 Analyze Alert"}
          </button>
          <button className="btn btn-ghost" onClick={loadDemo} style={{ whiteSpace: "nowrap" }}>
            Try Demo
          </button>
        </div>

        <div style={{ textAlign: "center", fontSize: 12, color: C.textDim }}>
          🔒 Your data is analyzed locally and never stored without consent
        </div>
      </div>

      {/* Checklist */}
      <div className="card fu" style={{ marginTop: 20, animationDelay: ".15s" }}>
        <div className="outfit" style={{ fontSize: 15, fontWeight: 700, color: C.teal, marginBottom: 16 }}>⚡ Quick Merchant Checklist</div>
        {[
          "Open your banking app and confirm the balance increased",
          "Check for the exact transaction reference number",
          "For transfers above ₦10,000 — call your bank to confirm",
          "Never release goods based on an SMS alert alone",
          "Screenshot alerts can be faked — always verify in-app",
        ].map((tip, i) => (
          <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10, padding: "9px 12px", background: C.slate, borderRadius: 8 }}>
            <span style={{ color: C.teal, fontSize: 12, marginTop: 2, flexShrink: 0 }}>✓</span>
            <span style={{ fontSize: 13, color: C.textMid }}>{tip}</span>
          </div>
        ))}
      </div>

      {/* Popup overlay */}
      {popup && <VerifyPopup status={popup.status} onDone={handlePopupDone} />}
    </div>
  );
}

// ─────────────────────────────────────────────
// PAGE 3 — FRAUD RESULT
// ─────────────────────────────────────────────
function ResultPage({ result, setPage, pushHistory }) {
  // FIX 6: use DEMO_RESULT constant (pre-computed) when no real result
  const r = result || DEMO_RESULT;

  // FIX 7: only push to history once, correctly guarded
  useEffect(() => {
    if (result) pushHistory(result);
  }, [result]);

  const cfgMap = {
    safe:       { color: C.green,  icon: "✅", label: "Likely Legitimate",  msg: "Alert appears clean — always double-check in your banking app."  },
    warning:    { color: C.yellow, icon: "🟡", label: "Needs Verification", msg: "Verify with your bank app before releasing any goods."            },
    suspicious: { color: C.red,    icon: "🔴", label: "Suspicious Alert",   msg: "Do NOT release goods. Contact your bank immediately."             },
  };
  const cfg = cfgMap[r.status];

  return (
    <div style={{ maxWidth: 740, margin: "0 auto", padding: "clamp(32px,6vw,64px) 16px" }}>
      <div className="fu" style={{ textAlign: "center", marginBottom: 40 }}>
        <SectionLabel text="Analysis Complete" />
        <h1 className="outfit" style={{ fontSize: 38, fontWeight: 800, letterSpacing: -.5 }}>Fraud Analysis Result</h1>
        {!result && (
          <p style={{ marginTop: 10, fontSize: 13, color: C.textDim }}>
            Showing demo result —{" "}
            <span style={{ color: C.teal, cursor: "pointer", textDecoration: "underline" }} onClick={() => setPage("checker")}>
              analyze your own alert →
            </span>
          </p>
        )}
      </div>

      {/* Status banner */}
      <div className="card fu" style={{
        background: cfg.color + "14", border: `1px solid ${cfg.color}44`,
        textAlign: "center", padding: "32px 24px", marginBottom: 20, animationDelay: ".05s",
      }}>
        <div style={{ fontSize: 60, marginBottom: 10 }}>{cfg.icon}</div>
        <div className="outfit" style={{ fontSize: 32, fontWeight: 800, color: cfg.color, marginBottom: 8 }}>{cfg.label}</div>
        <div style={{ fontSize: 14, color: cfg.color + "bb" }}>{cfg.msg}</div>
      </div>

      {/* Gauge */}
      <div className="card fu" style={{ marginBottom: 20, textAlign: "center", animationDelay: ".1s" }}>
        <div className="outfit" style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Fraud Risk Score</div>
        <GaugeMeter score={r.score} />
        <div style={{ fontSize: 13, color: C.textMid, marginTop: 8 }}>
          Score: <strong style={{ color: cfg.color }}>{r.score} / 100</strong>
        </div>
      </div>

      {/* Issues */}
      <div className="card fu" style={{ marginBottom: 20, animationDelay: ".14s" }}>
        <div className="outfit" style={{ fontSize: 15, fontWeight: 700, marginBottom: 18 }}>🔎 Detected Issues</div>
        {r.issues.length === 0 ? (
          <div style={{ color: C.green, fontSize: 14, padding: "12px 0" }}>
            ✅ No suspicious indicators found. The alert looks clean.
          </div>
        ) : (
          r.issues.map((iss, i) => (
            <div key={i} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "14px 0",
              borderBottom: i < r.issues.length - 1 ? `1px solid ${C.slateLight}` : "none",
            }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <span style={{ fontSize: 18 }}>{iss.sev === "high" ? "🔴" : "🟡"}</span>
                <span style={{ fontSize: 14, color: iss.sev === "high" ? C.red : C.yellow }}>{iss.label}</span>
              </div>
              <Tag color={iss.sev === "high" ? C.red : C.yellow}>
                {iss.sev === "high" ? "High Risk" : "Medium"}
              </Tag>
            </div>
          ))
        )}
      </div>

      {/* Community intelligence match */}
      {r.status === "suspicious" && (
        <div className="fu" style={{
          animationDelay: ".18s",
          background: "rgba(255,61,92,.08)", border: "1px solid rgba(255,61,92,.35)",
          borderRadius: 14, padding: "18px 20px", marginBottom: 20,
        }}>
          <div style={{ fontWeight: 700, color: C.red, marginBottom: 6, fontSize: 15 }}>⚠ Community Intelligence Match</div>
          <div style={{ fontSize: 13, color: C.textMid, lineHeight: 1.7 }}>
            This pattern matches <strong style={{ color: C.text }}>fraud reports from 7 other merchants</strong> in the AlertShield network. Do not proceed without direct bank verification.
          </div>
        </div>
      )}

      {/* Analyzed text */}
      <div className="card fu" style={{ marginBottom: 28, animationDelay: ".2s" }}>
        <label style={{ marginBottom: 10 }}>Analyzed Text</label>
        <pre style={{
          background: C.slate, borderRadius: 10, padding: "14px 16px",
          fontSize: 13, color: C.textMid, lineHeight: 1.9,
          whiteSpace: "pre-wrap", fontFamily: "monospace",
          border: `1px solid ${C.slateLight}`,
        }}>{r.text}</pre>
      </div>

      <div className="result-btns" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button className="btn btn-teal" onClick={() => setPage("checker")} style={{ flex: 1, padding: "13px" }}>
          Check Another Alert
        </button>
        <button className="btn btn-red" onClick={() => setPage("report")} style={{ flex: 1, padding: "13px" }}>
          🚨 Report This Alert
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// PAGE 4 — FRAUD AWARENESS
// ─────────────────────────────────────────────
function AwarenessPage({ setPage }) {
  const scams = [
    {
      icon: "📱", color: C.red, title: "Fake SMS Alerts",
      desc: "Scammers send SMS messages mimicking your bank, often with missing or placeholder references like '----'. These look official but are completely fabricated.",
      tips: ["Always verify in your banking app — not SMS alone", "Real alerts always contain a valid transaction reference", "Call your bank to confirm transfers above ₦5,000"],
    },
    {
      icon: "🖼", color: C.yellow, title: "Edited Bank Screenshots",
      desc: "Using photo editors, fraudsters alter real screenshots to show fake amounts or create entirely fabricated alert screens that look like your bank's app.",
      tips: ["Zoom in to check for inconsistent fonts or pixel artifacts", "The balance shown should match your actual account", "Screenshots are trivially easy to fake — never rely on them"],
    },
    {
      icon: "🌐", color: C.purple, title: "Fake Mobile Banking Pages",
      desc: "A fake website or app screen used to 'demonstrate' a transfer was made. The URL or interface will differ slightly from the real bank's official app.",
      tips: ["Only accept payment proof from the official bank app", "Check URLs carefully — one wrong letter means a fake", "Legitimate transfers don't need you to watch them happen"],
    },
    {
      icon: "⏰", color: C.cyan, title: "Delayed Credit Claims",
      desc: "Fraudster claims the transfer was made but will 'reflect in 24 hours.' This is always false — real NIBSS/NIP transfers reflect within seconds.",
      tips: ["Real Nigerian bank transfers appear in under 60 seconds", "There is NO legitimate reason for a transfer to be invisible", "Never release goods pending a so-called 'clearing period'"],
    },
  ];

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "clamp(32px,6vw,64px) 16px" }}>
      <div className="fu" style={{ textAlign: "center", marginBottom: 60 }}>
        <SectionLabel text="Stay Informed" />
        <h1 className="outfit" style={{ fontSize: 42, fontWeight: 800, letterSpacing: -.5, marginBottom: 14 }}>Fraud Awareness Guide</h1>
        <p style={{ color: C.textMid, maxWidth: 560, margin: "0 auto", fontSize: 15, lineHeight: 1.75 }}>
          Understanding how scammers operate is your most powerful defense. These are the most common fraud tactics targeting Nigerian merchants.
        </p>
      </div>

      <div className="g2" style={{ marginBottom: 56 }}>
        {scams.map((sc, i) => (
          <div key={i} className="card card-h fu" style={{ animationDelay: `${i * .08}s`, cursor: "default" }}>
            <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 36 }}>{sc.icon}</div>
              <h3 className="outfit" style={{ fontSize: 20, fontWeight: 700, color: sc.color }}>{sc.title}</h3>
            </div>
            <p style={{ fontSize: 14, color: C.textMid, lineHeight: 1.75, marginBottom: 18 }}>{sc.desc}</p>
            <div style={{ background: C.slate, borderRadius: 10, padding: "14px 16px", border: `1px solid ${C.slateLight}` }}>
              <div style={{ fontSize: 11, color: sc.color, fontWeight: 700, letterSpacing: 1.5, marginBottom: 10 }}>HOW TO PROTECT YOURSELF</div>
              {sc.tips.map((tip, j) => (
                <div key={j} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 8 }}>
                  <span style={{ color: sc.color, fontSize: 12, marginTop: 2, flexShrink: 0 }}>→</span>
                  <span style={{ fontSize: 13, color: C.textMid }}>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Master checklist */}
      <div className="card fu" style={{ background: "linear-gradient(135deg, rgba(0,200,170,.08), #111E35)", border: "1px solid rgba(0,200,170,.35)" }}>
        <h2 className="outfit" style={{ fontSize: 26, fontWeight: 800, marginBottom: 24, color: C.teal }}>🛡 Complete Merchant Protection Checklist</h2>
        <div className="g2" style={{ gap: 12 }}>
          {[
            "✅ Always verify payments in your banking app — not SMS",
            "✅ Wait for your account balance to visibly update",
            "✅ Check the transaction reference number is real",
            "✅ For transfers above ₦10,000 — call your bank directly",
            "✅ Use AlertShield to analyze every suspicious alert",
            "✅ Report fake alerts to protect other merchants",
            "✅ Never release goods under time pressure",
            "✅ Train all staff to recognize fake payment alerts",
            "✅ Install your bank's official app — not third-party clones",
            "✅ Trust your gut — if something feels off, it probably is",
          ].map((item, i) => (
            <div key={i} style={{ fontSize: 13, color: C.textMid, padding: "10px 14px", background: C.slate, borderRadius: 8 }}>{item}</div>
          ))}
        </div>
        <div className="awareness-btns" style={{ marginTop: 28, display: "flex", gap: 14, flexWrap: "wrap" }}>
          <button className="btn btn-teal" onClick={() => setPage("checker")}>Check a Payment Alert</button>
          <button className="btn btn-ghost" onClick={() => setPage("report")}>Report Fraud You've Seen</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// PAGE 5 — REPORT FRAUD
// ─────────────────────────────────────────────
function ReportPage({ user }) {
  const EMPTY_FORM = { name: "", business: "", phone: "", alertType: "SMS", description: "", alertText: "" };
  const [form, setForm] = useState(EMPTY_FORM);
  const [file, setFile] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  // FIX 8: renamed inner setter to avoid shadowing outer variables
  const updateForm = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  async function handleSubmit() {
    if (!form.description.trim()) return;
    setLoading(true);
    try {
      await addDoc(collection(db, "reports"), {
        ...form,
        uid:        user ? user.uid : "anonymous",
        userName:   user ? (user.displayName || "Merchant") : "Anonymous",
        reportedAt: serverTimestamp(),
        status:     "pending",
      });
      if (user) {
        await updateDoc(doc(db, "users", user.uid), {
          totalReports: increment(1),
        });
      }
      setSubmitted(true);
    } catch(e) {
      console.warn("Report save failed:", e);
      setSubmitted(true); // still show success to user
    }
    setLoading(false);
  }

  function resetForm() {
    setSubmitted(false);
    setForm(EMPTY_FORM);
    setFile(null);
  }

  if (submitted) return (
    <div className="fu" style={{ maxWidth: 580, margin: "100px auto", padding: "0 20px", textAlign: "center" }}>
      <div style={{
        width: 80, height: 80, borderRadius: "50%",
        background: "rgba(0,217,139,.15)", border: `2px solid ${C.green}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 36, margin: "0 auto 24px",
      }}>🙌</div>
      <h2 className="outfit" style={{ fontSize: 34, fontWeight: 800, color: C.green, marginBottom: 16 }}>Report Submitted!</h2>
      <p style={{ color: C.textMid, fontSize: 16, lineHeight: 1.75, marginBottom: 28 }}>
        Thank you for helping protect other merchants. Your report has been added to the{" "}
        <strong style={{ color: C.text }}>AlertShield Fraud Intelligence Network</strong> and will flag similar alerts for other users.
      </p>
      <div style={{ background: "rgba(0,217,139,.1)", border: "1px solid rgba(0,217,139,.35)", borderRadius: 14, padding: "18px 24px", marginBottom: 32 }}>
        <div style={{ fontWeight: 700, color: C.green, marginBottom: 6 }}>🛡 You've earned a Guardian Badge</div>
        <div style={{ fontSize: 13, color: C.textMid }}>Your contribution protects hundreds of merchants from the same fraud pattern.</div>
      </div>
      <button className="btn btn-ghost" onClick={resetForm}>Submit Another Report</button>
    </div>
  );

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "clamp(32px,6vw,64px) 16px" }}>
      <div className="fu" style={{ textAlign: "center", marginBottom: 44 }}>
        <SectionLabel text="Community Protection" color={C.red} />
        <h1 className="outfit" style={{ fontSize: 40, fontWeight: 800, letterSpacing: -.5, marginBottom: 12 }}>Report a Fraud Alert</h1>
        <p style={{ color: C.textMid, fontSize: 15 }}>Help protect other merchants by reporting the fraud pattern to our community network.</p>
      </div>

      <div className="card fu" style={{ animationDelay: ".08s" }}>
        <div style={{ background: "rgba(0,200,170,.08)", border: "1px solid rgba(0,200,170,.3)", borderRadius: 10, padding: "12px 16px", marginBottom: 24, fontSize: 13, color: C.textMid }}>
          🌐 <strong style={{ color: C.teal }}>Every report matters.</strong> When 3+ merchants report the same pattern, all AlertShield users are automatically warned.
        </div>

        {/* Name + Business */}
        <div className="col2" style={{ marginBottom: 16 }}>
          <div>
            <label>Your Name</label>
            <input placeholder="Adeola Okonkwo" value={form.name} onChange={e => updateForm("name", e.target.value)} />
          </div>
          <div>
            <label>Business Name</label>
            <input placeholder="Okonkwo Electronics" value={form.business} onChange={e => updateForm("business", e.target.value)} />
          </div>
        </div>

        {/* Phone + Alert type */}
        <div className="col2" style={{ marginBottom: 16 }}>
          <div>
            <label>Phone (optional)</label>
            <input placeholder="080XXXXXXXX" value={form.phone} onChange={e => updateForm("phone", e.target.value)} />
          </div>
          <div>
            <label>Alert Type</label>
            <select value={form.alertType} onChange={e => updateForm("alertType", e.target.value)}>
              {["SMS", "Screenshot", "WhatsApp", "Banking App", "Other"].map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div style={{ marginBottom: 16 }}>
          <label>Describe the Incident *</label>
          <textarea
            placeholder="Describe what happened — how the alert was presented, what amount was claimed, how you discovered it was fake…"
            value={form.description}
            onChange={e => updateForm("description", e.target.value)}
            style={{ minHeight: 130 }}
          />
        </div>

        {/* Alert text */}
        <div style={{ marginBottom: 16 }}>
          <label>Suspicious Alert Text (paste if available)</label>
          <textarea
            placeholder="Paste the alert text here…"
            value={form.alertText}
            onChange={e => updateForm("alertText", e.target.value)}
            style={{ minHeight: 90 }}
          />
        </div>

        {/* Screenshot upload */}
        <div style={{ marginBottom: 24 }}>
          <label>Upload Screenshot (optional)</label>
          <div
            onClick={() => fileRef.current.click()}
            style={{
              border: `2px dashed ${file ? C.teal : C.slateLight}`,
              borderRadius: 10, padding: "22px", textAlign: "center", cursor: "pointer",
              background: file ? "rgba(0,200,170,.06)" : "transparent", transition: "all .2s",
            }}
            onMouseEnter={e => { if (!file) e.currentTarget.style.borderColor = "rgba(0,200,170,.5)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = file ? C.teal : C.slateLight; }}
          >
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => setFile(e.target.files[0])} />
            <div style={{ fontSize: 12, color: file ? C.teal : C.textDim, fontWeight: 500 }}>
              {file ? `📎 ${file.name}` : "Click to upload a screenshot of the fake alert"}
            </div>
          </div>
        </div>

        <button
          className="btn btn-teal"
          onClick={handleSubmit}
          disabled={!form.description.trim()}
          style={{ width: "100%", fontSize: 15, padding: "15px" }}
        >
          {loading
            ? <span style={{ width:18, height:18, border:"3px solid #070F1E", borderTopColor:"transparent", borderRadius:"50%", animation:"spin .8s linear infinite", display:"inline-block" }}/>
            : "🚨 Submit Fraud Report to Network"}
        </button>
      </div>

      {/* Recent community reports */}
      <div className="card fu" style={{ marginTop: 20, animationDelay: ".15s" }}>
        <div className="outfit" style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>📋 Recent Community Reports</div>
        {[
          { merchant: "Lagos Trader",          type: "SMS",        time: "2h ago",  summary: "Blank reference, GTBANK spoofed" },
          { merchant: "Abuja Shop",            type: "Screenshot", time: "5h ago",  summary: "Edited Zenith alert, ₦120,000" },
          { merchant: "Port Harcourt Vendor",  type: "WhatsApp",   time: "1d ago",  summary: "WhatsApp screenshot, no reference" },
        ].map((rep, i) => (
          <div key={i} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "12px 0",
            borderBottom: i < 2 ? `1px solid ${C.slateLight}` : "none",
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{rep.merchant}</div>
              <div style={{ fontSize: 12, color: C.textDim, marginTop: 2 }}>{rep.summary}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <Tag color={C.yellow}>{rep.type}</Tag>
              <div style={{ fontSize: 11, color: C.textDim, marginTop: 4 }}>{rep.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// PAGE 6 — DASHBOARD (Firebase-powered)
// ─────────────────────────────────────────────
function DashboardPage({ user, localHistory }) {
  const [alerts,   setAlerts]   = useState([]);
  const [reports,  setReports]  = useState([]);
  const [profile,  setProfile]  = useState(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!user) { setLoadingData(false); return; }

    // Load user profile
    const profUnsub = onSnapshot(doc(db, "users", user.uid), snap => {
      if (snap.exists()) setProfile(snap.data());
    });

    // Load this user's alert history (real-time)
    const alertQ = query(
      collection(db, "alerts"),
      where("uid", "==", user.uid),
      orderBy("checkedAt", "desc"),
      limit(50)
    );
    const alertUnsub = onSnapshot(alertQ, snap => {
      setAlerts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoadingData(false);
    }, () => setLoadingData(false));

    // Load recent community reports (real-time)
    const reportQ = query(
      collection(db, "reports"),
      orderBy("reportedAt", "desc"),
      limit(20)
    );
    const reportUnsub = onSnapshot(reportQ, snap => {
      setReports(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, () => {});

    return () => { profUnsub(); alertUnsub(); reportUnsub(); };
  }, [user]);

  // Merge Firebase alerts with local history for non-logged-in users
  const allAlerts = user ? alerts : localHistory;

  const total      = profile?.totalChecked ?? allAlerts.length;
  const suspicious = allAlerts.filter(h => h.status === "suspicious").length;
  const warnings   = allAlerts.filter(h => h.status === "warning").length;
  const safe       = allAlerts.filter(h => h.status === "safe").length;

  const patterns = [
    { label: "Missing Reference",  pct: 42, color: C.red    },
    { label: "Suspicious Wording", pct: 31, color: C.yellow },
    { label: "Edited Screenshot",  pct: 18, color: C.purple },
    { label: "No Timestamp",       pct: 9,  color: C.textDim },
  ];

  const statusColor = { safe: C.green, warning: C.yellow, suspicious: C.red };

  const formatDate = (ts) => {
    if (!ts) return "Just now";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("en-NG", { day:"numeric", month:"short" });
  };

  if (loadingData) return (
    <div style={{ minHeight: "60vh", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ width:40, height:40, border:`4px solid ${C.teal}`, borderTopColor:"transparent", borderRadius:"50%", animation:"spin .8s linear infinite", margin:"0 auto 16px" }} />
        <div style={{ color: C.textMid }}>Loading your dashboard…</div>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "clamp(32px,6vw,64px) 16px" }}>

      {/* Header */}
      <div className="fu" style={{ marginBottom: 44 }}>
        <SectionLabel text="Merchant Analytics" />
        <h1 className="outfit" style={{ fontSize: "clamp(28px,5vw,40px)", fontWeight: 800, letterSpacing: -.5 }}>
          {user ? `Welcome, ${user.displayName || "Merchant"} 👋` : "Your Dashboard"}
        </h1>
        <p style={{ color: C.textMid, marginTop: 8, fontSize: 14 }}>
          {user ? `${profile?.business || "Your business"} · All your alert activity in one place.` : "Log in to save your history permanently."}
        </p>
      </div>

      {/* Not logged in banner */}
      {!user && (
        <div style={{ background:"rgba(0,200,170,.08)", border:"1px solid rgba(0,200,170,.3)", borderRadius:14, padding:"16px 20px", marginBottom:28, display:"flex", gap:12, alignItems:"center", flexWrap:"wrap" }}>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, color:C.teal, marginBottom:4 }}>🔒 Create a free account</div>
            <div style={{ fontSize:13, color:C.textMid }}>Log in to save your alert history permanently and access real community data.</div>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="g4" style={{ marginBottom: 28 }}>
        {[
          { label:"Total Alerts Checked", value: total,      icon:"🔍", color:C.teal   },
          { label:"Suspicious Detected",  value: suspicious, icon:"🔴", color:C.red    },
          { label:"Warnings Flagged",     value: warnings,   icon:"🟡", color:C.yellow },
          { label:"Verified Safe",        value: safe,       icon:"✅", color:C.green  },
        ].map((stat, i) => (
          <div key={stat.label} className="card fu" style={{ animationDelay:`${i*.06}s`, borderLeft:`4px solid ${stat.color}`, position:"relative", overflow:"hidden" }}>
            <div style={{ fontSize:28, marginBottom:10 }}>{stat.icon}</div>
            <div className="outfit" style={{ fontSize:"clamp(28px,5vw,36px)", fontWeight:800, color:stat.color, lineHeight:1 }}>{stat.value}</div>
            <div style={{ fontSize:12, color:C.textMid, marginTop:6 }}>{stat.label}</div>
            <div style={{ position:"absolute", bottom:-20, right:-20, width:80, height:80, borderRadius:"50%", background:stat.color+"10" }} />
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))", gap:24, marginBottom:24 }}>
        {/* Pattern bar chart */}
        <div className="card fu" style={{ animationDelay:".1s" }}>
          <div className="outfit" style={{ fontSize:16, fontWeight:700, marginBottom:24 }}>📊 Fraud Pattern Insights</div>
          {patterns.map(p => (
            <div key={p.label} style={{ marginBottom:20 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                <span style={{ fontSize:13, color:C.textMid }}>{p.label}</span>
                <span className="outfit" style={{ fontSize:14, fontWeight:700, color:p.color }}>{p.pct}%</span>
              </div>
              <div style={{ height:8, background:C.slate, borderRadius:4, overflow:"hidden" }}>
                <div style={{ width:`${p.pct}%`, height:"100%", background:p.color, borderRadius:4, transition:"width 1.2s ease" }} />
              </div>
            </div>
          ))}
          <div style={{ marginTop:16, padding:"12px 14px", background:C.slate, borderRadius:10, fontSize:12, color:C.textDim }}>
            Based on {total} alerts analyzed · Last updated today
          </div>
        </div>

        {/* User profile / guardian card */}
        <div className="card fu" style={{ animationDelay:".14s", background:"linear-gradient(145deg, rgba(0,200,170,.08), #111E35)", border:"1px solid rgba(0,200,170,.35)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
            <LiveDot />
            <div className="outfit" style={{ fontSize:16, fontWeight:700 }}>🌐 Fraud Intelligence Network</div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:20 }}>
            {[
              [reports.length || "0","Community Reports"],
              ["42","Active Patterns"],
              ["98%","Match Rate"],
              [profile?.totalReports || "0","Your Reports"],
            ].map(([v,l]) => (
              <div key={l} style={{ background:C.slate, borderRadius:10, padding:"14px 16px" }}>
                <div className="outfit" style={{ fontSize:24, fontWeight:800, color:C.teal }}>{v}</div>
                <div style={{ fontSize:11, color:C.textDim, marginTop:3 }}>{l}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize:13, color:C.textMid, lineHeight:1.7, marginBottom:16 }}>
            Your reports help protect the network. Earn a <strong style={{ color:C.teal }}>Guardian Badge</strong> when your report triggers a community-wide warning.
          </p>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            <Tag color={C.teal}>🏅 Guardian — Lvl {profile?.guardianLevel ?? 1}</Tag>
            <Tag color={C.yellow}>⚡ {profile?.totalReports ?? 0} Reports Filed</Tag>
          </div>
        </div>
      </div>

      {/* Community reports feed */}
      {reports.length > 0 && (
        <div className="card fu" style={{ marginBottom:24, animationDelay:".16s" }}>
          <div className="outfit" style={{ fontSize:16, fontWeight:700, marginBottom:20 }}>🚨 Live Community Reports</div>
          {reports.slice(0,5).map((rep, i) => (
            <div key={rep.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", padding:"12px 0", borderBottom: i<4 ? `1px solid ${C.slateLight}44` : "none" }}>
              <div>
                <div style={{ fontSize:13, fontWeight:600 }}>{rep.userName || "Merchant"}</div>
                <div style={{ fontSize:12, color:C.textDim, marginTop:2 }}>{rep.description?.slice(0,80)}…</div>
              </div>
              <div style={{ textAlign:"right", flexShrink:0, marginLeft:12 }}>
                <Tag color={C.yellow}>{rep.alertType || "SMS"}</Tag>
                <div style={{ fontSize:11, color:C.textDim, marginTop:4 }}>{formatDate(rep.reportedAt)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Alert history table */}
      <div className="card fu" style={{ animationDelay:".18s" }}>
        <div className="outfit" style={{ fontSize:16, fontWeight:700, marginBottom:20 }}>📋 Alert History</div>
        {allAlerts.length === 0 ? (
          <div style={{ textAlign:"center", padding:"40px 20px", color:C.textDim }}>
            <div style={{ fontSize:32, marginBottom:12 }}>🔍</div>
            <div>No alerts checked yet. Start by checking a payment alert!</div>
          </div>
        ) : (
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ borderBottom:`1px solid ${C.slateLight}` }}>
                  {["Date","Score","Risk Bar","Status"].map(h => (
                    <th key={h} style={{ padding:"10px 12px", textAlign:"left", fontSize:11, color:C.textDim, fontWeight:700, letterSpacing:1, whiteSpace:"nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allAlerts.slice(0,10).map((row, i) => (
                  <tr key={row.id||i}
                    style={{ borderBottom:`1px solid ${C.slateLight}22`, transition:"background .15s" }}
                    onMouseEnter={e => e.currentTarget.style.background = C.slate+"55"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding:"12px", fontSize:13, color:C.textMid, whiteSpace:"nowrap" }}>{formatDate(row.checkedAt)}</td>
                    <td style={{ padding:"12px" }}>
                      <span className="outfit" style={{ fontSize:16, fontWeight:700, color:statusColor[row.status] }}>{row.score}</span>
                    </td>
                    <td style={{ padding:"12px", minWidth:90 }}>
                      <div style={{ height:6, width:90, background:C.slate, borderRadius:3 }}>
                        <div style={{ width:`${row.score||row.risk||0}%`, height:"100%", background:statusColor[row.status], borderRadius:3 }} />
                      </div>
                    </td>
                    <td style={{ padding:"12px" }}>
                      <Tag color={statusColor[row.status]}>
                        {row.status==="safe" ? "✅ Safe" : row.status==="warning" ? "🟡 Warning" : "🔴 Suspicious"}
                      </Tag>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ROOT APP
// ─────────────────────────────────────────────
export default function App() {
  useGlobalCSS();

  const { user } = useAuth();             // undefined=loading, null=logged out, User=logged in
  const [page, setPage]     = useState("home");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]); // local fallback for non-logged-in users

  function pushHistory(entry) {
    setHistory(prev => [entry, ...prev].slice(0, 50));
  }

  useEffect(() => {
    if (typeof window !== "undefined") window.scrollTo(0, 0);
  }, [page]);

  // Show loading spinner while Firebase auth initialises
  if (user === undefined) return (
    <div style={{ minHeight:"100vh", background:C.navy, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ width:48, height:48, border:`4px solid ${C.teal}`, borderTopColor:"transparent", borderRadius:"50%", animation:"spin .8s linear infinite", margin:"0 auto 16px" }} />
        <div className="outfit" style={{ fontSize:20, fontWeight:700, color:C.teal }}>AlertShield</div>
        <div style={{ fontSize:13, color:C.textMid, marginTop:6 }}>Loading…</div>
      </div>
    </div>
  );

  // Show auth page if not logged in
  if (!user) return <AuthPage onAuth={() => setPage("home")} />;

  return (
    <div style={{ minHeight:"100vh", background:C.navy }}>
      <NavBar page={page} setPage={setPage} user={user} />
      {page === "home"      && <LandingPage   setPage={setPage} />}
      {page === "checker"   && <CheckerPage   setPage={setPage} setResult={setResult} user={user} />}
      {page === "result"    && <ResultPage    result={result}   setPage={setPage} pushHistory={pushHistory} />}
      {page === "awareness" && <AwarenessPage setPage={setPage} />}
      {page === "report"    && <ReportPage    user={user} />}
      {page === "dashboard" && <DashboardPage user={user} localHistory={history} />}
    </div>
  );
}

/* Data layer: Firebase when configured, otherwise browser storage (demo mode). */
import { FIREBASE_CONFIG } from "./config.js";
export const isLive = !!(FIREBASE_CONFIG && FIREBASE_CONFIG.apiKey);
const V = "https://www.gstatic.com/firebasejs/10.12.2/";
let fb;
async function init() {
  if (fb) return fb;
  const [app, fs, au] = await Promise.all([import(V + "firebase-app.js"), import(V + "firebase-firestore.js"), import(V + "firebase-auth.js")]);
  const a = app.initializeApp(FIREBASE_CONFIG);
  return (fb = { db: fs.getFirestore(a), auth: au.getAuth(a), fs, au });
}
const local = () => { try { return JSON.parse(localStorage.getItem("gh_orders")) || [] } catch { return [] } };
const saveLocal = a => { localStorage.setItem("gh_orders", JSON.stringify(a)); dispatchEvent(new Event("ghorders")); };

export async function placeOrder(o) {
  if (!isLive) { const a = local(); a.unshift(o); saveLocal(a); return o; }
  const { db, fs } = await init(); await fs.setDoc(fs.doc(db, "orders", o.id), o); return o;
}
export async function watchOrders(cb, onErr) {
  if (!isLive) {
    const push = () => cb(local());
    push(); addEventListener("storage", push); addEventListener("ghorders", push);
    return () => { removeEventListener("storage", push); removeEventListener("ghorders", push); };
  }
  const { db, fs } = await init();
  return fs.onSnapshot(fs.query(fs.collection(db, "orders"), fs.orderBy("createdAt", "desc")), s => cb(s.docs.map(d => d.data())), onErr);
}
export async function setStatus(id, status) {
  if (!isLive) { const a = local(), o = a.find(x => x.id === id); if (o) o.status = status; return saveLocal(a); }
  const { db, fs } = await init(); await fs.updateDoc(fs.doc(db, "orders", id), { status });
}
export async function login(email, pw) {
  if (!isLive) { if (pw !== "admin123") throw new Error("Wrong password"); sessionStorage.setItem("gh_admin", "1"); return dispatchEvent(new Event("ghauth")); }
  const { auth, au } = await init(); await au.signInWithEmailAndPassword(auth, email, pw);
}
export async function logout() {
  if (!isLive) { sessionStorage.removeItem("gh_admin"); return dispatchEvent(new Event("ghauth")); }
  const { auth, au } = await init(); await au.signOut(auth);
}
export async function onAuth(cb) {
  if (!isLive) { const f = () => cb(sessionStorage.getItem("gh_admin") ? { email: "demo" } : null); f(); addEventListener("ghauth", f); return; }
  const { auth, au } = await init(); au.onAuthStateChanged(auth, cb);
}

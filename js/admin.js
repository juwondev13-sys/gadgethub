import { watchOrders, setStatus, login, logout, onAuth, isLive } from "./store.js";
const $ = s => document.querySelector(s);
const money = n => "₦" + Number(n || 0).toLocaleString("en-NG");
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const when = t => new Date(t).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });
const STATUS = ["New", "Confirmed", "Out for delivery", "Delivered", "Cancelled"];
const cls = s => s.toLowerCase().replace(/ /g, "");
const intl = p => { const d = String(p).replace(/\D/g, ""); return d.startsWith("0") ? "234" + d.slice(1) : d; };
let orders = [], tab = "All", q = "", openId = null, unwatch = null, known = null, tt;

function toast(m) { const t = $("#toast"); t.textContent = m; t.classList.add("show"); clearTimeout(tt); tt = setTimeout(() => t.classList.remove("show"), 4000); }
const show = (id, on) => $(id).classList.toggle("hidden", !on);

/* ---- sign in ---- */
$("#demoHint").classList.toggle("hidden", isLive);
$("#demoBanner").classList.toggle("hidden", isLive);
$("#loginForm").addEventListener("submit", async e => {
  e.preventDefault(); $("#loginErr").textContent = "";
  try { await login($("#email").value, $("#pw").value); }
  catch { $("#loginErr").textContent = "Wrong email or password. Try again."; }
});
$("#out").onclick = logout;
onAuth(user => {
  show("#login", !user); show("#dash", !!user);
  if (user && !unwatch) {
    watchOrders(list => {
      if (known) list.filter(o => !known.has(o.id) && o.status === "New").forEach(o => toast(`New order ${o.id} from ${o.name} — ${money(o.total)}`));
      known = new Set(list.map(o => o.id)); orders = list;
      const n = list.filter(o => o.status === "New").length; document.title = (n ? `(${n}) ` : "") + "GadgetHub Admin";
      render();
    }, () => toast("Can't load orders. Check your Firebase rules and that you signed in with the admin email.")).then(u => unwatch = u);
  }
  if (!user && unwatch) { unwatch(); unwatch = null; known = null; orders = []; closeDetail(); }
});

/* ---- list ---- */
function render() {
  const c = s => orders.filter(o => o.status === s).length;
  const revenue = orders.filter(o => o.status !== "Cancelled").reduce((s, o) => s + o.total, 0);
  $("#stats").innerHTML = [["New orders", c("New")], ["Out for delivery", c("Out for delivery")], ["Delivered", c("Delivered")], ["Sales (excl. cancelled)", money(revenue)]]
    .map(([l, v]) => `<div class="stat"><small>${l}</small><b>${v}</b></div>`).join("");
  $("#tabs").innerHTML = ["All", ...STATUS].map(s => `<button class="filter ${s === tab ? "active" : ""}" data-tab="${s}">${s} (${s === "All" ? orders.length : c(s)})</button>`).join("");
  const term = q.toLowerCase();
  const list = orders.filter(o => (tab === "All" || o.status === tab) && (!term || [o.id, o.name, o.phone].some(v => String(v).toLowerCase().includes(term))));
  $("#rows").innerHTML = list.map(o => `<tr data-id="${esc(o.id)}"><td><b>${esc(o.id)}</b></td><td>${esc(o.name)}<small>${esc(o.phone)}</small></td>
    <td>${o.items.reduce((s, i) => s + i.qty, 0)}</td><td>${money(o.total)}</td><td>${when(o.createdAt)}</td><td><span class="pill ${cls(o.status)}">${esc(o.status)}</span></td></tr>`).join("")
    || `<tr><td colspan="6" class="none">${orders.length ? "No orders match." : "No orders yet. New orders appear here the moment a customer places them."}</td></tr>`;
  if (openId) renderDetail();
}
$("#tabs").addEventListener("click", e => { const b = e.target.closest("[data-tab]"); if (b) { tab = b.dataset.tab; render(); } });
$("#q").addEventListener("input", e => { q = e.target.value.trim(); render(); });
$("#rows").addEventListener("click", e => { const r = e.target.closest("tr[data-id]"); if (r) { openId = r.dataset.id; renderDetail(); $("#detail").classList.add("open"); $("#ov").classList.add("open"); } });

/* ---- order detail ---- */
function renderDetail() {
  const o = orders.find(x => x.id === openId); if (!o) return closeDetail();
  $("#detail").innerHTML = `<div class="drawerhead"><h2>${esc(o.id)}</h2><button class="close" data-x aria-label="Close">×</button></div>
  <div class="cartitems">
    <p class="meta">${when(o.createdAt)} · <span class="pill ${cls(o.status)}">${esc(o.status)}</span></p>
    <div class="box"><b>${esc(o.name)}</b><br>${esc(o.phone)}<br>${esc(o.address)}, ${esc(o.area)}${o.note ? `<br><i>Note: ${esc(o.note)}</i>` : ""}
      <div class="acts"><a class="ghost" href="tel:${esc(o.phone)}">Call</a><a class="ghost" target="_blank" rel="noopener" href="https://wa.me/${intl(o.phone)}">WhatsApp</a></div></div>
    ${o.items.map(i => `<div class="line"><span>${i.qty} × ${esc(i.name)}${i.opt ? ` <small>${esc(i.opt)}</small>` : ""}</span><b>${money(i.unit * i.qty)}</b></div>`).join("")}
    <div class="line total"><span>Total (${esc(o.payment)})</span><b>${money(o.total)}</b></div>
    <p class="meta">Delivery fee is not included. Confirm it with the customer when you call.</p>
  </div>
  <div class="cartfoot"><label class="lbl">Update status</label><div class="stbtns">${STATUS.map(s => `<button class="filter ${s === o.status ? "active" : ""}" data-st="${s}">${s}</button>`).join("")}</div></div>`;
}
function closeDetail() { openId = null; $("#detail").classList.remove("open"); $("#ov").classList.remove("open"); }
$("#detail").addEventListener("click", async e => {
  if (e.target.closest("[data-x]")) return closeDetail();
  const b = e.target.closest("[data-st]"); if (!b) return;
  try { await setStatus(openId, b.dataset.st); toast(`${openId} marked ${b.dataset.st}`); } catch { toast("Couldn't update the status. Try again."); }
});
$("#ov").onclick = closeDetail;
addEventListener("keydown", e => { if (e.key === "Escape") closeDetail(); });

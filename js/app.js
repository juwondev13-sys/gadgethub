import { placeOrder } from "./store.js";
/* ===== SETTINGS — edit these ===== */
const WHATSAPP = "2348101893379";   // used by "Talk to our team" — country code first, no + or spaces
const FREE_DELIVERY = 250000;       // free delivery threshold (₦)

/* ===== PRODUCTS — add, remove or edit items here =====
   img: image URL or local file e.g. "images/iphone.jpg" (leave "" to show the emoji)
   opts: optional storage choices; "add" is extra price on top of base price */
const S3 = [{l:"128GB",add:0},{l:"256GB",add:150000},{l:"512GB",add:350000}];
const products = [
 {id:1,name:"iPhone 15 Pro",category:"Phones",price:1850000,tag:"Bestseller",stars:5,emoji:"📱",opts:S3,
  desc:"Titanium design, A17 Pro chip and a 48MP camera system that handles low light with ease.",
  img:"https://images.unsplash.com/photo-1696442786874-2f3cbf7f3b5b?w=600&q=85"},
 {id:2,name:"Samsung Galaxy S24 Ultra",category:"Phones",price:2100000,tag:"Popular",stars:5,emoji:"📱",opts:S3,
  desc:"Big 6.8-inch display, built-in S Pen and a 200MP camera for sharp shots at any distance.",
  img:"https://images.unsplash.com/photo-1707580620875-4a2f8b3e7f2d?w=600&q=85"},
 {id:3,name:"Google Pixel 8 Pro",category:"Phones",price:1250000,tag:"New",stars:4,emoji:"📱",opts:S3,
  desc:"Clean Android, seven years of updates and one of the best phone cameras for everyday photos.",img:""},
 {id:4,name:"Tecno Phantom V Fold",category:"Phones",price:1400000,tag:"Value",stars:4,emoji:"📱",opts:S3.slice(1),
  desc:"A foldable that opens into a 7.85-inch screen at a much lower price than the big brands.",img:""},
 {id:5,name:"iPad Air",category:"Tablets",price:1150000,tag:"Popular",stars:5,emoji:"📲",
  desc:"Light, fast and great for notes, drawing and streaming. Works with Apple Pencil.",
  img:"https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&q=85"},
 {id:6,name:"Sony WH-1000XM5",category:"Audio",price:620000,tag:"Top rated",stars:5,emoji:"🎧",
  desc:"Industry-leading noise cancelling with around 30 hours of battery life.",
  img:"https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=600&q=85"},
 {id:7,name:"AirPods Pro 2",category:"Audio",price:310000,tag:"Hot",stars:5,emoji:"🎧",
  desc:"Active noise cancellation, Adaptive Transparency and a USB-C charging case.",img:""},
 {id:8,name:"JBL Flip 6 Speaker",category:"Audio",price:185000,tag:"Great sound",stars:4,emoji:"🔊",
  desc:"Waterproof, portable and loud enough for the whole room. Up to 12 hours of play.",
  img:"https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&q=85"},
 {id:9,name:"Apple Watch Series 9",category:"Accessories",price:590000,tag:"New",stars:4,emoji:"⌚",
  desc:"Brighter display, double-tap gesture and health tracking that works with your iPhone.",
  img:"https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=600&q=85"},
 {id:10,name:"Anker 20,000mAh Power Bank",category:"Accessories",price:65000,tag:"Essential",stars:5,emoji:"🔋",
  desc:"Fast-charges a phone several times over. Handy for long days and NEPA surprises.",img:""},
 {id:11,name:"65W Fast Charger",category:"Accessories",price:28000,tag:"Essential",stars:4,emoji:"🔌",
  desc:"One compact charger for your phone, tablet and laptop. USB-C.",img:""},
 {id:12,name:"Tempered Glass + Case Bundle",category:"Accessories",price:15000,tag:"Bundle",stars:4,emoji:"🛡️",
  desc:"Screen protector and a shock-proof case. Tell us your phone model when you order.",img:""}
];

/* ===== STATE ===== */
const $ = s => document.querySelector(s);
const money = n => "₦" + n.toLocaleString("en-NG");
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d } catch { return d } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} };
let cart = load("gh_cart", {});          // key "id|optionIndex" -> quantity
let wish = new Set(load("gh_wish", []));
let filter = "All", sort = "featured", modalId = null, modalOpt = 0;

const unit = (p, o) => p.price + (p.opts ? p.opts[o].add : 0);
const stars = n => "★".repeat(n) + "☆".repeat(5 - n);
function pic(p) {
  return p.img
    ? `<img src="${p.img}" alt="${p.name}" loading="lazy" onerror="this.outerHTML='<span class=ph>${p.emoji}</span>'">`
    : `<span class="ph">${p.emoji}</span>`;
}

/* ===== PRODUCTS GRID ===== */
function renderProducts() {
  const q = $("#search").value.trim().toLowerCase();
  let list = products.filter(p =>
    (filter === "All" || (filter === "Saved" ? wish.has(p.id) : p.category === filter)) &&
    (p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)));
  if (sort === "low") list.sort((a, b) => a.price - b.price);
  if (sort === "high") list.sort((a, b) => b.price - a.price);
  $("#resultCount").textContent = `${list.length} product${list.length === 1 ? "" : "s"} found`;
  $("#products").innerHTML = list.map(p => `
    <article class="product">
      <button class="productimg" data-view="${p.id}" aria-label="View ${p.name}">
        <span class="tag">${p.tag}</span>${pic(p)}
      </button>
      <button class="heart ${wish.has(p.id) ? "on" : ""}" data-wish="${p.id}" aria-label="Save ${p.name}">♥</button>
      <div class="productinfo">
        <small>${p.category}</small><h3>${p.name}</h3>
        <div class="rating">${stars(p.stars)}</div>
        <div class="price-row">
          <span class="price">${p.opts ? "From " : ""}${money(p.price)}</span>
          <button class="add" data-add="${p.id}" aria-label="Add ${p.name} to bag">+</button>
        </div>
      </div>
    </article>`).join("") ||
    `<p class="nomatch">${filter === "Saved" ? "Tap the heart on any product to save it here." : "No products match your search. Try a different word."}</p>`;
}

/* ===== BAG ===== */
function addToCart(id, opt = 0) {
  const k = id + "|" + opt;
  cart[k] = (cart[k] || 0) + 1;
  save("gh_cart", cart); updateCart();
  const c = $("#cartCount"); c.classList.remove("bump"); void c.offsetWidth; c.classList.add("bump");
  toast("Added to your bag");
}
function changeQty(k, n) {
  cart[k] += n; if (cart[k] <= 0) delete cart[k];
  save("gh_cart", cart); updateCart();
}
function cartTotal() {
  return Object.entries(cart).reduce((s, [k, q]) => {
    const [id, o] = k.split("|"); return s + unit(products.find(p => p.id == id), +o) * q;
  }, 0);
}
function updateCart() {
  const entries = Object.entries(cart), total = cartTotal();
  $("#cartCount").textContent = entries.reduce((s, [, q]) => s + q, 0);
  $("#cartItems").innerHTML = entries.length ? entries.map(([k, q]) => {
    const [id, o] = k.split("|"), p = products.find(x => x.id == id);
    return `<div class="cartitem"><div class="cartthumb">${pic(p)}</div>
      <div style="flex:1"><strong>${p.name}</strong>
      <small>${p.opts ? p.opts[o].l + " · " : ""}${money(unit(p, +o))}</small>
      <div class="qty"><button data-qty="${k}" data-n="-1" aria-label="Decrease">−</button>${q}<button data-qty="${k}" data-n="1" aria-label="Increase">+</button></div></div>
      <strong>${money(unit(p, +o) * q)}</strong></div>`;
  }).join("") : '<div class="empty">Your bag is waiting for something good.</div>';
  $("#subtotal").textContent = money(total);
  const left = FREE_DELIVERY - total;
  $("#shipText").textContent = !entries.length ? `Free delivery in Lagos on orders over ${money(FREE_DELIVERY)}`
    : left > 0 ? `Add ${money(left)} more for free Lagos delivery` : "You've unlocked free Lagos delivery 🎉";
  $("#shipBar").style.width = Math.min(100, total / FREE_DELIVERY * 100) + "%";
}
function checkout() {
  const entries = Object.entries(cart);
  if (!entries.length) return toast("Add a product to your bag first.");
  const n = entries.reduce((s, [, q]) => s + q, 0), total = cartTotal();
  const m = $("#modal"); m.classList.add("single");
  m.innerHTML = `<div class="mbody"><button class="close" data-close aria-label="Close">×</button>
    <h3>Checkout</h3><p>${n} item${n > 1 ? "s" : ""} · ${money(total)}. Pay on delivery or by bank transfer.</p>
    <form id="orderForm">
      <label>Full name<input name="name" required autocomplete="name"></label>
      <label>Phone number<input name="phone" type="tel" required pattern="[0-9+ ]{10,16}" placeholder="0801 234 5678" autocomplete="tel"></label>
      <label>Delivery address<textarea name="address" rows="2" required autocomplete="street-address"></textarea></label>
      <label>Area<select name="area"><option>Lekki / Ajah</option><option>Victoria Island / Ikoyi</option><option>Ikeja</option><option>Yaba / Surulere</option><option>Other Lagos mainland</option><option>Other Lagos island</option></select></label>
      <label>Payment<select name="payment"><option>Pay on delivery</option><option>Bank transfer</option></select></label>
      <label>Note for us (optional)<input name="note"></label>
      <button class="primary" id="placeBtn">PLACE ORDER · ${money(total)}</button>
    </form></div>`;
  $("#drawer").classList.remove("open");
  m.classList.add("open"); $("#overlay").classList.add("open");
}
$("#modal").addEventListener("submit", async e => {
  e.preventDefault();
  const f = Object.fromEntries(new FormData(e.target)), btn = $("#placeBtn");
  btn.disabled = true; btn.textContent = "PLACING ORDER…";
  const order = {
    id: "GH-" + Math.floor(100000 + Math.random() * 900000), createdAt: Date.now(), status: "New",
    ...f, total: cartTotal(),
    items: Object.entries(cart).map(([k, q]) => {
      const [id, o] = k.split("|"), p = products.find(x => x.id == id);
      return { name: p.name, opt: p.opts ? p.opts[o].l : "", qty: q, unit: unit(p, +o) };
    })
  };
  try {
    await placeOrder(order);
    cart = {}; save("gh_cart", cart); updateCart();
    $("#modal").innerHTML = `<div class="mbody done"><span class="ph">✅</span><h3>Order placed</h3>
      <div class="code">${order.id}</div>
      <p>Thank you, ${order.name.split(" ")[0]}. We'll call ${order.phone} shortly to confirm your order and delivery fee.</p>
      <button class="primary" data-close>CONTINUE SHOPPING</button></div>`;
  } catch (err) {
    console.error(err); btn.disabled = false; btn.textContent = "TRY AGAIN";
    toast("Couldn't place your order. Check your connection and try again.");
  }
});

/* ===== QUICK VIEW ===== */
function openModal(id) {
  $("#modal").classList.remove("single");
  const p = products.find(x => x.id === id); modalId = id; modalOpt = 0;
  $("#modal").innerHTML = `
    <div class="mimg">${pic(p)}</div>
    <div class="mbody">
      <button class="close" data-close aria-label="Close">×</button>
      <div class="eyebrow dark">${p.category}</div><h3>${p.name}</h3>
      <div class="rating">${stars(p.stars)}</div><p>${p.desc}</p>
      ${p.opts ? `<div class="opts">${p.opts.map((o, i) => `<button class="opt ${i ? "" : "active"}" data-opt="${i}">${o.l}</button>`).join("")}</div>` : ""}
      <div class="mprice" id="mprice">${money(unit(p, 0))}</div>
      <button class="primary" data-madd>ADD TO BAG ↗</button>
    </div>`;
  $("#modal").classList.add("open"); $("#overlay").classList.add("open");
}
function closeAll() {
  ["#modal", "#drawer", "#overlay"].forEach(s => $(s).classList.remove("open"));
  $("#navlinks").classList.remove("open");
}
function openCart() { closeAll(); $("#drawer").classList.add("open"); $("#overlay").classList.add("open"); }

let tt;
function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(tt); tt = setTimeout(() => t.classList.remove("show"), 2200);
}
function setFilter(f) {
  filter = f;
  document.querySelectorAll(".filter").forEach(x => x.classList.toggle("active", x.dataset.filter === f));
  renderProducts();
}

/* ===== EVENTS ===== */
$("#search").addEventListener("input", renderProducts);
$("#sort").addEventListener("change", e => { sort = e.target.value; renderProducts(); });
document.querySelectorAll(".filter").forEach(b => b.addEventListener("click", () => setFilter(b.dataset.filter)));
document.querySelectorAll("[data-jump]").forEach(a => a.addEventListener("click", () => setFilter(a.dataset.jump)));
$("#exploreBtn").onclick = () => $("#shop").scrollIntoView();
$("#talkBtn").onclick = () => window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent("Hello GadgetHub, I need help choosing a phone.")}`, "_blank");
$("#cartOpen").onclick = openCart; $("#cartClose").onclick = closeAll; $("#overlay").onclick = closeAll;
$("#menuBtn").onclick = () => $("#navlinks").classList.toggle("open");
$("#navlinks").onclick = () => $("#navlinks").classList.remove("open");
$("#checkout").onclick = checkout;
document.addEventListener("keydown", e => { if (e.key === "Escape") closeAll(); });

$("#products").addEventListener("click", e => {
  const t = e.target.closest("button"); if (!t) return;
  if (t.dataset.add) { const p = products.find(x => x.id == t.dataset.add); p.opts ? openModal(p.id) : addToCart(p.id); }
  if (t.dataset.view) openModal(+t.dataset.view);
  if (t.dataset.wish) {
    const id = +t.dataset.wish; wish.has(id) ? wish.delete(id) : wish.add(id);
    save("gh_wish", [...wish]); toast(wish.has(id) ? "Saved" : "Removed from saved"); renderProducts();
  }
});
$("#cartItems").addEventListener("click", e => {
  const t = e.target.closest("[data-qty]"); if (t) changeQty(t.dataset.qty, +t.dataset.n);
});
$("#modal").addEventListener("click", e => {
  const t = e.target.closest("button"); if (!t) return;
  const p = products.find(x => x.id === modalId);
  if (t.hasAttribute("data-close")) closeAll();
  if (t.dataset.opt) {
    modalOpt = +t.dataset.opt;
    document.querySelectorAll(".opt").forEach((b, i) => b.classList.toggle("active", i === modalOpt));
    $("#mprice").textContent = money(unit(p, modalOpt));
  }
  if (t.hasAttribute("data-madd")) { addToCart(modalId, modalOpt); closeAll(); }
});

renderProducts(); updateCart();

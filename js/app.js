// Blizedd — App Logic

const fmt = (n) => `KES ${Number(n).toLocaleString('en-KE')}`;

// SVG icon helper — references inline <symbol> defs
const icon = (id, size = 20) =>
  `<svg width="${size}" height="${size}" aria-hidden="true"><use href="#${id}"/></svg>`;

// ---- State ----
let cart = {};
let cardQty = {};

CONFIG.SECTIONS.forEach(s => s.products.forEach(p => {
  if (p.hasQty) cardQty[p.id] = 1;
}));

const allProducts = () => CONFIG.SECTIONS.flatMap(s => s.products);
const findProduct  = (id) => allProducts().find(p => p.id === id);
const cartItems    = () => Object.values(cart);
const cartTotal    = () => cartItems().reduce((s, { product, cartQty }) => s + product.price * cartQty, 0);
const cartCount    = () => cartItems().reduce((s, { cartQty }) => s + cartQty, 0);

// ---- Toast ----
function toast(msg, duration = 2400) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), duration);
}

// ---- Cart rendering ----
function renderCart() {
  const items = cartItems();
  const count = cartCount();
  const total = cartTotal();

  const badge = document.getElementById('header-badge');
  if (badge) { badge.textContent = count; badge.style.display = count > 0 ? 'inline-flex' : 'none'; }

  const cc = document.getElementById('cart-count');
  if (cc) cc.textContent = count > 0 ? `${count} item${count !== 1 ? 's' : ''}` : '';

  const totEl = document.getElementById('cart-total');
  if (totEl) totEl.textContent = fmt(total);

  const btn = document.getElementById('submit-order-btn');
  if (btn) btn.disabled = items.length === 0;

  const listEl = document.getElementById('cart-items');
  if (!listEl) return;

  if (items.length === 0) {
    listEl.innerHTML = '<p class="cart-empty">Your cart is empty.</p>';
    return;
  }

  listEl.innerHTML = items.map(({ product, cartQty }) => `
    <div class="cart-row">
      <div class="cart-row-info">
        <span class="cart-row-name">${product.name}</span>
        <span class="cart-row-tag">${product.tag}</span>
      </div>
      <div class="cart-row-right">
        <span class="cart-row-qty">x${cartQty}</span>
        <span class="cart-row-price">${fmt(product.price * cartQty)}</span>
        <button class="cart-row-rm" data-id="${product.id}" aria-label="Remove">
          ${icon('icon-x', 14)}
        </button>
      </div>
    </div>
  `).join('');

  listEl.querySelectorAll('.cart-row-rm').forEach(b =>
    b.addEventListener('click', () => { delete cart[b.dataset.id]; renderCart(); })
  );
}

function addToCart(productId) {
  const product = findProduct(productId);
  if (!product) return;
  const qty = product.hasQty ? (cardQty[productId] || 1) : 1;
  if (cart[productId]) cart[productId].cartQty += qty;
  else cart[productId] = { product, cartQty: qty };
  renderCart();
  toast(`${product.name} — ${product.tag} added to cart`);

  const btn = document.querySelector(`[data-add="${productId}"]`);
  if (btn) {
    btn.innerHTML = `${icon('icon-check', 14)} Added`;
    btn.dataset.state = 'added';
    setTimeout(() => {
      btn.innerHTML = `${icon('icon-cart', 14)} Add to Cart`;
      delete btn.dataset.state;
    }, 1400);
  }
}

// ---- Product sections ----
function renderProducts() {
  const container = document.getElementById('sections-container');
  container.innerHTML = CONFIG.SECTIONS.map(section => `
    <section class="product-section" data-section="${section.id}">
      <div class="section-header">
        <div class="section-title-wrap">
          <span class="section-icon">${icon(section.iconId, 28)}</span>
          <h2 class="section-title">${section.label}</h2>
        </div>
        <p class="section-desc">${section.description}</p>
      </div>
      <div class="product-grid">
        ${section.products.map(p => renderCard(p)).join('')}
      </div>
    </section>
  `).join('');

  container.querySelectorAll('[data-dec]').forEach(btn => btn.addEventListener('click', () => {
    const id = btn.dataset.dec;
    if (cardQty[id] > 1) { cardQty[id]--; document.getElementById(`qv-${id}`).textContent = cardQty[id]; }
  }));
  container.querySelectorAll('[data-inc]').forEach(btn => btn.addEventListener('click', () => {
    const id = btn.dataset.inc;
    if (cardQty[id] < 20) { cardQty[id]++; document.getElementById(`qv-${id}`).textContent = cardQty[id]; }
  }));
  container.querySelectorAll('[data-add]').forEach(btn =>
    btn.addEventListener('click', () => addToCart(btn.dataset.add))
  );
}

function renderCard(p) {
  const qtyControl = p.hasQty ? `
    <div class="qty-row">
      <button class="qty-btn" data-dec="${p.id}" aria-label="Decrease">${icon('icon-minus', 14)}</button>
      <span class="qty-val" id="qv-${p.id}">${cardQty[p.id] || 1}</span>
      <button class="qty-btn" data-inc="${p.id}" aria-label="Increase">${icon('icon-plus', 14)}</button>
    </div>
  ` : '';

  return `
    <article class="product-card" role="listitem" data-product="${p.id}">
      <div class="card-badge">${p.tag}</div>
      <div class="card-price-row">
        <span class="card-price">${fmt(p.price)}</span>
      </div>
      ${qtyControl}
      <button class="add-btn" data-add="${p.id}">
        ${icon('icon-cart', 14)} Add to Cart
      </button>
    </article>
  `;
}

// ---- Validation ----
const PHONE_RE = /^(\+254|0)[17]\d{8}$/;

function validateField(inputId, errId, check, msg) {
  const input = document.getElementById(inputId);
  const err   = document.getElementById(errId);
  if (!check(input.value)) {
    input.classList.add('is-error');
    if (err) err.textContent = msg;
    return false;
  }
  input.classList.remove('is-error');
  if (err) err.textContent = '';
  return true;
}

// ---- Checkout ----
function openCheckout() {
  if (cartCount() === 0) { toast('Add items first!'); return; }
  openModal('modal-checkout');
}

async function submitOrder() {
  const nameOk     = validateField('co-name',     'err-co-name',     v => v.trim().length >= 2, 'Enter your full name');
  const phoneOk    = validateField('co-phone',    'err-co-phone',    v => PHONE_RE.test(v.trim()), 'Format: 0712345678');
  const locationOk = validateField('co-location', 'err-co-location', v => v.trim().length >= 2, 'Enter delivery location');
  if (!nameOk || !phoneOk || !locationOk) return;

  const btn = document.getElementById('submit-order-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Placing order...';

  const payload = {
    name:           document.getElementById('co-name').value.trim(),
    phone:          document.getElementById('co-phone').value.trim(),
    location:       document.getElementById('co-location').value.trim(),
    notes:          document.getElementById('co-notes').value.trim() || null,
    custom_request: document.getElementById('co-custom').value.trim() || null,
    items: cartItems().map(({ product, cartQty }) => ({
      name: product.name, qty: product.qty, cartQty,
    })),
  };

  try {
    const res  = await fetch(`${CONFIG.API_BASE}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Something went wrong');
    showOrderSuccess(data.order_id, data.total);
    cart = {};
    renderCart();
  } catch (err) {
    toast(err.message, 4000);
    btn.disabled = false;
    btn.textContent = 'Place Order';
  }
}

function showOrderSuccess(orderId, total) {
  document.getElementById('modal-checkout-body').innerHTML = `
    <div class="success-wrap">
      <div class="success-tick">${icon('icon-check', 32)}</div>
      <h3 class="success-title">ORDER PLACED!</h3>
      <p class="success-sub">Now send your M-PESA payment to confirm your delivery.</p>

      <div class="mpesa-card">
        <div class="mpesa-logo-row">
          <div class="mpesa-logo">
            ${icon('icon-phone', 18)}
            M-PESA
          </div>
          <span class="mpesa-tag">SEND MONEY</span>
        </div>
        <div class="mpesa-instructions">Pay to this number:</div>
        <div class="mpesa-number">${CONFIG.MPESA_NUMBER}</div>
        <div class="mpesa-amount">${fmt(total)}</div>
        <p class="mpesa-note">
          ${icon('icon-send', 13)}
          The seller receives your M-PESA confirmation and a Telegram notification — delivery will be arranged immediately.
        </p>
      </div>

      <div class="ref-block">
        <span class="ref-label">ORDER REFERENCE</span>
        <code class="order-ref">${orderId}</code>
      </div>

      <button class="btn-primary" onclick="closeModal('modal-checkout')">
        ${icon('icon-check', 16)} Done — I've Paid
      </button>
    </div>
  `;
}

// ---- Specified order ----
async function submitSpecified() {
  const nameOk     = validateField('sp-name',     'err-sp-name',     v => v.trim().length >= 2, 'Enter your name');
  const phoneOk    = validateField('sp-phone',    'err-sp-phone',    v => PHONE_RE.test(v.trim()), 'Format: 0712345678');
  const locationOk = validateField('sp-location', 'err-sp-location', v => v.trim().length >= 2, 'Enter delivery location');
  const reqOk      = validateField('sp-request',  'err-sp-request',  v => v.trim().length >= 5, 'Describe your request');
  if (!nameOk || !phoneOk || !locationOk || !reqOk) return;

  const btn = document.getElementById('submit-spec-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Sending...';

  const payload = {
    name:           document.getElementById('sp-name').value.trim(),
    phone:          document.getElementById('sp-phone').value.trim(),
    location:       document.getElementById('sp-location').value.trim(),
    custom_request: document.getElementById('sp-request').value.trim(),
    notes: null, items: [],
  };

  try {
    const res  = await fetch(`${CONFIG.API_BASE}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed');

    document.getElementById('modal-specified-body').innerHTML = `
      <div class="success-wrap">
        <div class="success-tick">${icon('icon-check', 32)}</div>
        <h3 class="success-title">REQUEST SENT!</h3>
        <p class="success-sub">We got your order and will hit you up shortly.</p>
        <code class="order-ref">${data.order_id}</code>
        <button class="btn-primary" style="margin-top:1.5rem;" onclick="closeModal('modal-specified')">
          ${icon('icon-check', 16)} Close
        </button>
      </div>
    `;
  } catch (err) {
    toast(err.message, 4000);
    btn.disabled = false;
    btn.textContent = 'Send Request';
  }
}

// ---- Modal helpers ----
function openModal(id)  { document.getElementById(id).classList.add('open');    document.body.style.overflow = 'hidden'; }
function closeModal(id) { document.getElementById(id).classList.remove('open'); document.body.style.overflow = ''; }

document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) closeModal(e.target.id);
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape')
    document.querySelectorAll('.modal-overlay.open').forEach(m => closeModal(m.id));
});

// ---- Init ----
document.addEventListener('DOMContentLoaded', () => {
  renderProducts();
  renderCart();

  document.getElementById('open-checkout-header')?.addEventListener('click', openCheckout);
  document.getElementById('float-cart-btn')?.addEventListener('click', openCheckout);
  document.getElementById('clear-cart-btn')?.addEventListener('click', () => { cart = {}; renderCart(); toast('Cart cleared'); });
  document.getElementById('submit-order-btn')?.addEventListener('click', submitOrder);
  document.getElementById('open-specified-btn')?.addEventListener('click', () => openModal('modal-specified'));
  document.getElementById('submit-spec-btn')?.addEventListener('click', submitSpecified);
});

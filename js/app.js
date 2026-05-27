
// Blizedd Frontend — App Logic

const fmt = (n) => `KES ${Number(n).toLocaleString('en-KE')}`;

// ---- State ----
let cart = {};        // { productId: { product, cartQty } }
let cardQty = {};     // { productId: number } — qty selector per card
CONFIG.PRODUCTS.forEach(p => { cardQty[p.id] = 1; });

// ---- Cart helpers ----
const cartItems = () => Object.values(cart);
const cartTotal = () => cartItems().reduce((s, { product, cartQty }) => s + product.price * cartQty, 0);
const cartCount = () => cartItems().reduce((s, { cartQty }) => s + cartQty, 0);

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

  // Header badge
  const badge = document.getElementById('header-badge');
  badge.textContent = count;
  badge.style.display = count > 0 ? 'inline-flex' : 'none';

  // Sidebar count
  document.getElementById('cart-count').textContent =
    count > 0 ? `${count} item${count !== 1 ? 's' : ''}` : '';

  // Total
  document.getElementById('cart-total').textContent = fmt(total);

  // Checkout button
  document.getElementById('checkout-btn').disabled = items.length === 0;

  // Items list
  const listEl = document.getElementById('cart-items');
  if (items.length === 0) {
    listEl.innerHTML = '<p class="cart-empty">Nothing here yet.</p>';
    return;
  }

  listEl.innerHTML = items.map(({ product, cartQty }) => `
    <div class="cart-row">
      <span class="cart-row-name">${product.name} ×${product.qty}</span>
      <span class="cart-row-qty">× ${cartQty}</span>
      <span class="cart-row-price">${fmt(product.price * cartQty)}</span>
      <button class="cart-row-rm" data-id="${product.id}" aria-label="Remove">✕</button>
    </div>
  `).join('');

  listEl.querySelectorAll('.cart-row-rm').forEach(btn =>
    btn.addEventListener('click', () => { delete cart[btn.dataset.id]; renderCart(); })
  );
}

function addToCart(productId) {
  const product = CONFIG.PRODUCTS.find(p => p.id === productId);
  if (!product) return;
  const qty = cardQty[productId] || 1;
  if (cart[productId]) {
    cart[productId].cartQty += qty;
  } else {
    cart[productId] = { product, cartQty: qty };
  }
  renderCart();
  toast(`+ ${product.name} ×${product.qty} added`);

  const btn = document.querySelector(`[data-add="${productId}"]`);
  if (btn) {
    btn.textContent = 'Added ✓';
    btn.dataset.state = 'added';
    setTimeout(() => { btn.textContent = 'Add to cart'; delete btn.dataset.state; }, 1300);
  }
}

// ---- Product grid ----
function renderProducts() {
  const grid = document.getElementById('product-grid');
  grid.innerHTML = CONFIG.PRODUCTS.map(p => `
    <article class="product-card" role="listitem">
      <div class="product-top">
        <span class="product-tag">${p.tag}</span>
        <h3 class="product-name">${p.name}</h3>
        <p class="product-qty-label">Qty: ${p.qty}</p>
      </div>
      <div class="product-bottom">
        <span class="product-price">${fmt(p.price)}</span>
        <div class="qty-row">
          <button class="qty-btn" data-dec="${p.id}" aria-label="Decrease">−</button>
          <span class="qty-val" id="qv-${p.id}">1</span>
          <button class="qty-btn" data-inc="${p.id}" aria-label="Increase">+</button>
        </div>
        <button class="add-btn" data-add="${p.id}">Add to cart</button>
      </div>
    </article>
  `).join('');

  grid.querySelectorAll('[data-dec]').forEach(btn => btn.addEventListener('click', () => {
    if (cardQty[btn.dataset.dec] > 1) {
      cardQty[btn.dataset.dec]--;
      document.getElementById(`qv-${btn.dataset.dec}`).textContent = cardQty[btn.dataset.dec];
    }
  }));
  grid.querySelectorAll('[data-inc]').forEach(btn => btn.addEventListener('click', () => {
    if (cardQty[btn.dataset.inc] < 20) {
      cardQty[btn.dataset.inc]++;
      document.getElementById(`qv-${btn.dataset.inc}`).textContent = cardQty[btn.dataset.inc];
    }
  }));
  grid.querySelectorAll('[data-add]').forEach(btn => btn.addEventListener('click', () => addToCart(btn.dataset.add)));
}

// ---- Validation ----
const PHONE_RE = /^(\+254|0)[17]\d{8}$/;

function validateField(inputId, errId, check, msg) {
  const input = document.getElementById(inputId);
  const err = document.getElementById(errId);
  if (!check(input.value)) {
    input.classList.add('is-error');
    err.textContent = msg;
    return false;
  }
  input.classList.remove('is-error');
  err.textContent = '';
  return true;
}

function clearErrors(...ids) {
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.classList.remove('is-error'); }
  });
}

// ---- Checkout modal ----
function openCheckout() {
  if (cartCount() === 0) { toast('Add items to your cart first'); return; }
  buildCheckoutSummary();
  openModal('modal-checkout');
}

function buildCheckoutSummary() {
  const el = document.getElementById('checkout-summary');
  const items = cartItems();
  if (!items.length) { el.innerHTML = ''; return; }
  el.innerHTML = `
    <div class="summary-block">
      ${items.map(({ product, cartQty }) => `
        <div class="summary-row">
          <span>${product.name} ×${product.qty} × ${cartQty}</span>
          <span>${fmt(product.price * cartQty)}</span>
        </div>
      `).join('')}
      <div class="summary-total">
        <span>Total</span><span>${fmt(cartTotal())}</span>
      </div>
    </div>
  `;
}

async function submitOrder() {
  clearErrors('co-name', 'co-phone', 'co-location');
  const nameOk     = validateField('co-name',     'err-co-name',     v => v.trim().length >= 2, 'Enter your full name');
  const phoneOk    = validateField('co-phone',    'err-co-phone',    v => PHONE_RE.test(v.trim()), 'Use format: 0712345678');
  const locationOk = validateField('co-location', 'err-co-location', v => v.trim().length >= 2, 'Enter delivery location');
  if (!nameOk || !phoneOk || !locationOk) return;

  const btn = document.getElementById('submit-order-btn');
  setLoading(btn, true, 'Placing order…');

  const custom = [
    document.getElementById('main-custom').value.trim(),
    document.getElementById('co-custom').value.trim(),
  ].filter(Boolean).join(' | ') || null;

  const payload = {
    name: document.getElementById('co-name').value.trim(),
    phone: document.getElementById('co-phone').value.trim(),
    location: document.getElementById('co-location').value.trim(),
    notes: document.getElementById('co-notes').value.trim() || null,
    custom_request: custom,
    items: cartItems().map(({ product, cartQty }) => ({
      name: product.name, qty: product.qty, cartQty,
    })),
  };

  try {
    const res = await fetch(`${CONFIG.API_BASE}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Something went wrong');

    showOrderSuccess(data.order_id, data.total);
    cart = {};
    renderCart();
    document.getElementById('main-custom').value = '';
  } catch (err) {
    toast(err.message, 4000);
    setLoading(btn, false, 'Place Order');
  }
}

function showOrderSuccess(orderId, total) {
  document.getElementById('modal-checkout-body').innerHTML = `
    <div class="success-wrap">
      <div class="success-tick">✓</div>
      <h3>Order placed!</h3>
      <p>We'll confirm and reach out after payment. Send your M-PESA payment now.</p>
      <div class="payment-card">
        <p class="payment-label">Pay to M-PESA</p>
        <p class="payment-num">${CONFIG.MPESA_NUMBER}</p>
        <p class="payment-note">Wait for us to contact you after confirmation.</p>
      </div>
      <p class="order-ref-label">Your reference</p>
      <code class="order-ref">${orderId}</code>
      <p class="order-amount">${fmt(total)}</p>
      <button class="btn-primary" onclick="closeModal('modal-checkout')">Done</button>
    </div>
  `;
}

// ---- Specified order modal ----
async function submitSpecified() {
  const nameOk     = validateField('sp-name',     'err-sp-name',     v => v.trim().length >= 2, 'Enter your name');
  const phoneOk    = validateField('sp-phone',    'err-sp-phone',    v => PHONE_RE.test(v.trim()), 'Use format: 0712345678');
  const locationOk = validateField('sp-location', 'err-sp-location', v => v.trim().length >= 2, 'Enter delivery location');
  const reqOk      = validateField('sp-request',  'err-sp-request',  v => v.trim().length >= 5, 'Describe your request');
  if (!nameOk || !phoneOk || !locationOk || !reqOk) return;

  const btn = document.getElementById('submit-spec-btn');
  setLoading(btn, true, 'Sending…');

  const payload = {
    name: document.getElementById('sp-name').value.trim(),
    phone: document.getElementById('sp-phone').value.trim(),
    location: document.getElementById('sp-location').value.trim(),
    custom_request: document.getElementById('sp-request').value.trim(),
    notes: null,
    items: [],
  };

  try {
    const res = await fetch(`${CONFIG.API_BASE}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed');

    document.getElementById('modal-specified-body').innerHTML = `
      <div class="success-wrap">
        <div class="success-tick">✓</div>
        <h3>Request sent!</h3>
        <p>We've received your specified order and will be in touch shortly.</p>
        <code class="order-ref">${data.order_id}</code>
        <button class="btn-primary" style="margin-top:1.5rem;" onclick="closeModal('modal-specified')">Close</button>
      </div>
    `;
  } catch (err) {
    toast(err.message, 4000);
    setLoading(btn, false, 'Send Request');
  }
}

// ---- Modal helpers ----
function openModal(id) {
  document.getElementById(id).classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  document.body.style.overflow = '';
}

// ---- Loading state ----
function setLoading(btn, loading, label) {
  btn.disabled = loading;
  btn.innerHTML = loading
    ? `<span class="spinner"></span>${label}`
    : label;
}

// ---- Live phone validation ----
['co-phone', 'sp-phone'].forEach(id => {
  document.addEventListener('DOMContentLoaded', () => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('blur', () => {
      const err = document.getElementById(`err-${id}`);
      if (el.value.trim() && !PHONE_RE.test(el.value.trim())) {
        el.classList.add('is-error');
        err.textContent = 'Use format: 0712345678 or +254712345678';
      } else {
        el.classList.remove('is-error');
        err.textContent = '';
      }
    });
  });
});

// ---- Close modal on overlay click or Escape ----
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

  document.getElementById('checkout-btn').addEventListener('click', openCheckout);
  document.getElementById('open-checkout-header').addEventListener('click', openCheckout);
  document.getElementById('clear-cart-btn').addEventListener('click', () => { cart = {}; renderCart(); toast('Cart cleared'); });
  document.getElementById('submit-order-btn').addEventListener('click', submitOrder);
  document.getElementById('open-specified-btn').addEventListener('click', () => openModal('modal-specified'));
  document.getElementById('submit-spec-btn').addEventListener('click', submitSpecified);
});

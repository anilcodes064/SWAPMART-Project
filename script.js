// ──────────────── STORAGE HELPERS ────────────────
const S = {
  get: (k) => {
    try { return JSON.parse(localStorage.getItem(k)); }
    catch { return null; }
  },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
  del: (k) => localStorage.removeItem(k),
};

// ──────────────── STATE ────────────────
let currentUser = null;
let activeCategory = '';
let tradeTargetItem = null;
let editingItemId = null;
let toastTimer = null;

// ──────────────── INIT ────────────────
window.onload = () => {
  const u = S.get('sm_session');
  if (u) {
    currentUser = u;
    enterApp();
  }

  // Close modal when clicking overlay backdrop
  document.getElementById('trade-modal').addEventListener('click', function (e) {
    if (e.target === this) closeModal();
  });
};

// ──────────────── UTILS ────────────────
function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function toast(msg, type = '') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'show ' + type;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = ''; }, 2800);
}

function catEmoji(c) {
  return { Electronics: '📱', Clothes: '👕', Books: '📚', Other: '🎲' }[c] || '📦';
}

function emptyRow(msg) {
  return `<div style="padding:30px 22px;text-align:center;color:var(--text-dim);font-size:.875rem">${msg}</div>`;
}

// ──────────────── AUTH ────────────────
function switchTab(tab) {
  document.querySelectorAll('.auth-tab').forEach((b, i) =>
    b.classList.toggle('active', (tab === 'login' && i === 0) || (tab === 'signup' && i === 1))
  );
  document.getElementById('login-form').style.display = tab === 'login' ? 'block' : 'none';
  document.getElementById('signup-form').style.display = tab === 'signup' ? 'block' : 'none';
}

function signup() {
  const u = document.getElementById('signup-user').value.trim();
  const p = document.getElementById('signup-pass').value;
  if (!u || !p) return toast('Fill in all fields', 'error');
  const users = S.get('sm_users') || {};
  if (users[u]) return toast('Username already taken', 'error');
  users[u] = { password: p, trustScore: 0 };
  S.set('sm_users', users);
  currentUser = u;
  S.set('sm_session', u);
  enterApp();
  toast('Welcome to SwapMart!', 'success');
}

function login() {
  const u = document.getElementById('login-user').value.trim();
  const p = document.getElementById('login-pass').value;
  const users = S.get('sm_users') || {};
  if (!users[u] || users[u].password !== p) return toast('Invalid credentials', 'error');
  currentUser = u;
  S.set('sm_session', u);
  enterApp();
  toast(`Welcome back, ${u}!`, 'success');
}

function logout() {
  S.del('sm_session');
  currentUser = null;
  document.getElementById('main-nav').style.display = 'none';
  document.querySelectorAll('.page').forEach((p) => p.classList.remove('active'));
  const authPage = document.getElementById('auth-page');
  authPage.style.display = 'flex';
  authPage.classList.add('active');
}

function enterApp() {
  const authPage = document.getElementById('auth-page');
  authPage.style.display = 'none';
  authPage.classList.remove('active');
  document.getElementById('main-nav').style.display = 'flex';
  document.getElementById('nav-user-info').style.display = 'flex';
  document.getElementById('nav-avatar').textContent = currentUser[0].toUpperCase();
  updateNavTrust();
  showPage('home');
}

function updateNavTrust() {
  const users = S.get('sm_users') || {};
  const score = users[currentUser]?.trustScore || 0;
  document.getElementById('nav-trust').textContent = `⭐ ${score}`;
  // update dashboard stat if visible
  const statEl = document.getElementById('stat-trust');
  if (statEl) statEl.textContent = score;
}

// ──────────────── PAGE NAVIGATION ────────────────
function showPage(p, preserveForm = false) {
  document.querySelectorAll('.page').forEach((el) => el.classList.remove('active'));
  document.querySelectorAll('.nav-links button').forEach((b) => b.classList.remove('active'));

  const page = document.getElementById(`${p}-page`);
  if (page) page.classList.add('active');

  const navId = p === 'dashboard' ? 'nav-dash' : p === 'add' ? 'nav-add' : 'nav-home';
  const navBtn = document.getElementById(navId);
  if (navBtn) navBtn.classList.add('active');

  if (p === 'add' && !preserveForm) resetAddForm();
  if (p === 'home') renderItems();
  if (p === 'dashboard') renderDashboard();
}

function setAddMode(editing = false) {
  const title = document.getElementById('add-page-title');
  const publishButton = document.getElementById('publish-item-btn');
  const cancelButton = document.getElementById('cancel-edit-btn');

  if (editing) {
    title.textContent = 'Edit Listing';
    publishButton.textContent = 'Save Changes';
    cancelButton.style.display = 'inline-flex';
    return;
  }

  title.textContent = 'List an Item';
  publishButton.textContent = 'Publish Item →';
  cancelButton.style.display = 'none';
}

function resetAddForm() {
  editingItemId = null;
  document.getElementById('item-name').value = '';
  document.getElementById('item-condition').value = 'New';
  document.getElementById('item-category').value = 'Electronics';
  document.getElementById('item-desc').value = '';
  document.getElementById('item-want').value = '';
  document.getElementById('item-img').value = '';
  previewImg();
  setAddMode(false);
}

function startEditItem(itemId) {
  const items = getItems();
  const item = items.find((i) => i.id === itemId && i.owner === currentUser);
  if (!item) return toast('Listing not found', 'error');

  editingItemId = itemId;
  document.getElementById('item-name').value = item.name;
  document.getElementById('item-condition').value = item.condition;
  document.getElementById('item-category').value = item.category;
  document.getElementById('item-desc').value = item.desc || '';
  document.getElementById('item-want').value = item.want;
  document.getElementById('item-img').value = item.img || '';
  previewImg();
  setAddMode(true);
  showPage('add', true);
}

function cancelEdit() {
  resetAddForm();
}

// ──────────────── ITEMS ────────────────
function getItems() { return S.get('sm_items') || []; }
function saveItems(items) { S.set('sm_items', items); }

function addItem() {
  const name = document.getElementById('item-name').value.trim();
  const cond = document.getElementById('item-condition').value;
  const cat = document.getElementById('item-category').value;
  const desc = document.getElementById('item-desc').value.trim();
  const want = document.getElementById('item-want').value.trim();
  const img = document.getElementById('item-img').value.trim();

  if (!name || !want) return toast('Item name and exchange request are required', 'error');

  const items = getItems();
  if (editingItemId) {
    const item = items.find((i) => i.id === editingItemId && i.owner === currentUser);
    if (!item) return toast('Unable to update item', 'error');

    item.name = name;
    item.condition = cond;
    item.category = cat;
    item.desc = desc;
    item.want = want;
    item.img = img;
    saveItems(items);

    resetAddForm();
    toast('Item updated successfully!', 'success');
    showPage('dashboard');
    return;
  }

  items.unshift({
    id: Date.now(),
    owner: currentUser,
    name,
    condition: cond,
    category: cat,
    desc,
    want,
    img,
    createdAt: Date.now(),
  });
  saveItems(items);

  resetAddForm();
  toast('Item listed successfully!', 'success');
  showPage('home');
}

function previewImg() {
  const url = document.getElementById('item-img').value.trim();
  const box = document.getElementById('img-preview-box');
  if (!url) {
    box.innerHTML = '🖼';
    box.classList.remove('has-img');
    return;
  }
  box.innerHTML = `<img src="${url}" onerror="this.parentElement.innerHTML='❌'" alt="">`;
  box.classList.add('has-img');
}

function getCurrentUsername() {
  return String(currentUser || '').trim();
}

function isOwnedByCurrentUser(item) {
  const owner = String(item.owner || '').trim();
  const user = getCurrentUsername();
  return user && owner === user;
}

function filterCat(btn, cat) {
  document.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
  btn.classList.add('active');
  activeCategory = cat;
  renderItems();
}

function renderItems() {
  const q = (document.getElementById('search-input')?.value || '').toLowerCase();
  let items = getItems().filter((i) => !isOwnedByCurrentUser(i));

  if (activeCategory) items = items.filter((i) => i.category === activeCategory);
  if (q)
    items = items.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        (i.desc || '').toLowerCase().includes(q) ||
        i.want.toLowerCase().includes(q)
    );

  const grid = document.getElementById('items-grid');

  if (!items.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="emoji">🔍</div>
        <h3>Nothing found</h3>
        <p>Try different filters or check back later.</p>
      </div>`;
    return;
  }

  grid.innerHTML = items
    .map(
      (item) => `
    <div class="item-card">
      <div class="item-card-img">
        ${
          item.img
            ? `<img src="${escHtml(item.img)}" alt="${escHtml(item.name)}" onerror="this.parentElement.innerHTML='<span class=placeholder-icon>${catEmoji(item.category)}</span>'">`
            : `<span class="placeholder-icon">${catEmoji(item.category)}</span>`
        }
      </div>
      <div class="item-card-body">
        <div class="item-card-header">
          <div class="item-card-name">${escHtml(item.name)}</div>
          <span class="condition-badge condition-${item.condition.toLowerCase()}">${item.condition}</span>
        </div>
        <div class="item-desc">${escHtml(item.desc || 'No description provided.')}</div>
        <div class="item-exchange">
          <span class="item-exchange-label">Wants →</span>
          <span class="item-exchange-value">${escHtml(item.want)}</span>
        </div>
        <div class="item-card-footer">
          <div class="item-owner">
            <div class="owner-dot"></div>
            ${escHtml(item.owner)}
          </div>
          <button class="btn btn-outline btn-sm" onclick="openTradeModal(${item.id})">Propose Trade</button>
        </div>
      </div>
    </div>`
    )
    .join('');
}

// ──────────────── TRADES ────────────────
function getTrades() { return S.get('sm_trades') || []; }
function saveTrades(t) { S.set('sm_trades', t); }

function openTradeModal(itemId) {
  const items = getItems();
  tradeTargetItem = items.find((i) => i.id === itemId);
  if (!tradeTargetItem) return;

  const myItems = items.filter((i) => i.owner === currentUser);
  if (!myItems.length) {
    toast('List an item first before proposing a trade', 'error');
    return;
  }

  document.getElementById('modal-target-item').innerHTML = `
    <div class="trade-item-thumb">
      ${tradeTargetItem.img ? `<img src="${escHtml(tradeTargetItem.img)}" alt="">` : catEmoji(tradeTargetItem.category)}
    </div>
    <div>
      <div style="font-weight:600;font-size:.9rem">${escHtml(tradeTargetItem.name)}</div>
      <div style="font-size:.78rem;color:var(--text-muted);margin-top:3px">
        by ${escHtml(tradeTargetItem.owner)} · wants: ${escHtml(tradeTargetItem.want)}
      </div>
    </div>`;

  document.getElementById('offer-select').innerHTML = myItems
    .map((i) => `<option value="${i.id}">${escHtml(i.name)}</option>`)
    .join('');

  document.getElementById('trade-message').value = '';
  document.getElementById('trade-modal').classList.add('open');
}

function closeModal() {
  document.getElementById('trade-modal').classList.remove('open');
}

function submitTrade() {
  if (!tradeTargetItem) return;

  const offerId = parseInt(document.getElementById('offer-select').value);
  const msg = document.getElementById('trade-message').value.trim();
  const items = getItems();
  const offerItem = items.find((i) => i.id === offerId);
  if (!offerItem) return;

  const trades = getTrades();
  const dup = trades.find(
    (t) =>
      t.from === currentUser &&
      t.targetItemId === tradeTargetItem.id &&
      t.offerItemId === offerId &&
      t.status === 'pending'
  );
  if (dup) {
    toast('You already sent this trade request', 'error');
    closeModal();
    return;
  }

  trades.push({
    id: Date.now(),
    from: currentUser,
    to: tradeTargetItem.owner,
    offerItemId: offerId,
    offerItemName: offerItem.name,
    targetItemId: tradeTargetItem.id,
    targetItemName: tradeTargetItem.name,
    message: msg,
    status: 'pending',
    createdAt: Date.now(),
  });

  saveTrades(trades);
  closeModal();
  toast('Trade proposal sent!', 'success');
}

function respondTrade(tradeId, action) {
  const trades = getTrades();
  const trade = trades.find((t) => t.id === tradeId);
  if (!trade) return;

  if (action === 'accept') {
    trade.status = 'accepted';
    // Boost trust score for both parties
    const users = S.get('sm_users') || {};
    if (users[trade.from]) users[trade.from].trustScore = (users[trade.from].trustScore || 0) + 1;
    if (users[trade.to]) users[trade.to].trustScore = (users[trade.to].trustScore || 0) + 1;
    S.set('sm_users', users);
    updateNavTrust();
    toast('Trade accepted! ⭐ Trust scores updated', 'success');
  } else {
    trade.status = 'rejected';
    toast('Trade rejected.');
  }

  saveTrades(trades);
  renderDashboard();
}

function completeTrade(tradeId) {
  const trades = getTrades();
  const trade = trades.find((t) => t.id === tradeId);
  if (!trade) return;
  trade.status = 'completed';
  saveTrades(trades);
  toast('🎉 Trade marked as completed!', 'success');
  renderDashboard();
}

// ──────────────── DASHBOARD ────────────────
function deleteItem(itemId) {
  if (!confirm('Remove this listing?')) return;
  const items = getItems().filter((i) => !(i.id === itemId && i.owner === currentUser));
  saveItems(items);
  renderDashboard();
  toast('Item removed.');
}

function renderDashboard() {
  const items = getItems();
  const myItems = items.filter((i) => i.owner === currentUser);
  const trades = getTrades();
  const received = trades.filter((t) => t.to === currentUser);
  const sent = trades.filter((t) => t.from === currentUser);
  const pending = [...received, ...sent].filter((t) => t.status === 'pending');

  // Stats
  document.getElementById('dash-greeting').textContent = `Hey, ${currentUser} 👋`;
  document.getElementById('stat-listings').textContent = myItems.length;
  document.getElementById('stat-pending').textContent = pending.length;
  document.getElementById('my-items-count').textContent = myItems.length;
  document.getElementById('received-count').textContent = received.length;
  document.getElementById('sent-count').textContent = sent.length;
  updateNavTrust();

  // My Items list
  document.getElementById('my-items-list').innerHTML = myItems.length
    ? myItems
        .map(
          (item) => `
      <div class="dash-item-row">
        <div class="dash-item-thumb">
          ${item.img ? `<img src="${escHtml(item.img)}" alt="">` : catEmoji(item.category)}
        </div>
        <div class="dash-item-info">
          <div class="dash-item-name">${escHtml(item.name)}</div>
          <div class="dash-item-meta">${item.condition} · wants ${escHtml(item.want)}</div>
        </div>
        <div class="dash-item-actions">
          <button class="btn btn-secondary btn-sm" onclick="startEditItem(${item.id})">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteItem(${item.id})">Remove</button>
        </div>
      </div>`
        )
        .join('')
    : emptyRow('No items listed yet.');

  // Received Requests
  document.getElementById('received-list').innerHTML = received.length
    ? received
        .map(
          (t) => `
      <div class="trade-row">
        <div class="trade-row-header">
          <div class="trade-row-title">From <strong>${escHtml(t.from)}</strong></div>
          <span class="status-badge status-${t.status}">${t.status}</span>
        </div>
        <div class="trade-row-detail">
          Offering <strong>${escHtml(t.offerItemName)}</strong> for your <strong>${escHtml(t.targetItemName)}</strong>
          ${t.message ? `<br><em style="color:var(--text-dim)">"${escHtml(t.message)}"</em>` : ''}
        </div>
        ${
          t.status === 'pending'
            ? `<div class="trade-row-actions">
                <button class="btn btn-success btn-sm" onclick="respondTrade(${t.id},'accept')">Accept</button>
                <button class="btn btn-danger btn-sm" onclick="respondTrade(${t.id},'reject')">Reject</button>
              </div>`
            : ''
        }
        ${
          t.status === 'accepted'
            ? `<div class="trade-row-actions">
                <button class="btn btn-outline btn-sm" onclick="completeTrade(${t.id})">Mark Complete</button>
              </div>`
            : ''
        }
      </div>`
        )
        .join('')
    : emptyRow('No trade requests received.');

  // Sent Requests
  document.getElementById('sent-list').innerHTML = sent.length
    ? sent
        .map(
          (t) => `
      <div class="trade-row">
        <div class="trade-row-header">
          <div class="trade-row-title">To <strong>${escHtml(t.to)}</strong></div>
          <span class="status-badge status-${t.status}">${t.status}</span>
        </div>
        <div class="trade-row-detail">
          You offered <strong>${escHtml(t.offerItemName)}</strong> for <strong>${escHtml(t.targetItemName)}</strong>
          ${t.message ? `<br><em style="color:var(--text-dim)">"${escHtml(t.message)}"</em>` : ''}
        </div>
        ${
          t.status === 'accepted'
            ? `<div class="trade-row-actions">
                <button class="btn btn-outline btn-sm" onclick="completeTrade(${t.id})">Mark Complete</button>
              </div>`
            : ''
        }
      </div>`
        )
        .join('')
    : emptyRow('No trade requests sent yet.');
}
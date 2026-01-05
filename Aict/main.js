// Auth check - redirect to login if not authenticated
if (!localStorage.getItem('isAuthenticated')) {
  window.location.href = 'login.html';
}

// Logout function
function logout() {
  localStorage.removeItem('isAuthenticated');
  window.location.href = 'login.html';
}

// Main UI logic: navigation, menu toggle, date, export, reports, transactions, settings
document.addEventListener('DOMContentLoaded', function () {
  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.getElementById('sidebar');
  const navLinks = Array.from(document.querySelectorAll('.nav-link'));
  const sections = Array.from(document.querySelectorAll('.content-section'));
  const pageTitle = document.getElementById('pageTitle');
  const breadcrumb = document.getElementById('breadcrumbCurrent');
  const currentDate = document.getElementById('currentDate');
  const searchInput = document.getElementById('searchTransactions');

  // Menu toggle collapse
  menuToggle && menuToggle.addEventListener('click', function () {
    sidebar.classList.toggle('collapsed');
  });

  // Navigation: show section and update title/breadcrumb
  // Attach per-link listeners (original behavior)
  navLinks.forEach(link => {
    link.addEventListener('click', function (e) {
      const sectionId = link.getAttribute('data-section');
      if (!sectionId) return;
      e.preventDefault();
      activateSection(sectionId, link);
    });
  });

  // Add delegated handler on nav-menu to be robust if links are re-rendered
  const navMenu = document.querySelector('.nav-menu');
  if (navMenu) {
    navMenu.addEventListener('click', function (e) {
      const link = e.target.closest('.nav-link');
      if (!link) return;
      const sectionId = link.getAttribute('data-section');
      if (!sectionId) return;
      e.preventDefault();
      activateSection(sectionId, link);
    });
  }

  function activateSection(sectionId, linkEl) {
    navLinks.forEach(l => l.classList.remove('active'));
    // If linkEl not provided, try to find matching nav link
    if (!linkEl) {
      linkEl = navLinks.find(l => l.getAttribute && l.getAttribute('data-section') === sectionId);
    }
    if (linkEl) linkEl.classList.add('active');
    sections.forEach(s => s.id === sectionId ? s.classList.add('active') : s.classList.remove('active'));
    const title = linkEl ? linkEl.textContent.trim() : (sectionId.charAt(0).toUpperCase() + sectionId.slice(1));
    pageTitle && (pageTitle.textContent = title + ' Overview');
    breadcrumb && (breadcrumb.textContent = title);
    // scroll the target section into view
    try {
      const sectionEl = document.getElementById(sectionId);
      if (sectionEl && sectionEl.scrollIntoView) {
        sectionEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      // focus the first meaningful control inside the section (search box, primary button)
      if (sectionEl) {
        const primaryControl = sectionEl.querySelector('input, button, a, select, textarea');
        if (primaryControl && typeof primaryControl.focus === 'function') {
          primaryControl.focus({ preventScroll: true });
        }
      }
    } catch (e) { window.scrollTo({ top: 0, behavior: 'smooth' }); }
    // update URL hash without causing an extra history entry
    try {
      history.replaceState(null, '', '#' + sectionId);
    } catch (e) {
      // fallback
      window.location.hash = '#' + sectionId;
    }
  }

  // Date display
  if (currentDate) {
    const now = new Date();
    const opts = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    currentDate.textContent = now.toLocaleDateString(undefined, opts);
  }

  // Export transactions as CSV
  window.exportReport = function () {
    try {
      const rows = [];
      const tbody = document.getElementById('transactionTableBody');
      if (!tbody) return alert('No transactions available to export');
      const headers = Array.from(document.querySelectorAll('.data-table thead th')).map(h => h.textContent.trim());
      rows.push(headers.join(','));
      Array.from(tbody.querySelectorAll('tr')).forEach(tr => {
        const cols = Array.from(tr.querySelectorAll('td')).map(td => '"' + td.textContent.trim().replace(/"/g, '""') + '"');
        rows.push(cols.join(','));
      });
      const csv = rows.join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'transactions_export.csv'; document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch (err) { console.error(err); alert('Export failed'); }
  };

  // Generate a placeholder report
  window.generateReport = function (type) {
    const name = (type || 'report') + '_' + new Date().toISOString().slice(0, 10) + '.txt';
    const content = 'This is a demo ' + (type || 'report') + ' generated on ' + new Date().toString();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  // Transaction DB in localStorage
  const TX_KEY = 'transactionsDB';
  let transactions = [];
  let isServer = false;
  let editingId = null;

  // API helpers
  async function apiFetchAll() {
    const res = await fetch('/api/transactions');
    if (!res.ok) throw new Error('API fetch failed');
    return res.json();
  }
  async function apiCreate(tx) {
    const res = await fetch('/api/transactions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(tx) });
    if (!res.ok) throw new Error('API create failed');
    return res.json();
  }
  async function apiUpdate(tx) {
    const res = await fetch('/api/transactions/' + encodeURIComponent(tx.id), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(tx) });
    if (!res.ok) throw new Error('API update failed');
    return res.json();
  }
  async function apiDelete(id) {
    const res = await fetch('/api/transactions/' + encodeURIComponent(id), { method: 'DELETE' });
    if (!res.ok) throw new Error('API delete failed');
    return res.json();
  }

  function saveTransactions() {
    try { localStorage.setItem(TX_KEY, JSON.stringify(transactions)); } catch (e) { console.warn('Could not save transactions', e); }
  }

  function renderTransactions() {
    const tbody = document.getElementById('transactionTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    transactions.forEach(tx => {
      const tr = document.createElement('tr');
      const typeClass = tx.type === 'Revenue' ? 'badge-success' : 'badge-danger';
      const amountClass = tx.type === 'Revenue' ? 'amount-positive' : 'amount-negative';
      // tx.amountNumber is numeric; format for display
      const displayAmount = (tx.type === 'Revenue' ? '+$' : '-$') + Number(tx.amountNumber || 0).toLocaleString();
      tr.innerHTML = `<td>${tx.id}</td><td>${tx.date}</td><td>${tx.description}</td><td>${tx.category}</td><td><span class="badge ${typeClass}">${tx.type}</span></td><td class="${amountClass}">${displayAmount}</td><td><span class="status-badge ${tx.status.toLowerCase() === 'completed' ? 'completed' : 'pending'}">${tx.status}</span></td><td><button class="btn-icon view-btn" data-id="${tx.id}" title="View"><i class="fas fa-eye"></i></button> <button class="btn-icon edit-btn" data-id="${tx.id}" title="Edit"><i class="fas fa-edit"></i></button> <button class="btn-icon delete-btn" data-id="${tx.id}" title="Delete"><i class="fas fa-trash"></i></button></td>`;
      tbody.appendChild(tr);
    });
    // After rendering, update KPI cards
    updateKPIs();
  }

  async function loadTransactions() {
    // Try server first
    try {
      const data = await apiFetchAll();
      if (Array.isArray(data)) {
        isServer = true;
        transactions = data.map(t => ({ ...t }));
        renderTransactions();
        return;
      }
    } catch (e) {
      // server not available, fallback to localStorage
      isServer = false;
    }

    try {
      const raw = localStorage.getItem(TX_KEY);
      if (raw) {
        transactions = JSON.parse(raw) || [];
      } else {
        // load existing table rows as initial seed
        const tbody = document.getElementById('transactionTableBody');
        if (tbody) {
          const rows = Array.from(tbody.querySelectorAll('tr'));
          transactions = rows.map(r => {
            const cols = r.querySelectorAll('td');
            // try to parse amount number from display
            const amountText = cols[5]?.textContent.trim() || '$0';
            const amountNumber = Number(amountText.replace(/[^0-9.-]+/g, '')) || 0;
            return {
              id: cols[0]?.textContent.trim() || ('#TXN-' + Math.floor(Math.random() * 90000)),
              date: cols[1]?.textContent.trim() || new Date().toLocaleDateString(),
              description: cols[2]?.textContent.trim() || '',
              category: cols[3]?.textContent.trim() || '',
              type: cols[4]?.textContent.trim() || 'Revenue',
              amount: cols[5]?.textContent.trim() || '$0',
              amountNumber: amountNumber,
              status: cols[6]?.textContent.trim() || 'Completed'
            };
          });
          saveTransactions();
        }
      }
    } catch (e) { console.warn('Failed to load transactions', e); transactions = []; }
    renderTransactions();
  }

  // Modal wiring
  const addTransactionBtn = document.getElementById('addTransactionBtn');
  const modal = document.getElementById('transactionModal');
  const txnForm = document.getElementById('transactionForm');
  const txnCancel = document.getElementById('txnCancel');

  function openModal() {
    if (!modal) return;
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    // prefill date
    const d = document.getElementById('txnDate');
    if (d && !d.value) { d.value = new Date().toISOString().slice(0, 10); }
  }
  function closeModal() {
    if (!modal) return;
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    txnForm && txnForm.reset();
  }

  // Expose addTransaction to open modal (keeps compatibility)
  window.addTransaction = function () { openModal(); };

  addTransactionBtn && addTransactionBtn.addEventListener('click', function (e) { e.preventDefault(); openModal(); });
  txnCancel && txnCancel.addEventListener('click', function () { closeModal(); });

  txnForm && txnForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const id = document.getElementById('txnId').value.trim() || ('#TXN-' + Math.floor(Math.random() * 900000));
    const date = document.getElementById('txnDate').value || new Date().toLocaleDateString();
    const description = document.getElementById('txnDesc').value.trim() || 'No description';
    const category = document.getElementById('txnCategory').value.trim() || 'Misc';
    const type = document.getElementById('txnType').value || 'Revenue';
    const amountRaw = Number(document.getElementById('txnAmount').value) || 0;
    const amountNumber = Math.abs(amountRaw);
    const amount = (type === 'Revenue' ? '+$' : '-$') + amountNumber;
    const status = document.getElementById('txnStatus').value || 'Completed';

    const tx = { id, date, description, category, type, amount, amountNumber, status };

    if (isServer) {
      try {
        if (editingId) {
          await apiUpdate(tx);
        } else {
          await apiCreate(tx);
        }
        // refresh from server
        const fresh = await apiFetchAll();
        transactions = fresh;
        renderTransactions();
      } catch (err) { console.error('API save failed', err); alert('Server error saving transaction'); }
    } else {
      if (editingId) {
        // remove existing by id
        transactions = transactions.filter(t => t.id !== editingId);
      }
      transactions.unshift(tx);
      saveTransactions();
      renderTransactions();
    }

    editingId = null;
    closeModal();
  });

  // initial load
  loadTransactions();

  // Activate section from URL hash (if present) or ensure the initially-marked nav link is applied
  try {
    if (location.hash) {
      const target = location.hash.replace('#', '');
      if (target) activateSection(target, null);
    } else {
      const initial = document.querySelector('.nav-link.active');
      if (initial) { const sid = initial.getAttribute('data-section'); if (sid) activateSection(sid, initial); }
    }
  } catch (e) { /* ignore */ }

  // Debug check removed (login is separate page now)

  // Delegated events: view, edit, delete
  document.getElementById('transactionTableBody') && document.getElementById('transactionTableBody').addEventListener('click', async function (e) {
    const view = e.target.closest('.view-btn');
    const edit = e.target.closest('.edit-btn');
    const del = e.target.closest('.delete-btn');
    if (view) { const id = view.getAttribute('data-id'); const tx = transactions.find(t => t.id === id); alert(JSON.stringify(tx, null, 2)); }
    if (edit) {
      const id = edit.getAttribute('data-id'); const tx = transactions.find(t => t.id === id); if (tx) {
        // open modal and prefill
        openModal();
        document.getElementById('txnId').value = tx.id;
        document.getElementById('txnDate').value = tx.date;
        document.getElementById('txnDesc').value = tx.description;
        document.getElementById('txnCategory').value = tx.category;
        document.getElementById('txnType').value = tx.type;
        document.getElementById('txnAmount').value = tx.amountNumber || 0;
        document.getElementById('txnStatus').value = tx.status;
        // mark editing but keep entry until submit
        editingId = tx.id;
      }
    }
    if (del) {
      const id = del.getAttribute('data-id'); if (confirm('Delete transaction ' + id + '?')) {
        if (isServer) { try { await apiDelete(id); const fresh = await apiFetchAll(); transactions = fresh; renderTransactions(); } catch (err) { console.error(err); alert('Delete failed (server)'); } }
        else { transactions = transactions.filter(t => t.id !== id); saveTransactions(); renderTransactions(); }
      }
    }
  });

  // respond to hash changes (back/forward navigation)
  window.addEventListener('hashchange', function () {
    const id = location.hash.replace('#', '');
    if (id) activateSection(id, null);
  });

  // KPI update function
  function updateKPIs() {
    const revenueEl = document.querySelector('.kpi-card.revenue .kpi-value');
    const expensesEl = document.querySelector('.kpi-card.expenses .kpi-value');
    const profitEl = document.querySelector('.kpi-card.profit .kpi-value');
    const leakageEl = document.querySelector('.kpi-card.leakage .kpi-value');
    const revenueTotal = transactions.filter(t => t.type === 'Revenue').reduce((s, t) => s + Number(t.amountNumber || 0), 0);
    const expensesTotal = transactions.filter(t => t.type === 'Expense').reduce((s, t) => s + Number(t.amountNumber || 0), 0);
    const net = revenueTotal - expensesTotal;
    // simple leakage heuristic: expenses above 70% of revenue
    const leakage = Math.max(0, expensesTotal - revenueTotal * 0.7);
    if (revenueEl) revenueEl.textContent = '$' + revenueTotal.toLocaleString();
    if (expensesEl) expensesEl.textContent = '$' + expensesTotal.toLocaleString();
    if (profitEl) profitEl.textContent = '$' + net.toLocaleString();
    if (leakageEl) leakageEl.textContent = '$' + Math.round(leakage).toLocaleString();
  }

  // Search transactions
  if (searchInput) {
    searchInput.addEventListener('input', function () {
      const q = this.value.trim().toLowerCase();
      const rows = document.querySelectorAll('#transactionTableBody tr');
      rows.forEach(r => {
        r.style.display = r.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    });
  }

  // Apply filters (basic behavior)
  const filterBtn = document.querySelector('.btn-filter');
  filterBtn && filterBtn.addEventListener('click', function () {
    alert('Filters applied (demo)');
  });

  // Alert buttons
  document.querySelectorAll('.btn-alert').forEach(btn => btn.addEventListener('click', () => alert('Opening alert details (demo)')));

  // Settings save
  document.querySelectorAll('.btn-primary').forEach(btn => {
    // avoid interfering with report buttons which call generateReport
    if (btn.closest('.settings-card') && btn.textContent.trim().toLowerCase().includes('save')) {
      btn.addEventListener('click', () => { alert('Settings saved (demo)'); });
    }
  });

  // Toggle switches: simple visual toggle handled by checkbox, no extra code needed
});

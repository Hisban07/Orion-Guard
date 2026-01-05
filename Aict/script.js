document.addEventListener('DOMContentLoaded', function () {
  const overlay = document.getElementById('loginOverlay');
  const form = document.getElementById('loginForm');
  const feedback = document.getElementById('loginFeedback');
  const demoBtn = document.getElementById('demoBtn');

  // Dedicated login page logic
  // element checks remain valid


  form && form.addEventListener('submit', function (e) {
    e.preventDefault();
    const u = document.getElementById('email') ? document.getElementById('email').value.trim() : '';
    const p = document.getElementById('password') ? document.getElementById('password').value : '';
    feedback.classList.remove('error');
    feedback.textContent = '';

    if (!u || !p) {
      feedback.textContent = 'Please enter username and password.';
      feedback.classList.add('error');
      return;
    }

    // Simple demo auth
    const ok = (u === 'hisbanazlan99@uet.com' && p === '12345678') || (u === 'user@example.com' && p === '1234');
    if (ok) {
      feedback.textContent = 'Login successful — redirecting...';
      feedback.classList.remove('error');

      // Set authentication flag
      localStorage.setItem('isAuthenticated', 'true');

      // Redirect to dashboard
      setTimeout(() => {
        window.location.href = 'home.html';
      }, 800);
    } else {
      feedback.textContent = 'Invalid credentials';
      feedback.classList.add('error');
    }
  });

  demoBtn && demoBtn.addEventListener('click', function () {
    const e = document.getElementById('email');
    const p = document.getElementById('password');
    // Fill demo credentials that match the simple auth check
    if (e) e.value = 'hisbanazlan99@uet.com';
    if (p) p.value = '12345678';
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  });

  // Allow closing overlay with Escape once logged in (accessibility)
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape') {
      if (overlay && overlay.classList.contains('glitch-out')) {
        try { overlay.style.display = 'none'; overlay.setAttribute('aria-hidden', 'true'); } catch (e) { }
      }
    }
  });
});

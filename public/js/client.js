/**
 * client.js - Client-Side Enhancements for SSR EJS Views
 * Handles dark/light theme toggle, modal dialogs, and dynamic UI helpers.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Theme Toggle
  const savedTheme = localStorage.getItem('athenaeum_theme_v1') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);

  const themeBtn = document.getElementById('themeToggleBtn');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('athenaeum_theme_v1', next);
    });
  }

  // 2. Modals (Open & Close)
  document.querySelectorAll('[data-open-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-open-modal');
      const modal = document.getElementById(targetId);
      if (modal) modal.classList.remove('hidden');
    });
  });

  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-close-modal');
      const modal = document.getElementById(targetId);
      if (modal) modal.classList.add('hidden');
    });
  });

  document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        backdrop.classList.add('hidden');
      }
    });
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop:not(.hidden)').forEach(modal => {
        modal.classList.add('hidden');
      });
    }
  });

  // 3. Auto-dismiss Flash Alerts
  document.querySelectorAll('.flash-toast').forEach(toast => {
    setTimeout(() => {
      toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  });
});

/**
 * main.js - Master Application Controller & Lifecycle Coordinator
 * Athenaeum Library Management System
 */

import { AuthManager } from './modules/auth.js';
import { BooksManager } from './modules/books.js';
import { CirculationManager } from './modules/circulation.js';
import { MembersManager } from './modules/members.js';
import { DashboardManager } from './modules/dashboard.js';

class App {
  constructor() {
    this.currentTab = 'dashboard';
    this.init();
  }

  init() {
    this.initTheme();
    this.bindGlobalEvents();

    // Sub-system managers
    this.authManager = new AuthManager(this);
    this.booksManager = new BooksManager(this);
    this.circulationManager = new CirculationManager(this);
    this.membersManager = new MembersManager(this);
    this.dashboardManager = new DashboardManager(this);

    this.switchTab('dashboard');
    console.log('🏛️ Athenaeum Library Management System (Modular Architecture) active.');
  }

  bindGlobalEvents() {
    const navTabsList = document.getElementById('navTabsList');
    if (navTabsList) {
      navTabsList.addEventListener('click', (e) => {
        const btn = e.target.closest('.nav-tab-btn');
        if (!btn) return;
        const targetTab = btn.getAttribute('data-tab');
        this.switchTab(targetTab);
      });
    }

    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modalId = btn.getAttribute('data-close-modal');
        this.closeModal(modalId);
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

    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        this.toggleTheme();
      });
    }
  }

  initTheme() {
    const savedTheme = localStorage.getItem('athenaeum_theme_v1') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('athenaeum_theme_v1', next);
    this.showToast(`Switched to ${next} theme.`, 'info', 1500);
  }

  switchTab(tabId) {
    this.currentTab = tabId;

    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      const isCurrent = btn.getAttribute('data-tab') === tabId;
      btn.classList.toggle('active', isCurrent);
      btn.setAttribute('aria-selected', isCurrent ? 'true' : 'false');
    });

    document.querySelectorAll('.view-panel').forEach(panel => {
      if (panel.id === `view-${tabId}`) {
        panel.classList.add('active');
      } else {
        panel.classList.remove('active');
      }
    });

    if (tabId === 'dashboard') {
      this.dashboardManager.render();
    } else if (tabId === 'catalogue') {
      this.booksManager.render();
    } else if (tabId === 'circulation') {
      this.circulationManager.render();
    } else if (tabId === 'my-loans') {
      this.circulationManager.render();
    } else if (tabId === 'members') {
      this.membersManager.render();
    }
  }

  openModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.remove('hidden');
  }

  closeModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.add('hidden');
  }

  showToast(message, type = 'info', duration = 3500) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'ℹ️';
    if (type === 'success') icon = '✓';
    else if (type === 'error') icon = '✕';
    else if (type === 'warning') icon = '⚠️';

    toast.innerHTML = `
      <span style="font-weight: 800; font-size: 1rem;">${icon}</span>
      <span style="flex: 1; line-height: 1.4;">${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(50px)';
      setTimeout(() => toast.remove(), 250);
    }, duration);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.athenaeumApp = new App();
});

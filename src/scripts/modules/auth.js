/**
 * auth.js - Role-Based Authentication & User Session Management
 */

import { store } from '../core/store.js';

export class AuthManager {
  constructor(app) {
    this.app = app;
    this.init();
  }

  init() {
    this.bindEvents();
    this.render();

    store.subscribe(() => {
      this.render();
    });
  }

  bindEvents() {
    const switchButtons = document.querySelectorAll('.role-switch-btn');
    switchButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const userId = btn.getAttribute('data-user-id');
        this.switchUser(userId);
      });
    });

    const regForm = document.getElementById('authRegisterForm');
    if (regForm) {
      regForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleRegistration();
      });
    }
  }

  getCurrentUser() {
    return store.getActiveUser();
  }

  isLibrarian() {
    const user = this.getCurrentUser();
    return user && user.role === 'librarian';
  }

  isMember() {
    const user = this.getCurrentUser();
    return user && user.role === 'member';
  }

  switchUser(userId) {
    const member = store.getMemberById(userId);
    if (!member) return;

    store.setActiveUserId(userId);
    this.app.showToast(`Switched persona to ${member.name} (${member.role.toUpperCase()})`, 'info');

    const currentTab = this.app.currentTab;
    if (member.role === 'member' && (currentTab === 'circulation' || currentTab === 'members')) {
      this.app.switchTab('catalogue');
    }
  }

  handleRegistration() {
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const role = document.getElementById('regRole').value;
    const borrowLimit = Number(document.getElementById('regLimit').value) || 3;

    if (!name || !email) {
      this.app.showToast('Please provide your name and email address.', 'error');
      return;
    }

    const newMember = store.addMember({
      name,
      email,
      role,
      borrowLimit
    });

    store.setActiveUserId(newMember.id);
    this.app.closeModal('authModal');
    this.app.showToast(`Welcome, ${newMember.name}! Your account has been created.`, 'success');

    document.getElementById('authRegisterForm').reset();
  }

  render() {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return;

    const switchButtons = document.querySelectorAll('.role-switch-btn');
    switchButtons.forEach(btn => {
      const uid = btn.getAttribute('data-user-id');
      if (uid === currentUser.id) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    const isLibrarian = currentUser.role === 'librarian';
    const librarianElements = document.querySelectorAll('.role-restricted.librarian-only');
    const memberElements = document.querySelectorAll('.role-restricted.member-only');

    librarianElements.forEach(el => {
      if (isLibrarian) el.classList.remove('hidden');
      else el.classList.add('hidden');
    });

    memberElements.forEach(el => {
      if (!isLibrarian) el.classList.remove('hidden');
      else el.classList.add('hidden');
    });

    const userAuthZone = document.getElementById('userAuthZone');
    if (userAuthZone) {
      const initials = currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2);
      userAuthZone.innerHTML = `
        <div class="user-profile-badge" title="Logged in as ${currentUser.name}">
          <div class="user-avatar">${initials}</div>
          <div class="user-info-text">
            <div class="user-name">${currentUser.name}</div>
            <div class="user-role-tag">${currentUser.role === 'librarian' ? '👑 Staff Librarian' : `🎓 Patron (${currentUser.cardId})`}</div>
          </div>
        </div>
        <button type="button" class="btn btn-secondary btn-sm" id="btnOpenRegisterModal" title="Create New Account">
          + New Patron
        </button>
      `;

      const btnReg = document.getElementById('btnOpenRegisterModal');
      if (btnReg) {
        btnReg.addEventListener('click', () => {
          this.app.openModal('authModal');
        });
      }
    }
  }
}

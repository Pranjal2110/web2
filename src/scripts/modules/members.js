/**
 * members.js - Patron & Member Directory, Profile Dossiers, and History Logs
 */

import { store } from '../core/store.js';

export class MembersManager {
  constructor(app) {
    this.app = app;
    this.searchTerm = '';
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
    const searchInput = document.getElementById('memberSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchTerm = e.target.value.toLowerCase().trim();
        this.render();
      });
    }

    const btnRegister = document.getElementById('btnRegisterNewMemberModal');
    if (btnRegister) {
      btnRegister.addEventListener('click', () => {
        this.app.openModal('authModal');
      });
    }
  }

  getFilteredMembers() {
    let members = store.getMembers();
    if (this.searchTerm) {
      members = members.filter(m => 
        m.name.toLowerCase().includes(this.searchTerm) ||
        m.email.toLowerCase().includes(this.searchTerm) ||
        m.cardId.toLowerCase().includes(this.searchTerm)
      );
    }
    return members;
  }

  openMemberDetail(memberId) {
    const member = store.getMemberById(memberId);
    if (!member) return;

    const allLoans = store.getLoans();
    const userLoans = allLoans.filter(l => l.memberId === member.id);
    const activeLoans = userLoans.filter(l => l.status !== 'returned');
    const returnedLoans = userLoans.filter(l => l.status === 'returned');
    const unpaidFines = activeLoans.reduce((sum, l) => sum + (l.fineAccrued || 0), 0);

    const modalBody = document.getElementById('memberDetailBody');
    modalBody.innerHTML = `
      <div style="display: flex; gap: 1.5rem; align-items: center; border-bottom: 1px solid var(--border-subtle); padding-bottom: 1.25rem; margin-bottom: 1.5rem;">
        <div style="width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), var(--accent-gold)); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; font-weight: 800;">
          ${member.name.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <h3 style="font-family: var(--font-serif); font-size: 1.4rem;">${member.name}</h3>
          <div style="color: var(--text-muted); font-size: 0.85rem;">${member.email} &bull; Card ID: <code style="font-family: var(--font-mono);">${member.cardId}</code></div>
          <div style="display: flex; gap: 0.5rem; margin-top: 0.4rem;">
            <span class="panel-tag">${member.role.toUpperCase()}</span>
            <span class="status-pill ${member.status === 'active' ? 'status-active' : 'status-overdue'}">${member.status.toUpperCase()}</span>
          </div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
        <div style="background: var(--bg-secondary); padding: 0.85rem; border-radius: var(--radius-sm);">
          <span style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">Active Loans</span>
          <div style="font-size: 1.4rem; font-weight: 800; font-family: var(--font-mono);">${activeLoans.length} / ${member.borrowLimit || 3}</div>
        </div>
        <div style="background: var(--bg-secondary); padding: 0.85rem; border-radius: var(--radius-sm);">
          <span style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">Total Fines Cleared</span>
          <div style="font-size: 1.4rem; font-weight: 800; font-family: var(--font-mono); color: var(--success);">$${(member.totalFinesPaid || 0).toFixed(2)}</div>
        </div>
        <div style="background: var(--bg-secondary); padding: 0.85rem; border-radius: var(--radius-sm);">
          <span style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">Outstanding Fines</span>
          <div style="font-size: 1.4rem; font-weight: 800; font-family: var(--font-mono); color: ${unpaidFines > 0 ? 'var(--danger)' : 'var(--text-main)'};">$${unpaidFines.toFixed(2)}</div>
        </div>
        <div style="background: var(--bg-secondary); padding: 0.85rem; border-radius: var(--radius-sm);">
          <span style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">Member Since</span>
          <div style="font-size: 1rem; font-weight: 600; margin-top: 0.3rem;">${member.joinedDate || '2024'}</div>
        </div>
      </div>

      <h4 style="font-size: 1rem; margin-bottom: 0.6rem; color: var(--text-main);">Current Borrowings (${activeLoans.length})</h4>
      <div style="margin-bottom: 1.5rem;">
        ${activeLoans.length === 0 ? '<p style="color: var(--text-faint); font-size: 0.85rem;">No active loans.</p>' : `
          <table class="compact-table">
            <thead>
              <tr><th>Book Title</th><th>Issue Date</th><th>Due Date</th><th>Status</th><th>Fine</th></tr>
            </thead>
            <tbody>
              ${activeLoans.map(l => {
                const b = store.getBookById(l.bookId);
                const tag = l.status === 'overdue' ? `<span class="status-pill status-overdue">Overdue</span>` : `<span class="status-pill status-active">Active</span>`;
                return `<tr>
                  <td><strong>${b ? b.title : 'Book'}</strong></td>
                  <td>${l.issueDate}</td>
                  <td><strong style="${l.status === 'overdue' ? 'color: var(--danger);' : ''}">${l.dueDate}</strong></td>
                  <td>${tag}</td>
                  <td style="font-family: var(--font-mono);">${l.fineAccrued > 0 ? `$${l.fineAccrued.toFixed(2)}` : '-'}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        `}
      </div>

      <h4 style="font-size: 1rem; margin-bottom: 0.6rem; color: var(--text-main);">Borrowing History (${returnedLoans.length})</h4>
      <div>
        ${returnedLoans.length === 0 ? '<p style="color: var(--text-faint); font-size: 0.85rem;">No past return history.</p>' : `
          <table class="compact-table">
            <thead>
              <tr><th>Book Title</th><th>Issue Date</th><th>Returned On</th><th>Fine Result</th></tr>
            </thead>
            <tbody>
              ${returnedLoans.map(l => {
                const b = store.getBookById(l.bookId);
                return `<tr>
                  <td>${b ? b.title : 'Book'}</td>
                  <td>${l.issueDate}</td>
                  <td>${l.returnDate || '-'}</td>
                  <td>${l.fineAccrued > 0 ? (l.finePaid ? 'Paid $' + l.fineAccrued.toFixed(2) : 'Waived') : 'None'}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        `}
      </div>
    `;

    this.app.openModal('memberDetailModal');
  }

  render() {
    const tableTbody = document.getElementById('membersTbody');
    if (!tableTbody) return;

    const members = this.getFilteredMembers();
    const countBadge = document.getElementById('membersCountBadge');
    if (countBadge) countBadge.textContent = store.getMembers().length;

    if (members.length === 0) {
      tableTbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 2rem;">No member records found matching "${this.searchTerm}".</td></tr>`;
      return;
    }

    tableTbody.innerHTML = members.map(m => {
      const activeLoans = store.getLoans().filter(l => l.memberId === m.id && l.status !== 'returned');
      const unpaidFines = activeLoans.reduce((sum, l) => sum + (l.fineAccrued || 0), 0);
      const limit = m.borrowLimit || 3;

      let fineText = '<span style="color: var(--text-faint);">$0.00</span>';
      if (unpaidFines > 0) {
        fineText = `<span class="fine-amount-badge">$${unpaidFines.toFixed(2)}</span>`;
      }

      return `
        <tr>
          <td>
            <strong>${m.name}</strong>
            <div style="font-size: 0.74rem; color: var(--text-muted);">${m.email}</div>
          </td>
          <td><code style="font-family: var(--font-mono); font-size: 0.82rem;">${m.cardId}</code></td>
          <td>
            <span class="panel-tag">${m.role.toUpperCase()}</span>
          </td>
          <td>
            <span style="font-weight: 700; font-family: var(--font-mono);">${activeLoans.length}</span> / ${limit}
          </td>
          <td>${limit} books max</td>
          <td>${fineText}</td>
          <td>
            <span class="status-pill ${m.status === 'active' ? 'status-active' : 'status-overdue'}">${m.status}</span>
          </td>
          <td>
            <button type="button" class="btn btn-secondary btn-sm btn-view-member-detail" data-member-id="${m.id}">
              Dossier & History
            </button>
          </td>
        </tr>
      `;
    }).join('');

    tableTbody.querySelectorAll('.btn-view-member-detail').forEach(btn => {
      btn.addEventListener('click', () => {
        const memberId = btn.getAttribute('data-member-id');
        this.openMemberDetail(memberId);
      });
    });
  }
}

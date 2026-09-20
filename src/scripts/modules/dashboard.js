/**
 * dashboard.js - High-Level Library Analytics, Visualizations & Activity Logs
 */

import { store } from '../core/store.js';
import { CATEGORY_COLORS } from '../core/constants.js';
import { formatTime } from '../utils/date.js';

export class DashboardManager {
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
    const btnClearLogs = document.getElementById('btnClearAuditLogs');
    if (btnClearLogs) {
      btnClearLogs.addEventListener('click', () => {
        store.clearLogs();
        this.app.showToast('Activity log cleared.', 'info');
      });
    }
  }

  render() {
    const books = store.getBooks();
    const members = store.getMembers();
    const loans = store.getLoans();

    const totalTitles = books.length;
    const totalCopies = books.reduce((acc, b) => acc + (b.totalCopies || 0), 0);
    const activeLoans = loans.filter(l => l.status !== 'returned');
    const overdueLoans = loans.filter(l => l.status === 'overdue');
    const issuedCopies = activeLoans.length;
    const utilizationPct = totalCopies > 0 ? Math.round((issuedCopies / totalCopies) * 100) : 0;

    const totalUnpaidFines = overdueLoans.reduce((sum, l) => sum + (l.fineAccrued || 0), 0);
    const totalCollectedFines = members.reduce((sum, m) => sum + (m.totalFinesPaid || 0), 0);

    const activeBorrowersCount = new Set(activeLoans.map(l => l.memberId)).size;

    document.getElementById('kpiValueTotalTitles').textContent = totalTitles;
    document.getElementById('kpiMetaTotalCopies').textContent = `${totalCopies} physical copies inventory`;

    document.getElementById('kpiValueIssued').textContent = issuedCopies;
    document.getElementById('kpiMetaUtilization').textContent = `${utilizationPct}% of collection currently out`;

    const elOverdueVal = document.getElementById('kpiValueOverdue');
    elOverdueVal.textContent = overdueLoans.length;
    const elOverdueMeta = document.getElementById('kpiMetaOverdueAlert');
    if (overdueLoans.length > 0) {
      elOverdueMeta.textContent = `⚠️ ${overdueLoans.length} loan(s) require action`;
      elOverdueMeta.classList.add('alert-text');
    } else {
      elOverdueMeta.textContent = `All active loans are in good standing`;
      elOverdueMeta.classList.remove('alert-text');
    }

    document.getElementById('kpiValueFines').textContent = `$${totalUnpaidFines.toFixed(2)}`;
    document.getElementById('kpiMetaFinesCollected').textContent = `$${totalCollectedFines.toFixed(2)} collected historically`;

    document.getElementById('kpiValueMembers').textContent = members.length;
    document.getElementById('kpiMetaActiveBorrowers').textContent = `${activeBorrowersCount} patron(s) with active loans`;

    const quickPill = document.getElementById('dashboardQuickSummary');
    if (quickPill) {
      quickPill.innerHTML = `
        <span><strong>${books.length}</strong> Titles</span> &bull; 
        <span><strong>${issuedCopies}</strong> On Loan</span> &bull; 
        <span><strong>${overdueLoans.length}</strong> Overdue</span>
      `;
    }

    this.renderMostBorrowed(books);
    this.renderCategoryBreakdown(books);
    this.renderOverdueTable(overdueLoans);
    this.renderActivityLog();
  }

  renderMostBorrowed(books) {
    const list = document.getElementById('mostBorrowedList');
    if (!list) return;

    const topBooks = [...books].sort((a, b) => (b.borrowCount || 0) - (a.borrowCount || 0)).slice(0, 5);
    const maxBorrow = topBooks[0]?.borrowCount || 1;

    list.innerHTML = topBooks.map((book, idx) => {
      const pct = Math.round(((book.borrowCount || 0) / maxBorrow) * 100);
      return `
        <div class="borrow-rank-item">
          <div class="borrow-rank-info">
            <div class="borrow-rank-title-group">
              <span class="rank-number">#${idx + 1}</span>
              <span class="borrow-rank-title" title="${book.title}">${book.title}</span>
            </div>
            <span class="borrow-rank-count">${book.borrowCount || 0} borrows</span>
          </div>
          <div class="borrow-meter-track">
            <div class="borrow-meter-fill" style="width: ${pct}%;"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  renderCategoryBreakdown(books) {
    const container = document.getElementById('categoryBreakdownList');
    if (!container) return;

    const catMap = {};
    let grandTotal = 0;
    books.forEach(b => {
      const cat = b.category || 'Other';
      catMap[cat] = (catMap[cat] || 0) + (b.totalCopies || 1);
      grandTotal += (b.totalCopies || 1);
    });

    const entries = Object.entries(catMap).sort((a, b) => b[1] - a[1]);

    container.innerHTML = entries.map(([category, count]) => {
      const pct = grandTotal > 0 ? Math.round((count / grandTotal) * 100) : 0;
      const color = CATEGORY_COLORS[category] || '#6366f1';
      return `
        <div class="category-stat-row">
          <div class="category-stat-header">
            <span class="category-stat-title">${category}</span>
            <span class="category-stat-copies"><strong>${count}</strong> copies (${pct}%)</span>
          </div>
          <div class="category-progress-track">
            <div class="category-progress-fill" style="width: ${pct}%; background-color: ${color};"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  renderOverdueTable(overdueLoans) {
    const tbody = document.getElementById('dashboardOverdueTbody');
    const label = document.getElementById('overdueCountLabel');
    if (label) label.textContent = `${overdueLoans.length} Overdue`;

    if (!tbody) return;

    if (overdueLoans.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">No overdue loans at this simulated date. All items returned or in active window.</td></tr>`;
      return;
    }

    tbody.innerHTML = overdueLoans.map(loan => {
      const book = store.getBookById(loan.bookId);
      const member = store.getMemberById(loan.memberId);
      return `
        <tr>
          <td><strong>${book ? book.title : 'Book'}</strong></td>
          <td>${member ? member.name : 'Unknown'}</td>
          <td style="font-family: var(--font-mono); color: var(--danger);">${loan.dueDate}</td>
          <td><strong style="color: var(--danger); font-family: var(--font-mono);">+${loan.daysOverdue} days</strong></td>
          <td><strong style="color: var(--danger); font-family: var(--font-mono);">$${loan.fineAccrued.toFixed(2)}</strong></td>
          <td>
            <button type="button" class="btn btn-secondary btn-sm btn-quick-return" data-loan-id="${loan.id}">
              Return / Settle
            </button>
          </td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('.btn-quick-return').forEach(btn => {
      btn.addEventListener('click', () => {
        const loanId = btn.getAttribute('data-loan-id');
        this.app.circulationManager.processReturn(loanId);
      });
    });
  }

  renderActivityLog() {
    const list = document.getElementById('recentActivityList');
    if (!list) return;

    const logs = store.getLogs().slice(0, 10);
    if (logs.length === 0) {
      list.innerHTML = `<li style="color: var(--text-faint); font-size: 0.8rem; text-align: center; padding: 1rem;">No recent audit activity.</li>`;
      return;
    }

    list.innerHTML = logs.map(log => {
      let icon = '📌';
      let bg = 'var(--bg-secondary)';

      if (log.action.includes('ISSUED')) {
        icon = '📤';
        bg = 'var(--primary-light)';
      } else if (log.action.includes('RETURNED')) {
        icon = '📥';
        bg = 'var(--success-bg)';
      } else if (log.action.includes('TIME_TRAVEL')) {
        icon = '⏳';
        bg = 'var(--accent-gold-bg)';
      } else if (log.action.includes('FINE')) {
        icon = '💳';
        bg = 'var(--accent-gold-bg)';
      } else if (log.action.includes('BOOK_ADDED')) {
        icon = '✨';
        bg = 'var(--primary-light)';
      }

      return `
        <li class="activity-item">
          <div class="activity-icon" style="background: ${bg};">${icon}</div>
          <div class="activity-text">
            <div>${log.details}</div>
            <div class="activity-time">${formatTime(log.timestamp)}</div>
          </div>
        </li>
      `;
    }).join('');
  }
}

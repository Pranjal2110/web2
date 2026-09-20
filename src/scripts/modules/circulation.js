/**
 * circulation.js - Issue and Return Flow, Overdue Detection & Automated Fine Calculation Engine
 */

import { store } from '../core/store.js';

export class CirculationManager {
  constructor(app) {
    this.app = app;
    this.circulationFilter = 'all';
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
    const btnFwd3 = document.getElementById('btnFwd3');
    const btnFwd7 = document.getElementById('btnFwd7');
    const btnFwd15 = document.getElementById('btnFwd15');
    const btnResetTime = document.getElementById('btnResetTime');

    if (btnFwd3) btnFwd3.addEventListener('click', () => this.advanceTime(3));
    if (btnFwd7) btnFwd7.addEventListener('click', () => this.advanceTime(7));
    if (btnFwd15) btnFwd15.addEventListener('click', () => this.advanceTime(15));
    if (btnResetTime) btnResetTime.addEventListener('click', () => this.resetTime());

    const statusTabs = document.getElementById('loanStatusTabs');
    if (statusTabs) {
      statusTabs.addEventListener('click', (e) => {
        const btn = e.target.closest('.loan-tab-btn');
        if (!btn) return;
        statusTabs.querySelectorAll('.loan-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.circulationFilter = btn.getAttribute('data-status');
        this.renderCirculationTable();
      });
    }

    const circSearch = document.getElementById('circulationSearchInput');
    if (circSearch) {
      circSearch.addEventListener('input', (e) => {
        this.searchTerm = e.target.value.toLowerCase().trim();
        this.renderCirculationTable();
      });
    }

    const btnDirectIssue = document.getElementById('btnCirculationIssueModal');
    const btnQuickIssue = document.getElementById('btnQuickIssue');
    if (btnDirectIssue) btnDirectIssue.addEventListener('click', () => this.openDirectIssueModal());
    if (btnQuickIssue) btnQuickIssue.addEventListener('click', () => this.openDirectIssueModal());

    const issueForm = document.getElementById('issueForm');
    if (issueForm) {
      issueForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleDirectIssue();
      });
    }

    const issueMemberSelect = document.getElementById('issueMemberSelect');
    const issueBookSelect = document.getElementById('issueBookSelect');
    const durationSelect = document.getElementById('issueLoanDuration');
    const customGroup = document.getElementById('customDueDateGroup');

    if (issueMemberSelect) {
      issueMemberSelect.addEventListener('change', () => this.validateIssueFormPreview());
    }
    if (issueBookSelect) {
      issueBookSelect.addEventListener('change', () => this.validateIssueFormPreview());
    }
    if (durationSelect && customGroup) {
      durationSelect.addEventListener('change', (e) => {
        if (e.target.value === 'custom') {
          customGroup.classList.remove('hidden');
        } else {
          customGroup.classList.add('hidden');
        }
      });
    }
  }

  advanceTime(days) {
    store.advanceSimulatedDays(days);
    this.app.showToast(`Clock advanced +${days} days. Circulation records & fines recalculated!`, 'info');
  }

  resetTime() {
    store.resetSimulatedDate();
    this.app.showToast('Circulation clock reset to baseline date.', 'info');
  }

  openDirectIssueModal() {
    const memberSelect = document.getElementById('issueMemberSelect');
    const bookSelect = document.getElementById('issueBookSelect');
    const warningBox = document.getElementById('issueValidationWarning');
    const durationSelect = document.getElementById('issueLoanDuration');
    const customInput = document.getElementById('issueCustomDueDate');

    if (!memberSelect || !bookSelect) return;

    warningBox.classList.add('hidden');
    durationSelect.value = '14';
    document.getElementById('customDueDateGroup').classList.add('hidden');

    const members = store.getMembers().filter(m => m.role === 'member');
    memberSelect.innerHTML = '<option value="">-- Choose Patron / Member --</option>' +
      members.map(m => {
        const activeCount = store.getLoans().filter(l => l.memberId === m.id && l.status !== 'returned').length;
        return `<option value="${m.id}">${m.name} (${m.cardId}) - ${activeCount}/${m.borrowLimit || 3} books on loan</option>`;
      }).join('');

    const books = store.getBooks();
    bookSelect.innerHTML = '<option value="">-- Choose Book to Issue --</option>' +
      books.map(b => {
        const statusText = b.availableCopies > 0 ? `${b.availableCopies} available` : 'OUT OF STOCK';
        return `<option value="${b.id}" ${b.availableCopies <= 0 ? 'data-disabled="true"' : ''}>
          ${b.title} (${b.isbn}) - [${statusText}]
        </option>`;
      }).join('');

    const simDate = store.getSimulatedDate();
    const defaultDue = new Date(simDate.getTime() + 14 * 24 * 60 * 60 * 1000);
    customInput.value = defaultDue.toISOString().split('T')[0];

    document.getElementById('issueMemberQuotaHint').textContent = '';
    document.getElementById('issueBookAvailabilityHint').textContent = '';

    this.app.openModal('issueModal');
  }

  validateIssueFormPreview() {
    const memberId = document.getElementById('issueMemberSelect').value;
    const bookId = document.getElementById('issueBookSelect').value;
    const warningBox = document.getElementById('issueValidationWarning');
    const warningMsg = document.getElementById('issueValidationMessage');
    const btnSubmit = document.getElementById('btnConfirmIssue');

    let error = null;

    if (memberId) {
      const member = store.getMemberById(memberId);
      const activeCount = store.getLoans().filter(l => l.memberId === memberId && l.status !== 'returned').length;
      const limit = member.borrowLimit || 3;
      document.getElementById('issueMemberQuotaHint').textContent = `Current Loans: ${activeCount} of ${limit} permitted.`;

      if (activeCount >= limit) {
        error = `Patron has reached their borrowing limit (${activeCount}/${limit} books). Cannot issue further books.`;
      }
    }

    if (bookId) {
      const book = store.getBookById(bookId);
      document.getElementById('issueBookAvailabilityHint').textContent = `Available: ${book.availableCopies} of ${book.totalCopies} copies in stock.`;

      if (book.availableCopies <= 0) {
        error = `This title is completely checked out (0 copies available).`;
      }

      if (memberId) {
        const alreadyHas = store.getLoans().some(l => l.memberId === memberId && l.bookId === bookId && l.status !== 'returned');
        if (alreadyHas) {
          error = `Patron already has an active borrowed copy of this book.`;
        }
      }
    }

    if (error) {
      warningBox.classList.remove('hidden');
      warningMsg.textContent = error;
      btnSubmit.disabled = true;
    } else {
      warningBox.classList.add('hidden');
      btnSubmit.disabled = false;
    }
  }

  handleDirectIssue() {
    const memberId = document.getElementById('issueMemberSelect').value;
    const bookId = document.getElementById('issueBookSelect').value;
    const durationVal = document.getElementById('issueLoanDuration').value;
    const customDateVal = document.getElementById('issueCustomDueDate').value;

    if (!memberId || !bookId) {
      this.app.showToast('Please select both a patron and a book.', 'error');
      return;
    }

    let customDueDate = null;
    let loanDays = 14;

    if (durationVal === 'custom') {
      if (!customDateVal) {
        this.app.showToast('Please specify a valid custom due date.', 'error');
        return;
      }
      customDueDate = customDateVal;
    } else {
      loanDays = Number(durationVal);
    }

    const result = store.issueBook({
      bookId,
      memberId,
      loanDays,
      customDueDate
    });

    if (result.success) {
      const book = store.getBookById(bookId);
      const member = store.getMemberById(memberId);
      this.app.showToast(`Success! Issued "${book.title}" to ${member.name}.`, 'success');
      this.app.closeModal('issueModal');
    } else {
      this.app.showToast(result.message, 'error');
    }
  }

  processReturn(loanId) {
    const loans = store.getLoans();
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return;

    const book = store.getBookById(loan.bookId);

    if (loan.status === 'overdue' && loan.fineAccrued > 0) {
      this.openFineSettlementModal(loanId);
      return;
    }

    const result = store.returnBook(loanId);
    if (result.success) {
      this.app.showToast(`Returned "${book ? book.title : 'Book'}" successfully. Inventory copy replenished.`, 'success');
    } else {
      this.app.showToast(result.message, 'error');
    }
  }

  openFineSettlementModal(loanId) {
    const loan = store.getLoans().find(l => l.id === loanId);
    if (!loan) return;

    const book = store.getBookById(loan.bookId);
    const member = store.getMemberById(loan.memberId);
    const currentUser = store.getActiveUser();
    const isLibrarian = currentUser && currentUser.role === 'librarian';

    const fineModalBody = document.getElementById('fineModalBody');
    fineModalBody.innerHTML = `
      <div style="text-align: center; margin-bottom: 1.25rem;">
        <span style="font-size: 2.5rem;">⚠️</span>
        <h4 style="font-size: 1.2rem; margin-top: 0.5rem;">Overdue Fine Accrued</h4>
        <p style="color: var(--text-muted); font-size: 0.85rem;">This item is being returned past its due date.</p>
      </div>

      <div class="fine-summary-receipt">
        <div class="receipt-row"><span>Book Title:</span><strong>${book ? book.title : 'Book'}</strong></div>
        <div class="receipt-row"><span>Patron Name:</span><strong>${member ? member.name : 'Patron'} (${member ? member.cardId : ''})</strong></div>
        <div class="receipt-row"><span>Due Date:</span><span>${loan.dueDate}</span></div>
        <div class="receipt-row"><span>Days Overdue:</span><strong style="color: var(--danger);">${loan.daysOverdue || 1} day(s)</strong></div>
        <div class="receipt-row"><span>Daily Rate:</span><span>$${store.getSettings().fineRatePerDay.toFixed(2)} / day</span></div>
        <div class="receipt-row receipt-total">
          <span>Total Outstanding Fine:</span>
          <span>$${loan.fineAccrued.toFixed(2)}</span>
        </div>
      </div>
    `;

    const footer = document.getElementById('fineModalFooter');
    if (isLibrarian) {
      footer.innerHTML = `
        <button type="button" class="btn btn-secondary" data-close-modal="fineModal">Cancel</button>
        <button type="button" class="btn btn-warning" id="btnWaiveFine">Waive Fine & Return</button>
        <button type="button" class="btn btn-primary" id="btnCollectCashFine">Collect Payment ($${loan.fineAccrued.toFixed(2)})</button>
      `;
      document.getElementById('btnWaiveFine').addEventListener('click', () => {
        store.returnBook(loanId, { waiveFine: true });
        this.app.closeModal('fineModal');
        this.app.showToast(`Book returned and fine of $${loan.fineAccrued.toFixed(2)} waived by Librarian.`, 'info');
      });
      document.getElementById('btnCollectCashFine').addEventListener('click', () => {
        store.returnBook(loanId, { payFineNow: true });
        this.app.closeModal('fineModal');
        this.app.showToast(`Fine of $${loan.fineAccrued.toFixed(2)} collected. Book returned to circulation.`, 'success');
      });
    } else {
      footer.innerHTML = `
        <button type="button" class="btn btn-secondary" data-close-modal="fineModal">Cancel</button>
        <button type="button" class="btn btn-primary" id="btnMemberPayAndReturn">Pay Fine Online & Return ($${loan.fineAccrued.toFixed(2)})</button>
      `;
      document.getElementById('btnMemberPayAndReturn').addEventListener('click', () => {
        store.returnBook(loanId, { payFineNow: true });
        this.app.closeModal('fineModal');
        this.app.showToast(`Payment of $${loan.fineAccrued.toFixed(2)} processed! Book successfully returned.`, 'success');
      });
    }

    this.app.openModal('fineModal');
  }

  render() {
    const dateText = document.getElementById('currentSimulatedDateText');
    if (dateText) {
      dateText.textContent = store.getSimulatedDateFormatted();
    }

    this.renderCirculationTable();
    this.renderMemberLoansView();
  }

  renderCirculationTable() {
    const tableTbody = document.getElementById('circulationTbody');
    if (!tableTbody) return;

    let loans = store.getLoans();

    const countAll = loans.length;
    const countActive = loans.filter(l => l.status === 'active').length;
    const countOverdue = loans.filter(l => l.status === 'overdue').length;
    const countReturned = loans.filter(l => l.status === 'returned').length;

    const elAll = document.getElementById('countAllLoans');
    const elActive = document.getElementById('countActiveLoans');
    const elOverdue = document.getElementById('countOverdueLoans');
    const elReturned = document.getElementById('countReturnedLoans');
    const badgeActive = document.getElementById('activeLoansCountBadge');

    if (elAll) elAll.textContent = countAll;
    if (elActive) elActive.textContent = countActive;
    if (elOverdue) elOverdue.textContent = countOverdue;
    if (elReturned) elReturned.textContent = countReturned;
    if (badgeActive) badgeActive.textContent = countActive + countOverdue;

    if (this.circulationFilter !== 'all') {
      loans = loans.filter(l => l.status === this.circulationFilter);
    }

    if (this.searchTerm) {
      loans = loans.filter(l => {
        const b = store.getBookById(l.bookId);
        const m = store.getMemberById(l.memberId);
        const bTitle = b ? b.title.toLowerCase() : '';
        const mName = m ? m.name.toLowerCase() : '';
        const lId = l.id.toLowerCase();
        return bTitle.includes(this.searchTerm) || mName.includes(this.searchTerm) || lId.includes(this.searchTerm);
      });
    }

    if (loans.length === 0) {
      tableTbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 2rem;">No loans match this filter criteria.</td></tr>`;
      return;
    }

    tableTbody.innerHTML = loans.map(loan => {
      const book = store.getBookById(loan.bookId);
      const member = store.getMemberById(loan.memberId);

      let statusBadge = '';
      if (loan.status === 'active') {
        statusBadge = `<span class="status-pill status-active">Active</span>`;
      } else if (loan.status === 'overdue') {
        statusBadge = `<span class="status-pill status-overdue">⚠️ Overdue (+${loan.daysOverdue}d)</span>`;
      } else {
        statusBadge = `<span class="status-pill status-returned">Returned</span>`;
      }

      let fineText = '<span style="color: var(--text-faint);">-</span>';
      if (loan.fineAccrued > 0) {
        if (loan.finePaid) {
          fineText = `<span class="fine-amount-badge paid">✓ $${loan.fineAccrued.toFixed(2)} Paid</span>`;
        } else {
          fineText = `<span class="fine-amount-badge">$${loan.fineAccrued.toFixed(2)} Unpaid</span>`;
        }
      }

      let actionBtn = '';
      if (loan.status !== 'returned') {
        actionBtn = `
          <button type="button" class="btn btn-secondary btn-sm btn-process-return" data-loan-id="${loan.id}">
            Return Book
          </button>
        `;
      } else {
        actionBtn = `<span style="font-size: 0.76rem; color: var(--text-faint);">Completed</span>`;
      }

      return `
        <tr>
          <td><code style="font-family: var(--font-mono); font-size: 0.8rem;">${loan.id}</code></td>
          <td>
            <strong>${book ? book.title : 'Deleted Book'}</strong>
            <div style="font-size: 0.74rem; color: var(--text-faint); font-family: var(--font-mono);">${book ? book.isbn : ''}</div>
          </td>
          <td>
            <strong>${member ? member.name : 'Unknown Member'}</strong>
            <div style="font-size: 0.74rem; color: var(--text-muted);">${member ? member.cardId : ''}</div>
          </td>
          <td style="font-family: var(--font-mono); font-size: 0.82rem;">${loan.issueDate}</td>
          <td style="font-family: var(--font-mono); font-size: 0.82rem;">
            <strong style="${loan.status === 'overdue' ? 'color: var(--danger);' : ''}">${loan.dueDate}</strong>
          </td>
          <td>${statusBadge}</td>
          <td>${fineText}</td>
          <td>${actionBtn}</td>
        </tr>
      `;
    }).join('');

    tableTbody.querySelectorAll('.btn-process-return').forEach(btn => {
      btn.addEventListener('click', () => {
        const loanId = btn.getAttribute('data-loan-id');
        this.processReturn(loanId);
      });
    });
  }

  renderMemberLoansView() {
    const currentUser = store.getActiveUser();
    if (!currentUser || currentUser.role !== 'member') return;

    const allLoans = store.getLoans();
    const userLoans = allLoans.filter(l => l.memberId === currentUser.id);
    const activeLoans = userLoans.filter(l => l.status !== 'returned');
    const returnedLoans = userLoans.filter(l => l.status === 'returned');

    const myLoansBadge = document.getElementById('myLoansCountBadge');
    if (myLoansBadge) myLoansBadge.textContent = activeLoans.length;

    const limit = currentUser.borrowLimit || 3;
    const quotaCard = document.getElementById('memberQuotaCard');
    if (quotaCard) {
      const pct = Math.min(100, Math.round((activeLoans.length / limit) * 100));
      const gaugeClass = activeLoans.length >= limit ? 'danger' : activeLoans.length === limit - 1 ? 'warning' : '';
      quotaCard.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: baseline;">
          <div>
            <span class="panel-tag">Patron Quota</span>
            <h3 class="panel-title" style="margin-top: 0.4rem;">Borrowing Limit</h3>
          </div>
          <div style="font-size: 1.35rem; font-weight: 800; font-family: var(--font-mono);">${activeLoans.length} / ${limit}</div>
        </div>
        <div class="quota-meter-bar">
          <div class="quota-meter-fill ${gaugeClass}" style="width: ${pct}%;"></div>
        </div>
        <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.5rem;">
          ${activeLoans.length >= limit 
            ? '⚠️ Borrowing limit reached. Return an existing book to checkout another.' 
            : `You can borrow ${limit - activeLoans.length} more title(s).`}
        </p>
      `;
    }

    const finesCard = document.getElementById('memberFinesCard');
    if (finesCard) {
      const unpaidFines = activeLoans.reduce((sum, l) => sum + (l.fineAccrued || 0), 0);
      finesCard.innerHTML = `
        <span class="panel-tag ${unpaidFines > 0 ? 'tag-warning' : ''}">Financial Ledger</span>
        <h3 class="panel-title" style="margin-top: 0.4rem;">Outstanding Fines</h3>
        <div style="font-size: 1.85rem; font-weight: 800; font-family: var(--font-mono); margin: 0.35rem 0; color: ${unpaidFines > 0 ? 'var(--danger)' : 'var(--success)'};">
          $${unpaidFines.toFixed(2)}
        </div>
        <p style="font-size: 0.8rem; color: var(--text-muted);">
          Total lifetime fines cleared: <strong>$${(currentUser.totalFinesPaid || 0).toFixed(2)}</strong>
        </p>
      `;
    }

    const activeGrid = document.getElementById('myActiveLoansGrid');
    if (activeGrid) {
      if (activeLoans.length === 0) {
        activeGrid.innerHTML = `
          <div style="grid-column: 1 / -1; background: var(--bg-card); border: 1px dashed var(--border-subtle); border-radius: var(--radius-md); padding: 2.5rem; text-align: center;">
            <div style="font-size: 2rem; margin-bottom: 0.5rem;">📖</div>
            <h4>You currently have no borrowed books</h4>
            <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 0.25rem;">Browse the catalogue to discover and borrow books.</p>
          </div>
        `;
      } else {
        activeGrid.innerHTML = activeLoans.map(loan => {
          const book = store.getBookById(loan.bookId);
          const isOverdue = loan.status === 'overdue';
          const countdownMsg = isOverdue
            ? `⚠️ OVERDUE by ${loan.daysOverdue} days (Fine: $${loan.fineAccrued.toFixed(2)})`
            : `Due on ${loan.dueDate}`;

          return `
            <div class="active-loan-card ${isOverdue ? 'is-overdue' : ''}">
              <div>
                <span class="meta-pill" style="margin-bottom: 0.5rem; display: inline-block;">${book ? book.category : 'Book'}</span>
                <h4 style="font-family: var(--font-serif); font-size: 1.15rem; margin-bottom: 0.25rem;">${book ? book.title : 'Book'}</h4>
                <div style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 0.75rem;">by ${book ? book.author : 'Unknown'}</div>
                
                <div class="due-countdown-banner ${isOverdue ? 'urgent' : ''}">
                  <span>${countdownMsg}</span>
                </div>
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-subtle); padding-top: 0.75rem;">
                <span style="font-size: 0.75rem; color: var(--text-faint); font-family: var(--font-mono);">Issued: ${loan.issueDate}</span>
                <button type="button" class="btn ${isOverdue ? 'btn-warning' : 'btn-primary'} btn-sm btn-member-return" data-loan-id="${loan.id}">
                  Return Book
                </button>
              </div>
            </div>
          `;
        }).join('');

        activeGrid.querySelectorAll('.btn-member-return').forEach(btn => {
          btn.addEventListener('click', () => {
            const loanId = btn.getAttribute('data-loan-id');
            this.processReturn(loanId);
          });
        });
      }
    }

    const historyTbody = document.getElementById('myHistoryTbody');
    if (historyTbody) {
      if (returnedLoans.length === 0) {
        historyTbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">No returned books in history yet.</td></tr>`;
      } else {
        historyTbody.innerHTML = returnedLoans.map(loan => {
          const book = store.getBookById(loan.bookId);
          let fineStatus = '<span style="color: var(--success);">None</span>';
          if (loan.fineAccrued > 0) {
            fineStatus = loan.finePaid ? `<span class="fine-amount-badge paid">Paid $${loan.fineAccrued.toFixed(2)}</span>` : `<span class="fine-amount-badge">Waived</span>`;
          }

          return `
            <tr>
              <td><strong>${book ? book.title : 'Book'}</strong></td>
              <td style="font-family: var(--font-mono); font-size: 0.8rem;">${loan.issueDate}</td>
              <td style="font-family: var(--font-mono); font-size: 0.8rem;">${loan.dueDate}</td>
              <td style="font-family: var(--font-mono); font-size: 0.8rem;">${loan.returnDate || '-'}</td>
              <td>${fineStatus}</td>
            </tr>
          `;
        }).join('');
      }
    }
  }
}

/**
 * books.js - Book Catalogue Management, Search/Filter & Modal Views
 */

import { store } from '../core/store.js';
import { COVER_GRADIENTS } from '../core/constants.js';

export class BooksManager {
  constructor(app) {
    this.app = app;
    this.searchTerm = '';
    this.selectedCategory = 'all';
    this.selectedAvailability = 'all';
    this.sortBy = 'popularity';
    this.viewMode = 'grid';
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
    const searchInput = document.getElementById('catalogueSearchInput');
    const btnClearSearch = document.getElementById('btnClearSearch');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchTerm = e.target.value.toLowerCase().trim();
        this.render();
      });
    }
    if (btnClearSearch) {
      btnClearSearch.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        this.searchTerm = '';
        this.render();
      });
    }

    const categoryBar = document.getElementById('categoryPillsBar');
    if (categoryBar) {
      categoryBar.addEventListener('click', (e) => {
        const pill = e.target.closest('.category-pill');
        if (!pill) return;
        categoryBar.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.selectedCategory = pill.getAttribute('data-category');
        this.render();
      });
    }

    const availSelect = document.getElementById('filterAvailability');
    if (availSelect) {
      availSelect.addEventListener('change', (e) => {
        this.selectedAvailability = e.target.value;
        this.render();
      });
    }

    const sortSelect = document.getElementById('sortCatalogue');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.sortBy = e.target.value;
        this.render();
      });
    }

    const btnViewGrid = document.getElementById('btnViewGrid');
    const btnViewTable = document.getElementById('btnViewTable');
    if (btnViewGrid && btnViewTable) {
      btnViewGrid.addEventListener('click', () => {
        this.viewMode = 'grid';
        btnViewGrid.classList.add('active');
        btnViewTable.classList.remove('active');
        document.getElementById('booksGridContainer').classList.remove('hidden');
        document.getElementById('booksTableContainer').classList.add('hidden');
      });
      btnViewTable.addEventListener('click', () => {
        this.viewMode = 'table';
        btnViewTable.classList.add('active');
        btnViewGrid.classList.remove('active');
        document.getElementById('booksGridContainer').classList.add('hidden');
        document.getElementById('booksTableContainer').classList.remove('hidden');
      });
    }

    const btnResetFilters = document.getElementById('btnResetCatalogueFilters');
    if (btnResetFilters) {
      btnResetFilters.addEventListener('click', () => {
        this.resetFilters();
      });
    }

    const btnAddTop = document.getElementById('btnAddBookTop');
    const btnAddCat = document.getElementById('btnAddBookCatalogue');
    if (btnAddTop) btnAddTop.addEventListener('click', () => this.openAddBookModal());
    if (btnAddCat) btnAddCat.addEventListener('click', () => this.openAddBookModal());

    const bookForm = document.getElementById('bookForm');
    if (bookForm) {
      bookForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSaveBook();
      });
    }

    const presetCoverPicker = document.getElementById('presetCoverPicker');
    if (presetCoverPicker) {
      presetCoverPicker.addEventListener('change', (e) => {
        if (e.target.value) {
          document.getElementById('bookCoverUrl').value = '';
        }
      });
    }
  }

  resetFilters() {
    this.searchTerm = '';
    this.selectedCategory = 'all';
    this.selectedAvailability = 'all';
    this.sortBy = 'popularity';

    const searchInput = document.getElementById('catalogueSearchInput');
    if (searchInput) searchInput.value = '';

    const availSelect = document.getElementById('filterAvailability');
    if (availSelect) availSelect.value = 'all';

    const sortSelect = document.getElementById('sortCatalogue');
    if (sortSelect) sortSelect.value = 'popularity';

    const categoryBar = document.getElementById('categoryPillsBar');
    if (categoryBar) {
      categoryBar.querySelectorAll('.category-pill').forEach(p => {
        if (p.getAttribute('data-category') === 'all') p.classList.add('active');
        else p.classList.remove('active');
      });
    }

    this.render();
  }

  getFilteredBooks() {
    let books = store.getBooks();

    if (this.searchTerm) {
      books = books.filter(b => 
        b.title.toLowerCase().includes(this.searchTerm) ||
        b.author.toLowerCase().includes(this.searchTerm) ||
        b.isbn.toLowerCase().includes(this.searchTerm) ||
        (b.category && b.category.toLowerCase().includes(this.searchTerm))
      );
    }

    if (this.selectedCategory !== 'all') {
      books = books.filter(b => b.category === this.selectedCategory);
    }

    if (this.selectedAvailability === 'available') {
      books = books.filter(b => b.availableCopies > 0);
    } else if (this.selectedAvailability === 'low') {
      books = books.filter(b => b.availableCopies === 1);
    } else if (this.selectedAvailability === 'unavailable') {
      books = books.filter(b => b.availableCopies === 0);
    }

    books.sort((a, b) => {
      switch (this.sortBy) {
        case 'popularity':
          return (b.borrowCount || 0) - (a.borrowCount || 0);
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'title-desc':
          return b.title.localeCompare(a.title);
        case 'author':
          return a.author.localeCompare(b.author);
        case 'year-desc':
          return (b.year || 0) - (a.year || 0);
        case 'available':
          return b.availableCopies - a.availableCopies;
        default:
          return 0;
      }
    });

    return books;
  }

  openAddBookModal() {
    const form = document.getElementById('bookForm');
    form.reset();
    document.getElementById('bookFormId').value = '';
    document.getElementById('bookModalTitle').textContent = 'Add New Book to Collection';
    document.getElementById('bookTotalCopies').value = '3';
    document.getElementById('hintCopies').textContent = 'Initial available copies will match total copies.';
    this.clearErrors();
    this.app.openModal('bookModal');
  }

  openEditBookModal(bookId) {
    const book = store.getBookById(bookId);
    if (!book) return;

    this.clearErrors();
    document.getElementById('bookFormId').value = book.id;
    document.getElementById('bookModalTitle').textContent = 'Edit Book Details';
    document.getElementById('bookTitle').value = book.title;
    document.getElementById('bookAuthor').value = book.author;
    document.getElementById('bookIsbn').value = book.isbn;
    document.getElementById('bookCategory').value = book.category;
    document.getElementById('bookYear').value = book.year || '';
    document.getElementById('bookTotalCopies').value = book.totalCopies;
    document.getElementById('bookShelfLocation').value = book.shelfLocation || '';
    document.getElementById('bookCoverUrl').value = book.coverUrl || '';
    document.getElementById('presetCoverPicker').value = book.coverStyle || 'tech-deep';
    document.getElementById('bookDescription').value = book.description || '';

    const issuedCount = book.totalCopies - book.availableCopies;
    document.getElementById('hintCopies').textContent = `Currently issued to patrons: ${issuedCount} copies.`;

    this.app.openModal('bookModal');
  }

  clearErrors() {
    ['errBookTitle', 'errBookAuthor', 'errBookIsbn', 'errBookCategory', 'errBookCopies'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = '';
    });
  }

  handleSaveBook() {
    const id = document.getElementById('bookFormId').value;
    const title = document.getElementById('bookTitle').value.trim();
    const author = document.getElementById('bookAuthor').value.trim();
    const isbn = document.getElementById('bookIsbn').value.trim();
    const category = document.getElementById('bookCategory').value;
    const year = document.getElementById('bookYear').value;
    const totalCopies = Number(document.getElementById('bookTotalCopies').value);
    const shelfLocation = document.getElementById('bookShelfLocation').value.trim();
    const coverUrl = document.getElementById('bookCoverUrl').value.trim();
    const coverStyle = document.getElementById('presetCoverPicker').value || 'tech-deep';
    const description = document.getElementById('bookDescription').value.trim();

    let hasError = false;
    this.clearErrors();

    if (!title) {
      document.getElementById('errBookTitle').textContent = 'Title is required.';
      hasError = true;
    }
    if (!author) {
      document.getElementById('errBookAuthor').textContent = 'Author is required.';
      hasError = true;
    }
    if (!isbn) {
      document.getElementById('errBookIsbn').textContent = 'ISBN is required.';
      hasError = true;
    }
    if (!category) {
      document.getElementById('errBookCategory').textContent = 'Please select a discipline.';
      hasError = true;
    }
    if (isNaN(totalCopies) || totalCopies < 1) {
      document.getElementById('errBookCopies').textContent = 'Total copies must be at least 1.';
      hasError = true;
    }

    if (hasError) return;

    if (id) {
      store.updateBook(id, {
        title, author, isbn, category, year, totalCopies, shelfLocation, coverUrl, coverStyle, description
      });
      this.app.showToast(`Updated "${title}" successfully.`, 'success');
    } else {
      store.addBook({
        title, author, isbn, category, year, totalCopies, shelfLocation, coverUrl, coverStyle, description
      });
      this.app.showToast(`Added "${title}" to the library catalogue.`, 'success');
    }

    this.app.closeModal('bookModal');
  }

  handleDeleteBook(bookId) {
    const book = store.getBookById(bookId);
    if (!book) return;

    if (confirm(`Are you sure you want to permanently delete "${book.title}" from the catalogue?`)) {
      const result = store.deleteBook(bookId);
      if (result.success) {
        this.app.showToast(`Deleted "${book.title}".`, 'info');
      } else {
        this.app.showToast(result.message, 'error');
      }
    }
  }

  handleBorrowBook(bookId) {
    const currentUser = store.getActiveUser();
    if (!currentUser) return;

    const result = store.issueBook({
      bookId,
      memberId: currentUser.id,
      loanDays: 14
    });

    if (result.success) {
      const book = store.getBookById(bookId);
      this.app.showToast(`Success! You have borrowed "${book ? book.title : 'the book'}". Due in 14 days.`, 'success');
      this.app.closeModal('bookDetailModal');
    } else {
      this.app.showToast(result.message, 'error');
    }
  }

  openBookDetail(bookId) {
    const book = store.getBookById(bookId);
    if (!book) return;

    const currentUser = store.getActiveUser();
    const isLibrarian = currentUser && currentUser.role === 'librarian';

    const bgStyle = book.coverUrl
      ? `background-image: url('${book.coverUrl}'); background-size: cover;`
      : `background: ${COVER_GRADIENTS[book.coverStyle] || COVER_GRADIENTS['tech-deep']};`;

    const availClass = book.availableCopies === 0 ? 'out-of-stock' : book.availableCopies === 1 ? 'low-stock' : 'in-stock';
    const availLabel = book.availableCopies === 0 ? 'Out of Stock (0 Available)' : `${book.availableCopies} of ${book.totalCopies} Available`;

    let borrowersHtml = '';
    if (isLibrarian) {
      const activeLoans = store.getLoans().filter(l => l.bookId === book.id && l.status !== 'returned');
      if (activeLoans.length > 0) {
        borrowersHtml = `
          <div style="margin-top: 1.25rem; border-top: 1px solid var(--border-subtle); padding-top: 1rem;">
            <strong style="font-size: 0.82rem; color: var(--text-muted); text-transform: uppercase;">Active Borrowers (${activeLoans.length})</strong>
            <ul style="list-style: none; margin-top: 0.5rem; display: flex; flex-direction: column; gap: 0.4rem; font-size: 0.82rem;">
              ${activeLoans.map(l => {
                const mem = store.getMemberById(l.memberId);
                const statusTag = l.status === 'overdue' ? `<span class="status-pill status-overdue">Overdue</span>` : `<span class="status-pill status-active">Active</span>`;
                return `<li style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary); padding: 0.4rem 0.6rem; border-radius: var(--radius-sm);">
                  <span><strong>${mem ? mem.name : 'Unknown'}</strong> (${l.dueDate})</span>
                  ${statusTag}
                </li>`;
              }).join('')}
            </ul>
          </div>
        `;
      }
    }

    const modalContent = document.getElementById('bookDetailContent');
    modalContent.innerHTML = `
      <div class="detail-cover-box" style="${bgStyle}">
        <div class="book-cover-gradient" style="height: 100%; display: flex; flex-direction: column; justify-content: flex-end; padding: 1.25rem; background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 60%);">
          <div class="book-badge-category" style="position: static; align-self: flex-start; margin-bottom: 0.5rem;">${book.category}</div>
          <div class="book-cover-title-badge" style="font-size: 1.2rem;">${book.title}</div>
          <div class="book-cover-author-badge">${book.author}</div>
        </div>
      </div>
      <div>
        <h2 style="font-family: var(--font-serif); font-size: 1.5rem; margin-bottom: 0.25rem;">${book.title}</h2>
        <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 1rem;">By <strong>${book.author}</strong></p>
        
        <div style="margin-bottom: 1rem;">
          <span class="availability-pill ${availClass}">
            <span class="availability-indicator-dot"></span>
            ${availLabel}
          </span>
        </div>

        <p style="color: var(--text-main); font-size: 0.9rem; line-height: 1.6; margin-bottom: 1.25rem;">
          ${book.description || 'No detailed synopsis provided for this title.'}
        </p>

        <div class="detail-meta-list">
          <div class="detail-meta-row"><span>ISBN</span><span style="font-family: var(--font-mono);">${book.isbn}</span></div>
          <div class="detail-meta-row"><span>Discipline</span><span>${book.category}</span></div>
          <div class="detail-meta-row"><span>Publication Year</span><span>${book.year || 'N/A'}</span></div>
          <div class="detail-meta-row"><span>Shelf Location</span><span style="font-family: var(--font-mono);">${book.shelfLocation || 'General Stack'}</span></div>
          <div class="detail-meta-row"><span>All-time Borrow Count</span><span>${book.borrowCount || 0} times</span></div>
        </div>

        ${borrowersHtml}
      </div>
    `;

    const footer = document.getElementById('bookDetailFooter');
    if (isLibrarian) {
      footer.innerHTML = `
        <button type="button" class="btn btn-secondary" data-close-modal="bookDetailModal">Close</button>
        <button type="button" class="btn btn-primary" id="btnDetailEditBook">Edit Book</button>
      `;
      document.getElementById('btnDetailEditBook').addEventListener('click', () => {
        this.app.closeModal('bookDetailModal');
        this.openEditBookModal(book.id);
      });
    } else {
      const canBorrow = book.availableCopies > 0;
      footer.innerHTML = `
        <button type="button" class="btn btn-secondary" data-close-modal="bookDetailModal">Close</button>
        <button type="button" class="btn btn-primary" id="btnDetailBorrowBook" ${!canBorrow ? 'disabled' : ''}>
          ${canBorrow ? 'Borrow Book (14 Days)' : 'Currently Unavailable (0 Copies)'}
        </button>
      `;
      if (canBorrow) {
        document.getElementById('btnDetailBorrowBook').addEventListener('click', () => {
          this.handleBorrowBook(book.id);
        });
      }
    }

    this.app.openModal('bookDetailModal');
  }

  render() {
    const books = this.getFilteredBooks();
    const currentUser = store.getActiveUser();
    const isLibrarian = currentUser && currentUser.role === 'librarian';

    const totalAll = store.getBooks().length;
    const catBadge = document.getElementById('catalogueCountBadge');
    if (catBadge) catBadge.textContent = totalAll;

    const countText = document.getElementById('catalogueResultsCount');
    if (countText) {
      countText.textContent = `Showing ${books.length} of ${totalAll} titles in collection`;
    }

    const emptyState = document.getElementById('catalogueEmptyState');
    if (emptyState) {
      if (books.length === 0) emptyState.classList.remove('hidden');
      else emptyState.classList.add('hidden');
    }

    const gridContainer = document.getElementById('booksGridContainer');
    if (gridContainer) {
      gridContainer.innerHTML = books.map(book => {
        const bgStyle = book.coverUrl
          ? `background-image: url('${book.coverUrl}'); background-size: cover;`
          : `background: ${COVER_GRADIENTS[book.coverStyle] || COVER_GRADIENTS['tech-deep']};`;

        const availClass = book.availableCopies === 0 ? 'out-of-stock' : book.availableCopies === 1 ? 'low-stock' : 'in-stock';
        const availLabel = book.availableCopies === 0 ? 'Checked Out (0 left)' : `${book.availableCopies} of ${book.totalCopies} Available`;
        const canBorrow = book.availableCopies > 0;

        let actionsHtml = '';
        if (isLibrarian) {
          actionsHtml = `
            <div class="librarian-btn-group">
              <button type="button" class="icon-btn btn-edit-book" data-book-id="${book.id}" title="Edit Book Details">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              </button>
              <button type="button" class="icon-btn btn-delete btn-delete-book" data-book-id="${book.id}" title="Delete Book">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
            <button type="button" class="btn btn-secondary btn-sm btn-view-book" data-book-id="${book.id}">Details</button>
          `;
        } else {
          actionsHtml = `
            <button type="button" class="btn btn-secondary btn-sm btn-view-book" data-book-id="${book.id}">Details</button>
            <button type="button" class="btn btn-primary btn-sm btn-borrow-book" data-book-id="${book.id}" ${!canBorrow ? 'disabled' : ''}>
              ${canBorrow ? 'Borrow' : 'Out of Stock'}
            </button>
          `;
        }

        return `
          <div class="book-card" data-book-id="${book.id}">
            <div class="book-card-cover-wrap" style="${bgStyle}">
              <div class="book-cover-gradient" style="background: linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.2) 60%, transparent 100%);">
                <div class="book-cover-spine"></div>
                <div class="book-badge-category">${book.category}</div>
                <div>
                  <div class="book-cover-title-badge">${book.title}</div>
                  <div class="book-cover-author-badge">${book.author}</div>
                </div>
              </div>
            </div>

            <div class="book-card-body">
              <h3 class="book-title btn-view-book" data-book-id="${book.id}">${book.title}</h3>
              <div class="book-author">by ${book.author}</div>
              <p class="book-description-snippet">${book.description || 'No description available.'}</p>
              
              <div class="book-meta-pills">
                <span class="meta-pill" title="Shelf Location">${book.shelfLocation || 'STACK'}</span>
                <span class="meta-pill" title="Year">${book.year || 'N/A'}</span>
                <span class="meta-pill" title="Circulation Count">★ ${book.borrowCount || 0} borrowed</span>
              </div>

              <div style="margin-bottom: 0.75rem;">
                <span class="availability-pill ${availClass}">
                  <span class="availability-indicator-dot"></span>
                  ${availLabel}
                </span>
              </div>

              <div class="book-card-footer">
                ${actionsHtml}
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    const tableTbody = document.getElementById('booksTableTbody');
    if (tableTbody) {
      tableTbody.innerHTML = books.map(book => {
        const availClass = book.availableCopies === 0 ? 'out-of-stock' : book.availableCopies === 1 ? 'low-stock' : 'in-stock';
        const availLabel = `${book.availableCopies} / ${book.totalCopies}`;

        let actionCell = '';
        if (isLibrarian) {
          actionCell = `
            <div style="display: flex; gap: 0.4rem;">
              <button type="button" class="btn btn-secondary btn-sm btn-edit-book" data-book-id="${book.id}">Edit</button>
              <button type="button" class="btn btn-danger btn-sm btn-delete-book" data-book-id="${book.id}">Delete</button>
            </div>
          `;
        } else {
          actionCell = `
            <button type="button" class="btn btn-primary btn-sm btn-borrow-book" data-book-id="${book.id}" ${book.availableCopies <= 0 ? 'disabled' : ''}>
              ${book.availableCopies > 0 ? 'Borrow' : 'Unavailable'}
            </button>
          `;
        }

        return `
          <tr>
            <td>
              <div style="width: 38px; height: 50px; border-radius: 4px; background: ${COVER_GRADIENTS[book.coverStyle] || '#333'}; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 0.65rem; font-weight: 700; text-align: center; padding: 2px;">
                ${book.category.split(' ')[0]}
              </div>
            </td>
            <td>
              <strong class="btn-view-book" data-book-id="${book.id}" style="cursor: pointer; color: var(--text-main);">${book.title}</strong>
              <div style="font-size: 0.76rem; color: var(--text-faint);">${book.year || ''}</div>
            </td>
            <td>${book.author}</td>
            <td><code style="font-family: var(--font-mono); font-size: 0.8rem;">${book.isbn}</code></td>
            <td><span class="meta-pill">${book.category}</span></td>
            <td><span style="font-family: var(--font-mono); font-size: 0.8rem;">${book.shelfLocation}</span></td>
            <td>
              <span class="availability-pill ${availClass}">
                <span class="availability-indicator-dot"></span>
                ${availLabel}
              </span>
            </td>
            <td>${book.borrowCount || 0} loans</td>
            <td>${actionCell}</td>
          </tr>
        `;
      }).join('');
    }

    this.attachCardEvents();
  }

  attachCardEvents() {
    document.querySelectorAll('.btn-view-book').forEach(btn => {
      btn.addEventListener('click', () => {
        const bookId = btn.getAttribute('data-book-id');
        this.openBookDetail(bookId);
      });
    });

    document.querySelectorAll('.btn-borrow-book').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const bookId = btn.getAttribute('data-book-id');
        this.handleBorrowBook(bookId);
      });
    });

    document.querySelectorAll('.btn-edit-book').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const bookId = btn.getAttribute('data-book-id');
        this.openEditBookModal(bookId);
      });
    });

    document.querySelectorAll('.btn-delete-book').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const bookId = btn.getAttribute('data-book-id');
        this.handleDeleteBook(bookId);
      });
    });
  }
}

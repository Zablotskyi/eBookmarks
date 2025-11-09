// Basic SPA logic
const API_BASE = 'http://localhost:3001/api';

const qs = (sel, el = document) => el.querySelector(sel);
const qsa = (sel, el = document) => [...el.querySelectorAll(sel)];

const state = {
    books: [],
    selectedBookId: null,
    bookmarks: [],
    globalResults: { books: [], bookmarks: [] },
};

// ---------- Theme toggle ----------
(function initTheme() {
    const toggle = qs('#themeToggle');
    const label = qs('#themeLabel');
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
        document.documentElement.classList.add('dark');
        toggle.checked = true;
        label.textContent = 'Dark';
    }
    toggle.addEventListener('change', () => {
        document.documentElement.classList.toggle('dark', toggle.checked);
        const mode = toggle.checked ? 'dark' : 'light';
        localStorage.setItem('theme', mode);
        label.textContent = toggle.checked ? 'Dark' : 'Light';
    });
})();

// ---------- Small helpers ----------
async function api(path, opts = {}) {
    const res = await fetch(API_BASE + path, {
        headers: { 'Content-Type': 'application/json' },
        ...opts,
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'HTTP ' + res.status);
    }
    return res.json();
}

// Date helpers
function toDateInputValue(value) {
    if (!value) return '';
    const d = (value instanceof Date) ? value : new Date(value);
    if (isNaN(d.getTime())) return '';
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
function displayDate(value) {
    const s = toDateInputValue(value);
    return s || '-';
}

// Unified book selection for bookmarks section
function selectBookForBookmark(bookId, { scroll = true } = {}) {
    state.selectedBookId = bookId;
    loadBookmarks(bookId);
    const sel = qs('#bmBookId');
    if (sel) sel.value = String(bookId);
    if (scroll) {
        document.querySelector('.bookmarks')?.scrollIntoView({ behavior: 'smooth' });
    }
    setTimeout(() => qs('#bmPage')?.focus(), 0);
}

// ---------- Books ----------
async function loadBooks() {
    state.books = await api('/books');
    renderBooks();
    fillBookSelect();
    if (!state.selectedBookId && state.books.length) {
        selectBookForBookmark(state.books[0].id, { scroll: false });
    }
}

function renderBooks() {
    const list = qs('#bookList');
    list.innerHTML = '';
    state.books.forEach((b) => {
        const li = document.createElement('li');
        li.innerHTML = `
      <span>${b.title} <small>(${b.year})</small></span>
      <span>
        <button data-edit="${b.id}">✏️</button>
        <button data-del="${b.id}">🗑️</button>
      </span>
    `;
        li.addEventListener('click', (e) => {
            if (e.target.closest('button')) return;
            selectBookForBookmark(b.id);
        });
        list.appendChild(li);
    });
    qsa('button[data-edit]').forEach((btn) => btn.addEventListener('click', onEditBook));
    qsa('button[data-del]').forEach((btn) => btn.addEventListener('click', onDeleteBook));
}

function fillBookSelect() {
    const sel = qs('#bmBookId');
    sel.innerHTML = '';
    state.books.forEach((b) => {
        const opt = document.createElement('option');
        opt.value = b.id;
        opt.textContent = b.title;
        sel.appendChild(opt);
    });
    if (state.selectedBookId) sel.value = String(state.selectedBookId);
}

// ---------- Bookmarks ----------
async function loadBookmarks(bookId) {
    state.bookmarks = await api('/bookmarks?book_id=' + bookId);
    renderBookmarks();
}

function renderBookmarks() {
    const wrap = qs('#bookmarkList');
    wrap.innerHTML = '';
    state.bookmarks.forEach((bm) => {
        const div = document.createElement('div');
        div.className = 'card';
        const book = state.books.find((b) => b.id === bm.book_id);
        div.innerHTML = `
      <strong>${book ? book.title : 'Book'} — стр. ${bm.page}</strong>
      <p>${bm.summary}</p>
      <div class="row">
        <button data-bm-edit="${bm.id}">Редагувати</button>
        <button data-bm-del="${bm.id}">Видалити</button>
      </div>
    `;
        wrap.appendChild(div);
    });
    qsa('button[data-bm-edit]').forEach((btn) => btn.addEventListener('click', onEditBookmark));
    qsa('button[data-bm-del]').forEach((btn) => btn.addEventListener('click', onDeleteBookmark));
}

// ---------- Global Search ----------
async function onGlobalSearch() {
    const q = qs('#globalSearchInput').value.trim();
    if (!q) {
        qs('#globalResults').innerHTML = '<em>Введіть запит</em>';
        return;
    }
    state.globalResults = await api('/search?q=' + encodeURIComponent(q));
    renderGlobalResults();
}

function renderGlobalResults() {
    const box = qs('#globalResults');
    const { books, bookmarks } = state.globalResults;
    box.innerHTML = '';

    const makeCard = (title, body) => {
        const div = document.createElement('div');
        div.className = 'card';
        div.innerHTML = `<strong>${title}</strong><div>${body}</div>`;
        return div;
    };

    if (books.length) {
        books.forEach((b) => {
            const div = makeCard(
                'Книга: ' + b.title + ' (' + b.year + ')',
                'Автор(и): ' + [b.author1, b.author2, b.author3, b.author4].filter(Boolean).join(', ')
            );
            div.style.cursor = 'pointer';
            div.addEventListener('click', () => {
                selectBookForBookmark(b.id);
            });
            box.appendChild(div);
        });
    }

    if (bookmarks.length) {
        bookmarks.forEach((bm) => {
            const book = state.books.find((b) => b.id === bm.book_id);
            const div = makeCard(
                'Теза у: ' + (book ? book.title : 'книзі #' + bm.book_id),
                'Сторінка ' + bm.page + ': ' + bm.summary
            );
            box.appendChild(div);
        });
    }

    if (!books.length && !bookmarks.length) {
        box.innerHTML = '<em>Нічого не знайдено</em>';
    }
}

// ---------- Filters ----------
async function onFilterSubmit(e) {
    e.preventDefault();
    const data = new FormData(e.target);
    const params = new URLSearchParams();
    for (const [k, v] of data.entries()) {
        if (v) params.append(k, v);
    }
    const items = await api('/books/filter?' + params.toString());
    const r = qs('#results');
    r.innerHTML = '';
    items.forEach((b) => {
        const div = document.createElement('div');
        div.className = 'card';
        div.innerHTML = `
      <strong>${b.title} (${b.year})</strong>
      <div>Автор(и): ${[b.author1, b.author2, b.author3, b.author4].filter(Boolean).join(', ')}</div>
      <div>Початок читання: ${displayDate(b.start_date)}; Закінчення читання: ${displayDate(b.end_date)}</div>
      <div class="row"><button data-edit="${b.id}">✏️</button></div>
    `;
        r.appendChild(div);
    });
    qsa('#results button[data-edit]').forEach((btn) => btn.addEventListener('click', onEditBook));
}

function resetFilters() {
    qs('#filterForm').reset();
    qs('#results').innerHTML = '';
}

// ---------- Create/Edit Book (modal) ----------
const bookModal = qs('#bookModal');
const bookForm = qs('#bookForm');
const bookModalTitle = qs('#bookModalTitle');

// Перейменувати підписи полів дат у модалці та в блоці фільтрів
(function renameDateLabels() {
    const startLblModal = bookForm?.elements?.start_date?.closest('label');
    const endLblModal = bookForm?.elements?.end_date?.closest('label');
    if (startLblModal) startLblModal.firstChild.nodeValue = 'Початок читання ';
    if (endLblModal) endLblModal.firstChild.nodeValue = 'Закінчення читання ';

    const filterForm = qs('#filterForm');
    if (filterForm) {
        const startInput = filterForm.querySelector('input[name="start_date"]');
        const endInput = filterForm.querySelector('input[name="end_date"]');
        const startLbl = startInput?.closest('label');
        const endLbl = endInput?.closest('label');
        if (startLbl) startLbl.firstChild.nodeValue = 'Початок читання ';
        if (endLbl) endLbl.firstChild.nodeValue = 'Закінчення читання ';
    }
})();

qs('#addBookOpen').addEventListener('click', () => openBookModal());
bookForm.addEventListener('submit', onBookSave);

function openBookModal(book) {
    bookForm.reset();
    if (book) {
        bookModalTitle.textContent = 'Редагувати книгу';
        bookForm.elements.id.value = book.id;
        bookForm.elements.title.value = book.title;
        bookForm.elements.year.value = book.year;
        bookForm.elements.author1.value = book.author1;
        bookForm.elements.author2.value = book.author2 || '';
        bookForm.elements.author3.value = book.author3 || '';
        bookForm.elements.author4.value = book.author4 || '';
        bookForm.elements.start_date.value = toDateInputValue(book.start_date);
        bookForm.elements.end_date.value = toDateInputValue(book.end_date);
    } else {
        bookModalTitle.textContent = 'Нова книга';
    }
    bookModal.showModal();
}

function onEditBook(e) {
    e.stopPropagation();
    const id = Number(e.currentTarget.dataset.edit);
    const book = state.books.find((b) => b.id === id);
    if (book) openBookModal(book);
}

async function onDeleteBook(e) {
    e.stopPropagation();
    const id = Number(e.currentTarget.dataset.del);
    if (!confirm('Видалити книгу?')) return;
    await api('/books/' + id, { method: 'DELETE' });
    await loadBooks();
    qs('#results').innerHTML = '';
}

// ---------- Save book ----------
async function onBookSave(e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(bookForm).entries());
    const payload = {
        title: data.title,
        year: Number(data.year),
        author1: data.author1,
        author2: data.author2 || null,
        author3: data.author3 || null,
        author4: data.author4 || null,
        start_date: data.start_date ? data.start_date : null,
        end_date: data.end_date ? data.end_date : null,
    };
    if (data.id) {
        await api('/books/' + data.id, { method: 'PUT', body: JSON.stringify(payload) });
    } else {
        await api('/books', { method: 'POST', body: JSON.stringify(payload) });
    }
    bookModal.close();
    await loadBooks();
}

// ---------- Bookmark form ----------
qs('#bookmarkForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const book_id = Number(qs('#bmBookId').value);
    const page = Number(qs('#bmPage').value);
    const summary = qs('#bmSummary').value.trim();
    if (!book_id || !page || !summary) {
        alert('Заповніть всі поля');
        return;
    }
    await api('/bookmarks', { method: 'POST', body: JSON.stringify({ book_id, page, summary }) });
    // очистити поля
    qs('#bmPage').value = '';
    qs('#bmSummary').value = '';
    await loadBookmarks(book_id);
    // ✅ повернути фокус у "Номер сторінки" і виділити (щоб одразу вводити нове число)
    const pageEl = qs('#bmPage');
    if (pageEl) {
        pageEl.focus();
        pageEl.select();
    }
});

function onEditBookmark(e) {
    const id = Number(e.currentTarget.dataset.bmEdit);
    const bm = state.bookmarks.find((b) => b.id === id);
    if (!bm) return;
    const summary = prompt('Змініть тези:', bm.summary);
    if (summary == null) return;
    const pageStr = prompt('Сторінка:', bm.page);
    if (pageStr == null) return;
    const page = Number(pageStr);
    const book_id = bm.book_id;
    api('/bookmarks/' + id, { method: 'PUT', body: JSON.stringify({ book_id, page, summary }) })
        .then(() => loadBookmarks(book_id))
        .catch((err) => alert(err.message));
}

async function onDeleteBookmark(e) {
    const id = Number(e.currentTarget.dataset.bmDel);
    const bm = state.bookmarks.find((b) => b.id === id);
    if (!bm) return;
    if (!confirm('Видалити закладку?')) return;
    await api('/bookmarks/' + id, { method: 'DELETE' });
    await loadBookmarks(bm.book_id);
}

// ---------- Wire up ----------
qs('#globalSearchBtn').addEventListener('click', onGlobalSearch);
qs('#globalSearchInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        onGlobalSearch();
    }
});
qs('#filterForm').addEventListener('submit', onFilterSubmit);
qs('#resetFilters').addEventListener('click', resetFilters);

// ---------- Init ----------
loadBooks().catch((err) => alert('Помилка завантаження книг: ' + err.message));

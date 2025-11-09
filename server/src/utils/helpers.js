export function buildLikeQuery(value) {
  const v = (value || '').toLowerCase().trim();
  if (!v) return null;
  return '%' + v.split(/\s+/).join('%') + '%';
}

export function mapBook(row) {
  return {
    id: row.id,
    title: row.title,
    year: row.year,
    author1: row.author1,
    author2: row.author2,
    author3: row.author3,
    author4: row.author4,
    start_date: row.start_date,
    end_date: row.end_date,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

export function mapBookmark(row) {
  return {
    id: row.id,
    book_id: row.book_id,
    page: row.page,
    summary: row.summary,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

type Props = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export function Pagination({ page, totalPages, onPageChange }: Props) {
  return (
    <nav className="pagination" aria-label="Paginação">
      <button
        type="button"
        className="btn btn-sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        ← Anterior
      </button>
      <span className="pagination-info">
        Página <strong>{page}</strong> de <strong>{totalPages}</strong>
      </span>
      <button
        type="button"
        className="btn btn-sm"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Próxima →
      </button>
    </nav>
  );
}

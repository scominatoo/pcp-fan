type Props = {
  message?: string;
};

export function LoadingState({ message = 'Carregando…' }: Props) {
  return (
    <div className="state state-loading" role="status">
      <span className="state-spinner" aria-hidden />
      {message}
    </div>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="state state-empty">
      <p className="state-title">{title}</p>
      {description && <p className="state-desc">{description}</p>}
    </div>
  );
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  atualizarProduto,
  criarProduto,
  listarClassificacoes,
  listarGrupos,
  obterProduto,
} from '../../api/produtos';

export function ProdutoFormPage() {
  const { id } = useParams();
  const isNovo = id === 'novo';
  const produtoId = isNovo ? null : Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [grupoCodigo, setGrupoCodigo] = useState(1);
  const [classificacaoCodigo, setClassificacaoCodigo] = useState(1);
  const [itemCodigo, setItemCodigo] = useState(1);
  const [descricao, setDescricao] = useState('');
  const [unidade, setUnidade] = useState('');
  const [desenhoSparta, setDesenhoSparta] = useState('');
  const [desenhoCliente, setDesenhoCliente] = useState('');
  const [planejamento, setPlanejamento] = useState('');

  const { data: produto } = useQuery({
    queryKey: ['produto', produtoId],
    queryFn: () => obterProduto(produtoId!),
    enabled: produtoId != null && !Number.isNaN(produtoId),
  });

  const { data: grupos } = useQuery({
    queryKey: ['produto-grupos'],
    queryFn: listarGrupos,
  });

  const { data: classificacoes } = useQuery({
    queryKey: ['produto-classificacoes'],
    queryFn: listarClassificacoes,
  });

  useEffect(() => {
    if (produto) {
      setGrupoCodigo(produto.grupoCodigo);
      setClassificacaoCodigo(produto.classificacaoCodigo);
      setItemCodigo(produto.itemCodigo);
      setDescricao(produto.descricao);
      setUnidade(produto.unidade ?? '');
      setDesenhoSparta(produto.desenhoSparta ?? '');
      setDesenhoCliente(produto.desenhoCliente ?? '');
      setPlanejamento(produto.planejamento ?? '');
    }
  }, [produto]);

  const salvar = useMutation({
    mutationFn: async () => {
      const payload = {
        grupoCodigo,
        classificacaoCodigo,
        itemCodigo,
        descricao,
        unidade: unidade || undefined,
        desenhoSparta: desenhoSparta || undefined,
        desenhoCliente: desenhoCliente || undefined,
        planejamento: planejamento || undefined,
      };
      if (isNovo) return criarProduto(payload);
      return atualizarProduto(produtoId!, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      navigate('/produtos');
    },
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    salvar.mutate();
  }

  return (
    <section className="card">
      <div className="toolbar">
        <h2>{isNovo ? 'Novo produto' : `Editar produto ${produto?.codigo ?? ''}`}</h2>
        <Link to="/produtos" className="link">
          Voltar
        </Link>
      </div>

      <form className="form" onSubmit={onSubmit}>
        <div className="form-row">
          <label>
            Grupo
            <select
              value={grupoCodigo}
              onChange={(e) => setGrupoCodigo(Number(e.target.value))}
              disabled={!isNovo}
            >
              {grupos?.map((g) => (
                <option key={g.id} value={g.codigo}>
                  {g.codigo} — {g.descricao}
                </option>
              ))}
            </select>
          </label>
          <label>
            Classificação
            <select
              value={classificacaoCodigo}
              onChange={(e) => setClassificacaoCodigo(Number(e.target.value))}
              disabled={!isNovo}
            >
              {classificacoes?.map((c) => (
                <option key={c.id} value={c.codigo}>
                  {c.codigo} — {c.descricao}
                </option>
              ))}
            </select>
          </label>
          <label>
            Item
            <input
              type="number"
              min={1}
              max={99999}
              value={itemCodigo}
              onChange={(e) => setItemCodigo(Number(e.target.value))}
              disabled={!isNovo}
              required
            />
          </label>
        </div>

        <label>
          Descrição *
          <input
            type="text"
            maxLength={40}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            required
          />
        </label>

        <div className="form-row">
          <label>
            Unidade
            <input
              type="text"
              maxLength={3}
              value={unidade}
              onChange={(e) => setUnidade(e.target.value)}
            />
          </label>
          <label>
            Planejamento
            <input
              type="text"
              maxLength={1}
              value={planejamento}
              onChange={(e) => setPlanejamento(e.target.value)}
            />
          </label>
        </div>

        <div className="form-row">
          <label>
            Desenho Sparta
            <input
              type="text"
              maxLength={15}
              value={desenhoSparta}
              onChange={(e) => setDesenhoSparta(e.target.value)}
            />
          </label>
          <label>
            Desenho cliente
            <input
              type="text"
              maxLength={15}
              value={desenhoCliente}
              onChange={(e) => setDesenhoCliente(e.target.value)}
            />
          </label>
        </div>

        {salvar.isError && (
          <p className="erro">{(salvar.error as Error).message}</p>
        )}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={salvar.isPending}>
            {salvar.isPending ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </section>
  );
}

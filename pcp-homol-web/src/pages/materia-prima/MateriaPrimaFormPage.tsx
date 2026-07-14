import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  atualizarMateriaPrima,
  criarMateriaPrima,
  obterMateriaPrima,
} from '../../api/materia-prima';

export function MateriaPrimaFormPage() {
  const { id } = useParams();
  const isNovo = id === 'novo';
  const mpId = isNovo ? null : Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [classeLetra, setClasseLetra] = useState('I');
  const [classeNumero, setClasseNumero] = useState(1);
  const [itemCodigo, setItemCodigo] = useState(1);
  const [descricao, setDescricao] = useState('');
  const [unidade, setUnidade] = useState('');
  const [qualidade, setQualidade] = useState('');
  const [dureza, setDureza] = useState('');

  const { data: mp } = useQuery({
    queryKey: ['materia-prima-item', mpId],
    queryFn: () => obterMateriaPrima(mpId!),
    enabled: mpId != null && !Number.isNaN(mpId),
  });

  useEffect(() => {
    if (mp) {
      setClasseLetra(mp.classeLetra);
      setClasseNumero(mp.classeNumero);
      setItemCodigo(mp.itemCodigo);
      setDescricao(mp.descricao);
      setUnidade(mp.unidade ?? '');
      setQualidade(mp.qualidade ?? '');
      setDureza(mp.dureza ?? '');
    }
  }, [mp]);

  const salvar = useMutation({
    mutationFn: async () => {
      const payload = {
        classeLetra,
        classeNumero,
        itemCodigo,
        descricao,
        unidade: unidade || undefined,
        qualidade: qualidade || undefined,
        dureza: dureza || undefined,
      };
      if (isNovo) return criarMateriaPrima(payload);
      return atualizarMateriaPrima(mpId!, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materia-prima'] });
      navigate('/materia-prima');
    },
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    salvar.mutate();
  }

  return (
    <section className="card">
      <div className="toolbar">
        <h2>
          {isNovo ? 'Nova matéria-prima' : `Editar ${mp?.codigo ?? ''}`}
        </h2>
        <Link to="/materia-prima" className="link">
          Voltar
        </Link>
      </div>

      <form className="form" onSubmit={onSubmit}>
        <div className="form-row">
          <label>
            Classe (letra)
            <input
              type="text"
              maxLength={1}
              value={classeLetra}
              onChange={(e) => setClasseLetra(e.target.value.toUpperCase())}
              disabled={!isNovo}
              required
            />
          </label>
          <label>
            Classe (nº)
            <input
              type="number"
              min={0}
              max={99}
              value={classeNumero}
              onChange={(e) => setClasseNumero(Number(e.target.value))}
              disabled={!isNovo}
              required
            />
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
            Qualidade
            <input
              type="text"
              maxLength={10}
              value={qualidade}
              onChange={(e) => setQualidade(e.target.value)}
            />
          </label>
          <label>
            Dureza
            <input
              type="text"
              maxLength={10}
              value={dureza}
              onChange={(e) => setDureza(e.target.value)}
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

import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { MateriaPrimaFormPage } from './pages/materia-prima/MateriaPrimaFormPage';
import { MateriaPrimaPage } from './pages/materia-prima/MateriaPrimaPage';
import { OrdemProducaoDetailPage } from './pages/ordens-producao/OrdemProducaoDetailPage';
import { OrdemProducaoEmissaoPage } from './pages/ordens-producao/OrdemProducaoEmissaoPage';
import { OrdemProducaoFormPage } from './pages/ordens-producao/OrdemProducaoFormPage';
import { OrdensProducaoPage } from './pages/ordens-producao/OrdensProducaoPage';
import { ProgramacaoDetailPage } from './pages/programacao/ProgramacaoDetailPage';
import { ProgramacaoFormPage } from './pages/programacao/ProgramacaoFormPage';
import { ProgramacaoPage } from './pages/programacao/ProgramacaoPage';
import { RelatorioPage } from './pages/relatorios/RelatorioPage';
import { RelatoriosHubPage } from './pages/relatorios/RelatoriosHubPage';
import { ProdutoFormPage } from './pages/produtos/ProdutoFormPage';
import { ProdutosPage } from './pages/produtos/ProdutosPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="produtos" element={<ProdutosPage />} />
          <Route path="produtos/:id" element={<ProdutoFormPage />} />
          <Route path="materia-prima" element={<MateriaPrimaPage />} />
          <Route path="materia-prima/:id" element={<MateriaPrimaFormPage />} />
          <Route path="ordens-producao" element={<OrdensProducaoPage />} />
          <Route path="ordens-producao/novo" element={<OrdemProducaoFormPage />} />
          <Route
            path="ordens-producao/:id/emissao"
            element={<OrdemProducaoEmissaoPage />}
          />
          <Route path="ordens-producao/:id" element={<OrdemProducaoDetailPage />} />
          <Route path="programacao" element={<ProgramacaoPage />} />
          <Route path="programacao/novo" element={<ProgramacaoFormPage />} />
          <Route path="programacao/:id" element={<ProgramacaoDetailPage />} />
          <Route path="relatorios" element={<RelatoriosHubPage />} />
          <Route path="relatorios/:tipo" element={<RelatorioPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { Layout } from './components/Layout';
import { PERMISSOES_RELATORIOS, permissaoRelatorio } from './auth/permissoes';
import { RequireAuth } from './components/RequireAuth';
import {
  RequireFormPermission,
  RequirePermission,
} from './components/RequirePermission';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
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
import { ProcessoDetailPage } from './pages/processos/ProcessoDetailPage';
import { ProcessosPage } from './pages/processos/ProcessosPage';
import { ProdutoFormPage } from './pages/produtos/ProdutoFormPage';
import { ProdutosPage } from './pages/produtos/ProdutosPage';
import { ClienteDetailPage } from './pages/clientes/ClienteDetailPage';
import { ClientesPage } from './pages/clientes/ClientesPage';
import { TrocarSenhaPage } from './pages/TrocarSenhaPage';
import { UsuarioFormPage } from './pages/usuarios/UsuarioFormPage';
import { UsuariosPage } from './pages/usuarios/UsuariosPage';

/** Cada relatório tem a sua permissão. */
function RelatorioRoute() {
  const { tipo } = useParams();
  return (
    <RequirePermission perm={permissaoRelatorio(tipo ?? '')}>
      <RelatorioPage />
    </RequirePermission>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<RequireAuth />}>
            <Route element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="produtos" element={<RequirePermission perm="produtos.ver"><ProdutosPage /></RequirePermission>} />
              <Route path="produtos/:id" element={<RequireFormPermission modulo="produtos"><ProdutoFormPage /></RequireFormPermission>} />
              <Route path="processos" element={<RequirePermission perm="processos.ver"><ProcessosPage /></RequirePermission>} />
              <Route path="processos/:id" element={<RequirePermission perm="processos.ver"><ProcessoDetailPage /></RequirePermission>} />
              <Route path="materia-prima" element={<RequirePermission perm="materia_prima.ver"><MateriaPrimaPage /></RequirePermission>} />
              <Route path="materia-prima/:id" element={<RequireFormPermission modulo="materia_prima"><MateriaPrimaFormPage /></RequireFormPermission>} />
              <Route path="clientes" element={<RequirePermission perm="clientes.ver"><ClientesPage /></RequirePermission>} />
              <Route path="clientes/:id" element={<RequirePermission perm="clientes.ver"><ClienteDetailPage /></RequirePermission>} />
              <Route path="ordens-producao" element={<RequirePermission perm="ordens_producao.ver"><OrdensProducaoPage /></RequirePermission>} />
              <Route
                path="ordens-producao/novo"
                element={<RequirePermission perm="ordens_producao.criar"><OrdemProducaoFormPage /></RequirePermission>}
              />
              <Route
                path="ordens-producao/:id/emissao"
                element={<RequirePermission perm="ordens_producao.imprimir"><OrdemProducaoEmissaoPage /></RequirePermission>}
              />
              <Route
                path="ordens-producao/:id"
                element={<RequirePermission perm="ordens_producao.ver"><OrdemProducaoDetailPage /></RequirePermission>}
              />
              <Route path="programacao" element={<RequirePermission perm="programacao.ver"><ProgramacaoPage /></RequirePermission>} />
              <Route path="programacao/novo" element={<RequirePermission perm="programacao.criar"><ProgramacaoFormPage /></RequirePermission>} />
              <Route path="programacao/:id" element={<RequirePermission perm="programacao.ver"><ProgramacaoDetailPage /></RequirePermission>} />
              <Route path="relatorios" element={<RequirePermission perm={PERMISSOES_RELATORIOS}><RelatoriosHubPage /></RequirePermission>} />
              <Route path="relatorios/:tipo" element={<RelatorioRoute />} />
              <Route
                path="usuarios"
                element={
                  <RequirePermission perm="usuarios.gerenciar">
                    <UsuariosPage />
                  </RequirePermission>
                }
              />
              <Route
                path="usuarios/:id"
                element={
                  <RequirePermission perm="usuarios.gerenciar">
                    <UsuarioFormPage />
                  </RequirePermission>
                }
              />
              <Route path="trocar-senha" element={<TrocarSenhaPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import NotFound from "./pages/NotFound.tsx";
import Auth from "./pages/Auth.tsx";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Overview from "./pages/dashboard/Overview.tsx";
import Rfqs from "./pages/dashboard/Rfqs.tsx";
import RfqDetail from "./pages/dashboard/RfqDetail.tsx";
import Propostas from "./pages/dashboard/Propostas.tsx";
import Contratos from "./pages/dashboard/Contratos.tsx";
import Projetos from "./pages/dashboard/Projetos.tsx";
import Fornecedores from "./pages/dashboard/Fornecedores.tsx";
import Compradores from "./pages/dashboard/Compradores.tsx";
import Notificacoes from "./pages/dashboard/Notificacoes.tsx";
import Configuracoes from "./pages/dashboard/Configuracoes.tsx";
import Suporte from "./pages/dashboard/Suporte.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            >
              <Route index element={<Overview />} />
              <Route path="cotacoes" element={<Rfqs />} />
              <Route path="cotacoes/:id" element={<RfqDetail />} />
              <Route path="propostas" element={<Propostas />} />
              <Route path="contratos" element={<Contratos />} />
              <Route path="projetos" element={<Projetos />} />
              <Route path="fornecedores" element={<Fornecedores />} />
              <Route path="compradores" element={<Compradores />} />
              <Route path="notificacoes" element={<Notificacoes />} />
              <Route path="configuracoes" element={<Configuracoes />} />
              <Route path="suporte" element={<Suporte />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

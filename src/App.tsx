import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ProjectManagement from "./pages/ProjectManagement";
import Trash from "./pages/Trash";
import Settings from "./pages/Settings";
import SettingsFeedback from "./pages/SettingsFeedback";
import SettingsAppearance from "./pages/SettingsAppearance";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HashRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/wiki" element={<Index />} />
          <Route path="/memo" element={<Index />} />
          <Route path="/issues" element={<Index />} />
          <Route path="/calendar" element={<Index />} />
          <Route path="/trash" element={<Trash />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/settings/projects" element={<ProjectManagement />} />
          <Route path="/settings/feedback" element={<SettingsFeedback />} />
          <Route path="/settings/appearance" element={<SettingsAppearance />} />
          <Route path="/projects" element={<Navigate to="/settings/projects" replace />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

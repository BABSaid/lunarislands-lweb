import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { Entreprises } from './pages/Entreprises';
import { Reglement } from './pages/Reglement';
import { Login } from './pages/Login';
import { StaffPanel } from './pages/StaffPanel';
import { ManagerPanel } from './pages/ManagerPanel';
import { AccountSettings } from './pages/AccountSettings';
import { PermissionsGuide } from './pages/PermissionsGuide';

function AppContent() {
  const location = useLocation();

  useEffect(() => {
    // Mettre à jour le titre de la page
    document.title = 'LunarisLands - Semi-RP';

    // Mettre à jour le favicon
    let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.getElementsByTagName('head')[0].appendChild(link);
    }
    link.href = 'https://i.imgur.com/Oo1ELPJ.png';
  }, []);

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/entreprises" element={<Entreprises />} />
        <Route path="/reglement" element={<Reglement />} />
        <Route path="/login" element={<Login />} />
        <Route path="/staff" element={<StaffPanel />} />
        <Route path="/manager" element={<ManagerPanel />} />
        <Route path="/gestion" element={<ManagerPanel />} />
        <Route path="/account-settings" element={<AccountSettings />} />
        <Route path="/permissions-guide" element={<PermissionsGuide />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
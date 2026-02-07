import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, LogOut, Save, BarChart3, Shield, Users, Home, Settings, BookOpen } from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { EmployeeManager } from '../components/EmployeeManager';
import { Dashboard } from '../components/Dashboard';

interface Entreprise {
  id: string;
  name: string;
  category: string;
  owner: string;
  description: string;
  specialty: string;
  status: string;
  createdAt: string;
}

interface Employee {
  id: string;
  email: string;
  name: string;
  role: string;
  grade: string;
  permissions: string[];
}

const GRADE_LABELS: Record<string, string> = {
  'patron': 'Patron',
  'co-gerant': 'Co-gérant',
  'employe-senior': 'Employé Senior',
  'employe': 'Employé',
  'player': 'Joueur'
};

export function ManagerPanel() {
  const [entreprise, setEntreprise] = useState<Entreprise | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'company' | 'employees'>('dashboard');
  const [formData, setFormData] = useState({
    description: '',
    specialty: '',
  });
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  const token = localStorage.getItem('token');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));

  useEffect(() => {
    const initializeData = async () => {
      // Get user from localStorage
      const localUser = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (!localUser.email) {
        navigate('/login');
        return;
      }

      // Set user immediately from localStorage
      setUser(localUser);
      console.log('📊 Current user from localStorage:', localUser);

      // Check if user has an entreprise
      if (!localUser.entrepriseId) {
        console.error('❌ No entrepriseId found for user');
        setLoading(false);
        return;
      }

      // Load entreprise and employees with current user data
      try {
        await loadEntreprise(localUser.entrepriseId);
        await loadEmployees(localUser.entrepriseId);
      } catch (error) {
        console.error('Failed to load data:', error);
        setLoading(false);
      }

      // Try to refresh user data from server in background (non-blocking)
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-dec47541/users/${encodeURIComponent(localUser.email)}`,
          {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
            },
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            // Update localStorage and state with fresh data
            localStorage.setItem('user', JSON.stringify(data.user));
            setUser(data.user);
            console.log('✅ User data refreshed in ManagerPanel:', data.user);
          }
        }
      } catch (error) {
        console.log('⚠️ Could not refresh user data from server (using cached data):', error);
      }
    };

    initializeData();
  }, []);

  const loadEntreprise = async (entrepriseId: string) => {
    try {
      console.log('📊 Loading entreprise:', entrepriseId);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-dec47541/manager/entreprise/${entrepriseId}`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Entreprise loaded:', data.entreprise);
        setEntreprise(data.entreprise);
        setFormData({
          description: data.entreprise.description,
          specialty: data.entreprise.specialty,
        });
      } else {
        console.error('❌ Failed to load entreprise:', response.status, await response.text());
      }
    } catch (error) {
      console.error('Load entreprise error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async (entrepriseId: string) => {
    try {
      console.log('📊 Loading employees for:', entrepriseId);
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-dec47541/manager/employees/${entrepriseId}`;
      console.log('📊 Request URL:', url);
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` },
      });

      console.log('📊 Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Employees loaded:', data.employees ? data.employees.length : 0);
        setEmployees(data.employees || []);
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to load employees:', response.status, errorText);
        console.error('❌ Full error response:', errorText);
        // Set empty array instead of throwing
        setEmployees([]);
      }
    } catch (error) {
      console.error('Fetch employees error:', error);
      console.error('Error details:', error instanceof Error ? error.message : String(error));
      // Set empty array instead of showing error
      setEmployees([]);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage('');

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-dec47541/manager/entreprise`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setEntreprise(data.entreprise);
        setSuccessMessage('Modifications enregistrées avec succès !');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Update error:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white text-xl">Chargement...</div>
      </div>
    );
  }

  if (!entreprise) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl mb-4">Aucune entreprise assignée</div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900 border-b border-amber-900/30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Building2 className="w-8 h-8 text-amber-500" />
              Panel de Gestion
            </h1>
            <p className="text-slate-400">Bienvenue, {user.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/permissions-guide')}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Guide</span>
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex items-center gap-3 mb-8 flex-wrap">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 ${activeTab === 'dashboard' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'} rounded-lg transition-colors flex items-center gap-2`}
          >
            <Home className="w-4 h-4" />
            <span>Tableau de bord</span>
          </button>
          <button
            onClick={() => setActiveTab('company')}
            className={`px-4 py-2 ${activeTab === 'company' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'} rounded-lg transition-colors flex items-center gap-2`}
          >
            <Building2 className="w-4 h-4" />
            <span>Entreprise</span>
          </button>
          <button
            onClick={() => setActiveTab('employees')}
            className={`px-4 py-2 ${activeTab === 'employees' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'} rounded-lg transition-colors flex items-center gap-2`}
          >
            <Users className="w-4 h-4" />
            <span>Employés</span>
          </button>
        </div>

        {/* Dashboard */}
        {activeTab === 'dashboard' && (
          <Dashboard 
            entrepriseId={entreprise.id} 
            entrepriseName={entreprise.name}
            employees={employees}
          />
        )}

        {/* Company Info */}
        {activeTab === 'company' && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-slate-900 border border-amber-900/30 rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-slate-400 text-sm">Statut</h3>
                  <BarChart3 className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-2xl font-bold text-white capitalize">{entreprise.status}</p>
              </div>

              <div className="bg-slate-900 border border-amber-900/30 rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-slate-400 text-sm">Catégorie</h3>
                  <Building2 className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-2xl font-bold text-white">{entreprise.category}</p>
              </div>

              <div className="bg-slate-900 border border-amber-900/30 rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-slate-400 text-sm">Créée le</h3>
                </div>
                <p className="text-2xl font-bold text-white">
                  {new Date(entreprise.createdAt).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>

            {/* Entreprise Info Card */}
            <div className="bg-slate-900 border border-amber-900/30 rounded-lg p-8 mb-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-amber-600/20 rounded-full flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-amber-500" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white">{entreprise.name}</h2>
                  <p className="text-slate-400">Propriétaire: {entreprise.owner}</p>
                </div>
              </div>

              <div className="bg-amber-600/10 border border-amber-600/30 rounded-lg p-4 mb-6">
                <p className="text-amber-400 text-sm">
                  💡 <strong>Note:</strong> Vous ne pouvez modifier que la description et la spécialité de votre entreprise. 
                  Pour d'autres modifications, contactez le staff sur Discord.
                </p>
              </div>

              {successMessage && (
                <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg mb-6">
                  {successMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Description de l'entreprise
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500 resize-none"
                    rows={4}
                    placeholder="Décrivez votre entreprise, ses services et ce qui la rend unique..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Spécialité
                  </label>
                  <input
                    type="text"
                    value={formData.specialty}
                    onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
                    placeholder="Ex: Construction, Commerce général, etc."
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full px-6 py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-800 text-white rounded-lg transition-colors font-semibold flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </button>
              </form>
            </div>

            {/* Info Box */}
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">Informations</h3>
              <div className="space-y-3 text-slate-300">
                <p>• Vos modifications seront visibles immédiatement sur le site public</p>
                <p>• Pour changer le nom, la catégorie ou le propriétaire, contactez le staff</p>
                <p>• Gardez vos informations à jour pour attirer plus de clients</p>
                <p>• En cas de problème, contactez le staff sur Discord</p>
              </div>
            </div>
          </>
        )}

        {/* Employee Manager */}
        {activeTab === 'employees' && (
          <div className="mt-8">
            <EmployeeManager entrepriseId={entreprise.id} userGrade={user.grade || 'player'} />
          </div>
        )}
      </div>
    </div>
  );
}
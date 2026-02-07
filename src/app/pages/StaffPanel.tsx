import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Building2, LogOut, Plus, Edit, Trash2, Shield, BookOpen } from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';

interface User {
  id: string;
  email: string;
  name: string;
  grade: 'staff' | 'membre';
  entrepriseId?: string | null;
  role?: string | null;
  permissions?: string[];
}

interface Entreprise {
  id: string;
  name: string;
  category: string;
  owner: string;
  description: string;
  specialty: string;
  status: string;
}

export function StaffPanel() {
  const [activeTab, setActiveTab] = useState<'entreprises' | 'users'>('entreprises');
  const [users, setUsers] = useState<User[]>([]);
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEntreprise, setSelectedEntreprise] = useState<Entreprise | null>(null);
  const navigate = useNavigate();

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (!token || user.grade !== 'staff') {
      navigate('/login');
      return;
    }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('🔄 Starting loadData...');
      
      // Utiliser les routes publiques pour récupérer les données
      const [usersRes, entreprisesRes] = await Promise.all([
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-dec47541/users`, {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        }),
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-dec47541/entreprises`, {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        }),
      ]);

      console.log('📡 Users response status:', usersRes.status);
      console.log('📡 Entreprises response status:', entreprisesRes.status);

      // Check if responses are ok
      if (!usersRes.ok) {
        console.error('❌ Users request failed:', usersRes.status, usersRes.statusText);
        const errorText = await usersRes.text();
        console.error('❌ Users error response:', errorText);
      }

      if (!entreprisesRes.ok) {
        console.error('❌ Entreprises request failed:', entreprisesRes.status, entreprisesRes.statusText);
        const errorText = await entreprisesRes.text();
        console.error('❌ Entreprises error response:', errorText);
      }

      const usersData = usersRes.ok ? await usersRes.json() : { users: [] };
      const entreprisesData = entreprisesRes.ok ? await entreprisesRes.json() : { entreprises: [] };

      console.log('📊 Users data:', usersData);
      console.log('🏢 Entreprises data:', entreprisesData);

      setUsers(usersData.users || []);
      setEntreprises(entreprisesData.entreprises || []);
      
      console.log('✅ State updated - Users count:', (usersData.users || []).length);
      console.log('✅ State updated - Entreprises count:', (entreprisesData.entreprises || []).length);
    } catch (error) {
      console.error('❌ Load data error:', error);
      // Set empty arrays on error
      setUsers([]);
      setEntreprises([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleDeleteEntreprise = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette entreprise ?')) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-dec47541/entreprises/${id}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        }
      );

      if (response.ok) {
        alert('✅ Entreprise supprimée !');
        loadData();
      } else {
        alert('❌ Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('❌ Erreur lors de la suppression');
    }
  };

  const handleInitEntreprises = async () => {
    if (!confirm('Voulez-vous initialiser les entreprises par défaut ? (Cela ne supprimera pas les entreprises existantes)')) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-dec47541/init-entreprises`,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}` 
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        alert(`✅ ${data.message}`);
        loadData();
      } else {
        alert('❌ Erreur lors de l\'initialisation');
      }
    } catch (error) {
      console.error('Init entreprises error:', error);
      alert('❌ Erreur lors de l\'initialisation');
    }
  };

  const handleUpdateRole = async (email: string, grade: string, role?: string, entrepriseId?: string) => {
    try {
      console.log('🔄 Updating user via public route:', email, { grade, role, entrepriseId });
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-dec47541/users/${encodeURIComponent(email)}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ grade, role, entrepriseId }),
        }
      );

      console.log('📡 Update response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ User updated successfully:', data);
        
        // Si l'utilisateur modifie son propre compte, mettre à jour localStorage
        if (email === user.email) {
          const updatedUser = {
            ...user,
            grade: data.user.grade,
            role: data.user.role,
            entrepriseId: data.user.entrepriseId,
            permissions: data.user.permissions
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          console.log('🔄 LocalStorage updated for current user');
        }
        
        alert('✅ Utilisateur mis à jour !');
        loadData();
      } else {
        const error = await response.json();
        console.error('❌ Update failed:', error);
        alert(`❌ Erreur: ${error.error || 'Échec de la mise à jour'}`);
      }
    } catch (error) {
      console.error('❌ Update user error:', error);
      alert('❌ Erreur lors de la mise à jour');
    }
  };

  const handleToggleStaff = async (email: string, currentGrade: string) => {
    const newGrade = currentGrade === 'staff' ? 'membre' : 'staff';
    const userToUpdate = users.find(u => u.email === email);
    await handleUpdateRole(email, newGrade, userToUpdate?.role, userToUpdate?.entrepriseId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white text-xl">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 pt-16">
      {/* Content - with padding top for fixed navbar */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                <Shield className="w-8 h-8 text-amber-500" />
                Panel Staff
              </h1>
              <p className="text-slate-400 mt-1">Bienvenue, {user.name}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/permissions-guide')}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <BookOpen className="w-4 h-4" />
                <span className="hidden sm:inline">Guide des Permissions</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('entreprises')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
              activeTab === 'entreprises'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Building2 className="w-5 h-5" />
            Entreprises ({entreprises.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
              activeTab === 'users'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Users className="w-5 h-5" />
            Utilisateurs ({users.length})
          </button>
        </div>

        {/* Entreprises Tab */}
        {activeTab === 'entreprises' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Gestion des Entreprises</h2>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter une entreprise
                </button>
                <button
                  onClick={handleInitEntreprises}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Initialiser entreprises
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading && <p className="text-white">Chargement...</p>}
              {!loading && entreprises.length === 0 && (
                <p className="text-slate-400 col-span-3">Aucune entreprise trouvée. Cliquez sur "Initialiser entreprises" pour ajouter les entreprises par défaut.</p>
              )}
              {entreprises.map((entreprise) => (
                <div
                  key={entreprise.id}
                  className="bg-slate-900 border border-amber-900/30 rounded-lg p-6"
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="bg-amber-600/20 text-amber-500 text-sm px-3 py-1 rounded-full">
                      {entreprise.category}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedEntreprise(entreprise);
                          setShowEditModal(true);
                        }}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteEntreprise(entreprise.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {entreprise.name}
                  </h3>
                  <p className="text-slate-400 text-sm mb-3">{entreprise.description}</p>
                  <div className="border-t border-slate-700 pt-3">
                    <p className="text-sm text-slate-500">
                      Propriétaire: <span className="text-amber-500">{entreprise.owner}</span>
                    </p>
                    <p className="text-sm text-slate-500">
                      Spécialité: <span className="text-white">{entreprise.specialty}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Gestion des Utilisateurs</h2>

            <div className="bg-slate-900 border border-amber-900/30 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Nom</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Staff</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Rôle</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Entreprise</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/50">
                      <td className="px-6 py-4 text-white">{u.name}</td>
                      <td className="px-6 py-4 text-slate-400">{u.email}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleStaff(u.email, u.grade)}
                          className={`px-4 py-1.5 rounded-lg font-medium transition-colors ${
                            u.grade === 'staff'
                              ? 'bg-green-600 hover:bg-green-700 text-white'
                              : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                          }`}
                        >
                          {u.grade === 'staff' ? 'Oui' : 'Non'}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={u.role || ''}
                          onChange={(e) => handleUpdateRole(u.email, u.grade, e.target.value || null, u.entrepriseId)}
                          className="bg-slate-700 text-white px-3 py-1.5 rounded border border-slate-600 focus:outline-none focus:border-amber-500"
                        >
                          <option value="">Aucun</option>
                          <option value="patron">Patron</option>
                          <option value="co-gerant">Co-Gérant</option>
                          <option value="employe-senior">Employé Senior</option>
                          <option value="employe">Employé</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        {u.role && u.role !== '' ? (
                          <select
                            value={u.entrepriseId || ''}
                            onChange={(e) => handleUpdateRole(u.email, u.grade, u.role, e.target.value || null)}
                            className="bg-slate-700 text-white px-3 py-1.5 rounded border border-slate-600 focus:outline-none focus:border-amber-500"
                          >
                            <option value="">Aucune</option>
                            {entreprises.map((e) => (
                              <option key={e.id} value={e.id}>
                                {e.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-slate-500 text-sm">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modals will be added here */}
      {showAddModal && (
        <AddEntrepriseModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadData();
          }}
          token={token}
        />
      )}

      {showEditModal && selectedEntreprise && (
        <EditEntrepriseModal
          entreprise={selectedEntreprise}
          onClose={() => {
            setShowEditModal(false);
            setSelectedEntreprise(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedEntreprise(null);
            loadData();
          }}
          token={token}
        />
      )}
    </div>
  );
}

// Add Entreprise Modal Component
function AddEntrepriseModal({ onClose, onSuccess, token }: any) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'Commerce',
    owner: '',
    description: '',
    specialty: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-dec47541/staff/entreprises`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (response.ok) {
        onSuccess();
      }
    } catch (error) {
      console.error('Create error:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-amber-900/30 rounded-lg p-6 max-w-md w-full">
        <h3 className="text-2xl font-bold text-white mb-4">Nouvelle Entreprise</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Nom</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Catégorie</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
            >
              <option>Commerce</option>
              <option>Artisanat</option>
              <option>Agriculture</option>
              <option>Minage & Ressources</option>
              <option>Sécurité</option>
              <option>Construction</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Propriétaire</label>
            <input
              type="text"
              value={formData.owner}
              onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
              rows={3}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Spécialité</label>
            <input
              type="text"
              value={formData.specialty}
              onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
              required
            />
          </div>
          <div className="flex gap-4">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
            >
              Créer
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit Entreprise Modal Component
function EditEntrepriseModal({ entreprise, onClose, onSuccess, token }: any) {
  const [formData, setFormData] = useState(entreprise);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      console.log('🔄 Updating entreprise:', entreprise.id, formData);
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-dec47541/entreprises/${entreprise.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(formData),
        }
      );

      console.log('📡 Response status:', response.status);
      const data = await response.json();
      console.log('📦 Response data:', data);

      if (response.ok) {
        alert('✅ Entreprise modifiée avec succès !');
        onSuccess();
      } else {
        alert('❌ Erreur lors de la modification');
      }
    } catch (error) {
      console.error('❌ Update error:', error);
      alert('❌ Erreur lors de la modification');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-amber-900/30 rounded-lg p-6 max-w-md w-full">
        <h3 className="text-2xl font-bold text-white mb-4">Modifier Entreprise</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Nom</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Catégorie</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
            >
              <option>Commerce</option>
              <option>Artisanat</option>
              <option>Agriculture</option>
              <option>Minage & Ressources</option>
              <option>Sécurité</option>
              <option>Construction</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Propriétaire</label>
            <input
              type="text"
              value={formData.owner}
              onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
              rows={3}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Spécialité</label>
            <input
              type="text"
              value={formData.specialty}
              onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
              required
            />
          </div>
          <div className="flex gap-4">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
            >
              Enregistrer
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
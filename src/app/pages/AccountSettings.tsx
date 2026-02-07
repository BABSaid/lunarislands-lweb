import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Shield, Calendar, Save, ArrowLeft } from 'lucide-react';

export function AccountSettings() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      navigate('/login');
      return;
    }
    setUser(JSON.parse(userStr));
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white text-xl">Chargement...</div>
      </div>
    );
  }

  const getGradeBadge = (grade: string) => {
    const badges = {
      staff: { label: 'Staff', color: 'bg-red-500/20 text-red-400 border-red-500/50' },
      membre: { label: 'Membre', color: 'bg-blue-500/20 text-blue-400 border-blue-500/50' }
    };
    return badges[grade as keyof typeof badges] || badges.membre;
  };

  const getRoleBadge = (role: string | null) => {
    if (!role) return { label: 'Sans emploi', color: 'bg-slate-500/20 text-slate-400 border-slate-500/50' };
    const badges = {
      patron: { label: 'Patron', color: 'bg-purple-500/20 text-purple-400 border-purple-500/50' },
      'co-gerant': { label: 'Co-gérant', color: 'bg-blue-500/20 text-blue-400 border-blue-500/50' },
      'employe-senior': { label: 'Employé Senior', color: 'bg-green-500/20 text-green-400 border-green-500/50' },
      employe: { label: 'Employé', color: 'bg-slate-500/20 text-slate-400 border-slate-500/50' }
    };
    return badges[role as keyof typeof badges] || { label: role, color: 'bg-slate-500/20 text-slate-400 border-slate-500/50' };
  };

  const gradeBadge = getGradeBadge(user?.grade);
  const roleBadge = getRoleBadge(user?.role);

  return (
    <div className="min-h-screen bg-slate-950 pt-20 pb-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-slate-400 hover:text-amber-500 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600/20 to-purple-600/20 border border-amber-900/30 rounded-lg p-8 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 bg-amber-600/20 rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-amber-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">{user?.name}</h1>
              <p className="text-slate-400">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${gradeBadge.color}`}>
              <Shield className="w-3 h-3 inline mr-1" />
              {gradeBadge.label}
            </span>
            {user?.role && (
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${roleBadge.color}`}>
                {roleBadge.label}
              </span>
            )}
          </div>
        </div>

        {/* Account Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-slate-900/50 rounded-lg border border-amber-900/30 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="w-6 h-6 text-amber-500" />
              <h2 className="text-xl font-bold text-white">Email</h2>
            </div>
            <p className="text-slate-300">{user?.email}</p>
            <p className="text-slate-500 text-sm mt-2">
              Votre adresse email ne peut pas être modifiée. Contactez le staff sur Discord pour toute modification.
            </p>
          </div>

          <div className="bg-slate-900/50 rounded-lg border border-amber-900/30 p-6">
            <div className="flex items-center gap-3 mb-4">
              <User className="w-6 h-6 text-amber-500" />
              <h2 className="text-xl font-bold text-white">Nom d'utilisateur</h2>
            </div>
            <p className="text-slate-300">{user?.name}</p>
            <p className="text-slate-500 text-sm mt-2">
              Votre nom d'utilisateur tel qu'il apparaît sur le serveur.
            </p>
          </div>

          <div className="bg-slate-900/50 rounded-lg border border-amber-900/30 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-purple-500" />
              <h2 className="text-xl font-bold text-white">Grade</h2>
            </div>
            <p className="text-slate-300">{gradeBadge.label}</p>
            <p className="text-slate-500 text-sm mt-2">
              {user?.grade === 'staff' && 'Grade Staff : Accès complet à toutes les fonctionnalités d\'administration du serveur.'}
              {user?.grade === 'membre' && 'Grade Membre : Accès joueur standard au serveur.'}
            </p>
          </div>

          <div className="bg-slate-900/50 rounded-lg border border-amber-900/30 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-6 h-6 text-blue-500" />
              <h2 className="text-xl font-bold text-white">Rôle dans l'entreprise</h2>
            </div>
            <p className="text-slate-300">{roleBadge.label}</p>
            <p className="text-slate-500 text-sm mt-2">
              {!user?.role && 'Vous n\'êtes actuellement membre d\'aucune entreprise.'}
              {user?.role === 'patron' && 'Patron : Contrôle total de votre entreprise.'}
              {user?.role === 'co-gerant' && 'Co-gérant : Gestion des membres de l\'entreprise.'}
              {user?.role === 'employe-senior' && 'Employé Senior : Consultation des statistiques et des membres.'}
              {user?.role === 'employe' && 'Employé : Accès basique à l\'entreprise.'}
            </p>
          </div>
        </div>

        {/* Company Information */}
        {user?.entrepriseId && (
          <div className="bg-slate-900/50 rounded-lg border border-amber-900/30 p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Entreprise</h2>
            <div className="bg-amber-600/10 border border-amber-600/30 rounded-lg p-4">
              <p className="text-amber-400 text-sm">
                Vous êtes membre d'une entreprise avec le grade de <strong>{gradeBadge.label}</strong>.
              </p>
              <p className="text-amber-400 text-xs mt-2">
                ID de l'entreprise : {user.entrepriseId}
              </p>
            </div>
          </div>
        )}

        {/* Security Notice */}
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4">Sécurité et Confidentialité</h3>
          <div className="space-y-3 text-slate-300">
            <p>• Vos informations personnelles sont sécurisées et ne sont jamais partagées avec des tiers.</p>
            <p>• Pour toute modification de vos informations, contactez le staff sur Discord.</p>
            <p>• En cas de problème de sécurité, contactez immédiatement l'équipe de modération.</p>
            <p>• Ne partagez jamais votre mot de passe avec qui que ce soit.</p>
          </div>
        </div>

        {/* Future Features Notice */}
        <div className="mt-8 bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
          <h3 className="text-xl font-bold text-blue-400 mb-4">🚧 Fonctionnalités à venir</h3>
          <div className="space-y-2 text-blue-300 text-sm">
            <p>• Modification du mot de passe</p>
            <p>• Personnalisation du profil (avatar, bio, etc.)</p>
            <p>• Historique des activités</p>
            <p>• Paramètres de notification</p>
          </div>
        </div>
      </div>
    </div>
  );
}
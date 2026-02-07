import { useState } from 'react';
import { Shield, Users, Building2, Eye, Edit, Trash2, ChevronDown, ChevronRight, Info, Lock, Unlock } from 'lucide-react';

const PERMISSIONS_DATA = {
  staff: {
    label: 'Staff (Administrateur)',
    color: 'red',
    icon: Shield,
    permissions: [
      { id: 'manage_all_entreprises', label: 'Gérer toutes les entreprises', description: 'Accès complet à toutes les entreprises du serveur' },
      { id: 'manage_users', label: 'Gérer tous les utilisateurs', description: 'Créer, modifier, supprimer des utilisateurs' },
      { id: 'view_all', label: 'Tout voir', description: 'Accès en lecture à toutes les données' },
      { id: 'manage_grades', label: 'Modifier les grades', description: 'Changer le grade de n\'importe quel employé' },
      { id: 'manage_members', label: 'Gérer les membres', description: 'Ajouter/retirer des employés' },
      { id: 'edit_entreprise', label: 'Modifier l\'entreprise', description: 'Changer les informations de l\'entreprise' },
      { id: 'view_stats', label: 'Voir les statistiques', description: 'Accès aux dashboards et statistiques' }
    ]
  },
  patron: {
    label: 'Patron (Propriétaire)',
    color: 'purple',
    icon: Building2,
    permissions: [
      { id: 'manage_grades', label: 'Modifier les grades', description: 'Promouvoir/rétrograder les employés de l\'entreprise' },
      { id: 'manage_members', label: 'Gérer les membres', description: 'Recruter et licencier des employés' },
      { id: 'edit_entreprise', label: 'Modifier l\'entreprise', description: 'Changer description, spécialité, etc.' },
      { id: 'view_stats', label: 'Voir les statistiques', description: 'Accès au dashboard complet' }
    ]
  },
  'co-gerant': {
    label: 'Co-gérant',
    color: 'blue',
    icon: Users,
    permissions: [
      { id: 'manage_members', label: 'Gérer les membres', description: 'Recruter et gérer les employés juniors' },
      { id: 'view_stats', label: 'Voir les statistiques', description: 'Consulter le dashboard' }
    ]
  },
  'employe-senior': {
    label: 'Employé Senior',
    color: 'green',
    icon: Eye,
    permissions: [
      { id: 'view_stats', label: 'Voir les statistiques', description: 'Consulter le dashboard (lecture seule)' },
      { id: 'view_members', label: 'Voir les membres', description: 'Voir la liste des employés' }
    ]
  },
  'employe': {
    label: 'Employé',
    color: 'slate',
    icon: Users,
    permissions: [
      { id: 'view_basic', label: 'Accès basique', description: 'Voir qu\'il fait partie de l\'entreprise' }
    ]
  },
  player: {
    label: 'Joueur',
    color: 'slate',
    icon: Users,
    permissions: []
  }
};

const COLOR_CLASSES = {
  red: {
    bg: 'bg-red-500/20',
    border: 'border-red-500/50',
    text: 'text-red-400',
    icon: 'text-red-500'
  },
  purple: {
    bg: 'bg-purple-500/20',
    border: 'border-purple-500/50',
    text: 'text-purple-400',
    icon: 'text-purple-500'
  },
  blue: {
    bg: 'bg-blue-500/20',
    border: 'border-blue-500/50',
    text: 'text-blue-400',
    icon: 'text-blue-500'
  },
  green: {
    bg: 'bg-green-500/20',
    border: 'border-green-500/50',
    text: 'text-green-400',
    icon: 'text-green-500'
  },
  slate: {
    bg: 'bg-slate-500/20',
    border: 'border-slate-500/50',
    text: 'text-slate-400',
    icon: 'text-slate-500'
  }
};

export function PermissionsGuide() {
  const [expandedGrade, setExpandedGrade] = useState<string | null>('patron');

  const toggleGrade = (grade: string) => {
    setExpandedGrade(expandedGrade === grade ? null : grade);
  };

  return (
    <div className="min-h-screen bg-slate-950 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600/20 to-purple-600/20 border border-amber-900/30 rounded-lg p-8 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-10 h-10 text-amber-500" />
            <h1 className="text-4xl font-bold text-white">Guide des Permissions</h1>
          </div>
          <p className="text-slate-300 text-lg">
            Comprendre le système de rôles et de grades de LunarisLands
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-3">
            <Info className="w-6 h-6 text-blue-400 mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-bold text-blue-400 mb-2">Système à 2 niveaux</h3>
              <div className="space-y-2 text-blue-300">
                <p><strong>RÔLE</strong> : Définit l'accès global au serveur (staff, manager, player)</p>
                <p><strong>GRADE</strong> : Définit l'accès au sein d'une entreprise (patron, co-gérant, employé senior, employé)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Hierarchy Diagram */}
        <div className="bg-slate-900/50 border border-amber-900/30 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Lock className="w-6 h-6 text-amber-500" />
            Hiérarchie des Permissions
          </h2>
          <div className="space-y-2 font-mono text-sm">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-red-500" />
              <span className="text-red-400 font-bold">STAFF</span>
              <span className="text-slate-500">— Tous pouvoirs</span>
            </div>
            <div className="ml-6 flex items-center gap-2">
              <span className="text-slate-600">↓</span>
              <Building2 className="w-4 h-4 text-purple-500" />
              <span className="text-purple-400 font-bold">PATRON</span>
              <span className="text-slate-500">— Contrôle total de son entreprise</span>
            </div>
            <div className="ml-12 flex items-center gap-2">
              <span className="text-slate-600">↓</span>
              <Users className="w-4 h-4 text-blue-500" />
              <span className="text-blue-400 font-bold">CO-GÉRANT</span>
              <span className="text-slate-500">— Gestion des membres</span>
            </div>
            <div className="ml-18 flex items-center gap-2">
              <span className="text-slate-600">↓</span>
              <Eye className="w-4 h-4 text-green-500" />
              <span className="text-green-400 font-bold">EMPLOYÉ SENIOR</span>
              <span className="text-slate-500">— Consultation</span>
            </div>
            <div className="ml-24 flex items-center gap-2">
              <span className="text-slate-600">↓</span>
              <Users className="w-4 h-4 text-slate-500" />
              <span className="text-slate-400 font-bold">EMPLOYÉ</span>
              <span className="text-slate-500">— Accès minimal</span>
            </div>
          </div>
        </div>

        {/* Grades & Permissions */}
        <div className="space-y-4 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Unlock className="w-6 h-6 text-amber-500" />
            Permissions par Grade
          </h2>
          
          {Object.entries(PERMISSIONS_DATA).map(([gradeKey, gradeData]) => {
            const isExpanded = expandedGrade === gradeKey;
            const colors = COLOR_CLASSES[gradeData.color as keyof typeof COLOR_CLASSES];
            const Icon = gradeData.icon;

            return (
              <div
                key={gradeKey}
                className={`bg-slate-900/50 border ${colors.border} rounded-lg overflow-hidden transition-all`}
              >
                <button
                  onClick={() => toggleGrade(gradeKey)}
                  className="w-full p-6 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 ${colors.bg} rounded-lg flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${colors.icon}`} />
                    </div>
                    <div className="text-left">
                      <h3 className="text-xl font-bold text-white">{gradeData.label}</h3>
                      <p className={`text-sm ${colors.text}`}>
                        {gradeData.permissions.length} permission{gradeData.permissions.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-6 h-6 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-6 h-6 text-slate-400" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-6 pb-6 border-t border-slate-700">
                    {gradeData.permissions.length > 0 ? (
                      <div className="space-y-3 mt-4">
                        {gradeData.permissions.map((perm) => (
                          <div
                            key={perm.id}
                            className="bg-slate-800/50 rounded-lg p-4 border border-slate-700"
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-8 h-8 ${colors.bg} rounded flex items-center justify-center flex-shrink-0`}>
                                <span className={`text-xs font-bold ${colors.text}`}>✓</span>
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold text-white mb-1">{perm.label}</p>
                                <p className="text-sm text-slate-400">{perm.description}</p>
                                <code className="text-xs text-amber-500 bg-slate-900 px-2 py-1 rounded mt-2 inline-block">
                                  {perm.id}
                                </code>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-4 text-center py-8">
                        <Lock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-500">Aucune permission d'entreprise</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* How to Assign */}
        <div className="bg-slate-900/50 border border-amber-900/30 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Edit className="w-6 h-6 text-amber-500" />
            Comment Attribuer un Grade
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <h3 className="font-bold text-white mb-2">Via StaffPanel</h3>
              <ol className="list-decimal list-inside space-y-1 text-slate-300 text-sm">
                <li>Connectez-vous en tant que Staff</li>
                <li>Accédez à <code className="text-amber-500">/staff</code></li>
                <li>Section "Gestion des utilisateurs"</li>
                <li>Modifiez le rôle de l'utilisateur</li>
              </ol>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <h3 className="font-bold text-white mb-2">Via ManagerPanel</h3>
              <ol className="list-decimal list-inside space-y-1 text-slate-300 text-sm">
                <li>Connectez-vous en tant que Patron/Co-gérant</li>
                <li>Accédez à <code className="text-amber-500">/manager</code></li>
                <li>Onglet "Employés"</li>
                <li>Ajoutez ou modifiez le grade</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Security Rules */}
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-red-400 mb-4 flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Règles de Sécurité
          </h2>
          <ul className="space-y-2 text-red-300">
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-1">•</span>
              <span>Un utilisateur ne peut jamais modifier son propre grade</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-1">•</span>
              <span>On ne peut modifier que des grades inférieurs au sien</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-1">•</span>
              <span>Staff a TOUS les droits, même sur d'autres Staff</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-1">•</span>
              <span>Les permissions sont vérifiées côté serveur (impossible de bypass)</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

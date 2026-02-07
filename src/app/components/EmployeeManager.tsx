import { useState, useEffect } from 'react';
import { Users, Shield, UserPlus, Trash2, Edit } from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';

interface Employee {
  id: string;
  email: string;
  name: string;
  role: string;
  grade: string;
  permissions: string[];
}

interface EmployeeManagerProps {
  entrepriseId: string;
  userGrade: string;
}

const GRADE_INFO = {
  'patron': {
    label: 'Patron',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    description: 'Accès complet à la gestion de l\'entreprise'
  },
  'co-gerant': {
    label: 'Co-gérant',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    description: 'Peut gérer les employés et voir les statistiques'
  },
  'employe-senior': {
    label: 'Employé Senior',
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    description: 'Peut voir les statistiques et la liste des membres'
  },
  'employe': {
    label: 'Employé',
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/20',
    description: 'Accès de base'
  }
};

export function EmployeeManager({ entrepriseId, userGrade }: EmployeeManagerProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmployeeEmail, setNewEmployeeEmail] = useState('');
  const [newEmployeeGrade, setNewEmployeeGrade] = useState('employe');
  const [editingEmployee, setEditingEmployee] = useState<string | null>(null);
  const [editGrade, setEditGrade] = useState('');

  const token = localStorage.getItem('token');

  const canManageGrades = userGrade === 'patron';
  const canManageMembers = ['patron', 'co-gerant'].includes(userGrade);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-dec47541/manager/employees/${entrepriseId}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setEmployees(data.employees || []);
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch employees:', response.status, errorText);
        throw new Error('Failed to fetch employees');
      }
    } catch (error) {
      console.error('Fetch employees error:', error);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = async () => {
    if (!newEmployeeEmail) {
      setError('Email requis');
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-dec47541/entreprise/${entrepriseId}/employees`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: newEmployeeEmail,
            grade: newEmployeeGrade,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add employee');
      }

      setNewEmployeeEmail('');
      setNewEmployeeGrade('employe');
      setShowAddModal(false);
      fetchEmployees();
    } catch (err: any) {
      setError(err.message);
      console.error('Add employee error:', err);
    }
  };

  const handleUpdateGrade = async (email: string, grade: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-dec47541/entreprise/${entrepriseId}/employees/${encodeURIComponent(email)}/grade`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ grade }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update grade');
      }

      setEditingEmployee(null);
      fetchEmployees();
    } catch (err: any) {
      setError(err.message);
      console.error('Update grade error:', err);
    }
  };

  const handleRemoveEmployee = async (email: string) => {
    if (!confirm('Êtes-vous sûr de vouloir retirer cet employé ?')) {
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-dec47541/entreprise/${entrepriseId}/employees/${encodeURIComponent(email)}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove employee');
      }

      fetchEmployees();
    } catch (err: any) {
      setError(err.message);
      console.error('Remove employee error:', err);
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-900/50 rounded-lg border border-amber-900/30 p-8">
        <div className="text-center text-slate-400">Chargement des employés...</div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/50 rounded-lg border border-amber-900/30 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-amber-500" />
          <h2 className="text-2xl font-bold text-amber-500">Gestion des Employés</h2>
        </div>
        {canManageMembers && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Ajouter un employé
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {employees.length === 0 ? (
          <div className="text-center text-slate-400 py-8">
            Aucun employé pour le moment
          </div>
        ) : (
          employees.map((employee) => {
            const roleInfo = GRADE_INFO[employee.role as keyof typeof GRADE_INFO];
            const isEditing = editingEmployee === employee.email;

            return (
              <div
                key={employee.id}
                className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 hover:border-amber-900/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">{employee.name}</h3>
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={editGrade}
                            onChange={(e) => setEditGrade(e.target.value)}
                            className="px-3 py-1 bg-slate-700 text-white rounded border border-slate-600"
                          >
                            <option value="patron">Patron</option>
                            <option value="co-gerant">Co-gérant</option>
                            <option value="employe-senior">Employé Senior</option>
                            <option value="employe">Employé</option>
                          </select>
                          <button
                            onClick={() => handleUpdateGrade(employee.email, editGrade)}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                          >
                            Sauvegarder
                          </button>
                          <button
                            onClick={() => setEditingEmployee(null)}
                            className="px-3 py-1 bg-slate-600 hover:bg-slate-700 text-white rounded text-sm"
                          >
                            Annuler
                          </button>
                        </div>
                      ) : (
                        <span className={`px-3 py-1 ${roleInfo?.bgColor} ${roleInfo?.color} rounded-full text-sm font-medium`}>
                          <Shield className="w-3 h-3 inline mr-1" />
                          {roleInfo?.label || employee.role}
                        </span>
                      )}
                    </div>
                    {roleInfo && (
                      <p className="text-slate-500 text-xs italic">{roleInfo.description}</p>
                    )}
                    {employee.permissions.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {employee.permissions.map((perm) => (
                          <span
                            key={perm}
                            className="px-2 py-1 bg-slate-700/50 text-slate-300 rounded text-xs"
                          >
                            {perm.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {canManageGrades && !isEditing && (
                      <button
                        onClick={() => {
                          setEditingEmployee(employee.email);
                          setEditGrade(employee.grade);
                        }}
                        className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                        title="Modifier le grade"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    {canManageMembers && (
                      <button
                        onClick={() => handleRemoveEmployee(employee.email)}
                        className="p-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                        title="Retirer de l'entreprise"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-lg border border-amber-900/30 p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-amber-500 mb-4">Ajouter un employé</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 mb-2">Email de l'utilisateur</label>
                <input
                  type="email"
                  value={newEmployeeEmail}
                  onChange={(e) => setNewEmployeeEmail(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
                  placeholder="utilisateur@email.com"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-2">Grade</label>
                <select
                  value={newEmployeeGrade}
                  onChange={(e) => setNewEmployeeGrade(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="employe">Employé</option>
                  <option value="employe-senior">Employé Senior</option>
                  <option value="co-gerant">Co-gérant</option>
                  <option value="patron">Patron</option>
                </select>
                <p className="text-slate-500 text-sm mt-1">
                  {GRADE_INFO[newEmployeeGrade as keyof typeof GRADE_INFO]?.description}
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddEmployee}
                className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
              >
                Ajouter
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewEmployeeEmail('');
                  setNewEmployeeGrade('employe');
                }}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
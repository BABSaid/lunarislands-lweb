import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, PieChart, Pie, Cell, 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  Users, Building2, TrendingUp, Activity, 
  Calendar, Award, Target, Clock 
} from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';

interface Employee {
  id: string;
  email: string;
  name: string;
  role: string;
  grade: string;
  permissions: string[];
  performanceScore?: number;
}

interface DashboardProps {
  entrepriseId: string;
  entrepriseName: string;
  employees: Employee[];
}

const GRADE_COLORS = {
  'patron': '#a855f7',
  'co-gerant': '#3b82f6',
  'employe-senior': '#10b981',
  'employe': '#94a3b8'
};

const ROLE_LABELS: Record<string, string> = {
  'patron': 'Patron',
  'co-gerant': 'Co-gérant',
  'employe-senior': 'Employé Senior',
  'employe': 'Employé',
  null: 'Non assigné',
  '': 'Non assigné'
};

export function Dashboard({ entrepriseId, entrepriseName, employees }: DashboardProps) {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    byRole: [] as { name: string; value: number; color: string }[],
    recentActivity: [] as { date: string; actions: number }[],
    performanceData: [] as { month: string; growth: number }[],
    generalStats: { newEmployeesThisMonth: 0, growthPercentage: 0, activeDays: 0 }
  });
  const [employeesWithScores, setEmployeesWithScores] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [entrepriseId, employees]);

  const loadStats = async () => {
    try {
      console.log('📊 Loading stats for:', entrepriseId);
      
      // Fetch stats from backend
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-dec47541/activity/stats/${entrepriseId}`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Stats loaded:', data);
        
        // Calculate role distribution
        const roleCounts: Record<string, number> = {};
        employees.forEach(emp => {
          roleCounts[emp.role] = (roleCounts[emp.role] || 0) + 1;
        });

        const byRole = Object.entries(roleCounts).map(([role, count]) => ({
          name: ROLE_LABELS[role] || role,
          value: count,
          color: GRADE_COLORS[role as keyof typeof GRADE_COLORS] || '#94a3b8'
        }));
        
        setStats({
          totalEmployees: employees.length,
          byRole,
          recentActivity: data.recentActivity || [],
          performanceData: data.performanceData || [],
          generalStats: data.generalStats || { newEmployeesThisMonth: 0, growthPercentage: 0, activeDays: 0 }
        });
        
        setEmployeesWithScores(data.employeesWithPerformance || employees);
      } else {
        console.error('❌ Failed to load stats');
        // Fallback to basic calculation
        calculateBasicStats();
      }
    } catch (error) {
      console.error('Stats loading error:', error);
      calculateBasicStats();
    } finally {
      setLoading(false);
    }
  };

  const calculateBasicStats = () => {
    const roleCounts: Record<string, number> = {};
    employees.forEach(emp => {
      roleCounts[emp.role] = (roleCounts[emp.role] || 0) + 1;
    });

    const byRole = Object.entries(roleCounts).map(([role, count]) => ({
      name: ROLE_LABELS[role] || role,
      value: count,
      color: GRADE_COLORS[role as keyof typeof GRADE_COLORS] || '#94a3b8'
    }));

    setStats({
      totalEmployees: employees.length,
      byRole,
      recentActivity: [],
      performanceData: [],
      generalStats: { newEmployeesThisMonth: 0, growthPercentage: 0, activeDays: 0 }
    });
    setEmployeesWithScores(employees);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-amber-900/30 rounded-lg p-3 shadow-xl">
          <p className="text-white font-semibold">{payload[0].name}</p>
          <p className="text-amber-400">{payload[0].value} employés</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600/20 to-purple-600/20 border border-amber-900/30 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-2">
          <Activity className="w-8 h-8 text-amber-500" />
          <h2 className="text-3xl font-bold text-white">Dashboard</h2>
        </div>
        <p className="text-slate-300">Vue d'ensemble de {entrepriseName}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/50 rounded-lg border border-amber-900/30 p-6 hover:border-amber-600/50 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-slate-400 text-sm mb-1">Total Employés</p>
          <p className="text-3xl font-bold text-white">{stats.totalEmployees}</p>
          <p className="text-green-400 text-xs mt-2">+{stats.generalStats.newEmployeesThisMonth} ce mois</p>
        </div>

        <div className="bg-slate-900/50 rounded-lg border border-amber-900/30 p-6 hover:border-amber-600/50 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
              <Award className="w-6 h-6 text-purple-400" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-slate-400 text-sm mb-1">Managers</p>
          <p className="text-3xl font-bold text-white">
            {employees.filter(e => ['patron', 'co-gerant'].includes(e.role)).length}
          </p>
          <p className="text-green-400 text-xs mt-2">Équipe de direction</p>
        </div>

        <div className="bg-slate-900/50 rounded-lg border border-amber-900/30 p-6 hover:border-amber-600/50 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center">
              <Target className="w-6 h-6 text-amber-400" />
            </div>
            <Activity className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-slate-400 text-sm mb-1">Croissance</p>
          <p className="text-3xl font-bold text-white">+{stats.generalStats.growthPercentage}%</p>
          <p className="text-amber-400 text-xs mt-2">Par rapport au mois dernier</p>
        </div>

        <div className="bg-slate-900/50 rounded-lg border border-amber-900/30 p-6 hover:border-amber-600/50 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-green-400" />
            </div>
            <Calendar className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-slate-400 text-sm mb-1">Jours actifs</p>
          <p className="text-3xl font-bold text-white">{stats.generalStats.activeDays}</p>
          <p className="text-slate-400 text-xs mt-2">Ce mois-ci</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart - Distribution by Grade */}
        <div className="bg-slate-900/50 rounded-lg border border-amber-900/30 p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-500" />
            Distribution des Grades
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats.byRole}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {stats.byRole.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {stats.byRole.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-slate-300 text-sm">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar Chart - Recent Activity */}
        <div className="bg-slate-900/50 rounded-lg border border-amber-900/30 p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            Activité Récente (7 jours)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.recentActivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid #f59e0b30',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="actions" fill="#f59e0b" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Line Chart - Performance Growth */}
      <div className="bg-slate-900/50 rounded-lg border border-amber-900/30 p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-400" />
          Croissance de l'Entreprise (6 mois)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={stats.performanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="month" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1e293b', 
                border: '1px solid #f59e0b30',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="growth" 
              stroke="#10b981" 
              strokeWidth={3}
              dot={{ fill: '#10b981', r: 6 }}
              activeDot={{ r: 8 }}
              name="Croissance (%)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Employee Leaderboard */}
      <div className="bg-slate-900/50 rounded-lg border border-amber-900/30 p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" />
          Top Employés du Mois
        </h3>
        <div className="space-y-3">
          {employeesWithScores.slice(0, 5).map((emp, idx) => {
            return (
              <div 
                key={emp.id}
                className="flex items-center justify-between bg-slate-800/50 rounded-lg p-4 hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    idx === 0 ? 'bg-amber-500 text-white' :
                    idx === 1 ? 'bg-slate-400 text-white' :
                    idx === 2 ? 'bg-orange-700 text-white' :
                    'bg-slate-700 text-slate-300'
                  }`}>
                    {idx + 1}
                  </div>
                  <div>
                    <p className="text-white font-semibold">{emp.name}</p>
                    <p className="text-slate-400 text-sm">{ROLE_LABELS[emp.role]}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-green-400 font-bold text-lg">{emp.performanceScore || 50}%</p>
                  <p className="text-slate-500 text-xs">Performance</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/5 border border-blue-500/30 rounded-lg p-4">
          <Users className="w-6 h-6 text-blue-400 mb-2" />
          <p className="text-2xl font-bold text-white">{employees.filter(e => e.role === 'employe').length}</p>
          <p className="text-slate-400 text-sm">Employés</p>
        </div>
        <div className="bg-gradient-to-br from-green-500/20 to-green-600/5 border border-green-500/30 rounded-lg p-4">
          <Award className="w-6 h-6 text-green-400 mb-2" />
          <p className="text-2xl font-bold text-white">{employees.filter(e => e.role === 'employe-senior').length}</p>
          <p className="text-slate-400 text-sm">Seniors</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/5 border border-purple-500/30 rounded-lg p-4">
          <Target className="w-6 h-6 text-purple-400 mb-2" />
          <p className="text-2xl font-bold text-white">{employees.filter(e => e.role === 'co-gerant').length}</p>
          <p className="text-slate-400 text-sm">Co-gérants</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/5 border border-amber-500/30 rounded-lg p-4">
          <Building2 className="w-6 h-6 text-amber-400 mb-2" />
          <p className="text-2xl font-bold text-white">{employees.filter(e => e.role === 'patron').length}</p>
          <p className="text-slate-400 text-sm">Patrons</p>
        </div>
      </div>
    </div>
  );
}
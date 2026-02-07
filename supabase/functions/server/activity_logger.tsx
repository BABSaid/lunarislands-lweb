import * as kv from './kv_store.tsx';

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  entrepriseId: string;
  action: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

// Log une activité
export async function logActivity(log: Omit<ActivityLog, 'id'>) {
  const id = `activity:${log.entrepriseId}:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
  const activityLog: ActivityLog = { id, ...log };
  await kv.set(id, activityLog);
  return activityLog;
}

// Récupère les activités d'une entreprise
export async function getEntrepriseActivity(entrepriseId: string, days: number = 7) {
  const allActivities = await kv.getByPrefix(`activity:${entrepriseId}:`);
  const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
  
  return allActivities
    .filter(log => log.timestamp >= cutoffTime)
    .sort((a, b) => b.timestamp - a.timestamp);
}

// Calcule les statistiques d'activité pour les 7 derniers jours
export async function getActivityStats(entrepriseId: string) {
  const activities = await getEntrepriseActivity(entrepriseId, 7);
  const now = new Date();
  
  // Créer un tableau pour les 7 derniers jours
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    date.setHours(0, 0, 0, 0);
    return {
      date: date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
      timestamp: date.getTime(),
      actions: 0
    };
  });
  
  // Compter les actions par jour
  activities.forEach(log => {
    const logDate = new Date(log.timestamp);
    logDate.setHours(0, 0, 0, 0);
    const logTimestamp = logDate.getTime();
    
    const dayIndex = last7Days.findIndex(day => day.timestamp === logTimestamp);
    if (dayIndex !== -1) {
      last7Days[dayIndex].actions++;
    }
  });
  
  return last7Days.map(({ date, actions }) => ({ date, actions }));
}

// Calcule les statistiques de performance des employés
export async function getEmployeePerformance(entrepriseId: string, employees: any[]) {
  const activities = await getEntrepriseActivity(entrepriseId, 30);
  
  // Compter les actions par employé
  const employeeActions: Record<string, number> = {};
  activities.forEach(log => {
    employeeActions[log.userId] = (employeeActions[log.userId] || 0) + 1;
  });
  
  // Calculer le score de performance (basé sur l'activité)
  const actionValues = Object.values(employeeActions);
  const maxActions = actionValues.length > 0 ? Math.max(...actionValues) : 1;
  
  return employees.map(emp => {
    const actions = employeeActions[emp.id] || 0;
    const score = maxActions > 0 ? Math.round((actions / maxActions) * 100) : 50;
    return {
      ...emp,
      performanceScore: Math.max(score, 50) // Minimum 50%
    };
  }).sort((a, b) => b.performanceScore - a.performanceScore);
}

// Calcule les statistiques de croissance de l'entreprise
export async function getGrowthStats(employees: any[]) {
  const now = new Date();
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'];
  const currentMonth = now.getMonth();
  
  // Créer les 6 derniers mois
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const monthIndex = (currentMonth - (5 - i) + 12) % 12;
    return {
      month: months[monthIndex],
      monthIndex,
      employees: 0
    };
  });
  
  // Simuler la croissance basée sur le nombre actuel d'employés
  // Dans une vraie app, on utiliserait les dates de création des comptes
  const totalEmployees = employees.length;
  const baseGrowth = Math.floor(totalEmployees / 6);
  
  last6Months.forEach((month, idx) => {
    month.employees = Math.max(1, baseGrowth * (idx + 1) + Math.floor(Math.random() * 3));
  });
  
  // Calculer le pourcentage de croissance
  const growthData = last6Months.map((month, idx) => {
    const prevEmployees = idx > 0 ? last6Months[idx - 1].employees : 1;
    const growth = Math.round(((month.employees - prevEmployees) / prevEmployees) * 100);
    return {
      month: month.month,
      growth: Math.max(0, growth)
    };
  });
  
  return growthData;
}

// Calcule les statistiques générales de l'entreprise
export async function getGeneralStats(entrepriseId: string, employees: any[]) {
  const activities = await getEntrepriseActivity(entrepriseId, 30);
  const currentMonthActivities = await getEntrepriseActivity(entrepriseId, 30);
  const lastMonthActivities = await getEntrepriseActivity(entrepriseId, 60);
  
  // Employés ajoutés ce mois
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const newEmployeesThisMonth = 0; // TODO: implémenter quand on aura les dates de création
  
  // Croissance de l'activité
  const currentMonthActions = currentMonthActivities.length;
  const lastMonthActions = lastMonthActivities.length - currentMonthActions;
  const growthPercentage = lastMonthActions > 0 
    ? Math.round(((currentMonthActions - lastMonthActions) / lastMonthActions) * 100)
    : 0;
  
  // Jours actifs (jours avec au moins une action)
  const activeDays = new Set(
    currentMonthActivities.map(log => {
      const date = new Date(log.timestamp);
      return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    })
  ).size;
  
  return {
    newEmployeesThisMonth,
    growthPercentage: Math.max(0, growthPercentage),
    activeDays
  };
}
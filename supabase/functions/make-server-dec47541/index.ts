import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.ts";
import * as activityLogger from "./activity_logger.ts";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-dec47541/health", (c) => {
  return c.json({ status: "ok" });
});

// TEMPORARY: Initialize default entreprises
app.post("/make-server-dec47541/init-entreprises", async (c) => {
  try {
    const defaultEntreprises = [
      {
        id: 'banque-lunaris',
        name: 'La Banque Lunaris',
        category: 'Commerce',
        owner: 'Canrz (Ekow)',
        description: 'Banquier qui fournit des prêts, vend et loue des terrains pour développer votre entreprise.',
        specialty: 'Banque & Immobilier',
        status: 'active'
      },
      {
        id: 'recolte-genereuse',
        name: 'Les Récolte Généreuse',
        category: 'Commerce',
        owner: 'InconnueOP',
        description: 'Vente de meubles, tapis et services de construction pour embellir vos bâtiments.',
        specialty: 'Meubles & Décoration',
        status: 'active'
      },
      {
        id: 'germany-btp',
        name: 'Germany BTP',
        category: 'Construction',
        owner: 'B4N',
        description: 'Entreprise de construction spécialisée dans les grands projets architecturaux.',
        specialty: 'Construction',
        status: 'active'
      },
      {
        id: 'tresor-mining',
        name: 'Tresor Mining',
        category: 'Minage & Ressources',
        owner: 'Nakilox',
        description: 'Mineur officiel du village, fournisseur de minerais et ressources rares.',
        specialty: 'Extraction Minière',
        status: 'active'
      },
      {
        id: 'ferme-claire-de-lune',
        name: 'Ferme Claire-De-Lune',
        category: 'Agriculture',
        owner: 'Wesley',
        description: 'Fermier du village, production de ressources agricoles de qualité.',
        specialty: 'Agriculture & Élevage',
        status: 'active'
      }
    ];

    // Save all entreprises
    for (const entreprise of defaultEntreprises) {
      await kv.set(`entreprise:${entreprise.id}`, entreprise);
    }

    return c.json({ 
      success: true, 
      message: `${defaultEntreprises.length} entreprises initialized`,
      entreprises: defaultEntreprises
    });
  } catch (error) {
    console.error("Init entreprises error:", error);
    return c.json({ error: "Failed to initialize entreprises" }, 500);
  }
});

// ============================================
// PERMISSIONS SYSTEM (stored in DB)
// ============================================

// Default permissions by role (in company)
const DEFAULT_PERMISSIONS = {
  'patron': ['manage_roles', 'manage_members', 'edit_entreprise', 'view_stats', 'view_members'],
  'co-gerant': ['manage_members', 'view_stats', 'view_members'],
  'employe-senior': ['view_stats', 'view_members'],
  'employe': ['view_basic'],
};

// Helper function to check if user has permission
function hasPermission(user: any, permission: string): boolean {
  // Staff (grade) always has all permissions
  if (user.grade === 'staff') return true;
  
  // Check user's permissions array (stored in DB)
  return user.permissions && user.permissions.includes(permission);
}

// Helper to get authenticated user
async function getAuthenticatedUser(c: any) {
  const token = c.req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return null;
  }

  const session = await kv.get(`auth:${token}`);
  if (!session || session.expires < Date.now()) {
    return null;
  }

  const user = await kv.get(`user:${session.email}`);
  return user;
}

// ============================================
// AUTH ROUTES
// ============================================

// Signup - Create new user
app.post("/make-server-dec47541/auth/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();

    if (!email || !password || !name) {
      return c.json({ error: "Email, password, and name are required" }, 400);
    }

    // Check if user already exists
    const existingUser = await kv.get(`user:${email}`);
    if (existingUser) {
      return c.json({ error: "User already exists" }, 400);
    }

    // Create user with default 'membre' grade (not in any company)
    const user = {
      id: crypto.randomUUID(),
      email,
      password, // In production, hash this!
      name,
      grade: 'membre', // Global grade: 'staff' or 'membre'
      entrepriseId: null, // null = sans emploi, or entreprise ID
      role: null, // Role in company: 'patron', 'co-gerant', 'employe-senior', 'employe', or null
      permissions: [], // Permissions array stored in DB
      createdAt: new Date().toISOString(),
    };

    await kv.set(`user:${email}`, user);

    // Create session token
    const token = crypto.randomUUID();
    await kv.set(`auth:${token}`, {
      userId: user.id,
      email: user.email,
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return c.json({
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name, 
        grade: user.grade,
        entrepriseId: user.entrepriseId,
        role: user.role,
        permissions: user.permissions
      },
      token,
    });
  } catch (error) {
    console.error("Signup error:", error);
    return c.json({ error: "Signup failed" }, 500);
  }
});

// Login
app.post("/make-server-dec47541/auth/login", async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: "Email and password are required" }, 400);
    }

    // Get user
    const user = await kv.get(`user:${email}`);
    if (!user || user.password !== password) {
      return c.json({ error: "Invalid credentials" }, 401);
    }

    // Create session token
    const token = crypto.randomUUID();
    await kv.set(`auth:${token}`, {
      userId: user.id,
      email: user.email,
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return c.json({
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name, 
        grade: user.grade,
        entrepriseId: user.entrepriseId,
        role: user.role,
        permissions: user.permissions
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    return c.json({ error: "Login failed" }, 500);
  }
});

// Verify token and get user
app.get("/make-server-dec47541/auth/me", async (c) => {
  try {
    const user = await getAuthenticatedUser(c);
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    return c.json({
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name, 
        grade: user.grade,
        entrepriseId: user.entrepriseId,
        role: user.role,
        permissions: user.permissions
      },
    });
  } catch (error) {
    console.error("Auth verification error:", error);
    return c.json({ error: "Verification failed" }, 500);
  }
});

// ============================================
// STAFF ROUTES (Admin Panel)
// ============================================

// Get all users (public - for development)
app.get("/make-server-dec47541/users", async (c) => {
  try {
    console.log('📊 Public users route called');
    const users = await kv.getByPrefix("user:");
    console.log('📊 Users raw data:', JSON.stringify(users));
    console.log('📊 Users found:', users ? users.length : 0);
    
    if (!users || !Array.isArray(users)) {
      console.log('⚠️ No users found or invalid data structure');
      return c.json({ users: [] });
    }
    
    const mappedUsers = users.map(u => ({ 
      id: u.id || '', 
      email: u.email || '', 
      name: u.name || '', 
      grade: u.grade || 'membre', 
      entrepriseId: u.entrepriseId || null,
      role: u.role || null,
      permissions: u.permissions || []
    }));
    
    console.log('📊 Mapped users:', JSON.stringify(mappedUsers));
    
    return c.json({ users: mappedUsers });
  } catch (error) {
    console.error("Get users error:", error);
    return c.json({ error: "Failed to get users", details: String(error) }, 500);
  }
});

// Update user (public - for development)
app.put("/make-server-dec47541/users/:email", async (c) => {
  try {
    const targetEmail = c.req.param("email");
    const { grade, entrepriseId, role, permissions } = await c.req.json();

    console.log('🔄 Updating user:', targetEmail, { grade, entrepriseId, role, permissions });

    const targetUser = await kv.get(`user:${targetEmail}`);
    if (!targetUser) {
      console.error('❌ User not found:', targetEmail);
      return c.json({ error: "User not found" }, 404);
    }

    const updatedUser = {
      ...targetUser,
      grade: grade !== undefined ? grade : targetUser.grade,
      entrepriseId: entrepriseId !== undefined ? entrepriseId : targetUser.entrepriseId,
      role: role !== undefined ? role : targetUser.role,
      permissions: permissions !== undefined ? permissions : targetUser.permissions,
    };

    await kv.set(`user:${targetEmail}`, updatedUser);
    console.log('✅ User updated successfully:', targetEmail);

    return c.json({ 
      user: { 
        id: updatedUser.id, 
        email: updatedUser.email, 
        name: updatedUser.name, 
        grade: updatedUser.grade,
        entrepriseId: updatedUser.entrepriseId,
        role: updatedUser.role,
        permissions: updatedUser.permissions
      } 
    });
  } catch (error) {
    console.error("Update user error:", error);
    return c.json({ error: "Failed to update user", details: String(error) }, 500);
  }
});

// Get user by email (public - for development)
app.get("/make-server-dec47541/users/:email", async (c) => {
  try {
    const email = c.req.param("email");
    console.log('📊 Getting user by email:', email);
    
    const user = await kv.get(`user:${email}`);
    
    if (!user) {
      console.error('❌ User not found:', email);
      return c.json({ error: "User not found" }, 404);
    }
    
    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      grade: user.grade || 'membre',
      entrepriseId: user.entrepriseId || null,
      role: user.role || null,
      permissions: user.permissions || []
    };
    
    console.log('✅ User found:', email, safeUser);
    return c.json({ user: safeUser });
  } catch (error) {
    console.error("Get user by email error:", error);
    return c.json({ error: "Failed to get user", details: String(error) }, 500);
  }
});

// Get all users (staff only)
app.get("/make-server-dec47541/staff/users", async (c) => {
  try {
    const user = await getAuthenticatedUser(c);
    if (!user || user.grade !== 'staff') {
      return c.json({ error: "Staff access required" }, 403);
    }

    // Get all users
    const users = await kv.getByPrefix("user:");
    return c.json({ 
      users: users.map(u => ({ 
        id: u.id, 
        email: u.email, 
        name: u.name, 
        grade: u.grade, 
        entrepriseId: u.entrepriseId,
        role: u.role,
        permissions: u.permissions
      })) 
    });
  } catch (error) {
    console.error("Get users error:", error);
    return c.json({ error: "Failed to get users" }, 500);
  }
});

// Update user (staff only) - Change grade, entreprise, role, permissions
app.put("/make-server-dec47541/staff/users/:email", async (c) => {
  try {
    const user = await getAuthenticatedUser(c);
    if (!user || user.grade !== 'staff') {
      return c.json({ error: "Staff access required" }, 403);
    }

    const targetEmail = c.req.param("email");
    const { grade, entrepriseId, role, permissions } = await c.req.json();

    const targetUser = await kv.get(`user:${targetEmail}`);
    if (!targetUser) {
      return c.json({ error: "User not found" }, 404);
    }

    // Update fields if provided
    if (grade !== undefined) {
      if (!['staff', 'membre'].includes(grade)) {
        return c.json({ error: "Invalid grade. Must be 'staff' or 'membre'" }, 400);
      }
      targetUser.grade = grade;
      
      // If setting to staff, give all permissions
      if (grade === 'staff') {
        targetUser.permissions = [
          'manage_all_entreprises', 
          'manage_users', 
          'view_all', 
          'manage_roles', 
          'manage_members', 
          'edit_entreprise', 
          'view_stats', 
          'view_members'
        ];
      }
    }

    if (entrepriseId !== undefined) {
      targetUser.entrepriseId = entrepriseId || null;
    }

    if (role !== undefined) {
      if (role && !['patron', 'co-gerant', 'employe-senior', 'employe'].includes(role)) {
        return c.json({ error: "Invalid role" }, 400);
      }
      targetUser.role = role || null;
      
      // Auto-assign default permissions based on role
      if (role && DEFAULT_PERMISSIONS[role as keyof typeof DEFAULT_PERMISSIONS]) {
        targetUser.permissions = DEFAULT_PERMISSIONS[role as keyof typeof DEFAULT_PERMISSIONS];
      }
    }

    if (permissions !== undefined && Array.isArray(permissions)) {
      targetUser.permissions = permissions;
    }

    await kv.set(`user:${targetEmail}`, targetUser);

    return c.json({ user: {
      id: targetUser.id,
      email: targetUser.email,
      name: targetUser.name,
      grade: targetUser.grade,
      entrepriseId: targetUser.entrepriseId,
      role: targetUser.role,
      permissions: targetUser.permissions
    }});
  } catch (error) {
    console.error("Update user error:", error);
    return c.json({ error: "Failed to update user" }, 500);
  }
});

// Get all entreprises (staff only)
app.get("/make-server-dec47541/staff/entreprises", async (c) => {
  try {
    const user = await getAuthenticatedUser(c);
    if (!user || user.grade !== 'staff') {
      return c.json({ error: "Staff access required" }, 403);
    }

    const entreprises = await kv.getByPrefix("entreprise:");
    return c.json({ entreprises });
  } catch (error) {
    console.error("Get entreprises error:", error);
    return c.json({ error: "Failed to get entreprises" }, 500);
  }
});

// Get all entreprises (public)
app.get("/make-server-dec47541/entreprises", async (c) => {
  try {
    const entreprises = await kv.getByPrefix("entreprise:");
    return c.json({ entreprises });
  } catch (error) {
    console.error("Get entreprises error:", error);
    return c.json({ error: "Failed to get entreprises" }, 500);
  }
});

// Update entreprise (public - for development)
app.put("/make-server-dec47541/entreprises/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const updates = await c.req.json();

    const entreprise = await kv.get(`entreprise:${id}`);
    if (!entreprise) {
      return c.json({ error: "Entreprise not found" }, 404);
    }

    Object.assign(entreprise, updates);
    await kv.set(`entreprise:${id}`, entreprise);

    return c.json({ entreprise });
  } catch (error) {
    console.error("Update entreprise error:", error);
    return c.json({ error: "Failed to update entreprise" }, 500);
  }
});

// Delete entreprise (public - for development)
app.delete("/make-server-dec47541/entreprises/:id", async (c) => {
  try {
    const id = c.req.param("id");
    await kv.del(`entreprise:${id}`);

    return c.json({ success: true });
  } catch (error) {
    console.error("Delete entreprise error:", error);
    return c.json({ error: "Failed to delete entreprise" }, 500);
  }
});

// Create entreprise (staff only)
app.post("/make-server-dec47541/staff/entreprises", async (c) => {
  try {
    const user = await getAuthenticatedUser(c);
    if (!user || user.grade !== 'staff') {
      return c.json({ error: "Staff access required" }, 403);
    }

    const { name, category, owner, description, specialty, status } = await c.req.json();
    
    const entreprise = {
      id: crypto.randomUUID(),
      name,
      category,
      owner,
      description,
      specialty,
      status: status || 'approved',
      createdAt: new Date().toISOString(),
    };

    await kv.set(`entreprise:${entreprise.id}`, entreprise);

    return c.json({ entreprise });
  } catch (error) {
    console.error("Create entreprise error:", error);
    return c.json({ error: "Failed to create entreprise" }, 500);
  }
});

// Update entreprise (staff only)
app.put("/make-server-dec47541/staff/entreprises/:id", async (c) => {
  try {
    const user = await getAuthenticatedUser(c);
    if (!user || user.grade !== 'staff') {
      return c.json({ error: "Staff access required" }, 403);
    }

    const id = c.req.param("id");
    const updates = await c.req.json();

    const entreprise = await kv.get(`entreprise:${id}`);
    if (!entreprise) {
      return c.json({ error: "Entreprise not found" }, 404);
    }

    Object.assign(entreprise, updates);
    await kv.set(`entreprise:${id}`, entreprise);

    return c.json({ entreprise });
  } catch (error) {
    console.error("Update entreprise error:", error);
    return c.json({ error: "Failed to update entreprise" }, 500);
  }
});

// Delete entreprise (staff only)
app.delete("/make-server-dec47541/staff/entreprises/:id", async (c) => {
  try {
    const user = await getAuthenticatedUser(c);
    if (!user || user.grade !== 'staff') {
      return c.json({ error: "Staff access required" }, 403);
    }

    const id = c.req.param("id");
    await kv.del(`entreprise:${id}`);

    return c.json({ success: true });
  } catch (error) {
    console.error("Delete entreprise error:", error);
    return c.json({ error: "Failed to delete entreprise" }, 500);
  }
});

// ============================================
// MANAGER/COMPANY ROUTES (Protected by permissions)
// ============================================

// ============================================
// ACTIVITY & STATISTICS ROUTES
// ============================================

// Log activity (for managers and staff)
app.post("/make-server-dec47541/activity/log", async (c) => {
  try {
    const { userId, userName, entrepriseId, action, metadata } = await c.req.json();
    
    if (!userId || !userName || !entrepriseId || !action) {
      return c.json({ error: "Missing required fields" }, 400);
    }
    
    const log = await activityLogger.logActivity({
      userId,
      userName,
      entrepriseId,
      action,
      timestamp: Date.now(),
      metadata: metadata || {}
    });
    
    console.log('✅ Activity logged:', log);
    return c.json({ success: true, log });
  } catch (error) {
    console.error("Log activity error:", error);
    return c.json({ error: "Failed to log activity", details: String(error) }, 500);
  }
});

// Get statistics for an entreprise (public - for development)
app.get("/make-server-dec47541/activity/stats/:entrepriseId", async (c) => {
  try {
    const entrepriseId = c.req.param("entrepriseId");
    console.log('📊 Getting stats for entreprise:', entrepriseId);
    
    // Get employees
    const allUsers = await kv.getByPrefix("user:");
    const employees = allUsers.filter((u: any) => u.entrepriseId === entrepriseId);
    
    // Get activity stats
    const recentActivity = await activityLogger.getActivityStats(entrepriseId);
    const performanceData = await activityLogger.getGrowthStats(employees);
    const employeesWithPerformance = await activityLogger.getEmployeePerformance(entrepriseId, employees);
    const generalStats = await activityLogger.getGeneralStats(entrepriseId, employees);
    
    console.log('✅ Stats calculated successfully');
    
    return c.json({
      recentActivity,
      performanceData,
      employeesWithPerformance: employeesWithPerformance.map((e: any) => ({
        id: e.id,
        email: e.email,
        name: e.name,
        role: e.role,
        grade: e.grade,
        permissions: e.permissions,
        performanceScore: e.performanceScore
      })),
      generalStats
    });
  } catch (error) {
    console.error("Get stats error:", error);
    return c.json({ error: "Failed to get stats", details: String(error) }, 500);
  }
});

// ============================================
// MANAGER/COMPANY ROUTES (Protected by permissions)
// ============================================

// Get manager's entreprise (requires auth)
app.get("/make-server-dec47541/manager/entreprise", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // For development, using simple email-based lookup
    const allUsers = await kv.getByPrefix('user:');
    const user = allUsers.find((u: any) => u.email);
    
    if (!user || !user.entrepriseId) {
      return c.json({ error: "No entreprise assigned" }, 404);
    }

    const entreprise = await kv.get(`entreprise:${user.entrepriseId}`);
    if (!entreprise) {
      return c.json({ error: "Entreprise not found" }, 404);
    }

    return c.json({ entreprise });
  } catch (error) {
    console.error("Get manager entreprise error:", error);
    return c.json({ error: "Failed to get entreprise", details: String(error) }, 500);
  }
});

// Get entreprise by ID (public - for development)
app.get("/make-server-dec47541/manager/entreprise/:id", async (c) => {
  try {
    const entrepriseId = c.req.param("id");
    console.log('📊 Getting entreprise by ID:', entrepriseId);
    
    const entreprise = await kv.get(`entreprise:${entrepriseId}`);
    
    if (!entreprise) {
      console.error('❌ Entreprise not found:', entrepriseId);
      return c.json({ error: "Entreprise not found" }, 404);
    }
    
    console.log('✅ Entreprise found:', entrepriseId);
    return c.json({ entreprise });
  } catch (error) {
    console.error("Get entreprise by ID error:", error);
    return c.json({ error: "Failed to get entreprise", details: String(error) }, 500);
  }
});

// Get employees for manager's entreprise (requires auth)
app.get("/make-server-dec47541/manager/employees", async (c) => {
  try {
    const user = await getAuthenticatedUser(c);
    if (!user || !user.entrepriseId) {
      return c.json({ error: "No entreprise assigned" }, 403);
    }

    // Check permission
    if (!hasPermission(user, 'view_members')) {
      return c.json({ error: "Insufficient permissions" }, 403);
    }

    const allUsers = await kv.getByPrefix("user:");
    const employees = allUsers.filter((u: any) => u.entrepriseId === user.entrepriseId);
    
    return c.json({ 
      employees: employees.map((e: any) => ({ 
        id: e.id, 
        email: e.email, 
        name: e.name, 
        role: e.role,
        grade: e.grade,
        permissions: e.permissions
      })) 
    });
  } catch (error) {
    console.error("Get manager employees error:", error);
    return c.json({ error: "Failed to get employees" }, 500);
  }
});

// Get employees by entreprise ID (public - for development)
app.get("/make-server-dec47541/manager/employees/:entrepriseId", async (c) => {
  try {
    const entrepriseId = c.req.param("entrepriseId");
    console.log('📊 Getting employees for entreprise:', entrepriseId);
    
    const allUsers = await kv.getByPrefix("user:");
    console.log('📊 Total users found:', allUsers.length);
    
    const employees = allUsers.filter((u: any) => u.entrepriseId === entrepriseId);
    console.log('✅ Employees with matching entrepriseId:', employees.length);
    
    if (employees.length > 0) {
      console.log('📋 Sample employee:', employees[0]);
    }
    
    return c.json({ 
      employees: employees.map((e: any) => ({ 
        id: e.id, 
        email: e.email, 
        name: e.name, 
        role: e.role || 'employe',
        grade: e.grade || 'membre',
        permissions: e.permissions || []
      })) 
    });
  } catch (error) {
    console.error("Get employees by entreprise ID error:", error);
    return c.json({ error: "Failed to get employees", details: String(error) }, 500);
  }
});

// Update my entreprise (limited fields)
app.put("/make-server-dec47541/manager/entreprise", async (c) => {
  try {
    const user = await getAuthenticatedUser(c);
    if (!user || !user.entrepriseId) {
      return c.json({ error: "No entreprise assigned" }, 403);
    }

    // Check permission
    if (!hasPermission(user, 'edit_entreprise')) {
      return c.json({ error: "Insufficient permissions" }, 403);
    }

    const entreprise = await kv.get(`entreprise:${user.entrepriseId}`);
    if (!entreprise) {
      return c.json({ error: "Entreprise not found" }, 404);
    }

    const { description, specialty } = await c.req.json();
    
    // Non-staff can only update description and specialty
    if (description !== undefined) entreprise.description = description;
    if (specialty !== undefined) entreprise.specialty = specialty;

    await kv.set(`entreprise:${user.entrepriseId}`, entreprise);

    return c.json({ entreprise });
  } catch (error) {
    console.error("Update manager entreprise error:", error);
    return c.json({ error: "Failed to update entreprise" }, 500);
  }
});

// Get employees of an entreprise
app.get("/make-server-dec47541/entreprise/:id/employees", async (c) => {
  try {
    const user = await getAuthenticatedUser(c);
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const entrepriseId = c.req.param("id");

    // Check if user has permission to view members
    if (user.grade !== 'staff' && 
        (user.entrepriseId !== entrepriseId || !hasPermission(user, 'view_members'))) {
      return c.json({ error: "Insufficient permissions" }, 403);
    }
    
    const allUsers = await kv.getByPrefix("user:");
    const employees = allUsers.filter((u: any) => u.entrepriseId === entrepriseId);
    
    return c.json({ 
      employees: employees.map((e: any) => ({ 
        id: e.id, 
        email: e.email, 
        name: e.name, 
        role: e.role,
        grade: e.grade,
        permissions: e.permissions
      })) 
    });
  } catch (error) {
    console.error("Get employees error:", error);
    return c.json({ error: "Failed to get employees" }, 500);
  }
});

// Update employee role in entreprise
app.put("/make-server-dec47541/entreprise/:id/employee/:email/role", async (c) => {
  try {
    const user = await getAuthenticatedUser(c);
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const entrepriseId = c.req.param("id");
    const targetEmail = c.req.param("email");
    const { role, permissions } = await c.req.json();

    // Validate role
    if (role && !['patron', 'co-gerant', 'employe-senior', 'employe'].includes(role)) {
      return c.json({ error: "Invalid role" }, 400);
    }

    // Check if user has permission to manage roles
    if (user.grade !== 'staff' && 
        (user.entrepriseId !== entrepriseId || !hasPermission(user, 'manage_roles'))) {
      return c.json({ error: "Insufficient permissions" }, 403);
    }

    const targetUser = await kv.get(`user:${targetEmail}`);
    if (!targetUser || targetUser.entrepriseId !== entrepriseId) {
      return c.json({ error: "Employee not found in this entreprise" }, 404);
    }

    // Update role
    if (role !== undefined) {
      targetUser.role = role;
      
      // Auto-assign default permissions if not provided
      if (!permissions && DEFAULT_PERMISSIONS[role as keyof typeof DEFAULT_PERMISSIONS]) {
        targetUser.permissions = DEFAULT_PERMISSIONS[role as keyof typeof DEFAULT_PERMISSIONS];
      }
    }

    // Update permissions if provided
    if (permissions !== undefined && Array.isArray(permissions)) {
      targetUser.permissions = permissions;
    }

    await kv.set(`user:${targetEmail}`, targetUser);

    return c.json({ 
      user: { 
        id: targetUser.id, 
        email: targetUser.email, 
        name: targetUser.name, 
        role: targetUser.role,
        grade: targetUser.grade,
        permissions: targetUser.permissions
      } 
    });
  } catch (error) {
    console.error("Update role error:", error);
    return c.json({ error: "Failed to update role" }, 500);
  }
});

// Add employee to entreprise
app.post("/make-server-dec47541/entreprise/:id/employees", async (c) => {
  try {
    const user = await getAuthenticatedUser(c);
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const entrepriseId = c.req.param("id");
    const { email, role } = await c.req.json();

    // Check permission
    if (user.grade !== 'staff' && 
        (user.entrepriseId !== entrepriseId || !hasPermission(user, 'manage_members'))) {
      return c.json({ error: "Insufficient permissions" }, 403);
    }

    const targetUser = await kv.get(`user:${email}`);
    if (!targetUser) {
      return c.json({ error: "User not found" }, 404);
    }

    // Add user to entreprise
    targetUser.entrepriseId = entrepriseId;
    targetUser.role = role || 'employe';
    
    // Assign default permissions
    if (DEFAULT_PERMISSIONS[targetUser.role as keyof typeof DEFAULT_PERMISSIONS]) {
      targetUser.permissions = DEFAULT_PERMISSIONS[targetUser.role as keyof typeof DEFAULT_PERMISSIONS];
    }
    
    await kv.set(`user:${email}`, targetUser);

    return c.json({ 
      user: { 
        id: targetUser.id, 
        email: targetUser.email, 
        name: targetUser.name, 
        role: targetUser.role,
        grade: targetUser.grade,
        entrepriseId: targetUser.entrepriseId,
        permissions: targetUser.permissions
      } 
    });
  } catch (error) {
    console.error("Add employee error:", error);
    return c.json({ error: "Failed to add employee" }, 500);
  }
});

// Remove employee from entreprise
app.delete("/make-server-dec47541/entreprise/:id/employees/:email", async (c) => {
  try {
    const user = await getAuthenticatedUser(c);
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const entrepriseId = c.req.param("id");
    const targetEmail = c.req.param("email");

    // Check permission
    if (user.grade !== 'staff' && 
        (user.entrepriseId !== entrepriseId || !hasPermission(user, 'manage_members'))) {
      return c.json({ error: "Insufficient permissions" }, 403);
    }

    const targetUser = await kv.get(`user:${targetEmail}`);
    if (!targetUser || targetUser.entrepriseId !== entrepriseId) {
      return c.json({ error: "Employee not found in this entreprise" }, 404);
    }

    // Remove from entreprise
    targetUser.role = null;
    targetUser.entrepriseId = null;
    targetUser.permissions = [];
    
    await kv.set(`user:${targetEmail}`, targetUser);

    return c.json({ success: true });
  } catch (error) {
    console.error("Remove employee error:", error);
    return c.json({ error: "Failed to remove employee" }, 500);
  }
});

Deno.serve(app.fetch);
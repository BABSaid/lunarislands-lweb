import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import * as activityLogger from "./activity_logger.tsx";
import * as notifications from "./notifications.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization", "X-Admin-Password", "X-Auth-Token"],
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
  // Use X-Auth-Token header instead of Authorization to avoid Supabase JWT validation
  const token = c.req.header("X-Auth-Token");
  console.log('🔐 getAuthenticatedUser - Token:', token);
  
  if (!token) {
    console.log('❌ getAuthenticatedUser - No token provided');
    return null;
  }

  const session = await kv.get(`auth:${token}`);
  console.log('🔐 getAuthenticatedUser - Session:', session);
  
  if (!session || session.expires < Date.now()) {
    console.log('❌ getAuthenticatedUser - No session or expired');
    return null;
  }

  const user = await kv.get(`user:${session.email}`);
  console.log('🔐 getAuthenticatedUser - User:', user);
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
      grade: email === 'imodzbobby13@gmail.com' ? 'staff' : 'membre', // Automatic staff for admin email
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

// DEBUG: Fix session for a token (development only)
app.post("/make-server-dec47541/auth/fix-session", async (c) => {
  try {
    const { token, email } = await c.req.json();
    
    if (!token || !email) {
      return c.json({ error: "Token and email required" }, 400);
    }

    console.log('🔧 Fixing session for token:', token, 'email:', email);

    // Get user
    const user = await kv.get(`user:${email}`);
    if (!user) {
      console.log('❌ User not found for email:', email);
      return c.json({ error: "User not found" }, 404);
    }

    console.log('👤 User found:', user);

    // Create/update session
    const session = {
      userId: user.id,
      email: user.email,
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    };

    await kv.set(`auth:${token}`, session);
    console.log('✅ Session fixed for token:', token);

    return c.json({ 
      success: true, 
      message: "Session created successfully",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        grade: user.grade,
        entrepriseId: user.entrepriseId,
        role: user.role,
        permissions: user.permissions
      }
    });
  } catch (error) {
    console.error("Fix session error:", error);
    return c.json({ error: "Failed to fix session" }, 500);
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

// ============================================
// PRODUCTS ROUTES (Catalogue de produits)
// ============================================

// Create product (public - for development)
app.post("/make-server-dec47541/products", async (c) => {
  try {
    console.log('📦 POST /products called');
    const { entrepriseId, nom, stock, prix } = await c.req.json();
    console.log('📝 Product data:', { entrepriseId, nom, stock, prix });

    if (!entrepriseId || !nom || stock === undefined) {
      return c.json({ error: "Entreprise ID, product name and stock are required" }, 400);
    }

    const product = {
      id: crypto.randomUUID(),
      entrepriseId,
      nom,
      stock: Number(stock),
      prix: prix ? Number(prix) : null,
      active: true,
      createdAt: new Date().toISOString(),
    };

    await kv.set(`product:${product.id}`, product);

    console.log('✅ Product created:', product.id);
    return c.json({ product });
  } catch (error) {
    console.error("Create product error:", error);
    return c.json({ error: "Failed to create product" }, 500);
  }
});

// Get products by entreprise ID (public)
app.get("/make-server-dec47541/products/:entrepriseId", async (c) => {
  try {
    const entrepriseId = c.req.param("entrepriseId");
    console.log('📦 Getting products for entreprise:', entrepriseId);
    
    const allProducts = await kv.getByPrefix("product:");
    const products = allProducts.filter((p: any) => p.entrepriseId === entrepriseId && p.active);
    
    console.log('✅ Products found:', products.length);
    return c.json({ products });
  } catch (error) {
    console.error("Get products error:", error);
    return c.json({ error: "Failed to get products" }, 500);
  }
});

// Update product (public - for development)
app.put("/make-server-dec47541/products/:id", async (c) => {
  try {
    const productId = c.req.param("id");
    const updates = await c.req.json();
    console.log('✏️ Updating product:', productId, updates);

    const product = await kv.get(`product:${productId}`);
    if (!product) {
      console.log('❌ Product not found:', productId);
      return c.json({ error: "Product not found" }, 404);
    }

    // Update fields
    if (updates.nom !== undefined) product.nom = updates.nom;
    if (updates.stock !== undefined) product.stock = Number(updates.stock);
    if (updates.prix !== undefined) product.prix = updates.prix ? Number(updates.prix) : null;
    if (updates.active !== undefined) product.active = updates.active;

    await kv.set(`product:${productId}`, product);
    console.log('✅ Product updated:', product);

    return c.json({ product });
  } catch (error) {
    console.error("Update product error:", error);
    return c.json({ error: "Failed to update product" }, 500);
  }
});

// Delete product (public - for development)
app.delete("/make-server-dec47541/products/:id", async (c) => {
  try {
    const productId = c.req.param("id");
    console.log('🗑️ Deleting product:', productId);
    
    const product = await kv.get(`product:${productId}`);
    
    if (!product) {
      console.log('❌ Product not found:', productId);
      return c.json({ error: "Product not found" }, 404);
    }

    await kv.del(`product:${productId}`);
    console.log('✅ Product deleted:', productId);

    return c.json({ success: true });
  } catch (error) {
    console.error("Delete product error:", error);
    return c.json({ error: "Failed to delete product" }, 500);
  }
});

// ============================================
// COMMANDES ROUTES (Système de commandes)
// ============================================

// Create commande (public)
app.post("/make-server-dec47541/commandes", async (c) => {
  try {
    console.log('🛒 POST /commandes called');
    const { entrepriseId, clientPseudo, clientDiscord, typeCommande, disponibilites, produits, userId } = await c.req.json();
    console.log('📝 Commande data:', { entrepriseId, clientPseudo, typeCommande, produits, userId });

    if (!entrepriseId || !clientPseudo || !typeCommande || !produits || !Array.isArray(produits) || produits.length === 0) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    // Verify entreprise exists
    const entreprise = await kv.get(`entreprise:${entrepriseId}`);
    if (!entreprise) {
      return c.json({ error: "Entreprise not found" }, 404);
    }

    // Verify stock for each product and calculate totals
    const productDetails = [];
    for (const item of produits) {
      const product = await kv.get(`product:${item.productId}`);
      if (!product) {
        return c.json({ error: `Product ${item.productId} not found` }, 404);
      }
      
      if (product.entrepriseId !== entrepriseId) {
        return c.json({ error: `Product ${item.productId} does not belong to this entreprise` }, 400);
      }

      if (!product.active) {
        return c.json({ error: `Product ${product.nom} is not available` }, 400);
      }

      // Check stock availability
      if (product.stock < item.quantite) {
        return c.json({ 
          error: `Stock insuffisant pour ${product.nom}. Disponible: ${product.stock}, Demandé: ${item.quantite}` 
        }, 400);
      }

      productDetails.push({
        productId: item.productId,
        nom: product.nom,
        quantite: item.quantite,
        prixUnitaire: product.prix
      });
    }

    const commande = {
      id: crypto.randomUUID(),
      entrepriseId,
      userId: userId || null, // Store userId for notifications
      clientPseudo,
      clientDiscord: clientDiscord || null,
      typeCommande, // "particulier" or "entreprise"
      disponibilites: disponibilites || '',
      produits: productDetails,
      statut: 'en_attente', // en_attente, acceptee, en_cours, terminee, annulee
      dateCommande: new Date().toISOString(),
      dateTraitement: null,
      notes: '',
    };

    await kv.set(`commande:${commande.id}`, commande);

    // Send webhook notification if configured (staff only)
    try {
      const webhookConfig = await kv.get(`webhook:${entrepriseId}`);
      if (webhookConfig && webhookConfig.webhookUrl) {
        const webhookPayload = {
          content: `🛒 **Nouvelle commande reçue !**\n\n**Client:** ${clientPseudo}${clientDiscord ? ` (Discord: ${clientDiscord})` : ''}\n**Type:** ${typeCommande === 'particulier' ? 'Particulier' : 'Entreprise'}\n**Produits:**\n${productDetails.map(p => `- ${p.nom} x${p.quantite}`).join('\n')}\n**Disponibilités:** ${disponibilites || 'Non spécifié'}\n\n*Commande #${commande.id.slice(0, 8)}*`
        };

        await fetch(webhookConfig.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookPayload)
        });
      }
    } catch (webhookError) {
      console.error("Webhook notification error:", webhookError);
      // Don't fail the request if webhook fails
    }

    console.log('✅ Commande created:', commande.id);
    return c.json({ commande });
  } catch (error) {
    console.error("Create commande error:", error);
    return c.json({ error: "Failed to create commande", details: String(error) }, 500);
  }
});

// Get commandes by entreprise ID (public - for development)
app.get("/make-server-dec47541/commandes/:entrepriseId", async (c) => {
  try {
    const entrepriseId = c.req.param("entrepriseId");
    console.log('📋 Getting commandes for entreprise:', entrepriseId);

    const allCommandes = await kv.getByPrefix("commande:");
    const commandes = allCommandes.filter((cmd: any) => cmd.entrepriseId === entrepriseId);
    
    // Sort by date (newest first)
    commandes.sort((a: any, b: any) => 
      new Date(b.dateCommande).getTime() - new Date(a.dateCommande).getTime()
    );

    console.log('✅ Commandes found:', commandes.length);
    return c.json({ commandes });
  } catch (error) {
    console.error("Get commandes error:", error);
    return c.json({ error: "Failed to get commandes" }, 500);
  }
});

// Update commande status (public - for development)
app.put("/make-server-dec47541/commandes/:id", async (c) => {
  try {
    const commandeId = c.req.param("id");
    const { statut, notes } = await c.req.json();
    console.log('📝 Updating commande:', commandeId, 'to status:', statut);

    const commande = await kv.get(`commande:${commandeId}`);
    if (!commande) {
      console.log('❌ Commande not found:', commandeId);
      return c.json({ error: "Commande not found" }, 404);
    }

    // Validate status
    const validStatuts = ['en_attente', 'acceptee', 'en_cours', 'terminee', 'annulee'];
    if (statut && !validStatuts.includes(statut)) {
      return c.json({ error: "Invalid status" }, 400);
    }

    // If accepting order, deduct stock
    if (statut === 'acceptee' && commande.statut === 'en_attente') {
      console.log('✅ Accepting order - deducting stock');
      for (const item of commande.produits) {
        const product = await kv.get(`product:${item.productId}`);
        if (product) {
          product.stock = Math.max(0, product.stock - item.quantite);
          await kv.set(`product:${item.productId}`, product);
          console.log(`📦 Stock updated for ${product.nom}: ${product.stock}`);
        }
      }
    }

    // If canceling accepted order, restore stock
    if (statut === 'annulee' && commande.statut === 'acceptee') {
      console.log('🔄 Canceling accepted order - restoring stock');
      for (const item of commande.produits) {
        const product = await kv.get(`product:${item.productId}`);
        if (product) {
          product.stock += item.quantite;
          await kv.set(`product:${item.productId}`, product);
          console.log(`📦 Stock restored for ${product.nom}: ${product.stock}`);
        }
      }
    }

    // Update commande
    if (statut !== undefined) {
      commande.statut = statut;
      commande.dateTraitement = new Date().toISOString();
      
      // Create notification for client if they have a userId
      if (commande.userId) {
        let notifTitle = '';
        let notifMessage = '';
        
        switch (statut) {
          case 'acceptee':
            notifTitle = '✅ Commande acceptée';
            notifMessage = `Votre commande #${commandeId.slice(0, 8)} a été acceptée et est en cours de préparation`;
            break;
          case 'en_cours':
            notifTitle = '🔄 Commande en cours';
            notifMessage = `Votre commande #${commandeId.slice(0, 8)} est en cours de traitement`;
            break;
          case 'terminee':
            notifTitle = '🎉 Commande terminée';
            notifMessage = `Votre commande #${commandeId.slice(0, 8)} est prête !`;
            break;
          case 'annulee':
            notifTitle = '❌ Commande annulée';
            notifMessage = `Votre commande #${commandeId.slice(0, 8)} a été annulée`;
            break;
        }
        
        if (notifTitle) {
          await notifications.createNotification(
            commande.userId,
            'commande',
            notifTitle,
            notifMessage,
            '/commandes',
            { commandeId, statut }
          );
        }
      }
    }
    if (notes !== undefined) {
      commande.notes = notes;
    }

    await kv.set(`commande:${commandeId}`, commande);
    console.log('✅ Commande updated:', commandeId);

    return c.json({ commande });
  } catch (error) {
    console.error("Update commande error:", error);
    return c.json({ error: "Failed to update commande" }, 500);
  }
});

// ============================================
// WEBHOOK ROUTES (Discord notifications)
// ============================================

// Get webhook config for entreprise (protected with admin password)
app.get("/make-server-dec47541/webhook/:entrepriseId", async (c) => {
  try {
    // Check admin password
    const adminPassword = c.req.header('X-Admin-Password');
    const correctPassword = Deno.env.get('WEBHOOK_ADMIN_PASSWORD');
    
    console.log('🔐 Admin password from header:', adminPassword ? '***' : 'MISSING');
    console.log('🔐 Correct password from env:', correctPassword ? '***' : 'NOT CONFIGURED');
    
    if (!correctPassword) {
      console.log('⚠️ WEBHOOK_ADMIN_PASSWORD not configured in environment');
      return c.json({ error: "Configuration serveur manquante - WEBHOOK_ADMIN_PASSWORD non configuré" }, 500);
    }
    
    if (!adminPassword || adminPassword !== correctPassword) {
      console.log('❌ Unauthorized webhook access attempt');
      return c.json({ error: "Mot de passe admin requis" }, 401);
    }

    const entrepriseId = c.req.param("entrepriseId");
    console.log('🔍 Getting webhook config for entreprise:', entrepriseId);

    const webhookConfig = await kv.get(`webhook:${entrepriseId}`);
    console.log('✅ Webhook config:', webhookConfig);
    
    return c.json({ 
      webhook: webhookConfig || { entrepriseId, webhookUrl: null } 
    });
  } catch (error) {
    console.error("Get webhook error:", error);
    return c.json({ error: "Failed to get webhook" }, 500);
  }
});

// Set webhook config for entreprise (protected with admin password)
app.put("/make-server-dec47541/webhook/:entrepriseId", async (c) => {
  try {
    // Check admin password
    const adminPassword = c.req.header('X-Admin-Password');
    const correctPassword = Deno.env.get('WEBHOOK_ADMIN_PASSWORD');
    
    if (!adminPassword || adminPassword !== correctPassword) {
      console.log('❌ Unauthorized webhook modification attempt');
      return c.json({ error: "Mot de passe admin requis" }, 401);
    }

    console.log('🔧 PUT /webhook - Setting webhook configuration');
    const entrepriseId = c.req.param("entrepriseId");
    console.log('🏢 Entreprise ID:', entrepriseId);

    const { webhookUrl } = await c.req.json();
    console.log('🔗 Webhook URL:', webhookUrl);

    const webhookConfig = {
      entrepriseId,
      webhookUrl: webhookUrl || null,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`webhook:${entrepriseId}`, webhookConfig);
    console.log('✅ Webhook configured successfully');

    return c.json({ webhook: webhookConfig });
  } catch (error) {
    console.error("Set webhook error:", error);
    return c.json({ error: "Failed to set webhook" }, 500);
  }
});

// ============================================
// TICKETS ROUTES (Support System)
// ============================================

// Create ticket (authenticated)
app.post("/make-server-dec47541/tickets", async (c) => {
  try {
    const user = await getAuthenticatedUser(c);
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { titre, categorie, priorite, message } = await c.req.json();

    if (!titre || !categorie || !message) {
      return c.json({ error: "Titre, catégorie et message requis" }, 400);
    }

    const ticket = {
      id: crypto.randomUUID(),
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      titre,
      categorie, // 'technique', 'gameplay', 'entreprise', 'autre'
      priorite: priorite || 'normale', // 'basse', 'normale', 'haute', 'urgente'
      message,
      statut: 'ouvert', // 'ouvert', 'en_cours', 'resolu', 'ferme'
      reponses: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`ticket:${ticket.id}`, ticket);
    console.log('✅ Ticket created:', ticket.id);

    return c.json({ ticket });
  } catch (error) {
    console.error("Create ticket error:", error);
    return c.json({ error: "Failed to create ticket" }, 500);
  }
});

// Get all tickets (staff only)
app.get("/make-server-dec47541/tickets", async (c) => {
  try {
    const user = await getAuthenticatedUser(c);
    if (!user || user.grade !== 'staff') {
      return c.json({ error: "Staff access required" }, 403);
    }

    const tickets = await kv.getByPrefix("ticket:");
    tickets.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return c.json({ tickets });
  } catch (error) {
    console.error("Get tickets error:", error);
    return c.json({ error: "Failed to get tickets" }, 500);
  }
});

// Get user's tickets
app.get("/make-server-dec47541/my-tickets", async (c) => {
  try {
    const user = await getAuthenticatedUser(c);
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const allTickets = await kv.getByPrefix("ticket:");
    const userTickets = allTickets.filter((t: any) => t.userId === user.id);
    userTickets.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return c.json({ tickets: userTickets });
  } catch (error) {
    console.error("Get user tickets error:", error);
    return c.json({ error: "Failed to get tickets" }, 500);
  }
});

// Update ticket status (staff only)
app.put("/make-server-dec47541/tickets/:id", async (c) => {
  try {
    const user = await getAuthenticatedUser(c);
    if (!user || user.grade !== 'staff') {
      return c.json({ error: "Staff access required" }, 403);
    }

    const ticketId = c.req.param("id");
    const { statut, reponse } = await c.req.json();

    const ticket = await kv.get(`ticket:${ticketId}`);
    if (!ticket) {
      return c.json({ error: "Ticket not found" }, 404);
    }

    if (statut) {
      ticket.statut = statut;
      
      // Create notification for status change
      let notifTitle = '';
      let notifMessage = '';
      
      switch (statut) {
        case 'en-cours':
          notifTitle = '🔄 Ticket pris en charge';
          notifMessage = `Votre ticket "${ticket.titre}" est maintenant pris en charge par le staff`;
          break;
        case 'resolu':
          notifTitle = '✅ Ticket résolu';
          notifMessage = `Votre ticket "${ticket.titre}" a été résolu`;
          break;
        case 'ferme':
          notifTitle = '🔒 Ticket fermé';
          notifMessage = `Votre ticket "${ticket.titre}" a été fermé`;
          break;
      }
      
      if (notifTitle && ticket.userId) {
        await notifications.createNotification(
          ticket.userId,
          'ticket',
          notifTitle,
          notifMessage,
          '/tickets',
          { ticketId, statut }
        );
      }
    }

    if (reponse) {
      ticket.reponses.push({
        id: crypto.randomUUID(),
        userId: user.id,
        userName: user.name,
        message: reponse,
        createdAt: new Date().toISOString(),
      });
      
      // Create notification for staff response
      if (ticket.userId) {
        await notifications.createNotification(
          ticket.userId,
          'ticket',
          '💬 Nouvelle réponse',
          `Le staff a répondu à votre ticket "${ticket.titre}"`,
          '/tickets',
          { ticketId, hasResponse: true }
        );
      }
    }

    ticket.updatedAt = new Date().toISOString();
    await kv.set(`ticket:${ticketId}`, ticket);

    return c.json({ ticket });
  } catch (error) {
    console.error("Update ticket error:", error);
    return c.json({ error: "Failed to update ticket" }, 500);
  }
});

// ============================================
// EVENTS ROUTES (Calendar System)
// ============================================

// Create event (staff only)
app.post("/make-server-dec47541/events", async (c) => {
  try {
    const user = await getAuthenticatedUser(c);
    if (!user || user.grade !== 'staff') {
      return c.json({ error: "Staff access required" }, 403);
    }

    const { titre, description, date, heure, type, lieu } = await c.req.json();

    if (!titre || !date) {
      return c.json({ error: "Titre et date requis" }, 400);
    }

    const event = {
      id: crypto.randomUUID(),
      titre,
      description: description || '',
      date,
      heure: heure || '20:00',
      type: type || 'general', // 'general', 'pvp', 'construction', 'commerce', 'rp'
      lieu: lieu || 'Spawn',
      createdBy: user.name,
      participants: [],
      createdAt: new Date().toISOString(),
    };

    await kv.set(`event:${event.id}`, event);
    console.log('✅ Event created:', event.id);

    return c.json({ event });
  } catch (error) {
    console.error("Create event error:", error);
    return c.json({ error: "Failed to create event" }, 500);
  }
});

// Get all events (public)
app.get("/make-server-dec47541/events", async (c) => {
  try {
    const events = await kv.getByPrefix("event:");
    events.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return c.json({ events });
  } catch (error) {
    console.error("Get events error:", error);
    return c.json({ error: "Failed to get events" }, 500);
  }
});

// Join event (authenticated)
app.post("/make-server-dec47541/events/:id/join", async (c) => {
  try {
    const user = await getAuthenticatedUser(c);
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const eventId = c.req.param("id");
    const event = await kv.get(`event:${eventId}`);

    if (!event) {
      return c.json({ error: "Event not found" }, 404);
    }

    if (!event.participants.find((p: any) => p.userId === user.id)) {
      event.participants.push({
        userId: user.id,
        userName: user.name,
        joinedAt: new Date().toISOString(),
      });
      await kv.set(`event:${eventId}`, event);
    }

    return c.json({ event });
  } catch (error) {
    console.error("Join event error:", error);
    return c.json({ error: "Failed to join event" }, 500);
  }
});

// Delete event (staff only)
app.delete("/make-server-dec47541/events/:id", async (c) => {
  try {
    const user = await getAuthenticatedUser(c);
    if (!user || user.grade !== 'staff') {
      return c.json({ error: "Staff access required" }, 403);
    }

    const eventId = c.req.param("id");
    await kv.del(`event:${eventId}`);

    return c.json({ success: true });
  } catch (error) {
    console.error("Delete event error:", error);
    return c.json({ error: "Failed to delete event" }, 500);
  }
});

// ============================================
// REPUTATION ROUTES (Review System)
// ============================================

// Add review to entreprise
app.post("/make-server-dec47541/reviews", async (c) => {
  try {
    const user = await getAuthenticatedUser(c);
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { entrepriseId, note, commentaire } = await c.req.json();

    if (!entrepriseId || !note) {
      return c.json({ error: "Entreprise ID et note requis" }, 400);
    }

    if (note < 1 || note > 5) {
      return c.json({ error: "La note doit être entre 1 et 5" }, 400);
    }

    const review = {
      id: crypto.randomUUID(),
      entrepriseId,
      userId: user.id,
      userName: user.name,
      note,
      commentaire: commentaire || '',
      createdAt: new Date().toISOString(),
    };

    await kv.set(`review:${review.id}`, review);
    console.log('✅ Review created:', review.id);

    return c.json({ review });
  } catch (error) {
    console.error("Create review error:", error);
    return c.json({ error: "Failed to create review" }, 500);
  }
});

// Get reviews for entreprise (public)
app.get("/make-server-dec47541/reviews/:entrepriseId", async (c) => {
  try {
    const entrepriseId = c.req.param("entrepriseId");
    const allReviews = await kv.getByPrefix("review:");
    const reviews = allReviews.filter((r: any) => r.entrepriseId === entrepriseId);
    reviews.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Calculate average rating
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum: number, r: any) => sum + r.note, 0) / reviews.length
      : 0;

    return c.json({ reviews, avgRating, totalReviews: reviews.length });
  } catch (error) {
    console.error("Get reviews error:", error);
    return c.json({ error: "Failed to get reviews" }, 500);
  }
});

// ============================================
// ACCOUNT SETTINGS ROUTES
// ============================================

// Update password
app.put("/make-server-dec47541/account/password", async (c) => {
  try {
    const user = await getAuthenticatedUser(c);
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { currentPassword, newPassword } = await c.req.json();

    if (!currentPassword || !newPassword) {
      return c.json({ error: "Mots de passe requis" }, 400);
    }

    if (user.password !== currentPassword) {
      return c.json({ error: "Mot de passe actuel incorrect" }, 401);
    }

    if (newPassword.length < 6) {
      return c.json({ error: "Le nouveau mot de passe doit contenir au moins 6 caractères" }, 400);
    }

    user.password = newPassword;
    await kv.set(`user:${user.email}`, user);

    return c.json({ success: true, message: "Mot de passe modifié avec succès" });
  } catch (error) {
    console.error("Update password error:", error);
    return c.json({ error: "Failed to update password" }, 500);
  }
});

// ============================================
// NOTIFICATIONS ROUTES
// ============================================

// Get user notifications
app.get("/make-server-dec47541/notifications", async (c) => {
  try {
    const user = await getAuthenticatedUser(c);
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const allNotifications = await kv.getByPrefix("notification:");
    const userNotifications = allNotifications.filter((n: any) => n.userId === user.id);
    userNotifications.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const unreadCount = userNotifications.filter((n: any) => !n.read).length;

    return c.json({ notifications: userNotifications, unreadCount });
  } catch (error) {
    console.error("Get notifications error:", error);
    return c.json({ error: "Failed to get notifications" }, 500);
  }
});

// Mark notification as read
app.put("/make-server-dec47541/notifications/:id/read", async (c) => {
  try {
    const user = await getAuthenticatedUser(c);
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const notificationId = c.req.param("id");
    const notification = await kv.get(`notification:${notificationId}`);

    if (!notification || notification.userId !== user.id) {
      return c.json({ error: "Notification not found" }, 404);
    }

    notification.read = true;
    await kv.set(`notification:${notificationId}`, notification);

    return c.json({ success: true });
  } catch (error) {
    console.error("Mark notification read error:", error);
    return c.json({ error: "Failed to mark notification as read" }, 500);
  }
});

// Mark all notifications as read
app.put("/make-server-dec47541/notifications/read-all", async (c) => {
  try {
    const user = await getAuthenticatedUser(c);
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const allNotifications = await kv.getByPrefix("notification:");
    const userNotifications = allNotifications.filter((n: any) => n.userId === user.id && !n.read);

    for (const notification of userNotifications) {
      notification.read = true;
      await kv.set(`notification:${notification.id}`, notification);
    }

    console.log(`✅ Marked ${userNotifications.length} notifications as read for user:`, user.id);
    return c.json({ success: true, count: userNotifications.length });
  } catch (error) {
    console.error("Mark all notifications read error:", error);
    return c.json({ error: "Failed to mark all notifications as read" }, 500);
  }
});

// Delete notification
app.delete("/make-server-dec47541/notifications/:id", async (c) => {
  try {
    const user = await getAuthenticatedUser(c);
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const notificationId = c.req.param("id");
    const notification = await kv.get(`notification:${notificationId}`);

    if (!notification || notification.userId !== user.id) {
      return c.json({ error: "Notification not found" }, 404);
    }

    await kv.del(`notification:${notificationId}`);
    return c.json({ success: true });
  } catch (error) {
    console.error("Delete notification error:", error);
    return c.json({ error: "Failed to delete notification" }, 500);
  }
});

// ============================================
// ADMIN PROMOTION ROUTE (temporary for setup)
// ============================================

// Promote admin account to staff (one-time setup)
app.post("/make-server-dec47541/admin/promote", async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    if (!email || !password) {
      return c.json({ error: "Email et mot de passe requis" }, 400);
    }
    
    const user = await kv.get(`user:${email}`);
    
    if (!user) {
      return c.json({ error: "Utilisateur introuvable" }, 404);
    }
    
    if (user.password !== password) {
      return c.json({ error: "Mot de passe incorrect" }, 401);
    }
    
    // Promote to staff
    user.grade = 'staff';
    await kv.set(`user:${email}`, user);
    
    console.log('✅ User promoted to staff:', email);
    
    return c.json({ 
      success: true, 
      message: "Vous êtes maintenant staff !",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        grade: user.grade,
        entrepriseId: user.entrepriseId,
        role: user.role,
        permissions: user.permissions,
      }
    });
  } catch (error) {
    console.error("Admin promote error:", error);
    return c.json({ error: "Failed to promote user" }, 500);
  }
});

Deno.serve(app.fetch);
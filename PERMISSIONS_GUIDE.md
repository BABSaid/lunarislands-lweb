# 📋 Guide du Système de Permissions - LunarisLands

## 🎯 Vue d'ensemble

Le système de permissions de LunarisLands fonctionne sur **2 niveaux** :

1. **RÔLE** (role) : Définit l'accès global (staff, manager, player)
2. **GRADE** (grade) : Définit l'accès au sein d'une entreprise (patron, co-gérant, employé senior, employé, player)

---

## 🔑 Les Rôles (Niveau Global)

### 🔴 STAFF (Administrateur)
- **Accès** : Toutes les fonctionnalités du serveur
- **Panel** : `/staff` 
- **Qui peut attribuer** : Seulement les autres Staff via le StaffPanel
- **Comment** : StaffPanel → Gestion des utilisateurs → Modifier le rôle

### 🟣 MANAGER (Gérant d'entreprise)
- **Accès** : Panel de gestion de leur entreprise
- **Panel** : `/manager`
- **Qui peut attribuer** : Staff uniquement
- **Particularité** : Doit être assigné à une entreprise (entrepriseId)

### 🔵 PLAYER (Joueur)
- **Accès** : Site web public uniquement
- **Panel** : Aucun
- **Rôle par défaut** : Oui (lors de l'inscription)

---

## 🏢 Les Grades (Niveau Entreprise)

Les grades définissent les permissions **au sein d'une entreprise**. Voici la hiérarchie :

### 1️⃣ PATRON (Propriétaire)
**Permissions :**
- ✅ `manage_grades` - Modifier les grades des employés
- ✅ `manage_members` - Ajouter/retirer des employés
- ✅ `edit_entreprise` - Modifier les infos de l'entreprise
- ✅ `view_stats` - Voir les statistiques

**Peut faire :**
- Promouvoir/rétrograder TOUS les employés (sauf lui-même)
- Ajouter/retirer des employés
- Modifier la description et spécialité de l'entreprise
- Accéder au Dashboard complet

**Qui peut l'attribuer :**
- Staff uniquement (généralement le créateur de l'entreprise)

---

### 2️⃣ CO-GÉRANT (Manager secondaire)
**Permissions :**
- ✅ `manage_members` - Ajouter/retirer des employés
- ✅ `view_stats` - Voir les statistiques

**Peut faire :**
- Gérer les employés de grade inférieur (Senior et Employé)
- Ajouter des nouveaux employés
- Voir le Dashboard et les stats

**Ne peut PAS faire :**
- Modifier les informations de l'entreprise
- Promouvoir au grade Patron ou Co-gérant
- Gérer d'autres Co-gérants

**Qui peut l'attribuer :**
- Patron de l'entreprise
- Staff

---

### 3️⃣ EMPLOYÉ SENIOR (Senior)
**Permissions :**
- ✅ `view_stats` - Voir les statistiques
- ✅ `view_members` - Voir la liste des membres

**Peut faire :**
- Voir le Dashboard (lecture seule)
- Consulter la liste des employés
- Voir les statistiques de l'entreprise

**Ne peut PAS faire :**
- Modifier quoi que ce soit
- Gérer des employés

**Qui peut l'attribuer :**
- Patron
- Co-gérant
- Staff

---

### 4️⃣ EMPLOYÉ (Employé standard)
**Permissions :**
- ✅ `view_basic` - Accès basique uniquement

**Peut faire :**
- Voir qu'il fait partie de l'entreprise
- Voir son propre grade

**Ne peut PAS faire :**
- Accéder au Dashboard
- Voir les autres employés
- Modifier quoi que ce soit

**Qui peut l'attribuer :**
- Patron
- Co-gérant
- Staff

---

### 5️⃣ PLAYER (Pas dans une entreprise)
**Permissions :**
- ❌ Aucune permission d'entreprise

**Statut :**
- N'appartient à aucune entreprise
- Grade par défaut

---

## 🛠️ Comment Définir les Permissions

### 📍 **Localisation dans le code**

Les permissions sont définies dans :
```
/supabase/functions/server/index.tsx
Lignes 459-472
```

### 📝 **Structure actuelle :**

```typescript
const PERMISSIONS = {
  // Staff : Tous pouvoirs
  staff: [
    'manage_all_entreprises',  // Gérer toutes les entreprises
    'manage_users',            // Gérer tous les utilisateurs
    'view_all',               // Tout voir
    'manage_grades',          // Modifier les grades
    'manage_members',         // Gérer les membres
    'edit_entreprise',        // Modifier l'entreprise
    'view_stats'              // Voir les stats
  ],
  
  // Patron : Contrôle total de son entreprise
  patron: [
    'manage_grades',          // Modifier les grades
    'manage_members',         // Gérer les membres
    'edit_entreprise',        // Modifier l'entreprise
    'view_stats'              // Voir les stats
  ],
  
  // Co-gérant : Gestion des membres uniquement
  'co-gerant': [
    'manage_members',         // Gérer les membres
    'view_stats'              // Voir les stats
  ],
  
  // Employé Senior : Consultation uniquement
  'employe-senior': [
    'view_stats',             // Voir les stats
    'view_members'            // Voir les membres
  ],
  
  // Employé : Accès minimal
  'employe': [
    'view_basic'              // Accès basique
  ],
  
  // Player : Aucun accès entreprise
  player: []
};
```

---

## 🔧 Comment Modifier les Permissions

### **Option 1 : Ajouter une nouvelle permission**

1. Ouvrez `/supabase/functions/server/index.tsx`
2. Trouvez la section `PERMISSIONS` (ligne 459)
3. Ajoutez la permission au(x) grade(s) souhaité(s)

**Exemple** : Permettre aux Co-gérants de modifier l'entreprise

```typescript
'co-gerant': [
  'manage_members',
  'view_stats',
  'edit_entreprise'  // ← NOUVELLE PERMISSION
],
```

### **Option 2 : Créer un nouveau grade personnalisé**

```typescript
const PERMISSIONS = {
  // ... grades existants ...
  
  // Nouveau grade : Responsable RH
  'responsable-rh': [
    'manage_members',      // Peut recruter/virer
    'view_stats',          // Peut voir les stats
    'view_all_profiles'    // Nouvelle permission custom
  ],
};
```

### **Option 3 : Retirer une permission**

Supprimez simplement la ligne de permission du grade :

```typescript
'employe-senior': [
  'view_stats',
  // 'view_members' ← SUPPRIMÉ : ne peuvent plus voir les membres
],
```

---

## 👥 Comment Attribuer un Grade à un Utilisateur

### **Méthode 1 : Via le StaffPanel (Recommandé)**

1. Connectez-vous en tant que Staff
2. Allez sur `/staff`
3. Section "Gestion des utilisateurs"
4. Cliquez sur "Modifier" à côté de l'utilisateur
5. Changez le rôle et/ou assignez à une entreprise

### **Méthode 2 : Via le ManagerPanel**

1. Connectez-vous en tant que Patron ou Co-gérant
2. Allez sur `/manager`
3. Onglet "Employés"
4. Utilisez le composant "Gestion des Employés"
5. Ajoutez un employé ou modifiez son grade

**Limitations :**
- Un Manager ne peut gérer que les employés de SA propre entreprise
- Un Co-gérant ne peut pas promouvoir au grade Patron ou Co-gérant

### **Méthode 3 : Via l'API (Pour développeurs)**

**Endpoint :** `PUT /make-server-dec47541/entreprise/:entrepriseId/employee/:employeeId/grade`

**Exemple :**
```javascript
fetch(`https://${projectId}.supabase.co/functions/v1/make-server-dec47541/entreprise/123/employee/456/grade`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    grade: 'employe-senior'
  })
});
```

---

## 🔒 Hiérarchie des Permissions

### Qui peut modifier qui ?

```
STAFF
  ↓ Peut tout modifier
  ├─ PATRON
  │   ↓ Peut modifier
  │   ├─ CO-GÉRANT
  │   │   ↓ Peut modifier
  │   │   ├─ EMPLOYÉ SENIOR
  │   │   └─ EMPLOYÉ
  │   ├─ EMPLOYÉ SENIOR
  │   └─ EMPLOYÉ
  │
  ├─ MANAGER (rôle, pas grade)
  └─ PLAYER
```

### Règles de sécurité :

1. **Un utilisateur ne peut jamais modifier son propre grade**
2. **On ne peut modifier que des grades inférieurs au sien**
3. **Staff a TOUS les droits, même sur d'autres Staff**
4. **Les permissions sont vérifiées côté serveur** (impossible de bypass)

---

## 📊 Permissions Disponibles Actuellement

| Permission | Description | Grades qui l'ont |
|------------|-------------|------------------|
| `manage_all_entreprises` | Gérer toutes les entreprises | Staff |
| `manage_users` | Gérer tous les utilisateurs | Staff |
| `view_all` | Tout voir sur le serveur | Staff |
| `manage_grades` | Modifier les grades des employés | Staff, Patron |
| `manage_members` | Ajouter/retirer des employés | Staff, Patron, Co-gérant |
| `edit_entreprise` | Modifier les infos de l'entreprise | Staff, Patron |
| `view_stats` | Voir les statistiques | Staff, Patron, Co-gérant, Senior |
| `view_members` | Voir la liste des membres | Staff, Patron, Co-gérant, Senior |
| `view_basic` | Accès basique | Employé |

---

## 🎮 Exemples d'Utilisation

### Scénario 1 : Nouveau joueur rejoint une entreprise

```
1. Un Staff ou Patron ajoute le joueur via ManagerPanel
2. Le joueur est ajouté avec le grade "employe" par défaut
3. Permissions automatiques : ['view_basic']
4. Le joueur peut voir qu'il fait partie de l'entreprise
```

### Scénario 2 : Promotion d'un employé

```
1. Le Patron accède au ManagerPanel → Onglet Employés
2. Clique sur "Modifier le grade" de l'employé
3. Sélectionne "Employé Senior"
4. Permissions mises à jour automatiquement : ['view_stats', 'view_members']
5. L'employé peut maintenant voir le Dashboard et les stats
```

### Scénario 3 : Nommer un Co-gérant

```
1. Seul le Patron ou un Staff peut le faire
2. ManagerPanel → Employés → Modifier grade → "Co-gérant"
3. Permissions : ['manage_members', 'view_stats']
4. Le Co-gérant peut maintenant recruter et gérer des employés juniors
```

---

## 🚀 Ajouter Vos Propres Permissions

### Étape 1 : Définir la permission dans le backend

Éditez `/supabase/functions/server/index.tsx` :

```typescript
const PERMISSIONS = {
  // Ajoutez votre nouvelle permission ici
  'employe-senior': [
    'view_stats',
    'view_members',
    'create_announcements'  // ← NOUVELLE !
  ],
};
```

### Étape 2 : Utiliser la permission dans une route

```typescript
app.post("/make-server-dec47541/announcements", async (c) => {
  const user = await getAuthenticatedUser(c);
  
  // Vérifier la permission
  if (!hasPermission(user, 'create_announcements')) {
    return c.json({ error: "Permission refusée" }, 403);
  }
  
  // ... créer l'annonce
});
```

### Étape 3 : Vérifier dans le frontend

```typescript
// Dans votre composant React
const canCreateAnnouncement = user.permissions.includes('create_announcements');

{canCreateAnnouncement && (
  <button onClick={createAnnouncement}>
    Créer une annonce
  </button>
)}
```

---

## ❓ FAQ

### Q : Comment rendre quelqu'un Staff ?
**R :** Seul un Staff existant peut promouvoir quelqu'un au rôle Staff via le StaffPanel.

### Q : Peut-on avoir plusieurs Patrons dans une entreprise ?
**R :** Oui, techniquement possible, mais généralement une entreprise a un seul Patron.

### Q : Un Co-gérant peut-il promouvoir un Employé en Co-gérant ?
**R :** Non, seul le Patron ou un Staff peut le faire.

### Q : Les permissions sont-elles vérifiées côté client ou serveur ?
**R :** **Les deux !** Côté client pour l'UX, côté serveur pour la sécurité.

### Q : Que se passe-t-il si je supprime toutes les permissions d'un grade ?
**R :** L'utilisateur ne pourra rien faire dans l'entreprise, mais pourra toujours naviguer sur le site.

---

## 🔐 Sécurité

### Bonnes pratiques :

✅ **Toujours vérifier les permissions côté serveur**
✅ **Ne jamais faire confiance aux données du client**
✅ **Logger les modifications de permissions**
✅ **Limiter qui peut modifier les rôles Staff**
✅ **Utiliser le principe du moindre privilège**

### Mauvaises pratiques :

❌ Donner trop de permissions par défaut
❌ Permettre aux utilisateurs de modifier leurs propres permissions
❌ Ne vérifier les permissions que côté client
❌ Utiliser `role === 'staff'` au lieu de `hasPermission()`

---

## 📞 Besoin d'aide ?

Si vous avez besoin de modifier le système de permissions ou d'ajouter de nouvelles fonctionnalités, n'hésitez pas à demander !

---

**Dernière mise à jour :** Février 2026
**Version du système :** 1.0
**Serveur :** LunarisLands Semi-RP 1.21.4 NeoForge

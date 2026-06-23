# Project Team Members - Quick Testing Guide

## Quick Start Testing

### 1. View Assigned Team Members on Project Detail Page
**Steps:**
1. Navigate to any project (e.g., `/projects/{projectId}`)
2. Scroll down past the metrics cards
3. Look for "Assigned Team Members" section (before "Workspace Hub")

**Expected Result:**
- Shows count of assigned members
- Displays grid of member cards
- Each card shows: avatar (initial), name, role, email

---

### 2. Filter Team Members by Project
**Steps:**
1. Go to Admin → Team (Employees page)
2. Look for "Filter by Project" dropdown above the members table
3. Select a project from dropdown
4. Observe members table updates

**Expected Result:**
- Dropdown shows list of all projects
- "All Projects" option shows all workspace members
- Specific project selection shows only that project's members
- Search still works within filtered results

---

### 3. Create Project with Team Assignment
**Steps:**
1. Click Create Project
2. Go through Steps 1 & 2 (Details & Settings)
3. In Step 2, scroll down to "Team Members" section
4. Click "Select members..." dropdown
5. Check multiple team members
6. Submit project

**Expected Result:**
- Team members selector visible to admins only
- Can multi-select members
- Count shows "Selected Members: X"
- Project created with assigned members

---

### 4. Edit Project and Modify Team Members
**Steps:**
1. Go to any project
2. Click Edit (gear icon or menu)
3. In modal, scroll to "Team Members" section
4. Add or remove members
5. Click "Save changes"

**Expected Result:**
- Team members selector visible
- Changes saved successfully
- Notifications sent to added members
- Notifications sent to removed members

---

### 5. Verify Notifications on Member Assignment
**Setup (Two Browser Tabs):**
- Tab A: Admin user logged in
- Tab B: Employee user logged in (viewing notifications)

**Steps:**
1. In Tab A: Create new project and assign Tab B user
2. Watch Tab B notification badge
3. Check notification content

**Expected Result:**
- Notification badge updates in real-time
- Notification text: "You have been assigned to project {name}"
- Notification visible on notifications page
- Can click to view project

---

### 6. Verify Admin-Only Controls
**As Regular Employee:**
1. Go to Create Project page
2. Scroll to Step 2 Settings
3. Look for Team Members section

**Expected Result:**
- ✅ Team Members section should NOT be visible
- ✅ No way to assign members
- Only title, description, status, priority, deadline shown

**As Admin:**
1. Same steps
2. Look for Team Members section

**Expected Result:**
- ✅ Team Members section IS visible
- ✅ Can select/deselect members
- Dropdown shows all workspace members

---

## API Endpoints for Manual Testing

### Get All Projects
```
GET /api/projects
Authorization: Bearer {token}
```

### Get Project Members
```
GET /api/projects/{projectId}/members
Authorization: Bearer {token}
```

### Get Workspace Members
```
GET /api/team/members
Authorization: Bearer {token}
```

### Create Project with Members
```
POST /api/projects
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Test Project",
  "description": "Test Description",
  "status": "Planning",
  "priority": "High",
  "teamMembers": ["userId1", "userId2"]
}
```

### Update Project Members
```
PUT /api/projects/{projectId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "teamMembers": ["userId1", "userId3"]
}
```

---

## Common Issues & Solutions

### Issue: Team Members selector not showing
- ✅ Check user role - must be admin
- ✅ Check user?.role in Edit/Create modals
- ✅ Clear browser cache and reload

### Issue: No notifications appearing
- ✅ Check if teamMembers array changed (need at least 1 add/remove)
- ✅ Open Dev Tools → Console for errors
- ✅ Verify Socket.IO connection is active
- ✅ Check user is logged in on another tab

### Issue: Project filter showing no projects
- ✅ Verify projects exist in database
- ✅ Check GET /api/projects returns data
- ✅ Verify authorization header is set

### Issue: Project members list empty
- ✅ Select a project from dropdown
- ✅ Wait 1-2 seconds for API call to complete
- ✅ Check network tab for failed requests

---

## Performance Notes

- Team members dropdown loads on mount (for create)
- On Edit, dropdown loads when modal opens
- Project filter loads all projects on component mount
- Project members loaded dynamically when project selected

---

## Browser Console Debugging

Enable these logs to see what's happening:

```js
// In ProjectDetailPage or EditProjectModal
console.log("[ProjectDetailPage] Loaded project", {
  teamMembers: project.teamMembers,
  memberCount: project.teamMembers?.length
});

// In AdminEmployeesPage
console.log("[Projects Filter] Loaded projects", projects);
console.log("[Project Members] Selected", selectedProjectId, projectMembers);
```

---

## Data Verification

### Check MongoDB for team members
```js
db.projects.findOne({_id: ObjectId("...")}, {teamMembers: 1})
// Should return array of user ObjectIds

db.projects.findOne({_id: ObjectId("...")})
.populate('teamMembers', 'name email role')
// Should return populated user objects
```

---

## Rollback Plan

If issues occur, revert these files:
1. `client/src/pages/projects/ProjectDetailPage.tsx`
2. `client/src/pages/admin/AdminEmployeesPage.tsx`
3. `client/src/pages/projects/EditProjectModal.tsx`
4. `client/src/pages/projects/CreateProjectPage.tsx`

**Note:** No backend changes made - notifications already working.

---

## Success Confirmation

All features working when:
- ✅ Team members visible on project detail page
- ✅ Project filter works on team page
- ✅ Can create/edit projects with members
- ✅ Members assigned to projects correctly
- ✅ Notifications send in real-time
- ✅ Admin-only controls enforced
- ✅ Employee dashboards show only assigned projects

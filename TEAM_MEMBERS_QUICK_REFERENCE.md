# Team Members System - Developer Quick Reference

## Quick Links

- **Implementation Guide**: `TEAM_MEMBERS_IMPLEMENTATION.md`
- **Testing Guide**: `TEAM_MEMBERS_TESTING_GUIDE.md`
- **Full Changelog**: `CHANGELOG.md`

---

## 5 Files Modified (Frontend Only)

| File | Changes | Lines |
|------|---------|-------|
| ProjectDetailPage.tsx | Added team members display section | +60 |
| AdminEmployeesPage.tsx | Added project filter dropdown + member loading | +100 |
| EditProjectModal.tsx | Fixed state, added team selector (admin-only) | +40, -10 |
| CreateProjectPage.tsx | Added missing loadingMembers state | +1 |
| **Total Impact** | **Team member assignment system complete** | **~191** |

---

## Key Implementation Details

### 1. Team Members Display (ProjectDetailPage)

```tsx
// Conditional section - only shows if members exist
{project.teamMembers && project.teamMembers.length > 0 && (
  <motion.section>
    <div>
      <h2>Assigned Team Members</h2>
      <p>{project.teamMembers.length} member(s)</p>
    </div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {project.teamMembers.map(member => (
        <div key={member._id}>
          <Avatar>{member.name[0]}</Avatar>
          <p>{member.name}</p>
          <p>{member.role}</p>
          <p>{member.email}</p>
        </div>
      ))}
    </div>
  </motion.section>
)}
```

### 2. Project Filter (AdminEmployeesPage)

```tsx
// Load projects on mount
useEffect(() => {
  api.get("/projects")
    .then(res => setProjects(res.data.projects))
}, []);

// Load project members when selected
useEffect(() => {
  if (!selectedProjectId) {
    setProjectMembers([]);
    return;
  }
  api.get(`/projects/${selectedProjectId}/members`)
    .then(res => setProjectMembers(res.data.members))
}, [selectedProjectId]);

// Show filtered members
const displayMembers = selectedProjectId ? projectMembers : members;
```

### 3. Team Member Selector (Admin-Only)

```tsx
// In both EditProjectModal and CreateProjectPage
{user?.role === "admin" && (
  <div>
    <button onClick={() => setDropdownOpen(!dropdownOpen)}>
      {selectedTeamMembers.length === 0 
        ? "Select members..." 
        : `Selected: ${selectedTeamMembers.length}`}
    </button>
    
    {dropdownOpen && (
      <div>
        {teamMembers.map(member => (
          <label key={member._id}>
            <input
              type="checkbox"
              checked={selectedTeamMembers.includes(member._id)}
              onChange={e => {
                const newSel = e.target.checked
                  ? [...selectedTeamMembers, member._id]
                  : selectedTeamMembers.filter(id => id !== member._id);
                setSelectedTeamMembers(newSel);
              }}
            />
            <div>
              <p>{member.name}</p>
              <p>{member.email}</p>
            </div>
          </label>
        ))}
      </div>
    )}
  </div>
)}
```

---

## API Endpoints Reference

### Get All Projects
```ts
GET /api/projects
// Returns: { projects: Project[] }
// Used by: AdminEmployeesPage filter dropdown
```

### Get Project Members
```ts
GET /api/projects/:id/members
// Returns: { members: User[] }
// Used by: AdminEmployeesPage member list when project selected
```

### Get All Team Members
```ts
GET /api/team/members
// Returns: { members: User[] }
// Used by: CreateProjectPage, EditProjectModal team selector
```

### Create Project with Members
```ts
POST /api/projects
{
  title: string
  description: string
  status: "Planning" | "Active" | "Completed"
  priority: "Low" | "Medium" | "High"
  deadline?: string
  teamMembers?: string[] // User IDs
}
// Notifications sent to all assigned members
```

### Update Project Members
```ts
PUT /api/projects/:id
{
  teamMembers: string[] // User IDs
  // Other fields optional
}
// Detects added/removed members and sends notifications
```

---

## State Management Pattern

### ProjectDetailPage
```tsx
const [project, setProject] = useState<Project | null>(null);
// project.teamMembers populated from API with user details
```

### AdminEmployeesPage
```tsx
const [projects, setProjects] = useState<Project[]>([]);
const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
const [projectMembers, setProjectMembers] = useState<User[]>([]);
const [projectMembersLoading, setProjectMembersLoading] = useState(false);

// Display logic
const displayMembers = selectedProjectId ? projectMembers : members;
```

### EditProjectModal / CreateProjectPage
```tsx
const [teamMembers, setTeamMembers] = useState<Array<{_id: string, name: string, email: string}>>([]);
const [selectedTeamMembers, setSelectedTeamMembers] = useState<string[]>([]);
const [dropdownOpen, setDropdownOpen] = useState(false);
const [loadingMembers, setLoadingMembers] = useState(false);
```

---

## Role-Based Access

### Admin
- ✅ See team member selector in Create/Edit forms
- ✅ Assign members to projects
- ✅ Remove members from projects
- ✅ View project members filter
- ✅ See all project details

### Employee
- ❌ Cannot see team member selector
- ❌ Cannot assign/remove members
- ✅ Can view projects they're assigned to
- ✅ Can see team members section on project detail
- ✅ Receive notifications when assigned

---

## Notification System (Backend - No Changes)

### Automatic Notifications
1. **Project Created**
   - When: Admin creates project with teamMembers
   - To: Each assigned member
   - Message: "You have been assigned to project {title}"

2. **Member Added**
   - When: Admin adds member to existing project
   - To: Newly added members
   - Message: "You have been added to project {title}"

3. **Member Removed**
   - When: Admin removes member from project
   - To: Removed members
   - Message: "You have been removed from project {title}"

4. **Project Updated**
   - When: Any project details change
   - To: All team members (except who made change)
   - Message: "{title} was updated"

---

## Testing Checklist

```
FUNCTIONALITY
- [ ] Create project with team members
- [ ] Edit project and add members
- [ ] Edit project and remove members
- [ ] Filter team page by project
- [ ] View team members on project detail
- [ ] Receive notifications on assignment

ADMIN RESTRICTIONS
- [ ] Team selector hidden from employees
- [ ] Only admins can see selector
- [ ] API rejects non-admin member changes

REAL-TIME
- [ ] Notifications appear immediately
- [ ] Badge updates without refresh
- [ ] Multiple browsers sync correctly

RESPONSIVE
- [ ] Mobile: Single column members
- [ ] Tablet: Two columns
- [ ] Desktop: Three columns
```

---

## Common Edits

### Add Field to Member Card
```tsx
// In ProjectDetailPage, within member card
<p className="text-xs text-slate-600">{member.department}</p>
```

### Change Grid Columns
```tsx
// In ProjectDetailPage
<div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
  {/* Was: sm:grid-cols-2 lg:grid-cols-3 */}
  {/* Now: sm:grid-cols-3 lg:grid-cols-4 */}
</div>
```

### Filter Projects by Name
```tsx
// In AdminEmployeesPage, add to useEffect after loading
const filtered = projects.filter(p => 
  p.title.toLowerCase().includes(searchTerm.toLowerCase())
);
setProjects(filtered);
```

---

## Debugging Tips

### Check Redux/Store
```ts
// In browser console
const state = store.getState();
console.log(state.auth.user); // Check role
console.log(state.projects); // If using Redux
```

### Network Debugging
```ts
// In browser DevTools → Network
// Filter for /api/projects
// Check response includes populated teamMembers
```

### Component State
```tsx
// Add to component
console.log("Team Members:", teamMembers);
console.log("Selected:", selectedTeamMembers);
console.log("Loading:", loadingMembers);
```

### Notifications
```ts
// Check Socket.IO
socket.on("notification:created", (notification) => {
  console.log("New notification:", notification);
});
```

---

## Performance Notes

- **Initial Load**: Projects fetched once on AdminEmployeesPage mount
- **Project Switch**: Members refetched when project selected
- **Selector Load**: Team members fetched on modal open (admins only)
- **No Pagination**: All members loaded (fine for <1000 members)

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Team members not showing | Check API returns populated data |
| Selector not visible | Verify `user?.role === "admin"` |
| Project filter empty | Check API endpoint `/api/projects` |
| Members not filtering | Verify `selectedProjectId` state |
| Notifications delayed | Check Socket.IO connection |

---

## File Locations Quick Link

```
client/
├── src/
│   ├── pages/
│   │   ├── projects/
│   │   │   ├── ProjectDetailPage.tsx ← Team members display
│   │   │   ├── EditProjectModal.tsx ← Admin team selector
│   │   │   └── CreateProjectPage.tsx ← Admin team selector
│   │   └── admin/
│   │       └── AdminEmployeesPage.tsx ← Project filter
│   └── types/
│       ├── project.types.ts ← Project interface with teamMembers
│       └── auth.types.ts ← User interface with role
```

---

## Code Standards Used

- **TypeScript**: Strict mode with proper types
- **React**: Functional components with hooks
- **Styling**: Tailwind CSS with shadcn/ui components
- **State**: React useState for local state
- **API**: Axios with error handling
- **Animations**: Framer Motion for transitions

---

## Related Documentation

- Backend Schema: `server/src/models/Project.ts` (teamMembers field)
- Notifications: `server/src/services/notification.service.ts`
- Routes: `server/src/routes/project.routes.ts`
- Controller: `server/src/controllers/project.controller.ts`

---

## Questions?

Refer to:
1. `TEAM_MEMBERS_IMPLEMENTATION.md` - Detailed overview
2. `TEAM_MEMBERS_TESTING_GUIDE.md` - How to test
3. Code comments in modified files
4. Backend implementation in server/src

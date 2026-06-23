# Analytics Quick Reference

## For Developers

### Accessing Analytics

**Admin View** (See All):
```typescript
// Frontend
import { AnalyticsPage } from "@/pages/analytics/AnalyticsPage";

// Backend - Automatic role detection
GET /api/analytics/data
```

**Employee View** (See Only Personal):
```typescript
// Same endpoint, different data based on req.user.role
GET /api/analytics/data
```

### Triggering Real-Time Updates

**After creating/updating a task**:
```typescript
import { emitAnalyticsRefresh, emitAnalyticsRefreshToUser } from "../realtime/socket.ts";

// Refresh all users in workspace
emitAnalyticsRefresh(workspaceId);

// Refresh specific user
emitAnalyticsRefreshToUser(userId);
```

**Example from Task Controller**:
```typescript
// In createTask, updateTask, deleteTask
emitAnalyticsRefresh(workspaceId);
emitAnalyticsRefreshToUser(assignedToId);
```

### Frontend Usage

**Import in Component**:
```typescript
import { analyticsService, type AnalyticsData } from "@/services";

// Fetch analytics
const data = await analyticsService.getData(projectId);

// Fetch projects for dropdown
const projects = await analyticsService.getProjects();
```

**Listen to Real-Time Updates**:
```typescript
import { getSocket } from "@/lib/socket";

const socket = getSocket(token);
socket.connect();
socket.on("analytics:refresh", () => {
  // Reload analytics
});
```

## Data Structure

### Admin Analytics Response
```json
{
  "role": "admin",
  "totalProjects": 5,
  "activeProjects": 3,
  "completedProjects": 2,
  "totalTasks": 150,
  "completedTasks": 89,
  "completionRate": 59,
  "statusDistribution": [
    { "status": "Completed", "count": 89 },
    { "status": "In Progress", "count": 20 }
  ],
  "priorityDistribution": [
    { "priority": "High", "count": 30 },
    { "priority": "Medium", "count": 70 }
  ],
  "workloadDistribution": [
    { "employeeId": "...", "employeeName": "John", "taskCount": 12 }
  ],
  "projectProgressComparison": [
    { "projectName": "Aurora", "completionPercent": 75 }
  ],
  "completionTrend": [
    { "date": "2024-01-08", "count": 5 }
  ],
  "recentActivity": [
    { "type": "Task Update", "description": "...", "timestamp": "..." }
  ],
  "upcomingDeadlines": [
    { "title": "...", "dueDate": "...", "status": "..." }
  ]
}
```

### Employee Analytics Response
```json
{
  "role": "employee",
  "assignedProjects": 3,
  "assignedTasks": 12,
  "completedTasks": 8,
  "completionRate": 67,
  "personalStatusDistribution": [...],
  "completionTrend": [...],
  "deadlines": [...]
}
```

## Security Rules

✅ **Always Check**:
- `req.user.role` - Detect user type
- `workspaceId` - Filter data by workspace
- `assignedTo` - Employees see only their tasks

❌ **Never**:
- Hardcode role checks in frontend
- Skip server-side validation
- Return all data and filter on client
- Trust frontend role claims

## Common Issues & Fixes

### Issue: Analytics shows no data
**Check**:
1. User has tasks assigned: `db.tasks.find({assignedTo: userId})`
2. Tasks have workspaceId: `db.tasks.find({workspaceId: wsId})`
3. Projects exist: `db.projects.find({workspaceId: wsId})`

### Issue: Real-time updates not working
**Check**:
1. Socket is connected: `socket.connected === true`
2. User is in workspace room: `socket.rooms` includes workspaceId
3. Server emits event: Check `emitAnalyticsRefresh` is called
4. Browser has token: `localStorage.getItem('token')`

### Issue: Employee sees workspace data
**Check**:
1. Backend role check: `if (userRole === "employee")`
2. Database query filter: `assignedTo: uid`
3. Response data: Should have `role: "employee"`

## Database Indexes

Ensure these indexes exist for performance:

```javascript
// In MongoDB
db.tasks.createIndex({ workspaceId: 1, assignedTo: 1 })
db.tasks.createIndex({ workspaceId: 1, status: 1 })
db.tasks.createIndex({ workspaceId: 1, priority: 1 })
db.tasks.createIndex({ updatedAt: 1 })
db.projects.createIndex({ workspaceId: 1, status: 1 })
db.users.createIndex({ workspaceId: 1, role: 1 })
```

## Adding New Metrics

**1. Update Controller**:
```typescript
// In getAnalyticsData
const newMetric = await Task.aggregate([...]);
return res.json({ ...existing, newMetric });
```

**2. Update Service Types**:
```typescript
export interface AnalyticsDataAdmin {
  // ... existing
  newMetric: any;
}
```

**3. Update Frontend**:
```typescript
{data.newMetric && (
  <Card>
    {/* Render new metric */}
  </Card>
)}
```

**4. Add Real-Time Trigger**:
```typescript
// Wherever this metric changes
emitAnalyticsRefresh(workspaceId);
```

## Testing

### Test Admin Access
```bash
# Login as admin, visit /analytics
# Should see all workspace metrics
```

### Test Employee Access
```bash
# Login as employee with assigned tasks
# Should see only personal analytics
# Verify no workspace metrics visible
```

### Test Real-Time
```bash
# Open analytics in 2 tabs (same user)
# Create/update a task in one tab
# Second tab should auto-refresh
```

### Test Security
```bash
# As employee, try to access ?projectId=123
# Should still see only personal data
# Check Network tab - response only has employee data
```

## Performance Tips

1. **Limit Data**:
   - Recent activity: max 20
   - Deadlines: max 10
   - Workload: max 10

2. **Use `.lean()`**:
   - For read-only queries
   - Saves memory

3. **Add Indexes**:
   - On frequently queried fields
   - On sort fields

4. **Cache Results**:
   - Could add Redis caching
   - Refresh every 5-10 minutes

5. **Batch Operations**:
   - Use aggregation pipeline
   - Avoid multiple queries

## Debugging

**Enable Debug Logs**:
```typescript
// In analytics.controller.ts
console.log('[getAnalyticsData]', { userId, role, projectId, userRole });
console.log('[statusDist]', statusDist);
console.log('[response]', JSON.stringify(response, null, 2));
```

**Check Socket Events**:
```typescript
// In browser console
socket.on('analytics:refresh', () => {
  console.log('Analytics refresh received');
});
socket.emit('disconnect', () => {
  console.log('Socket disconnected');
});
```

**Verify Database**:
```bash
# Check task count for user
db.tasks.countDocuments({assignedTo: ObjectId("...")})

# Check completed tasks
db.tasks.countDocuments({assignedTo: ObjectId("..."), status: "Completed"})

# Check projects for workspace
db.projects.countDocuments({workspaceId: ObjectId("...")})
```

## Useful Queries

```typescript
// Get user role
const user = await User.findById(userId).select('role');
console.log(user.role); // "admin" | "employee"

// Count tasks by status
await Task.aggregate([
  { $match: { workspaceId } },
  { $group: { _id: '$status', count: { $sum: 1 } } }
]);

// Completion rate
const total = await Task.countDocuments({ workspaceId });
const completed = await Task.countDocuments({ workspaceId, status: 'Completed' });
const rate = Math.round((completed / total) * 100);
```

---

**Need Help?** Check `ANALYTICS_IMPLEMENTATION.md` for detailed info.

# Role-Based Analytics Implementation

## Overview
A fully functional, role-based Analytics Dashboard using real MongoDB data. Automatically changes based on user role (admin/manager vs employee). Includes real-time updates via Socket.IO.

## Architecture

### Backend Endpoints

#### `GET /api/analytics/data?projectId=[projectId]`
- **Authentication**: Required (verifyToken)
- **Role-Based**:
  - **Admin/Manager**: Returns full workspace analytics
  - **Employee**: Returns only personal analytics (no data leakage)

**Admin Response**:
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
    { "status": "Todo", "count": 30 },
    { "status": "In Progress", "count": 20 },
    { "status": "Review", "count": 8 },
    { "status": "Blocked", "count": 3 },
    { "status": "Completed", "count": 89 }
  ],
  "priorityDistribution": [
    { "priority": "Low", "count": 50 },
    { "priority": "Medium", "count": 70 },
    { "priority": "High", "count": 30 }
  ],
  "workloadDistribution": [
    { "employeeId": "...", "employeeName": "John Doe", "taskCount": 12 },
    { "employeeId": "...", "employeeName": "Jane Smith", "taskCount": 15 }
  ],
  "projectProgressComparison": [
    { "projectName": "Aurora", "completionPercent": 75 },
    { "projectName": "CampusSync", "completionPercent": 60 }
  ],
  "completionTrend": [
    { "date": "2024-01-08", "count": 5 },
    { "date": "2024-01-09", "count": 8 }
  ],
  "recentActivity": [
    { "type": "Task Update", "description": "Fix login bug", "timestamp": "2024-01-09T10:30:00Z" }
  ],
  "upcomingDeadlines": [
    { "title": "Complete API", "dueDate": "2024-01-15", "status": "In Progress" }
  ]
}
```

**Employee Response**:
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

#### `GET /api/analytics/projects`
- **Authentication**: Required
- **Authorization**: Admin/Manager only
- Returns all projects in the workspace for the filter dropdown

## Frontend Components

### `AnalyticsPage.tsx`
- Automatically detects user role
- Displays different UI based on role
- Handles project filtering (admin only)
- Real-time Socket.IO updates

### Statistics Cards
- **Admin**: Total/Active/Completed Projects, Total/Completed Tasks, Completion Rate
- **Employee**: Assigned Projects, Assigned Tasks, Completed Tasks, Completion Rate

### Charts

#### Admin Charts
1. **Task Status Distribution** (Donut Chart, 550px min height)
   - Todo, In Progress, Review, Blocked, Completed

2. **Project Progress Comparison** (Bar Chart)
   - X-axis: Project Names
   - Y-axis: Completion %

3. **Task Priority Distribution** (Bar Chart)
   - High, Medium, Low

4. **Team Workload Distribution** (List)
   - Employee Name + Task Count

5. **Completion Trend** (Line Chart)
   - Weekly completed tasks

6. **Recent Activity** (Scrollable List)
   - Task updates from last 30 days

7. **Upcoming Deadlines** (Scrollable List)
   - Nearest deadlines across workspace

#### Employee Charts
1. **Personal Task Status Distribution** (Bar Chart)
2. **Personal Completion Trend** (Line Chart)
3. **Personal Deadlines** (Scrollable List)

## Real-Time Updates

### Socket.IO Events

**Server → Client**:
```javascript
socket.on('analytics:refresh', () => {
  // Reload analytics data
});
```

### How to Trigger Updates

Add to task/project controllers after creating/updating/completing tasks:

```typescript
import { emitAnalyticsRefresh, emitAnalyticsRefreshToUser } from "../realtime/socket.ts";

// After task update
emitAnalyticsRefresh(workspaceId); // All users in workspace
emitAnalyticsRefreshToUser(userId); // Specific user

// After project update
emitAnalyticsRefresh(workspaceId);
```

## Security

✅ **Backend Enforced**:
- Role check on every endpoint
- Employees never receive workspace data
- Employees only see their assigned projects/tasks
- Employees never see other employees' statistics

✅ **No Frontend Fallback**:
- All security enforced server-side
- Frontend hiding is NOT a security measure

## Database Queries

All queries use MongoDB aggregation pipeline:

- **Project Count**: Direct count query
- **Task Status Distribution**: $group by status
- **Task Priority Distribution**: $group by priority
- **Team Workload**: $group by assignedTo with $lookup for employee names
- **Completion Trend**: $group by date with $dateToString
- **Project Progress**: $group by project with completion percentage
- **Recent Activity**: Filtered by updatedAt (30 days)
- **Upcoming Deadlines**: Filtered by dueDate > now

## Performance Optimizations

1. **Lean Queries**: Using `.lean()` for read-only operations
2. **Aggregation Pipeline**: Efficient MongoDB aggregation
3. **Projection**: Selecting only needed fields
4. **Limit**: Recent activity and deadlines limited to 10-20 records
5. **Indexes**: Ensure workspace, user, and date fields are indexed

## Future Enhancements

- [ ] Export analytics as PDF/CSV
- [ ] Custom date range selection
- [ ] Team comparison (for managers)
- [ ] Performance alerts
- [ ] Analytics permissions per role
- [ ] Dashboard customization

## Testing Checklist

- [x] Admin sees full workspace analytics
- [x] Manager sees full workspace analytics
- [x] Employee sees only personal analytics
- [x] Project filter works for admin
- [x] No workspace data leaks to employee
- [x] Real-time updates work
- [x] Charts render correctly
- [x] Empty state handling
- [x] Error handling
- [x] Mobile responsive

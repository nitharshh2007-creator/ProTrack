# Real-Time Notifications System - Testing Guide

## Prerequisites

Before testing, ensure:
- Backend running: `npm run dev` in `/server`
- Frontend running: `npm run dev` in `/client`
- MongoDB connected and running
- Two browser windows/tabs open (admin + employee accounts)

---

## Test 1: Task Assignment Notification

### Setup:
1. **Tab 1 (Admin):** Login as admin
2. **Tab 2 (Employee):** Login as employee in different window/tab

### Steps:
1. In Tab 1 (Admin):
   - Navigate to `/projects`
   - Click on a project
   - Go to Tasks section
   - Click "Create Task"
   - Fill form:
     - **Title:** "Test Task Assignment"
     - **Description:** "Testing real-time notification"
     - **Assign To:** Select the employee user
     - **Due Date:** Tomorrow
     - Click "Create"

2. In Tab 2 (Employee):
   - **Expected Result:** 
     - ✅ Toast appears top-right with "Task Assigned" title
     - ✅ Bell icon shows badge with "1"
     - ✅ Sidebar shows "Notifications (1)" with blue badge
     - ✅ Open notifications dropdown → see new notification
     - ✅ Click notification → navigates to task detail

### Verification:
```
Toast: "Task Assigned" + "You have been assigned to Test Task Assignment"
Bell: Shows "1" badge
Sidebar: "Notifications" shows (1)
```

---

## Test 2: Comment Notification

### Steps:
1. In Tab 2 (Employee):
   - Open a task (can use the one from Test 1)
   - Scroll to comments section
   - Add comment: "I've started working on this"
   - Click Post

2. In Tab 1 (Admin - task creator):
   - **Expected Result:**
     - ✅ Toast appears: "Comment Added"
     - ✅ Notification shows: "Employee commented on Test Task"
     - ✅ Bell updates

### Verification:
```
Toast: "Comment Added" + "Employee commented on ..."
Can navigate to task from notification
```

---

## Test 3: File Upload Notification

### Steps:
1. In Tab 2 (Employee):
   - In same task, add comment with file attachment
   - Type message: "Here's the design file"
   - Try to attach a file (drag & drop)
   
2. In Tab 1 (Admin):
   - **Expected Result:**
     - ✅ Toast: "File Uploaded"
     - ✅ Notification type shows as "File Uploaded"

### Note:
File attachments require comment implementation with file support.

---

## Test 4: Project Creation Notification

### Steps:
1. In Tab 1 (Admin):
   - Navigate to `/projects`
   - Click "New Project"
   - Fill form:
     - **Title:** "Test Project"
     - **Description:** "Testing project notifications"
     - **Team Members:** Select employee
     - Click "Create"

2. In Tab 2 (Employee):
   - **Expected Result:**
     - ✅ Toast: "Project Created"
     - ✅ Message: "You have been assigned to project Test Project"

### Verification:
```
Sidebar: Bell shows badge
Notifications: Shows "project_created" type
```

---

## Test 5: Reassign Task Notification

### Steps:
1. In Tab 1 (Admin):
   - Open existing task (assigned to Employee)
   - Click edit/update button
   - Change "Assign To" to different employee
   - Save

2. In Tab 2 (Original Employee):
   - **Expected Result:**
     - ✅ Toast: "Task Reassigned"
     - ✅ Message: "The task ... was reassigned"

### Verification:
```
Type: "task_reassigned"
Message shows task was reassigned
```

---

## Test 6: Mark as Read (Single)

### Steps:
1. Go to Notifications dropdown
2. Hover over unread notification
3. See unread badge (blue "Unread" pill)
4. Click notification row
5. **Expected Result:**
   - ✅ Notification marked as read
   - ✅ Blue background fades to white
   - ✅ Unread count decreases
   - ✅ Bell badge updates

---

## Test 7: Mark All Read

### Steps:
1. Create 3+ unread notifications (repeat previous tests)
2. Open notifications dropdown
3. Click "Mark All Read" button
4. **Expected Result:**
   - ✅ All notifications lose blue background
   - ✅ All unread badges disappear
   - ✅ Unread count → 0
   - ✅ Bell badge disappears

---

## Test 8: Full Notifications Page

### Steps:
1. Navigate to `/notifications` (click from dropdown or sidebar)
2. **Expected Results:**
   - ✅ Hero section displays "Notification Center"
   - ✅ Shows total notifications count
   - ✅ Shows unread count
   - ✅ Search bar works (type to filter)
   - ✅ Filter buttons work:
     - Click "Unread" → only unread shown
     - Click "Assignments" → only task notifications
     - Click "Comments" → only comment notifications
   - ✅ Sort dropdown works (Newest/Oldest)
   - ✅ Pagination works

---

## Test 9: Delete Notification

### Steps:
1. On notifications page or dropdown
2. Click "Delete" button on a notification
3. **Expected Result:**
   - ✅ Notification disappears
   - ✅ Unread count updates (if was unread)
   - ✅ Total count decreases

---

## Test 10: Notification Persistence

### Steps:
1. Create several notifications (use previous tests)
2. Open `/notifications` page
3. **Refresh the page** (F5 or Ctrl+R)
4. **Expected Result:**
   - ✅ All notifications still there
   - ✅ Unread count preserved
   - ✅ No notifications lost

### Steps 2:
1. Open notifications
2. **Logout** (click profile → Sign Out)
3. **Login again** with same account
4. **Expected Result:**
   - ✅ All notifications restored
   - ✅ Unread count accurate
   - ✅ Full history preserved

---

## Test 11: Task Completion Notification

### Steps:
1. In Tab 1 (Admin):
   - Open a task assigned to employee
   - Change status to "Completed"
   - Save

2. In Tab 2 (Employee):
   - **Expected Result:**
     - ✅ Toast: "Task Completed"
     - ✅ Message: "Task ... was marked as completed"

### Verification:
```
Type: "task_completed"
Notifies: Assigned user + Task creator
```

---

## Test 12: Task Update Notification

### Steps:
1. In Tab 1 (Admin):
   - Open assigned task
   - Change: description, priority, or due date
   - Save (don't change assignee)

2. In Tab 2 (Employee):
   - **Expected Result:**
     - ✅ Toast: "Task Updated"
     - ✅ Message: "Task ... was updated"

### Verification:
```
Type: "task_updated"
Notifies: Assigned user + Task creator
```

---

## Test 13: Real-Time Toast Notifications

### Steps:
1. Open browser DevTools (F12)
2. Keep `/notifications` page open
3. In admin account, create a task or update
4. **Expected Result:**
   - ✅ Toast appears top-right
   - ✅ Automatically disappears after 4 seconds
   - ✅ Can dismiss early by clicking X
   - ✅ Max 3 toasts visible

---

## Test 14: Unread Badge Updates

### Steps:
1. Open notifications dropdown
2. Look at bell icon badge
3. Create new notification
4. **Expected Result:**
   - ✅ Badge updates instantly (no page refresh needed)
   - ✅ Shows correct count
   - ✅ Disappears when count = 0

---

## Test 15: Navigation from Notification

### Steps:
1. In notifications dropdown or page
2. Click on notification item
3. **Expected Result:**
   - ✅ Marked as read
   - ✅ Navigates to related resource:
     - Task notifications → `/tasks/:id`
     - Project notifications → `/projects/:id`
   - ✅ URL matches the `link` field

---

## Test 16: Search Functionality

### Steps:
1. Go to `/notifications` page
2. Type in search box: "task"
3. **Expected Result:**
   - ✅ Only notifications with "task" in title/message shown
   - ✅ Search is case-insensitive
   - ✅ Partial matches work

---

## Test 17: Filter by Type

### Steps:
1. Go to `/notifications` page
2. Click filter buttons:
   - "Assignments" → only task-related
   - "Comments" → only comment-related
   - "Projects" → only project-related
   - "Deadlines" → only deadline-related
   - "Files" → only file/video/audio

3. **Expected Result:**
   - ✅ Only matching notifications shown
   - ✅ Active filter highlighted in blue
   - ✅ Counts update

---

## Test 18: Deadline Reminder (Manual)

### Prerequisites:
This requires tasks with due dates. The auto-reminder runs every hour.

### Manual Testing:
1. Backend logs should show deadline check every hour
2. Check MongoDB logs for task queries with `dueDate: { $gt: now, $lte: in24Hours }`
3. Verify notifications created with type `"deadline_reminder"`

---

## Test 19: Sidebar Integration

### Steps:
1. Look at sidebar
2. Hover over "Notifications" item
3. **Expected Result:**
   - ✅ Shows blue pill with count
   - ✅ Disappears when count = 0
   - ✅ Clicking navigates to `/notifications`

---

## Test 20: Mobile Responsiveness

### Steps:
1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Set to mobile viewport (375px)
4. Navigate to notifications
5. **Expected Result:**
   - ✅ Layout adjusts properly
   - ✅ Touch-friendly buttons
   - ✅ Readable text
   - ✅ Dropdown works on mobile

---

## Debugging Checklist

If notifications aren't working:

### 1. **Server Logs:**
```bash
# Check backend is running
# Look for Socket.IO connection messages
# Should show: "connection" event when user connects
```

### 2. **Browser Console (Tab 1):**
```javascript
// Check if Socket connected
window.localStorage.getItem("token")  // Should exist
// Check network tab → WS (WebSocket) connections
// Should see Socket.IO upgrade to WebSocket
```

### 3. **Check Browser Network:**
1. Open DevTools → Network → WS tab
2. Should see active WebSocket connection to `/socket.io/`
3. Should show `101 Web Socket Protocol Handshake`

### 4. **MongoDB Verification:**
```bash
# Connect to MongoDB
mongo
use protrack-db
db.notifications.find().count()  # Check notification count
db.notifications.find().pretty() # View recent notifications
```

### 5. **API Testing (Postman/cURL):**
```bash
# Get notifications
curl -H "Authorization: Bearer <token>" \
  http://localhost:5000/api/notifications

# Response should have notifications + unreadCount
```

### 6. **Common Issues:**

| Issue | Solution |
|-------|----------|
| Bell badge not updating | Check Socket connected in DevTools |
| Notifications not persisting | Verify MongoDB connection |
| Toast doesn't appear | Check `NotificationToasts` in AppLayout |
| Socket connection fails | Verify CORS settings + auth token valid |
| Notifications appear but marked as read | Check `isRead` field in MongoDB |

---

## Performance Testing

### High Volume Test:
1. Create 100+ notifications programmatically
2. Open `/notifications` page
3. Verify:
   - ✅ Page loads in < 2 seconds
   - ✅ Search/filter responsive
   - ✅ Scroll smooth
   - ✅ No memory leaks

### Concurrent Users Test:
1. Open 5+ browser tabs/windows
2. Create notifications across all
3. Verify:
   - ✅ Real-time sync across all tabs
   - ✅ Unread count consistent
   - ✅ Socket.IO handles multiple connections
   - ✅ No race conditions

---

## Success Criteria

All tests pass when:
- ✅ Notifications created immediately on action
- ✅ Toast appears in < 500ms
- ✅ Real-time updates across all browser tabs
- ✅ Full history survives refresh/logout
- ✅ All notification types working
- ✅ Search/filter functions
- ✅ Database persistence verified
- ✅ Socket.IO connection stable
- ✅ UI responsive and accessible

---

## Troubleshooting Quick Links

- Socket.IO Issues: Check `client/src/lib/socket.ts` + CORS config
- Notification Creation: Check `server/src/services/notification.service.ts`
- UI Issues: Check `client/src/components/layout/NotificationBell.tsx`
- Store Issues: Check `client/src/store/notification.store.tsx`
- Database Issues: Check MongoDB indexes + data

---

## Testing Report Template

```markdown
# Notification System Test Report
Date: [date]
Tester: [name]

## Passed Tests:
- [✓] Test 1: Task Assignment
- [✓] Test 2: Comment Notification
- ...

## Failed Tests:
- [ ] None

## Issues Found:
- None

## Performance Notes:
- Toast latency: < 200ms
- Page load: < 1s
- Search: < 100ms

## Recommendation:
✅ System ready for production
```

---

Enjoy testing! 🎉

# Changelog

All notable changes to this project will be documented in this file.

## [1.2.1] - 2025-11-05

### Added

#### Context Menu Enhancements
- **🖱️ Project Assignment via Context Menu**: Assign tasks to projects directly from right-click menu
  - Right-click any task card to open context menu
  - New "プロジェクト" (Projects) section with active projects list
  - "プロジェクトから外す" option to remove project assignment
  - Project names displayed with color indicators (●)
  - Real-time project list updates when new projects are created
  - No manual refresh needed - menu updates automatically

#### Date Management
- **📅 Automatic Date Setting for Today Status**: Date automatically assigned when status changes to 'today'
  - Right-click menu: Changing status to "Today" sets date to today
  - Drag & drop: Dropping to Today section sets date to today
  - Date automatically cleared when moving away from Today
  - Consistent behavior across all status change methods

#### File Monitoring
- **🔍 Project Folder Monitoring**: Automatic view refresh when projects change
  - create, modify, delete, rename events monitored for project files
  - GTD Main View refreshes when project folder changes detected
  - Context menu project list stays up-to-date automatically
  - Optimized logging - only GTD-related files logged

### Changed
- **♻️ Enhanced TaskCard Memo Comparison**: More accurate re-rendering detection
  - Added `availableProjects` comparison to React.memo
  - Added `task.date` comparison for date changes
  - Added `task.status` comparison for status changes
  - Context menu updates immediately when project list changes

### Fixed
- **🔧 UUID Auto-Save on File Load**: Persistent UUIDs for existing files
  - Files without IDs get UUIDs saved immediately on first load
  - Prevents "Task not found" errors after UUID generation
  - Works for both tasks and projects
  - Handles both active and completed items

### Technical
- Enhanced file monitoring with `create` event handler
- Project folder path added to all file event listeners (create, modify, delete, rename)
- TaskCard React.memo comparison includes `availableProjects`, `task.date`, `task.status`
- FileService and ProjectService auto-save UUIDs via `vault.modify()`
- GTDMainView `handleStatusChange` uses `moveTaskToToday()` for 'today' status
- Drag & drop handlers set `date: null` for non-today statuses
- Portal-based context menu rendering with `ReactDOM.createPortal()`
- Fixed z-index to 999999 for context menu visibility

## [1.2.0] - 2025-11-04

### Added

#### Weekly Review Enhancements
- **🔄 Auto-Update Statistics**: Existing weekly review files now update statistics automatically
  - No more "already exists" error when creating review for current week
  - Completed tasks count and active projects count refresh each time
  - Seamless workflow: create once, update anytime
- **📅 Week Start Day Configuration**: Customizable week start preference
  - Settings option to choose Monday or Sunday as week start
  - Weekly review file naming based on week start date (not creation date)
  - File format: `YYYY-MM-DD-weekly-review.md` (week start date)
  - One review per week regardless of creation timing
- **🌐 i18n Support for Weekly Review**: Multi-language review content generation
  - Review file content generated in Japanese or English based on settings
  - All section headers, labels, and placeholders localized
  - Supports "件" suffix in Japanese, no suffix in English for counts
- **📝 Improved Review Button Placement**: Better UX with top-positioned create button
  - "Create New Review" button moved to top (aligned with other create buttons)
  - Real-time statistics preview (completed tasks, active projects)
  - Consistent UI across all views

### Changed

#### Project Management
- **📁 Monthly Completion Folders**: Simplified completed project organization
  - Changed from `完了/YYYY-MM-DD/` to `完了/YYYY-MM/` (monthly granularity)
  - Projects complete less frequently than tasks, monthly grouping is sufficient
  - Reduced folder clutter

#### Task Creation
- **🎯 Active Projects Only**: Completed projects excluded from task creation dropdown
  - QuickAddModal project selector now filters out completed projects
  - Prevents accidental task assignment to finished projects
  - Cleaner, more relevant project selection

### Fixed

#### Weekly Review File Opening
- **🚫 No More Split Pane Multiplication**: Fixed infinite pane splitting issue
  - Changed from `getLeaf('split', 'vertical')` to `getLeaf(false)`
  - Review file opens as new tab in current pane instead of creating new split
  - If file already open: switches to existing tab (no duplication)
  - Screen remains organized without unwanted splits

### Technical

#### Weekly Review Service
- Added `language` parameter to WeeklyReviewService constructor
- `updateSettings()` now accepts `language` parameter
- `generateReviewContent()` uses i18n for all labels and placeholders
- Week start day calculation integrated with settings
- Auto-update mechanism with `updateReviewStatistics()` method
- File naming based on `getWeekStart()` date calculation

#### Project Service
- Added `formatYearMonth()` method for YYYY-MM formatting
- `moveProjectToCompleted()` uses monthly folder structure
- Completion folder: `完了/YYYY-MM/` instead of `完了/YYYY-MM-DD/`

#### i18n Additions
- New texts: `reviewPeriodLabel`, `reviewAchievementsTitle`
- `reviewCompletedTasks`, `reviewActiveProjects`
- `reviewReflectionsTitle/Placeholder`, `reviewLearningsTitle/Placeholder`
- `reviewNextWeekGoalsTitle/Placeholder`, `reviewNotesTitle/Placeholder`

#### UI Improvements
- `GTDMainView.loadProjects()` filters `status !== 'completed'`
- Weekly review tab opening logic checks for existing leaves
- CSS: `.gtd-weekly-review__create-section` with background styling
- Workspace API usage: `getLeavesOfType('markdown')` for tab detection

## [1.1.1] - 2025-11-02

### Added

#### Auto-Refresh System
- **🕛 Date Change Detection**: Automatic detection and refresh when date changes
  - Checks every 60 seconds for date changes
  - Automatically refreshes all views when midnight passes
  - Ensures "Today" tasks are always up-to-date
  - Works even when Obsidian is left open overnight
- **🔄 Manual Refresh**: Multiple ways to refresh views
  - Command: "すべてのビューを更新" (Refresh All Views) via Command Palette
  - UI Button: 🔄 refresh button in each view header
  - Refreshes task list and project data instantly

### Changed
- **UI Layout Consistency**: Unified refresh button placement across all views
  - All views now follow Weekly Review layout structure
  - ViewSwitcher and 🔄 button on same row (header-top)
  - Action buttons (Add Task, Add Project, etc.) on separate row below
  - Consistent visual hierarchy across GTD Main, Weekly Review, and Project views

### Fixed
- **Today Task Date Assignment**: Tasks added directly to "Today" via Quick Add now correctly receive today's date
  - Previously, tasks created with `status: 'today'` had no date assigned, causing them not to appear in Today section
  - Now auto-assigns today's date when status is 'today' but date is not provided
- **Drag Position Offset**: Improved drag-and-drop visual feedback (partial fix)
  - Fixed: Dragging card position now correctly follows cursor in all groups except the original group
  - Known issue: Card not visible when dragging within its original group (non-critical, other groups work correctly)
  - Applied container offset correction in handleDragStart
  - Used CSS class-based placeholder hiding with !important priority

### Technical
- Added `midnightCheckInterval` for periodic date checking
- Added `startMidnightCheck()` and `stopMidnightCheck()` methods in GTDPlugin
- New command: `gtd-refresh-views`
- CSS additions:
  - `.gtd-button--icon` for icon-only buttons
  - `.gtd-main-view__header-top` for layout consistency
  - `.gtd-project-view__header-top` for layout consistency
  - `.gtd-weekly-review__header-top` for layout consistency
  - `.gtd-dragging-placeholder` for hiding placeholder during drag
- Enhanced TaskService.createTask to auto-set date for 'today' status
- Modified handleDragStart in GTDMainView for position correction
- Added placeholder cleanup in handleDragEnd

## [1.1.0] - 2025-10-31

### Added

#### New Features
- **🗑️ Trash Bin**: Drag-and-drop tasks to trash for deletion
  - Tasks are moved to `GTD/Tasks/ゴミ箱` folder
  - Status automatically changes to `trash`
  - Visual feedback with red highlight on drag-over
  - Prevents accidental deletion
- **🔄 View Switcher**: Quick view switching via dropdown menu
  - Switch between GTD Main, Weekly Review, and Project views
  - Available in all view headers
  - Compact design with no text overflow
  - Responsive button width with equal distribution
  - Icon order: Tasks (📋) → Projects (🎯) → Weekly Review (🔍)
- **🔗 Project Selection in Task Creation**: Associate tasks with projects during creation
  - Project dropdown in Quick Add modal
  - Loads all available projects automatically
  - Sets proper `[[Project Name]]` link format
- **✅ Completed Tasks This Week**: New tab in Weekly Review view
  - Automatically collects tasks completed in the past 7 days
  - Perfect for weekly retrospectives
  - Default selected tab for quick access
  - Auto-refresh when view is opened
- **📊 Simplified Project Statistics**: Streamlined project view stats
  - Shows only Not Started and In Progress counts
  - Horizontal layout for compact display
  - Cleaner, more focused interface
- **📏 Resizable Panel in Single-Column Layout**: Adjustable Today/Other section heights
  - Draggable divider between Today and Other sections
  - Mouse drag to adjust height ratio (20%-80% range)
  - Visual feedback with hover effects
  - Only displays when screen width ≤ 450px
- **📂 Project Card Expansion**: Task list display in project cards
  - Click to expand/collapse task list (default: collapsed)
  - Shows task count (uncompleted/total)
  - Click task to open file
  - Visual indicators for completed tasks (✓/○)
- **🖱️ Right-Click Context Menu**: Quick status change for tasks
  - Right-click any task to show context menu
  - 6 status options: Inbox, Next Action, Today, Waiting, Someday, Trash
  - Fixed positioning at cursor location
  - Click-away to dismiss

### Fixed
- **Duplicate Notification**: Removed duplicate "task created" notifications
  - Only TaskService shows notification now
  - Cleaner user experience
- **2-Column Layout Height Issue**: Full height display for both columns
  - Changed from fixed height to flexible layout
  - Added `flex: 1` and `min-height: 0` for proper scrolling
  - Columns now use full available height

### Changed
- **ViewSwitcher Font Size**: Reduced from 18px to 12px
  - Better fit for narrow sidebars
  - Added text overflow handling with ellipsis
- **Project View Layout**: Reorganized header structure
  - New Project button moved below view switcher
  - Consistent with GTD Main view layout
  - Better visual hierarchy
- **Single-Column Breakpoint**: Changed from 500px to 450px
  - More appropriate for mobile/narrow screens
  - Applies to both container and media queries
- **Project Card Size**: Reduced default height to 2/3
  - Padding: 16px → 10px 12px
  - Margin-bottom: 12px → 8px
  - Title font-size: 16px → 14px
  - Status font-size: 12px → 11px
  - More compact and efficient use of space

### Technical
- Added `trash` status to TaskStatus type
- New `moveTaskToTrash` method in TaskService
- New `moveTaskToFolder` method in FileService
- Enhanced QuickAddModal with project selection
- ProjectService integration in GTDMainView
- Improved CSS with trash-specific styles
- Added resize handle functionality with mouse event handlers
- State management for split ratio and resize mode
- New context menu component with status change handlers
- Project card task integration with expand/collapse state
- Weekly Review auto-refresh callback mechanism
- Enhanced responsive styles for 450px breakpoint

## [1.0.0] - 2025-10-31

### Initial Release

#### Core GTD Features
- **GTD Workflow Support**: Complete Inbox → Next Actions → Today workflow
- **Drag & Drop Interface**: Notion-style intuitive task management
- **Task Status Management**: 
  - Inbox for capturing ideas
  - Next Actions for actionable tasks  
  - Today for daily focus
  - Waiting for tasks pending response
  - Someday/Maybe for future considerations
- **Automatic Date Management**: Auto-assign today's date when moving to Today
- **Overdue Task Auto-Update**: Yesterday's uncompleted Today tasks auto-update to today
- **Task Completion Tracking**: Completed tasks automatically organized to `完了/YYYY-MM-DD/` folder
- **Collapsible Groups**: Click group titles to collapse/expand sections
- **Collapsed Group Drop Support**: Drag tasks to collapsed groups via title area
- **Manual & Auto Sort Modes**: 
  - Manual: Drag to reorder within groups
  - Auto: Sort by priority and date
- **Completed Tasks Always Bottom**: Regardless of sort mode
- **Daily Note Integration**: 
  - Auto-write mode
  - Dataview query support (recommended)
  - Manual command insertion
- **Responsive Design**: Optimized layout for different screen sizes (500px breakpoint)
- **Project Management**: Progress tracking with backlink support
- **Priority Levels**: High, Medium, Low
- **Tags & Notes Support**: Organize with tags and add detailed notes
- **File Watcher**: Auto-refresh when task files are modified externally

#### New Views
- **📋 Weekly Review View**: Dedicated view for GTD weekly review process
  - Someday/Maybe tab for reviewing future tasks
  - Waiting tab for checking delegated tasks
  - Active Projects tab for project progress review
  - Quick actions: Move to Next Action, Move to Today, Archive
- **🎯 Project View**: Gallery-style project management
  - Project statistics (Total, Not Started, In Progress, Completed)
  - Filter by status (All, Not Started, In Progress, Completed)
  - Sort by importance, deadline, or progress
  - Create new projects directly from the view
  - Task count display per project

#### User Experience Enhancements
- **🎉 Onboarding**: Welcome modal on first launch
  - Introduction to GTD methodology
  - Feature overview and quick tips
  - Sample data generation for learning
- **⚠️ Error Handling**: Comprehensive error management
  - User-friendly error messages
  - Success/warning/info notifications
  - Validation for inputs
  - Graceful error recovery
- **⚡ Performance Optimization**: Faster rendering and interaction
  - React.memo for TaskCard components
  - useMemo for task filtering and sorting
  - useCallback for event handlers
  - Reduced unnecessary re-renders

#### UI/UX
- Compact Today card view with reduced height
- 2-column layout (Today on left, other groups on right)
- 1-column layout for narrow screens
- Visual drag feedback with highlight effects
- Empty groups default to collapsed state
- Click task title to open markdown file
- Checkbox click doesn't open file

#### Technical
- React 18 with TypeScript
- @hello-pangea/dnd for drag & drop
- date-fns for date formatting with auto YYYY→yyyy conversion
- Container queries for responsive layout
- Obsidian Plugin API integration
- Vault file watchers for real-time updates


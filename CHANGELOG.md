# Changelog

All notable changes to this project will be documented in this file.

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


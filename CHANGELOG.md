# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2025-01-31

### Initial Release

#### Features
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


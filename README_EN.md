# GTD Task Manager for Obsidian

[日本語版 README](README.md)

A powerful GTD (Getting Things Done) task management plugin for Obsidian featuring a Notion-style drag & drop interface.

## ✨ Features

- 📥 **Inbox System** - Capture ideas instantly
- 🎯 **Complete GTD Workflow** - Seamless Inbox → Next Actions → Today flow
- 🖱️ **Drag & Drop Interface** - Intuitive task movement and manual sorting
- 📅 **Automatic Date Management** - Auto-assign today's date when moving to Today
- 🔄 **Smart Date Updates** - Yesterday's uncompleted tasks auto-update to today
- ✅ **Automatic Task Organization** - Completed tasks always appear at bottom
- 📊 **Project Management** - Auto-calculate progress with backlink support
- 📝 **Daily Note Integration** - Auto-collect completed tasks with Dataview
- 🔽 **Collapsible Groups** - Fold sections to reduce clutter
- 👆 **Drop to Collapsed Groups** - Drag tasks to closed groups via title
- 📱 **Responsive Design** - Optimized layout for different screen sizes
- 🇯🇵 **Bilingual Support** - Full Japanese and English UI
- 📝 **Markdown Native** - All data stored as markdown files
- 🔗 **Backlink Integration** - Full Obsidian feature compatibility

## 🚀 Quick Start

### Installation

1. Open Obsidian Settings
2. Navigate to `Community Plugins`
3. Search for "GTD Task Manager"
4. Click Install
5. Enable the plugin

### Basic Usage

1. **Capture Ideas**
   - Click "+ Add Task" button
   - Enter task title
   - Task goes to Inbox

2. **Process Inbox**
   - Drag tasks from Inbox to "Next Actions"
   - Set priority and add details

3. **Plan Your Day**
   - Drag tasks from "Next Actions" to "Today"
   - Date automatically set to today

4. **Execute Tasks**
   - Complete tasks from top to bottom
   - Check completion box
   - Completed tasks auto-move to bottom

5. **Carryover to Next Day**
   - Yesterday's uncompleted Today tasks auto-update to today's date
   - Completed tasks organized to `GTD/tasks/完了/YYYY-MM-DD/` folder

### Manual Sort & Auto Sort

Switch between two sort modes in settings:

- **Manual Sort Mode** (Default)
  - Drag & drop to reorder within same group
  - Order saved to files

- **Auto Sort Mode**
  - Auto-sort by priority (High→Medium→Low)
  - Then by date

**Note**: Completed tasks always appear at bottom in both modes.

### Collapsible Groups

Click group titles to collapse/expand sections. Empty groups default to collapsed state.

### Daily Note Integration

Automatically reference completed tasks in your daily notes.

#### Method 1: Dataview Plugin (Recommended)

1. **Install Dataview Plugin**
   - Settings → Community Plugins → Search "Dataview" → Install

2. **Add to Daily Note Template**

   ```markdown
   ## 📋 Today's Completed Tasks

   \`\`\`dataview
   TABLE WITHOUT ID
     file.link as "Task",
     priority as "Priority",
     project as "Project"
   FROM "GTD/tasks/完了/{{date:YYYY-MM-DD}}"
   WHERE completed = true
   SORT priority DESC
   \`\`\`
   ```

3. **Adjust Date Format**

   If your daily note format differs from `YYYY-MM-DD`, adjust the query:

   ```markdown
   FROM "GTD/tasks/完了/{{date:YYYY}}-{{date:MM}}-{{date:DD}}"
   ```

#### Method 2: Manual Insert Button

1. Click "📝 Insert to Daily Note" button in GTD view header
2. Today's completed tasks inserted into current daily note

#### Method 3: Manual Reference

Completed tasks organized by date in:

```
GTD/tasks/完了/
├── 2025-01-30/
│   ├── Task1.md
│   └── Task2.md
├── 2025-01-31/
│   ├── Task3.md
│   └── Task4.md
```

Link from daily note: `[[GTD/tasks/完了/2025-01-30]]`

## ⚙️ Settings

Customize in Settings → GTD Task Manager:

- **Task Folder**: Default `GTD/tasks`
- **Project Folder**: Default `GTD/projects`  
- **Completed Task Folder**: Default `GTD/tasks/完了`
- **Date Format**: Display format (default: `yyyy-MM-dd`)
- **Auto Date Assignment**: Auto-set date when moving to Today (default: ON)
- **Default Priority**: New task priority (default: Medium)
- **Task Sort Mode**: Manual/Auto toggle (default: Manual)
- **Daily Note Integration**: None/Auto-write/Dataview/Command (default: Command)
- **Daily Note Folder**: Daily notes location
- **Daily Note Date Format**: Filename format (default: `YYYY-MM-DD`)
  - Supports `YYYY-MM-DD`, `yyyy-MM-dd`, `YYYY年MM月DD日`, etc.

## 🎨 Data Structure

### Task File Example

`GTD/tasks/メールに返信.md`:

```markdown
---
title: Reply to email
status: next-action  # inbox | next-action | today | waiting | someday
project: "[[Project1]]"
date: 2025-01-31
completed: false
priority: medium  # low | medium | high
tags: [work, email]
notes: Reply in the morning
order: 0  # For manual sort mode
---

Reply to email from Yamada-san
```

**Note**:
- `order` field used in manual sort mode
- Not needed in auto sort mode
- Overdue Today tasks (uncompleted) auto-update to today's date next day

### Project File Example

`GTD/Projects/Project1.md`:

```markdown
---
title: Project 1
progress: 0  # Auto-calculated from linked tasks
---

Project overview
```

## 📝 Usage Tips

### Weekly Review

1. Review Inbox
2. Move Next Actions to Today
3. Review ongoing projects
4. Move tasks to Next Actions as needed

## 🛠️ Development

### Prerequisites

- Node.js (v16+)
- npm or yarn

### Setup

```bash
# Clone repository
git clone https://github.com/COHI3rd/obsidian-gtd-plugin.git
cd obsidian-gtd-plugin

# Install dependencies
npm install

# Development mode
npm run dev

# Build
npm run build
```

### File Structure

```
obsidian-gtd-plugin/
├── src/
│   ├── main.tsx           # Plugin entry point
│   ├── views/             # React components
│   ├── services/          # Business logic
│   ├── models/            # Data models
│   ├── components/        # UI components
│   ├── utils/             # Utility functions
│   └── styles/            # CSS
├── manifest.json          # Plugin manifest
└── README.md             # Documentation
```

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file

## 🙏 Acknowledgments

- Inspired by GTD methodology
- Built with Obsidian Plugin API
- Drag & Drop: [@hello-pangea/dnd](https://github.com/hello-pangea/dnd)

## 📞 Support

- Issues: [GitHub Issues](https://github.com/COHI3rd/obsidian-gtd-plugin/issues)
- Discussions: [GitHub Discussions](https://github.com/COHI3rd/obsidian-gtd-plugin/discussions)

---

Made with ❤️ by COHI

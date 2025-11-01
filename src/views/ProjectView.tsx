import React, { useState, useEffect } from 'react';
import { Project, ProjectStatus, GTDSettings, Task } from '../types';
import { ProjectCard } from '../components/ProjectCard';
import { ViewSwitcher, ViewType } from '../components/ViewSwitcher';
import { CreateProjectModal } from '../components/CreateProjectModal';
import { ProjectService } from '../services/ProjectService';
import { TaskService } from '../services/TaskService';
import { FileService } from '../services/FileService';
import { ProjectCalculator } from '../utils/ProjectCalculator';

interface ProjectViewProps {
  projectService: ProjectService;
  taskService: TaskService;
  fileService: FileService;
  settings: GTDSettings;
  onViewChange?: (view: ViewType) => void;
  onMounted?: (refreshFn: () => void) => void;
  onTaskUpdated?: () => void;
}

/**
 * プロジェクト一覧ビューコンポーネント
 * すべてのプロジェクトをギャラリー形式で表示
 */
export const ProjectView: React.FC<ProjectViewProps> = ({
  projectService,
  taskService,
  fileService,
  settings,
  onViewChange,
  onMounted,
  onTaskUpdated
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<ProjectStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'deadline' | 'importance' | 'progress'>('importance');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // データを読み込み
  const loadData = async () => {
    try {
      setLoading(true);
      console.log('[ProjectView] Loading data...');

      // プロジェクトとタスクを読み込み
      const allProjects = await projectService.getAllProjects();
      const tasks = await taskService.getAllTasks();

      // 各プロジェクトの進捗率を更新
      for (const project of allProjects) {
        const progress = ProjectCalculator.calculateProgress(project, tasks);
        project.updateProgress(progress);
      }

      setProjects(allProjects);
      setAllTasks(tasks);
      console.log('[ProjectView] Data loaded successfully');
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // リフレッシュ関数を親コンポーネントに渡す
    if (onMounted) {
      onMounted(loadData);
    }
  }, []);

  // プロジェクトをフィルタリング
  const filteredProjects = projects.filter(project => {
    if (filterStatus === 'all') return true;
    return project.status === filterStatus;
  });

  // プロジェクトをソート
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    switch (sortBy) {
      case 'deadline':
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return a.deadline.getTime() - b.deadline.getTime();
      case 'importance':
        return b.importance - a.importance;
      case 'progress':
        return b.progress - a.progress;
      default:
        return 0;
    }
  });

  // プロジェクトの統計
  const stats = {
    total: projects.length,
    notStarted: projects.filter(p => p.status === 'not-started').length,
    inProgress: projects.filter(p => p.status === 'in-progress').length,
    completed: projects.filter(p => p.status === 'completed').length,
  };

  // プロジェクトを開く
  const openProject = async (project: Project) => {
    const file = fileService.getApp().vault.getAbstractFileByPath(project.filePath);
    if (file) {
      await fileService.getApp().workspace.getLeaf(false).openFile(file as any);
    }
  };

  // プロジェクト作成モーダルを開く
  const handleCreateProjectClick = () => {
    setIsCreateModalOpen(true);
  };

  // 新しいプロジェクトを作成
  const handleCreateProject = async (projectName: string) => {
    try {
      console.log('Creating project with name:', projectName);
      const newProject = await projectService.createProject({
        title: projectName,
        importance: 3,
        actionPlan: ''
      });

      console.log('Project created:', newProject);
      await loadData();

      if (newProject) {
        await openProject(newProject);
      }
    } catch (error) {
      console.error('Failed to create project:', error);
      // ErrorHandlerが既に通知を表示しているため、ここでは追加の通知は不要
    }
  };

  // プロジェクトのステータスを変更
  const handleStatusChange = async (project: Project, newStatus: ProjectStatus) => {
    try {
      project.changeStatus(newStatus);
      await projectService.updateProject(project);
      await loadData();
    } catch (error) {
      console.error('Failed to update project status:', error);
    }
  };

  // プロジェクトの重要度を変更
  const handleImportanceChange = async (project: Project, newImportance: number) => {
    try {
      const updatedProject = { ...project, importance: newImportance };
      await projectService.updateProject(updatedProject as Project);
      await loadData();
    } catch (error) {
      console.error('Failed to update project importance:', error);
    }
  };

  // タスクの完了状態を切り替え
  const handleTaskToggleComplete = async (task: Task) => {
    try {
      console.log('[ProjectView] Toggling task:', task.id, task.title, 'current completed:', task.completed);
      const newCompletedState = !task.completed;
      task.completed ? task.uncomplete() : task.complete();
      console.log('[ProjectView] New completed state:', task.completed);
      await taskService.updateTask(task);
      console.log('[ProjectView] Task updated in file, reloading...');
      await loadData();
      console.log('[ProjectView] Data reloaded');

      // 他のビューも更新
      if (onTaskUpdated) {
        onTaskUpdated();
      }
    } catch (error) {
      console.error('[ProjectView] Failed to toggle task completion:', error);
    }
  };

  if (loading) {
    return (
      <div className="gtd-project-view">
        <div className="gtd-project-view__loading">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="gtd-project-view">
      {/* ヘッダー */}
      <div className="gtd-project-view__header">
        <ViewSwitcher
          currentView="project"
          onViewChange={(view) => {
            if (onViewChange) {
              onViewChange(view);
            }
          }}
        />
        <div className="gtd-project-view__header-buttons">
          <button
            className="gtd-button gtd-button--primary"
            onClick={handleCreateProjectClick}
          >
            + プロジェクトを追加
          </button>
        </div>
      </div>

      {/* 統計 */}
      <div className="gtd-project-view__stats">
        <div className="gtd-stat-card gtd-stat-card--warning">
          <span className="gtd-stat-card__label">未開始:</span>
          <span className="gtd-stat-card__value">{stats.notStarted}</span>
        </div>
        <div className="gtd-stat-card gtd-stat-card--info">
          <span className="gtd-stat-card__label">進行中:</span>
          <span className="gtd-stat-card__value">{stats.inProgress}</span>
        </div>
      </div>

      {/* フィルターとソート */}
      <div className="gtd-project-view__controls">
        <div className="gtd-filter-group">
          <label>フィルター:</label>
          <select
            className="gtd-select gtd-select--small"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as ProjectStatus | 'all')}
          >
            <option value="all">すべて</option>
            <option value="not-started">未開始</option>
            <option value="in-progress">進行中</option>
            <option value="completed">完了</option>
          </select>
        </div>

        <div className="gtd-filter-group">
          <label>並び替え:</label>
          <select
            className="gtd-select gtd-select--small"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'deadline' | 'importance' | 'progress')}
          >
            <option value="importance">重要度順</option>
            <option value="deadline">期限順</option>
            <option value="progress">進捗率順</option>
          </select>
        </div>
      </div>

      {/* プロジェクト一覧 */}
      {sortedProjects.length === 0 ? (
        <div className="gtd-project-view__empty">
          <p>
            {filterStatus === 'all'
              ? '📝 プロジェクトがありません。「新規プロジェクト」ボタンから作成しましょう。'
              : `🔍 ${filterStatus === 'not-started' ? '未開始' : filterStatus === 'in-progress' ? '進行中' : '完了'}のプロジェクトはありません。`}
          </p>
        </div>
      ) : (
        <div className="gtd-project-view__grid">
          {sortedProjects.map(project => {
            // このプロジェクトに関連するタスク数を計算
            const relatedTasks = allTasks.filter(t => {
              const projectLink = `[[${project.title}]]`;
              return t.project === projectLink;
            });
            const completedTasks = relatedTasks.filter(t => t.completed);

            return (
              <div key={project.id} className="gtd-project-view__item">
                <ProjectCard
                  project={project}
                  tasks={relatedTasks}
                  onClick={() => openProject(project)}
                  onStatusChange={handleStatusChange}
                  onImportanceChange={handleImportanceChange}
                  onTaskClick={(task) => fileService.openFile(task.filePath)}
                  onTaskToggleComplete={handleTaskToggleComplete}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* プロジェクト作成モーダル */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateProject}
      />
    </div>
  );
};

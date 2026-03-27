'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { Header } from '@/components/Header';
import { getAllTasks, createTask, updateTask, deleteTask, getAllLeads } from '@/lib/dataService';
import { Task, TaskStatus, Priority, Lead } from '@/types';

const PRIMARY = '#A855F7';
const PRIMARY_LIGHT = '#EC4899';

export default function TasksPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'All'>('All');
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: TaskStatus.TODO,
    priority: Priority.MEDIUM,
    dueDate: '',
    leadId: '',
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      setTasks(getAllTasks());
      getAllLeads().then(setLeads);
    }
  }, [isAuthenticated]);

  const reload = useCallback(async () => {
    const tasks = await getAllTasks();
    setTasks(tasks);
  }, []);

  const resetForm = () => {
    setFormData({ title: '', description: '', status: TaskStatus.TODO, priority: Priority.MEDIUM, dueDate: '', leadId: '' });
  };

  const handleAdd = async () => {
    if (!formData.title.trim()) return;
    try {
      await createTask({ ...formData, leadId: formData.leadId || undefined });
      await reload();
      resetForm();
      setShowAddModal(false);
    } catch (error) {
      console.error('Failed to add task:', error);
      alert('Failed to add task. Please try again.');
    }
  };

  const handleEdit = async () => {
    if (!editingTask || !formData.title.trim()) return;
    try {
      await updateTask(editingTask.id, { ...formData, leadId: formData.leadId || undefined });
      await reload();
      setEditingTask(null);
      resetForm();
    } catch (error) {
      console.error('Failed to update task:', error);
      alert('Failed to update task. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this task?')) {
      try {
        await deleteTask(id);
        await reload();
      } catch (error) {
        console.error('Failed to delete task:', error);
        alert('Failed to delete task. Please try again.');
      }
    }
  };

  const openEdit = (task: Task) => {
    setFormData({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      leadId: task.leadId || '',
    });
    setEditingTask(task);
  };

  const toggleStatus = async (task: Task) => {
    try {
      const nextStatus = task.status === TaskStatus.TODO ? TaskStatus.IN_PROGRESS : task.status === TaskStatus.IN_PROGRESS ? TaskStatus.DONE : TaskStatus.TODO;
      await updateTask(task.id, { status: nextStatus });
      await reload();
    } catch (error) {
      console.error('Failed to update task status:', error);
      alert('Failed to update task status. Please try again.');
    }
  };

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (status: TaskStatus) => {
    if (draggedTask && draggedTask.status !== status) {
      try {
        await updateTask(draggedTask.id, { status });
        await reload();
      } catch (error) {
        console.error('Failed to move task:', error);
        alert('Failed to move task. Please try again.');
      }
    }
    setDraggedTask(null);
  };

  const filteredTasks = filterStatus === 'All' ? tasks : tasks.filter(t => t.status === filterStatus);
  const todoTasks = filteredTasks.filter(t => t.status === TaskStatus.TODO);
  const inProgressTasks = filteredTasks.filter(t => t.status === TaskStatus.IN_PROGRESS);
  const doneTasks = filteredTasks.filter(t => t.status === TaskStatus.DONE);

  const getPriorityColor = (priority: Priority) => ({
    [Priority.HIGH]: '#EF4444',
    [Priority.MEDIUM]: '#F59E0B',
    [Priority.LOW]: '#6B7280',
  }[priority] || '#6B7280');

  const isOverdue = (dueDate: string, status: TaskStatus) => dueDate && status !== TaskStatus.DONE && new Date(dueDate) < new Date();

  const getDueDateLabel = (dueDate: string) => {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    if (dueDate === today) return 'Today';
    if (dueDate === tomorrowStr) return 'Tomorrow';
    return new Date(dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === TaskStatus.DONE).length;
  const overdueTasks = tasks.filter(t => isOverdue(t.dueDate, t.status)).length;

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0A0A0F' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-2" style={{ borderColor: PRIMARY, borderTopColor: 'transparent' }}></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0A0A0F' }}>
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#E4E4E7' }}>Tasks</h1>
            <p className="text-sm" style={{ color: '#6B6B7B' }}>{completedTasks} of {totalTasks} completed</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: '#14141B', border: '1px solid #1C1C26' }}>
              {overdueTasks > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#EF444420', color: '#EF4444' }}>{overdueTasks} overdue</span>
              )}
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value as TaskStatus | 'All')}
                className="text-sm bg-transparent focus:outline-none"
                style={{ color: '#E4E4E7' }}
              >
                <option value="All">All</option>
                {Object.values(TaskStatus).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <button onClick={() => { resetForm(); setShowAddModal(true); }} className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`, color: 'white' }}>
              + Add Task
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div onDragOver={handleDragOver} onDrop={() => handleDrop(TaskStatus.TODO)}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold flex items-center gap-2" style={{ color: '#F59E0B' }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#F59E0B' }}></span>
                To Do
              </h2>
              <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: '#1C1C26', color: '#6B6B7B' }}>{todoTasks.length}</span>
            </div>
            <div className="space-y-2 min-h-48 p-2 rounded-xl border border-dashed" style={{ borderColor: draggedTask ? PRIMARY : '#1C1C26', backgroundColor: draggedTask ? `${PRIMARY}05` : 'transparent' }}>
              {todoTasks.map(task => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={() => handleDragStart(task)}
                  onDragEnd={() => setDraggedTask(null)}
                  className="p-4 rounded-xl border cursor-grab active:cursor-grabbing transition-all hover:scale-102"
                  style={{ backgroundColor: '#14141B', borderColor: draggedTask?.id === task.id ? PRIMARY : isOverdue(task.dueDate, task.status) ? '#EF444440' : '#1C1C26', opacity: draggedTask?.id === task.id ? 0.5 : 1 }}
                  onClick={() => openEdit(task)}
                >
                  <div className="flex items-start gap-3">
                    <button onClick={(e) => { e.stopPropagation(); toggleStatus(task); }} className="mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center hover:scale-110 transition-all" style={{ borderColor: '#3B82F6' }}>
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#3B82F6' }}></div>
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm" style={{ color: '#E4E4E7' }}>{task.title}</p>
                      {task.description && <p className="text-xs mt-1 truncate" style={{ color: '#6B6B7B' }}>{task.description}</p>}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: `${getPriorityColor(task.priority)}20`, color: getPriorityColor(task.priority) }}>{task.priority}</span>
                        {task.dueDate && (
                          <span className="text-xs flex items-center gap-1" style={{ color: isOverdue(task.dueDate, task.status) ? '#EF4444' : '#6B6B7B' }}>
                            📅 {getDueDateLabel(task.dueDate)}
                          </span>
                        )}
                      </div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(task.id); }} className="p-1 opacity-0 group-hover:opacity-100 hover:opacity-100" style={{ color: '#EF4444' }}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                </div>
              ))}
              {todoTasks.length === 0 && <p className="text-center py-8 text-sm" style={{ color: '#4A4A55' }}>Drop tasks here</p>}
            </div>
          </div>

          <div onDragOver={handleDragOver} onDrop={() => handleDrop(TaskStatus.IN_PROGRESS)}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold flex items-center gap-2" style={{ color: PRIMARY }}>
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: PRIMARY }}></span>
                In Progress
              </h2>
              <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: '#1C1C26', color: '#6B6B7B' }}>{inProgressTasks.length}</span>
            </div>
            <div className="space-y-2 min-h-48 p-2 rounded-xl border border-dashed" style={{ borderColor: draggedTask ? PRIMARY : '#1C1C26', backgroundColor: draggedTask ? `${PRIMARY}05` : 'transparent' }}>
              {inProgressTasks.map(task => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={() => handleDragStart(task)}
                  onDragEnd={() => setDraggedTask(null)}
                  className="p-4 rounded-xl border cursor-grab active:cursor-grabbing transition-all hover:scale-102"
                  style={{ backgroundColor: '#14141B', borderColor: draggedTask?.id === task.id ? PRIMARY : isOverdue(task.dueDate, task.status) ? '#EF444440' : `${PRIMARY}40`, opacity: draggedTask?.id === task.id ? 0.5 : 1 }}
                  onClick={() => openEdit(task)}
                >
                  <div className="flex items-start gap-3">
                    <button onClick={(e) => { e.stopPropagation(); toggleStatus(task); }} className="mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center" style={{ borderColor: PRIMARY, backgroundColor: `${PRIMARY}20` }}>
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PRIMARY }}></div>
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm" style={{ color: '#E4E4E7' }}>{task.title}</p>
                      {task.description && <p className="text-xs mt-1 truncate" style={{ color: '#6B6B7B' }}>{task.description}</p>}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: `${getPriorityColor(task.priority)}20`, color: getPriorityColor(task.priority) }}>{task.priority}</span>
                        {task.dueDate && (
                          <span className="text-xs flex items-center gap-1" style={{ color: isOverdue(task.dueDate, task.status) ? '#EF4444' : '#6B6B7B' }}>
                            📅 {getDueDateLabel(task.dueDate)}
                          </span>
                        )}
                      </div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(task.id); }} className="p-1" style={{ color: '#EF4444' }}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                </div>
              ))}
              {inProgressTasks.length === 0 && <p className="text-center py-8 text-sm" style={{ color: '#4A4A55' }}>Drop tasks here</p>}
            </div>
          </div>

          <div onDragOver={handleDragOver} onDrop={() => handleDrop(TaskStatus.DONE)}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold flex items-center gap-2" style={{ color: '#10B981' }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#10B981' }}></span>
                Done
              </h2>
              <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: '#1C1C26', color: '#6B6B7B' }}>{doneTasks.length}</span>
            </div>
            <div className="space-y-2 min-h-48 p-2 rounded-xl border border-dashed" style={{ borderColor: draggedTask ? PRIMARY : '#1C1C26', backgroundColor: draggedTask ? `${PRIMARY}05` : 'transparent' }}>
              {doneTasks.map(task => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={() => handleDragStart(task)}
                  onDragEnd={() => setDraggedTask(null)}
                  className="p-4 rounded-xl border cursor-grab active:cursor-grabbing transition-all hover:scale-102 opacity-60"
                  style={{ backgroundColor: '#14141B', borderColor: draggedTask?.id === task.id ? PRIMARY : '#1C1C26', opacity: draggedTask?.id === task.id ? 0.5 : 0.6 }}
                  onClick={() => openEdit(task)}
                >
                  <div className="flex items-start gap-3">
                    <button onClick={(e) => { e.stopPropagation(); toggleStatus(task); }} className="mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center" style={{ borderColor: '#10B981', backgroundColor: '#10B981' }}>
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm line-through" style={{ color: '#6B6B7B' }}>{task.title}</p>
                      {task.description && <p className="text-xs mt-1 truncate line-through" style={{ color: '#6B6B7B' }}>{task.description}</p>}
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(task.id); }} className="p-1" style={{ color: '#EF4444' }}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                </div>
              ))}
              {doneTasks.length === 0 && <p className="text-center py-8 text-sm" style={{ color: '#4A4A55' }}>Drop tasks here</p>}
            </div>
          </div>
        </div>
      </main>

      {(showAddModal || editingTask) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => { setShowAddModal(false); setEditingTask(null); resetForm(); }}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ backgroundColor: '#14141B', border: '1px solid #1C1C26' }} onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-6" style={{ color: '#E4E4E7' }}>{editingTask ? 'Edit Task' : 'Add Task'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2" style={{ color: '#8B8B9E' }}>Title *</label>
                <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none" style={{ backgroundColor: '#1C1C26', border: '1px solid #2A2A35', color: '#E4E4E7' }} />
              </div>
              <div>
                <label className="block text-sm mb-2" style={{ color: '#8B8B9E' }}>Description</label>
                <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={2} className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none resize-none" style={{ backgroundColor: '#1C1C26', border: '1px solid #2A2A35', color: '#E4E4E7' }} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2" style={{ color: '#8B8B9E' }}>Status</label>
                  <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as TaskStatus })} className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none" style={{ backgroundColor: '#1C1C26', border: '1px solid #2A2A35', color: '#E4E4E7' }}>
                    {Object.values(TaskStatus).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-2" style={{ color: '#8B8B9E' }}>Priority</label>
                  <select value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value as Priority })} className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none" style={{ backgroundColor: '#1C1C26', border: '1px solid #2A2A35', color: '#E4E4E7' }}>
                    {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2" style={{ color: '#8B8B9E' }}>Due Date</label>
                  <input type="date" value={formData.dueDate} onChange={e => setFormData({ ...formData, dueDate: e.target.value })} className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none" style={{ backgroundColor: '#1C1C26', border: '1px solid #2A2A35', color: '#E4E4E7' }} />
                </div>
                <div>
                  <label className="block text-sm mb-2" style={{ color: '#8B8B9E' }}>Related Client</label>
                  <select value={formData.leadId} onChange={e => setFormData({ ...formData, leadId: e.target.value })} className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none" style={{ backgroundColor: '#1C1C26', border: '1px solid #2A2A35', color: '#E4E4E7' }}>
                    <option value="">None</option>
                    {leads.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowAddModal(false); setEditingTask(null); resetForm(); }} className="flex-1 py-2.5 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#1C1C26', color: '#8B8B9E' }}>Cancel</button>
              <button onClick={editingTask ? handleEdit : handleAdd} className="flex-1 py-2.5 rounded-lg text-sm font-semibold" style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`, color: 'white' }}>
                {editingTask ? 'Save' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

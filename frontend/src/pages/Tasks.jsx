import React, { useState, useEffect, useContext } from 'react';
import { Plus, Search, Filter, MessageSquare, AlertTriangle, Clock, Trash2, Edit, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import TaskModal from '../components/TaskModal';

export default function Tasks() {
  const { user } = useContext(AuthContext);
  const { addToast } = useToast();
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState({});
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setErrorState(null);
    try {
      if (isAdmin) {
        const [tasksRes, teamRes] = await Promise.all([
          api.get('/tasks/'),
          api.get('/team/')
        ]);
        setTasks(tasksRes.data || []);
        
        const memberMap = {};
        if (teamRes.data) {
          teamRes.data.forEach(m => { memberMap[m.id] = m; });
        }
        setMembers(memberMap);
      } else {
        const tasksRes = await api.get('/tasks/');
        setTasks(tasksRes.data || []);
        
        // Members only see their own tasks, so just use their own user object
        if (user) {
          setMembers({ [user.id]: user });
        }
      }
    } catch (error) {
      console.error("Failed to fetch data", error);
      setErrorState(error.response?.status === 403 ? "You do not have permission to view these tasks." : "Failed to load tasks. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const isAdmin = user?.role === 'Admin';
  const columns = ['Pending', 'In Progress', 'Completed'];

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'Critical': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      case 'High': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'Medium': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'Low': return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
      default: return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
    }
  };

  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    const taskId = parseInt(e.dataTransfer.getData('taskId'));
    if (!taskId) return;
    
    const originalTasks = [...tasks];
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus, is_overdue: newStatus === 'Completed' ? false : t.is_overdue } : t));

    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
    } catch (error) {
      setTasks(originalTasks);
      addToast("Failed to update status", "error");
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await api.delete(`/tasks/${id}`);
      addToast("Task deleted successfully");
      fetchData();
    } catch (error) {
      addToast("Failed to delete task", "error");
    }
  };

  const openEditModal = (task, e) => {
    e.stopPropagation();
    setEditingTask(task);
    setIsModalOpen(true);
  };

  // Filter Tasks locally
  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    const matchesPriority = priorityFilter === 'All' || t.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tasks Board</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isAdmin ? "Manage tasks across all your projects." : "Manage your assigned tasks."}
          </p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => { setEditingTask(null); setIsModalOpen(true); }}
            className="bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-500 hover:to-accent-500 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-2 shadow-glow transition-all"
          >
            <Plus size={16} />
            New Task
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks by title..." 
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all text-slate-900 dark:text-white"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full sm:w-48 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium text-slate-600 dark:text-slate-300 focus:outline-none focus:border-primary-500 transition-all"
          >
            <option value="All">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex gap-6 animate-pulse overflow-x-auto pb-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="min-w-[300px] w-[300px] h-96 bg-slate-200 dark:bg-slate-800 rounded-2xl shrink-0"></div>
          ))}
        </div>
      ) : errorState ? (
         <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-rose-500/30 bg-rose-500/5 rounded-2xl py-20">
            <AlertTriangle size={48} className="text-rose-500 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">Access Denied</h3>
            <p className="text-rose-500 dark:text-rose-400 mt-2 text-sm">{errorState}</p>
            <button onClick={fetchData} className="mt-4 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm transition-colors">
              Retry
            </button>
         </div>
      ) : filteredTasks.length === 0 ? (
         <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl py-20">
            <CheckCircle2 size={48} className="text-slate-300 dark:text-slate-700 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">No tasks found</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
              {searchQuery ? "Try adjusting your search filters." : (isAdmin ? "Create a new task to get started." : "You currently have no tasks assigned to you.")}
            </p>
         </div>
      ) : (
        <div className="flex gap-6 overflow-x-auto pb-4 flex-1 items-start min-h-[500px]">
          {columns.map(status => {
            const columnTasks = filteredTasks.filter(t => t.status === status);
            return (
              <div 
                key={status} 
                className="min-w-[320px] w-[320px] flex flex-col shrink-0"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, status)}
              >
                <div className="flex items-center justify-between mb-4 px-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">{status}</h3>
                    <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium px-2 py-0.5 rounded-full">
                      {columnTasks.length}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-3 min-h-[150px] bg-slate-100/50 dark:bg-slate-900/20 p-2 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  <AnimatePresence>
                    {columnTasks.map(task => (
                      <motion.div
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        className={`glass-card p-4 cursor-grab active:cursor-grabbing group transition-all ${
                          task.is_overdue ? 'border-rose-500/50 shadow-[0_0_10px_rgba(244,63,94,0.1)]' : 'hover:border-primary-500/30'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded border ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                            {task.is_overdue && (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-rose-500 bg-rose-500/10 border border-rose-500/20 px-2 py-1 rounded">
                                <AlertTriangle size={10} /> OVERDUE
                              </span>
                            )}
                          </div>
                          {isAdmin && (
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={(e) => openEditModal(task, e)} className="text-slate-400 hover:text-blue-500 transition-colors">
                                <Edit size={14} />
                              </button>
                              <button onClick={(e) => handleDelete(task.id, e)} className="text-slate-400 hover:text-rose-500 transition-colors">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                        
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2 leading-tight">
                          {task.title}
                        </h4>
                        
                        {task.due_date && (
                          <div className={`flex items-center gap-1.5 text-xs mb-4 ${task.is_overdue ? 'text-rose-500 font-medium' : 'text-slate-500 dark:text-slate-400'}`}>
                            <Clock size={12} />
                            {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-3 text-slate-400">
                            <div className="flex items-center gap-1 text-xs">
                              <MessageSquare size={14} /> 0
                            </div>
                          </div>
                          {task.assigned_to && members[task.assigned_to] ? (
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-[10px] font-bold text-white shadow-sm" title={members[task.assigned_to].name}>
                              {members[task.assigned_to].name.charAt(0)}
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-500 shadow-sm" title="Unassigned">
                              ?
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {columnTasks.length === 0 && (
                    <div className="h-24 flex items-center justify-center text-xs text-slate-400 font-medium">
                      Drop tasks here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isAdmin && (
        <TaskModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          task={editingTask} 
          onSaved={fetchData} 
        />
      )}
    </div>
  );
}

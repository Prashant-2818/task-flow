import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, FolderKanban, Calendar, MoreVertical, LayoutGrid, Trash2, Edit } from 'lucide-react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ProjectModal from '../components/ProjectModal';

export default function Projects() {
  const { user } = useContext(AuthContext);
  const { addToast } = useToast();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects/');
      setProjects(res.data);
    } catch (error) {
      console.error("Failed to fetch projects", error);
      addToast("Failed to fetch projects", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const isAdmin = user?.role === 'Admin';

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this project?")) return;
    try {
      await api.delete(`/projects/${id}`);
      addToast("Project deleted successfully");
      fetchProjects();
    } catch (error) {
      addToast("Failed to delete project", "error");
    }
  };

  const openEditModal = (project, e) => {
    e.stopPropagation();
    setEditingProject(project);
    setIsModalOpen(true);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Active': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'Completed': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'On Hold': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  // Derived state for filtering
  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Projects</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isAdmin ? "Manage your team's projects and resources." : "View projects you are assigned to."}
          </p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => { setEditingProject(null); setIsModalOpen(true); }}
            className="bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-500 hover:to-accent-500 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-2 shadow-glow transition-all"
          >
            <Plus size={16} />
            New Project
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects..." 
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all text-slate-900 dark:text-white"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-48 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium text-slate-600 dark:text-slate-300 focus:outline-none focus:border-primary-500 transition-all"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="On Hold">On Hold</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-48 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse"></div>)}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
          <LayoutGrid size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white">No projects found</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
            {searchQuery ? "Try adjusting your search or filters." : (isAdmin ? "Create a new project to get started." : "You haven't been assigned to any projects yet.")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project, i) => (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              key={project.id} 
              className="glass-card p-6 flex flex-col cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${getStatusColor(project.status)}`}>
                  {project.status}
                </div>
                {isAdmin && (
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => openEditModal(project, e)} className="text-slate-400 hover:text-blue-500 transition-colors">
                      <Edit size={16} />
                    </button>
                    <button onClick={(e) => handleDelete(project.id, e)} className="text-slate-400 hover:text-rose-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
              
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 line-clamp-1">{project.name}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 flex-1 line-clamp-2">
                {project.description || "No description provided."}
              </p>
              
              <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <Calendar size={14} />
                  {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'No deadline'}
                </div>
                <div className="flex -space-x-2">
                   {project.members && project.members.slice(0,3).map(m => (
                    <div key={m.user_id} className="w-6 h-6 rounded-full bg-primary-500 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-bold text-white" title={m.name}>
                      {m.name.charAt(0)}
                    </div>
                  ))}
                  {project.members && project.members.length > 3 && (
                     <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-bold text-slate-700 dark:text-slate-300">
                      +{project.members.length - 3}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {isAdmin && (
        <ProjectModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          project={editingProject} 
          onSaved={fetchProjects} 
        />
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Type, AlignLeft, Users, Check } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export default function ProjectModal({ isOpen, onClose, project = null, onSaved }) {
  const [formData, setFormData] = useState({ name: '', description: '', deadline: '', status: 'Active', member_ids: [] });
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      // Fetch available team members to assign
      api.get('/team/').then(res => setTeamMembers(res.data)).catch(console.error);

      if (project) {
        setFormData({
          name: project.name || '',
          description: project.description || '',
          deadline: project.deadline ? project.deadline.split('T')[0] : '',
          status: project.status || 'Active',
          member_ids: project.members ? project.members.map(m => m.user_id) : []
        });
      } else {
        setFormData({ name: '', description: '', deadline: '', status: 'Active', member_ids: [] });
      }
    }
  }, [project, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (project) {
        await api.put(`/projects/${project.id}`, formData);
        addToast("Project updated successfully");
      } else {
        await api.post('/projects/', formData);
        addToast("Project created successfully");
      }
      onSaved();
      onClose();
    } catch (error) {
      addToast(error.response?.data?.message || "Operation failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const toggleMember = (memberId) => {
    setFormData(prev => {
      const isSelected = prev.member_ids.includes(memberId);
      if (isSelected) {
        return { ...prev, member_ids: prev.member_ids.filter(id => id !== memberId) };
      } else {
        return { ...prev, member_ids: [...prev.member_ids, memberId] };
      }
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {project ? 'Edit Project' : 'New Project'}
            </h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Project Name</label>
              <div className="relative">
                <Type className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-primary-500 transition-all"
                  placeholder="E.g., Q3 Marketing Campaign"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Description</label>
              <div className="relative">
                <AlignLeft className="absolute left-3 top-3 text-slate-400" size={16} />
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-primary-500 transition-all resize-none"
                  placeholder="Describe the project goals..."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-primary-500 outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Deadline</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-primary-500 outline-none [color-scheme:light] dark:[color-scheme:dark]"
                  />
                </div>
              </div>
            </div>

            {/* Member Assignment Section */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 mt-4">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 ml-1">
                <Users size={14} />
                Assign Team Members
              </label>
              <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-2 max-h-40 overflow-y-auto custom-scrollbar">
                {teamMembers.length === 0 ? (
                  <div className="p-3 text-sm text-slate-500 dark:text-slate-400 text-center">
                    No team members available.
                  </div>
                ) : (
                  <div className="space-y-1">
                    {teamMembers.map(member => {
                      const isSelected = formData.member_ids.includes(member.id);
                      return (
                        <div 
                          key={member.id}
                          onClick={() => toggleMember(member.id)}
                          className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                            isSelected ? 'bg-primary-50 dark:bg-primary-500/10' : 'hover:bg-white dark:hover:bg-slate-800'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                            isSelected ? 'bg-primary-500 border-primary-500 text-white' : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700'
                          }`}>
                            {isSelected && <Check size={14} />}
                          </div>
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                            {member.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{member.name}</p>
                            <p className="text-xs text-slate-500 truncate">{member.email}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-6 flex gap-3 justify-end shrink-0">
              <button 
                type="button" 
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={loading}
                className="px-6 py-2 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-500 hover:to-accent-500 text-white text-sm font-medium rounded-xl shadow-glow transition-all disabled:opacity-50"
              >
                {loading ? 'Saving...' : project ? 'Update Project' : 'Create Project'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

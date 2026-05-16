import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Mail, CheckCircle2, FolderKanban, Search, UserPlus } from 'lucide-react';
import api from '../services/api';

export default function Team() {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const res = await api.get('/team/');
        setTeam(res.data);
      } catch (error) {
        console.error("Failed to fetch team", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTeam();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Team Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Monitor member workload and manage project access.</p>
        </div>
        <button className="bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-500 hover:to-accent-500 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-2 shadow-glow transition-all">
          <UserPlus size={16} />
          Invite Member
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search members..." 
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-48 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse"></div>)}
        </div>
      ) : team.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
          <Users size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white">No team members</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">Invite members to your workspace to collaborate.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {team.map((member, i) => (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              key={member.id} 
              className="glass-card p-6 flex flex-col"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-xl shadow-glow">
                  {member.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{member.name}</h3>
                  <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                    <Mail size={14} />
                    {member.email}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-slate-500 dark:text-slate-400 mb-1">
                    <FolderKanban size={14} />
                  </div>
                  <div className="font-bold text-slate-900 dark:text-white">{member.active_projects}</div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">Projects</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-amber-500 mb-1">
                    <CheckCircle2 size={14} />
                  </div>
                  <div className="font-bold text-slate-900 dark:text-white">{member.total_tasks - member.completed_tasks}</div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">Pending</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-emerald-500 mb-1">
                    <CheckCircle2 size={14} />
                  </div>
                  <div className="font-bold text-slate-900 dark:text-white">{member.completed_tasks}</div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">Done</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

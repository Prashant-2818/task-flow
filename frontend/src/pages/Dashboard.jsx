import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, FolderKanban, Activity, AlertTriangle, Users, Calendar } from 'lucide-react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/dashboard/analytics');
        setStats(res.data);
      } catch (error) {
        console.error("Failed to fetch analytics", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  if (loading) {
    return (
      <div className="flex space-x-4 animate-pulse">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex-1 bg-slate-200 dark:bg-slate-800 h-32 rounded-2xl"></div>
        ))}
      </div>
    );
  }

  const isAdmin = user?.role === 'Admin';

  const statCards = [
    { title: isAdmin ? 'Total Projects' : 'My Projects', value: stats?.total_projects || 0, icon: FolderKanban, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { title: isAdmin ? 'Total Pending' : 'My Pending Tasks', value: stats?.pending_tasks || 0, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { title: isAdmin ? 'Total Completed' : 'My Completed Tasks', value: stats?.completed_tasks || 0, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { title: 'Overdue Tasks', value: stats?.overdue_tasks || 0, icon: AlertTriangle, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  ];

  return (
    <div className="space-y-8 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {isAdmin ? 'Global Overview' : 'My Workspace'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isAdmin ? "Track overall team productivity and project health." : "Track your personal task completion and upcoming deadlines."}
          </p>
        </div>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
      >
        {statCards.map((stat, i) => (
          <motion.div key={i} variants={itemVariants} className="glass-card p-6 border-l-4" style={{borderLeftColor: stat.title.includes('Overdue') && stat.value > 0 ? '#f43f5e' : 'transparent'}}>
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon size={24} />
              </div>
              {stat.title.includes('Overdue') && stat.value > 0 && (
                <span className="flex items-center gap-1 text-xs font-bold text-rose-500 bg-rose-500/10 px-2 py-1 rounded-full animate-pulse">
                  Action Needed
                </span>
              )}
            </div>
            <div>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{stat.value}</h3>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">{stat.title}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Admin: Team Performance | Member: Personal Progress */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 glass-card p-6 flex flex-col h-[400px]"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {isAdmin ? 'Team Performance' : 'My Progress'}
            </h3>
            <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity size={16} className="text-primary-500" />
              {stats?.progress_percentage}% Overall Completion
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2">
            {isAdmin && stats?.member_performance?.length > 0 ? (
              <div className="space-y-4">
                {stats.member_performance.map(member => (
                  <div key={member.id} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{member.name}</p>
                        <p className="text-xs text-slate-500">{member.completed} / {member.total_assigned} tasks completed</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{member.completion_rate.toFixed(1)}%</p>
                      <div className="w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-primary-500 rounded-full" style={{width: `${member.completion_rate}%`}}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : !isAdmin ? (
               <div className="h-full flex flex-col items-center justify-center">
                 <div className="w-48 h-48 rounded-full border-8 border-slate-100 dark:border-slate-800 relative flex items-center justify-center">
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                      <circle
                        cx="50%"
                        cy="50%"
                        r="45%"
                        className="stroke-primary-500"
                        strokeWidth="8%"
                        fill="none"
                        strokeDasharray="283"
                        strokeDashoffset={283 - (283 * (stats?.progress_percentage || 0)) / 100}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-slate-900 dark:text-white">{stats?.progress_percentage}%</div>
                      <div className="text-xs text-slate-500">Completed</div>
                    </div>
                 </div>
               </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <Users size={48} className="text-slate-300 dark:text-slate-700 mb-4" />
                <p className="text-slate-500 dark:text-slate-400 font-medium">No team data available</p>
                <p className="text-xs text-slate-400 mt-1">Assign members to tasks to see performance.</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Activity Feed */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-6 flex flex-col h-[400px]"
        >
          <div className="flex items-center justify-between mb-6 shrink-0">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Activity</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-6">
            {stats?.activity_feed?.length > 0 ? stats.activity_feed.map((activity, i) => (
              <div key={activity.id} className="flex gap-4 relative group">
                {i !== stats.activity_feed.length - 1 && (
                  <div className="absolute left-[11px] top-8 bottom-[-16px] w-[2px] bg-slate-200 dark:bg-slate-800"></div>
                )}
                <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border-2 border-white dark:border-slate-950 z-10 group-hover:bg-primary-100 dark:group-hover:bg-primary-900 transition-colors">
                  <div className="w-2 h-2 rounded-full bg-slate-400 group-hover:bg-primary-500 transition-colors"></div>
                </div>
                <div>
                  <p className="text-sm text-slate-900 dark:text-slate-200">
                    <span className="font-semibold">{activity.user_name}</span> {activity.description}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {formatDistanceToNow(new Date(activity.timestamp))} ago
                  </p>
                </div>
              </div>
            )) : (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <Calendar size={48} className="text-slate-300 dark:text-slate-700 mb-4" />
                <p className="text-slate-500 dark:text-slate-400 font-medium">No recent activity</p>
              </div>
            )}
          </div>
        </motion.div>

      </div>
    </div>
  );
}

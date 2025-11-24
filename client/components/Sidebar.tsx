
import React from 'react';
import { LayoutDashboard, CalendarDays, PlusCircle, Zap, Clock, BarChart3, Users } from 'lucide-react';
import { ViewState } from '../types';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView }) => {
  const navItemClass = (view: ViewState) => `
    w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium
    ${currentView === view 
      ? 'bg-indigo-50 text-indigo-600 shadow-sm' 
      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}
  `;

  return (
    <aside className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0 z-10">
      <div className="p-6 flex items-center gap-2 border-b border-gray-100">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
          <Zap size={18} fill="currentColor" />
        </div>
        <span className="text-xl font-bold text-gray-800 tracking-tight">SocialOps</span>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        <button onClick={() => onChangeView('dashboard')} className={navItemClass('dashboard')}>
          <LayoutDashboard size={20} />
          Dashboard
        </button>
        <button onClick={() => onChangeView('calendar')} className={navItemClass('calendar')}>
          <CalendarDays size={20} />
          Calendar
        </button>
        <button onClick={() => onChangeView('recent-posts')} className={navItemClass('recent-posts')}>
          <Clock size={20} />
          Recent Posts
        </button>
        <button onClick={() => onChangeView('report')} className={navItemClass('report')}>
          <BarChart3 size={20} />
          Reports
        </button>
        <button onClick={() => onChangeView('accounts-management')} className={navItemClass('accounts-management')}>
          <Users size={20} />
          Accounts Mgmt
        </button>
      </nav>

      <div className="p-4">
        <button 
          onClick={() => onChangeView('add-post')}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:transform active:scale-95"
        >
          <PlusCircle size={18} />
          New Post
        </button>
      </div>
    </aside>
  );
};

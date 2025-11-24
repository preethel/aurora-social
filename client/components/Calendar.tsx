
import React, { useState } from 'react';
import { SocialPost, Platform } from '../types';
import { PLATFORM_COLORS, MONTH_NAMES, WEEK_DAYS, BRAND_OPTIONS, PLATFORM_OPTIONS } from '../constants';
import { PostModal } from './PostModal';
import { 
  ChevronLeft, 
  ChevronRight, 
  Filter,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Video,
  Send,
  MessageCircle,
  Image as ImageIcon,
  AtSign,
  Hash
} from 'lucide-react';

interface CalendarViewProps {
  posts: SocialPost[];
  onDelete: (id: string) => void;
  onEdit: (post: SocialPost) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ posts, onDelete, onEdit }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null);
  
  // Filter states
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getPostsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return posts.filter(p => {
      const matchesDate = p.date === dateStr;
      const matchesBrand = selectedBrand ? p.brandName === selectedBrand : true;
      const matchesPlatform = selectedPlatform ? p.platform === selectedPlatform : true;
      return matchesDate && matchesBrand && matchesPlatform;
    });
  };

  const getPlatformIcon = (platform: Platform) => {
    switch (platform) {
      case Platform.FacebookPage:
      case Platform.FacebookGroup:
        return <Facebook size={12} />;
      case Platform.Instagram:
        return <Instagram size={12} />;
      case Platform.X:
        return <Twitter size={12} />;
      case Platform.YouTube:
        return <Youtube size={12} />;
      case Platform.TikTok:
        return <Video size={12} />;
      case Platform.Pinterest:
        return <ImageIcon size={12} />;
      case Platform.Threads:
        return <AtSign size={12} />;
      case Platform.Telegram:
        return <Send size={12} />;
      case Platform.WhatsApp:
      case Platform.IMO:
        return <MessageCircle size={12} />;
      default:
        return <Hash size={12} />;
    }
  };

  const renderCalendarDays = () => {
    const days = [];
    
    // Empty cells for padding at start
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="min-h-[120px] bg-gray-50/50 border border-gray-100/50" />);
    }

    // Actual days
    for (let d = 1; d <= daysInMonth; d++) {
      const dayPosts = getPostsForDay(d);
      const isToday = new Date().toDateString() === new Date(year, month, d).toDateString();

      days.push(
        <div 
          key={d} 
          className={`min-h-[120px] border border-gray-200 bg-white p-1.5 overflow-hidden relative group hover:border-indigo-300 transition-colors ${isToday ? 'bg-blue-50/30' : ''}`}
        >
          <div className="flex justify-between items-start mb-2 px-1">
            <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-indigo-600 text-white' : 'text-gray-500'}`}>
              {d}
            </span>
            {dayPosts.length > 0 && (
               <span className="text-[10px] text-gray-400 font-medium bg-gray-100 px-1.5 py-0.5 rounded-full">
                 {dayPosts.length}
               </span>
            )}
          </div>
          
          <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[85px] custom-scrollbar px-0.5">
            {dayPosts.map(post => (
              <button
                key={post.id}
                onClick={(e) => { e.stopPropagation(); setSelectedPost(post); }}
                className="w-full text-left group/card relative flex items-center gap-2 bg-gray-50 p-1.5 rounded-md border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-200 hover:bg-white transition-all"
              >
                {/* Icon Indicator */}
                 <div 
                  className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-white shadow-sm"
                  style={{ backgroundColor: PLATFORM_COLORS[post.platform] }}
                >
                  {getPlatformIcon(post.platform)}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                   <div className="text-[11px] font-bold text-gray-700 truncate leading-tight">{post.brandName}</div>
                   <div className="text-[9px] text-gray-400 truncate leading-tight mt-0.5 flex items-center gap-1">
                      {post.accountName ? (post.accountName.startsWith('@') ? post.accountName : `@${post.accountName}`) : post.platform}
                   </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      );
    }
    return days;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex flex-col xl:flex-row xl:items-center justify-between gap-4 shrink-0 bg-white z-10">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span className="bg-indigo-50 text-indigo-600 p-1.5 rounded-lg"><Filter size={18}/></span>
            {MONTH_NAMES[month]} {year}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3 justify-end">
          
          {/* Filters */}
          <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg border border-gray-200 shadow-sm">
            <select 
              value={selectedBrand} 
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="bg-transparent py-1.5 pl-2 text-sm font-medium text-gray-700 focus:outline-none cursor-pointer hover:text-indigo-600 transition-colors"
            >
              <option value="">All Brands</option>
              {Object.keys(BRAND_OPTIONS).map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            <div className="w-px h-4 bg-gray-300 mx-1"></div>
            <select 
              value={selectedPlatform} 
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="bg-transparent py-1.5 pr-2 text-sm font-medium text-gray-700 focus:outline-none cursor-pointer hover:text-indigo-600 transition-colors"
            >
              <option value="">All Platforms</option>
              {PLATFORM_OPTIONS.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div className="h-8 w-px bg-gray-200 mx-1 hidden sm:block"></div>

          {/* Navigation */}
          <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-200">
            <button 
              onClick={prevMonth}
              className="p-1.5 hover:bg-white hover:shadow-sm rounded-md text-gray-600 transition-all"
            >
              <ChevronLeft size={18} />
            </button>
            <button 
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1 text-xs font-bold text-gray-600 hover:bg-white hover:text-indigo-600 hover:shadow-sm rounded-md transition-all uppercase tracking-wide"
            >
              Today
            </button>
            <button 
              onClick={nextMonth}
              className="p-1.5 hover:bg-white hover:shadow-sm rounded-md text-gray-600 transition-all"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Weekday Header */}
      <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200 shrink-0">
        {WEEK_DAYS.map(day => (
          <div key={day} className="py-3 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 bg-gray-100 gap-px border-b border-gray-200 flex-1 overflow-y-auto">
        {renderCalendarDays()}
      </div>

      {/* Modal */}
      {selectedPost && (
        <PostModal 
          post={selectedPost} 
          onClose={() => setSelectedPost(null)}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      )}
    </div>
  );
};

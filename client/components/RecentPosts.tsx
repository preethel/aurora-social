import React, { useState } from 'react';
import { SocialPost } from '../types';
import { PLATFORM_COLORS } from '../constants';
import { PostModal } from './PostModal';
import { SafeEmbed } from './SafeEmbed';
import { Calendar, Clock, User, Trash2, Pencil } from 'lucide-react';

interface RecentPostsProps {
  posts: SocialPost[];
  onDelete: (id: string) => void;
  onEdit: (post: SocialPost) => void;
}

export const RecentPosts: React.FC<RecentPostsProps> = ({ posts, onDelete, onEdit }) => {
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null);

  // Sort posts by createdAt (descending)
  const sortedPosts = [...posts].sort((a, b) => b.createdAt - a.createdAt);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Recent Posts</h1>
        <p className="text-gray-500">All submissions sorted by creation time.</p>
      </div>

      {sortedPosts.length === 0 ? (
         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-400">
            <Clock size={48} className="mx-auto mb-4 opacity-50" />
            <p>No posts have been submitted yet.</p>
          </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
          {sortedPosts.map((post) => (
            <div 
              key={post.id} 
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 flex flex-col group h-auto"
            >
              {/* Colored Top Bar */}
              <div className="h-1.5 w-full shrink-0" style={{ backgroundColor: PLATFORM_COLORS[post.platform] }} />

              {/* Header - Padded */}
              <div className="px-5 py-4 flex justify-between items-start">
                  <div onClick={() => setSelectedPost(post)} className="cursor-pointer">
                    <h3 className="font-bold text-gray-800 text-lg leading-tight line-clamp-1 hover:text-indigo-600">{post.brandName}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{post.platform}</p>
                  </div>
                  <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm text-xs font-bold"
                  style={{ backgroundColor: PLATFORM_COLORS[post.platform] }}
                  >
                    {post.brandName.substring(0, 2).toUpperCase()}
                  </div>
              </div>

              {/* Preview / Media Area - Edge to Edge (No padding) */}
              <div 
                  className="w-full bg-white border-t border-b border-gray-50 relative min-h-[100px] flex items-center justify-center"
              >
                {post.mediaType === 'screenshot' && post.screenshot ? (
                  <div 
                      className="cursor-pointer w-full"
                      onClick={() => setSelectedPost(post)}
                  >
                      <img 
                      src={post.screenshot} 
                      alt="Post Screenshot" 
                      className="w-full h-auto block"
                      loading="lazy"
                      />
                  </div>
                ) : (
                  <div className="w-full">
                     <SafeEmbed content={post.content} platform={post.platform} variant="minimal" />
                  </div>
                )}
              </div>

              {/* Metadata - Padded */}
              <div className="px-5 py-3">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={12} className="text-gray-400" />
                      {post.date}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <User size={12} className="text-gray-400" />
                      <span className="truncate max-w-[100px]">{post.creatorName}</span>
                    </span>
                  </div>
              </div>

              {/* Footer: Timestamp & Actions */}
              <div className="px-5 py-3 border-t border-gray-50 bg-gray-50/50 flex items-center justify-between text-xs text-gray-400 mt-auto">
                <div className="flex items-center gap-2">
                   <Clock size={12} />
                   <span>{formatDate(post.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button 
                    onClick={(e) => { e.stopPropagation(); onEdit(post); }}
                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    title="Edit Post"
                   >
                     <Pencil size={14} />
                   </button>
                   <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(post.id); }}
                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Delete Post"
                   >
                     <Trash2 size={14} />
                   </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
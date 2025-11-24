
import React from 'react';
import { X, Calendar, User, DollarSign, Tag, ExternalLink, Image as ImageIcon, FileText, Pencil, Trash2, List, Layers } from 'lucide-react';
import { SocialPost } from '../types';
import { PLATFORM_COLORS } from '../constants';
import { SafeEmbed } from './SafeEmbed';

interface PostModalProps {
  post: SocialPost | null;
  onClose: () => void;
  onDelete?: (id: string) => void;
  onEdit?: (post: SocialPost) => void;
}

export const PostModal: React.FC<PostModalProps> = ({ post, onClose, onDelete, onEdit }) => {
  if (!post) return null;

  const brandColor = PLATFORM_COLORS[post.platform];

  const handleDelete = () => {
    if (onDelete) {
      onDelete(post.id);
      onClose();
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(post);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-up">
        
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-3">
            <div 
              className="w-3 h-12 rounded-full"
              style={{ backgroundColor: brandColor }}
            />
            <div>
              <h2 className="text-xl font-bold text-gray-800">{post.brandName}</h2>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold text-gray-600">
                  {post.accountName ? (post.accountName.startsWith('@') ? post.accountName : `@${post.accountName}`) : ''}
                </span>
                {post.accountName && <span className="text-gray-300">•</span>}
                <span style={{ color: brandColor }} className="font-medium">{post.platform}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {onEdit && (
              <button 
                onClick={handleEdit}
                className="p-2 hover:bg-blue-50 text-gray-500 hover:text-blue-600 rounded-full transition-colors"
                title="Edit Post"
              >
                <Pencil size={20} />
              </button>
            )}
            {onDelete && (
              <button 
                onClick={handleDelete}
                className="p-2 hover:bg-red-50 text-gray-500 hover:text-red-600 rounded-full transition-colors"
                title="Delete Post"
              >
                <Trash2 size={20} />
              </button>
            )}
            <div className="w-px h-6 bg-gray-300 mx-1"></div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 flex-1">
          
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-xs text-gray-400 uppercase font-semibold mb-1 flex items-center gap-1">
                <Calendar size={12} /> Date
              </div>
              <div className="font-medium text-gray-800">{post.date}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-xs text-gray-400 uppercase font-semibold mb-1 flex items-center gap-1">
                <User size={12} /> Creator
              </div>
              <div className="font-medium text-gray-800">{post.creatorName}</div>
            </div>
             <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-xs text-gray-400 uppercase font-semibold mb-1 flex items-center gap-1">
                <Tag size={12} /> Posted By
              </div>
              <div className="font-medium text-gray-800">{post.postedBy}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-xs text-gray-400 uppercase font-semibold mb-1 flex items-center gap-1">
                <DollarSign size={12} /> Currency
              </div>
              <div className="font-medium text-gray-800">{post.currency || 'N/A'}</div>
            </div>
          </div>

          {/* New Metadata Grid Row */}
          {(post.category || post.postType) && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              {post.category && (
                <div className="bg-indigo-50/50 p-3 rounded-lg border border-indigo-100">
                  <div className="text-xs text-indigo-500 uppercase font-semibold mb-1 flex items-center gap-1">
                    <List size={12} /> Category
                  </div>
                  <div className="font-medium text-gray-800">{post.category}</div>
                </div>
              )}
              {post.postType && (
                <div className="bg-indigo-50/50 p-3 rounded-lg border border-indigo-100">
                  <div className="text-xs text-indigo-500 uppercase font-semibold mb-1 flex items-center gap-1">
                    <Layers size={12} /> Post Type
                  </div>
                  <div className="font-medium text-gray-800 badge">{post.postType}</div>
                </div>
              )}
            </div>
          )}

          {/* Remarks Section */}
          {post.remarks && (
             <div className="mb-6 bg-yellow-50 border border-yellow-100 p-4 rounded-lg">
               <div className="text-xs text-yellow-600 uppercase font-semibold mb-2 flex items-center gap-1">
                  <FileText size={12} /> Remarks / Notes
               </div>
               <p className="text-gray-700 text-sm leading-relaxed">{post.remarks}</p>
             </div>
          )}

          {/* Embed / Screenshot Area */}
          <div className="mb-2">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              {post.mediaType === 'screenshot' ? <ImageIcon size={16}/> : null}
              Post Preview
            </h3>
            
            {post.mediaType === 'screenshot' && post.screenshot ? (
              <div className="w-full bg-gray-50 border border-gray-200 rounded-lg p-4 flex flex-col items-center gap-4">
                <div className="w-full flex justify-center bg-white rounded-lg border border-gray-100 p-2 shadow-sm">
                  <img 
                    src={post.screenshot} 
                    alt="Post Screenshot" 
                    className="max-h-[400px] object-contain rounded"
                  />
                </div>
                <a 
                  href={post.redirectLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-full text-white text-sm font-medium hover:opacity-90 transition-all flex items-center gap-2 shadow-lg"
                  style={{ backgroundColor: brandColor }}
                >
                  View Original Post <ExternalLink size={14} />
                </a>
                <p className="text-xs text-gray-400">This is a screenshot preview. Click the button to view live.</p>
              </div>
            ) : (
              <SafeEmbed content={post.content} platform={post.platform} />
            )}
          </div>

        </div>
        
        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 text-right text-xs text-gray-400">
          ID: {post.id} • Created: {new Date(post.createdAt).toLocaleString()}
        </div>
      </div>
    </div>
  );
};

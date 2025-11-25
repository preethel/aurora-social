import { BarChart3, Eye, ThumbsUp, X } from "lucide-react";
import React, { useState } from "react";
import { SocialPost } from "../types";

interface InsightModalProps {
  post: SocialPost;
  onClose: () => void;
  onSave: (
    postId: string,
    insights: { impressions?: number; engagement?: number }
  ) => void;
}

export const InsightModal: React.FC<InsightModalProps> = ({
  post,
  onClose,
  onSave,
}) => {
  const [impressions, setImpressions] = useState<string>(
    post.impressions?.toString() || ""
  );
  const [engagement, setEngagement] = useState<string>(
    post.engagement?.toString() || ""
  );
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const insights: { impressions?: number; engagement?: number } = {};

      if (impressions) {
        insights.impressions = parseInt(impressions);
      }
      if (engagement) {
        insights.engagement = parseInt(engagement);
      }

      await onSave(post.id, insights);
      onClose();
    } catch (error) {
      console.error("Failed to save insights:", error);
      alert("Failed to save insights");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <BarChart3 className="text-indigo-600" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Post Insights</h2>
              <p className="text-xs text-gray-500">
                {post.brandName} - {post.platform}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Impressions */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Eye size={16} className="text-gray-400" />
              Post Impressions
            </label>
            <input
              type="number"
              value={impressions}
              onChange={(e) => setImpressions(e.target.value)}
              placeholder="Enter total impressions"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              min="0"
            />
            <p className="text-xs text-gray-500 mt-1">
              Total number of times this post was displayed
            </p>
          </div>

          {/* Engagement */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <ThumbsUp size={16} className="text-gray-400" />
              Post Engagement
            </label>
            <input
              type="number"
              value={engagement}
              onChange={(e) => setEngagement(e.target.value)}
              placeholder="Enter total engagement"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              min="0"
            />
            <p className="text-xs text-gray-500 mt-1">
              Likes, comments, shares, clicks, etc.
            </p>
          </div>

          {/* Engagement Rate Display */}
          {impressions && engagement && parseInt(impressions) > 0 && (
            <div className="bg-indigo-50 rounded-lg p-4">
              <p className="text-xs font-medium text-indigo-900 mb-1">
                Engagement Rate
              </p>
              <p className="text-2xl font-bold text-indigo-600">
                {((parseInt(engagement) / parseInt(impressions)) * 100).toFixed(
                  2
                )}
                %
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || (!impressions && !engagement)}
              className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Insights"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


import React, { useMemo } from 'react';
import { SocialPost } from '../types';
import { BRAND_OPTIONS, PLATFORM_COLORS } from '../constants';
import { Shield, CheckCircle, Clock, Activity, User, Globe, DollarSign, Briefcase } from 'lucide-react';

interface AccountsManagementProps {
  posts: SocialPost[];
}

export const AccountsManagement: React.FC<AccountsManagementProps> = ({ posts }) => {
  
  // Derive "Active Accounts" from the post history
  const activeAccounts = useMemo(() => {
    const accMap = new Map();
    
    posts.forEach(post => {
      // Unique key combining Platform and Handle/Name
      const key = `${post.platform}-${post.accountName}`;
      
      if (!accMap.has(key)) {
        accMap.set(key, {
          platform: post.platform,
          accountName: post.accountName,
          brandName: post.brandName,
          lastActive: post.createdAt,
          postCount: 1,
          creator: post.creatorName // Most recent creator
        });
      } else {
        const acc = accMap.get(key);
        if (post.createdAt > acc.lastActive) {
            acc.lastActive = post.createdAt;
            acc.creator = post.creatorName; // Update to latest creator
        }
        acc.postCount += 1;
      }
    });
    
    return Array.from(accMap.values()).sort((a, b) => b.lastActive - a.lastActive);
  }, [posts]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Accounts Management</h1>
            <p className="text-gray-500">Overview of organization brands and active social profiles.</p>
        </div>
        <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
            <Shield size={16} />
            <span>Admin Access</span>
        </div>
      </div>

      {/* Organization Brands Section */}
      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Briefcase size={20} className="text-gray-500" />
            Registered Brands
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(BRAND_OPTIONS).map(([brandName, options]) => (
                <div key={brandName} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:border-indigo-200 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-lg text-gray-800">{brandName}</h3>
                        <CheckCircle size={18} className="text-green-500" />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-start gap-2 text-sm text-gray-600">
                            <DollarSign size={14} className="mt-0.5 text-gray-400" />
                            <div className="flex flex-wrap gap-1">
                                {options.filter(o => ['BDT', 'INR', 'PKR', 'NPR', 'AED', 'SAR', 'OMR', 'ALL'].includes(o)).map(curr => (
                                    <span key={curr} className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-medium text-gray-600 border border-gray-200">{curr}</span>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-start gap-2 text-sm text-gray-600">
                            <Globe size={14} className="mt-0.5 text-gray-400" />
                            <div className="flex flex-wrap gap-1">
                                {options.filter(o => !['BDT', 'INR', 'PKR', 'NPR', 'AED', 'SAR', 'OMR', 'ALL'].includes(o)).map(cat => (
                                    <span key={cat} className="px-1.5 py-0.5 bg-blue-50 rounded text-xs font-medium text-blue-600 border border-blue-100">{cat}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </section>

      {/* Active Profiles Table */}
      <section>
        <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <User size={20} className="text-gray-500" />
                Active Profiles ({activeAccounts.length})
            </h2>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                Derived from post history
            </span>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold">
                            <th className="px-6 py-4">Account Name</th>
                            <th className="px-6 py-4">Platform</th>
                            <th className="px-6 py-4">Brand Association</th>
                            <th className="px-6 py-4 text-center">Total Posts</th>
                            <th className="px-6 py-4">Last Active</th>
                            <th className="px-6 py-4">Last Used By</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {activeAccounts.length > 0 ? (
                            activeAccounts.map((acc, idx) => (
                                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className="font-medium text-gray-900">
                                            {acc.accountName.startsWith('@') ? acc.accountName : `@${acc.accountName}`}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span 
                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white"
                                            style={{ backgroundColor: PLATFORM_COLORS[acc.platform] }}
                                        >
                                            {acc.platform}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {acc.brandName}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                            {acc.postCount}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 flex items-center gap-1.5">
                                        <Clock size={14} />
                                        {formatDate(acc.lastActive)}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                                                {acc.creator.charAt(0).toUpperCase()}
                                            </div>
                                            {acc.creator}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                    <Activity size={32} className="mx-auto mb-2 opacity-20"/>
                                    No active profiles found. Start creating posts to see accounts here.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </section>
    </div>
  );
};

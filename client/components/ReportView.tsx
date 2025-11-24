
import React, { useMemo, useState } from 'react';
import { SocialPost, Platform } from '../types';
import { PLATFORM_COLORS } from '../constants';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';
import { Download, Calendar, TrendingUp, Users, Award, Activity } from 'lucide-react';

interface ReportViewProps {
  posts: SocialPost[];
}

type TimeRange = '7days' | '30days' | '90days' | 'all';

export const ReportView: React.FC<ReportViewProps> = ({ posts }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('30days');

  // --- Data Processing ---
  
  const filteredPosts = useMemo(() => {
    if (timeRange === 'all') return posts;
    
    const now = new Date();
    const past = new Date();
    const daysToSubtract = timeRange === '7days' ? 7 : timeRange === '30days' ? 30 : 90;
    past.setDate(now.getDate() - daysToSubtract);
    
    return posts.filter(p => new Date(p.date) >= past);
  }, [posts, timeRange]);

  const analytics = useMemo(() => {
    const total = filteredPosts.length;
    
    // Aggregators
    const byBrand: Record<string, number> = {};
    const byPlatform: Record<string, number> = {};
    const byCreator: Record<string, number> = {};
    const byDate: Record<string, number> = {};

    filteredPosts.forEach(post => {
      byBrand[post.brandName] = (byBrand[post.brandName] || 0) + 1;
      byPlatform[post.platform] = (byPlatform[post.platform] || 0) + 1;
      byCreator[post.creatorName] = (byCreator[post.creatorName] || 0) + 1;
      byDate[post.date] = (byDate[post.date] || 0) + 1;
    });

    // Top Performers
    const topBrand = Object.entries(byBrand).sort((a, b) => b[1] - a[1])[0] || ['N/A', 0];
    const topPlatform = Object.entries(byPlatform).sort((a, b) => b[1] - a[1])[0] || ['N/A', 0];
    const topCreator = Object.entries(byCreator).sort((a, b) => b[1] - a[1])[0] || ['N/A', 0];

    // Chart Data Formatters
    const brandData = Object.entries(byBrand)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const platformData = Object.entries(byPlatform)
      .map(([name, count]) => ({ 
        name, 
        count, 
        color: PLATFORM_COLORS[name as Platform] || '#cbd5e1' 
      }))
      .sort((a, b) => b.count - a.count);

    // Sort timeline by date
    const timelineData = Object.entries(byDate)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return {
      total,
      topBrand,
      topPlatform,
      topCreator,
      brandData,
      platformData,
      timelineData
    };
  }, [filteredPosts]);

  const handleDownloadCSV = () => {
    const headers = ['ID', 'Date', 'Brand', 'Platform', 'Creator', 'Currency', 'URL/Content'];
    const csvContent = [
      headers.join(','),
      ...filteredPosts.map(p => [
        p.id,
        p.date,
        `"${p.brandName}"`, // quote strings to handle commas
        p.platform,
        `"${p.creatorName}"`,
        p.currency,
        `"${p.mediaType === 'screenshot' ? p.redirectLink : 'Embed Content'}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `social_ops_report_${timeRange}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const KpiCard = ({ title, value, subValue, icon: Icon, colorClass }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
             <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
             {subValue && <span className="text-xs text-gray-500 font-medium">{subValue}</span>}
          </div>
        </div>
        <div className={`p-2.5 rounded-lg ${colorClass} bg-opacity-10`}>
          <Icon size={20} className={colorClass.replace('bg-', 'text-')} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics & Reporting</h1>
          <p className="text-gray-500">Comprehensive performance overview and export tools.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-white rounded-lg shadow-sm border border-gray-200 p-1">
            {[
              { id: '7days', label: '7 Days' },
              { id: '30days', label: '30 Days' },
              { id: '90days', label: '3 Months' },
              { id: 'all', label: 'All Time' },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setTimeRange(opt.id as TimeRange)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  timeRange === opt.id 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button 
            onClick={handleDownloadCSV}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 hover:text-indigo-600 transition-colors shadow-sm"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard 
          title="Total Posts" 
          value={analytics.total} 
          subValue="in selected period"
          icon={Activity} 
          colorClass="bg-blue-600 text-blue-600" 
        />
        <KpiCard 
          title="Top Brand" 
          value={analytics.topBrand[0]} 
          subValue={`${analytics.topBrand[1]} posts`}
          icon={Award} 
          colorClass="bg-purple-600 text-purple-600" 
        />
         <KpiCard 
          title="Most Used Platform" 
          value={analytics.topPlatform[0]} 
          subValue={`${analytics.topPlatform[1]} posts`}
          icon={TrendingUp} 
          colorClass="bg-pink-600 text-pink-600" 
        />
        <KpiCard 
          title="Top Contributor" 
          value={analytics.topCreator[0]} 
          subValue={`${analytics.topCreator[1]} posts`}
          icon={Users} 
          colorClass="bg-green-600 text-green-600" 
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-base font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Calendar size={18} className="text-gray-400"/>
            Posting Velocity
          </h3>
          <div className="h-[300px] w-full">
            {analytics.timelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.timelineData}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    tick={{fontSize: 12, fill: '#94a3b8'}} 
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                  />
                  <YAxis 
                     tick={{fontSize: 12, fill: '#94a3b8'}} 
                     axisLine={false}
                     tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#4f46e5" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorCount)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
               <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <Activity size={32} className="mb-2 opacity-20"/>
                <span>No activity in this range</span>
              </div>
            )}
          </div>
        </div>

        {/* Platform Donut */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-base font-bold text-gray-800 mb-6">Platform Share</h3>
          <div className="h-[300px] w-full">
             {analytics.platformData.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.platformData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="count"
                  >
                    {analytics.platformData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{borderRadius: '8px', border: 'none'}}/>
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    iconType="circle"
                    formatter={(value) => <span className="text-xs text-gray-600 ml-1">{value}</span>}
                  />
                </PieChart>
               </ResponsiveContainer>
             ) : (
               <div className="h-full flex items-center justify-center text-gray-400">No data</div>
             )}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Brand Distribution */}
         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-base font-bold text-gray-800 mb-6">Posts by Brand</h3>
            <div className="h-[300px] w-full">
               {analytics.brandData.length > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={analytics.brandData} layout="vertical" margin={{ left: 40, right: 20 }}>
                     <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                     <XAxis type="number" hide />
                     <YAxis 
                        dataKey="name" 
                        type="category" 
                        width={80}
                        tick={{fontSize: 12, fill: '#64748b'}}
                        axisLine={false}
                        tickLine={false}
                     />
                     <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                     <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={24} />
                   </BarChart>
                 </ResponsiveContainer>
               ) : (
                 <div className="h-full flex items-center justify-center text-gray-400">No data</div>
               )}
            </div>
         </div>

         {/* Additional Platform Bar Chart (for clarity on lower numbers) */}
         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-base font-bold text-gray-800 mb-6">Volume by Platform</h3>
            <div className="h-[300px] w-full">
               {analytics.platformData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.platformData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                      <XAxis 
                        dataKey="name" 
                        tick={{fontSize: 10, fill: '#64748b'}} 
                        axisLine={false}
                        tickLine={false}
                        interval={0}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis hide />
                      <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {analytics.platformData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
               ) : (
                 <div className="h-full flex items-center justify-center text-gray-400">No data</div>
               )}
            </div>
         </div>
      </div>
    </div>
  );
};

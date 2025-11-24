import React, { useMemo } from 'react';
import { SocialPost, Platform } from '../types';
import { PLATFORM_COLORS } from '../constants';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { TrendingUp, Award, Layers } from 'lucide-react';

interface DashboardProps {
  posts: SocialPost[];
}

export const Dashboard: React.FC<DashboardProps> = ({ posts }) => {
  
  const stats = useMemo(() => {
    const totalPosts = posts.length;
    const byPlatform: Record<string, number> = {};
    const byCreator: Record<string, number> = {};

    posts.forEach(p => {
      byPlatform[p.platform] = (byPlatform[p.platform] || 0) + 1;
      byCreator[p.creatorName] = (byCreator[p.creatorName] || 0) + 1;
    });

    const topPlatform = Object.entries(byPlatform).sort((a, b) => b[1] - a[1])[0];
    const topCreator = Object.entries(byCreator).sort((a, b) => b[1] - a[1])[0];

    const platformChartData = Object.entries(byPlatform).map(([name, value]) => ({
      name,
      value,
      color: PLATFORM_COLORS[name as Platform] || '#ccc'
    }));

    return {
      totalPosts,
      topPlatform: topPlatform ? topPlatform[0] : 'N/A',
      topCreator: topCreator ? topCreator[0] : 'N/A',
      platformChartData
    };
  }, [posts]);

  const StatCard = ({ title, value, icon: Icon, colorClass }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
        <div className={`p-2 rounded-full ${colorClass} bg-opacity-10`}>
          <Icon size={20} className={colorClass.replace('bg-', 'text-')} />
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-800">{value}</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-500">Track your social media performance and schedule.</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Total Scheduled Posts" 
          value={stats.totalPosts} 
          icon={Layers} 
          colorClass="bg-blue-500 text-blue-600" 
        />
        <StatCard 
          title="Top Platform" 
          value={stats.topPlatform} 
          icon={TrendingUp} 
          colorClass="bg-purple-500 text-purple-600" 
        />
        <StatCard 
          title="Top Creator" 
          value={stats.topCreator} 
          icon={Award} 
          colorClass="bg-green-500 text-green-600" 
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-h-[400px]">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Posts by Platform</h3>
          {stats.platformChartData.length > 0 ? (
             <ResponsiveContainer width="100%" height={300}>
             <BarChart data={stats.platformChartData} layout="vertical" margin={{ left: 40 }}>
               <XAxis type="number" hide />
               <YAxis 
                dataKey="name" 
                type="category" 
                width={100} 
                tick={{fontSize: 12}} 
                interval={0}
               />
               <Tooltip 
                contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                cursor={{fill: 'transparent'}}
               />
               <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                 {stats.platformChartData.map((entry, index) => (
                   <Cell key={`cell-${index}`} fill={entry.color} />
                 ))}
               </Bar>
             </BarChart>
           </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">No data available</div>
          )}
        </div>

        {/* Pie Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-h-[400px]">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Platform Distribution</h3>
           {stats.platformChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.platformChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.platformChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                />
              </PieChart>
            </ResponsiveContainer>
           ) : (
             <div className="h-full flex items-center justify-center text-gray-400">No data available</div>
           )}
        </div>
      </div>
    </div>
  );
};
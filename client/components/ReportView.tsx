import {
  Activity,
  Award,
  Calendar,
  Download,
  TrendingUp,
  Users,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PLATFORM_COLORS } from "../constants";
import { reportsApi } from "../services/api";
import { Platform } from "../types";

type TimeRange = "7days" | "30days" | "90days" | "all";

interface AnalyticsData {
  total: number;
  topBrand: { name: string; count: number };
  topPlatform: { name: string; count: number };
  topCreator: { name: string; count: number };
  brandData: Array<{ name: string; count: number }>;
  platformData: Array<{ name: string; count: number }>;
  timelineData: Array<{ date: string; count: number }>;
}

export const ReportView: React.FC = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>("30days");
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const response = await reportsApi.getAnalytics(timeRange);
        setAnalytics(response.data);
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeRange]);

  const platformData = useMemo(() => {
    if (!analytics) return [];
    return analytics.platformData.map((item) => ({
      ...item,
      color: PLATFORM_COLORS[item.name as Platform] || "#cbd5e1",
    }));
  }, [analytics]);

  const handleDownloadCSV = () => {
    reportsApi.exportCSV(timeRange);
  };

  const KpiCard = ({ title, value, subValue, icon: Icon, colorClass }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">
            {title}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
            {subValue && (
              <span className="text-xs text-gray-500 font-medium">
                {subValue}
              </span>
            )}
          </div>
        </div>
        <div className={`p-2.5 rounded-lg ${colorClass} bg-opacity-10`}>
          <Icon size={20} className={colorClass.replace("bg-", "text-")} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : !analytics ? (
        <div className="text-center py-20 text-gray-500">
          Failed to load analytics
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Analytics & Reporting
              </h1>
              <p className="text-gray-500">
                Comprehensive performance overview and export tools.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex bg-white rounded-lg shadow-sm border border-gray-200 p-1">
                {[
                  { id: "7days", label: "7 Days" },
                  { id: "30days", label: "30 Days" },
                  { id: "90days", label: "3 Months" },
                  { id: "all", label: "All Time" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setTimeRange(opt.id as TimeRange)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      timeRange === opt.id
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
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
              value={analytics.topBrand.name}
              subValue={`${analytics.topBrand.count} posts`}
              icon={Award}
              colorClass="bg-purple-600 text-purple-600"
            />
            <KpiCard
              title="Most Used Platform"
              value={analytics.topPlatform.name}
              subValue={`${analytics.topPlatform.count} posts`}
              icon={TrendingUp}
              colorClass="bg-pink-600 text-pink-600"
            />
            <KpiCard
              title="Top Contributor"
              value={analytics.topCreator.name}
              subValue={`${analytics.topCreator.count} posts`}
              icon={Users}
              colorClass="bg-green-600 text-green-600"
            />
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Timeline Chart */}
            <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-base font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Calendar size={18} className="text-gray-400" />
                Posting Velocity
              </h3>
              <div className="h-[300px] w-full">
                {analytics.timelineData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics.timelineData}>
                      <defs>
                        <linearGradient
                          id="colorCount"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#4f46e5"
                            stopOpacity={0.1}
                          />
                          <stop
                            offset="95%"
                            stopColor="#4f46e5"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#f1f5f9"
                      />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12, fill: "#94a3b8" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) =>
                          new Date(value).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })
                        }
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: "#94a3b8" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "none",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        }}
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
                    <Activity size={32} className="mb-2 opacity-20" />
                    <span>No activity in this range</span>
                  </div>
                )}
              </div>
            </div>

            {/* Platform Donut */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-base font-bold text-gray-800 mb-6">
                Platform Share
              </h3>
              <div className="h-[300px] w-full">
                {platformData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={platformData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="count"
                      >
                        {platformData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                            strokeWidth={0}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ borderRadius: "8px", border: "none" }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                        formatter={(value) => (
                          <span className="text-xs text-gray-600 ml-1">
                            {value}
                          </span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400">
                    No data
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Brand Distribution */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-base font-bold text-gray-800 mb-6">
                Posts by Brand
              </h3>
              <div className="h-[300px] w-full">
                {analytics.brandData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analytics.brandData}
                      layout="vertical"
                      margin={{ left: 40, right: 20 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        horizontal={false}
                        stroke="#f1f5f9"
                      />
                      <XAxis type="number" hide />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={80}
                        tick={{ fontSize: 12, fill: "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: "transparent" }}
                        contentStyle={{
                          borderRadius: "8px",
                          border: "none",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        }}
                      />
                      <Bar
                        dataKey="count"
                        fill="#8b5cf6"
                        radius={[0, 4, 4, 0]}
                        barSize={24}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400">
                    No data
                  </div>
                )}
              </div>
            </div>

            {/* Additional Platform Bar Chart (for clarity on lower numbers) */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-base font-bold text-gray-800 mb-6">
                Volume by Platform
              </h3>
              <div className="h-[300px] w-full">
                {platformData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={platformData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#f1f5f9"
                      />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 10, fill: "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                        interval={0}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis hide />
                      <Tooltip
                        cursor={{ fill: "#f8fafc" }}
                        contentStyle={{
                          borderRadius: "8px",
                          border: "none",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        }}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {platformData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400">
                    No data
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

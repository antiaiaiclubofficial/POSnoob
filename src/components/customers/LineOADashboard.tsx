import React, { useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { useQuery } from '@tanstack/react-query';
import { fetchLineFollowers } from '@/lib/lineApi';
import { translations } from '@/utils/translations';
import { Users, ShieldAlert, TrendingUp, MessageCircle, BarChart3, MessageSquare, Send, Eye, MousePointerClick, Clock, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';

// Mock Data for Demographics (until Target Reach > 20)
const MOCK_GENDER_DATA = [
  { name: 'Female', value: 65, color: '#38B2AC' }, // Teal
  { name: 'Male', value: 30, color: '#4299E1' },   // Blue
  { name: 'Other', value: 5, color: '#A0AEC0' },
];

const MOCK_AGE_DATA = [
  { range: '15-19', count: 120 },
  { range: '20-24', count: 350 },
  { range: '25-29', count: 480 },
  { range: '30-34', count: 320 },
  { range: '35-39', count: 180 },
  { range: '40+', count: 90 },
];

const LineOADashboard = () => {
  const { storeId, language, customers } = useStore();
  const t = translations[language];

  const recentLineConnections = useMemo(() => {
    return [...customers]
      .filter(c => c.lineId)
      .slice(0, 5); // Take the first 5 for now
  }, [customers]);

  const { data: lineFollowers, isLoading } = useQuery({
    queryKey: ['line_followers_dashboard_full', storeId, recentLineConnections],
    queryFn: () => {
      if (!storeId) return null;
      // Pass the lineIds to verify them
      const userIdsToVerify = recentLineConnections.map(c => c.lineId as string);
      return fetchLineFollowers(storeId, userIdsToVerify);
    },
    enabled: !!storeId,
  });

  const stats = useMemo(() => {
    const followers = lineFollowers?.followers || 0;
    const targetedReaches = lineFollowers?.targetedReaches || 0;
    const blocks = lineFollowers?.blocks || 0;
    const repliesSent = lineFollowers?.repliesSent || 0;
    
    // Calculate block rate safely
    const blockRate = followers > 0 ? ((blocks / followers) * 100).toFixed(1) : '0.0';

    return { followers, targetedReaches, blocks, blockRate, repliesSent };
  }, [lineFollowers]);

  return (
    <div className="relative min-h-full overflow-hidden bg-[#F8F9FD] p-4 lg:p-6 z-0 flex flex-col">
      {/* Fluid Mesh Gradient Background */}
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-green-300/20 blur-[120px] -z-10 mix-blend-multiply pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-blue-300/20 blur-[150px] -z-10 mix-blend-multiply pointer-events-none" />

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-[#1A1F3D] flex items-center gap-3">
          <MessageCircle className="text-green-500" size={24} />
          {language === 'th' ? 'LINE OA เชิงลึก' : 'LINE OA Insights'}
        </h1>
        <p className="text-gray-500 font-medium mt-2">
          {language === 'th' ? 'วิเคราะห์ข้อมูลผู้ติดตามและประสิทธิภาพของบัญชีทางการ' : 'Analyze your followers and official account performance.'}
        </p>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Followers */}
        <div className="relative overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-white/90 to-white/50 backdrop-blur-2xl border border-white/60 p-5 shadow-[0_8px_32px_rgba(24,35,74,0.04)] group hover:shadow-[0_16px_48px_rgba(24,35,74,0.08)] transition-all">
          <div className="absolute top-0 right-0 p-5 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all">
            <Users size={48} />
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{language === 'th' ? 'เพื่อนทั้งหมด' : 'Total Followers'}</p>
          <div className="flex items-baseline gap-2">
            <h2 className="text-3xl font-black text-[#1A1F3D]">{isLoading ? '-' : stats.followers.toLocaleString()}</h2>
            <span className="text-sm font-bold text-gray-500">{language === 'th' ? 'คน' : 'users'}</span>
          </div>
        </div>

        {/* Target Reach */}
        <div className="relative overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-white/90 to-white/50 backdrop-blur-2xl border border-white/60 p-5 shadow-[0_8px_32px_rgba(24,35,74,0.04)] group hover:shadow-[0_16px_48px_rgba(24,35,74,0.08)] transition-all">
          <div className="absolute top-0 right-0 p-5 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all">
            <TrendingUp size={48} className="text-blue-500" />
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{language === 'th' ? 'ผู้ที่เข้าถึงได้ (Target Reach)' : 'Target Reach'}</p>
          <div className="flex items-baseline gap-2">
            <h2 className="text-3xl font-black text-[#1A1F3D]">{isLoading ? '-' : stats.targetedReaches.toLocaleString()}</h2>
            <span className="text-sm font-bold text-gray-500">{language === 'th' ? 'คน' : 'users'}</span>
          </div>
        </div>

        {/* Blocks */}
        <div className="relative overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-white/90 to-white/50 backdrop-blur-2xl border border-white/60 p-5 shadow-[0_8px_32px_rgba(24,35,74,0.04)] group hover:shadow-[0_16px_48px_rgba(24,35,74,0.08)] transition-all">
          <div className="absolute top-0 right-0 p-5 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all text-red-500">
            <ShieldAlert size={48} />
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{language === 'th' ? 'อัตราการบล็อก' : 'Block Rate'}</p>
          <div className="flex items-baseline gap-2">
            <h2 className="text-3xl font-black text-[#1A1F3D]">{isLoading ? '-' : `${stats.blockRate}%`}</h2>
            <span className="text-sm font-bold text-gray-500">({stats.blocks} {language === 'th' ? 'คน' : 'users'})</span>
          </div>
        </div>
      </div>

      {/* Interaction Statistics (Mock) */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-black text-[#1A1F3D] flex items-center gap-2">
          <MessageSquare className="text-purple-500" size={20} />
          {language === 'th' ? 'การโต้ตอบประจำวัน (Interaction)' : 'Daily Interactions'}
        </h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Messages Received */}
        <div className="relative overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-white/80 to-white/40 backdrop-blur-2xl border border-white/60 p-5 shadow-[0_8px_32px_rgba(24,35,74,0.04)] flex items-center justify-between opacity-70">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">{language === 'th' ? 'แชทที่ได้รับจากลูกค้า' : 'Messages Received'}</p>
            <div className="flex items-baseline gap-2">
              <h2 className="text-3xl font-black text-[#1A1F3D]">-</h2>
              <span className="text-sm font-bold text-gray-400">{language === 'th' ? 'ข้อความ' : 'messages'}</span>
            </div>
            <p className="text-[10px] text-orange-500 font-bold mt-2 flex items-center gap-1">
              <ShieldAlert size={12} /> {language === 'th' ? 'ต้องเชื่อมต่อ Webhook เพื่อดูข้อมูลนี้' : 'Webhook required for this data'}
            </p>
          </div>
          <div className="w-14 h-14 rounded-full bg-purple-100/50 flex items-center justify-center text-purple-400 shrink-0">
            <MessageSquare size={24} />
          </div>
        </div>

        {/* Replies Sent */}
        <div className="relative overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-white/80 to-white/40 backdrop-blur-2xl border border-white/60 p-5 shadow-[0_8px_32px_rgba(24,35,74,0.04)] flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">{language === 'th' ? 'การตอบกลับ (แอดมิน)' : 'Replies Sent'}</p>
            <div className="flex items-baseline gap-2">
              <h2 className="text-3xl font-black text-[#1A1F3D]">{isLoading ? '-' : stats.repliesSent.toLocaleString()}</h2>
              <span className="text-sm font-bold text-gray-400">{language === 'th' ? 'ข้อความ' : 'messages'}</span>
            </div>
            <p className="text-[10px] text-green-500 font-bold mt-2 flex items-center gap-1">
              <TrendingUp size={12} /> {language === 'th' ? 'ดึงข้อมูลจริงจาก LINE API' : 'Real data from LINE API'}
            </p>
          </div>
          <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 shrink-0">
            <Send size={24} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
        {/* Message Analytics (Broadcast) */}
        <div className="xl:col-span-2 flex flex-col">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-black text-[#1A1F3D] flex items-center gap-2">
              <TrendingUp className="text-orange-500" size={20} />
              {language === 'th' ? 'ประสิทธิภาพบรอดแคสต์ล่าสุด' : 'Latest Broadcast Analytics'}
            </h3>
          </div>
          <div className="flex-1 rounded-[1.5rem] bg-gradient-to-br from-white/90 to-white/50 backdrop-blur-3xl border border-white/80 p-6 shadow-[0_10px_40px_rgba(24,35,74,0.03)] flex flex-col justify-center">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Open Rate */}
              <div className="flex flex-col items-center justify-center">
                <div className="relative w-28 h-28 mb-4">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="56" cy="56" r="48" className="stroke-gray-100" strokeWidth="10" fill="none" />
                    <circle cx="56" cy="56" r="48" className="stroke-orange-500" strokeWidth="10" fill="none" strokeDasharray="301.59" strokeDashoffset={301.59 * (1 - 0.45)} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Eye size={20} className="text-orange-500 mb-1" />
                    <span className="text-lg font-black text-[#1A1F3D]">45%</span>
                  </div>
                </div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest text-center">{language === 'th' ? 'อัตราการเปิดอ่าน (Open Rate)' : 'Open Rate'}</p>
                <p className="text-[10px] font-semibold text-gray-400 mt-1">1,205 / 2,678 {language === 'th' ? 'ข้อความ' : 'messages'}</p>
              </div>

              {/* Click Rate */}
              <div className="flex flex-col items-center justify-center">
                <div className="relative w-28 h-28 mb-4">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="56" cy="56" r="48" className="stroke-gray-100" strokeWidth="10" fill="none" />
                    <circle cx="56" cy="56" r="48" className="stroke-[#5AD89B]" strokeWidth="10" fill="none" strokeDasharray="301.59" strokeDashoffset={301.59 * (1 - 0.12)} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <MousePointerClick size={20} className="text-[#5AD89B] mb-1" />
                    <span className="text-lg font-black text-[#1A1F3D]">12%</span>
                  </div>
                </div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest text-center">{language === 'th' ? 'อัตราการคลิกลิงก์ (Click Rate)' : 'Click Rate'}</p>
                <p className="text-[10px] font-semibold text-gray-400 mt-1">145 {language === 'th' ? 'คลิก' : 'clicks'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="xl:col-span-1 flex flex-col">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-black text-[#1A1F3D] flex items-center gap-2">
              <Clock className="text-blue-500" size={20} />
              {language === 'th' ? 'เชื่อมต่อล่าสุด' : 'Recent Connections'}
            </h3>
          </div>
          <div className="flex-1 rounded-[1.5rem] bg-gradient-to-br from-white/90 to-white/50 backdrop-blur-3xl border border-white/80 p-5 shadow-[0_10px_40px_rgba(24,35,74,0.03)] flex flex-col gap-3">
            {recentLineConnections.length > 0 ? (
              recentLineConnections.map((customer) => {
                const isValid = lineFollowers?.userStatusMap ? lineFollowers.userStatusMap[customer.lineId as string] : undefined;
                const isChecking = isLoading || isValid === undefined;

                return (
                  <div key={customer.id} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/60 transition-colors">
                    {customer.avatarUrl ? (
                      <img src={customer.avatarUrl} alt={customer.name} className="w-12 h-12 rounded-2xl object-cover shrink-0 shadow-sm" />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center font-black text-indigo-500 text-lg shrink-0">
                        {customer.name.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 overflow-hidden">
                      <p className="font-bold text-[#1A1F3D] truncate text-sm">{customer.name}</p>
                      
                      {isChecking ? (
                         <div className="flex items-center gap-1 mt-0.5 text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full w-fit">
                           <Clock size={10} className="animate-spin" />
                           {language === 'th' ? 'กำลังตรวจสอบ...' : 'Verifying...'}
                         </div>
                      ) : isValid ? (
                        <div className="flex items-center gap-1 mt-0.5 text-[10px] font-bold text-green-500 bg-green-50 px-2 py-0.5 rounded-full w-fit">
                          <UserCheck size={10} />
                          {language === 'th' ? 'เชื่อมต่อ LINE แล้ว' : 'LINE Connected'}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 mt-0.5 text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full w-fit border border-red-100">
                          <ShieldAlert size={10} />
                          {language === 'th' ? 'ไม่ได้เชื่อมต่อ Line' : 'Not connected to Line'}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 text-center opacity-50 py-10">
                <Users size={32} className="mb-2 text-gray-400" />
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                  {language === 'th' ? 'ยังไม่มีลูกค้าที่เชื่อมต่อ LINE' : 'No LINE connected customers'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Demographics Area (Mock Data Notice) */}
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-xl font-black text-[#1A1F3D] flex items-center gap-2">
          <BarChart3 className="text-indigo-500" size={24} />
          {language === 'th' ? 'ข้อมูลประชากรศาสตร์ (Demographics)' : 'Demographics'}
        </h3>
      </div>

      <div className="relative flex-1">
        {/* Overlay Warning */}
        <div className="absolute -inset-4 z-10 flex items-center justify-center bg-white/10 backdrop-blur-[8px] rounded-[3rem]">
          <div className="bg-white/95 text-[#1A1F3D] px-6 py-4 rounded-2xl border border-white/60 text-sm font-bold flex items-center gap-3 shadow-[0_20px_40px_rgba(24,35,74,0.1)] max-w-lg text-left leading-relaxed">
            <ShieldAlert size={24} className="shrink-0 text-yellow-500" /> 
            {language === 'th' 
              ? 'ต้องมีผู้ที่เข้าถึงได้ (Target Reach) มากกว่า 20 คน จึงจะแสดงข้อมูลประชากรศาสตร์จริงได้ (ข้อมูลด้านหลังเป็นข้อมูลจำลอง)' 
              : 'Target Reach > 20 required for real demographics (Currently showing mock data)'}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 opacity-40 select-none pointer-events-none">
        {/* Gender Donut */}
        <div className="rounded-[2.5rem] bg-gradient-to-br from-white/80 to-white/40 backdrop-blur-3xl border border-white/80 p-8 shadow-[0_10px_40px_rgba(24,35,74,0.03)] flex flex-col">
          <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-6 text-center">
            {language === 'th' ? 'สัดส่วนเพศ' : 'Gender Distribution'}
          </h4>
          <div className="flex-1 min-h-[250px] relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Pie
                  data={MOCK_GENDER_DATA}
                  innerRadius="60%"
                  outerRadius="90%"
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                  cornerRadius={10}
                >
                  {MOCK_GENDER_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-black text-[#1A1F3D]">65%</span>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{language === 'th' ? 'ผู้หญิง' : 'Female'}</span>
            </div>
          </div>
          {/* Legend */}
          <div className="flex justify-center gap-6 mt-4">
            {MOCK_GENDER_DATA.map((entry, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-xs font-bold text-gray-600">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Age Bar Chart */}
        <div className="rounded-[2.5rem] bg-gradient-to-br from-white/80 to-white/40 backdrop-blur-3xl border border-white/80 p-8 shadow-[0_10px_40px_rgba(24,35,74,0.03)] flex flex-col">
          <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-6 text-center">
            {language === 'th' ? 'ช่วงอายุ' : 'Age Distribution'}
          </h4>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_AGE_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis 
                  dataKey="range" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#A0AEC0', fontWeight: 'bold' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#A0AEC0', fontWeight: 'bold' }} 
                />
                <Tooltip
                  cursor={{ fill: 'rgba(24,35,74,0.02)' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="count" fill="#1A1F3D" radius={[6, 6, 6, 6]} barSize={32}>
                  {MOCK_AGE_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 2 ? '#5AD89B' : '#E2E8F0'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default LineOADashboard;

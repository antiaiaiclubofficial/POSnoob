"use client";

import React from 'react';
import { History, Search, Info, CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const Logs = () => {
  const { logs } = useStore();
  const [query, setQuery] = React.useState('');

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(query.toLowerCase()) || 
    log.staffName.toLowerCase().includes(query.toLowerCase()) ||
    log.details.toLowerCase().includes(query.toLowerCase())
  );

  const getLogIcon = (type: string) => {
    switch(type) {
      case 'success': return <CheckCircle2 className="text-green-500" size={18} />;
      case 'warning': return <AlertTriangle className="text-amber-500" size={18} />;
      case 'danger': return <XCircle className="text-red-500" size={18} />;
      default: return <Info className="text-blue-500" size={18} />;
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <header className="px-10 py-10 shrink-0 border-b border-gray-100 bg-white">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-black mb-1">Activity Logs</h1>
            <p className="text-gray-400 font-medium text-sm">System audit trail and operation history</p>
          </div>
          <div className="relative w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
            <input 
              className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-12 pr-6 py-3 text-xs font-bold"
              placeholder="Filter logs..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-10 scrollbar-hide">
        <div className="max-w-4xl mx-auto space-y-4">
          {filteredLogs.map((log) => (
            <div key={log.id} className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm flex items-start gap-5 group hover:shadow-md transition-all">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                log.type === 'success' ? "bg-green-50" : 
                log.type === 'warning' ? "bg-amber-50" : 
                log.type === 'danger' ? "bg-red-50" : "bg-blue-50"
              )}>
                {getLogIcon(log.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-black text-sm text-[#1A1F3D]">{log.action}</h3>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-300">
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      {format(new Date(log.timestamp), 'PPpp')}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 font-medium leading-relaxed mb-3">{log.details}</p>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-[#1A1F3D] rounded-lg flex items-center justify-center text-[8px] font-black text-white">
                    {log.staffName.charAt(0)}
                  </div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{log.staffName}</span>
                </div>
              </div>
            </div>
          ))}

          {filteredLogs.length === 0 && (
            <div className="py-20 text-center opacity-30">
              <History size={48} className="mx-auto mb-4" />
              <p className="font-black">No activities recorded yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Logs;
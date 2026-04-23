"use client";

import React, { useState } from 'react';
import { 
  Send, MessageSquare, Phone, Users, History, Sparkles, 
  CheckCircle2, AlertCircle, Info, Zap, Smartphone, Layout
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const Marketing = () => {
  const { customers, sendBroadcast, broadcastLogs, liffId, smsApiKey } = useStore();
  const [message, setMessage] = useState('');
  const [channel, setChannel] = useState<'LINE' | 'SMS' | 'Both'>('LINE');
  const [target, setTarget] = useState<'All' | 'VIP' | 'Gold'>('All');
  const [isSending, setIsSending] = useState(false);

  const handleSend = () => {
    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }
    
    if (channel === 'LINE' && !liffId) {
      toast.error("Please configure LINE LIFF in Settings first");
      return;
    }

    if (channel === 'SMS' && !smsApiKey) {
      toast.error("Please configure SMS API Key in Settings first");
      return;
    }

    setIsSending(true);
    
    // Simulate API Call
    setTimeout(() => {
      sendBroadcast({
        channel,
        target: target === 'All' ? 'All Customers' : `${target} Members`,
        message
      });
      setIsSending(false);
      setMessage('');
      toast.success(`Broadcast sent successfully via ${channel}!`);
    }, 1500);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <header className="px-10 py-10 shrink-0">
        <div className="pl-14 lg:pl-0">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={14} className="text-[#D9ED5F]" />
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">Marketing Engine</p>
          </div>
          <h1 className="text-3xl font-black text-[#1A1F3D]">Campaign Center</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-10 pb-10 scrollbar-hide">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Broadcast Composer */}
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-sm space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#F5F6FA] rounded-2xl flex items-center justify-center text-[#1A1F3D]">
                  <Send size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold">New Broadcast</h2>
                  <p className="text-xs text-gray-400">Reach your customers instantly</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-3 block tracking-widest px-2">Choose Channel</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button 
                      onClick={() => setChannel('LINE')}
                      className={cn(
                        "flex flex-col items-center gap-2 py-4 rounded-3xl border-2 transition-all",
                        channel === 'LINE' ? "bg-[#06C755] border-[#06C755] text-white shadow-lg" : "bg-white border-gray-50 text-gray-400 hover:border-gray-100"
                      )}
                    >
                      <MessageSquare size={20} />
                      <span className="text-[10px] font-black uppercase">LINE</span>
                    </button>
                    <button 
                      onClick={() => setChannel('SMS')}
                      className={cn(
                        "flex flex-col items-center gap-2 py-4 rounded-3xl border-2 transition-all",
                        channel === 'SMS' ? "bg-[#1A1F3D] border-[#1A1F3D] text-[#D9ED5F] shadow-lg" : "bg-white border-gray-50 text-gray-400 hover:border-gray-100"
                      )}
                    >
                      <Smartphone size={20} />
                      <span className="text-[10px] font-black uppercase">SMS</span>
                    </button>
                    <button 
                      onClick={() => setChannel('Both')}
                      className={cn(
                        "flex flex-col items-center gap-2 py-4 rounded-3xl border-2 transition-all",
                        channel === 'Both' ? "bg-blue-600 border-blue-600 text-white shadow-lg" : "bg-white border-gray-50 text-gray-400 hover:border-gray-100"
                      )}
                    >
                      <Zap size={20} />
                      <span className="text-[10px] font-black uppercase">Both</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-3 block tracking-widest px-2">Target Audience</label>
                  <div className="flex gap-2">
                    {['All', 'Gold', 'VIP'].map((t) => (
                      <button
                        key={t}
                        onClick={() => setTarget(t as any)}
                        className={cn(
                          "px-6 py-3 rounded-2xl text-[10px] font-black transition-all border",
                          target === t ? "bg-gray-100 border-gray-200 text-[#1A1F3D]" : "bg-transparent border-gray-100 text-gray-400"
                        )}
                      >
                        {t === 'All' ? 'EVERYONE' : `${t} MEMBERS`}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-3 block tracking-widest px-2">Message Content</label>
                  <textarea 
                    className="w-full bg-[#F5F6FA] border-none rounded-[32px] p-8 h-48 text-sm font-bold resize-none focus:ring-2 focus:ring-[#1A1F3D]/5"
                    placeholder="Hello fuzzy friends! We have a special discount for you..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                  <div className="mt-2 flex justify-end">
                    <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{message.length} Characters</span>
                  </div>
                </div>

                <button 
                  onClick={handleSend}
                  disabled={isSending}
                  className="w-full bg-[#1A1F3D] text-white py-6 rounded-[32px] font-black text-sm flex items-center justify-center gap-3 shadow-xl shadow-[#1A1F3D]/10 hover:bg-[#2A3152] transition-all disabled:opacity-50"
                >
                  {isSending ? "Dispatching Message..." : <>Blast Broadcast <Send size={18} /></>}
                </button>
              </div>
            </section>

            <section className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <History size={20} className="text-gray-400" />
                <h3 className="text-lg font-black text-[#1A1F3D]">Broadcast History</h3>
              </div>

              <div className="space-y-4">
                {broadcastLogs.map((log) => (
                  <div key={log.id} className="p-6 bg-[#F8F9FD] rounded-[28px] border border-gray-50 flex items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center text-white",
                        log.channel === 'LINE' ? "bg-[#06C755]" : log.channel === 'SMS' ? "bg-[#1A1F3D]" : "bg-blue-600"
                      )}>
                        {log.channel === 'LINE' ? <MessageSquare size={16}/> : <Smartphone size={16}/>}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-[#1A1F3D] truncate">{log.message}</p>
                        <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">{log.target} • {format(new Date(log.timestamp), 'PPp')}</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-black text-green-500 bg-green-50 px-3 py-1 rounded-full uppercase">Success</span>
                  </div>
                ))}
                {broadcastLogs.length === 0 && (
                  <div className="py-10 text-center opacity-30">
                    <History size={32} className="mx-auto mb-2" />
                    <p className="text-[10px] font-black uppercase tracking-widest">No history yet</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Right Sidebar: Tips & Integration Status */}
          <div className="space-y-8">
             <div className="bg-[#1A1F3D] p-8 rounded-[48px] text-white shadow-xl relative overflow-hidden">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full" />
                <Layout size={32} className="text-[#D9ED5F] mb-6" />
                <h3 className="text-xl font-black mb-2">Omnichannel</h3>
                <p className="text-xs text-white/60 font-medium leading-relaxed mb-6">
                  Automatically notify customers when their grooming session starts or is finished.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-[10px] font-bold">
                    <div className={cn("w-2 h-2 rounded-full", liffId ? "bg-green-400" : "bg-red-400")} />
                    LINE LIFF: {liffId ? 'Connected' : 'Disconnected'}
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-bold">
                    <div className={cn("w-2 h-2 rounded-full", smsApiKey ? "bg-green-400" : "bg-red-400")} />
                    SMS API: {smsApiKey ? 'Connected' : 'Disconnected'}
                  </div>
                </div>
             </div>

             <div className="bg-white p-8 rounded-[48px] border border-gray-100 shadow-sm">
                <h4 className="text-sm font-black text-[#1A1F3D] mb-4 uppercase tracking-widest flex items-center gap-2">
                  <Info size={16} className="text-blue-500" /> Sending Tips
                </h4>
                <ul className="space-y-4">
                  <li className="flex gap-3">
                    <div className="w-5 h-5 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500 shrink-0"><CheckCircle2 size={12}/></div>
                    <p className="text-[10px] text-gray-500 font-medium">Personalize messages using [customer_name] tag.</p>
                  </li>
                  <li className="flex gap-3">
                    <div className="w-5 h-5 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500 shrink-0"><CheckCircle2 size={12}/></div>
                    <p className="text-[10px] text-gray-500 font-medium">Keep SMS short (160 characters) to avoid extra costs.</p>
                  </li>
                  <li className="flex gap-3">
                    <div className="w-5 h-5 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500 shrink-0"><CheckCircle2 size={12}/></div>
                    <p className="text-[10px] text-gray-500 font-medium">Schedule broadcasts during active store hours for better engagement.</p>
                  </li>
                </ul>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Marketing;
"use client";

import React, { useState } from 'react';
import { X, Send, MessageSquare, Phone, Users, ShieldCheck, Smartphone, CheckCircle2 } from 'lucide-react';
import { useStore, MembershipLevel } from '@/store/useStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { sendNotification, MessageChannel } from '@/utils/messaging';

interface BroadcastModalProps {
  onClose: () => void;
}

const BroadcastModal = ({ onClose }: BroadcastModalProps) => {
  const { customers } = useStore();
  const [message, setMessage] = useState('');
  const [channel, setChannel] = useState<MessageChannel>('Both');
  const [targetTier, setTargetTier] = useState<'All' | MembershipLevel>('All');
  const [isSending, setIsSending] = useState(false);

  const targetCustomers = customers.filter(c => targetTier === 'All' || c.membership === targetTier);

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error("Please enter a message to broadcast");
      return;
    }

    if (targetCustomers.length === 0) {
      toast.error("No customers found for the selected target group");
      return;
    }

    setIsSending(true);
    
    try {
      // จำลองการส่งข้อความทีละคน
      for (const customer of targetCustomers) {
        await sendNotification({
          to: customer.phone,
          message,
          channel
        });
      }
      
      toast.success(`Broadcast sent successfully to ${targetCustomers.length} recipients!`);
      onClose();
    } catch (error) {
      toast.error("Failed to send broadcast");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#1A1F3D]/60 backdrop-blur-md z-[120] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-4xl rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col md:flex-row max-h-[90vh]">
        
        {/* Left Side: Configuration */}
        <div className="flex-1 p-10 space-y-8 overflow-y-auto scrollbar-hide">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-black text-[#1A1F3D]">Broadcast Center</h2>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Connect with your community</p>
            </div>
            <button onClick={onClose} className="md:hidden p-2 hover:bg-gray-50 rounded-xl">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Delivery Channel</label>
              <div className="flex gap-2">
                {(['LINE', 'SMS', 'Both'] as MessageChannel[]).map((ch) => (
                  <button
                    key={ch}
                    onClick={() => setChannel(ch)}
                    className={cn(
                      "flex-1 py-4 rounded-2xl border-2 font-black text-[10px] uppercase transition-all flex items-center justify-center gap-2",
                      channel === ch ? "bg-[#1A1F3D] border-[#1A1F3D] text-[#D9ED5F] shadow-lg" : "bg-white border-gray-100 text-gray-400"
                    )}
                  >
                    {ch === 'LINE' && <MessageSquare size={14} />}
                    {ch === 'SMS' && <Smartphone size={14} />}
                    {ch === 'Both' && <Users size={14} />}
                    {ch}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Target Audience</label>
              <div className="grid grid-cols-2 gap-2">
                {(['All', 'Standard', 'Silver', 'Gold', 'VIP'] as const).map((tier) => (
                  <button
                    key={tier}
                    onClick={() => setTargetTier(tier)}
                    className={cn(
                      "py-3 rounded-xl border-2 text-[10px] font-black transition-all",
                      targetTier === tier ? "bg-purple-50 border-purple-200 text-purple-600" : "bg-white border-gray-50 text-gray-400"
                    )}
                  >
                    {tier} {tier === 'All' ? 'Customers' : 'Members'}
                  </button>
                ))}
              </div>
              <p className="text-[9px] text-gray-400 font-medium italic px-2">
                * Selected audience: {targetCustomers.length} recipients
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Message Content</label>
              <textarea 
                className="w-full bg-[#F5F6FA] border-none rounded-[28px] p-6 text-sm font-medium h-40 resize-none focus:ring-4 focus:ring-blue-500/5 transition-all"
                placeholder="Type your promotion or announcement here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
          </div>

          <button 
            onClick={handleSend}
            disabled={isSending || !message.trim()}
            className="w-full bg-[#1A1F3D] hover:bg-[#2A3152] disabled:bg-gray-100 disabled:text-gray-300 text-white font-black py-5 rounded-[28px] flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95"
          >
            {isSending ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <><Send size={18} /> Send Broadcast Now</>
            )}
          </button>
        </div>

        {/* Right Side: Visual Preview */}
        <div className="w-full md:w-[380px] bg-[#F8F9FD] p-10 flex flex-col items-center justify-center border-l border-gray-50">
          <div className="hidden md:block absolute top-10 right-10">
             <button onClick={onClose} className="p-3 hover:bg-white rounded-2xl transition-all shadow-sm">
                <X size={20} className="text-gray-400" />
             </button>
          </div>

          <div className="w-full max-w-[280px] space-y-6">
            <div className="text-center">
              <ShieldCheck className="mx-auto text-green-500 mb-2" size={32} />
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Visual Preview</p>
            </div>

            {/* Smartphone Mockup */}
            <div className="bg-[#1A1F3D] p-3 rounded-[40px] shadow-2xl aspect-[9/18] relative overflow-hidden border-[6px] border-[#2A3152]">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-[#2A3152] rounded-b-2xl z-10" />
              
              <div className="h-full bg-white rounded-[32px] p-4 flex flex-col pt-8">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <MessageSquare size={10} className="text-white" />
                  </div>
                  <span className="text-[8px] font-black uppercase text-gray-400">Tactile Sanctuary</span>
                </div>

                <div className={cn(
                  "bg-[#F5F6FA] p-3 rounded-2xl rounded-tl-none max-w-[90%] transition-all",
                  !message && "opacity-20 italic"
                )}>
                  <p className="text-[9px] font-medium leading-relaxed text-[#1A1F3D]">
                    {message || "Your message will appear here..."}
                  </p>
                  <span className="text-[7px] text-gray-300 font-bold mt-1 block">12:45 PM</span>
                </div>

                {channel === 'LINE' && (
                  <div className="mt-auto bg-green-500/10 border border-green-500/20 p-2 rounded-xl flex items-center gap-2">
                    <CheckCircle2 size={10} className="text-green-500" />
                    <span className="text-[7px] font-black text-green-600 uppercase">LINE Optimized</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BroadcastModal;
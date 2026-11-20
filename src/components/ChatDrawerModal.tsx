import React, { useState } from 'react';
import { useAgri } from '../context/AgriContext';
import { formatDateTimeVN } from '../utils/formatters';
import { X, Send, MapPin, User, CheckCircle, Image as ImageIcon } from 'lucide-react';

export const ChatDrawerModal: React.FC = () => {
  const {
    selectedChatTxnId,
    setSelectedChatTxnId,
    chatMessages,
    sendChatMessage,
    transactions,
    currentUser
  } = useAgri();

  const [inputVal, setInputVal] = useState('');

  if (!selectedChatTxnId) return null;

  const currentTxn = transactions.find(t => t.id === selectedChatTxnId);
  const messages = chatMessages.filter(m => m.contractId === selectedChatTxnId);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    sendChatMessage(selectedChatTxnId, inputVal.trim());
    setInputVal('');
  };

  const sendQuickMsg = (txt: string) => {
    sendChatMessage(selectedChatTxnId, txt);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full h-[85vh] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-4 bg-emerald-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg">
              💬
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight">
                {currentTxn?.serviceName || 'Trao đổi hợp đồng'}
              </h3>
              <p className="text-xs text-emerald-100 font-mono">
                Mã HĐ: {currentTxn?.contractCode || selectedChatTxnId}
              </p>
            </div>
          </div>

          <button
            onClick={() => setSelectedChatTxnId(null)}
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contract summary strip */}
        {currentTxn && (
          <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-100 dark:border-emerald-800 text-[11px] text-emerald-900 dark:text-emerald-200 flex items-center justify-between shrink-0">
            <span>Đối tác: <strong>{currentUser.id === currentTxn.farmerId ? currentTxn.providerName : currentTxn.farmerName}</strong></span>
            <span>Khối lượng: {currentTxn.areaVolume} {currentTxn.unit}</span>
          </div>
        )}

        {/* Messages feed */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {messages.length === 0 ? (
            <div className="text-center text-xs text-slate-400 py-10">
              Chưa có tin nhắn nào. Hãy gửi lời chào và xác nhận thời gian làm việc!
            </div>
          ) : (
            messages.map((m) => {
              const isMe = m.senderId === currentUser.id;
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <span className="text-[10px] text-slate-400 mb-0.5 px-1">
                    {m.senderName} ({m.senderRole === 'farmer' ? 'Nông dân' : 'Chủ máy'})
                  </span>
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed ${
                      isMe
                        ? 'bg-emerald-700 text-white rounded-br-none shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-none'
                    }`}
                  >
                    {m.text}
                  </div>
                  <span className="text-[9px] text-slate-400 mt-1 px-1">
                    {formatDateTimeVN(m.timestamp)}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Quick template messages */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex gap-2 overflow-x-auto text-[11px] whitespace-nowrap">
          <button
            onClick={() => sendQuickMsg('Máy và đội bay đã chuẩn bị xong, sẵn sàng xuất phát!')}
            className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-emerald-500 text-slate-700 dark:text-slate-200"
          >
            Đã sẵn sàng máy 🚜
          </button>
          <button
            onClick={() => sendQuickMsg('Ruộng đã rút nước ráo, mời anh đưa máy vào nhé!')}
            className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-emerald-500 text-slate-700 dark:text-slate-200"
          >
            Ruộng đã rút ráo 🌾
          </button>
          <button
            onClick={() => sendQuickMsg('Tôi gửi tọa độ cống nước qua định vị nhé!')}
            className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-emerald-500 text-slate-700 dark:text-slate-200"
          >
            Gửi tọa độ 📍
          </button>
        </div>

        {/* Input form */}
        <form onSubmit={handleSend} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 shrink-0">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Nhập tin nhắn..."
            className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-white"
          />
          <button
            type="submit"
            className="p-2.5 rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 transition-colors shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

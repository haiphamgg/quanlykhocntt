
import React, { useState, useMemo } from 'react';
import { Search, Ticket, ChevronRight, Inbox } from 'lucide-react';

interface TicketSelectorProps {
  tickets: string[];
  selectedTicket: string;
  onSelect: (ticket: string) => void;
}

export const TicketSelector: React.FC<TicketSelectorProps> = ({ tickets, selectedTicket, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => 
      t.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tickets, searchTerm]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-[400px] overflow-hidden">
       {/* Header */}
       <div className="p-4 border-b border-slate-50 bg-slate-50/50">
          <div className="flex items-center gap-2 text-slate-800 mb-3">
             <Ticket className="w-5 h-5 text-indigo-500" />
             <h2 className="font-bold text-sm">Danh Sách Phiếu</h2>
             <span className="ml-auto text-xs font-medium text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-100 shadow-sm">
                {tickets.length}
             </span>
          </div>

          <div className="relative group">
            <input
              type="text"
              placeholder="Tìm số phiếu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm transition-all shadow-sm group-hover:border-slate-300"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 group-focus-within:text-indigo-500 transition-colors" />
          </div>
       </div>

       {/* Custom List */}
       <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar bg-slate-50/30">
          {tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
              <div className="p-3 bg-slate-50 rounded-full">
                 <Inbox className="w-6 h-6 opacity-30" />
              </div>
              <p className="text-xs font-medium">Chưa có dữ liệu</p>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs italic">
               Không tìm thấy "{searchTerm}"
            </div>
          ) : (
             filteredTickets.map((ticket) => {
                const isSelected = selectedTicket === ticket;
                return (
                  <button
                    key={ticket}
                    onClick={() => onSelect(ticket)}
                    className={`
                      w-full text-left px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-between group
                      ${isSelected 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 ring-1 ring-indigo-500' 
                        : 'bg-white text-slate-600 hover:bg-white hover:text-indigo-600 hover:shadow-md border border-transparent hover:border-indigo-100'
                      }
                    `}
                  >
                    <span className={`truncate font-mono ${isSelected ? 'font-bold' : ''}`}>{ticket}</span>
                    {isSelected && <ChevronRight className="w-4 h-4 animate-in slide-in-from-left-2" />}
                  </button>
                )
             })
          )}
       </div>
    </div>
  );
};

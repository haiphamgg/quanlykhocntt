
import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle2, Database, Edit2, Lock, CloudCog } from 'lucide-react';

interface DataInputProps {
  onReload: (id?: string) => void;
  isLoading: boolean;
  lastUpdated: Date | null;
  rowCount: number;
  currentSheetId: string;
  isAdmin: boolean;
}

export const DataInput: React.FC<DataInputProps> = ({ onReload, isLoading, lastUpdated, rowCount, currentSheetId, isAdmin }) => {
  const [tempId, setTempId] = useState(currentSheetId);
  const [showInput, setShowInput] = useState(false);

  useEffect(() => {
    setTempId(currentSheetId);
  }, [currentSheetId]);

  const handleUpdate = () => {
    if (tempId.trim()) {
        onReload(tempId.trim());
        setShowInput(false);
    }
  };

  const handleEditClick = () => {
    if (isAdmin) {
      setShowInput(true);
    }
  };

  const displayId = isAdmin 
    ? currentSheetId 
    : `${currentSheetId.substring(0, 6)}...${currentSheetId.substring(currentSheetId.length - 6)}`;

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 text-slate-800">
          <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
             <Database className="w-5 h-5" />
          </div>
          <div>
             <h2 className="font-bold text-sm leading-tight">Nguồn Dữ Liệu</h2>
             <p className="text-[10px] text-slate-400 font-medium">Google Sheets</p>
          </div>
        </div>
        {rowCount > 0 ? (
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
            <CheckCircle2 className="w-3 h-3" /> {rowCount} dòng
          </span>
        ) : (
           <span className="text-[10px] font-bold text-red-500 bg-red-50 border border-red-100 px-2.5 py-1 rounded-full flex items-center gap-1">
             <CloudCog className="w-3 h-3" />
             {isLoading ? 'Đang tải...' : 'Chờ dữ liệu'}
           </span>
        )}
      </div>
      
      <div className="flex flex-col gap-3">
        {showInput ? (
            <div className="bg-slate-50 p-3 rounded-xl border border-blue-200 animate-in zoom-in-95 duration-200">
                <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1.5 block">Sheet ID</label>
                <input 
                    type="text" 
                    value={tempId}
                    onChange={(e) => setTempId(e.target.value)}
                    placeholder="Nhập ID sheet..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono bg-white shadow-sm"
                    autoFocus
                />
                <div className="flex justify-end mt-2 gap-2">
                    <button onClick={() => setShowInput(false)} className="text-xs text-slate-600 hover:bg-slate-200 px-3 py-1.5 rounded-lg font-medium transition-colors">Hủy</button>
                    <button onClick={handleUpdate} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 font-medium shadow-md shadow-blue-500/20 transition-all">Lưu & Tải</button>
                </div>
            </div>
        ) : (
            <div 
              className={`relative overflow-hidden flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100 group transition-all ${isAdmin ? 'cursor-pointer hover:bg-white hover:border-blue-200 hover:shadow-md' : 'cursor-default'}`} 
              onClick={handleEditClick} 
              title={isAdmin ? "Nhấn để sửa ID" : "Chỉ Admin mới có thể thay đổi nguồn dữ liệu"}
            >
                <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Kết nối hiện tại</p>
                    <p className="text-xs text-slate-600 font-mono truncate font-medium">{displayId}</p>
                </div>
                <div className="p-1.5 rounded-md bg-white border border-slate-100 shadow-sm text-slate-400 group-hover:text-blue-500 group-hover:border-blue-100 transition-colors">
                    {isAdmin ? <Edit2 className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                </div>
            </div>
        )}

        <div className="flex items-center justify-between px-1">
           <div className="flex items-center gap-1.5">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
               <span className="text-[10px] font-semibold text-slate-400 uppercase">Sheet: DULIEU</span>
           </div>
           <span className="text-[10px] font-mono text-slate-400">{lastUpdated ? lastUpdated.toLocaleTimeString() : '--:--'}</span>
        </div>

        <button
          onClick={() => onReload(currentSheetId)}
          disabled={isLoading}
          className={`
            flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm
            ${isLoading 
              ? 'bg-slate-100 text-slate-400 cursor-wait' 
              : 'bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 hover:border-blue-300 hover:shadow-md active:scale-[0.98]'
            }
          `}
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Đang đồng bộ...' : 'Cập nhật dữ liệu'}
        </button>
      </div>
    </div>
  );
};

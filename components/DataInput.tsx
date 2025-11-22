
import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, Database, Settings, Edit2 } from 'lucide-react';

interface DataInputProps {
  onReload: (id?: string) => void;
  isLoading: boolean;
  lastUpdated: Date | null;
  rowCount: number;
  currentSheetId: string;
}

export const DataInput: React.FC<DataInputProps> = ({ onReload, isLoading, lastUpdated, rowCount, currentSheetId }) => {
  const [tempId, setTempId] = useState(currentSheetId);
  const [showInput, setShowInput] = useState(false);

  // Sync khi prop thay đổi
  useEffect(() => {
    setTempId(currentSheetId);
  }, [currentSheetId]);

  const handleUpdate = () => {
    if (tempId.trim()) {
        onReload(tempId.trim());
        setShowInput(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-slate-700">
          <Database className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-sm">Dữ Liệu Nguồn</h2>
        </div>
        {rowCount > 0 ? (
          <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> {rowCount} dòng
          </span>
        ) : (
           <span className="text-xs font-medium text-red-500 bg-red-50 px-2 py-1 rounded-full">
             {isLoading ? '...' : 'Chưa có dữ liệu'}
           </span>
        )}
      </div>
      
      <div className="flex flex-col gap-3">
        {showInput ? (
            <div className="mb-2">
                <label className="text-xs text-slate-500 font-semibold mb-1 block">Google Sheet ID:</label>
                <input 
                    type="text" 
                    value={tempId}
                    onChange={(e) => setTempId(e.target.value)}
                    placeholder="Nhập ID sheet..."
                    className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:border-blue-500 outline-none font-mono"
                />
                <div className="flex justify-end mt-1 gap-1">
                    <button onClick={() => setShowInput(false)} className="text-xs text-slate-500 hover:bg-slate-100 px-2 py-1 rounded">Hủy</button>
                    <button onClick={handleUpdate} className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">OK</button>
                </div>
            </div>
        ) : (
            <div className="flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-100 mb-1 group cursor-pointer" onClick={() => setShowInput(true)} title="Nhấn để sửa ID">
                <div className="overflow-hidden">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Kết nối đến Sheet:</p>
                    <p className="text-xs text-slate-600 font-mono truncate max-w-[180px]">{currentSheetId}</p>
                </div>
                <Edit2 className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100" />
            </div>
        )}

        <div className="text-xs text-slate-500 flex justify-between items-center">
           <span className="font-mono bg-slate-100 px-1 rounded">Sheet: DULIEU</span>
           <span>{lastUpdated ? lastUpdated.toLocaleTimeString() : '--:--'}</span>
        </div>

        <button
          onClick={() => onReload(currentSheetId)}
          disabled={isLoading}
          className={`
            flex items-center justify-center gap-2 w-full py-2 rounded-lg text-sm font-medium transition-all
            ${isLoading 
              ? 'bg-slate-100 text-slate-400 cursor-wait' 
              : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200'
            }
          `}
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Đang tải...' : 'Cập nhật dữ liệu'}
        </button>
      </div>
    </div>
  );
};

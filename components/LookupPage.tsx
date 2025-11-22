
import React, { useState, useMemo } from 'react';
import { Search, Package, Calendar, Tag, FileText, ExternalLink, RefreshCw, Box } from 'lucide-react';
import { DeviceRow } from '../types';

interface LookupPageProps {
  data: DeviceRow[];
  onReload: () => void;
  isLoading: boolean;
  lastUpdated: Date | null;
}

export const LookupPage: React.FC<LookupPageProps> = ({ data, onReload, isLoading, lastUpdated }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    const lowerTerm = searchTerm.toLowerCase();
    return data.filter(row => 
      row.ticketNumber.toLowerCase().includes(lowerTerm) ||
      row.deviceName.toLowerCase().includes(lowerTerm) ||
      row.modelSerial.toLowerCase().includes(lowerTerm) ||
      row.department.toLowerCase().includes(lowerTerm)
    );
  }, [data, searchTerm]);

  const displayData = filteredData.slice(0, 100);

  return (
    <div className="h-full flex flex-col bg-slate-50 p-4 md:p-6 overflow-hidden">
      {/* Search Header */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 mb-4 shrink-0">
        <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
              <Package className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-slate-800">Tra cứu thiết bị</h2>
                <button
                  onClick={onReload}
                  disabled={isLoading}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-all active:scale-95 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
                </button>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">
                {data.length} dòng dữ liệu • Cập nhật: {lastUpdated ? lastUpdated.toLocaleTimeString() : '--:--'}
              </p>
            </div>
          </div>
          
          <div className="relative w-full md:w-96 group">
            <input
              type="text"
              placeholder="Tìm tên, model, số phiếu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white focus:outline-none transition-all shadow-sm"
            />
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5 group-focus-within:text-indigo-500 transition-colors" />
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="overflow-auto flex-1">
          <table className="w-full text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 sticky top-0 z-10 backdrop-blur-sm">
              <tr>
                <th className="px-6 py-4 font-bold border-b border-slate-200 w-[15%]">Số Phiếu (E)</th>
                <th className="px-6 py-4 font-bold border-b border-slate-200 w-[30%]">Thiết Bị (B)</th>
                <th className="px-6 py-4 font-bold border-b border-slate-200 w-[20%]">Model (M)</th>
                <th className="px-6 py-4 font-bold border-b border-slate-200 w-[20%]">Bộ Phận (D)</th>
                <th className="px-6 py-4 font-bold border-b border-slate-200 w-[15%] text-right">Mã QR (S)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayData.length > 0 ? (
                displayData.map((row) => (
                  <tr key={row.rowId} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="px-6 py-4 align-top">
                       <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-50 text-blue-700 font-bold text-sm border border-blue-100">
                          <FileText className="w-4 h-4" />
                          {row.ticketNumber}
                        </span>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <div className="font-bold text-slate-800 text-base mb-1">
                        {row.deviceName}
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top">
                      {row.modelSerial ? (
                        <div className="font-mono text-sm text-slate-600">
                          {row.modelSerial}
                        </div>
                      ) : (
                        <span className="text-slate-300 text-sm italic">--</span>
                      )}
                    </td>
                    <td className="px-6 py-4 align-top">
                       <div className="text-slate-700 text-sm">
                          {row.department || '--'}
                       </div>
                    </td>
                    <td className="px-6 py-4 align-top text-right">
                       {row.qrContent && row.qrContent.startsWith('http') ? (
                         <img src={row.qrContent} alt="QR" className="w-8 h-8 object-contain ml-auto border border-slate-200 rounded" />
                       ) : (
                         <span className="text-xs font-mono text-slate-400 truncate max-w-[100px] inline-block" title={row.qrContent}>
                           {row.qrContent}
                         </span>
                       )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <div className="bg-slate-50 p-4 rounded-full mb-3">
                        <Box className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="font-medium text-slate-500">Không tìm thấy dữ liệu</p>
                      <p className="text-sm mt-1">Vui lòng kiểm tra Sheet ID và tên Sheet "DULIEU"</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
          <span>Hiển thị {displayData.length} / {filteredData.length} kết quả</span>
        </div>
      </div>
    </div>
  );
};

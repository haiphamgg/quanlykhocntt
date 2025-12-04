
import React, { useMemo, useState } from 'react';
import { DeviceRow } from '../types';
import { ArrowDownCircle, ArrowUpCircle, Box, Search, Download, Archive, AlertCircle, CheckCircle2, History, X, ChevronRight, ChevronDown, DollarSign } from 'lucide-react';
import Papa from 'papaparse';
import { DeviceDetailModal } from './DeviceDetailModal';

interface InventoryReportProps {
  data: DeviceRow[];
  isLoading: boolean;
}

interface InventoryItem {
  id: string;
  deviceName: string;
  details: Set<string>; 
  models: Set<string>;
  importCount: number;
  exportCount: number;
  stock: number;
  importMoney: number;
  exportMoney: number;
  stockMoney: number;
  history: DeviceRow[]; 
}

// Helper: Format Date dd/mm/yyyy handling Google Sheets format
const formatDate = (input: string): string => {
  if (!input) return '';
  try {
    if (input.includes('Date(')) {
        const parts = input.match(/\d+/g);
        if (parts && parts.length >= 3) {
            const d = new Date(Number(parts[0]), Number(parts[1]), Number(parts[2]));
            return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
        }
    }
    const d = new Date(input);
    if (isNaN(d.getTime())) return input; 
    
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  } catch {
    return input;
  }
};

// Helper: Format Currency
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount);
};

// Helper: Parse Number from Sheet
const parseSheetNumber = (raw: string | undefined): number => {
    if (!raw) return 0;
    let clean = raw.toString().trim().replace(/,/g, ''); 
    if (clean.includes('.') && !clean.includes(',')) clean = clean.replace(/\./g, '');
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : parsed;
};

// History Modal Component
const InventoryHistoryModal: React.FC<{ 
  item: InventoryItem, 
  onClose: () => void, 
  onSelectRow: (row: DeviceRow) => void 
}> = ({ item, onClose, onSelectRow }) => {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
         <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
             <div className="flex items-center gap-3">
                 <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><History className="w-5 h-5"/></div>
                 <div>
                    <h3 className="font-bold text-slate-800">Lịch sử giao dịch</h3>
                    <p className="text-xs text-slate-500">{item.deviceName}</p>
                 </div>
             </div>
             <button onClick={onClose}><X className="w-5 h-5 text-slate-400 hover:text-slate-600"/></button>
         </div>
         
         <div className="flex-1 overflow-auto p-0 custom-scrollbar">
             <table className="w-full text-left text-sm">
                 <thead className="bg-slate-50 text-slate-500 font-bold sticky top-0 shadow-sm z-10">
                     <tr>
                         <th className="px-4 py-3">Ngày</th>
                         <th className="px-4 py-3">Số Phiếu</th>
                         <th className="px-4 py-3">Loại</th>
                         <th className="px-4 py-3 hidden sm:table-cell">Nhà cung cấp/ Khoa</th>
                         <th className="px-4 py-3 text-right">SL</th>
                         <th className="px-4 py-3 text-right">Đơn giá</th>
                         <th className="px-4 py-3 text-right">Thành tiền</th>
                         <th className="px-4 py-3"></th>
                     </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                     {item.history.map((row, idx) => {
                         const isImport = !row.ticketNumber.toUpperCase().startsWith('PX');
                         const date = formatDate(row.fullData[5]);
                         const qty = parseSheetNumber(row.fullData[14]) || 1;
                         const price = parseSheetNumber(row.fullData[15]) || 0;
                         const total = parseSheetNumber(row.fullData[16]) || 0;
                         
                         return (
                             <tr key={idx} className="hover:bg-slate-50 cursor-pointer" onClick={() => onSelectRow(row)}>
                                 <td className="px-4 py-3 text-slate-600 font-mono text-xs">{date}</td>
                                 <td className="px-4 py-3 font-bold text-slate-700">{row.ticketNumber}</td>
                                 <td className="px-4 py-3">
                                     <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${isImport ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                                        {isImport ? 'Nhập' : 'Xuất'}
                                     </span>
                                 </td>
                                 <td className="px-4 py-3 text-slate-600 max-w-[200px] truncate hidden sm:table-cell">{row.provider || row.department}</td>
                                 <td className="px-4 py-3 text-right font-bold">{qty}</td>
                                 <td className="px-4 py-3 text-right text-xs font-mono text-slate-500">{formatCurrency(price)}</td>
                                 <td className="px-4 py-3 text-right text-xs font-mono font-bold text-slate-700">{formatCurrency(total)}</td>
                                 <td className="px-4 py-3 text-right"><ChevronRight className="w-4 h-4 text-slate-300"/></td>
                             </tr>
                         )
                     })}
                 </tbody>
             </table>
         </div>
      </div>
    </div>
  );
};

export const InventoryReport: React.FC<InventoryReportProps> = ({ data, isLoading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [hideZeroStock, setHideZeroStock] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [detailRow, setDetailRow] = useState<DeviceRow | null>(null);

  // Logic tổng hợp dữ liệu Xuất - Nhập - Tồn
  const reportData = useMemo(() => {
    const inventoryMap = new Map<string, InventoryItem>();

    data.forEach(row => {
      const deviceCode = row.fullData[6];
      const deviceNameRaw = row.deviceName;
      const groupKey = deviceCode ? deviceCode.trim() : deviceNameRaw.trim();
      
      if (!groupKey) return;

      if (!inventoryMap.has(groupKey)) {
        inventoryMap.set(groupKey, {
          id: groupKey,
          deviceName: deviceNameRaw, 
          details: new Set<string>(), 
          models: new Set<string>(),
          importCount: 0,
          exportCount: 0,
          stock: 0,
          importMoney: 0,
          exportMoney: 0,
          stockMoney: 0,
          history: []
        });
      }

      const item = inventoryMap.get(groupKey)!;
      item.history.push(row);
      
      if (deviceNameRaw && deviceNameRaw.length > item.deviceName.length) {
          item.deviceName = deviceNameRaw;
      }
      
      if (row.modelSerial && row.modelSerial !== '-' && row.modelSerial !== 'N/A') {
        item.models.add(row.modelSerial);
      }
      
      const details = row.fullData[8];
      if (details && details.trim() !== '' && details !== '-') {
          item.details.add(details.trim());
      }

      let quantity = parseSheetNumber(row.fullData[14]);
      if (quantity === 0 && row.deviceName) quantity = 1; 

      let money = parseSheetNumber(row.fullData[16]);

      const ticketUpper = row.ticketNumber.trim().toUpperCase();
      if (ticketUpper.startsWith('PX')) {
        item.exportCount += quantity;
        item.exportMoney += money;
      } else {
        item.importCount += quantity;
        item.importMoney += money;
      }
    });

    return Array.from(inventoryMap.values()).map(item => ({
      ...item,
      stock: item.importCount - item.exportCount,
      stockMoney: item.importMoney - item.exportMoney
    })).sort((a, b) => a.deviceName.localeCompare(b.deviceName));
  }, [data]);

  const filteredReport = useMemo(() => {
    let result = reportData;
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(item => 
        item.deviceName.toLowerCase().includes(lowerTerm) ||
        item.id.toLowerCase().includes(lowerTerm) ||
        Array.from(item.models).some(m => (m as string).toLowerCase().includes(lowerTerm)) ||
        Array.from(item.details).some(d => (d as string).toLowerCase().includes(lowerTerm))
      );
    }
    if (hideZeroStock) {
      result = result.filter(item => item.stock > 0);
    }
    return result;
  }, [reportData, searchTerm, hideZeroStock]);

  const summary = useMemo(() => {
    return filteredReport.reduce((acc, item) => ({
      totalImport: acc.totalImport + item.importCount,
      totalExport: acc.totalExport + item.exportCount,
      totalStock: acc.totalStock + item.stock,
      totalStockValue: acc.totalStockValue + item.stockMoney
    }), { totalImport: 0, totalExport: 0, totalStock: 0, totalStockValue: 0 });
  }, [filteredReport]);

  const handleExportCSV = () => {
    const csvData = filteredReport.map((item, index) => {
      const avgPrice = item.stock > 0 ? Math.round(item.stockMoney / item.stock) : 0;
      return {
        STT: index + 1,
        'Mã TB': item.id !== item.deviceName ? item.id : '',
        'Tên Thiết Bị': item.deviceName,
        'Chi tiết/Quy cách': Array.from(item.details).join('; '),
        'Model/Serial': Array.from(item.models).join('; '),
        'Tổng Nhập (SL)': item.importCount,
        'Tổng Xuất (SL)': item.exportCount,
        'Tồn Kho (SL)': item.stock,
        'Đơn giá TB': avgPrice,
        'Giá trị Tồn': item.stockMoney
      };
    });

    const csv = Papa.unparse(csvData);
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Bao_Cao_Ton_Kho_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
      return (
          <div className="h-full flex items-center justify-center bg-slate-50">
              <div className="flex flex-col items-center gap-3 animate-pulse">
                   <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                   <div className="h-4 w-32 bg-slate-200 rounded"></div>
              </div>
          </div>
      )
  }

  return (
    <div className="h-full flex flex-col bg-slate-50 p-4 md:p-6 overflow-hidden relative">
      {/* Detail Modal */}
      {detailRow && (
          <DeviceDetailModal device={detailRow} onClose={() => setDetailRow(null)} />
      )}
      
      {/* History Modal */}
      {selectedItem && (
          <InventoryHistoryModal 
             item={selectedItem} 
             onClose={() => setSelectedItem(null)} 
             onSelectRow={(row) => setDetailRow(row)}
          />
      )}

      {/* Header Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-4 md:mb-6 shrink-0">
        <div className="bg-white p-3 md:p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-slate-50 rounded-full opacity-50"></div>
          <div className="p-2 md:p-3 bg-blue-50 text-blue-600 rounded-lg z-10 shrink-0">
            <Box className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div className="z-10 min-w-0">
            <p className="text-[10px] md:text-xs text-slate-500 uppercase font-bold tracking-wide">Mã hàng</p>
            <p className="text-xl md:text-2xl font-bold text-slate-800 truncate">{filteredReport.length}</p>
          </div>
        </div>

        <div className="bg-white p-3 md:p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 relative overflow-hidden">
           <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-indigo-50 rounded-full opacity-50"></div>
          <div className="p-2 md:p-3 bg-indigo-50 text-indigo-600 rounded-lg z-10 shrink-0">
            <Archive className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div className="z-10 min-w-0">
            <p className="text-[10px] md:text-xs text-indigo-600/80 uppercase font-bold tracking-wide">Tồn Kho (SL)</p>
            <p className="text-xl md:text-2xl font-bold text-indigo-700 truncate">{summary.totalStock.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white p-3 md:p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 relative overflow-hidden col-span-2 md:col-span-2">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-50 rounded-full opacity-50"></div>
          <div className="p-2 md:p-3 bg-emerald-50 text-emerald-600 rounded-lg z-10 shrink-0">
            <DollarSign className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div className="z-10 min-w-0 flex-1">
            <p className="text-[10px] md:text-xs text-emerald-600/80 uppercase font-bold tracking-wide">Tổng Giá Trị Tồn Kho</p>
            <p className="text-xl md:text-3xl font-black text-emerald-700 truncate tracking-tight">
                {formatCurrency(summary.totalStockValue)}
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-t-2xl border border-slate-200 border-b-0 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0 shadow-sm z-10">
         <div className="flex flex-col sm:flex-row gap-3 w-full items-center">
            <div className="relative flex-1 w-full">
                <input
                  type="text"
                  placeholder="Tìm tên, mã, model, chi tiết..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
            
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 select-none hover:bg-slate-100 transition-colors w-full sm:w-auto justify-center">
              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${hideZeroStock ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}>
                {hideZeroStock && <CheckCircle2 className="w-3 h-3 text-white" />}
              </div>
              <input 
                type="checkbox" 
                className="hidden"
                checked={hideZeroStock}
                onChange={(e) => setHideZeroStock(e.target.checked)}
              />
              <span>Chỉ hiện tồn</span>
            </label>

            <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-semibold shadow-sm active:scale-95 whitespace-nowrap w-full sm:w-auto justify-center"
            >
                <Download className="w-4 h-4" />
                <span className="md:hidden">Excel</span>
                <span className="hidden md:inline">Xuất Excel</span>
            </button>
         </div>
      </div>

      {/* Data Container (Responsive) */}
      <div className="flex-1 bg-white border border-slate-200 border-t-0 rounded-b-2xl overflow-hidden flex flex-col shadow-sm">
        <div className="overflow-auto flex-1 relative custom-scrollbar">
          
          {/* DESKTOP TABLE VIEW */}
          <table className="w-full text-left hidden md:table">
            <thead className="text-xs text-emerald-800 uppercase bg-emerald-50 sticky top-0 z-20 shadow-sm border-b border-emerald-100">
              <tr>
                <th className="px-6 py-3 font-bold w-12 text-center">#</th>
                <th className="px-6 py-3 font-bold">Tên Thiết Bị / Mã - Chi tiết</th>
                <th className="px-6 py-3 font-bold w-1/5">Model / Quy cách</th>
                <th className="px-6 py-3 font-bold w-24 text-right">Tồn Kho</th>
                <th className="px-6 py-3 font-bold w-32 text-right">Đơn giá TB</th>
                <th className="px-6 py-3 font-bold w-40 text-right text-emerald-700 bg-emerald-100/30">Giá trị Tồn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReport.length > 0 ? (
                filteredReport.map((item, index) => {
                    const avgPrice = item.stock > 0 ? item.stockMoney / item.stock : 0;
                    return (
                        <tr key={index} className="hover:bg-slate-50 transition-colors cursor-pointer group" onClick={() => setSelectedItem(item)}>
                            <td className="px-6 py-3 text-center text-slate-400 text-sm">{index + 1}</td>
                            <td className="px-6 py-3">
                                <div className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors text-base">
                                    {item.deviceName}
                                </div>
                                
                                <div className="text-xs mt-0.5 text-slate-500 line-clamp-2">
                                    {item.id !== item.deviceName && (
                                        <span className="font-mono font-bold text-slate-600 mr-1.5 bg-slate-100 px-1 rounded border border-slate-200">
                                            {item.id}
                                        </span>
                                    )}
                                    {item.details.size > 0 && (
                                        <span className="text-slate-500">
                                             {Array.from(item.details).join('; ')}
                                        </span>
                                    )}
                                </div>
                            </td>
                            <td className="px-6 py-3">
                                <div className="flex flex-wrap gap-1">
                                    {Array.from(item.models).map((model, idx) => (
                                        <span key={idx} className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                                            {model as string}
                                        </span>
                                    ))}
                                    {item.models.size === 0 && <span className="text-slate-300 text-sm italic">-</span>}
                                </div>
                            </td>
                            <td className={`px-6 py-3 text-right font-mono font-bold ${item.stock <= 0 ? 'text-red-500' : 'text-blue-600'}`}>
                            {item.stock.toLocaleString()}
                            </td>
                            <td className="px-6 py-3 text-right font-mono text-sm text-slate-500">
                                {item.stock > 0 ? formatCurrency(avgPrice) : '-'}
                            </td>
                            <td className="px-6 py-3 text-right font-mono font-bold text-emerald-700 bg-emerald-50/10">
                                {formatCurrency(item.stockMoney)}
                            </td>
                        </tr>
                    )
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                        <AlertCircle className="w-10 h-10 text-slate-300 mb-2"/>
                        <p>Không có dữ liệu phù hợp</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* MOBILE CARD VIEW */}
          <div className="md:hidden p-2 space-y-3">
             {filteredReport.length > 0 ? (
                filteredReport.map((item, index) => (
                    <div 
                        key={index} 
                        onClick={() => setSelectedItem(item)}
                        className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm active:bg-slate-50 transition-colors"
                    >
                        <div className="flex justify-between items-start mb-2">
                             <div>
                                <h3 className="font-bold text-slate-800 text-sm line-clamp-2">{item.deviceName}</h3>
                                <div className="text-xs text-slate-500 mt-1 flex items-center flex-wrap gap-1.5">
                                     {item.id !== item.deviceName && <span className="font-mono font-bold text-slate-600 bg-slate-100 px-1 rounded">{item.id}</span>}
                                     {item.details.size > 0 && <span className="truncate">{Array.from(item.details).join('; ')}</span>}
                                </div>
                             </div>
                             <span className={`px-2 py-1 rounded text-xs font-bold font-mono shrink-0 ml-2 ${item.stock <= 0 ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                 SL: {item.stock}
                             </span>
                        </div>

                        <div className="flex justify-between items-center bg-emerald-50 p-2 rounded-lg border border-emerald-100 mb-2">
                             <span className="text-xs text-emerald-700 font-medium">Giá trị tồn</span>
                             <span className="text-sm font-bold text-emerald-800 font-mono">{formatCurrency(item.stockMoney)}</span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs mt-2 pt-2 border-t border-slate-100">
                             <div className="flex items-center gap-1.5">
                                 <ArrowDownCircle className="w-3.5 h-3.5 text-emerald-500"/>
                                 <span className="text-slate-600">Nhập: <span className="font-bold">{item.importCount}</span></span>
                             </div>
                             <div className="flex items-center gap-1.5">
                                 <ArrowUpCircle className="w-3.5 h-3.5 text-orange-500"/>
                                 <span className="text-slate-600">Xuất: <span className="font-bold">{item.exportCount}</span></span>
                             </div>
                             <div className="ml-auto text-slate-400">
                                 <ChevronRight className="w-4 h-4" />
                             </div>
                        </div>
                    </div>
                ))
             ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 py-10">
                    <AlertCircle className="w-10 h-10 text-slate-300 mb-2"/>
                    <p>Không có dữ liệu</p>
                </div>
             )}
          </div>

        </div>
        <div className="px-6 py-2 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 italic flex justify-between">
            <span className="hidden md:inline">* Giá trị tính dựa trên cột Thành tiền (Q). Đơn giá TB = Giá trị tồn / SL tồn.</span>
            <span className="md:hidden">* Nhấn vào thẻ để xem lịch sử.</span>
            <span className="font-bold text-blue-600 hidden md:inline">Tip: Click vào dòng để xem lịch sử giá</span>
        </div>
      </div>
    </div>
  );
};

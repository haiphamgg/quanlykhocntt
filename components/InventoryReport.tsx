
import React, { useMemo, useState } from 'react';
import { DeviceRow } from '../types';
import { ArrowDownCircle, ArrowUpCircle, Box, Search, Download, Archive, AlertCircle, CheckCircle2 } from 'lucide-react';
import Papa from 'papaparse';

interface InventoryReportProps {
  data: DeviceRow[];
  isLoading: boolean;
}

interface InventoryItem {
  id: string;
  deviceName: string;
  models: Set<string>;
  importCount: number;
  exportCount: number;
  stock: number;
}

export const InventoryReport: React.FC<InventoryReportProps> = ({ data, isLoading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [hideZeroStock, setHideZeroStock] = useState(false);

  // Logic tổng hợp dữ liệu Xuất - Nhập - Tồn
  const reportData = useMemo(() => {
    const inventoryMap = new Map<string, InventoryItem>();

    data.forEach(row => {
      // Chuẩn hóa tên để group (bỏ khoảng trắng thừa)
      const normalizedName = row.deviceName.trim();
      if (!normalizedName) return;

      if (!inventoryMap.has(normalizedName)) {
        inventoryMap.set(normalizedName, {
          id: normalizedName,
          deviceName: normalizedName,
          models: new Set<string>(),
          importCount: 0,
          exportCount: 0,
          stock: 0
        });
      }

      const item = inventoryMap.get(normalizedName)!;
      
      // Thêm model vào danh sách (nếu có)
      if (row.modelSerial && row.modelSerial !== '-' && row.modelSerial !== 'N/A') {
        item.models.add(row.modelSerial);
      }

      // LOGIC MỚI: PX là Xuất, Tất cả còn lại là Nhập
      const ticketUpper = row.ticketNumber.trim().toUpperCase();
      
      if (ticketUpper.startsWith('PX')) {
        item.exportCount += 1;
      } else {
        // Bao gồm PN, PC, NB... và bất kỳ mã nào không phải PX
        item.importCount += 1;
      }
    });

    // Tính tồn và chuyển về mảng
    return Array.from(inventoryMap.values()).map(item => ({
      ...item,
      stock: item.importCount - item.exportCount
    })).sort((a, b) => a.deviceName.localeCompare(b.deviceName));
  }, [data]);

  // Lọc dữ liệu
  const filteredReport = useMemo(() => {
    let result = reportData;

    // Lọc theo từ khóa
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(item => 
        item.deviceName.toLowerCase().includes(lowerTerm) ||
        Array.from(item.models).some(m => (m as string).toLowerCase().includes(lowerTerm))
      );
    }

    // Lọc ẩn tồn kho = 0
    if (hideZeroStock) {
      result = result.filter(item => item.stock > 0);
    }

    return result;
  }, [reportData, searchTerm, hideZeroStock]);

  // Tổng quan toàn kho
  const summary = useMemo(() => {
    return filteredReport.reduce((acc, item) => ({
      totalImport: acc.totalImport + item.importCount,
      totalExport: acc.totalExport + item.exportCount,
      totalStock: acc.totalStock + item.stock
    }), { totalImport: 0, totalExport: 0, totalStock: 0 });
  }, [filteredReport]);

  const handleExportCSV = () => {
    const csvData = filteredReport.map((item, index) => ({
      STT: index + 1,
      'Tên Thiết Bị': item.deviceName,
      'Model/Quy cách': Array.from(item.models).join(', '),
      'Tổng Nhập': item.importCount,
      'Tổng Xuất': item.exportCount,
      'Tồn Kho': item.stock
    }));

    const csv = Papa.unparse(csvData);
    // Thêm BOM để Excel hiển thị đúng tiếng Việt
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Xuat_Nhap_Ton_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.csv`);
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
    <div className="h-full flex flex-col bg-slate-50 p-4 md:p-6 overflow-hidden">
      {/* Header Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 shrink-0">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-slate-50 rounded-full opacity-50"></div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg z-10">
            <Box className="w-6 h-6" />
          </div>
          <div className="z-10">
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wide">Danh mục</p>
            <p className="text-2xl font-bold text-slate-800">{filteredReport.length}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 relative overflow-hidden">
           <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-50 rounded-full opacity-50"></div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg z-10">
            <ArrowDownCircle className="w-6 h-6" />
          </div>
          <div className="z-10">
            <p className="text-xs text-emerald-600/80 uppercase font-bold tracking-wide">Tổng Nhập</p>
            <p className="text-2xl font-bold text-emerald-700">{summary.totalImport}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-orange-50 rounded-full opacity-50"></div>
          <div className="p-3 bg-orange-50 text-orange-600 rounded-lg z-10">
            <ArrowUpCircle className="w-6 h-6" />
          </div>
          <div className="z-10">
            <p className="text-xs text-orange-600/80 uppercase font-bold tracking-wide">Tổng Xuất</p>
            <p className="text-2xl font-bold text-orange-700">{summary.totalExport}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-indigo-50 rounded-full opacity-50"></div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg z-10">
            <Archive className="w-6 h-6" />
          </div>
          <div className="z-10">
            <p className="text-xs text-indigo-600/80 uppercase font-bold tracking-wide">Tồn Kho</p>
            <p className="text-2xl font-bold text-indigo-700">{summary.totalStock}</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-t-2xl border border-slate-200 border-b-0 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0 shadow-sm z-10">
         <div className="flex items-center gap-3 w-full md:w-auto">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                Quản lý Xuất Nhập Tồn
            </h2>
         </div>

         <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
            {/* Checkbox filter */}
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 select-none hover:bg-slate-100 transition-colors">
              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${hideZeroStock ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}>
                {hideZeroStock && <CheckCircle2 className="w-3 h-3 text-white" />}
              </div>
              <input 
                type="checkbox" 
                className="hidden"
                checked={hideZeroStock}
                onChange={(e) => setHideZeroStock(e.target.checked)}
              />
              <span>Chỉ hiện hàng còn tồn</span>
            </label>

            <div className="relative flex-1 md:w-64 w-full">
                <input
                  type="text"
                  placeholder="Tìm tên thiết bị, model..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
            
            <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-semibold shadow-sm active:scale-95 whitespace-nowrap w-full sm:w-auto justify-center"
            >
                <Download className="w-4 h-4" />
                Xuất Excel
            </button>
         </div>
      </div>

      {/* Data Table */}
      <div className="flex-1 bg-white border border-slate-200 border-t-0 rounded-b-2xl overflow-hidden flex flex-col shadow-sm">
        <div className="overflow-auto flex-1 relative">
          <table className="w-full text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0 z-20 shadow-sm">
              <tr>
                <th className="px-6 py-3 font-bold border-b border-slate-200 w-12 text-center">#</th>
                <th className="px-6 py-3 font-bold border-b border-slate-200">Tên Thiết Bị</th>
                <th className="px-6 py-3 font-bold border-b border-slate-200 w-1/4">Model / Quy cách</th>
                <th className="px-6 py-3 font-bold border-b border-slate-200 w-32 text-right text-emerald-600">Tổng Nhập</th>
                <th className="px-6 py-3 font-bold border-b border-slate-200 w-32 text-right text-orange-600">Tổng Xuất</th>
                <th className="px-6 py-3 font-bold border-b border-slate-200 w-32 text-right text-indigo-700 bg-indigo-50/50">Tồn Kho</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReport.length > 0 ? (
                filteredReport.map((item, index) => (
                  <tr key={index} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3 text-center text-slate-400 text-sm">{index + 1}</td>
                    <td className="px-6 py-3">
                      <div className="font-semibold text-slate-800">{item.deviceName}</div>
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
                    <td className="px-6 py-3 text-right font-mono font-medium text-emerald-600">{item.importCount}</td>
                    <td className="px-6 py-3 text-right font-mono font-medium text-orange-600">{item.exportCount}</td>
                    <td className={`px-6 py-3 text-right font-mono font-bold ${item.stock <= 0 ? 'text-red-500 bg-red-50/30' : 'text-indigo-700 bg-indigo-50/30'}`}>
                      {item.stock}
                    </td>
                  </tr>
                ))
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
        </div>
        {/* Footer Note */}
        <div className="px-6 py-2 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 italic flex justify-between">
            <span>* Cách tính: Phiếu bắt đầu bằng <b>PX</b> tính là XUẤT. Tất cả các phiếu khác (PN, PC...) tính là NHẬP.</span>
            <span>Cập nhật: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
};

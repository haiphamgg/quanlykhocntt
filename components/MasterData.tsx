
import React, { useState, useEffect } from 'react';
import { fetchGoogleSheetData, saveToGoogleSheet } from '../services/sheetService';
import { Database, Plus, Save, RefreshCw, Search, Loader2 } from 'lucide-react';

// Định nghĩa các tab danh mục
type CatalogType = 'DM_THIETBI' | 'DM_HANGSX' | 'DM_NUOCSX' | 'DM_DVT' | 'DM_KHOAPHONG' | 'DM_BOPHAN' | 'DM_NCC';

interface MasterDataProps {
  activeTab?: CatalogType;
}

export const MasterData: React.FC<MasterDataProps> = () => {
  const [activeTab, setActiveTab] = useState<CatalogType>('DM_THIETBI');
  const [data, setData] = useState<string[][]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State cho item mới
  const [newItem, setNewItem] = useState<Record<string, string>>({});

  // Cấu hình các cột cho từng Sheet danh mục theo yêu cầu
  const tabs: {id: CatalogType, label: string, headers: string[], keys: string[]}[] = [
    { 
      id: 'DM_THIETBI', label: 'Thiết bị', 
      headers: ['Mã TB', 'Tên thiết bị', 'Chi tiết', 'ĐVT', 'Hãng SX', 'Nước SX', 'Model', 'Phân loại'],
      keys: ['code', 'name', 'details', 'unit', 'brand', 'country', 'model', 'cat']
    },
    { 
      id: 'DM_NCC', label: 'Nhà cung cấp', 
      headers: ['Tên NCC', 'Địa chỉ', 'Mã số thuế', 'SĐT', 'Ghi chú'],
      keys: ['name', 'addr', 'tax', 'phone', 'note']
    },
    { id: 'DM_HANGSX', label: 'Hãng SX', headers: ['Tên Hãng'], keys: ['name'] },
    { id: 'DM_NUOCSX', label: 'Nước SX', headers: ['Tên Nước'], keys: ['name'] },
    { id: 'DM_DVT', label: 'Đơn vị tính', headers: ['Tên ĐVT'], keys: ['name'] },
    { id: 'DM_KHOAPHONG', label: 'Khoa phòng', headers: ['Tên Khoa phòng'], keys: ['name'] },
    { id: 'DM_BOPHAN', label: 'Bộ phận', headers: ['Tên Bộ phận'], keys: ['name'] },
  ];

  const currentConfig = tabs.find(t => t.id === activeTab)!;

  const loadData = async () => {
    setIsLoading(true);
    // Lấy từ dòng 2 trở đi (giả sử dòng 1 là header của sheet)
    const result = await fetchGoogleSheetData(activeTab, 'A2:Z');
    // Filter dòng trống (kiểm tra cột tên - thường là index 1 hoặc 2)
    setData(result.filter(r => r[1] || r[2])); 
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
    setNewItem({});
    setSearchTerm('');
  }, [activeTab]);

  const handleSave = async () => {
    // Validate: Trường đầu tiên (sau STT) bắt buộc phải có
    if (!newItem[currentConfig.keys[0]]) {
      alert("Vui lòng điền thông tin bắt buộc.");
      return;
    }

    setIsSaving(true);
    try {
      // Chuẩn bị dòng dữ liệu để gửi
      // Cột A (STT) để trống cho Google Sheet tự điền hoặc "NEW"
      const rowData = [
        "'", // Cột A: STT (Giữ chỗ)
        ...currentConfig.keys.map(k => newItem[k] || "")
      ];

      await saveToGoogleSheet({
        action: 'add_master',
        sheetName: activeTab,
        row: rowData
      });

      alert("Thêm mới thành công! (Dữ liệu sẽ cập nhật sau vài giây)");
      setNewItem({});
      setTimeout(loadData, 2000); // Reload sau 2s
    } catch (e) {
      alert("Lỗi khi lưu: " + e);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredData = data.filter(row => 
    row.some(cell => cell && cell.toString().toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="h-full flex flex-col bg-slate-50 p-2 md:p-6">
      {/* Tabs Scrollable */}
      <div className="flex overflow-x-auto gap-2 mb-4 pb-2 shrink-0 no-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-white text-slate-600 hover:bg-blue-50 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
        {/* Header Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row justify-between gap-4 bg-slate-50/50">
            <div className="flex items-center gap-2 text-slate-800 font-bold">
                <Database className="w-5 h-5 text-blue-600" />
                Danh mục {currentConfig.label}
                <span className="text-xs font-normal text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full ml-2">
                    {data.length}
                </span>
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                    <input
                        type="text"
                        placeholder="Tìm kiếm..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2" />
                </div>
                <button onClick={loadData} className="p-1.5 bg-white border border-slate-200 rounded-md hover:text-blue-600">
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
                <thead className="bg-emerald-50 text-xs uppercase text-emerald-700 sticky top-0 z-10 shadow-sm border-b border-emerald-100">
                    <tr>
                        <th className="px-4 py-3 border-b w-12 text-center">STT</th>
                        {currentConfig.headers.map((h, i) => (
                            <th key={i} className="px-4 py-3 border-b font-semibold whitespace-nowrap">{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                    {/* Input Row */}
                    <tr className="bg-blue-50/30">
                        <td className="px-4 py-3 text-center text-blue-400"><Plus className="w-4 h-4 mx-auto"/></td>
                        {currentConfig.keys.map((key, i) => (
                            <td key={key} className="px-2 py-2">
                                <input 
                                    className="w-full px-2 py-1.5 border border-blue-200 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white placeholder:text-xs"
                                    placeholder={i===0 ? `Nhập ${currentConfig.headers[0]}...` : ''}
                                    value={newItem[key] || ''}
                                    onChange={e => setNewItem({...newItem, [key]: e.target.value})}
                                />
                            </td>
                        ))}
                        <td className="w-10 px-2 sticky right-0 bg-blue-50/30">
                           <button 
                                onClick={handleSave}
                                disabled={isSaving}
                                className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 shadow-sm disabled:opacity-50 w-full flex justify-center"
                                title="Lưu"
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4" />}
                           </button>
                        </td>
                    </tr>

                    {/* Data Rows */}
                    {filteredData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 group">
                            <td className="px-4 py-3 text-center text-slate-400 border-r border-slate-100 font-mono text-xs">{row[0]}</td>
                            {currentConfig.keys.map((_, colIdx) => (
                                // Dữ liệu trong Sheet bắt đầu từ cột 1 (Cột 0 là STT)
                                <td key={colIdx} className="px-4 py-3 text-slate-700 border-r border-slate-100 truncate max-w-[200px]" title={row[colIdx+1]}>
                                    {row[colIdx+1]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

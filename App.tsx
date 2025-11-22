import React, { useState, useMemo, useEffect } from 'react';
import { DataInput } from './components/DataInput';
import { TicketSelector } from './components/TicketSelector';
import { QRGrid } from './components/QRGrid';
import { LookupPage } from './components/LookupPage';
import { DriveFileBrowser } from './components/DriveFileBrowser';
import { DeviceRow } from './types';
import { analyzeTicketData } from './services/geminiService';
import { fetchGoogleSheetData } from './services/sheetService';
import { 
  LayoutGrid, Search as SearchIcon, Database, Sparkles, AlertTriangle, 
  FileText, FolderOpen, Menu, X, Settings
} from 'lucide-react';

// CẤU HÌNH CỘT THEO YÊU CẦU
const COL_TICKET = 4;   // E: Số phiếu
const COL_QR = 18;      // S: Mã QR
const COL_NAME = 1;     // B: Tên thiết bị
const COL_MODEL = 12;   // M: Model
const COL_DEPT = 3;     // D: Bộ phận

// ID MẶC ĐỊNH (Hardcoded để tránh lỗi 404)
const DEFAULT_SHEET_ID = '1vonMQNPV2SI_XxmZ7h781QHS2fZBMSMbIxWQjS7z1B4';

// ID THƯ MỤC DRIVE CHÍNH XÁC THEO YÊU CẦU
const DEFAULT_VOUCHER_ID = '16khjeVK8e7evRXQQK7z9IJit4yCrO9f1'; // Folder Chứng từ
const DEFAULT_DOC_ID = '1IUwHzC02O4limzpg7wPQEMpDB9uc5Ui8';     // Folder Tài liệu

type ViewMode = 'print' | 'lookup' | 'vouchers' | 'drive';

export default function App() {
  const [rawData, setRawData] = useState<string[][]>([]);
  
  // State lưu cấu hình ID
  const [sheetId, setSheetId] = useState<string>(() => localStorage.getItem('SHEET_ID') || DEFAULT_SHEET_ID);
  const [voucherFolderId, setVoucherFolderId] = useState<string>(() => localStorage.getItem('VOUCHER_FOLDER_ID') || DEFAULT_VOUCHER_ID);
  const [docFolderId, setDocFolderId] = useState<string>(() => localStorage.getItem('DOC_FOLDER_ID') || DEFAULT_DOC_ID);
  
  const [selectedTicket, setSelectedTicket] = useState<string>('');
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('print');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const handleLoadData = async (targetSheetId: string = sheetId) => {
    // Đảm bảo ID hợp lệ
    const idToUse = targetSheetId.trim() || DEFAULT_SHEET_ID;
    
    localStorage.setItem('SHEET_ID', idToUse);
    if (idToUse !== sheetId) setSheetId(idToUse);

    setIsLoading(true);
    setConnectionError(null);
    try {
      const data = await fetchGoogleSheetData(idToUse, 'DULIEU');
      
      if (data && Array.isArray(data) && data.length > 0) {
        console.log("Loaded data rows:", data.length);
        setRawData(data);
        setLastUpdated(new Date());
      } else {
        setRawData([]);
        setConnectionError("Sheet 'DULIEU' không có dữ liệu hoặc tên Sheet không đúng.");
      }
    } catch (err: any) {
      console.error("Failed to load data", err);
      setConnectionError(err.message || "Không thể kết nối đến Google Sheet.");
    } finally {
      setIsLoading(false);
    }
  };

  // Auto load ngay khi mở app
  useEffect(() => {
    handleLoadData(sheetId);
  }, []);

  const handleSaveConfig = () => {
    localStorage.setItem('SHEET_ID', sheetId);
    localStorage.setItem('VOUCHER_FOLDER_ID', voucherFolderId);
    localStorage.setItem('DOC_FOLDER_ID', docFolderId);
    handleLoadData(sheetId);
    setShowSettings(false);
  };

  const parsedData: DeviceRow[] = useMemo(() => {
    if (!rawData || rawData.length === 0) return [];

    return rawData
      .map((row, index) => {
        // Lấy số phiếu
        const ticketNumber = row[COL_TICKET] ? String(row[COL_TICKET]).trim() : '';
        // Bỏ qua dòng tiêu đề hoặc dòng trống
        if (!ticketNumber || ticketNumber.toUpperCase() === 'SỐ PHIẾU' || ticketNumber.toUpperCase().includes('TICKET')) return null;

        const deviceName = row[COL_NAME] ? String(row[COL_NAME]).trim() : 'Thiết bị';
        let qrContent = row[COL_QR] ? String(row[COL_QR]).trim() : '';

        // FALLBACK: Tự tạo nội dung QR nếu cột S rỗng hoặc lỗi #N/A
        if (!qrContent || qrContent === '#N/A' || qrContent.startsWith('Error') || qrContent.trim() === '') {
            const detail = row[2] || '';
            const dept = row[3] || ''; // D
            const date = row[5] || ''; // F
            const model = row[12] || ''; // M
            const warranty = row[13] || ''; // N
            // Format QR text
            qrContent = `${deviceName}\n${detail}\nModel: ${model}\n${dept}\n${ticketNumber} (${date})\nBH: ${warranty}`;
        }

        return {
          rowId: index,
          ticketNumber: ticketNumber,
          qrContent: qrContent,
          department: row[COL_DEPT] || '',
          provider: row[2] || '', // Cột C: Nguồn / Nhà CC
          deviceName: deviceName,
          modelSerial: row[COL_MODEL] || '',
          fullData: row
        } as DeviceRow;
      })
      .filter((item): item is DeviceRow => item !== null);
  }, [rawData]);

  const uniqueTickets = useMemo(() => {
    const tickets = new Set(parsedData.map(d => d.ticketNumber));
    return Array.from(tickets).sort().reverse();
  }, [parsedData]);

  const selectedItems = useMemo(() => {
    return parsedData.filter(d => d.ticketNumber === selectedTicket);
  }, [parsedData, selectedTicket]);

  // Phân tích AI (Chỉ chạy khi ở màn hình In Tem)
  useEffect(() => {
    if (viewMode === 'print' && selectedTicket && selectedItems.length > 0) {
      const runAnalysis = async () => {
        setIsAnalyzing(true);
        const result = await analyzeTicketData(selectedTicket, selectedItems);
        setAiAnalysis(result);
        setIsAnalyzing(false);
      };
      runAnalysis();
    } else {
      setAiAnalysis('');
    }
  }, [selectedTicket, selectedItems, viewMode]);

  const NavButton = ({ mode, icon: Icon, label, colorClass }: any) => (
    <button
      onClick={() => { setViewMode(mode); setMobileMenuOpen(false); }}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all w-full md:w-auto whitespace-nowrap
        ${viewMode === mode 
          ? `bg-white shadow-md ${colorClass} border border-slate-100` 
          : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
        }`}
    >
      <Icon className="w-5 h-5" />
      {label}
    </button>
  );

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shrink-0 no-print shadow-sm z-30 relative">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 text-white p-2 rounded-lg shadow-lg shadow-blue-500/30">
             <Database className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 leading-tight hidden sm:block">QR Print Master</h1>
            <p className="text-xs text-slate-500 hidden sm:block">Hệ thống in tem & quản lý</p>
          </div>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex flex-1 items-center justify-center px-4 overflow-x-auto">
           <div className="flex bg-slate-100 p-1.5 rounded-xl gap-1">
              <NavButton mode="print" icon={LayoutGrid} label="In Tem" colorClass="text-blue-600" />
              <NavButton mode="lookup" icon={SearchIcon} label="Tra Cứu" colorClass="text-purple-600" />
              <NavButton mode="vouchers" icon={FileText} label="Chứng Từ" colorClass="text-emerald-600" />
              <NavButton mode="drive" icon={FolderOpen} label="Tài Liệu" colorClass="text-red-500" />
           </div>
        </div>

        <div className="flex items-center gap-2">
            <button onClick={() => setShowSettings(!showSettings)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors" title="Cấu hình">
                <Settings className="w-5 h-5" />
            </button>
            <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
        </div>
      </header>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4" onClick={() => setShowSettings(false)}>
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="p-4 border-b border-slate-100 font-bold text-slate-800 flex justify-between items-center">
                  <span>Cấu hình hệ thống</span>
                  <button onClick={() => setShowSettings(false)}><X className="w-5 h-5 text-slate-400"/></button>
              </div>
              <div className="p-4 flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
                 <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Google Sheet ID (Dữ liệu)</label>
                    <input 
                        value={sheetId}
                        onChange={(e) => setSheetId(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded font-mono text-sm"
                    />
                    <button 
                        onClick={() => setSheetId(DEFAULT_SHEET_ID)}
                        className="text-xs text-blue-600 hover:underline mt-1"
                    >
                        Sử dụng mặc định
                    </button>
                 </div>
                 <div>
                    <label className="text-sm font-medium text-emerald-700 mb-1 block">Folder ID (Chứng Từ)</label>
                    <input 
                        value={voucherFolderId}
                        onChange={(e) => setVoucherFolderId(e.target.value)}
                        className="w-full p-2 border border-emerald-200 bg-emerald-50 rounded font-mono text-sm"
                        placeholder="ID thư mục Drive chứng từ"
                    />
                 </div>
                 <div>
                    <label className="text-sm font-medium text-red-700 mb-1 block">Folder ID (Tài Liệu)</label>
                    <input 
                        value={docFolderId}
                        onChange={(e) => setDocFolderId(e.target.value)}
                        className="w-full p-2 border border-red-200 bg-red-50 rounded font-mono text-sm"
                        placeholder="ID thư mục Drive tài liệu"
                    />
                 </div>
                 <button 
                    onClick={handleSaveConfig}
                    className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 mt-2"
                 >
                    Lưu & Cập nhật
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-white pt-20 px-4 flex flex-col gap-2 md:hidden">
            <NavButton mode="print" icon={LayoutGrid} label="In Tem" colorClass="text-blue-600" />
            <NavButton mode="lookup" icon={SearchIcon} label="Tra Cứu" colorClass="text-purple-600" />
            <NavButton mode="vouchers" icon={FileText} label="Chứng Từ" colorClass="text-emerald-600" />
            <NavButton mode="drive" icon={FolderOpen} label="Tài Liệu" colorClass="text-red-500" />
        </div>
      )}

      <div className="flex-1 overflow-hidden relative">
        {/* Error Banner */}
        {connectionError && (
             <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm animate-in fade-in slide-in-from-top-4">
                <AlertTriangle className="w-4 h-4" />
                {connectionError}
                <button onClick={() => handleLoadData(sheetId)} className="underline font-semibold hover:text-red-800 ml-2">Thử lại</button>
             </div>
        )}

        {/* MODE 1: IN TEM */}
        {viewMode === 'print' && (
          <div className="h-full flex flex-col md:flex-row">
            <div className="w-full md:w-80 bg-white border-r border-slate-200 p-4 overflow-y-auto flex flex-col gap-4 shrink-0 no-print shadow-lg z-10">
              <DataInput 
                onReload={handleLoadData} 
                isLoading={isLoading} 
                lastUpdated={lastUpdated}
                rowCount={parsedData.length}
                currentSheetId={sheetId}
              />
              
              <div className="border-t border-slate-100 pt-4">
                <TicketSelector 
                  tickets={uniqueTickets} 
                  selectedTicket={selectedTicket} 
                  onSelect={setSelectedTicket} 
                />
              </div>

              {selectedTicket && (
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 shadow-sm mt-auto">
                  <div className="flex items-center gap-2 mb-2 text-indigo-700">
                    <Sparkles className="w-4 h-4" />
                    <h3 className="font-semibold text-sm">AI Phân Tích</h3>
                  </div>
                  <div className="text-xs text-slate-700 whitespace-pre-line">
                    {isAnalyzing ? "Đang xử lý..." : aiAnalysis}
                  </div>
                </div>
              )}
            </div>
            <main className="flex-1 bg-slate-100 overflow-hidden p-4 print:p-0 print:bg-white">
              <QRGrid items={selectedItems} selectedTicket={selectedTicket} />
            </main>
          </div>
        )}

        {/* MODE 2: TRA CỨU */}
        {viewMode === 'lookup' && (
          <LookupPage 
            data={parsedData} 
            onReload={() => handleLoadData(sheetId)} 
            isLoading={isLoading} 
            lastUpdated={lastUpdated} 
          />
        )}

        {/* MODE 3: CHỨNG TỪ */}
        {viewMode === 'vouchers' && (
           <DriveFileBrowser 
             folderId={voucherFolderId} 
             title="Kho Chứng Từ" 
             description="Biên bản, Phiếu xuất/nhập kho (PDF)" 
           />
        )}
        
        {/* MODE 4: TÀI LIỆU */}
        {viewMode === 'drive' && (
           <DriveFileBrowser 
             folderId={docFolderId} 
             title="Tài Liệu Kỹ Thuật" 
             description="Catalogue, Hướng dẫn sử dụng" 
           />
        )}
      </div>
    </div>
  );
}
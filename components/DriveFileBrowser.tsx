
import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, Image as ImageIcon, File, User, 
  Search, RefreshCw, ExternalLink, Settings, AlertCircle, 
  CheckCircle2, Loader2, Grid, List, Eye, X, Download
} from 'lucide-react';
import { DriveFile } from '../types';
import { fetchDriveFiles, formatFileSize, getFileIcon } from '../services/driveService';

// URL API CỐ ĐỊNH (Đã được cung cấp)
const DEFAULT_API_URL = "https://script.google.com/macros/s/AKfycbyqEtmuL0lOwh_Iibgs7oxx0lSC1HG1ubNcPc6KINu8a-aC3adsK9qTRj9LCjX4z7iq/exec";

interface DriveFileBrowserProps {
  folderId: string;
  title: string;
  description: string;
}

export const DriveFileBrowser: React.FC<DriveFileBrowserProps> = ({ folderId, title, description }) => {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedFile, setSelectedFile] = useState<DriveFile | null>(null);
  
  // URL Script
  const [scriptUrl, setScriptUrl] = useState(DEFAULT_API_URL);
  const [showConfig, setShowConfig] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tiêu đề cột động
  const isVoucher = title.toLowerCase().includes('chứng từ');
  const nameHeader = isVoucher ? "TÊN CHỨNG TỪ" : "TÊN TÀI LIỆU";
  const colorTheme = isVoucher ? "text-emerald-600" : "text-blue-600";
  const bgTheme = isVoucher ? "bg-emerald-50" : "bg-blue-50";

  const loadFiles = async () => {
    if (!folderId) return;
    
    setLoading(true);
    setError(null);
    setSelectedFile(null);
    try {
      const data = await fetchDriveFiles(folderId, scriptUrl);
      setFiles(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Lỗi kết nối đến Google Drive API");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, [folderId, scriptUrl]);

  // LOGIC TÌM KIẾM CLIENT-SIDE
  const filteredFiles = useMemo(() => {
    if (!searchTerm) return files;
    const lowerTerm = searchTerm.toLowerCase();
    return files.filter(f => 
      f.name.toLowerCase().includes(lowerTerm) || 
      (f.lastModifyingUser?.displayName || '').toLowerCase().includes(lowerTerm)
    );
  }, [files, searchTerm]);

  const renderIcon = (mimeType: string) => {
    const type = getFileIcon(mimeType);
    if (type === 'pdf') return <FileText className="w-5 h-5 text-red-500" />;
    if (type === 'image') return <ImageIcon className="w-5 h-5 text-purple-500" />;
    if (type === 'sheet') return <FileText className="w-5 h-5 text-emerald-600" />;
    if (type === 'doc') return <FileText className="w-5 h-5 text-blue-600" />;
    return <File className="w-5 h-5 text-slate-400" />;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
    } catch { return dateStr; }
  };

  // Tạo link preview nhúng (thay /view bằng /preview)
  const getPreviewLink = (link: string) => {
    if (!link) return '';
    return link.replace('/view', '/preview');
  };

  return (
    <div className="h-full flex flex-col bg-slate-50/50">
      {/* HEADER & TOOLBAR */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col gap-4 shadow-sm shrink-0">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg ${bgTheme} ${colorTheme} border border-slate-100`}>
                    {isVoucher ? <FileText className="w-6 h-6" /> : <File className="w-6 h-6" />}
                </div>
                <div>
                    <h2 className="text-lg font-bold text-slate-800 leading-tight uppercase">{title}</h2>
                    <p className="text-xs text-slate-500">{description}</p>
                </div>
            </div>

            {/* Search Bar - Always Visible & Functional */}
            <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-80 group">
                    <input 
                        type="text" 
                        placeholder="Tìm kiếm tài liệu..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 group-focus-within:text-blue-500" />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
                <button 
                    onClick={loadFiles}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors"
                    title="Làm mới"
                >
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
                 <button 
                    onClick={() => setShowConfig(!showConfig)}
                    className={`p-2 rounded-lg transition-colors ${showConfig ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-slate-600'}`}
                    title="Cài đặt"
                >
                    <Settings className="w-5 h-5" />
                </button>
            </div>
         </div>

         {/* Config Panel (Hidden by default since URL is hardcoded) */}
         {showConfig && (
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm animate-in slide-in-from-top-2">
                <label className="block font-bold text-slate-700 mb-1">API Endpoint (Web App URL)</label>
                <div className="flex gap-2">
                    <input 
                        value={scriptUrl}
                        onChange={(e) => setScriptUrl(e.target.value)}
                        className="flex-1 px-3 py-2 border border-slate-300 rounded font-mono text-xs"
                    />
                    <button onClick={loadFiles} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium">
                        Lưu
                    </button>
                </div>
            </div>
         )}
      </div>

      {/* MAIN CONTENT - SPLIT VIEW */}
      <div className="flex-1 overflow-hidden flex">
          {/* File List */}
          <div className={`flex-1 flex flex-col overflow-hidden bg-white transition-all duration-300 ${selectedFile ? 'w-1/2 border-r border-slate-200' : 'w-full'}`}>
              {/* Table Header */}
              <div className="flex items-center px-6 py-3 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase sticky top-0 z-10">
                  <div className="flex-1">{nameHeader}</div>
                  <div className="w-48 hidden md:block text-right">Sửa đổi lần cuối - Tác giả</div>
                  <div className="w-10"></div>
              </div>

              {/* List Body */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {loading ? (
                      <div className="flex flex-col items-center justify-center h-40 gap-2">
                          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                          <span className="text-sm text-slate-400">Đang tải dữ liệu...</span>
                      </div>
                  ) : error ? (
                      <div className="p-8 text-center text-red-500 bg-red-50 rounded-lg m-4 border border-red-100">
                          <AlertCircle className="w-10 h-10 mx-auto mb-2" />
                          <p className="font-medium">Không thể tải dữ liệu</p>
                          <p className="text-xs mt-1 opacity-80">{error}</p>
                      </div>
                  ) : filteredFiles.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400">
                          <Search className="w-12 h-12 mb-2 opacity-20" />
                          <p className="text-sm">Không tìm thấy kết quả nào</p>
                      </div>
                  ) : (
                      filteredFiles.map((file) => (
                          <div 
                              key={file.id}
                              onClick={() => setSelectedFile(file)}
                              className={`group flex items-center px-4 py-3 rounded-lg cursor-pointer transition-all border border-transparent hover:border-slate-200 hover:shadow-sm ${selectedFile?.id === file.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-white'}`}
                          >
                              <div className="flex-1 flex items-center gap-3 min-w-0">
                                  <div className={`p-2 rounded-lg ${selectedFile?.id === file.id ? 'bg-white shadow-sm' : 'bg-slate-100 group-hover:bg-white group-hover:shadow-sm'}`}>
                                      {renderIcon(file.mimeType)}
                                  </div>
                                  <div className="min-w-0">
                                      <p className={`text-sm font-medium truncate ${selectedFile?.id === file.id ? 'text-blue-700' : 'text-slate-700'}`}>
                                          {file.name}
                                      </p>
                                      <p className="text-xs text-slate-400 flex items-center gap-2">
                                          <span>{formatFileSize(file.size)}</span>
                                          <span className="md:hidden">• {formatDate(file.modifiedTime)}</span>
                                      </p>
                                  </div>
                              </div>
                              
                              <div className="w-48 hidden md:flex flex-col items-end justify-center text-right pl-4">
                                  <span className="text-xs font-medium text-slate-600">{formatDate(file.modifiedTime)}</span>
                                  <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                      <User className="w-3 h-3" /> {file.lastModifyingUser?.displayName || 'User'}
                                  </span>
                              </div>

                              <div className="w-10 flex justify-end">
                                  {selectedFile?.id === file.id && (
                                      <Eye className="w-4 h-4 text-blue-500" />
                                  )}
                              </div>
                          </div>
                      ))
                  )}
              </div>
              
              {/* Footer status */}
              <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex justify-between">
                  <span>Tổng: {filteredFiles.length} mục</span>
                  {selectedFile && <span>Đang chọn: {selectedFile.name}</span>}
              </div>
          </div>

          {/* Preview Panel (Right Side) */}
          {selectedFile && (
              <div className="w-1/2 bg-slate-100 border-l border-slate-200 flex flex-col animate-in slide-in-from-right-4 duration-200">
                  <div className="px-4 py-3 bg-white border-b border-slate-200 flex justify-between items-center shadow-sm z-10">
                      <div className="flex items-center gap-2 min-w-0">
                          <div className="p-1.5 bg-slate-100 rounded">
                              {renderIcon(selectedFile.mimeType)}
                          </div>
                          <div className="min-w-0">
                              <h3 className="text-sm font-bold text-slate-800 truncate max-w-[200px]" title={selectedFile.name}>
                                  {selectedFile.name}
                              </h3>
                          </div>
                      </div>
                      <div className="flex items-center gap-2">
                          <a 
                              href={selectedFile.webViewLink} 
                              target="_blank" 
                              rel="noreferrer"
                              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-50 rounded-lg"
                              title="Mở trong tab mới"
                          >
                              <ExternalLink className="w-4 h-4" />
                          </a>
                          <button 
                              onClick={() => setSelectedFile(null)}
                              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          >
                              <X className="w-4 h-4" />
                          </button>
                      </div>
                  </div>

                  <div className="flex-1 bg-slate-200 relative overflow-hidden">
                      {/* Google Drive Embed Viewer */}
                      <iframe 
                          src={getPreviewLink(selectedFile.webViewLink)}
                          className="w-full h-full border-0"
                          allow="autoplay"
                          title="Preview"
                      />
                      
                      {/* Loading overlay for iframe */}
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-slate-100 -z-10">
                          <Loader2 className="w-8 h-8 text-slate-300 animate-spin" />
                      </div>
                  </div>
              </div>
          )}
      </div>
    </div>
  );
};

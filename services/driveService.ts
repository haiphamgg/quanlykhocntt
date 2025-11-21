
import { DriveFile } from '../types';
import { SCRIPT_URL } from './sheetService';

export const fetchDriveFiles = async (folderId: string): Promise<DriveFile[]> => {
  if (!folderId) {
    throw new Error("Chưa cấu hình ID thư mục");
  }

  if (!SCRIPT_URL) {
    throw new Error("Chưa cấu hình Script URL");
  }

  // CACHE BUSTING: Thêm timestamp vào URL để luôn lấy dữ liệu mới nhất
  const timestamp = new Date().getTime();
  const url = `${SCRIPT_URL}?folderId=${folderId}&_t=${timestamp}`;

  try {
    // QUAN TRỌNG: Không gửi headers tùy chỉnh (như Cache-Control) vì Google Apps Script
    // không hỗ trợ CORS preflight (OPTIONS request), gây lỗi "Failed to fetch".
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Lỗi kết nối (${response.status})`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }

    return data.files || [];
  } catch (error: any) {
    console.error("Failed to fetch drive files:", error);
    throw new Error(error.message || "Lỗi không xác định khi tải dữ liệu từ Drive");
  }
};

export const formatFileSize = (bytes?: string | number): string => {
  if (bytes === undefined || bytes === null) return '0 B';
  
  const numBytes = typeof bytes === 'string' ? parseInt(bytes) : bytes;
  if (isNaN(numBytes) || numBytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(numBytes) / Math.log(k));
  
  return parseFloat((numBytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const getFileIcon = (mimeType: string) => {
  if (!mimeType) return 'file';
  const type = mimeType.toLowerCase();
  
  if (type.includes('pdf')) return 'pdf';
  if (type.includes('image')) return 'image';
  if (type.includes('sheet') || type.includes('excel') || type.includes('spreadsheet')) return 'sheet';
  if (type.includes('document') || type.includes('word')) return 'doc';
  if (type.includes('folder')) return 'folder';
  return 'file';
};

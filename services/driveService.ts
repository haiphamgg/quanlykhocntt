
import { DriveFile } from '../types';
// import { SCRIPT_URL } from './sheetService'; // Removed hard dependency

export const fetchDriveFiles = async (folderId: string, scriptUrl: string): Promise<DriveFile[]> => {
  if (!folderId) {
    throw new Error("Chưa cấu hình ID thư mục");
  }

  if (!scriptUrl) {
    throw new Error("Chưa cấu hình Script URL");
  }

  // CACHE BUSTING
  const timestamp = new Date().getTime();
  const url = `${scriptUrl}?folderId=${folderId}&_t=${timestamp}`;

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Lỗi kết nối (${response.status})`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }

    const rawFiles = data.files || [];

    // Normalize data to match DriveFile interface
    // Google Apps Script DriveApp return slightly different keys than Drive API v3
    return rawFiles.map((f: any) => {
      // Xử lý user (có thể là object, string, hoặc nằm trong owner)
      // Apps Script đôi khi trả về 'lastModifyingUser' là object, đôi khi là string tên
      let userName = 'Admin';
      let userEmail = '';
      
      const userObj = f.lastModifyingUser || f.owner || f.sharingUser;

      if (typeof userObj === 'string') {
        userName = userObj;
      } else if (userObj) {
        userName = userObj.displayName || userObj.name || userObj.emailAddress || 'Admin';
        userEmail = userObj.emailAddress || '';
      }
      
      // Fallback nếu API trả về lastModifyingUserName (một số version script cũ)
      if (userName === 'Admin' && f.lastModifyingUserName) {
          userName = f.lastModifyingUserName;
      }

      // Xử lý ngày tháng - Quan trọng: Không dùng fallback new Date()
      // Apps Script thường trả về dateCreated hoặc createdTime dưới dạng ISO String
      const created = f.createdTime || f.dateCreated || f.createdDate || null;
      const modified = f.modifiedTime || f.lastUpdated || f.updated || null;

      return {
        id: f.id,
        name: f.name,
        mimeType: f.mimeType,
        webViewLink: f.webViewLink || f.url, // Script might return 'url'
        webContentLink: f.webContentLink || f.downloadUrl,
        thumbnailLink: f.thumbnailLink,
        size: f.size,
        createdTime: created,
        modifiedTime: modified,
        lastModifyingUser: {
          displayName: userName,
          emailAddress: userEmail
        }
      };
    });

  } catch (error: any) {
    console.error("Failed to fetch drive files:", error);
    throw new Error(error.message || "Lỗi kết nối đến Google Apps Script");
  }
};

export const getDownloadLink = (file: DriveFile): string => {
  // Nếu là file Google Docs/Sheets, link download mặc định sẽ là export PDF hoặc Excel
  if (file.mimeType.includes('application/vnd.google-apps.document')) {
    return `https://docs.google.com/document/d/${file.id}/export?format=pdf`;
  }
  if (file.mimeType.includes('application/vnd.google-apps.spreadsheet')) {
    return `https://docs.google.com/spreadsheets/d/${file.id}/export?format=xlsx`;
  }
  if (file.mimeType.includes('application/vnd.google-apps.presentation')) {
    return `https://docs.google.com/presentation/d/${file.id}/export?format=pdf`;
  }

  // Nếu có link tải trực tiếp từ API
  if (file.webContentLink) return file.webContentLink;
  
  // Fallback chuẩn
  return `https://drive.google.com/uc?export=download&id=${file.id}`;
};

export const getPrintSource = (file: DriveFile): string => {
  // 1. Đối với Ảnh: dùng link export=view để hiển thị trực tiếp trong iframe
  if (file.mimeType.includes('image')) {
      return `https://drive.google.com/uc?export=view&id=${file.id}`;
  }

  // 2. Đối với Google Docs/Sheets: Sử dụng chế độ PREVIEW để tránh tự động tải về (download)
  // Link export=pdf thường ép buộc tải xuống. Link /preview cho phép xem và in từ trình duyệt.
  if (file.mimeType.includes('application/vnd.google-apps')) {
     if (file.webViewLink) {
        // Chuyển đổi link /edit hoặc /view thành /preview
        return file.webViewLink.replace(/\/edit.*|\/view.*/, '/preview');
     }
     // Fallback construct URL
     if (file.mimeType.includes('spreadsheet')) return `https://docs.google.com/spreadsheets/d/${file.id}/preview`;
     if (file.mimeType.includes('document')) return `https://docs.google.com/document/d/${file.id}/preview`;
  }
  
  // 3. Đối với PDF gốc trên Drive: Dùng /preview để mở trình xem PDF của Google
  if (file.mimeType.includes('pdf')) {
      return `https://drive.google.com/file/d/${file.id}/preview`;
  }

  // Fallback: Dùng webViewLink gốc (thường là mode xem)
  return file.webViewLink || `https://drive.google.com/file/d/${file.id}/preview`;
};

export const formatFileSize = (bytes?: string | number): string => {
  if (bytes === undefined || bytes === null) return '-';
  
  const numBytes = typeof bytes === 'string' ? parseInt(bytes) : bytes;
  if (isNaN(numBytes) || numBytes === 0) return '-';
  
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

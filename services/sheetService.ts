
import Papa from 'papaparse';

// ID của Spreadsheet mới
export const SPREADSHEET_ID = '1R2j006xS2Cjrcx5i8wDsSmb-hIFhi708ZmhjN3e-DLM';

// URL của Google Apps Script Web App
// BẠN CẦN CẬP NHẬT URL NÀY SAU KHI DEPLOY SCRIPT TRÊN SHEET MỚI
export const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyQ4YV0htouX3tP_7FstedjAdpjuPqDAWdpjcE11JhugrNW8iTCI0AvAauSoAbOXevd/exec'; 

export const fetchGoogleSheetData = async (sheetName: string = 'DATA', range: string = 'A2:Z'): Promise<string[][]> => {
  // Sử dụng Google Visualization API để lấy dữ liệu dạng CSV (Chỉ đọc - nhanh)
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}&range=${range}`;

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      // Xử lý các lỗi HTTP thường gặp
      if (response.status === 400) {
         throw new Error(`Không tìm thấy Sheet tên "${sheetName}". Hãy kiểm tra lại tên Tab phía dưới Google Sheet.`);
      }
      if (response.status === 403 || response.status === 401) {
         throw new Error(`Không có quyền truy cập Sheet. Vui lòng nhấn "Share" (Chia sẻ) > "Anyone with the link" (Bất kỳ ai có liên kết).`);
      }
      throw new Error(`Lỗi kết nối Sheet "${sheetName}": ${response.statusText} (${response.status})`);
    }
    
    const csvText = await response.text();
    
    // Đôi khi Google trả về HTML báo lỗi thay vì CSV
    if (csvText.trim().startsWith('<!DOCTYPE html>') || csvText.includes("Google Drive - Page Not Found")) {
         throw new Error(`Không đọc được dữ liệu từ Sheet "${sheetName}". Có thể Sheet chưa được Public hoặc sai tên.`);
    }

    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        complete: (results) => {
          resolve(results.data as string[][]);
        },
        error: (error: any) => {
          reject(new Error("Lỗi phân tích dữ liệu CSV: " + error.message));
        }
      });
    });
  } catch (error: any) {
    console.error(`Error fetching sheet ${sheetName}:`, error);
    throw error; // Ném lỗi ra để App.tsx bắt và hiển thị thông báo
  }
};

// Hàm gửi dữ liệu lên Google Sheet thông qua Apps Script
export const saveToGoogleSheet = async (payload: any): Promise<any> => {
  if (!SCRIPT_URL || SCRIPT_URL.includes('...')) {
    throw new Error("Vui lòng cấu hình URL Google Apps Script trong services/sheetService.ts");
  }

  try {
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors', // Google Apps Script yêu cầu no-cors hoặc redirect handling đặc biệt
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload)
    });

    // Vì mode: 'no-cors', ta không đọc được response body trực tiếp.
    // Giả định thành công nếu không có lỗi mạng.
    return { result: "success" };

  } catch (error) {
    console.error("Save error:", error);
    throw error;
  }
};

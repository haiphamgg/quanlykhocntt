
export interface DeviceRow {
  rowId: number;
  ticketNumber: string; 
  qrContent: string;    
  deviceName: string;   
  department: string;   
  provider: string;     
  modelSerial: string;  
  fullData: string[];
}

export interface AnalysisResult {
  summary: string;
  count: number;
  isComplete: boolean;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  webContentLink?: string;
  thumbnailLink?: string;
  size?: string | number;
  createdTime?: string;
}

// --- WMS TYPES ---

export interface MasterDevice {
  stt?: string;
  code: string; // Mã thiết bị
  name: string; // Tên thiết bị
  details: string; // Thông tin chi tiết
  unit: string; // ĐVT
  manufacturer: string; // Hãng SX
  country: string; // Nước SX
  model: string; // Model
  category: string; // Phân loại
}

export interface MasterSupplier {
  stt?: string;
  name: string;
  address: string;
  taxCode: string;
  phone: string;
  notes: string;
}

export interface SimpleCategory {
  stt?: string;
  name: string;
}

export interface TransactionItem {
  deviceCode: string;
  deviceName: string;
  details: string;
  unit: string;
  manufacturer: string;
  country: string;
  modelSerial: string;
  warranty: string;
  quantity: number;
  price: number;
  total: number;
  notes: string; // Tài liệu, Ghi chú
}

export interface WarehouseTicket {
  ticketType: 'PN' | 'PX'; // Loại phiếu
  ticketNumber: string; // Số phiếu
  date: string; // Ngày tháng
  partner: string; // NCC hoặc Khoa phòng
  section: string; // Bộ phận
  items: TransactionItem[];
}

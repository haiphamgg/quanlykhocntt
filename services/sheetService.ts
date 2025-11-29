
// URL API CỐ ĐỊNH (Fallback)
const FALLBACK_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyqEtmuL0lOwh_Iibgs7oxx0lSC1HG1ubNcPc6KINu8a-aC3adsK9qTRj9LCjX4z7iq/exec";

// @ts-ignore
export const SCRIPT_URL = process.env.SCRIPT_URL || FALLBACK_SCRIPT_URL;

export const fetchGoogleSheetData = async (sheetId: string, sheetNameOrRange: string = 'DULIEU'): Promise<string[][]> => {
  if (!sheetId) {
    throw new Error("Chưa nhập Sheet ID.");
  }

  // Phân tách Sheet Name và Range nếu có dấu '!' (VD: "DANHMUC!A2:G")
  let sheet = sheetNameOrRange;
  let range = 'A3:U'; // Mặc định cho DULIEU

  if (sheetNameOrRange.includes('!')) {
    const parts = sheetNameOrRange.split('!');
    sheet = parts[0];
    range = parts[1];
  }

  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheet)}&range=${encodeURIComponent(range)}&headers=1`;

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Lỗi kết nối: ${response.status}`);
    }

    const text = await response.text();
    const jsonMatch = text.match(/google\.visualization\.Query\.setResponse\(([\s\S\w]+)\);/);
    
    if (!jsonMatch || !jsonMatch[1]) {
      throw new Error("Cấu trúc dữ liệu không hợp lệ (Không phải GVIZ response).");
    }

    const json = JSON.parse(jsonMatch[1]);

    if (json.status === 'error') {
      throw new Error(json.errors?.[0]?.detailed_message || "Lỗi từ Google Sheet API");
    }

    const rows = json.table.rows.map((row: any) => {
      return (row.c || []).map((cell: any) => (cell ? (cell.v !== null ? String(cell.v) : "") : ""));
    });

    return rows;
  } catch (error: any) {
    console.error(`Error fetching sheet ${sheetNameOrRange}:`, error);
    throw new Error(`Không thể lấy dữ liệu từ sheet "${sheetNameOrRange}". Hãy kiểm tra tên sheet và quyền truy cập.`);
  }
};

export const saveToGoogleSheet = async (data: any, explicitScriptUrl?: string) => {
  // Ưu tiên URL được truyền vào, sau đó đến localStorage, cuối cùng là fallback
  const userScriptUrl = localStorage.getItem('SCRIPT_URL');
  const targetUrl = explicitScriptUrl || userScriptUrl || SCRIPT_URL;

  if (!targetUrl || !targetUrl.startsWith('http')) {
    throw new Error("Script URL không hợp lệ. Hãy kiểm tra ô A2 sheet DMDC hoặc cấu hình Admin.");
  }

  const payload = JSON.stringify(data);

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      body: payload,
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
    });

    if (!response.ok) {
        throw new Error(`Server returned ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    if (result.status === 'error') {
      throw new Error(result.message || "Lỗi không xác định từ Script");
    }
    return result;

  } catch (error: any) {
    console.error("Error saving to sheet:", error);
    
    if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
       throw new Error(`Lỗi kết nối (CORS) đến Script. \n\nNGUYÊN NHÂN THƯỜNG GẶP:\n1. URL trong sheet DMDC!A2 sai.\n2. Script chưa được Deploy đúng cách.\n   -> Hãy vào Script Editor -> Deploy -> New Deployment -> Select type: Web app -> Who has access: "Anyone" (Quan trọng!).`);
    }
    
    throw error;
  }
};

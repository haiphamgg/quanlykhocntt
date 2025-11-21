
import React, { useState, useEffect } from 'react';
import { fetchGoogleSheetData, saveToGoogleSheet } from '../services/sheetService';
import { WarehouseTicket, TransactionItem } from '../types';
import { Save, Plus, Trash2, FileInput, FileOutput, Calendar, User, Building, Hash, Loader2 } from 'lucide-react';

interface WarehouseFormProps {
  type: 'import' | 'export';
}

export const WarehouseForm: React.FC<WarehouseFormProps> = ({ type }) => {
  const isImport = type === 'import';
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Master Data for Dropdowns
  const [suppliers, setSuppliers] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [sections, setSections] = useState<string[]>([]);
  const [units, setUnits] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [devices, setDevices] = useState<any[]>([]); 

  // Form State
  const [ticket, setTicket] = useState<WarehouseTicket>({
    ticketType: isImport ? 'PN' : 'PX',
    ticketNumber: '',
    date: new Date().toISOString().split('T')[0],
    partner: '',
    section: '',
    items: []
  });

  // Item input state
  const [currentItem, setCurrentItem] = useState<TransactionItem>({
    deviceCode: '', deviceName: '', details: '', unit: '', 
    manufacturer: '', country: '', modelSerial: '', warranty: '',
    quantity: 1, price: 0, total: 0, notes: ''
  });

  // Load Master Data
  useEffect(() => {
    const loadMasters = async () => {
      setIsLoading(true);
      try {
        // Fetch parallel
        const [ncc, dept, sec, dev, dvt, hangsx, nuocsx] = await Promise.all([
            fetchGoogleSheetData('DM_NCC'),
            fetchGoogleSheetData('DM_KHOAPHONG'),
            fetchGoogleSheetData('DM_BOPHAN'),
            fetchGoogleSheetData('DM_THIETBI'),
            fetchGoogleSheetData('DM_DVT'),
            fetchGoogleSheetData('DM_HANGSX'),
            fetchGoogleSheetData('DM_NUOCSX')
        ]);

        setSuppliers(ncc.map(r => r[1]).filter(Boolean)); // Col B: Name
        setDepartments(dept.map(r => r[1]).filter(Boolean));
        setSections(sec.map(r => r[1]).filter(Boolean));
        setUnits(dvt.map(r => r[1]).filter(Boolean));
        setBrands(hangsx.map(r => r[1]).filter(Boolean));
        setCountries(nuocsx.map(r => r[1]).filter(Boolean));
        
        // DM_THIETBI structure: [0]STT, [1]Code, [2]Name, [3]Detail, [4]Unit, [5]Brand, [6]Country, [7]Model
        setDevices(dev.filter(r => r[1])); 

      } catch (e) {
        console.error("Error loading masters", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadMasters();
    
    // Reset ticket when switching type
    setTicket(prev => ({
        ...prev, 
        ticketType: isImport ? 'PN' : 'PX',
        ticketNumber: '',
        partner: '',
        items: []
    }));
  }, [type]);

  // Auto-fill device info
  const handleDeviceSelect = (code: string) => {
    const device = devices.find(d => d[1] === code);
    if (device) {
        setCurrentItem(prev => ({
            ...prev,
            deviceCode: device[1],
            deviceName: device[2],
            details: device[3],
            unit: device[4],
            manufacturer: device[5],
            country: device[6],
            modelSerial: device[7] || ''
        }));
    } else {
        setCurrentItem(prev => ({...prev, deviceCode: code}));
    }
  };

  const addItem = () => {
    if (!currentItem.deviceName) {
        alert("Vui lòng nhập tên thiết bị");
        return;
    }
    setTicket(prev => ({
        ...prev,
        items: [...prev.items, { ...currentItem, total: currentItem.quantity * currentItem.price }]
    }));
    // Reset but keep context fields that might repeat
    setCurrentItem(prev => ({
        ...prev, 
        deviceCode: '', deviceName: '', details: '', modelSerial: '', 
        quantity: 1, price: 0, total: 0 
    }));
  };

  const removeItem = (index: number) => {
    setTicket(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    if (!ticket.ticketNumber || !ticket.partner || ticket.items.length === 0) {
        alert("Vui lòng điền đủ: Số phiếu, Đối tác (NCC/Khoa) và ít nhất 1 thiết bị.");
        return;
    }

    setIsSubmitting(true);
    try {
        // Mapping data to "DATA" sheet structure exactly as requested:
        // STT(0); Loại phiếu(1); NCC/Khoa(2); Bộ phận(3); Số phiếu(4); Ngày(5); 
        // Mã TB(6); Tên(7); Chi tiết(8); ĐVT(9); Hãng(10); Nước(11); Model(12); 
        // Bảo hành(13); SL(14); ĐG(15); TT(16); Tài liệu/Ghi chú(17)
        
        const rowsToSave = ticket.items.map((item) => {
            return [
                "'", // STT (placeholder)
                ticket.ticketType,
                ticket.partner,
                ticket.section,
                ticket.ticketNumber,
                ticket.date,
                item.deviceCode,
                item.deviceName,
                item.details,
                item.unit,
                item.manufacturer,
                item.country,
                item.modelSerial,
                item.warranty,
                item.quantity,
                item.price,
                item.quantity * item.price,
                item.notes
            ];
        });

        await saveToGoogleSheet({
            action: 'create_ticket',
            rows: rowsToSave
        });

        alert("Lưu phiếu thành công!");
        setTicket(prev => ({...prev, ticketNumber: '', items: []}));

    } catch (e) {
        alert("Lỗi khi lưu: " + e);
    } finally {
        setIsSubmitting(false);
    }
  };

  // Datalist Helper
  const Datalist = ({ id, items }: { id: string, items: string[] }) => (
    <datalist id={id}>
      {items.map((item, i) => <option key={i} value={item} />)}
    </datalist>
  );

  return (
    <div className="h-full flex flex-col bg-slate-50 p-4 md:p-6 overflow-y-auto">
      {/* Datalists definitions */}
      <Datalist id="list-suppliers" items={suppliers} />
      <Datalist id="list-departments" items={departments} />
      <Datalist id="list-sections" items={sections} />
      <Datalist id="list-units" items={units} />
      <Datalist id="list-brands" items={brands} />
      <Datalist id="list-countries" items={countries} />

      {/* Header */}
      <div className={`bg-white p-6 rounded-xl shadow-sm border-l-4 mb-6 ${isImport ? 'border-emerald-500' : 'border-orange-500'}`}>
        <div className="flex items-center gap-3 mb-4">
            <div className={`p-3 rounded-lg ${isImport ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                {isImport ? <FileInput className="w-8 h-8" /> : <FileOutput className="w-8 h-8" />}
            </div>
            <div>
                <h1 className="text-2xl font-bold text-slate-800">
                    {isImport ? 'Phiếu Nhập Kho' : 'Phiếu Xuất Kho'}
                </h1>
                <p className="text-slate-500 text-sm">Nhập thông tin phiếu {isImport ? 'nhập mua/nhập lại' : 'xuất dùng/xuất trả'}</p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Số Phiếu *</label>
                <div className="relative">
                    <Hash className="w-4 h-4 absolute left-3 top-2.5 text-slate-400"/>
                    <input 
                        type="text" 
                        value={ticket.ticketNumber}
                        onChange={e => setTicket({...ticket, ticketNumber: e.target.value.toUpperCase()})}
                        placeholder={isImport ? "PN-..." : "PX-..."}
                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono font-bold uppercase"
                    />
                </div>
            </div>
            <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Ngày chứng từ *</label>
                <div className="relative">
                    <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-slate-400"/>
                    <input 
                        type="date" 
                        value={ticket.date}
                        onChange={e => setTicket({...ticket, date: e.target.value})}
                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>
            <div className="md:col-span-1">
                <label className="block text-xs font-medium text-slate-500 mb-1">
                    {isImport ? "Nhà Cung Cấp / Nguồn *" : "Khoa / Phòng nhận *"}
                </label>
                <div className="relative">
                    {isImport ? <Building className="w-4 h-4 absolute left-3 top-2.5 text-slate-400"/> : <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400"/>}
                    <input 
                        list={isImport ? "list-suppliers" : "list-departments"}
                        value={ticket.partner}
                        onChange={e => setTicket({...ticket, partner: e.target.value})}
                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Chọn hoặc nhập..."
                    />
                </div>
            </div>
             <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Bộ phận</label>
                <input 
                    list="list-sections"
                    value={ticket.section}
                    onChange={e => setTicket({...ticket, section: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Bộ phận sử dụng"
                />
            </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
        <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
            <Plus className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full p-1" />
            Thêm chi tiết thiết bị
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
            {/* Row 1 */}
            <div className="md:col-span-2">
                 <label className="text-xs text-slate-500">Mã TB (nếu có)</label>
                 <input 
                    list="device-list"
                    value={currentItem.deviceCode}
                    onChange={e => handleDeviceSelect(e.target.value)}
                    placeholder="Gõ mã..."
                    className="w-full p-2 border border-slate-300 rounded text-sm font-mono"
                 />
                 <datalist id="device-list">
                    {devices.map((d, i) => (
                        <option key={i} value={d[1]}>{d[2]}</option>
                    ))}
                 </datalist>
            </div>
            <div className="md:col-span-4">
                 <label className="text-xs text-slate-500 font-bold">Tên thiết bị *</label>
                 <input 
                    value={currentItem.deviceName}
                    onChange={e => setCurrentItem({...currentItem, deviceName: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded text-sm font-semibold"
                 />
            </div>
             <div className="md:col-span-2">
                 <label className="text-xs text-slate-500">Model / Serial</label>
                 <input 
                    value={currentItem.modelSerial}
                    onChange={e => setCurrentItem({...currentItem, modelSerial: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded text-sm"
                 />
            </div>
             <div className="md:col-span-2">
                 <label className="text-xs text-slate-500">ĐVT</label>
                 <input 
                    list="list-units"
                    value={currentItem.unit}
                    onChange={e => setCurrentItem({...currentItem, unit: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded text-sm"
                 />
            </div>
            <div className="md:col-span-2">
                 <label className="text-xs text-slate-500">Bảo hành</label>
                 <input 
                    value={currentItem.warranty}
                    onChange={e => setCurrentItem({...currentItem, warranty: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded text-sm"
                    placeholder="VD: 12 tháng"
                 />
            </div>

            {/* Row 2 */}
             <div className="md:col-span-2">
                 <label className="text-xs text-slate-500">Hãng SX</label>
                 <input 
                    list="list-brands"
                    value={currentItem.manufacturer}
                    onChange={e => setCurrentItem({...currentItem, manufacturer: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded text-sm"
                 />
            </div>
            <div className="md:col-span-2">
                 <label className="text-xs text-slate-500">Nước SX</label>
                 <input 
                    list="list-countries"
                    value={currentItem.country}
                    onChange={e => setCurrentItem({...currentItem, country: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded text-sm"
                 />
            </div>
             <div className="md:col-span-2">
                 <label className="text-xs text-slate-500 font-bold text-blue-600">Số lượng</label>
                 <input 
                    type="number" min="1"
                    value={currentItem.quantity}
                    onChange={e => setCurrentItem({...currentItem, quantity: parseInt(e.target.value) || 0})}
                    className="w-full p-2 border border-blue-300 rounded text-sm font-bold text-center"
                 />
            </div>
             <div className="md:col-span-2">
                 <label className="text-xs text-slate-500">Đơn giá</label>
                 <input 
                    type="number"
                    value={currentItem.price}
                    onChange={e => setCurrentItem({...currentItem, price: parseFloat(e.target.value) || 0})}
                    className="w-full p-2 border border-slate-300 rounded text-sm text-right"
                 />
            </div>
             <div className="md:col-span-2">
                 <label className="text-xs text-slate-500">Thành tiền</label>
                 <div className="w-full p-2 bg-slate-100 border border-slate-200 rounded text-sm text-right font-medium">
                    {(currentItem.quantity * currentItem.price).toLocaleString()}
                 </div>
            </div>
             <div className="md:col-span-2 flex items-end">
                <button 
                    onClick={addItem}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium shadow-sm active:translate-y-0.5"
                >
                    Thêm dòng
                </button>
             </div>
             
             <div className="md:col-span-12">
                 <label className="text-xs text-slate-500">Ghi chú / Tài liệu đi kèm</label>
                 <input 
                    value={currentItem.notes}
                    onChange={e => setCurrentItem({...currentItem, notes: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded text-sm"
                    placeholder="..."
                 />
            </div>
        </div>
      </div>

      {/* Table List */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="overflow-auto flex-1">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-slate-500 font-semibold uppercase text-xs sticky top-0">
                    <tr>
                        <th className="p-3 w-10">#</th>
                        <th className="p-3">Mã TB</th>
                        <th className="p-3">Tên Thiết Bị / Model</th>
                        <th className="p-3">ĐVT</th>
                        <th className="p-3 w-20 text-right">SL</th>
                        <th className="p-3 w-28 text-right">Đơn giá</th>
                        <th className="p-3 w-28 text-right">Thành tiền</th>
                        <th className="p-3 w-12"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {ticket.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-3 text-slate-400">{idx + 1}</td>
                            <td className="p-3 font-mono text-xs">{item.deviceCode}</td>
                            <td className="p-3">
                                <div className="font-medium text-slate-700">{item.deviceName}</div>
                                <div className="text-xs text-slate-500">{item.modelSerial} - {item.manufacturer}</div>
                            </td>
                            <td className="p-3">{item.unit}</td>
                            <td className="p-3 text-right font-bold">{item.quantity}</td>
                            <td className="p-3 text-right">{item.price.toLocaleString()}</td>
                            <td className="p-3 text-right font-medium text-slate-700">{(item.quantity * item.price).toLocaleString()}</td>
                            <td className="p-3 text-center">
                                <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </td>
                        </tr>
                    ))}
                    {ticket.items.length === 0 && (
                        <tr>
                            <td colSpan={8} className="p-8 text-center text-slate-400 italic">
                                Chưa có dữ liệu
                            </td>
                        </tr>
                    )}
                </tbody>
                {ticket.items.length > 0 && (
                    <tfoot className="bg-slate-50 font-bold text-slate-800">
                        <tr>
                            <td colSpan={6} className="p-3 text-right">Tổng cộng:</td>
                            <td className="p-3 text-right">{ticket.items.reduce((sum, i) => sum + (i.price * i.quantity), 0).toLocaleString()}</td>
                            <td></td>
                        </tr>
                    </tfoot>
                )}
            </table>
        </div>
        
        <div className="p-4 border-t border-slate-200 flex justify-end gap-3 bg-slate-50">
             <button 
                disabled={isSubmitting || ticket.items.length === 0}
                onClick={handleSubmit}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-2 disabled:opacity-50 disabled:shadow-none transition-all"
             >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin"/> : <Save className="w-5 h-5" />}
                Lưu Phiếu {isImport ? 'Nhập' : 'Xuất'}
             </button>
        </div>
      </div>
    </div>
  );
};

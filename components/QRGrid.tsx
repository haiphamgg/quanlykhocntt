import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { DeviceRow } from '../types';
import { Printer, FileDown, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface QRGridProps {
  items: DeviceRow[];
  selectedTicket: string;
}

export const QRGrid: React.FC<QRGridProps> = ({ items, selectedTicket }) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    const input = document.getElementById('printable-area');
    if (!input) return;

    setIsGeneratingPdf(true);
    try {
      // 1. Setup capture layout
      const originalWidth = input.style.width;
      const originalPadding = input.style.padding;
      
      // Force a fixed width for the capture to ensure consistent resolution
      input.style.width = '1200px'; 
      input.style.padding = '0'; // Remove padding for capture, we add margins in PDF

      const canvas = await html2canvas(input, {
        scale: 2, // High resolution
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true
      });

      // Restore DOM
      input.style.width = originalWidth;
      input.style.padding = originalPadding;

      const imgData = canvas.toDataURL('image/png');
      
      // 2. PDF Setup (A4)
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = 210;
      const pdfHeight = 297;
      
      const marginX = 15;
      const marginY = 15;
      
      const contentWidth = pdfWidth - (marginX * 2); 
      const contentHeight = pdfHeight - (marginY * 2);

      const imgProps = pdf.getImageProperties(imgData);
      const imgHeightOnPdf = (imgProps.height * contentWidth) / imgProps.width;

      let heightLeft = imgHeightOnPdf;
      let position = marginY;

      // 3. Add pages
      pdf.addImage(imgData, 'PNG', marginX, position, contentWidth, imgHeightOnPdf);
      heightLeft -= contentHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeightOnPdf; 
        pdf.addPage();
        
        const printedHeight = imgHeightOnPdf - heightLeft;
        const yPos = marginY - printedHeight;

        pdf.addImage(imgData, 'PNG', marginX, yPos, contentWidth, imgHeightOnPdf);
        heightLeft -= contentHeight;
      }

      pdf.save(`Tem_${selectedTicket}.pdf`);
    } catch (error) {
      console.error("PDF Generation failed", error);
      alert("Lỗi khi tạo PDF. Vui lòng thử lại.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (!selectedTicket || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 border-2 border-dashed border-slate-300 rounded-xl m-4 bg-slate-50/50">
        <div className="bg-white p-6 rounded-full shadow-sm mb-4">
          <Printer className="w-10 h-10 text-slate-300" />
        </div>
        <p className="font-medium">Chọn số phiếu bên trái để xem trước</p>
        <p className="text-sm mt-1">Dữ liệu tem và mã QR sẽ hiện ở đây</p>
      </div>
    );
  }

  const isImageUrl = (text: string) => {
    if (!text) return false;
    const lower = text.toLowerCase().trim();
    return lower.startsWith('http') || lower.startsWith('data:image');
  };

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 no-print px-2 shrink-0 gap-3">
        <div className="w-full sm:w-auto">
          <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
            <span className="bg-white px-2 py-1 rounded border border-slate-200 shadow-sm">
              Phiếu: {selectedTicket}
            </span>
            <span className="text-sm font-normal text-slate-500 bg-slate-200 px-2 py-1 rounded-full">
              {items.length} tem
            </span>
          </h3>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPdf}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg font-semibold shadow-sm transition-all"
          >
            {isGeneratingPdf ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileDown className="w-5 h-5" />}
            Tải PDF
          </button>

          <button
            onClick={handlePrint}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-primary hover:bg-blue-700 text-white rounded-lg font-semibold shadow-lg shadow-blue-500/20 transition-all active:scale-95"
          >
            <Printer className="w-5 h-5" />
            In Tem
          </button>
        </div>
      </div>

      {/* Grid Area */}
      <div className="flex-1 overflow-auto bg-slate-200/50 p-6 rounded-xl border border-slate-200 shadow-inner no-scrollbar print:bg-white print:p-0 print:border-none print:overflow-visible print:shadow-none">
        <div 
          id="printable-area" 
          className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full bg-white p-4 sm:bg-transparent sm:p-0"
        >
          {items.map((item) => {
             const isLink = isImageUrl(item.qrContent);
             // Đảm bảo nội dung QR là UTF-8 thuần túy, không BOM
             const qrValue = item.qrContent || "ERROR";

             return (
              <div 
                key={item.rowId} 
                className="print-card bg-white border-2 border-slate-800 p-2 rounded-lg flex flex-col justify-between items-center text-center shadow-sm relative overflow-hidden w-full mx-auto h-full min-h-[200px]"
              >
                {/* Header */}
                <div className="w-full flex justify-between items-center border-b-2 border-slate-800 pb-1 mb-1 print:border-black min-h-[2.5rem] flex-none gap-2">
                   <div className="text-lg font-black uppercase tracking-wider text-slate-900 print:text-xl leading-none text-left whitespace-nowrap">
                    {item.ticketNumber}
                   </div>
                   <div className="text-base font-bold uppercase text-slate-800 print:text-lg leading-none text-right break-words flex-1">
                    {item.department}
                   </div>
                </div>

                {/* QR Code */}
                <div className="qr-container flex-1 flex items-center justify-center w-full py-1 overflow-hidden">
                  {isLink ? (
                    <img 
                      src={item.qrContent} 
                      alt="QR" 
                      className="object-contain print:mix-blend-multiply"
                    />
                  ) : (
                    <QRCodeSVG 
                      value={qrValue} 
                      size={256} 
                      level={"H"} // QUAN TRỌNG: Mức H (High - 30%) giúp máy quét "đoán" bảng mã tốt hơn
                      minVersion={4} // Lưới đủ dày để chứa dữ liệu UTF-8
                      includeMargin={true} // Thêm lề trắng an toàn
                      imageSettings={{
                        src: "",
                        height: 0,
                        width: 0,
                        excavate: true,
                      }}
                    />
                  )}
                </div>

                {/* Footer */}
                <div className="w-full border-t border-slate-200 pt-1 mt-1 flex flex-col items-center justify-center print:border-black min-h-[4rem] flex-none">
                   <div className="font-bold text-slate-900 text-lg leading-tight print:text-xl print:leading-tight line-clamp-2 flex items-center justify-center h-auto min-h-[2.5rem] w-full overflow-hidden px-1">
                    {item.deviceName || "Thiết bị"}
                  </div>
                  <div className="text-sm text-slate-600 font-mono truncate w-full print:text-base print:font-bold print:text-black h-6 flex items-center justify-center mt-0.5">
                    {item.modelSerial ? `${item.modelSerial}` : <span className="opacity-0">-</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
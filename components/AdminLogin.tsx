
import React, { useState } from 'react';
import { Lock, X, ShieldCheck, AlertCircle } from 'lucide-react';

interface AdminLoginProps {
  onLogin: (pin: string) => boolean;
  onClose: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin, onClose }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = onLogin(pin);
    if (!success) {
      setError(true);
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100">
        <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-2 text-slate-800 font-bold">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <span>Đăng nhập Quản trị</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex flex-col items-center justify-center mb-6 text-center">
             <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-3 text-blue-600">
                <Lock className="w-8 h-8" />
             </div>
             <p className="text-sm text-slate-500">
               Vui lòng nhập mã PIN quản trị viên để thay đổi cấu hình hệ thống.
             </p>
          </div>

          <div className="mb-4 relative">
             <input
               type="password"
               value={pin}
               onChange={(e) => { setPin(e.target.value); setError(false); }}
               className={`w-full text-center text-2xl tracking-[0.5em] font-bold py-3 border-2 rounded-lg focus:outline-none focus:ring-2 transition-all ${error ? 'border-red-300 focus:ring-red-200 bg-red-50' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'}`}
               placeholder="••••••"
               maxLength={6}
               autoFocus
             />
             {error && (
                <div className="flex items-center gap-1 text-red-500 text-xs mt-2 justify-center font-medium">
                    <AlertCircle className="w-3 h-3" />
                    Mã PIN không đúng
                </div>
             )}
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 active:scale-95"
          >
            Mở Khóa
          </button>
        </form>
      </div>
    </div>
  );
};


import React from 'react';

const KrikInsLogo: React.FC = () => {
    return (
        <div className="fixed bottom-4 right-4 z-50 flex items-center justify-center pointer-events-none opacity-80 hover:opacity-100 transition-opacity duration-300">
            <div className="relative flex items-center font-black text-2xl tracking-tighter select-none">
                <span className="text-slate-800 drop-shadow-sm">Krik</span>
                <div className="relative ml-0.5">
                    <span className="bg-gradient-to-tr from-primary to-accent bg-clip-text text-transparent animate-spin-pause inline-block origin-center">
                        INS
                    </span>
                </div>
            </div>
        </div>
    );
};

export default KrikInsLogo;

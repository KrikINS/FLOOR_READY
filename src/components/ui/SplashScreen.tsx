
import React from 'react';

interface SplashScreenProps {
    mode?: 'loading' | 'login';
    children?: React.ReactNode;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ mode = 'loading', children }) => {
    const isLogin = mode === 'login';
    const [progress, setProgress] = React.useState(0);

    React.useEffect(() => {
        if (mode === 'loading') {
            const duration = 1500; // 1.5 seconds
            const interval = 15;
            const steps = duration / interval;
            const increment = 100 / steps;

            const timer = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(timer);
                        return 100;
                    }
                    return Math.min(prev + increment, 100);
                });
            }, interval);

            return () => clearInterval(timer);
        } else {
            setProgress(0);
        }
    }, [mode]);

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col items-center transition-all duration-1000 overflow-hidden">
            {/* Logo Container */}
            <div
                className={`flex flex-col items-center transition-all duration-1000 ease-in-out absolute ${isLogin ? 'top-12 scale-75' : 'top-1/2 -translate-y-1/2 scale-100'
                    }`}
            >
                <div className="text-center animate-fade-in-up">
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-2">
                        FLOOR <span className="text-primary">READY</span>
                    </h1>
                    <p className="text-slate-400 text-sm md:text-base font-medium tracking-widest uppercase mb-8">
                        An Event Management Portal
                    </p>
                    <div className={`h-1 w-24 bg-primary mx-auto rounded-full mb-8 transition-opacity duration-500 ${isLogin ? 'opacity-0' : 'opacity-100'}`}></div>

                    {!isLogin && (
                        <div className="w-64 max-w-xs mx-auto">
                            <div className="h-1 w-full bg-slate-700/50 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary transition-all duration-75 ease-linear"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <div className="flex justify-between items-center mt-2 text-slate-400 text-xs font-medium tracking-widest uppercase">
                                <span>Loading Experience</span>
                                <span>{Math.round(progress)}%</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Login Content */}
            <div
                className={`flex-1 flex flex-col justify-center w-full max-w-md px-4 transition-all duration-1000 delay-500 ${isLogin ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20 pointer-events-none'
                    }`}
            >
                {children}
            </div>

            {/* Footer */}
            <div className={`absolute bottom-10 flex flex-col items-center transition-opacity duration-500 ${isLogin ? 'opacity-50' : 'opacity-100'}`}>
                <div className="text-slate-600 text-xs tracking-wider mb-2">POWERED BY</div>
                <div className="flex items-center font-black text-xl tracking-tighter select-none opacity-80">
                    <span className="text-slate-400">Krik</span>
                    <div className="relative ml-0.5">
                        <span className="bg-gradient-to-tr from-primary to-accent bg-clip-text text-transparent animate-spin-pause inline-block origin-center">
                            INS
                        </span>
                    </div>
                </div>
                <div className="text-slate-500 text-[10px] tracking-widest mt-2 uppercase">v1.0.1</div>
            </div>
        </div>
    );
};

export default SplashScreen;

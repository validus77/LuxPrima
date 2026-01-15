import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Globe, FileText, Settings as SettingsIcon, Server, Cpu } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { api } from '../lib/api';

export const Layout = ({ children }: { children: React.ReactNode }) => {
    const [backendStatus, setBackendStatus] = useState<any>(null);
    const [aiOnline, setAiOnline] = useState<boolean | null>(null);
    const [config, setConfig] = useState<any>(null);

    useEffect(() => {
        // Initial config fetch
        api.getSettings().then(setConfig);
    }, []);

    useEffect(() => {
        const checkBackend = async () => {
            const data = await api.checkHealth();
            setBackendStatus(data);
        };

        const checkAI = async () => {
            if (config && config.llm_provider === 'local') {
                // Remove default localhost fallback to avoid dev-box confusion
                const baseUrl = config.llm_base_url;
                if (!baseUrl) return;

                const healthUrl = baseUrl.replace(/\/v1\/?$/, '');
                const status = await api.checkLlamaHealth(healthUrl);
                setAiOnline(status);
            } else {
                setAiOnline(null);
            }
        };

        checkBackend();
        checkAI();

        const beInterval = setInterval(checkBackend, 10000);
        const aiInterval = setInterval(checkAI, 60000);

        return () => {
            clearInterval(beInterval);
            clearInterval(aiInterval);
        };
    }, [config]);

    const getProviderLabel = () => {
        if (aiOnline === true) return 'LIVE';
        if (aiOnline === false) return 'OFF';
        const p = config?.llm_provider || 'CLOUD';
        return p.toUpperCase();
    };

    return (
        <div className="flex h-screen bg-background text-white font-sans">
            {/* Sidebar */}
            <aside className="w-64 border-r border-white/5 bg-surface/50 backdrop-blur-xl flex flex-col">
                <div className="p-6">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent tracking-tight">
                        LuxPrima
                    </h1>
                    <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest text-[10px] font-black">Autonomous Research</p>
                    <p className="text-[9px] text-gray-600 mt-2 font-mono">v5.0-clean-relative</p>
                </div>
                <nav className="flex-1 px-4 space-y-1">
                    <NavItem to="/" icon={<LayoutDashboard />} label="Dashboard" />
                    <NavItem to="/sources" icon={<Globe />} label="Sources" />
                    <NavItem to="/reports" icon={<FileText />} label="Reports" />
                    <NavItem to="/settings" icon={<SettingsIcon />} label="Settings" />
                </nav>

                <div className="p-6 border-t border-white/5 bg-white/[0.02] mt-auto">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between group">
                            <div className="flex items-center space-x-2 text-gray-400 group-hover:text-gray-300 transition-colors">
                                <Server size={14} />
                                <span className="text-[10px] font-black uppercase tracking-widest">System</span>
                            </div>
                            <div className="flex items-center space-x-1.5">
                                <div className={`w-1.5 h-1.5 rounded-full ${backendStatus ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-red-500'} animate-pulse`}></div>
                                <span className={`text-[10px] font-bold ${backendStatus ? 'text-green-500' : 'text-red-500'}`}>
                                    {backendStatus ? (backendStatus.service_id || 'ON') : 'OFF'}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between group">
                            <div className="flex items-center space-x-2 text-gray-400 group-hover:text-gray-300 transition-colors">
                                <Cpu size={14} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Intelligence</span>
                            </div>
                            <div className="flex items-center space-x-1.5">
                                <div className={`w-1.5 h-1.5 rounded-full ${aiOnline === false ? 'bg-red-500' :
                                    (aiOnline === true ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-primary/50')
                                    } animate-pulse`}></div>
                                <span className={`text-[10px] font-bold ${aiOnline === false ? 'text-red-500' :
                                    (aiOnline === true ? 'text-green-500' : 'text-primary/70')
                                    }`}>
                                    {getProviderLabel()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto custom-scrollbar">
                <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
                    {children}
                </div>
            </main>
        </div>
    );
}

const NavItem = ({ icon, label, to }: { icon: React.ReactNode, label: string, to: string }) => (
    <NavLink
        to={to}
        className={({ isActive }) => `flex items-center space-x-3 w-full px-4 py-3 rounded-lg transition-all duration-200 group ${isActive ? 'bg-primary/20 text-primary border border-primary/20 shadow-lg shadow-primary/10' : 'hover:bg-white/5 text-gray-400 hover:text-white border border-transparent'}`}
    >
        {React.cloneElement(icon as React.ReactElement, { size: 20, className: "group-hover:scale-110 transition-transform" })}
        <span className="font-medium text-sm tracking-wide">{label}</span>
    </NavLink>
)

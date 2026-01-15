import { useState, useEffect } from 'react';
import { Play, Activity, Clock, Globe, Cpu, Timer, ArrowRight, ChevronRight, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export const Dashboard = () => {
    const [generating, setGenerating] = useState(false);
    const [message, setMessage] = useState('');
    const [nextRun, setNextRun] = useState<string | null>(null);
    const [reports, setReports] = useState<any[]>([]);
    const [status, setStatus] = useState("Idle");

    const refreshReports = () => {
        api.getReports().then(data => {
            const sorted = data.sort((a, b) => new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime());
            setReports(sorted);
        });
    };

    // Status Polling
    useEffect(() => {
        let lastStatus = "Idle";
        const interval = setInterval(async () => {
            try {
                const data = await api.getStatus();
                if (data && data.status) {
                    // If we transition back to Idle, refresh reports
                    if (lastStatus !== "Idle" && data.status === "Idle") {
                        refreshReports();
                    }
                    lastStatus = data.status;
                    setStatus(data.status);
                }
            } catch (e) { /* ignore polling errors */ }
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        api.getNextRun().then(data => {
            if (data.next_run) {
                setNextRun(new Date(data.next_run).toLocaleTimeString());
            } else {
                setNextRun("Not Scheduled");
            }
        });
        refreshReports();
    }, []);

    const handleGenerate = async () => {
        setGenerating(true);
        setMessage('Starting analysis...');
        try {
            await api.generateReport();
            setMessage('Generation started in background.');
        } catch (e) {
            setMessage('Error starting generation.');
            console.error(e);
        } finally {
            setGenerating(false);
        }
    };

    // Mini metadata parser for the list
    const parseMeta = (report: any) => {
        if (!report.logs) return { sources: 0, model: 'Hybrid', time: '0s' };
        const sources = new Set();
        let model = 'Hybrid';
        let start: number | null = null;
        let end: number | null = null;

        report.logs.forEach((log: string) => {
            const timeMatch = log.match(/^\[(?:(\d{4}-\d{2}-\d{2}) )?(\d{2}):(\d{2}):(\d{2})\]/);
            if (timeMatch) {
                const h = parseInt(timeMatch[2]), m = parseInt(timeMatch[3]), s = parseInt(timeMatch[4]);
                const total = h * 3600 + m * 60 + s;
                if (start === null) start = total;
                end = total;
            }
            if (log.includes('Initializing LLM Provider:')) {
                model = log.split('Initializing LLM Provider:')[1]?.trim().split(' ')[0] || 'Hybrid';
            }
            const urlMatch = log.match(/Source: (https?:\/\/[^\s]+)/);
            if (urlMatch) sources.add(urlMatch[1]);
        });

        const duration = start !== null && end !== null ? (end >= start ? end - start : (86400 - start) + end) : 0;
        return { sources: sources.size, model, time: `${duration}s` };
    };

    return (
        <div className="max-w-7xl mx-auto">
            <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-white/40 mb-2">Operations Center</h2>
                    <p className="text-gray-400 font-medium">Monitoring autonomous research cycles and briefing status.</p>
                </div>
                <div className="flex items-center gap-2 px-6 py-2 bg-white/5 rounded-full border border-white/10 min-w-[140px] justify-center">
                    <div className={`w-2 h-2 rounded-full ${status === 'Idle' ? 'bg-green-500' : 'bg-accent animate-pulse'}`}></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                        {status === 'Idle' ? 'System Idle' : 'Analysis Live'}
                    </span>
                </div>
            </header>

            <AnimatePresence>
                {status !== 'Idle' && (
                    <motion.div
                        initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                        animate={{ height: "auto", opacity: 1, marginBottom: 32 }}
                        exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center gap-4 backdrop-blur-md">
                            <div className="flex items-center gap-1">
                                <span className="w-1 h-1 bg-primary rounded-full animate-ping"></span>
                                <span className="w-1 h-1 bg-primary rounded-full animate-ping delay-100"></span>
                                <span className="w-1 h-1 bg-primary rounded-full animate-ping delay-200"></span>
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest text-primary/80">Active Lead:</span>
                            <span className="text-sm font-medium text-gray-300 truncate font-mono">
                                {status}
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {/* Status Cards */}
                <div className="bg-surface/50 p-8 rounded-2xl border border-white/10 backdrop-blur-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Activity size={80} />
                    </div>
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-6">System Engine</h3>
                    <button
                        onClick={handleGenerate}
                        disabled={generating || status !== 'Idle'}
                        className="w-full py-4 bg-primary hover:bg-primary/90 text-white font-black rounded-xl flex items-center justify-center gap-3 shadow-lg shadow-primary/20 transition-all disabled:opacity-30 disabled:grayscale"
                    >
                        {status !== 'Idle' ? <Loader2 className="animate-spin" /> : <Play fill="currentColor" size={20} />}
                        {status !== 'Idle' ? 'Analyst Working...' : 'Trigger Analysis'}
                    </button>
                    {message && <p className="mt-4 text-xs text-center text-accent font-medium">{message}</p>}
                </div>

                <div className="bg-surface/50 p-8 rounded-2xl border border-white/10 backdrop-blur-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Clock size={80} />
                    </div>
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Next Scheduled</h3>
                    <p className="text-3xl font-black text-white">{nextRun || "..."}</p>
                    <p className="text-xs text-gray-500 font-bold uppercase mt-4 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/40"></span>
                        Routine Briefing Logic
                    </p>
                </div>

                <div className="bg-surface/50 p-8 rounded-2xl border border-white/10 backdrop-blur-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Globe size={80} />
                    </div>
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Active Intelligence</h3>
                    <p className="text-3xl font-black text-white">{reports.length}</p>
                    <p className="text-xs text-gray-500 font-bold uppercase mt-4 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500/40"></span>
                        Stored Briefings
                    </p>
                </div>
            </div>

            <div className="bg-surface/30 rounded-3xl border border-white/10 overflow-hidden backdrop-blur-sm">
                <div className="p-8 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <ArrowRight size={20} />
                        </div>
                        <h3 className="text-2xl font-black">Latest Briefings</h3>
                    </div>
                    <Link to="/reports" className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-primary transition-colors flex items-center gap-1">
                        Full Archive <ChevronRight size={14} />
                    </Link>
                </div>

                <div className="divide-y divide-white/5">
                    <AnimatePresence mode="popLayout">
                        {reports.length > 0 ? reports.slice(0, 4).map((report, i) => {
                            const meta = parseMeta(report);
                            return (
                                <motion.div
                                    key={report.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="p-8 hover:bg-white/[0.03] transition-all group"
                                >
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                        <div className="flex-1">
                                            <Link to={`/reports/${report.id}`} className="text-xl font-bold group-hover:text-primary transition-colors block mb-2">
                                                {report.title}
                                            </Link>
                                            <div className="flex flex-wrap items-center gap-4">
                                                <div className="flex items-center gap-1.5 py-1 px-3 bg-white/5 rounded-full border border-white/5 text-[11px] font-bold text-gray-400">
                                                    <Globe size={12} className="text-primary" />
                                                    {meta.sources} Sources
                                                </div>
                                                <div className="flex items-center gap-1.5 py-1 px-3 bg-white/5 rounded-full border border-white/5 text-[11px] font-bold text-gray-400">
                                                    <Cpu size={12} className="text-purple-400" />
                                                    {meta.model}
                                                </div>
                                                <div className="flex items-center gap-1.5 py-1 px-3 bg-white/5 rounded-full border border-white/5 text-[11px] font-bold text-gray-400">
                                                    <Timer size={12} className="text-accent" />
                                                    {meta.time}
                                                </div>
                                                <span className="text-[11px] text-gray-600 font-bold uppercase tracking-wider ml-auto lg:ml-0">
                                                    {new Date(report.generated_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>

                                        <Link
                                            to={`/reports/${report.id}`}
                                            className="px-6 py-3 bg-white/5 hover:bg-primary text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 group-hover:shadow-lg group-hover:shadow-primary/20"
                                        >
                                            View Report
                                            <ArrowRight size={14} />
                                        </Link>
                                    </div>
                                </motion.div>
                            );
                        }) : (
                            <div className="p-20 text-center">
                                <Activity className="mx-auto text-gray-800 mb-4" size={48} />
                                <p className="text-gray-500 font-medium">No intelligence gathered yet.</p>
                                <button onClick={handleGenerate} className="mt-4 text-primary font-bold hover:underline">Initiate First Cycle</button>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

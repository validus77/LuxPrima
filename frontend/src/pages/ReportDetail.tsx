import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';
import { api, Report } from '../lib/api';
import {
    ArrowLeft,
    Calendar,
    ChevronDown,
    ChevronUp,
    Download,
    Copy,
    Share2,
    Terminal,
    Globe,
    Cpu,
    Timer
} from 'lucide-react';

export const ReportDetail = () => {
    const { id } = useParams<{ id: string }>();
    const [report, setReport] = useState<Report | null>(null);
    const [loading, setLoading] = useState(true);
    const [logsOpen, setLogsOpen] = useState(false);
    const [sourcesOpen, setSourcesOpen] = useState(false);

    const metadata = useMemo(() => {
        if (!report?.logs) return { source_count: 0, model_used: 'Hybrid Engine', generation_time: '0.0', startDate: null, source_list: [] };

        const sources = new Set<string>();
        let model = 'Hybrid Engine';
        let startTime: number | null = null;
        let endTime: number | null = null;
        let startDate: Date | null = null;

        report.logs.forEach((log, index) => {
            // Extract Time [YYYY-MM-DD HH:MM:SS] or [HH:MM:SS]
            const fullTimeMatch = log.match(/^\[(\d{4}-\d{2}-\d{2}) (\d{2}):(\d{2}):(\d{2})\]/);
            const shortTimeMatch = log.match(/^\[(\d{2}):(\d{2}):(\d{2})\]/);

            if (index === 0 && fullTimeMatch) {
                startDate = new Date(`${fullTimeMatch[1]}T${fullTimeMatch[2]}:${fullTimeMatch[3]}:${fullTimeMatch[4]}`);
            }

            const timeMatch = fullTimeMatch || shortTimeMatch;
            if (timeMatch) {
                const hourIdx = fullTimeMatch ? 2 : 1;
                const minIdx = fullTimeMatch ? 3 : 2;
                const secIdx = fullTimeMatch ? 4 : 3;

                const secs = parseInt(timeMatch[hourIdx]) * 3600 + parseInt(timeMatch[minIdx]) * 60 + parseInt(timeMatch[secIdx]);
                if (startTime === null) startTime = secs;
                endTime = secs;
            }

            // Extract Model
            if (log.includes('Initializing LLM Provider:')) {
                const m = log.split('Initializing LLM Provider:')[1]?.trim();
                if (m) model = m;
            }

            // Extract Sources
            // Matches "Processing Source: url" or "Processing Secondary Source: url" or "Source: url"
            const urlMatch = log.match(/Source: (https?:\/\/[^\s]+)/);
            if (urlMatch) {
                sources.add(urlMatch[1]);
            }
        });

        let duration = 0;
        if (startTime !== null && endTime !== null) {
            duration = endTime >= startTime ? endTime - startTime : (86400 - startTime) + endTime;
        }

        return {
            source_count: sources.size || (report.content_json?.source_count || 0),
            model_used: model !== 'Hybrid Engine' ? model : (report.content_json?.model_used || 'Hybrid Engine'),
            generation_time: duration > 0 ? duration.toFixed(1) : (report.content_json?.generation_time || '0.0'),
            startDate,
            source_list: Array.from(sources)
        };
    }, [report]);

    useEffect(() => {
        if (id) {
            api.getReport(parseInt(id)).then(setReport).finally(() => setLoading(false));
        }
    }, [id]);

    if (loading) return (
        <div className="flex items-center justify-center h-[60vh]">
            <div className="flex flex-col items-center gap-4 text-gray-400">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <p className="font-medium animate-pulse">Loading Briefing...</p>
            </div>
        </div>
    );

    if (!report) return (
        <div className="text-center py-12">
            <h3 className="text-2xl font-bold text-gray-500">Report not found</h3>
            <Link to="/reports" className="mt-4 text-primary hover:underline inline-block">Return to History</Link>
        </div>
    );

    return (
        <div className="relative">
            <div className="flex flex-col lg:flex-row gap-8 items-start">

                {/* LEFT SIDEBAR: Meta & Logs */}
                <aside className="w-full lg:w-72 space-y-6 lg:sticky lg:top-8">
                    <Link to="/reports" className="group flex items-center text-gray-400 hover:text-white mb-6 transition-colors">
                        <ArrowLeft size={18} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                        Back to History
                    </Link>

                    {/* Metadata Card */}
                    <div className="bg-surface/50 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Briefing Status</h4>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-gray-300">
                                <div className="p-2 bg-white/5 rounded-lg text-primary">
                                    <Calendar size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase font-bold">Generated</p>
                                    <p className="text-sm font-medium">{(metadata.startDate || new Date(report.generated_at)).toLocaleDateString()}</p>
                                    <p className="text-[11px] text-gray-500 leading-none">{(metadata.startDate || new Date(report.generated_at)).toLocaleTimeString()}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-gray-300">
                                <div className="p-2 bg-white/5 rounded-lg text-green-500">
                                    <Globe size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase font-bold">Research Scope</p>
                                    <p className="text-sm font-medium">{metadata.source_count} Sources Processed</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-gray-300">
                                <div className="p-2 bg-white/5 rounded-lg text-accent">
                                    <Cpu size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase font-bold">Intelligence</p>
                                    <p className="text-sm font-medium leading-tight">{metadata.model_used}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-gray-300">
                                <div className="p-2 bg-white/5 rounded-lg text-yellow-500">
                                    <Timer size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase font-bold">Latency</p>
                                    <p className="text-sm font-medium">{metadata.generation_time}s Processing</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Collapsible Logs */}
                    {report.logs && report.logs.length > 0 && (
                        <div className="bg-surface/50 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md transition-all">
                            <button
                                onClick={() => setLogsOpen(!logsOpen)}
                                className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                            >
                                <div className="flex items-center gap-2 text-gray-400">
                                    <Terminal size={16} />
                                    <span className="text-xs font-bold uppercase tracking-wider">Execution Log</span>
                                </div>
                                {logsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>

                            <AnimatePresence>
                                {logsOpen && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <div className="p-4 pt-0">
                                            <div className="bg-black/40 rounded-xl p-4 font-mono text-[11px] text-gray-400 space-y-1 max-h-[400px] overflow-y-auto custom-scrollbar border border-white/5">
                                                {report.logs.map((log, i) => (
                                                    <div key={i} className="pb-1 mb-1 border-b border-white/5 last:border-0 opacity-80 hover:opacity-100 transition-opacity">
                                                        {log}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </aside>

                {/* CENTER CONTENT: The Report */}
                <main className="flex-1 bg-surface/30 border border-white/5 rounded-[2rem] p-8 lg:p-12 shadow-2xl">
                    <header className="mb-12 border-b border-white/10 pb-10 text-center lg:text-left">
                        <div className="mb-4 flex flex-col items-center lg:items-start gap-4">
                            <h1 className="text-4xl lg:text-5xl font-extrabold bg-gradient-to-br from-white via-white to-gray-500 bg-clip-text text-transparent leading-[1.15]">
                                {report.title}
                            </h1>
                        </div>
                    </header>

                    <article className="prose prose-invert lg:prose-xl max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{report.content_markdown || ''}</ReactMarkdown>
                    </article>
                </main>

                {/* RIGHT SIDEBAR: Actions */}
                <aside className="w-full lg:w-60 space-y-6 lg:sticky lg:top-8">
                    <div className="bg-surface/50 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Export Options</h4>
                        <div className="space-y-3">
                            <ActionButton
                                icon={<Download size={16} />}
                                label="Download PDF"
                                onClick={() => window.open(api.getReportPdfUrl(report.id), '_blank')}
                            />
                            <ActionButton icon={<Copy size={16} />} label="Copy Content" onClick={() => {
                                navigator.clipboard.writeText(report.content_markdown || '');
                                alert('Content copied to clipboard');
                            }} />
                            <ActionButton
                                icon={<Share2 size={16} />}
                                label="Share Briefing"
                                onClick={async () => {
                                    const email = prompt("Enter recipient email address:");
                                    if (email) {
                                        try {
                                            const res = await api.shareReport(report.id, email);
                                            if (res.ok) {
                                                alert(`Briefing successfully shared with ${email}`);
                                            } else {
                                                alert(`Failed to share: ${res.detail || 'Unknown error'}`);
                                            }
                                        } catch (e) {
                                            alert("Error connecting to server. Please check your SMTP settings.");
                                        }
                                    }
                                }}
                            />
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-2xl p-6">
                        <p className="text-xs text-primary font-bold uppercase mb-2 tracking-wide">Analyst Note</p>
                        <p className="text-sm text-gray-400 italic font-light leading-relaxed mb-4">
                            This report was autonomously synthesized from primary market sources.
                        </p>

                        {metadata.source_list.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-primary/10">
                                <button
                                    onClick={() => setSourcesOpen(!sourcesOpen)}
                                    className="flex items-center justify-between w-full text-[10px] font-bold uppercase tracking-widest text-primary/60 hover:text-primary transition-colors"
                                >
                                    <span>Research Sources ({metadata.source_list.length})</span>
                                    {sourcesOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                </button>

                                <AnimatePresence>
                                    {sourcesOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <ul className="mt-3 space-y-2">
                                                {metadata.source_list.map((url, i) => (
                                                    <li key={i} className="text-[10px] text-gray-500 font-mono break-all line-clamp-1 hover:line-clamp-none transition-all cursor-default">
                                                        {url}
                                                    </li>
                                                ))}
                                            </ul>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </aside>
            </div>
        </div>
    );
};

const ActionButton = ({ icon, label, onClick, disabled }: { icon: any, label: string, onClick?: () => void, disabled?: boolean }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 disabled:opacity-30 disabled:cursor-not-allowed group transition-all"
    >
        <div className="flex items-center gap-3 text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
            {icon}
            {label}
        </div>
    </button>
);

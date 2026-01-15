import React, { useEffect, useState } from 'react';
import { Save, Calendar, Mail, Sliders, Cpu, Activity, Info } from 'lucide-react';
import { api } from '../lib/api';
import { motion } from 'framer-motion';

export const Settings = () => {
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [localModels, setLocalModels] = useState<string[]>([]);

    useEffect(() => {
        api.getSettings()
            .then((data) => {
                if (!data) throw new Error("Empty settings received");
                setSettings(data);
            })
            .catch((err) => {
                console.error("Failed to load settings:", err);
                setError("Failed to connect to backend settings API.");
            })
            .finally(() => setLoading(false));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const updates = Object.entries(settings).map(([key, value]) => ({ key, value: String(value) }));
        await api.saveSettings(updates);
        setSaving(false);
    };

    const handleChange = (key: string, value: string) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    if (loading) return (
        <div className="flex items-center justify-center h-[60vh]">
            <Activity className="animate-spin text-primary" size={32} />
        </div>
    );

    if (error) return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <Activity className="text-red-500 mb-4" size={48} />
            <h2 className="text-xl font-bold mb-2">Setup Required</h2>
            <p className="text-gray-400 mb-6">{error}</p>
            <button onClick={() => window.location.reload()} className="px-6 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all text-sm font-bold">
                Retry Connection
            </button>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto pb-20">
            <header className="mb-12">
                <h2 className="text-4xl font-black tracking-tight mb-2">System Configuration</h2>
                <p className="text-gray-400 font-medium">Manage your intelligence engine and delivery protocols.</p>
            </header>

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* LLM Integration Card */}
                    <div className="bg-surface/50 backdrop-blur-md p-8 rounded-3xl border border-white/10 flex flex-col h-full group">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-accent/10 rounded-2xl">
                                <Cpu className="text-accent" size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">Intelligence Engine</h3>
                                <p className="text-xs text-gray-400">Configure LLM providers and models</p>
                            </div>
                        </div>

                        <div className="space-y-6 flex-grow">
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Core Provider</label>
                                    <select
                                        className="w-full bg-background/50 border border-white/10 rounded-xl px-4 py-3 focus:border-accent outline-none appearance-none transition-all"
                                        value={settings['llm_provider'] || 'openai'}
                                        onChange={e => handleChange('llm_provider', e.target.value)}
                                    >
                                        <option value="openai">OpenAI (GPT-4o)</option>
                                        <option value="gemini">Google Gemini 1.5</option>
                                        <option value="local">Local Instance (Llama.cpp)</option>
                                    </select>
                                </div>

                                {settings['llm_provider'] === 'local' ? (
                                    <>
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Endpoint URL</label>
                                            <input
                                                type="text"
                                                className="w-full bg-background/50 border border-white/10 rounded-xl px-4 py-3 focus:border-accent outline-none"
                                                value={settings['llm_base_url'] || ''}
                                                placeholder="http://host.docker.internal:8080/v1"
                                                onChange={e => handleChange('llm_base_url', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500">Target Model</label>
                                                <button
                                                    type="button"
                                                    onClick={async () => {
                                                        const baseUrl = settings['llm_base_url'];
                                                        if (!baseUrl) return; // Prevent fetch if empty
                                                        const res = await fetch(`/api/settings/local-models?base_url=${encodeURIComponent(baseUrl)}`);
                                                        const data = await res.json();
                                                        if (data.models) setLocalModels(data.models);
                                                    }}
                                                    className="text-[10px] font-bold text-primary hover:text-white uppercase tracking-tighter"
                                                >
                                                    Sync Models
                                                </button>
                                            </div>
                                            {localModels.length > 0 ? (
                                                <select
                                                    className="w-full bg-background/50 border border-white/10 rounded-xl px-4 py-3 focus:border-accent outline-none appearance-none"
                                                    value={settings['llm_model'] || ''}
                                                    onChange={e => handleChange('llm_model', e.target.value)}
                                                >
                                                    {localModels.map(m => <option key={m} value={m}>{m}</option>)}
                                                </select>
                                            ) : (
                                                <input
                                                    type="text"
                                                    className="w-full bg-background/50 border border-white/10 rounded-xl px-4 py-3 focus:border-accent outline-none"
                                                    value={settings['llm_model'] || ''}
                                                    onChange={e => handleChange('llm_model', e.target.value)}
                                                    placeholder="e.g. llama-3-8b"
                                                />
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Environment Secret</label>
                                            <input
                                                type="password"
                                                className="w-full bg-background/50 border border-white/10 rounded-xl px-4 py-3 focus:border-accent outline-none"
                                                value={settings['llm_api_key'] || ''}
                                                onChange={e => handleChange('llm_api_key', e.target.value)}
                                                placeholder="••••••••••••••••"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Deployment Model</label>
                                            <input
                                                type="text"
                                                className="w-full bg-background/50 border border-white/10 rounded-xl px-4 py-3 focus:border-accent outline-none"
                                                value={settings['llm_model'] || ''}
                                                onChange={e => handleChange('llm_model', e.target.value)}
                                                placeholder={settings['llm_provider'] === 'gemini' ? "gemini-1.5-pro" : "gpt-4o"}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* SMTP Configuration Card */}
                    <div className="bg-surface/50 backdrop-blur-md p-8 rounded-3xl border border-white/10 flex flex-col h-full">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-primary/10 rounded-2xl">
                                <Mail className="text-primary" size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">Email Protocols</h3>
                                <p className="text-xs text-gray-400">Outbound SMTP and stream settings</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow">
                            <div className="md:col-span-1">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Host</label>
                                <input
                                    type="text"
                                    className="w-full bg-background/50 border border-white/10 rounded-xl px-4 py-3 focus:border-primary outline-none"
                                    value={settings['smtp_host'] || ''}
                                    onChange={e => handleChange('smtp_host', e.target.value)}
                                    placeholder="smtp.service.com"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Port</label>
                                <input
                                    type="text"
                                    className="w-full bg-background/50 border border-white/10 rounded-xl px-4 py-3 focus:border-primary outline-none"
                                    value={settings['smtp_port'] || '587'}
                                    onChange={e => handleChange('smtp_port', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Username</label>
                                <input
                                    type="text"
                                    className="w-full bg-background/50 border border-white/10 rounded-xl px-4 py-3 focus:border-primary outline-none"
                                    value={settings['smtp_user'] || ''}
                                    onChange={e => handleChange('smtp_user', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Password</label>
                                <input
                                    type="password"
                                    className="w-full bg-background/50 border border-white/10 rounded-xl px-4 py-3 focus:border-primary outline-none"
                                    value={settings['smtp_pass'] || ''}
                                    onChange={e => handleChange('smtp_pass', e.target.value)}
                                    placeholder="••••••••"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Stream Identifier</label>
                                <input
                                    type="text"
                                    className="w-full bg-background/50 border border-white/10 rounded-xl px-4 py-3 focus:border-primary outline-none"
                                    value={settings['smtp_stream'] || ''}
                                    onChange={e => handleChange('smtp_stream', e.target.value)}
                                    placeholder="e.g. outbound-reports"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Strategy Parameters Card */}
                    <div className="bg-surface/50 backdrop-blur-md p-8 rounded-3xl border border-white/10 lg:col-span-2">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="p-3 bg-white/5 rounded-2xl">
                                <Sliders className="text-white" size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">Intelligence Strategy</h3>
                                <p className="text-xs text-gray-400">Fine-tune recursive research Depth and Breadth</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-bold tracking-tight">Research Breadth</label>
                                    <span className="bg-primary/20 text-primary text-xs font-black px-2 py-1 rounded-md">{settings['research_breadth'] || '3'}</span>
                                </div>
                                <input
                                    type="range"
                                    min="1"
                                    max="10"
                                    className="w-full accent-primary"
                                    value={settings['research_breadth'] || '3'}
                                    onChange={e => handleChange('research_breadth', e.target.value)}
                                />
                                <div className="flex items-start gap-2 text-[10px] text-gray-500 italic uppercase font-bold tracking-wider">
                                    <Info size={12} className="mt-0.5" />
                                    <span>Number of unique leads generated per research layer. Higher values increase coverage but slow down analysis.</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-bold tracking-tight">Autonomous Depth</label>
                                    <span className="bg-accent/20 text-accent text-xs font-black px-2 py-1 rounded-md">{settings['research_depth'] || '1'}</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="5"
                                    className="w-full accent-accent"
                                    value={settings['research_depth'] || '1'}
                                    onChange={e => handleChange('research_depth', e.target.value)}
                                />
                                <div className="flex items-start gap-2 text-[10px] text-gray-500 italic uppercase font-bold tracking-wider">
                                    <Info size={12} className="mt-0.5" />
                                    <span>Number of recursive "hops" the analyst takes. 0 limits to primary source only.</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Floating Action Bar */}
                <div className="fixed bottom-8 right-12 flex items-center gap-4 z-50">
                    <motion.button
                        layout
                        type="submit"
                        disabled={saving}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-primary hover:bg-primary/90 text-white px-10 py-5 rounded-2xl font-black flex items-center gap-3 shadow-2xl shadow-primary/40 transition-all disabled:opacity-50"
                    >
                        {saving ? <Activity className="animate-spin" size={20} /> : <Save size={20} />}
                        {saving ? 'UPDATING...' : 'COMMIT CHANGES'}
                    </motion.button>
                </div>
            </form>

            <div className="mt-16 pt-16 border-t border-white/5">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-yellow-500/10 rounded-2xl">
                        <Calendar className="text-yellow-500" size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold">Automation Schedule</h3>
                        <p className="text-xs text-gray-400">Configure recurring briefing generation</p>
                    </div>
                </div>
                <div className="bg-surface/30 rounded-3xl p-8 border border-white/5">
                    <ScheduleManager />
                </div>
            </div>
        </div>
    )
};

const ScheduleManager = () => {
    const [schedules, setSchedules] = useState<{ id: number, time: string }[]>([]);
    const [newTime, setNewTime] = useState("");

    const load = async () => {
        const data = await api.getSchedules();
        setSchedules(Array.isArray(data) ? data : []);
    };
    useEffect(() => { load(); }, []);

    const add = async () => {
        try {
            await api.createSchedule(newTime);
            setNewTime("");
            load();
        } catch (e) { alert("Invalid time format (HH:MM)"); }
    };

    const remove = async (id: number) => {
        if (confirm("Delete schedule?")) {
            await api.deleteSchedule(id);
            load();
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <input
                    type="time"
                    className="bg-background/50 border border-white/10 rounded-xl px-6 py-4 focus:border-yellow-500 outline-none text-white font-mono text-xl"
                    value={newTime}
                    onChange={e => setNewTime(e.target.value)}
                />
                <button
                    onClick={add}
                    className="h-[60px] bg-white/5 hover:bg-white/10 text-white px-8 rounded-xl font-bold transition-all border border-white/5"
                >
                    Add Schedule
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {schedules.map(s => (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={s.id}
                        className="flex items-center justify-between bg-background/30 p-6 rounded-2xl border border-white/5 group"
                    >
                        <span className="font-mono text-2xl font-black text-primary">{s.time}</span>
                        <button
                            onClick={() => remove(s.id)}
                            className="text-red-500/50 hover:text-red-500 text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all"
                        >
                            Remove
                        </button>
                    </motion.div>
                ))}
                {schedules.length === 0 && <p className="text-gray-500 font-medium italic">No autonomous cycles scheduled.</p>}
            </div>
        </div>
    );
};

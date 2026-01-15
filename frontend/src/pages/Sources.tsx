import React, { useEffect, useState } from 'react';
import { api, Source } from '../lib/api';
import { Trash2, Plus, Globe } from 'lucide-react';

export const Sources = () => {
    const [sources, setSources] = useState<Source[]>([]);
    const [newUrl, setNewUrl] = useState('');
    const [newName, setNewName] = useState('');
    const [loading, setLoading] = useState(true);

    const loadSources = async () => {
        try {
            const data = await api.getSources();
            setSources(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSources();
    }, []);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.createSource(newUrl, newName);
            setNewUrl('');
            setNewName('');
            loadSources();
        } catch (e) {
            console.error(e);
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure you want to delete this source?')) {
            await api.deleteSource(id);
            loadSources();
        }
    };

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold">Primary Sources</h2>

            {/* Add Source Form */}
            <div className="bg-surface p-6 rounded-xl border border-white/10">
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <Plus size={20} className="text-primary" />
                    Add New Source
                </h3>
                <form onSubmit={handleAdd} className="flex gap-4">
                    <input
                        type="text"
                        placeholder="Source Name (e.g. BBC News)"
                        className="bg-background border border-white/10 rounded-lg px-4 py-2 flex-1 focus:outline-none focus:border-primary"
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        required
                    />
                    <input
                        type="url"
                        placeholder="https://example.com"
                        className="bg-background border border-white/10 rounded-lg px-4 py-2 flex-[2] focus:outline-none focus:border-primary"
                        value={newUrl}
                        onChange={e => setNewUrl(e.target.value)}
                        required
                    />
                    <button type="submit" className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                        Add Source
                    </button>
                </form>
            </div>

            {/* Sources List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sources.map(source => (
                    <div key={source.id} className="bg-surface p-5 rounded-xl border border-white/10 hover:border-white/20 transition-all group">
                        <div className="flex justify-between items-start mb-3">
                            <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                <Globe size={20} />
                            </div>
                            <button
                                onClick={() => handleDelete(source.id)}
                                className="text-gray-500 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                        <h4 className="font-bold text-lg mb-1">{source.name || "Unknown Source"}</h4>
                        <a href={source.url} target="_blank" rel="noreferrer" className="text-sm text-gray-400 hover:text-accent truncate block">
                            {source.url}
                        </a>
                        <div className="mt-4 flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${source.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span className="text-xs text-gray-500 uppercase tracking-wider">{source.is_active ? 'Active' : 'Inactive'}</span>
                        </div>
                    </div>
                ))}

                {sources.length === 0 && !loading && (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        No sources added yet. Add some to get started.
                    </div>
                )}
            </div>
        </div>
    )
};

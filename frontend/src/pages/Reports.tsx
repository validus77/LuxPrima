
import React, { useEffect, useState } from 'react';
import { api, Report } from '../lib/api';
import { Link } from 'react-router-dom';
import { FileText, Calendar, Trash2 } from 'lucide-react';

export const Reports = () => {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);

    const loadReports = async () => {
        try {
            const data = await api.getReports();
            setReports(Array.isArray(data) ? data : []);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReports();
    }, []);

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.preventDefault(); // Prevent navigation
        if (confirm('Are you sure you want to delete this report?')) {
            await api.deleteReport(id);
            loadReports();
        }
    };

    return (
        <div>
            <h2 className="text-3xl font-bold mb-8">Report History</h2>

            <div className="grid gap-4">
                {reports.map(report => (
                    <Link key={report.id} to={`/reports/${report.id}`} className="block">
                        <div className="bg-surface p-6 rounded-xl border border-white/10 hover:border-primary/50 transition-all hover:translate-x-1 group">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{report.title}</h3>
                                    <div className="flex items-center text-gray-400 text-sm gap-4">
                                        <span className="flex items-center gap-1">
                                            <Calendar size={14} />
                                            {new Date(report.generated_at).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={(e) => handleDelete(e, report.id)}
                                        className="text-gray-500 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-white/5 opacity-0 group-hover:opacity-100"
                                        title="Delete Report"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                    <FileText className="text-gray-600 group-hover:text-primary transition-colors" size={24} />
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {reports.length === 0 && !loading && (
                <p className="text-gray-500 text-center py-12">No reports generated yet.</p>
            )}
        </div>
    )
};

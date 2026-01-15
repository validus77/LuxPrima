// CRITICAL: Use purely relative paths to "lock" the frontend to the server origin.
// This ensures it NEVER communicates with your local dev box once deployed.

// Allow manual override via public/config.js
const manualConfig = (window as any).LUX_PRIMA_CONFIG;
const API_URL = manualConfig?.API_BASE_URL || "/api";

console.log("%c LuxPrima Engine Initializing ", "background: #6366f1; color: white; font-weight: bold;");
if (manualConfig?.API_BASE_URL) {
    console.log("⚠️ USING MANUAL API OVERRIDE:", API_URL);
} else {
    console.log("API Endpoint Target:", window.location.origin + API_URL);
}

export interface Source {
    id: number;
    url: string;
    name: string | null;
    is_active: boolean;
    created_at: string;
}

export interface Report {
    id: number;
    title: string;
    generated_at: string;
    content_markdown?: string;
    content_json?: any;
    logs?: string[];
}

export const api = {
    getSources: async (): Promise<Source[]> => {
        const res = await fetch(`${API_URL}/sources/`);
        return res.json();
    },

    createSource: async (url: string, name: string) => {
        const res = await fetch(`${API_URL}/sources/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, name, is_active: true, source_type: 'primary' })
        });
        if (!res.ok) throw new Error('Failed to create source');
        return res.json();
    },

    deleteSource: async (id: number) => {
        const res = await fetch(`${API_URL}/sources/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete source');
        return res.json();
    },

    getReports: async (): Promise<Report[]> => {
        const res = await fetch(`${API_URL}/reports/`);
        return res.json();
    },

    getReport: async (id: number): Promise<Report> => {
        const res = await fetch(`${API_URL}/reports/${id}`);
        return res.json();
    },

    generateReport: async () => {
        const res = await fetch(`${API_URL}/reports/generate`, { method: 'POST' });
        return res.json();
    },

    fetchLocalModels: async (baseUrl: string) => {
        const res = await fetch(`${API_URL}/settings/local-models?base_url=${encodeURIComponent(baseUrl)}`);
        if (!res.ok) throw new Error('Failed to fetch models');
        return res.json();
    },

    getStatus: async () => (await fetch(`${API_URL}/reports/status`)).json(),

    deleteReport: async (id: number) => {
        const res = await fetch(`${API_URL}/reports/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete report');
        return res.json();
    },

    getSchedules: async () => (await fetch(`${API_URL}/schedules/`)).json(),

    createSchedule: async (time: string) => {
        const res = await fetch(`${API_URL}/schedules/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ time, is_active: true })
        });
        if (!res.ok) throw new Error('Invalid time or server error');
        return res.json();
    },

    deleteSchedule: async (id: number) => {
        const res = await fetch(`${API_URL}/schedules/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to create schedule');
        return res.json();
    },

    getNextRun: async () => (await fetch(`${API_URL}/schedules/next-run`)).json(),

    checkHealth: async () => {
        try {
            // Use current origin to force the browser to talk to the server that served it
            // No trailing slash to avoid potential 307 redirects
            const res = await fetch(`${API_URL}?t=${Date.now()}`);
            if (!res.ok) return null;
            return await res.json();
        } catch (e) {
            console.error("Health check network error:", e);
            return null;
        }
    },

    checkLlamaHealth: async (baseUrl: string) => {
        try {
            const res = await fetch(`${baseUrl}/health`);
            const data = await res.json();
            return data.status === "ok" || res.ok;
        } catch {
            return false;
        }
    },

    getSettings: async () => {
        const res = await fetch(`${API_URL}/settings/`);
        return res.json();
    },

    saveSettings: async (data: { key: string, value: string }[]) => {
        const res = await fetch(`${API_URL}/settings/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return res.json();
    },

    getReportPdfUrl: (reportId: number) => `${API_URL}/reports/${reportId}/pdf`,

    shareReport: async (reportId: number, email: string) => {
        const res = await fetch(`${API_URL}/reports/${reportId}/share`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        return res.json();
    }
};

import { toast } from 'react-toastify';

/**
 * Dynamically resolves the correct Backend API URL across all environments:
 * 1. Explicit environment variable (VITE_API_URL in .env or Vercel dashboard)
 * 2. Mobile on local Wi-Fi / LAN (e.g. 192.168.x.x -> http://192.168.x.x:8080)
 * 3. VS Code Port Forwarding / Dev Tunnels (xxx-5173 -> xxx-8080)
 * 4. Localhost on PC (http://localhost:8080)
 * 5. Production on Vercel (https://veggity-backend.onrender.com)
 */
function resolveApiUrl() {
    // 1. Explicit environment variable takes highest priority
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }

    // 2. Runtime browser detection (Mobile phone, LAN, Port Forwarding, Vercel)
    if (typeof window !== 'undefined' && window.location) {
        const { hostname, protocol } = window.location;

        // A. VS Code Port Forwarding / GitHub Codespaces / Dev Tunnels
        // Example: https://xxxx-5173.inc1.devtunnels.ms -> https://xxxx-8080.inc1.devtunnels.ms
        if (hostname.includes('-5173.')) {
            return `${protocol}//${hostname.replace('-5173.', '-8080.')}`;
        }

        // B. Mobile Phone accessing laptop over local Wi-Fi / LAN (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
        // Uses the laptop's Wi-Fi IP on port 8080 instead of the phone's non-existent localhost
        if (/^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(hostname)) {
            return `http://${hostname}:8080`;
        }

        // C. Standard desktop localhost development
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:8080';
        }

        // D. Production deployment on Vercel or custom domain
        return 'https://veggity-backend.onrender.com';
    }

    return import.meta.env.DEV ? 'http://localhost:8080' : 'https://veggity-backend.onrender.com';
}

let rawUrl = resolveApiUrl();
// Strip whitespace, trailing slashes, and accidental trailing routes
rawUrl = rawUrl.trim().replace(/\/+$/, '').replace(/\/(auth|ping|login|signup|products|orders)$/i, '');

export const API_URL = rawUrl;

export const handleSuccess = (msg) => {
    toast.success(msg, {
        position: 'top-center'
    });
};

export const handleError = (msg) => {
    toast.error(msg, {
        position: 'top-center'
    });
};

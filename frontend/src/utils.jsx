import {toast} from 'react-toastify';

let rawUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8080' : 'https://veggity-backend.onrender.com');
// Strip whitespace, trailing slashes, and accidental trailing routes like /auth or /ping
rawUrl = rawUrl.trim().replace(/\/+$/, '').replace(/\/(auth|ping|login|signup)$/i, '');
export const API_URL = rawUrl;

export const handleSuccess =(msg)=>{
    toast.success(msg,{
        position:'top-center'
    })
}

export const handleError=(msg)=>{
    toast.error(msg,{
        position:'top-center'
    })
}
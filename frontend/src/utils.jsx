import {toast} from 'react-toastify';

const rawUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8080' : 'https://veggity-backend.onrender.com');
export const API_URL = rawUrl.replace(/\/+$/, '');

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
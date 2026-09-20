import {toast} from 'react-toastify';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

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
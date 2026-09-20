import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import './Home.css'
import { handleSuccess } from '../utils';
import { ToastContainer } from 'react-toastify';
function Home() {
const [loggedInUser, setLoggedInUser] = useState('');

useEffect(()=> {
setLoggedInUser(localStorage.getItem('loggedInUser'))
}, [])
const navigate=useNavigate();
const handleLogout =(e)=>{
localStorage.removeItem('token');
localStorage.removeItem('loggedInUser');
  handleSuccess('Logged out successfully');
setTimeout(()=>{

navigate('/login');
},1000)
}

return (
<div>
  <h3>welcome</h3>
<h1>{loggedInUser}</h1>
<button onClick={handleLogout}>Logout</button>
<ToastContainer/>
</div>

)
}
export default Home
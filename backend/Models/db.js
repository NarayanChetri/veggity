const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mongo_uri = process.env.MONGO_URI;

mongoose.connect(mongo_uri)
.then(()=>{
    console.log("MongoDB Connected...");
}).catch((err)=>{
    console.log("couldnt connect",err);
})

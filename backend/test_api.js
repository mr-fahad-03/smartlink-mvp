const { sign } = require('jsonwebtoken');
require('dotenv').config({ path: '/Users/mr-fahad-03/Downloads/Projects/MVP Project/backend/.env' });

const token = sign({ sub: '8ea344c6-b14e-42cd-b782-6a05a7e3e00c' }, process.env.JWT_SECRET || 'supersecret_for_development', { expiresIn: '1h' });
console.log("Token:", token);

fetch('http://localhost:5000/api/experts/dashboard', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(res => res.text())
.then(console.log)
.catch(console.error);

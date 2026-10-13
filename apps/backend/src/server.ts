import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`\n🚀 THOTH Express Backend running at: http://localhost:${PORT}`);
  console.log(`\n📌 Endpoints available for Postman:`);
  console.log(`   GET  http://localhost:${PORT}/api/v1/health`);
  console.log(`   POST http://localhost:${PORT}/api/v1/auth/register`);
  console.log(`   POST http://localhost:${PORT}/api/v1/auth/login`);
  console.log(`   POST http://localhost:${PORT}/api/v1/vector-search`);
  console.log(`   POST http://localhost:${PORT}/api/v1/generate\n`);
});

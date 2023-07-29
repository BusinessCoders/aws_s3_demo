import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

const app = express();

import postsRoutes from './routes/posts.js';

app.use('/post', postsRoutes);


// Start the server on port 4000
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
import { app } from './app.js';
import { connectDatabase } from './config/database.js';
import { env } from './config/env.js';

try {
	await connectDatabase();
} catch {
	console.error('MongoDB connection failed. Check MONGODB_URI and make sure the database is running.');
	process.exit(1);
}
const port = Number(process.env.PORT ?? env.PORT);
app.listen(port, () => console.log(`Lecture Notes API listening on ${port}`));
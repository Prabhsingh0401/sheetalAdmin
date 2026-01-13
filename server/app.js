import app from "./main.js";
import { config } from "./config/config.js";
import connectDB from "./config/db.js";
import { seedAdmin } from "./scripts/seedAdmin.js";

const startServer = async () => {
    try {
        await connectDB();
        await seedAdmin(); 
        
        const PORT = config.port;
        app.listen(PORT, () => {
            console.log(`Server running in ${config.nodeEnv} mode on port ${PORT}`);
        });
    } catch (error) {
        console.error("Database connection failed:", error);
        process.exit(1);
    }
};

startServer();

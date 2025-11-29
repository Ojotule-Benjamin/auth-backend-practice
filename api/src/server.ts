import { config, getApiPath, API_CONFIG } from "@/config/config";
import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { AppError } from "@/utils/AppError";
import { STATUS } from "@/constants/statusCodes";
import { connectDB } from "@/config/connectDB";
import { features } from "@/constants/index";
import authRoutes from "@/routes/auth.route";
import cookieParser from "cookie-parser";

const app = express();

const port = process.env.PORT || 2000;

app.use(express.json()); // Middleware to parse JSON bodies
app.use(cookieParser()); // Middleware to parse cookies

app.get(getApiPath("/features"), (req: Request, res: Response) => {
  return res.status(STATUS.OK).json({
    message: "Features fetched successfully",
    features: features,
  });
});

app.use(getApiPath("/auth"), authRoutes);

app.use((error: AppError, req: Request, res: Response, next: NextFunction) => {
  res.status(error.status || 500).json({
    message: error.message || "An error occurred",
    status: error.status,
    stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
  });
});

// Only start the server if this file is run directly (not imported)
if (require.main === module) {
  app.listen(port, () => {
    connectDB(config.DATABASE_URL || "");
    console.log(
      `Server is running at http://localhost:${port}${API_CONFIG.basePath}/${API_CONFIG.version}`
    );
  });
}

export default app;

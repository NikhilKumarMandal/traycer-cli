import express, { Request, Response } from "express";
// import { globalErrorHandler } from "./common/middleware/globalErrorHandler";
import cookieParser from "cookie-parser";
import { fromNodeHeaders, toNodeHandler } from "better-auth/node";
import cors from "cors";
import { auth } from "./lib/auth";


const app = express();
const port = process.env.PORT ?? 4000;


app.use(
  cors({
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);

app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(cookieParser());
app.use(express.json());



app.get("/api/me", async (req, res) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      return res.status(401).json({ error: "No active session" });
    }

    return res.json(session);
  } catch (error) {
    console.error("Session error:", error);
    return res.status(500).json({ error: "Failed to get session", details: error.message });
  }
});

app.get("/device", async (req, res) => {
  const { user_code } = req.query; // Fixed: should be req.query, not req.params
  res.redirect(`http://localhost:3000/device?user_code=${user_code}`);
});


// app.use(globalErrorHandler);

app.listen(port, () => {
  console.log(`Traycer app listening on port ${port}`);
});

export default app;

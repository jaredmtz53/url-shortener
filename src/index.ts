import express from "express";
import FlakeId from "flake-idgen";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import limiter from "./middleware/rateLimiter.js";
// testing CI/CD pipeline 🚀
// testing CI/CD pipeline 🚀
// testing CI/CD pipeline 🚀


const prisma = new PrismaClient();
dotenv.config();

const flakeIdGen = new FlakeId({
  datacenter: parseInt(process.env.DATACENTER_ID || "1", 10),
  worker: parseInt(process.env.WORKER_ID || "1", 10),
});

import baseX from "base-x";

const BASE62 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const base62 = baseX(BASE62);

const isValidUrl = (str: string): boolean => {
  try {
    new URL(str);
    return true;
  } catch {
    console.error("Invalid URL:", str);
    return false;
  }
};
const app = express();
app.set("trust proxy", 1); // Trust first proxy for rate limiting
const PORT = process.env.PORT;

app.use(express.json());
app.use(limiter);

app.post("/shorten", async (req, res) => {
  const { url } = req.body;

  if (!isValidUrl(url)) {
    return res.status(400).json({ error: "Invalid URL format" });
  }

  const existing = await prisma.url.findUnique({
    where: { longUrl: url },
  });
  if (existing) {
    return res.status(200).json({ shortId: existing.shortId });
  }

  const idBuffer = flakeIdGen.next();
  const shortId = base62.encode(idBuffer);
  await prisma.url.create({
    data: {
      longUrl: url,
      shortId: shortId,
    }
  })
  return res.status(201).json({ message: "URL is valid!" });
});

app.get("/:shortId", async(req,res) =>{
  const {shortId} = req.params;
  const urlEntry = await prisma.url.findUnique({
    where: { shortId: shortId },
  });
  if (!urlEntry) {
    return res.status(404).json({ error: "URL not found" });
  }
  return res.redirect(urlEntry.longUrl);
})

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

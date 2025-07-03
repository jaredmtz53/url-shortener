import express from "express";
import FlakeId from "flake-idgen";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import limiter from "./middleware/rateLimiter.js";
import redis from "./redis/client.js";
const prisma = new PrismaClient();
dotenv.config();
await redis.flushall()
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
await redis.flushall();
app.post("/shorten", async (req, res) => {
  const { url } = req.body;
  // Validate URL format
  if (!isValidUrl(url)) {
    return res.status(400).json({ error: "Invalid URL format" });
  }
  //check if URL already exists
  const existing = await prisma.url.findUnique({ where: { longUrl: url } });
  if (existing) {
    return res.status(200).json({ shortUrl: `/${existing.shortId}` });
  }
  // Otherwise create new short ID
  const idBuffer = flakeIdGen.next();
  const shortId = base62.encode(idBuffer);
  // Save to DB and cache
  await prisma.url.create({ data: { longUrl: url, shortId } });
  
  // Keep only top 1000 entries in sorted set

  return res.status(201).json({ shortUrl: `/${shortId}` });
});

app.get("/:shortId", async (req, res) => {
  const { shortId } = req.params;
  
  

  const urlEntry = await prisma.url.findUnique({
    where: { shortId: shortId },
  });
  if (!urlEntry) {
    return res.status(404).json({ error: "URL not found" });
  }
  await prisma.url.update({
    where: { shortId: shortId },
    data: { clickCount: { increment: 1 } },
  });
  await redis.zincrby("clicks", 1, urlEntry.shortId);

 
  return res.redirect(urlEntry.longUrl);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
//
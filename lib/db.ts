import mongoose from 'mongoose';
import { webcrypto } from 'crypto';

if (typeof globalThis.crypto === 'undefined') {
  (globalThis as any).crypto = webcrypto;
}

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var __mongoose: MongooseCache | undefined;
}

// Use a unique global key to survive Next.js hot-reloads in dev
let cached: MongooseCache = global.__mongoose || { conn: null, promise: null };

if (!global.__mongoose) {
  global.__mongoose = cached;
}

const isLocal = MONGODB_URI.includes('localhost') || MONGODB_URI.includes('127.0.0.1');

export async function connectDB() {
  // Already connected — reuse the connection (fastest path)
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      // For local dev use a single direct connection — no replica-set negotiation overhead
      directConnection: isLocal,
      // Connection pool — keeps sockets alive between requests
      maxPoolSize: isLocal ? 5 : 10,
      minPoolSize: isLocal ? 1 : 2,
      // Fast timeout — fail fast rather than hanging a request
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 5000,
      socketTimeoutMS: 15000,
      // Keep connections alive through OS idle timeouts
      heartbeatFrequencyMS: 30000,
      // Compress wire traffic
      compressors: ['zlib'],
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}

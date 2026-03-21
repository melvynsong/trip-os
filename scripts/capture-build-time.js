#!/usr/bin/env node

/**
 * Capture build timestamp and write to a file
 * Runs before Next.js build
 */

const fs = require('fs');
const path = require('path');

const now = new Date();

// Format: "Mar 21, 2026, 08:45:32 AM +08"
const formattedTime = now.toLocaleString('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  timeZoneName: 'short',
});

// Create the public directory if it doesn't exist
const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Write timestamp to a file
const timestampFile = path.join(publicDir, 'build-timestamp.txt');
fs.writeFileSync(timestampFile, formattedTime, 'utf-8');

console.log(`✓ Build timestamp captured: ${formattedTime}`);

import React from 'react'
// Next.js 13+ custom not-found boundary for app directory
// This file must export a React component (default export)
// that renders a 404 page. Do NOT use a class component or extend anything.

export default function NotFound() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>404 – Page Not Found</h1>
      <p>The page you are looking for does not exist.</p>
    </div>
  );
}

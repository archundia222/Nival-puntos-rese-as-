import type {NextConfig} from "next";
const securityHeaders=[
 {key:"X-Content-Type-Options",value:"nosniff"},
 {key:"Referrer-Policy",value:"strict-origin-when-cross-origin"},
 {key:"X-Frame-Options",value:"DENY"},
 {key:"Permissions-Policy",value:"camera=(self), microphone=(), geolocation=(), payment=()"},
 {key:"Cross-Origin-Opener-Policy",value:"same-origin"},
 {key:"Content-Security-Policy",value:"default-src 'self'; base-uri 'self'; frame-ancestors 'none'; object-src 'none'; form-action 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; connect-src 'self' https://challenges.cloudflare.com https://*.neon.tech https://*.sentry.io; upgrade-insecure-requests"}
];
const config:NextConfig={async headers(){return [{source:"/:path*",headers:securityHeaders}]}};
export default config;

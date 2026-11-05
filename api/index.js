// Single-project deployment: the API runs as a serverless function next to the website.
// (Deploying `server` as its own project uses server/api/index.js directly.)
export { default } from '../server/api/index.js';

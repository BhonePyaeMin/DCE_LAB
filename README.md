# DCE Lab

<p align="center">
  <img src="./DCE%20LAB.png" alt="DCE Lab Logo" width="220" />
</p>

### Laboratory & Equipment Management System

A centralized laboratory management platform designed for the Digital and Communication Engineering (DCE) department. DCE Lab simplifies equipment borrowing, inventory tracking, and laboratory operations through a modern web-based system.

---

## 1. Project Overview

**DCE Lab** is a web-based Laboratory Management System that helps students, lecturers, lab assistants, and laboratory administrators manage laboratory resources efficiently.

The platform provides a centralized environment where users can borrow equipment, track pick-up and return dates, monitor availability, and report equipment issues.

The goal is to reduce manual administrative work, improve resource utilization, and create a more organized laboratory environment.

### Core Objectives

- Digitalize equipment borrowing and returning.
- Manage laboratory equipment and inventory.
- Track equipment borrowing and returning.
- Improve transparency of resource availability.
- Simplify laboratory administration.
- Provide real-time operational insights.

---

## 2. Technology Stack

DCE Lab uses the MERN Stack with a modular architecture.

| Technology | Purpose |
|---|---|
| MongoDB | Database |
| Express.js | Backend framework |
| React.js | Frontend framework |
| Node.js | Backend runtime |
| Tailwind CSS | UI styling |
| JavaScript (ES6+) | Application development |
| Socket.IO | Real-time updates |
| JWT | Authentication |
| Cloudinary / Storage Provider | Image and document storage |
| Framer Motion | UI animations |
| Lucide React | Icon library |

### Architecture

```text
                  DCE LAB
                     |
          React.js Frontend
                     |
              REST API / Socket.IO
                     |
             Express.js Server
                     |
                Node.js
                     |
                 MongoDB
```

---

## 3. User Roles & Permissions

The system supports four user roles. Laboratory room booking is intentionally not part of DCE Lab: the
university already handles it, so the calendar covers equipment pick-ups and returns only.

### Student

- Browse available equipment (every item has a photo).
- Submit equipment borrowing requests.
- Track borrowing and returning status on the borrowing calendar.
- Report damaged or malfunctioning equipment.
- View borrowing history.

### Lecturer

- Browse and borrow equipment for teaching.
- Monitor student equipment usage.
- Report laboratory issues.
- View analytics and availability.

### Lab Assistant

Runs the laboratory counter day to day.

- Approve or reject borrowing requests.
- Check equipment out and process returns.
- Manage damaged equipment reports and repair status.
- Monitor overdue equipment and scan QR labels.
- View analytics and reports.
- Cannot manage users, edit the inventory, delete records or view the audit log.

### Laboratory Administrator

- Everything a lab assistant can do.
- Manage laboratories and the equipment inventory (including photos).
- Manage users, roles and permissions (including creating lab assistant accounts).
- Export reports and view the audit log.

---

## 4. Core Features

### 4.1 Dashboard

A centralized dashboard displaying important laboratory information.

- Total laboratories.
- Total equipment items.
- Available equipment.
- Currently borrowed equipment.
- Pending borrowing requests.
- Upcoming pick-ups and returns.
- Recent activities.
- Equipment condition overview.

### 4.2 Borrowing Calendar

A calendar of equipment pick-ups and returns.

- Monthly view with pick-up, return-due and returned markers.
- Day panel listing the items, quantities and statuses.
- Filter by pick-up, returns due or returned.
- Students and lecturers see their own items; lab staff see everyone's.

### 4.3 Equipment Management

A centralized equipment inventory system.

- Register new equipment (a photo is required).
- Edit equipment information.
- Assign equipment categories.
- Track equipment quantity.
- Generate unique equipment IDs.
- Search and filter inventory.
- Monitor equipment conditions.

Example equipment categories:

- Computers and Laptops
- Arduino and ESP32
- Networking Equipment
- Cameras and Photography
- VR and AR Devices
- Sensors and Electronic Components
- Laboratory Tools

### 4.4 Equipment Borrowing

A digital equipment borrowing and returning workflow.

1. Students browse available equipment.
2. Students submit borrowing requests.
3. Administrators review requests.
4. Approved equipment can be collected.
5. The system records the borrowing transaction.
6. Students return equipment.
7. Administrators verify the returned equipment condition.

Borrowing statuses:

- Pending
- Approved
- Rejected
- Borrowed
- Returned
- Overdue
- Damaged

### 4.5 QR Code Integration

Each equipment item can have a unique QR code.

- Scan QR codes to identify equipment.
- View equipment information.
- Check current availability.
- Verify borrowing records.
- Simplify equipment check-in and check-out.

### 4.6 Maintenance & Damage Reports

A maintenance reporting module for laboratory operations.

- Submit equipment damage reports.
- Upload supporting images.
- Record maintenance descriptions.
- Assign maintenance status.
- Track repair progress.
- Maintain equipment maintenance history.

Maintenance statuses:

- Reported
- Under Review
- In Progress
- Resolved
- Unrepairable

### 4.7 Notifications

Real-time notifications for important system activities.

- Borrowing request updates.
- Pick-up reminders for approved requests.
- Equipment return reminders.
- Overdue equipment notifications.
- Maintenance status updates.

### 4.8 Analytics & Reports

Provide useful insights into laboratory operations.

- Equipment utilization.
- Laboratory booking statistics.
- Borrowing history.
- Overdue equipment reports.
- Equipment maintenance history.
- Monthly activity reports.

---

## 5. UI / UX Design Guidelines

DCE Lab should provide a clean, modern, professional, and functional interface.

### Typography

**Primary Font: DM Sans**

Use DM Sans throughout the application.

- Headings: DM Sans SemiBold / Bold
- Body: DM Sans Regular
- Buttons: DM Sans Medium
- Labels: DM Sans Medium

### Design Principles

- Minimal and clean interface.
- Consistent spacing and alignment.
- Clear visual hierarchy.
- Responsive layouts.
- Accessible color contrast.
- Minimal decorative elements.
- Avoid unnecessary gradients and visual effects.
- Avoid excessive rounded corners.
- Prioritize usability over decoration.

### Icon Guidelines

Use **Lucide React** as the primary icon library.

| Purpose | Icon |
|---|---|
| Dashboard | LayoutDashboard |
| Laboratory | FlaskConical |
| Equipment | Package |
| Calendar | CalendarDays |
| Borrowing | ClipboardList |
| Users | Users |
| Notifications | Bell |
| Settings | Settings |
| Analytics | ChartNoAxesCombined |
| Maintenance | Wrench |

Rules:

- Use icons instead of emojis.
- Maintain consistent icon sizes.
- Use simple, recognizable icons.
- Avoid mixing multiple icon libraries.

### Emoji Restrictions

Emoji usage should be strictly limited.

- Do not use emojis as interface icons.
- Do not use emojis in navigation menus.
- Do not use emojis in buttons.
- Do not use emojis as status indicators.
- Use Lucide icons and proper status badges instead.

---

## 6. JavaScript Animations

Animations are an essential part of the DCE Lab user experience.

Use Framer Motion to implement meaningful and smooth interactions.

### Required Animations

**Page Transitions**
- Smooth page entrance and exit.
- Subtle opacity and position transitions.

**Dashboard**
- Animated statistic counters.
- Staggered card appearances.
- Smooth chart rendering.

**Navigation**
- Active navigation indicator.
- Sidebar expand and collapse.
- Smooth dropdown interactions.

**Interactions**
- Button hover and tap feedback.
- Modal entrance and exit.
- Toast notification animations.
- Loading and skeleton transitions.

**Data Updates**
- Smooth status transitions.
- Animated list updates.
- Real-time notification appearance.

### Animation Principles

- Keep animations subtle and professional.
- Avoid excessive movement.
- Avoid unnecessary looping animations.
- Respect reduced-motion accessibility settings.
- Prioritize performance and responsiveness.

---

## 7. Database Design

MongoDB will store application data using Mongoose models.

### Main Collections

| Collection | Description |
|---|---|
| users | User accounts and roles |
| laboratories | Laboratory information |
| equipment | Equipment inventory |
| borrowings | Equipment borrowing records |
| maintenance | Maintenance and damage reports |
| notifications | User notifications |
| activityLogs | System activity history |

### Suggested Relationships

```text
User
 ├── Borrowings
 ├── Maintenance Reports
 └── Notifications

Equipment
 ├── Borrowings
 └── Maintenance Reports
```

Each collection should include appropriate timestamps and references to related records.

---

## 8. Project Structure

```text
DCE_LAB/
│
├── client/                     React + Vite + Tailwind CSS frontend
│   ├── public/
│   └── src/
│       ├── animations/         Shared Framer Motion variants
│       ├── assets/
│       ├── components/         Reusable UI (modals, badges, calendar, QR, ...)
│       ├── context/            Auth, toast and notification providers
│       ├── hooks/              useFetch (with live refresh), useDebounce
│       ├── layouts/            App shell, sidebar, top bar, auth layout
│       ├── pages/              One file per screen
│       ├── routes/             Protected / guest route guards
│       ├── services/           Axios API client and Socket.IO client
│       ├── utils/
│       └── App.jsx
│
├── server/                     Express + MongoDB backend
│   ├── config/                 Environment and database connection
│   ├── controllers/            Request handlers and zod schemas
│   ├── middleware/             Auth, RBAC, validation, uploads, errors
│   ├── models/                 Mongoose models
│   ├── routes/                 REST route definitions
│   ├── services/               Notifications, audit log, storage, scheduler
│   ├── sockets/                Socket.IO setup
│   ├── tests/                  Integration tests (node:test)
│   ├── utils/                  Helpers, constants, demo seed data
│   ├── app.js
│   └── server.js
│
├── package.json                Convenience scripts for the whole project
├── .gitignore
└── README.md
```

---

## 9. Installation & Setup

### Prerequisites

- Node.js 18 or newer (LTS recommended)
- npm
- Git
- MongoDB Atlas or a local MongoDB (optional in development - see below)

### Clone Repository

```bash
git clone https://github.com/Swann-Htet/DCE_LAB.git
cd DCE_LAB
```

### Install Dependencies

```bash
npm run install:all
```

### Backend Setup

Copy `server/.env.example` to `server/.env` and adjust it:

```env
PORT=5000
NODE_ENV=development

MONGODB_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret

CLIENT_URL=http://localhost:5173
```

In development you can leave `MONGODB_URI` empty: the server then starts an embedded MongoDB
(data is kept in `server/.mongo-data`) and seeds demo data on the first start. The first run downloads the
MongoDB binary once. `MONGODB_URI` and `JWT_SECRET` are mandatory when `NODE_ENV=production`.

Start the backend:

```bash
npm run dev:server
```

### Frontend Setup

Optionally copy `client/.env.example` to `client/.env`. By default the Vite dev server proxies `/api`,
`/uploads` and `/socket.io` to `http://localhost:5000`, so no configuration is required locally.

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend (a second terminal):

```bash
npm run dev:client
```

Open http://localhost:5173. Signed-out visitors land on the public landing page; sign in to reach the dashboard.

### Demo Accounts

`npm run seed` (also run automatically on the first development start) creates demo data and these accounts.
The shared password is set by `SEED_PASSWORD`, or defaults to the value in `server/utils/seed.js`.
These accounts are for local development only; never seed a production database. Stop the dev server before
running `npm run seed`, because both use the same embedded database folder.

| Role | Email |
|---|---|
| Laboratory Administrator | admin@dcelab.test |
| Lab Assistant | assistant@dcelab.test |
| Lecturer | lecturer@dcelab.test |
| Student | student@dcelab.test |

### Other Commands

| Command | Description |
|---|---|
| `npm test` | Run the backend integration test suite |
| `npm run seed` | Reset the configured database and load demo data |
| `npm run build` | Production build of the frontend (`client/dist`) |

### Optional Settings

| Variable | Purpose |
|---|---|
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Store uploaded images on Cloudinary. Without them images are saved in `server/uploads`. |
| `SERVER_URL` | Public API origin prefixed to uploaded image URLs when the client and API are on different origins. |
| `CRON_SECRET` | Enables `GET /api/cron/run` (bearer token) for hosts that cannot run timers. |
| `DNS_SERVERS` | Public DNS servers for `mongodb+srv://` lookups on networks that block SRV records. |

### Deploying to Vercel

DCE Lab deploys to Vercel as **one project**: the website and the API share a single domain (the repository root
`vercel.json` builds the client and runs the API as a serverless function under `/api`). MongoDB Atlas hosts the data.

**1. MongoDB Atlas**

- Create a database user and copy the connection string, adding a database name before the `?`, for example
  `mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/dcelab?retryWrites=true&w=majority`.
- Under **Network Access**, allow `0.0.0.0/0` (Vercel functions have no fixed IP address).

**2. Vercel project** (Add New -> Project -> import this repository)

- Leave **Root Directory** empty and the framework preset on *Other* (the build settings come from `vercel.json`).
- **Environment variables** (Settings -> Environment Variables), then redeploy:

| Name | Value |
|---|---|
| `MONGODB_URI` | the Atlas connection string from step 1 |
| `JWT_SECRET` | a long random string |
| `CLIENT_URL` | the project URL, e.g. `https://dcelab.vercel.app` (used for QR code links and CORS) |
| `CRON_SECRET` | a random string; Vercel Cron sends it to run the daily overdue/reminder job |

- Do **not** set `VITE_API_URL`: the website then calls `/api` on its own domain.
- Check `https://<your-project>.vercel.app/api/health`. It should answer `{"success":true,"status":"ok"}`.

**3. Create the first administrator** (run once from your own computer; the credentials stay out of git):

```bash
cd server
MONGODB_URI="<atlas connection string>" ADMIN_EMAIL="you@example.com" ADMIN_PASSWORD="<password>" ADMIN_NAME="Your Name" npm run create-admin
```

On Windows PowerShell set the variables first, for example `$env:MONGODB_URI="..."`, then run `npm run create-admin`.
If `mongodb+srv` lookups fail on your network, also set `DNS_SERVERS=8.8.8.8,1.1.1.1`.

**Two projects instead (optional).** You can also deploy `server` (Root Directory `server`) and `client`
(Root Directory `client`) as separate projects. Then set `VITE_API_URL=https://<api-project>.vercel.app/api` on the
client project, and `CLIENT_URL` (the website URL) and `SERVER_URL` (the API URL) on the API project.

**Things that differ on Vercel**

- Real-time sockets are not available on serverless hosting, so the website refreshes lists and notifications every
  30 seconds instead (locally it still uses Socket.IO).
- Uploaded photos are stored in MongoDB and served from `/api/files/...` (use Cloudinary instead by setting its three
  variables). Vercel limits a request body to about 4.5 MB, so uploads are capped at 4 MB.
- The overdue and reminder job runs once a day through Vercel Cron (`vercel.json`); the Hobby plan allows daily runs.
- Do not run `npm run seed` against production; it deletes data and creates demo accounts.

---

### API Overview

All endpoints live under `/api` and (except login and registration) require a `Bearer` token.

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `GET/PATCH /auth/me`, `POST /auth/change-password` |
| Users (admin) | `GET/POST /users`, `PATCH/DELETE /users/:id`, `GET /users/activity-logs` |
| Laboratories | `GET /laboratories`, `GET /laboratories/:id`, admin: `POST`, `PATCH /:id`, `DELETE /:id` |
| Equipment | `GET /equipment`, `GET /equipment/categories`, `GET /equipment/code/:code`, `GET /equipment/:id/qr`, admin: `POST`, `PATCH /:id`, `DELETE /:id` |
| Borrowings | `GET/POST /borrowings`, `GET /borrowings/calendar`, staff: `PATCH /:id/review`, `/collect`, `/return`; `PATCH /:id/cancel` |
| Maintenance | `GET/POST /maintenance`, `GET /maintenance/:id`, staff: `PATCH /:id` |
| Notifications | `GET /notifications`, `PATCH /:id/read`, `PATCH /read-all`, `DELETE /:id` |
| Files | `GET /files/:id` (images stored in MongoDB in production) |
| Analytics | `GET /analytics/dashboard`, `GET /analytics/reports`, admin: `GET /analytics/reports/export/:type` |

### How Stock Is Tracked

Each equipment record keeps `quantity` (units owned), `available` (units free to borrow) and `damaged`
(units out of service). Approving a borrowing request reserves the units, a return releases them, and units
returned damaged are held back while a maintenance report is open. Resolving the report puts them back on the
shelf; marking it unrepairable writes them off.

---

## 10. Security & Data Protection

Security is important because the platform manages university resources and student information.

- JWT-based authentication.
- Role-based access control (RBAC).
- Password hashing using bcrypt.
- Server-side input validation.
- Protected API routes.
- Secure environment variable management.
- Request rate limiting.
- File upload validation.
- Audit logging for important administrative actions.
- Image content verification for uploads.
- Protection against unauthorized equipment transactions.

---

## 11. Development Roadmap

### Phase 1 — Foundation
- [x] Project initialization.
- [x] MERN architecture setup.
- [x] MongoDB integration.
- [x] Authentication system.
- [x] Role-based permissions.
- [x] Responsive dashboard.

### Phase 2 — Laboratory Management
- [x] Laboratory CRUD operations.
- [x] Laboratory availability.
- [x] Borrowing calendar (pick-ups and returns).
- [x] Lab assistant role.

### Phase 3 — Equipment Management
- [x] Equipment inventory.
- [x] Equipment categories.
- [x] Equipment borrowing.
- [x] Equipment returning.
- [x] QR code generation and scanning.

### Phase 4 — Maintenance & Notifications
- [x] Damage reporting.
- [x] Maintenance tracking.
- [x] Real-time notifications.
- [x] Overdue reminders.

### Phase 5 — Analytics & Deployment
- [x] Analytics dashboard.
- [x] Report generation.
- [x] Activity logs.
- [ ] Security testing.
- [ ] Production deployment.

---

## 12. Future Enhancements

Potential future features include:

- RFID-based equipment tracking.
- NFC equipment identification.
- IoT-based laboratory monitoring.
- Smart laboratory access control.
- AI-powered equipment usage analytics.
- Predictive equipment maintenance.
- Integration with university authentication systems.
- Mobile application integration.

---

## 13. Project Information

**Project Name:** DCE Lab  
**Category:** Laboratory Management System  
**Department:** Digital and Communication Engineering (DCE)  
**University:** Mae Fah Luang University  
**Architecture:** MERN Stack  
**Frontend:** React.js  
**Backend:** Node.js + Express.js  
**Database:** MongoDB  
**Primary Font:** DM Sans  
**Icon Library:** Lucide React  
**Animation:** Framer Motion

---

## 14. License

This project is developed for educational and institutional use within the Digital and Communication Engineering department.

The licensing terms will be determined by the project maintainers.

---

**DCE Lab — Smarter Laboratory Management.**

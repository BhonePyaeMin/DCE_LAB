# DCE Lab

<p align="center">
  <img src="./DCE%20LAB.png" alt="DCE Lab Logo" width="220" />
</p>

### Laboratory & Equipment Management System

A centralized laboratory management platform designed for the Digital and Communication Engineering (DCE) department. DCE Lab simplifies laboratory reservations, equipment borrowing, inventory tracking, and laboratory operations through a modern web-based system.

---

## 1. Project Overview

**DCE Lab** is a web-based Laboratory Management System that helps students, lecturers, and laboratory administrators manage laboratory resources efficiently.

The platform provides a centralized environment where users can reserve laboratory rooms, borrow equipment, monitor availability, and report equipment issues.

The goal is to reduce manual administrative work, improve resource utilization, and create a more organized laboratory environment.

### Core Objectives

- Digitalize laboratory reservation processes.
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

The system supports three primary user roles.

### Student

- View available laboratory rooms.
- Reserve laboratory sessions.
- Browse available equipment.
- Submit equipment borrowing requests.
- Track borrowing and returning status.
- Report damaged or malfunctioning equipment.
- View reservation history.

### Lecturer

- View laboratory schedules.
- Request laboratory reservations.
- Approve or manage academic laboratory sessions.
- Monitor student equipment usage.
- Report laboratory issues.
- Review laboratory availability.

### Laboratory Administrator

- Manage laboratory rooms.
- Manage equipment inventory.
- Approve or reject reservations.
- Approve borrowing requests.
- Process equipment returns.
- Manage damaged equipment reports.
- Monitor overdue equipment.
- Generate operational reports.
- Manage users and permissions.

---

## 4. Core Features

### 4.1 Dashboard

A centralized dashboard displaying important laboratory information.

- Total laboratories.
- Total equipment items.
- Available equipment.
- Currently borrowed equipment.
- Pending reservations.
- Upcoming laboratory sessions.
- Recent activities.
- Equipment condition overview.

### 4.2 Laboratory Reservation

A digital room booking system.

- Browse available laboratories.
- View room capacity and facilities.
- Interactive calendar.
- Select reservation date and time.
- Check scheduling conflicts.
- Submit reservation requests.
- Approve or reject booking requests.
- View reservation history.

### 4.3 Equipment Management

A centralized equipment inventory system.

- Register new equipment.
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

- Reservation approval or rejection.
- Borrowing request updates.
- Upcoming reservation reminders.
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
| Reservations | CalendarDays |
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
| reservations | Laboratory reservations |
| borrowings | Equipment borrowing records |
| maintenance | Maintenance and damage reports |
| notifications | User notifications |
| activityLogs | System activity history |

### Suggested Relationships

```text
User
 ├── Reservations
 ├── Borrowings
 ├── Maintenance Reports
 └── Notifications

Laboratory
 └── Reservations

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

Open http://localhost:5173.

### Demo Accounts

`npm run seed` (also run automatically on the first development start) creates demo data and these accounts.
The shared password is set by `SEED_PASSWORD`, or defaults to the value in `server/utils/seed.js`.
These accounts are for local development only; never seed a production database.

| Role | Email |
|---|---|
| Laboratory Administrator | admin@dcelab.test |
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
| `LAB_UTC_OFFSET_MINUTES` | Laboratory time zone offset used for opening-hour checks (default `420`, UTC+7). |
| `SERVER_URL` | Public API origin prefixed to local upload URLs when the client and API are on different origins. |

### API Overview

All endpoints live under `/api` and (except login and registration) require a `Bearer` token.

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `GET/PATCH /auth/me`, `POST /auth/change-password` |
| Users (admin) | `GET/POST /users`, `PATCH/DELETE /users/:id`, `GET /users/activity-logs` |
| Laboratories | `GET /laboratories`, `GET /laboratories/:id`, admin: `POST`, `PATCH /:id`, `DELETE /:id` |
| Reservations | `GET/POST /reservations`, `GET /reservations/schedule`, `PATCH /:id/review`, `PATCH /:id/cancel` |
| Equipment | `GET /equipment`, `GET /equipment/categories`, `GET /equipment/code/:code`, `GET /equipment/:id/qr`, admin: `POST`, `PATCH /:id`, `DELETE /:id` |
| Borrowings | `GET/POST /borrowings`, admin: `PATCH /:id/review`, `/collect`, `/return`; `PATCH /:id/cancel` |
| Maintenance | `GET/POST /maintenance`, `GET /maintenance/:id`, admin: `PATCH /:id` |
| Notifications | `GET /notifications`, `PATCH /:id/read`, `PATCH /read-all`, `DELETE /:id` |
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
- Reservation conflict validation.
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
- [x] Reservation system.
- [x] Calendar integration.
- [x] Reservation approval workflow.

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

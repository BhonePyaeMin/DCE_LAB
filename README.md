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

## 8. Suggested Project Structure

```text
dce-lab/
│
├── client/
│   ├── public/
│   └── src/
│       ├── assets/
│       ├── components/
│       ├── layouts/
│       ├── pages/
│       ├── hooks/
│       ├── services/
│       ├── context/
│       ├── routes/
│       ├── utils/
│       ├── animations/
│       └── App.jsx
│
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── sockets/
│   ├── utils/
│   └── server.js
│
├── .gitignore
└── README.md
```

---

## 9. Installation & Setup

### Prerequisites

- Node.js (LTS)
- npm
- MongoDB Atlas or local MongoDB
- Git

### Clone Repository

```bash
git clone <repository-url>
cd dce-lab
```

### Backend Setup

```bash
cd server
npm install
```

Create a `.env` file:

```env
PORT=5000
NODE_ENV=development

MONGODB_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret

CLIENT_URL=http://localhost:5173
```

Start the backend:

```bash
npm run dev
```

### Frontend Setup

```bash
cd client
npm install
```

Create a `.env` file:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

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
- [ ] Project initialization.
- [ ] MERN architecture setup.
- [ ] MongoDB integration.
- [ ] Authentication system.
- [ ] Role-based permissions.
- [ ] Responsive dashboard.

### Phase 2 — Laboratory Management
- [ ] Laboratory CRUD operations.
- [ ] Laboratory availability.
- [ ] Reservation system.
- [ ] Calendar integration.
- [ ] Reservation approval workflow.

### Phase 3 — Equipment Management
- [ ] Equipment inventory.
- [ ] Equipment categories.
- [ ] Equipment borrowing.
- [ ] Equipment returning.
- [ ] QR code generation and scanning.

### Phase 4 — Maintenance & Notifications
- [ ] Damage reporting.
- [ ] Maintenance tracking.
- [ ] Real-time notifications.
- [ ] Overdue reminders.

### Phase 5 — Analytics & Deployment
- [ ] Analytics dashboard.
- [ ] Report generation.
- [ ] Activity logs.
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

export const ROLES = ['student', 'lecturer', 'assistant', 'admin'];

// Roles that run the lab counter: review requests, check equipment out and process returns.
export const STAFF_ROLES = ['admin', 'assistant'];
export const isStaff = (role) => STAFF_ROLES.includes(role);

export const EQUIPMENT_CATEGORIES = {
  'Computers and Laptops': 'COMP',
  'Arduino and ESP32': 'MCU',
  'Networking Equipment': 'NET',
  'Cameras and Photography': 'CAM',
  'VR and AR Devices': 'VR',
  'Sensors and Electronic Components': 'SENS',
  'Laboratory Tools': 'TOOL',
};

// Built-in illustrations (server/public/equipment) used by the demo data.
export const CATEGORY_IMAGES = {
  'Computers and Laptops': '/assets/equipment/computers.svg',
  'Arduino and ESP32': '/assets/equipment/microcontrollers.svg',
  'Networking Equipment': '/assets/equipment/networking.svg',
  'Cameras and Photography': '/assets/equipment/cameras.svg',
  'VR and AR Devices': '/assets/equipment/vr-ar.svg',
  'Sensors and Electronic Components': '/assets/equipment/sensors.svg',
  'Laboratory Tools': '/assets/equipment/tools.svg',
};

export const EQUIPMENT_CONDITIONS = ['good', 'fair', 'poor', 'damaged', 'maintenance'];

export const LAB_STATUSES = ['active', 'maintenance', 'closed'];

export const BORROWING_STATUSES = [
  'pending',
  'approved',
  'rejected',
  'borrowed',
  'returned',
  'overdue',
  'damaged',
  'cancelled',
];

// Borrowing statuses that currently hold units of stock.
export const BORROWING_ACTIVE_STATUSES = ['approved', 'borrowed', 'overdue'];

export const MAINTENANCE_STATUSES = ['reported', 'under_review', 'in_progress', 'resolved', 'unrepairable'];
export const MAINTENANCE_OPEN_STATUSES = ['reported', 'under_review', 'in_progress'];
export const MAINTENANCE_SEVERITIES = ['low', 'medium', 'high'];

export const NOTIFICATION_TYPES = ['borrowing', 'maintenance', 'reminder', 'system'];

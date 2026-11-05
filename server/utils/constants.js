export const ROLES = ['student', 'lecturer', 'admin'];

export const EQUIPMENT_CATEGORIES = {
  'Computers and Laptops': 'COMP',
  'Arduino and ESP32': 'MCU',
  'Networking Equipment': 'NET',
  'Cameras and Photography': 'CAM',
  'VR and AR Devices': 'VR',
  'Sensors and Electronic Components': 'SENS',
  'Laboratory Tools': 'TOOL',
};

export const EQUIPMENT_CONDITIONS = ['good', 'fair', 'poor', 'damaged', 'maintenance'];

export const LAB_STATUSES = ['active', 'maintenance', 'closed'];

export const RESERVATION_STATUSES = ['pending', 'approved', 'rejected', 'cancelled', 'completed'];

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

export const NOTIFICATION_TYPES = ['reservation', 'borrowing', 'maintenance', 'reminder', 'system'];

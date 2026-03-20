// Notification Utilities für Bucki App
// Browser Push Notifications und In-App Notifications

export interface NotificationSettings {
  pushEnabled: boolean;
  dueTasks: boolean;
  rentIncreases: boolean;
  contractExpirations: boolean;
  inspectionReminders: boolean;
  paymentReminders: boolean;
}

export interface ScheduledNotification {
  id: string;
  title: string;
  body: string;
  scheduledFor: Date;
  type: 'task' | 'deadline' | 'payment' | 'inspection' | 'contract';
  entityId?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

const defaultSettings: NotificationSettings = {
  pushEnabled: false,
  dueTasks: true,
  rentIncreases: true,
  contractExpirations: true,
  inspectionReminders: true,
  paymentReminders: true,
};

// Check if notifications are supported
export function areNotificationsSupported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator;
}

// Request notification permission
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!areNotificationsSupported()) {
    return 'denied';
  }
  
  return await Notification.requestPermission();
}

// Get current notification permission
export function getNotificationPermission(): NotificationPermission {
  if (!areNotificationsSupported()) {
    return 'denied';
  }
  return Notification.permission;
}

// Show a notification
export async function showNotification(
  title: string,
  options: NotificationOptions = {}
): Promise<Notification | null> {
  if (!areNotificationsSupported()) {
    return null;
  }
  
  if (Notification.permission !== 'granted') {
    return null;
  }
  
  const defaultOptions: NotificationOptions = {
    icon: '/logo.png',
    badge: '/logo.png',
    tag: 'bucki-notification',
    requireInteraction: false,
    ...options,
  };
  
  try {
    const notification = new Notification(title, defaultOptions);
    
    notification.onclick = () => {
      window.focus();
      notification.close();
      if (options.data?.url) {
        window.location.href = options.data.url;
      }
    };
    
    return notification;
  } catch {
    return null;
  }
}

// Notification for due task
export function notifyDueTask(taskTitle: string, dueDate: Date, taskId?: string): Promise<Notification | null> {
  const today = new Date();
  const due = new Date(dueDate);
  const daysUntil = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  let title: string;
  let body: string;
  
  if (daysUntil < 0) {
    title = '⚠️ Überfällige Aufgabe';
    body = `Die Aufgabe "${taskTitle}" ist ${Math.abs(daysUntil)} Tage überfällig!`;
  } else if (daysUntil === 0) {
    title = '📅 Aufgabe fällig heute';
    body = `Die Aufgabe "${taskTitle}" ist heute fällig!`;
  } else if (daysUntil === 1) {
    title = '📅 Aufgabe fällig morgen';
    body = `Die Aufgabe "${taskTitle}" ist morgen fällig.`;
  } else if (daysUntil <= 7) {
    title = '📅 Aufgabe in Kürze fällig';
    body = `Die Aufgabe "${taskTitle}" ist in ${daysUntil} Tagen fällig.`;
  } else {
    return Promise.resolve(null);
  }
  
  return showNotification(title, {
    body,
    tag: `task-${taskId || Date.now()}`,
    data: { taskId, url: '/?tab=tasks' },
  });
}

// Notification for contract expiration
export function notifyContractExpiration(
  tenantName: string,
  expirationDate: Date,
  daysUntil: number
): Promise<Notification | null> {
  let title: string;
  let body: string;
  
  if (daysUntil <= 0) {
    title = '📋 Vertrag abgelaufen';
    body = `Der Vertrag von ${tenantName} ist abgelaufen.`;
  } else if (daysUntil <= 30) {
    title = '📋 Vertrag läuft bald ab';
    body = `Der Vertrag von ${tenantName} läuft in ${daysUntil} Tagen ab.`;
  } else {
    return Promise.resolve(null);
  }
  
  return showNotification(title, {
    body,
    tag: `contract-${tenantName}`,
    data: { url: '/?tab=tenants' },
  });
}

// Notification for rent increase
export function notifyRentIncrease(
  propertyName: string,
  oldRent: number,
  newRent: number
): Promise<Notification | null> {
  const increase = newRent - oldRent;
  
  return showNotification('💰 Mieterhöhung', {
    body: `${propertyName}: Miete erhöht sich um ${increase.toFixed(2)} €`,
    tag: `rent-increase-${propertyName}`,
    data: { url: '/?tab=properties' },
  });
}

// Notification for inspection reminder
export function notifyInspectionReminder(
  propertyName: string,
  date: Date,
  propertyId?: string
): Promise<Notification | null> {
  const dateStr = date.toLocaleDateString('de-DE');
  
  return showNotification('🔍 Inspektion anstehend', {
    body: `Inspektion für ${propertyName} am ${dateStr}`,
    tag: `inspection-${propertyId || propertyName}`,
    data: { propertyId, url: '/?tab=tasks' },
  });
}

// Notification for payment received
export function notifyPaymentReceived(
  tenantName: string,
  amount: number,
  propertyId?: string
): Promise<Notification | null> {
  return showNotification('✅ Zahlungseingang', {
    body: `${tenantName}: ${amount.toFixed(2)} € erhalten`,
    tag: `payment-${tenantName}-${Date.now()}`,
    data: { propertyId, url: '/?tab=finances' },
  });
}

// Notification for missing payment
export function notifyMissingPayment(
  tenantName: string,
  amount: number,
  dueDate: Date
): Promise<Notification | null> {
  const dateStr = dueDate.toLocaleDateString('de-DE');
  
  return showNotification('❌ Zahlungsrückstand', {
    body: `${tenantName}: ${amount.toFixed(2)} € vom ${dateStr} nicht erhalten`,
    tag: `missing-payment-${tenantName}`,
    data: { url: '/?tab=finances' },
  });
}

// Schedule a notification
export function scheduleNotification(notification: ScheduledNotification): string {
  const id = notification.id || `notification-${Date.now()}`;
  
  // Store in localStorage for persistence
  const scheduled = getScheduledNotifications();
  scheduled.push({ ...notification, id });
  localStorage.setItem('bucki_scheduled_notifications', JSON.stringify(scheduled));
  
  return id;
}

// Get scheduled notifications
export function getScheduledNotifications(): ScheduledNotification[] {
  try {
    const stored = localStorage.getItem('bucki_scheduled_notifications');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Cancel a scheduled notification
export function cancelScheduledNotification(id: string): void {
  const scheduled = getScheduledNotifications();
  const filtered = scheduled.filter(n => n.id !== id);
  localStorage.setItem('bucki_scheduled_notifications', JSON.stringify(filtered));
}

// Process due notifications (call this on app load)
export function processDueNotifications(): void {
  const scheduled = getScheduledNotifications();
  const now = new Date();
  
  const due = scheduled.filter(n => new Date(n.scheduledFor) <= now);
  const remaining = scheduled.filter(n => new Date(n.scheduledFor) > now);
  
  // Show due notifications
  due.forEach(n => {
    showNotification(n.title, {
      body: n.body,
      tag: n.id,
      data: { entityId: n.entityId, url: getUrlForType(n.type) },
    });
  });
  
  // Update stored notifications
  localStorage.setItem('bucki_scheduled_notifications', JSON.stringify(remaining));
}

function getUrlForType(type: string): string {
  switch (type) {
    case 'task': return '/?tab=tasks';
    case 'deadline': return '/?tab=tasks';
    case 'payment': return '/?tab=finances';
    case 'inspection': return '/?tab=properties';
    case 'contract': return '/?tab=tenants';
    default: return '/';
  }
}

// Get notification settings
export function getNotificationSettings(): NotificationSettings {
  try {
    const stored = localStorage.getItem('bucki_notification_settings');
    return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
  } catch {
    return defaultSettings;
  }
}

// Save notification settings
export function saveNotificationSettings(settings: Partial<NotificationSettings>): void {
  const current = getNotificationSettings();
  const updated = { ...current, ...settings };
  localStorage.setItem('bucki_notification_settings', JSON.stringify(updated));
}

// Check tasks and send notifications
export function checkTasksAndNotify(tasks: any[]): void {
  const settings = getNotificationSettings();
  
  if (!settings.pushEnabled || !settings.dueTasks) {
    return;
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  tasks.forEach(task => {
    if (task.status === 'completed') return;
    
    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    
    const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntil <= 7) {
      notifyDueTask(task.title, dueDate, task.id);
    }
  });
}

// Initialize notifications on app load
export async function initializeNotifications(): Promise<void> {
  if (!areNotificationsSupported()) {
    return;
  }
  
  // Check permission
  if (Notification.permission === 'default') {
    // Don't auto-request - let user opt in via settings
    return;
  }
  
  // Process any due scheduled notifications
  processDueNotifications();
}

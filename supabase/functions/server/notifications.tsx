import * as kv from "./kv_store.tsx";

// Helper function to create notification
export async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  link?: string,
  metadata?: any
) {
  const notification = {
    id: crypto.randomUUID(),
    userId,
    type, // 'commande', 'ticket', 'system'
    title,
    message,
    link: link || '',
    metadata: metadata || {},
    read: false,
    createdAt: new Date().toISOString(),
  };
  
  await kv.set(`notification:${notification.id}`, notification);
  console.log('🔔 Notification created:', notification.id, 'for user:', userId);
  return notification;
}

/**
 * Email notification service
 * Handles sending email notifications to users
 */

/**
 * Interface for email message structure
 */
export interface EmailMessage {
  to: string;
  subject: string;
  body: string;
  isHtml?: boolean;
}

/**
 * Send an email notification
 * In a real application, this would connect to an email API service like SendGrid, Mailgun, etc.
 * 
 * @param message Email message to send
 * @returns Promise that resolves when email is sent
 */
export const sendEmail = async (message: EmailMessage): Promise<boolean> => {
  try {
    // In a real implementation, API call would go here
    console.log('Sending email:', message);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For demonstration purposes, we'll just log the email and return success
    console.log(`Email sent to ${message.to}`);
    console.log(`Subject: ${message.subject}`);
    console.log(`Body: ${message.body}`);
    
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

/**
 * Generate an email template for inventory notifications
 * 
 * @param type Type of notification
 * @param details Details for the notification
 * @returns Formatted HTML email body
 */
export const generateEmailTemplate = (
  type: 'low_stock' | 'order_update' | 'price_change' | 'user_settings',
  details: Record<string, any>
): string => {
  const templates = {
    low_stock: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="color: #1f2937; margin-bottom: 20px;">Low Stock Alert</h2>
        <p>The following products are running low on stock:</p>
        <ul style="padding-left: 20px;">
          ${(details.products || []).map((product: any) => `
            <li style="margin-bottom: 10px;">
              <strong>${product.name}</strong> - Current stock: ${product.stock} (Minimum: ${product.reorder_level})
            </li>
          `).join('')}
        </ul>
        <p style="margin-top: 30px; color: #6b7280;">This is an automated notification from InventoryPro Cloud.</p>
      </div>
    `,
    
    order_update: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="color: #1f2937; margin-bottom: 20px;">Order Status Update</h2>
        <p>Order <strong>#${details.orderId}</strong> has been updated:</p>
        <p>Status: <span style="font-weight: bold; color: ${
          details.status === 'delivered' ? '#10b981' : 
          details.status === 'shipped' ? '#6366f1' : 
          details.status === 'processing' ? '#f59e0b' : 
          details.status === 'cancelled' ? '#ef4444' : '#6b7280'
        };">${details.status.toUpperCase()}</span></p>
        <p>Customer: ${details.customer}</p>
        <p>Total Amount: ${details.currency} ${details.amount.toFixed(2)}</p>
        <p style="margin-top: 30px; color: #6b7280;">This is an automated notification from InventoryPro Cloud.</p>
      </div>
    `,
    
    price_change: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="color: #1f2937; margin-bottom: 20px;">Price Change Alert</h2>
        <p>The following products have had price changes:</p>
        <ul style="padding-left: 20px;">
          ${(details.products || []).map((product: any) => `
            <li style="margin-bottom: 10px;">
              <strong>${product.name}</strong> - Previous: ${details.currency} ${product.oldPrice.toFixed(2)}, 
              New: ${details.currency} ${product.newPrice.toFixed(2)}
            </li>
          `).join('')}
        </ul>
        <p style="margin-top: 30px; color: #6b7280;">This is an automated notification from InventoryPro Cloud.</p>
      </div>
    `,

    user_settings: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="color: #1f2937; margin-bottom: 20px;">Settings Updated</h2>
        <p>Hello ${details.userName},</p>
        <p>Your account settings have been updated successfully.</p>
        
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <h3 style="color: #1f2937; margin-top: 0;">Updated Settings:</h3>
          <ul style="padding-left: 20px;">
            ${details.darkMode !== undefined ? `<li>Dark Mode: ${details.darkMode ? 'Enabled' : 'Disabled'}</li>` : ''}
            ${details.currency ? `<li>Currency: ${details.currency}</li>` : ''}
            ${details.notifications !== undefined ? `<li>Notifications: ${details.notifications ? 'Enabled' : 'Disabled'}</li>` : ''}
          </ul>
        </div>
        
        <p style="margin-top: 30px; color: #6b7280;">This is an automated notification from InventoryPro Cloud.</p>
      </div>
    `
  };
  
  return templates[type] || '';
};

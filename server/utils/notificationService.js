/**
 * Notification Service - Handles sending notifications to various channels
 * Supports: Webhook, Discord, Slack, Telegram, Email (SMTP)
 */

import nodemailer from 'nodemailer';
import { db, notificationHistory } from '../lib/db.js';

// ===== WEBHOOK =====

async function sendWebhook(config, payload) {
  try {
    const response = await fetch(config.url, {
      method: config.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.headers || {})
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return { success: true };
  } catch (error) {
    console.error('[Webhook] Error:', error.message);
    return { success: false, error: error.message };
  }
}

// ===== DISCORD =====

async function sendDiscord(config, payload) {
  try {
    const { service, event, message, timestamp } = payload;
    
    // Discord embed colors
    const colors = {
      down: 0xFF0000,      // Red
      up: 0x00FF00,        // Green
      degraded: 0xFFFF00,  // Yellow
      ssl_expiry: 0xFF8C00,// Orange
      ssl_warning: 0xFFFF00,
      test: 0x7289DA       // Discord blue
    };

    const embed = {
      title: `🔔 ${getEventTitle(event)}`,
      description: message,
      color: colors[event] || 0x7289DA,
      fields: [],
      timestamp: timestamp || new Date().toISOString(),
      footer: {
        text: 'PulseGuard Monitor'
      }
    };

    if (service) {
      embed.fields.push(
        { name: '📍 Servicio', value: service.name, inline: true },
        { name: '🔗 URL', value: service.url || service.host || 'N/A', inline: true }
      );
      
      if (service.responseTime !== undefined) {
        embed.fields.push({ name: '⏱️ Tiempo de respuesta', value: `${service.responseTime}ms`, inline: true });
      }
      
      if (service.uptime !== undefined) {
        embed.fields.push({ name: '📊 Uptime', value: `${service.uptime.toFixed(2)}%`, inline: true });
      }
    }

    // Add mention if configured
    let content = '';
    if (config.mentionRole) {
      content = `<@&${config.mentionRole}>`;
    } else if (config.mentionUser) {
      content = `<@${config.mentionUser}>`;
    } else if (config.mentionEveryone) {
      content = '@everyone';
    }

    const discordPayload = {
      content,
      username: config.username || 'PulseGuard',
      avatar_url: config.avatarUrl || 'https://raw.githubusercontent.com/louislam/uptime-kuma/master/public/icon.svg',
      embeds: [embed]
    };

    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(discordPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Discord API error: ${response.status} - ${errorText}`);
    }

    return { success: true };
  } catch (error) {
    console.error('[Discord] Error:', error.message);
    return { success: false, error: error.message };
  }
}

// ===== SLACK =====

async function sendSlack(config, payload) {
  try {
    const { service, event, message, timestamp } = payload;
    
    // Slack colors
    const colors = {
      down: '#FF0000',
      up: '#36a64f',
      degraded: '#FFD700',
      ssl_expiry: '#FF8C00',
      ssl_warning: '#FFD700',
      test: '#7289DA'
    };

    const slackPayload = {
      channel: config.channel || undefined,
      username: config.username || 'PulseGuard',
      icon_emoji: config.iconEmoji || ':shield:',
      attachments: [{
        color: colors[event] || '#7289DA',
        pretext: config.mentionChannel ? '<!channel>' : '',
        title: `🔔 ${getEventTitle(event)}`,
        text: message,
        fields: [],
        footer: 'PulseGuard Monitor',
        ts: Math.floor(new Date(timestamp || Date.now()).getTime() / 1000)
      }]
    };

    if (service) {
      slackPayload.attachments[0].fields.push(
        { title: '📍 Servicio', value: service.name, short: true },
        { title: '🔗 URL', value: service.url || service.host || 'N/A', short: true }
      );
      
      if (service.responseTime !== undefined) {
        slackPayload.attachments[0].fields.push({ title: '⏱️ Tiempo de respuesta', value: `${service.responseTime}ms`, short: true });
      }
      
      if (service.uptime !== undefined) {
        slackPayload.attachments[0].fields.push({ title: '📊 Uptime', value: `${service.uptime.toFixed(2)}%`, short: true });
      }
    }

    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slackPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Slack API error: ${response.status} - ${errorText}`);
    }

    return { success: true };
  } catch (error) {
    console.error('[Slack] Error:', error.message);
    return { success: false, error: error.message };
  }
}

// ===== TELEGRAM =====

async function sendTelegram(config, payload) {
  try {
    const { service, event, message } = payload;
    
    // Build formatted message
    const emoji = {
      down: '🔴',
      up: '🟢',
      degraded: '🟡',
      ssl_expiry: '🟠',
      ssl_warning: '🟡',
      test: '🔵'
    };

    let text = `${emoji[event] || '🔔'} *${getEventTitle(event)}*\n\n`;
    text += `${message}\n\n`;
    
    if (service) {
      text += `📍 *Servicio:* ${escapeMarkdown(service.name)}\n`;
      text += `🔗 *URL:* ${escapeMarkdown(service.url || service.host || 'N/A')}\n`;
      
      if (service.responseTime !== undefined) {
        text += `⏱️ *Tiempo de respuesta:* ${service.responseTime}ms\n`;
      }
      
      if (service.uptime !== undefined) {
        text += `📊 *Uptime:* ${service.uptime.toFixed(2)}%\n`;
      }
    }
    
    text += `\n_PulseGuard Monitor_`;

    const telegramUrl = `https://api.telegram.org/bot${config.botToken}/sendMessage`;
    
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.chatId,
        text,
        parse_mode: 'MarkdownV2',
        disable_web_page_preview: config.disablePreview || false
      })
    });

    const result = await response.json();
    
    if (!result.ok) {
      // Retry without markdown if parsing fails
      if (result.description?.includes('parse')) {
        const plainResponse = await fetch(telegramUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: config.chatId,
            text: text.replace(/[*_`[\]()~>#+=|{}.!-]/g, ''),
            disable_web_page_preview: config.disablePreview || false
          })
        });
        const plainResult = await plainResponse.json();
        if (!plainResult.ok) {
          throw new Error(`Telegram API error: ${plainResult.description}`);
        }
        return { success: true };
      }
      throw new Error(`Telegram API error: ${result.description}`);
    }

    return { success: true };
  } catch (error) {
    console.error('[Telegram] Error:', error.message);
    return { success: false, error: error.message };
  }
}

// ===== EMAIL (SMTP) =====

async function sendEmail(config, payload) {
  try {
    const { service, event, message, timestamp } = payload;
    
    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpSecure || config.smtpPort === 465,
      auth: config.smtpUser && config.smtpPass ? {
        user: config.smtpUser,
        pass: config.smtpPass
      } : undefined,
      tls: {
        rejectUnauthorized: config.rejectUnauthorized !== false
      }
    });

    const emoji = {
      down: '🔴',
      up: '🟢',
      degraded: '🟡',
      ssl_expiry: '🟠',
      ssl_warning: '🟡',
      test: '🔵'
    };

    const subject = `${emoji[event] || '🔔'} PulseGuard: ${getEventTitle(event)}${service ? ` - ${service.name}` : ''}`;
    
    // Build HTML email
    const statusColor = {
      down: '#FF0000',
      up: '#00FF00',
      degraded: '#FFD700',
      ssl_expiry: '#FF8C00',
      ssl_warning: '#FFD700',
      test: '#7289DA'
    };

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: ${statusColor[event] || '#7289DA'}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-top: none; }
    .footer { background: #333; color: #999; padding: 15px; text-align: center; font-size: 12px; border-radius: 0 0 8px 8px; }
    .metric { display: inline-block; margin: 10px 20px 10px 0; }
    .metric-label { font-size: 12px; color: #666; }
    .metric-value { font-size: 18px; font-weight: bold; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; background: ${statusColor[event] || '#7289DA'}; color: white; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">${emoji[event] || '🔔'} ${getEventTitle(event)}</h1>
      ${service ? `<p style="margin: 10px 0 0 0; opacity: 0.9;">${service.name}</p>` : ''}
    </div>
    <div class="content">
      <p>${message}</p>
      ${service ? `
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <div class="metrics">
          <div class="metric">
            <div class="metric-label">Servicio</div>
            <div class="metric-value">${service.name}</div>
          </div>
          <div class="metric">
            <div class="metric-label">URL</div>
            <div class="metric-value">${service.url || service.host || 'N/A'}</div>
          </div>
          ${service.responseTime !== undefined ? `
            <div class="metric">
              <div class="metric-label">Tiempo de respuesta</div>
              <div class="metric-value">${service.responseTime}ms</div>
            </div>
          ` : ''}
          ${service.uptime !== undefined ? `
            <div class="metric">
              <div class="metric-label">Uptime</div>
              <div class="metric-value">${service.uptime.toFixed(2)}%</div>
            </div>
          ` : ''}
        </div>
      ` : ''}
      <p style="margin-top: 20px; font-size: 12px; color: #666;">
        Fecha: ${new Date(timestamp || Date.now()).toLocaleString('es-ES')}
      </p>
    </div>
    <div class="footer">
      Enviado por PulseGuard Monitor
    </div>
  </div>
</body>
</html>`;

    const toEmails = Array.isArray(config.toEmails) ? config.toEmails : [config.toEmails];
    
    await transporter.sendMail({
      from: config.fromEmail,
      to: toEmails.join(', '),
      subject,
      html,
      text: `${getEventTitle(event)}\n\n${message}\n\n${service ? `Servicio: ${service.name}\nURL: ${service.url || service.host || 'N/A'}` : ''}`
    });

    return { success: true };
  } catch (error) {
    console.error('[Email] Error:', error.message);
    return { success: false, error: error.message };
  }
}

// ===== MAIN FUNCTIONS =====

/**
 * Send notification to a channel
 */
export async function sendNotification(channel, payload) {
  const config = typeof channel.config === 'string' ? JSON.parse(channel.config) : channel.config;
  
  let result;
  
  switch (channel.type) {
    case 'webhook':
      result = await sendWebhook(config, payload);
      break;
    case 'discord':
      result = await sendDiscord(config, payload);
      break;
    case 'slack':
      result = await sendSlack(config, payload);
      break;
    case 'telegram':
      result = await sendTelegram(config, payload);
      break;
    case 'email':
      result = await sendEmail(config, payload);
      break;
    default:
      result = { success: false, error: `Tipo de canal no soportado: ${channel.type}` };
  }
  
  // Log to history
  try {
    await db.insert(notificationHistory).values({
      channelId: channel.id,
      serviceId: payload.service?.id || null,
      event: payload.event,
      message: payload.message,
      status: result.success ? 'sent' : 'failed',
      errorMessage: result.error || null,
      metadata: JSON.stringify({
        channelType: channel.type,
        timestamp: new Date().toISOString()
      })
    });
  } catch (logError) {
    console.error('[NotificationService] Error logging to history:', logError.message);
  }
  
  return result;
}

/**
 * Test a notification channel
 */
export async function testNotification(channel) {
  const testPayload = {
    event: 'test',
    message: '🧪 Esta es una notificación de prueba desde PulseGuard.\n\nSi recibes este mensaje, tu canal de notificaciones está configurado correctamente.',
    service: {
      id: 0,
      name: 'Servicio de Prueba',
      url: 'https://ejemplo.com',
      responseTime: 150,
      uptime: 99.95
    },
    timestamp: new Date().toISOString()
  };
  
  return await sendNotification(channel, testPayload);
}

/**
 * Send notification for a service event
 */
export async function notifyServiceEvent(service, event, additionalData = {}) {
  const messages = {
    down: `🔴 El servicio "${service.name}" está CAÍDO`,
    up: `🟢 El servicio "${service.name}" está ONLINE de nuevo`,
    degraded: `🟡 El servicio "${service.name}" está DEGRADADO`,
    ssl_expiry: `🟠 El certificado SSL de "${service.name}" ha EXPIRADO`,
    ssl_warning: `🟡 El certificado SSL de "${service.name}" expira pronto`
  };
  
  const payload = {
    event,
    message: messages[event] || `Evento ${event} en ${service.name}`,
    service: {
      id: service.id,
      name: service.name,
      url: service.url,
      host: service.host,
      responseTime: service.responseTime,
      uptime: service.uptime
    },
    timestamp: new Date().toISOString(),
    ...additionalData
  };
  
  return payload;
}

// ===== HELPER FUNCTIONS =====

function getEventTitle(event) {
  const titles = {
    down: 'Servicio Caído',
    up: 'Servicio Recuperado',
    degraded: 'Servicio Degradado',
    ssl_expiry: 'Certificado SSL Expirado',
    ssl_warning: 'Certificado SSL Próximo a Expirar',
    test: 'Notificación de Prueba'
  };
  return titles[event] || event;
}

function escapeMarkdown(text) {
  if (!text) return '';
  return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
}

export default {
  sendNotification,
  testNotification,
  notifyServiceEvent
};

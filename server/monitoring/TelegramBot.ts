/**
 * Telegram Bot Service
 * 
 * Sends ALL incidents to Telegram for free permanent logging
 * Formats messages with rich details and severity indicators
 */

import type { Incident } from "@shared/schema";

export class TelegramBot {
  private enabled: boolean = false;
  private chatId: string | null = null;
  private botToken: string | null = null;

  constructor() {
    // Initialize from environment variables
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || null;
    this.chatId = process.env.TELEGRAM_CHAT_ID || null;
    this.enabled = !!this.botToken && !!this.chatId;

    if (this.enabled) {
      console.log("✅ Telegram bot initialized");
    } else {
      console.log("⚠️  Telegram bot disabled (no credentials)");
    }
  }

  public async sendIncident(incident: Incident): Promise<boolean> {
    if (!this.enabled) {
      console.log("📱 Telegram: Would send incident (disabled - no credentials)");
      return true;
    }

    try {
      const message = this.formatIncident(incident);
      
      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.chatId,
          text: message,
          parse_mode: 'Markdown'
        })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(`Telegram API error: ${response.status} - ${error}`);
        return false;
      }

      console.log(`📱 Telegram: Alert sent successfully for ${incident.type}`);
      return true;
    } catch (error) {
      console.error("Telegram send error:", error);
      return false;
    }
  }

  private formatIncident(incident: Incident): string {
    const severityEmoji = {
      0: "ℹ️",
      1: "⚠️",
      2: "🚨",
      3: "🔥"
    };

    const typeEmoji = {
      mispricing: "📉",
      stale_oracle: "⏰",
      flash_loan: "⚡",
      divergence: "🔀"
    };

    const emoji = severityEmoji[incident.severity as 0 | 1 | 2 | 3];
    const typeIcon = typeEmoji[incident.type];

    let message = `${emoji} **ORACLE ALERT** ${typeIcon}\n\n`;
    message += `**Type:** ${incident.type.toUpperCase()}\n`;
    message += `**Asset:** ${incident.asset}\n`;
    message += `**Chain:** ${incident.chain.toUpperCase()}\n`;
    message += `**Severity:** ${['INFO', 'WARNING', 'CRITICAL', 'EMERGENCY'][incident.severity]}\n`;
    message += `**Time:** ${new Date(incident.timestamp).toISOString()}\n\n`;

    if (incident.type === 'mispricing' && incident.deviationBps) {
      message += `**Deviation:** ${incident.deviationBps.toFixed(0)} bps (${(incident.deviationBps / 100).toFixed(2)}%)\n`;
      message += `**On-chain Price:** $${incident.onchainPrice?.toFixed(2)}\n`;
      message += `**Reference Price:** $${incident.referencePrice?.toFixed(2)}\n`;
    }

    if (incident.type === 'stale_oracle' && incident.staleDuration) {
      message += `**Stale Duration:** ${Math.floor(incident.staleDuration / 60)} minutes\n`;
      message += `**Expected Update:** Every ${incident.expectedUpdateInterval} seconds\n`;
    }

    if (incident.type === 'flash_loan' && incident.priceChangeBps) {
      message += `**Price Change:** ${incident.priceChangeBps.toFixed(0)} bps\n`;
      message += `**Time Window:** ${incident.timeWindowSeconds} seconds\n`;
      message += `**Volume Spike:** ${incident.volumeMultiplier}x normal\n`;
      message += `**Tx Hash:** \`${incident.txHash?.substring(0, 16)}...\`\n`;
    }

    if (incident.type === 'divergence' && incident.standardDeviationBps) {
      message += `**Std Deviation:** ${incident.standardDeviationBps.toFixed(0)} bps\n`;
      message += `**Sources Checked:** ${incident.sourceCount}\n`;
      message += `**Price Range:** $${incident.priceRange?.[0]} - $${incident.priceRange?.[1]}\n`;
    }

    message += `\n**Confirmations:** ${incident.confirmationCount || 1}\n`;
    message += `**Gas Spent:** $0.00 (Off-chain detection)\n`;

    return message;
  }

  public setCredentials(botToken: string, chatId: string) {
    this.botToken = botToken;
    this.chatId = chatId;
    this.enabled = !!botToken && !!chatId;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }
}

// Singleton instance
export const telegramBot = new TelegramBot();

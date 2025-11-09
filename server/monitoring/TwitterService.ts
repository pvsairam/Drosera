/**
 * Twitter Service
 * 
 * Posts public warnings for EMERGENCY level incidents only
 * Builds operator reputation and protects DeFi community
 */

import type { Incident } from "@shared/schema";

export class TwitterService {
  private enabled: boolean = false;
  private emergencyOnly: boolean = true;

  constructor() {
    // Initialize from environment variables
    const apiKey = process.env.TWITTER_API_KEY || null;
    const apiSecret = process.env.TWITTER_API_SECRET || null;
    const accessToken = process.env.TWITTER_ACCESS_TOKEN || null;
    const accessSecret = process.env.TWITTER_ACCESS_SECRET || null;

    this.enabled = !!(apiKey && apiSecret && accessToken && accessSecret);

    if (this.enabled) {
      console.log("✅ Twitter integration initialized");
    } else {
      console.log("⚠️  Twitter integration disabled (no credentials)");
    }
  }

  public async postIncident(incident: Incident): Promise<boolean> {
    // Only post emergency alerts to Twitter (unless configured otherwise)
    if (this.emergencyOnly && incident.severity !== 3) {
      return false;
    }

    if (!this.enabled) {
      console.log("🐦 Twitter: Would post emergency alert (disabled in dev mode)");
      return true;
    }

    try {
      const tweet = this.formatTweet(incident);
      
      // TODO: Implement actual Twitter API call
      // const response = await twitterClient.v2.tweet(tweet);

      console.log(`🐦 Twitter: ${tweet}`);
      return true;
    } catch (error) {
      console.error("Twitter post error:", error);
      return false;
    }
  }

  private formatTweet(incident: Incident): string {
    const typeEmoji = {
      mispricing: "📉",
      stale_oracle: "⏰",
      flash_loan: "⚡",
      divergence: "🔀"
    };

    const emoji = typeEmoji[incident.type];
    
    let tweet = `🚨 ORACLE ALERT ${emoji}\n\n`;
    tweet += `${incident.asset} ${incident.type.replace('_', ' ').toUpperCase()} detected on ${incident.chain.toUpperCase()}\n\n`;

    if (incident.type === 'mispricing' && incident.deviationBps) {
      tweet += `Deviation: ${(incident.deviationBps / 100).toFixed(2)}%\n`;
    } else if (incident.type === 'flash_loan') {
      tweet += `Potential flash loan attack detected\n`;
    } else if (incident.type === 'stale_oracle') {
      tweet += `Oracle not updating - stale for ${Math.floor((incident.staleDuration || 0) / 60)}m\n`;
    } else if (incident.type === 'divergence') {
      tweet += `Multi-source price divergence detected\n`;
    }

    tweet += `\nProtocols: Exercise caution\n`;
    tweet += `#DeFi #OracleSecurity #Drosera`;

    // Twitter limit is 280 characters
    if (tweet.length > 280) {
      tweet = tweet.substring(0, 277) + "...";
    }

    return tweet;
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  public setEmergencyOnly(emergencyOnly: boolean) {
    this.emergencyOnly = emergencyOnly;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }
}

// Singleton instance
export const twitterService = new TwitterService();

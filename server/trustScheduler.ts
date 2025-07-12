import { storage } from "./storage";

// Trust scoring scheduler for background tasks
export class TrustScheduler {
  private decayInterval: NodeJS.Timer | null = null;

  start() {
    // Run trust decay check daily at midnight
    this.decayInterval = setInterval(async () => {
      try {
        console.log("Running trust decay check...");
        await storage.applyTrustDecay();
        console.log("Trust decay check completed");
      } catch (error) {
        console.error("Error running trust decay:", error);
      }
    }, 24 * 60 * 60 * 1000); // 24 hours

    console.log("Trust scheduler started - decay checks will run daily");
  }

  stop() {
    if (this.decayInterval) {
      clearInterval(this.decayInterval);
      this.decayInterval = null;
      console.log("Trust scheduler stopped");
    }
  }
}

// Signal accuracy evaluation logic
export async function evaluateSignalAccuracy(signalId: number, outcome: 'resolved' | 'escalated' | 'ignored'): Promise<boolean> {
  try {
    // Get the signal details
    const signals = await storage.getSignals();
    const signal = signals.find(s => s.id === signalId);
    
    if (!signal) return false;

    let accurate = false;

    // Evaluate accuracy based on signal type and outcome
    switch (signal.signalType) {
      case 'dissonance':
      case 'concern':
        // Dissonance signals are accurate if they led to action (resolved/escalated)
        accurate = outcome === 'resolved' || outcome === 'escalated';
        break;
      
      case 'alignment':
      case 'celebration':
        // Positive signals are accurate if not ignored and didn't escalate
        accurate = outcome !== 'ignored' && outcome !== 'escalated';
        break;
      
      default:
        // For other signal types, consider accurate if resolved
        accurate = outcome === 'resolved';
    }

    // Log signal activity for the signal reporter (qualitative tracking only)
    if (signal.reporterId) {
      await storage.updateTrustFromSignalAccuracy(signal.reporterId, accurate);
    }

    return accurate;
  } catch (error) {
    console.error("Error evaluating signal accuracy:", error);
    return false;
  }
}

// Auto-detect outcomes for signal accuracy (simplified heuristics)
export async function autoDetectSignalOutcomes(): Promise<void> {
  try {
    // Get recent signals (last 7 days) that haven't been evaluated
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const signals = await storage.getSignals();
    const recentSignals = signals.filter(s => s.createdAt >= oneWeekAgo);

    for (const signal of recentSignals) {
      // Simple heuristic: if a dissonance signal exists and later coherence signals increase,
      // consider the dissonance signal as accurate
      if (signal.signalType === 'dissonance') {
        const laterSignals = await storage.getSwarmSignals(signal.domain);
        const laterCoherence = laterSignals.filter(s => 
          s.createdAt > signal.createdAt && 
          s.signalType === 'coherence'
        );

        // If coherence improved after dissonance signal, mark as accurate
        if (laterCoherence.length > 0) {
          await evaluateSignalAccuracy(signal.id, 'resolved');
        }
      }
    }
  } catch (error) {
    console.error("Error auto-detecting signal outcomes:", error);
  }
}
import {
  users, loops, signals, decisions, decisionParticipants, resources, 
  trustActions, systemMetrics, activityLog, institutionBundles, sideWorkTasks,
  swarmSignals, swarmAggregations, fieldRituals, inviteCodes, signalLibraryEntries,
  type User, type InsertUser, type Loop, type InsertLoop,
  type Signal, type InsertSignal, type Decision, type InsertDecision,
  type Resource, type InsertResource, type TrustAction, type InsertTrustAction,
  type Activity, type InsertActivity, type SystemMetric, type InstitutionBundle,
  type SideWorkTask, type InsertSideWorkTask,
  type SwarmSignal, type InsertSwarmSignal, type SwarmAggregation, type InsertSwarmAggregation,
  type FieldRitual, type InsertFieldRitual, type InviteCode, type InsertInviteCode,
  type SignalLibraryEntry, type InsertSignalLibraryEntry
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, or, gte, lte, lt } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByPseudonym?(pseudonym: string): Promise<User | undefined>;
  getUsersByInviteCode?(code: string): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUserTrustScore(userId: number, newScore: number): Promise<void>;
  completeUserOnboarding(userId: number): Promise<void>;
  completeFieldOrientation(userId: number): Promise<void>;
  signFieldAgreement(userId: number): Promise<void>;

  // Invite code operations
  getInviteCode(code: string): Promise<InviteCode | undefined>;
  createInviteCode(code: InsertInviteCode): Promise<InviteCode>;
  incrementCodeUsage(code: string): Promise<void>;
  generateInviteCode(createdBy: number, description?: string): Promise<InviteCode>;

  // Loop operations
  getLoops(): Promise<Loop[]>;
  getLoopsByStatus(status: string): Promise<Loop[]>;
  getLoopsByUser(userId: number): Promise<Loop[]>;
  createLoop(loop: InsertLoop): Promise<Loop>;
  updateLoopStatus(id: number, status: string): Promise<void>;
  updateLoopMetrics(id: number, rippleImpact?: number, coherenceScore?: number): Promise<void>;
  completeLoop(id: number): Promise<void>;

  // Signal operations
  getSignals(): Promise<Signal[]>;
  getSignalsByDomain(domain: string): Promise<Signal[]>;
  getSignalsBySeverity(severity: string): Promise<Signal[]>;
  createSignal(signal: InsertSignal): Promise<Signal>;
  updateSignalStatus(id: number, status: string): Promise<void>;

  // Decision operations
  getDecisions(): Promise<Decision[]>;
  getActiveDecisions(): Promise<Decision[]>;
  createDecision(decision: InsertDecision): Promise<Decision>;
  joinDecision(decisionId: number, userId: number, role?: string): Promise<void>;
  
  // Resource operations
  getResources(): Promise<Resource[]>;
  getResourcesByDomain(domain: string): Promise<Resource[]>;
  createResource(resource: InsertResource): Promise<Resource>;
  allocateResource(id: number, allocatedTo: string, approverId: number): Promise<void>;

  // Trust operations
  getTrustActions(userId: number): Promise<TrustAction[]>;
  createTrustAction(action: InsertTrustAction): Promise<TrustAction>;
  
  // System metrics
  getSystemMetrics(): Promise<SystemMetric[]>;
  updateSystemMetric(name: string, value: number): Promise<void>;

  // Activity log
  getRecentActivities(limit?: number): Promise<Activity[]>;
  logActivity(activity: InsertActivity): Promise<Activity>;

  // Institution bundles
  getInstitutionBundles(): Promise<InstitutionBundle[]>;
  getInstitutionBundle(type: string): Promise<InstitutionBundle | undefined>;

  // Side work tasks
  getSideWorkTasks(userId?: number): Promise<SideWorkTask[]>;
  createSideWorkTask(task: InsertSideWorkTask): Promise<SideWorkTask>;
  acceptSideWorkTask(taskId: number): Promise<void>;
  completeSideWorkTask(taskId: number): Promise<void>;
  generateSideWorkTasks(userId: number): Promise<SideWorkTask[]>;

  // Swarm signals
  getSwarmAggregation(targetType: string, targetId?: number): Promise<SwarmAggregation | undefined>;
  createSwarmSignal(signal: InsertSwarmSignal): Promise<SwarmSignal>;
  updateSwarmAggregation(targetType: string, targetId?: number): Promise<SwarmAggregation>;
  getSwarmSignals(targetType?: string, targetId?: number): Promise<SwarmSignal[]>;

  // Field rituals
  getFieldRituals(): Promise<FieldRitual[]>;
  createFieldRitual(ritual: InsertFieldRitual): Promise<FieldRitual>;

  // Signal Library operations
  getSignalLibraryEntries(filters?: { signalType?: string; domain?: string; visibility?: string }): Promise<SignalLibraryEntry[]>;
  getSignalLibraryEntry(id: number): Promise<SignalLibraryEntry | undefined>;
  createSignalLibraryEntry(entry: InsertSignalLibraryEntry): Promise<SignalLibraryEntry>;
  updateSignalLibraryEntry(id: number, updates: Partial<InsertSignalLibraryEntry>): Promise<void>;
  incrementRipplesCount(id: number): Promise<void>;

  // Trust score auto-updates
  calculateTrustAdjustment(userId: number, reason: string, value: number): Promise<void>;
  updateTrustFromLoopCompletion(userId: number, onTime: boolean): Promise<void>;
  updateTrustFromSignalAccuracy(userId: number, accurate: boolean): Promise<void>;
  updateTrustFromCoherencePings(userId: number, pingsReceived: number): Promise<void>;
  applyTrustDecay(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByPseudonym(pseudonym: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.pseudonym, pseudonym));
    return user;
  }

  async getUsersByInviteCode(code: string): Promise<User[]> {
    const userList = await db.select().from(users).where(eq(users.inviteCode, code));
    return userList;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserTrustScore(userId: number, newScore: number): Promise<void> {
    await db.update(users)
      .set({ trustScore: newScore.toString(), updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  // Trust score auto-update system
  async calculateTrustAdjustment(userId: number, reason: string, value: number): Promise<void> {
    // Log the trust action for activity feed (qualitative display only)
    await this.createTrustAction({
      userId,
      actionType: reason,
      description: `Field activity: ${reason.replace(/_/g, ' ')}`,
      impactScore: value
    });
    
    // Note: No longer updating numeric trust scores - using qualitative states only
    // Trust states are determined by activity patterns, not calculated scores
  }

  async updateTrustFromLoopCompletion(userId: number, onTime: boolean): Promise<void> {
    // +0.1 for on-time completion, +0.05 for late completion
    const adjustment = onTime ? 0.1 : 0.05;
    await this.calculateTrustAdjustment(userId, 'loop_completion', adjustment);
  }

  async updateTrustFromSignalAccuracy(userId: number, accurate: boolean): Promise<void> {
    // +0.15 for accurate signals, -0.1 for inaccurate signals
    const adjustment = accurate ? 0.15 : -0.1;
    await this.calculateTrustAdjustment(userId, 'signal_accuracy', adjustment);
  }

  async updateTrustFromCoherencePings(userId: number, pingsReceived: number): Promise<void> {
    // +0.05 per coherence ping received from others (max +0.2 per day)
    const adjustment = Math.min(pingsReceived * 0.05, 0.2);
    if (adjustment > 0) {
      await this.calculateTrustAdjustment(userId, 'coherence_pings', adjustment);
    }
  }

  async applyTrustDecay(): Promise<void> {
    // Note: No longer applying numeric trust decay - using qualitative states
    // Trust states are determined by recent activity patterns, not calculated decay
    console.log("Trust decay skipped - using qualitative trust states only");
  }

  async completeUserOnboarding(userId: number): Promise<void> {
    await db.update(users)
      .set({ onboardingCompleted: true, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async completeFieldOrientation(userId: number): Promise<void> {
    await db.update(users)
      .set({ hasSeenOrientation: true, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async signFieldAgreement(userId: number): Promise<void> {
    await db.update(users)
      .set({ 
        fieldAgreementSigned: true, 
        fieldAgreementSignedAt: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId));
  }

  // Loop operations
  async getLoops(): Promise<Loop[]> {
    return await db.select().from(loops).orderBy(desc(loops.createdAt));
  }

  async getLoopsByStatus(status: string): Promise<Loop[]> {
    return await db.select().from(loops)
      .where(eq(loops.status, status))
      .orderBy(desc(loops.createdAt));
  }

  async getLoopsByUser(userId: number): Promise<Loop[]> {
    return await db.select().from(loops)
      .where(eq(loops.assigneeId, userId))
      .orderBy(desc(loops.createdAt));
  }

  async createLoop(loop: InsertLoop): Promise<Loop> {
    const [newLoop] = await db.insert(loops).values(loop).returning();
    return newLoop;
  }

  async updateLoopStatus(id: number, status: string): Promise<void> {
    await db.update(loops)
      .set({ status, updatedAt: new Date() })
      .where(eq(loops.id, id));
  }

  async updateLoopMetrics(id: number, rippleImpact?: number, coherenceScore?: number): Promise<void> {
    const updateData: any = { updatedAt: new Date() };
    
    if (rippleImpact !== undefined) {
      updateData.rippleImpact = rippleImpact;
    }
    
    if (coherenceScore !== undefined) {
      updateData.coherenceScore = coherenceScore.toString();
    }
    
    await db.update(loops)
      .set(updateData)
      .where(eq(loops.id, id));
  }

  async completeLoop(id: number): Promise<void> {
    // Get loop details for trust scoring
    const [loop] = await db.select().from(loops).where(eq(loops.id, id));
    
    if (loop && loop.assigneeId) {
      const isOnTime = loop.deadline ? new Date() <= loop.deadline : true;
      await this.updateTrustFromLoopCompletion(loop.assigneeId, isOnTime);
    }

    await db.update(loops)
      .set({ status: "completed", completedAt: new Date(), updatedAt: new Date() })
      .where(eq(loops.id, id));
  }

  // Signal operations
  async getSignals(): Promise<Signal[]> {
    return await db.select().from(signals).orderBy(desc(signals.createdAt));
  }

  async getSignalsByDomain(domain: string): Promise<Signal[]> {
    return await db.select().from(signals)
      .where(eq(signals.domain, domain))
      .orderBy(desc(signals.createdAt));
  }

  async getSignalsBySeverity(severity: string): Promise<Signal[]> {
    return await db.select().from(signals)
      .where(eq(signals.severity, severity))
      .orderBy(desc(signals.createdAt));
  }

  async createSignal(signal: InsertSignal): Promise<Signal> {
    const [newSignal] = await db.insert(signals).values(signal).returning();
    return newSignal;
  }

  async updateSignalStatus(id: number, status: string): Promise<void> {
    await db.update(signals)
      .set({ status, updatedAt: new Date() })
      .where(eq(signals.id, id));
  }

  // Decision operations
  async getDecisions(): Promise<Decision[]> {
    return await db.select().from(decisions).orderBy(desc(decisions.createdAt));
  }

  async getActiveDecisions(): Promise<Decision[]> {
    return await db.select().from(decisions)
      .where(eq(decisions.status, "active"))
      .orderBy(desc(decisions.createdAt));
  }

  async createDecision(decision: InsertDecision): Promise<Decision> {
    const [newDecision] = await db.insert(decisions).values(decision).returning();
    return newDecision;
  }

  async joinDecision(decisionId: number, userId: number, role: string = "participant"): Promise<void> {
    await db.insert(decisionParticipants)
      .values({ decisionId, userId, role })
      .onConflictDoUpdate({
        target: [decisionParticipants.decisionId, decisionParticipants.userId],
        set: { role }
      });

    // Update participant count
    await db.update(decisions)
      .set({ 
        participantCount: sql`${decisions.participantCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(decisions.id, decisionId));
  }

  // Resource operations
  async getResources(): Promise<Resource[]> {
    return await db.select().from(resources).orderBy(desc(resources.createdAt));
  }

  async getResourcesByDomain(domain: string): Promise<Resource[]> {
    return await db.select().from(resources)
      .where(eq(resources.domain, domain))
      .orderBy(desc(resources.createdAt));
  }

  async createResource(resource: InsertResource): Promise<Resource> {
    const [newResource] = await db.insert(resources).values(resource).returning();
    return newResource;
  }

  async allocateResource(id: number, allocatedTo: string, approverId: number): Promise<void> {
    await db.update(resources)
      .set({ 
        allocatedTo, 
        approverId, 
        status: "allocated",
        allocatedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(resources.id, id));
  }

  // Trust operations
  async getTrustActions(userId: number): Promise<TrustAction[]> {
    return await db.select().from(trustActions)
      .where(eq(trustActions.userId, userId))
      .orderBy(desc(trustActions.createdAt));
  }

  async createTrustAction(action: InsertTrustAction): Promise<TrustAction> {
    const [newAction] = await db.insert(trustActions).values(action).returning();
    return newAction;
  }

  // System metrics
  async getSystemMetrics(): Promise<SystemMetric[]> {
    return await db.select().from(systemMetrics)
      .orderBy(desc(systemMetrics.recordedAt));
  }

  async updateSystemMetric(name: string, value: number): Promise<void> {
    await db.insert(systemMetrics)
      .values({ metricName: name, value: value.toString() })
      .onConflictDoUpdate({
        target: systemMetrics.metricName,
        set: { value: value.toString(), recordedAt: new Date() }
      });
  }

  // Activity log
  async getRecentActivities(limit: number = 20): Promise<Activity[]> {
    return await db.select().from(activityLog)
      .orderBy(desc(activityLog.createdAt))
      .limit(limit);
  }

  async logActivity(activity: InsertActivity): Promise<Activity> {
    const [newActivity] = await db.insert(activityLog).values(activity).returning();
    return newActivity;
  }

  // Institution bundles
  async getInstitutionBundles(): Promise<InstitutionBundle[]> {
    return await db.select().from(institutionBundles)
      .where(eq(institutionBundles.isActive, true));
  }

  async getInstitutionBundle(type: string): Promise<InstitutionBundle | undefined> {
    const [bundle] = await db.select().from(institutionBundles)
      .where(and(
        eq(institutionBundles.institutionType, type),
        eq(institutionBundles.isActive, true)
      ));
    return bundle;
  }

  // Side work tasks
  async getSideWorkTasks(userId?: number): Promise<SideWorkTask[]> {
    if (userId) {
      return await db.select().from(sideWorkTasks)
        .where(eq(sideWorkTasks.userId, userId))
        .orderBy(desc(sideWorkTasks.createdAt));
    }
    return await db.select().from(sideWorkTasks).orderBy(desc(sideWorkTasks.createdAt));
  }

  async createSideWorkTask(task: InsertSideWorkTask): Promise<SideWorkTask> {
    const [newTask] = await db.insert(sideWorkTasks).values(task).returning();
    return newTask;
  }

  async acceptSideWorkTask(taskId: number): Promise<void> {
    await db.update(sideWorkTasks)
      .set({ 
        status: "accepted", 
        acceptedAt: new Date() 
      })
      .where(eq(sideWorkTasks.id, taskId));
  }

  async completeSideWorkTask(taskId: number): Promise<void> {
    const [task] = await db.select().from(sideWorkTasks).where(eq(sideWorkTasks.id, taskId));
    
    if (task && task.userId) {
      // Update task status
      await db.update(sideWorkTasks)
        .set({ 
          status: "completed", 
          completedAt: new Date() 
        })
        .where(eq(sideWorkTasks.id, taskId));

      // Log user's field activity based on impact type (qualitative tracking only)
      const boostAmount = Number(task.coherenceBoost) || 0.05;
      const [user] = await db.select().from(users).where(eq(users.id, task.userId));
      
      if (user) {
        const currentScore = parseFloat(user.trustScore);
        let newTrustScore = currentScore + boostAmount;
        newTrustScore = Math.min(newTrustScore, 5.0); // Cap at 5.0, not 1.0
        
        await db.update(users)
          .set({ trustScore: newTrustScore.toString() })
          .where(eq(users.id, task.userId));

        // Log the activity
        await this.logActivity({
          userId: task.userId,
          activityType: "side_work_completed",
          title: `Completed: ${task.title}`,
          description: `Field work completed with +${(boostAmount * 100).toFixed(1)}% impact`,
          metadata: { taskType: task.taskType, impactType: task.impactType }
        });
      }
    }
  }

  async generateSideWorkTasks(userId: number): Promise<SideWorkTask[]> {
    // Get user context
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    const openLoops = await db.select().from(loops)
      .where(and(eq(loops.assigneeId, userId), eq(loops.status, "in_progress")));
    
    const recentSignals = await db.select().from(signals)
      .where(and(
        eq(signals.reporterId, userId),
        gte(signals.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      ));

    // Simple task generation - real implementation would use the sideWork.js module
    const taskTemplates = [
      {
        taskType: 'close_loop',
        title: 'Close a lingering loop',
        description: 'Review your open commitments and mark one as complete that you may have forgotten to close.',
        impactType: 'coherence',
        coherenceBoost: '0.075'
      },
      {
        taskType: 'self_reflection',
        title: 'Reflect on recent interactions',
        description: 'Take a moment to consider how your recent contributions have supported or strained the field.',
        impactType: 'coherence',
        coherenceBoost: '0.040'
      },
      {
        taskType: 'appreciate_contribution',
        title: 'Acknowledge someone\'s work',
        description: 'Recognize a community member whose recent contribution has strengthened the field.',
        impactType: 'trust',
        coherenceBoost: '0.035'
      }
    ];

    const tasksToCreate = taskTemplates.slice(0, 3).map(template => ({
      ...template,
      userId,
      triggeredBy: openLoops.length > 2 ? 'false_resonance' : 'voluntary'
    }));

    const createdTasks = [];
    for (const taskData of tasksToCreate) {
      const task = await this.createSideWorkTask(taskData);
      createdTasks.push(task);
    }

    return createdTasks;
  }

  // Swarm signal operations
  async getSwarmAggregation(targetType: string, targetId?: number): Promise<SwarmAggregation | undefined> {
    const [aggregation] = await db.select().from(swarmAggregations)
      .where(and(
        eq(swarmAggregations.targetType, targetType),
        targetId ? eq(swarmAggregations.targetId, targetId) : sql`${swarmAggregations.targetId} IS NULL`
      ));
    return aggregation;
  }

  async createSwarmSignal(signal: InsertSwarmSignal): Promise<SwarmSignal> {
    // Get user trust state for context
    const user = await this.getUser(signal.userId);
    const trustWeight = user ? 1.0 : 1.0; // All users have equal weight now (qualitative states)

    const [newSignal] = await db.insert(swarmSignals)
      .values({
        ...signal,
        userTrustWeight: trustWeight.toString()
      })
      .returning();
    
    // Update aggregation after creating signal
    await this.updateSwarmAggregation(signal.targetType, signal.targetId || undefined);
    
    // Check for triggers after updating aggregation
    await this.checkAndTriggerResponses(signal.targetType, signal.targetId || undefined);
    
    // Update trust score from coherence pings received
    if (signal.signalType === 'coherence' && signal.userId !== signal.targetId) {
      // Count coherence pings received today for the target user
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayPings = await db.select().from(swarmSignals)
        .where(and(
          eq(swarmSignals.signalType, 'coherence'),
          eq(swarmSignals.targetType, signal.targetType),
          signal.targetId ? eq(swarmSignals.targetId, signal.targetId) : sql`${swarmSignals.targetId} IS NULL`,
          gte(swarmSignals.createdAt, today)
        ));
      
      // Get the target user ID (for loops, it's the assignee)
      let targetUserId = null;
      if (signal.targetType === 'loop' && signal.targetId) {
        const [loop] = await db.select().from(loops).where(eq(loops.id, signal.targetId));
        targetUserId = loop?.assigneeId;
      }
      
      if (targetUserId) {
        await this.updateTrustFromCoherencePings(targetUserId, todayPings.length);
      }
    }
    
    return newSignal;
  }

  async updateSwarmAggregation(targetType: string, targetId?: number): Promise<SwarmAggregation> {
    // Fetch all signals for this target
    const targetSignals = await db.select().from(swarmSignals)
      .where(and(
        eq(swarmSignals.targetType, targetType),
        targetId ? eq(swarmSignals.targetId, targetId) : sql`${swarmSignals.targetId} IS NULL`
      ));

    // Calculate weighted scores
    let totalWeight = 0;
    let coherenceSum = 0;
    let dissonanceSum = 0;
    let rippleSum = 0;

    targetSignals.forEach(signal => {
      const weight = parseFloat(signal.userTrustWeight) * signal.intensity;
      totalWeight += weight;

      if (signal.signalType === 'coherence') {
        coherenceSum += weight;
      } else if (signal.signalType === 'dissonance') {
        dissonanceSum += weight;
      } else if (signal.signalType === 'ripple') {
        rippleSum += weight;
      }
    });

    // Calculate percentages
    const coherenceScore = totalWeight > 0 ? (coherenceSum / totalWeight) * 100 : 0;
    const dissonanceScore = totalWeight > 0 ? (dissonanceSum / totalWeight) * 100 : 0;
    const rippleScore = totalWeight > 0 ? (rippleSum / totalWeight) * 100 : 0;

    // Determine trend (simplified for now)
    let trend = 'stable';
    if (coherenceScore > dissonanceScore + 20) {
      trend = 'up';
    } else if (dissonanceScore > coherenceScore + 20) {
      trend = 'down';
    }

    // Find existing aggregation or create new one
    const existingAggregation = await this.getSwarmAggregation(targetType, targetId);
    
    if (existingAggregation) {
      // Update existing aggregation
      const [aggregation] = await db.update(swarmAggregations)
        .set({
          coherenceScore: coherenceScore.toFixed(2),
          dissonanceScore: dissonanceScore.toFixed(2),
          rippleScore: rippleScore.toFixed(2),
          totalSignals: targetSignals.length,
          trend,
          lastUpdated: new Date()
        })
        .where(and(
          eq(swarmAggregations.targetType, targetType),
          targetId ? eq(swarmAggregations.targetId, targetId) : sql`${swarmAggregations.targetId} IS NULL`
        ))
        .returning();
      return aggregation;
    } else {
      // Create new aggregation
      const [aggregation] = await db.insert(swarmAggregations)
        .values({
          targetType,
          targetId: targetId || null,
          coherenceScore: coherenceScore.toFixed(2),
          dissonanceScore: dissonanceScore.toFixed(2),
          rippleScore: rippleScore.toFixed(2),
          totalSignals: targetSignals.length,
          trend,
          lastUpdated: new Date()
        })
        .returning();
      return aggregation;
    }

    return aggregation;
  }

  async getSwarmSignals(targetType?: string, targetId?: number): Promise<SwarmSignal[]> {
    let query = db.select().from(swarmSignals);
    
    if (targetType) {
      query = query.where(and(
        eq(swarmSignals.targetType, targetType),
        targetId ? eq(swarmSignals.targetId, targetId) : sql`${swarmSignals.targetId} IS NULL`
      ));
    }
    
    return await query.orderBy(desc(swarmSignals.createdAt));
  }

  // Trigger system for automatic responses
  async checkAndTriggerResponses(targetType: string, targetId?: number): Promise<any[]> {
    const triggers = [];
    
    // Get swarm aggregation for this target
    const aggregation = await this.getSwarmAggregation(targetType, targetId);
    if (!aggregation) return triggers;

    const dissonanceScore = parseFloat(aggregation.dissonanceScore);
    const coherenceScore = parseFloat(aggregation.coherenceScore);
    const rippleScore = parseFloat(aggregation.rippleScore);
    const totalSignals = aggregation.totalSignals;

    // Additional user state checks for cultural triggers
    if (targetType === 'loop' && targetId) {
      const loop = await db.select().from(loops).where(eq(loops.id, targetId));
      if (loop.length > 0) {
        const assignee = await this.getUser(loop[0].assigneeId);
        if (assignee) {
          const trustScore = parseFloat(assignee.trustScore);
          
          // Check for burnout state (low trust + multiple overdue loops)
          const overdueLoops = await db.select().from(loops)
            .where(and(
              eq(loops.assigneeId, assignee.id),
              eq(loops.status, "overdue")
            ));
          
          if (trustScore < 2.2 && overdueLoops.length >= 2) {
            triggers.push({
              type: 'burnout_protocol',
              targetType: 'user',
              targetId: assignee.id,
              severity: 'high',
              message: 'Burnout pattern detected. Sanctuary protocol recommended.',
              ritual: 'Rest and Renewal Circle',
              data: {
                trustScore,
                overdueCount: overdueLoops.length,
                suggestion: 'Gentle pause with supportive community circle'
              }
            });
          }
        }
      }
    }

    // Trigger 1: Pause + Reflect for high dissonance
    if (targetType === 'loop' && dissonanceScore > 50 && totalSignals >= 3) {
      const dissonanceSignals = await db.select().from(swarmSignals)
        .where(and(
          eq(swarmSignals.targetType, targetType),
          targetId ? eq(swarmSignals.targetId, targetId) : sql`${swarmSignals.targetId} IS NULL`,
          eq(swarmSignals.signalType, 'dissonance')
        ));

      if (dissonanceSignals.length >= 3) {
        triggers.push({
          type: 'pause_reflect',
          targetType,
          targetId,
          severity: dissonanceScore > 70 ? 'high' : 'medium',
          message: 'Multiple dissonance signals detected. Consider pausing for group reflection.',
          data: {
            dissonanceCount: dissonanceSignals.length,
            dissonanceScore,
            suggestion: 'Invite circle conversation to address underlying tensions'
          }
        });
      }
    }

    // Trigger 2: Field Repair ritual for trust issues
    if (targetType === 'loop' && targetId) {
      const loop = await db.select().from(loops).where(eq(loops.id, targetId));
      if (loop.length > 0) {
        const assignee = await this.getUser(loop[0].assigneeId);
        if (assignee && parseFloat(assignee.trustScore) < 2.0) {
          triggers.push({
            type: 'field_repair',
            targetType,
            targetId,
            severity: 'medium',
            message: 'Trust threshold crossed. Field repair ritual suggested.',
            data: {
              userId: assignee.id,
              currentTrustScore: assignee.trustScore,
              suggestion: 'Gentle restoration circle to rebuild field connections'
            }
          });
        }
      }
    }

    // Trigger 3: Field Spotlight for high coherence + ripple (CELEBRATION state)
    if (coherenceScore > 80 && rippleScore > 60 && totalSignals >= 2) {
      triggers.push({
        type: 'celebration_ritual',
        targetType,
        targetId,
        severity: 'positive',
        message: 'Excellence detected! Community celebration ritual suggested.',
        ritual: 'Gratitude Harvest Circle',
        data: {
          coherenceScore,
          rippleScore,
          totalSignals,
          suggestion: 'Gather community to acknowledge and amplify this success'
        }
      });
    }

    // Trigger 4: Breach protocol for severe false resonance
    if (targetType === 'signal') {
      const signal = await db.select().from(signals).where(eq(signals.id, targetId));
      if (signal.length > 0 && signal[0].signalType === 'false_resonance' && signal[0].severity === 'high') {
        triggers.push({
          type: 'breach_protocol',
          targetType: 'signal',
          targetId,
          severity: 'critical',
          message: 'Serious field breach detected. Immediate sanctuary protocol activated.',
          ritual: 'Truth and Reconciliation Circle',
          data: {
            signalTitle: signal[0].title,
            reporterId: signal[0].reporterId,
            suggestion: 'Emergency community gathering for healing and realignment'
          }
        });
      }
    }

    // Trigger 5: Conflict resolution ritual
    if (dissonanceScore > 60 && totalSignals >= 4) {
      triggers.push({
        type: 'conflict_resolution',
        targetType,
        targetId,
        severity: 'high',
        message: 'Persistent conflict pattern detected. Mediation ritual needed.',
        ritual: 'Circle of Understanding',
        data: {
          dissonanceScore,
          signalCount: totalSignals,
          suggestion: 'Facilitated dialogue to address underlying tensions'
        }
      });
    }

    return triggers;
  }

  async getActiveTriggers(): Promise<any[]> {
    // Get all recent aggregations and check for triggers
    const aggregations = await db.select().from(swarmAggregations)
      .where(gte(swarmAggregations.lastUpdated, new Date(Date.now() - 24 * 60 * 60 * 1000))) // Last 24 hours
      .orderBy(desc(swarmAggregations.lastUpdated));

    const allTriggers = [];
    for (const agg of aggregations) {
      const triggers = await this.checkAndTriggerResponses(agg.targetType, agg.targetId || undefined);
      allTriggers.push(...triggers);
    }

    return allTriggers;
  }

  // Field ritual methods
  async getFieldRituals(): Promise<FieldRitual[]> {
    const rituals = await db.select().from(fieldRituals);
    return rituals;
  }

  async createFieldRitual(ritual: InsertFieldRitual): Promise<FieldRitual> {
    const [createdRitual] = await db
      .insert(fieldRituals)
      .values(ritual)
      .returning();
    return createdRitual;
  }

  // Signal Library methods
  async getSignalLibraryEntries(filters?: { signalType?: string; domain?: string; visibility?: string }): Promise<SignalLibraryEntry[]> {
    let query = db.select().from(signalLibraryEntries);
    
    if (filters) {
      const conditions = [];
      if (filters.signalType) {
        conditions.push(eq(signalLibraryEntries.signalType, filters.signalType));
      }
      if (filters.domain) {
        conditions.push(eq(signalLibraryEntries.domain, filters.domain));
      }
      if (filters.visibility) {
        conditions.push(eq(signalLibraryEntries.visibility, filters.visibility));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
    }
    
    const entries = await query.orderBy(desc(signalLibraryEntries.createdAt));
    return entries;
  }

  async getSignalLibraryEntry(id: number): Promise<SignalLibraryEntry | undefined> {
    const [entry] = await db.select().from(signalLibraryEntries).where(eq(signalLibraryEntries.id, id));
    return entry;
  }

  async createSignalLibraryEntry(entry: InsertSignalLibraryEntry): Promise<SignalLibraryEntry> {
    const [createdEntry] = await db
      .insert(signalLibraryEntries)
      .values(entry)
      .returning();
    return createdEntry;
  }

  async updateSignalLibraryEntry(id: number, updates: Partial<InsertSignalLibraryEntry>): Promise<void> {
    await db
      .update(signalLibraryEntries)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(signalLibraryEntries.id, id));
  }

  async incrementRipplesCount(id: number): Promise<void> {
    await db
      .update(signalLibraryEntries)
      .set({ 
        ripplesCount: sql`${signalLibraryEntries.ripplesCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(signalLibraryEntries.id, id));
  }
}

export const storage = new DatabaseStorage();

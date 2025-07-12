import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { validateInviteCode, checkPseudonymAvailability, createPrivacyUser, validateUserSession, generateInviteCode } from "./auth";
import { 
  insertLoopSchema, insertSignalSchema, insertDecisionSchema, 
  insertResourceSchema, insertTrustActionSchema, insertActivitySchema,
  insertSwarmSignalSchema, insertFieldRitualSchema, insertSignalLibraryEntrySchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  // Helper function to broadcast to all connected clients
  const broadcast = (data: any) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  };

  // Authentication endpoints
  app.post("/api/auth/validate-code", async (req, res) => {
    try {
      const { code } = req.body;
      const result = await validateInviteCode(code);
      
      if (result.valid) {
        res.json({ valid: true, existingUser: result.existingUser });
      } else {
        res.status(400).json({ valid: false, message: result.message });
      }
    } catch (error) {
      console.error("Error validating invite code:", error);
      res.status(500).json({ message: "Validation failed" });
    }
  });

  app.post("/api/auth/check-pseudonym", async (req, res) => {
    try {
      const { pseudonym } = req.body;
      const result = await checkPseudonymAvailability(pseudonym);
      
      if (result.available) {
        res.json({ available: true });
      } else {
        res.status(409).json({ available: false, message: result.message });
      }
    } catch (error) {
      console.error("Error checking pseudonym:", error);
      res.status(500).json({ message: "Check failed" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { pseudonym, signalRole, inviteCode, styleEmoji, fieldColor } = req.body;
      
      // Validate invite code first
      const codeValidation = await validateInviteCode(inviteCode);
      if (!codeValidation.valid) {
        return res.status(400).json({ message: "Invalid invite code" });
      }

      // Check pseudonym availability
      const pseudonymCheck = await checkPseudonymAvailability(pseudonym);
      if (!pseudonymCheck.available) {
        return res.status(409).json({ message: "Pseudonym not available" });
      }

      // Create user
      const user = await createPrivacyUser({
        pseudonym,
        signalRole,
        inviteCode,
        styleEmoji,
        fieldColor
      });

      res.json({ user, message: "Registration successful" });
    } catch (error) {
      console.error("Error during registration:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { pseudonym, inviteCode } = req.body;
      
      // Find user by pseudonym and invite code
      const user = await storage.getUserByPseudonym(pseudonym);
      if (!user || user.inviteCode !== inviteCode) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      res.json({ user, message: "Login successful" });
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/session", async (req, res) => {
    try {
      const { userId, pseudonym } = req.body;
      const result = await validateUserSession(userId, pseudonym);
      
      if (result.valid) {
        res.json({ valid: true, user: result.user });
      } else {
        res.status(401).json({ valid: false, message: "Invalid session" });
      }
    } catch (error) {
      console.error("Error validating session:", error);
      res.status(500).json({ message: "Session validation failed" });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    try {
      // For privacy-first auth, logout is client-side only
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("Error during logout:", error);
      res.status(500).json({ message: "Logout failed" });
    }
  });

  // Generate invite code (stewards only)
  app.post("/api/auth/generate-invite", async (req, res) => {
    try {
      const { userId, description } = req.body;
      
      // Check if user is a steward (simplified check for now)
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const newCode = generateInviteCode();
      
      res.json({ 
        code: newCode, 
        description: description || "Generated by steward",
        message: "Invite code generated successfully" 
      });
    } catch (error) {
      console.error("Error generating invite code:", error);
      res.status(500).json({ message: "Code generation failed" });
    }
  });

  // System metrics endpoints
  app.get("/api/system/metrics", async (req, res) => {
    try {
      const metrics = await storage.getSystemMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching system metrics:", error);
      res.status(500).json({ message: "Failed to fetch system metrics" });
    }
  });

  app.get("/api/system/health", async (req, res) => {
    try {
      // Calculate system health metrics
      const activeLoops = await storage.getLoopsByStatus("active");
      const completedLoops = await storage.getLoopsByStatus("completed");
      const overdueLoops = await storage.getLoopsByStatus("overdue");
      const signals = await storage.getSignals();
      const decisions = await storage.getActiveDecisions();
      const resources = await storage.getResources();

      const totalLoops = activeLoops.length + completedLoops.length + overdueLoops.length;
      const systemCoherence = totalLoops > 0 ? Math.round((completedLoops.length / totalLoops) * 100) : 0;
      
      const healthData = {
        systemCoherence,
        activeLoops: activeLoops.length,
        completedLoops: completedLoops.length,
        overdueLoops: overdueLoops.length,
        totalSignals: signals.length,
        activeDecisions: decisions.length,
        totalResources: resources.length,
        lastUpdated: new Date().toISOString()
      };

      res.json(healthData);
    } catch (error) {
      console.error("Error calculating system health:", error);
      res.status(500).json({ message: "Failed to calculate system health" });
    }
  });

  // Loop endpoints
  app.get("/api/loops", async (req, res) => {
    try {
      const loops = await storage.getLoops();
      res.json(loops);
    } catch (error) {
      console.error("Error fetching loops:", error);
      res.status(500).json({ message: "Failed to fetch loops" });
    }
  });

  app.post("/api/loops", async (req, res) => {
    try {
      const validatedData = insertLoopSchema.parse(req.body);
      
      // Convert dueDate string to Date object if provided
      if (validatedData.dueDate && typeof validatedData.dueDate === 'string') {
        validatedData.dueDate = new Date(validatedData.dueDate);
      }
      
      const loop = await storage.createLoop(validatedData);
      
      // Log activity
      if (validatedData.assigneeId) {
        await storage.logActivity({
          userId: validatedData.assigneeId,
          activityType: "loop_created",
          title: `Created new loop: ${validatedData.title}`,
          description: validatedData.description || ""
        });
      }

      // Broadcast update
      broadcast({ type: "loop_created", data: loop });

      res.json(loop);
    } catch (error) {
      console.error("Error creating loop:", error);
      res.status(500).json({ message: "Failed to create loop" });
    }
  });

  app.get("/api/loops/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const loops = await storage.getLoops();
      const loop = loops.find(l => l.id === id);
      
      if (!loop) {
        return res.status(404).json({ message: "Loop not found" });
      }
      
      res.json(loop);
    } catch (error) {
      console.error("Error fetching loop:", error);
      res.status(500).json({ message: "Failed to fetch loop" });
    }
  });

  app.patch("/api/loops/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status, rippleImpact, coherenceScore } = req.body;
      
      if (status) {
        await storage.updateLoopStatus(id, status);
      }
      
      // Update ripple impact and coherence score if provided
      if (rippleImpact !== undefined || coherenceScore !== undefined) {
        await storage.updateLoopMetrics(id, rippleImpact, coherenceScore);
      }
      
      // Broadcast update for real-time UI
      broadcast({ type: "loop_updated", data: { id, status, rippleImpact, coherenceScore } });
      
      res.json({ message: "Loop updated successfully" });
    } catch (error) {
      console.error("Error updating loop:", error);
      res.status(500).json({ message: "Failed to update loop" });
    }
  });

  app.post("/api/loops/:id/complete", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.completeLoop(id);
      
      // Broadcast update
      broadcast({ type: "loop_completed", data: { id } });
      
      res.json({ message: "Loop completed successfully" });
    } catch (error) {
      console.error("Error completing loop:", error);
      res.status(500).json({ message: "Failed to complete loop" });
    }
  });

  // Signal endpoints
  app.get("/api/signals", async (req, res) => {
    try {
      const signals = await storage.getSignals();
      res.json(signals);
    } catch (error) {
      console.error("Error fetching signals:", error);
      res.status(500).json({ message: "Failed to fetch signals" });
    }
  });

  app.get("/api/signals/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const signals = await storage.getSignals();
      const signal = signals.find(s => s.id === id);
      
      if (!signal) {
        return res.status(404).json({ message: "Signal not found" });
      }
      
      res.json(signal);
    } catch (error) {
      console.error("Error fetching signal:", error);
      res.status(500).json({ message: "Failed to fetch signal" });
    }
  });

  app.post("/api/signals", async (req, res) => {
    try {
      const validatedData = insertSignalSchema.parse(req.body);
      const signal = await storage.createSignal(validatedData);
      
      // Log activity
      if (validatedData.reporterId) {
        await storage.logActivity({
          userId: validatedData.reporterId,
          activityType: "signal_raised",
          title: `Raised signal: ${validatedData.title}`,
          description: validatedData.description || ""
        });
      }

      // Broadcast update
      broadcast({ type: "signal_created", data: signal });

      res.json(signal);
    } catch (error) {
      console.error("Error creating signal:", error);
      res.status(500).json({ message: "Failed to create signal" });
    }
  });

  app.patch("/api/signals/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (status) {
        await storage.updateSignalStatus(id, status);
      }
      
      res.json({ message: "Signal updated successfully" });
    } catch (error) {
      console.error("Error updating signal:", error);
      res.status(500).json({ message: "Failed to update signal" });
    }
  });

  // Decision endpoints
  app.get("/api/decisions", async (req, res) => {
    try {
      const decisions = await storage.getDecisions();
      res.json(decisions);
    } catch (error) {
      console.error("Error fetching decisions:", error);
      res.status(500).json({ message: "Failed to fetch decisions" });
    }
  });

  app.post("/api/decisions", async (req, res) => {
    try {
      const validatedData = insertDecisionSchema.parse(req.body);
      const decision = await storage.createDecision(validatedData);
      
      // Log activity
      if (validatedData.initiatorId) {
        await storage.logActivity({
          userId: validatedData.initiatorId,
          activityType: "decision_initiated",
          title: `Initiated decision: ${validatedData.title}`,
          description: validatedData.description || ""
        });
      }

      // Broadcast update
      broadcast({ type: "decision_created", data: decision });

      res.json(decision);
    } catch (error) {
      console.error("Error creating decision:", error);
      res.status(500).json({ message: "Failed to create decision" });
    }
  });

  app.post("/api/decisions/:id/join", async (req, res) => {
    try {
      const decisionId = parseInt(req.params.id);
      const { userId, role } = req.body;
      
      await storage.joinDecision(decisionId, userId, role);
      
      // Award trust points for collaborative decision participation
      if (role === "facilitator") {
        await storage.calculateTrustAdjustment(userId, "decision_facilitation", 0.12);
      } else {
        await storage.calculateTrustAdjustment(userId, "decision_participation", 0.08);
      }
      
      // Log activity
      await storage.logActivity({
        userId,
        activityType: "decision_joined",
        title: `Joined decision as ${role}`,
        description: `Participating in collaborative decision-making process`
      });
      
      // Broadcast update
      broadcast({ type: "decision_joined", data: { decisionId, userId, role } });
      
      res.json({ message: "Successfully joined decision" });
    } catch (error) {
      console.error("Error joining decision:", error);
      res.status(500).json({ message: "Failed to join decision" });
    }
  });

  // Resource endpoints
  app.get("/api/resources", async (req, res) => {
    try {
      const resources = await storage.getResources();
      res.json(resources);
    } catch (error) {
      console.error("Error fetching resources:", error);
      res.status(500).json({ message: "Failed to fetch resources" });
    }
  });

  app.post("/api/resources", async (req, res) => {
    try {
      const validatedData = insertResourceSchema.parse(req.body);
      const resource = await storage.createResource(validatedData);
      
      // Log activity
      if (validatedData.requesterId) {
        await storage.logActivity({
          userId: validatedData.requesterId,
          activityType: "resource_requested",
          title: `Requested resource: ${validatedData.title}`,
          description: validatedData.description || ""
        });
      }

      // Broadcast update
      broadcast({ type: "resource_created", data: resource });

      res.json(resource);
    } catch (error) {
      console.error("Error creating resource:", error);
      res.status(500).json({ message: "Failed to create resource" });
    }
  });

  app.post("/api/resources/:id/allocate", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { allocatedTo, approverId } = req.body;
      
      await storage.allocateResource(id, allocatedTo, approverId);
      
      // Award trust points for resource governance
      if (approverId) {
        await storage.calculateTrustAdjustment(approverId, "resource_governance", 0.10);
        
        // Log activity
        await storage.logActivity({
          userId: approverId,
          activityType: "resource_allocated",
          title: `Approved resource allocation`,
          description: `Allocated resource to: ${allocatedTo}`
        });
      }
      
      // Broadcast update
      broadcast({ type: "resource_allocated", data: { id, allocatedTo, approverId } });
      
      res.json({ message: "Resource allocated successfully" });
    } catch (error) {
      console.error("Error allocating resource:", error);
      res.status(500).json({ message: "Failed to allocate resource" });
    }
  });

  // Trust endpoints
  app.get("/api/trust/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      const trustActions = await storage.getTrustActions(userId);
      res.json(trustActions);
    } catch (error) {
      console.error("Error fetching trust actions:", error);
      res.status(500).json({ message: "Failed to fetch trust actions" });
    }
  });

  app.post("/api/trust", async (req, res) => {
    try {
      const validatedData = insertTrustActionSchema.parse(req.body);
      const trustAction = await storage.createTrustAction(validatedData);
      
      // Log activity
      await storage.logActivity({
        userId: validatedData.userId,
        activityType: "trust_action",
        title: `Trust action: ${validatedData.actionType}`,
        description: validatedData.description || ""
      });

      // Broadcast update
      broadcast({ type: "trust_action_created", data: trustAction });

      res.json(trustAction);
    } catch (error) {
      console.error("Error creating trust action:", error);
      res.status(500).json({ message: "Failed to create trust action" });
    }
  });

  // Activity endpoints
  app.get("/api/activities", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const activities = await storage.getRecentActivities(limit);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  // Institution bundles
  app.get("/api/institution-bundles", async (req, res) => {
    try {
      const bundles = await storage.getInstitutionBundles();
      res.json(bundles);
    } catch (error) {
      console.error("Error fetching institution bundles:", error);
      res.status(500).json({ message: "Failed to fetch institution bundles" });
    }
  });

  app.post("/api/institution-bundles/update", async (req, res) => {
    try {
      const { bundleId, config } = req.body;
      
      // Update the bundle configuration
      // For now, just return success - would implement actual update logic
      res.json({ 
        message: "Bundle configuration updated successfully",
        bundleId,
        config 
      });
    } catch (error) {
      console.error("Error updating institution bundle:", error);
      res.status(500).json({ message: "Failed to update institution bundle" });
    }
  });

  // Side work tasks
  app.get("/api/side-work", async (req, res) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : 1; // Default to user 1 for demo
      const tasks = await storage.getSideWorkTasks(userId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching side work tasks:", error);
      res.status(500).json({ message: "Failed to fetch side work tasks" });
    }
  });

  app.post("/api/side-work/generate", async (req, res) => {
    try {
      const userId = req.body.userId || 1; // Default to user 1 for demo
      const tasks = await storage.generateSideWorkTasks(userId);
      res.json(tasks);
    } catch (error) {
      console.error("Error generating side work tasks:", error);
      res.status(500).json({ message: "Failed to generate side work tasks" });
    }
  });

  // Field agreement signing endpoint
  app.patch("/api/users/:id/sign-field-agreement", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      await storage.signFieldAgreement(userId);
      
      // Log the activity
      await storage.logActivity({
        userId,
        activityType: "field_agreement_signed",
        description: "User signed the field agreement",
        metadata: { signedAt: new Date().toISOString() }
      });
      
      res.json({ message: "Field agreement signed successfully" });
    } catch (error) {
      console.error("Error signing field agreement:", error);
      res.status(500).json({ message: "Failed to sign field agreement" });
    }
  });

  // Sanctuary request endpoint
  app.post("/api/sanctuary/request", async (req, res) => {
    try {
      const { userId, reason, type } = req.body;
      
      // Create sanctuary signal
      const signal = await storage.createSignal({
        title: "Sanctuary Request",
        description: reason || "User requested sanctuary support",
        reporterId: userId,
        signalType: "concern",
        severity: "medium",
        domain: "wellbeing",
        status: "sanctuary",
        sanctuaryPath: true
      });
      
      // Log the activity
      await storage.logActivity({
        userId,
        activityType: "sanctuary_requested",
        description: "User requested sanctuary support",
        metadata: { type, signalId: signal.id }
      });
      
      res.json({ message: "Sanctuary request created", signalId: signal.id });
    } catch (error) {
      console.error("Error creating sanctuary request:", error);
      res.status(500).json({ message: "Failed to create sanctuary request" });
    }
  });

  app.patch("/api/side-work/:id/accept", async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      await storage.acceptSideWorkTask(taskId);
      res.json({ message: "Task accepted successfully" });
    } catch (error) {
      console.error("Error accepting side work task:", error);
      res.status(500).json({ message: "Failed to accept side work task" });
    }
  });

  app.patch("/api/side-work/:id/complete", async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      await storage.completeSideWorkTask(taskId);
      res.json({ message: "Task completed successfully" });
    } catch (error) {
      console.error("Error completing side work task:", error);
      res.status(500).json({ message: "Failed to complete side work task" });
    }
  });

  // User endpoints
  app.get("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.patch("/api/users/:id/complete-onboarding", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.completeUserOnboarding(id);
      res.json({ message: "Onboarding completed successfully" });
    } catch (error) {
      console.error("Error completing onboarding:", error);
      res.status(500).json({ message: "Failed to complete onboarding" });
    }
  });

  app.patch("/api/users/:id/complete-orientation", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.completeFieldOrientation(id);
      res.json({ message: "Field orientation completed successfully" });
    } catch (error) {
      console.error("Error completing orientation:", error);
      res.status(500).json({ message: "Failed to complete orientation" });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      // Note: Trust scores no longer updated via API for ethical compliance
      // Trust states determined by activity patterns, not manual updates
      
      res.json({ message: "User updated successfully" });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Field ritual endpoints
  app.get("/api/field-rituals", async (req, res) => {
    try {
      // Generate some sample field rituals for demonstration
      const sampleRituals = [
        {
          id: 1,
          name: "Circle of Intentions",
          ritualType: "opening",
          domain: "governance",
          description: "A grounding practice to begin decision-making sessions with shared intention and presence",
          instructions: "Participants sit in a circle. Each person shares one word representing their intention for the session. A moment of silence follows each sharing.",
          frequency: "before_meetings",
          participantCount: 8,
          culturalContext: "secular",
          isOptional: true,
          lastPerformed: "2024-12-08",
          nextScheduled: "2024-12-15",
          createdAt: new Date('2024-12-01'),
          createdBy: 1
        },
        {
          id: 2,
          name: "Gratitude Harvest",
          ritualType: "closing",
          domain: "sustainability", 
          description: "Acknowledging contributions and celebrating what has grown during our time together",
          instructions: "At the end of collaborative work, participants share one thing they're grateful for from the session. Contributions are 'harvested' into a shared appreciation bowl.",
          frequency: "after_projects",
          participantCount: 6,
          culturalContext: "spiritual",
          isOptional: true,
          lastPerformed: "2024-12-05",
          createdAt: new Date('2024-11-15'),
          createdBy: 1
        },
        {
          id: 3,
          name: "Wisdom Keeper's Story",
          ritualType: "celebration",
          domain: "education",
          description: "Monthly storytelling to preserve and share community wisdom and experiences",
          instructions: "A community elder or experienced member shares a story of challenge and learning. The community reflects on lessons and how they apply to current situations.",
          frequency: "monthly",
          participantCount: 25,
          culturalContext: "indigenous",
          isOptional: false,
          nextScheduled: "2024-12-20",
          createdAt: new Date('2024-10-20'),
          createdBy: 1
        }
      ];
      
      res.json(sampleRituals);
    } catch (error) {
      console.error("Error fetching field rituals:", error);
      res.status(500).json({ message: "Failed to fetch field rituals" });
    }
  });

  app.post("/api/field-rituals", async (req, res) => {
    try {
      const validatedData = insertFieldRitualSchema.parse(req.body);
      const ritual = await storage.createFieldRitual(validatedData);
      
      // Log activity
      await storage.logActivity({
        userId: 1, // Default user for now
        activityType: "ritual_created",
        title: `Created field ritual: ${validatedData.name}`,
        description: validatedData.description || ""
      });

      // Broadcast update
      broadcast({ type: "ritual_created", data: ritual });

      res.json(ritual);
    } catch (error) {
      console.error("Error creating field ritual:", error);
      res.status(500).json({ message: "Failed to create field ritual" });
    }
  });

  app.post("/api/field-rituals/:id/participate", async (req, res) => {
    try {
      const ritualId = parseInt(req.params.id);
      
      // Log activity for participation
      await storage.logActivity({
        userId: 1, // Default user for now
        activityType: "ritual_participation",
        title: `Participated in field ritual`,
        description: `Participated in field ritual ${ritualId}`
      });

      res.json({ message: "Successfully joined ritual" });
    } catch (error) {
      console.error("Error participating in ritual:", error);
      res.status(500).json({ message: "Failed to participate in ritual" });
    }
  });

  // Swarm signal endpoints
  app.get("/api/swarm/:targetType/:targetId?", async (req, res) => {
    try {
      const { targetType } = req.params;
      const targetId = req.params.targetId ? parseInt(req.params.targetId) : undefined;
      
      const aggregation = await storage.getSwarmAggregation(targetType, targetId);
      
      if (!aggregation) {
        // Return default aggregation if none exists
        return res.json({
          targetType,
          targetId: targetId || null,
          coherenceScore: 0,
          dissonanceScore: 0,
          rippleScore: 0,
          totalSignals: 0,
          trend: 'stable',
          lastUpdated: new Date().toISOString()
        });
      }
      
      res.json(aggregation);
    } catch (error) {
      console.error("Error fetching swarm aggregation:", error);
      res.status(500).json({ message: "Failed to fetch swarm aggregation" });
    }
  });

  app.post("/api/swarm/signals", async (req, res) => {
    try {
      const validatedData = insertSwarmSignalSchema.parse(req.body);
      const signal = await storage.createSwarmSignal(validatedData);
      
      // Broadcast update
      broadcast({ type: "swarm_signal_created", data: signal });
      
      res.json(signal);
    } catch (error) {
      console.error("Error creating swarm signal:", error);
      res.status(500).json({ message: "Failed to create swarm signal" });
    }
  });

  app.get("/api/swarm/signals", async (req, res) => {
    try {
      const targetType = req.query.targetType as string;
      const targetId = req.query.targetId ? parseInt(req.query.targetId as string) : undefined;
      
      const signals = await storage.getSwarmSignals(targetType, targetId);
      res.json(signals);
    } catch (error) {
      console.error("Error fetching swarm signals:", error);
      res.status(500).json({ message: "Failed to fetch swarm signals" });
    }
  });

  // Trigger system endpoints
  app.get("/api/triggers", async (req, res) => {
    try {
      const triggers = await storage.getActiveTriggers();
      res.json(triggers);
    } catch (error) {
      console.error("Error fetching triggers:", error);
      res.status(500).json({ message: "Failed to fetch triggers" });
    }
  });

  app.get("/api/triggers/:targetType/:targetId?", async (req, res) => {
    try {
      const { targetType } = req.params;
      const targetId = req.params.targetId ? parseInt(req.params.targetId) : undefined;
      
      const triggers = await storage.checkAndTriggerResponses(targetType, targetId);
      res.json(triggers);
    } catch (error) {
      console.error("Error checking triggers:", error);
      res.status(500).json({ message: "Failed to check triggers" });
    }
  });

  // Trust activity endpoints (qualitative only)
  app.post("/api/trust/activity", async (req, res) => {
    try {
      const { userId, reason, value } = req.body;
      await storage.calculateTrustAdjustment(userId, reason, value);
      res.json({ message: "Trust activity logged successfully" });
    } catch (error) {
      console.error("Error logging trust activity:", error);
      res.status(500).json({ message: "Failed to log trust activity" });
    }
  });

  app.post("/api/trust/signal-activity", async (req, res) => {
    try {
      const { userId, accurate } = req.body;
      await storage.updateTrustFromSignalAccuracy(userId, accurate);
      res.json({ message: "Signal activity recorded" });
    } catch (error) {
      console.error("Error recording signal activity:", error);
      res.status(500).json({ message: "Failed to record signal activity" });
    }
  });

  // Signal Library endpoints
  app.get("/api/signal-library", async (req, res) => {
    try {
      const filters = {
        signalType: req.query.signalType as string,
        domain: req.query.domain as string,
        visibility: req.query.visibility as string
      };
      
      // Remove undefined values
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== undefined)
      );
      
      const entries = await storage.getSignalLibraryEntries(cleanFilters);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching signal library entries:", error);
      res.status(500).json({ message: "Failed to fetch signal library entries" });
    }
  });

  app.get("/api/signal-library/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const entry = await storage.getSignalLibraryEntry(id);
      
      if (!entry) {
        return res.status(404).json({ message: "Signal library entry not found" });
      }
      
      res.json(entry);
    } catch (error) {
      console.error("Error fetching signal library entry:", error);
      res.status(500).json({ message: "Failed to fetch signal library entry" });
    }
  });

  app.post("/api/signal-library", async (req, res) => {
    try {
      const validatedData = insertSignalLibraryEntrySchema.parse(req.body);
      const entry = await storage.createSignalLibraryEntry(validatedData);
      
      // Log activity
      if (validatedData.creatorId) {
        await storage.logActivity({
          userId: validatedData.creatorId,
          activityType: "signal_library_contribution",
          title: `Contributed to Signal Library: ${validatedData.title}`,
          description: validatedData.description || ""
        });
      }

      // Broadcast update
      broadcast({ type: "signal_library_entry_created", data: entry });

      res.json(entry);
    } catch (error) {
      console.error("Error creating signal library entry:", error);
      res.status(500).json({ message: "Failed to create signal library entry" });
    }
  });

  app.patch("/api/signal-library/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      await storage.updateSignalLibraryEntry(id, updates);
      
      res.json({ message: "Signal library entry updated successfully" });
    } catch (error) {
      console.error("Error updating signal library entry:", error);
      res.status(500).json({ message: "Failed to update signal library entry" });
    }
  });

  app.post("/api/signal-library/:id/ripple", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.incrementRipplesCount(id);
      
      res.json({ message: "Ripple added successfully" });
    } catch (error) {
      console.error("Error adding ripple:", error);
      res.status(500).json({ message: "Failed to add ripple" });
    }
  });

  return httpServer;
}

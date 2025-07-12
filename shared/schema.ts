import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar, decimal, index, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table - privacy-first authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  pseudonym: text("pseudonym").notNull().unique(),
  signalRole: text("signal_role").notNull(), // Mirror, Weaver, Anchor, etc.
  inviteCode: varchar("invite_code", { length: 8 }).notNull(),
  styleEmoji: varchar("style_emoji", { length: 10 }),
  fieldColor: varchar("field_color", { length: 20 }),
  trustState: varchar("trust_state").default("emerging"), // rooted, emerging, dormant, tending
  trustTokens: integer("trust_tokens").default(3),
  institutionType: text("institution_type").default("general"),
  participationLevel: text("participation_level").default("low"), // low, medium, high
  reliability: text("reliability").default("new"), // new, fair, good, excellent
  collaboration: text("collaboration").default("new"), // new, weak, fair, strong
  isActive: boolean("is_active").default(true),
  onboardingCompleted: boolean("onboarding_completed").default(false),
  hasSeenOrientation: boolean("has_seen_orientation").default(false),
  fieldAgreementSigned: boolean("field_agreement_signed").default(false),
  fieldAgreementSignedAt: timestamp("field_agreement_signed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Invite codes management
export const inviteCodes = pgTable("invite_codes", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 8 }).unique().notNull(),
  isActive: boolean("is_active").default(true),
  maxUses: integer("max_uses").default(10),
  currentUses: integer("current_uses").default(0),
  createdBy: integer("created_by").references(() => users.id),
  description: text("description"), // Optional label for the code
  createdAt: timestamp("created_at").defaultNow(),
});

// Loops (commitments/tasks)
export const loops = pgTable("loops", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  assigneeId: integer("assignee_id").references(() => users.id),
  status: text("status").notNull().default("active"), // active, completed, overdue, attention, sanctuary
  priority: text("priority").default("medium"), // low, medium, high
  domain: text("domain").notNull(), // education, housing, healthcare, governance, etc.
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  rippleImpact: integer("ripple_impact").default(0), // 0-100 scale
  coherenceScore: decimal("coherence_score", { precision: 3, scale: 2 }).default("0.00"),
  rippleCheck: jsonb("ripple_check"), // detailed ripple analysis
  isRegenerative: boolean("is_regenerative").default(true),
  extractiveMarkers: text("extractive_markers").array(), // flags for extraction patterns
  sanctuaryStatus: text("sanctuary_status"), // active, healing, completed, null
  fieldImpactRadius: text("field_impact_radius").default("local"), // local, community, network, system
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Signals (system dissonance/alignment indicators)
export const signals = pgTable("signals", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  reporterId: integer("reporter_id").references(() => users.id),
  signalType: text("signal_type").notNull(), // dissonance, alignment, concern, positive, false_resonance
  severity: text("severity").notNull(), // low, medium, high, critical
  domain: text("domain").notNull(),
  status: text("status").default("open"), // open, investigating, resolved, dismissed, sanctuary
  falseResonanceMarkers: text("false_resonance_markers").array(), // fear, domination, hierarchy flags
  diversityCheck: boolean("diversity_check").default(true), // signal diversity safeguard
  sanctuaryPath: boolean("sanctuary_path").default(false), // eligible for sanctuary protocol
  metadata: jsonb("metadata"), // additional context data
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Decisions (collective intelligence outcomes)
export const decisions = pgTable("decisions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  initiatorId: integer("initiator_id").references(() => users.id),
  status: text("status").default("active"), // active, completed, cancelled
  decisionType: text("decision_type").notNull(), // budget, policy, resource, governance
  votingDeadline: timestamp("voting_deadline"),
  participantCount: integer("participant_count").default(0),
  consensusReached: boolean("consensus_reached").default(false),
  outcome: jsonb("outcome"), // decision results
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Decision Participants (who is involved in decisions)
export const decisionParticipants = pgTable("decision_participants", {
  decisionId: integer("decision_id").references(() => decisions.id),
  userId: integer("user_id").references(() => users.id),
  role: text("role").default("participant"), // participant, facilitator, observer
  vote: text("vote"), // approve, reject, abstain, modify
  joinedAt: timestamp("joined_at").defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.decisionId, table.userId] }),
}));

// Resources (funding, allocation tracking)
export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  resourceType: text("resource_type").notNull(), // funding, time, materials, services
  domain: text("domain").notNull(),
  allocatedTo: text("allocated_to"), // project, person, initiative
  status: text("status").default("available"), // available, allocated, pending, used
  requesterId: integer("requester_id").references(() => users.id),
  approverId: integer("approver_id").references(() => users.id),
  allocatedAt: timestamp("allocated_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Trust Actions (track trust-building activities)
export const trustActions = pgTable("trust_actions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  actionType: text("action_type").notNull(), // completed_loop, helped_other, conflict_resolution, etc.
  description: text("description"),
  impactScore: decimal("impact_score", { precision: 3, scale: 2 }).default("0.00"),
  witnessedBy: integer("witnessed_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// System Metrics (overall health tracking)
export const systemMetrics = pgTable("system_metrics", {
  id: serial("id").primaryKey(),
  metricName: text("metric_name").notNull(),
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  unit: text("unit").default("percent"),
  recordedAt: timestamp("recorded_at").defaultNow(),
});

// Activity Log (recent activities)
export const activityLog = pgTable("activity_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  activityType: text("activity_type").notNull(), // loop_created, signal_raised, decision_joined, etc.
  title: text("title").notNull(),
  description: text("description"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Institution Bundles (customization configurations)
export const institutionBundles = pgTable("institution_bundles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  institutionType: text("institution_type").notNull(), // education, religious, neighborhood, mutual_aid, wellbeing
  description: text("description"),
  config: jsonb("config"), // bundle-specific settings
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Field Rituals (cultural strengthening practices)
export const fieldRituals = pgTable("field_rituals", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  ritualType: text("ritual_type").notNull(), // opening, closing, transition, celebration, healing
  domain: text("domain").notNull(),
  description: text("description"),
  instructions: text("instructions"),
  frequency: text("frequency"), // daily, weekly, monthly, as_needed
  participantCount: integer("participant_count").default(1),
  culturalContext: text("cultural_context"), // indigenous, spiritual, secular, educational
  isOptional: boolean("is_optional").default(true),
  bundleId: integer("bundle_id").references(() => institutionBundles.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Sanctuary Protocols (healing and re-entry processes)
export const sanctuaryProtocols = pgTable("sanctuary_protocols", {
  id: serial("id").primaryKey(),
  participantId: integer("participant_id").references(() => users.id),
  triggerType: text("trigger_type").notNull(), // conflict, burnout, extraction_detected, voluntary
  status: text("status").default("active"), // active, healing, integration, completed
  sanctuaryDuration: integer("sanctuary_duration_days").default(7),
  healingActivities: text("healing_activities").array(),
  supportNetwork: text("support_network").array(), // user IDs providing support
  reentryConditions: jsonb("reentry_conditions"),
  witnessId: integer("witness_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Coherence Measurements (detailed scoring system)
export const coherenceMeasurements = pgTable("coherence_measurements", {
  id: serial("id").primaryKey(),
  entityType: text("entity_type").notNull(), // loop, user, decision, system
  entityId: integer("entity_id").notNull(),
  measurementType: text("measurement_type").notNull(), // trust, regeneration, alignment, impact
  score: decimal("score", { precision: 5, scale: 3 }).notNull(),
  factors: jsonb("factors"), // breakdown of scoring components
  calculatedAt: timestamp("calculated_at").defaultNow(),
});

// Side Work Tasks (gentle regenerative tasks to dissolve false resonance)
export const sideWorkTasks = pgTable("side_work_tasks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  taskType: text("task_type").notNull(), // 'close_loop', 'offer_feedback', 'self_reflection', etc.
  title: text("title").notNull(),
  description: text("description").notNull(),
  impactType: text("impact_type").notNull(), // 'coherence', 'trust', 'participation'
  coherenceBoost: decimal("coherence_boost", { precision: 3, scale: 3 }).default("0.050"), // small positive impact
  status: text("status").default("available"), // 'available', 'accepted', 'completed', 'declined'
  targetEntityType: text("target_entity_type"), // what this task relates to
  targetEntityId: integer("target_entity_id"), // specific loop, signal, etc.
  triggeredBy: text("triggered_by"), // 'false_resonance', 'voluntary', 'system_suggestion'
  createdAt: timestamp("created_at").defaultNow(),
  acceptedAt: timestamp("accepted_at"),
  completedAt: timestamp("completed_at"),
});

// Swarm Signals (real-time micro-feedback system)
export const swarmSignals = pgTable("swarm_signals", {
  id: serial("id").primaryKey(),
  targetType: text("target_type").notNull(), // 'loop', 'signal', 'decision', 'system'
  targetId: integer("target_id"), // null for system-wide signals
  signalType: text("signal_type").notNull(), // 'coherence', 'dissonance', 'ripple'
  intensity: integer("intensity").notNull().default(3), // 1-5 scale
  userId: integer("user_id").references(() => users.id),
  userTrustWeight: decimal("user_trust_weight", { precision: 3, scale: 2 }).default("1.00"),
  isAnonymous: boolean("is_anonymous").default(true),
  metadata: jsonb("metadata"), // additional context
  createdAt: timestamp("created_at").defaultNow(),
});

// Swarm Aggregations (computed field state)
export const swarmAggregations = pgTable("swarm_aggregations", {
  id: serial("id").primaryKey(),
  targetType: text("target_type").notNull(),
  targetId: integer("target_id"),
  coherenceScore: decimal("coherence_score", { precision: 5, scale: 2 }).default("0.00"), // 0-100
  dissonanceScore: decimal("dissonance_score", { precision: 5, scale: 2 }).default("0.00"), // 0-100
  rippleScore: decimal("ripple_score", { precision: 5, scale: 2 }).default("0.00"), // 0-100
  totalSignals: integer("total_signals").default(0),
  trend: text("trend").default("stable"), // 'up', 'down', 'stable'
  calculatedAt: timestamp("calculated_at").defaultNow(),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Signal Library Entries (public archive of contributed resources)
export const signalLibraryEntries = pgTable("signal_library_entries", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  creatorId: integer("creator_id").references(() => users.id),
  creatorPseudonym: text("creator_pseudonym"),
  mediaType: text("media_type").notNull(), // video, audio, pdf, link, image, text
  mediaUrl: text("media_url"),
  mediaContent: text("media_content"), // for text/markdown content
  signalType: text("signal_type").notNull(), // guide, art, ritual, tool, story, analysis
  loopType: text("loop_type"),
  fieldCondition: text("field_condition"),
  domain: text("domain"),
  tags: text("tags").array(),
  visibility: text("visibility").default("public"), // public, hub-only, pod-only
  sacredUse: boolean("sacred_use").default(false), // requires consent for replication
  ripplesCount: integer("ripples_count").default(0), // quiet counter, not public-facing
  isElderShelf: boolean("is_elder_shelf").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  loops: many(loops),
  signals: many(signals),
  decisions: many(decisions),
  decisionParticipants: many(decisionParticipants),
  resourceRequests: many(resources, { relationName: "requester" }),
  resourceApprovals: many(resources, { relationName: "approver" }),
  trustActions: many(trustActions),
  activities: many(activityLog),
  inviteCodesCreated: many(inviteCodes),
}));

export const inviteCodesRelations = relations(inviteCodes, ({ one }) => ({
  creator: one(users, {
    fields: [inviteCodes.createdBy],
    references: [users.id]
  })
}));

export const loopsRelations = relations(loops, ({ one }) => ({
  assignee: one(users, { fields: [loops.assigneeId], references: [users.id] }),
}));

export const signalsRelations = relations(signals, ({ one }) => ({
  reporter: one(users, { fields: [signals.reporterId], references: [users.id] }),
}));

export const decisionsRelations = relations(decisions, ({ one, many }) => ({
  initiator: one(users, { fields: [decisions.initiatorId], references: [users.id] }),
  participants: many(decisionParticipants),
}));

export const decisionParticipantsRelations = relations(decisionParticipants, ({ one }) => ({
  decision: one(decisions, { fields: [decisionParticipants.decisionId], references: [decisions.id] }),
  user: one(users, { fields: [decisionParticipants.userId], references: [users.id] }),
}));

export const resourcesRelations = relations(resources, ({ one }) => ({
  requester: one(users, { fields: [resources.requesterId], references: [users.id], relationName: "requester" }),
  approver: one(users, { fields: [resources.approverId], references: [users.id], relationName: "approver" }),
}));

export const trustActionsRelations = relations(trustActions, ({ one }) => ({
  user: one(users, { fields: [trustActions.userId], references: [users.id] }),
  witness: one(users, { fields: [trustActions.witnessedBy], references: [users.id] }),
}));

export const activityLogRelations = relations(activityLog, ({ one }) => ({
  user: one(users, { fields: [activityLog.userId], references: [users.id] }),
}));

export const fieldRitualsRelations = relations(fieldRituals, ({ one }) => ({
  bundle: one(institutionBundles, { fields: [fieldRituals.bundleId], references: [institutionBundles.id] }),
}));

export const sanctuaryProtocolsRelations = relations(sanctuaryProtocols, ({ one }) => ({
  participant: one(users, { fields: [sanctuaryProtocols.participantId], references: [users.id] }),
  witness: one(users, { fields: [sanctuaryProtocols.witnessId], references: [users.id] }),
}));

export const sideWorkTasksRelations = relations(sideWorkTasks, ({ one }) => ({
  user: one(users, { fields: [sideWorkTasks.userId], references: [users.id] }),
}));

export const swarmSignalsRelations = relations(swarmSignals, ({ one }) => ({
  user: one(users, { fields: [swarmSignals.userId], references: [users.id] }),
}));

export const signalLibraryEntriesRelations = relations(signalLibraryEntries, ({ one }) => ({
  creator: one(users, { fields: [signalLibraryEntries.creatorId], references: [users.id] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertInviteCodeSchema = createInsertSchema(inviteCodes).omit({ id: true, createdAt: true });
export const insertLoopSchema = createInsertSchema(loops).omit({ id: true, createdAt: true, updatedAt: true }).extend({
  dueDate: z.string().datetime().optional().or(z.date().optional())
});
export const insertSignalSchema = createInsertSchema(signals).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDecisionSchema = createInsertSchema(decisions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertResourceSchema = createInsertSchema(resources).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTrustActionSchema = createInsertSchema(trustActions).omit({ id: true, createdAt: true });
export const insertActivitySchema = createInsertSchema(activityLog).omit({ id: true, createdAt: true });
export const insertFieldRitualSchema = createInsertSchema(fieldRituals).omit({ id: true, createdAt: true });
export const insertSanctuaryProtocolSchema = createInsertSchema(sanctuaryProtocols).omit({ id: true, createdAt: true, completedAt: true });
export const insertCoherenceMeasurementSchema = createInsertSchema(coherenceMeasurements).omit({ id: true, calculatedAt: true });
export const insertSideWorkTaskSchema = createInsertSchema(sideWorkTasks).omit({ id: true, createdAt: true, acceptedAt: true, completedAt: true });
export const insertSwarmSignalSchema = createInsertSchema(swarmSignals).omit({ id: true, createdAt: true });
export const insertSwarmAggregationSchema = createInsertSchema(swarmAggregations).omit({ id: true, calculatedAt: true, lastUpdated: true });
export const insertSignalLibraryEntrySchema = createInsertSchema(signalLibraryEntries).omit({ id: true, createdAt: true, updatedAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InviteCode = typeof inviteCodes.$inferSelect;
export type InsertInviteCode = z.infer<typeof insertInviteCodeSchema>;
export type Loop = typeof loops.$inferSelect;
export type InsertLoop = z.infer<typeof insertLoopSchema>;
export type Signal = typeof signals.$inferSelect;
export type InsertSignal = z.infer<typeof insertSignalSchema>;
export type Decision = typeof decisions.$inferSelect;
export type InsertDecision = z.infer<typeof insertDecisionSchema>;
export type Resource = typeof resources.$inferSelect;
export type InsertResource = z.infer<typeof insertResourceSchema>;
export type TrustAction = typeof trustActions.$inferSelect;
export type InsertTrustAction = z.infer<typeof insertTrustActionSchema>;
export type Activity = typeof activityLog.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type SystemMetric = typeof systemMetrics.$inferSelect;
export type InstitutionBundle = typeof institutionBundles.$inferSelect;
export type FieldRitual = typeof fieldRituals.$inferSelect;
export type InsertFieldRitual = z.infer<typeof insertFieldRitualSchema>;
export type SanctuaryProtocol = typeof sanctuaryProtocols.$inferSelect;
export type InsertSanctuaryProtocol = z.infer<typeof insertSanctuaryProtocolSchema>;
export type CoherenceMeasurement = typeof coherenceMeasurements.$inferSelect;
export type InsertCoherenceMeasurement = z.infer<typeof insertCoherenceMeasurementSchema>;
export type SideWorkTask = typeof sideWorkTasks.$inferSelect;
export type InsertSideWorkTask = z.infer<typeof insertSideWorkTaskSchema>;
export type SwarmSignal = typeof swarmSignals.$inferSelect;
export type InsertSwarmSignal = z.infer<typeof insertSwarmSignalSchema>;
export type SwarmAggregation = typeof swarmAggregations.$inferSelect;
export type InsertSwarmAggregation = z.infer<typeof insertSwarmAggregationSchema>;
export type SignalLibraryEntry = typeof signalLibraryEntries.$inferSelect;
export type InsertSignalLibraryEntry = z.infer<typeof insertSignalLibraryEntrySchema>;

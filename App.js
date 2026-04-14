import { useState, useRef, useEffect } from "react";

// ─── Colors ───────────────────────────────────────────────────────────────────
const C = {
  bg: "#0A0A0F", surface: "#13131A", surfaceAlt: "#1A1A24",
  border: "#2A2A3A", accent: "#6B5CE7",
  accentSoft: "rgba(107,92,231,0.15)", accentGlow: "rgba(107,92,231,0.3)",
  text: "#F0EFF8", muted: "#8B8AA0", dim: "#5A596A",
  green: "#2ECC8F", greenSoft: "rgba(46,204,143,0.12)",
  greenBorder: "rgba(46,204,143,0.25)",
  amber: "#F59E0B", amberSoft: "rgba(245,158,11,0.12)",
};

// ─── Acknowledgment helper ────────────────────────────────────────────────────
function ack(answer, template) {
  const a = answer.trim();
  const snippet = a.slice(0, 55) + (a.length > 55 ? "…" : "");
  return template(snippet, a);
}

// ─── TRACK A: Execution ───────────────────────────────────────────────────────
const TRACK_A = {
  engagement: {
    ask: "Got it — you were on the execution side, so we'll focus on what you built and how things ran.\n\nWhat's the name of this engagement, roughly how long did it run, and how big was the team?",
    acknowledge: (a) => ack(a, () => "Logged. I have the engagement context. Now let's capture what was actually delivered."),
    followUp: "Can you add a bit more — roughly how long, and how many people were involved?",
    next: () => "a_deliverables",
    captureLabel: "Engagement Overview",
    captureArea: "overview",
  },
  a_deliverables: {
    ask: "What were the core deliverables — what did the team actually produce, build, or implement for the client?",
    acknowledge: (a) => ack(a, (s) => `Captured — "${s}" is now documented as what was delivered. Next, let's get into how things actually ran day to day. This is the part that most often stays in people's heads.`),
    followUp: "Can you be more specific? Were these strategy documents, technical builds, process designs, training materials — or a combination?",
    next: () => "a_daytoday",
    captureLabel: "Deliverables",
    captureArea: "operational",
  },
  a_daytoday: {
    ask: "Walk me through a typical week on this engagement — what were the recurring tasks, processes, or rituals that kept things running? Think SOPs, handoffs, reporting cadences, check-ins, anything that happened on a schedule.",
    acknowledge: (a) => ack(a, (s) => `That operational context is now documented — "${s}" gives the next person a real starting point. Now the most important question: tribal knowledge.`),
    followUp: "Can you go a level deeper? For example — who owned what, what tools were used daily, how were issues escalated?",
    next: () => "a_tribal",
    captureLabel: "Day-to-Day Operations",
    captureArea: "operational",
  },
  a_tribal: {
    ask: "If someone stepped into your role tomorrow with zero context, what's the one thing they'd get wrong in their first 30 days — the thing that isn't written down anywhere?",
    acknowledge: (a) => ack(a, (s) => `That's exactly the kind of insight that never makes it into documentation. "${s}" is now captured — that alone could save weeks of ramp-up time.\n\nLast area: the handoff artifacts.`),
    followUp: "Think about unwritten rules, client quirks, workarounds, or things that only work a certain way because of history. What would someone not know?",
    next: () => "a_artifacts",
    captureLabel: "Tribal Knowledge",
    captureArea: "operational",
  },
  a_artifacts: {
    ask: "What was formally documented and handed over — playbooks, runbooks, architecture diagrams, process docs, code repositories, anything else? And where does it all live?",
    acknowledge: (a) => ack(a, (s) => `Artifact inventory logged — "${s}". Future teams will know exactly what exists and where to find it.\n\nOne final question and your reports are ready.`),
    followUp: "Is there anything that exists only in someone's head right now — context or knowledge that should have been documented but wasn't?",
    next: () => "a_final",
    captureLabel: "Handoff Artifacts",
    captureArea: "handoff",
  },
  a_final: {
    ask: "Last question: is there anything important about this engagement — a risk, a workaround, a piece of context — that we haven't covered and that the next person or team absolutely needs to know?",
    acknowledge: (a) => ack(a, () => "Captured. That's a complete operational debrief — generating your reports now."),
    next: () => "done",
    captureLabel: "Additional Context",
    captureArea: "overview",
  },
};

// ─── TRACK B: Leadership ──────────────────────────────────────────────────────
const TRACK_B = {
  engagement: {
    ask: "Got it — you led or managed this engagement, so we'll focus on decisions, client relationship, and firm-level learnings.\n\nWhat's the name of this engagement, roughly how long did it run, and what was the team composition?",
    acknowledge: (a) => ack(a, () => "Logged. I have the engagement context. Let's get into what was delivered and the decisions that shaped it."),
    followUp: "Can you add a bit more — roughly how long, and how the team was structured?",
    next: () => "b_deliverables",
    captureLabel: "Engagement Overview",
    captureArea: "overview",
  },
  b_deliverables: {
    ask: "What were the core deliverables, and what were the two or three most important decisions made during this engagement — either by your team or jointly with the client?",
    acknowledge: (a) => ack(a, (s) => `Captured — "${s}" is now part of the institutional record. Future teams will see not just what was delivered, but the decisions that shaped it.\n\nNow: how did the client land?`),
    followUp: "On the decisions — what made them significant? Tradeoffs, client pressure, impact on the outcome?",
    next: () => "b_handoff",
    captureLabel: "Deliverables & Key Decisions",
    captureArea: "overview",
  },
  b_handoff: {
    ask: "How complete was the knowledge handoff to the client — are they in a position to carry this forward independently? And what's the biggest risk for them in the next 90 days?",
    acknowledge: (a) => {
      const weak = /gap|poor|incomplete|missing|struggle|partial|not really|no/i.test(a);
      return weak
        ? ack(a, () => "That's an important flag — exactly what gets lost if no one documents it. I've noted the handoff as incomplete and flagged the risk. Let's make sure the lessons don't get lost too.")
        : ack(a, () => "Good to hear. Handoff logged as strong. Let's capture the lessons while they're fresh.");
    },
    followUp: "What specifically would have made the handoff stronger — gaps in documentation, training, or context they'll need later?",
    next: () => "b_lessons",
    captureLabel: "Handoff & Client Risk",
    captureArea: "handoff",
  },
  b_lessons: {
    ask: "What worked particularly well on this engagement that you'd want to replicate — and what would you do differently if you were starting over?",
    acknowledge: (a) => ack(a, (s) => `Both sides captured — "${s}". That goes directly into the firm's methodology record so the next team benefits.\n\nNow let's look at what broke internally.`),
    followUp: "On what didn't work — was that a process issue, a scope issue, a people issue, or something outside your control?",
    next: () => "b_process",
    captureLabel: "Lessons Learned",
    captureArea: "lessons",
  },
  b_process: {
    ask: "Did anything break down internally — resourcing, tools, communication, methodology — that the firm should fix before the next engagement like this?",
    acknowledge: (a) => ack(a, (s) => `Flagged for leadership — "${s}" will appear as an action item, not just a note.\n\nLast area: the client relationship and what's next.`),
    followUp: "Has this come up on other engagements, or is this the first time you've seen this issue?",
    next: () => "b_relationship",
    captureLabel: "Process Flags",
    captureArea: "lessons",
  },
  b_relationship: {
    ask: "How would you describe the client relationship as of today — and is there a realistic opportunity for follow-on work? If so, what's the most natural next engagement?",
    acknowledge: (a) => {
      const strong = /strong|great|good|excellent|positive|solid/i.test(a);
      return strong
        ? ack(a, () => "Strong relationship and opportunity logged. That context will be in the report so the right person can act on it.\n\nOne final question and your reports are ready.")
        : ack(a, () => "Noted candidly. I've flagged the relationship status so leadership knows what needs attention.\n\nOne final question and your reports are ready.");
    },
    followUp: "Who on the client side is the right person to keep the relationship warm going forward?",
    next: () => "b_final",
    captureLabel: "Relationship & Opportunity",
    captureArea: "relationship",
  },
  b_final: {
    ask: "Last question: is there anything important — a risk, an insight, a piece of context — that we haven't covered and that leadership or future teams should know?",
    acknowledge: (a) => ack(a, () => "Captured. That's a complete leadership debrief — generating your reports now."),
    next: () => "done",
    captureLabel: "Additional Context",
    captureArea: "overview",
  },
};

// ─── Capture Areas ────────────────────────────────────────────────────────────
const AREAS_A = [
  { id: "overview",    label: "Engagement Overview",   icon: "📁" },
  { id: "operational", label: "Operational Knowledge", icon: "⚙️" },
  { id: "handoff",     label: "Handoff Artifacts",     icon: "📦" },
];
const AREAS_B = [
  { id: "overview",      label: "Engagement Overview",   icon: "📁" },
  { id: "handoff",       label: "Handoff & Risk",        icon: "🤝" },
  { id: "lessons",       label: "Lessons & Process",     icon: "💡" },
  { id: "relationship",  label: "Client & Opportunity",  icon: "📈" },
];

// ─── Report Builders ──────────────────────────────────────────────────────────
function buildReports(answers, track) {
  const g = (id) => answers[id] || "Not captured";
  const date = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  if (track === "A") {
    const operational = `**OPERATIONAL HANDOFF BRIEF**
ExitIQ · ${date}

**ENGAGEMENT OVERVIEW**
${g("engagement")}

**WHAT WAS DELIVERED**
${g("a_deliverables")}

**HOW THINGS RAN DAY-TO-DAY**
${g("a_daytoday")}

**TRIBAL KNOWLEDGE — READ THIS FIRST**
${g("a_tribal")}

**HANDOFF ARTIFACTS & WHERE THEY LIVE**
${g("a_artifacts")}

**ADDITIONAL CONTEXT**
${g("a_final")}

**RECOMMENDED ACTIONS FOR INCOMING RESOURCE**
1. Review all artifacts listed above before your first client interaction.
2. Schedule a 30-minute walkthrough with the outgoing consultant within the first week.
3. Pay close attention to the tribal knowledge flagged above — this is your highest ramp-up risk.
4. Confirm system access and tool permissions on day one.
5. Request a 30-day check-in with the client to surface any gaps post-transition.`;

    const internal = `**INTERNAL ENGAGEMENT REPORT**
ExitIQ · ${date}

**ENGAGEMENT OVERVIEW**
${g("engagement")}

**DELIVERABLES COMPLETED**
${g("a_deliverables")}

**OPERATIONAL KNOWLEDGE CAPTURED**
Day-to-day processes: ${g("a_daytoday")}

Tribal knowledge documented: ${g("a_tribal")}

**HANDOFF STATUS**
Artifacts: ${g("a_artifacts")}

**NOTES FOR LEADERSHIP**
${g("a_final")}

**RECOMMENDED ACTIONS**
1. Ensure incoming resource has reviewed the Operational Handoff Brief before day one.
2. Confirm all artifacts are in the firm's standard repository — not on personal drives.
3. Flag any undocumented tribal knowledge for the methodology library.
4. Schedule engagement retrospective with the full team within two weeks.
5. Assign a senior point of contact to support the incoming resource during their first 30 days.`;

    return { operational, internal };
  }

  const handoffWeak = /gap|poor|incomplete|missing|struggle|partial|not really|no/i.test(g("b_handoff"));
  const relStrong = /strong|great|good|excellent|positive|solid/i.test(g("b_relationship"));

  const operational = `**OPERATIONAL HANDOFF BRIEF**
ExitIQ · ${date}

**ENGAGEMENT OVERVIEW**
${g("engagement")}

**WHAT WAS DELIVERED**
${g("b_deliverables")}

**HANDOFF STATUS**
${g("b_handoff")}

**RECOMMENDED ACTIONS FOR INCOMING RESOURCE**
1. Review all engagement deliverables before first client contact.
2. ${handoffWeak ? "Request a supplementary handoff session — the outgoing lead flagged gaps that need to be addressed." : "Confirm handoff documentation is complete and accessible."}
3. Identify key client stakeholders and schedule introductory calls within the first two weeks.
4. Review the client risk flagged above and raise with your manager if unresolved.
5. Request a 30-day check-in with the client to confirm continuity.`;

  const internal = `**INTERNAL ENGAGEMENT REPORT**
ExitIQ · ${date}

**ENGAGEMENT OVERVIEW**
${g("engagement")}

**DELIVERABLES & KEY DECISIONS**
${g("b_deliverables")}

**CLIENT HANDOFF & RISK**
${g("b_handoff")}

**LESSONS LEARNED**
${g("b_lessons")}

**PROCESS FLAGS**
${g("b_process")}

**CLIENT RELATIONSHIP & FUTURE OPPORTUNITY**
${g("b_relationship")}

**ADDITIONAL CONTEXT**
${g("b_final")}

**RECOMMENDED ACTIONS**
1. ${handoffWeak ? "Schedule follow-up handoff session with client within 2 weeks to address documented gaps." : "Send formal engagement close summary to client sponsor within one week."}
2. ${g("b_process").length > 20 ? `Address process flag: "${g("b_process").slice(0, 70)}…" — assign owner and 30-day resolution deadline.` : "Review engagement methodology and update standard templates."}
3. ${relStrong ? "Develop follow-on proposal targeting the opportunity identified — initiate outreach within 30 days." : "Assign a senior partner to re-engage the client and address relationship concerns within 30 days."}
4. Add lessons from this engagement to the firm's methodology library.
5. Schedule a full team retrospective within two weeks while context is fresh.`;

  return { operational, internal };
}

// ─── Engine helpers ───────────────────────────────────────────────────────────
const getNodes = (track) => track === "A" ? TRACK_A : TRACK_B;
const getAreas = (track) => track === "A" ? AREAS_A : AREAS_B;

function shouldFollowUp(nodeId, answer, track) {
  const node = getNodes(track)[nodeId];
  if (!node?.followUp) return false;
  const words = answer.trim().split(/\s+/);
  if (words.length < 10) return true;
  const hasDetail = words.slice(1).some(w => /^[A-Z]/.test(w) || /\d/.test(w));
  return !hasDetail;
}

// ─── UI Primitives ────────────────────────────────────────────────────────────
function Dots() {
  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: C.muted, animation: "blink 1.2s infinite", animationDelay: `${i * 0.2}s` }} />
      ))}
    </div>
  );
}

function Rich({ text }) {
  const html = text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br/>");
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

function Avatar({ role }) {
  return (
    <div style={{
      width: 28, height: 28, borderRadius: 8, flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 11, fontWeight: 700,
      ...(role === "assistant"
        ? { background: "linear-gradient(135deg,#6B5CE7,#9B6EF3)", color: "#fff", boxShadow: "0 0 12px rgba(107,92,231,.3)" }
        : { background: C.surfaceAlt, border: `1px solid ${C.border}`, color: C.muted }),
    }}>
      {role === "assistant" ? "E" : "↑"}
    </div>
  );
}

// ─── Capture Panel ────────────────────────────────────────────────────────────
function CapturePanel({ captured, open, onToggle, track }) {
  const areas = getAreas(track);
  const nodes = getNodes(track);
  const total = Object.keys(nodes).length;
  const count = Object.keys(captured).length;

  return (
    <div style={{ borderTop: `1px solid ${C.border}`, background: C.surface, flexShrink: 0 }}>
      <button onClick={onToggle} style={{ width: "100%", padding: "10px 20px", background: "none", border: "none", color: C.text, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span>📋</span>
          <span style={{ fontWeight: 500 }}>Live Capture</span>
          <span style={{ fontSize: 11, color: C.muted, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 999, padding: "1px 7px" }}>{count}/{total}</span>
        </div>
        <span style={{ color: C.muted, fontSize: 11 }}>{open ? "▼" : "▲"} view</span>
      </button>
      {open && (
        <div style={{ padding: "0 16px 16px", maxHeight: 240, overflowY: "auto" }}>
          {areas.map(area => {
            const areaNodes = Object.entries(nodes).filter(([, n]) => n.captureArea === area.id);
            const hasAny = areaNodes.some(([id]) => captured[id]);
            return (
              <div key={area.id} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: hasAny ? C.accent : C.dim, marginBottom: 5, display: "flex", alignItems: "center", gap: 5 }}>
                  {area.icon} {area.label} {hasAny && <span style={{ color: C.green }}>✓</span>}
                </div>
                {areaNodes.map(([id, node]) => (
                  <div key={id} style={{ fontSize: 12, marginBottom: 4, padding: "6px 10px", borderRadius: 8, background: captured[id] ? C.surfaceAlt : "transparent", border: `1px solid ${captured[id] ? C.border : "transparent"}` }}>
                    <div style={{ color: C.dim, fontSize: 10, marginBottom: 2 }}>{node.captureLabel}</div>
                    {captured[id]
                      ? <div style={{ color: C.text, lineHeight: 1.4 }}>{captured[id].slice(0, 100)}{captured[id].length > 100 ? "…" : ""}</div>
                      : <div style={{ color: C.dim, fontStyle: "italic" }}>Pending…</div>}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Report View ──────────────────────────────────────────────────────────────
function ReportView({ reports }) {
  const [active, setActive] = useState("operational");
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
      <div style={{ display: "flex", borderBottom: `1px solid ${C.border}` }}>
        {[
          { id: "operational", label: "📦 Handoff Brief", sub: "For incoming resource" },
          { id: "internal",    label: "📊 Internal Report", sub: "For firm leadership" },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActive(tab.id)} style={{ flex: 1, padding: "12px 16px", background: active === tab.id ? C.surfaceAlt : "transparent", border: "none", borderBottom: active === tab.id ? `2px solid ${C.accent}` : "2px solid transparent", cursor: "pointer", transition: "all .15s" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: active === tab.id ? C.text : C.muted }}>{tab.label}</div>
            <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>{tab.sub}</div>
          </button>
        ))}
      </div>
      <div style={{ padding: "22px 24px" }}>
        <div style={{ fontSize: 13.5, lineHeight: 1.8, color: C.text }}>
          <Rich text={reports[active]} />
        </div>
      </div>
    </div>
  );
}

// ─── Feedback Screen ──────────────────────────────────────────────────────────
const QUESTIONS = [
  { id: "q_flow",    label: "The interview questions flowed naturally" },
  { id: "q_heard",  label: "I felt my answers were being captured and acknowledged" },
  { id: "q_report", label: "The reports at the end were useful and specific" },
  { id: "q_speed",  label: "The interview was the right length — not too long or short" },
];

function FeedbackScreen({ onComplete }) {
  const [ratings, setRatings] = useState({});
  const [comments, setComments] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function setRating(id, val) {
    setRatings(prev => ({ ...prev, [id]: val }));
  }

  function submit() {
    // In production this would POST to an endpoint
    // For the PoC, log to console so testers' feedback is visible in the browser devtools
    const feedback = { name, email, ratings, comments, timestamp: new Date().toISOString() };
    console.log("ExitIQ Beta Feedback:", JSON.stringify(feedback, null, 2));
    setSubmitted(true);
  }

  const allRated = QUESTIONS.every(q => ratings[q.id]);
  const canSubmit = allRated && (name.trim() || email.trim());

  if (submitted) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40, textAlign: "center", position: "relative", zIndex: 1 }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>🙏</div>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-.4px", marginBottom: 12 }}>Thanks for testing ExitIQ.</div>
        <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.7, maxWidth: 360 }}>
          Your feedback has been recorded. This is an early-stage product and your input directly shapes what gets built next.
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "24px 20px", maxWidth: 600, width: "100%", margin: "0 auto", position: "relative", zIndex: 1 }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: C.accent, marginBottom: 8 }}>Beta Feedback</div>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-.4px", marginBottom: 8 }}>How did ExitIQ feel?</div>
        <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.6 }}>Rate each statement and leave any comments. This takes about 2 minutes.</div>
      </div>

      {/* Rating questions */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
        {QUESTIONS.map(q => (
          <div key={q.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: C.text, marginBottom: 12, lineHeight: 1.4 }}>{q.label}</div>
            <div style={{ display: "flex", gap: 8 }}>
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => setRating(q.id, n)} style={{
                  flex: 1, padding: "8px 4px", borderRadius: 8, border: `1px solid ${ratings[q.id] === n ? C.accent : C.border}`,
                  background: ratings[q.id] === n ? C.accentSoft : "transparent",
                  color: ratings[q.id] === n ? C.accent : C.muted,
                  fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all .15s",
                }}>
                  {n}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
              <span style={{ fontSize: 10, color: C.dim }}>Strongly disagree</span>
              <span style={{ fontSize: 10, color: C.dim }}>Strongly agree</span>
            </div>
          </div>
        ))}
      </div>

      {/* Open comments */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: C.text, marginBottom: 8 }}>Any other thoughts? What would you change?</div>
        <textarea
          value={comments}
          onChange={e => setComments(e.target.value)}
          placeholder="The questions felt… / I wished it asked about… / The report was missing…"
          rows={4}
          style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px", color: C.text, fontSize: 14, lineHeight: 1.6, resize: "none", outline: "none", fontFamily: "inherit", transition: "border-color .2s" }}
        />
      </div>

      {/* Identity */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: C.text, marginBottom: 8 }}>Your name and / or email <span style={{ color: C.dim, fontWeight: 400 }}>(so we can follow up)</span></div>
        <div style={{ display: "flex", gap: 10 }}>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Name"
            style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "11px 14px", color: C.text, fontSize: 14, outline: "none", fontFamily: "inherit" }}
          />
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email"
            style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "11px 14px", color: C.text, fontSize: 14, outline: "none", fontFamily: "inherit" }}
          />
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={submit}
        disabled={!canSubmit}
        style={{
          width: "100%", padding: "14px", borderRadius: 12, border: "none",
          background: canSubmit ? "linear-gradient(135deg,#6B5CE7,#9B6EF3)" : C.surfaceAlt,
          color: canSubmit ? "#fff" : C.dim,
          fontSize: 15, fontWeight: 600, cursor: canSubmit ? "pointer" : "not-allowed",
          boxShadow: canSubmit ? "0 8px 28px rgba(107,92,231,.35)" : "none",
          transition: "all .2s", marginBottom: 12,
        }}
      >
        Submit Feedback
      </button>
      {!canSubmit && (
        <div style={{ fontSize: 12, color: C.dim, textAlign: "center" }}>
          {!allRated ? "Rate all 4 statements to continue" : "Add your name or email to submit"}
        </div>
      )}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function ExitIQ() {
  const [phase, setPhase] = useState("start"); // start | role | chat | done | feedback
  const [track, setTrack] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [currentNodeId, setCurrentNodeId] = useState("engagement");
  const [awaitingFollowUp, setAwaitingFollowUp] = useState(false);
  const [answers, setAnswers] = useState({});
  const [typing, setTyping] = useState(false);
  const [reports, setReports] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const bottomRef = useRef(null);
  const taRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, typing, reports]);

  function addBot(text, delay = 900) {
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMsgs(prev => [...prev, { role: "assistant", content: text }]);
    }, delay);
  }

  function selectTrack(t) {
    setTrack(t);
    setPhase("chat");
    setMsgs([{ role: "assistant", content: getNodes(t)["engagement"].ask }]);
    setCurrentNodeId("engagement");
  }

  function send() {
    if (!input.trim() || typing) return;
    const text = input.trim();
    setInput("");
    if (taRef.current) taRef.current.style.height = "auto";
    setMsgs(prev => [...prev, { role: "user", content: text }]);

    if (awaitingFollowUp) {
      const combined = (answers[currentNodeId] || "") + " " + text;
      const newAnswers = { ...answers, [currentNodeId]: combined };
      setAnswers(newAnswers);
      setAwaitingFollowUp(false);
      advance(currentNodeId, text, newAnswers, combined);
      return;
    }

    const newAnswers = { ...answers, [currentNodeId]: text };
    setAnswers(newAnswers);

    if (shouldFollowUp(currentNodeId, text, track)) {
      setAwaitingFollowUp(true);
      addBot(getNodes(track)[currentNodeId].followUp, 700);
      return;
    }

    advance(currentNodeId, text, newAnswers, text);
  }

  function advance(nodeId, answer, allAnswers, fullAnswer) {
    const nodes = getNodes(track);
    const node = nodes[nodeId];
    const ackText = node.acknowledge ? node.acknowledge(fullAnswer) : null;
    const nextId = node.next(answer);

    if (nextId === "done") {
      if (ackText) {
        addBot(ackText, 700);
        setTimeout(() => {
          const r = buildReports(allAnswers, track);
          setReports(r);
          setPhase("done");
        }, 2400);
      } else {
        setReports(buildReports(allAnswers, track));
        setPhase("done");
      }
      return;
    }

    const nextNode = nodes[nextId];
    if (ackText) {
      addBot(ackText, 700);
      setTimeout(() => {
        setCurrentNodeId(nextId);
        setTyping(true);
        setTimeout(() => {
          setTyping(false);
          setMsgs(prev => [...prev, { role: "assistant", content: nextNode.ask }]);
        }, 800);
      }, 1800);
    } else {
      setCurrentNodeId(nextId);
      addBot(nextNode.ask, 700);
    }
  }

  function onKey(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }
  function resize(e) {
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
  }

  const nodes = track ? getNodes(track) : {};
  const progress = Object.keys(nodes).length
    ? Math.min(100, Math.round((Object.keys(answers).length / Object.keys(nodes).length) * 100))
    : 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:${C.bg}}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-thumb{background:${C.border};border-radius:2px}
        @keyframes blink{0%,100%{opacity:.25;transform:scale(.75)}50%{opacity:1;transform:scale(1)}}
        @keyframes fadein{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .msg{animation:fadein .22s ease forwards}
        textarea,input{outline:none;font-family:inherit}
        textarea:focus,input:focus{border-color:rgba(107,92,231,.55)!important}
        textarea::placeholder,input::placeholder{color:${C.dim}}
        .role-card:hover{border-color:${C.accent}!important;background:${C.accentSoft}!important}
        .sbtn:hover{transform:translateY(-2px)!important;box-shadow:0 14px 40px rgba(107,92,231,.45)!important}
        .sndbtn:hover:not([disabled]){transform:scale(1.07)}
      `}</style>

      <div style={{ height: "100vh", background: C.bg, color: C.text, fontFamily: "'DM Sans',sans-serif", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ position: "fixed", inset: 0, backgroundImage: `radial-gradient(ellipse 70% 50% at 15% 0%,rgba(107,92,231,.1) 0%,transparent 60%),radial-gradient(ellipse 50% 40% at 85% 100%,rgba(46,204,143,.06) 0%,transparent 50%)`, pointerEvents: "none", zIndex: 0 }} />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: `1px solid ${C.border}`, background: "rgba(10,10,15,.92)", backdropFilter: "blur(14px)", zIndex: 10, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#6B5CE7,#9B6EF3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#fff", boxShadow: "0 0 16px rgba(107,92,231,.35)" }}>E</div>
            <span style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-.3px" }}>Exit<span style={{ color: C.accent }}>IQ</span></span>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", padding: "2px 7px", borderRadius: 999, background: C.amberSoft, color: C.amber, border: `1px solid rgba(245,158,11,.25)` }}>Beta</span>
          </div>
          {phase === "chat" && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ fontSize: 11, color: C.dim }}>{track === "A" ? "Execution" : "Leadership"}</div>
              <div style={{ width: 72, height: 4, borderRadius: 2, background: C.border, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg,#6B5CE7,#9B6EF3)", transition: "width .5s ease" }} />
              </div>
              <span style={{ fontSize: 11, color: C.muted, minWidth: 28 }}>{progress}%</span>
            </div>
          )}
          {phase === "done" && (
            <button onClick={() => setPhase("feedback")} style={{ fontSize: 12, fontWeight: 500, padding: "5px 12px", borderRadius: 999, background: C.greenSoft, color: C.green, border: `1px solid ${C.greenBorder}`, cursor: "pointer" }}>
              ✓ Reports Ready · Leave Feedback →
            </button>
          )}
          {phase === "feedback" && (
            <div style={{ fontSize: 11, color: C.muted }}>Beta Feedback</div>
          )}
        </div>

        {/* Start */}
        {phase === "start" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", textAlign: "center", position: "relative", zIndex: 1, overflowY: "auto" }}>
            {/* Beta banner */}
            <div style={{ background: C.amberSoft, border: `1px solid rgba(245,158,11,.25)`, borderRadius: 10, padding: "10px 16px", marginBottom: 32, maxWidth: 420, width: "100%" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.amber, marginBottom: 4 }}>🧪 You're testing an early version of ExitIQ</div>
              <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>Complete the interview, review your reports, and share feedback at the end. Your input shapes what gets built next.</div>
            </div>
            <div style={{ width: 72, height: 72, borderRadius: 20, background: "linear-gradient(135deg,#6B5CE7,#9B6EF3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, marginBottom: 24, boxShadow: "0 0 40px rgba(107,92,231,.35)" }}>🧠</div>
            <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-.5px", marginBottom: 12 }}>Capture what the project knew.</div>
            <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.7, maxWidth: 380, marginBottom: 32 }}>
              A structured AI-led debrief at engagement close. Your answers get documented in real time and compiled into two reports — an <strong style={{ color: C.text }}>Operational Handoff Brief</strong> and an <strong style={{ color: C.text }}>Internal Report</strong>.
            </div>
            <button className="sbtn" onClick={() => setPhase("role")} style={{ padding: "14px 30px", borderRadius: 12, background: "linear-gradient(135deg,#6B5CE7,#9B6EF3)", border: "none", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", boxShadow: "0 8px 28px rgba(107,92,231,.4)", transition: "transform .15s,box-shadow .15s" }}>
              Start Offboarding Interview →
            </button>
          </div>
        )}

        {/* Role selection */}
        {phase === "role" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", position: "relative", zIndex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: C.muted, marginBottom: 12 }}>Before we begin</div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-.4px", marginBottom: 8, textAlign: "center" }}>What was your role on this engagement?</div>
            <div style={{ fontSize: 14, color: C.muted, marginBottom: 32, textAlign: "center" }}>Your answer shapes which questions you'll be asked.</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 420 }}>
              <button className="role-card" onClick={() => selectTrack("A")} style={{ padding: "18px 20px", borderRadius: 14, background: C.surface, border: `1px solid ${C.border}`, cursor: "pointer", textAlign: "left", transition: "all .15s" }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 4 }}>⚙️ I was on the execution team</div>
                <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.5 }}>Analyst, Consultant, or Senior Consultant. I built the work, ran the day-to-day, and know how things operated.</div>
              </button>
              <button className="role-card" onClick={() => selectTrack("B")} style={{ padding: "18px 20px", borderRadius: 14, background: C.surface, border: `1px solid ${C.border}`, cursor: "pointer", textAlign: "left", transition: "all .15s" }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 4 }}>📊 I led or managed the engagement</div>
                <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.5 }}>Manager or Senior Manager. I owned the client relationship, key decisions, and firm-level outcomes.</div>
              </button>
            </div>
          </div>
        )}

        {/* Chat */}
        {(phase === "chat" || phase === "done") && (
          <>
            <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: 14, maxWidth: 720, width: "100%", margin: "0 auto", position: "relative", zIndex: 1 }}>
              {msgs.map((m, i) => (
                <div key={i} className="msg" style={{ display: "flex", flexDirection: m.role === "user" ? "row-reverse" : "row", alignItems: "flex-end", gap: 8 }}>
                  <Avatar role={m.role} />
                  <div style={{ maxWidth: "80%", padding: "11px 15px", fontSize: 14, lineHeight: 1.65, borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px", background: m.role === "user" ? C.accent : C.surface, border: m.role === "user" ? "none" : `1px solid ${C.border}`, color: m.role === "user" ? "#fff" : C.text, boxShadow: m.role === "user" ? "0 4px 16px rgba(107,92,231,.3)" : "none" }}>
                    <Rich text={m.content} />
                  </div>
                </div>
              ))}
              {typing && (
                <div className="msg" style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
                  <Avatar role="assistant" />
                  <div style={{ padding: "12px 16px", borderRadius: "14px 14px 14px 4px", background: C.surface, border: `1px solid ${C.border}` }}><Dots /></div>
                </div>
              )}
              {reports && (
                <div className="msg">
                  <ReportView reports={reports} />
                  <div style={{ marginTop: 12, textAlign: "center" }}>
                    <button onClick={() => setPhase("feedback")} style={{ padding: "10px 22px", borderRadius: 10, background: C.accentSoft, border: `1px solid ${C.accentGlow}`, color: C.accent, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                      Leave feedback on this experience →
                    </button>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {phase === "chat" && (
              <div style={{ flexShrink: 0, zIndex: 10 }}>
                <CapturePanel captured={answers} open={panelOpen} onToggle={() => setPanelOpen(p => !p)} track={track} />
                <div style={{ padding: "10px 20px 16px", background: "rgba(10,10,15,.95)", backdropFilter: "blur(14px)" }}>
                  <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", gap: 10, alignItems: "flex-end" }}>
                    <textarea ref={taRef} value={input} onChange={e => { setInput(e.target.value); resize(e); }} onKeyDown={onKey} placeholder="Type your response… (Enter to send)" rows={1} disabled={typing} style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "11px 14px", color: C.text, fontSize: 14, lineHeight: 1.5, resize: "none", minHeight: 44, maxHeight: 140, transition: "border-color .2s" }} />
                    <button className="sndbtn" onClick={send} disabled={!input.trim() || typing} style={{ width: 44, height: 44, borderRadius: 12, border: "none", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", cursor: (!input.trim() || typing) ? "not-allowed" : "pointer", transition: "all .2s", background: (!input.trim() || typing) ? C.surfaceAlt : "linear-gradient(135deg,#6B5CE7,#9B6EF3)", boxShadow: (!input.trim() || typing) ? "none" : "0 4px 14px rgba(107,92,231,.4)" }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Feedback */}
        {phase === "feedback" && <FeedbackScreen />}
      </div>
    </>
  );
}

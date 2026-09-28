# ✅ CareLink Agentic AI — Master Task Tracker

> **Event:** Bharat Agentic 2026 | AIKart 12-Hour Hackathon (1 Oct 2026)  
> **Project:** CareLink Autonomous Multi-Agent HealthTech Platform  
> **Lead:** Nishant Maurya ([nishantma05@gmail.com](mailto:nishantma05@gmail.com))  
> **PRD Reference:** [`docs/Prd.md`](file:///c:/Users/nisha/OneDrive/Documents/Downloads/carelink/docs/Prd.md)  
> **Status:** 🟡 Ready for Phase 1 Execution  

---

## 📊 Progress Overview

```
Phase 1 — Foundation & Model Gateway   ██████████ 100% ✅
Phase 2 — PHI Guardrails & Knowledge   ██████████ 100% ✅
Phase 3 — Supervisor & Specialist      ██████████ 100% ✅
Phase 4 — Long-Term Memory & Feedback  ██████████ 100% ✅
Phase 5 — Frontend Agent Cockpit UI    ░░░░░░░░░░   0% ⏳
Phase 6 — Observability & E2E Testing  ░░░░░░░░░░   0% ⏳
```

---

## 🚀 Phase 1: Foundation & Dual-Model Failover Engine
- [x] **Task 1.1:** Set up agent module structure in `backend/agents/`.
- [x] **Task 1.2:** Build `gateway.py` (Multi-LLM gateway supporting Gemini with instant auto-failover to Groq on HTTP 429/quota limits).
- [x] **Task 1.3:** Add token usage and latency telemetry tracking to all model calls.
- [x] **Task 1.4:** Verify failover resilience with live test script simulating primary quota exhaustion.

---

## 🛡️ Phase 2: PHI Guardrails & Clinical RAG Engine
- [x] **Task 2.1:** Build `guardrails.py` & `src/lib/guardrails.ts` (HIPAA zero-leak anonymizer with Regex + NER detection, token map roundtrip, and medical hazard filter).
- [x] **Task 2.2:** Build `clinical_rag.py` & `src/lib/clinicalRag.ts` (Qdrant Cloud vector index with local in-memory cosine fallback).
- [x] **Task 2.3:** Seed 10 clinical guidelines (ICMR, WHO, NICE, AHA, KDIGO, IAP protocols with evidence tiers).
- [x] **Task 2.4:** Build `citation_resolver.py` & `src/lib/citationResolver.ts` (Enforces bracketed citations `[ICMR-HF-01]`, computes grounding fidelity score, and generates UI evidence badges).

---

## 🧠 Phase 3: LangGraph Supervisor & Specialist Agents
- [x] **Task 3.1:** Define `state.py` & `src/lib/agents/state.ts` (`CareLinkAgentState` with patient demographics, vitals, SHAP values, risk scores, care plans).
- [x] **Task 3.2:** Build `supervisor.py` & `src/lib/agents/supervisor.ts` (StateGraph router with intent classification, confidence floor $\ge 0.60$, and fallback routing).
- [x] **Task 3.3:** Build `triage_agent.py` & `src/lib/agents/triageAgent.ts` (ReAct loop: vitals tool + MTS severity rules + RAG protocol + self-critique).
- [x] **Task 3.4:** Build `risk_analyst_agent.py` & `src/lib/agents/riskAnalystAgent.ts` (XGBoost ML interpretation + SHAP factor narrative + similar patient cohort search).
- [x] **Task 3.5:** Build `care_plan_agent.py` & `src/lib/agents/carePlanAgent.ts` (Autonomous 4-part post-discharge plan generator: meds, visits, diet, warning signs).
- [x] **Task 3.6:** Build `medication_safety_agent.py` & `src/lib/agents/medicationSafetyAgent.ts` (Drug-drug interaction safety checker with CRITICAL blocker).

---

## 💾 Phase 4: Long-Term Memory & Active Learning
- [x] **Task 4.1:** Build `memory.py` & `src/lib/memory.ts` (Mem0 Cloud REST + local JSON mirror cross-session memory service to recall patient chronic history, allergies, and clinician directives).
- [x] **Task 4.2:** Build `feedback_agent.py` & `src/lib/feedbackAgent.ts` (Active learning feedback monitor with $>15\%$ override drift detection and fine-tuning dataset generation).

---

## 🖥️ Phase 5: Frontend Agent Cockpit UI
- [ ] **Task 5.1:** Add "Agent Cockpit" view (`AgentCockpitView.tsx`) to CareLink navigation.
- [ ] **Task 5.2:** Implement live agent execution graph visualizer and step-by-step reasoning log feed.
- [ ] **Task 5.3:** Create Care Plan review card with medication safety check badge and PDF export button.
- [ ] **Task 5.4:** Integrate frontend with backend `/api/agent/run` and `/api/agent/triage` endpoints.

---

## 📈 Phase 6: Observability, End-to-End Testing & Git Checkpoint
- [ ] **Task 6.1:** Configure LangSmith trace exports and RAGAS faithfulness benchmark runner ($>0.85$ target).
- [ ] **Task 6.2:** Execute full End-to-End pipeline test:
  - Ingest patient $\rightarrow$ Supervisor router $\rightarrow$ Triage ReAct loop $\rightarrow$ Care Plan generation $\rightarrow$ Drug safety check $\rightarrow$ UI telemetry.
- [ ] **Task 6.3:** Commit verified changes to git repository locally (do not push to remote).

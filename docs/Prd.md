# 📋 CareLink x Bharat Agentic 2026 — Product Requirements Document (PRD)

> **Project Name:** CareLink Agentic AI — Autonomous Multi-Agent HealthTech Platform  
> **Fusion Target:** CareLink Core + AuRAG Agentic Architecture  
> **Event:** Bharat Agentic 2026 | AIKart 12-Hour Hackathon (1 Oct 2026)  
> **Track:** HealthTech — Agentic AI Engineer  
> **Author & Lead:** Nishant Maurya ([nishantma05@gmail.com](mailto:nishantma05@gmail.com))  
> **Status:** 🟢 Approved Specification & Phased Execution Blueprint  
> **Version:** 2.5.0-Agentic  

---

## Executive Summary

CareLink is a production-grade HealthTech application featuring federated learning across 3 hospital nodes, XGBoost readmission prediction (ROC-AUC 0.727), SHAP factor explainability, HIPAA-aligned differential privacy, and a responsive React 19 UI. 

However, its initial clinical triage relied on a single-shot Gemini LLM call. For **Bharat Agentic 2026**, CareLink is upgraded into a **full 9-Layer Autonomous Multi-Agent System**. By extracting and fusing core agentic components from **AuRAG** (LangGraph Supervisor, ReAct Agent Loops, Long-Term Memory via Mem0, and Dual-Model Gemini $\rightarrow$ Groq Auto-Failover), CareLink evolves into an autonomous clinical decision-support ecosystem with zero PHI leaks, evidence-grounded Clinical RAG, drug-interaction safety gates, and live LangSmith telemetry.

```
       ┌────────────────────────────────────────────────────────┐
       │     CareLink Agent Cockpit UI (React 19 + Vite)        │
       └──────────────────────────┬─────────────────────────────┘
                                  │
       ┌──────────────────────────▼─────────────────────────────┐
       │    Supervisor Agent (LangGraph Stateful Router)        │
       │    Intent Classification • StateGraph • Confidence     │
       └─────┬──────────────┬──────────────┬──────────────┬─────┘
             │              │              │              │
    ┌────────▼──────┐┌──────▼──────┐┌──────▼──────┐┌──────▼──────┐
    │ Triage Agent  ││ Care Plan   ││Risk Analyst ││Med Safety   │
    │ ReAct Loop    ││ Discharge   ││XGB+SHAP+RAG ││OpenFDA Gate │
    └────────┬──────┘└──────┬──────┘└──────┬──────┘└──────┬──────┘
             │              │              │              │
       ┌─────▼──────────────▼──────────────▼──────────────▼─────┐
       │   PHI Guardrails Agent (Regex + NER De-identification) │
       └──────────────────────────┬─────────────────────────────┘
                                  │
       ┌──────────────────────────▼─────────────────────────────┐
       │  Resilient Model Gateway (Gemini ↔ Groq Auto-Failover) │
       └──────────────────────────┬─────────────────────────────┘
                                  │
       ┌──────────────────────────▼─────────────────────────────┐
       │  Clinical RAG (Qdrant) + Long Memory (Mem0 / Supabase) │
       └────────────────────────────────────────────────────────┘
```

---

## 1. Problem Statement & Hackathon Objectives

### 1.1 The Healthcare Gap
In acute and post-discharge hospital settings, clinicians face extreme cognitive fatigue. Existing hospital software either delivers static predictive numbers without clinical context, or relies on generic chatbots prone to dangerous medical hallucinations and PHI privacy leaks.

### 1.2 Hackathon Winning Criteria (Bharat Agentic 2026)
| Criterion | Weight | Current CareLink | Upgraded Agentic CareLink |
| :--- | :---: | :--- | :--- |
| **Agentic Design** | 30% | Single LLM prompt call | **LangGraph Supervisor + 7 Specialist Agents + StateGraph** |
| **Technical Depth** | 25% | Federated ML + SHAP | **FL + SHAP + Qdrant Clinical RAG + Dual-Model Failover** |
| **Real-World Impact** | 20% | Static risk score | **Autonomous Discharge Planning + Medication Safety Gate** |
| **Innovation** | 15% | Differential Privacy | **PHI Anonymization Guardrails + Active Feedback Learning** |
| **Observability** | 10% | Console logs | **Agent Cockpit UI + LangSmith Traces + RAGAS Faithfulness** |
| **TOTAL** | 100% | **~45 / 100** | **~92 / 100 (Top-10 / Podium Contender)** |

---

## 2. 9-Layer Architecture Specification

### Layer 0: Frontend & Agent Cockpit
- **Technology:** React 19, TypeScript, Tailwind CSS, Lucide Icons, Recharts.
- **New Feature — Agent Cockpit Tab (`/agent-cockpit`):**
  - Live agent graph visualization showing active routing path.
  - Multi-step reasoning telemetry (Plan $\rightarrow$ Tool Execution $\rightarrow$ Synthesis $\rightarrow$ Self-Critique).
  - Cited clinical guidelines inspect modal with source passage verification.
  - Human-in-the-loop review toggle with clinician confirm/override controls.

### Layer 1: API Gateway & Auth Guard
- **Technology:** FastAPI / Express + Supabase JWT Auth.
- **Capabilities:**
  - Token validation with bypass fallback for hackathon evaluator guest access (`Bearer demo-guest-token`).
  - Sliding-window rate limiter protecting inference routes.
  - CORS and unified request tracing headers (`x-correlation-id`).

### Layer 2: Supervisor Orchestrator Agent (LangGraph)
- **Technology:** LangGraph `StateGraph`, `AgentState` schema.
- **Workflow:**
  - Ingests clinician task and patient state.
  - Evaluates intent confidence against a calibrated floor ($\ge 0.60$).
  - Conditionally dispatches to specialized sub-agents or parallel branches.
  - Triggers Human-in-the-Loop escalation when overall confidence $< 0.75$.

### Layer 3: Clinical Specialist Agents
1. **Triage Orchestrator Agent (ReAct Loop):**
   - **Step 1 (Tool):** `vitals_checker` — Evaluates HR, BP, SpO2, Temp against clinical threshold ranges.
   - **Step 2 (Tool):** `rag_retriever` — Fetches Manchester Triage System (MTS) & emergency protocols.
   - **Step 3 (Tool):** `severity_scorer` — Computes rule-based severity grade.
   - **Step 4 (Synthesis):** Formulates reasoned urgency classification.
   - **Step 5 (Self-Critique):** Cross-checks reasoning against vitals; flags human review if ambiguous.
2. **Care Plan Agent (Autonomous Discharge Planner):**
   - Activated automatically for HIGH and MEDIUM readmission risk patients.
   - Grounds personalized discharge plans using patient SHAP factors + clinical guidelines.
   - Produces structured 4-part plan: (a) Medication Schedule, (b) Follow-up appointments, (c) Lifestyle/Diet, (d) Red-flag warning signs.
   - Generates downloadable clinical PDF hand-off summary.
3. **Risk Analyst Agent (Interpretable ML Explainer):**
   - Synthesizes raw XGBoost predictions (probability %, SHAP top-factor rankings).
   - Queries historical patient embeddings in Qdrant to find $K$-nearest similar patient cohorts.
   - Produces a 3-sentence clinician narrative citing guideline evidence.

### Layer 4: Compliance, Safety & Active Learning Agents
4. **Medication Safety Agent (Autonomous Safety Gate):**
   - Scans all proposed medications before care plans are dispatched.
   - Checks against drug interaction database (OpenFDA API / curated local interaction map).
   - Assigns severity level: `CRITICAL`, `MAJOR`, `MODERATE`, `MINOR`.
   - **Hard Safety Gate:** Any `CRITICAL` interaction immediately locks care plan dispatch and alerts attending physician.
5. **Feedback Loop Agent (Active Learning):**
   - Monitors clinician confirm/override actions on `/feedback`.
   - Logs override instances as candidate training samples with differential privacy weighting.
   - Detects model drift: if rolling override rate exceeds $15\%$, triggers automated federated retraining round.
6. **PHI Guardrails Agent (Zero-Leak HIPAA Filter):**
   - Intercepts all external model calls.
   - Uses Regex and Named Entity Recognition (NER) to detect names, MRNs, SSNs, DOBs, and phone numbers.
   - Replaces PHI with synthetic tokens (e.g. `[PATIENT_ID_482]`, `[DATE_REDACTED]`).
   - De-tokenizes responses securely in-memory inside the local firewall before UI presentation.

### Layer 5: Clinical RAG & Knowledge Engine
- **Technology:** Qdrant Vector DB (In-memory / Local) + Hybrid BM25 keyword search.
- **Embeddings:** `sentence-transformers` (`medicalai/ClinicalBERT` or lightweight clinical embedding model).
- **Corpus:** 100+ curated guideline chunks from ICMR, WHO, NICE, CDC, and American Heart Association (AHA).
- **Grounding Rule:** Output must explicitly cite bracketed evidence keys (e.g. `[ICMR-HF-04]`).

### Layer 6: Federated ML Engine (Enhanced)
- **Technology:** Flower Framework, 3 Hospital Nodes (Apollo, Fortis, Max), XGBoost classifier.
- **Privacy:** Differential Privacy Accountant ($\epsilon=1.2, \delta=10^{-5}$), FedAvg gradient aggregation.

### Layer 7: Data, State & Long-Term Memory
- **Database:** Supabase PostgreSQL + Row-Level Security (RLS) + `audit_log` compliance ledger.
- **Long-Term Memory Engine:**
  - Adapts `Mem0` / local vector memory for patient and clinician cross-session recall.
  - Allows agents to recall previous consultations, past adverse drug reactions, and doctor override tendencies across visits.

### Layer 8: Observability, Tracing & Evaluation
- **Technology:** LangSmith Tracing + RAGAS Evaluation Framework + Prometheus `/metrics`.
- **Metrics Tracked:**
  - `faithfulness` target $\ge 0.85$ (eliminates hallucination).
  - `context_precision` and `answer_relevancy`.
  - Step-by-step latency, token count, and estimated cost per reasoning cycle.

---

## 3. Resilient Dual-Model Auto-Failover Engine

To guarantee zero downtime and survive free-tier rate limits during live hackathon judging, CareLink implements an automatic failover model gateway:

```
                  ┌───────────────────────────────┐
                  │       Incoming Agent Call     │
                  └───────────────┬───────────────┘
                                  │
                 ┌────────────────▼────────────────┐
                 │    PRIMARY: Google Gemini       │
                 │   (gemini-2.5-flash / 1.5-flash)│
                 └────────────────┬────────────────┘
                                  │
                   Rate-limit (429) / Quota / 503?
                                  │
                   YES ───────────┴───────────► NO (Success)
                    │
        ┌───────────▼─────────────────────┐
        │  FAILOVER: Groq Cloud Inference │
        │  (llama-3.3-70b / gpt-oss-120b) │
        └─────────────────┬───────────────┘
                          │
            Rate-limit (429) / Network error?
                          │
           YES ───────────┴───────────► NO (Success)
            │
┌───────────▼─────────────────────────────────────┐
│  TERTIARY: Deterministic Clinical Fallback      │
│  (Grounded template safe output + audit log)    │
└─────────────────────────────────────────────────┘
```

- **Timeout:** 8.0-second timeout on primary provider before initiating failover.
- **Failover Speed:** $< 500\text{ ms}$ provider switch.
- **Telemetry:** Records exact provider used (`provider: "gemini"` vs. `provider: "groq"`), tokens consumed, and latency.

---

## 4. AuRAG Extraction & Pruning Blueprint

### 4.1 What to Extract & Adapt from `aurag/`:
| AuRAG Source | CareLink Target | Adaptation Action |
| :--- | :--- | :--- |
| `aurag/agents/supervisor.py` | `src/agents/supervisor.py` | Convert plant/industrial routing into Clinical Supervisor routing |
| `aurag/agents/state.py` | `src/agents/state.py` | Update `AgentState` to store clinical patient data, SHAP factors, care plans |
| `aurag/agents/gateway.py` | `src/agents/gateway.py` | Refactor multi-provider gateway for Gemini $\rightarrow$ Groq failover |
| `aurag/backend/app/core/memory.py` | `src/agents/memory.py` | Adapt Mem0 / local memory service for cross-session patient history |
| `aurag/agents/guardrails.py` | `src/agents/guardrails.py` | Enhance regex + NER filters for medical PII/PHI scrubbing |
| `aurag/agents/citation_resolver.py`| `src/agents/citation_resolver.py` | Link clinical guidelines and evidence IDs to sentences |
| `aurag/evaluation/score.py` | `src/agents/eval.py` | Configure RAGAS evaluation runner for clinical accuracy |

### 4.2 What to Prune / Discard from `aurag/`:
- ❌ Industrial P&ID diagram OCR and CAD parser (`ingestion/cad`, `data/pnid`).
- ❌ Manufacturing equipment tags and pump failure event nodes (`FE-001`, `PUMP-401`).
- ❌ Machine Money token contracts and payment escrow mocks (`services/machine_money/`).
- ❌ Industrial work order scheduling Cypher queries (`services/work_orders.py`).

---

## 5. Master Step-by-Step Execution Plan

The upgrade is split into distinct, testable phases. Each phase can be triggered on demand:

### Phase 1: Foundation & Resilient Gateway
- [ ] **Task 1.1:** Create unified agent structure in `backend/agents/`.
- [ ] **Task 1.2:** Implement `gateway.py` with Gemini $\rightarrow$ Groq auto-failover, token estimation, and telemetry metrics.
- [ ] **Task 1.3:** Test failover live with intentional Gemini rate-limit simulation.

### Phase 2: PHI Guardrails & Knowledge RAG
- [ ] **Task 2.1:** Implement `guardrails.py` (HIPAA PII/PHI scrubber with tokenization + de-tokenization).
- [ ] **Task 2.2:** Set up `clinical_rag.py` using Qdrant (in-memory) with curated clinical guidelines (WHO, ICMR, NICE).
- [ ] **Task 2.3:** Verify source citation enforcement (`[ICMR-HF-01]`, etc.).

### Phase 3: LangGraph Supervisor & Clinical Specialist Agents
- [ ] **Task 3.1:** Define `state.py` (`CareLinkAgentState` with patient ID, vitals, SHAP features, care plan).
- [ ] **Task 3.2:** Build `supervisor.py` (LangGraph StateGraph router with confidence floor and fallback).
- [ ] **Task 3.3:** Build `triage_agent.py` (ReAct loop: vitals checker tool, RAG tool, severity scorer, self-critique).
- [ ] **Task 3.4:** Build `risk_analyst_agent.py` (XGBoost + SHAP narrative + historical cohort comparison).
- [ ] **Task 3.5:** Build `care_plan_agent.py` (Autonomous discharge planner with medication schedule).
- [ ] **Task 3.6:** Build `medication_safety_agent.py` (OpenFDA / local drug interaction gate with CRITICAL blocker).

### Phase 4: Long-Term Memory & Active Learning
- [ ] **Task 4.1:** Build `memory.py` (Mem0 / Supabase cross-session memory for patient history and doctor override habits).
- [ ] **Task 4.2:** Build `feedback_agent.py` (Drift detection $> 15\%$ and federated retraining trigger).

### Phase 5: Agent Cockpit Frontend UI
- [ ] **Task 5.1:** Create `AgentCockpitView.tsx` with live LangGraph execution visualizer and agent activity feed.
- [ ] **Task 5.2:** Add Care Plan review modal with medication interaction safety banner and PDF export.
- [ ] **Task 5.3:** Connect UI to backend `/api/agent/run` and `/api/agent/triage` endpoints.

### Phase 6: Observability, Testing & Git Checkpoint
- [ ] **Task 6.1:** Set up LangSmith trace logging and RAGAS faithfulness test script.
- [ ] **Task 6.2:** Execute full end-to-end integration test: Patient $\rightarrow$ Supervisor $\rightarrow$ Triage $\rightarrow$ Care Plan $\rightarrow$ Safety Check $\rightarrow$ UI Cockpit.
- [ ] **Task 6.3:** Commit changes locally to git repository (do not push).

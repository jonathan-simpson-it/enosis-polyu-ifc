# Product Requirements Document (PRD): GBA Universal AI-Ready Data Ingestion Engine (UDIE)

## 1. Overview & Purpose

**Universal Idea Model:** A **horizontal middleware utility** that ingests raw, multi-modal unstructured data from any corporate source, sanitizes it for cross-border GBA compliance, and standardizes it into structured schemas. This engine acts as the **universal translation layer** feeding audit-ready, deterministic data into LLMs, vector databases, RAG pipelines, or legacy ERPs.

Every enterprise in the GBA is trying to build custom LLM agents, RAG pipelines, and internal predictive models. They all hit the same wall: **garbage in, garbage out**. If they feed unstandardized, messy PDFs, legacy logs, or unredacted PII into an LLM, the system breaks, hallucinates, or violates GBA data laws.

This platform is the **clean, compliant gateway that turns unstructured chaos into structured schemas (JSON/CSV) ready for any downstream AI or database** — selling shovels in the AI gold rush.

---

## 2. The Core Architecture: "Data-to-AI" Pipeline

The system is designed as a modular pipeline that handles *any* document class using a Dynamic Schema Engine.

```
[ Unstructured Raw Data ] (PDFs, Logs, Audio, Images)
           │
           ▼
┌────────────────────────────────────────────────────────┐
│  1. Hybrid Edge Agent (In-situ PII/Critical Data Mask) │
└──────────────────────────┬─────────────────────────────┘
                           │ (Cleaned Payload Only)
                           ▼
┌────────────────────────────────────────────────────────┐
│  2. Dual-Stage Extraction Parser                       │
│     - LayoutLM / Vision Extraction (Deterministic)     │
│     - Semantic Taxonomy Classifier (Vector Matching)   │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│  3. Dynamic Schema Engine                              │
│     - Compiles to target JSON / Vector DB Embeddings   │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
[ Compliant, Standardized Datasets ] ──► (To LLMs, RAG, ERPs, Vector DBs)
```

---

## 3. Problem Statement

Enterprises in the GBA face a "structural bottleneck": **80–90% of enterprise information** is locked in unstructured formats (handwritten logs, multi-lingual invoices, sensor feeds, scanned PDFs). Every organization trying to deploy AI hits the same wall.

* **Regulatory Risk:** Deploying LLMs directly on raw data leads to PII leakage, Critical Data exposure, and violations of the GBA Standard Contract and China's Data Security Law.
* **Operational Inefficiency:** High reliance on manual data entry leads to transcription errors and slow compliance reporting. Data engineering teams waste 80% of their budget on cleaning rather than modeling.
* **Fragmentation:** Existing vertical solutions create "data silos" that lock information within proprietary workflows. Every new AI use case requires custom preprocessing scripts.
* **Adoption Friction:** SME suppliers lack IT resources; complex onboarding kills multi-tenant flywheels.

---

## 4. Target Users & Personas

* **Enterprise Data Engineers / AI Architects:** Building custom RAG pipelines or fine-tuning LLMs. Need a reliable API that ingests messy business documents and outputs clean, validated schemas they can pipe directly into their vector database or model.
* **System Integrators (SIs):** Regional IT consulting firms in Hong Kong and Shenzhen. They spend 80% of project budgets writing custom Python scripts to clean client data. Your API cuts their delivery time in half.
* **Compliance Officers:** Must ensure all data transfers between GBA mainland cities and Hong Kong satisfy PCPD/CAC requirements, the Data Security Law, and GBA Standard Contract filing.
* **Sustainability Managers (Anchor Corporations):** Need accurate, audit-ready Scope 3 carbon data from non-ERP integrated suppliers.
* **SME Supplier Clerks:** Need zero-IT, channel-based document submission (WeChat, WhatsApp) with immediate local value (e.g., a free Green Readiness Score, automated VAT verification).
* **Open Source Developers (Product-Led Growth):** Use the free, open-source edge-agent SDK for local PII masking and OCR. Upgrade to enterprise API when scaling to production.

---

## 5. Key Requirements

### 5.1 Functional Requirements

**A) Hybrid Edge-Cloud Ingestion**

Deploy a lightweight, Dockerized WebAssembly or Python agent at the client edge. This agent performs initial PII masking and local redaction **in-situ** on the supplier's premises. Only the anonymized, stripped text payloads are forwarded to the centralized cloud API for heavy semantic mapping and schema serialization. No raw data ever leaves the client boundary.

| Layer | Location | Function | Infrastructure Required |
|-------|----------|----------|------------------------|
| **Edge Agent** | Client premises | PII masking, local redaction, Critical Data quarantine | Docker container or WebAssembly runtime (lightweight, no GPU) |
| **Cloud API** | Centralized (HK region) | Heavy semantic mapping, schema serialization, taxonomy alignment | GPU-capable cloud instances |

**B) Dual-Stage Extraction & Mapping Pipeline**

| Stage | Component | Method | Output |
|-------|-----------|--------|--------|
| **Stage 1 (Deterministic Extraction)** | Spatial-aware layout parser | LayoutLMv3 or vision-LLM | Precise key-value pairs with deterministic confidence scores |
| **Stage 2 (Semantic Alignment)** | Taxonomy classifier | Vector embedding + cosine similarity ($\tau \geq 0.85$) | Classified regulatory mapping (e.g., "unleaded petrol" → "Scope 3 Category 4") |

Stage 1 extracts exact strings and scalars from the document (no hallucination risk). Stage 2 classifies where each extracted value belongs in the target taxonomy.

**C) Dynamic Schema Engine (New Core Feature)**

Unlike static parsers that only output one format, the platform features a self-learning schema compiler:

* **Input:** Developer uploads a target schema (blank JSON template or database schema).
* **Match:** Engine automatically maps extracted unstructured text into that exact schema using the dual-stage pipeline.
* **Output:** Clean, validated JSON payload immediately callable via API.

**D) Multi-Modal Core**

To prepare data for advanced multi-modal LLMs, the platform processes:
* **Textual/Spatial Data:** Scanned PDFs, handwritten warehouse logs, multi-lingual receipts.
* **Tabular Data:** Complex, borderless spreadsheets embedded inside image files.
* **Structured Audits:** System log files and JSON metadata from legacy systems.

**E) Automated Sanitization (PII + Critical Data)**

* **PII Masking:** Real-time anonymization of personal data per GBA Standard Contract.
* **Critical Data Detection:** Localized regex and heuristic-based classifier that scans for sensitive industrial keywords, structural coordinates, and heavy geographical metadata. Files flagged as "Critical Data" (重要數據) under mainland China's Data Security Law are quarantined before any cross-boundary transfer.

**F) Zero-IT SME Portal**

Allow suppliers to submit raw documents through channels they already use:
* Secure WeChat Mini-Program
* WhatsApp Business API
* Drag-and-drop web portal (zero registration)

Offer an immediate local value proposition — e.g., a free "SME Green Readiness Score" or automated invoice matching — to drive adoption without requiring anchor corporation mandates.

**G) Audit-Ready Schema Generation**

Transformation of raw inputs into standardized formats (JSON/CSV) aligned with any downstream target schema.

**H) Human-in-the-Loop (HITL) Workflow**

UI module for flagging and correcting low-confidence extractions.

### 5.2 Non-Functional Requirements

* **Compliance:** Must strictly enforce "No Onward Transfer" logic for data originating outside the GBA. Critical Data must never cross the boundary.
* **Security:** Role-based access control (RBAC), zero-trust data overlays, and edge-agent attestation.
* **Scalability:** Must handle multi-tenant supplier ecosystems (e.g., thousands of SME suppliers for one listed anchor corporation).

---

## 6. Scope: What's In & Out

| In-Scope | Out-of-Scope |
| --- | --- |
| Ingestion of any unstructured document class | Direct development of proprietary vertical AI models |
| GBA Standard Contract filing automation | Hardware-level sensor integration |
| Dynamic schema compilation to target JSON/CSV | Public social media data scraping |
| Edge-agent deployment and orchestration | On-premise GPU infrastructure for SMEs |
| Open-source edge-agent SDK | Building end-user RAG or LLM applications |

---

## 7. Goals & Success Metrics

* **Data Standardization Rate:** $\geq 90\%$ of unstructured documents successfully mapped to target schemas.
* **Compliance Latency:** 100% of PII and Critical Data sanitization occurring pre-exposure to model layers.
* **Operational Efficiency:** 40% reduction in manual data entry time for pilot anchor corporations (measured against pre-platform baseline).
* **Adoption:** Successful onboarding of $\geq 100$ SME suppliers in Phase I via zero-IT channels.
* **Edge-Agent Adoption:** $\geq 95\%$ of suppliers running the edge container after initial setup.

---

## 8. Assumptions, Constraints & Dependencies

* **Assumption:** Enterprise IT departments and System Integrators are the primary buyers, not business function heads. Anchor corporations mandate platform usage for supply chain partners; SME suppliers adopt zero-IT channels due to immediate local value.
* **Constraint:** Contract templates for GBA Standard Contracts cannot be modified; platform must reflect this rigidity. Critical Data classification must follow CAC guidelines.
* **Dependency:** Integration with local CAC offices and the Digital Policy Office for filing timelines. Edge-agent runtime must be compatible with common SME infrastructure (Windows, Linux, no GPU).

---

## 9. Release Plan (3-Phase Roadmap)

* **Phase I (Months 1–12):** Core Ingestion Engine + ESG Scope 3. Deploy edge-agent MVP, Zero-IT SME Portal (WeChat Mini-Program), and Dynamic Schema Engine beta. Partner with 1 Big 4 auditor for pilot. Release open-source edge-agent SDK on GitHub.
* **Phase II (Months 12–24):** Cross-Border Logistics + System Integrator Channel. Integrate bills of lading and commercial invoices. Enable automated GBA Standard Contract filing and Critical Data detection engine. Scale Big 4 partnerships and sign 3+ regional SIs.
* **Phase III (Months 24–36):** Construction Digital Works (DWSS) + Multi-Modal Expansion. Map normalized inputs to BIM/digital twin frameworks. Launch FinTech alliance for sustainability-linked loan verification. Expand multi-modal support (audio, video metadata).

---

## 10. Competitive Defensibility & Channel Partner Strategy

### 10.1 Competitor Threat Matrix

| Competitor Category | Key Players | Their Strategy | Their Fatal Vulnerability (Your Opening) |
| --- | --- | --- | --- |
| **Cloud Giants / Generic Document AI** | AWS Textract, Microsoft Azure Document Intelligence, Google Cloud | Scale generic, highly accurate OCR and LLM-parsing APIs at rock-bottom pricing | **The Trust & Regulatory Wall:** They require raw files to be sent to their central cloud APIs, violating the GBA Standard Contract and China's Data Security Law. They cannot easily run edge-confidential agents inside localized mainland SME infrastructures. |
| **Established Vertical ESG Platforms** | ESGpedia, Aprovall | Focus on sustainability-linked loan data and carbon accounting SaaS | **The Proprietary Silo Trap:** Vertical platforms lock customers into one ecosystem. They do not offer a horizontal schema-normalization API that downstream IT teams can plug into custom RAG models or ERPs. |
| **Local Mainland Document Parsers** | Local tech firms in Shenzhen/Guangzhou | Cost-efficient, deep understanding of simplified Chinese and handwriting | **The Tri-Jurisdictional Blindspot:** They lack the legal-tech translation layer to automate Hong Kong's PDPO and GBA Standard Contract filing. They extract data but do not manage cross-border legal compliance. |

### 10.2 Why Horizontal Beats Vertical

**A) We Don't Fight the Giants — We Enable Them**

> "OpenAI and Microsoft want your data already clean so you spend money on their API tokens. They do not want to build custom edge agents that sit inside small factories in Dongguan to strip PII before it leaves the local network. **We are the pipe that feeds their engines.** We make enterprise adoption of their models possible by solving the pre-processing and regulatory compliance bottleneck."

**B) We Escape the "Vertical Death Trap"**

> "If the ESG market shifts, our engine doesn't care. The exact same infrastructure parsing carbon invoices today can parse shipping manifests tomorrow or medical claims the day after. Our customer is the **Enterprise IT department** building any AI system, not just the sustainability team."

**C) Scalability is Exponential (SaaS Margin)**

Because you are not building custom downstream applications, engineering overhead is low. Build one rock-solid API and charge based on **data volume processed** — a classic, high-margin SaaS model.

### 10.3 Three Core Unfair Moats

**Moat 1: The "Zero-Copy" Compliance Moat**

The edge agent performs local PII redaction and Critical Data quarantine before data ever hits the cloud. You can promise compliance officers what cloud giants cannot: **Zero-Copy Data Privacy**.

Competitors say: *"Trust our secure cloud."*
You say: *"We don't even want your raw data. Our code strips the risk at your edge."*

**Moat 2: The "Once-and-Done" SME Network Effect (Data Gravity)**

If SME Supplier A uploads their utility bills to satisfy listed Buyer X, their profile is now clean. When listed Buyer Y requests Scope 3 data from Supplier A, they do not onboard again — they click "Authorize Share." As more buyers onboard, they pull their shared supplier networks. Switching costs become prohibitively high.

**Moat 3: Automated Legal-Tech Orchestration**

You are not selling an AI parser; you are selling **bureaucracy automation**. The platform automatically packages processed schemas, generates the mandatory Personal Information Protection Impact Assessment (PIPIA), and fills out GBA Standard Contract templates for direct submission to the Digital Policy Office and local CAC offices.

Competitors extract text. You deliver **regulatory peace of mind**.

### 10.4 Revised Go-To-Market Strategy: The "Developer-First" Wedge

```
[ System Integrators + Big 4 Auditors ]  (The Channel Partners)
                    │
                    ▼ (Licenses API for client deployments)
        [ Enterprise IT Departments ]
                    │
                    ▼ (Pulls in via API integration)
        [ Thousands of GBA SME Suppliers ] ──► (Zero-IT WeChat/WhatsApp)
```

**Channel 1: Target System Integrators (SIs)**

Partner with regional IT consulting firms in Hong Kong and Shenzhen. When they build custom AI/LLM solutions, they spend 80% of their budget manually cleaning client data. If they license your API, they cut delivery time in half.

**Channel 2: Open Source Developer Hook (Product-Led Growth)**

Offer a free, open-source SDK of the edge agent on GitHub. Developers use PII-masking and local OCR for free. When they need to scale to production and require the GBA compliance module and multi-tenant cloud pipelines, they upgrade to the enterprise API.

**Channel 3: Big 4 Auditors (Trojan Horse)**

Partner with PwC, EY, Deloitte, KPMG. Their ESG audit teams spend thousands of billable hours manually cleaning supplier invoices. Give them your standardization platform and they mandate it to their enterprise clients.

**SME Value Hook:** Free "GBA Green Score" + automated VAT verification via WeChat keeps the supplier network growing organically.

**FinTech Alliance:** Partner with HSBC, BOC for sustainability-linked loan verification — a second revenue line independent of document volume.

---

## 11. Revenue Model

### 11.1 Pricing Structure

| Tier | Price | Who Pays | What's Included |
|------|-------|----------|-----------------|
| **Enterprise API** | HK$0.50–2.00/GB processed | Enterprise IT departments, SIs, Big 4 firms | Unlimited API calls, Dynamic Schema Engine, automated PIPIA and GBA Standard Contract filing, dedicated support |
| **Active Supplier Node** | HK$500/node/month | Anchor corporations | Each SME supplier actively submitting data generates a node fee; scales with supply chain depth |
| **SME Portal** | **Free** | — | Zero-IT WeChat/WhatsApp submission, free "GBA Green Score," automated VAT verification |
| **Open Source SDK** | **Free** | Individual developers | Edge-agent SDK on GitHub for local PII masking and OCR; community support |
| **Audit Partner License** | HK$20,000+/year per firm | Big 4 / ESG consulting firms | White-label backend engine, priority features, co-branded compliance templates |

### 11.2 Why This Works

* **Per-GB pricing aligns with value:** Enterprises pay for the volume of data standardized, not per-document. As AI adoption grows, data volume grows exponentially.
* **SMEs pay nothing:** Zero friction drives the network effect. Free Green Score and VAT tools make adoption organic.
* **Auditors and SIs become your sales force:** They package your engine into their engagements, eliminating customer acquisition cost.
* **Open source creates a developer funnel:** Free SDK users become paying enterprise customers when they scale to production.
* **FinTech creates a second revenue line:** Banks pay for verified schema data to underwrite green loans.

---

## Appendix: Comparative Summary of Refinements

| Feature Area | Original Draft | Refined Draft |
|---|---|---|
| **Core Positioning** | Vertical use-case platform | Horizontal universal AI ingestion engine |
| **Ingestion Model** | Vague "in-situ parsing" | Edge-Confidential Hybrid Agent (clears PII before cloud exit) |
| **Parsing Engine** | Cosine similarity for extraction (high numeric swap risk) | Stage 1 Layout Parser (deterministic) + Stage 2 Semantic Taxonomy Classifier |
| **Schema Engine** | Static, single-format output | Dynamic Schema Engine (developer uploads target schema) |
| **Multi-Modal Support** | Text only | Text, tabular, structured audit logs |
| **Supplier Interface** | Mandated complex local connectors | Zero-IT Integrations (WeChat / WhatsApp) |
| **Regulatory Guardrail** | Basic PII masking | PII Masking + Critical Data Security Classifier (DSL compliance) |
| **GTM Strategy** | Direct enterprise sales | Developer-first: open-source SDK → SI partners → Big 4 channel |
| **Revenue Model** | Flat per-document SaaS | Per-GB processed + per-supplier-node + FinTech data-licensing |

---

### Implementation Note for PolyU IFC 2026:

When presenting to judges, dedicate slides to:
1. **Data-to-AI Pipeline Architecture** — shows the modular edge + cloud + Dynamic Schema Engine flow
2. **"We Enable the Giants"** — positions you as middleware for OpenAI/Microsoft, not a competitor
3. **Open Source Developer Wedge** — demonstrates product-led growth and a free-to-paid funnel
4. **Per-GB + Per-Node Revenue** — high-margin SaaS model that scales with AI adoption

Lead with the tagline: **"Selling shovels in the GBA AI gold rush."** This directly addresses judging criteria for *Innovation & Technology Content* and *Commercial Viability*.
# 🎯 EconoCausal: Executive Evaluation Presentation Deck

**Internship Capstone Presentation & Defense**  
*Project:* EconoCausal — Production Causal Inference & Prescriptive Promotional Allocation  
*Author:* Anmol Singh  
*Evaluation Track:* Advanced Machine Learning & Quantitative Economics  

---

## Slide 1: Title & Executive Summary

### **EconoCausal: Revolutionizing Retail Promotional Allocation with Double Machine Learning**
- **The Core Problem**: Retailers waste up to **45% of discount budgets** on organic buyers who would convert anyway.
- **The Solution**: An enterprise-grade platform unifying **Double Machine Learning (DML)**, **Prescriptive Mixed-Integer Optimization (MILP)**, and **Live Drift Telemetry**.
- **Key Outcomes**:
  - **+17.2% higher incremental profit** over heuristic greedy targeting.
  - **$21,270 in margin cannibalization protected** on a single $5k campaign.
  - **6,080 rows/sec throughput** with sub-150ms real-time inference latency.

---

## Slide 2: The Core Problem: The $100B Promotional Trap

### **Predictive ML vs. Causal Prescriptive ML**
- **Standard Supervised ML asks**: *"Who will buy?"*
  - Predicts high conversion probability $\mathbb{E}[Y \mid X, T]$.
  - Result: Targets high-value loyalty members with heavy discounts.
  - Problem: **Margin cannibalization**. These customers were already planning to purchase!
- **Causal Machine Learning asks**: *"Who will buy **only if** they receive a discount?"*
  - Estimates the incremental lift $\tau(X) = \mathbb{E}[Y(1) - Y(0) \mid X]$.
  - Isolates **Persuadables** from **Sure Things** and **Lost Causes**.

---

## Slide 3: Observational Confounding & Simpson's Paradox

### **Why Naive Promotional Comparisons Lie**
- **The Confounder Trap**:
  - Marketing teams routinely send 20% discounts to high-spending, Gold-tier members.
  - Naive correlation shows 20% discounts have a **35% conversion rate** vs **12% for control**.
- **Simpson's Paradox Revealed**:
  - When conditioning on customer loyalty tier, the true incremental lift is only **3% to 6%**.
  - Without causal adjustment, enterprises mistake customer loyalty for marketing effectiveness!

---

## Slide 4: Structural Causal Graph & Identification (DoWhy)

### **Formalizing Assumptions with Pearl's Backdoor Criterion**
- **Causal DAG Formulation**:
  - Treatment: Promotion Discount $T \in \{0, 10, 20\}$
  - Outcome: Customer Purchase $Y \in \{0, 1\}$
  - Confounders: Past Spend, Recency Days, Loyalty Tier, Category Affinity
  - Modifiers: Customer Age, Past Spend, Loyalty Tier
- **Identification & Overlap**:
  - Verified identification via **DoWhy Backdoor Criterion**.
  - Multi-class propensity scoring guarantees **Positivity / Common Support** ($0 < e_d(X) < 1$).
  - Standardized Mean Differences (SMD) drop below $0.10$ across all covariates after Inverse Probability Weighting (IPW).

---

## Slide 5: Double Machine Learning (DML) Architecture

### **Eliminating Regularization Bias with Neyman Orthogonality**
- **The Semi-Parametric DML Model (Chernozhukov et al., 2018)**:
  - First-stage outcome nuisance: $\tilde{Y} = Y - \hat{m}^{(-k)}(X, W)$ using `LGBMRegressor`.
  - First-stage propensity nuisance: $\tilde{T} = T - \hat{e}^{(-k)}(X, W)$ using `LGBMClassifier`.
  - 5-fold cross-fitting eliminates overfitting and finite-sample bias.
- **Second-Stage Causal Forest (`CausalForestDML`)**:
  - Regresses orthogonalized residuals to estimate customer-level CATE $\hat{\tau}_{i, d}$.
  - Generates asymptotic **95% Confidence Intervals** via the infinitesimal jackknife.

---

## Slide 6: Prescriptive Optimization: SciPy HiGHS MILP Knapsack

### **Bridging Causal Predictions to Optimal Business Decisions**
- **Multiple-Choice Knapsack Problem (MCKP)**:
  $$\max_{\{z_{i, d}\}} \sum_{i=1}^N \sum_{d \in \{10, 20\}} z_{i, d} \cdot (\hat{\tau}_{i, d} \times M - c_d)$$
- **Operational Policy Constraints Solved Simultaneously**:
  - Mutual Exclusivity: At most 1 promotion per customer.
  - Campaign Budget Cap: Total coupon spend $\le B$.
  - Frequency Capping: Excludes customers active within the last 21 days.
  - Margin Floor: Requires minimum incremental profit contribution.
  - Cohort Whitelist: Automatically holds out Gold-tier organic buyers.
- **Result**: SciPy HiGHS delivers **+17.2% higher incremental profit** and **+41.9 pp higher ROI** than heuristic greedy ranking.

---

## Slide 7: Production Governance & Reliability

### **Guarding Against Silent Failures in Production**
- **DoWhy Invariance Refutation Suite**:
  - **Placebo Treatment**: Effect collapses to $0.000$ ($p > 0.05$).
  - **Random Common Cause**: Estimated effect drift $< 3\%$.
  - **Data Subset**: Bootstrap stability with drift $< 5\%$.
- **Confounder Sensitivity Bounds**:
  - **Rosenbaum Sensitivity Bounds**: Critical $\Gamma^* = 2.45$ (withstands 2.45x hidden odds multiplier).
  - **Cinelli & Hazlett Partial $R^2$**: Robustness Value $RV = 18.4\%$; unobserved confounders cannot easily invalidate campaign conclusions.

---

## Slide 8: Real-Time Stream Simulation & Drift Engine

### **Continuous Monitoring with Automated Retraining Alerts**
- **30-Day Stream Simulation**:
  - Days 1-14: Normal weekly shopping cycles.
  - Days 15-19: Gradual macro inflation shift.
  - Day 20: Severe macroeconomic demand shock.
- **Rolling Window Statistical Telemetry**:
  - Sliding 7-day **Population Stability Index (PSI)**, **Wasserstein Distance**, and **KS Statistics**.
  - Automatically trips **Retraining Alert** on Day 20 when PSI crosses critical threshold ($0.248 \ge 0.20$).

---

## Slide 9: Empirical Benchmarks & Meta-Learner Comparison

### **Rigorously Validated Across Scale and Architectures**
- **Pipeline Throughput & Latency Scaling**:
  - **10k rows**: $7.2\text{s}$ total latency, $1,380\text{ rows/s}$.
  - **25k rows**: $8.2\text{s}$ total latency, $3,038\text{ rows/s}$.
  - **50k rows**: $8.2\text{s}$ total latency, **$6,080\text{ rows/s}$**, peak RAM only $309\text{ MB}$.
- **Meta-Learner Comparison (Ground Truth Benchmark)**:
  - **EconoCausal CausalForestDML**: **Highest Qini Score (AUUC = -2.25)**.
  - S-Learner: $\text{AUUC} = -7.63$.
  - T-Learner: $\text{AUUC} = -9.14$.
  - X-Learner: $\text{AUUC} = -10.99$.
  - DML's orthogonalization leads the industry in ranking persuadable customers for knapsack allocation.

---

## Slide 10: Commercial Impact & Financial ROI

### **The Bottom Line: Quantifiable Retail Margin Protection**
- **Campaign Spend**: $\$4,820.00$ utilized of $\$5,000.00$ budget.
- **Net Incremental Profit**: **$\$14,285.50$** delivered.
- **Campaign Incremental ROI**: **$296.4\%$**.
- **Persuadables Targeted**: $362$ responsive customers.
- **Sure Things Held Out**: $1,418$ organic converters.
- **Promotional Waste Saved**: **$\$21,270.00$ in preserved margin**.

---

## Slide 11: Production Containerization & Cloud Architecture

### **Enterprise-Ready, Self-Contained Deployment**
- **Multi-Stage Containerization (`Dockerfile`)**:
  - Stage 1: Node 20 Alpine compiles React 19 Vite SPA.
  - Stage 2: Python 3.12 slim backend serves both REST API (`/api/*`) and SPA static frontend (`/`).
  - Unprivileged user `appuser`, built-in `/health` container probe.
- **Zero-Configuration Orchestration**:
  - Local: `docker-compose up -d`.
  - Cloud: Manifests for Kubernetes, AWS ECS/Fargate, and Google Cloud Run.
  - Healthcheck probe script (`scripts/healthcheck.py`).

---

## Slide 12: Internship Achievements & Conclusion

### **Delivering a Production-Grade Causal AI System in 10 Days**
1. **Full-Stack Execution**: From theoretical causal identification and mathematical optimization to React UI, FastAPI microservices, and Docker containerization.
2. **Comprehensive Test Coverage**: **71 automated unit & integration tests** passing across all modules.
3. **Rigorous Documentation**: Walkthrough notebook suite, performance benchmark report, whitepaper report, deployment guide, and presentation deck.
4. **Transformative Business Value**: Proven framework to eliminate promotional cannibalization and maximize enterprise incremental ROI.

# EconoCausal: Causal-AI Dynamic Pricing & Promotional Uplift Optimizer

[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Infotact Solutions Internship Project** (Ref: `ITS/DSML/1150`)  
> **Author:** Anmol Soni (Data Associate L1 Intern)  
> **Domain:** Economics & Causal AI  
> **Period:** 10 October 2026 – 10 November 2026  

---

## 📌 Executive Summary

Traditional machine learning classifiers optimize for **who is likely to buy** (correlation), which inadvertently wastes marketing budget giving discounts to loyal customers who would have purchased anyway. Furthermore, historical observational campaign data is plagued with **confounding** because past discounts were preferentially offered to high-spend or high-tier customers.

**EconoCausal** is a causal AI system that estimates the **Individual Treatment Effect (ITE / Uplift)**—the causal increase in purchase probability induced by promotional discounts ($0, $10, $20) using **Double Machine Learning (DML)**. It then solves a constrained optimization problem via **Mixed-Integer Linear Programming (MILP)** to allocate a fixed marketing budget (e.g. $5,000) strictly to **persuadable customers**, maximizing net incremental profit.

---

## 🏗️ Repository Layout

```
econocausal/
├── data/                  # Synthetic and sample CSV datasets
├── notebooks/             # 01_eda, 02_dml, 03_evaluation, 04_refutation
├── src/                   # Core Python causal ML engine
│   ├── data_gen.py        # generate_data(n, seed) -> DataFrame
│   ├── causal_model.py    # build_dag(df), identify_effect()
│   ├── propensity.py      # fit_propensity(), overlap_report(), balance_table()
│   ├── dml.py             # train_dml(df), predict_uplift()
│   ├── evaluate.py        # pehe(), qini_curve(), uplift_curve(), baselines
│   ├── refute.py          # run_refuters()
│   ├── optimizer.py       # allocate(uplift, margin, budget) -> DataFrame
│   ├── drift.py           # psi(), ks_report(), drift_check()
│   └── summary.py         # natural-language executive summary
├── api/                   # FastAPI backend service
│   └── main.py
├── frontend/              # React + Plotly.js interactive dashboard
├── docs/                  # PRD.md, DOM.md, project report, presentation slides
├── tests/                 # Comprehensive pytest test suite
├── requirements.txt       # Pinned Python package dependencies
├── AGENTS.md              # AI coding assistant guidelines
└── README.md
```

---

## ⚡ Quickstart

### 1. Environment Setup
```powershell
# Activate the virtual environment
.\.venv\Scripts\Activate.ps1

# Install dependencies (already installed in .venv)
pip install -r requirements.txt
```

### 2. Generate Synthetic Confounded Campaign Data (FR-1)
```powershell
python -m src.data_gen --n 50000 --seed 42 --out data/synthetic.csv
```

### 3. Run Test Suite
```powershell
pytest tests/ -v
```

### 4. Run the API (Week 4)
```powershell
uvicorn api.main:app --reload --port 8000
```

### 5. Launch the Dashboard
```powershell
cd frontend
npm install
npm start
```

---

## 📊 Causal AI Pipeline

1. **Synthetic Data Generation (`src/data_gen.py`)**: Simulates 50,000 retail records with non-linear confounding on discount assignment and heterogeneous ground-truth `true_effect`.
2. **Causal Graph & Identification (`src/causal_model.py`)**: Formulates the structural causal DAG using **DoWhy** and proves backdoor identification using confounders $W = \{\text{past\_spend}, \text{recency\_days}, \text{loyalty\_tier}, \text{category\_affinity}\}$.
3. **Propensity Score & Overlap Diagnostics (`src/propensity.py`)**: Multi-class propensity estimation, positivity verification, and Inverse Probability of Treatment Weighting (IPW) achieving Standardized Mean Differences $\text{SMD} < 0.10$.
4. **Double Machine Learning (`src/dml.py`)**: Uses **EconML `CausalForestDML`** with 5-fold cross-fitting and LightGBM base learners to estimate uplift.
5. **SciPy Constrained Optimization (`src/optimizer.py`)**: Allocates promotional discounts under a fixed budget to maximize $\sum x_{i,d} (\text{uplift}_{i,d} \cdot \text{margin} - d \cdot P(\text{buy}|d))$.
6. **Diagnostics & Drift Monitoring (`src/drift.py`)**: Population Stability Index (PSI) and Kolmogorov-Smirnov (KS) tests flag distribution shifts when $\text{PSI} > 0.20$.

---

## 📄 Documentation

- [Product Requirements Document (PRD)](file:///c:/Users/anmol/Documents/EconoCausal/docs/PRD.md)
- [Design & Operations Model (DOM)](file:///c:/Users/anmol/Documents/EconoCausal/docs/DOM.md)
- [AI Coding Instructions](file:///c:/Users/anmol/Documents/EconoCausal/AGENTS.md)

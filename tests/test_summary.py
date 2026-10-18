from __future__ import annotations
from src.summary import generate_executive_summary

def test_generate_executive_summary():
    alloc = {
        "actual_spend": 4980.0,
        "net_incremental_profit": 18420.0,
        "targeted_persuadables": 382,
        "sure_things_held_out": 15900,
        "discount_waste_saved": 11240.0,
    }
    drift = {
        "max_psi": 0.082,
        "overall_status": "Healthy",
        "retrain_recommended": False,
    }
    refutation = {
        "all_passed": True,
    }
    
    summary = generate_executive_summary(alloc, drift, refutation)
    
    assert "narrative" in summary
    assert "pillars" in summary
    assert len(summary["pillars"]) == 4
    assert summary["kpis"]["net_incremental_profit"] == 18420.0
    assert summary["kpis"]["retrain_recommended"] is False

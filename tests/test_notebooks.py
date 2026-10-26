import json
from pathlib import Path
import nbformat
import pytest

NOTEBOOK_DIR = Path(__file__).resolve().parent.parent / "notebooks"

EXPECTED_NOTEBOOKS = [
    "01_observational_data_confounding.ipynb",
    "02_double_machine_learning_uplift.ipynb",
    "03_budget_allocation_and_roi.ipynb",
    "04_refutation_and_drift_telemetry.ipynb",
]

def test_notebooks_directory_exists():
    assert NOTEBOOK_DIR.exists()
    assert NOTEBOOK_DIR.is_dir()

@pytest.mark.parametrize("filename", EXPECTED_NOTEBOOKS)
def test_notebook_file_exists_and_valid_json(filename):
    path = NOTEBOOK_DIR / filename
    assert path.exists(), f"Notebook {filename} is missing"
    assert path.stat().st_size > 5000, f"Notebook {filename} appears empty or truncated"

    with open(path, "r", encoding="utf-8") as f:
        nb = nbformat.read(f, as_version=4)

    assert len(nb.cells) >= 10, f"Notebook {filename} has fewer cells than expected"

    code_cells = [c for c in nb.cells if c.cell_type == "code"]
    markdown_cells = [c for c in nb.cells if c.cell_type == "markdown"]

    assert len(code_cells) >= 5
    assert len(markdown_cells) >= 5

    has_outputs = any(len(c.get("outputs", [])) > 0 for c in code_cells)
    assert has_outputs, f"Notebook {filename} has no executed outputs"

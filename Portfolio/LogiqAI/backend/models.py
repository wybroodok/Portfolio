"""Pydantic schemas — the contract for requests, AI output, and API responses.

The AI is constrained to `AuditResult` via structured outputs (JSON mode), so a
successful model call is guaranteed to validate against these types.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

AuditType = Literal["code", "finance", "resume"]
Priority = Literal["critical", "important", "tip"]


class Metric(BaseModel):
    """A single headline KPI rendered as a glass metric card."""

    label: str = Field(..., description="Short metric name, e.g. 'Overall Score'.")
    value: float = Field(..., description="Numeric value for the metric.")
    unit: str = Field("", description="Suffix such as '%', 'pts', '$', 'issues'.")
    hint: str = Field("", description="One short sentence of context.")
    trend: float = Field(
        0.0,
        description="Signed delta vs. a reference period. Positive = up, 0 = flat.",
    )


class TrendPoint(BaseModel):
    """One sample on the time/position axis for the area chart."""

    label: str = Field(..., description="X-axis label: a date, week, or code region.")
    value: float = Field(..., description="Primary series value.")
    baseline: float = Field(
        ..., description="Comparison/baseline series value for the same x."
    )


class Category(BaseModel):
    """A slice of the donut: spend category, bug type, or skill group."""

    name: str
    value: float


class Recommendation(BaseModel):
    """A prioritized, formatted insight from the analysis."""

    priority: Priority = Field(
        ..., description="'critical' (red), 'important' (amber), or 'tip' (green)."
    )
    title: str
    description: str


class AuditResult(BaseModel):
    """The complete, structured output of one audit — the single source of truth
    for every tab in the UI."""

    audit_type: AuditType
    title: str = Field(..., description="Human title, e.g. 'Codebase Audit'.")
    score: int = Field(..., ge=0, le=100, description="Overall health score 0-100.")
    score_label: str = Field(..., description="One-word verdict, e.g. 'Solid'.")
    summary: str = Field(..., description="2-3 sentence executive summary.")

    critical_count: int = Field(..., ge=0, description="Number of critical findings.")
    optimization_potential: str = Field(
        ..., description="Headline upside, e.g. '$4,200/mo' or '18% faster'."
    )
    optimization_hint: str = Field(
        "", description="One line explaining the optimization potential."
    )

    metrics: list[Metric] = Field(..., description="3-4 summary KPI cards.")

    trend_title: str = Field(..., description="Title for the area chart.")
    trend_primary_name: str = Field(..., description="Legend label for the primary series.")
    trend_baseline_name: str = Field(..., description="Legend label for the baseline series.")
    trend: list[TrendPoint] = Field(..., description="6-12 points for the area chart.")

    categories_title: str = Field(..., description="Title for the donut chart.")
    categories: list[Category] = Field(..., description="4-6 slices for the donut.")

    recommendations: list[Recommendation] = Field(
        ..., description="4-8 prioritized recommendations."
    )


# -------------------- Accounts & per-user history --------------------


class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=1, max_length=40)


class User(BaseModel):
    id: str
    username: str
    created_at: str


class AuditRecord(BaseModel):
    """One stored audit, owned by a user. Returned by /api/analyze and the
    per-user history endpoint so Analytics stays scoped to its owner."""

    id: str
    user_id: str
    filename: str
    created_at: str
    result: AuditResult

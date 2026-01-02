"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { Shield, Skull, DollarSign, Activity, Settings, ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface CalculationResults {
  vulnerability: number;
  lef: number;
  primary_loss: number;
  secondary_loss: number;
  single_loss_expectancy: number;
  ale: number;
  cliff_data: Array<{ tcap: number; probability: number; label: string }>;
  svcc?: {
    score: number;
    color: string;
  };
}

// Hardcoded Matrix for Visual Reference (Must match backend)
// Key: TCap (Row), Value: { RS (Col): Probability }
const VISUAL_MATRIX: Record<number, Record<number, number>> = {
  5: { 1: 0.99, 2: 0.95, 3: 0.85, 4: 0.60, 5: 0.25 },
  4: { 1: 0.95, 2: 0.80, 3: 0.50, 4: 0.25, 5: 0.05 },
  3: { 1: 0.80, 2: 0.50, 3: 0.20, 4: 0.05, 5: 0.01 },
  2: { 1: 0.50, 2: 0.20, 3: 0.05, 4: 0.01, 5: 0.00 },
  1: { 1: 0.20, 2: 0.05, 3: 0.01, 4: 0.00, 5: 0.00 }
};

export default function RiskCalculator() {
  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Inputs
  const [tcap, setTcap] = useState<number>(3);
  const [rs, setRs] = useState<number>(3);
  const [assetValue, setAssetValue] = useState<number>(100000);
  const [tef, setTef] = useState<number>(1);
  const [riskAppetite, setRiskAppetite] = useState<number>(50000);

  // SVCC Inputs
  const [severity, setSeverity] = useState<number>(5);
  const [criticality, setCriticality] = useState<number>(5);
  const [countermeasure, setCountermeasure] = useState<number>(3);

  // Results
  const [results, setResults] = useState<CalculationResults | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const calculateRisk = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://127.0.0.1:5001/api/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tcap,
          rs,
          asset_value: assetValue,
          tef,
          severity,
          criticality,
          countermeasure
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to connect to backend");
      }
      const data = await res.json();
      setResults(data.results);
    } catch (error) {
      console.error("Calculation failed:", error);
      setError("Could not connect to backend server. Is it running on port 5001?");
    } finally {
      setLoading(false);
    }
  }, [tcap, rs, assetValue, tef, severity, criticality, countermeasure]);

  // Gauge Meter Helper
  const getRiskPercentage = () => {
    if (!results) return 0;
    // Cap at 100% if ALE > 2x Risk Appetite, or some other logic
    const ratio = (results.ale / riskAppetite) * 100;
    return Math.min(100, Math.max(0, ratio));
  };

  const riskColor = () => {
    const p = getRiskPercentage();
    if (p < 50) return "text-emerald-500";
    if (p < 80) return "text-yellow-500";
    return "text-rose-500";
  }

  // SVCC Color Logic
  const getSvccColor = (colorName: string) => {
    switch (colorName) {
      case 'Green': return "text-emerald-500 stroke-emerald-500";
      case 'Yellow': return "text-yellow-500 stroke-yellow-500";
      case 'Red': return "text-rose-500 stroke-rose-500";
      default: return "text-slate-500 stroke-slate-500";
    }
  }

  // Loss Data for Bar Chart
  const lossData = results
    ? [
      {
        name: "Loss Magnitude",
        Primary: results.primary_loss,
        Secondary: results.secondary_loss,
      },
    ]
    : [];

  return (
    <div className="relative font-sans text-slate-100 flex gap-6 p-6">

      {/* Sidebar Toggle Button (Floating or Sticky) */}
      {!isSidebarOpen && (
        <Button
          variant="outline"
          size="icon"
          className="absolute top-6 left-6 z-50 bg-slate-900 border-slate-700 hover:bg-slate-800"
          onClick={() => setIsSidebarOpen(true)}
        >
          <Settings className="h-4 w-4" />
        </Button>
      )}

      {/* Sidebar Inputs */}
      {isSidebarOpen && (
        <Card className="w-80 min-w-80 bg-slate-900 border-slate-800 shadow-xl overflow-y-auto max-h-[90vh] sticky top-6 self-start transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex flex-col gap-1">
              <CardTitle className="flex items-center gap-2 text-indigo-400">
                <Settings className="h-5 w-5" />
                Configuration
              </CardTitle>
              <CardDescription className="text-slate-500 text-xs">
                Simulate risk scenarios.
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white" onClick={() => setIsSidebarOpen(false)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">

            <div className="space-y-4 border-l-2 border-indigo-500 pl-4">
              <h3 className="text-sm font-semibold text-indigo-300">FAIR Inputs</h3>
              {/* TCap Slider */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="flex items-center gap-2 text-xs">
                    <Skull className="h-3 w-3 text-rose-500" /> TCap (1-5)
                  </Label>
                  <span className="text-sm font-bold font-mono text-rose-400">{tcap}</span>
                </div>
                <Slider value={[tcap]} min={1} max={5} step={1} onValueChange={(vals) => setTcap(vals[0])} />
              </div>

              {/* RS Slider */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="flex items-center gap-2 text-xs">
                    <Shield className="h-3 w-3 text-emerald-500" /> RS (1-5)
                  </Label>
                  <span className="text-sm font-bold font-mono text-emerald-400">{rs}</span>
                </div>
                <Slider value={[rs]} min={1} max={5} step={1} onValueChange={(vals) => setRs(vals[0])} />
              </div>

              {/* Asset Value */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-xs">
                  <DollarSign className="h-3 w-3 text-amber-500" /> Asset Value ($)
                </Label>
                <Input type="number" value={assetValue} onChange={(e) => setAssetValue(Number(e.target.value))} className="h-8 bg-slate-950 border-slate-700 hover:border-indigo-500 transition-colors" />
              </div>

              {/* TEF */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-xs">
                  <Activity className="h-3 w-3 text-blue-500" /> Threat Event Freq
                </Label>
                <Input type="number" value={tef} step={0.1} onChange={(e) => setTef(Number(e.target.value))} className="h-8 bg-slate-950 border-slate-700 hover:border-indigo-500 transition-colors" />
              </div>
            </div>

            <Separator className="bg-slate-800" />

            <div className="space-y-4 border-l-2 border-rose-500 pl-4">
              <h3 className="text-sm font-semibold text-rose-300">SVCC Inputs</h3>

              {/* Severity */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-xs">Severity (S) 1-10</Label>
                  <span className="text-sm font-mono text-rose-400">{severity}</span>
                </div>
                <Slider value={[severity]} min={1} max={10} step={1} onValueChange={(vals) => setSeverity(vals[0])} />
              </div>

              {/* Criticality */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-xs">Criticality (C) 1-10</Label>
                  <span className="text-sm font-mono text-amber-400">{criticality}</span>
                </div>
                <Slider value={[criticality]} min={1} max={10} step={1} onValueChange={(vals) => setCriticality(vals[0])} />
              </div>

              {/* Countermeasure */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-xs">Countermeasure (CM) 1-5</Label>
                  <span className="text-sm font-mono text-emerald-400">{countermeasure}</span>
                </div>
                <Slider value={[countermeasure]} min={1} max={5} step={1} onValueChange={(vals) => setCountermeasure(vals[0])} />
              </div>
            </div>

            {/* Risk Appetite */}
            <div className="space-y-3">
              <Label className="text-slate-400 text-sm">Target Risk Appetite ($)</Label>
              <Input
                type="number"
                value={riskAppetite}
                onChange={(e) => setRiskAppetite(Number(e.target.value))}
                className="bg-slate-950 border-slate-700 text-slate-100"
              />
            </div>

            <Separator className="bg-slate-800" />

            <Button
              onClick={calculateRisk}
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2"
            >
              {loading ? "Calculating..." : "Calculate Risk"}
            </Button>

            {error && (
              <p className="text-rose-500 text-xs italic">{error}</p>
            )}

          </CardContent>
        </Card>
      )}

      {/* Main Dashboard */}
      <div className="flex-1 space-y-6">

        {/* Top KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Risk Meter / ALE */}
          <Card className="bg-slate-900 border-slate-800 relative overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Projected ALE</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {results ? `$${results.ale.toLocaleString()}` : "..."}
              </div>
              <div className="mt-2 text-xs text-slate-500">Annualized Loss Expectancy</div>
              {/* Mini Radial Indicator */}
              <div className="absolute right-4 top-4 h-16 w-16">
                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth="4"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeDasharray={`${getRiskPercentage()}, 100`}
                    className={riskColor()}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">
                  {Math.round(getRiskPercentage())}%
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Vulnerability</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {results ? `${(results.vulnerability * 100).toFixed(0)}%` : "..."}
              </div>
              <div className="mt-2 text-xs text-slate-500">Prob. of Success</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Single Loss Expectancy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {results ? `$${results.single_loss_expectancy.toLocaleString()}` : "..."}
              </div>
              <div className="mt-2 text-xs text-slate-500">Primary + Secondary</div>
            </CardContent>
          </Card>
        </div>

        {/* SVCC & Matrix Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Defensive Performance (SVCC) */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-sm text-slate-300">Defensive Performance (SVCC)</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-6">
              <div className="relative h-40 w-40">
                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                  {/* Background Circle */}
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#1e293b" strokeWidth="3" />
                  {/* Progress Circle */}
                  {results?.svcc && (
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      strokeDasharray={`${results.svcc.score}, 100`}
                      className={getSvccColor(results.svcc.color)}
                      strokeWidth="3"
                    />
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-3xl font-bold ${results?.svcc ? getSvccColor(results.svcc.color).split(' ')[0] : 'text-slate-500'}`}>
                    {results?.svcc ? results.svcc.score : "--"}
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">SVCC Score</span>
                </div>
              </div>
              <div className="mt-4 text-center">
                <p className="text-xs text-slate-400">Risk Assessment</p>
                <p className={`text-lg font-bold ${results?.svcc ? getSvccColor(results.svcc.color).split(' ')[0] : 'text-slate-600'}`}>
                  {results?.svcc ? results.svcc.color.toUpperCase() : "Waiting..."}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Visual Matrix */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-sm text-slate-300">Vulnerability Matrix Look-up</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
              <div className="grid grid-cols-6 gap-1 text-[10px]">
                {/* Header Row */}
                <div className="col-span-1"></div>
                {[1, 2, 3, 4, 5].map(r => <div key={`h-${r}`} className="text-center text-slate-500">RS {r}</div>)}

                {/* Rows */}
                {[5, 4, 3, 2, 1].map(t => (
                  <React.Fragment key={`row-${t}`}>
                    <div className="text-right pr-2 text-slate-500 self-center">TCap {t}</div>
                    {[1, 2, 3, 4, 5].map(r => {
                      const isSelected = t === tcap && r === rs;
                      const prob = VISUAL_MATRIX[t][r];
                      return (
                        <div
                          key={`cell-${t}-${r}`}
                          className={`
                                                h-10 w-10 flex items-center justify-center rounded border
                                                ${isSelected
                              ? 'bg-indigo-600 border-indigo-400 text-white font-bold ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-900'
                              : 'bg-slate-800 border-slate-700 text-slate-400 opacity-50'
                            }
                                            `}
                        >
                          {prob.toFixed(2)}
                        </div>
                      )
                    })}
                  </React.Fragment>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Capability Cliff */}
        <Card className="bg-slate-900 border-slate-800 col-span-1">
          <CardHeader>
            <CardTitle className="text-sm text-slate-300">Capability Cliff (Prob vs TCap)</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px] w-full">
            {results && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={results.cliff_data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="tcap" stroke="#94a3b8" label={{ value: 'TCap', position: 'insideBottomRight', offset: 0 }} />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
                    itemStyle={{ color: '#e2e8f0' }}
                  />
                  <Line type="monotone" dataKey="probability" stroke="#f43f5e" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                  {/* Current TCap Marker?? */}
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Loss Breakdown */}
        <Card className="bg-slate-900 border-slate-800 col-span-1">
          <CardHeader>
            <CardTitle className="text-sm text-slate-300">Loss Composition</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px] w-full">
            {results && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={lossData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
                    itemStyle={{ color: '#e2e8f0' }}
                  />
                  <Legend />
                  <Bar dataKey="Primary" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Secondary" fill="#a855f7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

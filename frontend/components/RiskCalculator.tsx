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
import { Shield, Skull, DollarSign, Activity, Settings } from "lucide-react";

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
}

export default function RiskCalculator() {
  // Inputs
  const [tcap, setTcap] = useState<number>(3);
  const [rs, setRs] = useState<number>(3);
  const [assetValue, setAssetValue] = useState<number>(100000);
  const [tef, setTef] = useState<number>(1);
  const [riskAppetite, setRiskAppetite] = useState<number>(50000);

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
  }, [tcap, rs, assetValue, tef]);

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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 font-sans text-slate-100">
      {/* Sidebar Inputs */}
      <Card className="lg:col-span-4 bg-slate-900 border-slate-800 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-indigo-400">
            <Settings className="h-5 w-5" />
            Configuration
          </CardTitle>
          <CardDescription className="text-slate-500">
            Adjust parameters to simulate risk scenarios.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* TCap Slider */}
          <div className="space-y-3">
            <div className="flex justify-between">
              <Label className="flex items-center gap-2">
                <Skull className="h-4 w-4 text-rose-500" /> Threat Capability (TCap)
              </Label>
              <span className="text-xl font-bold font-mono text-rose-400">{tcap}</span>
            </div>
            <Slider
              value={[tcap]}
              min={1}
              max={5}
              step={1}
              onValueChange={(vals) => setTcap(vals[0])}
              className="py-2"
            />
            <p className="text-xs text-slate-500">1: Script Kiddie ... 5: Nation State</p>
          </div>

          <Separator className="bg-slate-800" />

          {/* RS Slider */}
          <div className="space-y-3">
            <div className="flex justify-between">
              <Label className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-500" /> Resistance Strength (RS)
              </Label>
              <span className="text-xl font-bold font-mono text-emerald-400">{rs}</span>
            </div>
            <Slider
              value={[rs]}
              min={1}
              max={5}
              step={1}
              onValueChange={(vals) => setRs(vals[0])}
              className="py-2"
            />
          </div>

          <Separator className="bg-slate-800" />

          {/* Asset Value */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-amber-500" /> Asset Value ($)
            </Label>
            <Input
              type="number"
              value={assetValue}
              onChange={(e) => setAssetValue(Number(e.target.value))}
              className="bg-slate-950 border-slate-700 text-slate-100"
            />
          </div>

          {/* TEF */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" /> Threat Event Freq (Yield/Yr)
            </Label>
            <Input
              type="number"
              value={tef}
              step={0.1}
              onChange={(e) => setTef(Number(e.target.value))}
              className="bg-slate-950 border-slate-700 text-slate-100"
            />
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

      {/* Main Dashboard */}
      <div className="lg:col-span-8 space-y-6">

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

        {/* Charts Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

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
    </div>
  );
}

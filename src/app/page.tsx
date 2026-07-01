"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Boxes,
  BrainCircuit,
  Gem,
  FileText,
  Radar,
  RefreshCw,
  Send,
  Sparkles,
  TrendingUp,
  Waves,
} from "lucide-react";

import {
  backend,
  type AIInsight,
  type Asset,
  type EcosystemSnapshot,
  type NarrativeStat,
  type Opportunity,
  type Pool,
} from "@/lib/backend";
import {
  fmtNum,
  fmtPct,
  fmtTime,
  fmtUsd,
  healthBg,
  premiumColor,
  shortAddr,
} from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

import { StatCard } from "@/components/dashboard/StatCard";
import { HealthBadge, ScoreBar } from "@/components/dashboard/HealthBadge";
import { InsightCard } from "@/components/dashboard/InsightCard";
import { OpportunityList } from "@/components/dashboard/OpportunityList";
import { EcosystemDonut, AssetBars } from "@/components/charts/Charts";
import { TvlHistoryChart } from "@/components/charts/HistoryCharts";
import { ThemeToggle } from "@/components/theme-toggle";
import type { SnapshotRow } from "@/lib/backend";

const SUGGESTED_QUESTIONS = [
  "What happened today?",
  "Which pool looks healthiest?",
  "Where is liquidity moving?",
  "What should I watch this week?",
  "Which asset gained the most momentum?",
  "What are the best yield opportunities?",
];

export default function Home() {
  const { toast } = useToast();
  const [tab, setTab] = useState<string>("overview");

  const [snapshot, setSnapshot] = useState<EcosystemSnapshot | null>(null);
  const [topAssets, setTopAssets] = useState<Asset[]>([]);
  const [topPools, setTopPools] = useState<Pool[]>([]);
  const [allAssets, setAllAssets] = useState<Asset[]>([]);
  const [allPools, setAllPools] = useState<Pool[]>([]);
  const [opps, setOpps] = useState<Opportunity[]>([]);
  const [oppCounts, setOppCounts] = useState<Record<string, number>>({});
  const [snapshots, setSnapshots] = useState<SnapshotRow[]>([]);
  const [narratives, setNarratives] = useState<NarrativeStat[]>([]);
  const [narrativeBrief, setNarrativeBrief] = useState<AIInsight | null>(null);
  const [digest, setDigest] = useState<string>("");

  const [dailyBrief, setDailyBrief] = useState<AIInsight | null>(null);
  const [healthSummary, setHealthSummary] = useState<AIInsight | null>(null);
  const [oppSummary, setOppSummary] = useState<AIInsight | null>(null);

  const [question, setQuestion] = useState("");
  const [askAnswer, setAskAnswer] = useState<AIInsight | null>(null);
  const [askLoading, setAskLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ------------------------------------------------------------------
  // Data loading
  // ------------------------------------------------------------------

  const loadOverview = useCallback(async () => {
    const o = await backend.overview();
    setSnapshot(o.snapshot);
    setTopAssets(o.topAssets);
    setTopPools(o.topPools);
    setOppCounts(o.opportunityCounts);
    setLastRefreshed(o.lastRefreshed);
  }, []);

  const loadAll = useCallback(async () => {
    const [a, p, op, sn, nr, dg] = await Promise.all([
      backend.assets(50),
      backend.pools(50),
      backend.opportunities(undefined, 30),
      backend.snapshots(168),
      backend.narratives(),
      backend.digest(),
    ]);
    setAllAssets(a.assets);
    setAllPools(p.pools);
    setOpps(op.opportunities);
    setSnapshots(sn.snapshots);
    setNarratives(nr.narratives);
    setNarrativeBrief(nr.brief);
    setDigest(dg.markdown);
  }, []);

  const loadInsights = useCallback(async () => {
    try {
      const [b, h, o] = await Promise.all([
        backend.dailyBrief(),
        backend.healthSummary(),
        backend.opportunitySummary(),
      ]);
      setDailyBrief(b);
      setHealthSummary(h);
      setOppSummary(o);
    } catch (e) {
      console.warn("insights load failed", e);
    }
  }, []);

  const initialLoad = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await loadOverview();
      await loadAll();
      await loadInsights();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      toast({ title: "Backend error", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [loadOverview, loadAll, loadInsights, toast]);

  useEffect(() => {
    initialLoad();
    const id = setInterval(() => initialLoad(), 60_000);
    return () => clearInterval(id);
  }, [initialLoad]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await backend.refresh();
      await initialLoad();
      toast({ title: "Refreshed", description: "Ecosystem data updated." });
    } catch (e: unknown) {
      toast({
        title: "Refresh failed",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  }, [initialLoad, toast]);

  const handleAsk = useCallback(async (q?: string) => {
    const query = (q ?? question).trim();
    if (!query) return;
    setAskLoading(true);
    setQuestion(query);
    try {
      const ans = await backend.ask(query);
      setAskAnswer(ans);
    } catch (e: unknown) {
      toast({
        title: "Ask failed",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setAskLoading(false);
    }
  }, [question, toast]);

  // ------------------------------------------------------------------
  // Derived data
  // ------------------------------------------------------------------

  const winners = useMemo(() => {
    return [...allAssets].sort((a, b) => b.growthScore - a.growthScore).slice(0, 5);
  }, [allAssets]);

  const largestPremiums = useMemo(() => {
    return [...allAssets].filter(a => a.premiumDiscount > 0).sort((a, b) => b.premiumDiscount - a.premiumDiscount).slice(0, 5);
  }, [allAssets]);

  const largestDiscounts = useMemo(() => {
    return [...allAssets].filter(a => a.premiumDiscount < 0).sort((a, b) => a.premiumDiscount - b.premiumDiscount).slice(0, 5);
  }, [allAssets]);

  const fastestGrowth = useMemo(() => {
    return [...allAssets].sort((a, b) => b.growthScore - a.growthScore).slice(0, 5);
  }, [allAssets]);

  const bestYieldOpps = useMemo(() => opps.filter(o => o.kind === "best_yield").slice(0, 5), [opps]);
  const hiddenGemOpps = useMemo(() => opps.filter(o => o.kind === "hidden_gem").slice(0, 5), [opps]);
  const riskOpps = useMemo(() => opps.filter(o => o.kind === "risk").slice(0, 5), [opps]);

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
              <BrainCircuit className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Mantle Tokenized Equities Intelligence</div>
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400">AI research assistant · xStocks · Fluxion</div>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <div className="hidden md:block text-xs text-zinc-500 dark:text-zinc-400">
              {lastRefreshed ? `Updated ${fmtTime(lastRefreshed)}` : "Loading…"}
            </div>
            <ThemeToggle variant="segmented" />
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-6">
        {error && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
            <strong>Backend error:</strong> {error}
          </div>
        )}

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="mb-6 bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800">
            <TabsTrigger value="overview" className="gap-1.5"><Activity className="h-3.5 w-3.5" />Overview</TabsTrigger>
            <TabsTrigger value="assets" className="gap-1.5"><Boxes className="h-3.5 w-3.5" />Assets</TabsTrigger>
            <TabsTrigger value="pools" className="gap-1.5"><Waves className="h-3.5 w-3.5" />Pools</TabsTrigger>
            <TabsTrigger value="narratives" className="gap-1.5"><Radar className="h-3.5 w-3.5" />Narratives</TabsTrigger>
            <TabsTrigger value="ai" className="gap-1.5"><Sparkles className="h-3.5 w-3.5" />AI Insights</TabsTrigger>
          </TabsList>

          {/* ---------------- OVERVIEW ---------------- */}
          <TabsContent value="overview" className="space-y-6">
            {loading || !snapshot ? (
              <OverviewSkeleton />
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCard
                    label="Total TVL"
                    value={fmtUsd(snapshot.totalTvl, { compact: true })}
                    sub={`${snapshot.assetCount} assets`}
                    accent="emerald"
                    icon={<TrendingUp className="h-4 w-4" />}
                  />
                  <StatCard
                    label="24h Volume"
                    value={fmtUsd(snapshot.totalVolume, { compact: true })}
                    sub={`${snapshot.poolCount} pools`}
                    icon={<BarChart3 className="h-4 w-4" />}
                  />
                  <StatCard
                    label="Concentration"
                    value={snapshot.marketConcentration.toFixed(3)}
                    sub={snapshot.marketConcentration > 0.3 ? "elevated HHI" : "diversified"}
                    accent={snapshot.marketConcentration > 0.3 ? "amber" : "default"}
                    icon={<AlertTriangle className="h-4 w-4" />}
                  />
                  <StatCard
                    label="Opportunities"
                    value={String(
                      (oppCounts.best_yield ?? 0) +
                      (oppCounts.hidden_gem ?? 0) +
                      (oppCounts.liquidity ?? 0)
                    )}
                    sub={`${oppCounts.risk ?? 0} risk flags`}
                    accent={oppCounts.risk ? "rose" : "emerald"}
                    icon={<Gem className="h-4 w-4" />}
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Daily brief */}
                  <div className="lg:col-span-2">
                    {dailyBrief ? (
                      <InsightCard
                        title={dailyBrief.title}
                        body={dailyBrief.body}
                        bullets={dailyBrief.bullets}
                        evidence={dailyBrief.evidence.map(e => ({ metric: String(e.metric), value: e.value as number }))}
                        accent="emerald"
                        icon={<Sparkles className="h-4 w-4" />}
                      />
                    ) : (
                      <Skeleton className="h-40 w-full" />
                    )}
                  </div>

                  {/* Ecosystem donut */}
                  <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">TVL Concentration</div>
                    <EcosystemDonut assets={topAssets} />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Top assets */}
                  <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Top Assets by TVL</h3>
                      <Button variant="ghost" size="sm" onClick={() => setTab("assets")} className="text-xs">View all →</Button>
                    </div>
                    <div className="space-y-2">
                      {topAssets.map((a, i) => (
                        <AssetRow key={a.symbol} asset={a} rank={i + 1} />
                      ))}
                    </div>
                  </div>

                  {/* Top pools */}
                  <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Top Pools by APR</h3>
                      <Button variant="ghost" size="sm" onClick={() => setTab("pools")} className="text-xs">View all →</Button>
                    </div>
                    <div className="space-y-2">
                      {topPools.map((p, i) => (
                        <PoolRow key={p.address} pool={p} rank={i + 1} />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Capital flows */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/30">
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-800 dark:text-emerald-400">
                      <TrendingUp className="h-4 w-4" /> Largest Inflows (24h)
                    </h3>
                    {snapshot.largestInflows.length > 0 ? (
                      <ul className="space-y-1.5">
                        {snapshot.largestInflows.map((f, i) => (
                          <li key={i} className="flex items-center justify-between text-sm">
                            <span className="font-mono text-zinc-700">{f.symbol}</span>
                            <span className="font-medium tabular-nums text-emerald-700">+{fmtUsd(f.usd, { compact: true })}</span>
                          </li>
                        ))}
                      </ul>
                    ) : <div className="text-sm text-zinc-500">No significant inflows detected.</div>}
                  </div>
                  <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-4 dark:border-rose-900/40 dark:bg-rose-950/30">
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-rose-800 dark:text-rose-400">
                      <TrendingUp className="h-4 w-4 rotate-180" /> Largest Outflows (24h)
                    </h3>
                    {snapshot.largestOutflows.length > 0 ? (
                      <ul className="space-y-1.5">
                        {snapshot.largestOutflows.map((f, i) => (
                          <li key={i} className="flex items-center justify-between text-sm">
                            <span className="font-mono text-zinc-700">{f.symbol}</span>
                            <span className="font-medium tabular-nums text-rose-700">-{fmtUsd(f.usd, { compact: true })}</span>
                          </li>
                        ))}
                      </ul>
                    ) : <div className="text-sm text-zinc-500">No significant outflows detected.</div>}
                  </div>
                </div>

                {/* Opportunity strip */}
                <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                  <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Top Opportunities</h3>
                  <OpportunityList opportunities={opps.slice(0, 6)} emptyHint="No opportunities detected — refresh or check back later." />
                </div>

                {/* TVL history */}
                <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">TVL & Volume History</h3>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">{snapshots.length} snapshots</span>
                  </div>
                  <TvlHistoryChart snapshots={snapshots} />
                </div>
              </>
            )}
          </TabsContent>

          {/* ---------------- ASSETS ---------------- */}
          <TabsContent value="assets" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
              <WidgetCard title="Biggest Winners (growth)">
                {winners.length === 0 ? <Empty /> : (
                  <ul className="space-y-1.5">
                    {winners.map(a => (
                      <AssetMiniRow key={a.symbol} symbol={a.symbol} value={a.growthScore.toFixed(1)} sub={`${fmtUsd(a.tvlUsd, { compact: true })} TVL`} />
                    ))}
                  </ul>
                )}
              </WidgetCard>
              <WidgetCard title="Largest Premiums">
                {largestPremiums.length === 0 ? <Empty /> : (
                  <ul className="space-y-1.5">
                    {largestPremiums.map(a => (
                      <AssetMiniRow key={a.symbol} symbol={a.symbol} value={fmtPct(a.premiumDiscount)} sub={`${fmtUsd(a.tvlUsd, { compact: true })} TVL`} valueClass="text-emerald-600" />
                    ))}
                  </ul>
                )}
              </WidgetCard>
              <WidgetCard title="Largest Discounts">
                {largestDiscounts.length === 0 ? <Empty /> : (
                  <ul className="space-y-1.5">
                    {largestDiscounts.map(a => (
                      <AssetMiniRow key={a.symbol} symbol={a.symbol} value={fmtPct(a.premiumDiscount)} sub={`${fmtUsd(a.tvlUsd, { compact: true })} TVL`} valueClass="text-rose-600" />
                    ))}
                  </ul>
                )}
              </WidgetCard>
              <WidgetCard title="Fastest Growth">
                {fastestGrowth.length === 0 ? <Empty /> : (
                  <ul className="space-y-1.5">
                    {fastestGrowth.map(a => (
                      <AssetMiniRow key={a.symbol} symbol={a.symbol} value={a.growthScore.toFixed(1)} sub={`${fmtUsd(a.volume24h, { compact: true })} 24h vol`} />
                    ))}
                  </ul>
                )}
              </WidgetCard>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between p-4">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">All Assets ({allAssets.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 text-xs uppercase tracking-wider text-zinc-500 dark:bg-zinc-950/50 dark:text-zinc-400">
                    <tr>
                      <th className="px-4 py-2 text-left">#</th>
                      <th className="px-4 py-2 text-left">Asset</th>
                      <th className="px-4 py-2 text-right">TVL</th>
                      <th className="px-4 py-2 text-right">Volume 24h</th>
                      <th className="px-4 py-2 text-right">Price</th>
                      <th className="px-4 py-2 text-right">Prem/Disc</th>
                      <th className="px-4 py-2 text-right">Liquidity</th>
                      <th className="px-4 py-2 text-right">Health</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allAssets.map((a, i) => (
                      <tr key={a.symbol} className="border-t border-zinc-100 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50">
                        <td className="px-4 py-2.5 tabular-nums text-zinc-400 dark:text-zinc-500">{i + 1}</td>
                        <td className="px-4 py-2.5">
                          <div className="font-mono font-medium text-zinc-900 dark:text-zinc-100">{a.symbol}</div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400">{a.name}</div>
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums">{fmtUsd(a.tvlUsd, { compact: true })}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums">{fmtUsd(a.volume24h, { compact: true })}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums">${fmtNum(a.price, 2)}</td>
                        <td className={`px-4 py-2.5 text-right tabular-nums ${premiumColor(a.premiumDiscount)}`}>{fmtPct(a.premiumDiscount)}</td>
                        <td className="px-4 py-2.5">
                          <ScoreBar score={a.liquidityScore} />
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <HealthBadge score={a.healthScore} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">TVL by Asset</h3>
              <AssetBars assets={allAssets.slice(0, 10)} />
            </div>
          </TabsContent>

          {/* ---------------- POOLS ---------------- */}
          <TabsContent value="pools" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <WidgetCard title="Best Yield" accent="emerald">
                <OpportunityList opportunities={bestYieldOpps} emptyHint="No yield opportunities right now." />
              </WidgetCard>
              <WidgetCard title="Hidden Gems" accent="violet">
                <OpportunityList opportunities={hiddenGemOpps} emptyHint="No hidden gems right now." />
              </WidgetCard>
              <WidgetCard title="Risk Warnings" accent="rose">
                <OpportunityList opportunities={riskOpps} emptyHint="No risks flagged." />
              </WidgetCard>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between p-4">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">All Pools ({allPools.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 text-xs uppercase tracking-wider text-zinc-500 dark:bg-zinc-950/50 dark:text-zinc-400">
                    <tr>
                      <th className="px-4 py-2 text-left">#</th>
                      <th className="px-4 py-2 text-left">Pool</th>
                      <th className="px-4 py-2 text-right">TVL</th>
                      <th className="px-4 py-2 text-right">Volume 24h</th>
                      <th className="px-4 py-2 text-right">Fees 24h</th>
                      <th className="px-4 py-2 text-right">APR</th>
                      <th className="px-4 py-2 text-right">V/TVL</th>
                      <th className="px-4 py-2 text-right">Health</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allPools.map((p, i) => (
                      <tr key={p.address} className="border-t border-zinc-100 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50">
                        <td className="px-4 py-2.5 tabular-nums text-zinc-400 dark:text-zinc-500">{i + 1}</td>
                        <td className="px-4 py-2.5">
                          <div className="font-mono font-medium text-zinc-900 dark:text-zinc-100">{p.assetSymbol}/MNT</div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400">{shortAddr(p.address)}</div>
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums">{fmtUsd(p.tvlUsd, { compact: true })}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums">{fmtUsd(p.volume24h, { compact: true })}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums">{fmtUsd(p.fees24h, { compact: true })}</td>
                        <td className={`px-4 py-2.5 text-right tabular-nums font-medium ${p.apr > 80 ? "text-amber-600" : p.apr >= 10 ? "text-emerald-600" : "text-zinc-500"}`}>
                          {p.apr.toFixed(2)}%
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-zinc-500">{p.volumeToTvl.toFixed(3)}</td>
                        <td className="px-4 py-2.5 text-right">
                          <HealthBadge score={p.healthScore} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* ---------------- NARRATIVES ---------------- */}
          <TabsContent value="narratives" className="space-y-6">
            {narrativeBrief && (
              <InsightCard
                title={narrativeBrief.title}
                body={narrativeBrief.body}
                bullets={narrativeBrief.bullets}
                accent="violet"
                icon={<Radar className="h-4 w-4" />}
              />
            )}

            <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between p-4">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Narrative Radar (7d) — {narratives.length} themes
                </h3>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">momentum vs prior period</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 text-xs uppercase tracking-wider text-zinc-500 dark:bg-zinc-950/50 dark:text-zinc-400">
                    <tr>
                      <th className="px-4 py-2 text-left">Narrative</th>
                      <th className="px-4 py-2 text-right">Mentions</th>
                      <th className="px-4 py-2 text-right">Δ vs prior</th>
                      <th className="px-4 py-2 text-right">Reach</th>
                      <th className="px-4 py-2 text-right">Sources</th>
                      <th className="px-4 py-2 text-left">Stage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {narratives.map((n) => (
                      <tr
                        key={n.narrative}
                        className="border-t border-zinc-100 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                      >
                        <td className="px-4 py-2.5 font-medium text-zinc-900 dark:text-zinc-100">{n.narrative}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums">{n.mentions}</td>
                        <td
                          className={`px-4 py-2.5 text-right font-medium tabular-nums ${
                            n.deltaPct > 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : n.deltaPct < 0
                                ? "text-rose-600 dark:text-rose-400"
                                : "text-zinc-500"
                          }`}
                        >
                          {n.deltaPct >= 0 ? "+" : ""}
                          {n.deltaPct.toFixed(0)}%
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums">{fmtReach(n.reach)}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-zinc-500">{n.breadth}</td>
                        <td className="px-4 py-2.5">{stageLabel(n.stage)}</td>
                      </tr>
                    ))}
                    {narratives.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-xs text-zinc-500">
                          No narrative chatter indexed.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Two-lens Markdown research digest */}
            <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Daily Research Digest (Markdown)
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(digest);
                    toast({ title: "Digest copied to clipboard" });
                  }}
                  className="ml-auto rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  Copy
                </button>
              </div>
              <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-lg bg-zinc-950 p-4 text-xs leading-relaxed text-zinc-100">
{digest || "Loading digest…"}
              </pre>
            </div>
          </TabsContent>

          {/* ---------------- AI INSIGHTS ---------------- */}
          <TabsContent value="ai" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {dailyBrief ? (
                <InsightCard
                  title={dailyBrief.title}
                  body={dailyBrief.body}
                  bullets={dailyBrief.bullets}
                  evidence={dailyBrief.evidence.map(e => ({ metric: String(e.metric), value: e.value as number }))}
                  accent="emerald"
                  icon={<Sparkles className="h-4 w-4" />}
                />
              ) : <Skeleton className="h-40 w-full rounded-xl" />}
              {healthSummary ? (
                <InsightCard
                  title={healthSummary.title}
                  body={healthSummary.body}
                  bullets={healthSummary.bullets}
                  evidence={healthSummary.evidence.map(e => ({ metric: String(e.metric), value: e.value as number }))}
                  accent="amber"
                  icon={<Activity className="h-4 w-4" />}
                />
              ) : <Skeleton className="h-40 w-full rounded-xl" />}
            </div>

            {oppSummary && (
              <InsightCard
                title={oppSummary.title}
                body={oppSummary.body}
                bullets={oppSummary.bullets}
                evidence={oppSummary.evidence.map(e => ({ metric: String(e.metric), value: e.value as number }))}
                accent="violet"
                icon={<Gem className="h-4 w-4" />}
              />
            )}

            {/* Ask Mantle */}
            <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-3 flex items-center gap-2">
                <BrainCircuit className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Ask Mantle</h3>
                <span className="ml-auto text-xs text-zinc-500 dark:text-zinc-400">Answers grounded in calculated metrics</span>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-3">
                {SUGGESTED_QUESTIONS.map(q => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleAsk(q)}
                    className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs text-zinc-700 hover:bg-zinc-100 transition dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                  >
                    {q}
                  </button>
                ))}
              </div>

              <form
                onSubmit={(e) => { e.preventDefault(); handleAsk(); }}
                className="flex gap-2"
              >
                <Input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask a question about the ecosystem…"
                  className="flex-1"
                  disabled={askLoading}
                />
                <Button type="submit" disabled={askLoading || !question.trim()} className="gap-1.5">
                  <Send className="h-3.5 w-3.5" />
                  Ask
                </Button>
              </form>

              {askAnswer && (
                <div className="mt-4 rounded-lg border border-violet-200 bg-violet-50/40 p-4 dark:border-violet-900/40 dark:bg-violet-950/30">
                  <div className="text-xs font-medium uppercase tracking-wider text-violet-700 dark:text-violet-400">{askAnswer.title}</div>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">{askAnswer.body}</p>
                  {askAnswer.bullets.length > 0 && (
                    <ul className="mt-3 space-y-1">
                      {askAnswer.bullets.map((b, i) => (
                        <li key={i} className="flex gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-violet-400" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <footer className="mt-auto border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-7xl px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
          <div>Mantle Tokenized Equities Intelligence Agent · v1.0</div>
          <div className="hidden md:block">Deterministic analytics · AI narratives · SQLite history</div>
        </div>
      </footer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function fmtReach(x: number): string {
  if (x >= 1_000_000) return `${(x / 1_000_000).toFixed(2)}M`;
  if (x >= 1_000) return `${(x / 1_000).toFixed(1)}K`;
  return String(x);
}

function stageLabel(stage: string) {
  const map: Record<string, { label: string; cls: string }> = {
    breaking_out: { label: "🔥 breaking out", cls: "text-rose-600 dark:text-rose-400" },
    emerging: { label: "🚀 emerging", cls: "text-emerald-600 dark:text-emerald-400" },
    mainstream: { label: "📊 mainstream", cls: "text-zinc-500 dark:text-zinc-400" },
    cooling: { label: "📉 cooling", cls: "text-amber-600 dark:text-amber-400" },
  };
  const s = map[stage] ?? map.mainstream;
  return <span className={`text-xs font-medium ${s.cls}`}>{s.label}</span>;
}

function AssetRow({ asset, rank }: { asset: Asset; rank: number }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-xs tabular-nums text-zinc-400 dark:text-zinc-500 w-4">{rank}</span>
        <div className="min-w-0">
          <div className="font-mono text-sm font-medium text-zinc-900 dark:text-zinc-100">{asset.symbol}</div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{asset.name}</div>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right">
          <div className="text-sm tabular-nums text-zinc-900 dark:text-zinc-100">{fmtUsd(asset.tvlUsd, { compact: true })}</div>
          <div className="text-xs tabular-nums text-zinc-500 dark:text-zinc-400">{fmtUsd(asset.volume24h, { compact: true })} 24h</div>
        </div>
        <HealthBadge score={asset.healthScore} />
      </div>
    </div>
  );
}

function PoolRow({ pool, rank }: { pool: Pool; rank: number }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-xs tabular-nums text-zinc-400 dark:text-zinc-500 w-4">{rank}</span>
        <div className="min-w-0">
          <div className="font-mono text-sm font-medium text-zinc-900 dark:text-zinc-100">{pool.assetSymbol}/MNT</div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">{shortAddr(pool.address)}</div>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right">
          <div className={`text-sm tabular-nums font-medium ${pool.apr > 80 ? "text-amber-600" : pool.apr >= 10 ? "text-emerald-600" : "text-zinc-500 dark:text-zinc-400"}`}>
            {pool.apr.toFixed(2)}% APR
          </div>
          <div className="text-xs tabular-nums text-zinc-500 dark:text-zinc-400">{fmtUsd(pool.tvlUsd, { compact: true })} TVL</div>
        </div>
        <HealthBadge score={pool.healthScore} />
      </div>
    </div>
  );
}

function WidgetCard({ title, children, accent }: { title: string; children: React.ReactNode; accent?: "emerald" | "violet" | "rose" | "default" }) {
  const cls = accent === "emerald" ? "border-emerald-200 bg-emerald-50/30"
    : accent === "violet" ? "border-violet-200 bg-violet-50/30"
    : accent === "rose" ? "border-rose-200 bg-rose-50/30"
    : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900";
  return (
    <div className={`rounded-xl border p-4 ${cls}`}>
      <h4 className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-600 dark:text-zinc-400">{title}</h4>
      {children}
    </div>
  );
}

function AssetMiniRow({ symbol, value, sub, valueClass }: { symbol: string; value: string; sub?: string; valueClass?: string }) {
  return (
    <li className="flex items-center justify-between text-sm">
      <div>
        <div className="font-mono text-zinc-800 dark:text-zinc-200">{symbol}</div>
        {sub && <div className="text-xs text-zinc-500 dark:text-zinc-500">{sub}</div>}
      </div>
      <span className={`tabular-nums font-medium ${valueClass ?? "text-zinc-700 dark:text-zinc-300"}`}>{value}</span>
    </li>
  );
}

function Empty() {
  return <div className="text-xs text-zinc-500 dark:text-zinc-400">No data</div>;
}

function OverviewSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Skeleton className="h-40 lg:col-span-2" />
        <Skeleton className="h-40" />
      </div>
    </div>
  );
}

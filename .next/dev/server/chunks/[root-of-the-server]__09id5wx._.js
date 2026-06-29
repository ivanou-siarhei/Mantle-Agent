module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/src/lib/db.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "db",
    ()=>db
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__ = __turbopack_context__.i("[externals]/@prisma/client [external] (@prisma/client, cjs, [project]/node_modules/@prisma/client)");
;
const globalForPrisma = globalThis;
const db = globalForPrisma.prisma ?? new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__["PrismaClient"]({
    log: [
        'query'
    ]
});
if ("TURBOPACK compile-time truthy", 1) globalForPrisma.prisma = db;
}),
"[project]/src/lib/intel/storage.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "latestSnapshot",
    ()=>latestSnapshot,
    "listAssetHistory",
    ()=>listAssetHistory,
    "listPoolHistory",
    ()=>listPoolHistory,
    "listSnapshots",
    ()=>listSnapshots,
    "previousSnapshot",
    ()=>previousSnapshot,
    "writeAiSummary",
    ()=>writeAiSummary,
    "writeAssetSeries",
    ()=>writeAssetSeries,
    "writeOpportunities",
    ()=>writeOpportunities,
    "writePoolSeries",
    ()=>writePoolSeries,
    "writeSnapshot",
    ()=>writeSnapshot,
    "writeTrades",
    ()=>writeTrades
]);
/**
 * Storage layer — Prisma-based persistence for snapshots, asset/pool
 * time series, trades, opportunities and AI summaries.
 *
 * Mirrors backend/storage/__init__.py.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/db.ts [app-route] (ecmascript)");
;
async function writeSnapshot(snap) {
    const r = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].snapshot.create({
        data: {
            ts: new Date(snap.timestamp),
            totalTvl: snap.totalTvl,
            totalVolume: snap.totalVolume,
            assetCount: snap.assetCount,
            poolCount: snap.poolCount,
            concentration: snap.marketConcentration,
            payload: JSON.stringify(snap)
        }
    });
    return r.id;
}
async function writeAssetSeries(assets, ts = new Date()) {
    if (assets.length === 0) return;
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].assetSeries.createMany({
        data: assets.map((a)=>({
                ts,
                symbol: a.symbol,
                address: a.address,
                tvlUsd: a.tvlUsd,
                volume24h: a.volume24h,
                price: a.price,
                premium: a.premiumDiscount,
                healthScore: a.healthScore,
                liquidityScore: a.liquidityScore,
                growthScore: a.growthScore
            }))
    });
}
async function writePoolSeries(pools, ts = new Date()) {
    if (pools.length === 0) return;
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].poolSeries.createMany({
        data: pools.map((p)=>({
                ts,
                address: p.address,
                assetSymbol: p.assetSymbol,
                tvlUsd: p.tvlUsd,
                volume24h: p.volume24h,
                fees24h: p.fees24h,
                apr: p.apr,
                volumeToTvl: p.volumeToTvl,
                healthScore: p.healthScore
            }))
    });
}
async function writeTrades(trades) {
    if (trades.length === 0) return 0;
    // SQLite UNIQUE on txHash — skip duplicates
    let count = 0;
    for (const t of trades){
        try {
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].trade.create({
                data: {
                    ts: new Date(t.timestamp),
                    txHash: t.txHash,
                    assetSymbol: t.assetSymbol,
                    poolAddress: t.poolAddress,
                    amountUsd: t.amountUsd,
                    price: t.price,
                    kind: t.kind
                }
            });
            count++;
        } catch  {
        // duplicate txHash — skip
        }
    }
    return count;
}
async function writeOpportunities(opps, ts = new Date()) {
    if (opps.length === 0) return;
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].opportunityLog.createMany({
        data: opps.map((o)=>({
                ts,
                kind: o.kind,
                title: o.title,
                payload: JSON.stringify(o)
            }))
    });
}
async function writeAiSummary(insight) {
    const r = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].aiSummary.create({
        data: {
            ts: new Date(insight.generatedAt),
            kind: insight.kind,
            title: insight.title,
            body: insight.body,
            bullets: JSON.stringify(insight.bullets),
            evidence: JSON.stringify(insight.evidence)
        }
    });
    return r.id;
}
async function listSnapshots(limit = 168) {
    const rows = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].snapshot.findMany({
        orderBy: {
            ts: "desc"
        },
        take: limit
    });
    return rows.map((r)=>JSON.parse(r.payload));
}
async function latestSnapshot() {
    const rows = await listSnapshots(1);
    return rows[0] ?? null;
}
async function listAssetHistory(symbol, limit = 168) {
    const rows = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].assetSeries.findMany({
        where: {
            symbol
        },
        orderBy: {
            ts: "desc"
        },
        take: limit
    });
    return rows.reverse().map((r)=>({
            ts: r.ts.toISOString(),
            tvlUsd: r.tvlUsd,
            volume24h: r.volume24h,
            price: r.price,
            premium: r.premium,
            healthScore: r.healthScore,
            liquidityScore: r.liquidityScore,
            growthScore: r.growthScore
        }));
}
async function listPoolHistory(address, limit = 168) {
    const rows = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].poolSeries.findMany({
        where: {
            address
        },
        orderBy: {
            ts: "desc"
        },
        take: limit
    });
    return rows.reverse().map((r)=>({
            ts: r.ts.toISOString(),
            tvlUsd: r.tvlUsd,
            volume24h: r.volume24h,
            fees24h: r.fees24h,
            apr: r.apr,
            volumeToTvl: r.volumeToTvl,
            healthScore: r.healthScore
        }));
}
async function previousSnapshot() {
    const rows = await listSnapshots(2);
    return rows[1] ?? null;
}
}),
"[project]/src/app/api/snapshots/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "dynamic",
    ()=>dynamic
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$intel$2f$storage$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/intel/storage.ts [app-route] (ecmascript)");
;
;
const dynamic = "force-dynamic";
async function GET(request) {
    try {
        const url = new URL(request.url);
        const limit = Math.min(2000, Math.max(1, parseInt(url.searchParams.get("limit") ?? "168", 10)));
        const snapshots = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$intel$2f$storage$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["listSnapshots"])(limit);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            snapshots
        });
    } catch (e) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: e instanceof Error ? e.message : String(e)
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__09id5wx._.js.map
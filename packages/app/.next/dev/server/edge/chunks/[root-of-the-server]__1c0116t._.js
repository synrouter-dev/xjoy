(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push(["chunks/[root-of-the-server]__1c0116t._.js",
"[externals]/node:async_hooks [external] (node:async_hooks, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("node:async_hooks", () => require("node:async_hooks"));

module.exports = mod;
}),
"[externals]/node:buffer [external] (node:buffer, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("node:buffer", () => require("node:buffer"));

module.exports = mod;
}),
"[externals]/node:events [external] (node:events, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("node:events", () => require("node:events"));

module.exports = mod;
}),
"[project]/packages/app/sentry.edge.config.ts [instrumentation-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
/**
 * Sentry configuration for the Edge runtime.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$sentry$2b$nextjs$40$10$2e$69$2e$0_$40$opentelemetry$2b$core$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_$5f40$opentelemetry$2b$sd_3ph4ca5bzx4uvcrlp26myitwky$2f$node_modules$2f40$sentry$2f$nextjs$2f$build$2f$esm$2f$edge$2f$index$2e$js__$5b$instrumentation$2d$edge$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@sentry+nextjs@10.69.0_@opentelemetry+core@2.10.0_@opentelemetry+api@1.9.1__@opentelemetry+sd_3ph4ca5bzx4uvcrlp26myitwky/node_modules/@sentry/nextjs/build/esm/edge/index.js [instrumentation-edge] (ecmascript) <locals>");
;
__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$sentry$2b$nextjs$40$10$2e$69$2e$0_$40$opentelemetry$2b$core$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_$5f40$opentelemetry$2b$sd_3ph4ca5bzx4uvcrlp26myitwky$2f$node_modules$2f40$sentry$2f$nextjs$2f$build$2f$esm$2f$edge$2f$index$2e$js__$5b$instrumentation$2d$edge$5d$__$28$ecmascript$29$__$3c$locals$3e$__["init"]({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: ("TURBOPACK compile-time value", "development") || "development",
    tracesSampleRate: ("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : 1.0
});
}),
"[project]/packages/app/src/instrumentation.ts [instrumentation-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Next.js instrumentation hook — Sentry init.
 */ __turbopack_context__.s([
    "register",
    ()=>register
]);
async function register() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    if ("TURBOPACK compile-time truthy", 1) {
        await Promise.resolve().then(()=>__turbopack_context__.i("[project]/packages/app/sentry.edge.config.ts [instrumentation-edge] (ecmascript)"));
    }
}
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__1c0116t._.js.map
module.exports = [
"[project]/packages/app/src/instrumentation.ts [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Next.js instrumentation hook — Sentry init.
 */ __turbopack_context__.s([
    "register",
    ()=>register
]);
async function register() {
    if ("TURBOPACK compile-time truthy", 1) {
        await __turbopack_context__.A("[project]/packages/app/sentry.server.config.ts [instrumentation] (ecmascript, async loader)");
    }
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
}
}),
];

//# sourceMappingURL=packages_app_src_instrumentation_ts_1m4176q._.js.map
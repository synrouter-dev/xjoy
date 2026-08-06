module.exports = [
"[externals]/node:inspector [external] (node:inspector, cjs, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.all([
  "server/chunks/[externals]_node_inspector_0_z8m0y._.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[externals]/node:inspector [external] (node:inspector, cjs)");
    });
});
}),
];
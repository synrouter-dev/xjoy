module.exports = [
"[project]/node_modules/.pnpm/@opentelemetry+sdk-trace@2.10.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-trace/build/esm/MultiSpanProcessor.js [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "MultiSpanProcessor",
    ()=>MultiSpanProcessor
]);
/*
 * Copyright The OpenTelemetry Authors
 * SPDX-License-Identifier: Apache-2.0
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$core$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$core$2f$build$2f$esm$2f$common$2f$global$2d$error$2d$handler$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@opentelemetry+core@2.10.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/core/build/esm/common/global-error-handler.js [instrumentation] (ecmascript)");
;
class MultiSpanProcessor {
    _spanProcessors;
    constructor(spanProcessors){
        this._spanProcessors = spanProcessors;
    }
    forceFlush() {
        const promises = [];
        for (const spanProcessor of this._spanProcessors){
            promises.push(spanProcessor.forceFlush());
        }
        return new Promise((resolve)=>{
            Promise.all(promises).then(()=>{
                resolve();
            }).catch((error)=>{
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$core$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$core$2f$build$2f$esm$2f$common$2f$global$2d$error$2d$handler$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["globalErrorHandler"])(error || new Error('MultiSpanProcessor: forceFlush failed'));
                resolve();
            });
        });
    }
    onStart(span, context) {
        for (const spanProcessor of this._spanProcessors){
            spanProcessor.onStart(span, context);
        }
    }
    onEnding(span) {
        for (const spanProcessor of this._spanProcessors){
            if (spanProcessor.onEnding) {
                spanProcessor.onEnding(span);
            }
        }
    }
    onEnd(span) {
        for (const spanProcessor of this._spanProcessors){
            spanProcessor.onEnd(span);
        }
    }
    shutdown() {
        const promises = [];
        for (const spanProcessor of this._spanProcessors){
            promises.push(spanProcessor.shutdown());
        }
        return new Promise((resolve, reject)=>{
            Promise.all(promises).then(()=>{
                resolve();
            }, reject);
        });
    }
}
}),
"[project]/node_modules/.pnpm/@opentelemetry+sdk-trace@2.10.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-trace/build/esm/Sampler.js [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/*
 * Copyright The OpenTelemetry Authors
 * SPDX-License-Identifier: Apache-2.0
 */ /**
 * A sampling decision that determines how a {@link Span} will be recorded
 * and collected.
 */ __turbopack_context__.s([
    "SamplingDecision",
    ()=>SamplingDecision
]);
var SamplingDecision;
(function(SamplingDecision) {
    /**
     * `Span.isRecording() === false`, span will not be recorded and all events
     * and attributes will be dropped.
     */ SamplingDecision[SamplingDecision["NOT_RECORD"] = 0] = "NOT_RECORD";
    /**
     * `Span.isRecording() === true`, but `Sampled` flag in {@link TraceFlags}
     * MUST NOT be set.
     */ SamplingDecision[SamplingDecision["RECORD"] = 1] = "RECORD";
    /**
     * `Span.isRecording() === true` AND `Sampled` flag in {@link TraceFlags}
     * MUST be set.
     */ SamplingDecision[SamplingDecision["RECORD_AND_SAMPLED"] = 2] = "RECORD_AND_SAMPLED";
})(SamplingDecision || (SamplingDecision = {}));
}),
"[project]/node_modules/.pnpm/@opentelemetry+sdk-trace@2.10.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-trace/build/esm/Span.js [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SpanImpl",
    ()=>SpanImpl
]);
/*
 * Copyright The OpenTelemetry Authors
 * SPDX-License-Identifier: Apache-2.0
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$diag$2d$api$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@opentelemetry+api@1.9.1/node_modules/@opentelemetry/api/build/esm/diag-api.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$status$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@opentelemetry+api@1.9.1/node_modules/@opentelemetry/api/build/esm/trace/status.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$core$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$core$2f$build$2f$esm$2f$common$2f$time$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@opentelemetry+core@2.10.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/core/build/esm/common/time.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$core$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$core$2f$build$2f$esm$2f$common$2f$attributes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@opentelemetry+core@2.10.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/core/build/esm/common/attributes.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$core$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$core$2f$build$2f$esm$2f$platform$2f$node$2f$index$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@opentelemetry+core@2.10.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/core/build/esm/platform/node/index.js [instrumentation] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$semantic$2d$conventions$40$1$2e$43$2e$0$2f$node_modules$2f40$opentelemetry$2f$semantic$2d$conventions$2f$build$2f$esm$2f$stable_attributes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@opentelemetry+semantic-conventions@1.43.0/node_modules/@opentelemetry/semantic-conventions/build/esm/stable_attributes.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$sdk$2d$trace$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$sdk$2d$trace$2f$build$2f$esm$2f$enums$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@opentelemetry+sdk-trace@2.10.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-trace/build/esm/enums.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$sdk$2d$trace$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$sdk$2d$trace$2f$build$2f$esm$2f$inspect$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@opentelemetry+sdk-trace@2.10.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-trace/build/esm/inspect.js [instrumentation] (ecmascript)");
;
;
;
;
;
class SpanImpl {
    // Below properties are included to implement ReadableSpan for export
    // purposes but are not intended to be written-to directly.
    _spanContext;
    kind;
    parentSpanContext;
    attributes = {};
    links = [];
    events = [];
    startTime;
    resource;
    instrumentationScope;
    _droppedAttributesCount = 0;
    _droppedEventsCount = 0;
    _droppedLinksCount = 0;
    _attributesCount = 0;
    name;
    status = {
        code: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$status$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["SpanStatusCode"].UNSET
    };
    endTime = [
        0,
        0
    ];
    _ended = false;
    _duration = [
        -1,
        -1
    ];
    _spanProcessor;
    _spanLimits;
    _attributeValueLengthLimit;
    _recordEndMetrics;
    _performanceStartTime;
    _performanceOffset;
    _startTimeProvided;
    /**
     * Constructs a new SpanImpl instance.
     */ constructor(opts){
        const now = Date.now();
        this._spanContext = opts.spanContext;
        this._performanceStartTime = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$core$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$core$2f$build$2f$esm$2f$platform$2f$node$2f$index$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$locals$3e$__["otperformance"].now();
        this._performanceOffset = now - (this._performanceStartTime + __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$core$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$core$2f$build$2f$esm$2f$platform$2f$node$2f$index$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$locals$3e$__["otperformance"].timeOrigin);
        this._startTimeProvided = opts.startTime != null;
        this._spanLimits = opts.spanLimits;
        this._attributeValueLengthLimit = this._spanLimits.attributeValueLengthLimit ?? 0;
        this._spanProcessor = opts.spanProcessor;
        this.name = opts.name;
        this.parentSpanContext = opts.parentSpanContext;
        this.kind = opts.kind;
        if (opts.links) {
            for (const link of opts.links){
                this.addLink(link);
            }
        }
        this.startTime = this._getTime(opts.startTime ?? now);
        this.resource = opts.resource;
        this.instrumentationScope = opts.scope;
        this._recordEndMetrics = opts.recordEndMetrics;
        if (opts.attributes != null) {
            this.setAttributes(opts.attributes);
        }
        this._spanProcessor.onStart(this, opts.context);
    }
    spanContext() {
        return this._spanContext;
    }
    setAttribute(key, value) {
        if (value == null || this._isSpanEnded()) return this;
        if (key.length === 0) {
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$diag$2d$api$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["diag"].warn(`Invalid attribute key: ${key}`);
            return this;
        }
        if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$core$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$core$2f$build$2f$esm$2f$common$2f$attributes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["isAttributeValue"])(value)) {
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$diag$2d$api$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["diag"].warn(`Invalid attribute value set for key: ${key}`);
            return this;
        }
        const { attributeCountLimit } = this._spanLimits;
        const isNewKey = !Object.prototype.hasOwnProperty.call(this.attributes, key);
        if (attributeCountLimit !== undefined && this._attributesCount >= attributeCountLimit && isNewKey) {
            this._droppedAttributesCount++;
            return this;
        }
        this.attributes[key] = this._truncateToSize(value);
        if (isNewKey) {
            this._attributesCount++;
        }
        return this;
    }
    setAttributes(attributes) {
        for(const key in attributes){
            if (Object.prototype.hasOwnProperty.call(attributes, key)) {
                this.setAttribute(key, attributes[key]);
            }
        }
        return this;
    }
    /**
     *
     * @param name Span Name
     * @param [attributesOrStartTime] Span attributes or start time
     *     if type is {@type TimeInput} and 3rd param is undefined
     * @param [timeStamp] Specified time stamp for the event
     */ addEvent(name, attributesOrStartTime, timeStamp) {
        if (this._isSpanEnded()) return this;
        const { eventCountLimit } = this._spanLimits;
        if (eventCountLimit === 0) {
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$diag$2d$api$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["diag"].warn('No events allowed.');
            this._droppedEventsCount++;
            return this;
        }
        if (eventCountLimit !== undefined && this.events.length >= eventCountLimit) {
            if (this._droppedEventsCount === 0) {
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$diag$2d$api$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["diag"].debug('Dropping extra events.');
            }
            this.events.shift();
            this._droppedEventsCount++;
        }
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$core$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$core$2f$build$2f$esm$2f$common$2f$time$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["isTimeInput"])(attributesOrStartTime)) {
            if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$core$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$core$2f$build$2f$esm$2f$common$2f$time$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["isTimeInput"])(timeStamp)) {
                timeStamp = attributesOrStartTime;
            }
            attributesOrStartTime = undefined;
        }
        const sanitized = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$core$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$core$2f$build$2f$esm$2f$common$2f$attributes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sanitizeAttributes"])(attributesOrStartTime);
        const { attributePerEventCountLimit } = this._spanLimits;
        const attributes = {};
        let droppedAttributesCount = 0;
        let eventAttributesCount = 0;
        for(const attr in sanitized){
            if (!Object.prototype.hasOwnProperty.call(sanitized, attr)) {
                continue;
            }
            const attrVal = sanitized[attr];
            if (attributePerEventCountLimit !== undefined && eventAttributesCount >= attributePerEventCountLimit) {
                droppedAttributesCount++;
                continue;
            }
            attributes[attr] = this._truncateToSize(attrVal);
            eventAttributesCount++;
        }
        this.events.push({
            name,
            attributes,
            time: this._getTime(timeStamp),
            droppedAttributesCount
        });
        return this;
    }
    addLink(link) {
        if (this._isSpanEnded()) return this;
        const { linkCountLimit } = this._spanLimits;
        if (linkCountLimit === 0) {
            this._droppedLinksCount++;
            return this;
        }
        if (linkCountLimit !== undefined && this.links.length >= linkCountLimit) {
            if (this._droppedLinksCount === 0) {
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$diag$2d$api$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["diag"].debug('Dropping extra links.');
            }
            this.links.shift();
            this._droppedLinksCount++;
        }
        const { attributePerLinkCountLimit } = this._spanLimits;
        const sanitized = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$core$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$core$2f$build$2f$esm$2f$common$2f$attributes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sanitizeAttributes"])(link.attributes);
        const attributes = {};
        let droppedAttributesCount = 0;
        let linkAttributesCount = 0;
        for(const attr in sanitized){
            if (!Object.prototype.hasOwnProperty.call(sanitized, attr)) {
                continue;
            }
            const attrVal = sanitized[attr];
            if (attributePerLinkCountLimit !== undefined && linkAttributesCount >= attributePerLinkCountLimit) {
                droppedAttributesCount++;
                continue;
            }
            attributes[attr] = this._truncateToSize(attrVal);
            linkAttributesCount++;
        }
        const processedLink = {
            context: link.context
        };
        if (linkAttributesCount > 0) {
            processedLink.attributes = attributes;
        }
        if (droppedAttributesCount > 0) {
            processedLink.droppedAttributesCount = droppedAttributesCount;
        }
        this.links.push(processedLink);
        return this;
    }
    addLinks(links) {
        for (const link of links){
            this.addLink(link);
        }
        return this;
    }
    setStatus(status) {
        if (this._isSpanEnded()) return this;
        if (status.code === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$status$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["SpanStatusCode"].UNSET) return this;
        if (this.status.code === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$status$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["SpanStatusCode"].OK) return this;
        const newStatus = {
            code: status.code
        };
        // When using try-catch, the caught "error" is of type `any`. When then assigning `any` to `status.message`,
        // TypeScript will not error. While this can happen during use of any API, it is more common on Span#setStatus()
        // as it's likely used in a catch-block. Therefore, we validate if `status.message` is actually a string, null, or
        // undefined to avoid an incorrect type causing issues downstream.
        if (status.code === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$status$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["SpanStatusCode"].ERROR) {
            if (typeof status.message === 'string') {
                newStatus.message = status.message;
            } else if (status.message != null) {
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$diag$2d$api$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["diag"].warn(`Dropping invalid status.message of type '${typeof status.message}', expected 'string'`);
            }
        }
        this.status = newStatus;
        return this;
    }
    updateName(name) {
        if (this._isSpanEnded()) return this;
        this.name = name;
        return this;
    }
    end(endTime) {
        if (this._isSpanEnded()) {
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$diag$2d$api$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["diag"].error(`${this.name} ${this._spanContext.traceId}-${this._spanContext.spanId} - You can only call end() on a span once.`);
            return;
        }
        this.endTime = this._getTime(endTime);
        this._duration = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$core$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$core$2f$build$2f$esm$2f$common$2f$time$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["hrTimeDuration"])(this.startTime, this.endTime);
        if (this._duration[0] < 0) {
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$diag$2d$api$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["diag"].warn('Inconsistent start and end time, startTime > endTime. Setting span duration to 0ms.', this.startTime, this.endTime);
            this.endTime = this.startTime.slice();
            this._duration = [
                0,
                0
            ];
        }
        if (this._droppedEventsCount > 0) {
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$diag$2d$api$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["diag"].warn(`Dropped ${this._droppedEventsCount} events because eventCountLimit reached`);
        }
        if (this._droppedLinksCount > 0) {
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$diag$2d$api$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["diag"].warn(`Dropped ${this._droppedLinksCount} links because linkCountLimit reached`);
        }
        if (this._spanProcessor.onEnding) {
            this._spanProcessor.onEnding(this);
        }
        this._recordEndMetrics?.();
        this._ended = true;
        this._spanProcessor.onEnd(this);
    }
    _getTime(inp) {
        if (typeof inp === 'number' && inp <= __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$core$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$core$2f$build$2f$esm$2f$platform$2f$node$2f$index$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$locals$3e$__["otperformance"].now()) {
            // must be a performance timestamp
            // apply correction and convert to hrtime
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$core$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$core$2f$build$2f$esm$2f$common$2f$time$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["hrTime"])(inp + this._performanceOffset);
        }
        if (typeof inp === 'number') {
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$core$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$core$2f$build$2f$esm$2f$common$2f$time$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["millisToHrTime"])(inp);
        }
        if (inp instanceof Date) {
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$core$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$core$2f$build$2f$esm$2f$common$2f$time$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["millisToHrTime"])(inp.getTime());
        }
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$core$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$core$2f$build$2f$esm$2f$common$2f$time$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["isTimeInputHrTime"])(inp)) {
            return inp;
        }
        if (this._startTimeProvided) {
            // if user provided a time for the start manually
            // we can't use duration to calculate event/end times
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$core$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$core$2f$build$2f$esm$2f$common$2f$time$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["millisToHrTime"])(Date.now());
        }
        const msDuration = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$core$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$core$2f$build$2f$esm$2f$platform$2f$node$2f$index$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$locals$3e$__["otperformance"].now() - this._performanceStartTime;
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$core$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$core$2f$build$2f$esm$2f$common$2f$time$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["addHrTimes"])(this.startTime, (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$core$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$core$2f$build$2f$esm$2f$common$2f$time$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["millisToHrTime"])(msDuration));
    }
    isRecording() {
        return this._ended === false;
    }
    recordException(exception, time) {
        const attributes = {};
        if (typeof exception === 'string') {
            attributes[__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$semantic$2d$conventions$40$1$2e$43$2e$0$2f$node_modules$2f40$opentelemetry$2f$semantic$2d$conventions$2f$build$2f$esm$2f$stable_attributes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["ATTR_EXCEPTION_MESSAGE"]] = exception;
        } else if (exception) {
            if (exception.code) {
                attributes[__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$semantic$2d$conventions$40$1$2e$43$2e$0$2f$node_modules$2f40$opentelemetry$2f$semantic$2d$conventions$2f$build$2f$esm$2f$stable_attributes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["ATTR_EXCEPTION_TYPE"]] = exception.code.toString();
            } else if (exception.name) {
                attributes[__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$semantic$2d$conventions$40$1$2e$43$2e$0$2f$node_modules$2f40$opentelemetry$2f$semantic$2d$conventions$2f$build$2f$esm$2f$stable_attributes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["ATTR_EXCEPTION_TYPE"]] = exception.name;
            }
            if (exception.message) {
                attributes[__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$semantic$2d$conventions$40$1$2e$43$2e$0$2f$node_modules$2f40$opentelemetry$2f$semantic$2d$conventions$2f$build$2f$esm$2f$stable_attributes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["ATTR_EXCEPTION_MESSAGE"]] = exception.message;
            }
            if (exception.stack) {
                attributes[__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$semantic$2d$conventions$40$1$2e$43$2e$0$2f$node_modules$2f40$opentelemetry$2f$semantic$2d$conventions$2f$build$2f$esm$2f$stable_attributes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["ATTR_EXCEPTION_STACKTRACE"]] = exception.stack;
            }
        }
        // these are minimum requirements from spec
        if (attributes[__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$semantic$2d$conventions$40$1$2e$43$2e$0$2f$node_modules$2f40$opentelemetry$2f$semantic$2d$conventions$2f$build$2f$esm$2f$stable_attributes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["ATTR_EXCEPTION_TYPE"]] || attributes[__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$semantic$2d$conventions$40$1$2e$43$2e$0$2f$node_modules$2f40$opentelemetry$2f$semantic$2d$conventions$2f$build$2f$esm$2f$stable_attributes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["ATTR_EXCEPTION_MESSAGE"]]) {
            this.addEvent(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$sdk$2d$trace$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$sdk$2d$trace$2f$build$2f$esm$2f$enums$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["ExceptionEventName"], attributes, time);
        } else {
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$diag$2d$api$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["diag"].warn(`Failed to record an exception ${exception}`);
        }
    }
    get duration() {
        return this._duration;
    }
    get ended() {
        return this._ended;
    }
    get droppedAttributesCount() {
        return this._droppedAttributesCount;
    }
    get droppedEventsCount() {
        return this._droppedEventsCount;
    }
    get droppedLinksCount() {
        return this._droppedLinksCount;
    }
    _isSpanEnded() {
        if (this._ended) {
            const error = new Error(`Operation attempted on ended Span {traceId: ${this._spanContext.traceId}, spanId: ${this._spanContext.spanId}}`);
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$diag$2d$api$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["diag"].warn(`Cannot execute the operation on ended Span {traceId: ${this._spanContext.traceId}, spanId: ${this._spanContext.spanId}}`, error);
        }
        return this._ended;
    }
    // Utility function to truncate given value within size
    // for value type of string, will truncate to given limit
    // for type of non-string, will return same value
    _truncateToLimitUtil(value, limit) {
        if (value.length <= limit) {
            return value;
        }
        return value.substring(0, limit);
    }
    /**
     * If the given attribute value is of type string and has more characters than given {@code attributeValueLengthLimit} then
     * return string with truncated to {@code attributeValueLengthLimit} characters
     *
     * If the given attribute value is array of strings then
     * return new array of strings with each element truncated to {@code attributeValueLengthLimit} characters
     *
     * Otherwise return same Attribute {@code value}
     *
     * @param value Attribute value
     * @returns truncated attribute value if required, otherwise same value
     */ _truncateToSize(value) {
        const limit = this._attributeValueLengthLimit;
        // Check limit
        if (limit <= 0) {
            // Negative values are invalid, so do not truncate
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$diag$2d$api$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["diag"].warn(`Attribute value limit must be positive, got ${limit}`);
            return value;
        }
        // String
        if (typeof value === 'string') {
            return this._truncateToLimitUtil(value, limit);
        }
        // Array of strings
        if (Array.isArray(value)) {
            return value.map((val)=>typeof val === 'string' ? this._truncateToLimitUtil(val, limit) : val);
        }
        // Other types, no need to apply value length limit
        return value;
    }
    [__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$sdk$2d$trace$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$sdk$2d$trace$2f$build$2f$esm$2f$inspect$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["inspectCustom"]](depth, options, inspect) {
        const payload = {
            name: this.name,
            kind: this.kind,
            spanContext: this._spanContext,
            parentSpanContext: this.parentSpanContext,
            status: this.status,
            startTime: this.startTime,
            endTime: this.endTime,
            duration: this._duration,
            ended: this._ended,
            attributes: this.attributes,
            events: this.events,
            links: this.links,
            droppedAttributesCount: this._droppedAttributesCount,
            droppedEventsCount: this._droppedEventsCount,
            droppedLinksCount: this._droppedLinksCount,
            instrumentationScope: this.instrumentationScope,
            resource: {
                attributes: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$sdk$2d$trace$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$sdk$2d$trace$2f$build$2f$esm$2f$inspect$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["settledResourceAttributes"])(this.resource)
            }
        };
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$sdk$2d$trace$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$sdk$2d$trace$2f$build$2f$esm$2f$inspect$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["formatInspect"])('SpanImpl', payload, depth, options, inspect);
    }
}
}),
"[project]/node_modules/.pnpm/@opentelemetry+sdk-trace@2.10.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-trace/build/esm/Tracer.js [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Tracer",
    ()=>Tracer
]);
/*
 * Copyright The OpenTelemetry Authors
 * SPDX-License-Identifier: Apache-2.0
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$context$2d$api$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@opentelemetry+api@1.9.1/node_modules/@opentelemetry/api/build/esm/context-api.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2d$api$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@opentelemetry+api@1.9.1/node_modules/@opentelemetry/api/build/esm/trace-api.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$span_kind$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@opentelemetry+api@1.9.1/node_modules/@opentelemetry/api/build/esm/trace/span_kind.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$SamplingResult$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@opentelemetry+api@1.9.1/node_modules/@opentelemetry/api/build/esm/trace/SamplingResult.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$trace_flags$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@opentelemetry+api@1.9.1/node_modules/@opentelemetry/api/build/esm/trace/trace_flags.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$diag$2d$api$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@opentelemetry+api@1.9.1/node_modules/@opentelemetry/api/build/esm/diag-api.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$invalid$2d$span$2d$constants$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@opentelemetry+api@1.9.1/node_modules/@opentelemetry/api/build/esm/trace/invalid-span-constants.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$core$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$core$2f$build$2f$esm$2f$common$2f$attributes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@opentelemetry+core@2.10.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/core/build/esm/common/attributes.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$core$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$core$2f$build$2f$esm$2f$trace$2f$suppress$2d$tracing$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@opentelemetry+core@2.10.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/core/build/esm/trace/suppress-tracing.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$sdk$2d$trace$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$sdk$2d$trace$2f$build$2f$esm$2f$Span$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@opentelemetry+sdk-trace@2.10.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-trace/build/esm/Span.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$sdk$2d$trace$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$sdk$2d$trace$2f$build$2f$esm$2f$TracerMetrics$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@opentelemetry+sdk-trace@2.10.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-trace/build/esm/TracerMetrics.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$sdk$2d$trace$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$sdk$2d$trace$2f$build$2f$esm$2f$version$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@opentelemetry+sdk-trace@2.10.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-trace/build/esm/version.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$sdk$2d$trace$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$sdk$2d$trace$2f$build$2f$esm$2f$inspect$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@opentelemetry+sdk-trace@2.10.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-trace/build/esm/inspect.js [instrumentation] (ecmascript)");
;
;
;
;
;
;
class Tracer {
    _sampler;
    _spanLimits;
    _idGenerator;
    instrumentationScope;
    _resource;
    _spanProcessor;
    _tracerMetrics;
    /**
     * Constructs a new Tracer instance.
     */ constructor(instrumentationScope, options){
        this.instrumentationScope = instrumentationScope;
        this._sampler = options.sampler;
        this._spanLimits = options.spanLimits;
        this._resource = options.resource;
        this._idGenerator = options.idGenerator;
        this._spanProcessor = options.spanProcessor;
        const meter = options.meterProvider.getMeter('@opentelemetry/sdk-trace', __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$sdk$2d$trace$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$sdk$2d$trace$2f$build$2f$esm$2f$version$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["VERSION"]);
        this._tracerMetrics = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$sdk$2d$trace$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$sdk$2d$trace$2f$build$2f$esm$2f$TracerMetrics$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["TracerMetrics"](meter);
    }
    /**
     * Starts a new Span or returns the default NoopSpan based on the sampling
     * decision.
     */ startSpan(name, options = {}, context = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$context$2d$api$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["context"].active()) {
        // remove span from context in case a root span is requested via options
        if (options.root) {
            context = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2d$api$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["trace"].deleteSpan(context);
        }
        const parentSpan = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2d$api$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["trace"].getSpan(context);
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$core$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$core$2f$build$2f$esm$2f$trace$2f$suppress$2d$tracing$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["isTracingSuppressed"])(context)) {
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$diag$2d$api$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["diag"].debug('Instrumentation suppressed, returning Noop Span');
            const nonRecordingSpan = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2d$api$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["trace"].wrapSpanContext(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$invalid$2d$span$2d$constants$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["INVALID_SPAN_CONTEXT"]);
            return nonRecordingSpan;
        }
        const parentSpanContext = parentSpan?.spanContext();
        const spanId = this._idGenerator.generateSpanId();
        let validParentSpanContext;
        let traceId;
        let traceState;
        if (!parentSpanContext || !__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2d$api$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["trace"].isSpanContextValid(parentSpanContext)) {
            // New root span.
            traceId = this._idGenerator.generateTraceId();
        } else {
            // New child span.
            traceId = parentSpanContext.traceId;
            traceState = parentSpanContext.traceState;
            validParentSpanContext = parentSpanContext;
        }
        const spanKind = options.kind ?? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$span_kind$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["SpanKind"].INTERNAL;
        const links = (options.links ?? []).map((link)=>{
            return {
                context: link.context,
                attributes: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$core$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$core$2f$build$2f$esm$2f$common$2f$attributes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sanitizeAttributes"])(link.attributes)
            };
        });
        const attributes = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$core$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$core$2f$build$2f$esm$2f$common$2f$attributes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sanitizeAttributes"])(options.attributes);
        // make sampling decision
        const samplingResult = this._sampler.shouldSample(context, traceId, name, spanKind, attributes, links);
        const recordEndMetrics = this._tracerMetrics.startSpan(parentSpanContext, samplingResult.decision);
        traceState = samplingResult.traceState ?? traceState;
        const traceFlags = samplingResult.decision === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$SamplingResult$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["SamplingDecision"].RECORD_AND_SAMPLED ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$trace_flags$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["TraceFlags"].SAMPLED : __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$trace_flags$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["TraceFlags"].NONE;
        const spanContext = {
            traceId,
            spanId,
            traceFlags,
            traceState
        };
        if (samplingResult.decision === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$SamplingResult$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["SamplingDecision"].NOT_RECORD) {
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$diag$2d$api$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["diag"].debug('Recording is off, propagating context in a non-recording span');
            const nonRecordingSpan = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2d$api$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["trace"].wrapSpanContext(spanContext);
            return nonRecordingSpan;
        }
        // Set initial span attributes. The attributes object may have been mutated
        // by the sampler, so we sanitize the merged attributes before setting them.
        const initAttributes = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$core$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$core$2f$build$2f$esm$2f$common$2f$attributes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sanitizeAttributes"])(Object.assign(attributes, samplingResult.attributes));
        const span = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$sdk$2d$trace$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$sdk$2d$trace$2f$build$2f$esm$2f$Span$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["SpanImpl"]({
            resource: this._resource,
            scope: this.instrumentationScope,
            context,
            spanContext,
            name,
            kind: spanKind,
            links,
            parentSpanContext: validParentSpanContext,
            attributes: initAttributes,
            startTime: options.startTime,
            spanProcessor: this._spanProcessor,
            spanLimits: this._spanLimits,
            recordEndMetrics
        });
        return span;
    }
    startActiveSpan(name, arg2, arg3, arg4) {
        let opts;
        let ctx;
        let fn;
        if (arguments.length < 2) {
            return;
        } else if (arguments.length === 2) {
            fn = arg2;
        } else if (arguments.length === 3) {
            opts = arg2;
            fn = arg3;
        } else {
            opts = arg2;
            ctx = arg3;
            fn = arg4;
        }
        const parentContext = ctx ?? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$context$2d$api$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["context"].active();
        const span = this.startSpan(name, opts, parentContext);
        const contextWithSpanSet = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2d$api$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["trace"].setSpan(parentContext, span);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$context$2d$api$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["context"].with(contextWithSpanSet, fn, undefined, span);
    }
    [__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$sdk$2d$trace$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$sdk$2d$trace$2f$build$2f$esm$2f$inspect$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["inspectCustom"]](depth, options, inspect) {
        const payload = {
            instrumentationScope: this.instrumentationScope,
            resource: {
                attributes: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$sdk$2d$trace$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$sdk$2d$trace$2f$build$2f$esm$2f$inspect$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["settledResourceAttributes"])(this._resource)
            },
            spanLimits: this._spanLimits
        };
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$sdk$2d$trace$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$sdk$2d$trace$2f$build$2f$esm$2f$inspect$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["formatInspect"])('Tracer', payload, depth, options, inspect);
    }
}
}),
"[project]/node_modules/.pnpm/@opentelemetry+sdk-trace@2.10.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-trace/build/esm/TracerMetrics.js [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TracerMetrics",
    ()=>TracerMetrics
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$sdk$2d$trace$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$sdk$2d$trace$2f$build$2f$esm$2f$Sampler$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@opentelemetry+sdk-trace@2.10.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-trace/build/esm/Sampler.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$sdk$2d$trace$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$sdk$2d$trace$2f$build$2f$esm$2f$semconv$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@opentelemetry+sdk-trace@2.10.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-trace/build/esm/semconv.js [instrumentation] (ecmascript)");
;
;
class TracerMetrics {
    startedSpans;
    liveSpans;
    constructor(meter){
        this.startedSpans = meter.createCounter(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$sdk$2d$trace$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$sdk$2d$trace$2f$build$2f$esm$2f$semconv$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["METRIC_OTEL_SDK_SPAN_STARTED"], {
            unit: '{span}',
            description: 'The number of created spans.'
        });
        this.liveSpans = meter.createUpDownCounter(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$sdk$2d$trace$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$sdk$2d$trace$2f$build$2f$esm$2f$semconv$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["METRIC_OTEL_SDK_SPAN_LIVE"], {
            unit: '{span}',
            description: 'The number of currently live spans.'
        });
    }
    startSpan(parentSpanCtx, samplingDecision) {
        const samplingDecisionStr = samplingDecisionToString(samplingDecision);
        this.startedSpans.add(1, {
            [__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$sdk$2d$trace$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$sdk$2d$trace$2f$build$2f$esm$2f$semconv$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["ATTR_OTEL_SPAN_PARENT_ORIGIN"]]: parentOrigin(parentSpanCtx),
            [__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$sdk$2d$trace$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$sdk$2d$trace$2f$build$2f$esm$2f$semconv$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["ATTR_OTEL_SPAN_SAMPLING_RESULT"]]: samplingDecisionStr
        });
        if (samplingDecision === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$sdk$2d$trace$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$sdk$2d$trace$2f$build$2f$esm$2f$Sampler$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["SamplingDecision"].NOT_RECORD) {
            return ()=>{};
        }
        const liveSpanAttributes = {
            [__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$sdk$2d$trace$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$sdk$2d$trace$2f$build$2f$esm$2f$semconv$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["ATTR_OTEL_SPAN_SAMPLING_RESULT"]]: samplingDecisionStr
        };
        this.liveSpans.add(1, liveSpanAttributes);
        return ()=>{
            this.liveSpans.add(-1, liveSpanAttributes);
        };
    }
}
function parentOrigin(parentSpanContext) {
    if (!parentSpanContext) {
        return 'none';
    }
    if (parentSpanContext.isRemote) {
        return 'remote';
    }
    return 'local';
}
function samplingDecisionToString(decision) {
    switch(decision){
        case __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$sdk$2d$trace$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$sdk$2d$trace$2f$build$2f$esm$2f$Sampler$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["SamplingDecision"].RECORD_AND_SAMPLED:
            return 'RECORD_AND_SAMPLE';
        case __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$sdk$2d$trace$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$sdk$2d$trace$2f$build$2f$esm$2f$Sampler$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["SamplingDecision"].RECORD:
            return 'RECORD_ONLY';
        case __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$sdk$2d$trace$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$sdk$2d$trace$2f$build$2f$esm$2f$Sampler$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["SamplingDecision"].NOT_RECORD:
            return 'DROP';
    }
}
}),
"[project]/node_modules/.pnpm/@opentelemetry+sdk-trace@2.10.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-trace/build/esm/TracerProvider.js [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TracerProvider",
    ()=>TracerProvider
]);
/*
 * Copyright The OpenTelemetry Authors
 * SPDX-License-Identifier: Apache-2.0
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$metrics$2f$NoopMeter$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@opentelemetry+api@1.9.1/node_modules/@opentelemetry/api/build/esm/metrics/NoopMeter.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$resources$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$resources$2f$build$2f$esm$2f$ResourceImpl$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@opentelemetry+resources@2.10.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/resources/build/esm/ResourceImpl.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$sdk$2d$trace$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$sdk$2d$trace$2f$build$2f$esm$2f$Tracer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@opentelemetry+sdk-trace@2.10.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-trace/build/esm/Tracer.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$sdk$2d$trace$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$sdk$2d$trace$2f$build$2f$esm$2f$MultiSpanProcessor$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@opentelemetry+sdk-trace@2.10.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-trace/build/esm/MultiSpanProcessor.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$sdk$2d$trace$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$sdk$2d$trace$2f$build$2f$esm$2f$sampler$2f$ParentBasedSampler$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@opentelemetry+sdk-trace@2.10.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-trace/build/esm/sampler/ParentBasedSampler.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$sdk$2d$trace$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$sdk$2d$trace$2f$build$2f$esm$2f$sampler$2f$AlwaysOnSampler$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@opentelemetry+sdk-trace@2.10.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-trace/build/esm/sampler/AlwaysOnSampler.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$sdk$2d$trace$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$sdk$2d$trace$2f$build$2f$esm$2f$platform$2f$node$2f$RandomIdGenerator$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@opentelemetry+sdk-trace@2.10.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-trace/build/esm/platform/node/RandomIdGenerator.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$sdk$2d$trace$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$sdk$2d$trace$2f$build$2f$esm$2f$inspect$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@opentelemetry+sdk-trace@2.10.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-trace/build/esm/inspect.js [instrumentation] (ecmascript)");
;
;
;
;
;
;
;
;
var ForceFlushState;
(function(ForceFlushState) {
    ForceFlushState[ForceFlushState["resolved"] = 0] = "resolved";
    ForceFlushState[ForceFlushState["timeout"] = 1] = "timeout";
    ForceFlushState[ForceFlushState["error"] = 2] = "error";
    ForceFlushState[ForceFlushState["unresolved"] = 3] = "unresolved";
})(ForceFlushState || (ForceFlushState = {}));
class TracerProvider {
    _resource;
    _activeSpanProcessor;
    _forceFlushTimeoutMillis;
    _tracerOptions;
    _tracers = new Map();
    constructor(options = {}){
        this._forceFlushTimeoutMillis = options.forceFlushTimeoutMillis ?? 30000;
        this._resource = options.resource ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$resources$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$resources$2f$build$2f$esm$2f$ResourceImpl$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["defaultResource"])();
        const spanProcessors = options.spanProcessors ?? [];
        this._activeSpanProcessor = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$sdk$2d$trace$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$sdk$2d$trace$2f$build$2f$esm$2f$MultiSpanProcessor$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["MultiSpanProcessor"](spanProcessors);
        this._tracerOptions = {
            resource: this._resource,
            sampler: options.sampler ?? new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$sdk$2d$trace$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$sdk$2d$trace$2f$build$2f$esm$2f$sampler$2f$ParentBasedSampler$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["ParentBasedSampler"]({
                root: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$sdk$2d$trace$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$sdk$2d$trace$2f$build$2f$esm$2f$sampler$2f$AlwaysOnSampler$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["AlwaysOnSampler"]()
            }),
            spanLimits: {
                attributeCountLimit: options.spanLimits?.attributeCountLimit ?? 128,
                attributeValueLengthLimit: options.spanLimits?.attributeValueLengthLimit ?? Infinity,
                eventCountLimit: options.spanLimits?.eventCountLimit ?? 128,
                linkCountLimit: options.spanLimits?.linkCountLimit ?? 128,
                attributePerEventCountLimit: options.spanLimits?.attributePerEventCountLimit ?? 128,
                attributePerLinkCountLimit: options.spanLimits?.attributePerLinkCountLimit ?? 128
            },
            idGenerator: options.idGenerator || new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$sdk$2d$trace$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$sdk$2d$trace$2f$build$2f$esm$2f$platform$2f$node$2f$RandomIdGenerator$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["RandomIdGenerator"](),
            spanProcessor: this._activeSpanProcessor,
            meterProvider: options.meterProvider ?? {
                getMeter () {
                    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$metrics$2f$NoopMeter$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["createNoopMeter"])();
                }
            }
        };
    }
    getTracer(name, version, options) {
        const key = `${name}@${version || ''}:${options?.schemaUrl || ''}`;
        if (!this._tracers.has(key)) {
            this._tracers.set(key, new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$sdk$2d$trace$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$sdk$2d$trace$2f$build$2f$esm$2f$Tracer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["Tracer"]({
                name,
                version,
                schemaUrl: options?.schemaUrl
            }, this._tracerOptions));
        }
        return this._tracers.get(key);
    }
    forceFlush() {
        const timeout = this._forceFlushTimeoutMillis;
        const promises = this._activeSpanProcessor['_spanProcessors'].map((spanProcessor)=>{
            return new Promise((resolve)=>{
                let state;
                const timeoutInterval = setTimeout(()=>{
                    resolve(new Error(`Span processor did not completed within timeout period of ${timeout} ms`));
                    state = ForceFlushState.timeout;
                }, timeout);
                spanProcessor.forceFlush().then(()=>{
                    clearTimeout(timeoutInterval);
                    if (state !== ForceFlushState.timeout) {
                        state = ForceFlushState.resolved;
                        resolve(state);
                    }
                }).catch((error)=>{
                    clearTimeout(timeoutInterval);
                    state = ForceFlushState.error;
                    resolve(error);
                });
            });
        });
        return new Promise((resolve, reject)=>{
            Promise.all(promises).then((results)=>{
                const errors = results.filter((result)=>result !== ForceFlushState.resolved);
                if (errors.length > 0) {
                    reject(errors);
                } else {
                    resolve();
                }
            }).catch((error)=>reject([
                    error
                ]));
        });
    }
    shutdown() {
        return this._activeSpanProcessor.shutdown();
    }
    [__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$sdk$2d$trace$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$sdk$2d$trace$2f$build$2f$esm$2f$inspect$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["inspectCustom"]](depth, options, inspect) {
        const processors = this._activeSpanProcessor['_spanProcessors'];
        const payload = {
            resource: {
                attributes: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$sdk$2d$trace$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$sdk$2d$trace$2f$build$2f$esm$2f$inspect$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["settledResourceAttributes"])(this._resource)
            },
            tracers: Array.from(this._tracers.keys()),
            spanProcessors: processors.map((p)=>p.constructor?.name ?? 'SpanProcessor')
        };
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$sdk$2d$trace$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$sdk$2d$trace$2f$build$2f$esm$2f$inspect$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["formatInspect"])('TracerProvider', payload, depth, options, inspect);
    }
}
}),
"[project]/node_modules/.pnpm/@opentelemetry+sdk-trace@2.10.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-trace/build/esm/enums.js [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/*
 * Copyright The OpenTelemetry Authors
 * SPDX-License-Identifier: Apache-2.0
 */ // Event name definitions
__turbopack_context__.s([
    "ExceptionEventName",
    ()=>ExceptionEventName
]);
const ExceptionEventName = 'exception';
}),
"[project]/node_modules/.pnpm/@opentelemetry+sdk-trace@2.10.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-trace/build/esm/export/BatchSpanProcessorBase.js [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BatchSpanProcessorBase",
    ()=>BatchSpanProcessorBase
]);
/*
 * Copyright The OpenTelemetry Authors
 * SPDX-License-Identifier: Apache-2.0
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$context$2d$api$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@opentelemetry+api@1.9.1/node_modules/@opentelemetry/api/build/esm/context-api.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$metrics$2f$NoopMeter$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@opentelemetry+api@1.9.1/node_modules/@opentelemetry/api/build/esm/metrics/NoopMeter.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$diag$2d$api$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@opentelemetry+api@1.9.1/node_modules/@opentelemetry/api/build/esm/diag-api.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$trace_flags$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@opentelemetry+api@1.9.1/node_modules/@opentelemetry/api/build/esm/trace/trace_flags.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$core$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$core$2f$build$2f$esm$2f$utils$2f$callback$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@opentelemetry+core@2.10.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/core/build/esm/utils/callback.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$core$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$core$2f$build$2f$esm$2f$ExportResult$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@opentelemetry+core@2.10.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/core/build/esm/ExportResult.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$core$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$core$2f$build$2f$esm$2f$common$2f$global$2d$error$2d$handler$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@opentelemetry+core@2.10.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/core/build/esm/common/global-error-handler.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$core$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$core$2f$build$2f$esm$2f$trace$2f$suppress$2d$tracing$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@opentelemetry+core@2.10.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/core/build/esm/trace/suppress-tracing.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$sdk$2d$trace$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$sdk$2d$trace$2f$build$2f$esm$2f$export$2f$SpanProcessorMetrics$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@opentelemetry+sdk-trace@2.10.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-trace/build/esm/export/SpanProcessorMetrics.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$sdk$2d$trace$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$sdk$2d$trace$2f$build$2f$esm$2f$semconv$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@opentelemetry+sdk-trace@2.10.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-trace/build/esm/semconv.js [instrumentation] (ecmascript)");
;
;
;
;
class BatchSpanProcessorBase {
    _maxExportBatchSize;
    _maxQueueSize;
    _scheduledDelayMillis;
    _exportTimeoutMillis;
    _exporter;
    _metrics;
    _isExporting = false;
    _finishedSpans = [];
    _timer;
    _shutdownOnce;
    _droppedSpansCount = 0;
    constructor(options){
        this._exporter = options.exporter;
        this._maxExportBatchSize = options.maxExportBatchSize ?? 512;
        this._maxQueueSize = options.maxQueueSize ?? 2048;
        this._scheduledDelayMillis = options.scheduledDelayMillis ?? 5000;
        this._exportTimeoutMillis = options.exportTimeoutMillis ?? 30000;
        this._shutdownOnce = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$core$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$core$2f$build$2f$esm$2f$utils$2f$callback$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["BindOnceFuture"](this._shutdown, this);
        if (this._maxExportBatchSize > this._maxQueueSize) {
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$diag$2d$api$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["diag"].warn('BatchSpanProcessor: maxExportBatchSize must be smaller or equal to maxQueueSize, setting maxExportBatchSize to match maxQueueSize');
            this._maxExportBatchSize = this._maxQueueSize;
        }
        const meter = options.selfObsMeterProvider ? options.selfObsMeterProvider.getMeter('@opentelemetry/sdk-trace') : (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$metrics$2f$NoopMeter$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["createNoopMeter"])();
        this._metrics = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$sdk$2d$trace$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$sdk$2d$trace$2f$build$2f$esm$2f$export$2f$SpanProcessorMetrics$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["SpanProcessorMetrics"](__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$sdk$2d$trace$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$sdk$2d$trace$2f$build$2f$esm$2f$semconv$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["OTEL_COMPONENT_TYPE_VALUE_BATCHING_SPAN_PROCESSOR"], meter, {
            capacity: this._maxQueueSize,
            getQueueSize: ()=>this._finishedSpans.length
        });
    }
    forceFlush() {
        if (this._shutdownOnce.isCalled) {
            return this._shutdownOnce.promise;
        }
        return this._flushAll();
    }
    // does nothing.
    onStart(_span, _parentContext) {}
    onEnd(span) {
        if (this._shutdownOnce.isCalled) {
            return;
        }
        if ((span.spanContext().traceFlags & __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$trace_flags$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["TraceFlags"].SAMPLED) === 0) {
            return;
        }
        this._addToBuffer(span);
    }
    shutdown() {
        return this._shutdownOnce.call();
    }
    _shutdown() {
        return Promise.resolve().then(()=>{
            return this.onShutdown();
        }).then(()=>{
            return this._flushAll();
        }).then(()=>{
            this._metrics.shutdown();
            return this._exporter.shutdown();
        });
    }
    /** Add a span in the buffer. */ _addToBuffer(span) {
        if (this._finishedSpans.length >= this._maxQueueSize) {
            // limit reached, drop span
            if (this._droppedSpansCount === 0) {
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$diag$2d$api$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["diag"].debug('maxQueueSize reached, dropping spans');
            }
            this._droppedSpansCount++;
            this._metrics.dropSpans(1);
            return;
        }
        if (this._droppedSpansCount > 0) {
            // some spans were dropped, log once with count of spans dropped
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$diag$2d$api$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["diag"].warn(`Dropped ${this._droppedSpansCount} spans because maxQueueSize reached`);
            this._droppedSpansCount = 0;
        }
        this._finishedSpans.push(span);
        this._maybeStartTimer();
    }
    /**
     * Send all spans to the exporter respecting the batch size limit
     * This function is used only on forceFlush or shutdown,
     * for all other cases _flush should be used
     * */ _flushAll() {
        return new Promise((resolve, reject)=>{
            const promises = [];
            // calculate number of batches
            const count = Math.ceil(this._finishedSpans.length / this._maxExportBatchSize);
            for(let i = 0, j = count; i < j; i++){
                promises.push(this._flushOneBatch());
            }
            Promise.all(promises).then(()=>{
                resolve();
            }).catch(reject);
        });
    }
    _flushOneBatch() {
        this._clearTimer();
        if (this._finishedSpans.length === 0) {
            return Promise.resolve();
        }
        return new Promise((resolve, reject)=>{
            const timer = setTimeout(()=>{
                // don't wait anymore for export, this way the next batch can start
                reject(new Error('Timeout'));
            }, this._exportTimeoutMillis);
            // prevent downstream exporter calls from generating spans
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$context$2d$api$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["context"].with((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$core$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$core$2f$build$2f$esm$2f$trace$2f$suppress$2d$tracing$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["suppressTracing"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$context$2d$api$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["context"].active()), ()=>{
                // Reset the finished spans buffer here because the next invocations of the _flush method
                // could pass the same finished spans to the exporter if the buffer is cleared
                // outside the execution of this callback.
                let spans;
                if (this._finishedSpans.length <= this._maxExportBatchSize) {
                    spans = this._finishedSpans;
                    this._finishedSpans = [];
                } else {
                    spans = this._finishedSpans.splice(0, this._maxExportBatchSize);
                }
                const doExport = ()=>this._exporter.export(spans, (result)=>{
                        clearTimeout(timer);
                        this._metrics.finishSpans(spans.length, result.error);
                        if (result.code === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$core$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$core$2f$build$2f$esm$2f$ExportResult$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["ExportResultCode"].SUCCESS) {
                            resolve();
                        } else {
                            reject(result.error ?? new Error('BatchSpanProcessor: span export failed'));
                        }
                    });
                let pendingResources = null;
                for(let i = 0, len = spans.length; i < len; i++){
                    const span = spans[i];
                    if (span.resource.asyncAttributesPending && span.resource.waitForAsyncAttributes) {
                        pendingResources ??= [];
                        pendingResources.push(span.resource.waitForAsyncAttributes());
                    }
                }
                // Avoid scheduling a promise to make the behavior more predictable and easier to test
                if (pendingResources === null) {
                    doExport();
                } else {
                    Promise.all(pendingResources).then(doExport, (err)=>{
                        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$core$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$core$2f$build$2f$esm$2f$common$2f$global$2d$error$2d$handler$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["globalErrorHandler"])(err);
                        reject(err);
                    });
                }
            });
        });
    }
    _maybeStartTimer() {
        if (this._isExporting) return;
        const flush = ()=>{
            this._isExporting = true;
            this._flushOneBatch().finally(()=>{
                this._isExporting = false;
                if (this._finishedSpans.length > 0) {
                    this._clearTimer();
                    this._maybeStartTimer();
                }
            }).catch((e)=>{
                this._isExporting = false;
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$core$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$core$2f$build$2f$esm$2f$common$2f$global$2d$error$2d$handler$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["globalErrorHandler"])(e);
            });
        };
        // we only wait if the queue doesn't have enough elements yet
        if (this._finishedSpans.length >= this._maxExportBatchSize) {
            return flush();
        }
        if (this._timer !== undefined) return;
        this._timer = setTimeout(()=>flush(), this._scheduledDelayMillis);
        // depending on runtime, this may be a 'number' or NodeJS.Timeout
        if (typeof this._timer !== 'number') {
            this._timer.unref();
        }
    }
    _clearTimer() {
        if (this._timer !== undefined) {
            clearTimeout(this._timer);
            this._timer = undefined;
        }
    }
}
}),
"[project]/node_modules/.pnpm/@opentelemetry+sdk-trace@2.10.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-trace/build/esm/export/ConsoleSpanExporter.js [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ConsoleSpanExporter",
    ()=>ConsoleSpanExporter
]);
/*
 * Copyright The OpenTelemetry Authors
 * SPDX-License-Identifier: Apache-2.0
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$core$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$core$2f$build$2f$esm$2f$ExportResult$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@opentelemetry+core@2.10.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/core/build/esm/ExportResult.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$core$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$core$2f$build$2f$esm$2f$common$2f$time$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@opentelemetry+core@2.10.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/core/build/esm/common/time.js [instrumentation] (ecmascript)");
;
class ConsoleSpanExporter {
    /**
     * Export spans.
     * @param spans
     * @param resultCallback
     */ export(spans, resultCallback) {
        return this._sendSpans(spans, resultCallback);
    }
    /**
     * Shutdown the exporter.
     */ shutdown() {
        this._sendSpans([]);
        return this.forceFlush();
    }
    /**
     * Exports any pending spans in exporter
     */ forceFlush() {
        return Promise.resolve();
    }
    /**
     * converts span info into more readable format
     * @param span
     */ _exportInfo(span) {
        return {
            resource: {
                attributes: span.resource.attributes
            },
            instrumentationScope: span.instrumentationScope,
            traceId: span.spanContext().traceId,
            parentSpanContext: span.parentSpanContext,
            traceState: span.spanContext().traceState?.serialize(),
            name: span.name,
            id: span.spanContext().spanId,
            kind: span.kind,
            timestamp: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$core$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$core$2f$build$2f$esm$2f$common$2f$time$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["hrTimeToMicroseconds"])(span.startTime),
            duration: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$core$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$core$2f$build$2f$esm$2f$common$2f$time$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["hrTimeToMicroseconds"])(span.duration),
            attributes: span.attributes,
            status: span.status,
            events: span.events,
            links: span.links
        };
    }
    /**
     * Showing spans in console
     * @param spans
     * @param done
     */ _sendSpans(spans, done) {
        for (const span of spans){
            console.dir(this._exportInfo(span), {
                depth: 3
            });
        }
        if (done) {
            return done({
                code: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$core$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$core$2f$build$2f$esm$2f$ExportResult$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["ExportResultCode"].SUCCESS
            });
        }
    }
}
}),
"[project]/node_modules/.pnpm/@opentelemetry+sdk-trace@2.10.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-trace/build/esm/export/InMemorySpanExporter.js [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "InMemorySpanExporter",
    ()=>InMemorySpanExporter
]);
/*
 * Copyright The OpenTelemetry Authors
 * SPDX-License-Identifier: Apache-2.0
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$core$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$core$2f$build$2f$esm$2f$ExportResult$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@opentelemetry+core@2.10.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/core/build/esm/ExportResult.js [instrumentation] (ecmascript)");
;
class InMemorySpanExporter {
    _finishedSpans = [];
    /**
     * Indicates if the exporter has been "shutdown."
     * When false, exported spans will not be stored in-memory.
     */ _stopped = false;
    export(spans, resultCallback) {
        if (this._stopped) return resultCallback({
            code: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$core$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$core$2f$build$2f$esm$2f$ExportResult$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["ExportResultCode"].FAILED,
            error: new Error('Exporter has been stopped')
        });
        this._finishedSpans.push(...spans);
        setTimeout(()=>resultCallback({
                code: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$core$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$core$2f$build$2f$esm$2f$ExportResult$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["ExportResultCode"].SUCCESS
            }), 0);
    }
    shutdown() {
        this._stopped = true;
        this._finishedSpans = [];
        return this.forceFlush();
    }
    /**
     * Exports any pending spans in the exporter
     */ forceFlush() {
        return Promise.resolve();
    }
    reset() {
        this._finishedSpans = [];
    }
    getFinishedSpans() {
        return this._finishedSpans;
    }
}
}),
"[project]/node_modules/.pnpm/@opentelemetry+sdk-trace@2.10.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-trace/build/esm/export/NoopSpanProcessor.js [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/*
 * Copyright The OpenTelemetry Authors
 * SPDX-License-Identifier: Apache-2.0
 */ /** No-op implementation of SpanProcessor */ __turbopack_context__.s([
    "NoopSpanProcessor",
    ()=>NoopSpanProcessor
]);
class NoopSpanProcessor {
    onStart(_span, _context) {}
    onEnd(_span) {}
    shutdown() {
        return Promise.resolve();
    }
    forceFlush() {
        return Promise.resolve();
    }
}
}),
"[project]/node_modules/.pnpm/@opentelemetry+sdk-trace@2.10.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-trace/build/esm/export/SimpleSpanProcessor.js [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SimpleSpanProcessor",
    ()=>SimpleSpanProcessor
]);
/*
 * Copyright The OpenTelemetry Authors
 * SPDX-License-Identifier: Apache-2.0
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$metrics$2f$NoopMeter$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@opentelemetry+api@1.9.1/node_modules/@opentelemetry/api/build/esm/metrics/NoopMeter.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$trace_flags$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@opentelemetry+api@1.9.1/node_modules/@opentelemetry/api/build/esm/trace/trace_flags.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$core$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$core$2f$build$2f$esm$2f$index$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@opentelemetry+core@2.10.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/core/build/esm/index.js [instrumentation] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$core$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$core$2f$build$2f$esm$2f$ExportResult$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@opentelemetry+core@2.10.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/core/build/esm/ExportResult.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$core$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$core$2f$build$2f$esm$2f$common$2f$global$2d$error$2d$handler$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@opentelemetry+core@2.10.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/core/build/esm/common/global-error-handler.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$core$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$core$2f$build$2f$esm$2f$utils$2f$callback$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@opentelemetry+core@2.10.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/core/build/esm/utils/callback.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$sdk$2d$trace$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$sdk$2d$trace$2f$build$2f$esm$2f$export$2f$SpanProcessorMetrics$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@opentelemetry+sdk-trace@2.10.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-trace/build/esm/export/SpanProcessorMetrics.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$sdk$2d$trace$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$sdk$2d$trace$2f$build$2f$esm$2f$semconv$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@opentelemetry+sdk-trace@2.10.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-trace/build/esm/semconv.js [instrumentation] (ecmascript)");
;
;
;
;
class SimpleSpanProcessor {
    _exporter;
    _metrics;
    _shutdownOnce;
    _pendingExports;
    constructor(options){
        this._exporter = options.exporter;
        this._shutdownOnce = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$core$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$core$2f$build$2f$esm$2f$utils$2f$callback$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["BindOnceFuture"](this._shutdown, this);
        this._pendingExports = new Set();
        const meter = options.selfObsMeterProvider ? options.selfObsMeterProvider.getMeter('@opentelemetry/sdk-trace') : (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$metrics$2f$NoopMeter$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["createNoopMeter"])();
        this._metrics = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$sdk$2d$trace$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$sdk$2d$trace$2f$build$2f$esm$2f$export$2f$SpanProcessorMetrics$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["SpanProcessorMetrics"](__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$sdk$2d$trace$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$sdk$2d$trace$2f$build$2f$esm$2f$semconv$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["OTEL_COMPONENT_TYPE_VALUE_SIMPLE_SPAN_PROCESSOR"], meter);
    }
    async forceFlush() {
        let pendingExportError;
        let pendingExportRejected = false;
        try {
            await Promise.all(Array.from(this._pendingExports));
        } catch (err) {
            pendingExportError = err;
            pendingExportRejected = true;
        }
        if (this._exporter.forceFlush) {
            await this._exporter.forceFlush();
        }
        if (pendingExportRejected) {
            throw pendingExportError;
        }
    }
    onStart(_span, _parentContext) {}
    onEnd(span) {
        if (this._shutdownOnce.isCalled) {
            return;
        }
        if ((span.spanContext().traceFlags & __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$trace_flags$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["TraceFlags"].SAMPLED) === 0) {
            return;
        }
        const pendingExport = this._doExport(span);
        // Enqueue this export to the pending list so it can be flushed by the user.
        this._pendingExports.add(pendingExport);
        void pendingExport.then(()=>{
            this._pendingExports.delete(pendingExport);
        }, (err)=>{
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$core$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$core$2f$build$2f$esm$2f$common$2f$global$2d$error$2d$handler$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["globalErrorHandler"])(err);
            this._pendingExports.delete(pendingExport);
        });
    }
    async _doExport(span) {
        if (span.resource.asyncAttributesPending) {
            // Ensure resource is fully resolved before exporting.
            await span.resource.waitForAsyncAttributes?.();
        }
        const result = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$core$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$core$2f$build$2f$esm$2f$index$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$locals$3e$__["internal"]._export(this._exporter, [
            span
        ]);
        this._metrics.finishSpans(1, result.error);
        if (result.code !== __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$core$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$core$2f$build$2f$esm$2f$ExportResult$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["ExportResultCode"].SUCCESS) {
            throw result.error ?? new Error(`SimpleSpanProcessor: span export failed (status ${result})`);
        }
    }
    shutdown() {
        return this._shutdownOnce.call();
    }
    _shutdown() {
        this._metrics.shutdown();
        return this._exporter.shutdown();
    }
}
}),
"[project]/node_modules/.pnpm/@opentelemetry+sdk-trace@2.10.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-trace/build/esm/export/SpanProcessorMetrics.js [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SpanProcessorMetrics",
    ()=>SpanProcessorMetrics
]);
/*
 * Copyright The OpenTelemetry Authors
 * SPDX-License-Identifier: Apache-2.0
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$semantic$2d$conventions$40$1$2e$43$2e$0$2f$node_modules$2f40$opentelemetry$2f$semantic$2d$conventions$2f$build$2f$esm$2f$stable_attributes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@opentelemetry+semantic-conventions@1.43.0/node_modules/@opentelemetry/semantic-conventions/build/esm/stable_attributes.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$sdk$2d$trace$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$sdk$2d$trace$2f$build$2f$esm$2f$semconv$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@opentelemetry+sdk-trace@2.10.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-trace/build/esm/semconv.js [instrumentation] (ecmascript)");
;
;
const componentCounter = new Map();
class SpanProcessorMetrics {
    processedSpans;
    queueSize;
    queueSizeCallback;
    standardAttrs;
    droppedAttrs;
    constructor(componentType, meter, queueConfig){
        const counter = componentCounter.get(componentType) ?? 0;
        componentCounter.set(componentType, counter + 1);
        this.standardAttrs = {
            [__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$sdk$2d$trace$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$sdk$2d$trace$2f$build$2f$esm$2f$semconv$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["ATTR_OTEL_COMPONENT_TYPE"]]: componentType,
            [__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$sdk$2d$trace$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$sdk$2d$trace$2f$build$2f$esm$2f$semconv$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["ATTR_OTEL_COMPONENT_NAME"]]: `${componentType}/${counter}`
        };
        this.droppedAttrs = {
            ...this.standardAttrs,
            [__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$semantic$2d$conventions$40$1$2e$43$2e$0$2f$node_modules$2f40$opentelemetry$2f$semantic$2d$conventions$2f$build$2f$esm$2f$stable_attributes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["ATTR_ERROR_TYPE"]]: 'queue_full'
        };
        this.processedSpans = meter.createCounter(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$sdk$2d$trace$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$sdk$2d$trace$2f$build$2f$esm$2f$semconv$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["METRIC_OTEL_SDK_PROCESSOR_SPAN_PROCESSED"], {
            unit: '{span}',
            description: 'The number of spans for which the processing has finished, either successful or failed.'
        });
        if (queueConfig) {
            const { capacity, getQueueSize } = queueConfig;
            const queueCapacity = meter.createUpDownCounter(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$sdk$2d$trace$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$sdk$2d$trace$2f$build$2f$esm$2f$semconv$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["METRIC_OTEL_SDK_PROCESSOR_SPAN_QUEUE_CAPACITY"], {
                unit: '{span}',
                description: 'The maximum number of spans the queue of a given instance of an SDK span processor can hold.'
            });
            queueCapacity.add(capacity, this.standardAttrs);
            this.queueSize = meter.createObservableUpDownCounter(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$sdk$2d$trace$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$sdk$2d$trace$2f$build$2f$esm$2f$semconv$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["METRIC_OTEL_SDK_PROCESSOR_SPAN_QUEUE_SIZE"], {
                unit: '{span}',
                description: 'The number of spans in the queue of a given instance of an SDK span processor.'
            });
            this.queueSizeCallback = (result)=>result.observe(getQueueSize(), this.standardAttrs);
            this.queueSize.addCallback(this.queueSizeCallback);
        }
    }
    dropSpans(count) {
        this.processedSpans.add(count, this.droppedAttrs);
    }
    finishSpans(count, error) {
        if (!error) {
            this.processedSpans.add(count, this.standardAttrs);
            return;
        }
        const attrs = {
            ...this.standardAttrs,
            [__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$semantic$2d$conventions$40$1$2e$43$2e$0$2f$node_modules$2f40$opentelemetry$2f$semantic$2d$conventions$2f$build$2f$esm$2f$stable_attributes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["ATTR_ERROR_TYPE"]]: error.name
        };
        this.processedSpans.add(count, attrs);
    }
    shutdown() {
        if (this.queueSize && this.queueSizeCallback) {
            this.queueSize.removeCallback(this.queueSizeCallback);
        }
    }
}
}),
"[project]/node_modules/.pnpm/@opentelemetry+sdk-trace@2.10.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-trace/build/esm/inspect.js [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/*
 * Copyright The OpenTelemetry Authors
 * SPDX-License-Identifier: Apache-2.0
 */ /**
 * Well-known symbol used by Node.js `util.inspect` (and `console.*`) to
 * render an object via a custom representation. Defined as a global Symbol
 * so it works without importing from `node:util`, keeping this module safe
 * for browser builds (where the symbol is simply never looked up).
 */ __turbopack_context__.s([
    "formatInspect",
    ()=>formatInspect,
    "inspectCustom",
    ()=>inspectCustom,
    "settledResourceAttributes",
    ()=>settledResourceAttributes
]);
const inspectCustom = Symbol.for('nodejs.util.inspect.custom');
function settledResourceAttributes(resource) {
    const attrs = {};
    for (const [k, v] of resource.getRawAttributes()){
        if (typeof v?.then === 'function') {
            continue;
        }
        if (v != null) {
            attrs[k] ??= v;
        }
    }
    return attrs;
}
function formatInspect(className, payload, depth, options, inspect) {
    if (typeof depth === 'number' && depth < 0) {
        const tag = `[${className}]`;
        return options?.stylize ? options.stylize(tag, 'special') : tag;
    }
    if (typeof inspect !== 'function' || !options) {
        return payload;
    }
    const childOptions = {
        ...options,
        depth: options.depth == null ? options.depth : options.depth - 1
    };
    return `${className} ${inspect(payload, childOptions)}`;
}
}),
"[project]/node_modules/.pnpm/@opentelemetry+sdk-trace@2.10.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-trace/build/esm/platform/node/RandomIdGenerator.js [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "RandomIdGenerator",
    ()=>RandomIdGenerator
]);
/*
 * Copyright The OpenTelemetry Authors
 * SPDX-License-Identifier: Apache-2.0
 */ const SPAN_ID_BYTES = 8;
const TRACE_ID_BYTES = 16;
class RandomIdGenerator {
    /**
     * Returns a random 16-byte trace ID formatted/encoded as a 32 lowercase hex
     * characters corresponding to 128 bits.
     */ generateTraceId = getIdGenerator(TRACE_ID_BYTES);
    /**
     * Returns a random 8-byte span ID formatted/encoded as a 16 lowercase hex
     * characters corresponding to 64 bits.
     */ generateSpanId = getIdGenerator(SPAN_ID_BYTES);
}
const SHARED_BUFFER = Buffer.allocUnsafe(TRACE_ID_BYTES);
function getIdGenerator(bytes) {
    return function generateId() {
        for(let i = 0; i < bytes / 4; i++){
            // unsigned right shift drops decimal part of the number
            // it is required because if a number between 2**32 and 2**32 - 1 is generated, an out of range error is thrown by writeUInt32BE
            SHARED_BUFFER.writeUInt32BE(Math.random() * 2 ** 32 >>> 0, i * 4);
        }
        // If buffer is all 0, set the last byte to 1 to guarantee a valid w3c id is generated
        for(let i = 0; i < bytes; i++){
            if (SHARED_BUFFER[i] > 0) {
                break;
            } else if (i === bytes - 1) {
                SHARED_BUFFER[bytes - 1] = 1;
            }
        }
        return SHARED_BUFFER.toString('hex', 0, bytes);
    };
}
}),
"[project]/node_modules/.pnpm/@opentelemetry+sdk-trace@2.10.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-trace/build/esm/platform/node/export/BatchSpanProcessor.js [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BatchSpanProcessor",
    ()=>BatchSpanProcessor
]);
/*
 * Copyright The OpenTelemetry Authors
 * SPDX-License-Identifier: Apache-2.0
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$sdk$2d$trace$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$sdk$2d$trace$2f$build$2f$esm$2f$export$2f$BatchSpanProcessorBase$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@opentelemetry+sdk-trace@2.10.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-trace/build/esm/export/BatchSpanProcessorBase.js [instrumentation] (ecmascript)");
;
class BatchSpanProcessor extends __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$sdk$2d$trace$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$sdk$2d$trace$2f$build$2f$esm$2f$export$2f$BatchSpanProcessorBase$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["BatchSpanProcessorBase"] {
    onShutdown() {}
}
}),
"[project]/node_modules/.pnpm/@opentelemetry+sdk-trace@2.10.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-trace/build/esm/sampler/AlwaysOffSampler.js [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AlwaysOffSampler",
    ()=>AlwaysOffSampler
]);
/*
 * Copyright The OpenTelemetry Authors
 * SPDX-License-Identifier: Apache-2.0
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$sdk$2d$trace$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$sdk$2d$trace$2f$build$2f$esm$2f$Sampler$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@opentelemetry+sdk-trace@2.10.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-trace/build/esm/Sampler.js [instrumentation] (ecmascript)");
;
class AlwaysOffSampler {
    shouldSample() {
        return {
            decision: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$sdk$2d$trace$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$sdk$2d$trace$2f$build$2f$esm$2f$Sampler$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["SamplingDecision"].NOT_RECORD
        };
    }
    toString() {
        return 'AlwaysOffSampler';
    }
}
}),
"[project]/node_modules/.pnpm/@opentelemetry+sdk-trace@2.10.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-trace/build/esm/sampler/AlwaysOnSampler.js [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AlwaysOnSampler",
    ()=>AlwaysOnSampler
]);
/*
 * Copyright The OpenTelemetry Authors
 * SPDX-License-Identifier: Apache-2.0
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$sdk$2d$trace$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$sdk$2d$trace$2f$build$2f$esm$2f$Sampler$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@opentelemetry+sdk-trace@2.10.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-trace/build/esm/Sampler.js [instrumentation] (ecmascript)");
;
class AlwaysOnSampler {
    shouldSample() {
        return {
            decision: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$sdk$2d$trace$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$sdk$2d$trace$2f$build$2f$esm$2f$Sampler$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["SamplingDecision"].RECORD_AND_SAMPLED
        };
    }
    toString() {
        return 'AlwaysOnSampler';
    }
}
}),
"[project]/node_modules/.pnpm/@opentelemetry+sdk-trace@2.10.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-trace/build/esm/sampler/ParentBasedSampler.js [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ParentBasedSampler",
    ()=>ParentBasedSampler
]);
/*
 * Copyright The OpenTelemetry Authors
 * SPDX-License-Identifier: Apache-2.0
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$spancontext$2d$utils$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@opentelemetry+api@1.9.1/node_modules/@opentelemetry/api/build/esm/trace/spancontext-utils.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$trace_flags$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@opentelemetry+api@1.9.1/node_modules/@opentelemetry/api/build/esm/trace/trace_flags.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2d$api$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@opentelemetry+api@1.9.1/node_modules/@opentelemetry/api/build/esm/trace-api.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$core$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$core$2f$build$2f$esm$2f$common$2f$global$2d$error$2d$handler$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@opentelemetry+core@2.10.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/core/build/esm/common/global-error-handler.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$sdk$2d$trace$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$sdk$2d$trace$2f$build$2f$esm$2f$sampler$2f$AlwaysOffSampler$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@opentelemetry+sdk-trace@2.10.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-trace/build/esm/sampler/AlwaysOffSampler.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$sdk$2d$trace$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$sdk$2d$trace$2f$build$2f$esm$2f$sampler$2f$AlwaysOnSampler$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@opentelemetry+sdk-trace@2.10.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-trace/build/esm/sampler/AlwaysOnSampler.js [instrumentation] (ecmascript)");
;
;
;
;
class ParentBasedSampler {
    _root;
    _remoteParentSampled;
    _remoteParentNotSampled;
    _localParentSampled;
    _localParentNotSampled;
    constructor(config){
        this._root = config.root;
        if (!this._root) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$core$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$core$2f$build$2f$esm$2f$common$2f$global$2d$error$2d$handler$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["globalErrorHandler"])(new Error('ParentBasedSampler must have a root sampler configured'));
            this._root = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$sdk$2d$trace$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$sdk$2d$trace$2f$build$2f$esm$2f$sampler$2f$AlwaysOnSampler$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["AlwaysOnSampler"]();
        }
        this._remoteParentSampled = config.remoteParentSampled ?? new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$sdk$2d$trace$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$sdk$2d$trace$2f$build$2f$esm$2f$sampler$2f$AlwaysOnSampler$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["AlwaysOnSampler"]();
        this._remoteParentNotSampled = config.remoteParentNotSampled ?? new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$sdk$2d$trace$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$sdk$2d$trace$2f$build$2f$esm$2f$sampler$2f$AlwaysOffSampler$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["AlwaysOffSampler"]();
        this._localParentSampled = config.localParentSampled ?? new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$sdk$2d$trace$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$sdk$2d$trace$2f$build$2f$esm$2f$sampler$2f$AlwaysOnSampler$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["AlwaysOnSampler"]();
        this._localParentNotSampled = config.localParentNotSampled ?? new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$sdk$2d$trace$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$sdk$2d$trace$2f$build$2f$esm$2f$sampler$2f$AlwaysOffSampler$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["AlwaysOffSampler"]();
    }
    shouldSample(context, traceId, spanName, spanKind, attributes, links) {
        const parentContext = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2d$api$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["trace"].getSpanContext(context);
        if (!parentContext || !(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$spancontext$2d$utils$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["isSpanContextValid"])(parentContext)) {
            return this._root.shouldSample(context, traceId, spanName, spanKind, attributes, links);
        }
        if (parentContext.isRemote) {
            if (parentContext.traceFlags & __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$trace_flags$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["TraceFlags"].SAMPLED) {
                return this._remoteParentSampled.shouldSample(context, traceId, spanName, spanKind, attributes, links);
            }
            return this._remoteParentNotSampled.shouldSample(context, traceId, spanName, spanKind, attributes, links);
        }
        if (parentContext.traceFlags & __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$trace_flags$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["TraceFlags"].SAMPLED) {
            return this._localParentSampled.shouldSample(context, traceId, spanName, spanKind, attributes, links);
        }
        return this._localParentNotSampled.shouldSample(context, traceId, spanName, spanKind, attributes, links);
    }
    toString() {
        return `ParentBased{root=${this._root.toString()}, remoteParentSampled=${this._remoteParentSampled.toString()}, remoteParentNotSampled=${this._remoteParentNotSampled.toString()}, localParentSampled=${this._localParentSampled.toString()}, localParentNotSampled=${this._localParentNotSampled.toString()}}`;
    }
}
}),
"[project]/node_modules/.pnpm/@opentelemetry+sdk-trace@2.10.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-trace/build/esm/sampler/TraceIdRatioBasedSampler.js [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TraceIdRatioBasedSampler",
    ()=>TraceIdRatioBasedSampler
]);
/*
 * Copyright The OpenTelemetry Authors
 * SPDX-License-Identifier: Apache-2.0
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$spancontext$2d$utils$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@opentelemetry+api@1.9.1/node_modules/@opentelemetry/api/build/esm/trace/spancontext-utils.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$sdk$2d$trace$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$sdk$2d$trace$2f$build$2f$esm$2f$Sampler$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@opentelemetry+sdk-trace@2.10.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-trace/build/esm/Sampler.js [instrumentation] (ecmascript)");
;
;
class TraceIdRatioBasedSampler {
    _ratio;
    _upperBound;
    constructor(ratio = 0){
        this._ratio = this._normalize(ratio);
        this._upperBound = this._ratio === 1 ? 0x100000000 : Math.floor(this._ratio * 0xffffffff);
    }
    shouldSample(context, traceId) {
        return {
            decision: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$spancontext$2d$utils$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["isValidTraceId"])(traceId) && this._accumulate(traceId) < this._upperBound ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$sdk$2d$trace$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$sdk$2d$trace$2f$build$2f$esm$2f$Sampler$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["SamplingDecision"].RECORD_AND_SAMPLED : __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$opentelemetry$2b$sdk$2d$trace$40$2$2e$10$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$1$2f$node_modules$2f40$opentelemetry$2f$sdk$2d$trace$2f$build$2f$esm$2f$Sampler$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["SamplingDecision"].NOT_RECORD
        };
    }
    toString() {
        return `TraceIdRatioBased{${this._ratio}}`;
    }
    _normalize(ratio) {
        if (typeof ratio !== 'number' || isNaN(ratio)) return 0;
        return ratio >= 1 ? 1 : ratio <= 0 ? 0 : ratio;
    }
    _accumulate(traceId) {
        let accumulation = 0;
        for(let i = 0; i < 32; i += 8){
            let part = 0;
            for(let j = 0; j < 8; j++){
                const c = traceId.charCodeAt(i + j);
                // Convert hex char code to value: '0'-'9' -> 0-9, 'a'-'f' -> 10-15, 'A'-'F' -> 10-15
                const v = c < 58 ? c - 48 : c < 71 ? c - 55 : c - 87;
                part = part << 4 | v;
            }
            accumulation = (accumulation ^ part) >>> 0;
        }
        return accumulation;
    }
}
}),
"[project]/node_modules/.pnpm/@opentelemetry+sdk-trace@2.10.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-trace/build/esm/semconv.js [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/*
 * Copyright The OpenTelemetry Authors
 * SPDX-License-Identifier: Apache-2.0
 */ /*
 * This file contains a copy of unstable semantic convention definitions
 * used by this package.
 * @see https://github.com/open-telemetry/opentelemetry-js/tree/main/semantic-conventions#unstable-semconv
 */ /**
 * A name uniquely identifying the instance of the OpenTelemetry component within its containing SDK instance.
 *
 * @example otlp_grpc_span_exporter/0
 * @example custom-name
 *
 * @note Implementations **SHOULD** ensure a low cardinality for this attribute, even across application or SDK restarts.
 * E.g. implementations **MUST NOT** use UUIDs as values for this attribute.
 *
 * Implementations **MAY** achieve these goals by following a `<otel.component.type>/<instance-counter>` pattern, e.g. `batching_span_processor/0`.
 * Hereby `otel.component.type` refers to the corresponding attribute value of the component.
 *
 * The value of `instance-counter` **MAY** be automatically assigned by the component and uniqueness within the enclosing SDK instance **MUST** be guaranteed.
 * For example, `<instance-counter>` **MAY** be implemented by using a monotonically increasing counter (starting with `0`), which is incremented every time an
 * instance of the given component type is started.
 *
 * With this implementation, for example the first Batching Span Processor would have `batching_span_processor/0`
 * as `otel.component.name`, the second one `batching_span_processor/1` and so on.
 * These values will therefore be reused in the case of an application restart.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */ __turbopack_context__.s([
    "ATTR_OTEL_COMPONENT_NAME",
    ()=>ATTR_OTEL_COMPONENT_NAME,
    "ATTR_OTEL_COMPONENT_TYPE",
    ()=>ATTR_OTEL_COMPONENT_TYPE,
    "ATTR_OTEL_SPAN_PARENT_ORIGIN",
    ()=>ATTR_OTEL_SPAN_PARENT_ORIGIN,
    "ATTR_OTEL_SPAN_SAMPLING_RESULT",
    ()=>ATTR_OTEL_SPAN_SAMPLING_RESULT,
    "METRIC_OTEL_SDK_PROCESSOR_SPAN_PROCESSED",
    ()=>METRIC_OTEL_SDK_PROCESSOR_SPAN_PROCESSED,
    "METRIC_OTEL_SDK_PROCESSOR_SPAN_QUEUE_CAPACITY",
    ()=>METRIC_OTEL_SDK_PROCESSOR_SPAN_QUEUE_CAPACITY,
    "METRIC_OTEL_SDK_PROCESSOR_SPAN_QUEUE_SIZE",
    ()=>METRIC_OTEL_SDK_PROCESSOR_SPAN_QUEUE_SIZE,
    "METRIC_OTEL_SDK_SPAN_LIVE",
    ()=>METRIC_OTEL_SDK_SPAN_LIVE,
    "METRIC_OTEL_SDK_SPAN_STARTED",
    ()=>METRIC_OTEL_SDK_SPAN_STARTED,
    "OTEL_COMPONENT_TYPE_VALUE_BATCHING_SPAN_PROCESSOR",
    ()=>OTEL_COMPONENT_TYPE_VALUE_BATCHING_SPAN_PROCESSOR,
    "OTEL_COMPONENT_TYPE_VALUE_SIMPLE_SPAN_PROCESSOR",
    ()=>OTEL_COMPONENT_TYPE_VALUE_SIMPLE_SPAN_PROCESSOR
]);
const ATTR_OTEL_COMPONENT_NAME = 'otel.component.name';
const ATTR_OTEL_COMPONENT_TYPE = 'otel.component.type';
const ATTR_OTEL_SPAN_PARENT_ORIGIN = 'otel.span.parent.origin';
const ATTR_OTEL_SPAN_SAMPLING_RESULT = 'otel.span.sampling_result';
const METRIC_OTEL_SDK_PROCESSOR_SPAN_PROCESSED = 'otel.sdk.processor.span.processed';
const METRIC_OTEL_SDK_PROCESSOR_SPAN_QUEUE_CAPACITY = 'otel.sdk.processor.span.queue.capacity';
const METRIC_OTEL_SDK_PROCESSOR_SPAN_QUEUE_SIZE = 'otel.sdk.processor.span.queue.size';
const METRIC_OTEL_SDK_SPAN_LIVE = 'otel.sdk.span.live';
const METRIC_OTEL_SDK_SPAN_STARTED = 'otel.sdk.span.started';
const OTEL_COMPONENT_TYPE_VALUE_BATCHING_SPAN_PROCESSOR = 'batching_span_processor';
const OTEL_COMPONENT_TYPE_VALUE_SIMPLE_SPAN_PROCESSOR = 'simple_span_processor';
}),
"[project]/node_modules/.pnpm/@opentelemetry+sdk-trace@2.10.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-trace/build/esm/version.js [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/*
 * Copyright The OpenTelemetry Authors
 * SPDX-License-Identifier: Apache-2.0
 */ // this is autogenerated file, see scripts/version-update.js
__turbopack_context__.s([
    "VERSION",
    ()=>VERSION
]);
const VERSION = '2.10.0';
}),
];

//# sourceMappingURL=06vh_%40opentelemetry_sdk-trace_build_esm_1ap0e46._.js.map
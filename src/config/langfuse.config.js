import { CallbackHandler } from '@langfuse/langchain';
import { LangfuseSpanProcessor } from '@langfuse/otel';
import { startActiveObservation } from '@langfuse/tracing';
import { NodeSDK } from '@opentelemetry/sdk-node';

let sdk;
let spanProcessor;
let callbackHandler;

async function initializeLangfuse() {
    const publicKey = process.env.LANGFUSE_PUBLIC_KEY;
    const secretKey = process.env.LANGFUSE_SECRET_KEY;

    if (!publicKey && !secretKey) {
        console.warn(
            '⚠️ Langfuse tracing is disabled. Set LANGFUSE_PUBLIC_KEY and LANGFUSE_SECRET_KEY to enable it.',
        );
        return;
    }

    if (!publicKey || !secretKey) {
        throw new Error(
            'Langfuse tracing requires both LANGFUSE_PUBLIC_KEY and LANGFUSE_SECRET_KEY.',
        );
    }

    spanProcessor = new LangfuseSpanProcessor();
    sdk = new NodeSDK({
        autoDetectResources: false,
        spanProcessors: [spanProcessor],
    });
    sdk.start();
    callbackHandler = new CallbackHandler();
}

function getLangfuseCallbackHandler() {
    return callbackHandler;
}

async function withLangfuseSpan(
    name,
    input,
    operation,
    { asType = 'span', output = (result) => result } = {},
) {
    if (!callbackHandler) {
        return operation();
    }

    return startActiveObservation(
        name,
        async (span) => {
            span.update({ input });

            try {
                const result = await operation();
                span.update({ output: output(result) });
                return result;
            } catch (error) {
                span.update({
                    level: 'ERROR',
                    statusMessage:
                        error instanceof Error ? error.message : String(error),
                });
                throw error;
            }
        },
        { asType },
    );
}

async function shutdownLangfuse() {
    if (!sdk) {
        return;
    }

    try {
        await spanProcessor.forceFlush();
    } finally {
        try {
            await sdk.shutdown();
        } finally {
            sdk = undefined;
            spanProcessor = undefined;
            callbackHandler = undefined;
        }
    }
}

export {
    getLangfuseCallbackHandler,
    initializeLangfuse,
    shutdownLangfuse,
    withLangfuseSpan,
};

'use strict';

// module name: createPngcrushModule
const WASM_JS_MODULE_URL = 'pngcrush.js';

const DEFAULT_ARGS = ["-v", "-rem", "alla", "-nofilecheck", "-reduce"];

/**
 * Post the data back to window.
 * @param { 'stderr' | 'err' | 'resolved' | 'rejected'} type 
 * @param {string} message 
 * @param {Blob | undefined} file 
 */
function postBackMessage(type, message, file) {
    self.postMessage({
        type,
        message,
        ...file ? { file } : {}
    });
}

/**
 * Note: typeof e.data
 * {
 *     wasmJSUrl: string;      // blob url to fetch for pngcrush.js if loaded from unpkg
 *     wasmBinaryUrl: string;  // blob url to fetch for pngcrush.wasm
 *     type: "run",
 *     file: ArrayBuffer | Uint8Array | Blob |,
 *     args: string[]
 * }
 */
self.addEventListener('message', async (e) => {
    const data = e.data;
    if (!data) return;
    try {
        importScripts(data.wasmJSUrl || WASM_JS_MODULE_URL);
    } catch (err) {
        postBackMessage('err', 'Fail to load wasm module, err message: ' + err?.message);
        console.error(err);
        return;
    }
    if (typeof createPngcrushModule !== 'function') {
        postBackMessage('err', 'Target module not found.');
        return;
    }
    try {
        let errorRecord = null;

        /** If any of the stdout hit these flags, it meams some error had occurred. */
        const LOG_FLAGS = {
            /** Invalid argument */
            "pngcrush: malformed or missing argument": "Invalid argument(s).",
            /** Invalid image data */
            "While measuring IDATs in input.png pngcrush caught libpng error:": "Invalid image data.",
        };

        const pngcrush = await createPngcrushModule({
            // Note: pngcrush uses stderr by default. See notes in pngcrush.c if needed.
            printErr(msg) {
                postBackMessage('stderr', msg + '');
                if (msg in LOG_FLAGS) {
                    errorRecord = LOG_FLAGS[msg];
                }
            },
            ...data.wasmBinaryUrl ? { wasmBinary: await (await fetch(data.wasmBinaryUrl)).arrayBuffer() } : {}
        });
        // Convert one single file. Expecred message payload: { type: "run", data: Buffer }
        if (data.type === 'run' && (data.file instanceof ArrayBuffer || data.file instanceof Uint8Array || data.file instanceof Blob || data.file instanceof File)) {

            const extraArgs = Array.isArray(data.args) ? data.args : DEFAULT_ARGS;

            let file = data.file;
            if (file instanceof File) {
                file = await file.arrayBuffer();
            }
            const uint8ArrayFile = file instanceof Uint8Array ? file : new Uint8Array(file);
            pngcrush.FS.writeFile('input.png', uint8ArrayFile);
            pngcrush.callMain([...extraArgs, 'input.png', 'output.png']);

            try {
                // Check if the process is ok
                if (errorRecord) {
                    postBackMessage("rejected", errorRecord);
                    return;
                }

                /** @type {Uint8Array} */
                const u8FileOutput = pngcrush.FS.readFile('output.png');
                if (!u8FileOutput.length) {
                    postBackMessage('rejected', "Output image is empty file.");
                    return;
                }

                postBackMessage("resolved", "output.png", new Blob([u8FileOutput], { type: 'image/png' }));
            } catch (err) {
                postBackMessage("rejected", "Fail to access the output image. (see console output)");
                console.error(err);
            }

            return;
        }

        postBackMessage('rejected', "Invalid method.");
    } catch (err) {
        postBackMessage('rejected', 'Error occurred during execution. Message: ' + err?.message);
        return;
    }
});

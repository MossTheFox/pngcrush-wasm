'use strict';

typeof module !== 'undefined' && (
    module.exports = {
        crushPng
    }
);

/** index from 0 ~ 2: worker, js, wasm 
 * @type {string[]}
*/
let __PNGCRUSH_WASM_BLOB_URLS = [];

/**
 * Optimize a png file.
 * 
 * Notice that even if the original png file has smaller size, the function will still return the larger 'optimized' file.
 * 
 * @param {File | ArrayBuffer | Blob | Uint8Array} file PNG file
 * @param {{
 *     args?: string[];
 *     logger?: (msg: string) => void;
 *     workerPath?: string | URL;
 *     timeout?: number;
 * }} conf 
 * @returns {Promise<Blob & { type: 'image/png' }>} The blob of optimized png file.
 * @example 
 * try {
 *     const optimized = await crushPng(file);
 *     console.log(optimized);     // Blob, type: image/png
 * } catch (err) {
 *     console.log(err);
 * }
 */
function crushPng(file, conf = {}) {

    async function toBlobUrl(url, mime) {
        let res = await fetch(url);
        let arrayBuffer = await res.arrayBuffer();

        return URL.createObjectURL(new Blob([arrayBuffer], { type: mime ?? res.type }))
    }

    const __DEFAULT_FETCH_URL_PREFIX = 'https://unpkg.com/pngcrush-wasm@latest/wasm/';

    return new Promise(async (resolve, reject) => {
        try {
            if (!(
                file instanceof File ||
                file instanceof ArrayBuffer ||
                file instanceof Blob ||
                file instanceof Uint8Array
            )) {
                reject(new Error('Invalid file object. Expected type: File | ArrayBuffer | Blob | Uint8Array'));
            }

            if (!conf.workerPath && __PNGCRUSH_WASM_BLOB_URLS.length !== 3) {
                __PNGCRUSH_WASM_BLOB_URLS = await Promise.all([
                    toBlobUrl(__DEFAULT_FETCH_URL_PREFIX + 'worker.js', 'application/javascript'),
                    toBlobUrl(__DEFAULT_FETCH_URL_PREFIX + 'pngcrush.js', 'application/javascript'),
                    toBlobUrl(__DEFAULT_FETCH_URL_PREFIX + 'pngcrush.wasm', 'application/wasm')
                ]);
            }

            const worker = new Worker(conf.workerPath || __PNGCRUSH_WASM_BLOB_URLS[0]);

            let timeout = null;
            if (typeof conf.timeout === 'number') {
                timeout = setTimeout(() => {
                    const abortError = new Error("Aborted");
                    abortError.name = 'AbortError';
                    reject(abortError);
                    worker.terminate();
                }, conf.timeout);
            }

            worker.addEventListener('message', function (e) {
                const data = e.data;
                if (typeof data !== 'object') return;

                // pngcrush stdout
                if (data.type === 'stderr') {
                    let message = data.message ? (data.message + '') : '';
                    if (conf?.logger) {
                        conf.logger(message);
                    }
                }

                // resolved
                if (data.type === 'resolved') {
                    resolve(data.file)
                }

                // error occurred
                if (data.type === 'err' || data.type === 'rejected') {
                    reject(new Error(data.message || 'Unknown error.'));
                }

                // Terminate the worker when the job ends.
                if (['err', 'resolved', 'rejected'].includes(data.type)) {
                    this.terminate();
                    timeout && clearTimeout(timeout);
                    return;
                }
            });

            worker.postMessage({
                type: 'run',
                file: file,
                ...Array.isArray(conf?.args) ? { args: conf?.args } : {},
                ...conf.workerPath ? {} : {
                    wasmJSUrl: __PNGCRUSH_WASM_BLOB_URLS[1],
                    wasmBinaryUrl: __PNGCRUSH_WASM_BLOB_URLS[2]
                }
            });
        } catch (err) {
            reject(err);
        }
    });
}
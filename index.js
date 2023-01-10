'use strict';

typeof module !== 'undefined' && (
    module.exports = {
        crushPng
    }
);


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

    // const __DEFAULT_WORKER_URL = 'https://unpkg.com/pngcrush-wasm@latest/wasm/worker.js';
    // TODO: fetch and convert to blob url for the worker, pngcrush.js and pngcrush.wasm files

    return new Promise((resolve, reject) => {
        try {
            if (!conf.workerPath) {
                reject(new Error("No worker path specified."));
            }

            if (!(
                file instanceof File ||
                file instanceof ArrayBuffer ||
                file instanceof Blob ||
                file instanceof Uint8Array
            )) {
                reject(new Error('Invalid file object. Expected type: File | ArrayBuffer | Blob | Uint8Array'));
            }
            const worker = new Worker(conf.workerPath || __DEFAULT_WORKER_URL);

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
                ...Array.isArray(conf?.args) ? { args: conf?.args } : {}
            });
        } catch (err) {
            reject(err);
        }
    });
}
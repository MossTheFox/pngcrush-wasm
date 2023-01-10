export type CrushPngConfig = {
    /**
     * An array of string to pass as arguments for pngcrush commandline. The args will be placed before the input and output file names.
     * 
     * example: `["-v", "-brute"]`
     * - `-v` for verbose mode which logs some detailed process data (the default verbosity is 0 (quiet) since pngcrush 1.8.12)
     * - `-brute` will make it try all 100+ compression methods (slow) to find the best one for current file
     * 
     * Default args (not so fast since it goes over the compression method 1, 2, 3, 6, 9, 10 to pick the best one): `["-v", "-rem", "alla", "-nofilecheck", "-reduce"]`
     * 
     * Check [ubuntu manuals: pngcrush](https://manpages.ubuntu.com/manpages/focal/en/man1/pngcrush.1.html) for detailed options.
     * 
     * More args examples:
     * - `["-v"]`: Verbose mode (1.18.12, get the same behavior as previous version)
     * - `["-brute"]`: Use all crush methods and pick the best one. Time consuming.
     * - `["-reduce"]`: Calculate the colors used, and try to reduce the bitdepth.
     * - `["-m", "7"]`: Use the 7th method. Quick but not too efficient.
     * - `["-rem", "text"]`: Remove all text chunks.
     */
    args?: string[];
    /** A function that accepts each line of stdout (stderr) from pngcrush. */
    logger?: (msg: string) => void;
    /** Specify the path for the Web Worker */
    workerPath?: string | URL;
    /** (in millisecond) If specified, reject the promise and terminate the web worker on timeout. The error name will be `"AbortError"`. */
    timeout?: number;
};

/**
 * Optimize a png file.
 * 
 * Notice that even if the original png file has smaller size, the function will still return the larger 'optimized' file.
 * 
 * @example 
 * try {
 *     const optimized = await crushPng(file);
 *     console.log(optimized);     // Blob, type: image/png
 * } catch (err) {
 *     console.log(err);
 * }
 */
export function crushPng(file: File | ArrayBuffer | Blob | Uint8Array, conf: CrushPngConfig): Promise<Blob & { type: 'image/png' }>;
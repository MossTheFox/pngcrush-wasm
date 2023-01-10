pngcrush-wasm
----

Use pngcrush right in the browser, with a simple wrapped API.

## Build

pngcrush-wasm is based on [pngcrush-1.18.13](https://pmt.sourceforge.io/pngcrush/). The source code for pngcrush can be found [here](https://sourceforge.net/projects/pmt/files/). When building the module, only `Makefile` will need to be modified.

Make sure Emscripten Compiler Frontend (`emcc`) is ready for your current terminal. You can setup by following the [Getting Started](https://emscripten.org/docs/getting_started/downloads.html) doc from emscripten.

```sh
cd ./pngcrush-1.8.13
make
```

Then, take the two files `pngcrush.js` `pngcrush.wasm` and you're ready to go. Check the docs from emscripten for more details.

## Basic Usage

Note: pngcrush-wasm uses Web Worker to load the wasm module. This will help to provide support for processing multiple files at the same time. The web worker will be terminated when the compression process finished or exited with error.

The script will load the worker from unpkg ( https://unpkg.com/pngcrush-wasm@latest/wasm/worker.js ) by default. You can host your own by specifying the `workerPath`. Check the following examples.

```javascript
import { crushPng } from "pngcrush-wasm";

const res = await fetch('example.png');
const file = await res.arrayBuffer();

try {
    // Supported file object types: File | ArrayBuffer | Blob | Uint8Array
    const optimizedFile = await crushPng(file);     // Blob, type: image/png

    // create an object url for the user to download
    const url = URL.createObjectURL(optimizedFile);

    let a = document.createElement("a");
    a.href = url;
    a.download = "output.png";

    // fires download
    a.click();

    URL.revokeObjectURL(url);

} catch (err) {
    console.log(err);
}

```

To host the worker and wasm files, check the `wasm` folder that comes with the package.

You can then organize your static files like this:

```
📂 public
- 📂 wasm
  - pngcrush.js
  - pngcrush.wasm
  - worker.js
```

The worker will load `pngcrush.js` that is located in the same path of itself. The wasm file will be loaded by `pngcrush.js` later. You need to make sure all the three files are set together.

Then, call `crushPng` with specified `workerPath`:

```javascript
const optimizedFile = await crushPng(file, {
    workerPath: "/wasm/worker.js"
});
```

## Config

- `workerPath`: Specify the path for the Web Worker;
- `args`: An array of string to pass as arguments for pngcrush commandline;
    - Example: `args: ["-v", "-brute"]`
        - `-v` for verbose mode which logs some detailed process data (the default verbosity is 0 (quiet) since pngcrush 1.8.12)
        - `-brute` will make it try all 100+ compression methods (slow) to find the best one for current file;
    - The args will be placed before the input and output file names;
    - Default args (not so fast since it goes over the compression method 1, 2, 3, 6, 9, 10 to pick the best one): `["-v", "-rem", "alla", "-nofilecheck", "-reduce"]`;
    - Check [ubuntu manuals: pngcrush](https://manpages.ubuntu.com/manpages/focal/en/man1/pngcrush.1.html) for detailed options;
- `logger`: A function that accepts each line of stdout (stderr) from pngcrush;
- `timeout`: (in millisecond) If specified, reject the promise and terminate the web worker on timeout. The error name will be `"AbortError"`.

Example: Specify some arguments and handling log output

```javascript
import { crushPng } from "pngcrush-wasm";

// ...

function logger(msg) {
    console.log(msg);
}

const optimizedFile = await crushPng(file, {
    args: ["-v", "-m", "7"],    // verbose mode for more logs, -m 7 to specify the 7th method to use.
                                // This argument actually runs much faster than the default one, but will lead to low compression level.
    logger: logger
});

```

## License

The project itself is MIT licenced.

This project is based upon [pngcrush](https://pmt.sourceforge.io/pngcrush/). The license of pngcrush is embedded in the file `pngcrush.c`.
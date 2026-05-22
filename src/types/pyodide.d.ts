// Minimal ambient types for Pyodide loaded via importScripts in Web Worker.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function loadPyodide(opts: unknown): Promise<any>
}
export {}

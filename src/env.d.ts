// Vite’s typings for `import.meta.env`
interface ImportMetaEnv {
  readonly VITE_BACKEND_URL?: string;
  // add any other VITE_… vars you use
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
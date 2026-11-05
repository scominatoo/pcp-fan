/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  /** Selo exibido no menu (ex.: "Homologação"). Deixe vazio em produção. */
  readonly VITE_AMBIENTE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

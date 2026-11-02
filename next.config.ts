import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  // Immagine Docker / Railway: output classico (better-sqlite3 nativo)
  // non usiamo standalone per evitare binding nativi incompleti.
};

export default nextConfig;

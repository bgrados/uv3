import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Logos de equipos, fotos de jugadores y banners viven en Supabase Storage.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  experimental: {
    serverActions: {
      // Permite subir logos y fotos (por defecto el límite es 1 MB).
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;

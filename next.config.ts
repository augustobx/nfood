import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  workboxOptions: {
    // Excluir todas las rutas de /admin y /api para que no sean cacheadas ni interceptadas
    exclude: [
      /^\/admin\/.*$/i,
      /^\/api\/.*$/i
    ]
  }
});

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "prisma", "mariadb"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default withPWA(nextConfig);
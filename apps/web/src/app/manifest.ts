import type { MetadataRoute } from 'next'

const BASE_PATH = process.env.BASE_PATH || '';

export const dynamic = "force-static";
export const revalidate = false;

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "FIDE Calculator",
        short_name: "FIDECalc",
        description: "A calculator for FIDE ratings.",
        start_url: `${BASE_PATH}/`,
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#0a1128",
        icons: [
            {
                src: `${BASE_PATH}/favicon.ico`,
                sizes: "48x48 72x72 96x96 128x128 256x256 384x384 512x512",
                type: "image/x-icon"
            },
            {
                src: `${BASE_PATH}/android-chrome-192x192.png`,
                sizes: "192x192",
                type: "image/png"
            },
            {
                src: `${BASE_PATH}/android-chrome-512x512.png`,
                sizes: "512x512",
                type: "image/png"
            }
        ]
    }
}
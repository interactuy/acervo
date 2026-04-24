export const mapboxConfig = {
  accessToken: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "",
  defaultStyle: "mapbox://styles/mapbox/light-v11",
  defaultCenter: [-56.1645, -34.9011] as const,
  defaultZoom: 12,
};

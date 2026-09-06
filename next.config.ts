import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/exam/grammar": ["./data/exam/grammar/powerdrill/*.json"],
    "/exam/grammar/powerdrill/*": ["./data/exam/grammar/powerdrill/*.json"],
  },
};

export default nextConfig;

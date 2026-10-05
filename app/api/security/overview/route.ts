import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const CACHE_HEADERS = {
  "Cache-Control": "private, max-age=60, stale-while-revalidate=180",
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const accountFilter = searchParams.get("account") || "all";
    
    // Get lightweight overview from main security API
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/security?account=${accountFilter}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || "Failed to fetch security overview");
    }

    // Return lightweight overview for dashboard consumption
    const overview = {
      success: true,
      critical: data.overview?.critical || 0,
      high: data.overview?.high || 0,
      medium: data.overview?.medium || 0,
      low: data.overview?.low || 0,
      reviewRequired: data.overview?.reviewRequired || 0,
      healthy: data.overview?.healthy || 0,
      total: data.overview?.totalFindings || 0,
      byService: data.overview?.byService || {},
      lastUpdated: data.overview?.lastUpdated || new Date().toISOString(),
      cached: data.cached || false
    };

    return NextResponse.json(overview, { headers: CACHE_HEADERS });

  } catch (error: any) {
    console.error("Security overview error:", error);
    
    return NextResponse.json({
      success: false,
      error: "Failed to fetch security overview",
      message: error.message || "An unknown error occurred",
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      reviewRequired: 0,
      healthy: 0,
      total: 0
    }, { status: 500 });
  }
}
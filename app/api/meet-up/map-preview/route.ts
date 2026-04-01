import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const location = req.nextUrl.searchParams.get('location');
  if (!location) {
    return NextResponse.json({ error: 'Missing location' }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Missing Google Maps API key' }, { status: 500 });
  }

  const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(
    location
  )}&zoom=15&size=600x300&markers=color:red|${encodeURIComponent(
    location
  )}&key=${apiKey}`;

  // Optionally, you could use Geocoding API to resolve address here

  return NextResponse.json({ mapUrl, resolvedAddress: location });
}

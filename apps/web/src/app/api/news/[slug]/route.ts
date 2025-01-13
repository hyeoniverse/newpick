import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const slug = (await params).slug;

  try {

    console.log('params:',slug)
    const res = await fetch(`http://localhost:3001/news/${slug}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      })
    if (!res.ok) {
      throw new Error("Failed to fetch data");
    }
    const data = await res.json()
    return NextResponse.json(data);

  } catch (err) {
    console.error(err)
    return NextResponse.error();
  }
}

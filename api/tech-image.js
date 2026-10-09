export default async function handler(req, res) {
  const imageUrl = req.query?.url;
  if (!imageUrl || !/^https?:\/\//i.test(imageUrl)) {
    return res.status(400).send('Invalid image URL');
  }

  try {
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ErdikoudiBusiness/1.0)',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      },
    });

    if (!response.ok) throw new Error(`Image HTTP ${response.status}`);

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    if (!contentType.startsWith('image/')) throw new Error('Not an image');

    const buffer = Buffer.from(await response.arrayBuffer());
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800');
    return res.status(200).send(buffer);
  } catch (error) {
    return res.status(404).send('Image unavailable');
  }
}

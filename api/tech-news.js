const FEEDS = [
  {
    source: '01net',
    feed: 'https://www.01net.com/actualites/feed/',
    fallbackImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
  },
  {
    source: '01net Technos',
    feed: 'https://www.01net.com/actualites/technos/feed/',
    fallbackImage: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80',
  },
  {
    source: 'Numerama',
    feed: 'https://www.numerama.com/feed/rss/tech/',
    fallbackImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
  },
];

function decodeEntities(value = '') {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

function stripHtml(value = '') {
  return decodeEntities(value)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getTag(block, tag) {
  const escapedTag = tag.replace(':', '\\:');
  const regex = new RegExp(`<${escapedTag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${escapedTag}>`, 'i');
  const match = block.match(regex);
  return match ? decodeEntities(match[1].trim()) : '';
}

function getAttrTag(block, tag, attr) {
  const escapedTag = tag.replace(':', '\\:');
  const regex = new RegExp(`<${escapedTag}[^>]*\\b${attr}=["']([^"']+)["'][^>]*>`, 'i');
  const match = block.match(regex);
  return match ? decodeEntities(match[1]) : '';
}

function normalizeUrl(rawUrl, baseUrl = '') {
  if (!rawUrl) return '';
  const value = decodeEntities(rawUrl.trim());
  try {
    return new URL(value, baseUrl).href;
  } catch {
    return /^https?:\/\//i.test(value) ? value : '';
  }
}

function getImage(block, fallbackImage, baseUrl) {
  const candidates = [
    getAttrTag(block, 'media:content', 'url'),
    getAttrTag(block, 'media:thumbnail', 'url'),
    getAttrTag(block, 'media:content', 'href'),
    getAttrTag(block, 'enclosure', 'url'),
    getAttrTag(block, 'enclosure', 'href'),
    getAttrTag(block, 'image', 'href'),
    getAttrTag(block, 'image', 'url'),
    getAttrTag(block, 'itunes:image', 'href'),
  ];

  const rawHtml = decodeEntities(
    getTag(block, 'description') ||
    getTag(block, 'content:encoded') ||
    getTag(block, 'summary')
  );

  const imageMatches = [
    rawHtml.match(/<img[^>]+src=["']([^"']+)["']/i),
    rawHtml.match(/<img[^>]+data-src=["']([^"']+)["']/i),
    rawHtml.match(/<source[^>]+srcset=["']([^"']+)["']/i),
  ];

  imageMatches.forEach((match) => {
    if (match?.[1]) candidates.push(match[1].split(',')[0].trim().split(' ')[0]);
  });

  const valid = candidates
    .map((url) => normalizeUrl(url, baseUrl))
    .find((url) => /^https?:\/\//i.test(url));

  return valid || fallbackImage;
}

function parseFeed(xml, source, fallbackImage, feedUrl) {
  const blocks = xml.match(/<item\b[\s\S]*?<\/item>/gi) || xml.match(/<entry\b[\s\S]*?<\/entry>/gi) || [];

  return blocks.map((block) => {
    const title = stripHtml(getTag(block, 'title'));
    const link = normalizeUrl(
      getTag(block, 'link') ||
      getAttrTag(block, 'link', 'href') ||
      (block.match(/<guid[^>]*>([\s\S]*?)<\/guid>/i)?.[1] || '').trim(),
      feedUrl
    );

    const description = stripHtml(
      getTag(block, 'description') ||
      getTag(block, 'content:encoded') ||
      getTag(block, 'summary')
    );

    const date =
      getTag(block, 'pubDate') ||
      getTag(block, 'published') ||
      getTag(block, 'updated') ||
      getTag(block, 'dc:date');

    return {
      id: link || `${source}-${title}`,
      title,
      description: description.length > 260 ? `${description.slice(0, 257)}...` : description,
      link,
      date: date || null,
      image: getImage(block, fallbackImage, feedUrl),
      source,
    };
  }).filter((item) => item.title && item.link);
}

async function fetchFeed({ source, feed, fallbackImage }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(feed, {
      headers: {
        'User-Agent': 'Erdikoudi-Business-Tech-News/2.0',
        Accept: 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
      },
      signal: controller.signal,
    });

    if (!response.ok) throw new Error(`${source}: HTTP ${response.status}`);

    const xml = await response.text();
    const articles = parseFeed(xml, source, fallbackImage, feed);

    if (!articles.length) throw new Error(`${source}: flux reçu mais aucun article reconnu`);
    return articles;
  } finally {
    clearTimeout(timeout);
  }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1800');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  const results = await Promise.allSettled(FEEDS.map(fetchFeed));

  const articles = results
    .flatMap((result) => result.status === 'fulfilled' ? result.value : [])
    .sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      return db - da;
    })
    .filter((article, index, array) => array.findIndex((x) => x.link === article.link) === index)
    .slice(0, 12);

  const failedSources = results
    .map((result, index) => result.status === 'rejected' ? { source: FEEDS[index].source, error: result.reason?.message || 'Erreur inconnue' } : null)
    .filter(Boolean);

  return res.status(200).json({
    ok: true,
    updatedAt: new Date().toISOString(),
    language: 'fr',
    articles,
    sources: FEEDS.map(({ source }) => source),
    failedSources,
  });
}

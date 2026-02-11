const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 1e6) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function safeParseUrl(input) {
  try {
    const parsed = new URL(input);
    if (!/^https?:$/.test(parsed.protocol)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function stripTags(text = '') {
  return text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function decodeHtmlEntities(text = '') {
  const map = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&nbsp;': ' '
  };
  return text.replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (m) => map[m] || m);
}

function pickLargestImage(urls) {
  const filtered = urls
    .filter(Boolean)
    .filter((u) => !/sprite|icon|logo|avatar|thumb/i.test(u));
  return filtered[0] || '';
}

function findMeta(html, attrs) {
  for (const attr of attrs) {
    const rx = new RegExp(`<meta[^>]+${attr}=["']([^"']+)["'][^>]*content=["']([^"']+)["'][^>]*>`, 'i');
    const match = html.match(rx);
    if (match) return decodeHtmlEntities(match[2]);
    const rxInverse = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*${attr}=["']([^"']+)["'][^>]*>`, 'i');
    const match2 = html.match(rxInverse);
    if (match2) return decodeHtmlEntities(match2[1]);
  }
  return '';
}

function findMetaByKey(html, key) {
  const rx1 = new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]*content=["']([^"']+)["'][^>]*>`, 'i');
  const m1 = html.match(rx1);
  if (m1) return decodeHtmlEntities(m1[1]);
  const rx2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${key}["'][^>]*>`, 'i');
  const m2 = html.match(rx2);
  return m2 ? decodeHtmlEntities(m2[1]) : '';
}

function extractJsonLd(html) {
  const blocks = [];
  const rx = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = rx.exec(html)) !== null) {
    const raw = match[1].trim();
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      blocks.push(parsed);
    } catch {
      const cleaned = raw.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
      try {
        blocks.push(JSON.parse(cleaned));
      } catch {
        // skip malformed
      }
    }
  }
  return blocks;
}

function flattenJsonLd(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data.flatMap(flattenJsonLd);
  if (typeof data === 'object') {
    const root = [data];
    if (Array.isArray(data['@graph'])) root.push(...flattenJsonLd(data['@graph']));
    if (data.mainEntity) root.push(...flattenJsonLd(data.mainEntity));
    if (data.itemOffered) root.push(...flattenJsonLd(data.itemOffered));
    if (data.offers) root.push(...flattenJsonLd(data.offers));
    return root;
  }
  return [];
}

function firstString(...vals) {
  for (const val of vals) {
    if (typeof val === 'string' && val.trim()) return decodeHtmlEntities(val.trim());
    if (Array.isArray(val)) {
      const found = val.find((v) => typeof v === 'string' && v.trim());
      if (found) return decodeHtmlEntities(found.trim());
    }
  }
  return '';
}

function parsePrice(text = '') {
  const normalized = text.replace(/\s/g, '');
  const m = normalized.match(/(\d{2,6}(?:[.,]\d{1,2})?)\s?(€|eur)?/i);
  if (!m) return null;
  const raw = m[1].replace(',', '.');
  return Math.round(Number(raw));
}

function findWithRegexes(text, regexes) {
  for (const rx of regexes) {
    const m = text.match(rx);
    if (m) return m[1] || m[0];
  }
  return '';
}

function extractHeuristic(html, plainText) {
  const imageMatches = Array.from(html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi)).map((m) => m[1]);
  const priceSnippet = findWithRegexes(plainText, [
    /(\d[\d\s.,]{2,})\s?€\s?(?:\/|par)?\s?(?:mois|month|m)/i,
    /loyer[^\d]{0,20}(\d[\d\s.,]{2,})\s?€/i,
    /(\d[\d\s.,]{2,})\s?€/i
  ]);
  const areaSnippet = findWithRegexes(plainText, [/(\d{1,3}[.,]?\d{0,2})\s?m²/i, /(\d{1,3}[.,]?\d{0,2})\s?m2/i]);
  const roomsSnippet = findWithRegexes(plainText, [/(\d{1,2})\s?pi[eè]ce(?:s)?/i, /(\d{1,2})\s?rooms?/i]);
  const citySnippet = findWithRegexes(plainText, [
    /(Paris\s?\d{1,2}(?:e|er)?)/i,
    /\b(75\d{3})\b/,
    /(?:ville|city|localit[ée])\s*[:\-]?\s*([A-ZÀ-ÿ][A-Za-zÀ-ÿ\-\s]{2,40})/i
  ]);
  const addressSnippet = findWithRegexes(plainText, [
    /(?:adresse|address|location)\s*[:\-]\s*([^\n.,]{8,80})/i,
    /(\d{1,3}\s+[A-Za-zÀ-ÿ'\-\s]{4,60})\s+(?:Paris|Lyon|Marseille|Boulogne|Montreuil|Saint-Denis)/i
  ]);

  return {
    photoUrl: pickLargestImage(imageMatches),
    rentPrice: parsePrice(priceSnippet),
    areaM2: areaSnippet ? Number(String(areaSnippet).replace(',', '.')) : null,
    rooms: roomsSnippet ? Number(roomsSnippet) : null,
    cityOrArrondissement: citySnippet ? decodeHtmlEntities(citySnippet.trim()) : '',
    address: addressSnippet ? decodeHtmlEntities(addressSnippet.trim()) : '',
    extractMethod: 'heuristic',
    snippets: { priceSnippet, areaSnippet, roomsSnippet, citySnippet, addressSnippet }
  };
}

function extractFromJsonLd(blocks) {
  const nodes = flattenJsonLd(blocks);
  const propertyNode = nodes.find((n) => {
    const type = Array.isArray(n['@type']) ? n['@type'].join(' ') : String(n['@type'] || '');
    return /(Offer|Product|Apartment|Residence|House|Accommodation|SingleFamilyResidence|RentAction)/i.test(type);
  }) || nodes[0] || {};

  const offers = propertyNode.offers || propertyNode;
  const addressObj = propertyNode.address || offers.address || {};
  const geo = propertyNode.geo || {};

  const imageVal = firstString(propertyNode.image, propertyNode.images, propertyNode.photo);
  const priceVal = firstString(offers.price, offers.priceSpecification?.price, propertyNode.price);
  const areaVal = firstString(
    propertyNode.floorSize?.value,
    propertyNode.floorSize,
    propertyNode.area,
    propertyNode.surface
  );
  const roomsVal = firstString(propertyNode.numberOfRooms, propertyNode.rooms, propertyNode.numberOfBedrooms);

  return {
    photoUrl: imageVal,
    address: firstString(addressObj.streetAddress, propertyNode.streetAddress, propertyNode.address),
    cityOrArrondissement: firstString(addressObj.addressLocality, addressObj.addressRegion, geo.addressLocality),
    rooms: roomsVal ? Number(String(roomsVal).match(/\d+/)?.[0]) : null,
    areaM2: areaVal ? Number(String(areaVal).replace(',', '.').match(/\d+[.,]?\d*/)?.[0]) : null,
    rentPrice: priceVal ? parsePrice(String(priceVal)) : null,
    extractMethod: 'jsonld',
    rawNode: propertyNode
  };
}

function extractFromOg(html) {
  const image = findMetaByKey(html, 'og:image');
  const title = findMetaByKey(html, 'og:title');
  const description = findMetaByKey(html, 'og:description') || findMetaByKey(html, 'description');

  return {
    photoUrl: image,
    title,
    description,
    extractMethod: image || title || description ? 'og' : ''
  };
}

function computeConfidence(listing, method) {
  const required = ['photoUrl', 'address', 'cityOrArrondissement', 'rooms', 'areaM2', 'rentPrice'];
  const filled = required.filter((key) => Boolean(listing[key])).length;
  let score = Math.round((filled / required.length) * 100);
  if (method === 'heuristic') score = Math.max(10, score - 18);
  if (method === 'manual') score = Math.max(score, 70);
  return Math.min(100, score);
}

function mergeExtraction(og, jsonld, heuristic) {
  const merged = {
    photoUrl: og.photoUrl || jsonld.photoUrl || heuristic.photoUrl || '',
    address: jsonld.address || heuristic.address || '',
    cityOrArrondissement: jsonld.cityOrArrondissement || heuristic.cityOrArrondissement || '',
    rooms: jsonld.rooms || heuristic.rooms || null,
    areaM2: jsonld.areaM2 || heuristic.areaM2 || null,
    rentPrice: jsonld.rentPrice || heuristic.rentPrice || null
  };

  let method = 'heuristic';
  if (jsonld.photoUrl || jsonld.address || jsonld.rentPrice) method = 'jsonld';
  else if (og.photoUrl) method = 'og';

  return { merged, method };
}

async function extractListing(targetUrl) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DYImmoBot/1.0)'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP_${response.status}`);
    }

    const html = await response.text();
    const plainText = decodeHtmlEntities(stripTags(html));
    const og = extractFromOg(html);
    const jsonLdBlocks = extractJsonLd(html);
    const jsonld = extractFromJsonLd(jsonLdBlocks);
    const heuristic = extractHeuristic(html, plainText);

    const { merged, method } = mergeExtraction(og, jsonld, heuristic);
    const confidenceScore = computeConfidence(merged, method);

    return {
      ok: true,
      listing: {
        ...merged,
        extractMethod: method,
        confidenceScore,
        rawExtract: {
          og,
          jsonLdBlocks,
          heuristic: heuristic.snippets
        }
      }
    };
  } catch (error) {
    return {
      ok: false,
      error: error.name === 'AbortError' ? 'TIMEOUT' : error.message
    };
  } finally {
    clearTimeout(timeout);
  }
}

function serveFile(reqPath, res) {
  const safePath = reqPath === '/' ? '/index.html' : reqPath;
  const filePath = path.normalize(path.join(PUBLIC_DIR, safePath));

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      return res.end('Not found');
    }

    const ext = path.extname(filePath).toLowerCase();
    const mime = {
      '.html': 'text/html; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.json': 'application/json; charset=utf-8'
    }[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'POST' && requestUrl.pathname === '/api/extract') {
    try {
      const raw = await readBody(req);
      const body = JSON.parse(raw || '{}');
      const parsed = safeParseUrl(body.url);
      if (!parsed) {
        return sendJson(res, 400, { ok: false, error: 'INVALID_URL' });
      }

      const result = await extractListing(parsed.toString());
      if (!result.ok) {
        return sendJson(res, 422, {
          ok: false,
          error: 'BLOCKED_OR_FAILED',
          reason: result.error
        });
      }

      return sendJson(res, 200, {
        ok: true,
        data: {
          ...result.listing,
          sourceDomain: parsed.hostname.replace('www.', '')
        }
      });
    } catch {
      return sendJson(res, 500, { ok: false, error: 'SERVER_ERROR' });
    }
  }

  if (req.method === 'GET') {
    return serveFile(requestUrl.pathname, res);
  }

  res.writeHead(405);
  res.end('Method not allowed');
});

server.listen(PORT, () => {
  console.log(`D&Y IMMO running on http://localhost:${PORT}`);
});

import fetch from 'node-fetch';

export default async function handler(req, res) {
  const { keyword } = req.query;

  if (!keyword) {
    return res.status(400).json({ error: "Missing keyword parameter" });
  }

  try {
    const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(keyword)}`;
    const response = await fetch(googleUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });
    const html = await response.text();

    const resultMatch = html.match(/About ([\d,]+) results/i);
    const resultCount = resultMatch ? parseInt(resultMatch[1].replace(/,/g, '')) : 0;

    const hasAds = html.includes("Ad") || html.includes("Sponsored");

    const titleMatch = new RegExp(`<h3.*?>.*?${keyword}.*?</h3>`, 'i');
    const exactMatchTitle = titleMatch.test(html);

    let score = 0;
    if (resultCount > 1000000) score += 2;
    else if (resultCount > 100000) score += 1;

    if (hasAds) score += 2;
    if (exactMatchTitle) score += 1;

    let difficulty = "Easy";
    if (score >= 4) difficulty = "Hard";
    else if (score >= 2) difficulty = "Medium";

    res.status(200).json({
      keyword,
      resultCount,
      hasAds,
      exactMatchTitle,
      difficulty
    });
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch difficulty", details: e.message });
  }
}
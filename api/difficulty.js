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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });

    const html = await response.text();

    if (!html.includes('About') || html.includes('Our systems have detected unusual traffic')) {
      return res.status(200).json({ keyword, difficulty: "Unknown", error: "Blocked or redirected" });
    }

    const resultMatch = html.match(/About ([\d,]+) results/i);
    const resultCount = resultMatch ? parseInt(resultMatch[1].replace(/,/g, '')) : 0;

    const hasAds = html.includes("Ad") || html.includes("Sponsored");

    const titleMatch = new RegExp(`<h3.*?>.*?${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*?</h3>`, 'i');
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
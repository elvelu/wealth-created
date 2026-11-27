# Wealth Created for Others — The Counter-Forbes Index

> *"Not what they kept. What they built for everyone else."*

An interactive Forbes-inspired editorial index tracking how much **public equity wealth** S&P 500 and Nasdaq-100 founders and builders have generated for outside shareholders (pension funds, 401(k)s, index ETFs, employees, and retail investors) — rather than ranking them only by their personal net worth.

Inspired by **Jeff Bezos's** public-equity thesis and discussed on **David Senra's *Founders* podcast** (with Shopify CEO Tobi Lütke).

---

## Core Formula & Methodology

$$\text{Net Public Wealth Created for Others} = \text{Company Market Cap} - \text{Founder / Team Total Net Worth}$$

Why **Total Net Worth** instead of only remaining direct shares? If a founder sells stock over time and diversifies into other assets (such as Bill Gates's Cascade Investment), subtracting only remaining direct shares artificially inflates their wealth-creation multiplier (`243×` vs. `~29×`). Subtracting total Forbes net worth prevents diversification from inflating multipliers, while a built-in toggle lets visitors compare **Total Net Worth Basis** against **Direct Equity Basis**.

In addition, **Founding Team Bucketing** groups co-founders of the same company (such as Mark Zuckerberg, Eduardo Saverin, and Dustin Moskovitz at Meta) into a single team bucket led by the primary founder — preventing minor co-founders from ranking ahead with inflated multipliers and eliminating company double-counting. An **Individuals** toggle distributes team wealth proportionally by personal net worth/stake.

---

## Features

- **Live Multi-Source Data Pipeline (`scripts/fetch_data.py`):**
  - Cross-references the full **S&P 500** and **Nasdaq-100** universes (merging dual-class shares such as `GOOGL/GOOG` and `BRK.B/BRK.A` so market caps are never double-counted).
  - Matches against all ~3,300+ billionaires on the live **Forbes Real-Time Billionaires** API.
  - Enriches every matched public company with live **Market Cap**, **TTM Revenue**, **Direct Employees**, and **Sector**.
  - Filters out passive investment portfolios, VC holdings, and M&A stock rollovers (transparently documenting them under *Excluded Holdings* in each person's profile drawer).
- **Forbes-Inspired Editorial Interface:**
  - Instant search across people, companies, tickers, sectors, and countries (`/` keyboard shortcut).
  - Role tabs (**Founders**, **Founders & Builders**, **All Index Billionaires**), Index filters (`S&P 500`, `Nasdaq-100`, `Overlap`), and **Full Company vs. Co-Founder Split** mode.
  - Stacked proportional bar charts comparing **Personal Stake Kept** vs. **Wealth Created for Others**.
  - Slide-over profile drawer with exact equity math, Forbes rank delta (`▲` / `▼`), portraits when available, and a 4-layer **Incremental Ripple Effects** breakdown (outside equity, direct workforce, annual revenue output, and consumer surplus).

---

## Local Development

```bash
# Install dependencies
npm install

# Run the dev server
npm run dev

# Refresh live Forbes + S&P 500 / Nasdaq-100 data (Python 3.12 stdlib, no pip packages required)
npm run refresh-data

# Production build
npm run build
```

---

## Daily Automatic Updates (GitHub Actions)

The workflow in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) automatically refreshes the live dataset and redeploys the site every day at **22:00 UTC** (after U.S. market close), or anytime you click **Run workflow** in the repository's **Actions** tab:

1. Runs `python scripts/fetch_data.py` to fetch the latest S&P 500, Nasdaq-100, Forbes Real-Time Billionaires, and StockAnalysis fundamentals.
2. Validates the generated `public/data/wealth-index.json` (falling back safely to the last committed snapshot if an upstream API temporarily errors).
3. Commits updated data to `main` (`[skip ci]`) and builds/deploys the updated static bundle to GitHub Pages.

To enable it on GitHub:
- **Settings → Pages → Build and deployment → Source:** select **GitHub Actions**.
- **Settings → Actions → General → Workflow permissions:** ensure **Read and write permissions** is enabled (requested by `contents: write` in the workflow).

---

## Project Structure

- `scripts/fetch_data.py` — Live data scraper/aggregator generating `public/data/wealth-index.json`
- `public/data/wealth-index.json` — Committed snapshot of the matched & enriched dataset
- `src/App.tsx` — Application shell, filtering, deduplicated KPIs, and deep-link routing
- `src/components/` — Editorial components (`Masthead`, `HeroThesis`, `TopBuildersVisual`, `FilterBar`, `LeaderboardTable`, `PersonDrawer`, `RippleEffectExplainer`, `MethodologySection`, `Footer`)

---

## Disclaimer

For informational and educational purposes only. Public market capitalizations fluctuate daily; personal stakes reflect Forbes Real-Time Billionaires disclosures and beneficial ownership data. Private companies (e.g., Stripe, OpenAI, ByteDance) are excluded from leaderboard rankings due to the lack of continuous public mark-to-market pricing.

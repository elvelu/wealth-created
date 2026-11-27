import { ArrowUpRight } from 'lucide-react';
import { formatSnapshotDate } from '../utils/format';
import type { IndexSummary } from '../types/wealth';

interface FooterProps {
  summary: IndexSummary | null;
}

export function Footer({ summary }: FooterProps) {
  return (
    <footer className="border-t-2 border-[#111111] bg-[#111111] text-neutral-300">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="font-serif text-xl font-bold text-white">WEALTH CREATED</div>
            <p className="mt-2 text-xs leading-relaxed text-neutral-400">
              A counter-Forbes editorial index inspired by Jeff Bezos&apos;s observation — highlighted
              by David Senra &amp; Tobi Lütke on the <em className="text-neutral-200">Founders</em>{' '}
              podcast — measuring public wealth generated for outside shareholders and society.
            </p>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-white">
              Live Data Sources
            </div>
            <ul className="mt-2 space-y-1.5 text-xs text-neutral-400">
              <li>• Forbes Real-Time Billionaires API (holdings &amp; portraits)</li>
              <li>• S&amp;P 500 &amp; Nasdaq-100 constituent lists (Wikipedia &amp; StockAnalysis)</li>
              <li>• StockAnalysis &amp; SEC EDGAR / Yahoo Finance (market cap, revenue, headcount)</li>
            </ul>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-white">
              Open Source &amp; Snapshot
            </div>
            <p className="mt-2 text-xs text-neutral-400">
              Snapshot generated:{' '}
              <span className="font-mono text-neutral-200">
                {formatSnapshotDate(summary?.generatedAt)}
              </span>
            </p>
            <a
              href="https://github.com/elvelu/wealth-created"
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 rounded-sm border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:border-neutral-500 transition-colors"
            >
              View Repository (elvelu/wealth-created)
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        <div className="mt-8 border-t border-neutral-800 pt-5 text-[11px] leading-relaxed text-neutral-500">
          Informational &amp; educational research project. Public market capitalization fluctuates
          continuously; billionaire shareholdings reflect Forbes Real-Time Billionaires disclosures
          and SEC beneficial ownership filings. Not financial advice.
        </div>
      </div>
    </footer>
  );
}

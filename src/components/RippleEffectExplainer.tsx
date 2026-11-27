import { Users, ShoppingBag, Building2, TrendingUp } from 'lucide-react';

export function RippleEffectExplainer() {
  const rings = [
    {
      ring: 'Layer 1 · Direct Public Equity',
      badge: 'Measured Here',
      badgeColor: 'bg-[#0B7A5C]/10 text-[#075942] border-[#0B7A5C]/30',
      icon: TrendingUp,
      title: 'Trillions Held by Outside Shareholders',
      stat: '~$2.4T+ at Amazon alone',
      description:
        'Pension funds, university endowments, sovereign wealth funds, 401(k) retirement accounts, index ETFs, employees, and retail investors own ~90%+ of Amazon — while the founder holds under 10%.',
    },
    {
      ring: 'Layer 2 · Direct Workforce',
      badge: 'Measured Here',
      badgeColor: 'bg-[#0B7A5C]/10 text-[#075942] border-[#0B7A5C]/30',
      icon: Users,
      title: 'Millions of Jobs That Did Not Exist Before',
      stat: '1.5M+ direct employees at Amazon',
      description:
        'Salaries, RSUs, healthcare, and career ladders created from zero. Every direct job also anchors local housing, services, and tax bases across thousands of communities.',
    },
    {
      ring: 'Layer 3 · Third-Party & Ecosystem Output',
      badge: 'Partially Observable',
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-300',
      icon: Building2,
      title: 'Suppliers, Independent Sellers & Cloud Builders',
      stat: '60%+ of Amazon retail is 3P sellers',
      description:
        'Millions of independent merchants, AWS startups, logistics contractors, and chip/equipment suppliers build entire businesses on top of platforms created by these companies.',
    },
    {
      ring: 'Layer 4 · Consumer Surplus & Lower Costs',
      badge: 'Unmeasured Floor',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
      icon: ShoppingBag,
      title: 'Time Saved, Lower Prices & Everyday Utility',
      stat: 'Estimated $100B+ / yr consumer surplus',
      description:
        'In his final 2021 CEO Shareholder Letter, Jeff Bezos estimated Amazon creates more value annually for customers in time and money saved than shareholders capture in market value.',
    },
  ];

  return (
    <section id="ripple-effects" className="border-b border-[#E5E5E0] bg-[#F8F7F4]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0B7A5C]">
            Beyond Market Cap · Incremental Wealth Effects
          </div>
          <h3 className="mt-1.5 font-serif text-3xl font-bold tracking-tight text-[#111111]">
            Why Market Cap Is Only the Tip of the Iceberg
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-[#3F3F3C]">
            Public equity created for outside investors is the cleanest, most auditable number —
            which is why this index ranks builders on it. Yet as Jeff Bezos argued in his 2021
            Shareholder Letter and on the David Senra podcast, public equity value is merely the
            first ring of compounding societal wealth.
          </p>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:items-center">
          {/* Concentric Visual Diagram */}
          <div className="lg:col-span-5">
            <div className="rounded-sm border border-[#E5E5E0] bg-white p-6">
              <div className="text-center text-[11px] font-semibold uppercase tracking-wider text-[#5C5C58]">
                Concentric Wealth Ripple Model (Amazon Walkthrough)
              </div>
              <svg
                viewBox="0 0 360 360"
                className="mx-auto mt-4 w-full max-w-[330px]"
                role="img"
                aria-label="Concentric circles showing Personal Stake, Public Shareholders, Direct Employees, Ecosystem Partners, and Consumer Surplus"
              >
                {/* Ring 4: Consumer Surplus */}
                <circle cx="180" cy="180" r="168" fill="#F8F7F4" stroke="#D4D4CE" strokeDasharray="4 4" strokeWidth="1.5" />
                <text x="180" y="31" textAnchor="middle" className="fill-[#5C5C58] text-[10px] font-semibold uppercase">
                  Consumer Surplus &amp; Time Saved
                </text>

                {/* Ring 3: Ecosystem & Revenue */}
                <circle cx="180" cy="188" r="130" fill="#ECFDF5" stroke="#A7F3D0" strokeWidth="1.5" />
                <text x="180" y="76" textAnchor="middle" className="fill-[#075942] text-[10px] font-semibold uppercase">
                  3P Sellers, Suppliers &amp; Startups
                </text>

                {/* Ring 2: Direct Employees */}
                <circle cx="180" cy="198" r="92" fill="#D1FAE5" stroke="#6EE7B7" strokeWidth="1.5" />
                <text x="180" y="125" textAnchor="middle" className="fill-[#075942] text-[10px] font-semibold uppercase">
                  1.5M+ Jobs &amp; Payrolls
                </text>

                {/* Ring 1: Outside Shareholders */}
                <circle cx="180" cy="210" r="56" fill="#0B7A5C" />
                <text x="180" y="176" textAnchor="middle" className="fill-white text-[10px] font-bold uppercase">
                  ~$2.4T Outside
                </text>
                <text x="180" y="189" textAnchor="middle" className="fill-emerald-100 text-[9px] font-medium">
                  Shareholders
                </text>

                {/* Core: Personal Stake */}
                <circle cx="180" cy="228" r="24" fill="#B45309" stroke="#FFFFFF" strokeWidth="2" />
                <text x="180" y="226" textAnchor="middle" className="fill-white text-[9px] font-bold">
                  ~8–9%
                </text>
                <text x="180" y="236" textAnchor="middle" className="fill-amber-100 text-[8px]">
                  Kept
                </text>
              </svg>
              <p className="mt-3 text-center text-xs text-[#5C5C58]">
                Click any founder in the leaderboard above to inspect their personalized 4-layer
                ripple breakdown.
              </p>
            </div>
          </div>

          {/* 4 Structured Ripple Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
            {rings.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.ring}
                  className="rounded-sm border border-[#E5E5E0] bg-white p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5C5C58]">
                        {item.ring}
                      </span>
                      <span
                        className={`rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold ${item.badgeColor}`}
                      >
                        {item.badge}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-[#F8F7F4] border border-[#E5E5E0] text-[#0B7A5C]">
                        <Icon className="h-4 w-4" />
                      </div>
                      <h4 className="font-serif text-base font-bold text-[#111111] leading-snug">
                        {item.title}
                      </h4>
                    </div>
                    <p className="mt-2.5 text-xs leading-relaxed text-[#5C5C58]">
                      {item.description}
                    </p>
                  </div>
                  <div className="mt-4 border-t border-[#F0EFEA] pt-2.5 font-mono text-xs font-semibold text-[#111111]">
                    {item.stat}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

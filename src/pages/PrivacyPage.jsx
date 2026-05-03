import { Link } from 'react-router-dom';

const CONTACT_EMAIL = 'dinoland+animedashboard@proton.me';

export default function PrivacyPage() {
  return (
    <main
      className="flex-1 w-full px-4 py-8"
      style={{ maxWidth: '740px', margin: '0 auto' }}
    >
      <h1
        className="text-lg font-semibold mb-1"
        style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
      >
        Privacy Policy
      </h1>
      <p className="text-xs mb-8" style={{ color: 'var(--text-muted)' }}>
        Last updated: May 2026
      </p>

      <Section title="1. Overview">
        AniSeasonr is a personal project with no user accounts. You never
        actively submit any information to this site. The only data processing
        that occurs is described below.
      </Section>

      <Section title="2. Browser storage">
        Three keys are written to your browser's localStorage:
        <ul className="flex flex-col gap-1.5 pl-4 mt-2 list-disc">
          <li>
            <code>animepulse-filters-v1</code> — your filter state: season
            range, selected genres, format, and a couple of display toggles.
          </li>
          <li>
            <code>animepulse_welcomed</code> — a single flag recording that you
            have seen the welcome message.
          </li>
          <li>
            <code>animepulse-cache-v2</code> — a 24-hour cache of anime season
            data fetched from AniList. Contains only public content (titles,
            scores, genres); no personal data.
          </li>
        </ul>
        <p className="mt-2">
          Neither key is ever transmitted to a server. No cookies are set by
          this site. Legal basis: legitimate interests (providing the core
          functionality of the site).
        </p>
      </Section>

      <Section title="3. Third-party services">
        <p className="mb-3">
          The following external services are used. Your browser connects
          directly only to Vercel; AniList is accessed via a same-origin proxy
          and never receives your IP address or browser metadata.
        </p>
        <ul className="flex flex-col gap-3 pl-4 list-disc">
          <li>
            <strong style={{ color: 'var(--text-primary)' }}>Vercel</strong> —
            hosts this site. As part of normal hosting, Vercel logs each request
            including your IP address, requested URL, user-agent, and timestamp;
            these logs are retained for up to 30 days. Vercel also provides
            anonymous page-view analytics (URL, referrer, browser, OS, device
            category, and country derived from IP) and Core Web Vitals
            performance monitoring. Legal basis: legitimate interests (secure
            hosting, abuse prevention, and understanding site usage). Vercel is
            US-based; transfers are covered by Standard Contractual Clauses and
            the EU–US Data Privacy Framework. See{' '}
            <ExternalLink href="https://vercel.com/legal/privacy-policy">
              Vercel's Privacy Policy
            </ExternalLink>
            .
          </li>
          <li>
            <strong style={{ color: 'var(--text-primary)' }}>AniList</strong> —
            provides all anime data via its public GraphQL API, routed through a
            same-origin proxy. No personal data is included in those requests.
            See{' '}
            <ExternalLink href="https://anilist.co/terms">
              AniList's Terms
            </ExternalLink>
            .
          </li>
        </ul>
      </Section>

      <Section title="4. Your rights">
        <p>
          If you are in the EEA or UK, you have rights of access, rectification,
          erasure, restriction, portability, and objection under GDPR. To
          exercise them, email{' '}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            style={{ color: 'var(--accent-violet)', textDecoration: 'underline' }}
          >
            {CONTACT_EMAIL}
          </a>
          . For data held by Vercel, contact them directly via their privacy portal.
          You may also lodge a complaint with your national supervisory authority
          ({' '}
          <ExternalLink href="https://www.edpb.europa.eu/about-edpb/about-edpb/members_en">
            EEA list
          </ExternalLink>
          {' '}or the{' '}
          <ExternalLink href="https://ico.org.uk">ICO</ExternalLink> for UK
          residents).
        </p>
      </Section>

      <Section title="5. Contact &amp; changes">
        For any privacy questions, email{' '}
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          style={{ color: 'var(--accent-violet)', textDecoration: 'underline' }}
        >
          {CONTACT_EMAIL}
        </a>
        . If this policy changes materially, the "Last updated" date above will
        be revised.
      </Section>

      <div className="mt-8 pt-4 text-xs" style={{ borderTop: '0.5px solid var(--border)', color: 'var(--text-muted)' }}>
        <Link to="/" style={{ color: 'var(--accent-violet)', textDecoration: 'underline' }}>
          ← Back to AniSeasonr
        </Link>
      </div>
    </main>
  );
}

function Section({ title, children }) {
  return (
    <section className="mb-8">
      <h2
        className="text-sm font-semibold mb-3"
        style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
      >
        {title}
      </h2>
      <div className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)', lineHeight: '1.75' }}>
        {children}
      </div>
    </section>
  );
}

function ExternalLink({ href, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{ color: 'var(--accent-violet)', textDecoration: 'underline' }}
    >
      {children}
    </a>
  );
}

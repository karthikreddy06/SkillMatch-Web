import React, { useState, useEffect } from 'react';

interface SkillDemoPreset {
  category: string;
  skills: { name: string; dotColor: string }[];
  matchRole: {
    title: string;
    distance: string;
    matchPct: number;
    subtext: string;
  };
  altRoles: {
    title: string;
    distance: string;
    matchPct: number;
    subtext: string;
  }[];
}

const DEMO_PRESETS: SkillDemoPreset[] = [
  {
    category: 'Skilled Trades',
    skills: [
      { name: 'Electrician', dotColor: '#F59E0B' },
      { name: 'Maintenance', dotColor: '#3B82F6' },
      { name: 'Safety Protocols', dotColor: '#10B981' },
    ],
    matchRole: {
      title: 'Certified Electrician',
      distance: '5 km away',
      matchPct: 97,
      subtext: 'Commercial & Residential Systems',
    },
    altRoles: [
      { title: 'Facilities Maintenance Tech', distance: '8 km away', matchPct: 92, subtext: 'Site Equipment & Diagnostics' },
      { title: 'Apprentice Specialist', distance: '12 km away', matchPct: 88, subtext: 'Field Installation' },
    ],
  },
  {
    category: 'Culinary & Service',
    skills: [
      { name: 'Cooking', dotColor: '#EF4444' },
      { name: 'Customer Service', dotColor: '#8B5CF6' },
      { name: 'Food Prep', dotColor: '#10B981' },
    ],
    matchRole: {
      title: 'Kitchen Lead',
      distance: '4 km away',
      matchPct: 96,
      subtext: 'High-Volume Kitchen • Day Shift',
    },
    altRoles: [
      { title: 'Restaurant Shift Lead', distance: '7 km away', matchPct: 92, subtext: 'Operations & Service' },
      { title: 'Catering Specialist', distance: '11 km away', matchPct: 87, subtext: 'Event Preparation' },
    ],
  },
  {
    category: 'Logistics & Transport',
    skills: [
      { name: 'Driving', dotColor: '#3B82F6' },
      { name: 'Delivery', dotColor: '#059669' },
      { name: 'Route Planning', dotColor: '#F59E0B' },
    ],
    matchRole: {
      title: 'Route Delivery Specialist',
      distance: '3 km away',
      matchPct: 98,
      subtext: 'Local Transport • Flexible Hours',
    },
    altRoles: [
      { title: 'Fleet Coordinator', distance: '6 km away', matchPct: 93, subtext: 'Route Logistics & Scheduling' },
      { title: 'Warehouse Associate', distance: '10 km away', matchPct: 89, subtext: 'Inventory Staging' },
    ],
  },
  {
    category: 'Sales & Business',
    skills: [
      { name: 'Sales', dotColor: '#6366F1' },
      { name: 'Marketing', dotColor: '#F59E0B' },
      { name: 'Communication', dotColor: '#EC4899' },
    ],
    matchRole: {
      title: 'Account Specialist',
      distance: '6 km away',
      matchPct: 95,
      subtext: 'Client Partnerships • Full-Time',
    },
    altRoles: [
      { title: 'Retail Store Supervisor', distance: '9 km away', matchPct: 90, subtext: 'Customer Care & Sales' },
      { title: 'Business Coordinator', distance: '13 km away', matchPct: 86, subtext: 'Operations & Support' },
    ],
  },
  {
    category: 'Education & Creative',
    skills: [
      { name: 'Teaching', dotColor: '#10B981' },
      { name: 'Design', dotColor: '#8B5CF6' },
      { name: 'Programming', dotColor: '#06B6D4' },
    ],
    matchRole: {
      title: 'Skills Instructor',
      distance: '4 km away',
      matchPct: 96,
      subtext: 'Hands-on Instruction • Weekday Hours',
    },
    altRoles: [
      { title: 'Creative Specialist', distance: '8 km away', matchPct: 91, subtext: 'Brand & Visual Assets' },
      { title: 'Technical Educator', distance: '12 km away', matchPct: 88, subtext: 'Practical Workshops' },
    ],
  },
];

export const SkillMatchScene: React.FC = () => {
  const [presetIndex, setPresetIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [percentage, setPercentage] = useState(74);

  const currentPreset = DEMO_PRESETS[presetIndex];

  // Rotate presets every 3.8 seconds smoothly
  useEffect(() => {
    const cycleInterval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setPresetIndex((prev) => (prev + 1) % DEMO_PRESETS.length);
        setIsFading(false);
      }, 350);
    }, 3800);

    return () => clearInterval(cycleInterval);
  }, []);

  // Smooth percentage counter to target match percentage
  useEffect(() => {
    setPercentage(76);
    const target = currentPreset.matchRole.matchPct;
    let current = 76;

    const timer = setInterval(() => {
      current += 2;
      if (current >= target) {
        setPercentage(target);
        clearInterval(timer);
      } else {
        setPercentage(current);
      }
    }, 45);

    return () => clearInterval(timer);
  }, [presetIndex, currentPreset.matchRole.matchPct]);

  return (
    <div className="unboxed-scene-stage" id="skillmatch-cinematic-scene">
      {/* Concentric Distance Geometry lines without labels */}
      <div className="scene-geom-wrapper">
        <div className="geom-circle circle-5km geom-active" />
        <div className="geom-circle circle-10km geom-active" />
        <div className="geom-circle circle-15km geom-active" />
        <div className="geom-radar-pulse pulse-running" />
      </div>

      {/* Dynamic SVG Connecting Vectors */}
      <svg className="unboxed-svg-vectors" viewBox="0 0 1100 520" preserveAspectRatio="none">
        <defs>
          <linearGradient id="studioBeamGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#2563EB" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        {/* Left Skills -> Center AI Hub (550, 270) */}
        <path d="M 230 150 C 330 170, 440 220, 550 270" className="vector-base" />
        <path d="M 230 150 C 330 170, 440 220, 550 270" className="vector-active" />

        <path d="M 210 270 C 310 270, 430 270, 550 270" className="vector-base" />
        <path d="M 210 270 C 310 270, 430 270, 550 270" className="vector-active" style={{ animationDelay: '0.6s' }} />

        <path d="M 230 390 C 330 370, 440 320, 550 270" className="vector-base" />
        <path d="M 230 390 C 330 370, 440 320, 550 270" className="vector-active" style={{ animationDelay: '1.2s' }} />

        {/* Center AI Hub (550, 270) -> Right Opportunities */}
        <path d="M 550 270 C 660 220, 770 170, 860 150" className="vector-base" />
        <path d="M 550 270 C 660 220, 770 170, 860 150" className="vector-active vector-hero-match" style={{ animationDelay: '0.4s' }} />

        <path d="M 550 270 C 670 270, 780 280, 870 280" className="vector-base" />
        <path d="M 550 270 C 670 270, 780 280, 870 280" className="vector-active" style={{ animationDelay: '1.4s' }} />

        <path d="M 550 270 C 660 320, 760 380, 850 410" className="vector-base" />
        <path d="M 550 270 C 660 320, 760 380, 850 410" className="vector-active" style={{ animationDelay: '2.1s' }} />
      </svg>

      {/* LEFT SIDE: Generic User Skills (Rotating 2-3 examples) */}
      <div className={`demo-skills-cluster ${isFading ? 'cluster-fading' : ''}`}>
        <div className="cluster-header-label">
          <span>YOUR SKILLS</span>
          <div className="cluster-sub-note">
            Whatever skills you have
          </div>
        </div>

        {currentPreset.skills.map((skill, i) => (
          <div
            key={`${presetIndex}-${skill.name}`}
            className={`floating-skill-chip skill-slot-${i}`}
          >
            <span
              className="chip-dot"
              style={{ background: skill.dotColor, boxShadow: `0 0 8px ${skill.dotColor}88` }}
            />
            <span className="chip-text">{skill.name}</span>
          </div>
        ))}
      </div>

      {/* CENTER: THE AI MATCHING ENGINE & 96% MATCH HERO */}
      <div className="center-match-hero hero-matched">
        <div className="hero-hub-eyebrow">
          <span className="hub-pulse-dot" />
          <span>AI MATCHING ENGINE</span>
        </div>

        <div className="hero-percentage-display">
          <span className="pct-number">{percentage}%</span>
          <span className="pct-label">MATCH SCORE</span>
        </div>

        <div className="hero-breakdown-row">
          <div className="breakdown-metric">
            <span className="metric-label">Skill Fit</span>
            <span className="metric-value">98%</span>
          </div>
          <span className="metric-divider" />
          <div className="breakdown-metric">
            <span className="metric-label">Location Fit</span>
            <span className="metric-value">94%</span>
          </div>
          <span className="metric-divider" />
          <div className="breakdown-metric">
            <span className="metric-label">Overall Match</span>
            <span className="metric-value green-val">{percentage}%</span>
          </div>
        </div>

        <div className="hub-location-indicator loc-active">
          <span>NEARBY OPPORTUNITIES • COMMUTE RADIUS</span>
        </div>
      </div>

      {/* RIGHT SIDE: Corresponding Demonstration Opportunities */}
      <div className={`demo-opportunities-cluster ${isFading ? 'cluster-fading' : ''}`}>
        <div className="cluster-header-label label-right">
          <span>NEARBY OPPORTUNITIES</span>
          <div className="cluster-sub-note" style={{ textAlign: 'right' }}>
            Matched by skills & distance
          </div>
        </div>

        {/* Top Opportunity (Hero Match) */}
        <div className="opp-pill-node opp-top opp-visible opp-highlighted">
          <div className="opp-meta-line">
            <span className="opp-dist">{currentPreset.matchRole.distance}</span>
            <span className="opp-tag">{currentPreset.matchRole.matchPct}% Match</span>
          </div>
          <div className="opp-title-text">{currentPreset.matchRole.title}</div>
          <div className="opp-sub-text">{currentPreset.matchRole.subtext}</div>
        </div>

        {/* Alt Opportunities */}
        {currentPreset.altRoles.map((role, i) => (
          <div
            key={`${presetIndex}-${role.title}`}
            className={`opp-pill-node opp-${i === 0 ? 'mid' : 'bot'} opp-visible`}
          >
            <div className="opp-meta-line">
              <span className="opp-dist">{role.distance}</span>
              <span className={`opp-tag ${i === 0 ? 'tag-blue' : 'tag-slate'}`}>
                {role.matchPct}% Match
              </span>
            </div>
            <div className="opp-title-text">{role.title}</div>
            <div className="opp-sub-text">{role.subtext}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

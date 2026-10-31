import { Opportunity } from '../types';

export const SAMPLE_OPPORTUNITIES: Opportunity[] = [
  {
    id: 'opp-1',
    title: 'AI Research Fellowship 2026',
    company: 'Anthropic',
    category: 'Fellowship',
    location: 'San Francisco, CA',
    workType: 'Hybrid',
    stipendOrSalary: '$110,000 / year stipend',
    deadline: '2026-12-15',
    description: 'Work alongside leading alignment and interpretability researchers on frontier language model safety and mechanistic interpretability.',
    requirements: [
      'Strong proficiency in Python and PyTorch / JAX',
      'Demonstrated research curiosity in deep learning or alignment',
      'Strong analytical reasoning and publication or open-source track record'
    ],
    tags: ['Machine Learning', 'AI Safety', 'Research', 'PyTorch'],
    featured: true
  },
  {
    id: 'opp-2',
    title: 'Software Engineering Internship - Systems',
    company: 'Stripe',
    category: 'Internship',
    location: 'Seattle, WA',
    workType: 'Hybrid',
    stipendOrSalary: '$58 / hour + housing stipend',
    deadline: '2026-11-30',
    description: 'Build mission-critical distributed payment infrastructure handling billions of dollars in global commerce across 195+ countries.',
    requirements: [
      'Currently enrolled in BS, MS, or PhD in Computer Science or related field',
      'Solid command of data structures, algorithms, and concurrency',
      'Experience with Go, Java, Ruby, or Rust'
    ],
    tags: ['Distributed Systems', 'Go', 'Infrastructure', 'Fintech'],
    featured: true
  },
  {
    id: 'opp-3',
    title: 'Global Climate Tech Innovation Grant',
    company: 'Breakthrough Energy',
    category: 'Grant',
    location: 'Remote (Worldwide)',
    workType: 'Remote',
    stipendOrSalary: '$75,000 equity-free grant',
    deadline: '2027-01-20',
    description: 'Catalytic non-dilutive funding for early-stage technologists, scientists, and software builders tackling gigaton-scale carbon removal.',
    requirements: [
      'Validated technological hypothesis with initial prototype or computational model',
      'Clear roadmap for greenhouse gas mitigation verification',
      'Open to solo builders and small teams under 5 members'
    ],
    tags: ['Climate Tech', 'Grant', 'Clean Energy', 'Sustainability'],
    featured: true
  },
  {
    id: 'opp-4',
    title: 'Product Design & UX Apprenticeship',
    company: 'Figma',
    category: 'Internship',
    location: 'New York, NY',
    workType: 'Hybrid',
    stipendOrSalary: '$52 / hour + relocation assistance',
    deadline: '2026-12-01',
    description: 'Collaborate with the Core Canvas and Community product teams to design next-generation collaborative workflows for millions of creators.',
    requirements: [
      'Compelling design portfolio showcasing systems thinking and UI polish',
      'Deep fluency with Figma component architectures and auto-layout',
      'User research and interactive prototyping capabilities'
    ],
    tags: ['Product Design', 'UI/UX', 'Figma', 'Prototyping'],
    featured: false
  },
  {
    id: 'opp-5',
    title: 'NextGen Quantum Computing Fellowship',
    company: 'MIT & IBM Quantum',
    category: 'Fellowship',
    location: 'Cambridge, MA',
    workType: 'On-site',
    stipendOrSalary: '$95,000 / year + research budget',
    deadline: '2027-02-15',
    description: 'Join an interdisciplinary cohort developing quantum error correction protocols and quantum simulation algorithms on superconducting qubit hardware.',
    requirements: [
      'Background in Physics, Mathematics, Quantum Engineering, or Computer Science',
      'Familiarity with Qiskit, Cirq, or Pennylane',
      'Prior linear algebra and quantum mechanics foundations'
    ],
    tags: ['Quantum Computing', 'Physics', 'Qiskit', 'Research'],
    featured: false
  },
  {
    id: 'opp-6',
    title: 'Future Leaders in STEM Women’s Scholarship',
    company: 'Ada Lovelace Foundation',
    category: 'Scholarship',
    location: 'Global (Virtual)',
    workType: 'Remote',
    stipendOrSalary: '$25,000 tuition grant + 1:1 Executive Mentorship',
    deadline: '2026-11-25',
    description: 'Merit-based scholarship designed to elevate underrepresented women pursuing degrees or technical bootcamps in computing, robotics, and cybernetics.',
    requirements: [
      'Self-identifying woman enrolled in an accredited higher education STEM degree or intensive academy',
      'Demonstrated commitment to community leadership or mentoring',
      'Personal essay detailing technical vision and future career impact'
    ],
    tags: ['Scholarship', 'Diversity in Tech', 'Mentorship', 'STEM'],
    featured: true
  },
  {
    id: 'opp-7',
    title: 'Full-Stack Software Engineer (Early Career)',
    company: 'Vercel',
    category: 'Full-Time',
    location: 'Remote (US/EU)',
    workType: 'Remote',
    stipendOrSalary: '$140,000 - $175,000 + Equity',
    deadline: '2026-12-31',
    description: 'Help engineer the web’s developer cloud platform. Build developer tool interfaces, Edge Middleware runtimes, and developer preview systems.',
    requirements: [
      '0-3 years professional experience with TypeScript, React, and server-side rendering',
      'Understanding of Web Standards, HTTP caching, and edge computing',
      'Passion for developer experience, web performance, and developer tooling'
    ],
    tags: ['TypeScript', 'Next.js', 'React', 'Full-Stack'],
    featured: false
  },
  {
    id: 'opp-8',
    title: 'Open Source Security Research Grant',
    company: 'OpenSSF',
    category: 'Grant',
    location: 'Remote',
    workType: 'Remote',
    stipendOrSalary: '$40,000 project grant',
    deadline: '2027-01-10',
    description: 'Dedicated financial support for independent security researchers identifying vulnerabilities in critical open-source software libraries and package ecosystems.',
    requirements: [
      'Experience in static analysis, fuzzing, or dependency supply-chain auditing',
      'Commitment to responsible disclosure and public remediation',
      'Demonstrated understanding of SBOMs, package managers (npm, PyPI, crates)'
    ],
    tags: ['Cybersecurity', 'Open Source', 'Vulnerability Research'],
    featured: false
  }
];

export const CATEGORIES = ['All', 'Internship', 'Full-Time', 'Fellowship', 'Scholarship', 'Grant'] as const;
export const WORK_TYPES = ['All', 'Remote', 'Hybrid', 'On-site'] as const;

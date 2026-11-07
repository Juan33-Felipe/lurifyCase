import {
  AuditReport,
  Case,
  CaseList,
  CanvasSnapshot,
} from '../types/api.types';

export const mockCases: Case[] = [
  {
    id: 'case-001',
    title: 'State v. Sterling Industries',
    description:
      'Federal antitrust & corporate environmental liability proceeding regarding alleged toxic byproduct dumping in the 9th Judicial Circuit.',
    clientReference: '#882-CR-2026',
    status: 'ACTIVE',
    canvasVersion: 8,
    createdAt: '2026-10-12T09:00:00Z',
    updatedAt: '2026-10-19T08:30:00Z',
  },
  {
    id: 'case-002',
    title: 'Vance Corp v. Apex Logistics',
    description:
      'Commercial contract breach and cross-border supply chain tort claims involving expedited freight deliveries.',
    clientReference: '#2025-CV-1104',
    status: 'ACTIVE',
    canvasVersion: 4,
    createdAt: '2026-09-15T11:20:00Z',
    updatedAt: '2026-10-18T16:45:00Z',
  },
  {
    id: 'case-003',
    title: 'In re Horizon BioTech Patent Litigation',
    description:
      'Patent infringement defense under 35 U.S.C. § 271 concerning CRISPR gene sequence extraction algorithms.',
    clientReference: '#2024-PT-901',
    status: 'ACTIVE',
    canvasVersion: 12,
    createdAt: '2026-08-01T14:10:00Z',
    updatedAt: '2026-10-17T10:15:00Z',
  },
  {
    id: 'case-004',
    title: 'Commonwealth v. Miller',
    description:
      'Criminal defense proceeding concerning chain of custody discrepancies on digital cellular telemetry.',
    clientReference: '#2025-CR-044',
    status: 'ARCHIVED',
    canvasVersion: 6,
    createdAt: '2026-05-10T08:00:00Z',
    updatedAt: '2026-09-20T12:00:00Z',
  },
];

export const mockCaseList: CaseList = {
  items: mockCases,
  page: {
    hasMore: false,
  },
};

export const mockCanvasSnapshots: Record<string, CanvasSnapshot> = {
  'case-001': {
    caseId: 'case-001',
    version: 8,
    updatedAt: '2026-10-19T08:30:00Z',
    canvas: {
      nodes: [
        {
          id: 'node-101',
          type: 'EVIDENCE',
          title: 'Exhibit D — Cell Tower Telemetry',
          content:
            'Antenna telemetry places executive device within 400m of Pier 4 at 11:42 PM, admissible under FRE 803(6).',
          position: { x: 100, y: 150 },
          origin: 'AI_GENERATED',
          userModified: true,
        },
        {
          id: 'node-102',
          type: 'FACT',
          title: 'Pier 4 Unscheduled Vessel Docking',
          content:
            'Security logs indicate an unregistered freighter berthed at Pier 4 during the late-night maintenance window.',
          position: { x: 220, y: 150 },
          origin: 'USER_CREATED',
          userModified: true,
        },
        {
          id: 'node-103',
          type: 'LAW',
          title: 'FRE 803(6) Records of Regularly Conducted Activity',
          content:
            'Exception to the rule against hearsay for certified memorandum, report, or data compilation made in the regular course of business.',
          position: { x: 100, y: 280 },
          origin: 'AI_GENERATED',
          userModified: false,
        },
        {
          id: 'node-104',
          type: 'JURISPRUDENCE',
          title: 'United States v. Carpenter (2018)',
          content:
            'Expectation of privacy in historical cell-site location information (CSLI) requires a Fourth Amendment warrant exception analysis.',
          position: { x: 250, y: 280 },
          origin: 'AI_GENERATED',
          userModified: false,
        },
      ],
      edges: [
        {
          id: 'edge-1',
          source: 'node-101',
          target: 'node-102',
          relationshipType: 'SUPPORTS',
          origin: 'AI_GENERATED',
          userModified: false,
        },
        {
          id: 'edge-2',
          source: 'node-103',
          target: 'node-101',
          relationshipType: 'APPLIES_TO',
          origin: 'AI_GENERATED',
          userModified: false,
        },
        {
          id: 'edge-3',
          source: 'node-104',
          target: 'node-101',
          relationshipType: 'INTERPRETS',
          origin: 'AI_GENERATED',
          userModified: false,
        },
      ],
    },
  },
  'case-002': {
    caseId: 'case-002',
    version: 4,
    updatedAt: '2026-10-18T16:45:00Z',
    canvas: {
      nodes: [
        {
          id: 'node-201',
          type: 'FACT',
          title: 'Notice of Default Served',
          content: 'Formal notice served via certified international courier on August 14, 2026.',
          position: { x: 100, y: 100 },
          origin: 'USER_CREATED',
          userModified: false,
        },
        {
          id: 'node-202',
          type: 'EVIDENCE',
          title: 'B/L #9098-C Bill of Lading',
          content: 'Manifest records clean on-board endorsement despite transit temperature excursions.',
          position: { x: 200, y: 100 },
          origin: 'AI_GENERATED',
          userModified: false,
        },
      ],
      edges: [
        {
          id: 'edge-201',
          source: 'node-202',
          target: 'node-201',
          relationshipType: 'SUPPORTS',
          origin: 'AI_GENERATED',
          userModified: false,
        },
      ],
    },
  },
};

export const mockAuditReports: Record<string, AuditReport> = {
  'case-001': {
    auditId: 'audit-001',
    caseId: 'case-001',
    canvasVersion: 8,
    generatedAt: '2026-10-19T08:35:00Z',
    alerts: [
      {
        id: 'alert-1',
        severity: 'HIGH',
        type: 'PROCEDURAL_GAP',
        title: 'Unreconciled 48-Hour Telemetry Gap',
        description:
          'Deposition timeline of Exhibit D contains a 48-hour gap unreconciled with the defendant cellular tower records between Oct 10 and Oct 12.',
        recommendation:
          'Subpoena supplemental CDR records from telecom carrier for tower node #09B or move for an in camera evidentiary review.',
        relatedNodeIds: ['node-101'],
        relatedEdgeIds: ['edge-1'],
      },
      {
        id: 'alert-2',
        severity: 'MEDIUM',
        type: 'LOGICAL_CONTRADICTION',
        title: 'Contradiction in Witness Statements',
        description:
          'Cross-statement divergence between Harbor Master deposition and Exhibit D timestamp regarding docking clearances at Pier 4.',
        recommendation:
          'Conduct mock cross-examination to isolate perceptual conflict before evidentiary motion deadline.',
        relatedNodeIds: ['node-101', 'node-102'],
        relatedEdgeIds: ['edge-1'],
      },
      {
        id: 'alert-3',
        severity: 'LOW',
        type: 'CASE_THEORY_WEAKNESS',
        title: 'Hearsay Foundation Advisory',
        description:
          'Witness custodian affidavit requires formal 14-day pre-trial declaration notice under FRE 902(11) self-authentication rules.',
        recommendation:
          'File notice of intent to offer certified domestic records of a regularly conducted activity before pre-trial docket call.',
        relatedNodeIds: ['node-103'],
        relatedEdgeIds: ['edge-2'],
      },
    ],
  },
};

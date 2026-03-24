import type { QuizEnginePayload } from "@/types";

export const mockQuizEnginePayload: QuizEnginePayload = {
  tenantId: "tenant_mvp_security",
  locale: "en-US",
  version: "2026.03.24",
  fetchedAt: "2026-03-24T17:45:00.000Z",
  quiz: {
    id: "quiz_cyber_it_core",
    title: "Cybersecurity & IT Risk Assessment",
    description:
      "A scenario-driven baseline assessment to identify operational security gaps across infrastructure and response workflows.",
    estimatedDurationMinutes: 18,
    passingScore: 70,
    sections: [
      {
        id: "sec_network_and_identity",
        title: "Perimeter & Access Controls",
        description:
          "Evaluate exposure in network boundaries and identity governance.",
        weight: 0.35,
        questions: [
          {
            id: "q_network_001",
            text: "How is remote administrative access to internal systems protected?",
            category: "Network Security",
            objective: "Validate secure remote access architecture.",
            options: [
              {
                id: "q_network_001_opt_a",
                label: "A",
                text: "VPN + MFA + source IP allowlisting with quarterly reviews.",
                riskPoints: 0,
                explanation:
                  "Layered controls and regular audits indicate mature access hygiene.",
                tags: ["vpn", "mfa", "allowlist", "audit"],
              },
              {
                id: "q_network_001_opt_b",
                label: "B",
                text: "VPN with password-only login and annual policy checks.",
                riskPoints: 3,
                explanation:
                  "Baseline control exists, but authentication strength is limited.",
                tags: ["vpn", "password-auth"],
              },
              {
                id: "q_network_001_opt_c",
                label: "C",
                text: "Public SSH/RDP endpoints with strong passwords.",
                riskPoints: 7,
                explanation:
                  "Direct exposure significantly increases brute-force and credential risks.",
                tags: ["rdp", "ssh", "public-exposure"],
              },
              {
                id: "q_network_001_opt_d",
                label: "D",
                text: "No formal control; admins connect directly as needed.",
                riskPoints: 10,
                explanation:
                  "Unmanaged privileged access creates critical compromise paths.",
                tags: ["no-control", "privileged-access"],
              },
            ],
          },
          {
            id: "q_iam_001",
            text: "Which policy best describes how privileged accounts are managed?",
            category: "Identity & Access Management",
            objective: "Measure least-privilege and account lifecycle discipline.",
            options: [
              {
                id: "q_iam_001_opt_a",
                label: "A",
                text: "PAM workflow, JIT elevation, and auto-expiring admin roles.",
                riskPoints: 0,
                explanation:
                  "Strong privilege governance with time-bound access minimizes abuse windows.",
                tags: ["pam", "jit", "least-privilege"],
              },
              {
                id: "q_iam_001_opt_b",
                label: "B",
                text: "Role-based groups with manual quarterly entitlement review.",
                riskPoints: 3,
                explanation:
                  "Reasonable control posture, but relies on manual enforcement.",
                tags: ["rbac", "manual-review"],
              },
              {
                id: "q_iam_001_opt_c",
                label: "C",
                text: "Shared admin accounts are used for operational convenience.",
                riskPoints: 8,
                explanation:
                  "Shared credentials remove accountability and hinder forensic tracing.",
                tags: ["shared-accounts", "audit-gap"],
              },
              {
                id: "q_iam_001_opt_d",
                label: "D",
                text: "No formal process; permissions are granted permanently.",
                riskPoints: 10,
                explanation:
                  "Permanent over-privilege materially increases blast radius.",
                tags: ["over-privileged", "no-process"],
              },
            ],
          },
          {
            id: "q_iam_002",
            text: "How quickly are user accounts deprovisioned after employee exit?",
            category: "Identity & Access Management",
            objective: "Assess account offboarding response time.",
            options: [
              {
                id: "q_iam_002_opt_a",
                label: "A",
                text: "Automated within minutes through HRIS + IdP integration.",
                riskPoints: 0,
                explanation:
                  "Automated deprovisioning strongly reduces orphaned account risk.",
                tags: ["offboarding", "idp", "automation"],
              },
              {
                id: "q_iam_002_opt_b",
                label: "B",
                text: "Completed within 24 hours through an IT ticket flow.",
                riskPoints: 2,
                explanation:
                  "Generally acceptable but still leaves a limited abuse window.",
                tags: ["offboarding", "ticketing"],
              },
              {
                id: "q_iam_002_opt_c",
                label: "C",
                text: "Performed during weekly IT cleanup cycles.",
                riskPoints: 7,
                explanation:
                  "Delayed offboarding leaves active credentials for multiple days.",
                tags: ["delay", "orphaned-accounts"],
              },
              {
                id: "q_iam_002_opt_d",
                label: "D",
                text: "No standard timeline; done when noticed.",
                riskPoints: 10,
                explanation:
                  "Inconsistent deprovisioning creates high insider and takeover risk.",
                tags: ["no-sla", "identity-risk"],
              },
            ],
          },
        ],
      },
      {
        id: "sec_endpoint_and_cloud",
        title: "Device & Cloud Hardening",
        description:
          "Review endpoint baselines and cloud control maturity for production workloads.",
        weight: 0.4,
        questions: [
          {
            id: "q_endpoint_001",
            text: "What is your current endpoint protection posture for employee devices?",
            category: "Endpoint Security",
            objective:
              "Evaluate malware prevention, visibility, and response readiness.",
            options: [
              {
                id: "q_endpoint_001_opt_a",
                label: "A",
                text: "EDR with tamper protection, centralized policies, and alert triage.",
                riskPoints: 0,
                explanation:
                  "Comprehensive endpoint controls provide strong prevention and detection.",
                tags: ["edr", "policy", "telemetry"],
              },
              {
                id: "q_endpoint_001_opt_b",
                label: "B",
                text: "Managed antivirus and periodic manual health checks.",
                riskPoints: 4,
                explanation:
                  "Basic protection exists, but threat visibility is limited.",
                tags: ["antivirus", "baseline"],
              },
              {
                id: "q_endpoint_001_opt_c",
                label: "C",
                text: "Local antivirus only, managed by each employee.",
                riskPoints: 8,
                explanation:
                  "Decentralized configuration introduces inconsistent defense quality.",
                tags: ["decentralized", "policy-drift"],
              },
              {
                id: "q_endpoint_001_opt_d",
                label: "D",
                text: "No standardized endpoint protection program.",
                riskPoints: 10,
                explanation:
                  "Unprotected endpoints are a common initial compromise vector.",
                tags: ["no-standard", "high-exposure"],
              },
            ],
          },
          {
            id: "q_cloud_001",
            text: "How are production cloud resources segmented and access-controlled?",
            category: "Cloud Security",
            objective: "Measure cloud network isolation and IAM boundaries.",
            options: [
              {
                id: "q_cloud_001_opt_a",
                label: "A",
                text: "Private subnets, security groups, and least-privilege IAM roles by environment.",
                riskPoints: 0,
                explanation:
                  "Strong segmentation and scoped permissions reduce lateral movement risk.",
                tags: ["private-subnet", "security-groups", "iam"],
              },
              {
                id: "q_cloud_001_opt_b",
                label: "B",
                text: "Mixed subnet strategy with some broad service roles.",
                riskPoints: 4,
                explanation:
                  "Partial hardening exists, but broad permissions expand impact.",
                tags: ["partial-segmentation", "broad-roles"],
              },
              {
                id: "q_cloud_001_opt_c",
                label: "C",
                text: "Flat network and shared high-privilege service accounts.",
                riskPoints: 8,
                explanation:
                  "Weak boundaries increase privilege escalation and pivot opportunities.",
                tags: ["flat-network", "shared-service-account"],
              },
              {
                id: "q_cloud_001_opt_d",
                label: "D",
                text: "No formal segmentation or IAM governance in cloud environments.",
                riskPoints: 10,
                explanation:
                  "Missing cloud controls create severe exposure for production assets.",
                tags: ["no-governance", "critical-risk"],
              },
            ],
          },
          {
            id: "q_cloud_002",
            text: "How are cloud configuration drift and misconfigurations detected?",
            category: "Cloud Security",
            objective: "Assess continuous assurance and security visibility.",
            options: [
              {
                id: "q_cloud_002_opt_a",
                label: "A",
                text: "Continuous CSPM scans with policy-as-code and ticket auto-remediation.",
                riskPoints: 0,
                explanation:
                  "Continuous monitoring and automated workflows strongly lower misconfiguration dwell time.",
                tags: ["cspm", "policy-as-code", "automation"],
              },
              {
                id: "q_cloud_002_opt_b",
                label: "B",
                text: "Daily scans with manual remediation assignment.",
                riskPoints: 3,
                explanation:
                  "Good visibility but operational latency can delay risk reduction.",
                tags: ["scheduled-scan", "manual-remediation"],
              },
              {
                id: "q_cloud_002_opt_c",
                label: "C",
                text: "Quarterly review based on audit checklist.",
                riskPoints: 7,
                explanation:
                  "Infrequent checks allow misconfigurations to persist in production.",
                tags: ["periodic-audit", "long-exposure-window"],
              },
              {
                id: "q_cloud_002_opt_d",
                label: "D",
                text: "No active monitoring for cloud security misconfigurations.",
                riskPoints: 10,
                explanation:
                  "Undetected drift significantly increases the chance of breach.",
                tags: ["no-monitoring", "blind-spot"],
              },
            ],
          },
        ],
      },
      {
        id: "sec_detection_and_response",
        title: "Detection & Incident Readiness",
        description:
          "Measure organizational capability to detect, contain, and recover from cyber incidents.",
        weight: 0.25,
        questions: [
          {
            id: "q_network_002",
            text: "How is east-west traffic monitored inside your internal network?",
            category: "Network Security",
            objective:
              "Evaluate lateral movement detection coverage and telemetry depth.",
            options: [
              {
                id: "q_network_002_opt_a",
                label: "A",
                text: "NDR deployed with anomaly detection and SOC investigation playbooks.",
                riskPoints: 0,
                explanation:
                  "Advanced visibility and documented workflows improve containment speed.",
                tags: ["ndr", "soc", "anomaly-detection"],
              },
              {
                id: "q_network_002_opt_b",
                label: "B",
                text: "Firewall and flow logs are reviewed weekly.",
                riskPoints: 4,
                explanation:
                  "Some observability exists, but review cadence is too slow for active threats.",
                tags: ["flow-logs", "weekly-review"],
              },
              {
                id: "q_network_002_opt_c",
                label: "C",
                text: "Limited logging with no correlation across systems.",
                riskPoints: 8,
                explanation:
                  "Fragmented telemetry makes early lateral movement detection unlikely.",
                tags: ["limited-logging", "no-correlation"],
              },
              {
                id: "q_network_002_opt_d",
                label: "D",
                text: "Internal traffic is not monitored.",
                riskPoints: 10,
                explanation:
                  "No visibility into internal movement creates critical detection blind spots.",
                tags: ["no-monitoring", "lateral-risk"],
              },
            ],
          },
          {
            id: "q_ir_001",
            text: "Which statement best matches your incident response capability?",
            category: "Incident Response",
            objective: "Measure preparedness, ownership, and response execution.",
            options: [
              {
                id: "q_ir_001_opt_a",
                label: "A",
                text: "Documented IR runbooks, clear RACI, and biannual tabletop exercises.",
                riskPoints: 0,
                explanation:
                  "Practiced plans and ownership significantly improve incident outcomes.",
                tags: ["runbook", "tabletop", "governance"],
              },
              {
                id: "q_ir_001_opt_b",
                label: "B",
                text: "Basic incident checklist with ad-hoc role assignment.",
                riskPoints: 4,
                explanation:
                  "Some structure exists, but unclear ownership can delay response.",
                tags: ["checklist", "ad-hoc"],
              },
              {
                id: "q_ir_001_opt_c",
                label: "C",
                text: "No tested process; team coordinates informally during incidents.",
                riskPoints: 8,
                explanation:
                  "Untested process increases confusion and containment delays.",
                tags: ["untested", "informal-process"],
              },
              {
                id: "q_ir_001_opt_d",
                label: "D",
                text: "No defined incident response plan.",
                riskPoints: 10,
                explanation:
                  "Lack of planning creates major business continuity and recovery risk.",
                tags: ["no-ir-plan", "critical-readiness-gap"],
              },
            ],
          },
        ],
      },
    ],
  },
  experts: [
    {
      id: "exp_ana_khan",
      fullName: "Ana Khan",
      role: "Principal Security Architect",
      organization: "Sentinel Forge",
      yearsExperience: 12,
      specialties: ["Network Security", "Cloud Security"],
      certifications: ["CISSP", "CCSP", "AWS Security Specialty"],
      languages: ["English", "Urdu"],
      timezone: "Asia/Karachi",
      rating: 4.9,
      hourlyRateUsd: 180,
      nextAvailableAt: "2026-03-25T09:30:00+05:00",
      bio: "Designs zero-trust architectures for scaling startups and regulated teams.",
    },
    {
      id: "exp_daniel_cho",
      fullName: "Daniel Cho",
      role: "Incident Response Lead",
      organization: "BlueTrace Labs",
      yearsExperience: 10,
      specialties: ["Incident Response", "Endpoint Security"],
      certifications: ["GCFA", "GCIH", "CISM"],
      languages: ["English", "Korean"],
      timezone: "UTC",
      rating: 4.8,
      hourlyRateUsd: 165,
      nextAvailableAt: "2026-03-24T16:00:00Z",
      bio: "Helps teams build detection pipelines and response playbooks that work under pressure.",
    },
    {
      id: "exp_sofia_ramirez",
      fullName: "Sofia Ramirez",
      role: "IAM Program Consultant",
      organization: "AccessGrid Advisory",
      yearsExperience: 9,
      specialties: ["Identity & Access Management", "Cloud Security"],
      certifications: ["CISA", "AZ-500", "SC-100"],
      languages: ["English", "Spanish"],
      timezone: "America/New_York",
      rating: 4.7,
      hourlyRateUsd: 150,
      nextAvailableAt: "2026-03-25T11:00:00-04:00",
      bio: "Specializes in access lifecycle automation and privileged identity transformations.",
    },
  ],
  sampleAssessmentResult: {
    assessmentId: "asmt_demo_20260324_001",
    submittedAt: "2026-03-24T18:10:00.000Z",
    totalRiskPoints: 31,
    normalizedScore: 62,
    riskLevel: "high",
    categoryBreakdown: [
      {
        category: "Network Security",
        riskPoints: 8,
        maxRiskPoints: 20,
        riskLevel: "moderate",
      },
      {
        category: "Identity & Access Management",
        riskPoints: 10,
        maxRiskPoints: 20,
        riskLevel: "high",
      },
      {
        category: "Endpoint Security",
        riskPoints: 4,
        maxRiskPoints: 10,
        riskLevel: "moderate",
      },
      {
        category: "Cloud Security",
        riskPoints: 7,
        maxRiskPoints: 20,
        riskLevel: "moderate",
      },
      {
        category: "Incident Response",
        riskPoints: 2,
        maxRiskPoints: 10,
        riskLevel: "low",
      },
    ],
    strengths: [
      "Consistent endpoint monitoring baseline.",
      "Documented incident management ownership.",
    ],
    priorityActions: [
      "Introduce JIT privilege elevation for all admin roles.",
      "Automate account deprovisioning through IdP lifecycle hooks.",
      "Increase cloud misconfiguration scanning cadence to continuous.",
    ],
    recommendedExpertIds: ["exp_sofia_ramirez", "exp_ana_khan"],
  },
};

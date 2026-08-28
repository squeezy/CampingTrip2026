#!/usr/bin/env node
/**
 * Main Test Runner for CampingTrip E2E Test Suite
 * Executes all test suites across Tiers 1-4, aggregates results, prints breakdowns,
 * and exits with code 0 on complete pass, or non-zero on failure.
 */

const calculationsSuite = require('./test_calculations');
const dataIntegritySuite = require('./test_data_integrity');
const domStructureSuite = require('./test_dom_structure');
const syntaxStyleSuite = require('./test_syntax_and_style');
const interactiveSuite = require('./test_interactive_m1_challenger');
const interactiveM2Suite = require('./test_interactive_m2_map');
const interactiveM2ChallengerSuite = require('./test_adversarial_m2_challenger');
const interactiveM3Suite = require('./test_interactive_m3_simulator');
const interactiveM3ChallengerSuite = require('./test_adversarial_m3_challenger');

// ANSI Color Codes
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const CYAN = '\x1b[36m';
const GRAY = '\x1b[90m';

async function main() {
  console.log(`${BOLD}${CYAN}============================================================${RESET}`);
  console.log(`${BOLD}${CYAN}  EV Camping Trip Web App — Automated E2E Test Runner       ${RESET}`);
  console.log(`${BOLD}${CYAN}============================================================${RESET}\n`);

  const suites = [
    calculationsSuite,
    dataIntegritySuite,
    domStructureSuite,
    syntaxStyleSuite,
    interactiveSuite,
    interactiveM2Suite,
    interactiveM2ChallengerSuite,
    interactiveM3Suite,
    interactiveM3ChallengerSuite
  ];

  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;
  const allFailures = [];

  const tierStats = {
    1: { name: 'Tier 1: Feature Coverage', total: 0, passed: 0, failed: 0 },
    2: { name: 'Tier 2: Boundary & Edge Cases', total: 0, passed: 0, failed: 0 },
    3: { name: 'Tier 3: Pairwise Combinatorial', total: 0, passed: 0, failed: 0 },
    4: { name: 'Tier 4: Real-World Scenarios', total: 0, passed: 0, failed: 0 }
  };

  const suiteSummaries = [];

  for (const suite of suites) {
    console.log(`${BOLD}${BLUE}▶ Running Suite:${RESET} ${BOLD}${suite.name}${RESET}`);
    const results = await suite.run();

    let suitePassed = 0;
    let suiteFailed = 0;

    results.forEach(r => {
      totalTests++;
      const tier = r.tier || 1;
      if (tierStats[tier]) {
        tierStats[tier].total++;
      }

      if (r.passed) {
        totalPassed++;
        suitePassed++;
        if (tierStats[tier]) tierStats[tier].passed++;
        console.log(`  ${GREEN}✔${RESET} ${GRAY}[T${tier}]${RESET} ${r.description} ${GRAY}(${r.duration}ms)${RESET}`);
      } else {
        totalFailed++;
        suiteFailed++;
        if (tierStats[tier]) tierStats[tier].failed++;
        console.log(`  ${RED}✖ [T${tier}] ${r.description}${RESET}`);
        console.log(`    ${RED}Error: ${r.error.message}${RESET}`);
        allFailures.push({ suite: suite.name, test: r.description, error: r.error });
      }
    });

    suiteSummaries.push({
      name: suite.name,
      total: results.length,
      passed: suitePassed,
      failed: suiteFailed
    });

    console.log('');
  }

  // Print Suite Summaries
  console.log(`${BOLD}────────────────────────────────────────────────────────────${RESET}`);
  console.log(`${BOLD}  SUITE BREAKDOWN${RESET}`);
  console.log(`${BOLD}────────────────────────────────────────────────────────────${RESET}`);
  suiteSummaries.forEach(s => {
    const statusIcon = s.failed === 0 ? `${GREEN}✔ PASS${RESET}` : `${RED}✖ FAIL (${s.failed})${RESET}`;
    console.log(`  ${s.name.padEnd(35)} : ${s.passed}/${s.total} passed [${statusIcon}]`);
  });

  // Print Tier Breakdown
  console.log(`\n${BOLD}────────────────────────────────────────────────────────────${RESET}`);
  console.log(`${BOLD}  TIER BREAKDOWN (Methodology Coverage)${RESET}`);
  console.log(`${BOLD}────────────────────────────────────────────────────────────${RESET}`);
  Object.keys(tierStats).forEach(tierKey => {
    const ts = tierStats[tierKey];
    const status = ts.failed === 0 ? `${GREEN}100% PASS${RESET}` : `${RED}${ts.failed} FAILED${RESET}`;
    console.log(`  ${ts.name.padEnd(35)} : ${String(ts.passed).padStart(3)} / ${String(ts.total).padEnd(3)} tests [${status}]`);
  });

  // Final Overall Summary
  console.log(`\n${BOLD}${CYAN}============================================================${RESET}`);
  if (totalFailed === 0) {
    console.log(`${BOLD}${GREEN}  ALL TESTS PASSED! (${totalPassed}/${totalTests} assertions passed)${RESET}`);
    console.log(`${BOLD}${GREEN}  E2E Test Suite Status: 100% HEALTHY (Exit Code 0)${RESET}`);
  } else {
    console.log(`${BOLD}${RED}  TEST RUN FAILED: ${totalFailed} out of ${totalTests} tests failed.${RESET}`);
    allFailures.forEach((f, i) => {
      console.log(`  ${RED}${i + 1}. [${f.suite}] ${f.test}: ${f.error.message}${RESET}`);
    });
  }
  console.log(`${BOLD}${CYAN}============================================================${RESET}\n`);

  process.exit(totalFailed === 0 ? 0 : 1);
}

main().catch(err => {
  console.error(`${RED}Fatal Test Runner Error:${RESET}`, err);
  process.exit(1);
});

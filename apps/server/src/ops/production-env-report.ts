import { build_production_env_report } from "../config/production-env-report";

try {
  const report = build_production_env_report();
  console.info(JSON.stringify(report, null, 2));
} catch (error) {
  const message = error instanceof Error ? error.message : "Unknown production environment report error";
  console.error(`Production environment report failed: ${message}`);
  process.exitCode = 1;
}

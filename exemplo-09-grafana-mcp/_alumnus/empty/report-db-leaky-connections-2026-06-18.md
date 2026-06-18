# Investigation Report — /students/db-leaky-connections (2026-06-18)

## Summary

- Prometheus: No application metrics exposing this endpoint; only Grafana/blackbox metrics found.
- Loki: No logs found that mention the endpoint in queried streams.
- Tempo: Multiple traces found for `GET /students/db-leaky-connections` from service `alumnus_app_f7f9`; traces show error spans but do not include exception messages or stack traces.
- Root cause: Cannot be pinned to an exact file/line from current telemetry; probable area: database access / connection handling (hypothesis).

## What I ran / Key results

- Discovered Grafana datasources: Prometheus (`prometheus`), Loki (`loki`), Tempo (`tempo`).

- Prometheus queries attempted (examples):
  - `sum(increase(http_requests_total{code="500", handler="/students/db-leaky-connections"}[15m]))` → no series
  - `count by (__name__) ({code="500"})` → returned: `promhttp_metric_handler_requests_total`, `grafana_api_response_status_total`, `grafana_page_response_status_total`, `grafana_proxy_response_status_total` (Grafana/blackbox metrics)
  - Conclusion: Prometheus lacks app-level metrics labeled with this path.

- Loki queries attempted (examples):
  - `{level="error"} |= "/students/db-leaky-connections"` → no results
  - `{app=~".+"} |= "db-leaky-connections"` → no results
  - `{job=~".+"} |= "500"` → no results
  - Conclusion: No error logs mentioning the endpoint were returned from the queried streams.

- Tempo (TraceQL) queries:
  - `{ span:name =~ ".*db-leaky-connections.*" }` → multiple traces found for `alumnus_app_f7f9`
  - Example traceIDs (representative):
    - `8b088e5629826a285d08b1ff8bf1fdfe`
    - `55e435d75f2e3a1e1872e425134c7aa8`
    - `1da0849a312c68b869d0048a22b222f4`
    - `118ba095956a7efa54f931a07a16e977`
  - For these traces:
    - Root span: `GET /students/db-leaky-connections`
    - `serviceStats` show `spanCount` ~4 and `errorCount` ~3 (multiple error spans per trace)
    - Span durations around ~1s
  - Attempts to extract exception attributes (e.g., `span.exception.message`, `span:statusMessage`) returned no data.

## Correlation & pattern

- Prometheus: no app metrics → cannot get 500 counts or failure response-time metrics for that endpoint.
- Loki: no logs with errors or stack traces to tie to specific trace IDs.
- Tempo: repeated failed traces for the endpoint within the observed window; consistent error-span pattern indicates the service is failing internally for that route.

## Root-cause analysis (supported by data)

- Evidence: Tempo shows repeated error spans tied to `GET /students/db-leaky-connections` across many traces.
- Likely subsystem: database access layer (connection handling) given the endpoint name and failure consistency.
- Missing evidence: no error stacktraces or exception messages in traces; no application HTTP metrics; no logs containing the endpoint path.
- Result: Cannot identify exact file and line number with current telemetry.

## Actionable next steps (to identify file:line and fix)

1. Enable/forward application ERROR logs (include full stack traces) to Loki and ensure logs contain OpenTelemetry trace IDs.
2. Expose Prometheus metrics from the application with labels for handler/path and status code (e.g., `http_requests_total{handler,code}`) and duration histograms.
3. Configure OpenTelemetry SDK to attach exception attributes (`exception.message`, `exception.stacktrace`) to error spans; include source info if possible.
4. Reproduce the failure briefly; then correlate:
   - Prometheus 500 counts and duration histograms
   - Loki ERROR logs containing trace IDs and stack traces
   - Tempo spans with exception attributes to extract file/line
5. As short-term mitigation, add defensive DB connection handling (timeouts, pool limits) and restart service to clear potential leaked connections.

## Diagnosis table

- Prometheus: No app metrics for endpoint — Confidence: High
- Loki: No error logs mentioning endpoint — Confidence: High (for queried streams)
- Tempo: Multiple error traces for endpoint — Confidence: High
- File/line: Not determinable from current telemetry — Confidence: Low (hypothesis: DB access layer)

## Commands / queries used (examples)

- Prometheus examples:

```text
sum(increase(http_requests_total{code="500", handler="/students/db-leaky-connections"}[15m]))
count by (__name__) ({code="500"})
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{handler="/students/db-leaky-connections",code="500"}[5m])) by (le))
```

- Loki examples:

```text
{level="error"} |= "/students/db-leaky-connections"
{app=~".+"} |= "db-leaky-connections"
{job=~".+"} |= "500"
```

- Tempo TraceQL examples:

```text
{ span:name =~ ".*db-leaky-connections.*" }
{ trace:id = "8b088e5629826a285d08b1ff8bf1fdfe" } && { span:status = error }
```

## Next steps I can perform

- Run a focused TraceQL extraction of all span attributes for the top 3 traceIDs and save results.
- Provide ready-to-run Prometheus and Loki queries and a short runbook for the engineering team to enable metrics/logging.
- If you grant repository access, inspect `GET /students/db-leaky-connections` handler source to identify suspicious DB-connection code now.

---

_Report generated: 2026-06-18_

# DevTools Network Analysis

## Procedure
1. Open a website in a browser.
2. Open DevTools → Network.
3. Enable **Disable cache**.
4. Reload the page.
5. Inspect the waterfall and transfer sizes.

## Submission table
Use the actual values from the browser run immediately before submission.

| Measurement | Value to record |
|---|---|
| Request count | Record from Network panel after reload |
| Total transferred/page size | Record from Network panel footer |
| Slowest resource | Record resource name + duration |
| 3xx responses | Record status + URL, or `None observed` |
| 4xx responses | Record status + URL, or `None observed` |

### Interpretation
The waterfall shows when requests were queued, started and completed. The slowest resource is the request with the largest duration; status-code columns identify redirects and client errors.

**Important:** Do not invent browser measurements. Replace the five values above with the real DevTools values from your chosen website.

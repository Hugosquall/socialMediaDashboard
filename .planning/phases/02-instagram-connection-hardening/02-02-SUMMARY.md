# Phase 2 Plan 02-02 Summary: Token Expiry Notification

## Outcome

Implemented proactive Instagram token expiry alerts through the existing notifications API.

## Changes

- Added `syncInstagramTokenExpiryNotification` to the notification shared helper.
- `GET /api/notifications` now checks the user's Instagram token before listing active notifications.
- The alert is updated in place while active, avoiding duplicate active warnings.
- If the token is healthy again, the stale active token alert is dismissed.

## Follow-Up

- A future scheduled job can call the same helper without needing UI traffic.

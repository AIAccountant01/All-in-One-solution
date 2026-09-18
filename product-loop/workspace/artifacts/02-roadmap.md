# Helia V1 Roadmap — Product Manager (Loop iteration 1)

**Decision:** Approve for Coder verification against the existing mobile prototype.  
**Date:** 2026-09-18  
**Inputs:** `01-user-feedback.md`

## Vision
A phone-first personal health OS that unifies **Gabit**, **Ultrahuman**, **Google Fit**, and **Apple Health** into one weekly picture — with dietitian-style lifestyle guidance and autonomous nudges. Wellness support only; not a medical device.

## Personas
- Founder/user who already wears Gabit and/or Ultrahuman and wants one weekly brief instead of four apps.

## V1 scope (P0) — ship bar
| ID | Story | Done when |
|----|--------|-----------|
| P0-1 | Mobile shell | Bottom tabs, phone layout, installable PWA manifest |
| P0-2 | Core connections | Connect/disconnect Gabit, Ultrahuman, Google Fit, Apple Health |
| P0-3 | Today vitals | Steps, calories in, water, temperature visible |
| P0-4 | Nutrition | Log meals; see calories + macros |
| P0-5 | Labs | Blood markers with normal/low/high flags + disclaimer |
| P0-6 | Weekly brief | Wins, watchouts, next-week focus |
| P0-7 | Dietitian assist | Meal recommendations from labs + prefs |
| P0-8 | Autonomous nudges | High/low temp → hydrate; sedentary → move; actionable buttons |
| P0-9 | Trust | Persistent wellness / not-medical-advice disclaimer |

## Explicit cuts (not V1)
- Live HealthKit / Health Connect / partner OAuth (demo toggles OK if labeled)
- App Store / Play Store native binaries
- Diagnosis, prescriptions, clinical decision support
- Family sharing, meds, deep CGM analytics

## P1 (after gate opens)
- Real vendor sync APIs
- Capacitor / RN store builds
- Service worker for stronger install UX

## Milestones
1. ~~User feedback seeded~~  
2. **PM roadmap approved (this doc)**  
3. Coder verifies/fixes P0 against prototype  
4. QA pass matrix  
5. **User acceptance → `gate_open: true`**  
6. Declare V1 ship / promote prototype

## Risks
- Demo integrations may be mistaken for live sync — label clearly in UI/QA.
- No service worker yet — installability varies by browser.

## Open questions for User (acceptance)
1. Are demo connect toggles acceptable for V1, with real OAuth as P1?
2. Is PWA “Add to Home Screen” enough, or is native store required for V1?

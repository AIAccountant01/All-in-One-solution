# Helia — User feedback (seed from founder conversation)

## Goals
Get **all health insights in one place** via a **mobile app** that acts like a personal health assistant and can nudge me autonomously.

## Must-haves (V1)
1. **Mobile app experience** (phone-first; installable)
2. Connect **Gabit Ring app**, **Ultrahuman app**, **Google Fit**, **Apple Health**
3. Track **steps**
4. Track **what I eat / calories**
5. Track / view **blood reports**
6. **Weekly summary** of everything important
7. **Diet recommendations** like a dietician (lifestyle guidance)
8. **Autonomous alerts**
   - Drink water if temperature is high/low
   - Move if I have been sedentary too long
9. Clear **wellness (not medical device)** positioning

## Nice-to-haves (post-V1)
- Live OAuth / HealthKit / Health Connect production sync
- More wearables (Fitbit, Garmin, Oura, …)
- Native App Store / Play Store builds (Capacitor / RN)
- Family sharing, meds, CGM deep analytics

## Acceptance criteria
- [ ] I can use Helia comfortably on a phone
- [ ] I can connect/disconnect Gabit, Ultrahuman, Google Fit, Apple Health
- [ ] Today shows steps, calories, water, temperature
- [ ] I can log food and see macros
- [ ] I can view blood markers with flags
- [ ] Weekly tab gives a clear brief (wins / watchouts / focus)
- [ ] Assistant gives dietitian-style meal guidance
- [ ] Nudges fire for elevated temp + stillness; I can act on them
- [ ] Disclaimer present that this is not medical advice

## Out of scope for V1
- Diagnosing disease
- Prescribing medication
- Guaranteed real-time vendor API contracts without partner access

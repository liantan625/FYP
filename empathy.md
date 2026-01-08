# Accessibility Audit & Refactor Instructions: Senior Finance App

## 1. Context & Objective
**Target Audience:** Senior Citizens (60+) in Malaysia.
**Key Disabilities:** 1. **Presbyopia:** Difficulty focusing on small text/UI.
2. **Reduced Contrast Sensitivity:** Low contrast text is invisible.
3. **Motor Control:** Difficulty hitting small touch targets.
4. **Visual Impairment:** Reliance on Screen Readers (VoiceOver/TalkBack).

**Tech Stack:** React Native (Expo).

## 2. Role
Act as a **Senior Accessibility Engineer**. Your goal is to refactor the provided code to meet WCAG 2.1 AAA standards and standard "Senior Friendly" design patterns without breaking the core visual layout logic.

---

## 3. Audit Rules: Visual Accessibility (The "Senior Eye" Standard)
*Refactor styles based on these non-negotiable constraints:*

### A. Typography Scale (The Balanced Senior Standard)
Standard 14px text is illegible, but 18px can break layouts. Update `StyleSheet` to these minimums:
- **Body/Input:** Minimum **16px** (Refined from 18px for better density).
- **Secondary/Labels:** Minimum **14px** (Refined from 16px).
- **Card Titles:** Minimum **18px**, Weight `600` or `bold`.
- **Large Data (Money):** Minimum **28px** (Refined from 32px to prevent wrapping).
- **Line Height:** Must be at least **1.4x** the font size.

### B. Contrast & Color
- **Text Color:** Do not use light grey (`#999`, `#CCC`) on white backgrounds.
  - *Replace with:* Dark Grey (`#333333`) or Black (`#1A1A1A`).
- **Backgrounds:** Ensure high contrast. If text is white, background must be dark (e.g., `#004d40` for green themes, not light green).

### C. Touch Targets
- **Buttons/Icons:** Any interactive element must have a minimum touchable area of **48x48 dp**.
- *Fix:* If the icon is small, add `hitSlop={{top: 15, bottom: 15, left: 15, right: 15}}` or wrap in a larger `View`.

---

## 4. Audit Rules: Screen Reader (VoiceOver / TalkBack)
*Add accessibility props to ensure the app "speaks" clearly.*

### A. Grouping Information (Critical for Finance Cards)
Do not let the screen reader read elements individually (e.g., "RM" -> "1600" -> "Slash").
- **Strategy:** Group related text and provide a specific `accessibilityLabel`.
- **Example:**
  ```jsx
  // BAD
  <View>
    <Text>RM 1600</Text>
    <Text>/</Text>
    <Text>RM 6000</Text>
  </View>

  // GOOD
  <View 
    accessible={true} 
    accessibilityLabel="Progress: Saved 1600 Ringgit out of target 6000 Ringgit">
      <Text>RM 1600</Text>
      <Text>/</Text>
      <Text>RM 6000</Text>
  </View>
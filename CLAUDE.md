# My Three Things

> **⚠️ CRITICAL:** When debugging, ALWAYS follow the "Debugging Process Rules" section below. These are MANDATORY and prevent wasted time.

## What This Is
Mobile-first gratitude journaling webapp where users log "three things" they're thankful for each day. Supports kid/family accounts with equal-access management.

## Tech Stack
- Vue 3 (Composition API with `<script setup>`)
- Vite
- Pinia for state management
- Vue Router
- Tailwind CSS v4 (CSS-first configuration)
- shadcn-vue for UI components
- PocketBase backend: `https://pb-3t.imstillwakingup.com/`
- JavaScript only (no TypeScript)

## Bash Commands
- `npm install` - Install dependencies
- `npm run dev` - Start dev server
- `npm run build` - Production build
- `npm run lint` - Run linting

## PocketBase Collections Schema

### profiles
Represents a person (user or managed kid).

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | text | yes | Display name |
| avatar | file | no | Profile picture |
| is_managed | boolean | yes | true = kid account, false = self profile |
| created_by | relation → users | yes | Audit only, NOT for permissions |

### profile_managers
Equal-access management (no hierarchy). All managers have identical permissions.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| profile | relation → profiles | yes | The profile being managed |
| user | relation → users | yes | User with management access |

**Rules:**
- All managers have equal rights
- Managers can add others but can only remove themselves
- Last manager cannot leave (prevents orphans)

### entries
Daily entry container.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| profile | relation → profiles | yes | Who logged this |
| date | date | yes | Entry date (unique per profile) |
| bonus_notes | text | no | Micro-journal field |

### things
Individual gratitude items.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| entry | relation → entries | yes | Parent entry |
| content | text | yes | The gratitude text |
| order | number | yes | Display order (1, 2, 3...) |

**users**: Built-in PocketBase collection. Email/password auth, self-registration enabled.

## Core Features (V1)
- Authentication (login/register with PocketBase)
- Daily three things entry (expandable to more)
- Bonus notes (micro-journal)
- Entry history with calendar
- Kid profiles with equal-access management
- Dark/light mode with theme selection

## 🚨 CRITICAL: Debugging Process Rules (MUST FOLLOW)

**MANDATORY RULES - These prevent getting off track when debugging. Follow them strictly to avoid circular debugging and wasted effort. Violating these rules leads to failed debugging sessions and wasted time.**

### 1. 🛑 MANDATORY: The "Two Strikes" Rule
- If the same **type** of fix fails twice (e.g., two different timing delays, two different prop checks), **STOP IMMEDIATELY**
- Summarize what was tried: "I tried X and Y, both failed with similar symptoms"
- Check assumption: "Let me verify I'm solving the right problem"
- Ask user: "Should I continue this approach or step back and reconsider?"
- **Example**: Two timing delays both fail → Don't try a third delay, investigate if timing is actually the problem

### 2. 🛑 MANDATORY: The "Trace Before Fix" Rule
- Before implementing a fix, **ALWAYS trace the actual data flow end-to-end FIRST**
- Don't assume the problem based on symptoms alone
- Use console logs, Chrome DevTools, or inspection to verify actual values
- Check what data structures actually contain, not just their shape
- **Example**: Before assuming "timing issue", check what the data actually contains at different lifecycle points

### 3. 🛑 MANDATORY: The "Complexity Check" Rule
- If adding complexity (new checks, watchers, computed properties, delays), **STOP and ask: "Am I solving the root cause or working around it?"**
- Adding multiple layers of readiness checks, 80% thresholds, loading state watchers = RED FLAG
- Simple problems should have simple solutions
- Complexity suggests you're treating symptoms, not the disease
- **Example**: If you need 5 different conditions to determine "ready state", the architecture may be wrong

### 4. 🛑 MANDATORY: The "Read the Data" Rule
- When debugging, **ALWAYS inspect actual runtime values EARLY**, not after many failed attempts
- Don't just check counts or array lengths - look at the actual objects
- Use `console.log` with actual data, not just "X is ready" boolean messages
- Check both what you expect AND what you actually have
- **Example**: "5 measurements" → Check what those 5 measurements contain, don't assume based on count

### 5. 🛑 MANDATORY: The "Check-In After 5-7 Attempts" Rule
- If you've used 5-7 tools without clear progress, **STOP IMMEDIATELY and pause to summarize**
- Message format: "I've made X attempts trying Y approach. Here's what I learned: [findings]. Possible next approaches: [2-3 options]. Which should I try?"
- Gives user visibility and opportunity to course-correct
- Prevents spending 30 minutes going in circles
- **Example**: After 6 file edits without fixing the issue, stop and present findings + options

### ⚠️ When to Apply These Rules (ALWAYS)
- **ALWAYS and IMMEDIATELY** during any debugging session
- **MANDATORY** when fixing bugs or issues (not when implementing new features)
- **REQUIRED** when you notice yourself trying variations of the same approach
- **CRITICAL** when edits aren't producing expected results
- **NO EXCEPTIONS** - these rules prevent wasted time and failed debugging sessions

### Red Flags That Trigger Rules
- Same error/symptom after multiple different fixes → Rule 1
- Adding delays, complex conditionals, or "just in case" checks → Rule 3
- Not sure what data actually contains → Rule 4
- More than 5 tool uses without progress → Rule 5


### shadcn-vue Component Patterns

**CRITICAL - All shadcn-vue components use the v-model pattern:**

**Input Component:**

```vue
<!-- ✅ CORRECT: Use model-value and @update:model-value -->
<Input
  :model-value="settings.someValue"
  @update:model-value="(val) => updateSetting('someValue', val)"
/>

<!-- ❌ WRONG: value/input do not work correctly with Input -->
<Input
  :value="settings.someValue"
  @input="(e) => updateSetting('someValue', e.target.value)"
/>
```

**Switch Component:**

```vue
<!-- ✅ CORRECT: Use model-value and @update:model-value -->
<Switch
  :model-value="settings.someBoolean"
  @update:model-value="(val) => updateSetting('someBoolean', val)"
/>

<!-- ❌ WRONG: checked/update:checked do not exist on Switch -->
<Switch
  :checked="settings.someBoolean"
  @update:checked="(val) => updateSetting('someBoolean', val)"
/>
```

**Select Component:**

```vue
<!-- ✅ CORRECT: Use modelValue (camelCase in template) -->
<Select
  :modelValue="settings.someValue"
  @update:modelValue="(val) => updateSetting('someValue', val)"
>
  <SelectTrigger><SelectValue /></SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
  </SelectContent>
</Select>
```

**General Rule:** All shadcn-vue components follow Vue's standard v-model pattern:
- Props: `:model-value` or `:modelValue` (both work in templates)
- Events: `@update:model-value` or `@update:modelValue`
- Never use custom prop names like `:value`, `:checked`, `:selected`, etc.
- Never use native events like `@input`, `@change` - always use `@update:model-value`

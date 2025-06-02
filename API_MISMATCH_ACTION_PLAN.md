# API Mismatch Action Plan

## Immediate Actions Required

### 1. Backend Fixes (Priority: HIGH)

#### Challenge Controller (`challengeController.ts`)
- [x] ✅ Fixed: Map `description` → `prompt`
- [x] ✅ Fixed: Convert `difficulty` string → `difficultyLevel` number
- [x] ✅ Fixed: Ensure dates are ISO8601 format
- [x] ✅ Fixed: Normalize content to always be an object
- [ ] ❌ TODO: Implement `recentActivity` in stats endpoint (currently empty array)
- [ ] ❌ TODO: Calculate `totalXpEarned` properly (currently hardcoded to 0)

#### User/Auth Controller
- [ ] ❌ TODO: Ensure `echoScore` is always a number (not string)
- [ ] ❌ TODO: Implement `avatarUrl` for users
- [ ] ❌ TODO: Verify all user fields use snake_case in JSON

#### StreakInfo Mapping
- [x] ✅ Fixed: Map fields correctly:
  - `currentStreak` → `current`
  - `longestStreak` → `longest`  
  - `streakMaintained` → `isActive`

### 2. Add Validation Middleware

```bash
# In backend/src/app.ts or server.ts
import { validateApiResponse } from './middleware/validateApiResponse';

// Add before routes
app.use(validateApiResponse);
```

### 3. Run Contract Tests

```bash
cd backend
npm test -- api-contract.test.ts
```

### 4. iOS App Fixes

#### Enhanced Error Handling
- [x] ✅ Added detailed logging in NetworkClient
- [x] ✅ Added diagnostic info in APIService
- [x] ✅ Enhanced AnyCodable to handle complex types

#### Model Updates
- [x] ✅ Fixed mock data in DailyChallengeViewModel
- [ ] ❌ TODO: Add fallback values for missing fields

### 5. Testing Strategy

1. **Backend Testing**
   ```bash
   # Test challenge endpoint
   curl -H "Authorization: Bearer TOKEN" \
        http://localhost:3000/api/challenge/today | jq
   ```

2. **iOS Testing**
   - Run the test decoding script
   - Check Xcode console for detailed errors
   - Verify all endpoints with real data

### 6. Long-term Solutions

1. **API Documentation**
   - Use OpenAPI/Swagger
   - Generate client code from specs
   - Single source of truth

2. **Type Safety**
   - Share TypeScript interfaces with iOS
   - Use code generation tools
   - Automated contract testing

3. **Monitoring**
   - Log all decoding failures
   - Track API response validation errors
   - Alert on contract violations

## Common Pitfalls to Avoid

1. **Date Formats**
   - Always use ISO8601: `2024-01-15T10:00:00.000Z`
   - Never use custom formats

2. **Enum Values**
   - Use exact values: `bias_swap` not `biasSwap`
   - Validate against allowed values

3. **Number Types**
   - `echoScore` must be number, not string
   - `difficultyLevel` must be 1-4, not string

4. **Optional vs Null**
   - iOS optionals = backend null/undefined
   - Empty arrays should have at least mock data

5. **Field Names**
   - Backend: snake_case
   - iOS: camelCase (with CodingKeys mapping)

## Validation Checklist

Before deploying any API changes:

- [ ] Run `npm test -- api-contract.test.ts`
- [ ] Verify response with validation middleware
- [ ] Test with iOS app in simulator
- [ ] Check for decoding errors in Xcode console
- [ ] Ensure all TODOs are addressed

## Emergency Fixes

If iOS app is crashing due to API issues:

1. Enable validation middleware in production temporarily
2. Check backend logs for validation errors
3. Use the diagnostic analysis document to identify mismatches
4. Apply fixes from the api-contracts.ts as source of truth 
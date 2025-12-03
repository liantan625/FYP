# reCAPTCHA Enterprise Setup for DuitU

## Overview
This app uses Google Cloud reCAPTCHA Enterprise to protect against bot attacks during user authentication.

## Configuration

### Site Key
```
6Ld5yxosAAAAAFv866aoBS4b8QcXKCUWOk0kzn-x
```

### Implementation Details

1. **RecaptchaProvider** (`context/recaptcha-context.tsx`)
   - Initializes reCAPTCHA client once during app startup
   - Provides client and ready state to entire app
   - Located in the root layout for global access

2. **Login Flow** (`app/login.tsx`)
   - Executes `RecaptchaAction.LOGIN()` before sending OTP
   - Token is generated and logged to console
   - Token should be sent to backend for verification

3. **Signup Flow** (`app/signup.tsx`)
   - Executes `RecaptchaAction.SIGNUP()` before creating account
   - Token is generated and logged to console
   - Token should be sent to backend for verification

## Backend Verification (TODO)

The reCAPTCHA tokens are currently generated but not verified. To complete the setup:

1. **Create a backend endpoint** to verify tokens:
   ```javascript
   // Example backend verification
   const { RecaptchaEnterpriseServiceClient } = require('@google-cloud/recaptcha-enterprise');
   
   async function verifyToken(token, expectedAction) {
     const client = new RecaptchaEnterpriseServiceClient();
     const projectPath = client.projectPath('YOUR_PROJECT_ID');
     
     const request = {
       assessment: {
         event: {
           token: token,
           siteKey: '6Ld5yxosAAAAAFv866aoBS4b8QcXKCUWOk0kzn-x',
         },
       },
       parent: projectPath,
     };
     
     const [response] = await client.createAssessment(request);
     
     if (!response.tokenProperties.valid) {
       return { valid: false, reason: response.tokenProperties.invalidReason };
     }
     
     if (response.tokenProperties.action !== expectedAction) {
       return { valid: false, reason: 'Action mismatch' };
     }
     
     // Check risk score (0.0-1.0, higher is more likely human)
     if (response.riskAnalysis.score < 0.5) {
       return { valid: false, reason: 'Low score', score: response.riskAnalysis.score };
     }
     
     return { valid: true, score: response.riskAnalysis.score };
   }
   ```

2. **Update client code** to send token to backend:
   ```typescript
   // In signup.tsx or login.tsx
   const token = await client.execute(RecaptchaAction.SIGNUP());
   
   // Send to your backend
   const response = await fetch('https://your-backend.com/verify-recaptcha', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ token, action: 'SIGNUP' }),
   });
   
   const { valid } = await response.json();
   if (!valid) {
     Alert.alert('Verification failed');
     return;
   }
   
   // Proceed with authentication
   ```

## Testing

During development, check the console logs to see:
- reCAPTCHA initialization status
- Token generation for LOGIN and SIGNUP actions
- Any errors during the process

## Security Notes

⚠️ **Important**: The current implementation generates tokens but does NOT verify them on a backend. This means:
- Tokens are created successfully
- But they are not validated against Google's servers
- A backend verification step is REQUIRED for production use

## Actions Used

- `RecaptchaAction.LOGIN()` - For login attempts
- `RecaptchaAction.SIGNUP()` - For new user registration

## References

- [reCAPTCHA Enterprise React Native](https://www.npmjs.com/package/@google-cloud/recaptcha-enterprise-react-native)
- [Google Cloud reCAPTCHA Enterprise](https://cloud.google.com/recaptcha-enterprise/docs)

# API Auth

## Password Reset

Sends auth record password reset email request.

On successful password reset all previously issued auth tokens for the specific record will be automatically invalidated.

```
import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

...

await pb.collection('users').requestPasswordReset('test@example.com');

// ---
// (optional) in your custom confirmation page:
// ---

// note: after this call all previously issued auth tokens are invalidated
await pb.collection('users').confirmPasswordReset(
    'RESET_TOKEN',
    'NEW_PASSWORD',
    'NEW_PASSWORD_CONFIRM',
);
```

### API Details

#### Body Parameters

##### Request Password Reset

1. email
    * type: String
    * required: true
    * Description:
      * The auth record email address to send the password reset request (if exists).

##### Confirm Verification

1. token
    * type: String
    * required: true
    * Description:
      * The token from the password reset request email.
2. password
    * type: String
    * required: true
    * Description:
      * The new password to set.
3. passwordConfirm
    * type: String
    * required: true
    * Description:
      * The new password confirmation.


#### Responses

##### 200
```
null
```

##### 400
```
{
  "status": 400,
  "message": "An error occurred while validating the submitted data.",
  "data": {
    "token": {
      "code": "validation_required",
      "message": "Missing required value."
    }
  }
}
```

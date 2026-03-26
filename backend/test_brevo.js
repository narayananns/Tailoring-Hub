const brevo = require('@getbrevo/brevo');

try {
    const apiInstance = new brevo.TransactionalEmailsApi();
    console.log('Instance created');
    console.log('ApiKeys Enum:', brevo.TransactionalEmailsApiApiKeys);
    
    if (apiInstance.setApiKey) {
        console.log('Has setApiKey method');
    } else {
        console.log('No setApiKey method');
        console.log('Authentications:', apiInstance.authentications);
    }
} catch (e) {
    console.error(e);
}

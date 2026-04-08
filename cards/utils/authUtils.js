const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { Resend } = require('resend');

const emailService = (process.env.EMAIL_SERVICE || '').toLowerCase();
const resendApiKey = process.env.RESEND_API_KEY;
const emailFromName = process.env.EMAIL_FROM_NAME;
const emailFromAddress = process.env.EMAIL_FROM_ADDRESS;
const verificationSender = emailFromName && emailFromAddress
    ? `${emailFromName} <${emailFromAddress}>`
    : (emailFromAddress || '');
const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
const resendClient = emailService === 'resend' && resendApiKey ? new Resend(resendApiKey) : null;
const passwordSaltRounds = Number(process.env.PASSWORD_SALT_ROUNDS || 12);

function isBcryptHash(value)
{
    return typeof value === 'string' && value.startsWith('$2');
}

async function hashPassword(plainPassword)
{
    return bcrypt.hash(plainPassword, passwordSaltRounds);
}

async function verifyPassword(plainPassword, storedPassword)
{
    if (!storedPassword)
    {
        return false;
    }

    if (isBcryptHash(storedPassword))
    {
        return bcrypt.compare(plainPassword, storedPassword);
    }

    return storedPassword === plainPassword;
}

function createVerificationToken()
{
    return crypto.randomBytes(32).toString('hex');
}

function hashVerificationToken(token)
{
    return crypto.createHash('sha256').update(token).digest('hex');
}

async function sendVerificationEmail(email, token)
{
    if (emailService !== 'resend')
    {
        throw new Error('EMAIL_SERVICE must be set to resend.');
    }

    if (!resendClient)
    {
        throw new Error('RESEND_API_KEY is not configured.');
    }

    if (!verificationSender)
    {
        throw new Error('EMAIL_FROM_NAME and EMAIL_FROM_ADDRESS must be configured.');
    }

    const verifyLink = `${frontendUrl}/verify-email?token=${encodeURIComponent(token)}`;

    await resendClient.emails.send({
        from: verificationSender,
        to: email,
        subject: 'Verify your account',
        html: `
            <h2>Verify your email</h2>
            <p>Click the link below to verify your account:</p>
            <p><a href="${verifyLink}">${verifyLink}</a></p>
            <p>This link expires in 24 hours.</p>
        `
    });
}

module.exports = {
    isBcryptHash,
    hashPassword,
    verifyPassword,
    createVerificationToken,
    hashVerificationToken,
    sendVerificationEmail
};

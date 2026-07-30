'use strict';

const MAX_NAME_LENGTH = 80;
const MAX_TITLE_LENGTH = 80;
const MAX_EMAIL_LENGTH = 254;
const MAX_PHONE_LENGTH = 20;

const EMAIL_PATTERN = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
const PHONE_PATTERN = /^[0-9()+\-.\s]{7,20}$/;
const TPASC_MAIN_LINE = '416-283-5222';

const stepFields = ['nameInput', 'titleInput', 'emailInput', 'phoneInput'];
let currentStep = 0;

function stripControlChars(value) {
    return Array.from(value)
        .filter(ch => {
            const code = ch.codePointAt(0);
            return code >= 32 && code !== 127;
        })
        .join('');
}

function sanitizeText(value, maxLength) {
    return stripControlChars(value)
        .replace(/[<>]/g, '')
        .trim()
        .slice(0, maxLength);
}

function isValidEmail(value) {
    return value.length <= MAX_EMAIL_LENGTH && EMAIL_PATTERN.test(value);
}

function isValidPhone(value) {
    if (!PHONE_PATTERN.test(value)) return false;
    const digitCount = value.replace(/\D/g, '').length;
    return digitCount === 10;
}

function formatPhoneDigits(digits) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function escapeHtml(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function capitalizeWords(value) {
    return value.replace(/\S+/g, word => word.charAt(0).toUpperCase() + word.slice(1));
}

function insertNameBoundary(value) {
    if (/\s/.test(value)) return value;
    const match = value.match(/^(\S*?[a-z])([A-Z]\S*)$/);
    return match ? `${match[1]} ${match[2]}` : value;
}

function getFormValues() {
    return {
        name: sanitizeText(document.getElementById('nameInput').value, MAX_NAME_LENGTH),
        title: sanitizeText(document.getElementById('titleInput').value, MAX_TITLE_LENGTH),
        email: sanitizeText(document.getElementById('emailInput').value, MAX_EMAIL_LENGTH),
        phone: sanitizeText(document.getElementById('phoneInput').value, MAX_PHONE_LENGTH)
    };
}

function validateStep(id, rawValue) {
    const value = rawValue.trim();

    if (id === 'nameInput') {
        if (!value) return 'Please fill in this field before continuing.';
        const parts = value.split(/\s+/).filter(Boolean);
        if (parts.length < 2) return 'Please enter your first and last name.';
        return null;
    }

    if (id === 'titleInput') {
        if (!value) return 'Please fill in this field before continuing.';
        return null;
    }

    if (id === 'emailInput') {
        if (!value) return 'Please fill in this field before continuing.';
        if (!isValidEmail(value)) return 'Please enter a valid email address.';
        if (!value.toLowerCase().endsWith('@tpasc.ca')) return 'Please use your @tpasc.ca email address.';
        return null;
    }

    if (id === 'phoneInput') {
        if (document.getElementById('noPhoneCheckbox').checked) return null;
        if (!value) return "Please enter your phone number, or check the box if you don't have one.";
        if (!isValidPhone(value)) return 'Please enter a valid phone number.';
        return null;
    }

    return null;
}

function renderStep() {
    document.querySelectorAll('.field-step').forEach((el, i) => el.classList.toggle('active', i === currentStep));
    document.getElementById('backBtn').style.display = currentStep === 0 ? 'none' : 'inline-block';
    document.getElementById('nextBtn').textContent = currentStep === stepFields.length - 1 ? 'Done' : 'Next';
    document.getElementById('stepProgress').textContent = `Step ${currentStep + 1} of ${stepFields.length}`;
    document.getElementById(stepFields[currentStep]).focus();
}

function stepNext() {
    const fieldId = stepFields[currentStep];
    const field = document.getElementById(fieldId);

    if (fieldId === 'nameInput') {
        field.value = capitalizeWords(insertNameBoundary(field.value.trim()));
    }

    if (fieldId === 'emailInput') {
        field.value = field.value.trim().toLowerCase();
    }

    const error = validateStep(fieldId, field.value);
    if (error) {
        alert(error);
        return;
    }
    updatePreview(getFormValues());
    if (currentStep < stepFields.length - 1) {
        currentStep++;
        renderStep();
    } else {
        document.getElementById('formFields').style.display = 'none';
        document.getElementById('stepperNav').style.display = 'none';
        document.getElementById('stepProgress').style.display = 'none';
        document.getElementById('editInfoRow').style.display = 'block';
    }
}

function stepBack() {
    if (currentStep > 0) {
        currentStep--;
        renderStep();
    }
}

function editInfo() {
    currentStep = 0;
    document.getElementById('formFields').style.display = 'flex';
    document.getElementById('stepperNav').style.display = 'flex';
    document.getElementById('stepProgress').style.display = 'block';
    document.getElementById('editInfoRow').style.display = 'none';
    renderStep();
}

function updatePreview(user) {
    document.getElementById('staffName').textContent = document.getElementById('copyName').textContent = user.name;
    document.getElementById('staffTitle').textContent = document.getElementById('copyTitle').textContent = user.title;
    const emailSafe = escapeHtml(user.email);
    const emailHtml = user.email
        ? `<a href="mailto:${emailSafe}" style="color:#000000; text-decoration:underline;">${emailSafe}</a>`
        : '';
    document.getElementById('staffEmail').innerHTML = emailHtml;
    document.getElementById('copyEmail').innerHTML = emailHtml;

    const phoneDigits = user.phone.replace(/\D/g, '');
    const hasPhone = phoneDigits.length === 10;
    const phoneHtml = hasPhone
        ? `<a href="tel:+1${phoneDigits}" style="color:#000000; text-decoration:underline;">${formatPhoneDigits(phoneDigits)}</a>`
        : '';

    document.getElementById('staffPhone').innerHTML = phoneHtml;
    document.getElementById('copyPhone').innerHTML = phoneHtml;
    document.getElementById('staffPhoneRow').style.display = hasPhone ? '' : 'none';
    document.getElementById('copyPhoneRow').style.display = hasPhone ? '' : 'none';
}

function copySignature() {
    if (!document.getElementById('copyName').textContent) {
        alert('Please fill in your name first.');
        return;
    }

    const html = document.getElementById('signatureCopy').innerHTML.trim();
    const text = document.getElementById('signatureCopy').innerText;

    navigator.clipboard.write([new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([text], { type: 'text/plain' })
    })]).then(() => {
        showToast();
        playCopyAnimation();
    }).catch(() => {
        alert("Couldn't copy automatically — please try again.");
    });
}

function showToast() {
    const toast = document.getElementById('toast');
    toast.className = 'show';
    setTimeout(() => { toast.className = toast.className.replace('show', ''); }, 3000);
}

function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-mode');
    document.getElementById('moon-icon').style.display = isDark ? 'none' : 'block';
    document.getElementById('sun-icon').style.display = isDark ? 'block' : 'none';
    document.getElementById('previewLabel').textContent = isDark ? 'Outlook Simulator (Dark Mode)' : 'Live Preview (Light Mode)';
}

function drawBasketball(ctx, x, y, radius, opacity, rotation) {
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.translate(x, y);

    ctx.shadowColor = 'rgba(4, 37, 82, 0.35)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 4;

    const gradient = ctx.createRadialGradient(-radius * 0.3, -radius * 0.3, radius * 0.1, 0, 0, radius);
    gradient.addColorStop(0, '#ffab5e');
    gradient.addColorStop(1, '#b85c1a');

    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#000000';
    ctx.stroke();

    ctx.rotate(rotation);
    ctx.beginPath();
    ctx.moveTo(0, -radius);
    ctx.lineTo(0, radius);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-radius, 0);
    ctx.quadraticCurveTo(0, -radius * 0.6, radius, 0);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-radius, 0);
    ctx.quadraticCurveTo(0, radius * 0.6, radius, 0);
    ctx.stroke();

    ctx.restore();
}

function drawPentagon(ctx, cx, cy, size, rotation) {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
        const angle = rotation + (i * 2 * Math.PI) / 5;
        const px = cx + Math.cos(angle) * size;
        const py = cy + Math.sin(angle) * size;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = '#1a1a1a';
    ctx.fill();
}

function drawHexagonOutline(ctx, cx, cy, size, rotation) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = rotation + (i * 2 * Math.PI) / 6;
        const px = cx + Math.cos(angle) * size;
        const py = cy + Math.sin(angle) * size;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#1a1a1a';
    ctx.stroke();
}

function drawSoccerBall(ctx, x, y, radius, opacity, rotation) {
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.translate(x, y);
    ctx.rotate(rotation);

    ctx.shadowColor = 'rgba(4, 37, 82, 0.35)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 4;

    const gradient = ctx.createRadialGradient(-radius * 0.3, -radius * 0.3, radius * 0.1, 0, 0, radius);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(1, '#d8d8d8');

    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#1a1a1a';
    ctx.stroke();

    drawPentagon(ctx, 0, 0, radius * 0.34, -Math.PI / 2);
    [0, 72, 144, 216, 288].forEach(deg => {
        const rad = (deg * Math.PI) / 180;
        const px = Math.cos(rad) * radius * 0.62;
        const py = Math.sin(rad) * radius * 0.62;
        drawPentagon(ctx, px, py, radius * 0.22, rad + Math.PI / 2);
    });
    [36, 108, 180, 252, 324].forEach(deg => {
        const rad = (deg * Math.PI) / 180;
        const px = Math.cos(rad) * radius * 0.66;
        const py = Math.sin(rad) * radius * 0.66;
        drawHexagonOutline(ctx, px, py, radius * 0.25, rad + Math.PI / 2);
    });

    ctx.restore();
}

function drawTennisBall(ctx, x, y, radius, opacity, rotation) {
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.translate(x, y);

    ctx.shadowColor = 'rgba(4, 37, 82, 0.35)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 4;

    const gradient = ctx.createRadialGradient(-radius * 0.3, -radius * 0.3, radius * 0.1, 0, 0, radius);
    gradient.addColorStop(0, '#f2ff6e');
    gradient.addColorStop(1, '#8fa424');

    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#5c6b1a';
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 16; i++) {
        const angle = (i / 16) * Math.PI * 2;
        const r1 = radius * 0.85;
        const r2 = radius * 0.98;
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * r1, Math.sin(angle) * r1);
        ctx.lineTo(Math.cos(angle) * r2, Math.sin(angle) * r2);
        ctx.stroke();
    }

    ctx.rotate(rotation);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#ffffff';

    ctx.beginPath();
    ctx.moveTo(-radius * 0.75, -radius * 0.5);
    ctx.quadraticCurveTo(0, radius * 0.15, radius * 0.75, -radius * 0.5);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-radius * 0.75, radius * 0.5);
    ctx.quadraticCurveTo(0, -radius * 0.15, radius * 0.75, radius * 0.5);
    ctx.stroke();

    ctx.restore();
}

function drawBaseball(ctx, x, y, radius, opacity, rotation) {
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.translate(x, y);

    ctx.shadowColor = 'rgba(4, 37, 82, 0.35)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 4;

    const gradient = ctx.createRadialGradient(-radius * 0.3, -radius * 0.3, radius * 0.1, 0, 0, radius);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(1, '#e2ddd0');

    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#c9c3b2';
    ctx.stroke();

    ctx.rotate(rotation);
    ctx.strokeStyle = '#c0392b';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(-radius * 0.7, -radius * 0.55);
    ctx.quadraticCurveTo(-radius * 0.1, 0, -radius * 0.7, radius * 0.55);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(radius * 0.7, -radius * 0.55);
    ctx.quadraticCurveTo(radius * 0.1, 0, radius * 0.7, radius * 0.55);
    ctx.stroke();

    ctx.lineWidth = 1;
    [-0.5, 0, 0.5].forEach(f => {
        ctx.beginPath();
        ctx.moveTo(-radius * 0.6, f * radius * 0.4 - 3);
        ctx.lineTo(-radius * 0.6 + 5, f * radius * 0.4 + 3);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(radius * 0.6 - 5, f * radius * 0.4 - 3);
        ctx.lineTo(radius * 0.6, f * radius * 0.4 + 3);
        ctx.stroke();
    });

    ctx.restore();
}

function drawRugbyBall(ctx, x, y, radius, opacity, rotation) {
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.translate(x, y);
    ctx.rotate(rotation);

    ctx.shadowColor = 'rgba(4, 37, 82, 0.35)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 4;

    const gradient = ctx.createRadialGradient(-radius * 0.3, -radius * 0.2, radius * 0.1, 0, 0, radius * 1.3);
    gradient.addColorStop(0, '#c17a45');
    gradient.addColorStop(1, '#6b3a1a');

    ctx.beginPath();
    ctx.ellipse(0, 0, radius * 1.3, radius * 0.75, 0, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#3d2010';
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, -radius * 0.75);
    ctx.lineTo(0, radius * 0.75);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#f0e6d8';
    ctx.stroke();

    ctx.lineWidth = 1.5;
    [-0.3, 0, 0.3].forEach(f => {
        ctx.beginPath();
        ctx.moveTo(-radius * 0.15, f * radius * 0.6);
        ctx.lineTo(radius * 0.15, f * radius * 0.6);
        ctx.stroke();
    });

    ctx.restore();
}

function drawMedal(ctx, x, y, radius, opacity, rotation) {
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.translate(x, y);
    ctx.rotate(rotation * 0.2);

    const discRadius = radius * 0.65;
    const ringY = -discRadius - radius * 0.1;
    const ribbonBottomY = ringY - radius * 0.08;

    // One connected ribbon shape (gathered at top, V-notch at bottom), ending above the disc — not overlapping it
    ctx.beginPath();
    ctx.moveTo(-radius * 0.1, -radius * 1.75);
    ctx.lineTo(radius * 0.1, -radius * 1.75);
    ctx.lineTo(radius * 0.42, ribbonBottomY);
    ctx.lineTo(radius * 0.14, ribbonBottomY);
    ctx.lineTo(0, ribbonBottomY - radius * 0.3);
    ctx.lineTo(-radius * 0.14, ribbonBottomY);
    ctx.lineTo(-radius * 0.42, ribbonBottomY);
    ctx.closePath();

    const ribbonGradient = ctx.createLinearGradient(-radius * 0.42, 0, radius * 0.42, 0);
    ribbonGradient.addColorStop(0, '#5c93d1');
    ribbonGradient.addColorStop(0.5, '#3a6ea5');
    ribbonGradient.addColorStop(1, '#042552');
    ctx.fillStyle = ribbonGradient;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#021530';
    ctx.stroke();

    // Metal connecting ring/loop between ribbon and disc (the actual physical link medals have)
    ctx.beginPath();
    ctx.arc(0, ringY, radius * 0.11, 0, Math.PI * 2);
    ctx.fillStyle = '#c9c9c9';
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#6b6b6b';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, ringY, radius * 0.055, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.fill();

    // Disc with stronger 3D shading
    ctx.shadowColor = 'rgba(4, 37, 82, 0.4)';
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 5;

    const gradient = ctx.createRadialGradient(-discRadius * 0.45, -discRadius * 0.5, radius * 0.05, 0, 0, discRadius * 1.15);
    gradient.addColorStop(0, '#fff8dd');
    gradient.addColorStop(0.5, '#f0b90b');
    gradient.addColorStop(1, '#96700a');

    ctx.beginPath();
    ctx.arc(0, 0, discRadius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#7a5808';
    ctx.stroke();

    // Inner bevel ring for depth
    ctx.beginPath();
    ctx.arc(0, 0, discRadius * 0.82, 0, Math.PI * 2);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(122, 88, 8, 0.6)';
    ctx.stroke();

    // Big bold number
    ctx.fillStyle = '#7a5808';
    ctx.font = `bold ${radius * 0.85}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('1', 0, radius * 0.04);

    ctx.restore();
}

function drawTennisRacket(ctx, x, y, radius, opacity, rotation) {
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.translate(x, y);
    ctx.rotate(rotation * 0.4);

    ctx.shadowColor = 'rgba(4, 37, 82, 0.35)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 4;

    ctx.beginPath();
    ctx.ellipse(0, -radius * 0.5, radius * 0.65, radius * 0.9, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fill();
    ctx.lineWidth = radius * 0.18;
    ctx.strokeStyle = '#042552';
    ctx.stroke();

    ctx.shadowColor = 'transparent';

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, -radius * 0.5, radius * 0.55, radius * 0.8, 0, 0, Math.PI * 2);
    ctx.clip();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 0.8;
    for (let i = -3; i <= 3; i++) {
        ctx.beginPath();
        ctx.moveTo(i * radius * 0.18, -radius * 1.4);
        ctx.lineTo(i * radius * 0.18, radius * 0.4);
        ctx.stroke();
    }
    for (let i = -4; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(-radius * 0.7, -radius * 0.5 + i * radius * 0.18);
        ctx.lineTo(radius * 0.7, -radius * 0.5 + i * radius * 0.18);
        ctx.stroke();
    }
    ctx.restore();

    ctx.fillStyle = '#5c93d1';
    ctx.fillRect(-radius * 0.12, radius * 0.35, radius * 0.24, radius * 0.9);
    ctx.strokeStyle = '#042552';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-radius * 0.12, radius * 0.35, radius * 0.24, radius * 0.9);

    ctx.restore();
}

function drawHelmet(ctx, x, y, radius, opacity, rotation) {
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.translate(x, y);
    ctx.rotate(rotation * 0.3);

    function shellPath() {
        ctx.beginPath();
        ctx.arc(0, 0, radius, Math.PI, 0, false);
        ctx.quadraticCurveTo(radius * 0.95, radius * 0.7, radius * 0.55, radius * 0.95);
        ctx.quadraticCurveTo(0, radius * 1.05, -radius * 0.55, radius * 0.95);
        ctx.quadraticCurveTo(-radius * 0.95, radius * 0.7, -radius, 0);
        ctx.closePath();
    }

    ctx.shadowColor = 'rgba(4, 37, 82, 0.45)';
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 5;

    // Glossy blue base shell, stronger contrast for more 3D depth
    const gradient = ctx.createRadialGradient(-radius * 0.35, -radius * 0.55, radius * 0.05, 0, 0, radius * 1.1);
    gradient.addColorStop(0, '#b3d6f7');
    gradient.addColorStop(0.45, '#3f74b3');
    gradient.addColorStop(1, '#021530');

    shellPath();
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.shadowColor = 'transparent';

    // Pink diagonal livery wedge, clipped to the shell shape
    ctx.save();
    shellPath();
    ctx.clip();
    ctx.beginPath();
    ctx.moveTo(radius * 0.15, -radius);
    ctx.lineTo(radius * 1.1, -radius * 0.2);
    ctx.lineTo(radius * 1.1, radius * 1.1);
    ctx.lineTo(radius * 0.55, radius * 1.1);
    ctx.closePath();
    const pinkGradient = ctx.createLinearGradient(radius * 0.2, -radius, radius, radius);
    pinkGradient.addColorStop(0, '#ff9fc7');
    pinkGradient.addColorStop(1, '#d63384');
    ctx.fillStyle = pinkGradient;
    ctx.fill();

    // Bottom rim shadow for extra roundness, also clipped to shell
    const rimShadow = ctx.createLinearGradient(0, radius * 0.35, 0, radius * 1.1);
    rimShadow.addColorStop(0, 'rgba(0,0,0,0)');
    rimShadow.addColorStop(1, 'rgba(0,0,0,0.35)');
    ctx.fillStyle = rimShadow;
    ctx.fillRect(-radius * 1.1, radius * 0.3, radius * 2.2, radius * 0.9);
    ctx.restore();

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#021530';
    shellPath();
    ctx.stroke();

    // Center racing stripe
    ctx.beginPath();
    ctx.moveTo(-radius * 0.12, -radius * 0.98);
    ctx.lineTo(-radius * 0.1, radius * 0.9);
    ctx.lineTo(radius * 0.1, radius * 0.9);
    ctx.lineTo(radius * 0.12, -radius * 0.98);
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Number badge
    ctx.beginPath();
    ctx.arc(-radius * 0.55, -radius * 0.15, radius * 0.28, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#021530';
    ctx.stroke();
    ctx.fillStyle = '#021530';
    ctx.font = `bold ${radius * 0.32}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('7', -radius * 0.55, -radius * 0.13);

    // Mirrored cyan-blue visor (distinct from shell color)
    const visorGradient = ctx.createLinearGradient(-radius * 0.9, 0, radius * 0.9, 0);
    visorGradient.addColorStop(0, 'rgba(120, 220, 235, 0.92)');
    visorGradient.addColorStop(0.5, 'rgba(40, 150, 195, 0.95)');
    visorGradient.addColorStop(1, 'rgba(15, 60, 100, 0.95)');

    ctx.beginPath();
    ctx.ellipse(0, radius * 0.15, radius * 0.92, radius * 0.32, 0, 0, Math.PI * 2);
    ctx.fillStyle = visorGradient;
    ctx.fill();

    // Chrome trim around visor edge
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#d3dde3';
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#021530';
    ctx.stroke();

    // Glossy visor reflection streaks
    ctx.beginPath();
    ctx.ellipse(-radius * 0.3, radius * 0.02, radius * 0.3, radius * 0.07, -0.3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(radius * 0.15, radius * 0.28, radius * 0.18, radius * 0.05, -0.2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.fill();

    // Visor pivot screws
    ctx.beginPath();
    ctx.arc(-radius * 0.88, radius * 0.12, radius * 0.06, 0, Math.PI * 2);
    ctx.fillStyle = '#d3dde3';
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#021530';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(radius * 0.88, radius * 0.12, radius * 0.06, 0, Math.PI * 2);
    ctx.fillStyle = '#d3dde3';
    ctx.fill();
    ctx.stroke();

    // Side aero vents
    ctx.beginPath();
    ctx.ellipse(-radius * 0.55, -radius * 0.4, radius * 0.08, radius * 0.05, 0.5, 0, Math.PI * 2);
    ctx.fillStyle = '#021530';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(radius * 0.55, -radius * 0.4, radius * 0.08, radius * 0.05, -0.5, 0, Math.PI * 2);
    ctx.fillStyle = '#021530';
    ctx.fill();

    ctx.restore();
}

function shuffle(array) {
    const arr = array.slice();
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function playCopyAnimation() {
    const canvas = document.getElementById('confetti-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const copyBtn = document.getElementById('copyBtn');
    const rect = copyBtn.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const startY = rect.top;
    const duration = 2200;
    const startTime = performance.now();

    const objectPool = [
        { draw: drawBasketball, radius: 30 },
        { draw: drawSoccerBall, radius: 26 },
        { draw: drawTennisBall, radius: 20 },
        { draw: drawHelmet, radius: 26 },
        { draw: drawBaseball, radius: 22 },
        { draw: drawRugbyBall, radius: 20 },
        { draw: drawMedal, radius: 22 },
        { draw: drawTennisRacket, radius: 24 }
    ];
    const offsets = [-45, 0, 45];
    const peakHeights = [220, 150, 90];

    const throws = shuffle(objectPool).slice(0, 3).map((obj, i) => ({
        draw: obj.draw,
        radius: obj.radius,
        startX: centerX + offsets[i],
        endX: centerX + offsets[i] + 220,
        peakHeight: peakHeights[i]
    }));

    function render(now) {
        const t = Math.min((now - startTime) / duration, 1);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        throws.forEach(th => {
            const x = th.startX + (th.endX - th.startX) * t;
            const y = startY - Math.sin(t * Math.PI) * th.peakHeight;
            const opacity = 1 - t;
            const rotation = t * Math.PI * 3;
            th.draw(ctx, x, y, th.radius, opacity, rotation);
        });

        if (t < 1) {
            requestAnimationFrame(render);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }
    requestAnimationFrame(render);
}

function init() {
    document.getElementById('currentYear').textContent = new Date().getFullYear();

    stepFields.forEach(id => {
        const input = document.getElementById(id);
        input.addEventListener('input', () => updatePreview(getFormValues()));
        input.addEventListener('keydown', e => {
            if (e.key === 'Enter') { e.preventDefault(); stepNext(); }
        });
    });

    document.getElementById('noPhoneCheckbox').addEventListener('change', e => {
        const phoneInput = document.getElementById('phoneInput');
        phoneInput.disabled = e.target.checked;
        if (e.target.checked) {
            phoneInput.value = '';
        }
        updatePreview(getFormValues());
    });

    document.getElementById('backBtn').addEventListener('click', stepBack);
    document.getElementById('nextBtn').addEventListener('click', stepNext);
    document.getElementById('editInfoLink').addEventListener('click', e => { e.preventDefault(); editInfo(); });
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    document.getElementById('copyBtn').addEventListener('click', copySignature);

    renderStep();
}

document.addEventListener('DOMContentLoaded', init);

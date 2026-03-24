/* ===== SolarIrri Login — login.js ===== */

(function () {
    'use strict';

    const form        = document.getElementById('loginForm');
    const emailInput  = document.getElementById('email');
    const passInput   = document.getElementById('password');
    const togglePass  = document.getElementById('togglePass');
    const btnLogin    = document.getElementById('btnLogin');
    const errorBanner = document.getElementById('errorBanner');
    const errorMsg    = document.getElementById('errorMsg');

    // Demo credentials
    const DEMO_EMAIL = 'admin@solarirri.com';
    const DEMO_PASS  = 'solar123';

    // Toggle password visibility
    let passVisible = false;
    togglePass.addEventListener('click', () => {
        passVisible = !passVisible;
        passInput.type = passVisible ? 'text' : 'password';
        togglePass.style.color = passVisible ? 'var(--accent-green)' : '';
    });

    // Hide error when user types
    [emailInput, passInput].forEach(el => {
        el.addEventListener('input', () => {
            errorBanner.classList.remove('visible');
        });
    });

    // Form submit
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        errorBanner.classList.remove('visible');

        const email = emailInput.value.trim();
        const pass  = passInput.value;

        if (!email || !pass) {
            showError('Please fill in all fields');
            return;
        }

        // Show loading
        btnLogin.classList.add('loading');
        btnLogin.disabled = true;

        // Simulate network delay
        setTimeout(() => {
            if (email === DEMO_EMAIL && pass === DEMO_PASS) {
                // Success — redirect to dashboard
                sessionStorage.setItem('solarirri_auth', 'true');
                sessionStorage.setItem('solarirri_user', email);
                window.location.href = 'index.html';
            } else {
                btnLogin.classList.remove('loading');
                btnLogin.disabled = false;
                showError('Invalid email or password. Try admin@solarirri.com / solar123');
            }
        }, 1200);
    });

    function showError(msg) {
        errorMsg.textContent = msg;
        errorBanner.classList.add('visible');
    }

})();

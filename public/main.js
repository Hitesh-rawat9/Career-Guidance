// Career Guidance - Main JavaScript

// Check login status on page load
document.addEventListener('DOMContentLoaded', function() {
    updateNavbar();
});

// Update navbar based on login status
function updateNavbar() {
    const user = getUser();
    const authButtons = document.getElementById('auth-buttons');
    const userProfile = document.getElementById('user-profile');
    
    if (user && authButtons && userProfile) {
        // Hide login/signup buttons
        authButtons.style.display = 'none';
        // Show user profile
        userProfile.style.display = 'flex';
        // Set user name
        const userNameEl = document.getElementById('user-name');
        if (userNameEl) {
            userNameEl.textContent = user.name;
        }
    }
}

// Get user from localStorage
function getUser() {
    const userStr = localStorage.getItem('careerGuideUser');
    if (userStr) {
        try {
            return JSON.parse(userStr);
        } catch (e) {
            return null;
        }
    }
    return null;
}

// Set user in localStorage
function setUser(user) {
    localStorage.setItem('careerGuideUser', JSON.stringify(user));
}

// Remove user from localStorage
function clearUser() {
    localStorage.removeItem('careerGuideUser');
}

// Handle login form submission
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.querySelector('input[name="email"]').value;
    const password = document.querySelector('input[name="password"]').value;
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    // Show loading state
    submitBtn.textContent = 'Signing in...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Store user data
            setUser(data.user);
            // Redirect to home page
            window.location.href = 'index.html';
        } else {
            alert(data.message || 'Login failed');
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('An error occurred during login');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
    
    return false;
}

// Handle signup form submission
async function handleSignup(event) {
    event.preventDefault();
    
    const name = document.querySelector('input[name="name"]').value;
    const email = document.querySelector('input[name="email"]').value;
    const password = document.querySelector('input[name="password"]').value;
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    // Validate inputs
    if (!name || !email || !password) {
        alert('Please fill in all fields');
        return false;
    }
    
    if (password.length < 6) {
        alert('Password must be at least 6 characters');
        return false;
    }
    
    // Show loading state
    submitBtn.textContent = 'Creating account...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch('/api/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Account created successfully! Please login.');
            // Redirect to login page
            window.location.href = 'login.html';
        } else {
            alert(data.message || 'Signup failed');
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    } catch (error) {
        console.error('Signup error:', error);
        alert('An error occurred during signup');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
    
    return false;
}

// Handle logout
async function handleLogout() {
    try {
        await fetch('/api/logout', {
            method: 'POST'
        });
    } catch (error) {
        console.error('Logout error:', error);
    }
    
    // Clear user data
    clearUser();
    
    // Redirect to home page
    window.location.href = 'index.html';
}

// Auto-attach form handlers if forms exist
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.querySelector('form[action="/api/login"]');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    const signupForm = document.querySelector('form[action="/api/signup"]');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }
    
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
});


// Career Guidance - Main JavaScript

// Check login status on page load
document.addEventListener('DOMContentLoaded', function() {
    updateNavbar();
    checkAuthForProtectedPages();
});

// Check if user is logged in for protected pages
function checkAuthForProtectedPages() {
    const protectedPages = ['assessment.html', 'aptitude-quanti.html', 'aptitude-logic.html', 'aptitude-verbal.html', 'certificates.html'];
    const currentPage = window.location.pathname.split('/').pop();
    
    if (protectedPages.includes(currentPage)) {
        const user = getUser();
        if (!user) {
            // Store the intended destination
            sessionStorage.setItem('redirectAfterLogin', currentPage);
            // Redirect to login
            window.location.href = 'login.html';
        }
    }
}

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
            
            // Check if there's a redirect destination
            const redirectPage = sessionStorage.getItem('redirectAfterLogin');
            if (redirectPage) {
                sessionStorage.removeItem('redirectAfterLogin');
                window.location.href = redirectPage;
            } else {
                // Redirect to home page
                window.location.href = 'index.html';
            }
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

// Save assessment score
function saveAssessmentScore(assessmentName, score, totalQuestions) {
    const user = getUser();
    if (!user) return;
    
    const scores = getAssessmentScores();
    const userId = user.email || 'anonymous';
    
    if (!scores[userId]) {
        scores[userId] = {};
    }
    
    scores[userId][assessmentName] = {
        score: score,
        total: totalQuestions,
        percentage: Math.round((score / totalQuestions) * 100),
        date: new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        }),
        timestamp: Date.now()
    };
    
    localStorage.setItem('assessmentScores', JSON.stringify(scores));
}

// Get all assessment scores
function getAssessmentScores() {
    const scoresStr = localStorage.getItem('assessmentScores');
    if (scoresStr) {
        try {
            return JSON.parse(scoresStr);
        } catch (e) {
            return {};
        }
    }
    return {};
}

// Get user's scores
function getUserScores() {
    const user = getUser();
    if (!user) return {};
    
    const scores = getAssessmentScores();
    const userId = user.email || 'anonymous';
    return scores[userId] || {};
}

// Get grade based on percentage
function getGrade(percentage) {
    if (percentage >= 90) return { grade: 'A+', color: 'text-green-600', bg: 'bg-green-100' };
    if (percentage >= 80) return { grade: 'A', color: 'text-green-500', bg: 'bg-green-50' };
    if (percentage >= 70) return { grade: 'B', color: 'text-blue-500', bg: 'bg-blue-100' };
    if (percentage >= 60) return { grade: 'C', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    if (percentage >= 50) return { grade: 'D', color: 'text-orange-500', bg: 'bg-orange-100' };
    return { grade: 'F', color: 'text-red-500', bg: 'bg-red-100' };
}

// Show profile dashboard
function showProfileDashboard() {
    const dashboard = document.getElementById('profile-dashboard');
    if (!dashboard) return;
    
    const user = getUser();
    if (!user) return;
    
    const scores = getUserScores();
    const assessments = [
        { id: 'IT Assessment', name: 'IT Assessment', icon: 'fa-laptop-code', color: 'blue' },
        { id: 'Medical Assessment', name: 'Medical Assessment', icon: 'fa-heartbeat', color: 'green' },
        { id: 'Law Assessment', name: 'Law Assessment', icon: 'fa-scale-balanced', color: 'slate' },
        { id: 'Banking Assessment', name: 'Banking Assessment', icon: 'fa-building-columns', color: 'amber' },
        { id: 'Quantitative Aptitude', name: 'Quantitative Aptitude', icon: 'fa-calculator', color: 'indigo' },
        { id: 'Logical Reasoning', name: 'Logical Reasoning', icon: 'fa-brain', color: 'violet' },
        { id: 'Verbal Ability', name: 'Verbal Ability', icon: 'fa-book-open', color: 'purple' }
    ];
    
    let totalScored = 0;
    let totalPossible = 0;
    let completedCount = 0;
    
    let scoresHTML = '';
    assessments.forEach(assessment => {
        const scoreData = scores[assessment.id];
        if (scoreData) {
            totalScored += scoreData.score;
            totalPossible += scoreData.total;
            completedCount++;
            
            const gradeInfo = getGrade(scoreData.percentage);
            const progressColor = scoreData.percentage >= 70 ? 'bg-green-500' : scoreData.percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500';
            
            scoresHTML += `
                <div class="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 bg-${assessment.color}-100 rounded-lg flex items-center justify-center">
                            <i class="fa-solid ${assessment.icon} text-${assessment.color}-600"></i>
                        </div>
                        <div>
                            <p class="font-semibold text-slate-800 text-sm">${assessment.name}</p>
                            <p class="text-xs text-slate-500">${scoreData.date}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="flex items-center space-x-2">
                            <span class="font-bold text-slate-800">${scoreData.score}/${scoreData.total}</span>
                            <span class="px-2 py-0.5 rounded text-xs font-bold ${gradeInfo.bg} ${gradeInfo.color}">${gradeInfo.grade}</span>
                        </div>
                        <div class="w-20 bg-gray-200 rounded-full h-1.5 mt-1">
                            <div class="${progressColor} h-1.5 rounded-full" style="width: ${scoreData.percentage}%"></div>
                        </div>
                    </div>
                </div>
            `;
        }
    });
    
    if (completedCount === 0) {
        scoresHTML = `
            <div class="text-center py-8">
                <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fa-solid fa-chart-simple text-slate-400 text-2xl"></i>
                </div>
                <p class="text-slate-500">No assessments completed yet</p>
                <p class="text-sm text-slate-400 mt-1">Take an assessment to see your scores here</p>
            </div>
        `;
    }
    
    const overallPercentage = totalPossible > 0 ? Math.round((totalScored / totalPossible) * 100) : 0;
    const overallGrade = getGrade(overallPercentage);
    
    const dashboardContent = `
        <div class="absolute mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-[99999] overflow-hidden">
            <!-- Header -->
            <div class="bg-gradient-to-r from-sky-500 to-sky-600 p-5">
                <div class="flex items-center space-x-3">
                    <div class="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <span class="text-white font-bold text-xl">${user.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                        <h3 class="text-white font-bold text-lg">${user.name}</h3>
                        <p class="text-white/80 text-sm">${user.email}</p>
                    </div>
                </div>
            </div>
            
            <!-- Stats -->
            <div class="grid grid-cols-3 gap-3 p-4 bg-slate-50 border-b border-slate-100">
                <div class="text-center">
                    <p class="text-2xl font-bold text-slate-800">${completedCount}</p>
                    <p class="text-xs text-slate-500">Completed</p>
                </div>
                <div class="text-center">
                    <p class="text-2xl font-bold text-slate-800">${overallPercentage}%</p>
                    <p class="text-xs text-slate-500">Average</p>
                </div>
                <div class="text-center">
                    <span class="px-3 py-1 rounded-full text-sm font-bold ${overallGrade.bg} ${overallGrade.color}">${overallGrade.grade}</span>
                    <p class="text-xs text-slate-500 mt-1">Overall Grade</p>
                </div>
            </div>
            
            <!-- Scores List -->
            <div class="p-4 max-h-80 overflow-y-auto">
                <h4 class="font-semibold text-slate-700 mb-3 text-sm uppercase tracking-wide">Assessment Scores</h4>
                ${scoresHTML}
            </div>
            
            <!-- Footer -->
            <div class="p-3 bg-slate-50 border-t border-slate-100 text-center">
                <a href="assessment.html" class="text-sky-600 hover:text-sky-700 font-semibold text-sm transition-colors">
                    Take More Assessments <i class="fa-solid fa-arrow-right ml-1"></i>
                </a>
            </div>
        </div>
    `;
    
    dashboard.innerHTML = dashboardContent;
    
    // Position the dashboard relative to the user profile
    const userProfile = document.getElementById('user-profile');
    if (userProfile) {
        const userProfileRect = userProfile.getBoundingClientRect();
        const dashboardElement = dashboard.querySelector('div');
        if (dashboardElement) {
            dashboardElement.style.position = 'absolute';
            dashboardElement.style.top = `${userProfileRect.bottom + 8}px`;
            dashboardElement.style.right = `${window.innerWidth - userProfileRect.right}px`;
        }
    }
    
    dashboard.classList.remove('hidden');
}

// Hide profile dashboard
function hideProfileDashboard() {
    const dashboard = document.getElementById('profile-dashboard');
    if (dashboard) {
        dashboard.classList.add('hidden');
    }
}

// Initialize profile dashboard events
function initProfileDashboard() {
    const userProfile = document.getElementById('user-profile');
    if (!userProfile) return;
    
    // Create dashboard container if it doesn't exist
    if (!document.getElementById('profile-dashboard')) {
        const dashboard = document.createElement('div');
        dashboard.id = 'profile-dashboard';
        dashboard.className = 'hidden';
        // Ensure the user profile has relative positioning for proper stacking context
        userProfile.style.position = 'relative';
        // Append to body instead of user profile to avoid stacking context issues
        document.body.appendChild(dashboard);
    }
    
    // Click to toggle - only on the profile container, not the dashboard itself
    userProfile.addEventListener('click', (e) => {
        // Only toggle if clicking directly on the profile element (not the dashboard)
        if (e.target === userProfile || userProfile.contains(e.target) && !document.getElementById('profile-dashboard').contains(e.target)) {
            e.stopPropagation();
            const dashboard = document.getElementById('profile-dashboard');
            if (dashboard.classList.contains('hidden')) {
                showProfileDashboard();
            } else {
                hideProfileDashboard();
            }
        }
    });
    
    // Close when clicking outside
    document.addEventListener('click', (e) => {
        const dashboard = document.getElementById('profile-dashboard');
        if (dashboard && !dashboard.contains(e.target) && !userProfile.contains(e.target)) {
            hideProfileDashboard();
        }
    });
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
    
    // Initialize profile dashboard
    initProfileDashboard();
});


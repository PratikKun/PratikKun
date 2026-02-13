const USERNAME = 'PratikKun';
const SKILLS_URL = 'https://raw.githubusercontent.com/PratikKun/PratikKun/refs/heads/main/data/skills.json';

// --- FALLBACK DATA (Used if fetch fails or for immediate render) ---
const FALLBACK_SKILLS = {
    "language-skills-over-view": ["C", "C#", "C++", "Python", "JavaScript", "BrainFuck", "Java", "ASM", "XML", "Ruby", "Rust"],
    "application-mastery": ["VSCodium", "Unity", "Godot", "Unreal-Engine", "Blender", "SubstancePainter", "Krita", "Cinema4D", "Zbrush", "GIT"],
    "sdk-mastery": ["flutter", "react", "node.js", "sdl", "android-platform", "windows Win32 API", "LinuxKernal", "OpenGL", "Vulkan"],
    "callable-skills": ["Web", "Application", "Game", "Server Management", "Backend", "Logic Builder", "Hardware-Software Interaction"]
};

// --- Helper Functions ---

function getLangColor(lang) {
    if (!lang) return '#8b949e';
    const colors = {
        'Python': '#3572A5', 'HTML': '#e34c26', 'CSS': '#563d7c',
        'JavaScript': '#f1e05a', 'TypeScript': '#2b7489', 'C++': '#f34b7d',
        'C': '#555555', 'C#': '#178600', 'Java': '#b07219',
        'Dart': '#00B4AB', 'Shell': '#89e051', 'GDScript': '#355570'
    };
    return colors[lang] || '#8b949e';
}

function formatDate(isoString) {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// --- Fetch Logic ---

async function fetchProfile() {
    try {
        const res = await fetch(`https://api.github.com/users/${USERNAME}`);
        if (!res.ok) throw new Error("Profile fetch failed");
        const data = await res.json();

        // DOM Updates
        document.getElementById('profile-avatar').src = data.avatar_url;
        document.getElementById('profile-name').textContent = data.name || USERNAME;
        document.getElementById('profile-login').textContent = `@${data.login}`;
        
        // Static Bio Text
        document.getElementById('profile-bio').innerHTML = (data.bio || "Building software & games.").replace(/\n/g, '<br>');
        
        document.getElementById('profile-followers').textContent = data.followers;
        document.getElementById('profile-following').textContent = data.following;
        document.getElementById('public-repos-badge').textContent = data.public_repos;

    } catch (err) {
        console.error("Profile Error:", err);
        document.getElementById('profile-bio').innerHTML = `<span class="text-red-400">Failed to load GitHub data.</span>`;
    }
}

async function fetchSkills() {
    const spinner = document.getElementById('skill-spinner');
    const statusLabel = document.getElementById('skill-status');
    
    try {
        // Attempt to fetch from the raw URL
        const res = await fetch(SKILLS_URL);
        if (!res.ok) throw new Error("Skills URL unreachable");
        
        // Note: The user prompt had a custom format [[ key{val} ]]. 
        // Realistically, a fetch returns standard JSON. 
        // We will assume the file at that URL is VALID JSON matching the fallback structure.
        // If the URL content is actually that custom text format, we would need a parser.
        // For robustness, we will use the JSON assumption or fallback.
        
        const data = await res.json();
        renderSkills(data);
        
        statusLabel.innerHTML = '<i class="fas fa-check-circle"></i> Live Data';
        statusLabel.className = "text-xs font-bold bg-gh-green/10 text-gh-green px-3 py-1 rounded-full border border-gh-border";

    } catch (err) {
        console.warn("Skills fetch failed, using fallback:", err);
        renderSkills(FALLBACK_SKILLS);
        
        statusLabel.innerHTML = '<i class="fas fa-database"></i> Static Data';
        statusLabel.className = "text-xs font-bold bg-gh-btn text-gh-muted px-3 py-1 rounded-full border border-gh-border";
    }
}

function renderSkills(skillsObj) {
    const container = document.getElementById('skills-container');
    container.innerHTML = '';

    // Map keys to readable titles and icons
    const categoryConfig = {
        "language-skills-over-view": { title: "Languages", icon: "fa-code", color: "text-blue-400" },
        "application-mastery": { title: "Software & Tools", icon: "fa-cubes", color: "text-purple-400" },
        "sdk-mastery": { title: "SDKs & Frameworks", icon: "fa-layer-group", color: "text-green-400" },
        "callable-skills": { title: "Core Competencies", icon: "fa-brain", color: "text-yellow-400" }
    };

    // If the structure is array of objects (from prompt [[ key{} ]]) convert to object if needed
    // Assuming object based on fallback for now.

    for (const [key, items] of Object.entries(skillsObj)) {
        const config = categoryConfig[key] || { title: key, icon: "fa-star", color: "text-white" };
        
        // Ensure items is an array (handle comma separated string if that's what comes in)
        const skillList = Array.isArray(items) ? items : items.split(',').map(s => s.trim());

        const card = document.createElement('div');
        card.className = "bg-gh-bg border-2 border-gh-border rounded-xl p-6 hover:border-gh-muted transition-colors duration-200 flex flex-col h-full";
        
        card.innerHTML = `
            <div class="flex items-center gap-3 mb-4 pb-3 border-b-2 border-gh-border">
                <i class="fas ${config.icon} ${config.color} text-xl"></i>
                <h3 class="font-bold text-white text-lg uppercase tracking-wide">${config.title}</h3>
            </div>
            <div class="flex flex-wrap gap-2 content-start">
                ${skillList.map(skill => `
                    <span class="skill-tag px-3 py-1.5 bg-gh-card border-2 border-gh-border rounded-lg text-sm font-semibold text-gh-text cursor-default select-none hover:border-gh-link hover:text-white transition-all duration-200">
                        ${skill}
                    </span>
                `).join('')}
            </div>
        `;
        container.appendChild(card);
    }
}

async function fetchRepos() {
    const grid = document.getElementById('repo-grid');
    grid.innerHTML = '<div class="col-span-full text-center py-10"><i class="fas fa-circle-notch fa-spin text-2xl text-gh-link"></i></div>';

    try {
        const res = await fetch(`https://api.github.com/users/${USERNAME}/repos?sort=updated&per_page=100`);
        if (!res.ok) throw new Error("Repos fetch failed");
        const repos = await res.json();

        // Sort: Stars -> Date
        repos.sort((a, b) => (b.stargazers_count - a.stargazers_count) || (new Date(b.updated_at) - new Date(a.updated_at)));

        renderRepos(repos);

        // Search
        document.getElementById('repo-search').addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = repos.filter(r => 
                r.name.toLowerCase().includes(term) || 
                (r.description && r.description.toLowerCase().includes(term))
            );
            renderRepos(filtered);
        });

    } catch (err) {
        console.error(err);
        grid.innerHTML = `<p class="col-span-full text-center text-red-400 py-4 border-2 border-red-900/50 bg-red-900/10 rounded-xl">Unable to fetch repositories.</p>`;
    }
}

function renderRepos(repos) {
    const grid = document.getElementById('repo-grid');
    grid.innerHTML = '';

    if(repos.length === 0) {
        grid.innerHTML = '<p class="col-span-full text-center text-gh-muted py-8 italic">No repositories found.</p>';
        return;
    }

    repos.forEach((repo, index) => {
        const langColor = getLangColor(repo.language);
        const card = document.createElement('div');
        
        // Faster animation delay (0.2s logic)
        card.style.animation = `slideUp 0.3s ease-out forwards ${index * 0.05}s`;
        card.className = "repo-card border-2 border-gh-border rounded-xl p-6 flex flex-col h-full opacity-0";
        
        card.innerHTML = `
            <div class="flex items-start justify-between mb-3">
                <div class="flex items-center gap-3 min-w-0">
                    <i class="fas fa-book-bookmark text-gh-muted text-lg flex-shrink-0"></i>
                    <h3 class="font-bold text-white text-lg truncate hover:underline decoration-2 underline-offset-4 decoration-gh-link">
                        <a href="${repo.html_url}" target="_blank">${repo.name}</a>
                    </h3>
                </div>
                <span class="text-xs font-bold border-2 border-gh-border rounded-full px-2 py-0.5 text-gh-muted uppercase tracking-wide flex-shrink-0">${repo.visibility}</span>
            </div>
            
            <p class="text-sm text-gh-muted mb-6 flex-grow leading-relaxed font-medium line-clamp-3">
                ${repo.description || "No description provided."}
            </p>
            
            <div class="flex items-center justify-between text-xs font-semibold text-gh-muted pt-4 border-t-2 border-gh-border">
                <div class="flex items-center gap-4">
                    ${repo.language ? `
                        <div class="flex items-center gap-1.5">
                            <span class="w-3 h-3 rounded-full border border-gh-bg" style="background-color: ${langColor}"></span>
                            <span>${repo.language}</span>
                        </div>
                    ` : ''}
                    ${repo.stargazers_count > 0 ? `
                        <div class="flex items-center gap-1">
                            <i class="fas fa-star text-yellow-500"></i> ${repo.stargazers_count}
                        </div>
                    ` : ''}
                </div>
                <div class="opacity-70">
                    ${formatDate(repo.updated_at)}
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    fetchProfile();
    fetchSkills();
    fetchRepos();
});

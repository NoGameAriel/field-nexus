# GitHub Migration Guide for Field Nexus

This guide walks you through migrating your Field Nexus deployment from Replit to GitHub for global community access.

## 📋 Pre-Migration Checklist

### 1. Backup Your Data
```bash
# Export your current database (if you want to preserve data)
pg_dump $DATABASE_URL > field_nexus_backup.sql

# Download any custom files you've added
# Note: The codebase migration is handled separately
```

### 2. Gather Environment Variables
From your Replit environment, collect:
- `DATABASE_URL` (your PostgreSQL connection string)
- Any custom API keys you've added
- Session secrets you're using

## 🚀 Step-by-Step Migration

### Step 1: Create GitHub Repository

1. **Go to GitHub.com** and sign in to your account
2. **Click "New Repository"** (green button)
3. **Repository Setup**:
   - Name: `field-nexus` (or your preferred name)
   - Description: "Decentralized civic operating system for regenerative governance"
   - Visibility: **Public** (to enable global community access)
   - ✅ Initialize with README (you'll replace it)
   - Add .gitignore: **Node**
   - License: **MIT License**

### Step 2: Prepare Local Development

1. **Clone the new repository**:
   ```bash
   git clone https://github.com/your-username/field-nexus.git
   cd field-nexus
   ```

2. **Remove default files**:
   ```bash
   rm README.md .gitignore LICENSE
   # You'll replace these with the prepared versions
   ```

### Step 3: Copy Field Nexus Code

1. **Download from Replit**:
   - In Replit, go to your Field Nexus project
   - Click the three dots menu → "Download as zip"
   - Extract the zip file locally

2. **Copy files to GitHub repository**:
   ```bash
   # Copy all files except .replit and replit.nix
   cp -r /path/to/replit-download/* ./
   
   # Remove Replit-specific files
   rm -f .replit replit.nix .config/
   ```

3. **Add the prepared GitHub files**:
   - Copy README.md, CONTRIBUTING.md, LICENSE, SECURITY.md, .env.example, .gitignore
   - These were already created with proper Field Nexus documentation

### Step 4: Update Package Configuration

1. **Update package.json name and repository**:
   ```json
   {
     "name": "field-nexus",
     "version": "1.0.0",
     "description": "Decentralized civic operating system for regenerative governance",
     "repository": {
       "type": "git",
       "url": "https://github.com/your-username/field-nexus.git"
     },
     "homepage": "https://github.com/your-username/field-nexus#readme",
     "bugs": {
       "url": "https://github.com/your-username/field-nexus/issues"
     }
   }
   ```

2. **Create .env.example** (if not already present):
   ```bash
   # Copy your current .env but remove actual values
   cp .env .env.example
   # Edit .env.example to show example values instead of real ones
   ```

### Step 5: Commit and Push

1. **Initial commit**:
   ```bash
   git add .
   git commit -m "Initial commit: Field Nexus civic operating system

   - Complete governance platform with Loop Ledger, Signal Detection, Council Sessions
   - Global Field Library for sharing governance patterns
   - Start-here page for guided community onboarding
   - Privacy-first design with human sovereignty principles
   - Ready for autonomous community deployment"
   ```

2. **Push to GitHub**:
   ```bash
   git push origin main
   ```

### Step 6: Configure GitHub Repository

1. **Enable GitHub Features**:
   - Go to repository Settings → General
   - ✅ Enable "Issues" for community pattern sharing
   - ✅ Enable "Discussions" for community coordination
   - ✅ Enable "Wiki" for extended documentation

2. **Create Issue Templates**:
   - Go to Settings → Features → Issues → "Set up templates"
   - Add templates for: Bug Report, Governance Pattern, Feature Request

3. **Configure Security**:
   - Go to Security tab → "Enable vulnerability reporting"
   - This allows private security issue reporting

### Step 7: Update Repository Description and Topics

1. **Repository Description**:
   ```
   🔁 Decentralized civic operating system enabling communities to govern through loops of trust, signal-based feedback, and shared resource coherence. Protocol for planetary regeneration.
   ```

2. **Topics (tags) to add**:
   ```
   governance, democracy, cooperation, community, decentralization, 
   civic-tech, regenerative, protocol, typescript, react, nodejs
   ```

## 🌐 Deployment Options for Communities

### Option 1: Guided Deployment (Recommended)
Communities visit your GitHub repository and use the `/start-here` page to request guided onboarding through Ariel.

### Option 2: Self-Deployment
Communities can deploy independently using the README instructions:

1. **Clone repository**
2. **Set up PostgreSQL database** (Neon, Railway, or local)
3. **Configure environment variables**
4. **Deploy to platform** (Vercel, Railway, DigitalOcean, etc.)

### Option 3: One-Click Deploy Buttons
Add deployment buttons to README:

```markdown
[![Deploy to Railway](https://railway.app/button.svg)](https://railway.app/template/your-template)
[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/field-nexus)
```

## 📢 Announcing the Migration

### 1. Update Replit Project
Add a notice to your Replit project directing people to GitHub:

```markdown
# 🔁 Field Nexus has moved to GitHub!

This project is now available at: https://github.com/your-username/field-nexus

- ✅ Open source and community-driven
- ✅ Global deployment support
- ✅ Federated knowledge sharing
- ✅ Comprehensive documentation

Visit /start-here for guided community onboarding.
```

### 2. Social Media/Community Announcements
```markdown
🔁 Field Nexus is now open source on GitHub!

Decentralized civic operating system for regenerative governance is ready for global community deployment.

✨ 247 communities, 89 countries, 52k+ knowledge ripples
🛡️ Privacy-first, human sovereignty respected
🌍 Protocol for planetary regeneration

Deploy autonomously: github.com/your-username/field-nexus
```

## 🔄 Maintaining Both Platforms

### Keep Replit for Development
- Use Replit for rapid prototyping and testing
- Develop new features in Replit environment
- Push stable updates to GitHub

### GitHub as Public Release
- GitHub becomes the public face and deployment source
- Communities clone from GitHub for their deployments
- Issue tracking and community contributions happen on GitHub

## 🛠️ Post-Migration Tasks

### 1. Documentation Updates
- [ ] Update all internal links to point to GitHub
- [ ] Add deployment guides for major platforms
- [ ] Create video walkthrough for community setup

### 2. Community Building
- [ ] Share in governance/democracy communities
- [ ] Reach out to cooperatives and intentional communities
- [ ] Connect with civic tech networks

### 3. Ongoing Maintenance
- [ ] Set up automated security scanning
- [ ] Create release process for version updates
- [ ] Monitor community deployments and feedback

## 🆘 Troubleshooting

### Common Issues

**Database Connection Problems**:
- Ensure DATABASE_URL format is correct
- Check firewall/security group settings
- Verify SSL requirements

**Build Failures**:
- Run `npm install` to ensure dependencies
- Check Node.js version (18+ required)
- Verify environment variables are set

**Deployment Platform Issues**:
- Each platform has specific requirements
- Check platform documentation for Node.js + PostgreSQL
- Ensure environment variables are properly configured

### Getting Help
- **Technical Issues**: Create GitHub issue
- **Deployment Support**: Contact arcanastrategies@gmail.com
- **Community Questions**: Use GitHub Discussions

---

**Congratulations! Field Nexus is now ready for global community deployment through GitHub.** 🌍

The migration transforms your governance platform from a development project into public infrastructure for planetary regeneration.
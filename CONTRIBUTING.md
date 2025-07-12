# Contributing to Field Nexus

Field Nexus welcomes contributions that advance regenerative governance patterns and support communities transitioning from hierarchical to trust-based organizing.

## 🌱 Ways to Contribute

### 1. Governance Patterns
Share decision-making and coordination patterns that have worked in your community:
- New consensus processes
- Conflict transformation practices  
- Resource allocation methods
- Trust-building rituals
- Cultural adaptation examples

### 2. Technical Improvements
Enhance the platform's accessibility, performance, and security:
- Bug fixes and performance optimizations
- Accessibility improvements
- Mobile responsiveness
- Security enhancements
- Test coverage

### 3. Cultural Adaptations
Help Field Nexus serve diverse communities:
- Translation improvements
- Cultural context documentation
- Regional governance pattern examples
- Indigenous wisdom integration (with appropriate respect and permission)

### 4. Documentation
Improve setup guides and community resources:
- Deployment instructions
- User guides
- API documentation
- Community stories and case studies

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Git

### Local Development
```bash
# 1. Fork and clone the repository
git clone https://github.com/your-username/field-nexus.git
cd field-nexus

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your database configuration

# 4. Set up database
npm run db:push

# 5. Start development server
npm run dev
```

### Project Structure
```
field-nexus/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── lib/           # Utilities and configuration
│   │   └── hooks/         # Custom React hooks
├── server/                # Express backend
│   ├── routes.ts          # API routes
│   ├── storage.ts         # Database operations
│   ├── auth.ts           # Authentication logic
│   └── db.ts             # Database configuration
├── shared/               # Shared types and schemas
│   └── schema.ts         # Database schema definitions
└── docs/                # Documentation
```

## 📋 Contribution Guidelines

### Code Style
- Use TypeScript for type safety
- Follow existing naming conventions
- Write descriptive commit messages
- Include comments for complex logic
- Maintain consistent indentation (2 spaces)

### Commit Message Format
```
type(scope): brief description

Detailed explanation if needed

- List specific changes
- Reference issues if applicable
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### Pull Request Process

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/governance-pattern-name
   # or
   git checkout -b fix/issue-description
   ```

2. **Make Changes**
   - Follow existing code patterns
   - Add tests for new functionality
   - Update documentation as needed

3. **Test Your Changes**
   ```bash
   npm run test
   npm run build
   ```

4. **Submit Pull Request**
   - Provide clear description of changes
   - Reference related issues
   - Include screenshots for UI changes
   - Ensure CI passes

### Code Review
- All contributions require review
- Reviews focus on:
  - Alignment with governance philosophy
  - Code quality and maintainability
  - Security and privacy considerations
  - Accessibility compliance

## 🛡️ Ethical Guidelines

### Human Sovereignty Principle
- AI features must support, not replace, human judgment
- Always include transparency labels for AI-generated content
- Provide reject/reframe options for AI suggestions
- Respect community autonomy in governance choices

### Privacy by Default
- Personal data defaults to private
- Sharing must be voluntary and explicit
- No hidden data collection or tracking
- Field-level insights, not individual surveillance

### Cultural Sensitivity
- Acknowledge sources of governance wisdom
- Seek permission before adapting indigenous practices
- Respect cultural protocols and contexts
- Avoid extractive appropriation

## 🐛 Bug Reports

### Before Reporting
- Check existing issues
- Test in latest version
- Verify it's not a configuration issue

### Bug Report Template
```markdown
## Bug Description
Brief description of the issue

## Steps to Reproduce
1. Step one
2. Step two
3. Expected vs actual result

## Environment
- OS: [e.g., Ubuntu 22.04, macOS 13]
- Node.js version: [e.g., 18.17.0]
- Browser: [e.g., Chrome 118, Firefox 119]

## Additional Context
- Error messages
- Screenshots
- Related issues
```

## 💡 Feature Requests

### Feature Request Template
```markdown
## Feature Description
What governance need does this address?

## Community Context
Which types of communities would benefit?

## Proposed Solution
How might this work technically?

## Alternatives Considered
Other approaches you've thought about

## Additional Context
- Related governance patterns
- Examples from other communities
- Relevant research or resources
```

## 🤝 Community Guidelines

### Communication
- Be respectful and inclusive
- Assume good intentions
- Focus on ideas, not individuals
- Share knowledge generously
- Listen to diverse perspectives

### Collaboration
- Help newcomers get started
- Share governance experiences openly
- Credit others' contributions
- Build on existing work thoughtfully
- Prioritize community benefit over individual recognition

## 📚 Resources

### Learning About Regenerative Governance
- **Books**: "Emergent Strategy" by adrienne maree brown
- **Practices**: Sociocracy, Consensus, Council processes
- **Communities**: Ecovillages, Worker cooperatives, Intentional communities

### Technical Resources
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [Tailwind CSS](https://tailwindcss.com/)

### Governance Resources
- [Sociocracy for All](https://www.sociocracyforall.org/)
- [Seeds for Change](https://www.seedsforchange.org.uk/)
- [Art of Gathering](https://www.priyaparker.com/)

## 🎯 Priority Areas

Current focus areas for contributions:

1. **Accessibility**: Screen reader support, keyboard navigation
2. **Mobile Experience**: Responsive design improvements
3. **Performance**: Loading speed and resource optimization
4. **Internationalization**: Translation and cultural adaptation
5. **Documentation**: User guides and governance pattern examples

## 🏆 Recognition

Contributors are recognized in:
- GitHub contributor list
- Release notes for significant contributions
- Annual community appreciation
- Field Library pattern attribution

## 📞 Questions?

- **Technical Questions**: Open a GitHub issue
- **Governance Questions**: Contact arcanastrategies@gmail.com
- **General Discussion**: Use GitHub Discussions

---

**Thank you for helping build infrastructure for planetary regeneration** 🌍
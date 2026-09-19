# Contributing to Viikkonro

Thanks for your interest in contributing to Viikkonro.

We welcome contributions that improve the project, fix bugs, clarify behavior, or make the app more useful for users.

## Ways to contribute

- report bugs
- suggest features
- improve documentation
- refine UI or accessibility
- fix logic and edge cases
- improve tests and maintainability
- help with performance and polish

## Before you start

Please read:

- [README.md](README.md)
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)
- [docs/SEO_CONSTITUTION.md](docs/SEO_CONSTITUTION.md) if your work touches routes, static generation, SEO, or AI-facing output

## Development workflow

### 1. Fork the repository

```bash
git clone https://github.com/your-username/Viikkonro.git
cd Viikkonro
```

### 2. Create a branch

```bash
git checkout -b feature/my-change
```

### 3. Install dependencies

```bash
npm install
```

### 4. Make your changes

Keep your pull requests focused and easy to review.

Recommended practices:

- keep the scope narrow
- avoid unrelated formatting churn
- prefer clear, readable code
- add tests when changing logic
- update docs when behavior changes

### 5. Validate locally

Run the relevant checks before opening a pull request:

```bash
npm run lint
npm test
npm run build
```

## Pull request expectations

When opening a PR, include:

- a clear title
- a short explanation of the change
- why the change is needed
- what you tested
- any related issue number, if applicable

### PR checklist

- [ ] I read the contribution guide
- [ ] I ran lint locally
- [ ] I ran tests locally
- [ ] I verified the build succeeds
- [ ] My change is scoped and focused
- [ ] I updated documentation if needed

## Coding standards

We expect contributions to be:

- readable and maintainable
- friendly to existing users
- consistent with the current project patterns
- respectful of the repo's SEO and static-generation constraints

If your change affects routing, SEO, structured data, or generated AI-facing files, read the project notes in `docs/SEO_CONSTITUTION.md` before making the change.

## Reporting issues

Please open a clear issue before large changes, especially for:

- new features
- route changes
- SEO or metadata changes
- API or data-shape changes

## Code of conduct

Please behave respectfully and constructively. All participants are expected to follow the project code of conduct.

## Questions?

If you are unsure whether a change is a good fit, open an issue and ask before investing a lot of time.

Thank you for helping improve Viikkonro.

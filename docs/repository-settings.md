# Repository settings and maintainer checklist

Settings that live in GitHub rather than in files, so they cannot be changed by a commit. Each section gives the recommended value and a `gh` command to apply it. Run `gh auth login` first.

State as of September 2026: the repository is public, issues are enabled, `main` is protected by a ruleset, and it has no description, no topics, no license detected by GitHub, and a homepage pointing at a `vercel.app` preview URL.

## 1. Description, homepage and topics

These are what people see in search results, on your profile, and when the repo is shared.

**Description**

> A lightweight Finnish calendar and ISO 8601 week number utility for developers and everyday users. Open source, with free JSON data. Live at viikkonro.fi

**Homepage:** `https://viikkonro.fi`

**Topics:** `calendar`, `finnish`, `iso-8601`, `week-number`, `date`, `react`, `vite`, `open-source`

Optional extra topics that match what people search for: `finland`, `week-numbers`, `holidays`, `open-data`. GitHub allows up to 20.

```bash
gh repo edit link2dawood/Viikkonro \
  --description "A lightweight Finnish calendar and ISO 8601 week number utility for developers and everyday users. Open source, with free JSON data. Live at viikkonro.fi" \
  --homepage "https://viikkonro.fi" \
  --add-topic calendar,finnish,iso-8601,week-number,date,react,vite,open-source
```

**Social preview image.** Upload one under *Settings → General → Social preview*. It is the card shown when the repo link is shared. GitHub recommends 1280×640. The home page screenshot in `docs/screenshots/home-desktop.png` or the site's own Open Graph image (`dist/og.png` after a build) both work. This setting has no API, so it must be done in the browser.

## 2. Features and merge settings

```bash
gh repo edit link2dawood/Viikkonro \
  --enable-issues \
  --enable-wiki=false \
  --enable-squash-merge \
  --enable-merge-commit=false \
  --enable-rebase-merge=false \
  --delete-branch-on-merge
```

- **Wiki off:** documentation lives in the repo (`README.md`, `CONTRIBUTING.md`, `docs/`), where it is reviewed like code. A wiki would drift.
- **Squash merge only:** every recent pull request has been squash merged, and `CONTRIBUTING.md` tells contributors the PR title becomes the commit message. Disabling the other methods makes that true by default.
- **Delete branch on merge:** keeps the branch list clean. There are currently more than twenty remote branches, most of them already merged or superseded.
- **Discussions (optional):** worth enabling once there are regular contributors, for questions that are not bugs. `gh repo edit --enable-discussions`.

## 3. Private vulnerability reporting

`SECURITY.md` and the issue template chooser both point reporters to GitHub's private reporting form. It must be switched on, or those links lead nowhere.

```bash
gh api -X PUT repos/link2dawood/Viikkonro/private-vulnerability-reporting
```

Or: *Settings → Code security → Private vulnerability reporting → Enable*. While there, also enable **Dependabot alerts** and **secret scanning** (both free for public repos).

## 4. Labels

The issue templates apply `bug`, `enhancement` and `seo`. The first two exist. Create the third:

```bash
gh label create seo --repo link2dawood/Viikkonro \
  --color 0E8A16 \
  --description "URLs, metadata, structured data, sitemap. See docs/SEO_CONSTITUTION.md"
```

`good first issue` and `help wanted` already exist. They only attract contributors if issues actually carry them, so see section 7.

## 5. Branch protection for `main`

Every push to `main` deploys to production, so `main` should only change through pull requests that passed CI.

**`main` is already protected** by a ruleset named *Protect default branch* (id `22466113`). As of September 2026 it:

| Rule | Current | Recommended |
| --- | --- | --- |
| Require a pull request | On | Keep |
| Required approvals | **1** | **0** while there is one maintainer (see below) |
| Require conversation resolution | On | Keep |
| Allowed merge methods | Squash, rebase | Keep |
| Require linear history | On | Keep |
| Block force pushes | On | Keep |
| Block deletion | On | Keep |
| Require status checks | **Not set** | **Add `build`** from `ci.yml`, once PR #23 is merged |

**Required approvals.** GitHub does not let you approve your own pull request. With 1 required approval and one maintainer, every pull request, including your own and Dependabot's, needs either a second person or an admin bypass. Either set approvals to 0 until a second maintainer joins, or check that *Repository admin* is in the ruleset's bypass list, so the merge button offers *Merge without waiting for requirements*.

**Required status check.** Merge PR #23 (`ci/pr-merge-gate`) first. It adds `.github/workflows/ci.yml`, whose `build` job runs lint, tests and the full prerender build. A required check that no workflow reports would block every pull request. One change to make in PR #23 before merging: its lint step has `continue-on-error: true`, with a comment saying to drop it once ESLint reports clean. ESLint reports clean on `main` today, so drop that line and make lint a real gate. The README's CI badge also depends on this workflow.

Leave *Require branches to be up to date* off. With Dependabot opening grouped pull requests weekly, it forces a rebase and a rerun of the multi minute build after every merge, and the build is deterministic.

Nothing is broken by these rules: no workflow in `.github/workflows/` commits or pushes to `main`. The nightly rebuild calls a Vercel deploy hook, which does not touch the branch.

**Apply the changes by editing the existing ruleset**, not by creating a second one. Rules from every active ruleset apply together and the strictest wins, so a new ruleset with 0 approvals would not lift the existing 1.

The simplest way is the browser: *Settings → Rules → Rulesets → Protect default branch*. Or, with the CLI, fetch it, edit, and write it back:

```bash
gh api repos/link2dawood/Viikkonro/rulesets/22466113 > ruleset.json
# In ruleset.json:
#  - set "required_approving_review_count" to 0
#  - add to "rules":
#      { "type": "required_status_checks",
#        "parameters": { "strict_required_status_checks_policy": false,
#                        "required_status_checks": [ { "context": "build" } ] } }
gh api -X PUT repos/link2dawood/Viikkonro/rulesets/22466113 --input ruleset.json
```

## 6. Looking active and maintained

The first thing a potential contributor checks is whether anyone is home. Today the repo shows 14 open pull requests, 12 of them from Dependabot, the oldest open since early August. That reads as unmaintained even though the site itself ships regularly.

1. **Merge PR #23** (the CI gate), with the lint change from section 5.
2. **Let the new Dependabot config take over.** `.github/dependabot.yml` now groups all minor and patch npm updates into one weekly PR, and all GitHub Actions updates into another. On its next run, Dependabot opens the grouped PRs and closes the individual ones they replace. Two majors need a real look: `actions/checkout` and `actions/setup-node` from 4 to 7 (PRs #3 and #4), which will land together in the Actions group.
3. **Decide on PR #1** (`dev`, "HANDROFF file added credientials remaining"). It is 6,000+ lines against a much older `main` and has been open since the start. Merge what is still wanted in smaller PRs, then close it. It does not contain real credentials: it only references `${{ secrets.* }}` placeholders.
4. **Label a few good first issues.** See the next section.
5. **Pin the repo** on your GitHub profile so it is the first thing visitors see.

## 7. Starter issues

Each of these is a real defect on `main` as of September 2026, verified before being listed here, and small enough for a first contribution. Open them with the `good first issue` label, plus the label noted.

### Rename the npm package from "newproject" to "viikkonro"
Label: `good first issue`

`package.json` still has the Vite template's placeholder name `"name": "newproject"`. Change it to `"viikkonro"`.

**Done when:** `node -p 'require("./package.json").name'` prints `viikkonro`, and `npm ci`, `npm test` and `npm run lint` still pass. `package-lock.json` also records the name, so regenerate it with `npm install --package-lock-only` and commit both files.

### Make schoolHolidays.js and sunTimes.js importable from plain Node
Labels: `good first issue`, `bug`

Two modules import `"../components/dateUtils"` without a `.js` extension: `src/data/schoolHolidays.js` (line 22) and `src/data/sunTimes.js` (line 29). Vite resolves this, but plain Node does not, so any build script that imports either module fails with `ERR_MODULE_NOT_FOUND`. The other thirteen modules in `src/data/` that import `dateUtils` already use the explicit extension.

**Done when:** both imports end in `dateUtils.js`, and this prints `ok` twice:
```bash
node -e "import('./src/data/schoolHolidays.js').then(() => console.log('ok'))"
node -e "import('./src/data/sunTimes.js').then(() => console.log('ok'))"
```

### Fix the outdated import note in CLAUDE.md
Labels: `good first issue`, `documentation`

`CLAUDE.md`, in the paragraph about `dateUtils.js`, says `src/data/holidays.js` imports `dateUtils` without the extension, so its logic has to be duplicated in `prerender.js`. That is no longer true: `holidays.js` line 37 uses `"../components/dateUtils.js"`. The note should describe the current state. The files that actually lack the extension are `schoolHolidays.js` and `sunTimes.js`, covered by the issue above; if that one is merged first, no module has the problem any more.

**Done when:** the paragraph matches the code, checked with `grep -n 'components/dateUtils' src/data/*.js`.

### Correct the stale date in a schoolHolidayPages.js comment
Labels: `good first issue`, `documentation`

`src/data/schoolHolidayPages.js` line 31 says `verifiedAt` mirrors `CONTENT_UPDATED (2026-08-05)`, but `CONTENT_UPDATED` in `src/data/seo.js` is `"2026-08-21"`. Remove the hard coded date from the comment so it cannot go stale again.

**Done when:** the comment names the constant without repeating its value.

### Fix a comment in seo.js that names a file that does not exist
Labels: `good first issue`, `documentation`

`src/data/seo.js` line 80 says the function mirrors `src/components/dateUtils.jsx`. The file is `dateUtils.js`. The comment also says the logic is duplicated because plain Node "can't load a .jsx module", which no longer applies since `seo.js` imports other functions from `dateUtils.js` directly at the top of the file. Update the comment to be accurate, or investigate whether the duplicated functions can simply be imported.

**Done when:** the comment is accurate. Importing instead of duplicating is a bonus, and must keep `npm test` and `npm run build` passing.

### Derive CONTENT_UPDATED_FI from CONTENT_UPDATED
Label: `good first issue`

In `src/data/seo.js`, the same date is typed twice:
```js
export const CONTENT_UPDATED = "2026-08-21";
export const CONTENT_UPDATED_FI = fmtFullFi(new Date(2026, 7, 21));
```
The month is zero based in one and one based in the other, so they can drift apart when someone updates only one. Derive the Finnish form from the ISO string. Parse it in **local time**: `new Date("2026-08-21")` parses as UTC and shows the previous day in timezones west of Greenwich.

**Done when:** `CONTENT_UPDATED_FI` is computed from `CONTENT_UPDATED`, and a new test asserts it equals `"21. elokuuta 2026"`, passing with both `TZ=UTC npm test` and `TZ=America/Los_Angeles npm test`.

### Move the Terms page date into a constant
Label: `good first issue`

`src/pages/TermsAndConditions.jsx` line 15 hard codes `Päivitetty viimeksi: 23. kesäkuuta 2026`, unlike other pages, which read their date from `src/data/seo.js`. Add a `TERMS_UPDATED` constant there (the ISO string, plus a Finnish form derived from it as in the issue above) and use it. Keep it separate from `CONTENT_UPDATED`: a legal document's revision date must not change when unrelated articles are edited.

**Done when:** the rendered text is unchanged (`23. kesäkuuta 2026`) but comes from the constant.

## 8. Funding (optional)

GitHub shows a **Sponsor** button when the repo contains `.github/FUNDING.yml`. It was deliberately not added, because it needs a real account. If you want one, create the file with whichever platforms you use:

```yaml
github: [your-github-username]   # needs an active GitHub Sponsors profile
ko_fi: your-ko-fi-name
buy_me_a_coffee: your-name
```

A Sponsor button that leads to an inactive profile looks worse than none at all.

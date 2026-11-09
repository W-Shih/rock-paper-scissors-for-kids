# PR link validation

Applies to PR descriptions and PR review / delivery comments being authored or
edited. Repository Markdown files retain their normal file-relative links.
This procedure does not authorize posting comments or editing unrelated PRs.

## 1. Build links for the destination

- Inventory every actual link and image target: inline Markdown, reference-style
  definitions, HTML `href` / `src`, and bare URLs. Exclude literal examples in code
  fences and inline code. Validate each unique target, including existing links
  retained in a rewritten body.
- For repository files, use absolute HTTPS URLs on the verified GitHub host:
  `https://<host>/<owner>/<repo>/blob/<full-commit-sha>/<path>#<fragment>`.
  Use the pushed PR head for evidence about the proposed change; use the base or
  an earlier commit only when intentionally citing that version. Resolve fork
  head files in the repository that actually contains the commit.
- Keep `docs/file.md`, `../file.md`, `/docs/file.md` and file-section-only
  `#heading` links out of PR prose. Link to the full file URL and section instead.
  A fragment pointing within the PR body itself is allowed after checking its
  rendered target. Local disk paths and app-only schemes such as `file:`,
  `codex:` and `thread:` are not GitHub evidence links; publish an accessible
  artifact when authorized, or describe the limitation in plain text.
- Preserve exact path case and URL-encode path segments and fragments where
  needed, including spaces and non-ASCII text. Prefer fixed commits for evidence
  so branch deletion or later commits do not change its meaning.

## 2. Verify every target before publication

For repository file links, verify the exact remote repository, commit and path
via authenticated GitHub API / connector or the rendered file page. Local file
existence alone is insufficient. With `gh`, a read-only check can use:

```text
gh pr view <number> --repo <owner/repo> --json body,headRefOid,url
gh api "repos/<owner/repo>/contents/<encoded-path>?ref=<full-commit-sha>"
```

Check fragments separately: HTTP success for the file does not prove its section
exists. Compare heading fragments with the rendered GitHub heading permalink,
including punctuation, Unicode and duplicate-heading suffixes. If rendering is
unavailable, use a verified source-line permalink with `?plain=1#L<number>` for
Markdown, checking the exact source lines at that commit; do not guess a slug.
For line ranges, check both bounds and that the cited lines support the claim.

For Actions runs, artifacts, PRs, comments and external pages, open the exact
target or retrieve the corresponding object through its service API. Check its
identity and relevance, rather than accepting a login page, redirect to a home
page or HTTP 200 alone. Note access restrictions or artifact expiry; use durable
evidence where needed. Distinguish denied access / unavailable verification from
a confirmed missing target, and report either accurately.

Repair invalid links and rerun the affected checks. A necessary target that
cannot be verified remains an explicit blocker to link validation; finish
unaffected checks without claiming all links passed. Omit an optional link only
when its removal preserves the evidence and explain any material loss.

## 3. Read back the published content

Use a structured write argument or a UTF-8 body file (`gh ... --body-file`) to
preserve Markdown, newlines and URL encoding. After creation or every edit, fetch
the saved body / comment through the API or connector and inventory its actual
targets again. Verify they match the validated draft and check any changed
targets. If the publication changed them, repair and read back again.

Record the checked commit, targets, checks and unresolved limits in the task's
delivery evidence. Complete only when every retained target passes and the
remote read-back matches. For a local-only draft, report only local validation.

## Regression cases when changing this procedure

- A PR body copied from README with `docs/development.md#...` must be rewritten
  to a verified absolute permalink; the original PR #14 failure is this case.
- A file added only on the head branch must resolve at the pushed head, even
  when absent from `main`; deleting the work branch must not invalidate evidence.
- An existing file with a missing heading must fail even when the file returns
  HTTP 200. Duplicate headings, punctuation, Unicode, spaces in paths and source
  line bounds need exact target checks.
- Reference links, images and HTML targets receive the same checks as inline
  links; URL-looking text inside code examples is not a published link.
- A successful write followed by a stale or different saved body must trigger
  repair and another read-back, rather than a completion claim.

GitHub references: [file permalinks](https://docs.github.com/en/repositories/working-with-files/using-files/getting-permanent-links-to-files),
[Markdown source-line links](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-a-permanent-link-to-a-code-snippet),
and [relative file links and section anchors](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax).

# GitHub access and branch policy

Repository: [avin243/rideshare_pro](https://github.com/avin243/rideshare_pro)

## Team access

Use individual GitHub accounts and SSH keys. Never share a private key, account,
or personal access token.

| GitHub account | Repository role | Access to `main` |
| --- | --- | --- |
| `avin243` | Maintainer / repository administrator | May push directly; should use a pull request when practical |
| `xxx843` | Collaborator with Write access | Must use a pull request; no direct pushes |

The maintainer should invite `xxx843` from **Settings → Collaborators** and
grant the **Write** role. The collaborator must accept the invitation.

## Configure SSH for each team member

Each member runs these steps on their own computer, using their own GitHub
account. Keep any existing SSH key; do not send a private key to another team
member.

1. Generate a key (enter a passphrase when prompted):

   ```powershell
   ssh-keygen -t ed25519 -C "GitHub: YOUR_GITHUB_USERNAME"
   ```

   If `id_ed25519` already exists, do not overwrite it. Choose a different
   filename when prompted and use that filename in the next step.

2. Copy the public key and add it to **GitHub → Settings → SSH and GPG keys →
   New SSH key**:

   ```powershell
   Get-Content "$env:USERPROFILE\.ssh\id_ed25519.pub" | Set-Clipboard
   ```

   Only upload the `.pub` file. Never upload or share the private key (the
   matching filename without `.pub`).

3. Test the account authentication:

   ```powershell
   ssh -T git@github.com
   ```

4. Configure this repository to use SSH and push your working branch:

   ```powershell
   git remote set-url origin git@github.com:avin243/rideshare_pro.git
   git remote -v
   git push -u origin YOUR_BRANCH
   ```

   Each contributor should work on a feature branch, not directly on `main`.

## Protect `main`

In the repository, open **Settings → Rules → Rulesets**, create a branch
ruleset, and configure:

- Enforcement status: **Active**
- Target branch: `main`
- Require a pull request before merging, with at least **1 approval**
- Require conversation resolution before merging
- Block force pushes and branch deletion
- Add `avin243` to the ruleset bypass list with **Always** access, so the
  maintainer can push directly when needed
- Do not add `xxx843` to the bypass list

With this policy, `xxx843` submits changes through a pull request and cannot
push directly to `main`. The maintainer can make a direct push by design, but
should prefer reviewed pull requests for routine work. Do not grant the
collaborator the Admin role or ruleset bypass access.

After saving the ruleset, verify it is active for `main` and test that the
collaborator cannot push directly to it. GitHub plan and repository visibility
can affect which ruleset options are available.

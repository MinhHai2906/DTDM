Deployment instructions

1) Deploy to Vercel (recommended for static `frontend/User/`):

- Connect your Git repo to Vercel (https://vercel.com/new)
- Vercel will auto-detect `vercel.json` and serve `frontend/User/` as static files.
- Or use Vercel CLI:

```bash
npm i -g vercel
vercel login
vercel --prod
```

2) Deploy to Firebase Hosting:

```bash
npm i -g firebase-tools
npx -y firebase-tools@latest login
firebase init hosting
# when asked for public directory, enter "frontend/User"
firebase deploy --only hosting
```

3) Post-deployment checks:
-- Verify site serves pages from `/frontend/User`.
- Test CRUD endpoints against your backend URL.

4) Removing duplicates (safe flow):
- Verify site on Vercel works from `public/`.
- If OK, remove original copies from repo and commit:

```bash
git rm -r frontend/project
git commit -m "Remove duplicated frontend/project (kept public/)"
git push
```

Note: I created a backup copy `frontend/project_backup_TIMESTAMP` in case you need the original files.
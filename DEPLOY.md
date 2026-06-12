# JAG QUEST — Firebase deploy

One-time setup (if not done):
    npm install -g firebase-tools
    firebase login

Deploy (from this folder):
    firebase deploy --only hosting --project jag-q

If "jag-q" isn't the exact project ID, check with:
    firebase projects:list

Notes:
- Progress (checkmarks, categories, venues, replied status) saves in the
  browser's localStorage — per device, per browser.
- To rebuild after editing src/app.jsx:
    npx esbuild src/main.jsx --bundle --minify --jsx=automatic --define:process.env.NODE_ENV='"production"' --outfile=public/app.js

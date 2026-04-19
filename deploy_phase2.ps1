cd "c:\Users\alfre\Desktop\Whatsapp Saas\wacommerce\phase-2-app"
Copy-Item "..\..\.gitignore" ".gitignore" -ErrorAction SilentlyContinue

git init
git add .
git commit -m "Affiliate Dashboard Integration with Clerk"
git remote add phase_2 https://github.com/criminal-killer/Phase-2-app.git
git push phase_2 master:main -f
Remove-Item -Recurse -Force .git

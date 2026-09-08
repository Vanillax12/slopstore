# slop store

a tiny static APK store powered by GitHub Pages.


# to use it fork and remove all apps from the apps folder
## structure

put your apps inside `apps/`:

```text
apps/
├── calculator.apk
├── calculator.png
├── calculator.txt
├── mega-slop.apk
├── mega-slop.png
└── mega-slop.txt
```

the website automatically detects every `.apk`.

if an APK has a PNG with the exact same base filename, that PNG becomes its icon.

example:

`calculator.apk` + `calculator.png` -> **Calculator**

an icon is optional; the app still appears if the PNG is missing.

if an APK has a matching `.txt`, its contents become the app description. descriptions can be one line, multiple paragraphs, or as long as you want. for example:

`calculator.apk` + `calculator.png` + `calculator.txt` -> an app card with the icon and the full text from `calculator.txt`.

if the `.txt` is missing, the store simply shows `no description provided.`

## github pages

1. create a public GitHub repository.
2. copy these files into it.
3. put your APKs and PNG icons in `apps/`.
4. go to **Settings -> Pages**.
5. select **Deploy from a branch**.
6. select your main branch and `/ (root)`.
7. open the GitHub Pages URL.

the site uses the GitHub Contents API, so adding/removing an APK from `apps/` automatically changes the store.

## important

the repository must be public because the website needs to read its file list through the unauthenticated GitHub API.

GitHub's API has rate limits. For a small personal store, this is usually plenty.

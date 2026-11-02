# Contributing

Thanks for helping. This is a small project, so a short, focused change is the easiest to review.

## Before you start

- For a bug, open an issue with what you did, what you expected and what happened, plus the version shown in `chrome://extensions` and the language of your Meet page.
- For a larger change or a new feature, open an issue first so we can agree on the approach.
- For a security problem, follow [SECURITY.md](SECURITY.md) instead.

## Development

There's no build step. Load the `extension` folder with **Load unpacked** in `chrome://extensions`, and press its reload button after a change.

```sh
scripts/package.sh   # packs extension/ into dist/
```

The project's test suite is maintained separately and is not part of this repository. In your pull request, describe how you checked the change: what you ran, on which browser, and what you saw.

## Guidelines

- Match the style of the code around your change.
- To support another Meet language, add its button text to the lists at the top of `extension/content.js`.
- Text shown to people goes in `extension/_locales`, in English and Traditional Chinese.
- Code comments are in English and say why, not what.
